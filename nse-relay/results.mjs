#!/usr/bin/env node
/**
 * NSE financial results relay — for each symbol, NSE's lists of quarterly results filings (the results list and the
 * "Integrated Filing - Financials" list) and the XBRL of every quarterly filing since October 2020, kept as published
 * so the tracker reads them exactly as it would from NSE (NSE refuses the tracker's host). Node 18+, no dependencies.
 *
 *   node results.mjs --store <dir> [--symbols A,B] [--minutes 45] [--max-symbols 8] [--skip-fresh 120]
 *
 * <dir> holds one gzipped JSON file per symbol (<SYMBOL>.json.gz) and index.json. Each run reads the lists again for
 * every symbol (least recently read first, within the time budget) and fetches only XBRL files it does not hold yet.
 * The XBRL is kept without its dimensional contexts (segments, components of equity): the plain contexts, units and
 * the facts reported in them — what the tracker reads (revenue, expenses, profit, the balance sheet, cash flow).
 *
 * Polite by design: one request at a time, a pause between requests, a fresh session when NSE asks for one, and the run
 * stops at the first sign NSE is refusing (it resumes with the next run).
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const args = process.argv.slice(2);
const arg = (k, d = '') => { const i = args.indexOf(`--${k}`); return i >= 0 ? (args[i + 1] ?? '') : d; };
const STORE = arg('store', 'results');
const MINUTES = Number(arg('minutes', '45')) || 45;
/** at most this many symbols in one call (the workflow publishes between calls) */
const MAX_SYMBOLS = Number(arg('max-symbols', '0')) || Infinity;
/** symbols read less than this many minutes ago are left for later */
const SKIP_FRESH = Number(arg('skip-fresh', '0')) || 0;
const DIR = path.dirname(new URL(import.meta.url).pathname);
const listFile = path.join(DIR, 'results-symbols.txt');
const base = fs.existsSync(listFile) ? fs.readFileSync(listFile, 'utf8').split(/\s+/).map(s => s.trim()).filter(Boolean) : [];
const extra = arg('symbols', process.env.RESULTS_SYMBOLS || '').split(/[\s,]+/).map(s => s.trim().toUpperCase()).filter(Boolean);
const SINCE = '2020-10-01';

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const HOME = 'https://www.nseindia.com/companies-listing/corporate-filings-financial-results';
const RESULTS = 'https://www.nseindia.com/api/corporates-financial-results';
const INTEGRATED = 'https://www.nseindia.com/api/integrated-filing-results';
const sleep = ms => new Promise(r => setTimeout(r, ms));
const t0 = Date.now();
const timeLeft = () => MINUTES * 60_000 - (Date.now() - t0);

async function get(url, headers = {}, ms = 30000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    return await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*', 'Accept-Language': 'en-US,en;q=0.9', ...headers }, signal: ctl.signal, redirect: 'follow' });
  } finally { clearTimeout(t); }
}

let cookie = '';
async function session() {
  const home = await get(HOME, { Accept: 'text/html,application/xhtml+xml' });
  const raw = typeof home.headers.getSetCookie === 'function' ? home.headers.getSetCookie() : (home.headers.get('set-cookie') || '').split(/,(?=\s*[^;,\s]+=)/);
  cookie = raw.map(c => c.split(';')[0].trim()).filter(Boolean).join('; ');
  await home.arrayBuffer().catch(() => undefined);
}

class Refused extends Error {}
/**
 * One NSE API list (JSON text). NSE slows down a client it thinks is too busy by not answering: a refusal, a
 * challenge page or no answer gets one more try after a minute with a fresh session; then the run stops (the next run
 * carries on where this one left off).
 */
async function api(url) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (!cookie || attempt) { if (attempt) await sleep(60_000); await session(); await sleep(2000); }
      const res = await get(url, { Referer: HOME, Accept: 'application/json, text/plain, */*', Cookie: cookie });
      const txt = await res.text();
      if (res.status === 401 || res.status === 403 || res.status === 429) continue;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!/^\s*[[{]/.test(txt)) continue; // an HTML challenge page instead of JSON
      return txt;
    } catch (e) {
      // no answer (NSE holding the connection): once more after a minute, then the run stops
      if (!/abort|timeout|fetch failed|ECONNRESET|socket/i.test(String(e?.message || e))) throw e;
    }
  }
  throw new Refused(`NSE stopped answering ${url.replace(/^https:\/\/[^/]+/, '').slice(0, 80)}`);
}

