/* Speed Math · Unit 2: addition & subtraction */
(function () {
  'use strict';
  const { h, R, M, colors: C } = MF;

  /** number-line frames: start value, list of jumps [{d, say}] — draws cumulative arcs */
  MF.lineFrames = function (start, jumps, intro, outro) {
    const pts = [start]; jumps.forEach(j => pts.push(pts[pts.length - 1] + j.d));
    const lo = Math.min(...pts), hi = Math.max(...pts), span = Math.max(hi - lo, 10), a = lo - span * 0.12, b = hi + span * 0.12;
    const draw = k => g => {
      g.view(a, b, 0, 1, { l: 16, r: 16, t: 10, b: 10 });
      MF.numberLine(g, a, b, 0.3, { labels: false, step: MF.Graph.niceStep(b - a, 8) });
      g.dot(start, 0.3, { color: C.speed, r: 6 }); g.text(String(start), start, 0.12, { color: C.speed, mono: true, bold: true, size: 13 });
      for (let i = 0; i < k; i++) {
        const below = jumps[i].d < 0;
        g.jump(pts[i], pts[i + 1], 0.3, { color: below ? C.pink : C.fe, label: (jumps[i].d > 0 ? '+' : '−') + Math.abs(jumps[i].d), below: false });
        g.dot(pts[i + 1], 0.3, { color: i === k - 1 ? C.good : C.muted, r: 5 });
        if (i === k - 1) g.text(String(pts[i + 1]), pts[i + 1], 0.12, { color: C.good, mono: true, bold: true, size: 13 });
      }
    };
    const fr = [{ draw: draw(0), say: intro }];
    jumps.forEach((j, i) => fr.push({ draw: draw(i + 1), say: j.say || `${pts[i]} ${j.d > 0 ? '+' : '−'} ${Math.abs(j.d)} = <b>${pts[i + 1]}</b>` }));
    if (outro) fr.push({ draw: draw(jumps.length), say: outro });
    return fr;
  };

  MF.unit('speed', 'sm-u2', 'Addition & Subtraction', 'Left to right, round and adjust, and subtraction as "adding up". All of it as jumps on a number line.');

  MF.lesson({
    id: 'sm-add-ltr', title: 'Left-to-right addition', minutes: 10,
    summary: 'Add the big parts first, like you read. Jump by hundreds, then tens, then ones, and you can say the answer as you go.',
    sections: [
      h`<p>School teaches addition right to left with carries, which is good for paper and bad for the mind. Mentally you must hold all the digits and produce the answer backwards. <b>Left-to-right</b> addition gives the most significant part first, so you can stop early when you only need an estimate, and you only ever hold one running total.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Jumps on a number line', height: 170,
        inputs: [{ id: 'a', label: 'a', value: 467, min: 0, max: 9999 }, { id: 'b', label: 'b', value: 385, min: 0, max: 9999 }],
        random: () => ({ a: R.int(100, 899), b: R.int(100, 899) }),
        frames({ a, b }) {
          a = Math.round(a); b = Math.round(b);
          const parts = String(b).split('').map((d, i, arr) => +d * 10 ** (arr.length - 1 - i)).filter(x => x);
          return MF.lineFrames(a, parts.map(d => ({ d })), `Start at <b>${a}</b>. Split ${b} into ${parts.join(' + ')}.`, `So $${a}+${b}=${a + b}$: one running total, biggest jump first.`);
        },
      }) },
      h`<h3>Look ahead for carries</h3><p>A small refinement makes it smoother. Before you say a digit, glance at the next column. If it will carry, bump the digit now. For $467+385$: hundreds $4+3=7$, but $6+8\ge 10$, so say "eight hundred…". Tens $6+8=14$ gives 4, and $7+5\ge10$, so say "fifty…". Ones $7+5=12$ gives 2. The answer is 852, spoken in order.</p>`,
      { callout: 'tip', html: 'For 2-digit sums, add the tens and ones in one glance: 47 + 38 is "70, and 15 → 85". Over time these become single visual chunks.' },
    ],
    formulas: [h`a + b = a + \sum_i b_i\,10^i\quad(\text{largest } i \text{ first})`],
    target: 4,
    drill() { const k = R.pick([2, 2, 3, 3, 4]), lo = 10 ** (k - 1), hi = 10 ** k - 1; const a = R.int(lo, hi), b = R.int(lo, hi); return { q: `${a} + ${b}`, a: a + b, sol: `Left to right: ${a} → ${String(b).split('').map((d, i, arr) => +d * 10 ** (arr.length - 1 - i)).filter(Boolean).reduce((acc, d) => { acc.push(acc[acc.length - 1] + d); return acc; }, [a]).slice(1).join(' → ')}` }; },
  });

  MF.lesson({
    id: 'sm-compensate', title: 'Round and adjust (compensation)', minutes: 8,
    summary: 'Turn ugly numbers into round ones, then fix the error: 467 + 298 = 467 + 300 − 2.',
    sections: [
      h`<p>When one number sits <b>just below a round number</b>, overshoot to the round number and step back. This works for subtraction too: $832 - 197 = 832 - 200 + 3$.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Overshoot, then correct', height: 170,
        inputs: [{ id: 'a', label: 'a', value: 467, min: 0, max: 9999 }, { id: 'b', label: 'add (near a round number)', value: 298, min: -9999, max: 9999 }],
        random: () => ({ a: R.int(200, 900), b: R.sign() * (R.pick([100, 200, 300, 400, 50, 60, 1000]) - R.int(1, 4)) }),
        frames({ a, b }) {
          a = Math.round(a); b = Math.round(b);
          const s = Math.sign(b) || 1, B = Math.abs(b), mag = B >= 100 ? (B >= 1000 ? 100 : 10) : 10, up = Math.ceil(B / mag) * mag, fix = up - B;
          const j = [{ d: s * up, say: `Overshoot: ${a} ${s > 0 ? '+' : '−'} ${up} = <b>${a + s * up}</b>` }];
          if (fix) j.push({ d: -s * fix, say: `Correct by ${fix}: <b>${a + s * up - s * fix}</b>` });
          return MF.lineFrames(a, j, `${b > 0 ? 'Add' : 'Subtract'} ${B}. That's ${up} ${fix ? '− ' + fix : ''}, so use the round number.`, `$${a} ${s > 0 ? '+' : '-'} ${B} = ${a + b}$`);
        },
      }) },
      h`<h3>Balancing (equal additions)</h3><p>For subtraction there's a neat cousin. Shift <b>both</b> numbers by the same amount and the difference stays the same: $832 - 197 = 835 - 200 = 635$. Shift so the number you subtract becomes round.</p>`,
      { callout: 'key', html: 'Compensation = change one number, then undo. Balancing = change both numbers equally, so nothing needs undoing.' },
    ],
    formulas: [h`a + (R - k) = (a + R) - k`, h`a - b = (a + k) - (b + k)`],
    target: 4,
    drill() {
      const a = R.int(150, 999), R0 = R.pick([100, 200, 300, 400, 500, 50, 70, 90, 30]), k = R.int(1, 4), b = R0 - k;
      if (R.rand() < 0.5 && a > b) return { q: `${a} − ${b}`, a: a - b, sol: `${a} − ${R0} + ${k} = ${a - b}` };
      return { q: `${a} + ${b}`, a: a + b, sol: `${a} + ${R0} − ${k} = ${a + b}` };
    },
  });

  MF.lesson({
    id: 'sm-sub-addup', title: 'Subtraction by adding up', minutes: 10,
    summary: 'Find the gap: walk from the smaller number up to the larger through round "stepping stones".',
    sections: [
      h`<p>"What is $1003 - 478$?" Borrowing across zeros is error-prone. Instead ask <b>how far it is from 478 to 1003</b>, and walk there through round numbers:</p>
      <p>$478 \xrightarrow{+22} 500 \xrightarrow{+500} 1000 \xrightarrow{+3} 1003$, so the gap is $22+500+3 = 525$.</p>
      <p>This is how cashiers count change. It never needs borrowing.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Walk up to the target', height: 170,
        inputs: [{ id: 'a', label: 'from (smaller)', value: 478, min: 0, max: 99999 }, { id: 'b', label: 'to (larger)', value: 1003, min: 0, max: 99999 }],
        random: () => { const a = R.int(120, 880); return { a, b: a + R.int(150, 900) }; },
        frames({ a, b }) {
          a = Math.round(a); b = Math.round(b); if (b < a) [a, b] = [b, a];
          const jumps = []; let cur = a;
          const toTen = Math.ceil(cur / 10) * 10; if (toTen !== cur && toTen <= b) { jumps.push({ d: toTen - cur }); cur = toTen; }
          const toH = Math.ceil(cur / 100) * 100; if (toH !== cur && toH <= b) { jumps.push({ d: toH - cur }); cur = toH; }
          const bigH = Math.floor(b / 100) * 100; if (bigH > cur) { jumps.push({ d: bigH - cur }); cur = bigH; }
          if (b > cur) jumps.push({ d: b - cur });
          const total = b - a;
          return MF.lineFrames(a, jumps, `Gap from ${a} to ${b}? Step through round numbers.`, `Add the jumps: ${jumps.map(j => j.d).join(' + ')} = <b>${total}</b>, so $${b}-${a}=${total}$.`);
        },
      }) },
      { callout: 'tip', html: 'Jump to the next ten first, then the next hundred, then the big jump. Most gaps take 2–3 jumps, which is easy to hold in your head.' },
      h`<h3>Subtracting with complements</h3><p>When the number you subtract is close to a round number from above, use its complement: $725 - 389$ = $725 - 400 + 11 = 336$, where 11 is the complement of 389 to 400. Combine with the <a href="#/lesson/sm-complements">complements</a> trick for 3–4 digit numbers.</p>`,
    ],
    formulas: [h`b - a = (r_1 - a) + (r_2 - r_1) + \dots + (b - r_k)`],
    target: 5,
    drill() { const a = R.int(100, 899), b = a + R.int(120, 1000); return { q: `${b} − ${a}`, a: b - a, sol: `From ${a} up to ${b}: ${Math.ceil(a / 100) * 100 - a} to reach ${Math.ceil(a / 100) * 100}, then ${b - Math.ceil(a / 100) * 100} more = ${b - a}` }; },
  });

  MF.lesson({
    id: 'sm-columns', title: 'Column sums & grouping tens', minutes: 8,
    summary: 'Add long lists by spotting pairs that make 10 (or 100) and by keeping a single running total.',
    sections: [
      h`<p>Adding a column like $7+4+3+6+8+2+5$ is faster if you <b>scan for partners</b>: $7+3$, $4+6$ and $8+2$ each make 10, leaving 5. The total is $35$. The same idea works for 2-digit lists, with partners making 100: $64+36$, $72+28$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Find the friends of 10', height: 170,
        init(s) { s.xs = Array.from({ length: 8 }, () => R.int(1, 9)); },
        buttons: [{ label: '🎲 New list', click: s => { s.xs = Array.from({ length: 8 }, () => R.int(1, 9)); } }],
        draw(g, p, s) {
          g.noPad(); const xs = s.xs, w = Math.min(70, (g.W - 20) / xs.length), ox = (g.W - w * xs.length) / 2;
          const used = new Array(xs.length).fill(-1); let pair = 0;
          for (let i = 0; i < xs.length; i++) if (used[i] < 0) for (let j = i + 1; j < xs.length; j++) if (used[j] < 0 && xs[i] + xs[j] === 10) { used[i] = used[j] = pair++; break; }
          xs.forEach((x, i) => {
            const col = used[i] >= 0 ? C.series[used[i] % C.series.length] : C.dim;
            const cx = ox + w * (i + 0.5); const c = g.ctx;
            c.fillStyle = C.alpha(col, 0.18); c.strokeStyle = col; c.lineWidth = 2; c.beginPath(); c.arc(cx, 60, w * 0.36, 0, Math.PI * 2); c.fill(); c.stroke();
            g.ptext(String(x), cx, 60, { size: 22, bold: true, mono: true, color: C.text });
          });
          for (let p2 = 0; p2 < pair; p2++) { const idx = used.map((u, k) => u === p2 ? k : -1).filter(k => k >= 0); const x1 = ox + w * (idx[0] + .5), x2 = ox + w * (idx[1] + .5), c = g.ctx; c.strokeStyle = C.series[p2 % C.series.length]; c.lineWidth = 2; c.beginPath(); c.moveTo(x1, 60 + w * .38); c.quadraticCurveTo((x1 + x2) / 2, 120 + p2 * 8, x2, 60 + w * .38); c.stroke(); }
          s.pairs = pair; s.rest = xs.filter((_, i) => used[i] < 0);
        },
        info: (p, s) => s.xs ? `${s.pairs || 0} pair(s) of ten = ${10 * (s.pairs || 0)}, plus leftovers ${(s.rest || []).join(' + ') || '0'} → total <b>${M.sum(s.xs)}</b>` : '',
      }) },
      { callout: 'tip', html: 'With 2-digit lists, sum the tens column first (left to right!) then the ones column, and combine: 34+58+27 → tens 3+5+2 = 10 → 100; ones 4+8+7 = 19; total 119.' },
    ],
    formulas: [h`\sum x_i = 10\cdot\#\text{pairs} + \sum \text{leftovers}`],
    target: 6,
    drill() { const twoDigit = R.rand() < 0.4, n = twoDigit ? 3 : R.int(5, 7); const xs = Array.from({ length: n }, () => twoDigit ? R.int(11, 99) : R.int(1, 9)); return { q: xs.join(' + '), a: M.sum(xs), sol: `Total = ${M.sum(xs)}` }; },
  });
})();
