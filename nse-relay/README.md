# NSE relay

Reads NSE's public corporate-announcement RSS feeds (Online announcements, Financial results, Board meetings) and,
at most once an hour, the announcements list for the symbols in `symbols.txt`, and publishes one JSON snapshot:

- branch `nse-data`, file `latest.json` — filings seen in the last 72 hours (newest first), the state of each feed,
  and the latest per-symbol list. The branch holds a single commit, replaced on every run.

Run by `.github/workflows/nse-relay.yml`. GitHub's own schedule fires irregularly, so the tracker starts the
workflow itself (`workflow_dispatch`) whenever the snapshot is older than 5 minutes; the schedule stays as a backstop.
The tracker's `GITHUB_TOKEN` needs **Actions: Read and write** on this repository for that.

## 5-second updates: a computer in India

NSE and BSE serve ordinary Indian connections; they refuse cloud hosts (NSE answers Render with 403, BSE answers cloud
hosts with an empty list), and a GitHub run can only be started every few minutes. For filings within seconds, run the
same script in a loop on a computer in India that stays on during market hours (an office PC is enough):

1. Install Node.js 18 or later (nodejs.org) and download this `nse-relay` folder.
2. Windows: double-click `run-fast.cmd`. macOS / Linux: `./run-fast.sh`. Enter the tracker's admin password when asked
   (or `RELAY_KEY` if one is set on Render). `EVERY=10` before the command changes the interval (default 5 s).

To have it start by itself whenever the PC is on, double-click `install-autostart.cmd` once instead: it saves the key
for that Windows user, starts the relay minimised now and at every sign-in (remove `hsl-nse-relay.cmd` from the
Startup folder — Win+R, `shell:startup` — to stop that).

An Android phone on Wi-Fi or mobile data works too (it is an ordinary Indian connection): install Termux, then
`pkg install nodejs git && git clone https://github.com/derivingalpha/test- && cd test-/nse-relay && ./run-fast.sh`
(keep Termux running: `termux-wake-lock`).

Each round reads the three RSS feeds with conditional requests (an unchanged feed costs a 304) and BSE's newest page
(the full 24 hours on the first round only), and pushes only when something changed. The tracker shows a new filing
on every open page within a second of the push. While the computer's relay is getting answers from NSE, the tracker
stops starting GitHub runs; when it goes quiet or NSE refuses it, the GitHub runs resume within about 5 minutes.

```bash
RELAY_KEY=... node relay.mjs --out latest.json --loop 5 --post https://<app>/api/nse-relay
```

Requests are kept light: one request per feed per round, conditional requests in loop mode, the per-symbol list at
most hourly, and a 15-minute pause whenever NSE refuses.

## Cloudflare Worker (optional, about 5 seconds, no computer needed)

NSE refuses most cloud hosts (Render, Google Apps Script, AWS); GitHub's runners are accepted, Cloudflare is untested.
`cloudflare-worker.js` (free plan) is started by a Cron Trigger every minute and then reads the three RSS feeds every
5 seconds until the next run, with conditional requests, posting a feed to `/api/nse-relay` the moment it changes (key:
the tracker's admin password, or `RELAY_KEY` if one is set on Render). Setup is in the file's header. Open
`<worker>/test` first: it shows what NSE answers Cloudflare — three 200s and the tracker gets filings within about
5 seconds; a 403 and nothing changes (the worker backs off for 15 minutes at a time, the GitHub relay carries on).
