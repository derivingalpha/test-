const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage({ viewport: { width: 1100, height: 900 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const B = (process.env.BASE || 'http://localhost:8765/');
  await pg.goto(B, { waitUntil: 'networkidle' }); await pg.evaluate(() => localStorage.clear());
  await pg.goto(B + '#/lesson/sm-x11'); await pg.waitForTimeout(300);
  for (let i = 0; i < 5; i++) {
    const q = await pg.textContent('.practice .q'); const n = +q.match(/(\d+)\s*×\s*11/)[1];
    await pg.fill('.practice input[type=text]', String(n * 11)); await pg.keyboard.press('Enter');
    await pg.waitForSelector('.feedback.ok'); await pg.click('.feedback button');
  }
  const st = await pg.evaluate(() => ({ done: MF.Store.isDone('sm-x11'), card: MF.Store.data.cards['sm-x11'] }));
  console.log('lesson done:', st.done, 'card due in h:', ((st.card.due - Date.now()) / 3600000).toFixed(1));
  // make due and review: answer wrong
  await pg.evaluate(() => { MF.Store.data.cards['sm-x11'].due = Date.now() - 1000; MF.Store.save(); });
  await pg.goto(B + '#/review'); await pg.waitForTimeout(300);
  console.log('badge:', await pg.textContent('#due-badge'));
  for (let i = 0; i < 3; i++) { await pg.click('.practice button:has-text("Show solution")'); await pg.click('.feedback button'); }
  const c2 = await pg.evaluate(() => MF.Store.data.cards['sm-x11']);
  console.log('after failed review lapses', c2.lapses, 'due in min', ((c2.due - Date.now()) / 60000).toFixed(1));
  // success review
  await pg.evaluate(() => { MF.Store.data.cards['sm-x11'].due = Date.now() - 1000; MF.Store.save(); });
  await pg.goto(B + '#/'); await pg.goto(B + '#/review'); await pg.waitForTimeout(300);
  for (let i = 0; i < 3; i++) { const q = await pg.textContent('.practice .q'); const n = +q.match(/(\d+)\s*×\s*11/)[1]; await pg.fill('.practice input[type=text]', String(n * 11)); await pg.keyboard.press('Enter'); await pg.click('.feedback button'); }
  const c3 = await pg.evaluate(() => MF.Store.data.cards['sm-x11']);
  console.log('after good review reps', c3.reps, 'ivl', c3.ivl, 'table:', (await pg.textContent('.practice table')).replace(/\s+/g, ' '));
  // sprint drill with x11 only
  await pg.evaluate(() => localStorage.setItem('mathforge.drillprefs', JSON.stringify({ skills: ['sm-x11', 'sm-x5-25', 'sm-tables'], dur: -20 })));
  await pg.goto(B + '#/drills'); await pg.waitForTimeout(300); await pg.click('button:has-text("Start sprint")');
  for (let i = 0; i < 20; i++) { const q = (await pg.textContent('.drill-q')).replace(/\s/g, ''); const m = q.match(/(\d+)×(\d+)/); await pg.fill('.drill-input', String(+m[1] * +m[2])); await pg.waitForTimeout(30); }
  console.log('sprint result:', (await pg.textContent('.card .row')).replace(/\s+/g, ' ').slice(0, 80));
  // export
  const exp = await pg.evaluate(() => MF.Store.exportJSON().length); console.log('export bytes', exp);
  // mobile
  await pg.setViewportSize({ width: 390, height: 844 }); await pg.goto(B + '#/lesson/fe-greeks'); await pg.waitForTimeout(500);
  const sw = await pg.evaluate(() => document.documentElement.scrollWidth); console.log('mobile scrollWidth', sw);
  await pg.screenshot({ path: 'mobile.png' });
  console.log('errors', errs);
  await b.close();
})();
