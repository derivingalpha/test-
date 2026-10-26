# Samruddhi's Job Hunt

A phone app plus a scheduled assistant that finds remote roles for Samruddhi (a Korean ⇄ English
interpreter and translator, native in English and Hindi), applies to them in bulk, and tracks every application.

- **App (open on iPhone):** https://claude.ai/artifact/VBr3ScXntz2x65nsJNq2yz
- **Assistant:** a Claude Code scheduled task that runs four times a day and follows [`RUNBOOK.md`](RUNBOOK.md)

## What she sees

| Tab | What it's for |
|---|---|
| **Today** | Counts (new matches, need you, in progress, sent), anything waiting on her, best new matches, last assistant run |
| **Matches** | New roles sorted by fit, with "why it fits" and "watch for" lines. Search and filter by kind of work. *Apply for me* / *Not for me* |
| **Applications** | A tracker of every application, with search (company, role, status, notes) and status filters. Tap one for its answers, history and notes; mark interviews, offers and rejections |
| **Me** | Her standing answers (rate, hours, start date, shifts, equipment, work status, kind of work), the auto-apply setting, an answer helper that drafts any long question from her CV, and saved answers |

The app keeps its data in the artifact's private database (her contact details, the CV and every
job). Nothing personal is committed to this repo.

## Getting it onto her phone

1. On claude.ai, open the app link, choose **Share**, and invite her email as an **Editor**. Editors
   can approve applications and save answers; viewers can only look.
2. On her iPhone, open the link in **Safari** while signed in to Claude, tap **Share → Add to Home
   Screen**. It opens like an app.
3. In **Me**, she fills in the four standing answers: rate, hours, start date, and where she can work.
   Forms ask for these constantly, and until they're filled in many applications stop at "Need you".

## Letting the assistant submit applications

The cloud environment that runs the assistant currently **blocks outside websites**. It can search
the web, but it can't open Greenhouse, Lever or other application forms. Until that changes it
prepares every application and leaves it under "Need you" with answers ready to paste.

To turn on automatic submission, open the cloud environment's settings (environment menu → Edit →
**Network access**) and choose **Full**. Alternatively, allow at least these hosts:
`job-boards.greenhouse.io`, `boards.greenhouse.io`, `boards-api.greenhouse.io`, `jobs.lever.co`,
`api.lever.co`, `jobs.ashbyhq.com`, `api.ashbyhq.com`, `apply.workable.com`, `remotive.com`,
`remoteok.com` and `jobicy.com`. Steps: https://code.claude.com/docs/en/cloud-environments#network-access

## How applying works

1. **Find.** `tools/discover.mjs` sweeps company job boards (Greenhouse, Lever, Ashby) and remote-job
   APIs, and the assistant adds web searches. Each role gets a fit score against her CV.
2. **Queue.** Every match with fit ≥ the auto-apply setting (default **50**) is queued. That includes
   partial matches where her skills fit, across full-time, part-time, contract and freelance work.
   She can also tap *Apply for me* on anything.
3. **Fill and submit.** `tools/apply.mjs` opens the form in a headless browser, fills her details,
   attaches the CV, answers every question (the assistant writes long answers from her real
   experience), submits, and checks for the confirmation.
4. **Hand over the rest.** CAPTCHAs, sign-ins, platform accounts, email applications and language
   tests go to "Need you". Each one comes with a short next step and answers ready to copy.

The assistant never invents experience or certificates, never takes tests for her, never bypasses
CAPTCHAs or creates accounts, and sends at most 3 applications per company per month.

**Volume.** Each run submits up to 30 applications where forms allow it, and runs happen four times
a day. So a few hundred a week is realistic once network access is on and her standing answers are
filled in. Many language-work platforms (Alignerr, Mercor, OpenTrain, Upwork) need her own account
and a test, so those always come back to her.

## Pausing or changing the schedule

The scheduled task is called **"Samruddhi job hunt"**. Pause or delete it from your scheduled tasks in
Claude, or ask Claude to change it. Each run uses your Claude usage.

## For developers

```bash
node --test jobhunt/tools/test/apply.test.mjs jobhunt/tools/test/discover.test.mjs   # 12 tests, local fixtures only

node jobhunt/tools/discover.mjs --out candidates.json                 # sweep boards in tools/sources.json
node jobhunt/tools/apply.mjs inspect <url> --profile p.json --resume cv.pdf
node jobhunt/tools/apply.mjs fill <url> --packet packet.json --profile p.json --resume cv.pdf --submit --shots out/
```

- `app/index.html` is the published app's source. It uses the artifact runtime's `db`, `user` and `sample`
  capabilities, so republish it to the same artifact after edits.
- `apply.mjs` handles Greenhouse (including React comboboxes), Lever, Ashby, Workable and plain
  forms. It reports `captcha`, `login_required`, `account_required` and `job_closed` as blockers instead
  of working around them.
- Playwright comes from the environment (`require('playwright')`). There's nothing to install.
