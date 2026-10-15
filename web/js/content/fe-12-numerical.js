/* FE Math · Unit 12: numerical methods */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;
  const reseed = [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }];

  MF.unit('fe', 'fe-u12', 'Numerical Methods', 'Root finding, Monte Carlo simulation, variance reduction, finite-difference PDE solvers and interpolation.');

  MF.lesson({
    id: 'fe-rootfind', title: 'Root finding: bisection, Newton, secant', minutes: 14,
    summary: 'Yields, IRRs and implied vols are roots. Bisection is safe and linear; Newton is fast (quadratic) but needs a derivative and a good start.',
    sections: [
      h`<ul><li><b>Bisection:</b> keep an interval where $f$ changes sign and halve it. The error halves each step (≈ 3.3 steps per decimal digit). Always converges.</li>
      <li><b>Newton–Raphson:</b> $x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}$. Quadratic convergence (digits double each step) near a simple root, but it can diverge or cycle from a bad start.</li>
      <li><b>Secant:</b> Newton with a finite-difference slope. Order ≈ 1.618 with no derivative needed.</li>
      <li><b>Brent's method</b> combines bisection's safety with fast interpolation. It's the default in libraries.</li></ul>
      <p>Newton is also how you compute $\sqrt a$ ($x\leftarrow\frac12(x + a/x)$), which links back to the speed-math track.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Find the yield of a bond priced at P', height: 300,
        params: [{ id: 'P', label: 'bond price (5% coupon, 10y)', min: 60, max: 140, step: 0.5, value: 92 }, { id: 'x0', label: 'Newton start y₀', min: -0.05, max: 0.3, step: 0.005, value: 0.2, fmt: v => MF.pct(v, 1) }, { id: 'm', label: 'method', type: 'select', value: 'newton', options: [['newton', 'Newton'], ['bisect', 'Bisection'], ['secant', 'Secant']] }],
        draw(g, p, s) {
          const f = y => M.bondPrice(100, 0.05, y, 10, 1) - p.P, df = y => (f(y + 1e-6) - f(y - 1e-6)) / 2e-6;
          g.view(-0.05, 0.3, -80, 100).axes({ xlabel: 'yield', fx: v => MF.pct(v, 0) }); g.fn(f, { color: C.fe, width: 2.5 });
          const it = []; let x = p.x0, a = -0.04, b = 0.3, x1 = p.x0 + 0.02;
          for (let i = 0; i < 8; i++) {
            if (p.m === 'newton') { const nx = x - f(x) / df(x); g.line(x, f(x), nx, 0, { color: C.alpha(C.speed, 0.8), width: 1.3 }); g.dot(x, f(x), { r: 3, color: C.speed }); x = nx; }
            else if (p.m === 'bisect') { const mid = (a + b) / 2; g.line(a, -75 + i * 6, b, -75 + i * 6, { color: C.alpha(C.speed, 0.8), width: 3 }); if (f(a) * f(mid) <= 0) b = mid; else a = mid; x = (a + b) / 2; }
            else { const nx = x1 - f(x1) * (x1 - x) / (f(x1) - f(x)); g.line(x, f(x), x1, f(x1), { color: C.alpha(C.speed, 0.6), width: 1 }); x = x1; x1 = nx; }
            it.push(p.m === 'secant' ? x1 : x);
          }
          s.it = it; const fin = it[it.length - 1]; if (Number.isFinite(fin)) g.dot(fin, 0, { color: C.good, r: 6 });
        },
        info: (p, s) => { const tru = M.bondYield(p.P, 100, 0.05, 10, 1); return `Iterates: ${(s.it || []).slice(0, 6).map(v => Number.isFinite(v) ? MF.pct(v, 5) : '✗').join(' → ')}<br>True yield ${MF.pct(tru, 6)}. Errors: ${(s.it || []).slice(0, 6).map(v => Number.isFinite(v) ? Math.abs(v - tru).toExponential(1) : '—').join(', ')}`; },
      }) },
    ],
    formulas: [h`x_{n+1} = x_n - \frac{f(x_n)}{f'(x_n)}`, h`|e_{n+1}|\approx C|e_n|^2\ \text{(Newton)}`, h`x_{n+1} = x_n - f(x_n)\frac{x_n - x_{n-1}}{f(x_n)-f(x_{n-1})}`, h`n_{\text{bisect}} = \log_2\frac{b-a}{\varepsilon}`],
    problems: [
      () => { const a = R.int(2, 50), x0 = R.int(1, 7); const x1 = 0.5 * (x0 + a / x0); return { q: h`One Newton step for $\sqrt{${a}}$ ($f = x^2 - ${a}$) from $x_0 = ${x0}$?`, a: x1, tol: 1e-4, sol: h`$\tfrac12(${x0} + ${a}/${x0}) = ${fx(x1, 5)}$` }; },
      () => { const w = R.pick([1, 2, 0.5]), eps = R.pick([1e-3, 1e-6, 1e-8]); return { q: h`Bisection on an interval of width ${w}: how many steps to reach width $${eps.toExponential().replace('e', '\\times10^{') + '}'}$? (round up)`, a: Math.ceil(Math.log2(w / eps)), sol: h`$\lceil\log_2(${w}/${eps})\rceil = ${Math.ceil(Math.log2(w / eps))}$` }; },
      () => { const c = R.int(2, 5); const x0 = 1, f = x => x * x * x - c, x1 = x0 - f(x0) / (3 * x0 * x0); return { q: h`Newton for $x^3 = ${c}$ from $x_0 = 1$: $x_1$?`, a: x1, tol: 1e-4, sol: h`$1 - \frac{1 - ${c}}{3} = ${fx(x1, 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-montecarlo', title: 'Monte Carlo pricing', minutes: 16,
    summary: 'Simulate risk-neutral paths, average the discounted payoffs. The error shrinks like σ/√N whatever the dimension.',
    sections: [
      h`<p>Price $= e^{-rT}E^{\mathbb Q}[g(S)]$. Estimate it by simulating $N$ independent paths: $\hat V = e^{-rT}\frac1N\sum g(S^{(i)})$. By the CLT,</p>
      $$\hat V\pm 1.96\frac{\hat s}{\sqrt N}$$
      <p>is a 95% confidence interval. Monte Carlo's convergence rate $N^{-1/2}$ is <b>independent of dimension</b>, which makes it the method of choice for baskets, path-dependent exotics, and models with many factors. It is slow for low-dimensional problems, where PDEs and trees win.</p>
      <p>Generating normals: Box–Muller $Z = \sqrt{-2\ln U_1}\cos(2\pi U_2)$, or inverse CDF $Z = \Phi^{-1}(U)$. <b>Quasi-random</b> (Sobol) sequences can reach nearly $N^{-1}$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Convergence of a Monte Carlo call price', height: 300,
        params: [{ id: 'N', label: 'paths (log₁₀)', min: 1, max: 5, step: 0.1, value: 3.5 }, { id: 's', label: 'σ', min: 0.1, max: 0.6, step: 0.01, value: 0.25, fmt: v => MF.pct(v, 0) }],
        init(s) { s.seed = 81; }, buttons: reseed,
        draw(g, p, s) {
          const S = 100, K = 100, T = 1, r = 0.03, N = Math.round(10 ** p.N), rnd = R.seeded(s.seed), bs = M.bs(S, K, T, r, p.s);
          let sum = 0, sq = 0; const pts = [], up = [], dn = [];
          for (let i = 1; i <= N; i++) { const st = S * Math.exp((r - p.s * p.s / 2) * T + p.s * Math.sqrt(T) * rnd.normal()), v = Math.exp(-r * T) * Math.max(st - K, 0); sum += v; sq += v * v;
            if (i > 10 && (i % Math.max(1, Math.floor(N / 400)) === 0 || i === N)) { const m = sum / i, sd = Math.sqrt(Math.max(sq / i - m * m, 0)); pts.push([Math.log10(i), m]); up.push([Math.log10(i), m + 1.96 * sd / Math.sqrt(i)]); dn.push([Math.log10(i), m - 1.96 * sd / Math.sqrt(i)]); } }
          g.view(1, p.N, bs * 0.6, bs * 1.4).axes({ xlabel: 'log₁₀ N' });
          g.path(up, { color: C.alpha(C.fe, 0.4), width: 1 }); g.path(dn, { color: C.alpha(C.fe, 0.4), width: 1 }); g.path(pts, { color: C.fe, width: 2 });
          g.hline(bs, { color: C.speed, dash: [6, 4], width: 2 });
          const m = sum / N; s.est = m; s.se = Math.sqrt(Math.max(sq / N - m * m, 0) / N); s.bs = bs;
        },
        info: (p, s) => h`$N = ${Math.round(10 ** p.N)}$: estimate ${fx(s.est, 4)} ± ${fx(1.96 * s.se, 4)} (95%), Black–Scholes ${fx(s.bs, 4)}.`,
      }) },
    ],
    formulas: [h`\hat V = e^{-rT}\frac1N\sum_{i=1}^N g(S^{(i)})`, h`\operatorname{se} = \frac{\hat s}{\sqrt N}`, h`S_T = S_0e^{(r-\frac12\sigma^2)T + \sigma\sqrt TZ}`, h`Z = \sqrt{-2\ln U_1}\cos(2\pi U_2)`],
    problems: [
      () => { const s = R.pick([8, 12, 15]), N = R.pick([10000, 40000, 100000]); return { q: h`Payoff std. dev. ${s}, ${N} paths. Half-width of the 95% CI?`, a: 1.96 * s / Math.sqrt(N), tol: 1e-4, sol: h`$1.96\cdot${s}/\sqrt{${N}} = ${fx(1.96 * s / Math.sqrt(N), 5)}$` }; },
      () => { const s = R.pick([10, 20]), e = R.pick([0.01, 0.05, 0.02]); return { q: h`Payoff std ${s}. Paths needed for a standard error of ${e}?`, a: (s / e) ** 2, rtol: 1e-6, sol: h`$N = (\sigma/\text{se})^2 = ${(s / e) ** 2}$` }; },
      () => { const u = R.pick([0.5, 0.9, 0.975, 0.1]); return { q: h`Inverse-CDF method: uniform draw $U = ${u}$ maps to which standard normal $Z$?`, a: M.ninv(u), tol: 0.002, sol: h`$\Phi^{-1}(${u}) = ${fx(M.ninv(u), 4)}$` }; },
      () => { const z = R.pick([0.5, -1, 1.2]), S = 100, r = 0.02, s = 0.2, T = 1; const st = S * Math.exp((r - s * s / 2) * T + s * Math.sqrt(T) * z); return { q: h`One risk-neutral draw: $S_0 = 100$, $r = 2\%$, $\sigma = 20\%$, $T = 1$, $Z = ${z}$. $S_T$?`, a: st, tol: 0.005, sol: h`$100e^{(0.02 - 0.02) + 0.2\cdot${z}} = ${fx(st, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-varred', title: 'Variance reduction', minutes: 15,
    summary: 'Antithetic variates, control variates and importance sampling: same accuracy for far fewer paths.',
    sections: [
      h`<ul><li><b>Antithetic variates:</b> pair each $Z$ with $-Z$ and average $\frac12[g(Z)+g(-Z)]$. This helps when $g$ is monotone, because the pair is negatively correlated.</li>
      <li><b>Control variates:</b> if $Y$ has known mean $E[Y]$ and correlates with $X$, use $X - b(Y - E[Y])$ with optimal $b^* = \frac{\operatorname{Cov}(X,Y)}{\operatorname{Var}Y}$. Variance falls by a factor $1-\rho^2$. Classic examples: price an arithmetic Asian with the geometric Asian (closed form) as control, or a call with the stock itself ($E[e^{-rT}S_T] = S_0$).</li>
      <li><b>Importance sampling:</b> sample from a shifted distribution where the payoff lives (deep OTM options, rare defaults) and reweight by the likelihood ratio. This is Girsanov in practice.</li>
      <li><b>Stratification and quasi-Monte Carlo:</b> spread samples evenly.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Spread of 200 estimates (each with n paths) by method', height: 300,
        params: [{ id: 'n', label: 'paths per estimate', min: 50, max: 2000, step: 50, value: 500, fmt: v => v }, { id: 'K', label: 'strike', min: 80, max: 160, step: 1, value: 100 }],
        init(s) { s.seed = 91; }, buttons: reseed,
        draw(g, p, s) {
          const S = 100, T = 1, r = 0.03, sg = 0.25, df = Math.exp(-r * T), rnd = R.seeded(s.seed), bs = M.bs(S, p.K, T, r, sg);
          const ST = z => S * Math.exp((r - sg * sg / 2) * T + sg * Math.sqrt(T) * z), pay = z => df * Math.max(ST(z) - p.K, 0);
          const est = { plain: [], anti: [], ctrl: [] };
          for (let k = 0; k < 200; k++) {
            let a = 0, b = 0, xs = [], ys = [];
            for (let i = 0; i < p.n; i++) { const z = rnd.normal(); const x = pay(z); a += x; b += 0.5 * (x + pay(-z)); xs.push(x); ys.push(df * ST(z)); }
            est.plain.push(a / p.n); est.anti.push(b / p.n);
            const mx = M.mean(xs), my = M.mean(ys); let cxy = 0, vy = 0; for (let i = 0; i < p.n; i++) { cxy += (xs[i] - mx) * (ys[i] - my); vy += (ys[i] - my) ** 2; }
            est.ctrl.push(mx - (cxy / vy) * (my - S));
          }
          const sds = Object.fromEntries(Object.entries(est).map(([k, v]) => [k, M.std(v)])); s.sds = sds;
          const w = 4 * sds.plain; g.view(-0.5, 2.5, bs - w, bs + w).axes({ xstep: 1, fx: v => ['plain', 'antithetic', 'control variate'][v] || '' });
          ['plain', 'anti', 'ctrl'].forEach((k, i) => { const c = g.ctx; c.fillStyle = C.alpha(C.series[i], 0.5); est[k].forEach(v => c.fillRect(g.X(i + (rnd() - 0.5) * 0.5) - 1.5, g.Y(v) - 1.5, 3, 3)); });
          g.hline(bs, { color: C.text, dash: [5, 4] });
        },
        info: (p, s) => s.sds ? `Std. dev. of the estimate: plain ${fx(s.sds.plain, 4)}, antithetic ${fx(s.sds.anti, 4)} (×${fx((s.sds.plain / s.sds.anti) ** 2, 1)} efficiency), control variate ${fx(s.sds.ctrl, 4)} (×${fx((s.sds.plain / s.sds.ctrl) ** 2, 1)}). Try deep OTM strikes: the stock control loses power.` : '',
      }) },
    ],
    formulas: [h`\hat V_{anti} = \frac1N\sum\tfrac12\left[g(Z_i)+g(-Z_i)\right]`, h`\hat V_{cv} = \bar X - b^*(\bar Y - E[Y]),\ b^* = \frac{\operatorname{Cov}(X,Y)}{\operatorname{Var}Y}`, h`\operatorname{Var}(\hat V_{cv}) = (1-\rho^2)\operatorname{Var}(\bar X)`, h`E^{\mathbb P}[g] = E^{\mathbb Q}\left[g\,\tfrac{d\mathbb P}{d\mathbb Q}\right]`],
    problems: [
      () => { const rho = R.pick([0.8, 0.9, 0.95, 0.99]); return { q: h`Control variate with correlation ${rho}. Factor by which variance falls (i.e. $1/(1-\rho^2)$)?`, a: 1 / (1 - rho * rho), tol: 0.01, sol: h`$\frac{1}{1-${rho}^2} = ${fx(1 / (1 - rho * rho), 3)}$` }; },
      () => { const c = R.pick([2, 4, 6]), v = R.pick([5, 8, 10]); return { q: h`$\operatorname{Cov}(X,Y) = ${c}$, $\operatorname{Var}Y = ${v}$. Optimal control coefficient $b^*$?`, a: c / v, tol: 1e-4, sol: h`$${c}/${v} = ${c / v}$` }; },
      () => { const vx = 4, rho = R.pick([-0.5, -0.8, 0]); const v = (vx + vx + 2 * rho * vx) / 4; return { q: h`$\operatorname{Var}g(Z) = \operatorname{Var}g(-Z) = 4$ with correlation ${rho}. Variance of their average?`, a: v, tol: 1e-6, sol: h`$\frac{4 + 4 + 2(${rho})(4)}{4} = ${fx(v, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-finitediff', title: 'Finite-difference PDE methods', minutes: 18,
    summary: 'Discretise the Black–Scholes PDE on a grid and march backward in time. Explicit, implicit and Crank–Nicolson schemes, and stability.',
    sections: [
      h`<p>Replace derivatives with differences on a grid $S_j = j\Delta S$, $t_n = n\Delta t$:</p>
      $$V_S\approx\frac{V_{j+1}-V_{j-1}}{2\Delta S},\qquad V_{SS}\approx\frac{V_{j+1} - 2V_j + V_{j-1}}{\Delta S^2}$$
      <p>Start from the payoff at $T$ and step backward. The <b>explicit</b> scheme computes each new value directly from three old ones. It's simple, but stable only if $\Delta t\lesssim\frac{\Delta S^2}{\sigma^2S_{max}^2}$; otherwise errors grow explosively. <b>Implicit</b> (backward Euler) solves a tridiagonal system each step and is unconditionally stable. <b>Crank–Nicolson</b> averages the two for second-order accuracy in time (but can ring near kinks, so use a few implicit steps first).</p>
      <p>Boundary conditions: $V(0,t) = 0$ and $V(S_{max},t)\approx S_{max} - Ke^{-r(T-t)}$ for a call. American options: take $\max(V, \text{payoff})$ after each step (or solve the linear complementarity problem with PSOR).</p>`,
      { viz: host => MF.explore(host, {
        title: 'Explicit scheme for a European call: watch it blow up', height: 320,
        params: [{ id: 'J', label: 'space steps', min: 20, max: 120, step: 2, value: 60, fmt: v => v }, { id: 'N', label: 'time steps', min: 20, max: 2000, step: 10, value: 400, fmt: v => v }, { id: 's', label: 'σ', min: 0.1, max: 0.6, step: 0.01, value: 0.3, fmt: v => MF.pct(v, 0) }],
        draw(g, p, s) {
          const K = 100, T = 1, r = 0.03, Smax = 300, J = p.J, N = p.N, dS = Smax / J, dt = T / N;
          let V = Array.from({ length: J + 1 }, (_, j) => Math.max(j * dS - K, 0));
          for (let n = 0; n < N; n++) {
            const nv = V.slice(); const tau = (n + 1) * dt;
            for (let j = 1; j < J; j++) { const a = 0.5 * dt * (p.s * p.s * j * j - r * j), b = 1 - dt * (p.s * p.s * j * j + r), c = 0.5 * dt * (p.s * p.s * j * j + r * j); nv[j] = a * V[j - 1] + b * V[j] + c * V[j + 1]; }
            nv[0] = 0; nv[J] = Smax - K * Math.exp(-r * tau); V = nv;
            if (!Number.isFinite(V[J >> 1]) || Math.abs(V[J >> 1]) > 1e6) break;
          }
          g.view(0, 200, -10, 120).axes({ xlabel: 'S' });
          g.fn(S => M.bs(S, K, T, r, p.s), { color: C.speed, width: 3 });
          g.path(V.map((v, j) => [j * dS, Math.max(-50, Math.min(200, v))]).filter(q => q[0] <= 200), { color: C.fe, width: 1.8 });
          const ratio = dt * p.s * p.s * J * J; s.ratio = ratio; s.err = Math.abs(V[Math.round(100 / dS)] - M.bs(100, K, T, r, p.s));
        },
        info: (p, s) => h`Stability number $\sigma^2J^2\Delta t = ${fx(s.ratio, 3)}$ (need ≲ 1). ${s.ratio > 1 ? '<b style="color:var(--bad)">Unstable</b>: the grid solution (blue) oscillates wildly. Add time steps.' : `Stable. Error at S = 100: ${fx(s.err, 4)}.`} Orange: exact Black–Scholes.`,
      }) },
    ],
    formulas: [h`\frac{V^n_j - V^{n+1}_j}{\Delta t} = \mathcal L_h V^{n+1}\ \text{(explicit, backward in time)}`, h`V_{SS}\approx\frac{V_{j+1}-2V_j+V_{j-1}}{\Delta S^2}`, h`\Delta t\le\frac{\Delta S^2}{\sigma^2S_{\max}^2}\ \text{(explicit stability)}`, h`\text{CN: } \tfrac12(\mathcal L_hV^n + \mathcal L_hV^{n+1})`],
    problems: [
      () => { const v = [R.int(0, 5), R.int(5, 10), R.int(10, 20)], dS = R.pick([1, 2, 5]); return { q: h`$V_{j-1} = ${v[0]}$, $V_j = ${v[1]}$, $V_{j+1} = ${v[2]}$, $\Delta S = ${dS}$. Central estimate of $V_{SS}$?`, a: (v[2] - 2 * v[1] + v[0]) / (dS * dS), tol: 1e-4, sol: h`$\frac{${v[2]} - 2\cdot${v[1]} + ${v[0]}}{${dS * dS}} = ${fx((v[2] - 2 * v[1] + v[0]) / (dS * dS), 4)}$` }; },
      () => { const v = [R.int(0, 5), R.int(5, 10), R.int(10, 20)], dS = R.pick([1, 2, 5]); return { q: h`Same grid: $V_{j-1} = ${v[0]}$, $V_{j+1} = ${v[2]}$, $\Delta S = ${dS}$. Central delta?`, a: (v[2] - v[0]) / (2 * dS), tol: 1e-4, sol: h`$\frac{${v[2]} - ${v[0]}}{2\cdot${dS}} = ${fx((v[2] - v[0]) / (2 * dS), 4)}$` }; },
      () => { const s = R.pick([0.2, 0.3, 0.4]), J = R.pick([50, 100]); return { q: h`Explicit scheme with $\sigma = ${s}$, $J = ${J}$ space steps, $T = 1$. Minimum time steps for $\sigma^2J^2\Delta t\le1$?`, a: Math.ceil(s * s * J * J), sol: h`$N\ge\sigma^2J^2 = ${fx(s * s * J * J, 2)}$` }; },
      () => ({ q: h`Which scheme is unconditionally stable and second-order accurate in time?`, choices: ['Crank–Nicolson', 'Explicit Euler', 'Monte Carlo', 'Bisection'], a: 0, sol: 'Crank–Nicolson averages explicit and implicit steps.' }),
    ],
  });
})();
