#!/usr/bin/env node
// Reads and fills online job application forms (Greenhouse, Lever, Ashby, Workable, plain HTML forms).
//
//   node apply.mjs inspect <url> [--profile profile.json] [--shots dir]
//   node apply.mjs fill <url> --packet packet.json [--profile profile.json] [--resume cv.pdf] [--submit] [--shots dir]
//
// Prints one JSON object to stdout. It never solves CAPTCHAs, signs in, or creates accounts:
// those come back in `blockers` so a person can finish the application.

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

const ACCOUNT_ATS = ['workday', 'icims', 'taleo', 'successfactors'];

export function resolveFormUrl(raw) {
  const u = new URL(raw);
  const host = u.hostname;
  const parts = u.pathname.split('/').filter(Boolean);
  if (/(^|\.)greenhouse\.io$/.test(host)) return { ats: 'greenhouse', formUrl: u.href };
  if (host === 'jobs.lever.co') {
    if (parts.length >= 2 && parts[2] !== 'apply') u.pathname = `/${parts[0]}/${parts[1]}/apply`;
    return { ats: 'lever', formUrl: u.href };
  }
  if (host === 'jobs.ashbyhq.com') {
    if (parts.length >= 2 && parts[2] !== 'application') u.pathname = `/${parts[0]}/${parts[1]}/application`;
    return { ats: 'ashby', formUrl: u.href };
  }
  if (host === 'apply.workable.com') {
    const j = parts.indexOf('j');
    if (j >= 0 && parts[j + 1] && parts[j + 2] !== 'apply') u.pathname = `/${parts.slice(0, j + 2).join('/')}/apply/`;
    return { ats: 'workable', formUrl: u.href };
  }
  if (/myworkdayjobs\.com$|myworkdaysite\.com$/.test(host)) return { ats: 'workday', formUrl: u.href };
  if (/icims\.com$/.test(host)) return { ats: 'icims', formUrl: u.href };
  if (/taleo\.net$/.test(host)) return { ats: 'taleo', formUrl: u.href };
  if (/successfactors\.(com|eu)$/.test(host)) return { ats: 'successfactors', formUrl: u.href };
  if (/smartrecruiters\.com$/.test(host)) return { ats: 'smartrecruiters', formUrl: u.href };
  return { ats: 'generic', formUrl: u.href };
}

const norm = (s) => String(s ?? '').toLowerCase().replace(/[*✱:?()]/g, ' ').replace(/\s+/g, ' ').trim();

// Picks the option that best matches a wanted value: exact, then containment, then word overlap.
export function bestMatch(wanted, options) {
  const w = norm(wanted);
  if (!w || !options?.length) return null;
  const list = options.map((o) => ({ o, n: norm(o) }));
  const exact = list.find((x) => x.n === w);
  if (exact) return exact.o;
  const starts = list.find((x) => x.n.startsWith(w) || w.startsWith(x.n));
  if (starts && starts.n.length > 0) return starts.o;
  const contains = list.find((x) => x.n.includes(w) || (x.n.length > 2 && w.includes(x.n)));
  if (contains) return contains.o;
  const ww = new Set(w.split(' '));
  let best = null;
  let bestScore = 0;
  for (const x of list) {
    const xs = x.n.split(' ');
    const hit = xs.filter((t) => ww.has(t)).length;
    const score = hit / Math.max(xs.length, ww.size);
    if (score > bestScore) { best = x.o; bestScore = score; }
  }
  return bestScore >= 0.5 ? best : null;
}

// Standard questions answered straight from the profile.
const PROFILE_RULES = [
  { re: /first name|given name|forename/, val: (p) => p.firstName },
  { re: /last name|surname|family name/, val: (p) => p.lastName },
  { re: /^(full )?name$|^your name|legal name|^name /, not: /company|employer|school|preferred|reference|manager/, val: (p) => p.name },
  { re: /e-?mail/, not: /confirm/, val: (p) => p.email },
  { re: /confirm.*e-?mail/, val: (p) => p.email },
  { re: /phone|mobile|contact number|whatsapp/, val: (p) => p.phone },
  { re: /linkedin/, val: (p) => p.linkedin },
  { re: /website|portfolio|personal url/, val: (p) => p.website || p.linkedin },
  { re: /^country|country of residence|which country/, val: (p) => p.country },
  { re: /^city|current city/, val: (p) => p.city },
  { re: /location|where are you based|where do you live/, not: /relocat|willing/, val: (p) => [p.city, p.state, p.country].filter(Boolean).join(', ') },
];

