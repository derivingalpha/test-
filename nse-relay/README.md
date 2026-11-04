# NSE relay

Reads NSE's public corporate-announcement RSS feeds (Online announcements, Financial results, Board meetings) and,
at most once an hour, the announcements list for the symbols in `symbols.txt`, and publishes one JSON snapshot:

- branch `nse-data`, file `latest.json` — filings seen in the last 72 hours (newest first), the state of each feed,
  and the latest per-symbol list. The branch holds a single commit, replaced on every run.

Scheduled by `.github/workflows/nse-relay.yml` every 5 minutes (GitHub's shortest schedule; runs may start late).

For faster updates the same script can run in a loop on any always-on machine and push each change to a receiver:

```bash
RELAY_KEY=... node relay.mjs --out latest.json --loop 15 --post https://<app>/api/nse-relay
```

Requests are kept light: one request per feed per round, conditional requests in loop mode, the per-symbol list at
most hourly, and a 15-minute pause whenever NSE refuses.

## 1-minute relay (as the tracker had before 31 Oct)

GitHub runs scheduled jobs late (often 30 minutes to hours apart). For filings within a minute, run one of these —
both free — and give it the tracker's admin password as the key (or `RELAY_KEY` if one is set on Render):

- `apps-script.gs` — Google Apps Script under any Google account: paste, set the key, run `setup` once.
- `cloudflare-worker.js` — a Cloudflare Worker with a `* * * * *` cron trigger; `<worker>/test` shows what NSE answers it.

Each run reads the three RSS feeds and posts them to `/api/nse-relay`; the tracker parses them exactly like the
feeds it used to read itself. This scheduled GitHub job stays as the backstop and keeps the hourly per-symbol list.
