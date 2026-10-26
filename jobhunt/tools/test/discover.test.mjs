// Checks discover.mjs scoring and source parsing with canned board responses.
//   node --test jobhunt/tools/test/discover.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { discover, quickScore, jobId, normUrl } from '../discover.mjs';

const responses = {
  'https://boards-api.greenhouse.io/v1/boards/alignerr/jobs?content=true': {
    name: 'Alignerr',
    jobs: [
      { title: 'AI Trainer for Korean Writers/Speakers (Freelance, Remote)', absolute_url: 'https://job-boards.greenhouse.io/alignerr/jobs/1', location: { name: 'Remote' }, updated_at: new Date().toISOString(), content: '&lt;p&gt;Native-level Korean and fluent English. Remote, anywhere.&lt;/p&gt;' },
      { title: 'AI Trainer for Japanese Writers', absolute_url: 'https://job-boards.greenhouse.io/alignerr/jobs/2', location: { name: 'Remote' }, updated_at: new Date().toISOString(), content: 'Native Japanese required.' },
      { title: 'Software Engineer', absolute_url: 'https://job-boards.greenhouse.io/alignerr/jobs/3', location: { name: 'Remote' }, updated_at: new Date().toISOString(), content: 'Go and Rust.' },
    ],
  },
  'https://api.lever.co/v0/postings/welocalize?mode=json': [
    { text: 'Korean Interpreter', hostedUrl: 'https://jobs.lever.co/welocalize/abc', applyUrl: 'https://jobs.lever.co/welocalize/abc/apply', categories: { location: 'Remote - Worldwide', commitment: 'Freelance' }, createdAt: Date.now(), descriptionPlain: 'Consecutive interpreting between Korean and English.' },
    { text: 'Korean Interpreter (old)', hostedUrl: 'https://jobs.lever.co/welocalize/old', categories: { location: 'Remote' }, createdAt: Date.now() - 90 * 864e5, descriptionPlain: 'Korean interpreting.' },
  ],
};
const fakeFetch = async (url) => {
  if (!(url in responses)) return { ok: false, status: 404, json: async () => ({}) };
  return { ok: true, status: 200, json: async () => responses[url] };
};

test('quickScore favours remote Korean interpreting and drops other languages', () => {
  assert.ok(quickScore({ title: 'Korean Interpreter', text: 'remote', location: 'Remote - Worldwide' }).score >= 80);
  assert.equal(quickScore({ title: 'Japanese translator', text: 'native Japanese required' }).score, 0);
  assert.equal(quickScore({ title: 'Backend engineer', text: 'go' }).score, 0);
  const usOnly = quickScore({ title: 'Korean Interpreter', text: 'Must reside in the United States. US citizens only.', location: 'Remote' });
  assert.ok(usOnly.reasons.includes('US-only'));
  assert.ok(quickScore({ title: 'Hindi AI Trainer', text: 'native Hindi', location: 'India' }).score >= 40);
});

test('jobId is stable and ignores tracking parameters', () => {
  assert.equal(normUrl('https://Jobs.lever.co/acme/1/?utm_source=x#top'), 'https://jobs.lever.co/acme/1');
  assert.equal(jobId('Acme', 'Korean Interpreter', 'https://jobs.lever.co/acme/1?utm=1'), jobId('Acme', 'Korean Interpreter', 'https://jobs.lever.co/acme/1'));
  assert.match(jobId('Acme', 'Korean Interpreter', 'https://x.y/1'), /^acme-korean-interpreter-[0-9a-f]{6}$/);
});

test('discover sweeps boards, keeps matching roles, skips seen, old and failing sources', async () => {
  const seen = [jobId('Alignerr', 'AI Trainer for Korean Writers/Speakers (Freelance, Remote)', 'https://job-boards.greenhouse.io/alignerr/jobs/1')];
  const r = await discover({ sources: { greenhouse: ['alignerr', 'nosuchboard'], lever: ['welocalize'] }, seen, days: 30, min: 30, fetchImpl: fakeFetch });
  assert.equal(r.swept, 3);
  assert.deepEqual(r.candidates.map((c) => c.title), ['Korean Interpreter']);
  assert.equal(r.candidates[0].ats, 'lever');
  assert.equal(r.candidates[0].applyUrl, 'https://jobs.lever.co/welocalize/abc/apply');
  assert.equal(r.errors.length, 1);
  assert.match(r.errors[0].error, /404/);
  const again = await discover({ sources: { greenhouse: ['alignerr'] }, seen: [], fetchImpl: fakeFetch });
  assert.deepEqual(again.candidates.map((c) => c.ats), ['greenhouse']);
});