export function autofillValue(field, profile, files = {}) {
  const label = norm(field.label);
  if (field.type === 'file') {
    if (/cover/.test(label)) return files.coverLetter || null;
    if (/resume|cv|curriculum/.test(label) || !/cover/.test(label)) return files.resume || null;
    return null;
  }
  if (!profile) return null;
  if (/cover letter/.test(label) && field.type === 'textarea') return null; // comes from the packet
  for (const r of PROFILE_RULES) {
    if (r.re.test(label) && !(r.not && r.not.test(label))) {
      const v = r.val(profile);
      if (v) return v;
    }
  }
  return null;
}

// Finds the packet answer for a field: by key, then exact label, then close label.
export function packetValue(field, packet) {
  const answers = packet?.answers || {};
  if (field.key in answers) return answers[field.key];
  const label = norm(field.label);
  for (const [k, v] of Object.entries(answers)) if (norm(k) === label) return v;
  for (const [k, v] of Object.entries(answers)) {
    const nk = norm(k);
    if (nk.length > 8 && (label.includes(nk) || nk.includes(label)) && label.length > 8) return v;
  }
  if (/cover letter/.test(label) && field.type === 'textarea' && packet?.coverLetter) return packet.coverLetter;
  return undefined;
}

// Runs inside the page. Lists every fillable control with a stable key, selector and label.
function extractFieldsInPage() {
  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const shown = (el) => {
    if (el.type === 'file') return true;
    const st = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return st.visibility !== 'hidden' && st.display !== 'none' && (r.width > 0 || r.height > 0);
  };
  const ownLabel = (el) => {
    if (el.id) {
      const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
      if (l && clean(l.innerText)) return clean(l.innerText);
    }
    const anc = el.closest('label');
    if (anc && clean(anc.innerText)) return clean(anc.innerText);
    const al = el.getAttribute('aria-label');
    if (al) return clean(al);
    const lb = el.getAttribute('aria-labelledby');
    if (lb) {
      const t = lb.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean).map((n) => n.innerText).join(' ');
      if (clean(t)) return clean(t);
    }
    return '';
  };
  const boxLabel = (el) => {
    const fs = el.closest('fieldset');
    if (fs) {
      const lg = fs.querySelector('legend');
      if (lg && clean(lg.innerText)) return clean(lg.innerText);
    }
    const grp = el.closest('[role="radiogroup"], [role="group"]');
    if (grp) {
      const lb = grp.getAttribute('aria-labelledby');
      const n = lb && document.getElementById(lb.split(/\s+/)[0]);
      if (n && clean(n.innerText)) return clean(n.innerText);
      if (grp.getAttribute('aria-label')) return clean(grp.getAttribute('aria-label'));
    }
    const box = el.closest('.field, .application-question, .form-group, .form-field, .question, [class*="question"], [class*="Field"], [class*="field"], li');
    if (box) {
      for (const cand of box.querySelectorAll('label, legend, .application-label, [class*="label"], [class*="Label"], .text, p, span')) {
        if (cand.contains(el)) continue;
        if (cand.closest('label') && cand.closest('label').contains(el)) continue;
        const t = clean(cand.innerText);
        if (t) return t;
      }
    }
    return '';
  };
  const selectorFor = (el, i) => {
    if (el.id) return `#${CSS.escape(el.id)}`;
    if (el.name && document.querySelectorAll(`[name="${CSS.escape(el.name)}"]`).length === 1) return `[name="${CSS.escape(el.name)}"]`;
    el.setAttribute('data-jh-key', `f${i}`);
    return `[data-jh-key="f${i}"]`;
  };
  const required = (el, label) => el.required || el.getAttribute('aria-required') === 'true' || /[*✱]\s*$/.test(label);
  const stripStar = (s) => s.replace(/\s*[*✱]\s*$/, '').replace(/\s*\(required\)\s*$/i, '').trim();

  const out = [];
  const groups = new Map();
  const els = [...document.querySelectorAll('input, select, textarea')];
  els.forEach((el, i) => {
    const type = (el.getAttribute('type') || el.tagName).toLowerCase();
    if (['hidden', 'submit', 'button', 'reset', 'image', 'search', 'password'].includes(type)) return;
    if (el.disabled || el.closest('[aria-hidden="true"]')) return;
    if (!shown(el)) return;
    if (type === 'radio' || (type === 'checkbox' && el.name && document.querySelectorAll(`input[type=checkbox][name="${CSS.escape(el.name)}"]`).length > 1)) {
      const gk = `${type}:${el.name || i}`;
      if (!groups.has(gk)) {
        const label = boxLabel(el) || el.name;
        const g = { key: el.name || `group${i}`, type: type === 'radio' ? 'radio' : 'checkboxes', label: stripStar(label), required: false, choices: [] };
        g.required = required(el, label);
        groups.set(gk, g);
        out.push(g);
      }
      const g = groups.get(gk);
      g.choices.push({ label: ownLabel(el) || el.value, selector: selectorFor(el, i) });
      if (el.required) g.required = true;
      return;
    }
    const label = ownLabel(el) || boxLabel(el) || clean(el.getAttribute('placeholder')) || el.name || el.id || '';
    const f = {
      key: el.name || el.id || `f${i}`,
      selector: selectorFor(el, i),
      label: stripStar(label),
      type: el.getAttribute('role') === 'combobox' ? 'combobox' : el.tagName === 'SELECT' ? 'select' : el.tagName === 'TEXTAREA' ? 'textarea' : type,
      required: required(el, label),
    };
    if (el.tagName === 'SELECT') {
      f.options = [...el.options].filter((o) => o.value !== '' && !/^select|^choose|^please select|^--/i.test(o.text.trim())).map((o) => clean(o.text));
      f.multiple = el.multiple;
    }
    if (el.maxLength > 0) f.maxLength = el.maxLength;
    if (type === 'file' && el.accept) f.accept = el.accept;
    out.push(f);
  });
  return out;
}

