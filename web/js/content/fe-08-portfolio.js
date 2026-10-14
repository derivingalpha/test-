/* FE Math · Unit 8: portfolio theory */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;

  MF.unit('fe', 'fe-u8', 'Portfolio Theory', 'Diversification, the efficient frontier, the tangency portfolio and Sharpe ratio, CAPM and factor models, and the Kelly criterion.');

  MF.lesson({
    id: 'fe-portfolio', title: 'Portfolio risk & diversification', minutes: 15,
    summary: 'Portfolio variance depends on correlations. Diversification removes idiosyncratic risk but not systematic risk.',
    sections: [
      h`<p>For weights $\mathbf w$, returns with means $\boldsymbol\mu$ and covariance $\Sigma$: $\ \mu_p = \mathbf w^\top\boldsymbol\mu$, $\ \sigma_p^2 = \mathbf w^\top\Sigma\mathbf w$. For two assets:</p>
      $$\sigma_p^2 = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2w_1w_2\rho\sigma_1\sigma_2$$
      <p>Unless $\rho = 1$, $\sigma_p < w_1\sigma_1 + w_2\sigma_2$. That's the free lunch of diversification. With $\rho=-1$ a zero-risk portfolio exists.</p>
      <p>For $N$ equally weighted assets with average variance $\bar\sigma^2$ and average covariance $\bar c$:</p>
      $$\sigma_p^2 = \frac{\bar\sigma^2}{N} + \left(1-\frac1N\right)\bar c\ \xrightarrow{N\to\infty}\ \bar c$$
      <p>Idiosyncratic risk diversifies away; the covariance (market) risk remains.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Two-asset frontier as correlation changes', height: 320,
        params: [{ id: 'rho', label: 'correlation ρ', min: -1, max: 1, step: 0.01, value: 0.2 }, { id: 'w', label: 'weight in asset 1', min: -0.5, max: 1.5, step: 0.01, value: 0.5, fmt: v => MF.pct(v, 0) }],
        draw(g, p) {
          const m1 = 0.06, m2 = 0.12, s1 = 0.12, s2 = 0.25;
          const pt = w => [Math.sqrt(Math.max(0, w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * p.rho * s1 * s2)), w * m1 + (1 - w) * m2];
          g.view(0, 0.4, 0, 0.16).axes({ xlabel: 'σ', ylabel: 'μ', fx: v => MF.pct(v, 0), fy: v => MF.pct(v, 0) });
          [-1, 0, 1].forEach(r => { const pts = []; for (let w = -0.5; w <= 1.5; w += 0.01) { const sp = Math.sqrt(Math.max(0, w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * r * s1 * s2)); pts.push([sp, w * m1 + (1 - w) * m2]); } g.path(pts, { color: C.alpha(C.muted, 0.35), width: 1, dash: [3, 3] }); });
          const pts = []; for (let w = -0.5; w <= 1.5; w += 0.005) pts.push(pt(w)); g.path(pts, { color: C.fe, width: 2.5 });
          g.dot(s1, m1, { color: C.speed, r: 6 }); g.dot(s2, m2, { color: C.pink, r: 6 }); const q = pt(p.w); g.dot(q[0], q[1], { color: C.good, r: 6, ring: C.text });
        },
        info: p => { const s1 = 0.12, s2 = 0.25, wm = (s2 * s2 - p.rho * s1 * s2) / (s1 * s1 + s2 * s2 - 2 * p.rho * s1 * s2), sp = Math.sqrt(Math.max(0, p.w ** 2 * s1 * s1 + (1 - p.w) ** 2 * s2 * s2 + 2 * p.w * (1 - p.w) * p.rho * s1 * s2)); return h`Asset 1: μ=6%, σ=12% (orange); asset 2: μ=12%, σ=25% (pink). Portfolio σ = <b>${MF.pct(sp, 2)}</b>. Minimum-variance weight $w_1^* = \frac{\sigma_2^2 - \rho\sigma_1\sigma_2}{\sigma_1^2+\sigma_2^2-2\rho\sigma_1\sigma_2} = ${MF.pct(wm, 1)}$. Grey dashed lines: ρ = −1, 0, 1.`; },
      }) },
    ],
    formulas: [h`\mu_p = \mathbf w^\top\boldsymbol\mu,\ \ \sigma_p^2 = \mathbf w^\top\Sigma\mathbf w`, h`\sigma_p^2 = w_1^2\sigma_1^2 + w_2^2\sigma_2^2 + 2w_1w_2\rho\sigma_1\sigma_2`, h`w_1^{mv} = \frac{\sigma_2^2-\rho\sigma_1\sigma_2}{\sigma_1^2+\sigma_2^2-2\rho\sigma_1\sigma_2}`, h`\sigma_p^2 = \tfrac{\bar\sigma^2}{N} + (1-\tfrac1N)\bar c`],
    problems: [
      () => { const w = R.pick([0.3, 0.5, 0.6, 0.7]), s1 = R.pick([0.1, 0.15]), s2 = R.pick([0.2, 0.3]), rho = R.pick([-0.3, 0, 0.4, 0.8]); const v = w * w * s1 * s1 + (1 - w) ** 2 * s2 * s2 + 2 * w * (1 - w) * rho * s1 * s2; return { q: h`$w_1 = ${w}$, $\sigma_1 = ${s1}$, $\sigma_2 = ${s2}$, $\rho = ${rho}$. Portfolio volatility in %?`, a: 100 * Math.sqrt(v), tol: 0.01, unit: '%', sol: h`$\sigma_p = \sqrt{${fx(v, 5)}} = ${fx(100 * Math.sqrt(v), 3)}\%$` }; },
      () => { const s1 = R.pick([0.1, 0.2]), s2 = R.pick([0.15, 0.3]), rho = R.pick([-0.5, 0, 0.3]); const w = (s2 * s2 - rho * s1 * s2) / (s1 * s1 + s2 * s2 - 2 * rho * s1 * s2); return { q: h`$\sigma_1 = ${s1}$, $\sigma_2 = ${s2}$, $\rho = ${rho}$. Minimum-variance weight in asset 1?`, a: w, tol: 1e-3, sol: h`$${fx(w, 4)}$` }; },
      () => { const sv = R.pick([0.09, 0.16]), c = R.pick([0.01, 0.02, 0.03]), N = R.pick([10, 25, 100]); const v = sv / N + (1 - 1 / N) * c; return { q: h`${N} equal-weight stocks, average variance ${sv}, average covariance ${c}. Portfolio variance?`, a: v, tol: 1e-5, sol: h`$\frac{${sv}}{${N}} + (1-\frac1{${N}})${c} = ${fx(v, 5)}$` }; },
      () => { const s1 = R.pick([0.1, 0.2]), s2 = R.pick([0.3, 0.4]); return { q: h`With $\rho = -1$, $\sigma_1 = ${s1}$, $\sigma_2 = ${s2}$, what weight in asset 1 gives zero risk?`, a: s2 / (s1 + s2), tol: 1e-3, sol: h`$w_1 = \frac{\sigma_2}{\sigma_1+\sigma_2} = ${fx(s2 / (s1 + s2), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-frontier', title: 'Efficient frontier, tangency & Sharpe', minutes: 16,
    summary: 'Markowitz mean–variance optimisation. Adding a risk-free asset turns the frontier into the capital market line through the tangency portfolio.',
    sections: [
      h`<p><b>Markowitz problem:</b> minimise $\frac12\mathbf w^\top\Sigma\mathbf w$ subject to $\mathbf w^\top\boldsymbol\mu = m$, $\mathbf w^\top\mathbf 1 = 1$. Lagrange multipliers give the frontier as a hyperbola in $(\sigma,\mu)$ space. The upper half is <b>efficient</b>.</p>
      <ul><li>Global minimum variance: $\mathbf w_{mv} = \frac{\Sigma^{-1}\mathbf 1}{\mathbf 1^\top\Sigma^{-1}\mathbf 1}$.</li>
      <li>With a risk-free rate $r_f$, the best risky mix is the <b>tangency portfolio</b> $\mathbf w_T\propto\Sigma^{-1}(\boldsymbol\mu - r_f\mathbf 1)$, the portfolio with the highest Sharpe ratio $\frac{\mu-r_f}{\sigma}$.</li>
      <li><b>Two-fund separation:</b> every investor holds $r_f$ plus the tangency portfolio, in proportions set by risk aversion: $w^* = \frac{\mu_T - r_f}{\gamma\sigma_T^2}$. This line is the capital market line.</li></ul>
      <div class="callout warn"><b>In practice</b>Optimisers are "error maximisers": small errors in $\boldsymbol\mu$ produce wild weights. Practitioners shrink estimates (Ledoit–Wolf, Black–Litterman) or impose constraints.</div>`,
      { viz: host => MF.explore(host, {
        title: 'Three-asset frontier with random portfolios', height: 340,
        params: [{ id: 'rf', label: 'risk-free rate', min: 0, max: 0.06, step: 0.0025, value: 0.02, fmt: v => MF.pct(v, 2) }, { id: 'rho', label: 'common correlation', min: -0.3, max: 0.9, step: 0.05, value: 0.3 }],
        draw(g, p) {
          const mu = [0.05, 0.09, 0.14], sd = [0.1, 0.18, 0.3];
          const S = sd.map((a, i) => sd.map((b, j) => (i === j ? 1 : p.rho) * a * b));
          const inv = inv3(S); if (!inv) return;
          const one = [1, 1, 1], mv = mulv(inv, one), A = dot(one, mv), Bv = dot(mu, mv), Cc = dot(mu, mulv(inv, mu)), D = A * Cc - Bv * Bv;
          g.view(0, 0.4, 0, 0.2).axes({ xlabel: 'σ', ylabel: 'μ', fx: v => MF.pct(v, 0), fy: v => MF.pct(v, 0) });
          const r = R.seeded(5), c = g.ctx; c.fillStyle = C.alpha(C.muted, 0.35);
          for (let k = 0; k < 900; k++) { let w = [r(), r(), r()]; const s = M.sum(w); w = w.map(x => x / s); const m = dot(w, mu), v = dot(w, mulv(S, w)); c.fillRect(g.X(Math.sqrt(v)) - 1, g.Y(m) - 1, 2, 2); }
          const pts = []; for (let m = 0; m <= 0.2; m += 0.001) { const v = (A * m * m - 2 * Bv * m + Cc) / D; pts.push([Math.sqrt(v), m]); } g.path(pts, { color: C.fe, width: 2.5 });
          const ex = mu.map(x => x - p.rf), wt = mulv(inv, ex), st = M.sum(wt); const wT = wt.map(x => x / st), mT = dot(wT, mu), sT = Math.sqrt(dot(wT, mulv(S, wT)));
          if (st > 0) { g.line(0, p.rf, 0.4, p.rf + (mT - p.rf) / sT * 0.4, { color: C.speed, width: 2 }); g.dot(sT, mT, { color: C.speed, r: 6, ring: C.text }); }
          sd.forEach((s, i) => g.dot(s, mu[i], { color: C.pink, r: 5 }));
          g.dot(Math.sqrt(1 / A), Bv / A, { color: C.good, r: 5 });
        },
        info: p => { const mu = [0.05, 0.09, 0.14], sd = [0.1, 0.18, 0.3], S = sd.map((a, i) => sd.map((b, j) => (i === j ? 1 : p.rho) * a * b)), inv = inv3(S); if (!inv) return ''; const wt = mulv(inv, mu.map(x => x - p.rf)), st = M.sum(wt), wT = wt.map(x => x / st), mT = dot(wT, mu), sT = Math.sqrt(dot(wT, mulv(S, wT))); return st > 0 ? h`Tangency weights (${wT.map(x => MF.pct(x, 0)).join(', ')}), Sharpe $= ${fx((mT - p.rf) / sT, 3)}$. Green dot: global minimum variance. Grey dots: random long-only portfolios.` : 'Risk-free rate above the minimum-variance return: no tangency on the efficient branch.'; },
      }) },
    ],
    formulas: [h`\mathbf w_{mv} = \frac{\Sigma^{-1}\mathbf 1}{\mathbf 1^\top\Sigma^{-1}\mathbf 1}`, h`\mathbf w_T = \frac{\Sigma^{-1}(\boldsymbol\mu - r_f\mathbf 1)}{\mathbf 1^\top\Sigma^{-1}(\boldsymbol\mu - r_f\mathbf 1)}`, h`SR = \frac{\mu_p - r_f}{\sigma_p}`, h`SR_T^2 = (\boldsymbol\mu - r_f\mathbf 1)^\top\Sigma^{-1}(\boldsymbol\mu - r_f\mathbf 1)`],
    problems: [
      () => { const mu = R.pick([0.07, 0.08, 0.1]), rf = R.pick([0.01, 0.02, 0.03]), s = R.pick([0.12, 0.15, 0.2]); return { q: h`Return ${mu}, risk-free ${rf}, vol ${s}. Sharpe ratio?`, a: (mu - rf) / s, tol: 1e-3, sol: h`$\frac{${mu} - ${rf}}{${s}} = ${fx((mu - rf) / s, 4)}$` }; },
      () => { const e1 = R.pick([0.04, 0.06]), e2 = R.pick([0.05, 0.08]), s1 = R.pick([0.1, 0.15]), s2 = R.pick([0.2, 0.25]); const SR = Math.sqrt((e1 / s1) ** 2 + (e2 / s2) ** 2); return { q: h`Two uncorrelated assets: excess returns ${e1}, ${e2}; vols ${s1}, ${s2}. Max Sharpe ratio?`, a: SR, tol: 1e-3, sol: h`$\sqrt{SR_1^2+SR_2^2} = \sqrt{${fx(e1 / s1, 3)}^2 + ${fx(e2 / s2, 3)}^2} = ${fx(SR, 4)}$` }; },
      () => { const e1 = R.pick([0.04, 0.06]), e2 = R.pick([0.05, 0.08]), s1 = R.pick([0.1, 0.15]), s2 = R.pick([0.2, 0.25]); const a1 = e1 / (s1 * s1), a2 = e2 / (s2 * s2); return { q: h`Uncorrelated assets: excess returns ${e1}, ${e2}; vols ${s1}, ${s2}. Tangency weight in asset 1?`, a: a1 / (a1 + a2), tol: 1e-3, sol: h`$w\propto\Sigma^{-1}(\mu - r_f)$: $(${fx(a1, 3)}, ${fx(a2, 3)})$ normalised → $${fx(a1 / (a1 + a2), 4)}$` }; },
      () => { const e = R.pick([0.05, 0.06]), s = R.pick([0.15, 0.2]), g = R.pick([2, 3, 4]); return { q: h`Tangency portfolio: excess return ${e}, vol ${s}. Risk aversion γ = ${g}. Fraction in risky portfolio?`, a: e / (g * s * s), tol: 1e-3, sol: h`$\frac{${e}}{${g}\cdot${s}^2} = ${fx(e / (g * s * s), 4)}$` }; },
    ],
  });
  function inv3(A) { const [[a, b, c], [d, e, f], [g, hh, i]] = A; const D = a * (e * i - f * hh) - b * (d * i - f * g) + c * (d * hh - e * g); if (Math.abs(D) < 1e-14) return null; return [[(e * i - f * hh) / D, (c * hh - b * i) / D, (b * f - c * e) / D], [(f * g - d * i) / D, (a * i - c * g) / D, (c * d - a * f) / D], [(d * hh - e * g) / D, (b * g - a * hh) / D, (a * e - b * d) / D]]; }
  function mulv(A, v) { return A.map(r => r.reduce((s, x, j) => s + x * v[j], 0)); }
  function dot(a, b) { return a.reduce((s, x, i) => s + x * b[i], 0); }

  MF.lesson({
    id: 'fe-capm', title: 'CAPM & factor models', minutes: 15,
    summary: 'In equilibrium expected excess return is proportional to beta. Multi-factor models (Fama–French, APT) generalise this.',
    sections: [
      h`<p>If everyone holds the tangency portfolio, it must be the <b>market portfolio</b>, and every asset's expected return lies on the <b>security market line</b>:</p>
      $$E[R_i] - r_f = \beta_i\left(E[R_m] - r_f\right),\qquad \beta_i = \frac{\operatorname{Cov}(R_i,R_m)}{\operatorname{Var}R_m}$$
      <p>Total risk splits into systematic and idiosyncratic parts: $\sigma_i^2 = \beta_i^2\sigma_m^2 + \sigma_{\varepsilon}^2$. Only systematic risk is priced, because idiosyncratic risk can be diversified away.</p>
      <p><b>Factor models</b>: $R_i - r_f = \alpha_i + \sum_k\beta_{ik}F_k + \varepsilon_i$ with factors such as market, size (SMB), value (HML), momentum, quality. <b>APT</b>: no arbitrage implies expected returns are linear in factor betas. A nonzero $\alpha$ is mispricing (or a missing factor).</p>
      <p>Performance ratios: Treynor $\frac{\mu - r_f}{\beta}$, Jensen's alpha, information ratio $\frac{\alpha}{\sigma_\varepsilon}$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Security market line', height: 300,
        params: [{ id: 'rf', label: 'risk-free', min: 0, max: 0.06, step: 0.0025, value: 0.03, fmt: v => MF.pct(v, 2) }, { id: 'mrp', label: 'market risk premium', min: 0.01, max: 0.1, step: 0.0025, value: 0.06, fmt: v => MF.pct(v, 2) }, { id: 'b', label: 'stock beta', min: -0.5, max: 2.5, step: 0.05, value: 1.3 }, { id: 'obs', label: 'stock\'s observed mean return', min: 0, max: 0.25, step: 0.0025, value: 0.13, fmt: v => MF.pct(v, 2) }],
        draw(g, p) {
          g.view(-0.5, 2.5, -0.02, 0.25).axes({ xlabel: 'β', fy: v => MF.pct(v, 0) });
          g.fn(b => p.rf + b * p.mrp, { color: C.fe, width: 2.5 });
          g.dot(1, p.rf + p.mrp, { color: C.speed, r: 5 }); g.text('market', 1, p.rf + p.mrp, { dy: 14, color: C.speed, size: 11 });
          const fair = p.rf + p.b * p.mrp; g.line(p.b, fair, p.b, p.obs, { color: p.obs > fair ? C.good : C.bad, width: 2 });
          g.dot(p.b, p.obs, { color: p.obs > fair ? C.good : C.bad, r: 6 }); g.dot(p.b, fair, { color: C.fe, r: 4 });
        },
        info: p => { const fair = p.rf + p.b * p.mrp; return h`CAPM required return $= ${MF.pct(p.rf, 2)} + ${fx(p.b, 2)}\times${MF.pct(p.mrp, 2)} = ${MF.pct(fair, 2)}$. Jensen's alpha $= ${MF.pct(p.obs - fair, 2)}$ (${p.obs > fair ? 'above' : 'below'} the line).`; },
      }) },
    ],
    formulas: [h`E[R_i] = r_f + \beta_i(E[R_m] - r_f)`, h`\beta_i = \frac{\operatorname{Cov}(R_i,R_m)}{\sigma_m^2}`, h`\sigma_i^2 = \beta_i^2\sigma_m^2 + \sigma_\varepsilon^2`, h`\beta_p = \sum_i w_i\beta_i`, h`R_i - r_f = \alpha_i + \textstyle\sum_k \beta_{ik}F_k + \varepsilon_i`],
    problems: [
      () => { const rf = R.pick([0.02, 0.03, 0.04]), mrp = R.pick([0.05, 0.06]), b = R.pick([0.8, 1.2, 1.5, 0.5]); return { q: h`$r_f = ${rf}$, market premium ${mrp}, $\beta = ${b}$. CAPM expected return in %?`, a: 100 * (rf + b * mrp), tol: 0.005, unit: '%', sol: h`$${rf} + ${b}\cdot${mrp} = ${fx(100 * (rf + b * mrp), 3)}\%$` }; },
      () => { const c = R.pick([0.02, 0.03, 0.036]), sm = R.pick([0.15, 0.2]); return { q: h`$\operatorname{Cov}(R_i,R_m) = ${c}$, $\sigma_m = ${sm}$. Beta?`, a: c / (sm * sm), tol: 1e-3, sol: h`$\frac{${c}}{${sm}^2} = ${fx(c / (sm * sm), 4)}$` }; },
      () => { const b = R.pick([0.8, 1.2, 1.5]), sm = R.pick([0.15, 0.2]), st = R.pick([0.3, 0.35, 0.4]); const id = st * st - b * b * sm * sm; return { q: h`$\beta = ${b}$, $\sigma_m = ${sm}$, total vol ${st}. Idiosyncratic variance?`, a: id, tol: 1e-4, sol: h`$${st}^2 - ${b}^2\cdot${sm}^2 = ${fx(id, 5)}$` }; },
      () => { const ws = [0.5, 0.3, 0.2], bs = [R.pick([0.8, 1]), R.pick([1.2, 1.5]), R.pick([0.4, 2])]; return { q: h`Weights 0.5/0.3/0.2, betas ${bs.join('/')}. Portfolio beta?`, a: M.sum(ws.map((w, i) => w * bs[i])), tol: 1e-4, sol: 'Betas are linear in the weights.' }; },
    ],
  });

  MF.lesson({
    id: 'fe-kelly', title: 'Kelly criterion & log utility', minutes: 14,
    summary: 'Maximising expected log wealth gives the growth-optimal bet size. Over-betting destroys growth even with an edge.',
    sections: [
      h`<p>Repeated bets compound multiplicatively, so long-run wealth growth is governed by $E[\ln(1 + fX)]$, not $E[X]$. Maximising it gives the <b>Kelly fraction</b>:</p>
      <ul><li>Binary bet, win $b$ per unit with probability $p$, else lose the stake: $f^* = p - \frac{1-p}{b}$.</li>
      <li>Continuous (GBM, excess drift $\mu$, vol $\sigma$): $f^* = \frac{\mu}{\sigma^2}$, with growth rate $g(f) = r + f\mu - \frac12f^2\sigma^2$. This is Merton's portfolio with log utility ($\gamma = 1$).</li></ul>
      <p>The growth curve is a concave parabola. Betting $2f^*$ gives zero growth, and anything beyond that means certain ruin in the long run. Practitioners use "half Kelly" to trade some growth for much lower drawdowns and robustness to estimation error.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Growth rate vs leverage', height: 300,
        params: [{ id: 'mu', label: 'excess drift μ', min: 0.01, max: 0.15, step: 0.005, value: 0.06, fmt: v => MF.pct(v, 1) }, { id: 's', label: 'volatility σ', min: 0.05, max: 0.5, step: 0.01, value: 0.2, fmt: v => MF.pct(v, 0) }, { id: 'f', label: 'leverage f', min: 0, max: 6, step: 0.05, value: 1 }],
        draw(g, p) {
          const gr = f => f * p.mu - 0.5 * f * f * p.s * p.s, fs = p.mu / (p.s * p.s), top = gr(fs);
          g.view(0, Math.max(2.4 * fs, 1), -top * 1.5, top * 1.4).axes({ xlabel: 'f', ylabel: 'growth', fy: v => MF.pct(v, 1) });
          g.fn(gr, { color: C.fe, width: 2.5 }); g.vline(fs, { color: C.speed }); g.vline(2 * fs, { color: C.bad });
          g.dot(p.f, gr(p.f), { color: gr(p.f) >= 0 ? C.good : C.bad, r: 6 });
        },
        info: p => { const fs = p.mu / (p.s * p.s), gr = f => f * p.mu - 0.5 * f * f * p.s * p.s; return h`Kelly $f^* = \mu/\sigma^2 = ${fx(fs, 2)}$ with max growth ${MF.pct(gr(fs), 2)}/yr. At f = ${fx(p.f, 2)}: growth ${MF.pct(gr(p.f), 2)}/yr. Red line at $2f^*$: zero growth.`; },
      }) },
    ],
    formulas: [h`f^* = p - \frac{1-p}{b}`, h`f^* = \frac{\mu - r}{\sigma^2}`, h`g(f) = r + f(\mu - r) - \tfrac12 f^2\sigma^2`, h`g(f^*) = r + \frac{(\mu-r)^2}{2\sigma^2}`],
    problems: [
      () => { const p = R.pick([0.55, 0.6, 0.52]), b = R.pick([1, 2, 1.5]); const f = p - (1 - p) / b; return { q: h`Win probability ${p}, payoff ${b}:1. Kelly fraction?`, a: f, tol: 1e-3, sol: h`$${p} - \frac{${fx(1 - p, 2)}}{${b}} = ${fx(f, 4)}$` }; },
      () => { const mu = R.pick([0.04, 0.05, 0.08]), s = R.pick([0.15, 0.2, 0.25]); return { q: h`Excess drift ${mu}, vol ${s}. Kelly leverage?`, a: mu / (s * s), tol: 1e-3, sol: h`$\frac{${mu}}{${s}^2} = ${fx(mu / (s * s), 4)}$` }; },
      () => { const mu = R.pick([0.05, 0.06]), s = R.pick([0.2, 0.25]); return { q: h`Excess drift ${mu}, vol ${s}, $r = 0$. Growth rate (decimal) at full Kelly?`, a: mu * mu / (2 * s * s), tol: 1e-5, sol: h`$\frac{\mu^2}{2\sigma^2} = ${fx(mu * mu / (2 * s * s), 5)}$` }; },
      () => { const mu = R.pick([0.05, 0.06]), s = R.pick([0.2, 0.25]); return { q: h`Excess drift ${mu}, vol ${s}. At what leverage does long-run growth (with $r=0$) drop to zero?`, a: 2 * mu / (s * s), tol: 1e-3, sol: h`$2f^* = ${fx(2 * mu / (s * s), 4)}$` }; },
    ],
  });
})();
