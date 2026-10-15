/* FE Math · Unit 3: calculus (single and multivariable, ODEs) */
(function () {
  'use strict';
  const { h, R, M, fx, fmt, colors: C } = MF;

  /** random polynomial helper: coefficients [c0, c1, ...] */
  const poly = {
    rand(deg) { const c = []; for (let i = 0; i <= deg; i++) c.push(R.int(-5, 5)); if (!c[deg]) c[deg] = R.pick([1, 2, 3, -1, -2]); return c; },
    ev(c, x) { return c.reduce((s, a, i) => s + a * Math.pow(x, i), 0); },
    d(c) { return c.slice(1).map((a, i) => a * (i + 1)); },
    tex(c) {
      let s = ''; for (let i = c.length - 1; i >= 0; i--) { const a = c[i]; if (!a) continue; const ab = Math.abs(a); const term = i === 0 ? String(ab) : (ab === 1 ? '' : ab) + (i === 1 ? 'x' : `x^{${i}}`); s += (s ? (a < 0 ? ' - ' : ' + ') : (a < 0 ? '-' : '')) + term; }
      return s || '0';
    },
  };
  MF.poly = poly;

  MF.unit('fe', 'fe-u3', 'Calculus', 'Rates of change, accumulation and approximation in one and many variables, plus differential equations.');

  MF.lesson({
    id: 'fe-limits', title: 'Limits & continuity', minutes: 12,
    summary: 'What a function approaches as the input approaches a point, the ε–δ idea, and the limits that define e and derivatives.',
    sections: [
      h`<p>$\lim_{x\to a} f(x) = L$ means $f(x)$ can be made as close to $L$ as you like by taking $x$ close enough to $a$ (but $\ne a$). Formally: for every $\varepsilon>0$ there is a $\delta>0$ with $0<|x-a|<\delta \Rightarrow |f(x)-L|<\varepsilon$.</p>
      <p>$f$ is <b>continuous</b> at $a$ if $\lim_{x\to a}f(x) = f(a)$. Two limits matter most in finance:</p>
      $$\lim_{x\to0}\frac{\sin x}{x} = 1,\qquad \lim_{n\to\infty}\left(1+\frac{x}{n}\right)^n = e^x,\qquad \lim_{x\to0}\frac{e^x-1}{x} = 1$$
      <p>Limits of the form $0/0$ are resolved by algebra (factor and cancel), by Taylor expansion, or by L'Hôpital's rule: $\lim \frac fg = \lim\frac{f'}{g'}$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'The ε–δ game for (eˣ − 1)/x at 0', height: 300,
        params: [{ id: 'eps', label: 'ε (tolerance on output)', min: 0.02, max: 0.5, step: 0.01, value: 0.2 }],
        draw(g, p) {
          const f = x => Math.abs(x) < 1e-12 ? 1 : (Math.exp(x) - 1) / x, L = 1;
          let d = 2; while (d > 1e-4 && (Math.abs(f(d) - L) >= p.eps || Math.abs(f(-d) - L) >= p.eps)) d *= 0.97;
          g.view(-2, 2, 0, 2.5).axes();
          g.ctx.fillStyle = C.alpha(C.speed, 0.08); g.ctx.fillRect(g.X(-2), g.Y(L + p.eps), g.X(2) - g.X(-2), g.Y(L - p.eps) - g.Y(L + p.eps));
          g.ctx.fillStyle = C.alpha(C.fe, 0.1); g.ctx.fillRect(g.X(-d), g.Y(2.5), g.X(d) - g.X(-d), g.Y(0) - g.Y(2.5));
          g.fn(f, { color: C.fe, width: 2.5 }); g.dot(0, 1, { color: C.bg, ring: C.fe, r: 5 });
          g.hline(L + p.eps, { color: C.speed }); g.hline(L - p.eps, { color: C.speed }); g.vline(d, { color: C.fe }); g.vline(-d, { color: C.fe });
          p._d = d;
        },
        info: p => { let d = 2; const f = x => (Math.exp(x) - 1) / x; while (d > 1e-4 && (Math.abs(f(d) - 1) >= p.eps || Math.abs(f(-d) - 1) >= p.eps)) d *= 0.97; return h`For $\varepsilon = ${fx(p.eps, 2)}$, $\delta \approx ${fx(d, 3)}$ works: inside the blue band the curve stays inside the orange band. Shrink ε and a δ can always be found, so the limit is 1 (even though $f(0)$ is undefined).`; },
      }) },
    ],
    formulas: [h`\lim_{n\to\infty}\left(1+\tfrac xn\right)^n = e^x`, h`\lim_{x\to0}\frac{e^x-1}{x} = 1`, h`\lim_{x\to a}\frac{f(x)}{g(x)} = \lim_{x\to a}\frac{f'(x)}{g'(x)}\ \ (0/0)`],
    problems: [
      () => { const a = R.intNot(-6, 6, [0]), b = R.int(-6, 6); return { q: h`Compute $\displaystyle\lim_{x\to ${a}} \frac{x^2 - ${a * a}}{x - ${a < 0 ? `(${a})` : a}}$`, a: 2 * a, sol: h`Factor $x^2 - a^2 = (x-a)(x+a)$ and cancel: the limit is $2a = ${2 * a}$` }; },
      () => { const k = R.int(2, 7); return { q: h`Compute $\displaystyle\lim_{x\to0}\frac{e^{${k}x} - 1}{x}$`, a: k, sol: h`$= ${k}\lim\frac{e^{${k}x}-1}{${k}x} = ${k}$` }; },
      () => { const x = R.pick([0.5, 1, 2, -1]); return { q: h`Compute $\displaystyle\lim_{n\to\infty}\left(1 + \frac{${x}}{n}\right)^n$`, a: Math.exp(x), rtol: 1e-3, sol: h`$e^{${x}} = ${fx(Math.exp(x), 5)}$` }; },
      () => { const a = R.int(2, 9), b = R.int(2, 9); return { q: h`Compute $\displaystyle\lim_{x\to\infty}\frac{${a}x^2 + x}{${b}x^2 - 3}$`, a: a / b, tol: 0.002, sol: h`Divide by $x^2$: $\to \frac{${a}}{${b}}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-derivative', title: 'The derivative: slope of a curve', minutes: 14,
    summary: 'Zoom in on a smooth curve and it looks straight. The slope of that line is the derivative, the limit of secant slopes.',
    sections: [
      h`<p>The derivative of $f$ at $x$ is the instantaneous rate of change:</p>
      $$f'(x) = \lim_{h\to0}\frac{f(x+h) - f(x)}{h}$$
      <p>It's the slope of the tangent line, the best linear approximation: $f(x+h)\approx f(x) + f'(x)h$. In finance, a bond's duration, an option's delta and marginal utility are all derivatives.</p>
      <p>Basic derivatives: $(x^n)' = nx^{n-1}$, $(e^x)' = e^x$, $(\ln x)' = 1/x$, $(\sin x)' = \cos x$, $(\cos x)' = -\sin x$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Secant → tangent', height: 320,
        params: [{ id: 'f', label: 'f(x)', type: 'select', value: 'sq', options: [['sq', 'x²'], ['exp', 'eˣ'], ['ln', 'ln x'], ['cube', 'x³ − 2x'], ['sin', 'sin x']] }, { id: 'x', label: 'x', min: 0.2, max: 2.5, step: 0.05, value: 1 }, { id: 'h', label: 'h', min: 0.001, max: 1.5, step: 0.001, value: 0.8 }],
        draw(g, p) {
          const F = { sq: [x => x * x, x => 2 * x], exp: [Math.exp, Math.exp], ln: [Math.log, x => 1 / x], cube: [x => x ** 3 - 2 * x, x => 3 * x * x - 2], sin: [Math.sin, Math.cos] }[p.f];
          g.view(-0.5, 4, -2.5, 6).axes();
          g.fn(F[0], { color: C.fe, width: 2.5 });
          const x = p.x, y = F[0](x), y2 = F[0](x + p.h), ms = (y2 - y) / p.h, mt = F[1](x);
          g.fn(t => y + ms * (t - x), { color: C.speed, width: 1.5 }); g.fn(t => y + mt * (t - x), { color: C.good, width: 1.5, dash: [6, 4] });
          g.dot(x, y, { color: C.text, r: 5 }); g.dot(x + p.h, y2, { color: C.speed, r: 5 });
          g.legend([['secant', C.speed], ['tangent', C.good]], { x: 60 });
        },
        info: p => { const F = { sq: [x => x * x, x => 2 * x], exp: [Math.exp, Math.exp], ln: [Math.log, x => 1 / x], cube: [x => x ** 3 - 2 * x, x => 3 * x * x - 2], sin: [Math.sin, Math.cos] }[p.f]; const ms = (F[0](p.x + p.h) - F[0](p.x)) / p.h; return h`Secant slope $\frac{f(x+h)-f(x)}{h} = ${fx(ms, 4)}$ → $f'(x) = ${fx(F[1](p.x), 4)}$ as $h\to0$ (error ${fx(Math.abs(ms - F[1](p.x)), 4)})`; },
      }) },
    ],
    formulas: [h`f'(x) = \lim_{h\to0}\frac{f(x+h)-f(x)}{h}`, h`(x^n)' = nx^{n-1}`, h`(e^x)' = e^x,\quad (\ln x)' = \tfrac1x`, h`f(x+h)\approx f(x) + f'(x)\,h`],
    problems: [
      () => { const c = poly.rand(R.int(2, 3)), x = R.int(-3, 3); return { q: h`$f(x) = ${poly.tex(c)}$. Find $f'(${x})$.`, a: poly.ev(poly.d(c), x), sol: h`$f'(x) = ${poly.tex(poly.d(c))}$ → $f'(${x}) = ${poly.ev(poly.d(c), x)}$` }; },
      () => { const a = R.pick([2, 3, 0.5, -1]), x = R.pick([0, 0.5, 1]); return { q: h`$f(x) = e^{${a}x}$. Find $f'(${x})$.`, a: a * Math.exp(a * x), rtol: 1e-3, sol: h`$f'(x) = ${a}e^{${a}x}$ → $${fx(a * Math.exp(a * x), 5)}$` }; },
      () => { const x = R.int(1, 10); return { q: h`Slope of $y = \ln x$ at $x = ${x}$?`, a: 1 / x, rtol: 1e-3, sol: h`$1/${x}$` }; },
      () => { const c = poly.rand(2), x = R.int(-2, 2), hh = 0.01; return { q: h`Use $f(x+h)\approx f(x) + f'(x)h$ to estimate $f(${x}.01)$ for $f(x) = ${poly.tex(c)}$.`, a: poly.ev(c, x) + poly.ev(poly.d(c), x) * hh, tol: 0.002, sol: h`$f(${x}) = ${poly.ev(c, x)}$, $f'(${x}) = ${poly.ev(poly.d(c), x)}$ → $${fx(poly.ev(c, x) + poly.ev(poly.d(c), x) * hh, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-diffrules', title: 'Differentiation rules: product, quotient, chain', minutes: 14,
    summary: 'Build derivatives of complicated functions from simple ones. The chain rule is the single most important rule in quant finance.',
    sections: [
      h`<ul><li><b>Linearity:</b> $(af + bg)' = af' + bg'$</li>
      <li><b>Product:</b> $(fg)' = f'g + fg'$. Picture a rectangle with sides $f$ and $g$ growing on two edges.</li>
      <li><b>Quotient:</b> $\left(\frac fg\right)' = \frac{f'g - fg'}{g^2}$</li>
      <li><b>Chain:</b> $\frac{d}{dx}f(g(x)) = f'(g(x))\,g'(x)$. Rates multiply through a chain: if $y$ changes 3× as fast as $u$ and $u$ changes 2× as fast as $x$, then $y$ changes 6× as fast as $x$.</li></ul>
      <p>Examples: $\frac{d}{dx}e^{-rx} = -re^{-rx}$ (sensitivity of a discount factor to time), $\frac{d}{dy}(1+y)^{-n} = -n(1+y)^{-n-1}$ (the root of bond duration), $\frac{d}{dx}\ln(1+x^2) = \frac{2x}{1+x^2}$.</p>
      <p>Itô's lemma, which you'll meet later, is the chain rule corrected for randomness.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Product rule as a growing rectangle', height: 260,
        params: [{ id: 'f', label: 'f', min: 1, max: 5, step: 0.1, value: 3 }, { id: 'g', label: 'g', min: 1, max: 4, step: 0.1, value: 2 }, { id: 'df', label: 'Δf', min: 0, max: 1.5, step: 0.05, value: 0.6 }, { id: 'dg', label: 'Δg', min: 0, max: 1.5, step: 0.05, value: 0.5 }],
        draw(g, p) {
          g.noPad(); const u = Math.min((g.W - 60) / 6.5, (g.H - 30) / 5.5), ox = 30, oy = 15, c = g.ctx;
          c.fillStyle = C.alpha(C.fe, 0.5); c.fillRect(ox, oy, p.f * u, p.g * u);
          c.fillStyle = C.alpha(C.speed, 0.7); c.fillRect(ox + p.f * u, oy, p.df * u, p.g * u);
          c.fillStyle = C.alpha(C.pink, 0.7); c.fillRect(ox, oy + p.g * u, p.f * u, p.dg * u);
          c.fillStyle = C.alpha(C.bad, 0.8); c.fillRect(ox + p.f * u, oy + p.g * u, p.df * u, p.dg * u);
          g.ptext('f·g', ox + p.f * u / 2, oy + p.g * u / 2, { bold: true }); g.ptext('Δf·g', ox + (p.f + p.df / 2) * u, oy + p.g * u / 2, { size: 11 }); g.ptext('f·Δg', ox + p.f * u / 2, oy + (p.g + p.dg / 2) * u, { size: 11 });
        },
        info: p => h`$\Delta(fg) = \underbrace{g\,\Delta f}_{${fx(p.g * p.df, 3)}} + \underbrace{f\,\Delta g}_{${fx(p.f * p.dg, 3)}} + \underbrace{\Delta f\,\Delta g}_{${fx(p.df * p.dg, 3)}}$. The red corner is second-order and vanishes relative to the strips as $\Delta\to0$, leaving $(fg)' = f'g + fg'$. (In stochastic calculus that corner does <i>not</i> vanish!)`,
      }) },
    ],
    formulas: [h`(fg)' = f'g + fg'`, h`\left(\tfrac fg\right)' = \frac{f'g - fg'}{g^2}`, h`[f(g(x))]' = f'(g(x))\,g'(x)`],
    problems: [
      () => { const a = R.int(2, 5), x = R.pick([0, 1]); return { q: h`Differentiate $f(x) = x^2 e^{${a}x}$ and evaluate at $x = ${x}$.`, a: (2 * x + a * x * x) * Math.exp(a * x), rtol: 1e-3, sol: h`$f' = 2xe^{${a}x} + ${a}x^2e^{${a}x}$ → $${fx((2 * x + a * x * x) * Math.exp(a * x), 4)}$` }; },
      () => { const n = R.int(2, 10), y = R.pick([0.04, 0.05, 0.06]); return { q: h`$P(y) = (1+y)^{-${n}}$. Compute $P'(${y})$.`, a: -n * Math.pow(1 + y, -n - 1), rtol: 1e-3, sol: h`$P' = -${n}(1+y)^{-${n + 1}} = ${fx(-n * Math.pow(1 + y, -n - 1), 5)}$` }; },
      () => { const a = R.int(1, 4), x = R.int(1, 3); return { q: h`Differentiate $\ln(x^2 + ${a})$ at $x = ${x}$.`, a: 2 * x / (x * x + a), rtol: 1e-3, sol: h`$\frac{2x}{x^2+${a}} = \frac{${2 * x}}{${x * x + a}}$` }; },
      () => { const a = R.int(1, 5), x = R.int(1, 4); return { q: h`Differentiate $\frac{x}{x + ${a}}$ at $x = ${x}$.`, a: a / ((x + a) ** 2), rtol: 1e-3, sol: h`Quotient rule: $\frac{(x+${a}) - x}{(x+${a})^2} = \frac{${a}}{${(x + a) ** 2}}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-optim', title: 'Optimisation in one variable', minutes: 12,
    summary: 'Maxima and minima occur where f\'(x) = 0; the second derivative tells which. Convexity and why it matters.',
    sections: [
      h`<p>At an interior maximum or minimum of a smooth function the tangent is flat: $f'(x^*) = 0$. The <b>second derivative test</b>: $f''(x^*)>0$ means a minimum (curving up), $f''(x^*)<0$ a maximum.</p>
      <p>A function is <b>convex</b> if $f''\ge0$ everywhere. Then any stationary point is the global minimum. Convexity is everywhere in finance: bond prices are convex in yield, option payoffs are convex in the underlying, and risk-averse utilities are concave ($u''<0$).</p>
      <p>Example: maximise mean–variance utility $U(w) = w\mu - \frac{\gamma}{2}w^2\sigma^2$ over the fraction $w$ invested in a risky asset. $U'(w) = \mu - \gamma w\sigma^2 = 0 \Rightarrow w^* = \frac{\mu}{\gamma\sigma^2}$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Mean–variance utility of a risky allocation', height: 300,
        params: [{ id: 'mu', label: 'excess return μ', min: 0.01, max: 0.15, step: 0.005, value: 0.06, fmt: v => MF.pct(v, 1) }, { id: 's', label: 'volatility σ', min: 0.05, max: 0.5, step: 0.01, value: 0.2, fmt: v => MF.pct(v, 0) }, { id: 'gam', label: 'risk aversion γ', min: 0.5, max: 10, step: 0.1, value: 3 }],
        draw(g, p) {
          const U = w => w * p.mu - 0.5 * p.gam * w * w * p.s * p.s, ws = p.mu / (p.gam * p.s * p.s);
          const top = Math.max(U(ws), 0.01);
          g.view(-0.5, Math.max(3, ws * 1.6), -top * 1.5, top * 1.4).axes({ xlabel: 'weight w', fx: v => MF.pct(v, 0) });
          g.fn(U, { color: C.fe, width: 2.5 }); g.vline(ws, { color: C.speed }); g.dot(ws, U(ws), { color: C.speed, r: 6 });
        },
        info: p => { const ws = p.mu / (p.gam * p.s * p.s); return h`$w^* = \frac{\mu}{\gamma\sigma^2} = \frac{${fx(p.mu, 3)}}{${fx(p.gam, 1)}\cdot${fx(p.s * p.s, 4)}} = ${MF.pct(ws, 1)}$. $U''(w) = -\gamma\sigma^2 < 0$, so this is a maximum.`; },
      }) },
    ],
    formulas: [h`f'(x^*) = 0,\ f''(x^*) > 0 \Rightarrow \text{min}`, h`w^* = \frac{\mu}{\gamma\sigma^2}`],
    problems: [
      () => { const a = R.int(1, 4), b = R.int(-12, 12), c = R.int(-5, 5); return { q: h`Minimise $f(x) = ${a}x^2 ${b < 0 ? '-' : '+'} ${Math.abs(b)}x ${c < 0 ? '-' : '+'} ${Math.abs(c)}$. What is the minimum value?`, a: c - b * b / (4 * a), tol: 0.005, sol: h`$x^* = ${fx(-b / (2 * a), 3)}$, $f(x^*) = ${fx(c - b * b / (4 * a), 4)}$` }; },
      () => { const mu = R.pick([0.04, 0.05, 0.06, 0.08]), s = R.pick([0.15, 0.2, 0.25]), g = R.pick([2, 3, 4, 5]); return { q: h`$\mu = ${mu}$, $\sigma = ${s}$, $\gamma = ${g}$. Optimal risky weight $w^*$ (decimal)?`, a: mu / (g * s * s), tol: 0.005, sol: h`$\frac{${mu}}{${g}\cdot${s}^2} = ${fx(mu / (g * s * s), 4)}$` }; },
      () => { const k = R.int(2, 6); return { q: h`At what $x>0$ does $f(x) = x e^{-x/${k}}$ attain its maximum?`, a: k, sol: h`$f' = e^{-x/${k}}(1 - x/${k}) = 0 \Rightarrow x = ${k}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-integral', title: 'Integrals: accumulation & area', minutes: 14,
    summary: 'Riemann sums add up thin rectangles; the fundamental theorem links integrals to antiderivatives.',
    sections: [
      h`<p>The definite integral $\int_a^b f(x)\,dx$ is the limit of <b>Riemann sums</b> $\sum f(x_i)\Delta x$, the signed area under the curve. Think of it as <b>accumulating</b> a rate: integrate a cash-flow rate to get total cash, a hazard rate to get default probability, or a short rate to get the discount factor $e^{-\int_0^T r(t)dt}$.</p>
      <p><b>Fundamental Theorem of Calculus:</b> if $F' = f$, then $\int_a^b f(x)\,dx = F(b) - F(a)$, and $\frac{d}{dx}\int_a^x f(t)\,dt = f(x)$.</p>
      <p>Antiderivatives: $\int x^n dx = \frac{x^{n+1}}{n+1}$ ($n\ne-1$), $\int \frac1x dx = \ln|x|$, $\int e^{ax}dx = \frac{e^{ax}}a$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Riemann sums', height: 300,
        params: [{ id: 'n', label: 'rectangles n', min: 1, max: 100, step: 1, value: 6, fmt: v => v }, { id: 'rule', label: 'rule', type: 'select', value: 'mid', options: [['left', 'left'], ['mid', 'midpoint'], ['right', 'right']] }],
        draw(g, p) {
          const f = x => 1 + Math.sin(x) + 0.3 * x, a = 0, b = 6, dx = (b - a) / p.n;
          g.view(-0.2, 6.4, 0, 4.5).axes();
          let s = 0; for (let i = 0; i < p.n; i++) { const xi = a + i * dx + (p.rule === 'left' ? 0 : p.rule === 'mid' ? dx / 2 : dx); const y = f(xi); s += y * dx; g.rect(a + i * dx, 0, dx, y, { fill: C.alpha(C.speed, 0.35), color: C.alpha(C.speed, 0.8), width: 1 }); }
          g.fn(f, { color: C.fe, width: 2.5 }); p._s = s;
        },
        info: p => { const f = x => 1 + Math.sin(x) + 0.3 * x, dx = 6 / p.n; let s = 0; for (let i = 0; i < p.n; i++) s += f(i * dx + (p.rule === 'left' ? 0 : p.rule === 'mid' ? dx / 2 : dx)) * dx; const exact = 6 + (1 - Math.cos(6)) + 0.15 * 36; return h`Sum $= ${fx(s, 5)}$; exact $\int_0^6 (1+\sin x+0.3x)\,dx = ${fx(exact, 5)}$. Error ${fx(Math.abs(s - exact), 5)}. The midpoint rule's error shrinks like $1/n^2$; left and right shrink like $1/n$.`; },
      }) },
    ],
    formulas: [h`\int_a^b f(x)\,dx = F(b) - F(a),\ F' = f`, h`\int x^n\,dx = \frac{x^{n+1}}{n+1} + C`, h`\int e^{ax}dx = \tfrac1a e^{ax} + C`, h`D(T) = e^{-\int_0^T r(t)\,dt}`],
    problems: [
      () => { const c = poly.rand(2), a = R.int(-2, 1), b = a + R.int(1, 3); const F = x => c.reduce((s, k, i) => s + k * Math.pow(x, i + 1) / (i + 1), 0); return { q: h`Compute $\int_{${a}}^{${b}} (${poly.tex(c)})\,dx$`, a: F(b) - F(a), tol: 0.005, sol: h`$F(${b}) - F(${a}) = ${fx(F(b) - F(a), 4)}$` }; },
      () => { const k = R.pick([1, 2, 0.5]), T = R.int(1, 3); return { q: h`Compute $\int_0^{${T}} e^{${k}x}\,dx$`, a: (Math.exp(k * T) - 1) / k, rtol: 1e-3, sol: h`$\frac{e^{${k * T}} - 1}{${k}} = ${fx((Math.exp(k * T) - 1) / k, 4)}$` }; },
      () => { const r0 = R.pick([0.02, 0.03]), b = R.pick([0.002, 0.004, 0.005]), T = R.int(2, 10); const I = r0 * T + b * T * T / 2; return { q: h`Short rate $r(t) = ${r0} + ${b}t$. Discount factor $D(${T}) = e^{-\int_0^{${T}} r(t)dt}$?`, a: Math.exp(-I), rtol: 1e-3, sol: h`$\int_0^{${T}} r = ${r0}\cdot${T} + ${b}\cdot${T}^2/2 = ${fx(I, 4)}$ → $D = ${fx(Math.exp(-I), 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-inttech', title: 'Integration techniques & improper integrals', minutes: 14,
    summary: 'Substitution reverses the chain rule, integration by parts reverses the product rule; improper integrals handle infinite ranges.',
    sections: [
      h`<p><b>Substitution</b> ($u = g(x)$): $\int f(g(x))g'(x)\,dx = \int f(u)\,du$. Example: $\int 2x e^{x^2}dx = e^{x^2} + C$.</p>
      <p><b>By parts</b>: $\int u\,dv = uv - \int v\,du$. Example: $\int_0^\infty x e^{-x}dx = [-xe^{-x}]_0^\infty + \int_0^\infty e^{-x}dx = 1$.</p>
      <p><b>Improper integrals</b> are limits: $\int_a^\infty f = \lim_{b\to\infty}\int_a^b f$. The crucial one for probability is the Gaussian integral:</p>
      $$\int_{-\infty}^{\infty} e^{-x^2/2}\,dx = \sqrt{2\pi}$$
      <p>This is why the normal density has the constant $\frac1{\sqrt{2\pi}}$. Expectations like $E[X] = \int x f(x)dx$ and $E[(S_T - K)^+]$ in option pricing are integrals of exactly this type.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Integrating to infinity', height: 260,
        params: [{ id: 'b', label: 'upper limit b', min: 0.5, max: 10, step: 0.1, value: 3 }, { id: 'f', label: 'integrand', type: 'select', value: 'xe', options: [['xe', 'x e^{-x}'], ['gauss', 'e^{-x²/2}'], ['inv', '1/x² (from 1)'], ['inv1', '1/x (from 1)']] }],
        draw(g, p) {
          const F = { xe: [x => x * Math.exp(-x), 0, 1], gauss: [x => Math.exp(-x * x / 2), 0, Math.sqrt(2 * Math.PI) / 2], inv: [x => 1 / (x * x), 1, 1], inv1: [x => 1 / x, 1, Infinity] }[p.f];
          g.view(0, 10, 0, 1.1).axes();
          g.area(F[0], F[1], Math.max(F[1], p.b), { color: C.alpha(C.fe, 0.3) });
          g.fn(F[0], { color: C.fe, width: 2.5, from: F[1] + 1e-6 });
        },
        info: p => { const F = { xe: [b => 1 - (b + 1) * Math.exp(-b), 1], gauss: [b => Math.sqrt(2 * Math.PI) * (M.ncdf(b) - 0.5), Math.sqrt(Math.PI / 2)], inv: [b => b > 1 ? 1 - 1 / b : 0, 1], inv1: [b => b > 1 ? Math.log(b) : 0, Infinity] }[p.f]; return h`$\int^{${fx(p.b, 1)}} = ${fx(F[0](p.b), 5)}$; limit as $b\to\infty$: ${Number.isFinite(F[1]) ? '$' + fx(F[1], 5) + '$ (converges)' : '∞ (diverges, since 1/x decays too slowly)'}`; },
      }) },
    ],
    formulas: [h`\int f(g(x))g'(x)\,dx = \int f(u)\,du`, h`\int u\,dv = uv - \int v\,du`, h`\int_{-\infty}^\infty e^{-x^2/2}dx = \sqrt{2\pi}`, h`\int_0^\infty x^n e^{-x}dx = n!`],
    problems: [
      () => { const n = R.int(1, 5); return { q: h`Compute $\int_0^\infty x^{${n}} e^{-x}\,dx$`, a: M.fact(n), sol: h`Repeated integration by parts gives $${n}! = ${M.fact(n)}$` }; },
      () => { const a = R.int(1, 3), b = R.int(1, 2); return { q: h`Compute $\int_0^{${b}} 2x\,e^{x^2}\,dx$`, a: Math.exp(b * b) - 1, rtol: 1e-3, sol: h`$u = x^2$: $[e^{x^2}]_0^{${b}} = e^{${b * b}} - 1 = ${fx(Math.exp(b * b) - 1, 4)}$` }; },
      () => { const s = R.pick([1, 2, 0.5]); return { q: h`Compute $\int_{-\infty}^{\infty} e^{-x^2/(2\cdot${s}^2)}\,dx$`, a: s * Math.sqrt(2 * Math.PI), rtol: 1e-3, sol: h`Substitute $x = ${s}u$: $${s}\sqrt{2\pi} = ${fx(s * Math.sqrt(2 * Math.PI), 4)}$` }; },
      () => { const k = R.pick([2, 3, 4]); return { q: h`Compute $\int_1^\infty x^{-${k}}\,dx$`, a: 1 / (k - 1), tol: 0.002, sol: h`$\left[\frac{x^{-${k - 1}}}{-${k - 1}}\right]_1^\infty = \frac1{${k - 1}}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-taylor', title: 'Taylor series & approximation', minutes: 15,
    summary: 'Approximate any smooth function by a polynomial. This is the basis of duration–convexity, the Greeks, and Itô\'s lemma.',
    sections: [
      h`<p>Near $a$, a smooth function is well approximated by matching its derivatives:</p>
      $$f(a+h) = f(a) + f'(a)h + \frac{f''(a)}{2!}h^2 + \frac{f'''(a)}{3!}h^3 + \cdots$$
      <p>Key series (around 0): $e^x = \sum\frac{x^n}{n!}$, $\ \ln(1+x) = x - \frac{x^2}2 + \frac{x^3}3 - \cdots$, $\ \frac1{1-x} = \sum x^n$, $\ \sqrt{1+x}\approx 1 + \frac x2 - \frac{x^2}8$.</p>
      <p><b>Why quants live on Taylor series:</b> the change in a bond price is $\Delta P \approx P'\Delta y + \frac12P''(\Delta y)^2$ (duration and convexity). An option's P&L is $\Delta\cdot\delta S + \frac12\Gamma(\delta S)^2 + \Theta\,\delta t$. Itô's lemma is a second-order Taylor expansion where $(\delta W)^2 \approx \delta t$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Taylor polynomials', height: 320,
        params: [{ id: 'f', label: 'f', type: 'select', value: 'exp', options: [['exp', 'eˣ'], ['ln', 'ln(1+x)'], ['sin', 'sin x'], ['geo', '1/(1−x)']] }, { id: 'n', label: 'order n', min: 0, max: 12, step: 1, value: 3, fmt: v => v }],
        draw(g, p) {
          const F = {
            exp: [Math.exp, k => 1 / M.fact(k), [-4, 4, -2, 12]], ln: [x => Math.log(1 + x), k => k === 0 ? 0 : (k % 2 ? 1 : -1) / k, [-1.5, 3, -3, 2.5]],
            sin: [Math.sin, k => k % 2 === 0 ? 0 : ((k - 1) / 2 % 2 ? -1 : 1) / M.fact(k), [-7, 7, -2.5, 2.5]], geo: [x => 1 / (1 - x), () => 1, [-2, 1.5, -2, 8]],
          }[p.f];
          g.view(...F[2]).axes();
          g.fn(F[0], { color: C.fe, width: 3 });
          g.fn(x => { let s = 0; for (let k = 0; k <= p.n; k++) s += F[1](k) * Math.pow(x, k); return s; }, { color: C.speed, width: 2 });
          g.legend([['f', C.fe], [`T_${p.n}`, C.speed]], { x: 60 });
        },
        info: p => ({ exp: 'Converges everywhere. Higher orders hug the curve further out.', ln: 'Converges only for −1 < x ≤ 1 (radius 1). Beyond x = 1 the polynomials blow up.', sin: 'Odd powers only; converges everywhere.', geo: 'Converges for |x| < 1: the geometric series.' })[p.f],
      }) },
    ],
    formulas: [h`f(a+h) = \sum_{n\ge0}\frac{f^{(n)}(a)}{n!}h^n`, h`e^x = \sum_{n\ge0}\frac{x^n}{n!}`, h`\ln(1+x) = \sum_{n\ge1}\frac{(-1)^{n+1}x^n}{n}`, h`\Delta P\approx P'\Delta y + \tfrac12 P''(\Delta y)^2`],
    problems: [
      () => { const x = R.pick([0.1, 0.2, 0.05, -0.1]); return { q: h`Second-order Taylor approximation of $e^{${x}}$ around 0?`, a: 1 + x + x * x / 2, tol: 1e-4, sol: h`$1 + ${x} + ${x}^2/2 = ${fx(1 + x + x * x / 2, 6)}$ (true ${fx(Math.exp(x), 6)})` }; },
      () => { const r = R.pick([0.05, 0.1, -0.05, 0.2, -0.2]); return { q: h`Approximate the log return $\ln(1 + ${r})$ to second order.`, a: r - r * r / 2, tol: 1e-4, sol: h`$r - r^2/2 = ${fx(r - r * r / 2, 5)}$ (true ${fx(Math.log(1 + r), 5)})` }; },
      () => { const D = R.pick([-400, -500, -800]), Cv = R.pick([3000, 5000, 8000]), dy = R.pick([0.01, -0.01, 0.005, 0.02]); return { q: h`$P'(y) = ${D}$, $P''(y) = ${Cv}$. Estimate $\Delta P$ for $\Delta y = ${dy}$.`, a: D * dy + 0.5 * Cv * dy * dy, tol: 0.005, sol: h`$${D}(${dy}) + \tfrac12(${Cv})(${dy})^2 = ${fx(D * dy + 0.5 * Cv * dy * dy, 4)}$` }; },
      () => { const n = R.int(2, 5); return { q: h`Coefficient of $x^{${n}}$ in the Taylor series of $e^{2x}$ at 0?`, a: Math.pow(2, n) / M.fact(n), tol: 1e-4, sol: h`$\frac{2^{${n}}}{${n}!} = ${fx(Math.pow(2, n) / M.fact(n), 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-multivar', title: 'Partial derivatives, gradient & Hessian', minutes: 15,
    summary: 'Functions of several variables: slopes along each axis, the gradient as the direction of steepest ascent, and second-order structure.',
    sections: [
      h`<p>For $f(x,y)$, the <b>partial derivative</b> $\frac{\partial f}{\partial x}$ differentiates in $x$ holding $y$ fixed. The <b>gradient</b> $\nabla f = (f_x, f_y)$ points in the direction of steepest increase and is perpendicular to level curves (contours).</p>
      <p>The <b>Hessian</b> $H = \begin{pmatrix}f_{xx} & f_{xy}\\ f_{yx} & f_{yy}\end{pmatrix}$ holds second derivatives. Since $f_{xy} = f_{yx}$ for smooth functions, it's symmetric. Second-order Taylor expansion:</p>
      $$f(\mathbf x + \mathbf h) \approx f(\mathbf x) + \nabla f\cdot\mathbf h + \tfrac12\mathbf h^\top H\mathbf h$$
      <p>An option price $V(S,t,\sigma,r)$ has partials that are exactly the Greeks: $\partial_S V = \Delta$, $\partial_{SS}V = \Gamma$, $\partial_t V = \Theta$, $\partial_\sigma V = $ vega.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Contours and the gradient of f(x,y) = x² + 3y² − xy', height: 340,
        params: [{ id: 'x', label: 'x', min: -2.5, max: 2.5, step: 0.05, value: 1.5 }, { id: 'y', label: 'y', min: -1.5, max: 1.5, step: 0.05, value: 0.8 }],
        draw(g, p) {
          const f = (x, y) => x * x + 3 * y * y - x * y; const asp = g.W / g.H;
          g.view(-1.6 * asp, 1.6 * asp, -1.6, 1.6).axes();
          const c = g.ctx, st = 4;
          for (let px = g.pad.l; px < g.W - g.pad.r; px += st) for (let py = g.pad.t; py < g.H - g.pad.b; py += st) { const v = f(g.invX(px), g.invY(py)); const band = Math.floor(v * 2); c.fillStyle = C.alpha(band % 2 ? C.fe : C.fe2, Math.max(0.03, 0.25 - v * 0.02)); c.fillRect(px, py, st, st); }
          const gx = 2 * p.x - p.y, gy = 6 * p.y - p.x, n = Math.hypot(gx, gy) || 1;
          g.dot(p.x, p.y, { color: C.speed, r: 6 }); g.arrow(p.x, p.y, p.x + 0.6 * gx / n, p.y + 0.6 * gy / n, { color: C.speed, width: 2.5 });
          g.arrow(p.x, p.y, p.x - 0.6 * gy / n, p.y + 0.6 * gx / n, { color: C.good, width: 1.5, dash: [4, 3] });
          g.dot(0, 0, { color: C.good, r: 4 });
        },
        info: p => h`$\nabla f = (2x - y,\ 6y - x) = (${fx(2 * p.x - p.y, 2)},\ ${fx(6 * p.y - p.x, 2)})$ (orange). The green dashed arrow is tangent to the contour. $H = \begin{pmatrix}2&-1\\-1&6\end{pmatrix}$ is positive definite, so $(0,0)$ is the minimum.`,
      }) },
    ],
    formulas: [h`\nabla f = \left(\tfrac{\partial f}{\partial x_1},\dots,\tfrac{\partial f}{\partial x_n}\right)`, h`H_{ij} = \frac{\partial^2 f}{\partial x_i\partial x_j}`, h`f(\mathbf x+\mathbf h)\approx f + \nabla f\cdot \mathbf h + \tfrac12\mathbf h^\top H\mathbf h`],
    problems: [
      () => { const a = R.int(1, 4), b = R.int(1, 4), x = R.int(-2, 2), y = R.int(-2, 2); return { q: h`$f(x,y) = ${a}x^2y + ${b}xy^3$. Compute $\partial f/\partial x$ at $(${x},${y})$.`, a: 2 * a * x * y + b * y ** 3, sol: h`$f_x = ${2 * a}xy + ${b}y^3 = ${2 * a * x * y + b * y ** 3}$` }; },
      () => { const a = R.int(1, 4), b = R.int(1, 4), x = R.int(-2, 2), y = R.int(-2, 2); return { q: h`$f(x,y) = ${a}x^2y + ${b}xy^3$. Compute $\partial^2 f/\partial x\partial y$ at $(${x},${y})$.`, a: 2 * a * x + 3 * b * y * y, sol: h`$f_{xy} = ${2 * a}x + ${3 * b}y^2 = ${2 * a * x + 3 * b * y * y}$` }; },
      () => { const y = R.int(1, 4); return { q: h`$f(x,y) = e^{x}\ln y$. Compute $\|\nabla f\|$ at $(0, ${y})$.`, a: Math.hypot(Math.log(y), 1 / y), tol: 0.01, sol: h`$\nabla f = (e^x\ln y,\ e^x/y) = (${fx(Math.log(y), 3)}, ${fx(1 / y, 3)})$ → norm $${fx(Math.hypot(Math.log(y), 1 / y), 3)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-lagrange', title: 'Constrained optimisation & Lagrange multipliers', minutes: 15,
    summary: 'Optimise subject to constraints: at the optimum the objective\'s gradient is parallel to the constraint\'s gradient.',
    sections: [
      h`<p>To minimise $f(\mathbf x)$ subject to $g(\mathbf x) = c$, form the <b>Lagrangian</b> $\mathcal L = f - \lambda(g - c)$ and set all partials to zero:</p>
      $$\nabla f = \lambda\nabla g,\qquad g(\mathbf x) = c$$
      <p>Geometrically, at the optimum a level curve of $f$ just <b>touches</b> the constraint curve. The multiplier $\lambda$ is the <b>shadow price</b>, the rate at which the optimal value changes as you relax $c$.</p>
      <p>This is exactly Markowitz portfolio optimisation: minimise variance $\mathbf w^\top\Sigma\mathbf w$ subject to $\mathbf w^\top\mathbf 1 = 1$ (fully invested) and $\mathbf w^\top\boldsymbol\mu = m$ (target return).</p>`,
      { viz: host => MF.explore(host, {
        title: 'Minimise x² + 2y² on the line x + y = c', height: 320,
        params: [{ id: 'c', label: 'constraint level c', min: 0.3, max: 2.5, step: 0.05, value: 1.5 }],
        draw(g, p) {
          const asp = g.W / g.H; g.view(-1.5 * asp, 2.5 * asp - 1, -1.5, 2.5).axes();
          const xs = 2 * p.c / 3, ys = p.c / 3, fmin = xs * xs + 2 * ys * ys;
          [0.25, 0.5, 1, 1.5, 2.5, 4].map(v => v * fmin).forEach((v, i) => { const pts = []; for (let k = 0; k <= 100; k++) { const t = 2 * Math.PI * k / 100; pts.push([Math.sqrt(v) * Math.cos(t), Math.sqrt(v / 2) * Math.sin(t)]); } g.path(pts, { color: i === 2 ? C.speed : C.alpha(C.fe, 0.5), width: i === 2 ? 2.5 : 1 }); });
          g.fn(x => p.c - x, { color: C.pink, width: 2.5 });
          g.dot(xs, ys, { color: C.good, r: 6 });
          g.arrow(xs, ys, xs + 0.35 * 2 * xs, ys + 0.35 * 4 * ys, { color: C.speed }); g.arrow(xs, ys, xs + 0.35, ys + 0.35, { color: C.pink, dash: [3, 3] });
        },
        info: p => h`$\nabla f = (2x, 4y) = \lambda(1,1)$ → $x = 2y$, so $x^* = ${fx(2 * p.c / 3, 3)}, y^* = ${fx(p.c / 3, 3)}$, $\lambda = ${fx(4 * p.c / 3, 3)}$. Check: $\frac{d f^*}{dc} = \frac{d}{dc}\frac{2c^2}{3} = \frac{4c}{3} = \lambda$ ✓`,
      }) },
    ],
    formulas: [h`\mathcal L(\mathbf x,\lambda) = f(\mathbf x) - \lambda\,(g(\mathbf x) - c)`, h`\nabla f(\mathbf x^*) = \lambda\nabla g(\mathbf x^*)`, h`\lambda = \frac{\partial f^*}{\partial c}`],
    problems: [
      () => { const a = R.int(1, 4), b = R.int(1, 4), c = R.int(1, 6); return { q: h`Minimise $${a}x^2 + ${b}y^2$ subject to $x + y = ${c}$. What is $x^*$?`, a: b * c / (a + b), tol: 0.002, sol: h`$${2 * a}x = ${2 * b}y = \lambda$ → $x = \frac{${b}\cdot${c}}{${a + b}} = ${fx(b * c / (a + b), 4)}$` }; },
      () => { const s1 = R.pick([0.1, 0.15, 0.2]), s2 = R.pick([0.25, 0.3, 0.35]); const w = s2 * s2 / (s1 * s1 + s2 * s2); return { q: h`Two uncorrelated assets with $\sigma_1 = ${s1}$, $\sigma_2 = ${s2}$. Minimum-variance weight in asset 1 (fully invested)?`, a: w, tol: 0.002, sol: h`$w_1 = \frac{\sigma_2^2}{\sigma_1^2+\sigma_2^2} = ${fx(w, 4)}$` }; },
      () => { const P = R.int(2, 10); return { q: h`Maximise $xy$ subject to $x + y = ${P * 2}$. Maximum value?`, a: P * P, sol: h`$y = \lambda = x$ → $x = y = ${P}$, $xy = ${P * P}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-ode', title: 'Ordinary differential equations', minutes: 15,
    summary: 'Equations for rates: exponential growth, mean reversion, separable and linear first-order ODEs, and Euler\'s method.',
    sections: [
      h`<p>An ODE relates a function to its derivatives. The essential ones for finance:</p>
      <ul><li><b>Growth:</b> $\frac{dB}{dt} = rB \Rightarrow B(t) = B_0e^{rt}$ (a bank account).</li>
      <li><b>Mean reversion:</b> $\frac{dx}{dt} = \kappa(\theta - x) \Rightarrow x(t) = \theta + (x_0-\theta)e^{-\kappa t}$. This is the deterministic skeleton of the Vasicek and Ornstein–Uhlenbeck models. The <b>half-life</b> is $\ln 2/\kappa$.</li>
      <li><b>Linear first order:</b> $y' + p(t)y = q(t)$, solved with the integrating factor $e^{\int p}$.</li></ul>
      <p><b>Euler's method</b> steps numerically: $y_{n+1} = y_n + h\,f(t_n, y_n)$. Its stochastic cousin, Euler–Maruyama, simulates SDEs.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Slope field of dx/dt = κ(θ − x) with Euler steps', height: 320,
        params: [{ id: 'k', label: 'speed κ', min: 0.1, max: 3, step: 0.05, value: 0.8 }, { id: 'th', label: 'long-run level θ', min: -1, max: 3, step: 0.1, value: 1.5 }, { id: 'x0', label: 'start x₀', min: -2, max: 4, step: 0.1, value: -1 }, { id: 'h', label: 'Euler step h', min: 0.05, max: 1.5, step: 0.05, value: 0.5 }],
        draw(g, p) {
          g.view(0, 6, -2.5, 4.5).axes({ xlabel: 't' });
          for (let t = 0.25; t < 6; t += 0.5) for (let x = -2.25; x < 4.5; x += 0.5) { const s = p.k * (p.th - x), L = 0.18 / Math.sqrt(1 + s * s); g.line(t - L, x - s * L, t + L, x + s * L, { color: C.alpha(C.muted, 0.5), width: 1 }); }
          g.hline(p.th, { color: C.speed });
          g.fn(t => p.th + (p.x0 - p.th) * Math.exp(-p.k * t), { color: C.fe, width: 2.5 });
          const pts = [[0, p.x0]]; let x = p.x0; for (let t = 0; t < 6; t += p.h) { x += p.h * p.k * (p.th - x); pts.push([t + p.h, x]); }
          g.path(pts, { color: C.pink, width: 1.5 }); pts.forEach(q => g.dot(q[0], q[1], { color: C.pink, r: 3 }));
          g.legend([['exact', C.fe], ['Euler', C.pink], ['θ', C.speed]], { x: g.W - 110 });
        },
        info: p => h`Half-life $\ln 2/\kappa = ${fx(Math.log(2) / p.k, 3)}$. Euler is stable only if $h\kappa < 2$ (here $h\kappa = ${fx(p.h * p.k, 2)}$${p.h * p.k > 1 ? ', which overshoots' : ''}).`,
      }) },
    ],
    formulas: [h`\frac{dB}{dt} = rB \Rightarrow B = B_0e^{rt}`, h`\frac{dx}{dt} = \kappa(\theta - x) \Rightarrow x(t) = \theta + (x_0 - \theta)e^{-\kappa t}`, h`y_{n+1} = y_n + h f(t_n,y_n)`],
    problems: [
      () => { const k = R.pick([0.5, 1, 2, 0.25]), th = R.int(1, 5), x0 = R.int(-2, 0), t = R.int(1, 3); return { q: h`$x' = ${k}(${th} - x)$, $x(0) = ${x0}$. Find $x(${t})$.`, a: th + (x0 - th) * Math.exp(-k * t), rtol: 1e-3, sol: h`$${th} + (${x0} - ${th})e^{-${k * t}} = ${fx(th + (x0 - th) * Math.exp(-k * t), 4)}$` }; },
      () => { const k = R.pick([0.1, 0.2, 0.5, 0.7, 1.4]); return { q: h`Half-life of mean reversion with $\kappa = ${k}$?`, a: Math.log(2) / k, rtol: 1e-3, sol: h`$\ln 2/${k} = ${fx(Math.log(2) / k, 4)}$` }; },
      () => { const r = R.pick([0.1, 0.2]), hh = R.pick([0.5, 0.25]); const y1 = 1 + hh * r, y2 = y1 + hh * r * y1; return { q: h`Euler's method for $y' = ${r}y$, $y(0) = 1$, step $h = ${hh}$: what is $y_2$?`, a: y2, tol: 1e-4, sol: h`$y_1 = 1 + ${hh}\cdot${r} = ${y1}$, $y_2 = y_1(1 + ${hh * r}) = ${fx(y2, 6)}$` }; },
    ],
  });
})();
