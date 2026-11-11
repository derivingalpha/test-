/**
 * NSE announcements relay — Cloudflare Worker (free plan). A Cron Trigger starts it every minute; each run then reads
 * NSE's three public RSS feeds every 5 seconds until the next run takes over, with conditional requests (an unchanged
 * feed costs a 304 and no data), and sends a feed to the tracker the moment it changes — so a filing reaches the
 * tracker about 5 seconds after NSE publishes it, with no computer of yours involved.
 *
 * Setup (once, about five minutes): dash.cloudflare.com › Workers & Pages › Create › Worker › paste this file › Deploy;
 *   then Settings › Variables: RELAY_KEY (secret: the tracker's admin password, or RELAY_KEY if one is set on Render)
 *   and RELAY_URL (https://bse-it-tracker.onrender.com/api/nse-relay); Settings › Triggers › Cron: * * * * *
 *   Open <worker url>/test FIRST: it shows what NSE answers this worker. Three 200s = it works. If NSE refuses
 *   Cloudflare (403), nothing is lost: the tracker keeps using its 5-minute GitHub relay.
 * Optional variable EVERY (seconds between rounds, default and minimum 5).
 *
 * Kept light on NSE: one conditional request per feed per round, and a 15-minute pause whenever NSE refuses.
 */
const FEEDS = ['Online_announcements', 'Financial_Results', 'Board_Meetings'];
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml, text/xml, */*', 'Accept-Language': 'en-US,en;q=0.9', Referer: 'https://www.nseindia.com/',
};
// kept while this worker instance lives (a new instance simply reads the feeds in full once)
const mem = { v: {}, lastPost: 0, pausedUntil: 0 };
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** One round: each feed, conditionally. `full` ignores the validators (the /test and /run pages). */
async function pull(full = false) {
  return Promise.all(FEEDS.map(async feed => {
    const v = full ? {} : mem.v[feed] || {};
    try {
      const r = await fetch(`https://nsearchives.nseindia.com/content/RSS/${feed}.xml`, {
        headers: { ...HEADERS, ...(v.etag ? { 'If-None-Match': v.etag } : {}), ...(v.lm ? { 'If-Modified-Since': v.lm } : {}) },
      });
      if (r.status === 304) return { feed, status: 304 };
      if (!r.ok) return { feed, status: r.status, xml: '' };
      const xml = await r.text();
      mem.v[feed] = { etag: r.headers.get('etag') || '', lm: r.headers.get('last-modified') || '' };
      return { feed, status: 200, xml };
    } catch (e) { return { feed, status: 0, xml: '', error: String(e).slice(0, 80) }; }
  }));
}

async function round(env, force = false) {
  const now = Date.now();
  if (!force && now < mem.pausedUntil) return { paused: true };
  const raw = await pull(force);
  const changed = raw.some(r => r.xml);
  const refused = raw.every(r => r.status !== 200 && r.status !== 304);
  // NSE refuses this worker: say so once (the tracker's GitHub relay carries on) and leave NSE alone for 15 minutes
  if (refused) mem.pausedUntil = now + 15 * 60000;
  // nothing new: a short "still here" every two minutes keeps the tracker from starting GitHub runs it does not need
  if (!force && !changed && !refused && now - mem.lastPost < 120000) return { unchanged: true };
  const res = await fetch(env.RELAY_URL || 'https://bse-it-tracker.onrender.com/api/nse-relay', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-relay-key': env.RELAY_KEY || '' },
    body: JSON.stringify({ schema: 2, updatedAt: new Date().toISOString(), runner: 'cloudflare-worker', raw }),
  });
  mem.lastPost = Date.now();
  return { feeds: raw.map(r => `${r.feed} ${r.status}`), tracker: res.status, answer: (await res.text()).slice(0, 200) };
}

export default {
  // every minute: rounds at 0, 5, 10 … 55 seconds (12 rounds: within the free plan's 50 outgoing requests per run)
  async scheduled(_event, env, ctx) {
    ctx.waitUntil((async () => {
      const every = Math.max(5, Number(env.EVERY) || 5) * 1000, t0 = Date.now();
      for (let i = 0; i * every < 58000; i++) {
        const wait = t0 + i * every - Date.now();
        if (wait > 0) await sleep(wait);
        try { await round(env); } catch { /* next round */ }
      }
    })());
  },
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/test') return Response.json((await pull(true)).map(r => ({ feed: r.feed, status: r.status, bytes: (r.xml || '').length, error: r.error })));
    if (u.pathname === '/run' && env.RELAY_KEY && u.searchParams.get('key') === env.RELAY_KEY) return Response.json(await round(env, true));
    return new Response('NSE relay — /test shows what NSE answers this worker');
  },
};
