#!/usr/bin/env node
// Sweeps company job boards (Greenhouse, Lever, Ashby) and remote-job APIs for roles that
// use Korean, Hindi or bilingual language skills, and prints scored candidates as JSON.
//
//   node discover.mjs [--sources sources.json] [--seen seen.json] [--days 30] [--min 30] [--out candidates.json]
//
// --seen is a JSON array of job ids already on the board; those are left out.
// Each source fails on its own: its error is listed in `errors` and the sweep carries on.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

const stripHtml = (s) => String(s || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

export function normUrl(u) {
  try {
    const x = new URL(u);
    const keep = x.searchParams.get('gh_jid');
    x.search = keep ? `?gh_jid=${keep}` : '';
    x.hash = '';
    return `${x.protocol}//${x.hostname.toLowerCase()}${x.pathname.replace(/\/+$/, '')}${x.search}`;
  } catch {
    return String(u || '').trim();
  }
}

export function jobId(company, title, url) {
  const slug = `${company}-${title}`.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-$/, '');
  const h = crypto.createHash('sha1').update(normUrl(url)).digest('hex').slice(0, 6);
  return `${slug}-${h}`;
}

export function atsFor(url) {
  const host = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
  if (/greenhouse\.io$/.test(host)) return 'greenhouse';
  if (host === 'jobs.lever.co') return 'lever';
  if (host === 'jobs.ashbyhq.com') return 'ashby';
  if (host === 'apply.workable.com') return 'workable';
  if (/myworkdayjobs\.com$|icims\.com$|taleo\.net$|successfactors\./.test(host)) return 'account';
  return 'other';
}

// Rough first-pass score. The assistant refines it against her CV before anything reaches the board.
export function quickScore({ title = '', text = '', location = '' }) {
  const t = `${title} ${text}`.toLowerCase();
  const loc = `${location}`.toLowerCase();
  const has = (re) => re.test(t);
  const lang = has(/korean|한국어|hangul|hanguk/) ? 'ko' : has(/\bhindi\b/) ? 'hi' : null;
  const craft = has(/interpret|translat|linguist|locali[sz]|subtitl|transcri|bilingual|language (specialist|expert|data|quality|lead|analyst)/);
  if (!lang && !craft) return { score: 0, reasons: ['no language skill in the posting'] };
  const other = t.match(/\b(japanese|chinese|mandarin|cantonese|vietnamese|thai|indonesian|spanish|portuguese|french|german|italian|arabic|turkish|russian|polish|dutch|tamil|telugu|bengali|marathi|gujarati|urdu)\b/);
  if (!lang && other && has(/native|fluent/)) return { score: 0, reasons: [`needs ${other[1]}`] };
  let score = 0;
  const reasons = [];
  const add = (n, why) => { score += n; reasons.push(why); };
  if (lang === 'ko') add(40, 'Korean');
  if (lang === 'hi' || (lang === 'ko' && has(/\bhindi\b/))) add(25, 'Hindi');
  if (has(/interpret/)) add(25, 'interpreting');
  else if (has(/translat|subtitl/)) add(20, 'translation');
  else if (has(/linguist|locali[sz]/)) add(18, 'localization');
  if (has(/bilingual/)) add(10, 'bilingual');
  if (has(/ai trainer|annotat|rater|evaluat|rlhf|data specialist|transcri/)) add(8, 'AI/data work');
  if (has(/sop|operations|coordinator|project manag|executive assistant|audit|sap\b|mes\b/)) add(6, 'ops/SAP overlap');
  if (/remote|anywhere|worldwide|global|india|apac|asia/.test(loc) || has(/fully remote|work from home|remote-first/)) add(10, 'remote');
  if (/india|anywhere|worldwide|global/.test(loc)) add(8, 'open to India');
  if (has(/(us|u\.s\.) citizens? only|must (be|reside|live) in the (us|u\.s\.|united states)|authori[sz]ed to work in the (us|united states)|us[- ]based only/)) add(-35, 'US-only');
  if (has(/must (be|reside|live) in (south )?korea|korea residents? only|resident of (south )?korea/)) add(-30, 'Korea residents only');
  if (/on-?site|hybrid/.test(loc) && !/remote/.test(loc)) add(-30, 'not remote');
  if (has(/native (korean|korean speaker)/)) add(-6, 'asks for native Korean');
  if (has(/senior|10\+ years|8\+ years|phd/)) add(-8, 'senior/PhD');
  return { score: Math.max(0, Math.min(100, score)), reasons };
}