// Runs inside the page. Reports anything that stops an automatic application.
function detectBlockersInPage() {
  const res = { blockers: [], notes: [] };
  const text = document.body ? document.body.innerText : '';
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return st.visibility !== 'hidden' && st.display !== 'none' && r.width > 30 && r.height > 30 && r.bottom > 0 && r.right > 0;
  };
  const frames = [...document.querySelectorAll('iframe')];
  const challenge = frames.some((f) => {
    const s = f.src || '';
    if (/recaptcha/.test(s) && /anchor/.test(s) && !/size=invisible/.test(s)) return visible(f);
    if (/hcaptcha/.test(s) && /frame=checkbox|frame=challenge/.test(s)) return visible(f);
    if (/challenges\.cloudflare\.com/.test(s)) return visible(f);
    return false;
  }) || [...document.querySelectorAll('.g-recaptcha, .h-captcha, .cf-turnstile')].some((el) => el.getAttribute('data-size') !== 'invisible' && visible(el));
  if (challenge) res.blockers.push('captcha');
  else if (document.querySelector('script[src*="recaptcha"], script[src*="hcaptcha"], .grecaptcha-badge, .g-recaptcha, .h-captcha, .cf-turnstile, iframe[src*="recaptcha"], iframe[src*="hcaptcha"]')) res.notes.push('invisible_captcha');
  const pw = [...document.querySelectorAll('input[type=password]')].some(visible);
  if (pw || /sign in to apply|log ?in to apply|create an account to apply|sign up to apply/i.test(text)) res.blockers.push('login_required');
  if (/no longer accepting applications|job (is )?no longer available|position has been filled|this job (posting )?(has )?(expired|closed)|page not found|job not found/i.test(text)) res.blockers.push('job_closed');
  return res;
}

