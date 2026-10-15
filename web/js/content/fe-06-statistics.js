/* FE Math · Unit 6: statistics & econometrics */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;

  MF.unit('fe', 'fe-u6', 'Statistics & Econometrics', 'Estimation, confidence intervals, maximum likelihood, regression, hypothesis tests, time series and volatility models.');

  MF.lesson({
    id: 'fe-estimation', title: 'Estimators & confidence intervals', minutes: 14,
    summary: 'Bias, variance and MSE of estimators; the sample mean and variance; what a 95% confidence interval really means.',
    sections: [
      h`<p>An <b>estimator</b> $\hat\theta$ is a function of data used to guess a parameter $\theta$. Judge it by <b>bias</b> $E[\hat\theta]-\theta$ and <b>variance</b>. The two combine as $\text{MSE} = \text{bias}^2 + \text{variance}$.</p>
      <ul><li>Sample mean $\bar x$: unbiased, variance $\sigma^2/n$.</li>
      <li>Sample variance $s^2 = \frac{1}{n-1}\sum(x_i-\bar x)^2$. The $n-1$ (Bessel's correction) makes it unbiased.</li>
      <li><b>95% CI</b> for a mean: $\bar x \pm 1.96\,\frac{s}{\sqrt n}$ (use $t_{n-1}$ for small $n$).</li></ul>
      <p>A 95% CI does <b>not</b> mean "95% probability the true value is inside this interval". It means the <i>procedure</i> captures the true value in 95% of repeated samples. The simulation shows exactly that.</p>
      <div class="callout key"><b>Finance reality</b>Mean returns are notoriously hard to estimate: with 20% volatility, even 25 years of data gives a standard error of $0.2/\sqrt{25} = 4\%$ on the annual mean. Volatilities are far easier to estimate.</div>`,
      { viz: host => MF.explore(host, {
        title: '50 confidence intervals from repeated samples', height: 340,
        params: [{ id: 'n', label: 'sample size n', min: 5, max: 200, step: 1, value: 25, fmt: v => v }, { id: 'lvl', label: 'confidence level', min: 0.5, max: 0.99, step: 0.01, value: 0.95, fmt: v => MF.pct(v, 0) }],
        init(s) { s.seed = 21; },
        buttons: [{ label: '🎲 New samples', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }],
        draw(g, p, s) {
          const r = R.seeded(s.seed), mu = 0, sd = 1, z = M.ninv(0.5 + p.lvl / 2); let miss = 0;
          g.view(-1.5, 1.5, 0, 51).axes({ ystep: 10 });
          for (let k = 0; k < 50; k++) {
            const xs = Array.from({ length: p.n }, () => mu + sd * r.normal()), m = M.mean(xs), se = M.std(xs) / Math.sqrt(p.n);
            const hit = m - z * se <= mu && mu <= m + z * se; if (!hit) miss++;
            g.line(m - z * se, k + 0.5, m + z * se, k + 0.5, { color: hit ? C.alpha(C.fe, 0.8) : C.bad, width: 2 }); g.dot(m, k + 0.5, { r: 2, color: hit ? C.fe : C.bad });
          }
          g.vline(mu, { color: C.speed, dash: [], width: 1.5 }); s.miss = miss;
        },
        info: (p, s) => `${50 - (s.miss || 0)} of 50 intervals contain the true mean (expected ≈ ${Math.round(50 * p.lvl)}). Red ones miss. Larger n makes intervals shorter but the hit rate stays the same.`,
      }) },
    ],
    formulas: [h`\text{MSE} = \text{Bias}^2 + \text{Var}`, h`s^2 = \frac{1}{n-1}\sum_{i=1}^n (x_i-\bar x)^2`, h`\bar x\pm z_{1-\alpha/2}\frac{s}{\sqrt n}`],
    problems: [
      () => { const xs = Array.from({ length: 5 }, () => R.int(1, 12)); return { q: h`Sample variance (with $n-1$) of $${xs.join(', ')}$?`, a: M.variance(xs), tol: 1e-3, sol: h`$\bar x = ${fx(M.mean(xs), 3)}$, $s^2 = ${fx(M.variance(xs), 4)}$` }; },
      () => { const m = R.pick([0.05, 0.08, 0.1]), s = R.pick([0.15, 0.2, 0.25]), n = R.pick([16, 25, 36, 100]); return { q: h`Mean annual return ${m}, std. dev. ${s}, ${n} years of data. Upper end of the 95% CI (use 1.96)?`, a: m + 1.96 * s / Math.sqrt(n), tol: 1e-3, sol: h`$${m} + 1.96\cdot\frac{${s}}{\sqrt{${n}}} = ${fx(m + 1.96 * s / Math.sqrt(n), 4)}$` }; },
      () => { const b = R.pick([0.1, 0.2, -0.3]), v = R.pick([0.04, 0.09, 0.01]); return { q: h`An estimator has bias ${b} and variance ${v}. MSE?`, a: b * b + v, tol: 1e-5, sol: h`$${b}^2 + ${v} = ${fx(b * b + v, 4)}$` }; },
      () => { const s = R.pick([0.15, 0.2, 0.3]), se = R.pick([0.01, 0.02]); return { q: h`Vol ${fx(s * 100, 4)}%. How many years of data for a ${fx(se * 100, 4)}% standard error on the mean return?`, a: (s / se) ** 2, tol: 0.5, sol: h`$n = (\sigma/\text{se})^2 = ${(s / se) ** 2}$ years` }; },
    ],
  });

  MF.lesson({
    id: 'fe-mle', title: 'Maximum likelihood estimation', minutes: 15,
    summary: 'Choose the parameter that makes the observed data most probable. Log-likelihoods, the score, Fisher information and asymptotic normality.',
    sections: [
      h`<p>Given data $x_1..x_n$ from a density $f(x;\theta)$, the <b>likelihood</b> is $L(\theta) = \prod f(x_i;\theta)$ and the MLE maximises the <b>log-likelihood</b> $\ell(\theta) = \sum\ln f(x_i;\theta)$. Set the score $\ell'(\theta) = 0$.</p>
      <ul><li>Normal: $\hat\mu = \bar x$, $\hat\sigma^2 = \frac1n\sum(x_i-\bar x)^2$ (biased, but consistent).</li>
      <li>Exponential($\lambda$): $\hat\lambda = 1/\bar x$. Poisson($\lambda$): $\hat\lambda = \bar x$. Bernoulli: $\hat p = $ fraction of successes.</li>
      <li><b>Asymptotics:</b> $\hat\theta\approx N\left(\theta, \frac{1}{nI(\theta)}\right)$ where the Fisher information is $I(\theta) = -E[\partial_\theta^2\ln f]$. Sharper curvature in $\ell$ means a more precise estimate.</li></ul>
      <p>MLE is how GARCH models, default intensities and stochastic-volatility parameters are calibrated to historical data.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Log-likelihood of a default probability p', height: 300,
        params: [{ id: 'n', label: 'loans observed n', min: 10, max: 1000, step: 10, value: 100, fmt: v => v }, { id: 'k', label: 'defaults k (as % of n)', min: 1, max: 30, step: 1, value: 5, fmt: v => v + '%' }],
        draw(g, p) {
          const k = Math.max(1, Math.round(p.n * p.k / 100)), n = p.n, ll = q => k * Math.log(q) + (n - k) * Math.log(1 - q), ph = k / n, top = ll(ph);
          g.view(0.001, 0.4, top - 30, top + 3).axes({ xlabel: 'p', fx: v => MF.pct(v, 0) });
          g.fn(ll, { color: C.fe, width: 2.5, from: 0.002, to: 0.399 }); g.vline(ph, { color: C.speed });
          const se = Math.sqrt(ph * (1 - ph) / n); g.ctx.fillStyle = C.alpha(C.speed, 0.12); g.ctx.fillRect(g.X(ph - 1.96 * se), g.Y(top + 3), g.X(ph + 1.96 * se) - g.X(ph - 1.96 * se), g.Y(top - 30) - g.Y(top + 3));
        },
        info: p => { const k = Math.max(1, Math.round(p.n * p.k / 100)), ph = k / p.n, se = Math.sqrt(ph * (1 - ph) / p.n); return h`$\hat p = k/n = ${k}/${p.n} = ${fx(ph, 4)}$. Fisher s.e. $\sqrt{\hat p(1-\hat p)/n} = ${fx(se, 4)}$; shaded is the 95% interval. More data gives a sharper peak.`; },
      }) },
    ],
    formulas: [h`\ell(\theta) = \sum_i \ln f(x_i;\theta)`, h`\ell'(\hat\theta) = 0`, h`\hat\theta\ \dot\sim\ N\!\left(\theta,\ \tfrac{1}{nI(\theta)}\right)`, h`I(\theta) = -E\left[\partial_\theta^2\ln f(X;\theta)\right]`],
    problems: [
      () => { const xs = Array.from({ length: 5 }, () => R.float(0.5, 4, 1)); return { q: h`Waiting times $${xs.join(', ')}$ are i.i.d. Exponential($\lambda$). MLE $\hat\lambda$?`, a: 1 / M.mean(xs), tol: 1e-3, sol: h`$\hat\lambda = 1/\bar x = 1/${fx(M.mean(xs), 3)} = ${fx(1 / M.mean(xs), 4)}$` }; },
      () => { const xs = Array.from({ length: 4 }, () => R.int(1, 9)); const m = M.mean(xs); return { q: h`Data $${xs.join(', ')}$ from $N(\mu,\sigma^2)$. MLE of $\sigma^2$ (divide by $n$)?`, a: M.variance(xs, false), tol: 1e-3, sol: h`$\frac1n\sum(x_i - ${fx(m, 2)})^2 = ${fx(M.variance(xs, false), 4)}$` }; },
      () => { const n = R.pick([200, 400, 1000]), k = R.int(4, 30); const p = k / n; return { q: h`${k} defaults in ${n} loans. Asymptotic standard error of $\hat p$?`, a: Math.sqrt(p * (1 - p) / n), tol: 1e-4, sol: h`$\sqrt{\hat p(1-\hat p)/n} = ${fx(Math.sqrt(p * (1 - p) / n), 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-regression', title: 'Linear regression, OLS & beta', minutes: 16,
    summary: 'Fit y = α + βx + ε by least squares. A stock\'s beta is a regression slope; R² measures explained variance.',
    sections: [
      h`<p><b>Ordinary least squares</b> minimises $\sum(y_i - \alpha - \beta x_i)^2$. Setting derivatives to zero gives:</p>
      $$\hat\beta = \frac{\operatorname{Cov}(x,y)}{\operatorname{Var}(x)} = \rho_{xy}\frac{s_y}{s_x},\qquad \hat\alpha = \bar y - \hat\beta\bar x$$
      <p>In matrix form, $\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top\mathbf y$: the projection of $\mathbf y$ onto the column space of $X$.</p>
      <p><b>$R^2$</b> $= 1 - \frac{SS_{res}}{SS_{tot}}$, the fraction of variance explained (equal to $\rho^2$ for one regressor). Regressing a stock's excess returns on the market's gives the CAPM <b>beta</b> (slope) and <b>alpha</b> (intercept, abnormal return).</p>
      <p>Standard error of the slope: $\operatorname{se}(\hat\beta) = \frac{\hat\sigma_\varepsilon}{s_x\sqrt{n}}$ (approximately); the t-statistic is $\hat\beta/\operatorname{se}$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Fit a beta. Click the canvas to add points', height: 340,
        params: [{ id: 'b', label: 'true β', min: -0.5, max: 2.5, step: 0.05, value: 1.2 }, { id: 'noise', label: 'idiosyncratic noise', min: 0, max: 3, step: 0.05, value: 1 }, { id: 'n', label: 'points', min: 5, max: 300, step: 5, value: 60, fmt: v => v }],
        init(s) { s.seed = 4; s.extra = []; },
        buttons: [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); s.extra = []; } }, { label: 'Clear my points', click: s => { s.extra = []; } }],
        onPointer(g, p, s, e) { if (e.type !== 'down') return false; s.extra.push([e.x, e.y]); },
        draw(g, p, s) {
          const r = R.seeded(s.seed), pts = Array.from({ length: p.n }, () => { const x = 2 * r.normal(); return [x, 0.3 + p.b * x + p.noise * r.normal()]; }).concat(s.extra);
          const asp = g.W / g.H; g.view(-6 * asp / 1.3, 6 * asp / 1.3, -8, 8).axes({ xlabel: 'market %', ylabel: 'stock %' });
          const xs = pts.map(q => q[0]), ys = pts.map(q => q[1]), mx = M.mean(xs), my = M.mean(ys);
          const sxy = M.sum(pts.map(q => (q[0] - mx) * (q[1] - my))), sxx = M.sum(xs.map(x => (x - mx) ** 2)), syy = M.sum(ys.map(y => (y - my) ** 2));
          const bh = sxy / sxx, ah = my - bh * mx; s.fit = { bh, ah, r2: sxy * sxy / (sxx * syy), n: pts.length, se: Math.sqrt(M.sum(pts.map(q => (q[1] - ah - bh * q[0]) ** 2)) / (pts.length - 2) / sxx) };
          const c = g.ctx; pts.forEach(([x, y], i) => { c.fillStyle = i >= p.n ? C.pink : C.alpha(C.fe, 0.6); c.beginPath(); c.arc(g.X(x), g.Y(y), i >= p.n ? 5 : 3, 0, 7); c.fill(); });
          g.fn(x => ah + bh * x, { color: C.speed, width: 2.5 }); g.fn(x => 0.3 + p.b * x, { color: C.good, width: 1, dash: [5, 4] });
        },
        info: (p, s) => s.fit ? h`$\hat\beta = ${fx(s.fit.bh, 3)}$ (se ${fx(s.fit.se, 3)}, t = ${fx(s.fit.bh / s.fit.se, 1)}), $\hat\alpha = ${fx(s.fit.ah, 3)}$, $R^2 = ${fx(s.fit.r2, 3)}$. Dashed green is the true line. Click to add outliers (pink) and watch them pull the fit.` : '',
      }) },
    ],
    formulas: [h`\hat\beta = \frac{\sum(x_i-\bar x)(y_i-\bar y)}{\sum(x_i-\bar x)^2}`, h`\hat\alpha = \bar y - \hat\beta\bar x`, h`\hat{\boldsymbol\beta} = (X^\top X)^{-1}X^\top\mathbf y`, h`R^2 = 1 - \frac{SS_{res}}{SS_{tot}}`, h`\beta_i = \rho_{i,m}\frac{\sigma_i}{\sigma_m}`],
    problems: [
      () => { const rho = R.pick([0.5, 0.6, 0.8, 0.9]), si = R.pick([0.2, 0.3, 0.4]), sm = R.pick([0.15, 0.2]); return { q: h`Correlation with market ${rho}, stock vol ${si}, market vol ${sm}. Beta?`, a: rho * si / sm, tol: 1e-3, sol: h`$\rho\sigma_i/\sigma_m = ${fx(rho * si / sm, 4)}$` }; },
      () => { const xs = [R.int(-3, -1), R.int(0, 1), R.int(2, 4)], b = R.pick([1, 2, -1, 0.5]), a = R.int(-2, 2); const ys = xs.map((x, i) => a + b * x + [0.5, -1, 0.5][i]); const mx = M.mean(xs), my = M.mean(ys); const bh = M.sum(xs.map((x, i) => (x - mx) * (ys[i] - my))) / M.sum(xs.map(x => (x - mx) ** 2)); return { q: h`OLS slope through $(${xs[0]},${fx(ys[0], 2)}), (${xs[1]},${fx(ys[1], 2)}), (${xs[2]},${fx(ys[2], 2)})$?`, a: bh, tol: 2e-3, sol: h`$\hat\beta = \frac{S_{xy}}{S_{xx}} = ${fx(bh, 4)}$` }; },
      () => { const rho = R.pick([0.3, 0.5, 0.7, 0.9]); return { q: h`Simple regression with correlation ${rho}. $R^2$?`, a: rho * rho, tol: 1e-4, sol: h`$R^2 = \rho^2 = ${fx(rho * rho, 4)}$` }; },
      () => { const b = R.pick([1.1, 0.8, 1.5]), ybar = R.pick([0.01, 0.012]), xbar = R.pick([0.008, 0.01]); return { q: h`Mean stock excess return ${ybar}, mean market excess return ${xbar}, $\hat\beta = ${b}$. Alpha?`, a: ybar - b * xbar, tol: 1e-5, sol: h`$\bar y - \hat\beta\bar x = ${fx(ybar - b * xbar, 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-hypothesis', title: 'Hypothesis testing & p-values', minutes: 14,
    summary: 'Null hypotheses, test statistics, p-values, Type I/II errors, and why multiple testing produces fake trading strategies.',
    sections: [
      h`<p>To test $H_0:\mu = \mu_0$, compute $t = \frac{\bar x - \mu_0}{s/\sqrt n}$. Under $H_0$ it's (approximately) $N(0,1)$ or $t_{n-1}$. The <b>p-value</b> is the probability, if $H_0$ were true, of a statistic at least this extreme. Reject at level $\alpha$ if $p<\alpha$.</p>
      <ul><li><b>Type I error</b> (false positive): reject a true $H_0$, with probability $\alpha$.</li><li><b>Type II error</b>: fail to reject a false $H_0$. <b>Power</b> = 1 − P(Type II).</li></ul>
      <p><b>Sharpe ratio test:</b> an annual Sharpe $SR$ estimated over $T$ years has $t\approx SR\sqrt T$. A Sharpe of 0.5 needs 16 years to reach $t=2$!</p>
      <div class="callout warn"><b>Multiple testing</b>Backtest 100 random strategies at $\alpha = 5\%$ and about 5 will look "significant" by luck. Use Bonferroni ($\alpha/m$) or demand $t > 3$ (Harvey–Liu–Zhu).</div>`,
      { viz: host => MF.explore(host, {
        title: 'Two-sided test: rejection region and p-value', height: 280,
        params: [{ id: 't', label: 'observed t-stat', min: -4, max: 4, step: 0.05, value: 2.2 }, { id: 'a', label: 'significance α', min: 0.001, max: 0.2, step: 0.001, value: 0.05, fmt: v => MF.pct(v, 1) }],
        draw(g, p) {
          const zc = M.ninv(1 - p.a / 2), at = Math.abs(p.t);
          g.view(-4.5, 4.5, 0, 0.45).axes();
          g.area(x => M.npdf(x), zc, 4.5, { color: C.alpha(C.bad, 0.3) }); g.area(x => M.npdf(x), -4.5, -zc, { color: C.alpha(C.bad, 0.3) });
          g.area(x => M.npdf(x), at, 4.5, { color: C.alpha(C.speed, 0.6) }); g.area(x => M.npdf(x), -4.5, -at, { color: C.alpha(C.speed, 0.6) });
          g.fn(x => M.npdf(x), { color: C.fe, width: 2.5 }); g.vline(p.t, { color: C.text, dash: [], width: 2 });
        },
        info: p => { const pv = 2 * (1 - M.ncdf(Math.abs(p.t))), zc = M.ninv(1 - p.a / 2); return h`Critical value $\pm${fx(zc, 3)}$ (red). p-value $= 2(1-\Phi(|t|)) = $ <b>${fx(pv, 4)}</b> (orange): ${pv < p.a ? '<b style="color:var(--good)">reject H₀</b>' : 'fail to reject H₀'}.`; },
      }) },
    ],
    formulas: [h`t = \frac{\bar x - \mu_0}{s/\sqrt n}`, h`p = 2\left(1-\Phi(|t|)\right)`, h`t_{SR}\approx SR\sqrt{T}`, h`\alpha_{\text{Bonf}} = \alpha/m`],
    problems: [
      () => { const xb = R.pick([0.4, 0.6, 1.0]), s = R.pick([2, 3, 4]), n = R.pick([36, 64, 100]); const t = xb / (s / Math.sqrt(n)); return { q: h`Mean daily P&L ${xb}, std ${s}, ${n} days. t-statistic vs 0?`, a: t, tol: 0.01, sol: h`$\frac{${xb}}{${s}/\sqrt{${n}}} = ${fx(t, 3)}$` }; },
      () => { const t = R.pick([1.5, 1.96, 2.5, 3, 1.2]); return { q: h`Two-sided p-value for $z = ${t}$?`, a: 2 * (1 - M.ncdf(t)), tol: 0.002, sol: h`$2(1-\Phi(${t})) = ${fx(2 * (1 - M.ncdf(t)), 4)}$` }; },
      () => { const sr = R.pick([0.3, 0.5, 0.8, 1]); return { q: h`How many years of returns before an annual Sharpe of ${sr} has $t = 2$?`, a: (2 / sr) ** 2, tol: 0.05, sol: h`$T = (2/SR)^2 = ${fx((2 / sr) ** 2, 2)}$` }; },
      () => { const m = R.pick([20, 50, 100, 200]); return { q: h`Testing ${m} independent strategies at α = 5% when none work. Expected number of false discoveries?`, a: m * 0.05, sol: h`$${m}\times0.05 = ${m * 0.05}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-timeseries', title: 'Time series: stationarity & AR(1)', minutes: 15,
    summary: 'Autocorrelation, stationarity, the AR(1) model, its mean, variance and half-life, and random walks as the non-stationary limit.',
    sections: [
      h`<p>The <b>AR(1)</b> model $x_t = c + \phi x_{t-1} + \varepsilon_t$, $\varepsilon_t\sim N(0,\sigma^2)$, is the discrete Ornstein–Uhlenbeck process.</p>
      <ul><li><b>Stationary</b> iff $|\phi|<1$. Then mean $\mu = \frac{c}{1-\phi}$, variance $\frac{\sigma^2}{1-\phi^2}$, autocorrelation at lag $k$ equal to $\phi^k$.</li>
      <li>Half-life of a shock: $\frac{\ln 0.5}{\ln\phi}$.</li>
      <li>$\phi = 1$ is a <b>random walk</b>: variance grows without bound and shocks never die. Prices look like this; returns look like noise, and spreads between cointegrated assets look like stationary AR(1), which is the basis of pairs trading.</li>
      <li>Estimate $\phi$ by regressing $x_t$ on $x_{t-1}$. Test for a unit root with Dickey–Fuller.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Simulated AR(1) paths', height: 300,
        params: [{ id: 'phi', label: 'φ', min: -0.95, max: 1, step: 0.01, value: 0.9 }, { id: 'sig', label: 'σ', min: 0.1, max: 2, step: 0.05, value: 0.5 }],
        init(s) { s.seed = 9; },
        buttons: [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }],
        draw(g, p, s) {
          const N = 300; g.view(0, N, -10, 10).axes({ xlabel: 't' });
          for (let k = 0; k < 3; k++) { const r = R.seeded(s.seed + k), pts = []; let x = 0; for (let t = 0; t < N; t++) { x = p.phi * x + p.sig * r.normal(); pts.push([t, x]); } g.path(pts, { color: C.series[k], width: 1.3 }); }
          if (Math.abs(p.phi) < 1) { const sd = p.sig / Math.sqrt(1 - p.phi * p.phi); g.hline(2 * sd, { color: C.speed }); g.hline(-2 * sd, { color: C.speed }); }
        },
        info: p => Math.abs(p.phi) < 1 ? h`Stationary sd $= \sigma/\sqrt{1-\phi^2} = ${fx(p.sig / Math.sqrt(1 - p.phi * p.phi), 3)}$ (±2sd bands). ${p.phi > 0 ? h`Half-life $${fx(Math.log(0.5) / Math.log(p.phi), 2)}$ steps.` : 'Negative φ: the series zig-zags.'}` : 'φ = 1: a random walk. No bands, and the variance grows like t.',
      }) },
    ],
    formulas: [h`x_t = c + \phi x_{t-1} + \varepsilon_t`, h`\mu = \frac{c}{1-\phi},\ \ \operatorname{Var} = \frac{\sigma^2}{1-\phi^2}`, h`\rho(k) = \phi^k`, h`t_{1/2} = \frac{\ln 0.5}{\ln\phi}`],
    problems: [
      () => { const c = R.pick([0.5, 1, 2]), phi = R.pick([0.5, 0.8, 0.9]); return { q: h`AR(1): $x_t = ${c} + ${phi}x_{t-1} + \varepsilon_t$. Long-run mean?`, a: c / (1 - phi), tol: 1e-3, sol: h`$\frac{${c}}{1-${phi}} = ${fx(c / (1 - phi), 4)}$` }; },
      () => { const phi = R.pick([0.5, 0.7, 0.9]), s = R.pick([1, 0.5, 2]); return { q: h`AR(1) with $\phi = ${phi}$, $\sigma = ${s}$. Stationary variance?`, a: s * s / (1 - phi * phi), tol: 1e-3, sol: h`$\frac{${s}^2}{1-${phi}^2} = ${fx(s * s / (1 - phi * phi), 4)}$` }; },
      () => { const phi = R.pick([0.8, 0.9, 0.95, 0.99]); return { q: h`Half-life (in steps) of shocks in AR(1) with $\phi = ${phi}$?`, a: Math.log(0.5) / Math.log(phi), rtol: 1e-3, sol: h`$\ln 0.5/\ln ${phi} = ${fx(Math.log(0.5) / Math.log(phi), 3)}$` }; },
      () => { const phi = R.pick([0.6, 0.8]), k = R.int(2, 5); return { q: h`Autocorrelation at lag ${k} for AR(1) with $\phi = ${phi}$?`, a: Math.pow(phi, k), tol: 1e-4, sol: h`$${phi}^{${k}} = ${fx(Math.pow(phi, k), 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-garch', title: 'Volatility models: EWMA & GARCH(1,1)', minutes: 16,
    summary: 'Volatility clusters. EWMA and GARCH update variance from recent shocks; GARCH mean-reverts to a long-run level.',
    sections: [
      h`<p>Large returns tend to follow large returns: <b>volatility clustering</b>. Two classic filters:</p>
      <ul><li><b>EWMA</b> (RiskMetrics, $\lambda\approx0.94$): $\sigma_t^2 = \lambda\sigma_{t-1}^2 + (1-\lambda)r_{t-1}^2$.</li>
      <li><b>GARCH(1,1)</b>: $\sigma_t^2 = \omega + \alpha r_{t-1}^2 + \beta\sigma_{t-1}^2$, with $\alpha+\beta<1$. Long-run variance $V_L = \frac{\omega}{1-\alpha-\beta}$. Persistence $\alpha+\beta$ sets how fast shocks decay.</li></ul>
      <p>Forecast $k$ steps ahead: $E[\sigma_{t+k}^2] = V_L + (\alpha+\beta)^k(\sigma_t^2 - V_L)$. This produces a <b>term structure of volatility</b>. EWMA is GARCH with $\omega = 0$ and $\alpha+\beta = 1$ (no mean reversion). Parameters are fit by maximum likelihood.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Simulated GARCH(1,1): returns and conditional vol', height: 320,
        params: [{ id: 'a', label: 'α (reaction)', min: 0.01, max: 0.3, step: 0.005, value: 0.08 }, { id: 'b', label: 'β (memory)', min: 0.5, max: 0.98, step: 0.005, value: 0.9 }, { id: 'vl', label: 'long-run daily vol', min: 0.005, max: 0.03, step: 0.001, value: 0.01, fmt: v => MF.pct(v, 1) }],
        init(s) { s.seed = 12; },
        buttons: [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }],
        draw(g, p, s) {
          const N = 500, ab = Math.min(p.a + p.b, 0.999), om = p.vl * p.vl * (1 - ab), r = R.seeded(s.seed);
          let v = p.vl * p.vl; const rets = [], vols = [];
          for (let t = 0; t < N; t++) { const x = Math.sqrt(v) * r.normal(); rets.push([t, x]); vols.push([t, Math.sqrt(v)]); v = om + p.a * x * x + (ab - p.a) * v; }
          const mx = Math.max(...vols.map(q => q[1])) * 3.2;
          g.view(0, N, -mx, mx).axes({ fy: v => MF.pct(v, 1), xlabel: 'day' });
          const c = g.ctx; c.strokeStyle = C.alpha(C.fe, 0.7); c.lineWidth = 1; rets.forEach(([t, x]) => { c.beginPath(); c.moveTo(g.X(t), g.Y(0)); c.lineTo(g.X(t), g.Y(x)); c.stroke(); });
          g.path(vols.map(([t, v2]) => [t, 2 * v2]), { color: C.speed, width: 1.8 }); g.path(vols.map(([t, v2]) => [t, -2 * v2]), { color: C.speed, width: 1.8 });
        },
        info: p => { const ab = p.a + p.b; return ab >= 1 ? 'α + β ≥ 1: not covariance-stationary (an IGARCH/EWMA-like regime). Display capped at 0.999.' : h`Persistence $\alpha+\beta = ${fx(ab, 3)}$, shock half-life $${fx(Math.log(0.5) / Math.log(ab), 1)}$ days. Annualised long-run vol $= ${MF.pct(p.vl * Math.sqrt(252), 1)}$.`; },
      }) },
    ],
    formulas: [h`\sigma_t^2 = \lambda\sigma_{t-1}^2 + (1-\lambda)r_{t-1}^2`, h`\sigma_t^2 = \omega + \alpha r_{t-1}^2 + \beta\sigma_{t-1}^2`, h`V_L = \frac{\omega}{1-\alpha-\beta}`, h`E[\sigma^2_{t+k}] = V_L + (\alpha+\beta)^k(\sigma_t^2 - V_L)`],
    problems: [
      () => { const lam = 0.94, s0 = R.pick([0.01, 0.015, 0.02]), r0 = R.pick([0.03, -0.025, 0.005]); const v = lam * s0 * s0 + (1 - lam) * r0 * r0; return { q: h`EWMA ($\lambda = 0.94$): yesterday's vol ${s0}, yesterday's return ${r0}. Today's vol?`, a: Math.sqrt(v), tol: 1e-5, sol: h`$\sqrt{0.94\cdot${s0}^2 + 0.06\cdot${r0}^2} = ${fx(Math.sqrt(v), 5)}$` }; },
      () => { const om = R.pick([0.000002, 0.000001, 0.000005]), a = R.pick([0.05, 0.08, 0.1]), b = R.pick([0.88, 0.85, 0.86]); const vl = om / (1 - a - b); return { q: h`GARCH: $\omega = ${om}$, $\alpha = ${a}$, $\beta = ${b}$. Long-run daily vol (as a decimal)?`, a: Math.sqrt(vl), tol: 1e-5, sol: h`$\sqrt{\frac{${om}}{1-${a}-${b}}} = ${fx(Math.sqrt(vl), 5)}$` }; },
      () => { const vl = 0.0001, ab = R.pick([0.9, 0.95, 0.97]), v0 = R.pick([0.0004, 0.0002]), k = R.pick([5, 10, 20]); const f = vl + Math.pow(ab, k) * (v0 - vl); return { q: h`$V_L = 0.0001$, $\alpha+\beta = ${ab}$, current variance ${v0}. Expected variance in ${k} days?`, a: f, rtol: 2e-3, sol: h`$V_L + ${ab}^{${k}}(${v0} - V_L) = ${fx(f, 7)}$` }; },
    ],
  });
})();
