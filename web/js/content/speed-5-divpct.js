/* Speed Math · Unit 5: division, fractions, percentages, checking & estimation */
(function () {
  'use strict';
  const { h, R, M, colors: C } = MF;

  MF.unit('speed', 'sm-u5', 'Division, Fractions, Percent & Estimation', 'Division as un-multiplying, benchmark fractions, percentage tricks, sanity checks and fast estimates.');

  MF.lesson({
    id: 'sm-div', title: 'Division tricks', minutes: 10,
    summary: 'Divide by 5, 25, 125 by multiplying; split divisors into factors; chunk the dividend into easy multiples.',
    sections: [
      h`<ul><li>$\div 5 = \times 2 \div 10$: $435/5 = 870/10 = 87$</li>
      <li>$\div 25 = \times 4 \div 100$: $675/25 = 2700/100 = 27$</li>
      <li>$\div 125 = \times 8 \div 1000$</li>
      <li><b>Factor the divisor:</b> $\div 12 = \div 4 \div 3$; $\div 36 = \div 4 \div 9$; $\div 15 = \div 3 \div 5$</li>
      <li><b>Chunk the dividend</b> into multiples you know: $952/7 = (700 + 210 + 42)/7 = 100 + 30 + 6 = 136$</li></ul>`,
      { viz: host => MF.walk(host, {
        title: 'Chunking: carve the dividend into easy multiples', height: 160,
        inputs: [{ id: 'n', label: 'Dividend', value: 952, min: 10, max: 99999 }, { id: 'd', label: 'Divisor', value: 7, min: 2, max: 99 }],
        random: () => { const d = R.int(3, 19); return { n: d * R.int(12, 199), d }; },
        frames({ n, d }) {
          n = Math.round(n); d = Math.round(d);
          const chunks = []; let rem = n;
          for (let p = 10 ** (String(Math.floor(n / d)).length - 1); p >= 1; p /= 10) { const k = Math.floor(rem / (d * p)); if (k) { chunks.push({ q: k * p, v: k * p * d }); rem -= k * p * d; } }
          const q = Math.floor(n / d);
          const bar = k => g => {
            g.view(0, n, 0, 1, { l: 16, r: 16, t: 10, b: 10 }); let x = 0;
            chunks.slice(0, k).forEach((ch, i) => { g.rect(x, 0.3, ch.v, 0.45, { fill: C.alpha(C.series[i % 8], 0.7), label: ch.v * 1 > n * 0.08 ? `${ch.v}` : '' }); g.text(`${d}×${ch.q}`, x + ch.v / 2, 0.15, { size: 11, color: C.muted }); x += ch.v; });
            if (x < n) g.rect(x, 0.3, n - x, 0.45, { fill: '#111827', color: C.dim, label: k === chunks.length && rem ? `r ${rem}` : '' });
          };
          const fr = [{ draw: bar(0), say: `${n} ÷ ${d}: take out the biggest easy multiple of ${d} you can.` }];
          let used = 0; chunks.forEach((ch, i) => { used += ch.v; fr.push({ draw: bar(i + 1), say: `${d} × ${ch.q} = ${ch.v}. Used ${used}, left ${n - used}.` }); });
          fr.push({ draw: bar(chunks.length), say: `Quotient = ${chunks.map(c => c.q).join(' + ')} = <b>${q}</b>${rem ? `, remainder ${rem}` : ''}` });
          return fr;
        },
      }) },
      { callout: 'tip', html: 'Division by 9 has a pretty pattern: 1/9 = 0.111…, n/9 = 0.nnn… and n/99 = 0.nnnn… in pairs (23/99 = 0.2323…).' },
    ],
    formulas: [h`\frac{n}{5} = \frac{2n}{10}`, h`\frac{n}{25} = \frac{4n}{100}`, h`\frac{n}{ab} = \frac{n/a}{b}`],
    target: 6,
    drill() {
      const t = R.pick(['5', '25', 'factor', 'chunk']);
      if (t === '5') { const q = R.int(21, 399); return { q: `${q * 5} ÷ 5`, a: q, sol: `${q * 5} × 2 ÷ 10 = ${q}` }; }
      if (t === '25') { const q = R.int(5, 99); return { q: `${q * 25} ÷ 25`, a: q, sol: `${q * 25} × 4 ÷ 100 = ${q}` }; }
      if (t === 'factor') { const d = R.pick([12, 15, 16, 18, 24, 36, 45]), q = R.int(6, 60); return { q: `${q * d} ÷ ${d}`, a: q, sol: `Split ${d} into factors: = ${q}` }; }
      const d = R.int(3, 9), q = R.int(21, 199); return { q: `${q * d} ÷ ${d}`, a: q, sol: `Chunk: ${q * d} ÷ ${d} = ${q}` };
    },
  });

  MF.lesson({
    id: 'sm-divisibility', title: 'Divisibility at a glance', minutes: 10,
    summary: 'Test for 2, 3, 4, 5, 6, 8, 9, 11 by looking at the digits instead of dividing.',
    sections: [
      h`<table><tr><th>÷</th><th>Test</th><th>Why</th></tr>
      <tr><td>2, 5, 10</td><td>last digit</td><td>10 is a multiple of each</td></tr>
      <tr><td>4</td><td>last two digits ÷ 4</td><td>100 = 4·25</td></tr>
      <tr><td>8</td><td>last three digits ÷ 8</td><td>1000 = 8·125</td></tr>
      <tr><td>3, 9</td><td>digit sum ÷ 3 (or 9)</td><td>$10 \equiv 1 \pmod 9$</td></tr>
      <tr><td>6</td><td>even and ÷3</td><td>6 = 2·3</td></tr>
      <tr><td>11</td><td>alternating digit sum ÷ 11</td><td>$10 \equiv -1 \pmod{11}$</td></tr>
      <tr><td>7</td><td>double the last digit, subtract from the rest; repeat</td><td>$10a+b \equiv 0 \iff a - 2b \equiv 0 \pmod 7$</td></tr></table>`,
      { viz: host => MF.explore(host, {
        title: 'Digit wheel (mod 9 and mod 11)', height: 200,
        params: [{ id: 'n', label: 'Number', type: 'number', value: 918082, min: 1, max: 999999999 }],
        draw(g, p) {
          g.noPad(); const ds = String(Math.round(p.n)).split('').map(Number), w = Math.min(46, (g.W - 20) / ds.length), ox = (g.W - w * ds.length) / 2;
          ds.forEach((d, i) => { const pos = ds.length - 1 - i, plus = pos % 2 === 0; const c = g.ctx; c.fillStyle = C.alpha(plus ? C.fe : C.pink, 0.2); c.fillRect(ox + i * w + 2, 30, w - 4, 50); g.ptext(String(d), ox + (i + .5) * w, 55, { size: 24, bold: true, mono: true }); g.ptext(plus ? '+' : '−', ox + (i + .5) * w, 96, { color: plus ? C.fe : C.pink, bold: true }); });
          const s = M.sum(ds), alt = ds.reduce((a, d, i) => a + ((ds.length - 1 - i) % 2 === 0 ? d : -d), 0);
          g.ptext(`digit sum = ${s} → digital root ${M.digitalRoot(s)}`, g.W / 2, 130, { color: C.fe, size: 14 });
          g.ptext(`alternating sum = ${alt}`, g.W / 2, 156, { color: C.pink, size: 14 });
        },
        info: p => { const n = Math.round(p.n); return [2, 3, 4, 5, 6, 7, 8, 9, 11].map(d => `<span class="kv"><span>÷${d}</span><b style="color:${n % d === 0 ? 'var(--good)' : 'var(--dim)'}">${n % d === 0 ? 'yes' : 'no'}</b></span>`).join(''); },
      }) },
    ],
    formulas: [h`10 \equiv 1 \pmod 9 \Rightarrow n \equiv \textstyle\sum d_i \pmod 9`, h`10 \equiv -1 \pmod{11} \Rightarrow n \equiv \textstyle\sum (-1)^i d_i \pmod{11}`],
    target: 5,
    problems: [() => {
      const d = R.pick([3, 4, 6, 8, 9, 11]); const yes = R.rand() < 0.5; let n = R.int(1000, 99999); if (yes) n -= n % d; else if (n % d === 0) n += 1;
      return { q: `Is <b>${n}</b> divisible by <b>${d}</b>?`, choices: ['Yes', 'No'], a: n % d === 0 ? 0 : 1, sol: d === 3 || d === 9 ? `Digit sum ${M.digitSum(n)}` : d === 11 ? 'Alternating digit sum test' : d === 4 ? `Last two digits ${n % 100}` : d === 8 ? `Last three digits ${n % 1000}` : `Even? and digit sum ${M.digitSum(n)}` };
    }],
    drill() { const n = R.int(100, 99999); return { q: `${n} mod 9`, a: n % 9, sol: `Digit sum ${M.digitSum(n)} → ${n % 9}` }; },
  });

  MF.lesson({
    id: 'sm-fractions', title: 'Benchmark fractions ↔ decimals ↔ %', minutes: 10,
    summary: 'Memorise a small table (halves through twelfths) and derive everything else by scaling.',
    sections: [
      h`<p>Fluency in finance and estimation means seeing $\tfrac38$ and instantly thinking <b>0.375 = 37.5%</b>. Learn the unit fractions, and the rest are multiples:</p>
      <table><tr><th>1/2</th><th>1/3</th><th>1/4</th><th>1/5</th><th>1/6</th><th>1/7</th><th>1/8</th><th>1/9</th><th>1/11</th><th>1/12</th></tr>
      <tr><td>.5</td><td>.333</td><td>.25</td><td>.2</td><td>.1667</td><td>.142857</td><td>.125</td><td>.111</td><td>.0909</td><td>.0833</td></tr></table>
      <p><b>Sevenths cycle:</b> $1/7 = 0.\overline{142857}$, and every $k/7$ uses the same six digits starting at a different place: $2/7 = .285714$, $3/7=.428571$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Fraction pie', height: 250,
        params: [{ id: 'n', label: 'numerator', min: 1, max: 11, step: 1, value: 3, fmt: v => v }, { id: 'd', label: 'denominator', min: 2, max: 12, step: 1, value: 8, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const n = Math.min(p.n, p.d), d = p.d, cx = 130, cy = g.H / 2, r = Math.min(100, g.H / 2 - 15), c = g.ctx;
          for (let i = 0; i < d; i++) { const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, r, a0, a1); c.closePath(); c.fillStyle = i < n ? C.alpha(C.speed, 0.8) : '#111827'; c.fill(); c.strokeStyle = '#0b0f17'; c.lineWidth = 2; c.stroke(); }
          const v = n / d;
          g.ptext(`${n}/${d}`, cx + r + 40, cy - 40, { align: 'left', size: 26, bold: true, mono: true });
          g.ptext(`= ${MF.fx(v, 6)}`, cx + r + 40, cy, { align: 'left', size: 22, mono: true, color: C.fe });
          g.ptext(`= ${MF.fx(v * 100, 4)}%`, cx + r + 40, cy + 36, { align: 'left', size: 22, mono: true, color: C.good });
        },
        info: p => { const n = Math.min(p.n, p.d), d = p.d, gg = M.gcd(n, d); return gg > 1 ? `Simplifies to ${n / gg}/${d / gg}.` : `Already in lowest terms. ${n}/${d} = ${n} × (1/${d}) = ${n} × ${MF.fx(1 / d, 5)}`; },
      }) },
      { callout: 'tip', html: 'Odd denominators via scaling: 7/16 = 7 × 0.0625 = 0.4375. 5/6 = 1 − 1/6 = 0.8333. 3/40 = 7.5/100 = 0.075.' },
    ],
    formulas: [h`\tfrac{k}{8} = k\times 0.125`, h`\tfrac17 = 0.\overline{142857}`],
    target: 5,
    drill() { const d = R.pick([3, 4, 5, 6, 8, 9, 12, 16, 20, 25, 40]); let n = R.int(1, d - 1); while (M.gcd(n, d) !== 1) n = R.int(1, d - 1); const v = n / d * 100; const exact = Math.abs(v * 100 - Math.round(v * 100)) < 1e-9; return { q: `${n}/${d} as a %`, a: M.round(v, 2), tol: exact ? 0.001 : 0.05, enter: !exact, sol: `${n}/${d} = ${MF.fx(v, 3)}%` }; },
  });

  MF.lesson({
    id: 'sm-percent', title: 'Percentage tricks', minutes: 10,
    summary: 'x% of y = y% of x. Build any percentage from 10%, 5% and 1%. Percent change and reversals.',
    sections: [
      h`<ul><li><b>Swap:</b> $x\%$ of $y$ = $y\%$ of $x$ since both are $xy/100$. So 16% of 25 = 25% of 16 = 4.</li>
      <li><b>Building blocks:</b> 10% (shift one place), 5% (half of that), 1% (shift two). Then 17.5% = 10% + 5% + 2.5%.</li>
      <li><b>Percent change:</b> new/old − 1. From 80 to 92 is $12/80 = 15\%$.</li>
      <li><b>Successive changes multiply:</b> +20% then −20% is $1.2\times0.8 = 0.96$, a 4% loss.</li>
      <li><b>Reverse a change:</b> a price after a 25% rise is 150, so the original was $150/1.25 = 120$, not $150\times 0.75$.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Up then down is not even', height: 220,
        params: [{ id: 'up', label: 'rise %', min: 0, max: 100, step: 1, value: 50, fmt: v => v + '%' }, { id: 'dn', label: 'then fall %', min: 0, max: 90, step: 1, value: 50, fmt: v => v + '%' }],
        draw(g, p) {
          const v1 = 100 * (1 + p.up / 100), v2 = v1 * (1 - p.dn / 100);
          g.view(-0.5, 2.5, 0, Math.max(200, v1 * 1.1)).axes({ xstep: 1, fx: v => ['start', 'after rise', 'after fall'][v] || '' });
          [[0, 100, C.muted], [1, v1, C.good], [2, v2, v2 >= 100 ? C.good : C.bad]].forEach(([x, y, col]) => { g.rect(x - 0.3, 0, 0.6, y, { fill: C.alpha(col, 0.6), color: col }); g.text(MF.fmt(y, 1), x, y, { dy: -10, bold: true, mono: true }); });
          g.hline(100);
        },
        info: p => { const net = (1 + p.up / 100) * (1 - p.dn / 100) - 1; const need = 1 / (1 + p.up / 100) - 1; return h`Net change: $(1+${p.up / 100})(1-${p.dn / 100}) - 1 = ${MF.fx(net * 100, 2)}\%$. To undo a ${p.up}% rise you need a fall of only ${MF.fx(-need * 100, 2)}%.`; },
      }) },
      { callout: 'key', html: 'This asymmetry is the root of "volatility drag" in finance: a −50% loss needs +100% to recover. You\'ll formalise it as the arithmetic-vs-geometric mean gap in the FE track.' },
    ],
    formulas: [h`x\%\text{ of }y = y\%\text{ of }x`, h`\text{change} = \tfrac{\text{new}}{\text{old}} - 1`, h`(1+a)(1+b)-1 = a + b + ab`],
    target: 6,
    drill() {
      const t = R.pick(['of', 'of', 'swap', 'chg', 'rev']);
      if (t === 'of') { const p = R.pick([5, 10, 15, 20, 25, 30, 35, 40, 12.5, 17.5, 60, 75]), y = R.int(2, 40) * 20; return { q: `${p}% of ${y}`, a: p * y / 100, sol: `${p}% of ${y} = ${MF.fx(p * y / 100, 2)}` }; }
      if (t === 'swap') { const x = R.pick([4, 8, 12, 16, 20, 36, 44, 48, 32]), y = R.pick([25, 50, 75]); return { q: `${x}% of ${y}`, a: x * y / 100, sol: `= ${y}% of ${x} = ${x * y / 100}` }; }
      if (t === 'chg') { const o = R.pick([40, 50, 80, 120, 160, 200, 250]), pc = R.pick([-25, -20, -10, 5, 10, 15, 20, 25, 30, 40]); const n = o * (1 + pc / 100); return { q: `${o} → ${MF.fx(n, 2)}: % change?`, a: pc, sol: `(${MF.fx(n, 2)} − ${o}) / ${o} = ${pc}%` }; }
      const o = R.pick([40, 60, 80, 120, 160, 200]), pc = R.pick([25, 20, 50, 60]); const nv = M.round(o * (1 + pc / 100), 2); return { q: `After a ${pc}% rise it's ${nv}. Original?`, a: o, sol: `${nv} ÷ ${1 + pc / 100} = ${o}` };
    },
  });

  MF.lesson({
    id: 'sm-check', title: 'Casting out nines (instant checks)', minutes: 8,
    summary: 'Digital roots survive +, −, ×. Check any calculation in two seconds.',
    sections: [
      h`<p>The <b>digital root</b> (repeated digit sum) of a number equals the number mod 9. Since $(a\bmod 9)(b\bmod 9) \equiv ab \pmod 9$, you can check a product by multiplying digital roots:</p>
      <p>Is $487 \times 362 = 176294$? Digital roots: $487 \to 19 \to 1$, $362 \to 11 \to 2$, product $\to 2$. Answer: $176294 \to 29 \to 11 \to 2$. ✓ Consistent.</p>
      <p>It can't catch every error (swapped digits keep the same digit sum), so also check with <b>mod 11</b> (alternating sum) or by estimation for important results.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Check a product', height: 140,
        params: [{ id: 'a', label: 'a', type: 'number', value: 487 }, { id: 'b', label: 'b', type: 'number', value: 362 }, { id: 'c', label: 'claimed a × b', type: 'number', value: 176294 }],
        draw(g, p) {
          g.noPad(); const ra = M.digitalRoot(Math.round(p.a)), rb = M.digitalRoot(Math.round(p.b)), rp = M.digitalRoot(ra * rb), rc = M.digitalRoot(Math.round(p.c));
          const items = [[`dr(a) = ${ra}`, C.speed], [`dr(b) = ${rb}`, C.speed], [`dr(${ra}×${rb}) = ${rp}`, C.fe], [`dr(claim) = ${rc}`, rp === rc ? C.good : C.bad]];
          items.forEach(([t, col], i) => g.ptext(t, (i + 0.5) * g.W / 4, 50, { color: col, size: 16, bold: true, mono: true }));
          g.ptext(rp === rc ? (Math.round(p.a) * Math.round(p.b) === Math.round(p.c) ? 'passes ✓ (and is correct)' : 'passes ✓ but is actually wrong! (nines can be fooled)') : 'fails ✗ definitely wrong', g.W / 2, 100, { color: rp === rc ? C.good : C.bad, size: 15 });
        },
      }) },
    ],
    formulas: [h`\mathrm{dr}(n) = 1 + ((n-1)\bmod 9)`, h`\mathrm{dr}(ab) = \mathrm{dr}(\mathrm{dr}(a)\,\mathrm{dr}(b))`],
    target: 4,
    drill() { const n = R.int(1000, 999999); return { q: `digital root of ${n}`, a: M.digitalRoot(n), sol: `${String(n).split('').join('+')} = ${M.digitSum(n)} → ${M.digitalRoot(n)}` }; },
  });

  MF.lesson({
    id: 'sm-estimate', title: 'Fast estimation & orders of magnitude', minutes: 10,
    summary: 'Round to one or two significant figures, track powers of ten separately, and correct for rounding direction.',
    sections: [
      h`<p>For $\displaystyle\frac{4{,}812 \times 0.0387}{61.2}$, round to $\frac{5000\times 0.04}{60} = \frac{200}{60}\approx 3.3$. The exact value is 3.04. A few habits keep estimates tight:</p>
      <ul><li><b>Split mantissa and exponent:</b> $4.8\times10^3 \cdot 3.9\times 10^{-2} = 18.7\times10^{1}$.</li>
      <li><b>Round in opposite directions</b> in a product (one up, one down) so the errors cancel.</li>
      <li><b>Use known anchors:</b> $\sqrt{10}\approx 3.16$, $\ln 2\approx 0.693$, $2^{10}\approx 10^3$, $e\approx 2.718$.</li>
      <li><b>Rule of 72:</b> money doubles in about $72/r$ years at $r\%$ growth.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Rule of 72 vs exact doubling time', height: 260,
        params: [{ id: 'r', label: 'growth rate r%', min: 1, max: 30, step: 0.5, value: 8, fmt: v => v + '%' }],
        draw(g, p) {
          g.view(0.5, 30, 0, 75).axes({ xlabel: 'r %', ylabel: 'years to double' });
          g.fn(r => Math.log(2) / Math.log(1 + r / 100), { color: C.speed, width: 2.5, from: 0.5 });
          g.fn(r => 72 / r, { color: C.fe, dash: [6, 4], from: 1 });
          g.fn(r => 69.3 / r, { color: C.pink, dash: [2, 4], from: 1 });
          g.vline(p.r); g.dot(p.r, Math.log(2) / Math.log(1 + p.r / 100), { color: C.speed, r: 5 });
          g.legend([['exact ln2 / ln(1+r)', C.speed], ['72 / r', C.fe], ['69.3 / r (continuous)', C.pink]], { x: g.W - 200 });
        },
        info: p => `Exact: <b>${MF.fx(Math.log(2) / Math.log(1 + p.r / 100), 2)}</b> years. Rule of 72: <b>${MF.fx(72 / p.r, 2)}</b>.`,
      }) },
      { callout: 'tip', html: 'Estimation answers get credit within 5% here. Speed matters more than the last digit.' },
    ],
    formulas: [h`T_{2\times} = \frac{\ln 2}{\ln(1+r)} \approx \frac{72}{100r}`, h`2^{10}\approx 10^3`],
    target: 8,
    drill() {
      const t = R.pick(['prod', 'quot', '72']);
      if (t === 'prod') { const a = R.int(110, 980), b = R.int(11, 98); return { q: `≈ ${a} × ${b}`, a: a * b, rtol: 0.05, enter: true, sol: `≈ ${a * b}` }; }
      if (t === 'quot') { const a = R.int(1000, 99000), b = R.int(12, 97); return { q: `≈ ${a} ÷ ${b}`, a: a / b, rtol: 0.05, enter: true, sol: `≈ ${MF.fx(a / b, 1)}` }; }
      const r = R.pick([2, 3, 4, 6, 8, 9, 12]); return { q: `Years to double at ${r}%?`, a: Math.log(2) / Math.log(1 + r / 100), rtol: 0.05, enter: true, sol: `72 / ${r} ≈ ${MF.fx(72 / r, 1)}` };
    },
  });

  MF.lesson({
    id: 'sm-choose', title: 'Choosing the method (interleaved)', minutes: 10,
    summary: 'The real skill is recognising which trick fits. This lesson mixes every multiplication type so you practise choosing.',
    sections: [
      h`<p>Research on <b>interleaved practice</b> shows that mixing problem types feels harder but produces far better long-term skill than doing one type at a time. Mixing trains <i>discrimination</i>: spotting which method a problem calls for. Use this decision list:</p>
      <ol><li>Is a factor 5, 25, 50, 125, 9, 99, or 11? → <a href="#/lesson/sm-x5-25">fraction trick</a> / <a href="#/lesson/sm-x9">nines</a> / <a href="#/lesson/sm-x11">elevens</a></li>
      <li>Are both close to 100 or 1000? → <a href="#/lesson/sm-nearbase">near base</a></li>
      <li>Are they symmetric around a round number? → <a href="#/lesson/sm-diffsq">difference of squares</a></li>
      <li>Same tens digit? → <a href="#/lesson/sm-teens">same tens</a> (units sum to 10 → instant)</li>
      <li>Same number twice? → <a href="#/lesson/sm-sq-any">squaring</a></li>
      <li>Otherwise → <a href="#/lesson/sm-area">area model</a> or <a href="#/lesson/sm-cross">crosswise</a></li></ol>`,
      { callout: 'tip', html: 'In <a href="#/drills">Sprint</a> mode, pick all of Unit 3 and Unit 4 at once for an interleaved workout.' },
    ],
    target: 8,
    drill() {
      const ids = ['sm-x11', 'sm-x5-25', 'sm-x9', 'sm-nearbase', 'sm-diffsq', 'sm-teens', 'sm-sq5', 'sm-sq-near', 'sm-sq-any', 'sm-area', 'sm-x1digit'];
      const L = MF.lessons[R.pick(ids)]; const p = L.drill(); p.sol = `Method: <a href="#/lesson/${L.id}">${L.title}</a>. ${p.sol || ''}`; return p;
    },
  });
})();