function confirmationInPage() {
  const text = document.body ? document.body.innerText : '';
  const m = text.match(/(thank you[^.\n]{0,80}(appl|submi|interest)[^.\n]*|application (has been |was )?(submitted|received)[^.\n]*|we('|’)ve received your application[^.\n]*|successfully (submitted|applied)[^.\n]*)/i);
  const errs = [...document.querySelectorAll('[aria-invalid="true"], .error:not(:empty), .field-error:not(:empty), [role="alert"]')]
    .map((e) => (e.innerText || e.getAttribute('name') || '').trim()).filter(Boolean).slice(0, 8);
  return { confirmation: m ? m[0].trim().slice(0, 200) : null, errors: errs };
}

async function openForm(page, ats, formUrl) {
  await page.goto(formUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
  let fields = await page.evaluate(extractFieldsInPage);
  if (fields.length < 2) {
    // Job page with an Apply button or an embedded application iframe.
    const frame = await page.$('iframe[src*="greenhouse.io"], iframe[src*="lever.co"], iframe[src*="ashbyhq.com"], iframe[src*="workable.com"]');
    if (frame) {
      const src = await frame.getAttribute('src');
      await page.goto(new URL(src, page.url()).href, { waitUntil: 'domcontentloaded', timeout: 45000 });
    } else {
      const btn = page.locator('a, button').filter({ hasText: /^\s*(apply( now| for this (job|position|role))?|i'?m interested)\s*$/i }).first();
      if (await btn.count()) {
        await btn.click({ timeout: 5000 }).catch(() => {});
      }
    }
    await page.waitForLoadState('networkidle', { timeout: 8000 }).catch(() => {});
    fields = await page.evaluate(extractFieldsInPage);
  }
  return fields;
}

async function comboboxOptions(page, f) {
  try {
    const loc = page.locator(f.selector).first();
    await loc.click({ timeout: 3000 });
    await page.waitForTimeout(400);
    const opts = await page.locator('[role="option"]').allInnerTexts();
    await loc.press('Escape').catch(() => {});
    return opts.map((s) => s.trim()).filter(Boolean).slice(0, 60);
  } catch {
    return [];
  }
}

async function fillField(page, f, value) {
  const loc = page.locator(f.selector || 'body').first();
  switch (f.type) {
    case 'file':
      await loc.setInputFiles(value);
      return value;
    case 'select': {
      const pick = bestMatch(value, f.options);
      if (!pick) throw new Error(`no option matches "${value}"`);
      await loc.selectOption({ label: pick });
      return pick;
    }
    case 'radio': {
      const pick = bestMatch(value, f.choices.map((c) => c.label));
      if (!pick) throw new Error(`no choice matches "${value}"`);
      await page.locator(f.choices.find((c) => c.label === pick).selector).first().check({ force: true });
      return pick;
    }
    case 'checkboxes': {
      const wanted = Array.isArray(value) ? value : String(value).split(/\s*[,;]\s*/);
      const picked = [];
      for (const w of wanted) {
        const pick = bestMatch(w, f.choices.map((c) => c.label));
        if (pick) { await page.locator(f.choices.find((c) => c.label === pick).selector).first().check({ force: true }); picked.push(pick); }
      }
      if (!picked.length) throw new Error(`no choice matches "${value}"`);
      return picked;
    }
    case 'checkbox': {
      const on = value === true || /^(y|yes|true|1|agree|i agree|checked)$/i.test(String(value));
      if (on) await loc.check({ force: true }); else await loc.uncheck({ force: true });
      return on;
    }
    case 'combobox': {
      await loc.click({ timeout: 3000 });
      await loc.fill(String(value));
      await page.waitForTimeout(500);
      const opts = await page.locator('[role="option"]').allInnerTexts();
      const pick = bestMatch(value, opts.map((s) => s.trim()));
      if (pick) await page.locator('[role="option"]').filter({ hasText: pick }).first().click();
      else await loc.press('Enter');
      return pick || value;
    }
    default: {
      let v = String(value);
      if (f.maxLength && v.length > f.maxLength) v = v.slice(0, f.maxLength);
      await loc.fill(v);
      return v;
    }
  }
}

async function submit(page) {
  const btn = page.locator('button[type=submit], input[type=submit], button').filter({ hasText: /submit|send application|apply/i }).last();
  const fallback = page.locator('button[type=submit], input[type=submit]').last();
  const target = (await btn.count()) ? btn : fallback;
  if (!(await target.count())) return { submitted: false, error: 'no submit button found' };
  const before = page.url();
  await target.click({ timeout: 10000 });
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(500);
    const urlHit = page.url() !== before && /thank|confirm|success|submitted|applied/i.test(page.url());
    const state = await page.evaluate(confirmationInPage).catch(() => ({ confirmation: null, errors: [] }));
    if (urlHit || state.confirmation) return { submitted: true, confirmation: state.confirmation || page.url() };
    const blk = await page.evaluate(detectBlockersInPage).catch(() => ({ blockers: [] }));
    if (blk.blockers.includes('captcha')) return { submitted: false, error: 'captcha appeared after pressing submit', blockers: ['captcha'] };
    if (i > 6 && state.errors.length) return { submitted: false, error: 'form reported errors', formErrors: state.errors };
  }
  return { submitted: false, error: 'no confirmation seen after submitting; check the screenshot' };
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) args[k] = true;
      else { args[k] = next; i++; }
    } else args._.push(a);
  }
  return args;
}

const readJson = (p) => (p ? JSON.parse(fs.readFileSync(p, 'utf8')) : null);

export async function run(argv) {
  const args = parseArgs(argv);
  const [cmd, url] = args._;
  if (!['inspect', 'fill'].includes(cmd) || !url) {
    return { ok: false, error: 'usage: apply.mjs inspect|fill <url> [--packet p.json] [--profile p.json] [--resume cv.pdf] [--submit] [--shots dir]' };
  }
  const profile = readJson(args.profile);
  const packet = readJson(args.packet) || {};
  const files = { resume: args.resume || packet.resume || null, coverLetter: packet.coverLetterFile || null };
  const { ats, formUrl } = resolveFormUrl(url);
  const result = { ok: false, cmd, ats, url, formUrl, blockers: [], notes: [] };
  if (ACCOUNT_ATS.includes(ats)) {
    result.blockers.push('account_required');
    result.message = `${ats} needs an applicant account; apply by hand.`;
    return result;
  }
  const shots = args.shots ? path.resolve(args.shots) : null;
  if (shots) fs.mkdirSync(shots, { recursive: true });

  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  try {
    const page = await (await browser.newContext({ viewport: { width: 1280, height: 1600 }, locale: 'en-US' })).newPage();
    let fields;
    try {
      fields = await openForm(page, ats, formUrl);
    } catch (e) {
      result.blockers.push('unreachable');
      result.message = String(e.message || e).split('\n')[0];
      return result;
    }
    result.formUrl = page.url();
    const blk = await page.evaluate(detectBlockersInPage);
    result.blockers.push(...blk.blockers);
    result.notes.push(...blk.notes);
    if (!fields.length && !result.blockers.length) result.blockers.push('no_form_found');

    for (const f of fields) {
      if (f.type === 'combobox' && cmd === 'inspect') f.options = await comboboxOptions(page, f);
      const pv = packetValue(f, packet);
      const av = autofillValue(f, profile, files);
      if (pv !== undefined && pv !== null && pv !== '') f.answer = pv;
      else if (av) { f.answer = av; f.fromProfile = true; }
      f.needsAnswer = f.required && (f.answer === undefined);
    }
    result.fields = fields;

    if (cmd === 'inspect') {
      if (shots) await page.screenshot({ path: path.join(shots, 'form.png'), fullPage: true });
      result.ok = !result.blockers.some((b) => b !== 'captcha');
      return result;
    }

    result.filled = [];
    result.failed = [];
    for (const f of fields) {
      if (f.answer === undefined) continue;
      try {
        const used = await fillField(page, f, f.answer);
        result.filled.push({ key: f.key, label: f.label, value: f.type === 'file' ? path.basename(String(used)) : used });
      } catch (e) {
        result.failed.push({ key: f.key, label: f.label, error: String(e.message || e).split('\n')[0] });
      }
    }
    result.missing = fields.filter((f) => f.needsAnswer).map((f) => ({ key: f.key, label: f.label, type: f.type }));
    if (shots) await page.screenshot({ path: path.join(shots, 'filled.png'), fullPage: true });

    if (args.submit) {
      const stop = [...result.blockers];
      if (result.missing.length) stop.push('missing_required_answers');
      if (result.failed.some((f) => fields.find((x) => x.key === f.key)?.required)) stop.push('required_field_failed');
      if (stop.length) {
        result.submitted = false;
        result.message = `Not submitted: ${stop.join(', ')}`;
      } else {
        const sub = await submit(page);
        if (sub.blockers) result.blockers.push(...sub.blockers);
        delete sub.blockers;
        Object.assign(result, sub);
        if (shots) await page.screenshot({ path: path.join(shots, 'after-submit.png'), fullPage: true });
      }
    }
    result.ok = args.submit ? !!result.submitted : !result.failed.length && !result.blockers.length;
    return result;
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('apply.mjs')) {
  run(process.argv.slice(2))
    .then((r) => { process.stdout.write(JSON.stringify(r, null, 2) + '\n'); process.exit(r.ok ? 0 : 2); })
    .catch((e) => { process.stdout.write(JSON.stringify({ ok: false, error: String(e.stack || e) }) + '\n'); process.exit(1); });
}
