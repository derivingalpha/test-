/* FE Math · Unit 10: stochastic calculus */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;

  /** Brownian path on [0,T] with N steps, seeded */
  const bm = (seed, N, T) => { const r = R.seeded(seed), dt = T / N, w = [0]; for (let i = 0; i < N; i++) w.push(w[i] + Math.sqrt(dt) * r.normal()); return w; };
  MF.bm = bm;
  const seedBtn = [{ label: '🎲 New paths', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }];

  MF.unit('fe', 'fe-u10', 'Stochastic Calculus', 'Random walks, Brownian motion, quadratic variation, the Itô integral and lemma, SDEs, change of measure and the PDE connection.');

  MF.lesson({
    id: 'fe-randomwalk', title: 'Random walks & martingales', minutes: 14,
    summary: 'The symmetric random walk, its √n spread, filtrations, and martingales as "fair games". Plus the optional stopping theorem.',
    sections: [
      h`<p>A simple random walk $S_n = \sum_{i=1}^n X_i$, $X_i = \pm1$ with probability ½, has $E[S_n] = 0$ and $\operatorname{Var}S_n = n$. Its typical distance from 0 grows like $\sqrt n$, not $n$.</p>
      <p>A <b>filtration</b> $\mathcal F_n$ is the information revealed up to time $n$. A process $M_n$ is a <b>martingale</b> if $E[|M_n|] < \infty$ and</p>
      $$E[M_{n+1}\mid\mathcal F_n] = M_n$$
      <p>Examples: $S_n$, $S_n^2 - n$, and $\left(\frac{q}{p}\right)^{S_n}$ for a biased walk. Under the risk-neutral measure, <b>discounted asset prices are martingales</b>. That's the core of pricing.</p>
      <p><b>Optional stopping:</b> for a bounded stopping time $\tau$, $E[M_\tau] = M_0$. So you can't beat a fair game by choosing when to quit. Gambler's ruin: starting at $a$ between barriers $0$ and $N$, $P(\text{hit } N\text{ first}) = a/N$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Random walks fan out like √n', height: 300,
        params: [{ id: 'n', label: 'steps', min: 20, max: 1000, step: 10, value: 400, fmt: v => v }, { id: 'k', label: 'paths', min: 1, max: 60, step: 1, value: 25, fmt: v => v }],
        init(s) { s.seed = 2; }, buttons: seedBtn,
        draw(g, p, s) {
          const lim = 3.2 * Math.sqrt(p.n); g.view(0, p.n, -lim, lim).axes({ xlabel: 'n' });
          for (let k = 0; k < p.k; k++) { const r = R.seeded(s.seed + k * 7919), pts = [[0, 0]]; let x = 0; for (let i = 1; i <= p.n; i++) { x += r() < 0.5 ? 1 : -1; pts.push([i, x]); } g.path(pts, { color: C.alpha(C.series[k % 8], 0.6), width: 1 }); }
          [1, 2].forEach(m => { g.fn(t => m * Math.sqrt(t), { color: C.speed, dash: [5, 4], width: 1.5 }); g.fn(t => -m * Math.sqrt(t), { color: C.speed, dash: [5, 4], width: 1.5 }); });
        },
        info: p => h`Dashed: $\pm\sqrt n$ and $\pm2\sqrt n$. About 68% and 95% of walks end inside them (CLT).`,
      }) },
    ],
    formulas: [h`E[S_n] = 0,\ \operatorname{Var}S_n = n`, h`E[M_{n+1}\mid\mathcal F_n] = M_n`, h`E[M_\tau] = M_0\ \ (\tau\ \text{bounded})`, h`P(\text{hit } N \text{ before } 0\mid S_0 = a) = a/N`],
    problems: [
      () => { const a = R.int(1, 9), N = a + R.int(1, 10); return { q: h`Symmetric walk starting at ${a}. Probability of hitting ${N} before 0?`, a: a / N, tol: 1e-3, sol: h`Optional stopping: $a/N = ${a}/${N}$` }; },
      () => { const n = R.pick([100, 400, 900, 2500]); return { q: h`Standard deviation of a simple random walk after ${n} steps?`, a: Math.sqrt(n), sol: h`$\sqrt{${n}} = ${Math.sqrt(n)}$` }; },
      () => { const a = R.int(2, 8), N = a + R.int(2, 8); return { q: h`Symmetric walk from ${a}, stop at 0 or ${N}. Expected duration? (Use $S_n^2 - n$ is a martingale.)`, a: a * (N - a), sol: h`$E[\tau] = a(N-a) = ${a * (N - a)}$` }; },
      () => ({ q: h`Which of these is a martingale for the symmetric random walk $S_n$?`, choices: [h`$S_n^2 - n$`, h`$S_n^2$`, h`$S_n + n$`, h`$|S_n|$`], a: 0, sol: h`$E[S_{n+1}^2\mid\mathcal F_n] = S_n^2 + 1$, so subtracting $n$ fixes the drift.` }),
    ],
  });

  MF.lesson({
    id: 'fe-brownian', title: 'Brownian motion', minutes: 16,
    summary: 'The scaling limit of random walks: continuous, nowhere differentiable, with independent Gaussian increments of variance Δt.',
    sections: [
      h`<p><b>Standard Brownian motion</b> $W_t$ satisfies: $W_0 = 0$; independent increments; $W_t - W_s\sim N(0, t-s)$; continuous paths. It's the limit of a random walk with steps $\pm\sqrt{\Delta t}$ (Donsker's theorem).</p>
      <ul><li>$E[W_t] = 0$, $\operatorname{Var}W_t = t$, $\operatorname{Cov}(W_s,W_t) = \min(s,t)$.</li>
      <li><b>Scaling:</b> $\{c^{-1/2}W_{ct}\}$ is again a Brownian motion. Zoom in and it looks the same (a fractal).</li>
      <li>Paths are continuous but <b>nowhere differentiable</b>: $\frac{W_{t+h} - W_t}{h}\sim N(0, 1/h)$ blows up.</li>
      <li>Martingales built from it: $W_t$, $W_t^2 - t$, $e^{\theta W_t - \theta^2 t/2}$ (exponential martingale).</li>
      <li><b>Reflection principle:</b> $P(\max_{s\le t}W_s\ge a) = 2P(W_t\ge a)$. Barrier options are priced with this.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Brownian paths with ±√t envelopes', height: 320,
        params: [{ id: 'k', label: 'paths', min: 1, max: 40, step: 1, value: 12, fmt: v => v }, { id: 'zoom', label: 'zoom into [0, T]', min: 0.01, max: 1, step: 0.01, value: 1 }],
        init(s) { s.seed = 31; }, buttons: seedBtn,
        draw(g, p, s) {
          const T = p.zoom, lim = 3 * Math.sqrt(T); g.view(0, T, -lim, lim).axes({ xlabel: 't' });
          for (let k = 0; k < p.k; k++) { const w = bm(s.seed + k, 2000, 1), n = Math.max(2, Math.round(2000 * T)); g.path(w.slice(0, n + 1).map((v, i) => [i / 2000, v]), { color: C.alpha(C.series[k % 8], 0.7), width: 1 }); }
          [1, 2].forEach(m => { g.fn(t => m * Math.sqrt(t), { color: C.speed, dash: [5, 4] }); g.fn(t => -m * Math.sqrt(t), { color: C.speed, dash: [5, 4] }); });
        },
        info: () => 'Zoom in: the rescaled picture looks statistically identical (self-similarity). The paths never smooth out.',
      }) },
    ],
    formulas: [h`W_t - W_s\sim N(0,\,t-s)`, h`\operatorname{Cov}(W_s,W_t) = \min(s,t)`, h`E\left[e^{\theta W_t}\right] = e^{\theta^2t/2}`, h`P\left(\max_{s\le t}W_s\ge a\right) = 2\left(1 - \Phi(a/\sqrt t)\right)`],
    problems: [
      () => { const s = R.pick([1, 2, 3]), t = s + R.int(1, 4); return { q: h`$\operatorname{Cov}(W_{${s}}, W_{${t}})$?`, a: s, sol: h`$\min(${s},${t}) = ${s}$` }; },
      () => { const s = R.int(1, 3), t = s + R.int(1, 4); return { q: h`$\operatorname{Var}(W_{${t}} + W_{${s}})$?`, a: t + s + 2 * s, sol: h`$${t} + ${s} + 2\min(${s},${t}) = ${t + 3 * s}$` }; },
      () => { const a = R.pick([1, 1.5, 2]), t = R.pick([1, 2, 4]); const p = 2 * (1 - M.ncdf(a / Math.sqrt(t))); return { q: h`$P(\max_{s\le ${t}}W_s\ge ${a})$?`, a: p, tol: 0.002, sol: h`Reflection: $2(1 - \Phi(${a}/\sqrt{${t}})) = ${fx(p, 4)}$` }; },
      () => { const th = R.pick([1, 2, 0.5]), t = R.pick([1, 2]); return { q: h`$E[e^{${th}W_{${t}}}]$?`, a: Math.exp(th * th * t / 2), tol: 1e-3, sol: h`$e^{${th}^2\cdot${t}/2} = ${fx(Math.exp(th * th * t / 2), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-quadvar', title: 'Quadratic variation: (dW)² = dt', minutes: 14,
    summary: 'Sum the squared increments of a Brownian path and you get t, deterministically. This single fact is why stochastic calculus differs from ordinary calculus.',
    sections: [
      h`<p>Partition $[0,t]$ into $n$ steps. For a smooth function, $\sum(\Delta f)^2\to0$. For Brownian motion:</p>
      $$[W]_t = \lim_{n\to\infty}\sum_{i}(W_{t_{i+1}} - W_{t_i})^2 = t$$
      <p>Each term has mean $\Delta t$ and variance $2\Delta t^2$, so the sum has mean $t$ and variance $2t\Delta t\to0$. The randomness averages out.</p>
      <p>Heuristic multiplication table used in every Itô calculation:</p>
      $$dW\cdot dW = dt,\qquad dW\cdot dt = 0,\qquad dt\cdot dt = 0$$
      <p>With correlated Brownian motions, $dW^1 dW^2 = \rho\,dt$. Meanwhile the <i>total</i> variation $\sum|\Delta W|$ diverges, which is why Riemann–Stieltjes integration fails for Brownian motion.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Σ(ΔW)² converges to t; Σ|ΔW| explodes', height: 300,
        params: [{ id: 'n', label: 'steps (log₂)', min: 2, max: 14, step: 1, value: 6, fmt: v => 2 ** v }],
        init(s) { s.seed = 8; }, buttons: seedBtn,
        draw(g, p, s) {
          const fine = bm(s.seed, 2 ** 14, 1), n = 2 ** p.n, st = 2 ** 14 / n; let qv = 0, tv = 0; const qpts = [[0, 0]];
          for (let i = 0; i < n; i++) { const d = fine[(i + 1) * st] - fine[i * st]; qv += d * d; tv += Math.abs(d); qpts.push([(i + 1) / n, qv]); }
          g.view(0, 1, -1.5, 1.6).axes({ xlabel: 't' });
          g.path(fine.filter((_, i) => i % 16 === 0).map((v, i) => [i * 16 / 2 ** 14, v]), { color: C.alpha(C.fe, 0.5), width: 1 });
          g.path(qpts, { color: C.speed, width: 2.5 }); g.fn(t => t, { color: C.good, dash: [5, 4] });
          s.qv = qv; s.tv = tv;
        },
        info: (p, s) => h`With ${2 ** p.n} steps: $\sum(\Delta W)^2 = ${fx(s.qv, 4)}$ (→ 1), but $\sum|\Delta W| = ${fx(s.tv, 2)}$ (grows like $\sqrt n$). Orange is the running quadratic variation, green dashed is $t$.`,
      }) },
    ],
    formulas: [h`[W]_t = t`, h`(dW)^2 = dt,\ dW\,dt = 0,\ (dt)^2 = 0`, h`dW^1dW^2 = \rho\,dt`, h`[X]_t = \int_0^t\sigma_s^2\,ds\ \text{ for } dX = \mu\,dt + \sigma\,dW`],
    problems: [
      () => { const s = R.pick([0.2, 0.3, 0.5]), T = R.pick([1, 2, 4]); return { q: h`$dX_t = 0.1\,dt + ${s}\,dW_t$. Quadratic variation $[X]_{${T}}$?`, a: s * s * T, tol: 1e-5, sol: h`$\int_0^{${T}}${s}^2dt = ${fx(s * s * T, 4)}$` }; },
      () => { const dt = R.pick([0.01, 0.001]), t = 1; return { q: h`Variance of $\sum(\Delta W)^2$ over $[0,1]$ with step $\Delta t = ${dt}$?`, a: 2 * t * dt, tol: 1e-6, sol: h`$n\cdot 2\Delta t^2 = 2t\Delta t = ${2 * dt}$` }; },
      () => { const rho = R.pick([0.3, -0.5, 0.8]), T = R.int(1, 3); return { q: h`$W^1, W^2$ with correlation ${rho}. Covariation $[W^1,W^2]_{${T}}$?`, a: rho * T, tol: 1e-6, sol: h`$\rho T = ${fx(rho * T, 3)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-itointegral', title: 'The Itô integral', minutes: 16,
    summary: '∫ H dW defined with left-endpoint sums. It\'s a martingale with the Itô isometry, and ∫W dW = ½(W² − t) has an extra term.',
    sections: [
      h`<p>For an adapted integrand $H$ (it can't peek into the future), define</p>
      $$\int_0^t H_s\,dW_s = \lim\sum_i H_{t_i}\left(W_{t_{i+1}} - W_{t_i}\right)$$
      <p>evaluating $H$ at the <b>left</b> endpoint. Financially, $H$ is your position, chosen before the price move, so the integral is your trading gain.</p>
      <ul><li><b>Martingale:</b> $E\left[\int_0^t H\,dW\right] = 0$.</li>
      <li><b>Itô isometry:</b> $E\left[\left(\int_0^tH\,dW\right)^2\right] = E\left[\int_0^tH^2\,ds\right]$.</li>
      <li>Surprise: $\int_0^t W\,dW = \frac12W_t^2 - \frac12t$, not $\frac12W_t^2$. The $-\frac t2$ is quadratic variation at work. Using midpoints instead gives the Stratonovich integral, which obeys ordinary calculus but is not a martingale.</li>
      <li>Deterministic integrand: $\int_0^t f(s)\,dW_s\sim N\left(0,\int_0^tf^2ds\right)$.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Left-point sums of ∫W dW vs ½(W² − t)', height: 300,
        params: [{ id: 'n', label: 'steps (log₂)', min: 3, max: 13, step: 1, value: 8, fmt: v => 2 ** v }, { id: 'rule', label: 'evaluation point', type: 'select', value: 'left', options: [['left', 'left (Itô)'], ['mid', 'midpoint (Stratonovich)'], ['right', 'right']] }],
        init(s) { s.seed = 17; }, buttons: seedBtn,
        draw(g, p, s) {
          const fine = bm(s.seed, 2 ** 13, 1), n = 2 ** p.n, st = 2 ** 13 / n; let I = 0; const pts = [[0, 0]], tgt = [[0, 0]];
          for (let i = 0; i < n; i++) { const a = fine[i * st], b = fine[(i + 1) * st], Hh = p.rule === 'left' ? a : p.rule === 'right' ? b : (a + b) / 2; I += Hh * (b - a); pts.push([(i + 1) / n, I]); tgt.push([(i + 1) / n, 0.5 * b * b - (p.rule === 'left' ? 0.5 * (i + 1) / n : p.rule === 'right' ? -0.5 * (i + 1) / n : 0)]); }
          const ys = pts.map(q => q[1]).concat(tgt.map(q => q[1])); g.view(0, 1, Math.min(...ys, -0.6) - 0.1, Math.max(...ys, 0.6) + 0.1).axes({ xlabel: 't' });
          g.path(tgt, { color: C.speed, width: 3 }); g.path(pts, { color: C.fe, width: 1.5 });
          s.I = I; s.W = fine[2 ** 13];
        },
        info: (p, s) => { const W = s.W || 0; return h`Sum $= ${fx(s.I, 4)}$. Compare $\tfrac12W_1^2 = ${fx(0.5 * W * W, 4)}$ and $\tfrac12(W_1^2 - 1) = ${fx(0.5 * (W * W - 1), 4)}$. ${p.rule === 'left' ? 'Itô: the sum tracks ½(W² − t).' : p.rule === 'mid' ? 'Midpoint: the sum tracks ½W², the ordinary-calculus answer.' : 'Right point: ½(W² + t).'}`; },
      }) },
    ],
    formulas: [h`\int_0^tH\,dW = \lim\sum H_{t_i}\Delta W_i`, h`E\left[\left(\int_0^t H\,dW\right)^2\right] = E\int_0^tH^2\,ds`, h`\int_0^tW_s\,dW_s = \tfrac12W_t^2 - \tfrac12t`, h`\int_0^tf(s)\,dW_s\sim N\left(0,\textstyle\int_0^tf^2ds\right)`],
    problems: [
      () => { const t = R.int(1, 5); return { q: h`$\operatorname{Var}\left(\int_0^{${t}} s\,dW_s\right)$?`, a: t ** 3 / 3, tol: 1e-3, sol: h`Isometry: $\int_0^{${t}}s^2ds = ${t}^3/3 = ${fx(t ** 3 / 3, 4)}$` }; },
      () => { const t = R.int(1, 4); return { q: h`$E\left[\left(\int_0^{${t}}W_s\,dW_s\right)^2\right]$?`, a: t * t / 2, tol: 1e-4, sol: h`$E\int_0^{${t}}W_s^2ds = \int_0^{${t}}s\,ds = ${t * t / 2}$` }; },
      () => { const w = R.pick([1, 2, -1, 0.5]), t = R.pick([1, 2]); return { q: h`If $W_{${t}} = ${w}$, what is $\int_0^{${t}}W\,dW$?`, a: 0.5 * w * w - 0.5 * t, tol: 1e-6, sol: h`$\tfrac12(${w})^2 - \tfrac12(${t}) = ${0.5 * w * w - 0.5 * t}$` }; },
      () => ({ q: h`$E\left[\int_0^T H_s\,dW_s\right]$ for adapted, square-integrable $H$ is…`, choices: ['0', 'T', h`$E[H_T]\,T$`, 'undefined'], a: 0, sol: 'Itô integrals are martingales starting at 0.' }),
    ],
  });

  MF.lesson({
    id: 'fe-itolemma', title: "Itô's lemma", minutes: 18,
    summary: 'The chain rule for stochastic processes: Taylor expand to second order and replace (dX)² by σ² dt.',
    sections: [
      h`<p>Let $dX_t = \mu\,dt + \sigma\,dW_t$ (an <b>Itô process</b>) and $f(t,x)$ smooth. Taylor expand and use $(dX)^2 = \sigma^2dt$:</p>
      $$df(t,X_t) = \left(f_t + \mu f_x + \tfrac12\sigma^2f_{xx}\right)dt + \sigma f_x\,dW_t$$
      <p>The extra $\frac12\sigma^2f_{xx}\,dt$ is the <b>Itô correction</b>. It comes from convexity: Jensen's inequality, made dynamic.</p>
      <p><b>Key examples</b></p><ul>
      <li>$f = W^2$: $d(W^2) = dt + 2W\,dW$. Integrate to recover $\int W\,dW = \frac12(W_t^2 - t)$.</li>
      <li>GBM $dS = mS\,dt + \sigma S\,dW$ and $f = \ln S$: $d\ln S = (m - \frac12\sigma^2)dt + \sigma\,dW$. Hence the lognormal solution.</li>
      <li>Product rule: $d(XY) = X\,dY + Y\,dX + dX\,dY$.</li>
      <li>Multi-dimensional: $df = f_tdt + \sum_if_i\,dX^i + \frac12\sum_{i,j}f_{ij}\,dX^idX^j$.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Why the correction exists: convexity of f along a noisy path', height: 300,
        params: [{ id: 's', label: 'σ', min: 0.05, max: 1, step: 0.01, value: 0.5 }],
        init(s) { s.seed = 23; }, buttons: seedBtn,
        draw(g, p, s) {
          const N = 1000, w = bm(s.seed, N, 1); let naive = 0, ito = 0; const pa = [[0, 0]], pb = [[0, 0]], pc = [[0, 0]];
          for (let i = 0; i < N; i++) { const x = p.s * w[i], dx = p.s * (w[i + 1] - w[i]); naive += 2 * x * dx; ito += 2 * x * dx + p.s * p.s / N; pa.push([(i + 1) / N, (p.s * w[i + 1]) ** 2]); pb.push([(i + 1) / N, naive]); pc.push([(i + 1) / N, ito]); }
          const ys = pa.concat(pb).map(q => q[1]); g.view(0, 1, Math.min(...ys) - 0.05, Math.max(...ys) + 0.05).axes({ xlabel: 't' });
          g.path(pa, { color: C.speed, width: 3 }); g.path(pb, { color: C.bad, width: 1.5, dash: [5, 4] }); g.path(pc, { color: C.good, width: 1.5 });
          g.legend([['f(X) = X², X = σW', C.speed], ['∫ f\'(X) dX (ordinary chain rule)', C.bad], ['+ ½∫ f\'\'(X) σ² dt (Itô)', C.good]], { x: 60 });
        },
        info: p => h`The ordinary chain rule misses exactly $\frac12 f''\sigma^2 t = \sigma^2 t = ${fx(p.s * p.s, 3)}$ by $t=1$. Itô's lemma puts it back.`,
      }) },
      h`<h3>Recipe</h3><ol><li>Write $dX = \mu\,dt + \sigma\,dW$.</li><li>Compute $f_t, f_x, f_{xx}$.</li><li>Drift = $f_t + \mu f_x + \frac12\sigma^2 f_{xx}$; diffusion = $\sigma f_x$.</li></ol>`,
    ],
    formulas: [h`df = \left(f_t + \mu f_x + \tfrac12\sigma^2 f_{xx}\right)dt + \sigma f_x\,dW`, h`d\ln S = \left(m - \tfrac12\sigma^2\right)dt + \sigma\,dW`, h`d(XY) = X\,dY + Y\,dX + d[X,Y]`],
    problems: [
      () => { const n = R.int(3, 5); return { q: h`$d(W_t^{${n}}) = a\,W_t^{${n - 2}}dt + b\,W_t^{${n - 1}}dW_t$. What is $a$?`, a: n * (n - 1) / 2, sol: h`$\frac12 f'' = \frac12\cdot${n}\cdot${n - 1}\,W^{${n - 2}}$` }; },
      () => { const m = R.pick([0.05, 0.1, 0.08]), s = R.pick([0.2, 0.3, 0.4]); return { q: h`$dS = ${m}S\,dt + ${s}S\,dW$. Drift of $\ln S$?`, a: m - s * s / 2, tol: 1e-5, sol: h`$m - \frac12\sigma^2 = ${m} - ${fx(s * s / 2, 4)} = ${fx(m - s * s / 2, 4)}$` }; },
      () => { const m = R.pick([0.05, 0.1]), s = R.pick([0.2, 0.3]); return { q: h`$dS = ${m}S\,dt + ${s}S\,dW$. $d(S^2) = a\,S^2dt + b\,S^2dW$. What is $a$?`, a: 2 * m + s * s, tol: 1e-5, sol: h`$f_x = 2S$, $f_{xx} = 2$: drift $2mS^2 + \sigma^2S^2$ → $a = ${fx(2 * m + s * s, 4)}$` }; },
      () => { const th = R.pick([1, 2, 0.5]); return { q: h`For $Y_t = e^{${th}W_t - c\,t}$ to be a martingale (zero drift), what is $c$?`, a: th * th / 2, tol: 1e-6, sol: h`Drift $= (-c + \tfrac12\cdot${th}^2)Y$ → $c = ${th * th / 2}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-gbm', title: 'Geometric Brownian motion & SDEs', minutes: 15,
    summary: 'dS = μS dt + σS dW, solved exactly by Itô. Simulation with Euler–Maruyama vs the exact scheme.',
    sections: [
      h`<p>A stochastic differential equation $dX = a(t,X)dt + b(t,X)dW$ is shorthand for $X_t = X_0 + \int_0^ta\,ds + \int_0^tb\,dW$. The Black–Scholes stock model is <b>GBM</b>:</p>
      $$dS_t = \mu S_t\,dt + \sigma S_t\,dW_t\ \Rightarrow\ S_t = S_0\exp\left(\left(\mu - \tfrac12\sigma^2\right)t + \sigma W_t\right)$$
      <p>$E[S_t] = S_0e^{\mu t}$, $\operatorname{Var}S_t = S_0^2e^{2\mu t}(e^{\sigma^2t}-1)$.</p>
      <p><b>Euler–Maruyama</b> simulates any SDE: $X_{n+1} = X_n + a\,\Delta t + b\sqrt{\Delta t}\,Z_n$. It has strong order ½ and weak order 1. For GBM you can step exactly with the log solution: no discretisation error.</p>`,
      { viz: host => MF.explore(host, {
        title: 'GBM paths with mean and percentile bands', height: 320,
        params: [{ id: 'mu', label: 'drift μ', min: -0.2, max: 0.3, step: 0.01, value: 0.08, fmt: v => MF.pct(v, 0) }, { id: 's', label: 'vol σ', min: 0.05, max: 0.8, step: 0.01, value: 0.3, fmt: v => MF.pct(v, 0) }, { id: 'k', label: 'paths', min: 1, max: 50, step: 1, value: 20, fmt: v => v }],
        init(s) { s.seed = 41; }, buttons: seedBtn,
        draw(g, p, s) {
          const T = 2, N = 300, top = 100 * Math.exp((p.mu - p.s * p.s / 2) * T + 2.2 * p.s * Math.sqrt(T));
          g.view(0, T, 0, Math.max(top, 150)).axes({ xlabel: 't (years)' });
          for (let k = 0; k < p.k; k++) { const w = bm(s.seed + k, N, T); g.path(w.map((x, i) => [i * T / N, 100 * Math.exp((p.mu - p.s * p.s / 2) * i * T / N + p.s * x)]), { color: C.alpha(C.series[k % 8], 0.55), width: 1 }); }
          g.fn(t => 100 * Math.exp(p.mu * t), { color: C.good, width: 2.5 });
          g.fn(t => 100 * Math.exp((p.mu - p.s * p.s / 2) * t), { color: C.speed, width: 2.5 });
          [-1.645, 1.645].forEach(z => g.fn(t => 100 * Math.exp((p.mu - p.s * p.s / 2) * t + z * p.s * Math.sqrt(t)), { color: C.speed, dash: [5, 4] }));
          g.legend([['mean S₀e^{μt}', C.good], ['median', C.speed], ['5%–95%', C.speed]], { x: 60 });
        },
        info: p => h`Median growth rate $\mu - \frac12\sigma^2 = ${MF.pct(p.mu - p.s * p.s / 2, 2)}$ vs mean ${MF.pct(p.mu, 0)}. ${p.mu - p.s * p.s / 2 < 0 && p.mu > 0 ? '<b>The mean grows but the typical path shrinks!</b>' : ''}`,
      }) },
    ],
    formulas: [h`dS = \mu S\,dt + \sigma S\,dW`, h`S_t = S_0e^{(\mu-\frac12\sigma^2)t + \sigma W_t}`, h`X_{n+1} = X_n + a(X_n)\Delta t + b(X_n)\sqrt{\Delta t}\,Z_n`, h`\operatorname{Var}S_t = S_0^2e^{2\mu t}\left(e^{\sigma^2t} - 1\right)`],
    problems: [
      () => { const mu = R.pick([0.05, 0.1]), s = R.pick([0.2, 0.3]), w = R.pick([0.5, -0.5, 1]), t = 1; const v = 100 * Math.exp((mu - s * s / 2) * t + s * w); return { q: h`GBM, $S_0 = 100$, $\mu = ${mu}$, $\sigma = ${s}$. If $W_1 = ${w}$, what is $S_1$?`, a: v, tol: 0.005, sol: h`$100e^{(${mu} - ${fx(s * s / 2, 3)}) + ${s}\cdot${w}} = ${fx(v, 4)}$` }; },
      () => { const mu = R.pick([0.05, 0.08]), s = R.pick([0.2, 0.4]), t = R.int(1, 5); const sd = 100 * Math.exp(mu * t) * Math.sqrt(Math.exp(s * s * t) - 1); return { q: h`GBM, $S_0 = 100$, $\mu = ${mu}$, $\sigma = ${s}$. Std. dev. of $S_{${t}}$?`, a: sd, tol: 0.01, sol: h`$100e^{${mu}\cdot${t}}\sqrt{e^{${s}^2\cdot${t}} - 1} = ${fx(sd, 3)}$` }; },
      () => { const x = 100, mu = 0.1, s = 0.2, dt = R.pick([0.01, 0.1]), z = R.pick([1, -1, 0.5]); const v = x + mu * x * dt + s * x * Math.sqrt(dt) * z; return { q: h`One Euler–Maruyama step for GBM: $S = 100$, $\mu = 0.1$, $\sigma = 0.2$, $\Delta t = ${dt}$, $Z = ${z}$. New $S$?`, a: v, tol: 0.005, sol: h`$100 + 0.1\cdot100\cdot${dt} + 0.2\cdot100\sqrt{${dt}}\cdot${z} = ${fx(v, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-ou', title: 'Ornstein–Uhlenbeck & mean reversion', minutes: 14,
    summary: 'dX = κ(θ − X)dt + σ dW: solved with an integrating factor, Gaussian with stationary variance σ²/2κ. Used for rates, spreads and volatility.',
    sections: [
      h`<p>Apply Itô to $e^{\kappa t}X_t$ to solve the OU SDE exactly:</p>
      $$X_t = \theta + (X_0 - \theta)e^{-\kappa t} + \sigma\int_0^te^{-\kappa(t-s)}dW_s$$
      <ul><li>$E[X_t] = \theta + (X_0-\theta)e^{-\kappa t}$</li><li>$\operatorname{Var}X_t = \frac{\sigma^2}{2\kappa}\left(1 - e^{-2\kappa t}\right)\to\frac{\sigma^2}{2\kappa}$</li>
      <li>Exact simulation: $X_{t+\Delta} = \theta + (X_t-\theta)e^{-\kappa\Delta} + \sigma\sqrt{\frac{1-e^{-2\kappa\Delta}}{2\kappa}}\,Z$</li></ul>
      <p>This is the <b>Vasicek</b> short-rate model and the continuous-time AR(1). Rates can go negative, which CIR's $\sigma\sqrt{r}\,dW$ fixes.</p>`,
      { viz: host => MF.explore(host, {
        title: 'OU paths pulled back to θ', height: 300,
        params: [{ id: 'k', label: 'speed κ', min: 0.1, max: 8, step: 0.1, value: 2 }, { id: 'th', label: 'θ', min: -0.02, max: 0.1, step: 0.005, value: 0.04, fmt: v => MF.pct(v, 1) }, { id: 's', label: 'σ', min: 0.002, max: 0.05, step: 0.001, value: 0.015, fmt: v => MF.pct(v, 1) }, { id: 'x0', label: 'x₀', min: -0.02, max: 0.12, step: 0.005, value: 0.1, fmt: v => MF.pct(v, 1) }],
        init(s) { s.seed = 51; }, buttons: seedBtn,
        draw(g, p, s) {
          const T = 3, N = 400, dt = T / N, a = Math.exp(-p.k * dt), sd = p.s * Math.sqrt((1 - a * a) / (2 * p.k));
          g.view(0, T, -0.04, 0.14).axes({ xlabel: 't', fy: v => MF.pct(v, 0) });
          const sv = p.s / Math.sqrt(2 * p.k); g.fn(() => p.th + 2 * sv, { color: C.speed, dash: [4, 4] }); g.fn(() => p.th - 2 * sv, { color: C.speed, dash: [4, 4] });
          for (let k = 0; k < 8; k++) { const r = R.seeded(s.seed + k); let x = p.x0; const pts = [[0, x]]; for (let i = 1; i <= N; i++) { x = p.th + (x - p.th) * a + sd * r.normal(); pts.push([i * dt, x]); } g.path(pts, { color: C.alpha(C.series[k], 0.65), width: 1.2 }); }
          g.fn(t => p.th + (p.x0 - p.th) * Math.exp(-p.k * t), { color: C.text, width: 2 });
        },
        info: p => h`Stationary sd $\sigma/\sqrt{2\kappa} = ${MF.pct(p.s / Math.sqrt(2 * p.k), 2)}$; half-life ${fx(Math.log(2) / p.k, 3)}y. White line: $E[X_t]$. P(negative) in the long run: ${fx(M.ncdf(-p.th / (p.s / Math.sqrt(2 * p.k))), 4)}.`,
      }) },
    ],
    formulas: [h`dX = \kappa(\theta - X)\,dt + \sigma\,dW`, h`E[X_t] = \theta + (X_0 - \theta)e^{-\kappa t}`, h`\operatorname{Var}X_t = \frac{\sigma^2}{2\kappa}\left(1-e^{-2\kappa t}\right)`],
    problems: [
      () => { const k = R.pick([0.5, 1, 2]), s = R.pick([0.01, 0.02]); return { q: h`OU with $\kappa = ${k}$, $\sigma = ${s}$. Stationary standard deviation?`, a: s / Math.sqrt(2 * k), tol: 1e-5, sol: h`$\frac{${s}}{\sqrt{2\cdot${k}}} = ${fx(s / Math.sqrt(2 * k), 5)}$` }; },
      () => { const k = R.pick([0.5, 1, 2]), th = 0.04, x0 = R.pick([0.02, 0.08]), t = R.int(1, 3); return { q: h`OU: $\kappa = ${k}$, $\theta = 0.04$, $X_0 = ${x0}$. $E[X_{${t}}]$?`, a: th + (x0 - th) * Math.exp(-k * t), tol: 1e-5, sol: h`$0.04 + (${x0} - 0.04)e^{-${k * t}} = ${fx(th + (x0 - th) * Math.exp(-k * t), 5)}$` }; },
      () => { const k = R.pick([1, 2]), s = 0.02, t = R.pick([0.5, 1]); const v = s * s / (2 * k) * (1 - Math.exp(-2 * k * t)); return { q: h`OU: $\kappa = ${k}$, $\sigma = 0.02$. $\operatorname{Var}(X_{${t}})$ starting from a known $X_0$?`, a: v, rtol: 1e-3, sol: h`$\frac{0.02^2}{2\cdot${k}}(1 - e^{-${2 * k * t}}) = ${fx(v, 7)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-girsanov', title: 'Change of measure & Girsanov', minutes: 18,
    summary: 'Reweight probabilities with a Radon–Nikodym density and Brownian motion acquires a drift. This is how real-world dynamics become risk-neutral.',
    sections: [
      h`<p>A new measure $\mathbb Q$ is defined by a positive density $Z = \frac{d\mathbb Q}{d\mathbb P}$ with $E^{\mathbb P}[Z] = 1$: $E^{\mathbb Q}[X] = E^{\mathbb P}[ZX]$. Equivalent measures agree on which events are impossible.</p>
      <p><b>Girsanov:</b> with $Z_T = \exp\left(-\int_0^T\theta\,dW - \frac12\int_0^T\theta^2dt\right)$, the process $\tilde W_t = W_t + \int_0^t\theta\,ds$ is a $\mathbb Q$-Brownian motion. Changing measure changes the <b>drift</b>, never the volatility.</p>
      <p>For a stock $dS = \mu S\,dt + \sigma S\,dW$ choose $\theta = \frac{\mu - r}{\sigma}$, the <b>market price of risk</b>. Then $dS = rS\,dt + \sigma S\,d\tilde W$: under $\mathbb Q$ the stock earns the risk-free rate and $e^{-rt}S_t$ is a martingale. That's the continuous-time risk-neutral measure, and why option prices don't depend on $\mu$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Reweighting P-samples of W_T turns N(0,T) into N(−θT, T)', height: 300,
        params: [{ id: 'th', label: 'θ (market price of risk)', min: -1.5, max: 1.5, step: 0.05, value: 0.6 }],
        init(s) { const r = R.seeded(61); s.w = Array.from({ length: 6000 }, () => r.normal()); },
        draw(g, p, s) {
          const T = 1, th = p.th, k = 60, lo = -4, hi = 4, bw = (hi - lo) / k, wts = new Array(k).fill(0), raw = new Array(k).fill(0);
          s.w.forEach(w => { const i = Math.floor((w - lo) / bw); if (i >= 0 && i < k) { raw[i]++; wts[i] += Math.exp(-th * w - 0.5 * th * th * T); } });
          g.view(lo, hi, 0, 0.6).axes();
          raw.forEach((n, i) => g.rect(lo + i * bw, 0, bw, n / (s.w.length * bw), { fill: C.alpha(C.fe, 0.25) }));
          wts.forEach((n, i) => g.rect(lo + i * bw, 0, bw, n / (s.w.length * bw), { fill: C.alpha(C.speed, 0.45) }));
          g.fn(x => M.npdf(x, 0, 1), { color: C.fe, width: 2 }); g.fn(x => M.npdf(x, -th * T, 1), { color: C.speed, width: 2 });
          g.legend([['P: W_T', C.fe], ['Q: weighted by Z', C.speed]], { x: g.W - 160 });
        },
        info: p => h`Weights $Z = e^{-\theta W_T - \theta^2T/2}$ have $E^{\mathbb P}[Z] = 1$. Under $\mathbb Q$, $W_T$ has mean $-\theta T = ${fx(-p.th, 2)}$ but the <b>same variance</b>. So $\tilde W = W + \theta t$ is $\mathbb Q$-Brownian.`,
      }) },
    ],
    formulas: [h`E^{\mathbb Q}[X] = E^{\mathbb P}\left[\tfrac{d\mathbb Q}{d\mathbb P}X\right]`, h`Z_T = \exp\left(-\textstyle\int_0^T\theta\,dW - \tfrac12\int_0^T\theta^2dt\right)`, h`\tilde W_t = W_t + \textstyle\int_0^t\theta_s\,ds`, h`\theta = \frac{\mu - r}{\sigma}`],
    problems: [
      () => { const mu = R.pick([0.08, 0.1, 0.12]), r = R.pick([0.02, 0.03]), s = R.pick([0.2, 0.25]); return { q: h`$\mu = ${mu}$, $r = ${r}$, $\sigma = ${s}$. Market price of risk θ?`, a: (mu - r) / s, tol: 1e-4, sol: h`$\frac{${mu} - ${r}}{${s}} = ${fx((mu - r) / s, 4)}$` }; },
      () => { const r = R.pick([0.02, 0.04]); return { q: h`Under the risk-neutral measure, what is the drift rate of $S$ in $dS = (\,?\,)S\,dt + \sigma S\,d\tilde W$ (no dividends, $r = ${r}$)?`, a: r, tol: 1e-6, sol: 'Under Q every traded asset grows at r.' }; },
      () => { const th = R.pick([0.5, 1]), T = R.pick([1, 2]); return { q: h`Under $\mathbb Q$ defined by $Z_T = e^{-${th}W_T - ${th * th / 2}\cdot${T}}$, what is $E^{\mathbb Q}[W_{${T}}]$?`, a: -th * T, tol: 1e-6, sol: h`$W = \tilde W - \theta t$, so $E^{\mathbb Q}[W_T] = -\theta T = ${-th * T}$` }; },
      () => ({ q: h`Changing from $\mathbb P$ to an equivalent $\mathbb Q$ via Girsanov changes…`, choices: ['only the drift', 'only the volatility', 'both drift and volatility', 'neither'], a: 0, sol: 'Quadratic variation is the same under equivalent measures, so volatility cannot change.' }),
    ],
  });

  MF.lesson({
    id: 'fe-feynmankac', title: 'Feynman–Kac: expectations ⇔ PDEs', minutes: 15,
    summary: 'A discounted expectation under an SDE solves a parabolic PDE, and vice versa. Pricing can be done by simulation or by solving a PDE.',
    sections: [
      h`<p>Let $dX = \mu(t,X)\,dt + \sigma(t,X)\,dW$ and define $u(t,x) = E\left[e^{-\int_t^Tr\,ds}g(X_T)\mid X_t = x\right]$. Then $u$ solves</p>
      $$u_t + \mu u_x + \tfrac12\sigma^2u_{xx} - ru = 0,\qquad u(T,x) = g(x)$$
      <p><b>Why:</b> $e^{-rt}u(t,X_t)$ must be a martingale (it is a conditional expectation of a fixed variable), so the $dt$ term from Itô's lemma must vanish, and that term is exactly the PDE.</p>
      <p>Under $\mathbb Q$ with $\mu = rS$, $\sigma\to\sigma S$, this <b>is the Black–Scholes PDE</b>. The generator $\mathcal L = \mu\partial_x + \frac12\sigma^2\partial_{xx}$ links SDEs and PDEs. The heat equation $u_t = \frac12u_{xx}$ corresponds to plain Brownian motion: its solution is a Gaussian average of the initial data.</p>`,
      { viz: host => MF.explore(host, {
        title: 'u(t,x) = E[g(x + W_{T−t})] smooths the payoff like heat diffusion', height: 300,
        params: [{ id: 'tau', label: 'time to maturity T − t', min: 0.001, max: 4, step: 0.01, value: 0.5 }, { id: 'g', label: 'terminal payoff g', type: 'select', value: 'call', options: [['call', '(x − 0)⁺'], ['dig', '1{x > 0}'], ['bfly', 'tent']] }],
        draw(g, p) {
          const G = { call: x => Math.max(x, 0), dig: x => (x > 0 ? 1 : 0), bfly: x => Math.max(1 - Math.abs(x), 0) }[p.g];
          const u = x => { let s = 0, ws = 0; for (let k = -40; k <= 40; k++) { const z = k / 10, w = M.npdf(z); s += w * G(x + Math.sqrt(p.tau) * z); ws += w; } return s / ws; };
          g.view(-4, 4, -0.2, 2.2).axes();
          g.fn(G, { color: C.dim, width: 2, dash: [5, 4], n: 800 }); g.fn(u, { color: C.fe, width: 3 });
          g.legend([['g(x) at T', C.dim], ['u(t, x)', C.fe]], { x: 60 });
        },
        info: () => 'The further from maturity, the more the kinks smooth out. That smoothing is the ½u_xx (diffusion) term.',
      }) },
    ],
    formulas: [h`u(t,x) = E\left[e^{-r(T-t)}g(X_T)\mid X_t = x\right]`, h`u_t + \mu u_x + \tfrac12\sigma^2u_{xx} - ru = 0`, h`\mathcal L = \mu\,\partial_x + \tfrac12\sigma^2\,\partial_{xx}`],
    problems: [
      () => { const t = R.pick([0.5, 1, 2]), x = R.pick([0, 1, -1]); return { q: h`$u(t,x) = E[(x + W_{${t}})^2]$ solves $u_t = \tfrac12u_{xx}$. Evaluate at $x = ${x}$.`, a: x * x + t, tol: 1e-6, sol: h`$x^2 + t = ${x * x + t}$` }; },
      () => { const r = R.pick([0.03, 0.05]), T = R.pick([1, 2]); return { q: h`For $g \equiv 1$ and constant $r = ${r}$, the Feynman–Kac solution $u(0,x)$ over $T = ${T}$ is?`, a: Math.exp(-r * T), tol: 1e-5, sol: h`A zero-coupon bond: $e^{-${r}\cdot${T}} = ${fx(Math.exp(-r * T), 5)}$` }; },
      () => ({ q: h`Under $\mathbb Q$ with $dS = rS\,dt + \sigma S\,dW$, the Feynman–Kac PDE becomes…`, choices: [h`$V_t + rSV_S + \tfrac12\sigma^2S^2V_{SS} - rV = 0$`, h`$V_t + \mu SV_S + \tfrac12\sigma^2 V_{SS} = 0$`, h`$V_t = \tfrac12 V_{SS}$`, h`$V_t + rV = 0$`], a: 0, sol: 'This is the Black–Scholes PDE.' }),
    ],
  });
})();