async function getJson(url, fetchImpl) {
  const res = await fetchImpl(url, { headers: { 'user-agent': 'Mozilla/5.0 (job search assistant)', accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

export const SOURCES = {
  async greenhouse(token, f) {
    const d = await getJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`, f);
    return (d.jobs || []).map((j) => ({ company: d.name || token, title: j.title, url: j.absolute_url, location: j.location?.name || '',
      posted: j.updated_at || j.first_published, text: stripHtml(j.content).slice(0, 4000), source: `Greenhouse · ${token}` }));
  },
  async lever(co, f) {
    const d = await getJson(`https://api.lever.co/v0/postings/${co}?mode=json`, f);
    return (Array.isArray(d) ? d : []).map((j) => ({ company: co, title: j.text, url: j.hostedUrl, applyUrl: j.applyUrl, location: [j.categories?.location, j.workplaceType].filter(Boolean).join(' · '),
      employment: j.categories?.commitment, posted: j.createdAt ? new Date(j.createdAt).toISOString() : null, text: (j.descriptionPlain || stripHtml(j.description)).slice(0, 4000), source: `Lever · ${co}` }));
  },
  async ashby(org, f) {
    const d = await getJson(`https://api.ashbyhq.com/posting-api/job-board/${org}?includeCompensation=true`, f);
    return (d.jobs || []).map((j) => ({ company: org, title: j.title, url: j.jobUrl, applyUrl: j.applyUrl, location: [j.location, j.isRemote ? 'Remote' : ''].filter(Boolean).join(' · '),
      employment: j.employmentType, pay: j.compensation?.compensationTierSummary, posted: j.publishedAt, text: (j.descriptionPlain || '').slice(0, 4000), source: `Ashby · ${org}` }));
  },
  async remotive(q, f) {
    const d = await getJson(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(q)}`, f);
    return (d.jobs || []).map((j) => ({ company: j.company_name, title: j.title, url: j.url, location: j.candidate_required_location, employment: j.job_type,
      pay: j.salary, posted: j.publication_date, text: stripHtml(j.description).slice(0, 4000), source: 'Remotive' }));
  },
  async jobicy(tag, f) {
    const d = await getJson(`https://jobicy.com/api/v2/remote-jobs?count=50&tag=${encodeURIComponent(tag)}`, f);
    return (d.jobs || []).map((j) => ({ company: j.companyName, title: j.jobTitle, url: j.url, location: j.jobGeo, employment: Array.isArray(j.jobType) ? j.jobType.join(', ') : j.jobType,
      posted: j.pubDate, text: stripHtml(j.jobExcerpt || j.jobDescription).slice(0, 4000), source: 'Jobicy' }));
  },
  async remoteok(_, f) {
    const d = await getJson('https://remoteok.com/api', f);
    return (Array.isArray(d) ? d.slice(1) : []).map((j) => ({ company: j.company, title: j.position, url: j.url, applyUrl: j.apply_url, location: j.location || 'Remote',
      posted: j.date, text: `${(j.tags || []).join(' ')} ${stripHtml(j.description)}`.slice(0, 4000), source: 'RemoteOK' }));
  },
};

export async function discover({ sources, seen = [], days = 30, min = 30, fetchImpl = globalThis.fetch }) {
  const tasks = [];
  for (const [kind, list] of Object.entries(sources)) {
    if (!SOURCES[kind]) continue;
    const items = list === true ? [null] : Array.isArray(list) ? list : [];
    for (const item of items) tasks.push({ kind, item });
  }
  const errors = [];
  const raw = [];
  const queue = [...tasks];
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const { kind, item } = queue.shift();
      try { raw.push(...(await SOURCES[kind](item, fetchImpl))); }
      catch (e) { errors.push({ source: kind, item, error: String(e.message || e) }); }
    }
  }));
  const seenSet = new Set(seen);
  const cutoff = Date.now() - days * 864e5;
  const byKey = new Map();
  for (const r of raw) {
    if (!r.url || !r.title) continue;
    if (r.posted && !isNaN(new Date(r.posted)) && new Date(r.posted).getTime() < cutoff) continue;
    const id = jobId(r.company || '', r.title, r.url);
    if (seenSet.has(id)) continue;
    const key = normUrl(r.url);
    if (byKey.has(key)) continue;
    const { score, reasons } = quickScore(r);
    if (score < min) continue;
    byKey.set(key, { id, ...r, ats: atsFor(r.applyUrl || r.url), quickScore: score, reasons });
  }
  const candidates = [...byKey.values()].sort((a, b) => b.quickScore - a.quickScore);
  return { swept: tasks.length, fetched: raw.length, candidates, errors };
}

function arg(name, dflt) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : dflt;
}

if (process.argv[1] && process.argv[1].endsWith('discover.mjs')) {
  const sources = JSON.parse(fs.readFileSync(arg('sources', path.join(here, 'sources.json')), 'utf8'));
  const seenFile = arg('seen');
  const seen = seenFile && fs.existsSync(seenFile) ? JSON.parse(fs.readFileSync(seenFile, 'utf8')) : [];
  discover({ sources, seen, days: Number(arg('days', 30)), min: Number(arg('min', 30)) })
    .then((r) => {
      const json = JSON.stringify(r, null, 1);
      const out = arg('out');
      if (out) fs.writeFileSync(out, json);
      process.stdout.write(out ? `${r.candidates.length} candidates from ${r.fetched} postings (${r.errors.length} source errors) -> ${out}\n` : json + '\n');
    })
    .catch((e) => { console.error(e); process.exit(1); });
}
