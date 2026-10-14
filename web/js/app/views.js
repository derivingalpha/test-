/* MathForge views: home, track map, lesson, problem runner, review, reference, progress. */
(function (G) {
  'use strict';
  const MF = G.MF, el = MF.el, Store = MF.Store, fmt = MF.fmt;
  const V = MF.views = {};

  const trackOf = id => MF.tracks[id];
  const lessonsOf = t => MF.lessonOrder[t].map(id => MF.lessons[id]);
  const doneCount = t => MF.lessonOrder[t].filter(Store.isDone).length;
  const nextLesson = t => lessonsOf(t).find(L => !Store.isDone(L.id));

  function setTrackClass(t) { document.body.classList.toggle('track-speed', t === 'speed'); document.body.classList.toggle('track-fe', t === 'fe'); }

  /* ---------------- problem runner ---------------- */
  /**
   * Run a sequence of problems.
   * opts: { items:[lessonId], title, onFinish(results), label:bool, hideScore }
   * results: [{id, ok, secs, target}]
   */
  V.runner = function (host, opts) {
    const box = el('div', { class: 'card practice' });
    host.append(box);
    const results = [];
    let idx = 0;
    const dots = el('div', { class: 'progress-dots' }, opts.items.map(() => el('i')));
    const head = el('div', { class: 'row' }, el('h2', { text: opts.title || 'Practice' }), el('span', { class: 'spacer' }), dots);
    const stage = el('div');
    box.append(head, stage);

    function next() {
      [...dots.children].forEach((d, i) => { d.className = i < results.length ? (results[i].ok ? 'ok' : 'no') : i === idx ? 'cur' : ''; });
      if (idx >= opts.items.length) return finish();
      const id = opts.items[idx], L = MF.lessons[id];
      let p;
      try { p = MF.makeProblem(L); } catch (e) { console.error('problem generator failed', id, e); results.push({ id, ok: true, secs: 0, skipped: true }); idx++; return next(); }
      const t0 = performance.now();
      stage.innerHTML = '';
      const prob = el('div', { class: 'prob' });
      if (opts.label) prob.append(el('div', { class: 'small dim' }, el('a', { href: '#/lesson/' + id, text: L.title }), ' · ', trackOf(L.track).title));
      const q = el('div', { class: 'q', html: p.q }); prob.append(q);
      const fb = el('div');
      const timer = el('span', { class: 'timer' });
      const timed = L.track === 'speed';
      let tick = 0, answered = false;
      if (timed) { tick = setInterval(() => { if (!document.body.contains(timer)) return clearInterval(tick); timer.textContent = ((performance.now() - t0) / 1000).toFixed(1) + 's' + (p.target ? ` / target ${p.target}s` : ''); }, 100); }
      const done = (ok, given) => {
        if (answered) return; answered = true; clearInterval(tick);
        const secs = (performance.now() - t0) / 1000;
        results.push({ id, ok, secs, target: p.target });
        Store.logActivity(1, ok ? 1 : 0);
        fb.className = 'feedback ' + (ok ? 'ok' : 'no');
        const ans = p.choices ? p.choices[p.a] : (p.show != null ? p.show : fmt(p.a, 6));
        fb.innerHTML = `<b>${ok ? 'Correct' : 'Not quite'}</b>${timed ? ` <span class="timer">· ${secs.toFixed(1)}s</span>` : ''}${ok ? '' : ` — answer: <b>${ans}</b>`}` + (p.sol ? `<div class="sol">${p.sol}</div>` : '');
        MF.renderMath(fb);
        const nb = el('button', { class: 'btn primary', onclick: () => { idx++; next(); } }, idx + 1 >= opts.items.length ? 'Finish' : 'Next →');
        fb.append(el('div', { style: 'margin-top:10px' }, nb));
        setTimeout(() => nb.focus(), 30);
        [...dots.children][idx].className = ok ? 'ok' : 'no';
      };
      if (p.choices) {
        const ch = el('div', { class: 'choices' });
        p.choices.forEach((c, i) => {
          const b = el('button', { class: 'btn choice', html: c, onclick: () => {
            if (answered) return;
            b.classList.add(i === p.a ? 'right' : 'wrong'); ch.children[p.a].classList.add('right'); done(i === p.a);
          } });
          ch.append(b);
        });
        prob.append(ch); MF.renderMath(ch);
        if (timed) prob.append(el('div', { class: 'row', style: 'margin-top:8px' }, timer));
      } else {
        const inp = el('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', placeholder: p.placeholder || 'Your answer' });
        const msg = el('span', { class: 'small dim' });
        const check = () => {
          if (answered) return;
          const r = MF.checkAnswer(p, inp.value);
          if (!r.valid) { msg.textContent = 'Enter a number (fractions like 3/4, 1e-3, % and arithmetic are fine).'; return; }
          done(r.ok, inp.value);
        };
        inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); check(); } });
        const row = el('div', { class: 'ans-row' }, inp, p.unit ? el('span', { class: 'muted', html: p.unit }) : null,
          el('button', { class: 'btn primary', onclick: check }, 'Check'),
          el('button', { class: 'btn ghost hint-btn', onclick: () => done(false) }, 'Show solution'),
          timed ? timer : null);
        prob.append(row, msg);
        if (p.hint) { const hb = el('button', { class: 'btn sm ghost', onclick: () => { hb.replaceWith(el('div', { class: 'callout tip small', html: '<b>Hint</b>' + p.hint })); MF.renderMath(prob); } }, 'Hint'); prob.append(el('div', { style: 'margin-top:6px' }, hb)); }
        setTimeout(() => inp.focus({ preventScroll: true }), 30);
      }
      prob.append(fb);
      stage.append(prob);
      MF.renderMath(q);
    }
    function finish() {
      stage.innerHTML = '';
      const ok = results.filter(r => r.ok).length;
      if (!opts.hideScore) stage.append(el('div', { class: 'prob' }, el('div', { class: 'big-num', text: `${ok} / ${results.length}` })));
      if (opts.onFinish) opts.onFinish(results, stage);
    }
    next();
    return box;
  };

  /* ---------------- home ---------------- */
  V.home = function (app) {
    setTrackClass(null);
    const due = Store.dueCards();
    const hero = el('div', { class: 'hero' },
      el('h1', { html: 'Master <span class="grad">speed math</span> and <span class="grad">quant finance math</span>' }),
      el('p', { class: 'muted lead', text: 'Interactive lessons you can push and pull, infinitely generated practice, and a spaced-repetition engine that brings each skill back just before you forget it.' }));
    app.append(hero);

    const today = el('div', { class: 'card', style: 'margin:18px 0' });
    const st = Store.streak();
    today.append(el('div', { class: 'row' },
      el('div', null, el('div', { class: 'stat-label', text: 'Due for review' }), el('div', { class: 'stat', text: due.length })),
      el('div', { style: 'margin-left:28px' }, el('div', { class: 'stat-label', text: 'Day streak' }), el('div', { class: 'stat', text: st + (st ? ' 🔥' : '') })),
      el('div', { style: 'margin-left:28px' }, el('div', { class: 'stat-label', text: 'Lessons done' }), el('div', { class: 'stat', text: doneCount('speed') + doneCount('fe') })),
      el('span', { class: 'spacer' }),
      due.length ? el('a', { class: 'btn primary', href: '#/review' }, `Start review (${due.length})`) : el('span', { class: 'muted small', text: 'Nothing due. Learn something new below.' }),
      el('a', { class: 'btn speed', href: '#/drills' }, 'Speed drills')));
    app.append(today);

    const grid = el('div', { class: 'grid g2' });
    for (const t of ['speed', 'fe']) {
      const T = trackOf(t), n = MF.lessonOrder[t].length, d = doneCount(t), nx = nextLesson(t);
      const dueT = Store.dueCards(t).length;
      grid.append(el('a', { class: `card trackcard ${t}`, href: '#/track/' + t },
        el('div', { class: 'glow' }),
        el('span', { class: 'pill ' + t, text: T.tag }),
        el('h2', { text: T.title }),
        el('p', { class: 'muted small', text: T.blurb }),
        el('div', { class: 'row small muted', style: 'margin:10px 0 6px' }, `${d} / ${n} lessons · ${T.units.length} units`, el('span', { class: 'spacer' }), dueT ? el('span', { class: 'pill warn', text: dueT + ' due' }) : null),
        el('div', { class: 'bar ' + t }, el('i', { style: `width:${n ? (100 * d / n) : 0}%` })),
        nx ? el('p', { class: 'small', style: 'margin-top:12px' }, el('span', { class: 'dim', text: 'Up next: ' }), nx.title) : el('p', { class: 'small', text: 'Track complete. Keep reviewing.' })));
    }
    app.append(grid);

    app.append(el('h2', { text: 'How MathForge teaches' }));
    app.append(el('div', { class: 'grid g4' },
      info('See it', 'Each idea comes with an interactive visual: area models, number lines, abacus beads, price curves, simulated paths.'),
      info('Retrieve it', 'Every lesson ends with freshly generated problems, so you recall and apply instead of rereading.'),
      info('Space it', 'Finished lessons become review cards. Intervals grow (1 → 3 → 8 → 20+ days) as long as you keep remembering.'),
      info('Interleave it', 'Reviews mix topics from both tracks, which builds the skill of choosing the right method.')));
    function info(t, s) { return el('div', { class: 'card' }, el('h3', { style: 'margin-top:0', text: t }), el('p', { class: 'muted small', text: s })); }
  };

  /* ---------------- track ---------------- */
  V.track = function (app, t) {
    const T = trackOf(t); if (!T) return V.notFound(app);
    setTrackClass(t);
    const cards = Store.data.cards, now = Date.now();
    app.append(el('div', { class: 'crumbs' }, el('a', { href: '#/', text: 'Home' }), ' / ', T.title));
    app.append(el('h1', { text: T.title }));
    app.append(el('p', { class: 'muted', text: T.blurb }));
    const n = MF.lessonOrder[t].length, d = doneCount(t);
    const search = el('input', { type: 'text', class: 'search', placeholder: 'Filter lessons…' });
    const nx = nextLesson(t);
    app.append(el('div', { class: 'row', style: 'margin:14px 0' },
      el('div', { style: 'min-width:220px' }, el('div', { class: 'small muted', text: `${d} of ${n} lessons complete` }), el('div', { class: 'bar ' + t }, el('i', { style: `width:${n ? 100 * d / n : 0}%` }))),
      el('span', { class: 'spacer' }), search,
      nx ? el('a', { class: 'btn ' + (t === 'speed' ? 'speed' : 'primary'), href: '#/lesson/' + nx.id }, d ? 'Continue' : 'Start') : null));
    const wrap = el('div'); app.append(wrap);
    const render = () => {
      wrap.innerHTML = ''; const f = search.value.trim().toLowerCase();
      T.units.forEach((U, ui) => {
        const ls = U.lessons.map(id => MF.lessons[id]).filter(L => !f || (L.title + ' ' + (L.summary || '')).toLowerCase().includes(f));
        if (!ls.length) return;
        const grid = el('div', { class: 'lessons' });
        ls.forEach(L => {
          const c = cards[L.id], done = Store.isDone(L.id), isDue = c && c.due <= now;
          grid.append(el('a', { class: 'lesson-tile' + (done ? ' done' : ''), href: '#/lesson/' + L.id },
            el('div', { class: 't', text: L.title }), el('div', { class: 's', text: L.summary || '' }),
            el('div', { class: 'meta' }, `${L.minutes} min`, L.drill ? el('span', { class: 'pill speed', text: 'drill' }) : null,
              el('span', { class: 'spacer' }), c ? el('span', { class: 'dot ' + (isDue ? 'due' : 'ok'), title: isDue ? 'due for review' : `next review in ${Math.max(1, Math.round((c.due - now) / 86400000))}d` }) : null)));
        });
        const uDone = U.lessons.filter(Store.isDone).length;
        wrap.append(el('section', { class: 'unit' },
          el('div', { class: 'unit-head' }, el('span', { class: 'unit-num', text: 'UNIT ' + (ui + (t === 'fe' ? 0 : 1)) }), el('h2', { text: U.title }), el('span', { class: 'dim small', text: `${uDone}/${U.lessons.length}` })),
          U.blurb ? el('p', { class: 'muted small', style: 'margin-top:0', text: U.blurb }) : null, grid));
      });
    };
    search.addEventListener('input', render); render();
  };

  /* ---------------- lesson ---------------- */
  V.lesson = function (app, id) {
    const L = MF.lessons[id]; if (!L) return V.notFound(app);
    const T = trackOf(L.track); setTrackClass(L.track);
    const order = MF.lessonOrder[L.track], i = order.indexOf(id);
    const prev = MF.lessons[order[i - 1]], next = MF.lessons[order[i + 1]];
    app.append(el('div', { class: 'crumbs' }, el('a', { href: '#/', text: 'Home' }), ' / ', el('a', { href: '#/track/' + L.track, text: T.title }), ' / ', L.unitTitle));
    const body = el('article', { class: 'lesson-body' });
    body.append(el('h1', { text: L.title }));
    body.append(el('div', { class: 'row small muted' }, el('span', { class: 'pill ' + L.track, text: L.unitTitle }), `${L.minutes} min`,
      Store.isDone(id) ? el('span', { class: 'pill good', text: 'completed' }) : null));
    if (L.summary) body.append(el('p', { class: 'lead', text: L.summary }));
    (L.sections || []).forEach(s => {
      const sec = el('div', { class: 'section' });
      if (typeof s === 'string') sec.innerHTML = s;
      else if (s.viz) { try { s.viz(sec); } catch (e) { console.error('viz failed', id, e); sec.append(el('div', { class: 'callout warn', text: 'This visual failed to load.' })); } }
      else if (s.callout) { sec.innerHTML = `<div class="callout ${s.callout}"><b>${s.title || { tip: 'Speed tip', key: 'Key idea', warn: 'Watch out' }[s.callout] || 'Note'}</b>${s.html}</div>`; }
      body.append(sec);
    });
    if (L.formulas && L.formulas.length) {
      body.append(el('h2', { text: 'Key formulas' }));
      body.append(el('div', { class: 'formulas' }, L.formulas.map(f => el('div', { class: 'f', html: '$$' + f + '$$' }))));
    }
    app.append(body);
    MF.renderMath(body);

    const pr = el('div', { class: 'lesson-body' }); app.append(pr);
    const N = L.practiceCount || 5;
    const start = () => {
      pr.innerHTML = '';
      V.runner(pr, {
        items: new Array(N).fill(id), title: 'Practice',
        onFinish(res, stage) {
          const ok = res.filter(r => r.ok).length, pass = ok >= Math.ceil(N * 0.8);
          if (pass) { Store.completeLesson(id, ok / N); }
          stage.append(el('p', { html: pass ? `Lesson complete. It is now in your review deck and will come back <b>tomorrow</b>, then at growing intervals.` : `You need ${Math.ceil(N * 0.8)}/${N} to complete the lesson. Go back over the visual and try a fresh set.` }));
          stage.append(el('div', { class: 'row' },
            el('button', { class: 'btn', onclick: start }, 'New set'),
            !pass ? el('button', { class: 'btn ghost', onclick: () => { Store.completeLesson(id, ok / N); location.hash = next ? '#/lesson/' + next.id : '#/track/' + L.track; } }, 'Mark complete anyway') : null,
            next ? el('a', { class: 'btn primary', href: '#/lesson/' + next.id }, 'Next lesson →') : el('a', { class: 'btn primary', href: '#/track/' + L.track }, 'Back to track')));
        },
      });
    };
    start();

    app.append(el('div', { class: 'lesson-nav lesson-body' },
      prev ? el('a', { class: 'btn ghost', href: '#/lesson/' + prev.id }, '← ' + prev.title) : el('span'),
      next ? el('a', { class: 'btn ghost', href: '#/lesson/' + next.id }, next.title + ' →') : el('span')));
  };

  /* ---------------- review ---------------- */
  V.review = function (app) {
    setTrackClass(null);
    const s = Store.data.settings;
    let due = Store.dueCards().slice(0, s.dailyReviews || 40);
    app.append(el('h1', { text: 'Spaced review' }));
    if (!due.length) {
      const done = Object.keys(Store.data.lessons).filter(id => MF.lessons[id] && Store.isDone(id));
      const f = Store.forecast(7);
      app.append(el('div', { class: 'card' },
        el('p', { html: `<b>All caught up.</b> ${f[1] ? `${f[1]} card${f[1] > 1 ? 's' : ''} due tomorrow.` : ''}` }),
        el('p', { class: 'muted small', text: 'Reviewing on schedule matters more than reviewing a lot. If you want extra practice now, run an interleaved mix. It does not change your schedule.' }),
        done.length ? el('button', { class: 'btn', onclick: () => run(R_mix(done), false) }, 'Interleaved practice mix') : el('a', { class: 'btn primary', href: '#/track/speed' }, 'Complete a lesson to start your deck')));
      return;
    }
    app.append(el('p', { class: 'muted', html: `${due.length} skill${due.length > 1 ? 's' : ''} due. Each one gets ${s.problemsPerReview} fresh problems, shuffled across topics. Accuracy (and speed, for speed-math skills) sets the next interval.` }));
    run(due, true);

    function R_mix(ids) { return MF.R.shuffle(ids).slice(0, 10); }
    function run(ids, schedule) {
      const k = s.problemsPerReview || 3;
      let items = []; ids.forEach(id => { for (let j = 0; j < k; j++) items.push(id); });
      items = MF.R.shuffle(items);
      // avoid same skill twice in a row where possible
      for (let a = 1; a < items.length; a++) if (items[a] === items[a - 1]) { const b = items.findIndex((x, j) => j > a && x !== items[a] && x !== items[a - 1]); if (b > 0) [items[a], items[b]] = [items[b], items[a]]; }
      const host = el('div'); app.append(host);
      V.runner(host, {
        items, title: schedule ? 'Review' : 'Practice mix', label: true,
        onFinish(res, stage) {
          if (!schedule) { stage.append(el('a', { class: 'btn', href: '#/' }, 'Home')); return; }
          const tbl = el('table', null, el('tr', null, el('th', { text: 'Skill' }), el('th', { text: 'Score' }), el('th', { text: 'Next review' })));
          ids.forEach(id => {
            const r = res.filter(x => x.id === id), ok = r.filter(x => x.ok).length, acc = ok / r.length;
            let grade;
            if (acc < 0.5) grade = 1; else if (acc < 1) grade = 3;
            else {
              const L = MF.lessons[id], tg = L.target;
              if (L.track === 'speed' && tg) { const avg = M_avg(r.map(x => x.secs)); grade = avg <= tg ? 5 : avg <= 2 * tg ? 4 : 3; } else grade = 4;
            }
            const c = Store.review(id, grade);
            const when = grade < 3 ? 'again soon' : c.ivl === 1 ? 'tomorrow' : `in ${c.ivl} days`;
            tbl.append(el('tr', null, el('td', null, el('a', { href: '#/lesson/' + id, text: MF.lessons[id].title })), el('td', { text: `${ok}/${r.length}` }), el('td', { text: when })));
          });
          stage.append(tbl, el('div', { class: 'row' }, el('a', { class: 'btn primary', href: '#/' }, 'Done'), Store.dueCards().length ? el('button', { class: 'btn', onclick: () => MF.route() }, 'Continue reviewing') : null));
          MF.updateBadge();
        },
      });
    }
    function M_avg(a) { return a.reduce((x, y) => x + y, 0) / a.length; }
  };

  /* ---------------- reference ---------------- */
  V.reference = function (app, t) {
    setTrackClass(null);
    t = t || 'fe';
    app.append(el('h1', { text: 'Formula reference' }));
    app.append(el('div', { class: 'tabs' }, ['fe', 'speed'].map(k => el('a', { class: 'btn sm' + (k === t ? ' on' : ''), href: '#/reference/' + k, text: trackOf(k).title }))));
    const search = el('input', { type: 'text', class: 'search', placeholder: 'Filter by lesson…' });
    app.append(search);
    const wrap = el('div'); app.append(wrap);
    const render = () => {
      wrap.innerHTML = ''; const f = search.value.toLowerCase();
      trackOf(t).units.forEach(U => {
        const ls = U.lessons.map(id => MF.lessons[id]).filter(L => L.formulas && L.formulas.length && (!f || L.title.toLowerCase().includes(f) || U.title.toLowerCase().includes(f)));
        if (!ls.length) return;
        const sec = el('section', null, el('h2', { text: U.title }));
        ls.forEach(L => sec.append(el('div', { class: 'ref-lesson' }, el('h4', null, el('a', { href: '#/lesson/' + L.id, text: L.title })), el('div', { class: 'formulas' }, L.formulas.map(x => el('div', { class: 'f', html: '$$' + x + '$$' }))))));
        wrap.append(sec);
      });
      MF.renderMath(wrap);
    };
    search.addEventListener('input', render); render();
  };

  /* ---------------- progress ---------------- */
  V.progress = function (app) {
    setTrackClass(null);
    const d = Store.data;
    app.append(el('h1', { text: 'Progress' }));
    const grid = el('div', { class: 'grid g4' });
    const cards = Object.keys(d.cards).filter(id => MF.lessons[id]);
    const mature = cards.filter(id => d.cards[id].ivl >= 21).length;
    const days = Object.values(d.days), totalN = days.reduce((s, x) => s + x.n, 0), totalC = days.reduce((s, x) => s + x.c, 0);
    [['Speed lessons', `${doneCount('speed')}/${MF.lessonOrder.speed.length}`], ['FE lessons', `${doneCount('fe')}/${MF.lessonOrder.fe.length}`],
      ['Review cards', `${cards.length} (${mature} mature)`], ['Problems solved', `${totalN} · ${totalN ? Math.round(100 * totalC / totalN) : 0}% right`]]
      .forEach(([k, v]) => grid.append(el('div', { class: 'card' }, el('div', { class: 'stat-label', text: k }), el('div', { class: 'stat', style: 'font-size:1.4rem', text: v }))));
    app.append(grid);

    // heat-map (last 20 weeks)
    app.append(el('h2', { text: 'Activity' }));
    const heat = el('div', { class: 'heat' }); const t = new Date(); t.setHours(0, 0, 0, 0);
    const startD = new Date(t); startD.setDate(t.getDate() - 7 * 20 - t.getDay());
    for (let x = new Date(startD); x <= t; x.setDate(x.getDate() + 1)) {
      const k = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`, n = d.days[k] ? d.days[k].n : 0;
      heat.append(el('i', { class: n === 0 ? '' : n < 10 ? 'l1' : n < 25 ? 'l2' : n < 60 ? 'l3' : 'l4', title: `${k}: ${n} problems` }));
    }
    app.append(el('div', { class: 'card', style: 'overflow-x:auto' }, heat, el('div', { class: 'small dim', style: 'margin-top:8px', text: `Current streak: ${Store.streak()} day(s)` })));

    // forecast chart
    app.append(el('h2', { text: 'Review forecast (next 14 days)' }));
    const fc = Store.forecast(14);
    const fh = el('div'); app.append(fh);
    MF.figure(fh, { height: 200, draw(g) {
      const mx = Math.max(4, ...fc);
      g.view(-0.5, 13.5, 0, mx * 1.15).axes({ xstep: 1, fx: v => v === 0 ? 'today' : '+' + v, ystep: Math.max(1, MF.Graph.niceStep(mx, 4)) });
      fc.forEach((n, i) => g.rect(i - 0.35, 0, 0.7, n, { fill: MF.colors.alpha(MF.colors.fe, 0.6), color: MF.colors.fe, width: 1 }));
    } });

    // drill stats
    const ds = Object.keys(d.drills).filter(k => MF.lessons[k]);
    if (ds.length) {
      app.append(el('h2', { text: 'Speed drill records' }));
      const tbl = el('table', null, el('tr', null, ['Skill', 'Attempts', 'Accuracy', 'Avg time', 'Best'].map(h => el('th', { text: h }))));
      ds.forEach(k => { const s = d.drills[k]; tbl.append(el('tr', null, el('td', { text: MF.lessons[k].title }), el('td', { text: s.n }), el('td', { text: Math.round(100 * s.c / s.n) + '%' }), el('td', { text: s.c ? (s.t / s.c).toFixed(1) + 's' : '—' }), el('td', { text: s.best != null ? s.best.toFixed(1) + 's' : '—' }))); });
      app.append(tbl);
    }

    // settings
    app.append(el('h2', { text: 'Settings' }));
    const cap = el('input', { type: 'number', min: 5, max: 500, value: d.settings.dailyReviews });
    const ppr = el('select', null, [2, 3, 4, 5].map(n => el('option', { value: n, text: n })));
    ppr.value = d.settings.problemsPerReview;
    const save = () => { d.settings.dailyReviews = Math.max(5, parseInt(cap.value) || 40); d.settings.problemsPerReview = parseInt(ppr.value); Store.save(); };
    cap.addEventListener('change', save); ppr.addEventListener('change', save);
    app.append(el('div', { class: 'card grid g2' },
      el('label', null, el('div', { class: 'small muted', text: 'Max reviews per session' }), cap),
      el('label', null, el('div', { class: 'small muted', text: 'Problems per review card' }), ppr)));

    // data
    app.append(el('h2', { text: 'Your data' }));
    const file = el('input', { type: 'file', accept: 'application/json', style: 'display:none' });
    file.addEventListener('change', () => { const f = file.files[0]; if (!f) return; f.text().then(txt => { try { Store.importJSON(txt); alert('Progress imported.'); MF.route(); } catch (e) { alert('Import failed: ' + e.message); } }); });
    app.append(el('div', { class: 'card' },
      el('p', { class: 'muted small', text: 'Progress is stored only in this browser (localStorage). Export a backup file to move it to another device.' }),
      el('div', { class: 'row' },
        el('button', { class: 'btn', onclick: () => { const b = new Blob([Store.exportJSON()], { type: 'application/json' }); const a = el('a', { href: URL.createObjectURL(b), download: `mathforge-progress-${Store.today()}.json` }); document.body.append(a); a.click(); a.remove(); } }, 'Export progress'),
        el('button', { class: 'btn', onclick: () => file.click() }, 'Import progress'), file,
        el('span', { class: 'spacer' }),
        el('button', { class: 'btn ghost', style: 'color:var(--bad)', onclick: () => { if (confirm('Erase all progress on this device?')) { Store.reset(); MF.route(); } } }, 'Reset everything'))));
  };

  V.notFound = function (app) { app.append(el('h1', { text: 'Not found' }), el('p', null, el('a', { href: '#/', text: 'Go home' }))); };
})(window);