/** The XBRL without dimensional contexts: plain contexts, units, and the facts in those contexts. */
export function strip(xml) {
  const keep = new Set();
  const ctxs = [];
  for (const m of xml.matchAll(/<((?:[\w-]+:)?context)\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (/<(?:[\w-]+:)?(segment|scenario)\b/.test(m[3])) continue;
    keep.add(m[2]);
    ctxs.push(m[0].replace(/\s*\n\s*/g, ''));
  }
  const units = [...xml.matchAll(/<((?:[\w-]+:)?unit)\b[^>]*>[\s\S]*?<\/\1>/g)].map(m => m[0].replace(/\s*\n\s*/g, ''));
  const facts = [];
  for (const m of xml.matchAll(/<([\w-]+:[\w.-]+)\b([^>]*\bcontextRef="([^"]+)"[^>]*)>([^<]*)<\/\1>/g)) if (keep.has(m[3])) facts.push(m[0]);
  return `<xbrl stripped="1">\n${ctxs.join('\n')}\n${units.join('\n')}\n${facts.join('\n')}\n</xbrl>\n`;
}

const MON = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' };
const nseDate = s => { const m = String(s || '').match(/(\d{1,2})-([A-Za-z]{3})-(\d{4})/); return m ? `${m[3]}-${MON[m[2].toLowerCase()]}-${m[1].padStart(2, '0')}` : null; };
const rowsOf = txt => { try { const j = JSON.parse(txt); return Array.isArray(j) ? j : Array.isArray(j?.data) ? j.data : []; } catch { return []; } };

/** The latest quarter end with a results filing in the lists (YYYY-MM-DD), or ''. */
function latestQuarter(lists) {
  let best = '';
  for (const txt of [lists.plain, lists.range]) for (const r of rowsOf(txt || '')) {
    const from = nseDate(r.fromDate), to = nseDate(r.toDate);
    if (from && to && (Date.parse(to) - Date.parse(from)) / 86_400_000 >= 80 && to > best) best = to;
  }
  for (const r of rowsOf(lists.integrated || '')) {
    const to = nseDate(String(r.qe_Date || r.qeDate || r.toDate || ''));
    if (to && (!r.type || /financ/i.test(String(r.type))) && to > best) best = to;
  }
  return best;
}

/** XBRL links of the quarterly filings since October 2020 in the two lists (as the tracker selects them). */
function xbrlLinks(lists) {
  const out = new Set();
  for (const txt of [lists.plain, lists.range]) for (const r of rowsOf(txt || '')) {
    const from = nseDate(r.fromDate), to = nseDate(r.toDate);
    if (!from || !to || to < SINCE) continue;
    const span = (Date.parse(to) - Date.parse(from)) / 86_400_000;
    if (span < 80 || span > 100) continue;
    const x = String(r.xbrl || r.xbrlFile || '');
    if (/^https?:\/\/.+\.xml$/i.test(x)) out.add(x);
  }
  for (const r of rowsOf(lists.integrated || '')) {
    const to = nseDate(String(r.qe_Date || r.qeDate || r.toDate || ''));
    if (!to || to < SINCE || (r.type && !/financ/i.test(String(r.type)))) continue;
    let x = String(r.xbrl || '');
    if (!x || /\/null$/i.test(x) || x === '-') continue;
    if (!/^https?:/i.test(x)) x = `https://nsearchives.nseindia.com${x.startsWith('/') ? '' : '/'}${x}`;
    if (/\.xml$/i.test(x)) out.add(x);
  }
  return [...out];
}

const readGz = f => { try { return JSON.parse(zlib.gunzipSync(fs.readFileSync(f)).toString('utf8')); } catch { return null; } };

async function main() {
  fs.mkdirSync(STORE, { recursive: true });
  const indexFile = path.join(STORE, 'index.json');
  const index = (() => { try { return JSON.parse(fs.readFileSync(indexFile, 'utf8')); } catch { return { schema: 1, symbols: {} }; } })();
  index.symbols ||= {};
  // the symbols asked for now first, then those never read, then the least recently read
  const all = [...new Set([...extra, ...base])];
  const order = [...extra, ...all.filter(s => !extra.includes(s)).sort((a, b) => String(index.symbols[a]?.at || '').localeCompare(String(index.symbols[b]?.at || '')))];
  const run = { at: new Date().toISOString(), symbols: 0, lists: 0, xbrl: 0, failed: 0, stopped: '' };
  const d = new Date();
  const dmy = `${String(d.getUTCDate()).padStart(2, '0')}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${d.getUTCFullYear()}`;
  for (const sym of [...new Set(order)]) {
    if (timeLeft() < 90_000) { run.stopped = 'time budget'; break; }
    if (run.symbols >= MAX_SYMBOLS) break;
    const was = index.symbols[sym]?.at;
    // (a symbol asked for now is read again unless it was read in the last ten minutes)
    const fresh = extra.includes(sym) ? Math.min(SKIP_FRESH, 10) : SKIP_FRESH;
    if (fresh && was && Date.now() - Date.parse(was) < fresh * 60_000) continue;
    const file = path.join(STORE, `${sym}.json.gz`);
    const prev = readGz(file) || { symbol: sym, xbrl: {} };
    const lists = {};
    try {
      lists.plain = await api(`${RESULTS}?index=equities&symbol=${encodeURIComponent(sym)}&period=Quarterly`); await sleep(2500);
      lists.range = await api(`${RESULTS}?index=equities&symbol=${encodeURIComponent(sym)}&period=Quarterly&from_date=01-07-2020&to_date=${dmy}`); await sleep(2500);
      lists.integrated = await api(`${INTEGRATED}?index=equities&symbol=${encodeURIComponent(sym)}&type=${encodeURIComponent('Integrated Filing- Financials')}`); await sleep(2500);
      run.lists += 3;
    } catch (e) {
      if (e instanceof Refused) { run.stopped = e.message; break; }
      run.failed++; console.log(`${sym}: lists failed — ${e.message}`);
      if (run.failed >= 5 && !run.symbols) { run.stopped = 'NSE not answering'; break; }
      continue;
    }
    const links = xbrlLinks(lists);
    const xbrl = {};
    let fetched = 0, failed = 0;
    for (const url of links) {
      if (prev.xbrl?.[url]) { xbrl[url] = prev.xbrl[url]; continue; }
      if (timeLeft() < 60_000) break;
      try {
        const res = await get(url, { Referer: 'https://www.nseindia.com/', Accept: 'application/xml,text/xml,*/*' });
        if (res.status === 403) { run.stopped = `NSE archives refused ${url.slice(-60)}`; break; }
        if (!res.ok) { failed++; await res.arrayBuffer().catch(() => undefined); continue; }
        xbrl[url] = strip(await res.text());
        fetched++; run.xbrl++;
      } catch { failed++; }
      await sleep(1200);
    }
    const doc = { symbol: sym, at: new Date().toISOString(), lists, xbrl };
    fs.writeFileSync(file, zlib.gzipSync(Buffer.from(JSON.stringify(doc)), { level: 9 }));
    index.symbols[sym] = { at: doc.at, filings: Object.keys(xbrl).length, links: links.length, latest: latestQuarter(lists) };
    run.symbols++;
    // (the index after each symbol: a run stopped part-way keeps what it read)
    index.updatedAt = new Date().toISOString();
    index.lastRun = { ...run, partial: true };
    fs.writeFileSync(indexFile, JSON.stringify(index, null, 1));
    console.log(`${sym}: ${links.length} quarterly XBRL filings listed, ${fetched} fetched now, ${Object.keys(xbrl).length} held${failed ? `, ${failed} failed` : ''}`);
    if (run.stopped) break;
  }
  index.updatedAt = new Date().toISOString();
  index.lastRun = run;
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 1));
  console.log(`run: ${JSON.stringify(run)}`);
}
main().catch(e => { console.error(e); process.exit(1); });
