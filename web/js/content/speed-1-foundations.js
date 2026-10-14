/* Speed Math · Unit 1: number sense foundations */
(function () {
  'use strict';
  const { h, R, M, fmt, colors: C } = MF;

  MF.unit('speed', 'sm-u1', 'Number Sense Foundations', 'The mental "hardware": complements, place-value chunks, the imaginary abacus and instant tables.');

  /* ---------- complements ---------- */
  MF.lesson({
    id: 'sm-complements', title: 'Complements: friends of 10, 100, 1000', minutes: 8,
    summary: 'See any number as a gap to the next power of ten. "All from 9, the last from 10."',
    sections: [
      h`<p>Fast calculators don't count. They <b>see gaps</b>. The complement of a number is how far it is from the next round number: the complement of 7 (to 10) is 3, of 64 (to 100) is 36, of 683 (to 1000) is 317.</p>
      <p>Complements are the hidden gear behind fast subtraction, making change, near-base multiplication and the soroban. Learn to see them instantly.</p>`,
      { viz: host => MF.explore(host, {
        title: 'The gap to 100', height: 150,
        params: [{ id: 'n', label: 'Number', min: 1, max: 99, step: 1, value: 64, fmt: v => v }],
        draw(g, p) {
          g.view(0, 100, 0, 1, { l: 16, r: 16, t: 20, b: 34 });
          const n = p.n;
          g.rect(0, 0.25, n, 0.5, { fill: C.alpha(C.speed, 0.75), label: String(n), labelColor: '#1d0e02' });
          g.rect(n, 0.25, 100 - n, 0.5, { fill: C.alpha(C.fe, 0.55), label: String(100 - n), labelColor: '#04121a' });
          for (let x = 0; x <= 100; x += 10) { g.line(x, 0.18, x, 0.25, { color: C.dim, width: 1 }); g.text(String(x), x, 0.08, { color: C.dim, size: 10, mono: true }); }
        },
        info: p => { const t = Math.floor(p.n / 10), u = p.n % 10; return u ? h`Complement of <b>${p.n}</b> is <b>${100 - p.n}</b>. Tens: $9-${t}=${9 - t}$, ones: $10-${u}=${10 - u}$.` : h`Complement of <b>${p.n}</b> is <b>${100 - p.n}</b>. The last digit is 0, so the tens digit is the "last" one: $10-${t}=${10 - t}$, and the ones stay 0.`; },
      }) },
      h`<h3>The rule: all from 9, the last from 10</h3>
      <p>To find the complement to $10^k$, subtract every digit from 9 except the last non-zero one, which you subtract from 10.</p>
      <p>$1000 - 683$: $9-6=3$, $9-8=1$, $10-3=7$, so the answer is <b>317</b>. No borrowing, left to right.</p>
      <p>$10000 - 4270$: trailing zeros stay zero. Use $9-4,\ 9-2,\ 10-7$, then 0. The answer is <b>5730</b>.</p>`,
      { callout: 'tip', html: 'Making change: 1000 − 386 is "6, 1, 4" read left to right. Train your eye to emit the complement digits as you read the number.' },
      h`<h3>Complements to any base</h3><p>The idea works for any round number. $500-237$: think $1000-237 = 763$, then remove $500$ to get $263$. Or go digit by digit: 237 to 240 is 3, 240 to 300 is 60, 300 to 500 is 200, total 263. The second way is "adding up", which you'll meet in the subtraction lesson.</p>`,
    ],
    formulas: [h`\overline{d_1d_2\dots d_k} \to (9-d_1)(9-d_2)\dots(10-d_k)`, h`10^k - n = (\underbrace{99\dots9}_{k} - n) + 1`],
    target: 3,
    drill() {
      const k = R.pick([2, 3, 3, 4]); const base = 10 ** k; const n = R.int(base / 10 + 1, base - 1);
      return { q: `${base} − ${n}`, a: base - n, sol: h`All from 9, last from 10: digits of ${n} → ${base - n}.` };
    },
  });

  /* ---------- chunking / place value ---------- */
  MF.lesson({
    id: 'sm-chunks', title: 'Seeing numbers as chunks', minutes: 8,
    summary: 'Break numbers into friendly parts (hundreds, tens, ones, or "near tens") so mental operations become one-step jumps.',
    sections: [
      h`<p>A number like 368 is not a string of digits. It's <b>3 hundreds + 6 tens + 8 ones</b>, or <b>370 − 2</b>, or <b>400 − 32</b>. The fastest mental calculators keep several decompositions ready and pick the one that makes the next step trivial.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Base-ten blocks', height: 230,
        params: [{ id: 'n', label: 'Number', min: 1, max: 999, step: 1, value: 368, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const n = p.n, H = Math.floor(n / 100), T = Math.floor(n / 10) % 10, O = n % 10, c = g.ctx;
          const s = Math.min(9, (g.W - 60) / 190); let x = 14;
          const sq = (x, y, col) => { c.fillStyle = col; c.fillRect(x, y, s - 1, s - 1); };
          for (let i = 0; i < H; i++) { for (let a = 0; a < 10; a++) for (let b = 0; b < 10; b++) sq(x + a * s, 20 + b * s, C.alpha(C.speed, 0.85)); x += 10 * s + 8; }
          x += 6; for (let i = 0; i < T; i++) { for (let b = 0; b < 10; b++) sq(x, 20 + b * s, C.alpha(C.fe, 0.85)); x += s + 4; }
          x += 10; for (let i = 0; i < O; i++) sq(x + (i % 3) * (s + 1), 20 + Math.floor(i / 3) * (s + 1), C.pink);
          g.ptext(`${H} hundreds · ${T} tens · ${O} ones`, g.W / 2, 20 + 10 * s + 30, { color: C.muted, size: 13 });
        },
        info: p => { const n = p.n, up = Math.ceil(n / 10) * 10, up2 = Math.ceil(n / 100) * 100; return h`Decompositions: <b>${n}</b> = ${Math.floor(n / 100) * 100} + ${Math.floor(n / 10) % 10 * 10} + ${n % 10} = ${up} − ${up - n} = ${up2} − ${up2 - n}`; },
      }) },
      h`<h3>Three moves that power everything</h3><ol>
      <li><b>Split</b> by place value: $368 + 245 = 368 + 200 + 40 + 5$.</li>
      <li><b>Round and adjust</b> (compensation): $368 + 199 = 368 + 200 - 1$.</li>
      <li><b>Factor</b>: $36 \times 25 = 9 \times 4 \times 25 = 9 \times 100$.</li></ol>
      <p>Always ask: <i>which form of this number makes the operation easiest?</i></p>`,
      { callout: 'key', html: 'Prefer the decomposition with the <b>fewest non-zero digits</b>. Numbers like 300, 40, 2 and 400−2 are cheap; 368 is expensive.' },
    ],
    formulas: [h`n = 100h + 10t + u`, h`a + b = a + (\lceil b \rceil) - (\lceil b \rceil - b)`],
    target: 4,
    drill() {
      const t = R.pick(['round', 'factor', 'split']);
      if (t === 'round') { const a = R.int(120, 880), b = R.pick([99, 199, 299, 98, 198, 49, 149]); const up = Math.ceil(b / 10) * 10; return { q: `${a} + ${b}`, a: a + b, sol: h`${a} + ${b} = ${a} + ${up} − ${up - b} = ${a + b}` }; }
      if (t === 'factor') { const k = R.pick([4, 8, 12, 16, 24, 28, 32, 36, 44, 48]), m = R.pick([25, 25, 50]); return { q: `${k} × ${m}`, a: k * m, sol: h`${k} × ${m} = ${k / (100 / m)} × 100 = ${k * m}` }; }
      const a = R.int(100, 899), b = R.int(100, 899); return { q: `${a} + ${b}`, a: a + b, sol: h`${a} + ${Math.floor(b / 100) * 100} = ${a + Math.floor(b / 100) * 100}, then + ${b % 100} = ${a + b}` };
    },
  });

  /* ---------- soroban ---------- */
  MF.lesson({
    id: 'sm-soroban', title: 'The mental abacus (soroban & anzan)', minutes: 15,
    summary: 'Represent numbers as beads: one heaven bead (5) and four earth beads (1 each) per rod. Then move them in your imagination.',
    sections: [
      h`<p>The Japanese <b>soroban</b> encodes each digit with one upper bead worth 5 and four lower beads worth 1. Expert users stop using the physical abacus and move the beads in their imagination. This is <b>anzan</b>, and it lets children add long columns of numbers flashed for a fraction of a second.</p>
      <p>Anzan works because it turns arithmetic into a <b>visual-spatial</b> task. Each digit is a picture of beads, and adding is moving them. You don't recall facts. You move beads using a few complement rules.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Soroban: dial a number', height: 230,
        params: [{ id: 'n', label: 'Value', min: 0, max: 99999, step: 1, value: 4072, type: 'number' }],
        draw(g, p) { g.noPad(); MF.drawSoroban(g, p.n, 5, { labels: true }); },
        info: p => { const d = String(p.n).padStart(5, '0').split('').map(Number); return 'Each rod: ' + d.map(x => `${x} = ${x >= 5 ? '5' + (x > 5 ? '+' + (x - 5) : '') : x === 0 ? 'none' : '1×' + x}`).join(' · '); },
      }) },
      h`<h3>Adding on the soroban</h3>
      <p>To add a digit on a rod you either push beads directly or, when there aren't enough, use a <b>complement</b>:</p>
      <ul><li><b>Direct:</b> 2 + 2: push two more earth beads.</li>
      <li><b>Five-complement:</b> 3 + 4: there aren't 4 earth beads free, so add 5 (heaven bead) and remove 1. Rule: <i>+4 = +5 − 1</i>.</li>
      <li><b>Ten-complement:</b> 7 + 6: add 10 (one bead on the next rod left) and remove 4. Rule: <i>+6 = +10 − 4</i>.</li>
      <li><b>Combined:</b> 6 + 7 = +10 − 3, but removing 3 from the 6 rod needs −5 + 2.</li></ul>`,
      { viz: host => MF.walk(host, {
        title: 'Step through an addition', height: 220,
        inputs: [{ id: 'a', label: 'Start', value: 37, min: 0, max: 9999 }, { id: 'b', label: 'Add', value: 48, min: 0, max: 9999 }],
        random: () => ({ a: R.int(10, 99), b: R.int(10, 99) }),
        frames({ a, b }) {
          a = Math.round(a); b = Math.round(b);
          const rods = Math.max(3, String(a + b).length + 1);
          const fr = [{ draw: g => { g.noPad(); MF.drawSoroban(g, a, rods, { labels: true }); }, say: `Set <b>${a}</b> on the abacus.` }];
          const ds = String(b).split('').map(Number); let cur = a;
          ds.forEach((d, i) => {
            const place = 10 ** (ds.length - 1 - i); if (!d) return;
            const rod = rods - 1 - (ds.length - 1 - i), have = Math.floor(cur / place) % 10;
            let how;
            if (have + d >= 10) how = `ten-complement: +${d} = +10 − ${10 - d}`;
            else if (have < 5 && have + d >= 5) how = d < 5 ? `five-complement: +${d} = +5 − ${5 - d}` : d === 5 ? 'bring down the heaven bead (+5)' : `heaven bead (+5) and ${d - 5} earth bead${d > 6 ? 's' : ''}`;
            else how = 'push beads directly';
            const next = cur + d * place, n2 = cur;
            fr.push({ draw: g => { g.noPad(); MF.drawSoroban(g, next, rods, { labels: true, highlight: rod }); }, say: `Add <b>${d * place}</b> on the ${['ones', 'tens', 'hundreds', 'thousands'][ds.length - 1 - i]} rod (${have} + ${d}): ${how}. ${n2} → <b>${next}</b>` });
            cur = next;
          });
          fr.push({ draw: g => { g.noPad(); MF.drawSoroban(g, cur, rods, { labels: true }); }, say: `Read off the beads: <b>${a} + ${b} = ${cur}</b>.` });
          return fr;
        },
      }) },
      { callout: 'tip', html: 'Practice Flash Anzan in <a href="#/drills/anzan">Drills → Flash Anzan</a>. Start with 1-digit numbers at 1 s each with beads shown, then hide the beads. Add a digit when you hit 90% accuracy.' },
      h`<h3>The complement table to memorise</h3>
      <table><tr><th>Add</th><th>Five-complement</th><th>Ten-complement</th></tr>
      <tr><td>+1</td><td>+5 −4</td><td>+10 −9</td></tr><tr><td>+2</td><td>+5 −3</td><td>+10 −8</td></tr><tr><td>+3</td><td>+5 −2</td><td>+10 −7</td></tr><tr><td>+4</td><td>+5 −1</td><td>+10 −6</td></tr>
      <tr><td>+6</td><td>—</td><td>+10 −4</td></tr><tr><td>+7</td><td>—</td><td>+10 −3</td></tr><tr><td>+8</td><td>—</td><td>+10 −2</td></tr><tr><td>+9</td><td>—</td><td>+10 −1</td></tr></table>`,
    ],
    formulas: [h`d = 5h + e,\quad h\in\{0,1\},\ e\in\{0,\dots,4\}`, h`+k = +10 - (10-k)`, h`+k = +5 - (5-k)`],
    target: 6,
    drill() { const n = R.int(3, 5); const xs = Array.from({ length: n }, () => R.int(1, 9)); return { q: xs.join(' + '), a: M.sum(xs), sol: 'Running total: ' + xs.reduce((acc, x) => { acc.push((acc.length ? acc[acc.length - 1] : 0) + x); return acc; }, []).join(' → ') }; },
  });

  /* ---------- tables ---------- */
  MF.lesson({
    id: 'sm-tables', title: 'Instant tables to 20 × 20', minutes: 12,
    summary: 'Fluent recall of products is the multiplication "cache". Visual patterns make the hard cells easy, and the adaptive grid drills the rest.',
    sections: [
      h`<p>Every method that follows assumes single-digit products come <b>instantly</b>. Products up to 20 × 20 make many methods faster still. You don't need brute memorisation. The table is full of structure:</p>
      <ul><li><b>Symmetry:</b> $a\times b = b\times a$ halves the work.</li>
      <li><b>Squares as anchors:</b> $a(a+1) = a^2 + a$ and $(a-1)(a+1) = a^2-1$.</li>
      <li><b>Teens:</b> $(10+a)(10+b) = 100 + 10(a+b) + ab$, so $14\times 17 = 100+210-12$… or simply $(14+7)\times 10 + 4\times 7 = 238$.</li>
      <li><b>×9 fingers:</b> $9n = 10n - n$.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Multiplication as area', height: 320,
        params: [{ id: 'a', label: 'a', min: 1, max: 20, step: 1, value: 14, fmt: v => v }, { id: 'b', label: 'b', min: 1, max: 20, step: 1, value: 17, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const s = Math.min((g.W - 40) / 20, (g.H - 20) / 20), ox = (g.W - 20 * s) / 2, oy = 10, c = g.ctx;
          for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) {
            const inA = i < p.a && j < p.b;
            let col = '#111827';
            if (inA) col = (i < 10 && j < 10) ? C.alpha(C.speed, 0.8) : (i >= 10 && j >= 10) ? C.alpha(C.pink, 0.8) : C.alpha(C.fe, 0.75);
            c.fillStyle = col; c.fillRect(ox + i * s + 0.5, oy + j * s + 0.5, s - 1, s - 1);
          }
          c.strokeStyle = C.text; c.lineWidth = 2; c.strokeRect(ox + 0.5, oy + 0.5, p.a * s, p.b * s);
        },
        info: p => { const a = p.a, b = p.b, A = Math.min(a, 10), B = Math.min(b, 10); return h`$${a}\times${b}=${a * b}$. Orange: $${A}\times${B}=${A * B}$, blue strips: ${a > 10 ? h`$${a - 10}\times${B}$` : ''}${a > 10 && b > 10 ? ' + ' : ''}${b > 10 ? h`$${A}\times${b - 10}$` : ''}${a <= 10 && b <= 10 ? '(none)' : ''}, pink: ${a > 10 && b > 10 ? h`$${a - 10}\times${b - 10}=${(a - 10) * (b - 10)}$` : '(none)'}.`; },
      }) },
      { callout: 'tip', html: 'Use <a href="#/drills/tables">Drills → Tables grid</a>. It keeps a heat-map of your recall time for every product and serves your slowest ones first.' },
    ],
    formulas: [h`(10+a)(10+b) = 10(10+a+b) + ab`, h`(n-1)(n+1) = n^2 - 1`],
    target: 2.5,
    drill() { const a = R.int(3, 19), b = R.int(3, 19); return { q: `${a} × ${b}`, a: a * b, sol: a > 10 && b > 10 ? h`$(${a}+${b - 10})\times 10 + ${a - 10}\times${b - 10} = ${(a + b - 10) * 10} + ${(a - 10) * (b - 10)} = ${a * b}$` : `${a * b}` }; },
  });
})();
