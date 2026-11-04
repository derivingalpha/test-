#!/usr/bin/env node
/**
 * NSE announcements relay — reads NSE's public RSS feeds (and, at most hourly, the per-symbol announcements list for
 * the symbols in symbols.txt) and writes one JSON snapshot. Node 18+, no dependencies.
 *
 *   node relay.mjs --prev prev.json --out latest.json            one round (the scheduled GitHub job)
 *   node relay.mjs --out latest.json --loop 15 --post <url>       every 15 s on an always-on machine, pushing each change
 *                                                                (key in the RELAY_KEY environment variable)
 *
 * Polite by design: one request per feed per round, conditional requests (ETag / Last-Modified) in loop mode, the
 * per-symbol list at most once an hour, and a pause of 15 min after NSE refuses.
 */
import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const arg = (k, d = '') => { const i = args.indexOf(`--${k}`); return i >= 0 ? (args[i + 1] ?? '') : d; };
const has = k => args.includes(`--${k}`);
const OUT = arg('out', 'latest.json');
const PREV = arg('prev', OUT);
const LOOP = Number(arg('loop', '0')) || 0;
const POST = arg('post', process.env.RELAY_POST_URL || '');
const KEY = process.env.RELAY_KEY || '';
const KEEP_H = Number(arg('keep-hours', '72'));
const CATCHUP_MIN = Number(arg('catchup-every', '60'));
const CATCHUP_DAYS = Number(arg('catchup-days', '7'));
const DIR = path.dirname(new URL(import.meta.url).pathname);
const SYMBOLS = fs.existsSync(path.join(DIR, 'symbols.txt'))
  ? fs.readFileSync(path.join(DIR, 'symbols.txt'), 'utf8').split(/\s+/).map(s => s.trim()).filter(Boolean) : [];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const FEEDS = [
  'https://nsearchives.nseindia.com/content/RSS/Online_announcements.xml',
  'https://nsearchives.nseindia.com/content/RSS/Financial_Results.xml',
  'https://nsearchives.nseindia.com/content/RSS/Board_Meetings.xml',
];
const HOME = 'https://www.nseindia.com/companies-listing/corporate-filings-announcements';
const API = 'https://www.nseindia.com/api/corporate-announcements';

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
  .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&amp;/g, '&')
  .trim();
const tag = (x, t) => { const m = x.match(new RegExp(`<${t}(?:\\s[^>]*)?>([\\s\\S]*?)</${t}>`, 'i')); return m ? decode(m[1]) : ''; };
const rssItems = xml => [...xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(m => ({
  title: tag(m[1], 'title'), link: tag(m[1], 'link'), description: tag(m[1], 'description'), pubDate: tag(m[1], 'pubDate'),
}));

async function get(url, headers = {}, ms = 20000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'en-US,en;q=0.9', ...headers }, signal: ctl.signal, redirect: 'follow' });
  } finally { clearTimeout(t); }
}

const readJson = f => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const prev = readJson(PREV) || {};
const state = {
  items: Array.isArray(prev.items) ? prev.items : [],
  catchup: prev.catchup || null,
  validators: {},            // loop mode: ETag / Last-Modified per feed
  pausedUntil: 0,
};
const itemKey = it => `${it.link || ''}|${it.title}|${it.pubDate}`;

async function pollFeeds() {
  const feeds = [];
  const fresh = [];
  for (const url of FEEDS) {
    const name = url.split('/').pop().replace('.xml', '');
    const v = state.validators[url] || {};
    try {
      const res = await get(url, { Referer: 'https://www.nseindia.com/', ...(v.etag ? { 'If-None-Match': v.etag } : {}), ...(v.lm ? { 'If-Modified-Since': v.lm } : {}) });
      if (res.status === 304) { feeds.push({ name, url, ok: true, status: 304, items: v.n ?? 0 }); continue; }
      if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { status: res.status });
      const items = rssItems(await res.text());
      state.validators[url] = { etag: res.headers.get('etag') || '', lm: res.headers.get('last-modified') || '', n: items.length };
      for (const it of items) fresh.push({ feed: name, ...it });
      feeds.push({ name, url, ok: true, status: res.status, items: items.length });
    } catch (e) {
      feeds.push({ name, url, ok: false, status: e.status || 0, items: 0, error: String(e.message || e).slice(0, 120) });
    }
  }
  return { feeds, fresh };
}

