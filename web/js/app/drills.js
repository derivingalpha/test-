/* MathForge speed drills: timed sprints, flash anzan, adaptive times-tables grid. */
(function (G) {
  'use strict';
  const MF = G.MF, el = MF.el, Store = MF.Store, R = MF.R;
  const KEY = 'mathforge.drillprefs';
  const prefs = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } };
  const savePrefs = p => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) { } };

  MF.views.drills = function (app, mode) {
    document.body.classList.add('track-speed'); document.body.classList.remove('track-fe');
    mode = mode || 'sprint';
    app.append(el('h1', { text: 'Speed drills' }));
    app.append(el('p', { class: 'muted', text: 'Short, intense, timed retrieval. A correct answer advances on its own, so just type. Aim for accuracy first; speed follows.' }));
    app.append(el('div', { class: 'tabs' }, [['sprint', 'Sprint'], ['anzan', 'Flash Anzan'], ['tables', 'Tables grid']].map(([k, t]) => el('a', { class: 'btn sm' + (k === mode ? ' on' : ''), href: '#/drills/' + k, text: t }))));
    const host = el('div'); app.append(host);
    ({ sprint, anzan, tables })[mode](host);
  };

  /* ---------- sprint ---------- */
  function sprint(host) {
    const skills = MF.lessonOrder.speed.map(id => MF.lessons[id]).filter(L => L.drill);
    const p = prefs();
    let chosen = new Set(p.skills || skills.filter(L => Store.isDone(L.id)).map(L => L.id));
    if (!chosen.size) chosen = new Set(skills.slice(0, 4).map(L => L.id));
    const setup = el('div', { class: 'card' });
    const list = el('div', { class: 'skill-list' });
    skills.forEach(L => {
      const cb = el('input', { type: 'checkbox' }); cb.checked = chosen.has(L.id);
      cb.addEventListener('change', () => { cb.checked ? chosen.add(L.id) : chosen.delete(L.id); });
      list.append(el('label', { class: 'chk small' }, cb, L.title));
    });
    const dur = el('select', null, [[60, '60 seconds'], [120, '2 minutes'], [300, '5 minutes'], [-20, '20 problems']].map(([v, t]) => el('option', { value: v, text: t })));
    dur.value = p.dur || 60;
    setup.append(el('div', { class: 'row' }, el('h3', { style: 'margin:0', text: 'Skills in this sprint' }), el('span', { class: 'spacer' }),
      el('button', { class: 'btn sm ghost', onclick: () => { list.querySelectorAll('input').forEach((c, i) => { c.checked = true; chosen.add(skills[i].id); }); } }, 'All'),
      el('button', { class: 'btn sm ghost', onclick: () => { list.querySelectorAll('input').forEach((c, i) => { c.checked = Store.isDone(skills[i].id); c.checked ? chosen.add(skills[i].id) : chosen.delete(skills[i].id); }); } }, 'Completed only'),
      el('button', { class: 'btn sm ghost', onclick: () => { list.querySelectorAll('input').forEach(c => { c.checked = false; }); chosen.clear(); } }, 'None')));
    setup.append(list, el('div', { class: 'row', style: 'margin-top:14px' }, dur, el('span', { class: 'spacer' }),
      el('button', { class: 'btn speed', onclick: () => { if (!chosen.size) { MF.armConfirm(null, 'Pick at least one skill first'); return; } savePrefs(Object.assign(prefs(), { skills: [...chosen], dur: dur.value })); go(); } }, 'Start sprint ▶')));
    host.append(setup);

    function go() {
      host.innerHTML = '';
      const ids = [...chosen]; const limit = parseInt(dur.value);
      const stage = el('div', { class: 'card drill-stage' });
      const clock = el('div', { class: 'timer' }), scoreEl = el('div', { class: 'muted' });
      const qEl = el('div', { class: 'drill-q' }), skillEl = el('div', { class: 'small dim' });
      const inp = el('input', { type: 'text', class: 'drill-input', inputmode: 'numeric', autocomplete: 'off' });
      const fb = el('div', { class: 'small', style: 'min-height:1.6em;margin-top:10px' });
      const hintEl = el('div', { class: 'small dim' });
      stage.append(el('div', { class: 'row' }, clock, el('span', { class: 'spacer' }), scoreEl), skillEl, qEl, inp, hintEl, fb,
        el('div', { style: 'margin-top:12px' }, el('button', { class: 'btn sm ghost', onclick: () => skip() }, 'Skip (counts wrong)'), ' ', el('button', { class: 'btn sm ghost', onclick: () => end() }, 'End')));
      host.append(stage);
      const t0 = performance.now(); let cur = null, qt0 = 0, n = 0, ok = 0, log = [], over = false;
      const ticker = setInterval(() => {
        if (!document.body.contains(stage)) return clearInterval(ticker);
        const el2 = (performance.now() - t0) / 1000;
        clock.textContent = limit > 0 ? `${Math.max(0, limit - el2).toFixed(1)}s left` : `${el2.toFixed(1)}s · ${n}/${-limit}`;
        if (limit > 0 && el2 >= limit) end();
      }, 100);
      function nextQ() {
        const id = R.pick(ids), L = MF.lessons[id];
        cur = Object.assign({ id }, L.drill()); qt0 = performance.now();
        qEl.innerHTML = cur.q; MF.renderMath(qEl); hintEl.textContent = cur.enter ? 'press Enter to submit' : ''; skillEl.textContent = L.title; inp.value = ''; inp.focus();
        scoreEl.textContent = `${ok} correct`;
      }
      function record(good) {
        const secs = (performance.now() - qt0) / 1000; n++; if (good) ok++;
        Store.drillStat(cur.id, good, secs); Store.logActivity(1, good ? 1 : 0);
        log.push({ id: cur.id, q: cur.q, a: cur.a, good, secs });
        stage.classList.remove('flash-ok', 'flash-no'); void stage.offsetWidth; stage.classList.add(good ? 'flash-ok' : 'flash-no');
        fb.innerHTML = good ? `<span style="color:var(--good)">✓ ${secs.toFixed(1)}s</span>` : `<span style="color:var(--bad)">✗ ${cur.q} = ${MF.fmt(cur.a, 6)}</span>`; MF.renderMath(fb);
        if (limit < 0 && n >= -limit) return end();
        nextQ();
      }
      function skip() { if (!over) record(false); }
      inp.addEventListener('input', () => { if (cur.enter) return; const r = MF.checkAnswer(cur, inp.value); if (r.valid && r.ok) record(true); });
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); const r = MF.checkAnswer(cur, inp.value); if (r.valid) record(r.ok); } });
      function end() {
        if (over) return; over = true; clearInterval(ticker);
        const secs = (performance.now() - t0) / 1000;
        host.innerHTML = '';
        const best = prefs().bestSprint || 0, rate = ok / secs * 60;
        if (rate > best) savePrefs(Object.assign(prefs(), { bestSprint: rate }));
        const tbl = el('table', null, el('tr', null, ['Skill', 'Correct', 'Avg time'].map(h => el('th', { text: h }))));
        [...new Set(log.map(x => x.id))].forEach(id => { const r = log.filter(x => x.id === id), g = r.filter(x => x.good); tbl.append(el('tr', null, el('td', { text: MF.lessons[id].title }), el('td', { text: `${g.length}/${r.length}` }), el('td', { text: g.length ? (g.reduce((s, x) => s + x.secs, 0) / g.length).toFixed(1) + 's' : '—' }))); });
        const misses = log.filter(x => !x.good);
        host.append(el('div', { class: 'card' },
          el('div', { class: 'row' }, el('div', null, el('div', { class: 'stat-label', text: 'Correct' }), el('div', { class: 'stat', text: `${ok}/${n}` })),
            el('div', { style: 'margin-left:30px' }, el('div', { class: 'stat-label', text: 'Per minute' }), el('div', { class: 'stat', text: rate.toFixed(1) })),
            el('div', { style: 'margin-left:30px' }, el('div', { class: 'stat-label', text: 'Best / min' }), el('div', { class: 'stat', text: Math.max(best, rate).toFixed(1) }))),
          tbl,
          misses.length ? el('div', { class: 'callout warn', html: '<b>Missed</b>' + misses.map(x => `${x.q} = <b>${MF.fmt(x.a, 6)}</b>`).join('<br>') }) : null,
          el('div', { class: 'row' }, el('button', { class: 'btn speed', onclick: () => go() }, 'Again'), el('button', { class: 'btn', onclick: () => MF.route() }, 'Change skills'))));
        MF.renderMath(host);
      }
      nextQ();
    }
  }

  /* ---------- flash anzan ---------- */
  function anzan(host) {
    const p = Object.assign({ digits: 1, count: 5, ms: 900, neg: false, beads: true }, prefs().anzan || {});
    const card = el('div', { class: 'card' });
    card.append(el('p', { class: 'muted small', html: 'Numbers flash one at a time. Keep a running total on an imaginary soroban. Moving beads in your head is the trick. Turn on <i>show beads</i> while you are learning, then switch it off.' }));
    const f = (lab, node) => el('label', null, el('div', { class: 'small muted', text: lab }), node);
    const dg = el('select', null, [1, 2, 3, 4].map(n => el('option', { value: n, text: n + ' digit' + (n > 1 ? 's' : '') }))); dg.value = p.digits;
    const ct = el('input', { type: 'number', min: 2, max: 30, value: p.count });
    const ms = el('input', { type: 'range', min: 200, max: 2000, step: 50, value: p.ms }); const msl = el('b', { text: p.ms + ' ms' }); ms.addEventListener('input', () => { msl.textContent = ms.value + ' ms'; });
    const ng = el('input', { type: 'checkbox' }); ng.checked = p.neg;
    const bd = el('input', { type: 'checkbox' }); bd.checked = p.beads;
    card.append(el('div', { class: 'grid g4' }, f('Digits', dg), f('How many numbers', ct), el('label', null, el('div', { class: 'small muted' }, 'Flash speed ', msl), ms),
      el('div', null, el('label', { class: 'chk small' }, ng, 'Include subtractions'), el('label', { class: 'chk small' }, bd, 'Show beads after each number'))));
    const stage = el('div', { class: 'drill-stage' });
    card.append(el('div', { class: 'row', style: 'margin-top:12px' }, el('button', { class: 'btn speed', onclick: start }, 'Start ▶')), stage);
    host.append(card);

    function start() {
      const cfg = { digits: +dg.value, count: Math.max(2, Math.min(30, +ct.value || 5)), ms: +ms.value, neg: ng.checked, beads: bd.checked };
      savePrefs(Object.assign(prefs(), { anzan: cfg }));
      const lo = cfg.digits === 1 ? 1 : Math.pow(10, cfg.digits - 1), hi = Math.pow(10, cfg.digits) - 1;
      const nums = []; let total = 0;
      for (let i = 0; i < cfg.count; i++) {
        let v = R.int(lo, hi);
        if (cfg.neg && i > 0 && R.rand() < 0.35 && total - v >= 0) v = -v;
        nums.push(v); total += v;
      }
      stage.innerHTML = '';
      const big = el('div', { class: 'flash-num' });
      const cv = el('canvas', { style: 'max-width:520px;margin:0 auto;display:' + (cfg.beads ? 'block' : 'none') });
      stage.append(big, cv);
      const g = cfg.beads ? new MF.Graph(cv, 170) : null;
      const rods = Math.max(3, String(Math.abs(nums.reduce((m, x, i) => Math.max(m, nums.slice(0, i + 1).reduce((s, y) => s + y, 0)), 0))).length + 1);
      let i = 0, run = 0;
      const show = () => {
        if (!document.body.contains(stage)) return;
        if (i >= nums.length) { big.textContent = '?'; ask(); return; }
        const v = nums[i]; run += v;
        big.textContent = ''; setTimeout(() => {
          big.textContent = (v < 0 ? '−' : i > 0 ? '+' : '') + Math.abs(v);
          if (g) { g.resize(); g.clear(); MF.drawSoroban(g, run, rods, {}); }
          i++; setTimeout(show, cfg.ms);
        }, 120);
      };
      if (g) { g.resize(); g.clear(); MF.drawSoroban(g, 0, rods, {}); }
      setTimeout(show, 500);
      const t0 = performance.now();
      function ask() {
        const inp = el('input', { type: 'text', class: 'drill-input', inputmode: 'numeric', placeholder: 'total' });
        const fb = el('div', { style: 'margin-top:12px' });
        const check = () => {
          const r = MF.checkAnswer({ a: total }, inp.value); if (!r.valid) return;
          Store.logActivity(1, r.ok ? 1 : 0);
          fb.innerHTML = (r.ok ? '<b style="color:var(--good)">Correct!</b>' : `<b style="color:var(--bad)">It was ${total}</b>`) + `<div class="small dim" style="margin-top:6px">${nums.map((x, k) => (k ? (x < 0 ? ' − ' : ' + ') : '') + Math.abs(x)).join('')} = ${total}</div>`;
          if (g) { g.clear(); MF.drawSoroban(g, total, rods, {}); cv.style.display = 'block'; }
          fb.append(el('div', { style: 'margin-top:10px' }, el('button', { class: 'btn speed', onclick: start }, 'Next round')));
          inp.disabled = true;
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') check(); });
        if (g) cv.style.display = 'none';
        stage.append(inp, fb); inp.focus();
      }
    }
  }

  /* ---------- adaptive times-table grid ---------- */
  function tables(host) {
    const p = Object.assign({ lo: 2, hi: 12 }, prefs().tables || {});
    const KEYT = 'mathforge.tables';
    let stats; try { stats = JSON.parse(localStorage.getItem(KEYT)) || {}; } catch (e) { stats = {}; }
    const card = el('div', { class: 'card' });
    const lo = el('input', { type: 'number', min: 1, max: 30, value: p.lo }), hi = el('input', { type: 'number', min: 2, max: 30, value: p.hi });
    card.append(el('p', { class: 'muted small', text: 'The grid is a heat-map of your recall speed for every product: green under 2s, amber under 4s, red slower. Problems are picked by weakness, so the red cells come up most.' }));
    card.append(el('div', { class: 'row' }, 'From', lo, 'to', hi, el('span', { class: 'spacer' }), MF.confirmButton('Clear stats', 'Click again to clear', () => { stats = {}; persist(); draw(); }, 'btn ghost sm')));
    const cvBox = el('div', { class: 'viz' }); const cv = el('canvas'); cvBox.append(cv);
    const stage = el('div', { class: 'drill-stage' });
    card.append(cvBox, stage); host.append(card);
    const g = new MF.Graph(cv, 360);
    const range = () => { let a = Math.max(1, Math.min(30, +lo.value || 2)), b = Math.max(a + 1, Math.min(30, +hi.value || 12)); return [a, b]; };
    const persist = () => { try { localStorage.setItem(KEYT, JSON.stringify(stats)); } catch (e) { } savePrefs(Object.assign(prefs(), { tables: { lo: +lo.value, hi: +hi.value } })); };
    const key = (a, b) => Math.min(a, b) + 'x' + Math.max(a, b);
    let cur = null, t0 = 0;
    function draw() {
      const [a, b] = range(), n = b - a + 1;
      g.resize(); g.clear(); g.noPad(); const pad = 26, W = g.W - pad - 4, H = g.H - pad - 4, cw = W / n, ch = H / n;
      for (let i = 0; i < n; i++) {
        g.ptext(String(a + i), pad + cw * (i + .5), pad / 2, { color: MF.colors.muted, size: 11, mono: true });
        g.ptext(String(a + i), pad / 2, pad + ch * (i + .5), { color: MF.colors.muted, size: 11, mono: true });
        for (let j = 0; j < n; j++) {
          const s = stats[key(a + i, a + j)], c = g.ctx;
          let col = '#131a29';
          if (s) { const t = s.t; col = s.miss > 0 && s.streak < 2 ? '#7f1d1d' : t < 2 ? '#065f46' : t < 4 ? '#92400e' : '#9a3412'; }
          if (cur && ((cur[0] === a + i && cur[1] === a + j) || (cur[1] === a + i && cur[0] === a + j))) col = MF.colors.speed;
          c.fillStyle = col; c.fillRect(pad + cw * i + 1, pad + ch * j + 1, cw - 2, ch - 2);
          if (cw > 26 && ch > 16) g.ptext(String((a + i) * (a + j)), pad + cw * (i + .5), pad + ch * (j + .5), { color: s ? '#e6ebf5' : '#3a4766', size: Math.min(12, cw / 3), mono: true });
        }
      }
    }
    function pick() {
      const [a, b] = range(); let best = null, bw = -1;
      for (let i = a; i <= b; i++) for (let j = i; j <= b; j++) {
        const s = stats[key(i, j)]; const w = (s ? (s.t / 2 + (s.miss > 0 && s.streak < 2 ? 3 : 0) + 1 / (1 + s.n)) : 4) * (0.5 + R.rand());
        if (w > bw) { bw = w; best = [i, j]; }
      }
      return R.rand() < 0.5 ? best : [best[1], best[0]];
    }
    const qEl = el('div', { class: 'drill-q' }), inp = el('input', { type: 'text', class: 'drill-input', inputmode: 'numeric' }), fb = el('div', { class: 'small', style: 'min-height:1.5em;margin-top:8px' });
    stage.append(qEl, inp, fb);
    function next() { cur = pick(); t0 = performance.now(); qEl.textContent = `${cur[0]} × ${cur[1]}`; inp.value = ''; draw(); inp.focus({ preventScroll: true }); }
    function rec(ok) {
      const secs = (performance.now() - t0) / 1000, k = key(cur[0], cur[1]);
      const s = stats[k] || (stats[k] = { n: 0, t: 4, miss: 0, streak: 0 });
      s.n++; if (ok) { s.t = s.n === 1 ? secs : s.t * 0.6 + secs * 0.4; s.streak++; } else { s.miss++; s.streak = 0; s.t = Math.max(s.t, 5); }
      persist(); Store.logActivity(1, ok ? 1 : 0);
      fb.innerHTML = ok ? `<span style="color:var(--good)">✓ ${secs.toFixed(1)}s</span>` : `<span style="color:var(--bad)">${cur[0]} × ${cur[1]} = ${cur[0] * cur[1]}</span>`;
      next();
    }
    inp.addEventListener('input', () => { if (inp.value.trim() === String(cur[0] * cur[1])) rec(true); });
    inp.addEventListener('keydown', e => { if (e.key === 'Enter' && inp.value.trim()) rec(inp.value.trim() === String(cur[0] * cur[1])); });
    lo.addEventListener('change', () => { persist(); next(); }); hi.addEventListener('change', () => { persist(); next(); });
    requestAnimationFrame(next);
  }
})(window);
