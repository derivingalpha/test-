const { chromium } = require('playwright');
(async () => {
  const base = process.env.BASE || 'http://localhost:8765/';
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 1200, height: 900 } });
  const errs = [];
  pg.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errs.push('CONSOLE ' + m.text()); });
  await pg.goto(base, { waitUntil: 'networkidle' });
  const ids = await pg.evaluate(() => [...MF.lessonOrder.speed, ...MF.lessonOrder.fe]);
  const katex = await pg.evaluate(() => !!window.katex);
  console.log('lessons', ids.length, 'katex', katex);
  const only = process.argv[2];
  for (const id of ids) {
    if (only && !id.startsWith(only)) continue;
    const before = errs.length;
    await pg.goto(base + '#/lesson/' + id); await pg.waitForTimeout(250);
    // click through walk steps
    const nexts = await pg.$$('.viz .btns button:has-text("Next")');
    for (const n of nexts) { for (let i = 0; i < 12; i++) { if (await n.isDisabled()) break; await n.click(); } }
    const rnd = await pg.$$('.viz .btns button:has-text("New example")'); for (const r of rnd) await r.click();
    const sliders = await pg.$$('.viz input[type=range]');
    for (const s of sliders) await s.evaluate(e => { e.value = e.max; e.dispatchEvent(new Event('input')); e.value = e.min; e.dispatchEvent(new Event('input')); });
    const vbtn = await pg.$$('.viz .btns button'); for (const v of vbtn) { if (!(await v.isDisabled())) await v.click().catch(()=>{}); }
    const katexErr = await pg.$$eval('.katex-error', x => x.map(e => e.getAttribute('title') || e.textContent).slice(0, 3));
    if (katexErr.length) errs.push(id + ' KATEX ' + katexErr.join(' | '));
    if (errs.length > before) console.log('ERR in', id, errs.slice(before).join('\n  '));
  }
  // other pages
  for (const r of ['#/', '#/track/speed', '#/track/fe', '#/review', '#/drills', '#/drills/anzan', '#/drills/tables', '#/reference', '#/reference/speed', '#/progress']) {
    const before = errs.length; await pg.goto(base + r); await pg.waitForTimeout(300);
    if (errs.length > before) console.log('ERR in', r, errs.slice(before).join('\n  '));
  }
  console.log('total errors', errs.length);
  await b.close();
})();
