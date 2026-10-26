// Runs apply.mjs against local copies of common application forms.
//   node --test jobhunt/tools/test/

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { run, resolveFormUrl, bestMatch } from '../apply.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, 'fixtures');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'jobhunt-test-'));
const resume = path.join(tmp, 'cv.pdf');
const profileFile = path.join(tmp, 'profile.json');
const posted = [];
let server;
let base;

const profile = {
  name: 'Samruddhi Singh', firstName: 'Samruddhi', lastName: 'Singh',
  email: 'test@example.com', phone: '+91-0000000000',
  city: 'Navi Mumbai', state: 'Maharashtra', country: 'India',
  linkedin: 'https://linkedin.com/in/example',
};

before(async () => {
  fs.writeFileSync(resume, '%PDF-1.4 test');
  fs.writeFileSync(profileFile, JSON.stringify(profile));
  server = http.createServer((req, res) => {
    if (req.method === 'POST') {
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        posted.push({ path: req.url, body });
        if (req.url === '/submit') {
          res.writeHead(302, { Location: '/thanks' });
          res.end();
        } else {
          res.writeHead(200, { 'content-type': 'text/html' });
          res.end('<h1>Thanks for applying!</h1><p>Your application has been submitted.</p>');
        }
      });
      return;
    }
    if (req.url === '/thanks') {
      res.writeHead(200, { 'content-type': 'text/html' });
      res.end('<h1>Thank you for applying.</h1><p>Your application has been received.</p>');
      return;
    }
    const file = path.join(fixtures, path.basename(req.url.split('?')[0]));
    if (!fs.existsSync(file)) { res.writeHead(404); res.end('Page not found'); return; }
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

const writePacket = (obj) => {
  const p = path.join(tmp, `packet-${Math.random().toString(36).slice(2)}.json`);
  fs.writeFileSync(p, JSON.stringify(obj));
  return p;
};

test('resolveFormUrl points at the application form for each ATS', () => {
  assert.equal(resolveFormUrl('https://jobs.lever.co/acme/123').formUrl, 'https://jobs.lever.co/acme/123/apply');
  assert.equal(resolveFormUrl('https://jobs.lever.co/acme/123/apply').formUrl, 'https://jobs.lever.co/acme/123/apply');
  assert.equal(resolveFormUrl('https://jobs.ashbyhq.com/acme/abc').formUrl, 'https://jobs.ashbyhq.com/acme/abc/application');
  assert.equal(resolveFormUrl('https://apply.workable.com/acme/j/ABC123/').formUrl, 'https://apply.workable.com/acme/j/ABC123/apply/');
  assert.equal(resolveFormUrl('https://job-boards.greenhouse.io/alignerr/jobs/1').ats, 'greenhouse');
  assert.equal(resolveFormUrl('https://acme.wd5.myworkdayjobs.com/x').ats, 'workday');
});

test('bestMatch picks the closest option', () => {
  assert.equal(bestMatch('india', ['India', 'South Korea']), 'India');
  assert.equal(bestMatch('Fluent', ['Native', 'Fluent / Advanced', 'Basic']), 'Fluent / Advanced');
  assert.equal(bestMatch('yes', ['Yes', 'No']), 'Yes');
  assert.equal(bestMatch('purple', ['Yes', 'No']), null);
});

test('inspect lists Greenhouse-style questions and fills standard ones from the profile', async () => {
  const r = await run(['inspect', `${base}/greenhouse-form.html`, '--profile', profileFile, '--resume', resume]);
  assert.equal(r.ok, true, JSON.stringify(r.blockers));
  const by = Object.fromEntries(r.fields.map((f) => [f.label, f]));
  assert.equal(by['First Name'].answer, 'Samruddhi');
  assert.equal(by['Last Name'].answer, 'Singh');
  assert.equal(by['Email'].answer, 'test@example.com');
  assert.equal(by['Resume/CV'].type, 'file');
  assert.equal(by['Resume/CV'].answer, resume);
  assert.equal(by['LinkedIn Profile'].answer, profile.linkedin);
  assert.equal(by['Why are you interested in this role?'].needsAnswer, true);
  assert.deepEqual(by['Which country do you live in?'].options, ['India', 'South Korea', 'United States']);
  assert.equal(by['Do you have a wired headset and a quiet room?'].type, 'radio');
  assert.deepEqual(by['Do you have a wired headset and a quiet room?'].choices.map((c) => c.label), ['Yes', 'No']);
  assert.equal(by['Korean proficiency'].type, 'combobox');
  assert.ok(by['Korean proficiency'].options.includes('Fluent / Advanced'));
  assert.equal(by['I agree to the privacy policy'].type, 'checkbox');
});

test('fill + submit completes a Greenhouse-style form and sees the confirmation', async () => {
  posted.length = 0;
  const packet = writePacket({
    answers: {
      'Why are you interested in this role?': 'I interpret Korean and English every day for enterprise teams.',
      'Which country do you live in?': 'India',
      headset: 'Yes',
      'Korean proficiency': 'Fluent',
      consent: true,
    },
  });
  const shots = path.join(tmp, 'shots-gh');
  const r = await run(['fill', `${base}/job-page.html`, '--packet', packet, '--profile', profileFile, '--resume', resume, '--submit', '--shots', shots]);
  assert.equal(r.submitted, true, JSON.stringify(r, null, 2));
  assert.match(r.confirmation, /thank you for applying/i);
  assert.deepEqual(r.missing, []);
  assert.deepEqual(r.failed, []);
  const body = posted.find((p) => p.path === '/submit').body;
  for (const v of ['Samruddhi', 'Singh', 'test@example.com', 'enterprise teams', 'India', 'name="headset"\r\n\r\nyes', 'Fluent / Advanced', 'agreed', 'filename="cv.pdf"']) {
    assert.ok(body.includes(v), `posted form is missing ${v}`);
  }
  assert.ok(fs.existsSync(path.join(shots, 'filled.png')));
  assert.ok(fs.existsSync(path.join(shots, 'after-submit.png')));
});

test('fill + submit completes a Lever-style form', async () => {
  posted.length = 0;
  const packet = writePacket({ answers: { 'Tell us about your interpreting experience': 'Live KO-EN interpreting for SAP go-live and MFDS audits.', 'How did you hear about us?': 'Job board' } });
  const r = await run(['fill', `${base}/lever-form.html`, '--packet', packet, '--profile', profileFile, '--resume', resume, '--submit']);
  assert.equal(r.submitted, true, JSON.stringify(r, null, 2));
  assert.ok(r.notes.includes('invisible_captcha'));
  const body = posted.find((p) => p.path === '/lever-submit').body;
  for (const v of ['Samruddhi Singh', 'Navi Mumbai, Maharashtra, India', 'MFDS audits', 'Job board', 'https://linkedin.com/in/example']) {
    assert.ok(body.includes(v), `posted form is missing ${v}`);
  }
});

test('does not submit when a required answer is missing', async () => {
  posted.length = 0;
  const packet = writePacket({ answers: {} });
  const r = await run(['fill', `${base}/greenhouse-form.html`, '--packet', packet, '--profile', profileFile, '--resume', resume, '--submit']);
  assert.equal(r.submitted, false);
  assert.match(r.message, /missing_required_answers/);
  assert.ok(r.missing.some((m) => m.label === 'Why are you interested in this role?'));
  assert.equal(posted.length, 0);
});

test('reports a visible CAPTCHA instead of submitting', async () => {
  posted.length = 0;
  const packet = writePacket({ answers: {} });
  const r = await run(['fill', `${base}/captcha-form.html`, '--packet', packet, '--profile', profileFile, '--submit']);
  assert.ok(r.blockers.includes('captcha'));
  assert.equal(r.submitted, false);
  assert.equal(posted.length, 0);
});

test('reports a sign-in wall', async () => {
  const r = await run(['inspect', `${base}/login-wall.html`]);
  assert.ok(r.blockers.includes('login_required'));
  assert.equal(r.ok, false);
});

test('reports account-based systems without opening them', async () => {
  const r = await run(['inspect', 'https://acme.wd5.myworkdayjobs.com/en-US/careers/job/123']);
  assert.deepEqual(r.blockers, ['account_required']);
});
