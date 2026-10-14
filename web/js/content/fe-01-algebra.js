/* FE Math · Unit 1: algebra & functions */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;
  const sgn = v => (v < 0 ? '-' : '+') + ' ' + Math.abs(v);

  MF.unit('fe', 'fe-u1', 'Algebra & Functions', 'Unknowns, lines, curves, inverses, exponentials, logarithms and series: the vocabulary of every model.');

  MF.lesson({
    id: 'fe-linear', title: 'Linear equations & straight lines', minutes: 12,
    summary: 'Solve ax + b = c by undoing operations; read y = mx + c as "start at c, rise m per unit".',
    sections: [
      h`<p>An <b>equation</b> is a balance. Do the same thing to both sides and it stays balanced. To solve $3x + 7 = 22$, undo in reverse order: subtract 7 to get $3x = 15$, then divide by 3 to get $x = 5$.</p>
      <p>A <b>linear function</b> $y = mx + c$ graphs as a straight line. $m$ is the <b>slope</b> (rise over run, $\Delta y/\Delta x$) and $c$ is the <b>intercept</b> (value at $x=0$). The line through $(x_1,y_1)$ and $(x_2,y_2)$ has slope $m = \frac{y_2-y_1}{x_2-x_1}$.</p>
      <p>Finance example: a bond's accrued interest grows linearly in time. Linear approximations, as in duration, are the first tool used to analyse anything nonlinear.</p>`,
      { viz: host => MF.explore(host, {
        title: 'y = m x + c', height: 300,
        params: [{ id: 'm', label: 'slope m', min: -4, max: 4, step: 0.1, value: 1.5 }, { id: 'c', label: 'intercept c', min: -6, max: 6, step: 0.1, value: -2 }, { id: 'y', label: 'solve m x + c = y₀ for y₀', min: -8, max: 8, step: 0.5, value: 4 }],
        draw(g, p) {
          g.view(-8, 8, -8, 8).axes();
          g.fn(x => p.m * x + p.c, { color: C.fe, width: 2.5 });
          g.dot(0, p.c, { color: C.speed, r: 5 });
          g.line(1, p.m + p.c, 2, p.m + p.c, { color: C.speed, width: 1.5 }); g.line(2, p.m + p.c, 2, 2 * p.m + p.c, { color: C.speed, width: 1.5 }); g.text('m', 2.3, 1.5 * p.m + p.c, { color: C.speed, size: 12 });
          g.hline(p.y, { color: C.pink });
          if (Math.abs(p.m) > 1e-9) { const x = (p.y - p.c) / p.m; g.vline(x, { color: C.pink }); g.dot(x, p.y, { color: C.pink, r: 6 }); }
        },
        info: p => Math.abs(p.m) < 1e-9 ? 'Slope 0: horizontal line, so there is no unique solution.' : h`$${fx(p.m, 1)}x ${sgn(fx(p.c, 1))} = ${fx(p.y, 1)} \Rightarrow x = \frac{${fx(p.y, 1)} ${sgn(fx(-p.c, 1))}}{${fx(p.m, 1)}} = ${fx((p.y - p.c) / p.m, 3)}$`,
      }) },
    ],
    formulas: [h`ax + b = c \Rightarrow x = \frac{c-b}{a}`, h`m = \frac{y_2 - y_1}{x_2 - x_1}`, h`y - y_1 = m(x - x_1)`],
    problems: [
      () => { const a = R.intNot(-9, 9, [0]), x = R.int(-10, 10), b = R.int(-20, 20); return { q: h`Solve $${a}x ${sgn(b)} = ${a * x + b}$`, a: x, sol: h`$${a}x = ${a * x}$ → $x = ${x}$` }; },
      () => { const x1 = R.int(-5, 5), x2 = R.intNot(-5, 5, [x1]), y1 = R.int(-9, 9), y2 = R.int(-9, 9); return { q: h`Slope of the line through $(${x1},${y1})$ and $(${x2},${y2})$?`, a: (y2 - y1) / (x2 - x1), tol: 0.01, sol: h`$\frac{${y2} - (${y1})}{${x2} - (${x1})} = ${fx((y2 - y1) / (x2 - x1), 4)}$` }; },
      () => { const a = R.int(2, 6), b = R.int(1, 9), c = R.intNot(1, 5, [a]), x = R.int(-6, 8); const d = a * x + b - c * x; return { q: h`Solve $${a}x + ${b} = ${c}x ${sgn(d)}$`, a: x, sol: h`$(${a}-${c})x = ${d} - ${b}$ → $x = ${x}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-systems', title: 'Systems of linear equations', minutes: 12,
    summary: 'Two equations, two unknowns: the intersection of two lines. Substitution, elimination, and when there is no unique solution.',
    sections: [
      h`<p>A system like</p>$$\begin{cases} 2x + y = 7\\ x - y = -1\end{cases}$$<p>asks for the point lying on <b>both</b> lines. <b>Elimination</b>: add the equations to get $3x = 6$, so $x=2$ and $y = 3$. <b>Substitution</b>: from the second, $x = y-1$; plug into the first.</p>
      <p>Geometrically there are three cases: the lines cross (one solution), are parallel (none), or coincide (infinitely many). In matrix form $A\mathbf x = \mathbf b$, a unique solution exists exactly when $\det A \ne 0$. You'll meet this again in linear algebra, and in finance when you <b>replicate a payoff</b> with a portfolio of assets.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Two lines', height: 300,
        params: [{ id: 'a1', label: 'a₁', min: -3, max: 3, step: 0.5, value: 2 }, { id: 'b1', label: 'b₁', min: -3, max: 3, step: 0.5, value: 1 }, { id: 'c1', label: 'c₁', min: -8, max: 8, step: 0.5, value: 7 },
          { id: 'a2', label: 'a₂', min: -3, max: 3, step: 0.5, value: 1 }, { id: 'b2', label: 'b₂', min: -3, max: 3, step: 0.5, value: -1 }, { id: 'c2', label: 'c₂', min: -8, max: 8, step: 0.5, value: -1 }],
        draw(g, p) {
          g.view(-8, 8, -8, 8).axes();
          const line = (a, b, c, col) => { if (Math.abs(b) > 1e-9) g.fn(x => (c - a * x) / b, { color: col, width: 2.5 }); else if (Math.abs(a) > 1e-9) g.vline(c / a, { color: col, dash: [], width: 2.5 }); };
          line(p.a1, p.b1, p.c1, C.fe); line(p.a2, p.b2, p.c2, C.speed);
          const D = p.a1 * p.b2 - p.a2 * p.b1;
          if (Math.abs(D) > 1e-9) { const x = (p.c1 * p.b2 - p.c2 * p.b1) / D, y = (p.a1 * p.c2 - p.a2 * p.c1) / D; g.dot(x, y, { color: C.good, r: 6 }); }
        },
        info: p => { const D = p.a1 * p.b2 - p.a2 * p.b1; if (Math.abs(D) < 1e-9) return h`$\det = 0$: the lines are parallel or identical, so there is no unique solution.`; const x = (p.c1 * p.b2 - p.c2 * p.b1) / D, y = (p.a1 * p.c2 - p.a2 * p.c1) / D; return h`$\det A = ${fx(D, 2)}$. Solution (Cramer): $x = ${fx(x, 3)},\ y = ${fx(y, 3)}$`; },
      }) },
    ],
    formulas: [h`x = \frac{c_1 b_2 - c_2 b_1}{a_1b_2 - a_2b_1},\quad y = \frac{a_1c_2 - a_2c_1}{a_1b_2-a_2b_1}`],
    problems: [
      () => { let a1, b1, a2, b2; do { a1 = R.intNot(-5, 5, [0]); b1 = R.intNot(-5, 5, [0]); a2 = R.intNot(-5, 5, [0]); b2 = R.intNot(-5, 5, [0]); } while (a1 * b2 - a2 * b1 === 0); const x = R.int(-6, 6), y = R.int(-6, 6); const ask = R.pick(['x', 'y']); return { q: h`Solve $\begin{cases}${a1}x ${sgn(b1)}y = ${a1 * x + b1 * y}\\ ${a2}x ${sgn(b2)}y = ${a2 * x + b2 * y}\end{cases}$. What is $${ask}$?`, a: ask === 'x' ? x : y, sol: h`$x = ${x},\ y = ${y}$` }; },
      () => { const p1 = R.int(2, 9), p2 = R.intNot(2, 9, [p1]), n1 = R.int(1, 9), n2 = R.int(1, 9); return { q: h`A portfolio of $a$ shares of A (price ${p1}) and $b$ shares of B (price ${p2}) costs ${p1 * n1 + p2 * n2} and holds ${n1 + n2} shares in total. Find $a$.`, a: n1, sol: h`$a + b = ${n1 + n2}$, $${p1}a + ${p2}b = ${p1 * n1 + p2 * n2}$ → $a = ${n1}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-quadratics', title: 'Quadratics & parabolas', minutes: 12,
    summary: 'ax² + bx + c: completing the square, the quadratic formula, the discriminant and the vertex.',
    sections: [
      h`<p>Quadratics appear everywhere in finance: portfolio variance is a quadratic in the weights, mean–variance utility is $\mu - \frac\gamma2\sigma^2$, and convexity adds a squared term to bond-price changes.</p>
      <p><b>Completing the square:</b> $ax^2+bx+c = a\left(x + \frac{b}{2a}\right)^2 + c - \frac{b^2}{4a}$. This shows the <b>vertex</b> at $x^* = -\frac{b}{2a}$ (the minimum if $a>0$) and gives the roots:</p>
      $$x = \frac{-b \pm\sqrt{b^2-4ac}}{2a}$$
      <p>The <b>discriminant</b> $\Delta = b^2 - 4ac$ counts real roots: two if $\Delta>0$, one if $\Delta=0$, none if $\Delta<0$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Parabola, vertex and roots', height: 300,
        params: [{ id: 'a', label: 'a', min: -3, max: 3, step: 0.1, value: 1 }, { id: 'b', label: 'b', min: -8, max: 8, step: 0.1, value: -2 }, { id: 'c', label: 'c', min: -8, max: 8, step: 0.1, value: -3 }],
        draw(g, p) {
          g.view(-8, 8, -10, 10).axes();
          g.fn(x => p.a * x * x + p.b * x + p.c, { color: C.fe, width: 2.5 });
          if (Math.abs(p.a) > 1e-9) {
            const xv = -p.b / (2 * p.a), yv = p.c - p.b * p.b / (4 * p.a); g.dot(xv, yv, { color: C.speed, r: 6 }); g.vline(xv, { color: C.speed });
            const D = p.b * p.b - 4 * p.a * p.c; if (D >= 0) [(-p.b + Math.sqrt(D)) / (2 * p.a), (-p.b - Math.sqrt(D)) / (2 * p.a)].forEach(r => g.dot(r, 0, { color: C.good, r: 6 }));
          }
        },
        info: p => { if (Math.abs(p.a) < 1e-9) return 'a = 0: this is a line, not a parabola.'; const D = p.b * p.b - 4 * p.a * p.c; return h`$\Delta = ${fx(D, 2)}$. Vertex $x^* = ${fx(-p.b / (2 * p.a), 3)}$. ${D >= 0 ? h`Roots: $${fx((-p.b - Math.sqrt(D)) / (2 * p.a), 3)},\ ${fx((-p.b + Math.sqrt(D)) / (2 * p.a), 3)}$` : 'No real roots.'}`; },
      }) },
    ],
    formulas: [h`x = \frac{-b\pm\sqrt{b^2-4ac}}{2a}`, h`x^* = -\frac{b}{2a}`, h`ax^2+bx+c = a(x-x_1)(x-x_2)`],
    problems: [
      () => { const r1 = R.int(-8, 8), r2 = R.int(-8, 8), b = -(r1 + r2), c = r1 * r2; return { q: h`Find the larger root of $x^2 ${sgn(b)}x ${sgn(c)} = 0$`, a: Math.max(r1, r2), sol: h`$(x ${sgn(-r1)})(x ${sgn(-r2)}) = 0$ → roots ${r1}, ${r2}` }; },
      () => { const a = R.int(1, 4), b = R.int(-12, 12), c = R.int(-5, 5); return { q: h`At what $x$ is $${a}x^2 ${sgn(b)}x ${sgn(c)}$ minimised?`, a: -b / (2 * a), tol: 0.005, sol: h`$x^* = -\frac{${b}}{2\cdot${a}} = ${fx(-b / (2 * a), 3)}$` }; },
      () => { const a = R.intNot(-4, 4, [0]), b = R.int(-9, 9), c = R.int(-9, 9); const D = b * b - 4 * a * c; return { q: h`How many real roots does $${a}x^2 ${sgn(b)}x ${sgn(c)} = 0$ have?`, choices: ['0', '1', '2'], a: D > 0 ? 2 : D === 0 ? 1 : 0, sol: h`$\Delta = ${b}^2 - 4(${a})(${c}) = ${D}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-functions', title: 'Functions, composition & inverses', minutes: 12,
    summary: 'A function maps inputs to outputs. Compose them to chain models, invert them to solve for the input.',
    sections: [
      h`<p>A <b>function</b> $f: X\to Y$ assigns each input exactly one output. Finance is full of them: price as a function of yield, option value as a function of the stock price, utility as a function of wealth.</p>
      <ul><li><b>Composition</b> $(f\circ g)(x) = f(g(x))$: run $g$, then feed the result into $f$. Order matters.</li>
      <li><b>Inverse</b> $f^{-1}$ undoes $f$: $f^{-1}(f(x)) = x$. It exists when $f$ is one-to-one (strictly increasing or decreasing). Its graph is the reflection of $f$ in the line $y=x$.</li>
      <li>Solving $f(x) = y$ <i>is</i> evaluating $f^{-1}(y)$. Implied volatility is the inverse of the Black–Scholes price in $\sigma$, and yield to maturity is the inverse of the bond price.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'A function and its mirror image', height: 320,
        params: [{ id: 'f', label: 'f(x)', type: 'select', value: 'exp', options: [['exp', 'eˣ'], ['cube', 'x³'], ['lin', '2x + 1'], ['sq', '√x']] }, { id: 'x', label: 'x', min: -2, max: 2.5, step: 0.05, value: 1 }],
        draw(g, p) {
          const F = { exp: [Math.exp, Math.log], cube: [x => x ** 3, Math.cbrt], lin: [x => 2 * x + 1, y => (y - 1) / 2], sq: [x => x >= 0 ? Math.sqrt(x) : NaN, y => y >= 0 ? y * y : NaN] }[p.f];
          const asp = g.W / g.H; g.view(-3 * asp / 1.2, 3 * asp / 1.2, -3, 4).axes();
          g.fn(x => x, { color: C.dim, dash: [4, 4], width: 1 });
          g.fn(F[0], { color: C.fe, width: 2.5 }); g.fn(F[1], { color: C.speed, width: 2.5 });
          const y = F[0](p.x); if (Number.isFinite(y)) { g.dot(p.x, y, { color: C.fe, r: 5 }); g.dot(y, p.x, { color: C.speed, r: 5 }); g.line(p.x, y, y, p.x, { color: C.muted, dash: [2, 3], width: 1 }); }
          g.legend([['f', C.fe], ['f⁻¹', C.speed], ['y = x', C.dim]], { x: 60 });
        },
        info: p => 'The point (x, f(x)) on f reflects to (f(x), x) on f⁻¹.',
      }) },
    ],
    formulas: [h`(f\circ g)(x) = f(g(x))`, h`f^{-1}(f(x)) = x`, h`(f^{-1})'(y) = \frac{1}{f'(f^{-1}(y))}`],
    problems: [
      () => { const a = R.int(2, 5), b = R.int(-5, 5), c = R.int(1, 3), x = R.int(-3, 3); return { q: h`$f(x) = ${a}x ${sgn(b)}$, $g(x) = x^2 + ${c}$. Compute $f(g(${x}))$.`, a: a * (x * x + c) + b, sol: h`$g(${x}) = ${x * x + c}$, $f(${x * x + c}) = ${a * (x * x + c) + b}$` }; },
      () => { const a = R.int(2, 5), b = R.int(-5, 5), c = R.int(1, 3), x = R.int(-3, 3); return { q: h`$f(x) = ${a}x ${sgn(b)}$, $g(x) = x^2 + ${c}$. Compute $g(f(${x}))$.`, a: (a * x + b) ** 2 + c, sol: h`$f(${x}) = ${a * x + b}$, $g(${a * x + b}) = ${(a * x + b) ** 2 + c}$` }; },
      () => { const a = R.intNot(-6, 6, [0]), b = R.int(-9, 9), y = R.int(-20, 20); return { q: h`$f(x) = ${a}x ${sgn(b)}$. Compute $f^{-1}(${y})$.`, a: (y - b) / a, tol: 0.005, sol: h`$f^{-1}(y) = \frac{y ${sgn(-b)}}{${a}}$ → $${fx((y - b) / a, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-explog', title: 'Exponentials, e and logarithms', minutes: 15,
    summary: 'eˣ is the function that is its own growth rate; ln is its inverse. Log laws turn multiplication into addition.',
    sections: [
      h`<p>The number $e \approx 2.71828$ arises from compounding: $\left(1+\frac1n\right)^n \to e$ as $n\to\infty$. More generally $\left(1+\frac rn\right)^{nt}\to e^{rt}$, the <b>continuous compounding</b> factor. The function $e^x$ is special because its slope at every point equals its value: $\frac{d}{dx}e^x = e^x$.</p>
      <p>The <b>natural log</b> $\ln$ is its inverse: $\ln(e^x) = x$. Laws:</p>
      <ul><li>$\ln(ab) = \ln a + \ln b$, $\ \ln(a/b) = \ln a - \ln b$, $\ \ln(a^k) = k\ln a$</li>
      <li>Change of base: $\log_b x = \frac{\ln x}{\ln b}$</li>
      <li>Small $x$: $\ln(1+x) \approx x - \frac{x^2}{2}$, so log returns ≈ simple returns minus half the square.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Discrete compounding converging to e^{rt}', height: 280,
        params: [{ id: 'n', label: 'compounding periods per year n', min: 1, max: 52, step: 1, value: 4, fmt: v => v }, { id: 'r', label: 'rate r', min: 0.01, max: 1, step: 0.01, value: 1, fmt: v => MF.pct(v, 0) }],
        draw(g, p) {
          const T = 3, top = Math.exp(p.r * T) * 1.1;
          g.view(0, T, 0.8, top).axes({ xlabel: 'years' });
          g.fn(t => Math.exp(p.r * t), { color: C.speed, width: 2.5 });
          const pts = []; for (let k = 0; k <= p.n * T; k++) { const t = k / p.n, v = Math.pow(1 + p.r / p.n, k); if (k) pts.push([t, pts[pts.length - 1][1]]); pts.push([t, v]); }
          g.path(pts, { color: C.fe, width: 2 });
          g.legend([['e^{rt}', C.speed], [`(1 + r/${p.n})^{nt}`, C.fe]], { x: 60 });
        },
        info: p => h`After 1 year: $(1+${fx(p.r, 2)}/${p.n})^{${p.n}} = ${fx(Math.pow(1 + p.r / p.n, p.n), 5)}$ vs $e^{${fx(p.r, 2)}} = ${fx(Math.exp(p.r), 5)}$`,
      }) },
    ],
    formulas: [h`e = \lim_{n\to\infty}\left(1 + \tfrac1n\right)^n`, h`\ln(ab) = \ln a + \ln b`, h`\ln a^k = k\ln a`, h`\log_b x = \frac{\ln x}{\ln b}`, h`\frac{d}{dx}e^x = e^x`],
    problems: [
      () => { const r = R.pick([0.03, 0.05, 0.08, 0.1]), t = R.int(2, 10); return { q: h`Continuously compounded at ${fx(r * 100, 4)}% for ${t} years, what does 1 grow to?`, a: Math.exp(r * t), rtol: 1e-3, sol: h`$e^{${r}\cdot${t}} = e^{${fx(r * t, 2)}} = ${fx(Math.exp(r * t), 5)}$` }; },
      () => { const k = R.int(2, 6); return { q: h`Solve $e^{x} = ${k}$`, a: Math.log(k), rtol: 1e-3, sol: h`$x = \ln ${k} = ${fx(Math.log(k), 5)}$` }; },
      () => { const r = R.pick([0.04, 0.05, 0.06, 0.08, 0.1, 0.12]); return { q: h`At a continuous rate of ${fx(r * 100, 4)}%, how many years to double?`, a: Math.log(2) / r, rtol: 1e-3, sol: h`$e^{rT} = 2 \Rightarrow T = \frac{\ln 2}{${r}} = ${fx(Math.log(2) / r, 3)}$` }; },
      () => { const a = R.int(2, 9), b = R.int(2, 9); return { q: h`Using $\ln$ laws, compute $\ln ${a} + \ln ${b} - \ln ${a * b}$`, a: 0, tol: 1e-6, sol: h`$\ln\frac{${a}\cdot${b}}{${a * b}} = \ln 1 = 0$` }; },
      () => { const b = R.pick([2, 10]), x = R.pick([5, 50, 100, 1000, 7]); return { q: h`Compute $\log_{${b}} ${x}$`, a: Math.log(x) / Math.log(b), rtol: 1e-3, sol: h`$\frac{\ln ${x}}{\ln ${b}} = ${fx(Math.log(x) / Math.log(b), 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-series', title: 'Sequences, series & Σ notation', minutes: 15,
    summary: 'Arithmetic and geometric progressions, summation notation, and the geometric series behind every annuity and perpetuity.',
    sections: [
      h`<p><b>Σ notation</b>: $\sum_{k=1}^n a_k = a_1 + a_2 + \dots + a_n$. It is linear: $\sum(ca_k + b_k) = c\sum a_k + \sum b_k$.</p>
      <ul><li><b>Arithmetic</b> $a_k = a + (k-1)d$: $\ S_n = \frac n2(a_1 + a_n)$. (Gauss: pair the first and last terms.)</li>
      <li><b>Geometric</b> $a_k = a r^{k-1}$: $\ S_n = a\frac{1-r^n}{1-r}$. If $|r|<1$, $S_\infty = \frac{a}{1-r}$.</li>
      <li>Useful sums: $\sum_{k=1}^n k = \frac{n(n+1)}2$, $\sum_{k=1}^n k^2 = \frac{n(n+1)(2n+1)}6$.</li></ul>
      <p>The geometric series is the heart of time value of money. A payment of $C$ every year forever, discounted at rate $y$, is worth $\sum_{k\ge1} C(1+y)^{-k} = \frac{C}{y}$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Partial sums of a geometric series', height: 280,
        params: [{ id: 'r', label: 'ratio r', min: -0.95, max: 1.1, step: 0.01, value: 0.7 }, { id: 'n', label: 'terms n', min: 1, max: 40, step: 1, value: 15, fmt: v => v }],
        draw(g, p) {
          const S = []; let s = 0; for (let k = 0; k < p.n; k++) { s += Math.pow(p.r, k); S.push(s); }
          const lim = Math.abs(p.r) < 1 ? 1 / (1 - p.r) : null, top = Math.max(...S, lim || 0, 1) * 1.15, bot = Math.min(0, ...S);
          g.view(0, p.n + 1, bot, top).axes({ xlabel: 'n' });
          S.forEach((v, k) => g.rect(k + 0.6, 0, 0.8, v, { fill: C.alpha(C.fe, 0.5), color: C.fe, width: 1 }));
          if (lim) g.hline(lim, { color: C.speed, dash: [6, 4], width: 2 });
        },
        info: p => Math.abs(p.r) < 1 ? h`$S_{${p.n}} = \frac{1 - ${fx(p.r, 2)}^{${p.n}}}{1-${fx(p.r, 2)}} = ${fx((1 - Math.pow(p.r, p.n)) / (1 - p.r), 4)}$ → limit $\frac{1}{1-r} = ${fx(1 / (1 - p.r), 4)}$` : 'With |r| ≥ 1 the series diverges.',
      }) },
    ],
    formulas: [h`\sum_{k=1}^n k = \frac{n(n+1)}{2}`, h`\sum_{k=0}^{n-1} ar^k = a\frac{1-r^n}{1-r}`, h`\sum_{k=0}^\infty ar^k = \frac{a}{1-r},\ |r|<1`],
    problems: [
      () => { const n = R.int(10, 200); return { q: h`Compute $\sum_{k=1}^{${n}} k$`, a: n * (n + 1) / 2, sol: h`$\frac{${n}\cdot${n + 1}}{2} = ${n * (n + 1) / 2}$` }; },
      () => { const a = R.int(1, 9), r = R.pick([0.5, 0.25, 0.2, 0.8, 0.9, -0.5]); return { q: h`Compute $\sum_{k=0}^{\infty} ${a}\cdot(${r})^k$`, a: a / (1 - r), tol: 0.005, sol: h`$\frac{${a}}{1 - (${r})} = ${fx(a / (1 - r), 4)}$` }; },
      () => { const a = R.int(1, 5), d = R.int(2, 7), n = R.int(10, 40); const an = a + (n - 1) * d; return { q: h`Sum of the arithmetic sequence $${a}, ${a + d}, ${a + 2 * d}, \dots$ (${n} terms)`, a: n * (a + an) / 2, sol: h`Last term $${an}$; $S = \frac{${n}}{2}(${a} + ${an}) = ${n * (a + an) / 2}$` }; },
      () => { const C0 = R.pick([5, 10, 20, 50]), y = R.pick([0.04, 0.05, 0.08, 0.1]); return { q: h`A perpetuity pays ${C0} per year forever starting in one year, discounted at ${fx(y * 100, 4)}%. Value?`, a: C0 / y, tol: 0.01, sol: h`$\sum_{k\ge1}\frac{${C0}}{(1+${y})^k} = \frac{${C0}}{${y}} = ${fx(C0 / y, 2)}$` }; },
    ],
  });
})();
