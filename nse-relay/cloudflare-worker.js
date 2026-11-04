/**
 * NSE announcements relay — Cloudflare Worker (free plan). Every minute (Cron Trigger "* * * * *") it reads NSE's
 * three public RSS feeds and sends them to the tracker.
 *
 * Setup: dash.cloudflare.com › Workers & Pages › Create › Worker › paste this file › Deploy; then Settings ›
 *   Variables: RELAY_KEY (secret: the tracker's admin password) and RELAY_URL (https://bse-it-tracker.onrender.com/api/nse-relay);
 *   Triggers › Cron: * * * * *.  Open <worker url>/test to see what NSE answers this worker.
 */
const FEEDS = ['Online_announcements', 'Financial_Results', 'Board_Meetings'];
const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  Accept: 'application/rss+xml, application/xml, text/xml, */*', 'Accept-Language': 'en-US,en;q=0.9', Referer: 'https://www.nseindia.com/',
};
let lastSig = '', lastAt = 0;

async function pull() {
  return Promise.all(FEEDS.map(async feed => {
    try {
      const r = await fetch(`https://nsearchives.nseindia.com/content/RSS/${feed}.xml`, { headers: HEADERS });
      return { feed, status: r.status, xml: r.ok ? await r.text() : '' };
    } catch (e) { return { feed, status: 0, xml: '', error: String(e).slice(0, 80) }; }
  }));
}

async function run(env, force = false) {
  const raw = await pull();
  const sig = raw.map(r => `${r.status}:${r.xml.length}:${r.xml.slice(0, 600)}`).join('|');
  if (!force && sig === lastSig && Date.now() - lastAt < 10 * 60000) return { skipped: true };
  const res = await fetch(env.RELAY_URL || 'https://bse-it-tracker.onrender.com/api/nse-relay', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-relay-key': env.RELAY_KEY || '' },
    body: JSON.stringify({ schema: 2, updatedAt: new Date().toISOString(), runner: 'cloudflare-worker', raw }),
  });
  lastSig = sig; lastAt = Date.now();
  return { feeds: raw.map(r => `${r.feed} ${r.status}`), tracker: res.status, answer: (await res.text()).slice(0, 200) };
}

export default {
  async scheduled(_event, env, ctx) { ctx.waitUntil(run(env)); },
  async fetch(req, env) {
    const u = new URL(req.url);
    if (u.pathname === '/test') return Response.json((await pull()).map(r => ({ feed: r.feed, status: r.status, bytes: r.xml.length, error: r.error })));
    if (u.pathname === '/run' && env.RELAY_KEY && u.searchParams.get('key') === env.RELAY_KEY) return Response.json(await run(env, true));
    return new Response('NSE relay — /test shows what NSE answers this worker');
  },
};
