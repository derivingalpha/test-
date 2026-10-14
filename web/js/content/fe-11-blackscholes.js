/* FE Math · Unit 11: Black–Scholes & the Greeks */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;

  MF.unit('fe', 'fe-u11', 'Black–Scholes & the Greeks', 'The PDE via delta hedging, the closed-form formula, sensitivities, implied volatility and the economics of hedging.');

  MF.lesson({
    id: 'fe-bspde', title: 'Deriving the Black–Scholes PDE', minutes: 18,
    summary: 'Hold the option, short Δ shares: the random terms cancel, the portfolio is riskless, so it must earn r. Out comes the PDE, with no μ in sight.',
    sections: [
      h`<p>Assume $dS = \mu S\,dt + \sigma S\,dW$ and let $V(t,S)$ be the option price. By Itô:</p>
      $$dV = \left(V_t + \mu SV_S + \tfrac12\sigma^2S^2V_{SS}\right)dt + \sigma SV_S\,dW$$
      <p>Form $\Pi = V - \Delta S$ with $\Delta = V_S$. Then</p>
      $$d\Pi = \left(V_t + \tfrac12\sigma^2S^2V_{SS}\right)dt$$
      <p>The $dW$ terms <b>cancel</b>: the portfolio is instantaneously riskless, so no arbitrage requires $d\Pi = r\Pi\,dt$. Rearranging gives the</p>
      $$\boxed{V_t + rSV_S + \tfrac12\sigma^2S^2V_{SS} - rV = 0}$$
      <p>with terminal condition $V(T,S) = $ payoff. The real-world drift $\mu$ has vanished: two investors who disagree about $\mu$ agree on the price. By Feynman–Kac, the solution is $V = e^{-r(T-t)}E^{\mathbb Q}[\text{payoff}]$ with $S$ growing at $r$.</p>
      <p>Change variables $x = \ln S$, $\tau = T - t$ and it reduces to the heat equation. Assumptions: constant $r,\sigma$; continuous trading; no frictions; lognormal prices.</p>`,
      { callout: 'key', html: h`Read the PDE as a P&L identity: $\Theta + \tfrac12\sigma^2S^2\Gamma = r(V - S\Delta)$. Time decay pays for gamma. A hedged long option loses theta every day and earns it back from the squared moves.` },
    ],
    formulas: [h`V_t + rSV_S + \tfrac12\sigma^2S^2V_{SS} - rV = 0`, h`\Pi = V - V_S\,S\ \Rightarrow\ d\Pi = r\Pi\,dt`, h`\Theta + rS\Delta + \tfrac12\sigma^2S^2\Gamma = rV`],
    problems: [
      () => ({ q: h`In the Black–Scholes PDE, which parameter does <b>not</b> appear?`, choices: [h`the stock's expected return $\mu$`, h`volatility $\sigma$`, h`the risk-free rate $r$`, 'the stock price S'], a: 0, sol: 'Delta hedging removes the dependence on μ.' }),
      () => { const S = 100, s = R.pick([0.2, 0.3]), G = R.pick([0.02, 0.03]), r = 0.05, V = R.pick([8, 10]), D = R.pick([0.5, 0.6]); const th = r * V - r * S * D - 0.5 * s * s * S * S * G; return { q: h`$S = 100$, $\sigma = ${s}$, $r = 5\%$, $V = ${V}$, $\Delta = ${D}$, $\Gamma = ${G}$. Theta (per year) implied by the PDE?`, a: th, tol: 0.005, sol: h`$\Theta = rV - rS\Delta - \tfrac12\sigma^2S^2\Gamma = ${fx(th, 4)}$` }; },
      () => ({ q: h`The hedge ratio that makes $V - \Delta S$ instantaneously riskless is…`, choices: [h`$\Delta = \partial V/\partial S$`, h`$\Delta = \partial^2V/\partial S^2$`, h`$\Delta = V/S$`, h`$\Delta = 1$`], a: 0, sol: 'The dW terms cancel exactly when Δ = V_S.' }),
    ],
  });

  MF.lesson({
    id: 'fe-bsformula', title: 'The Black–Scholes formula', minutes: 16,
    summary: 'C = S·Φ(d₁) − K·e^{−rT}·Φ(d₂). What d₁ and d₂ mean, and how price responds to every input.',
    sections: [
      h`<p>Solving the PDE (or computing $e^{-rT}E^{\mathbb Q}[(S_T-K)^+]$ with lognormal $S_T$):</p>
      $$C = S_0e^{-qT}\Phi(d_1) - Ke^{-rT}\Phi(d_2),\qquad P = Ke^{-rT}\Phi(-d_2) - S_0e^{-qT}\Phi(-d_1)$$
      $$d_{1,2} = \frac{\ln(S_0/K) + (r - q \pm\frac12\sigma^2)T}{\sigma\sqrt T},\qquad d_2 = d_1 - \sigma\sqrt T$$
      <p><b>Interpretation:</b> $\Phi(d_2) = \mathbb Q(S_T > K)$, the risk-neutral exercise probability. $S_0\Phi(d_1)$ is the value of receiving the stock if exercised (equivalently, $\Phi(d_1)$ is the exercise probability under the stock measure). $\Phi(d_1)$ is the delta.</p>
      <p>At the money, a handy approximation: $C\approx 0.4\,S_0\sigma\sqrt T$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Black–Scholes price vs spot', height: 320,
        params: [{ id: 'K', label: 'strike K', min: 50, max: 150, step: 1, value: 100 }, { id: 'T', label: 'maturity T', min: 0.01, max: 3, step: 0.01, value: 1 }, { id: 's', label: 'volatility σ', min: 0.05, max: 1, step: 0.01, value: 0.25, fmt: v => MF.pct(v, 0) }, { id: 'r', label: 'rate r', min: 0, max: 0.1, step: 0.0025, value: 0.04, fmt: v => MF.pct(v, 2) }, { id: 'type', label: 'type', type: 'select', value: 'call', options: [['call', 'call'], ['put', 'put']] }],
        draw(g, p) {
          g.view(40, 160, 0, 70).axes({ xlabel: 'S' });
          g.fn(S => Math.max(p.type === 'call' ? S - p.K : p.K - S, 0), { color: C.dim, dash: [5, 4], width: 1.5 });
          g.fn(S => M.bs(S, p.K, p.T, p.r, p.s, p.type), { color: C.fe, width: 3 });
          g.dot(100, M.bs(100, p.K, p.T, p.r, p.s, p.type), { color: C.speed, r: 6 });
        },
        info: p => { const d1 = M.bsD1(100, p.K, p.T, p.r, p.s), d2 = d1 - p.s * Math.sqrt(p.T), v = M.bs(100, p.K, p.T, p.r, p.s, p.type); return h`At $S = 100$: $d_1 = ${fx(d1, 4)}$, $d_2 = ${fx(d2, 4)}$, $\Phi(d_2) = ${fx(M.ncdf(d2), 4)}$. Price <b>${fx(v, 4)}</b> (time value ${fx(v - Math.max(p.type === 'call' ? 100 - p.K : p.K - 100, 0), 4)}).`; },
      }) },
    ],
    formulas: [h`C = S_0e^{-qT}\Phi(d_1) - Ke^{-rT}\Phi(d_2)`, h`P = Ke^{-rT}\Phi(-d_2) - S_0e^{-qT}\Phi(-d_1)`, h`d_1 = \frac{\ln(S_0/K) + (r-q+\frac12\sigma^2)T}{\sigma\sqrt T},\ d_2 = d_1 - \sigma\sqrt T`, h`C_{ATM}\approx 0.4\,S_0\sigma\sqrt T`],
    problems: [
      () => { const S = R.pick([90, 100, 110]), K = R.pick([95, 100, 105]), T = R.pick([0.5, 1, 2]), r = R.pick([0.02, 0.05]), s = R.pick([0.2, 0.3]); return { q: h`BS call: $S = ${S}$, $K = ${K}$, $T = ${T}$, $r = ${r}$, $\sigma = ${s}$. Price?`, a: M.bs(S, K, T, r, s), tol: 0.01, sol: h`$d_1 = ${fx(M.bsD1(S, K, T, r, s), 4)}$, $d_2 = ${fx(M.bsD1(S, K, T, r, s) - s * Math.sqrt(T), 4)}$ → $C = ${fx(M.bs(S, K, T, r, s), 4)}$` }; },
      () => { const S = 100, K = R.pick([90, 100, 110]), T = 1, r = 0.03, s = R.pick([0.2, 0.25]); return { q: h`BS put: $S = 100$, $K = ${K}$, $T = 1$, $r = 3\%$, $\sigma = ${s}$. Price?`, a: M.bs(S, K, T, r, s, 'put'), tol: 0.01, sol: h`$P = ${fx(M.bs(S, K, T, r, s, 'put'), 4)}$` }; },
      () => { const S = 100, K = R.pick([95, 100, 110]), T = R.pick([0.5, 1]), r = 0.04, s = 0.3; const d2 = M.bsD1(S, K, T, r, s) - s * Math.sqrt(T); return { q: h`$S = 100$, $K = ${K}$, $T = ${T}$, $r = 4\%$, $\sigma = 30\%$. Risk-neutral probability the call finishes in the money?`, a: M.ncdf(d2), tol: 0.002, sol: h`$\Phi(d_2) = \Phi(${fx(d2, 4)}) = ${fx(M.ncdf(d2), 4)}$` }; },
      () => { const S = R.pick([50, 100, 200]), s = R.pick([0.2, 0.3, 0.4]), T = R.pick([0.25, 1, 4]); return { q: h`Quick ATM estimate: $S = K = ${S}$, $\sigma = ${s}$, $T = ${T}$ (ignore rates). $0.4S\sigma\sqrt T$?`, a: 0.4 * S * s * Math.sqrt(T), tol: 0.01, sol: h`$0.4\cdot${S}\cdot${s}\cdot${Math.sqrt(T)} = ${fx(0.4 * S * s * Math.sqrt(T), 3)}$ (exact BS: ${fx(M.bs(S, S, T, 0, s), 3)})` }; },
    ],
  });

  MF.lesson({
    id: 'fe-greeks', title: 'The Greeks', minutes: 18,
    summary: 'Delta, gamma, vega, theta, rho: partial derivatives of the price. How they look across spot and time, and how traders use them.',
    sections: [
      h`<table><tr><th>Greek</th><th>Definition</th><th>Call (BS, no dividends)</th></tr>
      <tr><td>Delta Δ</td><td>$\partial V/\partial S$</td><td>$\Phi(d_1)$</td></tr>
      <tr><td>Gamma Γ</td><td>$\partial^2V/\partial S^2$</td><td>$\frac{\varphi(d_1)}{S\sigma\sqrt T}$ (same for puts)</td></tr>
      <tr><td>Vega ν</td><td>$\partial V/\partial\sigma$</td><td>$S\varphi(d_1)\sqrt T$ (same for puts)</td></tr>
      <tr><td>Theta Θ</td><td>$\partial V/\partial t$</td><td>$-\frac{S\varphi(d_1)\sigma}{2\sqrt T} - rKe^{-rT}\Phi(d_2)$</td></tr>
      <tr><td>Rho ρ</td><td>$\partial V/\partial r$</td><td>$KTe^{-rT}\Phi(d_2)$</td></tr></table>
      <p>Put delta $=\Phi(d_1) - 1$ by parity. Gamma and vega peak at the money; gamma explodes near expiry for ATM options. Second-order Greeks: <b>vanna</b> $\partial^2V/\partial S\partial\sigma$, <b>volga</b> $\partial^2V/\partial\sigma^2$, <b>charm</b> $\partial\Delta/\partial t$.</p>
      <p>Portfolio Greeks add linearly. Delta-neutral, gamma-neutral and vega-neutral books are built by solving small linear systems.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Greeks across spot', height: 320,
        params: [{ id: 'gk', label: 'Greek', type: 'select', value: 'gamma', options: [['delta', 'Delta'], ['gamma', 'Gamma'], ['vega', 'Vega'], ['theta', 'Theta'], ['rho', 'Rho']] }, { id: 'type', label: 'type', type: 'select', value: 'call', options: [['call', 'call'], ['put', 'put']] }, { id: 's', label: 'σ', min: 0.05, max: 0.8, step: 0.01, value: 0.25, fmt: v => MF.pct(v, 0) }],
        draw(g, p) {
          const Ts = [1, 0.25, 0.04], fns = Ts.map(T => S => M.greeks(S, 100, T, 0.03, p.s, p.type)[p.gk]);
          let lo = Infinity, hi = -Infinity; fns.forEach(f => { for (let S = 50; S <= 150; S += 1) { const v = f(S); if (Number.isFinite(v)) { lo = Math.min(lo, v); hi = Math.max(hi, v); } } });
          const pad = (hi - lo) * 0.1 || 0.1; g.view(50, 150, Math.min(lo - pad, 0), hi + pad).axes({ xlabel: 'S (K = 100)' });
          fns.forEach((f, i) => g.fn(f, { color: [C.fe, C.speed, C.pink][i], width: 2.5, from: 50.5 }));
          g.legend(Ts.map((T, i) => [`T = ${T < 0.1 ? '2 weeks' : T === 0.25 ? '3 months' : '1 year'}`, [C.fe, C.speed, C.pink][i]]), { x: g.W - 130 });
        },
        info: p => { const G = M.greeks(100, 100, 1, 0.03, p.s, p.type); return h`ATM 1-year ${p.type}: Δ = ${fx(G.delta, 4)}, Γ = ${fx(G.gamma, 5)}, vega = ${fx(G.vega, 3)} (per 1.00 of σ, so ${fx(G.vega / 100, 4)} per vol point), Θ = ${fx(G.theta, 3)}/yr (${fx(G.theta / 365, 4)}/day), ρ = ${fx(G.rho, 3)}.`; },
      }) },
    ],
    formulas: [h`\Delta_C = \Phi(d_1),\ \Delta_P = \Phi(d_1) - 1`, h`\Gamma = \frac{\varphi(d_1)}{S\sigma\sqrt T}`, h`\nu = S\varphi(d_1)\sqrt T`, h`\Theta_C = -\frac{S\varphi(d_1)\sigma}{2\sqrt T} - rKe^{-rT}\Phi(d_2)`, h`\rho_C = KTe^{-rT}\Phi(d_2)`],
    problems: [
      () => { const S = R.pick([90, 100, 110]), T = R.pick([0.5, 1]), s = R.pick([0.2, 0.3]); return { q: h`BS call delta: $S = ${S}$, $K = 100$, $T = ${T}$, $r = 3\%$, $\sigma = ${s}$?`, a: M.greeks(S, 100, T, 0.03, s).delta, tol: 0.002, sol: h`$\Phi(d_1) = \Phi(${fx(M.bsD1(S, 100, T, 0.03, s), 4)}) = ${fx(M.greeks(S, 100, T, 0.03, s).delta, 4)}$` }; },
      () => { const S = 100, T = R.pick([0.25, 1]), s = R.pick([0.2, 0.3]); return { q: h`BS gamma: $S = K = 100$, $T = ${T}$, $r = 3\%$, $\sigma = ${s}$?`, a: M.greeks(S, 100, T, 0.03, s).gamma, tol: 2e-4, sol: h`$\frac{\varphi(d_1)}{S\sigma\sqrt T} = ${fx(M.greeks(S, 100, T, 0.03, s).gamma, 5)}$` }; },
      () => { const S = 100, T = R.pick([0.5, 1, 2]), s = 0.25; const v = M.greeks(S, 100, T, 0.03, s).vega / 100; return { q: h`ATM option, $T = ${T}$, $\sigma = 25\%$, $r = 3\%$. Price change for +1 vol point (vega/100)?`, a: v, tol: 0.002, sol: h`$S\varphi(d_1)\sqrt T/100 = ${fx(v, 4)}$` }; },
      () => { const nC = R.pick([10, 20]), dC = R.pick([0.4, 0.55, 0.6]); return { q: h`You are long ${nC} calls (×100 shares each) with delta ${dC}. Shares to short for delta neutrality?`, a: nC * 100 * dC, sol: h`$${nC}\times100\times${dC} = ${nC * 100 * dC}$` }; },
      () => { const g1 = R.pick([0.02, 0.03]), g2 = R.pick([0.04, 0.05]), n = R.pick([100, 200]); return { q: h`Book gamma is $-${fx(n * g1, 2)}$. Option B has gamma ${g2}. How many B to buy to be gamma neutral?`, a: n * g1 / g2, tol: 0.01, sol: h`$${fx(n * g1, 2)}/${g2} = ${fx(n * g1 / g2, 3)}$ (then re-hedge delta with stock)` }; },
    ],
  });

  MF.lesson({
    id: 'fe-impliedvol', title: 'Implied volatility & the smile', minutes: 16,
    summary: 'Invert Black–Scholes for σ with Newton\'s method (vega is the derivative). Real markets show smiles and skews.',
    sections: [
      h`<p>Given a market price $C^{mkt}$, the <b>implied volatility</b> solves $C_{BS}(\sigma_{imp}) = C^{mkt}$. Since $\partial C/\partial\sigma = \nu > 0$, the solution is unique, and Newton's method converges fast:</p>
      $$\sigma_{n+1} = \sigma_n - \frac{C_{BS}(\sigma_n) - C^{mkt}}{\nu(\sigma_n)}$$
      <p>Good starting guess (Brenner–Subrahmanyam): $\sigma_0\approx\sqrt{2\pi/T}\,C/S$.</p>
      <p>If Black–Scholes were right, implied vol would be flat across strikes. Markets instead show a <b>smile</b> (FX) or <b>skew</b> (equities, where downside puts are pricier because of crash fear and leverage effects). The <b>implied volatility surface</b> $\sigma(K,T)$ is the market's language for option prices. Stochastic volatility (Heston), jumps and local volatility (Dupire) are attempts to explain it.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Newton iterations for implied vol', height: 300,
        params: [{ id: 'C', label: 'market call price', min: 1, max: 30, step: 0.1, value: 12 }, { id: 'g0', label: 'initial guess σ₀', min: 0.05, max: 1.5, step: 0.01, value: 0.8, fmt: v => MF.pct(v, 0) }],
        draw(g, p) {
          const f = s => M.bs(100, 100, 1, 0.03, s) - p.C;
          g.view(0, 1.6, -15, 45).axes({ xlabel: 'σ', fx: v => MF.pct(v, 0) });
          g.fn(f, { color: C.fe, width: 2.5, from: 0.01 });
          let s = p.g0; for (let i = 0; i < 6; i++) { const v = f(s), vg = M.greeks(100, 100, 1, 0.03, s).vega; const s2 = s - v / vg; g.dot(s, v, { color: C.speed, r: 4 }); g.line(s, v, s2, 0, { color: C.alpha(C.speed, 0.7), width: 1.2 }); g.line(s2, 0, s2, f(s2), { color: C.alpha(C.muted, 0.5), width: 1, dash: [2, 3] }); s = Math.max(0.005, s2); }
          g.dot(s, 0, { color: C.good, r: 6 });
        },
        info: p => { let s = p.g0; const it = []; for (let i = 0; i < 6; i++) { s = Math.max(0.005, s - (M.bs(100, 100, 1, 0.03, s) - p.C) / M.greeks(100, 100, 1, 0.03, s).vega); it.push(MF.pct(s, 3)); } return `ATM, T = 1, r = 3%. Iterates: ${it.join(' → ')}. Converged σ_imp = <b>${MF.pct(M.impliedVol(p.C, 100, 100, 1, 0.03), 3)}</b>.`; },
      }) },
      { viz: host => MF.explore(host, {
        title: 'A stylised equity skew', height: 240,
        params: [{ id: 'atm', label: 'ATM vol', min: 0.1, max: 0.5, step: 0.01, value: 0.2, fmt: v => MF.pct(v, 0) }, { id: 'skew', label: 'skew', min: -0.6, max: 0.2, step: 0.01, value: -0.25 }, { id: 'curv', label: 'curvature', min: 0, max: 1, step: 0.01, value: 0.3 }],
        draw(g, p) {
          const iv = k => Math.max(0.02, p.atm + p.skew * k + p.curv * k * k);
          g.view(-0.5, 0.5, 0, 0.6).axes({ xlabel: 'log-moneyness ln(K/F)', fy: v => MF.pct(v, 0) });
          g.fn(iv, { color: C.pink, width: 3 }); g.hline(p.atm, { color: C.dim });
        },
        info: () => 'Left = low strikes (downside puts), which are richer in equity markets.',
      }) },
    ],
    formulas: [h`C_{BS}(\sigma_{imp}) = C^{mkt}`, h`\sigma_{n+1} = \sigma_n - \frac{C_{BS}(\sigma_n) - C^{mkt}}{\nu(\sigma_n)}`, h`\sigma_0\approx\sqrt{\tfrac{2\pi}{T}}\,\frac{C}{S}`],
    problems: [
      () => { const s = R.pick([0.15, 0.2, 0.3, 0.45]), T = R.pick([0.5, 1]); const C0 = M.round(M.bs(100, 100, T, 0.02, s), 3); return { q: h`ATM call ($S = K = 100$, $T = ${T}$, $r = 2\%$) trades at ${C0}. Implied vol in %?`, a: 100 * M.impliedVol(C0, 100, 100, T, 0.02), tol: 0.05, unit: '%', sol: h`Newton on $C_{BS}(\sigma) = ${C0}$ → $${fx(100 * M.impliedVol(C0, 100, 100, T, 0.02), 3)}\%$` }; },
      () => { const C0 = R.pick([4, 8, 10]), T = R.pick([0.25, 1]); return { q: h`Brenner–Subrahmanyam: ATM call price ${C0}, $S = 100$, $T = ${T}$. Approximate σ in %?`, a: 100 * Math.sqrt(2 * Math.PI / T) * C0 / 100, tol: 0.05, unit: '%', sol: h`$\sqrt{2\pi/${T}}\cdot${C0}/100 = ${fx(100 * Math.sqrt(2 * Math.PI / T) * C0 / 100, 3)}\%$` }; },
      () => { const s0 = 0.3, T = 1, mkt = M.round(M.bs(100, 100, 1, 0, 0.2), 4); const s1 = s0 - (M.bs(100, 100, 1, 0, s0) - mkt) / M.greeks(100, 100, 1, 0, s0).vega; return { q: h`One Newton step from $\sigma_0 = 0.30$ for an ATM call ($S=K=100$, $T=1$, $r=0$) priced ${mkt}. $\sigma_1$?`, a: s1, tol: 5e-4, sol: h`$\sigma_1 = 0.3 - \frac{${fx(M.bs(100, 100, 1, 0, s0), 4)} - ${mkt}}{${fx(M.greeks(100, 100, 1, 0, s0).vega, 4)}} = ${fx(s1, 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-hedging', title: 'Delta hedging P&L: gamma vs theta', minutes: 16,
    summary: 'A delta-hedged option earns ½Γ S²(σ²_realised − σ²_implied)dt. Simulate discrete hedging and see the replication error.',
    sections: [
      h`<p>Sell an option at implied vol $\sigma_i$, delta-hedge at $\sigma_i$, while the stock actually moves with realised vol $\sigma_r$. Over $dt$ the hedged P&L is</p>
      $$d\text{P\&L} \approx \tfrac12\Gamma S^2\left(\sigma_i^2 - \sigma_r^2\right)dt\quad\text{(for the option seller)}$$
      <p>So option trading is <b>volatility trading</b>. Long gamma profits when realised exceeds implied, and pays theta when it doesn't. The P&L is path-dependent: it accrues where gamma is large, near the strike and near expiry.</p>
      <p>With <b>discrete</b> rebalancing, $N$ times in total, the hedging error has standard deviation $\approx\sqrt{\frac{\pi}{4N}}\,\nu\,\sigma$ (Derman–Kamal). It shrinks like $1/\sqrt N$, but transaction costs grow with $N$, and that trade-off is real.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Monte Carlo of a short call, delta-hedged discretely', height: 320,
        params: [{ id: 'N', label: 'rebalances', min: 4, max: 252, step: 1, value: 21, fmt: v => v }, { id: 'si', label: 'implied (sold at)', min: 0.1, max: 0.5, step: 0.01, value: 0.2, fmt: v => MF.pct(v, 0) }, { id: 'sr', label: 'realised', min: 0.05, max: 0.6, step: 0.01, value: 0.2, fmt: v => MF.pct(v, 0) }],
        init(s) { s.seed = 71; }, buttons: [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }],
        draw(g, p, s) {
          const S0 = 100, K = 100, T = 0.25, r = 0, n = 400, pnl = [], rnd = R.seeded(s.seed), dt = T / p.N;
          for (let k = 0; k < n; k++) {
            let S = S0, cash = M.bs(S, K, T, r, p.si), d = M.greeks(S, K, T, r, p.si).delta; cash -= d * S;
            for (let i = 1; i <= p.N; i++) { S *= Math.exp(-0.5 * p.sr * p.sr * dt + p.sr * Math.sqrt(dt) * rnd.normal()); const tl = T - i * dt; if (i < p.N) { const nd = M.greeks(S, K, tl, r, p.si).delta; cash -= (nd - d) * S; d = nd; } }
            pnl.push(cash + d * S - Math.max(S - K, 0));
          }
          const mu = M.mean(pnl), sd = M.std(pnl), w = Math.max(4 * sd, 1, Math.abs(mu) * 1.5);
          g.view(mu - w, mu + w, 0, 1).axes({ xlabel: 'hedged P&L (short call)' });
          const k = 40, cnt = new Array(k).fill(0), lo = mu - w, bw = 2 * w / k; pnl.forEach(x => { const i = Math.floor((x - lo) / bw); if (i >= 0 && i < k) cnt[i]++; });
          const mx = Math.max(...cnt); cnt.forEach((c, i) => g.rect(lo + i * bw, 0, bw, 0.9 * c / mx, { fill: C.alpha(C.fe, 0.5), color: C.fe, width: 1 }));
          g.vline(0, { color: C.text }); g.vline(mu, { color: C.speed, dash: [] });
          s.mu = mu; s.sd = sd;
        },
        info: (p, s) => { const vg = M.greeks(100, 100, 0.25, 0, p.si).vega; return h`Mean P&L ${fx(s.mu, 3)}, std ${fx(s.sd, 3)}. Derman–Kamal predicts std $\approx\sqrt{\pi/4N}\,\nu\sigma = ${fx(Math.sqrt(Math.PI / (4 * p.N)) * vg * p.sr, 3)}$. Set realised > implied and the seller loses on average.`; },
      }) },
    ],
    formulas: [h`d\Pi \approx \tfrac12\Gamma S^2(\sigma_i^2 - \sigma_r^2)\,dt`, h`\Theta \approx -\tfrac12\sigma^2S^2\Gamma\ (r=0)`, h`\operatorname{sd}(\text{hedge error})\approx\sqrt{\tfrac{\pi}{4N}}\,\nu\,\sigma`],
    problems: [
      () => { const G = R.pick([0.02, 0.04]), S = 100, si = R.pick([0.2, 0.25]), sr = R.pick([0.15, 0.3]), dt = 1 / 252; const v = 0.5 * G * S * S * (sr * sr - si * si) * dt; return { q: h`Long gamma ${G}, $S = 100$, implied ${si}, realised ${sr}. Expected daily hedged P&L (dt = 1/252)?`, a: v, tol: 5e-4, sol: h`$\tfrac12\Gamma S^2(\sigma_r^2 - \sigma_i^2)dt = ${fx(v, 5)}$` }; },
      () => { const N = R.pick([4, 16, 64]); return { q: h`Rebalancing ${N}× instead of once cuts the hedging-error std by what factor?`, a: Math.sqrt(N), tol: 1e-6, sol: h`$\propto 1/\sqrt N$ → $\sqrt{${N}} = ${Math.sqrt(N)}$` }; },
      () => ({ q: h`You are delta-hedged long an option. Realised vol turns out lower than the implied vol you paid. Your P&L is…`, choices: ['negative on average', 'positive on average', 'zero', 'unrelated to volatility'], a: 0, sol: 'Theta paid exceeds gamma earned.' }),
    ],
  });
})();
