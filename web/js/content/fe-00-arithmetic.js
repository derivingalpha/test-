/* FE Math · Unit 0: arithmetic foundations */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;

  MF.unit('fe', 'fe-u0', 'Arithmetic Foundations', 'Numbers, operations, fractions, percentages and powers. The ground floor everything else stands on.');

  MF.lesson({
    id: 'fe-arith', title: 'Numbers & the four operations', minutes: 10,
    summary: 'Addition as moving along the number line, multiplication as scaling, negatives as direction, division as the inverse of multiplication.',
    sections: [
      h`<p>Picture every real number as a point on an infinite line. Then each operation is a geometric action:</p>
      <ul><li><b>Addition</b> $a+b$: start at $a$, move $b$ steps (right if $b>0$, left if $b<0$).</li>
      <li><b>Subtraction</b> $a-b = a + (-b)$: move the opposite way. Also the <i>distance</i> from $b$ to $a$.</li>
      <li><b>Multiplication</b> $a\times b$: stretch $a$ by the factor $b$. A negative factor also flips direction, which is why $(-)(-) = (+)$: two flips cancel.</li>
      <li><b>Division</b> $a\div b$: the number you must scale $b$ by to reach $a$. Division by 0 is undefined because no scale factor turns 0 into a non-zero number.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Operations on the number line', height: 200,
        params: [{ id: 'a', label: 'a', min: -10, max: 10, step: 0.5, value: 3 }, { id: 'b', label: 'b', min: -4, max: 4, step: 0.5, value: -2 },
          { id: 'op', label: 'operation', type: 'select', value: '+', options: [['+', 'a + b'], ['-', 'a − b'], ['*', 'a × b']] }],
        draw(g, p) {
          const { a, b } = p, res = p.op === '+' ? a + b : p.op === '-' ? a - b : a * b;
          const lo = Math.min(-12, res - 2), hi = Math.max(12, res + 2);
          g.view(lo, hi, 0, 1, { l: 16, r: 16, t: 10, b: 10 }); MF.numberLine(g, lo, hi, 0.35, { step: lo < -20 || hi > 20 ? 5 : 1 });
          g.dot(0, 0.35, { color: C.muted, r: 3 });
          g.arrow(0, 0.55, a, 0.55, { color: C.fe, width: 3 }); g.text('a', a / 2, 0.66, { color: C.fe, bold: true });
          if (p.op === '*') { g.arrow(0, 0.8, res, 0.8, { color: C.good, width: 3 }); g.text(`a × ${b}`, res / 2, 0.9, { color: C.good, bold: true }); }
          else { const step = p.op === '+' ? b : -b; g.arrow(a, 0.75, a + step, 0.75, { color: C.speed, width: 3 }); g.text(p.op === '+' ? 'b' : '−b', a + step / 2, 0.86, { color: C.speed, bold: true }); }
          g.dot(res, 0.35, { color: C.good, r: 6 });
        },
        info: p => { const res = p.op === '+' ? p.a + p.b : p.op === '-' ? p.a - p.b : p.a * p.b; return h`$${fx(p.a)} ${p.op === '*' ? '\\times' : p.op === '-' ? '-' : '+'} (${fx(p.b)}) = ${fx(res, 3)}$`; },
      }) },
      h`<h3>Properties you'll use constantly</h3><ul>
      <li><b>Commutative:</b> $a+b=b+a$, $ab=ba$. <b>Associative:</b> $(a+b)+c = a+(b+c)$.</li>
      <li><b>Distributive:</b> $a(b+c) = ab+ac$. This is the engine behind factoring, expanding and every mental-math trick.</li>
      <li><b>Identities and inverses:</b> $a+0=a$, $a\cdot1=a$, $a+(-a)=0$, $a\cdot\frac1a = 1$.</li>
      <li><b>Absolute value</b> $|a|$ is the distance from 0, and $|a-b|$ is the distance between $a$ and $b$.</li></ul>`,
    ],
    formulas: [h`a - b = a + (-b)`, h`(-a)(-b) = ab`, h`a(b+c) = ab + ac`, h`|a - b| = \text{distance}(a,b)`],
    problems: [
      () => { const a = R.int(-20, 20), b = R.int(-20, 20), c = R.int(-9, 9); return { q: h`Compute $${a} - (${b}) + (${c})$`, a: a - b + c, sol: h`$${a} - (${b}) = ${a - b}$, then $+ (${c}) = ${a - b + c}$` }; },
      () => { const a = R.intNot(-12, 12, [0]), b = R.intNot(-12, 12, [0]); return { q: h`Compute $(${a})\times(${b})$`, a: a * b, sol: `Signs: ${(a < 0) !== (b < 0) ? 'one negative → negative' : 'same signs → positive'}. Result ${a * b}.` }; },
      () => { const b = R.intNot(-9, 9, [0, 1, -1]), q = R.intNot(-15, 15, [0]); return { q: h`Compute $${q * b} \div (${b})$`, a: q, sol: h`$${b}\times ${q} = ${q * b}$` }; },
      () => { const a = R.int(-15, 15), b = R.int(-15, 15); return { q: h`What is the distance between $${a}$ and $${b}$ on the number line?`, a: Math.abs(a - b), sol: h`$|${a} - (${b})| = ${Math.abs(a - b)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-order', title: 'Order of operations & expressions', minutes: 8,
    summary: 'Brackets, exponents, multiply/divide, add/subtract. Why the convention exists and how to evaluate cleanly.',
    sections: [
      h`<p>An expression like $3 + 4\times 2^2$ needs a convention for what happens first. The standard order is:</p>
      <ol><li><b>Brackets</b> (innermost first)</li><li><b>Exponents</b> (right to left: $2^{3^2} = 2^9$)</li><li><b>Multiplication and division</b>, left to right</li><li><b>Addition and subtraction</b>, left to right</li></ol>
      <p>So $3 + 4\times 2^2 = 3 + 4\times4 = 19$. Note that $-3^2 = -9$ (the exponent binds tighter than the minus sign) while $(-3)^2 = 9$.</p>
      <p>A useful mental model: the expression is a <b>tree</b>. Higher-precedence operations sit deeper and are evaluated first.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Evaluate as a tree', height: 240,
        random: () => ({}),
        frames() {
          const a = R.int(2, 9), b = R.int(2, 6), c = R.int(2, 3), d = R.int(1, 9);
          const pw = b ** c, prod = a * pw, tot = prod - d;
          const node = (g, x, y, t, col) => { const ctx = g.ctx; ctx.fillStyle = C.alpha(col, 0.2); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.fill(); ctx.stroke(); g.ptext(t, x, y, { bold: true, mono: true, size: 13 }); };
          const edge = (g, x1, y1, x2, y2) => { const ctx = g.ctx; ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x1, y1 + 20); ctx.lineTo(x2, y2 - 20); ctx.stroke(); };
          const tree = step => g => {
            g.noPad(); const W = g.W, X = f => W * f;
            edge(g, X(.5), 40, X(.3), 110); edge(g, X(.5), 40, X(.7), 110); edge(g, X(.3), 110, X(.18), 180); edge(g, X(.3), 110, X(.42), 180); edge(g, X(.42), 180, X(.34), 230 - 10); edge(g, X(.42), 180, X(.5), 230 - 10);
            node(g, X(.5), 40, step >= 3 ? String(tot) : '−', step >= 3 ? C.good : C.fe);
            node(g, X(.7), 110, String(d), C.muted);
            node(g, X(.3), 110, step >= 2 ? String(prod) : '×', step >= 2 ? C.good : C.fe);
            node(g, X(.18), 180, String(a), C.muted);
            node(g, X(.42), 180, step >= 1 ? String(pw) : '^', step >= 1 ? C.good : C.fe);
            if (step < 1) { node(g, X(.34), 220, String(b), C.muted); node(g, X(.5), 220, String(c), C.muted); }
          };
          return [
            { draw: tree(0), say: h`Evaluate $${a}\times ${b}^{${c}} - ${d}$. The deepest node goes first.` },
            { draw: tree(1), say: h`Exponent: $${b}^{${c}} = ${pw}$` },
            { draw: tree(2), say: h`Multiply: $${a}\times${pw} = ${prod}$` },
            { draw: tree(3), say: h`Subtract: $${prod} - ${d} = ${tot}$` },
          ];
        },
      }) },
    ],
    formulas: [h`-x^2 = -(x^2)`, h`a^{b^c} = a^{(b^c)}`, h`a - b - c = (a-b)-c`],
    problems: [
      () => { const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 5), d = R.int(1, 9); return { q: h`Evaluate $${a} + ${b}\times ${c}^2 - ${d}$`, a: a + b * c * c - d, sol: h`$${c}^2=${c * c}$, $${b}\times${c * c}=${b * c * c}$, then $${a}+${b * c * c}-${d} = ${a + b * c * c - d}$` }; },
      () => { const a = R.int(2, 9), b = R.int(2, 9), c = R.int(2, 6); return { q: h`Evaluate $(${a} + ${b})\times ${c} - ${a}\times${b}$`, a: (a + b) * c - a * b, sol: h`$${a + b}\times${c} - ${a * b} = ${(a + b) * c - a * b}$` }; },
      () => { const a = R.int(2, 6); return { q: h`Evaluate $-${a}^2 + (-${a})^2$`, a: 0, sol: h`$-${a}^2 = -${a * a}$ and $(-${a})^2 = ${a * a}$, sum 0` }; },
      () => { const d = R.int(2, 5), q = R.int(2, 9), b = R.int(1, 9); return { q: h`Evaluate $${q * d * 2} \div ${d} \div 2 + ${b}$`, a: q + b, sol: h`Left to right: $${q * d * 2}\div${d} = ${q * 2}$, $\div 2 = ${q}$, $+${b} = ${q + b}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-fractions', title: 'Fractions & decimals', minutes: 12,
    summary: 'A fraction is a division waiting to happen. Common denominators, multiplying, dividing, and converting to decimals.',
    sections: [
      h`<p>$\frac{a}{b}$ means "$a$ parts of size $\frac1b$". Key rules:</p>
      <ul><li><b>Equivalent fractions:</b> $\frac ab = \frac{ka}{kb}$. Simplify by dividing out $\gcd(a,b)$.</li>
      <li><b>Add/subtract:</b> rewrite over a common denominator: $\frac ab + \frac cd = \frac{ad+bc}{bd}$ (or use the lcm for smaller numbers).</li>
      <li><b>Multiply:</b> $\frac ab\cdot\frac cd = \frac{ac}{bd}$. This is area of a rectangle with sides $\frac ab$ and $\frac cd$.</li>
      <li><b>Divide:</b> multiply by the reciprocal: $\frac ab \div \frac cd = \frac ab\cdot\frac dc$.</li>
      <li><b>Decimal:</b> just divide. $\frac38 = 0.375$. Denominators with only factors 2 and 5 terminate; others repeat.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Adding fractions with bars', height: 220,
        params: [{ id: 'a', label: 'a', min: 1, max: 9, step: 1, value: 2, fmt: v => v }, { id: 'b', label: 'b', min: 2, max: 10, step: 1, value: 3, fmt: v => v }, { id: 'c', label: 'c', min: 1, max: 9, step: 1, value: 1, fmt: v => v }, { id: 'd', label: 'd', min: 2, max: 10, step: 1, value: 4, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const L = M.lcm(p.b, p.d), W = g.W - 40, ox = 20, c = g.ctx;
          const bar = (y, num, den, col, lab) => {
            for (let i = 0; i < Math.max(den, Math.ceil(num / den) * den); i++) { const x = ox + i * W / (2 * den) * 1; c.fillStyle = i < num ? C.alpha(col, 0.7) : '#111827'; c.fillRect(x + 1, y, W / (2 * den) - 2, 30); }
            g.ptext(lab, ox + W / 2 + 12, y + 15, { align: 'left', color: C.muted, size: 13, mono: true });
          };
          bar(20, p.a, p.b, C.fe, `${p.a}/${p.b} = ${p.a * L / p.b}/${L}`);
          bar(70, p.c, p.d, C.speed, `${p.c}/${p.d} = ${p.c * L / p.d}/${L}`);
          const tot = p.a * L / p.b + p.c * L / p.d;
          for (let i = 0; i < Math.max(L * 2, tot); i++) { const x = ox + i * W / (2 * L); c.fillStyle = i < p.a * L / p.b ? C.alpha(C.fe, 0.7) : i < tot ? C.alpha(C.speed, 0.7) : '#111827'; if (x + W / (2 * L) <= ox + W + 1) c.fillRect(x + 1, 140, W / (2 * L) - 2, 30); }
          g.ptext('common denominator ' + L, ox, 128, { align: 'left', color: C.dim, size: 11 });
          c.strokeStyle = C.text; c.lineWidth = 1; c.beginPath(); c.moveTo(ox + W / 2, 135); c.lineTo(ox + W / 2, 175); c.stroke(); g.ptext('1', ox + W / 2, 186, { color: C.dim, size: 11 });
        },
        info: p => { const L = M.lcm(p.b, p.d), n = p.a * L / p.b + p.c * L / p.d, gg = M.gcd(n, L); return h`$\frac{${p.a}}{${p.b}} + \frac{${p.c}}{${p.d}} = \frac{${p.a * L / p.b}}{${L}} + \frac{${p.c * L / p.d}}{${L}} = \frac{${n}}{${L}}${gg > 1 ? ` = \\frac{${n / gg}}{${L / gg}}` : ''} \approx ${fx(n / L, 4)}$`; },
      }) },
    ],
    formulas: [h`\frac ab + \frac cd = \frac{ad + bc}{bd}`, h`\frac ab \cdot \frac cd = \frac{ac}{bd}`, h`\frac ab \div \frac cd = \frac{ad}{bc}`],
    problems: [
      () => { const b = R.int(2, 9), d = R.intNot(2, 9, [b]), a = R.int(1, b - 1), c = R.int(1, d - 1); return { q: h`Compute $\frac{${a}}{${b}} + \frac{${c}}{${d}}$ (fraction or decimal)`, a: a / b + c / d, tol: 0.002, sol: h`$= \frac{${a * d + b * c}}{${b * d}} \approx ${fx(a / b + c / d, 4)}$` }; },
      () => { const a = R.int(1, 9), b = R.int(2, 9), c = R.int(1, 9), d = R.int(2, 9); return { q: h`Compute $\frac{${a}}{${b}} \div \frac{${c}}{${d}}$`, a: a * d / (b * c), tol: 0.002, sol: h`$\frac{${a}}{${b}}\cdot\frac{${d}}{${c}} = \frac{${a * d}}{${b * c}} \approx ${fx(a * d / (b * c), 4)}$` }; },
      () => { const d = R.pick([8, 16, 20, 25, 40, 32]), n = R.int(1, d - 1); return { q: h`Write $\frac{${n}}{${d}}$ as a decimal`, a: n / d, tol: 1e-6, sol: `${n} ÷ ${d} = ${n / d}` }; },
      () => { const g0 = R.int(2, 9), a = R.int(1, 9) * g0, b = R.int(2, 9) * g0; const gg = M.gcd(a, b); return { q: h`Simplify $\frac{${a}}{${b}}$. What is the denominator in lowest terms?`, a: b / gg, sol: h`$\gcd(${a},${b}) = ${gg}$ → $\frac{${a / gg}}{${b / gg}}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-percent', title: 'Percentages, ratios & returns', minutes: 12,
    summary: 'Percent means "per hundred". Returns, percentage points, ratios and why gains and losses are asymmetric.',
    sections: [
      h`<p>$p\% = \frac{p}{100}$. In finance, the most important percentage is the <b>return</b>:</p>
      $$r = \frac{P_1 - P_0}{P_0} = \frac{P_1}{P_0} - 1$$
      <p>Returns <b>compound by multiplication</b>, not addition: two periods with returns $r_1, r_2$ give total growth $(1+r_1)(1+r_2)$. That's why −50% then +50% leaves you at 75% of where you started.</p>
      <ul><li><b>Percentage points vs percent:</b> a rate rising from 4% to 5% is up 1 percentage point, but up 25% in relative terms.</li>
      <li><b>Ratios:</b> $a:b$ compares two quantities. Splitting 120 in ratio 3:5 gives $120\cdot\frac38 = 45$ and $75$.</li>
      <li><b>Log returns</b> $\ell = \ln(P_1/P_0)$ <i>add</i> across periods, which is why quants love them (more later).</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Compounding a sequence of returns', height: 260,
        params: [{ id: 'r', label: 'return each up-period', min: 0, max: 0.6, step: 0.01, value: 0.25, fmt: v => MF.pct(v, 0) }, { id: 'n', label: 'up/down pairs', min: 1, max: 20, step: 1, value: 8, fmt: v => v }],
        draw(g, p) {
          const pts = [[0, 100]]; let v = 100; for (let i = 0; i < 2 * p.n; i++) { v *= i % 2 === 0 ? 1 + p.r : 1 - p.r; pts.push([i + 1, v]); }
          g.view(0, 2 * p.n, 0, Math.max(...pts.map(q => q[1])) * 1.1).axes({ xlabel: 'period', ylabel: 'wealth' });
          g.hline(100); g.path(pts, { color: C.fe, width: 2.5 }); pts.forEach(q => g.dot(q[0], q[1], { r: 3, color: C.fe }));
        },
        info: p => h`Each pair multiplies wealth by $(1+r)(1-r) = 1 - r^2 = ${fx(1 - p.r * p.r, 4)}$. After ${p.n} pairs: ${fx(100 * (1 - p.r * p.r) ** p.n, 2)}. The average return is 0% but wealth shrinks.`,
      }) },
    ],
    formulas: [h`r = \frac{P_1}{P_0} - 1`, h`1 + R_{0\to n} = \prod_{i=1}^n (1+r_i)`, h`\ell = \ln\frac{P_1}{P_0},\quad \ell_{0\to n} = \sum \ell_i`],
    problems: [
      () => { const p0 = R.int(20, 200), r = R.pick([-0.3, -0.2, -0.15, -0.1, 0.05, 0.1, 0.12, 0.25, 0.4]); const p1 = M.round(p0 * (1 + r), 2); return { q: h`A stock goes from ${p0} to ${p1}. What is the return in %?`, a: r * 100, tol: 0.05, unit: '%', sol: h`$${p1}/${p0} - 1 = ${fx(r * 100, 2)}\%$` }; },
      () => { const a = R.pick([-0.5, -0.4, -0.25, -0.2, -0.1]); return { q: h`After a ${fx(-a * 100, 4)}% loss, what % gain is needed to break even?`, a: (1 / (1 + a) - 1) * 100, tol: 0.05, unit: '%', sol: h`$\frac{1}{1-${-a}} - 1 = ${fx((1 / (1 + a) - 1) * 100, 2)}\%$` }; },
      () => { const r1 = R.pick([0.1, 0.2, 0.05, -0.1, 0.3]), r2 = R.pick([-0.1, -0.2, 0.15, 0.1, -0.05]); return { q: h`Returns of ${fx(r1 * 100, 4)}% then ${fx(r2 * 100, 4)}%. Total return in %?`, a: ((1 + r1) * (1 + r2) - 1) * 100, tol: 0.05, unit: '%', sol: h`$(1${r1 >= 0 ? '+' : ''}${r1})(1${r2 >= 0 ? '+' : ''}${r2}) - 1 = ${fx(((1 + r1) * (1 + r2) - 1) * 100, 2)}\%$` }; },
      () => { const a = R.int(1, 7), b = R.int(1, 7), T = (a + b) * R.int(3, 20); return { q: h`Split ${T} in the ratio ${a}:${b}. What is the larger share?`, a: T * Math.max(a, b) / (a + b), sol: h`$${T}\cdot\frac{${Math.max(a, b)}}{${a + b}} = ${T * Math.max(a, b) / (a + b)}$` }; },
      () => { const r0 = R.int(2, 6), r1 = r0 + R.int(1, 3); return { q: h`A rate rises from ${r0}% to ${r1}%. By how many <b>percent</b> (relative) did it rise?`, a: (r1 / r0 - 1) * 100, tol: 0.05, unit: '%', sol: h`${r1 - r0} percentage points, but relative change $${r1}/${r0} - 1 = ${fx((r1 / r0 - 1) * 100, 2)}\%$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-exponents', title: 'Exponents, roots & scientific notation', minutes: 12,
    summary: 'Repeated multiplication and its laws, fractional and negative exponents, and handling very large or small numbers.',
    sections: [
      h`<p>$a^n = a\cdot a\cdots a$ ($n$ times). The laws all follow from counting factors:</p>
      <ul><li>$a^m a^n = a^{m+n}$, $\ \frac{a^m}{a^n} = a^{m-n}$, $\ (a^m)^n = a^{mn}$, $\ (ab)^n = a^nb^n$</li>
      <li>$a^0 = 1$ and $a^{-n} = \frac1{a^n}$ (forced by the quotient law)</li>
      <li>$a^{1/n} = \sqrt[n]{a}$ and $a^{m/n} = (\sqrt[n]a)^m$ (forced by the power law: $(a^{1/n})^n = a$)</li></ul>
      <p><b>Scientific notation</b> writes $x = m\times 10^k$ with $1\le m<10$: $0.000452 = 4.52\times10^{-4}$. Multiply by multiplying mantissas and adding exponents.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Exponential curves y = bˣ', height: 300,
        params: [{ id: 'b', label: 'base b', min: 0.2, max: 4, step: 0.05, value: 2 }, { id: 'x', label: 'x', min: -3, max: 3, step: 0.1, value: 1.5 }],
        draw(g, p) {
          g.view(-3.2, 3.2, -0.5, 9).axes();
          g.fn(x => Math.pow(p.b, x), { color: C.fe, width: 2.5 });
          g.fn(x => Math.pow(1 / p.b, x), { color: C.fe2, dash: [5, 4] });
          const y = Math.pow(p.b, p.x); g.vline(p.x); g.dot(p.x, y, { color: C.speed, r: 5 }); g.dot(0, 1, { color: C.muted, r: 4 });
          g.legend([[`${fx(p.b, 2)}^x`, C.fe], [`(1/${fx(p.b, 2)})^x`, C.fe2]], { x: 60 });
        },
        info: p => h`$${fx(p.b, 2)}^{${fx(p.x, 1)}} = ${fx(Math.pow(p.b, p.x), 4)}$. Every curve passes through $(0,1)$; $b>1$ grows and $b<1$ decays; $b^{-x} = (1/b)^x$.`,
      }) },
    ],
    formulas: [h`a^m a^n = a^{m+n}`, h`(a^m)^n = a^{mn}`, h`a^{-n} = 1/a^n`, h`a^{m/n} = \sqrt[n]{a^m}`],
    problems: [
      () => { const a = R.pick([2, 3, 5]), m = R.int(2, 6), n = R.int(-3, 4); return { q: h`Compute $${a}^{${m}}\cdot ${a}^{${n}}$`, a: Math.pow(a, m + n), rtol: 1e-3, sol: h`$${a}^{${m + n}} = ${fx(Math.pow(a, m + n), 6)}$` }; },
      () => { const b = R.pick([4, 8, 9, 16, 25, 27, 32, 64, 81]); const roots = { 4: [2, [1, 2]], 8: [2, [1, 3]], 9: [3, [1, 2]], 16: [2, [3, 4]], 25: [5, [3, 2]], 27: [3, [2, 3]], 32: [2, [3, 5]], 64: [2, [5, 6]], 81: [3, [3, 4]] }; const [, [m, n]] = roots[b]; return { q: h`Compute $${b}^{${m}/${n}}$`, a: Math.pow(b, m / n), rtol: 1e-6, sol: h`$(\sqrt[${n}]{${b}})^{${m}} = ${fx(Math.pow(b, m / n), 4)}$` }; },
      () => { const a = R.int(2, 9), b = R.int(2, 4); return { q: h`Compute $${a}^{-${b}}$ (decimal)`, a: Math.pow(a, -b), rtol: 1e-3, sol: h`$1/${a}^{${b}} = 1/${a ** b} \approx ${fx(Math.pow(a, -b), 6)}$` }; },
      () => { const m1 = R.float(1.1, 9.9, 1), k1 = R.int(-6, 6), m2 = R.float(1.1, 9.9, 1), k2 = R.int(-6, 6); const v = m1 * m2 * Math.pow(10, k1 + k2); const k = Math.floor(Math.log10(v)); return { q: h`$(${m1}\times10^{${k1}})(${m2}\times10^{${k2}}) = m\times 10^k$ with $1\le m<10$. What is $k$?`, a: k, sol: h`$${fx(m1 * m2, 2)}\times10^{${k1 + k2}}$ → $k = ${k}$` }; },
    ],
  });
})();
