/* FE Math · Unit 13: advanced models */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;
  const reseed = [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }];

  /** Vasicek zero-coupon bond price */
  const vasicek = (r0, k, th, s, T) => { const B = (1 - Math.exp(-k * T)) / k, lnA = (th - s * s / (2 * k * k)) * (B - T) - s * s * B * B / (4 * k); return Math.exp(lnA - B * r0); };
  /** CIR zero-coupon bond price */
  const cir = (r0, k, th, s, T) => { const g = Math.sqrt(k * k + 2 * s * s), e = Math.exp(g * T) - 1, den = (g + k) * e + 2 * g; const A = Math.pow(2 * g * Math.exp((k + g) * T / 2) / den, 2 * k * th / (s * s)), B = 2 * e / den; return A * Math.exp(-B * r0); };
  const black76 = (F, K, T, s, D, type = 'call') => { const d1 = (Math.log(F / K) + 0.5 * s * s * T) / (s * Math.sqrt(T)), d2 = d1 - s * Math.sqrt(T); return type === 'call' ? D * (F * M.ncdf(d1) - K * M.ncdf(d2)) : D * (K * M.ncdf(-d2) - F * M.ncdf(-d1)); };
  const merton = (S, K, T, r, s, lam, muJ, sJ, nmax = 40) => { const k = Math.exp(muJ + 0.5 * sJ * sJ) - 1, lp = lam * (1 + k); let v = 0; for (let n = 0; n < nmax; n++) { const sn = Math.sqrt(s * s + n * sJ * sJ / T), rn = r - lam * k + n * Math.log(1 + k) / T; v += M.poissonPmf(lp * T, n) * M.bs(S, K, T, rn, sn); } return v; };
  MF.models = { vasicek, cir, black76, merton };

  MF.unit('fe', 'fe-u13', 'Advanced Models', 'Short-rate and market models, Black-76, stochastic volatility, jumps, exotic options, risk measures, credit and copulas.');

  MF.lesson({
    id: 'fe-shortrate', title: 'Short-rate models: Vasicek & CIR', minutes: 18,
    summary: 'Model the instantaneous rate as a mean-reverting SDE; zero-coupon bonds come out as exponential-affine functions of r.',
    sections: [
      h`<p>A short-rate model specifies $dr = a(r)\,dt + b(r)\,dW^{\mathbb Q}$. Bond prices are $P(t,T) = E^{\mathbb Q}\left[e^{-\int_t^Tr\,ds}\mid\mathcal F_t\right]$, which solve the PDE $P_t + aP_r + \tfrac12b^2P_{rr} - rP = 0$.</p>
      <ul><li><b>Vasicek:</b> $dr = \kappa(\theta - r)dt + \sigma\,dW$. Gaussian and tractable, but rates can go negative.</li>
      <li><b>CIR:</b> $dr = \kappa(\theta - r)dt + \sigma\sqrt r\,dW$. Rates stay positive if $2\kappa\theta\ge\sigma^2$ (the Feller condition).</li>
      <li><b>Hull–White:</b> Vasicek with time-dependent $\theta(t)$, chosen to fit today's curve exactly.</li></ul>
      <p>Both are <b>affine</b>: $P(t,T) = A(\tau)e^{-B(\tau)r_t}$. For Vasicek $B(\tau) = \frac{1 - e^{-\kappa\tau}}{\kappa}$. The yield $-\ln P/\tau$ is then a linear function of $r$, so one factor drives the whole curve.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Model-implied yield curves', height: 300,
        params: [{ id: 'r0', label: 'current short rate r₀', min: 0, max: 0.1, step: 0.0025, value: 0.02, fmt: v => MF.pct(v, 2) }, { id: 'k', label: 'κ', min: 0.05, max: 2, step: 0.05, value: 0.4 }, { id: 'th', label: 'θ', min: 0.01, max: 0.1, step: 0.0025, value: 0.05, fmt: v => MF.pct(v, 2) }, { id: 's', label: 'σ', min: 0.002, max: 0.05, step: 0.001, value: 0.015, fmt: v => MF.pct(v, 1) }],
        draw(g, p) {
          g.view(0, 30, 0, 0.1).axes({ xlabel: 'maturity', fy: v => MF.pct(v, 0) });
          g.fn(T => -Math.log(vasicek(p.r0, p.k, p.th, p.s, T)) / T, { color: C.fe, width: 2.5, from: 0.05 });
          const sc = p.s / Math.sqrt(Math.max(p.th, 1e-4)); g.fn(T => -Math.log(cir(p.r0, p.k, p.th, sc, T)) / T, { color: C.speed, width: 2.5, dash: [6, 4], from: 0.05 });
          g.hline(p.th, { color: C.dim });
          g.legend([['Vasicek', C.fe], ['CIR (same local vol at θ)', C.speed]], { x: g.W - 200 });
        },
        info: p => h`Long-end Vasicek yield $\to\theta - \frac{\sigma^2}{2\kappa^2} = ${MF.pct(p.th - p.s * p.s / (2 * p.k * p.k), 2)}$: the convexity effect pulls long yields below θ. 10y zero price (Vasicek): ${fx(vasicek(p.r0, p.k, p.th, p.s, 10), 5)}.`,
      }) },
    ],
    formulas: [h`dr = \kappa(\theta - r)dt + \sigma\,dW`, h`dr = \kappa(\theta - r)dt + \sigma\sqrt r\,dW`, h`P(t,T) = A(\tau)e^{-B(\tau)r_t},\ B(\tau) = \frac{1-e^{-\kappa\tau}}{\kappa}`, h`2\kappa\theta\ge\sigma^2\ \text{(Feller)}`],
    problems: [
      () => { const k = R.pick([0.2, 0.5, 1]), T = R.pick([1, 5, 10]); return { q: h`Vasicek $B(\tau) = (1-e^{-\kappa\tau})/\kappa$ with $\kappa = ${k}$, $\tau = ${T}$?`, a: (1 - Math.exp(-k * T)) / k, tol: 1e-4, sol: h`$${fx((1 - Math.exp(-k * T)) / k, 5)}$` }; },
      () => { const r0 = R.pick([0.02, 0.03]), k = R.pick([0.3, 0.5]), th = 0.05, s = 0.01, T = R.pick([2, 5]); return { q: h`Vasicek: $r_0 = ${r0}$, $\kappa = ${k}$, $\theta = 0.05$, $\sigma = 0.01$. Zero-coupon bond price for $T = ${T}$?`, a: vasicek(r0, k, th, s, T), tol: 1e-4, sol: h`$A(\tau)e^{-B(\tau)r_0} = ${fx(vasicek(r0, k, th, s, T), 5)}$` }; },
      () => { const k = R.pick([0.2, 0.5, 1]), th = R.pick([0.03, 0.05]), s = R.pick([0.05, 0.1, 0.2]); const ok = 2 * k * th >= s * s; return { q: h`CIR with $\kappa = ${k}$, $\theta = ${th}$, $\sigma = ${s}$: does the Feller condition hold?`, choices: ['Yes', 'No'], a: ok ? 0 : 1, sol: h`$2\kappa\theta = ${fx(2 * k * th, 4)}$ vs $\sigma^2 = ${fx(s * s, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-black76', title: 'Black-76, caps & the LIBOR market model', minutes: 16,
    summary: 'Price options on forwards with Black\'s formula under the forward measure. Caps are strips of caplets, and the LMM makes each forward lognormal.',
    sections: [
      h`<p>Under the <b>$T$-forward measure</b> (numeraire = the zero bond $P(t,T)$), any forward price $F$ for time $T$ is a martingale. If it's lognormal with vol $\sigma$:</p>
      $$C = P(0,T)\left[F\Phi(d_1) - K\Phi(d_2)\right],\quad d_{1,2} = \frac{\ln(F/K)\pm\frac12\sigma^2T}{\sigma\sqrt T}$$
      <p><b>Caplet</b> on the rate $L$ for $[T, T+\delta]$: payoff $\delta(L-K)^+$ paid at $T+\delta$, so its price is $\delta P(0,T+\delta)\,\text{Black}(F, K, \sigma, T)$. A <b>cap</b> is a sum of caplets, a <b>floor</b> a sum of floorlets, and cap − floor = swap. <b>Swaptions</b> use Black with the swap rate under the annuity measure.</p>
      <p>The <b>LIBOR/forward market model</b> makes each forward rate lognormal under its own measure, $dF_i = \sigma_iF_i\,dW_i^{(i+1)}$, which reproduces Black's caplet formula exactly. <b>HJM</b> instead models the whole forward curve, $df(t,T) = \alpha\,dt + \sigma(t,T)dW$, where no arbitrage forces $\alpha = \sigma(t,T)\int_t^T\sigma(t,u)du$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Caplet price vs strike', height: 280,
        params: [{ id: 'F', label: 'forward rate F', min: 0.005, max: 0.08, step: 0.0025, value: 0.03, fmt: v => MF.pct(v, 2) }, { id: 's', label: 'Black vol', min: 0.05, max: 1, step: 0.01, value: 0.3, fmt: v => MF.pct(v, 0) }, { id: 'T', label: 'fixing T', min: 0.25, max: 10, step: 0.25, value: 2 }],
        draw(g, p) {
          const D = Math.exp(-p.F * (p.T + 0.5)), d = 0.5, cap = K => 1e4 * d * black76(p.F, K, p.T, p.s, D);
          g.view(0.0025, 0.08, 0, cap(0.0025) * 1.1).axes({ xlabel: 'strike', ylabel: 'bp of notional', fx: v => MF.pct(v, 0) });
          g.fn(K => 1e4 * d * D * Math.max(p.F - K, 0), { color: C.dim, dash: [5, 4] }); g.fn(cap, { color: C.fe, width: 2.5, from: 0.003 }); g.vline(p.F, { color: C.speed });
        },
        info: p => { const D = Math.exp(-p.F * (p.T + 0.5)); return h`6-month caplet struck ATM: ${fx(1e4 * 0.5 * black76(p.F, p.F, p.T, p.s, D), 3)} bp of notional (discount factor ${fx(D, 4)}).`; },
      }) },
    ],
    formulas: [h`C = P(0,T)\left[F\Phi(d_1) - K\Phi(d_2)\right]`, h`\text{Caplet} = \delta\,P(0,T+\delta)\,\text{Black}(F,K,\sigma,T)`, h`\text{Cap} - \text{Floor} = \text{Swap}`, h`\alpha(t,T) = \sigma(t,T)\textstyle\int_t^T\sigma(t,u)\,du\ \text{(HJM)}`],
    problems: [
      () => { const F = R.pick([95, 100, 105]), K = 100, T = R.pick([0.5, 1]), s = R.pick([0.2, 0.3]), D = R.pick([0.97, 0.98]); return { q: h`Black-76 call on a futures price: $F = ${F}$, $K = 100$, $T = ${T}$, $\sigma = ${s}$, discount factor ${D}. Price?`, a: black76(F, K, T, s, D), tol: 0.005, sol: h`$${D}[F\Phi(d_1) - K\Phi(d_2)] = ${fx(black76(F, K, T, s, D), 4)}$` }; },
      () => { const F = R.pick([0.03, 0.04]), K = R.pick([0.03, 0.035]), s = 0.25, T = 1, D = R.pick([0.95, 0.96]), N = 1e6; const v = N * 0.5 * black76(F, K, T, s, D); return { q: h`Caplet, notional 1,000,000, $\delta = 0.5$, $F = ${F}$, $K = ${K}$, $\sigma = 25\%$, $T = 1$, $P(0, 1.5) = ${D}$. Price?`, a: v, tol: 1, sol: h`$N\delta D\,[F\Phi(d_1) - K\Phi(d_2)] = ${fx(v, 2)}$` }; },
      () => { const c = R.pick([500, 800]), f = R.pick([300, 200]); return { q: h`Cap (strike K) = ${c}, floor (same K and dates) = ${f}. Value of the payer swap at fixed rate K?`, a: c - f, sol: 'Cap − Floor = payer swap.' }; },
    ],
  });

  MF.lesson({
    id: 'fe-stochvol', title: 'Stochastic volatility: Heston', minutes: 16,
    summary: 'Let variance follow its own mean-reverting process, correlated with the stock. Negative correlation generates the equity skew.',
    sections: [
      h`<p>The <b>Heston</b> model:</p>
      $$dS = rS\,dt + \sqrt{v}\,S\,dW^1,\qquad dv = \kappa(\theta - v)dt + \xi\sqrt v\,dW^2,\qquad dW^1dW^2 = \rho\,dt$$
      <ul><li>$\rho<0$ (the leverage effect): falling prices raise volatility. This fattens the left tail and creates the <b>skew</b>.</li>
      <li>vol-of-vol $\xi$ fattens both tails: <b>smile curvature</b>.</li>
      <li>$\kappa,\theta$ shape the <b>term structure</b> of implied vol.</li></ul>
      <p>The characteristic function of $\ln S_T$ is known in closed form, so prices come from Fourier inversion (Heston 1993; Carr–Madan FFT). Hedging now needs vega as well as delta, because volatility risk is a second, non-traded source of randomness. The market is incomplete with stock alone.</p>
      <p>Alternatives: <b>local volatility</b> $\sigma(S,t)$ via Dupire's formula fits any surface exactly; <b>SABR</b> is the rates-market favourite; <b>rough volatility</b> is the modern research frontier.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Simulated Heston: price and variance paths', height: 320,
        params: [{ id: 'rho', label: 'correlation ρ', min: -0.95, max: 0.95, step: 0.05, value: -0.7 }, { id: 'xi', label: 'vol of vol ξ', min: 0.05, max: 1.5, step: 0.05, value: 0.6 }, { id: 'k', label: 'κ', min: 0.2, max: 6, step: 0.1, value: 2 }],
        init(s) { s.seed = 101; }, buttons: reseed,
        draw(g, p, s) {
          const N = 500, T = 2, dt = T / N, th = 0.04, r = R.seeded(s.seed); let S = 100, v = 0.04; const ps = [[0, S]], vs = [[0, Math.sqrt(v)]];
          for (let i = 1; i <= N; i++) { const z1 = r.normal(), z2 = p.rho * z1 + Math.sqrt(1 - p.rho * p.rho) * r.normal(), vp = Math.max(v, 0); S *= Math.exp(-0.5 * vp * dt + Math.sqrt(vp * dt) * z1); v += p.k * (th - vp) * dt + p.xi * Math.sqrt(vp * dt) * z2; ps.push([i * dt, S]); vs.push([i * dt, Math.sqrt(Math.max(v, 0))]); }
          const mx = Math.max(...ps.map(q => q[1])), mn = Math.min(...ps.map(q => q[1]));
          g.view(0, T, Math.min(mn, 60), Math.max(mx, 140)).axes({ xlabel: 't' }); g.path(ps, { color: C.fe, width: 1.8 });
          const lo = Math.min(mn, 60), hi = Math.max(mx, 140); g.path(vs.map(([t, sv]) => [t, lo + (hi - lo) * Math.min(sv, 1)]), { color: C.pink, width: 1.3 });
          g.legend([['S_t', C.fe], ['√v_t (scaled, top = 100%)', C.pink]], { x: 60 });
        },
        info: p => `Feller 2κθ ≥ ξ²: ${2 * p.k * 0.04 >= p.xi * p.xi ? 'holds' : 'fails (variance hits 0; the simulation uses full truncation)'}. With ρ < 0, vol spikes when the price drops.`,
      }) },
    ],
    formulas: [h`dv = \kappa(\theta - v)dt + \xi\sqrt v\,dW^2`, h`dW^1dW^2 = \rho\,dt`, h`\sigma_{loc}^2(K,T) = \frac{\partial_TC}{\tfrac12K^2\partial_{KK}C}\ \ (r=q=0,\text{ Dupire})`],
    problems: [
      () => { const k = R.pick([1, 2]), th = R.pick([0.04, 0.09]), v0 = R.pick([0.01, 0.16]), T = R.pick([0.5, 1]); const ev = th + (v0 - th) * (1 - Math.exp(-k * T)) / (k * T); return { q: h`Heston variance: $v_0 = ${v0}$, $\theta = ${th}$, $\kappa = ${k}$. Expected average variance over $[0, ${T}]$?`, a: ev, tol: 1e-4, sol: h`$\theta + (v_0 - \theta)\frac{1-e^{-\kappa T}}{\kappa T} = ${fx(ev, 5)}$` }; },
      () => ({ q: h`In Heston, which parameter primarily generates the equity <b>skew</b>?`, choices: [h`the correlation $\rho$`, h`the long-run variance $\theta$`, h`the rate $r$`, h`the initial price $S_0$`], a: 0, sol: 'Negative ρ makes vol rise when the price falls.' }),
      () => { const k = R.pick([1.5, 2, 3]), th = R.pick([0.04, 0.06]), xi = R.pick([0.3, 0.5, 0.8]); const ok = 2 * k * th >= xi * xi; return { q: h`$\kappa = ${k}$, $\theta = ${th}$, $\xi = ${xi}$. Feller condition satisfied?`, choices: ['Yes', 'No'], a: ok ? 0 : 1, sol: h`$2\kappa\theta = ${fx(2 * k * th, 3)}$ vs $\xi^2 = ${fx(xi * xi, 3)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-jumps', title: 'Jump diffusions: Merton', minutes: 15,
    summary: 'Add Poisson-timed lognormal jumps to GBM. Prices become a Poisson-weighted mix of Black–Scholes prices; short-dated smiles appear.',
    sections: [
      h`<p><b>Merton (1976):</b> $\frac{dS}{S_-} = (r - \lambda k)dt + \sigma\,dW + (J-1)\,dN$, with $N$ Poisson at rate $\lambda$, $\ln J\sim N(\mu_J,\sigma_J^2)$ and $k = E[J-1] = e^{\mu_J+\sigma_J^2/2}-1$. The $-\lambda k$ drift compensates the jumps so that $e^{-rt}S$ stays a martingale.</p>
      <p>Conditioning on $n$ jumps gives a closed form:</p>
      $$C = \sum_{n\ge0}\frac{e^{-\lambda'T}(\lambda'T)^n}{n!}\,C_{BS}(S, K, T, r_n, \sigma_n),\quad \sigma_n^2 = \sigma^2 + \frac{n\sigma_J^2}{T},\ \lambda' = \lambda(1+k)$$
      <p>Jumps produce fat tails and steep <b>short-maturity</b> smiles, which diffusion models struggle with. They also make the market incomplete: you can't delta-hedge a jump. Lévy models (Variance Gamma, CGMY) generalise this.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Implied vol smile from Merton prices', height: 300,
        params: [{ id: 'lam', label: 'jump intensity λ', min: 0, max: 2, step: 0.05, value: 0.5 }, { id: 'mj', label: 'mean log-jump μ_J', min: -0.4, max: 0.2, step: 0.01, value: -0.15 }, { id: 'sj', label: 'jump vol σ_J', min: 0.01, max: 0.5, step: 0.01, value: 0.15 }, { id: 'T', label: 'maturity', min: 0.05, max: 2, step: 0.05, value: 0.25 }],
        draw(g, p) {
          const ks = M.linspace(70, 130, 31), iv = ks.map(K => [K, M.impliedVol(merton(100, K, p.T, 0.02, 0.15, p.lam, p.mj, p.sj), 100, K, p.T, 0.02)]);
          g.view(70, 130, 0.05, Math.max(0.5, ...iv.map(q => q[1])) * 1.05).axes({ xlabel: 'strike', fy: v => MF.pct(v, 0) });
          g.hline(0.15, { color: C.dim }); g.path(iv, { color: C.pink, width: 2.5 }); iv.forEach(q => g.dot(q[0], q[1], { r: 2.5, color: C.pink }));
        },
        info: p => `Diffusive vol 15% (grey). Jumps add tail mass: negative μ_J tilts the smile into a skew. Try a longer maturity and the smile flattens.`,
      }) },
    ],
    formulas: [h`\frac{dS}{S_-} = (r-\lambda k)dt + \sigma dW + (J-1)dN`, h`k = e^{\mu_J + \frac12\sigma_J^2} - 1`, h`C = \sum_n \frac{e^{-\lambda'T}(\lambda'T)^n}{n!}C_{BS}(\sigma_n, r_n)`],
    problems: [
      () => { const mj = R.pick([-0.1, -0.2, 0.05]), sj = R.pick([0.1, 0.2]); return { q: h`Merton jump: $\mu_J = ${mj}$, $\sigma_J = ${sj}$. Mean jump size $k = E[J - 1]$?`, a: Math.exp(mj + sj * sj / 2) - 1, tol: 1e-4, sol: h`$e^{${mj} + ${fx(sj * sj / 2, 3)}} - 1 = ${fx(Math.exp(mj + sj * sj / 2) - 1, 5)}$` }; },
      () => { const s = 0.2, sj = R.pick([0.1, 0.2]), n = R.int(1, 3), T = R.pick([0.5, 1]); return { q: h`With $\sigma = 0.2$, $\sigma_J = ${sj}$, $T = ${T}$: the effective vol given exactly ${n} jumps, $\sigma_n$?`, a: Math.sqrt(s * s + n * sj * sj / T), tol: 1e-4, sol: h`$\sqrt{0.04 + ${n}\cdot${sj}^2/${T}} = ${fx(Math.sqrt(s * s + n * sj * sj / T), 5)}$` }; },
      () => { const lam = R.pick([0.5, 1, 2]), T = R.pick([0.25, 1]); return { q: h`Jump intensity ${lam}/yr. Probability of no jump within ${T} years?`, a: Math.exp(-lam * T), tol: 1e-4, sol: h`$e^{-${lam}\cdot${T}} = ${fx(Math.exp(-lam * T), 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-exotics', title: 'Exotic options: digital, barrier, Asian, lookback', minutes: 18,
    summary: 'Path-dependent and discontinuous payoffs: closed forms where they exist (digitals, barriers) and Monte Carlo where they don\'t.',
    sections: [
      h`<ul><li><b>Cash-or-nothing digital call:</b> pays 1 if $S_T>K$. Price $e^{-rT}\Phi(d_2)$. Its delta spikes near expiry, which makes it hard to hedge, so traders over-hedge with call spreads.</li>
      <li><b>Barrier options</b> (knock-in / knock-out at level $H$): in-out parity says $C_{\text{in}} + C_{\text{out}} = C_{\text{vanilla}}$. Closed forms come from the reflection principle. Down-and-out calls are cheaper than vanillas.</li>
      <li><b>Asian options</b> pay on the average price, $(\bar S - K)^+$. Averaging lowers volatility (≈ σ/√3 for continuous arithmetic averaging), so they're cheaper. Geometric Asians have a closed form, making them perfect control variates for arithmetic ones.</li>
      <li><b>Lookbacks</b> pay on the maximum or minimum: $(S_{max} - K)^+$.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Monte Carlo prices of exotics vs the vanilla', height: 300,
        params: [{ id: 'H', label: 'down-and-out barrier H', min: 50, max: 99, step: 1, value: 85 }, { id: 's', label: 'σ', min: 0.1, max: 0.6, step: 0.01, value: 0.3, fmt: v => MF.pct(v, 0) }],
        init(s) { s.seed = 111; }, buttons: reseed,
        draw(g, p, s) {
          const S0 = 100, K = 100, T = 1, r = 0.03, N = 52, n = 3000, dt = T / N, rnd = R.seeded(s.seed), df = Math.exp(-r * T);
          let van = 0, dao = 0, asi = 0, lb = 0, dig = 0; const show = [];
          for (let k = 0; k < n; k++) { let S = S0, sum = 0, mx = S0, alive = true; const path = [[0, S0]]; for (let i = 1; i <= N; i++) { S *= Math.exp((r - p.s * p.s / 2) * dt + p.s * Math.sqrt(dt) * rnd.normal()); sum += S; mx = Math.max(mx, S); if (S <= p.H) alive = false; if (k < 12) path.push([i * dt, S]); }
            van += Math.max(S - K, 0); dao += alive ? Math.max(S - K, 0) : 0; asi += Math.max(sum / N - K, 0); lb += Math.max(mx - K, 0); dig += S > K ? 1 : 0; if (k < 12) show.push([path, alive]); }
          s.v = { vanilla: df * van / n, 'down-and-out': df * dao / n, asian: df * asi / n, lookback: df * lb / n, digital: df * dig / n };
          g.view(0, T, 30, 220).axes({ xlabel: 't' }); g.hline(p.H, { color: C.bad, dash: [], width: 1.5 }); g.hline(K, { color: C.dim });
          show.forEach(([pa, al]) => g.path(pa, { color: al ? C.alpha(C.fe, 0.7) : C.alpha(C.bad, 0.5), width: 1.2 }));
        },
        info: (p, s) => s.v ? Object.entries(s.v).map(([k, v]) => `<span class="kv"><span>${k}</span><b>${fx(v, 3)}</b></span>`).join('') + `<br>BS vanilla: ${fx(M.bs(100, 100, 1, 0.03, p.s), 3)}, BS digital $e^{-rT}\\Phi(d_2)$: ${fx(Math.exp(-0.03) * M.ncdf(M.bsD1(100, 100, 1, 0.03, p.s) - p.s), 3)}. Red paths were knocked out (weekly monitoring).` : '',
      }) },
    ],
    formulas: [h`\text{Digital} = e^{-rT}\Phi(d_2)`, h`C_{\text{in}} + C_{\text{out}} = C_{\text{vanilla}}`, h`\sigma_{\text{geo Asian}} = \sigma/\sqrt3`, h`P\left(\min_{s\le T}W^\mu_s\le b\right)\ \text{via reflection}`],
    problems: [
      () => { const K = R.pick([95, 100, 105]), s = R.pick([0.2, 0.3]); const d2 = M.bsD1(100, K, 1, 0.03, s) - s; return { q: h`Cash-or-nothing digital call (pays 1): $S = 100$, $K = ${K}$, $T = 1$, $r = 3\%$, $\sigma = ${s}$. Price?`, a: Math.exp(-0.03) * M.ncdf(d2), tol: 0.002, sol: h`$e^{-0.03}\Phi(${fx(d2, 4)}) = ${fx(Math.exp(-0.03) * M.ncdf(d2), 4)}$` }; },
      () => { const v = R.pick([10.45, 8.92, 12.1]), out = R.pick([6.2, 7.1, 4.3]); return { q: h`Vanilla call ${v}, down-and-out call (same K, T) ${out}. Down-and-in call?`, a: v - out, tol: 1e-6, sol: 'In–out parity.' }; },
      () => { const s = R.pick([0.3, 0.45, 0.6]); return { q: h`Approximate volatility of a continuously averaged geometric Asian when $\sigma = ${s}$?`, a: s / Math.sqrt(3), tol: 1e-3, sol: h`$${s}/\sqrt3 = ${fx(s / Math.sqrt(3), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-risk', title: 'Risk measures: VaR & Expected Shortfall', minutes: 15,
    summary: 'Value-at-Risk is a loss quantile; Expected Shortfall is the average loss beyond it. Coherence, subadditivity and backtesting.',
    sections: [
      h`<p>For loss $L$: $\text{VaR}_\alpha = \inf\{\ell: P(L\le\ell)\ge\alpha\}$ is the $\alpha$-quantile, and $\text{ES}_\alpha = E[L\mid L\ge\text{VaR}_\alpha]$ is the average of the worst $1-\alpha$ outcomes.</p>
      <p>For normal losses $N(\mu,\sigma^2)$: $\text{VaR} = \mu + \sigma z_\alpha$ and $\text{ES} = \mu + \sigma\frac{\varphi(z_\alpha)}{1-\alpha}$. At 99%, $z = 2.326$ and the ES factor is 2.665. Square-root-of-time scaling: $\text{VaR}_{h} \approx\sqrt h\,\text{VaR}_1$ (for i.i.d. zero-mean returns).</p>
      <p>A <b>coherent</b> risk measure is monotone, translation-invariant, positively homogeneous and <b>subadditive</b>: $\rho(A+B)\le\rho(A)+\rho(B)$, so diversification never increases risk. ES is coherent; VaR is not (it can penalise diversification for fat-tailed or discrete losses). Basel's FRTB moved from 99% VaR to 97.5% ES.</p>
      <p>Methods: parametric (delta-normal), historical simulation and Monte Carlo. <b>Backtesting</b> counts VaR breaches, which should be ~1% at 99% (Kupiec test).</p>`,
      { viz: host => MF.explore(host, {
        title: 'VaR and ES on a loss distribution', height: 300,
        params: [{ id: 'a', label: 'confidence α', min: 0.9, max: 0.999, step: 0.001, value: 0.99, fmt: v => MF.pct(v, 1) }, { id: 'nu', label: 'tail heaviness (Student-t ν)', min: 2.5, max: 30, step: 0.5, value: 30 }],
        draw(g, p) {
          const r = R.seeded(5), n = 8000, sc = Math.sqrt((p.nu - 2) / p.nu), L = [];
          for (let i = 0; i < n; i++) { let ch = 0; for (let k = 0; k < Math.round(p.nu); k++) { const z = r.normal(); ch += z * z; } L.push(r.normal() / Math.sqrt(ch / Math.round(p.nu)) * sc); }
          L.sort((a, b) => a - b); const vi = Math.floor(p.a * n), v = L[vi], es = M.mean(L.slice(vi));
          g.view(-5, 7, 0, 0.5).axes({ xlabel: 'loss (std units)' }); g.hist(L, -5, 7, 96, { density: true, fill: C.alpha(C.fe, 0.3), color: C.alpha(C.fe, 0.5) });
          g.area(x => M.npdf(x), v, 7, { color: C.alpha(C.bad, 0.15) }); g.fn(x => M.npdf(x), { color: C.dim, dash: [4, 4] });
          g.vline(v, { color: C.speed, dash: [], width: 2 }); g.vline(es, { color: C.bad, dash: [], width: 2 });
          p._v = v; p._es = es;
        },
        info: p => { const z = M.ninv(p.a); return h`Normal reference: VaR $= ${fx(z, 3)}\sigma$, ES $= ${fx(M.npdf(z) / (1 - p.a), 3)}\sigma$. Lower ν fattens the tails: VaR (orange) and ES (red) move further out, and ES moves most.`; },
      }) },
    ],
    formulas: [h`\text{VaR}_\alpha = \mu + \sigma z_\alpha`, h`\text{ES}_\alpha = \mu + \sigma\frac{\varphi(z_\alpha)}{1-\alpha}`, h`\text{VaR}_h\approx\sqrt h\,\text{VaR}_1`, h`\rho(A+B)\le\rho(A)+\rho(B)`],
    problems: [
      () => { const V = R.pick([1e6, 5e6, 1e7]), s = R.pick([0.01, 0.015, 0.02]), a = R.pick([0.95, 0.99]); const v = V * s * M.ninv(a); return { q: h`Portfolio ${MF.fmt(V, 0)}, daily vol ${fx(s * 100, 2)}%, zero mean. 1-day ${fx(a * 100, 0)}% VaR?`, a: v, rtol: 2e-3, sol: h`$${MF.fmt(V, 0)}\cdot${s}\cdot${fx(M.ninv(a), 3)} = ${MF.fmt(v, 0)}$` }; },
      () => { const a = R.pick([0.975, 0.99]); const k = M.npdf(M.ninv(a)) / (1 - a); return { q: h`Normal losses, σ = 1, μ = 0. ${fx(a * 100, 1)}% Expected Shortfall?`, a: k, tol: 0.002, sol: h`$\varphi(z)/(1-\alpha) = ${fx(k, 4)}$` }; },
      () => { const v1 = R.pick([1, 2, 2.5]), h0 = R.pick([10, 4, 25]); return { q: h`1-day VaR = ${v1}m. ${h0}-day VaR by square-root-of-time?`, a: v1 * Math.sqrt(h0), tol: 0.005, sol: h`$${v1}\sqrt{${h0}} = ${fx(v1 * Math.sqrt(h0), 3)}$m` }; },
      () => ({ q: h`Which risk measure is coherent (in particular, subadditive)?`, choices: ['Expected Shortfall', 'Value-at-Risk', 'Both', 'Neither'], a: 0, sol: 'VaR can fail subadditivity.' }),
    ],
  });

  MF.lesson({
    id: 'fe-credit', title: 'Credit risk: hazard rates & structural models', minutes: 16,
    summary: 'Reduced-form default intensities, survival curves and credit spreads; Merton\'s model of equity as a call on the firm.',
    sections: [
      h`<p><b>Reduced form:</b> default is the first jump of a Poisson process with intensity (hazard) $\lambda(t)$. Survival is $Q(\tau > t) = e^{-\int_0^t\lambda(s)ds}$. With recovery $R$, the <b>credit triangle</b> gives $s\approx\lambda(1-R)$. A CDS spread of 200bp with 40% recovery implies $\lambda\approx 3.3\%$/yr.</p>
      <p>A risky zero bond is worth $P(0,T)\left[Q(\tau>T) + R\,Q(\tau\le T)\right]$ (recovery of face at maturity).</p>
      <p><b>Structural (Merton 1974):</b> firm assets $V$ follow GBM; debt has face $D$ due at $T$. Equity $= (V_T - D)^+$ is a <b>call</b> on the assets, and debt = risk-free bond − put. The risk-neutral default probability is $\Phi(-d_2)$, and the <b>distance to default</b> $\frac{\ln(V/D) + (\mu - \frac12\sigma^2)T}{\sigma\sqrt T}$ is the KMV metric.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Survival curves and spreads', height: 280,
        params: [{ id: 'lam', label: 'hazard λ', min: 0.001, max: 0.2, step: 0.001, value: 0.03, fmt: v => MF.pct(v, 1) }, { id: 'R', label: 'recovery R', min: 0, max: 0.9, step: 0.05, value: 0.4, fmt: v => MF.pct(v, 0) }],
        draw(g, p) {
          g.view(0, 30, 0, 1.02).axes({ xlabel: 'years', ylabel: 'survival' });
          g.area(t => Math.exp(-p.lam * t), 0, 30, { color: C.alpha(C.good, 0.12) }); g.fn(t => Math.exp(-p.lam * t), { color: C.good, width: 2.5 });
          g.fn(t => 1 - Math.exp(-p.lam * t), { color: C.bad, width: 1.5, dash: [5, 4] });
        },
        info: p => h`Spread ≈ $\lambda(1-R) = ${fx(1e4 * p.lam * (1 - p.R), 1)}$ bp. 5y default probability $1 - e^{-5\lambda} = ${MF.pct(1 - Math.exp(-5 * p.lam), 2)}$. Expected time to default $1/\lambda = ${fx(1 / p.lam, 1)}$y.`,
      }) },
    ],
    formulas: [h`Q(\tau>t) = e^{-\int_0^t\lambda(s)\,ds}`, h`s\approx\lambda(1-R)`, h`E_0 = V_0\Phi(d_1) - De^{-rT}\Phi(d_2)`, h`\mathbb Q(\text{default}) = \Phi(-d_2)`],
    problems: [
      () => { const s = R.pick([100, 200, 300, 500]), Rr = R.pick([0.4, 0.25, 0.6]); return { q: h`CDS spread ${s}bp, recovery ${fx(Rr * 100, 0)}%. Implied hazard rate in %?`, a: s / 100 / (1 - Rr), tol: 0.005, unit: '%', sol: h`$\lambda = \frac{s}{1-R} = ${fx(s / 100 / (1 - Rr), 3)}\%$` }; },
      () => { const l = R.pick([0.01, 0.02, 0.05]), T = R.pick([1, 5, 10]); return { q: h`Hazard ${l}/yr. Probability of default within ${T} years?`, a: 1 - Math.exp(-l * T), tol: 1e-4, sol: h`$1 - e^{-${l}\cdot${T}} = ${fx(1 - Math.exp(-l * T), 5)}$` }; },
      () => { const V = R.pick([120, 150]), D = 100, s = R.pick([0.2, 0.3]), r = 0.03, T = 1; const d2 = M.bsD1(V, D, T, r, s) - s; return { q: h`Merton: assets ${V}, debt face 100 due in 1y, asset vol ${s}, $r = 3\%$. Risk-neutral default probability?`, a: M.ncdf(-d2), tol: 0.002, sol: h`$\Phi(-d_2) = \Phi(${fx(-d2, 4)}) = ${fx(M.ncdf(-d2), 4)}$` }; },
      () => { const V = R.pick([120, 150]), s = R.pick([0.2, 0.3]); return { q: h`Merton: assets ${V}, debt 100 (1y), asset vol ${s}, $r = 3\%$. Equity value?`, a: M.bs(V, 100, 1, 0.03, s), tol: 0.01, sol: h`Equity = call on assets: $${fx(M.bs(V, 100, 1, 0.03, s), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-copulas', title: 'Copulas & dependence in the tails', minutes: 15,
    summary: 'Separate marginals from dependence (Sklar). Gaussian vs Student-t copulas, tail dependence, and the one-factor model behind CDO pricing.',
    sections: [
      h`<p><b>Sklar's theorem:</b> any joint distribution can be written $F(x_1,\dots,x_n) = C(F_1(x_1),\dots,F_n(x_n))$ where the <b>copula</b> $C$ is a joint CDF of uniforms. Choose marginals and dependence separately.</p>
      <ul><li><b>Gaussian copula:</b> correlated normals mapped through $\Phi$. Zero <b>tail dependence</b>: extreme joint crashes become independent in the limit.</li>
      <li><b>Student-t copula:</b> positive tail dependence, so crashes cluster. More realistic for credit and equity.</li>
      <li><b>Archimedean</b> (Clayton: lower-tail; Gumbel: upper-tail).</li></ul>
      <p><b>One-factor Gaussian model</b> (Vasicek/Li): firm $i$ defaults if $\sqrt\rho\,Z + \sqrt{1-\rho}\,\varepsilon_i < \Phi^{-1}(p)$. Conditional on the market factor $Z$, defaults are independent with probability $p(Z) = \Phi\left(\frac{\Phi^{-1}(p) - \sqrt\rho Z}{\sqrt{1-\rho}}\right)$. This is the basis of Basel IRB capital and (infamously) pre-2008 CDO tranche pricing.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Gaussian vs Student-t copula samples (uniform scale)', height: 340,
        params: [{ id: 'rho', label: 'correlation ρ', min: 0, max: 0.95, step: 0.05, value: 0.5 }, { id: 'cop', label: 'copula', type: 'select', value: 't', options: [['g', 'Gaussian'], ['t', 'Student-t (ν = 3)']] }],
        init(s) { s.seed = 121; }, buttons: reseed,
        draw(g, p, s) {
          const r = R.seeded(s.seed), n = 1500, nu = 3; g.view(0, 1, 0, 1).axes({ xstep: 0.2, ystep: 0.2 });
          const c = g.ctx; let both = 0;
          const tcdf = x => { const t = nu / (nu + x * x); let a = 0.5 * incBeta(t, nu / 2, 0.5); return x > 0 ? 1 - a : a; };
          for (let i = 0; i < n; i++) { const z1 = r.normal(), z2 = p.rho * z1 + Math.sqrt(1 - p.rho * p.rho) * r.normal(); let u, v;
            if (p.cop === 'g') { u = M.ncdf(z1); v = M.ncdf(z2); } else { let ch = 0; for (let k = 0; k < nu; k++) { const q = r.normal(); ch += q * q; } const w = Math.sqrt(ch / nu); u = tcdf(z1 / w); v = tcdf(z2 / w); }
            if (u < 0.05 && v < 0.05) both++; c.fillStyle = u < 0.05 && v < 0.05 ? C.bad : C.alpha(C.fe, 0.5); c.fillRect(g.X(u) - 1.5, g.Y(v) - 1.5, 3, 3); }
          c.strokeStyle = C.bad; c.lineWidth = 1; c.strokeRect(g.X(0), g.Y(0.05), g.X(0.05) - g.X(0), g.Y(0) - g.Y(0.05)); s.both = both / n;
        },
        info: (p, s) => `Joint lower-5% events: <b>${MF.pct(s.both || 0, 2)}</b> of samples (independence would give 0.25%). The t-copula crowds more points into the corner at the same ρ.`,
      }) },
    ],
    formulas: [h`F(x_1..x_n) = C\left(F_1(x_1),\dots,F_n(x_n)\right)`, h`C_\rho^{Ga}(u,v) = \Phi_\rho\left(\Phi^{-1}(u),\Phi^{-1}(v)\right)`, h`p(Z) = \Phi\left(\frac{\Phi^{-1}(p) - \sqrt\rho Z}{\sqrt{1-\rho}}\right)`, h`\lambda_L = \lim_{u\to0}P(V\le u\mid U\le u)`],
    problems: [
      () => { const p = R.pick([0.01, 0.02, 0.05]), rho = R.pick([0.1, 0.2, 0.3]), z = R.pick([-2, -1, 0, 1]); const v = M.ncdf((M.ninv(p) - Math.sqrt(rho) * z) / Math.sqrt(1 - rho)); return { q: h`One-factor model: $p = ${p}$, $\rho = ${rho}$, market factor $Z = ${z}$. Conditional default probability?`, a: v, tol: 0.002, sol: h`$\Phi\left(\frac{\Phi^{-1}(${p}) - \sqrt{${rho}}(${z})}{\sqrt{1-${rho}}}\right) = ${fx(v, 4)}$` }; },
      () => { const p = R.pick([0.01, 0.02]), rho = R.pick([0.12, 0.24]), q = 0.999; const v = M.ncdf((M.ninv(p) + Math.sqrt(rho) * M.ninv(q)) / Math.sqrt(1 - rho)); return { q: h`Basel-style worst-case default rate at 99.9%: $p = ${p}$, $\rho = ${rho}$?`, a: v, tol: 0.002, sol: h`$\Phi\left(\frac{\Phi^{-1}(p) + \sqrt\rho\,\Phi^{-1}(0.999)}{\sqrt{1-\rho}}\right) = ${fx(v, 4)}$` }; },
      () => ({ q: h`The Gaussian copula's lower tail dependence coefficient (for $\rho < 1$) is…`, choices: ['0', h`$\rho$`, '1', h`$\rho^2$`], a: 0, sol: 'Gaussian dependence vanishes in the extreme tails.' }),
    ],
  });

  /** regularised incomplete beta (continued fraction), for the Student-t CDF */
  function incBeta(x, a, b) {
    if (x <= 0) return 0; if (x >= 1) return 1;
    const lbeta = lgamma(a + b) - lgamma(a) - lgamma(b), front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b + lbeta) / a;
    let f = 1, c = 1, d = 0;
    for (let i = 0; i <= 200; i++) {
      const m = i >> 1; let num;
      if (i === 0) num = 1; else if (i % 2 === 0) num = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m)); else num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
      d = 1 + num * d; if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; c = 1 + num / c; if (Math.abs(c) < 1e-30) c = 1e-30;
      const cd = c * d; f *= cd; if (Math.abs(1 - cd) < 1e-10) break;
    }
    return front * (f - 1);
  }
  function lgamma(z) { const g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]; let x = z, y = z, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015; for (const c of g) s += c / ++y; return -t + Math.log(2.5066282746310005 * s / x); }
})();
