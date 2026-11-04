/**
 * NSE announcements relay — Google Apps Script (free, runs under your Google account).
 * Every minute it reads NSE's three public RSS feeds and sends them to the tracker.
 *
 * Setup (2 minutes):
 *   1. https://script.google.com  →  New project  →  paste this file over the sample code.
 *   2. Put the tracker's relay key in RELAY_KEY below (Render › Environment › RELAY_KEY).
 *   3. Pick the function "setup" in the toolbar  →  Run  →  allow the permissions it asks for.
 *      It creates the every-minute trigger and sends the first batch (see "Execution log").
 */
const RELAY_URL = 'https://bse-it-tracker.onrender.com/api/nse-relay';
const RELAY_KEY = 'PASTE_THE_RELAY_KEY_HERE';
const FEEDS = ['Online_announcements', 'Financial_Results', 'Board_Meetings'];

function relay() {
  // filings come in mostly between 07:00 and 24:00 IST: every minute then, every 5 minutes at night
  const now = new Date();
  const ist = new Date(now.getTime() + 330 * 60000);
  if (ist.getUTCHours() < 7 && now.getUTCMinutes() % 5 !== 0) return;
  const res = UrlFetchApp.fetchAll(FEEDS.map(f => ({
    url: 'https://nsearchives.nseindia.com/content/RSS/' + f + '.xml',
    muteHttpExceptions: true,
    followRedirects: true,
    headers: { Accept: 'application/rss+xml, application/xml, text/xml, */*', Referer: 'https://www.nseindia.com/' },
  })));
  const raw = res.map((r, i) => {
    const status = r.getResponseCode();
    return { feed: FEEDS[i], status: status, xml: status === 200 ? r.getContentText() : '' };
  });
  // send when a feed changed (or every 10 minutes, so the tracker knows the relay is alive)
  const props = PropertiesService.getScriptProperties();
  const sig = raw.map(r => r.status + ':' + (r.xml ? Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, r.xml)) : '')).join('|');
  const lastAt = Number(props.getProperty('at') || 0);
  if (sig === props.getProperty('sig') && Date.now() - lastAt < 10 * 60000) return;
  const out = UrlFetchApp.fetch(RELAY_URL, {
    method: 'post', contentType: 'application/json', muteHttpExceptions: true,
    headers: { 'x-relay-key': RELAY_KEY },
    payload: JSON.stringify({ schema: 2, updatedAt: now.toISOString(), runner: 'apps-script', raw: raw }),
  });
  props.setProperties({ sig: sig, at: String(Date.now()) });
  console.log(raw.map(r => r.feed + ' ' + r.status).join(', ') + '  →  tracker ' + out.getResponseCode() + ' ' + out.getContentText().slice(0, 160));
}

function setup() {
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('relay').timeBased().everyMinutes(1).create();
  PropertiesService.getScriptProperties().deleteAllProperties();
  relay();
}
