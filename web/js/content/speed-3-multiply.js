/* Speed Math · Unit 3: multiplication */
(function () {
  'use strict';
  const { h, R, M, colors: C } = MF;

  /** Area-model frames: a split into aParts (columns), b into bParts (rows). */
  MF.areaFrames = function (a, b, aParts, bParts, opts = {}) {
    const cells = []; bParts.forEach((y, j) => aParts.forEach((x, i) => cells.push({ i, j, x, y, v: x * y })));
    const order = opts.order || cells.map((_, k) => k);
    const draw = k => g => {
      g.noPad();
      const W = g.W - 70, H = g.H - 50, sx = W / M.sum(aParts.map(Math.abs)), sy = H / M.sum(bParts.map(Math.abs)), s = Math.min(sx, sy * 1.6, sy * 3);
      const scX = Math.min(sx, s), scY = Math.min(sy, s);
      const tw = M.sum(aParts) * scX, th = M.sum(bParts) * scY, ox = 50 + (W - tw) / 2, oy = 30;
      let x = ox; aParts.forEach(p => { g.ptext(String(p), x + p * scX / 2, oy - 14, { color: C.speed, bold: true, mono: true, size: 13 }); x += p * scX; });
      let y = oy; bParts.forEach(p => { g.ptext(String(p), ox - 22, y + p * scY / 2, { color: C.fe, bold: true, mono: true, size: 13 }); y += p * scY; });
      const shown = new Set(order.slice(0, k));
      cells.forEach((cell, idx) => {
        const cx = ox + M.sum(aParts.slice(0, cell.i)) * scX, cy = oy + M.sum(bParts.slice(0, cell.j)) * scY, w = cell.x * scX, hh = cell.y * scY, c = g.ctx;
        const on = shown.has(idx), last = order[k - 1] === idx;
        c.fillStyle = on ? C.alpha(C.series[(cell.i + 2 * cell.j) % C.series.length], last ? 0.75 : 0.4) : '#111827';
        c.fillRect(cx + 1, cy + 1, w - 2, hh - 2);
        c.strokeStyle = '#2a3550'; c.lineWidth = 1; c.strokeRect(cx + .5, cy + .5, w - 1, hh - 1);
        if (on && w > 22 && hh > 14) g.ptext(String(cell.v), cx + w / 2, cy + hh / 2, { bold: true, mono: true, size: Math.max(10, Math.min(18, Math.min(w / 4, hh / 2))) });
      });
    };
    const fr = [{ draw: draw(0), say: opts.intro || `$${a}\\times${b}$: split into ${aParts.join(' + ')} and ${bParts.join(' + ')}.` }];
    let run = 0;
    order.forEach((idx, k) => { const c = cells[idx]; run += c.v; fr.push({ draw: draw(k + 1), say: `$${c.x}\\times${c.y} = ${c.v}$ → running total <b>${run}</b>` }); });
    fr.push({ draw: draw(order.length), say: `$${a}\\times${b} = ${run}$` });
    return fr;
  };
  const parts = n => String(n).split('').map((d, i, arr) => +d * 10 ** (arr.length - 1 - i)).filter(Boolean);

  MF.unit('speed', 'sm-u3', 'Multiplication', 'Area models, vertically-and-crosswise, near-base and algebraic shortcuts. Pick the right tool at a glance.');

  MF.lesson({
    id: 'sm-x11', title: 'Multiply by 11', minutes: 6,
    summary: 'Spread the digits apart and drop their sums in between: 72 × 11 = 7|9|2.',
    sections: [
      h`<p>$11 = 10 + 1$, so $n\times 11 = 10n + n$. Shift the number left one place and add it to itself. Each output digit is the sum of a pair of <b>neighbouring digits</b>.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Neighbour sums', height: 170,
        inputs: [{ id: 'n', label: 'Number × 11', value: 4372, min: 10, max: 999999 }],
        random: () => ({ n: R.int(12, 9999) }),
        frames({ n }) {
          n = Math.round(Math.abs(n)); const d = [0, ...String(n).split('').map(Number), 0];
          const sums = []; for (let i = d.length - 1; i > 0; i--) sums.unshift(d[i] + d[i - 1]);
          const res = []; let carry = 0; const carries = [];
          for (let i = sums.length - 1; i >= 0; i--) { const v = sums[i] + carry; res.unshift(v % 10); carries.unshift(carry); carry = Math.floor(v / 10); }
          if (carry) res.unshift(carry);
          const drawStep = k => g => {
            g.noPad(); const n2 = d.length, w = Math.min(54, (g.W - 20) / n2), ox = (g.W - w * n2) / 2;
            d.forEach((x, i) => { if (i === 0 || i === n2 - 1) return; g.ptext(String(x), ox + w * (i + 0.5), 40, { size: 26, bold: true, mono: true, color: C.speed }); });
            for (let i = 0; i < Math.min(k, sums.length); i++) {
              const pos = sums.length - 1 - i; const xm = ox + w * (pos + 0.5) + w / 2;
              const c = g.ctx; c.strokeStyle = C.alpha(C.fe, 0.7); c.lineWidth = 1.5;
              c.beginPath(); c.moveTo(ox + w * (pos + 0.5), 58); c.lineTo(xm, 98); c.lineTo(ox + w * (pos + 1.5), 58); c.stroke();
              g.ptext(String(sums[pos]), xm, 112, { size: 18, bold: true, mono: true, color: sums[pos] >= 10 ? C.pink : C.fe });
            }
            if (k > sums.length) g.ptext('= ' + (n * 11), g.W / 2, 150, { size: 22, bold: true, mono: true, color: C.good });
          };
          const fr = [{ draw: drawStep(0), say: `Write ${n}. Imagine a 0 at both ends.` }];
          for (let k = 1; k <= sums.length; k++) { const pos = sums.length - k; fr.push({ draw: drawStep(k), say: `Neighbours ${d[pos]} + ${d[pos + 1]} = <b>${sums[pos]}</b>${sums[pos] + (carries[pos] || 0) >= 10 ? ' (carry the 1 left)' : ''}` }); }
          fr.push({ draw: drawStep(sums.length + 1), say: `Resolve carries right to left: <b>${n} × 11 = ${n * 11}</b>` });
          return fr;
        },
      }) },
      { callout: 'tip', html: '2-digit case in one breath: <b>ab × 11 = a | a+b | b</b>. If a+b ≥ 10, carry 1 into a: 87 × 11 = 8|15|7 → 957.' },
      h`<h3>Relatives</h3><p>$\times 111$: sum triples of neighbours ($23\times111 = 2|5|5|3 = 2553$). $\times 101$: write the number twice for 2-digit numbers ($47\times 101 = 4747$). $\times 1001$ does the same for 3-digit numbers.</p>`,
    ],
    formulas: [h`\overline{ab}\times 11 = 100a + 10(a+b) + b`],
    target: 3,
    drill() { const n = R.rand() < 0.6 ? R.int(12, 99) : R.int(101, 999); return { q: `${n} × 11`, a: n * 11, sol: `Neighbour sums of ${n} → ${n * 11}` }; },
  });

  MF.lesson({
    id: 'sm-x5-25', title: 'Multiply by 5, 25, 50, 125', minutes: 7,
    summary: 'These are fractions of powers of ten in disguise: 5 = 10/2, 25 = 100/4, 125 = 1000/8.',
    sections: [
      h`<p>Multiplying by 5 is halving and then multiplying by 10. A rectangle 5 tall has half the area of one 10 tall. So:</p>
      <ul><li>$\times 5 = \times 10 \div 2$: $864\times5 = 8640/2 = 4320$</li><li>$\times 25 = \times 100 \div 4$: $64\times 25 = 6400/4 = 1600$</li>
      <li>$\times 50 = \times 100 \div 2$</li><li>$\times 125 = \times 1000 \div 8$: $48\times 125 = 48000/8 = 6000$</li></ul>
      <p>The reverse works for division: $\div 5 = \times 2 \div 10$ and $\div 25 = \times 4 \div 100$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Halving the ×10 rectangle', height: 210,
        params: [{ id: 'n', label: 'n', min: 2, max: 60, step: 1, value: 36, fmt: v => v }, { id: 'm', label: 'multiplier', type: 'select', value: '5', options: [['5', '× 5'], ['25', '× 25'], ['125', '× 125']] }],
        draw(g, p) {
          g.noPad(); const m = +p.m, big = { 5: 10, 25: 100, 125: 1000 }[m], k = big / m;
          const W = g.W - 40, Hh = g.H - 60, ox = 20, oy = 20;
          g.ctx.fillStyle = '#111827'; g.ctx.fillRect(ox, oy, W, Hh);
          for (let i = 0; i < k; i++) { const c = g.ctx; c.fillStyle = i === 0 ? C.alpha(C.speed, 0.8) : C.alpha(C.fe, 0.18); c.fillRect(ox + 2, oy + i * Hh / k + 2, W - 4, Hh / k - 4); }
          g.ptext(`${p.n} × ${big} = ${p.n * big}`, ox + W / 2, oy + Hh + 22, { color: C.muted, mono: true, size: 13 });
          g.ptext(`${p.n} × ${m} = ${p.n * big} ÷ ${k} = ${p.n * m}`, ox + W / 2, oy + Hh / k / 2 + 2, { color: '#1d0e02', bold: true, mono: true, size: 14 });
        },
        info: p => { const m = +p.m, k = { 5: 2, 25: 4, 125: 8 }[m]; return h`The whole bar is $${p.n}\times ${m * k}$; one ${k === 2 ? 'half' : k === 4 ? 'quarter' : 'eighth'} of it is $${p.n}\times${m} = ${p.n * m}$.`; },
      }) },
      { callout: 'tip', html: 'Pick the order that keeps numbers whole: for an odd n × 5, do n ÷ 2 = x.5 then × 10. 37 × 5 → 18.5 → 185.' },
    ],
    formulas: [h`n\times 5 = \tfrac{n}{2}\times 10`, h`n\times 25 = \tfrac{n}{4}\times 100`, h`n\times 125 = \tfrac{n}{8}\times 1000`],
    target: 4,
    drill() { const m = R.pick([5, 5, 25, 25, 50, 125]); const n = m === 125 ? R.int(2, 40) * R.pick([1, 8, 4]) : R.int(11, 199); return { q: `${n} × ${m}`, a: n * m, sol: `${n} × ${m} = ${n} × ${{ 5: 10, 25: 100, 50: 100, 125: 1000 }[m]} ÷ ${{ 5: 2, 25: 4, 50: 2, 125: 8 }[m]} = ${n * m}` }; },
  });

  MF.lesson({
    id: 'sm-x9', title: 'Multiply by 9, 99, 999', minutes: 6,
    summary: 'Nines are "one less than round": n × 99 = n × 100 − n.',
    sections: [
      h`<p>$9 = 10-1$, $99 = 100-1$, $999=1000-1$. So $n\times 99$ is $100n$ minus one strip of $n$. For $n<100$ the result has a pretty pattern: $n\times 99 = (n-1)\,|\,(100-n)$ written side by side. For example $47 \times 99 = 46|53 = 4653$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Remove one strip', height: 160,
        params: [{ id: 'n', label: 'n', min: 2, max: 99, step: 1, value: 47, fmt: v => v }, { id: 'k', label: 'multiplier', type: 'select', value: '99', options: [['9', '× 9'], ['99', '× 99'], ['999', '× 999']] }],
        draw(g, p) {
          g.noPad(); const k = +p.k + 1, W = g.W - 40, c = g.ctx, segs = Math.min(k, 40);
          for (let i = 0; i < segs; i++) { c.fillStyle = i === segs - 1 ? C.alpha(C.bad, 0.55) : C.alpha(C.speed, 0.7); c.fillRect(20 + i * W / segs + 1, 30, W / segs - 2, 60); }
          g.ptext(`${p.n} × ${k}  −  ${p.n}`, g.W / 2, 112, { mono: true, size: 14, color: C.muted });
          g.ptext(`= ${p.n * k} − ${p.n} = ${p.n * (k - 1)}`, g.W / 2, 136, { mono: true, size: 16, bold: true, color: C.good });
        },
        info: p => +p.k === 99 ? h`Pattern: $(${p.n}-1)\,|\,(100-${p.n}) = ${p.n - 1}\,|\,${String(100 - p.n).padStart(2, '0')}$` : '',
      }) },
      { callout: 'tip', html: 'Also useful: × 98 = × 100 − 2n, × 49 = × 50 − n, × 51 = × 50 + n.' },
    ],
    formulas: [h`n\times(10^k-1) = n\cdot 10^k - n`, h`n\times 99 = \overline{(n-1)\,(100-n)}\quad(n\le 100)`],
    target: 4,
    drill() { const k = R.pick([9, 99, 99, 999, 98, 49, 51]); const n = R.int(12, 99); return { q: `${n} × ${k}`, a: n * k, sol: `${n} × ${k} = ${n} × ${Math.round(k / 10) * 10 || k + 1} ${k % 10 === 1 ? '+' : '−'} ${Math.abs(Math.round(k / 10) * 10 - k) * n} = ${n * k}` }; },
  });

  MF.lesson({
    id: 'sm-x1digit', title: 'Big × single digit (left to right)', minutes: 8,
    summary: 'Distribute the digit over each place value, biggest first, and keep a running total: 487 × 7 = 2800 + 560 + 49.',
    sections: [
      h`<p>This is the most-used mental multiplication. Split the big number by place value and multiply each part by the digit, <b>left to right</b>. You're adding the strips of an area model.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Area model strips', height: 230,
        inputs: [{ id: 'a', label: 'Number', value: 487, min: 10, max: 9999 }, { id: 'b', label: 'Digit', value: 7, min: 2, max: 9 }],
        random: () => ({ a: R.int(23, 999), b: R.int(3, 9) }),
        frames({ a, b }) { a = Math.round(a); b = Math.round(b); return MF.areaFrames(a, b, parts(a), [b]); },
      }) },
      { callout: 'tip', html: 'Say only the running total aloud: "2800 … 3360 … 3409". Saying fewer numbers keeps working memory free.' },
    ],
    formulas: [h`(100h + 10t + u)\,d = 100hd + 10td + ud`],
    target: 5,
    drill() { const a = R.rand() < 0.5 ? R.int(13, 99) : R.int(102, 999), d = R.int(3, 9); return { q: `${a} × ${d}`, a: a * d, sol: parts(a).map(x => `${x}×${d}=${x * d}`).join(', ') + ` → ${a * d}` }; },
  });

  MF.lesson({
    id: 'sm-area', title: 'The area model: 2-digit × 2-digit', minutes: 10,
    summary: 'Every product is a rectangle. Cut it along place values into four easy pieces and add them, biggest first.',
    sections: [
      h`<p>$47\times 38$ is the area of a $47\times38$ rectangle. Cut 47 into $40+7$ and 38 into $30+8$ and the rectangle falls into four blocks: $40\times30 = 1200$, $7\times 30 = 210$, $40\times 8 = 320$, $7\times 8 = 56$. The total is $1786$. This picture <b>is</b> the distributive law. Every other method in this unit is a clever way of adding these blocks.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Four blocks', height: 300,
        inputs: [{ id: 'a', label: 'a', value: 47, min: 10, max: 99 }, { id: 'b', label: 'b', value: 38, min: 10, max: 99 }],
        random: () => ({ a: R.int(12, 99), b: R.int(12, 99) }),
        frames({ a, b }) { a = Math.round(a); b = Math.round(b); return MF.areaFrames(a, b, parts(a), parts(b), { order: [0, 1, 2, 3].slice(0, parts(a).length * parts(b).length) }); },
      }) },
      h`<h3>Smart splitting</h3><p>You don't have to split by place value. Split so that blocks are easy. $47\times 38 = 47\times 40 - 47\times 2 = 1880 - 94 = 1786$ uses one big block and a thin strip removed. Both routes must agree, and a quick cross-check with the other route is a great habit.</p>
      <div class="callout warn"><b>Common slip</b>Pair each part of one number with each part of the other, exactly once (4 blocks for 2×2 digits, 6 for 3×2). If unsure, picture the grid.</div>`,
      { callout: 'tip', html: 'Choose splits that create zeros: 48 × 25 = 48 × 100 ÷ 4. 39 × 41 = 40² − 1. 47 × 38 = 47 × 40 − 47 × 2. The area model is the fallback that always works.' },
    ],
    formulas: [h`(10a+b)(10c+d) = 100ac + 10(ad+bc) + bd`],
    target: 9,
    drill() { const a = R.int(12, 99), b = R.int(12, 99); return { q: `${a} × ${b}`, a: a * b, sol: (() => { const [p, q] = [parts(a), parts(b)]; const blocks = []; p.forEach(x => q.forEach(y => blocks.push(x * y))); return `Blocks: ${blocks.join(' + ')} = ${a * b}`; })() }; },
  });

  MF.lesson({
    id: 'sm-cross', title: 'Vertically & crosswise', minutes: 12,
    summary: 'The Vedic one-line method: build the answer digit by digit from cross products, right to left.',
    sections: [
      h`<p><i>Urdhva-Tiryagbhyam</i> ("vertically and crosswise") computes the area-model blocks column by column. For $\overline{ab}\times\overline{cd}$:</p>
      <ol><li><b>Right:</b> vertical $b\times d$ gives the units digit (carry the rest).</li>
      <li><b>Middle:</b> crosswise $a\times d + b\times c$ (+carry) gives the tens digit.</li>
      <li><b>Left:</b> vertical $a\times c$ (+carry) gives the rest.</li></ol>
      <p>It extends to any size. Column $k$ of the answer is the sum of digit products whose positions add up to $k$. That is exactly polynomial multiplication, or convolution.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Cross products, column by column', height: 230,
        inputs: [{ id: 'a', label: 'Top', value: 63, min: 10, max: 9999 }, { id: 'b', label: 'Bottom', value: 47, min: 10, max: 9999 }],
        random: () => (R.rand() < 0.6 ? { a: R.int(12, 99), b: R.int(12, 99) } : { a: R.int(102, 999), b: R.int(102, 999) }),
        frames({ a, b }) {
          a = Math.round(a); b = Math.round(b);
          const n = Math.max(String(a).length, String(b).length);
          const A = String(a).padStart(n, '0').split('').map(Number).reverse(), B = String(b).padStart(n, '0').split('').map(Number).reverse();
          const cols = []; for (let k = 0; k < 2 * n - 1; k++) { const pr = []; for (let i = 0; i <= k; i++) { const j = k - i; if (i < n && j < n) pr.push([i, j]); } cols.push(pr); }
          const out = []; let carry = 0; const steps = [];
          cols.forEach((pr, k) => { const s = M.sum(pr.map(([i, j]) => A[i] * B[j])); const tot = s + carry; steps.push({ pr, s, carryIn: carry, tot, digit: tot % 10 }); out.push(tot % 10); carry = Math.floor(tot / 10); });
          const drawK = k => g => {
            g.noPad(); const w = Math.min(60, (g.W - 40) / (n + 2)), ox = g.W / 2 + (n / 2) * w, y1 = 40, y2 = 110;
            const X = pos => ox - (pos + 0.5) * w;
            for (let i = 0; i < n; i++) { g.ptext(String(A[i]), X(i), y1, { size: 26, bold: true, mono: true, color: C.speed }); g.ptext(String(B[i]), X(i), y2, { size: 26, bold: true, mono: true, color: C.fe }); }
            if (k < steps.length) steps[k].pr.forEach(([i, j], q) => { const c = g.ctx; c.strokeStyle = C.series[q % C.series.length]; c.lineWidth = 2.5; c.beginPath(); c.moveTo(X(i), y1 + 16); c.lineTo(X(j), y2 - 18); c.stroke(); });
            const c = g.ctx; c.strokeStyle = C.axis; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(2 * n - 1) + w / 2, 140); c.lineTo(X(0) + w / 2, 140); c.stroke();
            const shown = Math.min(k, steps.length);
            for (let q = 0; q < shown; q++) g.ptext(String(steps[q].digit), X(q), 165, { size: 24, bold: true, mono: true, color: C.good });
            if (k >= steps.length && carry) String(carry).split('').reverse().forEach((d, q) => g.ptext(d, X(steps.length + q), 165, { size: 24, bold: true, mono: true, color: C.good }));
            if (k < steps.length && steps[k].carryIn) g.ptext('+' + steps[k].carryIn + ' carry', X(k), 200, { size: 12, color: C.pink });
          };
          const fr = [];
          steps.forEach((st, k) => fr.push({ draw: drawK(k), say: `Column ${k + 1}: ${st.pr.map(([i, j]) => `${A[i]}×${B[j]}`).join(' + ')} = ${st.s}${st.carryIn ? ` + carry ${st.carryIn}` : ''} = ${st.tot} → write <b>${st.digit}</b>${st.tot >= 10 ? `, carry ${Math.floor(st.tot / 10)}` : ''}` }));
          fr.push({ draw: drawK(steps.length), say: `${carry ? `Write the final carry ${carry}. ` : ''}<b>${a} × ${b} = ${a * b}</b>` });
          return fr;
        },
      }) },
      { callout: 'tip', html: 'Mentally, run it left to right instead (most significant first, like the area model) and fix carries as you go. Right to left is easier for writing the answer down in one line.' },
    ],
    formulas: [h`c_k = \sum_{i+j=k} a_i b_j \quad(\text{then propagate carries})`],
    target: 10,
    drill() { const three = R.rand() < 0.25; const a = three ? R.int(101, 999) : R.int(12, 99), b = R.int(12, 99); return { q: `${a} × ${b}`, a: a * b, sol: `Crosswise columns give ${a * b}` }; },
  });

  MF.lesson({
    id: 'sm-nearbase', title: 'Near a base (Nikhilam)', minutes: 12,
    summary: 'For numbers close to 100 (or 1000), multiply the small deficiencies instead: 97 × 94 = (97 − 6) | 3 × 6 = 9118.',
    sections: [
      h`<p>"All from 9 and the last from 10" (Nikhilam) works on <b>how far each number is from a base</b>. With base $B=100$, write $a = B - x$ and $b = B - y$:</p>
      $$ab = B(a - y) + xy$$
      <p>For $97\times 94$: deficiencies are $3$ and $6$. Cross-subtract: $97 - 6 = 91$ (or equally $94-3$). Multiply the deficiencies: $3\times 6 = 18$. Answer $91|18 = 9118$.</p>
      <p>Above the base, use surpluses: $104\times 107 = (104+7)|4\times7 = 11128$. Mixed works too: $103\times 98 = (103-2)|(-6) = 10100 - 6 = 10094$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Why it works: the missing strips', height: 320,
        params: [{ id: 'a', label: 'a', min: 80, max: 100, step: 1, value: 92, fmt: v => v }, { id: 'b', label: 'b', min: 80, max: 100, step: 1, value: 87, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const S = Math.min(g.W - 160, g.H - 30), ox = 30, oy = 15, u = S / 100, x = 100 - p.a, y = 100 - p.b, c = g.ctx;
          c.fillStyle = '#111827'; c.fillRect(ox, oy, S, S);
          c.fillStyle = C.alpha(C.speed, 0.7); c.fillRect(ox, oy, p.a * u, p.b * u);
          c.fillStyle = C.alpha(C.fe, 0.35); c.fillRect(ox + p.a * u, oy, x * u, S);
          c.fillStyle = C.alpha(C.fe, 0.35); c.fillRect(ox, oy + p.b * u, S, y * u);
          c.fillStyle = C.alpha(C.pink, 0.85); c.fillRect(ox + p.a * u, oy + p.b * u, x * u, y * u);
          c.strokeStyle = C.text; c.lineWidth = 1.5; c.strokeRect(ox, oy, S, S);
          g.ptext(`${p.a}×${p.b}`, ox + p.a * u / 2, oy + p.b * u / 2, { bold: true, size: 16, color: '#1d0e02' });
          const lx = ox + S + 14; c.textAlign = 'left';
          [[C.speed, `a·b = ${p.a * p.b}`], [C.fe, `strips 100·${x}, 100·${y}`], [C.pink, `corner ${x}·${y} = ${x * y} (removed twice)`]].forEach(([col, t], i) => { c.fillStyle = col; c.fillRect(lx, oy + 10 + i * 22, 10, 10); g.ptext(t, lx + 16, oy + 15 + i * 22, { align: 'left', size: 12, color: C.muted }); });
        },
        info: p => { const x = 100 - p.a, y = 100 - p.b; return h`$${p.a}\times${p.b} = 100^2 - 100(${x}+${y}) + ${x}\cdot${y} = 100\cdot(${p.a}-${y}) + ${x * y} = ${p.a * p.b}$`; },
      }) },
      { callout: 'warn', html: 'If x·y has more digits than the base has zeros, carry: 88 × 87 → (88 − 13) | 12 × 13 = 75 | 156 → 7500 + 156 = 7656.' },
      h`<h3>Other bases</h3><p>Use base 50 or 200 via a "working base": $48\times 47$ with base $50 = 100/2$ gives $(48-3)\,|\,2\times 3 \to 45\times 50 + 6 = 2256$.</p>`,
    ],
    formulas: [h`(B-x)(B-y) = B\,(B-x-y) + xy`, h`(B+x)(B+y) = B\,(B+x+y) + xy`],
    target: 6,
    drill() { const base = R.pick([100, 100, 100, 1000]); const sp = base === 100 ? 12 : 30; const a = base + R.sign() * R.int(1, sp), b = base + (R.rand() < 0.7 ? Math.sign(a - base) : -Math.sign(a - base)) * R.int(1, sp); return { q: `${a} × ${b}`, a: a * b, sol: `Base ${base}: (${a} ${b - base >= 0 ? '+' : '−'} ${Math.abs(b - base)}) | (${a - base})(${b - base}) → ${base}×${a + b - base} + ${(a - base) * (b - base)} = ${a * b}` }; },
  });

  MF.lesson({
    id: 'sm-diffsq', title: 'Difference of squares', minutes: 8,
    summary: 'Two numbers equally spaced around a round midpoint: 47 × 53 = 50² − 3² = 2491.',
    sections: [
      h`<p>If $a$ and $b$ are equally far from a midpoint $m$, write $a = m+d$, $b = m-d$. Then $ab = m^2 - d^2$. Look for pairs like 38 × 42, 67 × 73, 195 × 205.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Cut and slide', height: 300,
        params: [{ id: 'm', label: 'midpoint m', min: 10, max: 60, step: 1, value: 40, fmt: v => v }, { id: 'd', label: 'offset d', min: 1, max: 15, step: 1, value: 6, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const { m, d } = p, u = Math.min((g.W - 80) / (2 * m + d + 10), (g.H - 30) / (m + d)), ox = 20, oy = 15, c = g.ctx;
          // left: rectangle (m+d) x (m-d)
          c.fillStyle = C.alpha(C.speed, 0.6); c.fillRect(ox, oy, (m + d) * u, (m - d) * u);
          c.fillStyle = C.alpha(C.fe, 0.7); c.fillRect(ox + m * u, oy, d * u, (m - d) * u);
          c.strokeStyle = C.text; c.lineWidth = 1; c.strokeRect(ox, oy, (m + d) * u, (m - d) * u);
          g.ptext(`(m+d)(m−d)`, ox + (m + d) * u / 2, oy + (m - d) * u + 14, { size: 12, color: C.muted });
          // right: square m x m minus d x d
          const ox2 = ox + (m + d) * u + 40;
          c.fillStyle = C.alpha(C.speed, 0.6); c.fillRect(ox2, oy, m * u, (m - d) * u);
          c.fillStyle = C.alpha(C.fe, 0.7); c.fillRect(ox2, oy + (m - d) * u, (m - d) * u, d * u);
          c.fillStyle = C.alpha(C.bad, 0.35); c.fillRect(ox2 + (m - d) * u, oy + (m - d) * u, d * u, d * u);
          c.strokeStyle = C.text; c.strokeRect(ox2, oy, m * u, m * u);
          g.ptext(`m² − d²`, ox2 + m * u / 2, oy + m * u + 14, { size: 12, color: C.muted });
        },
        info: p => h`The blue strip $d\times(m-d)$ slides from the side to the bottom. $${p.m + p.d}\times${p.m - p.d} = ${p.m}^2 - ${p.d}^2 = ${p.m * p.m} - ${p.d * p.d} = ${(p.m + p.d) * (p.m - p.d)}$`,
      }) },
      { callout: 'tip', html: 'Odd gaps work with half-integers: 47 × 52 = 49.5² − 2.5² … easier: 47 × 52 = 47 × 53 − 47 = 2491 − 47 = 2444.' },
    ],
    formulas: [h`(m+d)(m-d) = m^2 - d^2`],
    target: 5,
    drill() { const m = R.pick([20, 30, 40, 50, 60, 70, 80, 90, 25, 35, 45, 100, 200]), d = R.int(1, 9); return { q: `${m + d} × ${m - d}`, a: (m + d) * (m - d), sol: `${m}² − ${d}² = ${m * m} − ${d * d} = ${(m + d) * (m - d)}` }; },
  });

  MF.lesson({
    id: 'sm-teens', title: 'Teens and same-tens products', minutes: 8,
    summary: 'Two numbers with the same tens digit: add one to the other\'s units, multiply by the tens, then add the units product.',
    sections: [
      h`<p>For $(10t+a)(10t+b)$:</p>$$(10t+a)(10t+b) = 10t\,(10t + a + b) + ab$$
      <p><b>Teens</b> ($t=1$): $13\times 17 = (13+7)\times 10 + 21 = 221$. "Add one number to the other's units, ×10, add the units product."</p>
      <p><b>Same tens, any $t$</b>: $43\times 46 = 40\times(43+6) + 18 = 1960 + 18 = 1978$.</p>
      <p><b>Special case, units sum to 10</b>: then $a+b=10$, so $ab$ comes after $t(t+1)$: $43\times 47 = 4\cdot5\,|\,21 = 2021$; $86\times 84 = 72|24 = 7224$.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Same tens as an area', height: 270,
        inputs: [{ id: 'a', label: 'a', value: 43, min: 11, max: 99 }, { id: 'b', label: 'b', value: 46, min: 11, max: 99 }],
        random: () => { const t = R.int(1, 9); return { a: 10 * t + R.int(1, 9), b: 10 * t + R.int(1, 9) }; },
        frames({ a, b }) {
          a = Math.round(a); b = Math.round(b); const t = Math.floor(a / 10) * 10;
          if (Math.floor(b / 10) * 10 !== t) return [{ draw: () => { }, say: 'Pick two numbers with the same tens digit.' }];
          const ua = a - t, ub = b - t;
          const fr = MF.areaFrames(a, b, [t, ua], [t, ub], { intro: `$${a}\\times${b}$: both have ${t} tens.` });
          fr.push({ draw: fr[fr.length - 1].draw, say: `Shortcut: the three big blocks are $${t}\\times(${a}+${ub}) = ${t * (a + ub)}$, plus the small corner $${ua}\\times${ub}=${ua * ub}$ → <b>${a * b}</b>` });
          return fr;
        },
      }) },
    ],
    formulas: [h`(10t+a)(10t+b) = 10t(10t+a+b) + ab`, h`a+b=10 \Rightarrow \overline{ta}\cdot\overline{tb} = \overline{t(t+1)\,|\,ab}`],
    target: 5,
    drill() {
      const t = R.int(1, 9), a = R.int(1, 9), b = R.rand() < 0.4 ? 10 - a : R.int(1, 9), x = 10 * t + a, y = 10 * t + b;
      return { q: `${x} × ${y}`, a: x * y, sol: a + b === 10 ? `${t}×${t + 1} = ${t * (t + 1)} | ${a}×${b} = ${String(a * b).padStart(2, '0')} → ${x * y}` : `${t * 10}×(${x}+${b}) + ${a}×${b} = ${t * 10 * (x + b)} + ${a * b} = ${x * y}` };
    },
  });
})();
