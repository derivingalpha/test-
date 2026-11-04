# NSE relay

Reads NSE's public corporate-announcement RSS feeds (Online announcements, Financial results, Board meetings) and,
at most once an hour, the announcements list for the symbols in `symbols.txt`, and publishes one JSON snapshot:

- branch `nse-data`, file `latest.json` — filings seen in the last 72 hours (newest first), the state of each feed,
  and the latest per-symbol list. The branch holds a single commit, replaced on every run.

Run by `.github/workflows/nse-relay.yml`. GitHub's own schedule fires irregularly, so the tracker starts the
workflow itself (`workflow_dispatch`) whenever the snapshot is older than 5 minutes; the schedule stays as a backstop.
The tracker's `GITHUB_TOKEN` needs **Actions: Read and write** on this repository for that.

For faster updates the same script can run in a loop on any always-on machine and push each change to a receiver:

```bash
RELAY_KEY=... node relay.mjs --out latest.json --loop 15 --post https://<app>/api/nse-relay
```

Requests are kept light: one request per feed per round, conditional requests in loop mode, the per-symbol list at
most hourly, and a 15-minute pause whenever NSE refuses.

## Cloudflare Worker (optional, 1-minute)

NSE refuses most cloud hosts (Render, Google Apps Script, AWS); GitHub's runners are accepted.
`cloudflare-worker.js` reads the three RSS feeds every minute and posts them to `/api/nse-relay` with the tracker's
admin password as the key (or `RELAY_KEY` if one is set on Render). Open `<worker>/test` first: it shows what NSE
answers Cloudflare.
