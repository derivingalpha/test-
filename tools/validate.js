const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const pg = await b.newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto((process.env.BASE || 'http://localhost:8765/'), { waitUntil: 'networkidle' });
  const out = await pg.evaluate(() => {
    const bad = []; const box = document.createElement('div'); document.body.append(box);
    for (const id of [...MF.lessonOrder.speed, ...MF.lessonOrder.fe]) {
      const L = MF.lessons[id];
      const gens = [...(L.problems || []).map((g, i) => ['p' + i, g]), ...(L.drill ? [['drill', L.drill]] : [])];
      if (!gens.length) bad.push(id + ': no problems');
      for (const [nm, g] of gens) {
        for (let k = 0; k < 120; k++) {
          let p; try { p = g(); } catch (e) { bad.push(`${id}/${nm}: throws ${e.message}`); break; }
          const txt = (p.q || '') + ' ' + (p.sol || '');
          if (/NaN|undefined|Infinity|\[object|\d\.\d{8,}|\d{6,}\.\d/.test(txt.replace(/<[^>]*>/g,""))) { bad.push(`${id}/${nm}: bad text: ${txt.slice(0, 160)}`); break; }
          if (p.choices) { if (!(Number.isInteger(p.a) && p.a >= 0 && p.a < p.choices.length)) { bad.push(`${id}/${nm}: bad choice idx`); break; } continue; }
          if (!Number.isFinite(p.a)) { bad.push(`${id}/${nm}: non-finite answer ${p.a} q=${p.q}`); break; }
          const typed = Number.isInteger(p.a) ? String(p.a) : Number(p.a.toPrecision(5)).toString();
          if (!MF.checkAnswer(p, typed).ok) { bad.push(`${id}/${nm}: typed ${typed} rejected for a=${p.a} tol=${p.tol} rtol=${p.rtol} q=${p.q.slice(0, 100)}`); break; }
          if (k < 6) { box.innerHTML = '<div>' + p.q + '</div><div>' + (p.sol || '') + '</div>'; MF.renderMath(box); const ke = box.querySelector('.katex-error'); if (ke) { bad.push(`${id}/${nm}: katex: ${ke.getAttribute('title')} :: ${ke.textContent.slice(0, 80)}`); break; } }
        }
      }
    }
    return bad;
  });
  console.log(out.join('\n')); console.log('issues:', out.length, 'pageerrors:', errs.length, errs.slice(0, 5));
  await b.close();
})();