/** Per-symbol announcements (the list nseindia.com shows), last CATCHUP_DAYS days — fills what the RSS window missed. */
async function pollCatchup() {
  const home = await get(HOME, { Accept: 'text/html,application/xhtml+xml' });
  const raw = typeof home.headers.getSetCookie === 'function' ? home.headers.getSetCookie() : (home.headers.get('set-cookie') || '').split(/,(?=\s*[^;,\s]+=)/);
  const cookie = raw.map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
  const d = new Date(Date.now() + 330 * 60000);
  const dmy = x => `${String(x.getUTCDate()).padStart(2, '0')}-${String(x.getUTCMonth() + 1).padStart(2, '0')}-${x.getUTCFullYear()}`;
  const from = dmy(new Date(d.getTime() - CATCHUP_DAYS * 86400000)), to = dmy(d);
  const rows = []; let ok = 0, failed = 0, refused = 0, lastError = '';
  for (const sym of SYMBOLS) {
    if (refused >= 3) { failed++; continue; }
    try {
      const res = await get(`${API}?index=equities&symbol=${encodeURIComponent(sym)}&from_date=${from}&to_date=${to}`, { Referer: HOME, Accept: 'application/json, text/plain, */*', Cookie: cookie }, 15000);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const j = await res.json();
      const list = Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : [];
      for (const r of list) rows.push({ symbol: sym, an_dt: r.an_dt || '', sort_date: r.sort_date || '', sm_name: r.sm_name || '', desc: r.desc || '', attchmntText: String(r.attchmntText || '').slice(0, 1200), attchmntFile: r.attchmntFile || '' });
      ok++; refused = 0;
    } catch (e) {
      failed++; lastError = String(e.message || e).slice(0, 120);
      if (/HTTP (401|403|429)|abort/i.test(lastError)) refused++;
    }
    await new Promise(r => setTimeout(r, 400));
  }
  return { at: new Date().toISOString(), from, to, ok, failed, lastError, rows };
}

async function round() {
  const t0 = Date.now();
  if (Date.now() < state.pausedUntil) return null;
  const { feeds, fresh } = await pollFeeds();
  if (feeds.every(f => !f.ok) && feeds.some(f => [401, 403, 429].includes(f.status))) state.pausedUntil = Date.now() + 15 * 60000;
  // keep everything seen in the last KEEP_H hours (the RSS window is only a few hours on busy days)
  const seen = new Map(state.items.map(it => [itemKey(it), it]));
  let added = 0;
  const now = new Date().toISOString();
  for (const it of fresh) { const k = itemKey(it); if (!seen.has(k)) { seen.set(k, { ...it, firstSeen: now }); added++; } }
  const cutoff = Date.now() - KEEP_H * 3600000;
  state.items = [...seen.values()].filter(it => Date.parse(it.firstSeen || now) >= cutoff)
    .sort((a, b) => (b.firstSeen || '').localeCompare(a.firstSeen || '')).slice(0, 6000);
  const due = !has('no-catchup') && SYMBOLS.length && (!state.catchup || Date.now() - Date.parse(state.catchup.at) >= CATCHUP_MIN * 60000);
  if (due && feeds.some(f => f.ok)) { try { state.catchup = await pollCatchup(); } catch (e) { state.catchup = { ...(state.catchup || {}), at: new Date().toISOString(), error: String(e.message || e).slice(0, 120) }; } }
  const snap = { schema: 1, updatedAt: now, tookMs: Date.now() - t0, runner: process.env.GITHUB_ACTIONS ? 'github-actions' : (process.env.RELAY_NAME || 'loop'), feeds, added, items: state.items, catchup: state.catchup };
  fs.writeFileSync(OUT, JSON.stringify(snap));
  return snap;
}

async function push(snap) {
  if (!POST || !snap) return;
  try {
    const res = await fetch(POST, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-relay-key': KEY }, body: JSON.stringify(snap) });
    if (!res.ok) console.error(`push: HTTP ${res.status}`);
  } catch (e) { console.error('push:', e.message || e); }
}

if (LOOP > 0) {
  console.log(`relay: every ${LOOP}s${POST ? ` → ${POST}` : ''}`);
  for (;;) {
    const s = await round().catch(e => { console.error(e); return null; });
    if (s && (s.added || !s.feeds.every(f => f.status === 304))) await push(s);
    if (s) console.log(`${s.updatedAt} +${s.added} ${s.feeds.map(f => `${f.name}:${f.status}`).join(' ')}`);
    await new Promise(r => setTimeout(r, LOOP * 1000));
  }
} else {
  const s = await round();
  await push(s);
  console.log(JSON.stringify({ updatedAt: s.updatedAt, added: s.added, items: s.items.length, feeds: s.feeds, catchup: s.catchup && { at: s.catchup.at, ok: s.catchup.ok, failed: s.catchup.failed, rows: s.catchup.rows?.length, lastError: s.catchup.lastError } }));
}
