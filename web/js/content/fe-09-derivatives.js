/* FE Math · Unit 9: derivatives in discrete time */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;

  /** CRR binomial pricer */
  MF.crr = function (S, K, T, r, sig, n, type = 'call', american = false) {
    const dt = T / n, u = Math.exp(sig * Math.sqrt(dt)), d = 1 / u, q = (Math.exp(r * dt) - d) / (u - d), disc = Math.exp(-r * dt);
    const pay = s => Math.max(type === 'call' ? s - K : K - s, 0);
    let v = []; for (let j = 0; j <= n; j++) v.push(pay(S * Math.pow(u, j) * Math.pow(d, n - j)));
    for (let i = n - 1; i >= 0; i--) { const nv = []; for (let j = 0; j <= i; j++) { let c = disc * (q * v[j + 1] + (1 - q) * v[j]); if (american) c = Math.max(c, pay(S * Math.pow(u, j) * Math.pow(d, i - j))); nv.push(c); } v = nv; }
    return v[0];
  };

  MF.unit('fe', 'fe-u9', 'Derivatives: No-Arbitrage & Trees', 'Forwards, option payoffs, put–call parity, replication, risk-neutral probabilities and binomial trees.');

  MF.lesson({
    id: 'fe-forwards', title: 'Forwards, futures & no-arbitrage', minutes: 14,
    summary: 'The forward price is pinned by cost of carry: F = S·e^{(r − q)T}. Any other price creates a riskless profit.',
    sections: [
      h`<p>A <b>forward</b> obliges you to buy the asset at price $F$ at time $T$. Its payoff is $S_T - F$. <b>Replication</b>: borrow $S_0$, buy the asset, hold it to $T$, and you owe $S_0e^{rT}$. So no arbitrage forces</p>
      $$F_0 = S_0e^{(r-q)T}$$
      <p>where $q$ is a continuous dividend yield (or $-$storage cost, $+$convenience yield). For a currency $q$ is the foreign interest rate (covered interest parity: $F = S\,e^{(r_d - r_f)T}$).</p>
      <ul><li>If $F_{mkt} > S_0e^{(r-q)T}$: <b>cash-and-carry</b> (buy spot, sell forward).</li><li>If lower: reverse cash-and-carry (short spot, buy forward).</li></ul>
      <p>Value of an existing long forward struck at $K$: $V_t = (F_t - K)e^{-r(T-t)}$. Futures are marked to market daily; with deterministic rates their prices equal forward prices.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Forward price vs maturity and arbitrage check', height: 280,
        params: [{ id: 'S', label: 'spot S₀', min: 50, max: 150, step: 1, value: 100 }, { id: 'r', label: 'rate r', min: 0, max: 0.1, step: 0.0025, value: 0.05, fmt: v => MF.pct(v, 2) }, { id: 'q', label: 'yield q', min: 0, max: 0.1, step: 0.0025, value: 0.02, fmt: v => MF.pct(v, 2) }, { id: 'Fm', label: 'quoted 2y forward', min: 80, max: 140, step: 0.5, value: 110 }],
        draw(g, p) {
          const F = t => p.S * Math.exp((p.r - p.q) * t);
          g.view(0, 5, Math.min(F(5), p.S, p.Fm) * 0.9, Math.max(F(5), p.S, p.Fm) * 1.08).axes({ xlabel: 'T (years)' });
          g.fn(F, { color: C.fe, width: 2.5 }); g.dot(2, F(2), { color: C.fe, r: 5 }); g.dot(2, p.Fm, { color: p.Fm > F(2) ? C.pink : p.Fm < F(2) ? C.speed : C.good, r: 6, ring: C.text });
        },
        info: p => { const F = p.S * Math.exp((p.r - p.q) * 2), d = p.Fm - F; return h`Fair 2y forward $= ${fx(F, 3)}$. ${Math.abs(d) < 0.05 ? 'No arbitrage.' : d > 0 ? h`Quote is rich by ${fx(d, 2)}: buy spot, sell forward, lock in ${fx(d, 2)} at T.` : h`Quote is cheap by ${fx(-d, 2)}: short spot, invest, buy forward.`}`; },
      }) },
    ],
    formulas: [h`F_0 = S_0e^{(r-q)T}`, h`F = S\,e^{(r_d - r_f)T}`, h`V_t = (F_t - K)\,e^{-r(T-t)}`],
    problems: [
      () => { const S = R.int(50, 200), r = R.pick([0.02, 0.04, 0.05]), q = R.pick([0, 0.01, 0.03]), T = R.pick([0.5, 1, 2]); return { q: h`Spot ${S}, $r = ${r}$, dividend yield ${q}, $T = ${T}$. Forward price?`, a: S * Math.exp((r - q) * T), tol: 0.01, sol: h`$${S}e^{(${r} - ${q})\cdot${T}} = ${fx(S * Math.exp((r - q) * T), 3)}$` }; },
      () => { const S = R.pick([1.1, 1.25, 0.9]), rd = R.pick([0.05, 0.04]), rf = R.pick([0.02, 0.01, 0.03]), T = 1; return { q: h`FX spot ${S} (domestic per foreign), $r_d = ${rd}$, $r_f = ${rf}$. 1-year forward?`, a: S * Math.exp((rd - rf) * T), tol: 1e-4, sol: h`$${S}e^{${rd} - ${rf}} = ${fx(S * Math.exp(rd - rf), 5)}$` }; },
      () => { const S = 100, r = 0.05, T = 1, Fm = R.pick([103, 108, 104]); const F = S * Math.exp(r * T); return { q: h`Spot 100, $r = 5\%$, no dividends, 1y forward quoted at ${Fm}. Riskless profit per unit at $T$ from the right arbitrage?`, a: Math.abs(Fm - F), tol: 0.01, sol: h`Fair $= ${fx(F, 3)}$; profit $|${Fm} - ${fx(F, 3)}| = ${fx(Math.abs(Fm - F), 3)}$` }; },
      () => { const K = R.int(95, 105), Ft = R.int(98, 110), r = 0.04, tau = R.pick([0.5, 1]); return { q: h`Long forward struck at ${K}; current forward price ${Ft}; ${tau}y left, $r = 4\%$. Value?`, a: (Ft - K) * Math.exp(-r * tau), tol: 0.005, sol: h`$(${Ft} - ${K})e^{-0.04\cdot${tau}} = ${fx((Ft - K) * Math.exp(-r * tau), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-options', title: 'Option payoffs & strategies', minutes: 14,
    summary: 'Calls, puts and their combinations: spreads, straddles, butterflies. Payoff diagrams are piecewise-linear functions of S_T.',
    sections: [
      h`<p>A <b>call</b> pays $(S_T - K)^+ = \max(S_T-K,0)$; a <b>put</b> pays $(K - S_T)^+$. European options exercise only at $T$, American any time up to $T$. Profit = payoff − premium (compounded).</p>
      <p>Portfolios of options build any piecewise-linear payoff:</p>
      <ul><li><b>Bull call spread</b>: long $C(K_1)$, short $C(K_2)$. Payoff capped at $K_2-K_1$.</li><li><b>Straddle</b>: long call + put at $K$. A bet on volatility.</li>
      <li><b>Butterfly</b>: $C(K_1) - 2C(K_2) + C(K_3)$. Approximates a spike at $K_2$. As strike spacing → 0 it isolates the risk-neutral density (Breeden–Litzenberger: $\partial_K^2 C = e^{-rT}f(K)$).</li>
      <li><b>Collar, risk reversal, digital</b> (limit of a tight call spread)…</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Payoff builder', height: 320,
        params: [{ id: 'strat', label: 'strategy', type: 'select', value: 'bfly', options: [['call', 'long call'], ['put', 'long put'], ['bull', 'bull call spread'], ['strad', 'straddle'], ['strang', 'strangle'], ['bfly', 'butterfly'], ['collar', 'collar (stock + put − call)'], ['cov', 'covered call']] }, { id: 'K', label: 'centre strike K', min: 80, max: 120, step: 1, value: 100 }, { id: 'w', label: 'strike width', min: 2, max: 25, step: 1, value: 10 }],
        draw(g, p) {
          const K = p.K, w = p.w, c = (s, k) => Math.max(s - k, 0), pu = (s, k) => Math.max(k - s, 0);
          const F = { call: s => c(s, K), put: s => pu(s, K), bull: s => c(s, K - w / 2) - c(s, K + w / 2), strad: s => c(s, K) + pu(s, K), strang: s => c(s, K + w / 2) + pu(s, K - w / 2), bfly: s => c(s, K - w) - 2 * c(s, K) + c(s, K + w), collar: s => s - K + pu(s, K - w) - c(s, K + w), cov: s => s - K - c(s, K + w / 2) }[p.strat];
          g.view(50, 150, -40, 50).axes({ xlabel: 'S_T' });
          g.area(s => Math.max(F(s), 0), 50, 150, { color: C.alpha(C.good, 0.15) }); g.area(s => Math.min(F(s), 0), 50, 150, { color: C.alpha(C.bad, 0.15) });
          g.fn(F, { color: C.fe, width: 3, n: 1000 }); g.vline(K, { color: C.dim });
        },
        info: p => ({ call: 'Unlimited upside, loss limited to the premium.', put: 'Insurance: pays when the price falls.', bull: 'Bullish with capped profit; cheaper than a naked call.', strad: 'Profits from a big move either way: long volatility.', strang: 'A cheaper straddle that needs a bigger move.', bfly: 'Profits if S_T ends near K: short volatility with limited risk.', collar: 'Stock hedged below and capped above.', cov: 'Stock plus a short call: income in exchange for capped upside.' })[p.strat] + ' (Payoffs shown relative to entry level K, excluding premiums.)',
      }) },
    ],
    formulas: [h`C_T = (S_T - K)^+,\ \ P_T = (K - S_T)^+`, h`\text{Butterfly} = C(K-\Delta) - 2C(K) + C(K+\Delta)`, h`\frac{\partial^2 C}{\partial K^2} = e^{-rT}f_{S_T}(K)`],
    problems: [
      () => { const K1 = R.pick([90, 95]), K2 = K1 + R.pick([10, 15]), S = R.int(80, 120); return { q: h`Bull call spread $K_1 = ${K1}$, $K_2 = ${K2}$. Payoff at $S_T = ${S}$?`, a: Math.max(S - K1, 0) - Math.max(S - K2, 0), sol: h`$(S-${K1})^+ - (S - ${K2})^+$` }; },
      () => { const K = 100, S = R.int(70, 130), c = R.pick([4, 5, 6]), p = R.pick([3, 4, 5]); return { q: h`Straddle at $K = 100$ costs ${c + p} in premiums. Profit (ignoring interest) at $S_T = ${S}$?`, a: Math.abs(S - K) - c - p, sol: h`$|${S} - 100| - ${c + p}$` }; },
      () => { const K = 100, w = R.pick([5, 10]), S = R.int(85, 115); const v = Math.max(S - K + w, 0) - 2 * Math.max(S - K, 0) + Math.max(S - K - w, 0); return { q: h`Butterfly with strikes ${K - w}, ${K}, ${K + w}. Payoff at $S_T = ${S}$?`, a: v, sol: h`Tent of height ${w} centred at 100 → ${v}` }; },
      () => { const K = R.pick([95, 100, 105]), pr = R.pick([3, 5, 7]); return { q: h`Long put, strike ${K}, premium ${pr}. Breakeven stock price?`, a: K - pr, sol: h`$${K} - ${pr} = ${K - pr}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-parity', title: 'Put–call parity & arbitrage bounds', minutes: 13,
    summary: 'C − P = S − K·e^{−rT}. Model-free relationships every option price must satisfy.',
    sections: [
      h`<p>A long call plus a short put (same $K$, $T$) pays $(S_T-K)^+ - (K-S_T)^+ = S_T - K$, exactly a forward. So:</p>
      $$C - P = S_0e^{-qT} - Ke^{-rT}$$
      <p>This holds with <b>no model</b>, only no-arbitrage. Other model-free bounds for European options:</p>
      <ul><li>$\max(S_0e^{-qT} - Ke^{-rT}, 0) \le C \le S_0e^{-qT}$</li><li>$\max(Ke^{-rT} - S_0e^{-qT}, 0)\le P \le Ke^{-rT}$</li>
      <li>Call prices decrease and are convex in $K$; both increase with $T$ for American options.</li>
      <li>An American call on a non-dividend stock is never exercised early, so $C_{Am} = C_{Eu}$. American puts can be.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Call price lives between its arbitrage bounds', height: 300,
        params: [{ id: 'K', label: 'strike', min: 60, max: 140, step: 1, value: 100 }, { id: 'T', label: 'T', min: 0.05, max: 5, step: 0.05, value: 1 }, { id: 'r', label: 'r', min: 0, max: 0.1, step: 0.0025, value: 0.04, fmt: v => MF.pct(v, 2) }, { id: 's', label: 'σ (for the BS curve)', min: 0.05, max: 0.8, step: 0.01, value: 0.25, fmt: v => MF.pct(v, 0) }],
        draw(g, p) {
          g.view(40, 160, 0, 110).axes({ xlabel: 'S₀' });
          const lo = S => Math.max(S - p.K * Math.exp(-p.r * p.T), 0);
          g.area(S => S, 40, 160, { g: lo, color: C.alpha(C.fe, 0.08) });
          g.fn(S => S, { color: C.dim, dash: [4, 4] }); g.fn(lo, { color: C.dim, dash: [4, 4] });
          g.fn(S => M.bs(S, p.K, p.T, p.r, p.s, 'call'), { color: C.fe, width: 2.5 });
          g.fn(S => M.bs(S, p.K, p.T, p.r, p.s, 'put'), { color: C.speed, width: 2 });
          g.legend([['call (BS)', C.fe], ['put (BS)', C.speed], ['bounds', C.dim]], { x: 60 });
        },
        info: p => { const S = 100, c = M.bs(S, p.K, p.T, p.r, p.s), pu = M.bs(S, p.K, p.T, p.r, p.s, 'put'); return h`At $S_0=100$: $C - P = ${fx(c - pu, 4)}$ and $S - Ke^{-rT} = ${fx(S - p.K * Math.exp(-p.r * p.T), 4)}$ ✓ (holds for any σ).`; },
      }) },
    ],
    formulas: [h`C - P = S_0e^{-qT} - Ke^{-rT}`, h`(S_0 - Ke^{-rT})^+\le C\le S_0`, h`(Ke^{-rT} - S_0)^+\le P\le Ke^{-rT}`],
    problems: [
      () => { const S = R.int(80, 120), K = R.int(90, 110), r = R.pick([0.02, 0.05]), T = R.pick([0.5, 1]), C0 = R.pick([5, 8, 10, 12]); const P = C0 - S + K * Math.exp(-r * T); if (P <= 0) return { q: h`$S = 100$, $K = 100$, $r = 5\%$, $T = 1$, call = 10.45. Put price by parity?`, a: 10.45 - 100 + 100 * Math.exp(-0.05), tol: 0.005, sol: h`$10.45 - 100 + 100e^{-0.05}$` }; return { q: h`$S = ${S}$, $K = ${K}$, $r = ${r}$, $T = ${T}$, call = ${C0}. Put price by parity?`, a: P, tol: 0.005, sol: h`$P = C - S + Ke^{-rT} = ${fx(P, 4)}$` }; },
      () => { const S = R.int(100, 130), K = R.int(80, 100), r = 0.05, T = 1; return { q: h`$S = ${S}$, $K = ${K}$, $r = 5\%$, $T = 1$. Lower bound for the European call?`, a: Math.max(S - K * Math.exp(-r * T), 0), tol: 0.005, sol: h`$S - Ke^{-rT} = ${fx(S - K * Math.exp(-r * T), 4)}$` }; },
      () => ({ q: h`Should an American call on a non-dividend-paying stock ever be exercised early?`, choices: ['Never', 'When deep in the money', 'Just before expiry', 'When volatility is low'], a: 0, sol: h`Its value is at least $S - Ke^{-rT} > S - K$, so selling always beats exercising.` }),
      () => { const S = 100, K = 100, r = 0.03, T = 1, C0 = R.pick([6, 7]), Pq = R.pick([2, 3, 6]); const fair = C0 - S + K * Math.exp(-r * T); return { q: h`$S = K = 100$, $r = 3\%$, $T = 1$, call ${C0}, put quoted ${Pq}. Arbitrage profit per unit (today's money)?`, a: Math.abs(Pq - fair), tol: 0.005, sol: h`Parity put $= ${fx(fair, 4)}$, mispricing $${fx(Math.abs(Pq - fair), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-binomial', title: 'One-period binomial model & risk-neutral pricing', minutes: 16,
    summary: 'Replicate an option with stock and bond. The replication cost defines risk-neutral probabilities under which prices are discounted expectations.',
    sections: [
      h`<p>The stock moves from $S$ to $uS$ or $dS$ with $d < e^{r\Delta t} < u$ (otherwise there is an arbitrage). Find $\Delta$ shares and bond $B$ replicating the option payoffs $V_u, V_d$:</p>
      $$\Delta = \frac{V_u - V_d}{uS - dS},\qquad V_0 = \Delta S + B = e^{-r\Delta t}\left[qV_u + (1-q)V_d\right],\quad q = \frac{e^{r\Delta t} - d}{u-d}$$
      <p>The real-world probability of an up-move <b>never appears</b>. $q$ is the <b>risk-neutral probability</b>: under $\mathbb Q$ the stock earns the risk-free rate, and every price is a discounted $\mathbb Q$-expectation. This is the first fundamental theorem of asset pricing in miniature: no arbitrage ⇔ a risk-neutral measure exists. Completeness (replicability) ⇔ it is unique.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Replicating a call in one step', height: 280,
        params: [{ id: 'u', label: 'u', min: 1.01, max: 1.6, step: 0.01, value: 1.2 }, { id: 'd', label: 'd', min: 0.5, max: 0.99, step: 0.01, value: 0.85 }, { id: 'r', label: 'r per period', min: 0, max: 0.1, step: 0.0025, value: 0.02, fmt: v => MF.pct(v, 2) }, { id: 'K', label: 'strike K', min: 70, max: 130, step: 1, value: 100 }],
        draw(g, p) {
          g.noPad(); const S = 100, Su = S * p.u, Sd = S * p.d, Vu = Math.max(Su - p.K, 0), Vd = Math.max(Sd - p.K, 0), R0 = Math.exp(p.r);
          const q = (R0 - p.d) / (p.u - p.d), V = (q * Vu + (1 - q) * Vd) / R0;
          const X0 = 90, X1 = g.W - 140, Ym = g.H / 2, c = g.ctx;
          c.strokeStyle = C.axis; c.lineWidth = 2; c.beginPath(); c.moveTo(X0, Ym); c.lineTo(X1, 50); c.moveTo(X0, Ym); c.lineTo(X1, g.H - 50); c.stroke();
          const node = (x, y, a, b, col) => { c.fillStyle = '#141b29'; c.strokeStyle = col; c.beginPath(); c.roundRect ? c.roundRect(x - 60, y - 24, 120, 48, 10) : c.rect(x - 60, y - 24, 120, 48); c.fill(); c.stroke(); g.ptext(a, x, y - 9, { mono: true, size: 12 }); g.ptext(b, x, y + 10, { mono: true, size: 12, color: col }); };
          node(X0, Ym, `S = ${S}`, `V = ${fx(V, 3)}`, C.speed); node(X1, 50, `uS = ${fx(Su, 1)}`, `V_u = ${fx(Vu, 2)}`, C.fe); node(X1, g.H - 50, `dS = ${fx(Sd, 1)}`, `V_d = ${fx(Vd, 2)}`, C.fe);
          g.ptext(`q = ${fx(q, 3)}`, (X0 + X1) / 2, Ym - 70, { color: C.good, size: 13 }); g.ptext(`1 − q = ${fx(1 - q, 3)}`, (X0 + X1) / 2, Ym + 70, { color: C.good, size: 13 });
        },
        info: p => { const S = 100, R0 = Math.exp(p.r); if (!(p.d < R0 && R0 < p.u)) return '<b style="color:var(--bad)">Arbitrage!</b> Need d < e^{r} < u.'; const Vu = Math.max(S * p.u - p.K, 0), Vd = Math.max(S * p.d - p.K, 0), D = (Vu - Vd) / (S * (p.u - p.d)), B = (Vu - D * S * p.u) / R0; return h`Replicating portfolio: $\Delta = ${fx(D, 4)}$ shares and $B = ${fx(B, 3)}$ in bonds. Cost $\Delta S + B = ${fx(D * S + B, 4)}$ = risk-neutral price ✓`; },
      }) },
    ],
    formulas: [h`q = \frac{e^{r\Delta t} - d}{u - d}`, h`\Delta = \frac{V_u - V_d}{(u-d)S}`, h`V_0 = e^{-r\Delta t}\left[qV_u + (1-q)V_d\right]`, h`V_t = E^{\mathbb Q}\left[e^{-r(T-t)}V_T\mid\mathcal F_t\right]`],
    problems: [
      () => { const u = R.pick([1.1, 1.2, 1.25]), d = R.pick([0.8, 0.9]), r = R.pick([0, 0.02, 0.05]); return { q: h`$u = ${u}$, $d = ${d}$, $e^{r\Delta t} = ${fx(Math.exp(r), 4)}$. Risk-neutral $q$?`, a: (Math.exp(r) - d) / (u - d), tol: 1e-3, sol: h`$\frac{${fx(Math.exp(r), 4)} - ${d}}{${u} - ${d}} = ${fx((Math.exp(r) - d) / (u - d), 4)}$` }; },
      () => { const u = 1.2, d = 0.8, K = R.pick([90, 100, 110]), r = 0; const q = 0.5, V = q * Math.max(120 - K, 0) + (1 - q) * Math.max(80 - K, 0); return { q: h`$S = 100$, $u = 1.2$, $d = 0.8$, $r = 0$. One-period call price, $K = ${K}$?`, a: V, tol: 1e-3, sol: h`$q = 0.5$: $0.5\cdot${Math.max(120 - K, 0)} + 0.5\cdot${Math.max(80 - K, 0)} = ${V}$` }; },
      () => { const K = R.pick([90, 100, 110]); const Vu = Math.max(120 - K, 0), Vd = Math.max(80 - K, 0); return { q: h`$S = 100$, $uS = 120$, $dS = 80$. Delta of a call with $K = ${K}$?`, a: (Vu - Vd) / 40, tol: 1e-4, sol: h`$\frac{${Vu} - ${Vd}}{120 - 80} = ${fx((Vu - Vd) / 40, 4)}$` }; },
      () => { const K = R.pick([95, 100, 105]), r = 0.03, u = 1.15, d = 0.9; const R0 = Math.exp(r), q = (R0 - d) / (u - d), V = (q * Math.max(K - 100 * u, 0) + (1 - q) * Math.max(K - 100 * d, 0)) / R0; return { q: h`$S = 100$, $u = 1.15$, $d = 0.9$, $r = 3\%$ (continuous, one period). Put price, $K = ${K}$?`, a: V, tol: 1e-3, sol: h`$q = ${fx(q, 4)}$, $V = e^{-0.03}[q\,V_u + (1-q)V_d] = ${fx(V, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-crr', title: 'Multi-period trees, American options & convergence', minutes: 16,
    summary: 'The Cox–Ross–Rubinstein tree: backward induction, early exercise for American options, and convergence to Black–Scholes.',
    sections: [
      h`<p>CRR chooses $u = e^{\sigma\sqrt{\Delta t}}$, $d = 1/u$ so that the tree's variance matches volatility $\sigma$. Price by <b>backward induction</b>: start with payoffs at $T$, then step back:</p>
      $$V_{i,j} = e^{-r\Delta t}\left[qV_{i+1,j+1} + (1-q)V_{i+1,j}\right]$$
      <p>For <b>American</b> options, at every node take $\max(\text{continuation}, \text{exercise value})$. The exercise region of an American put is a boundary $S^*(t)$ below which you exercise immediately.</p>
      <p>As $n\to\infty$ the European price converges to Black–Scholes. By the CLT, the sum of many $\pm\sigma\sqrt{\Delta t}$ log-steps becomes normal. The convergence oscillates (odd/even $n$), which is why practitioners average neighbouring $n$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'CRR price vs number of steps', height: 300,
        params: [{ id: 'K', label: 'strike', min: 80, max: 120, step: 1, value: 100 }, { id: 's', label: 'σ', min: 0.05, max: 0.6, step: 0.01, value: 0.25, fmt: v => MF.pct(v, 0) }, { id: 'r', label: 'r', min: 0, max: 0.1, step: 0.0025, value: 0.05, fmt: v => MF.pct(v, 2) }, { id: 'type', label: 'option', type: 'select', value: 'put', options: [['call', 'European call'], ['put', 'European put'], ['aput', 'American put']] }],
        draw(g, p) {
          const ty = p.type === 'call' ? 'call' : 'put', am = p.type === 'aput', N = 120;
          const vals = []; for (let n = 1; n <= N; n++) vals.push([n, MF.crr(100, p.K, 1, p.r, p.s, n, ty, am)]);
          const bs = M.bs(100, p.K, 1, p.r, p.s, ty), ys = vals.slice(3).map(v => v[1]);
          g.view(0, N, Math.min(...ys, bs) * 0.97, Math.max(...ys, bs) * 1.03).axes({ xlabel: 'steps n' });
          g.hline(bs, { color: C.speed, dash: [6, 4], width: 2 }); g.path(vals, { color: C.fe, width: 1.5 });
        },
        info: p => { const ty = p.type === 'call' ? 'call' : 'put', am = p.type === 'aput'; const v = MF.crr(100, p.K, 1, p.r, p.s, 500, ty, am), bs = M.bs(100, p.K, 1, p.r, p.s, ty); return h`n = 500: <b>${fx(v, 4)}</b>; Black–Scholes European ${ty}: ${fx(bs, 4)}${am ? h`. The difference ${fx(v - bs, 4)} is the <b>early-exercise premium</b>.` : '.'}`; },
      }) },
    ],
    formulas: [h`u = e^{\sigma\sqrt{\Delta t}},\ d = 1/u,\ q = \frac{e^{r\Delta t}-d}{u-d}`, h`V_{i,j} = \max\left(\text{payoff}(S_{i,j}),\ e^{-r\Delta t}[qV_{i+1,j+1}+(1-q)V_{i+1,j}]\right)`, h`V_0 = e^{-rT}\sum_{j=0}^n\binom nj q^j(1-q)^{n-j}\,\text{payoff}(Su^jd^{n-j})`],
    problems: [
      () => { const s = R.pick([0.2, 0.3]), n = R.pick([4, 12, 52]); const dt = 1 / n; return { q: h`CRR with $\sigma = ${s}$, $T = 1$, $n = ${n}$ steps. Up factor $u$?`, a: Math.exp(s * Math.sqrt(dt)), tol: 1e-4, sol: h`$e^{${s}\sqrt{1/${n}}} = ${fx(Math.exp(s * Math.sqrt(dt)), 5)}$` }; },
      () => { const K = R.pick([95, 100, 105]); const v = MF.crr(100, K, 1, 0.05, 0.2, 2, 'call', false); return { q: h`2-step CRR: $S = 100$, $K = ${K}$, $T = 1$, $r = 5\%$, $\sigma = 20\%$. European call price?`, a: v, tol: 0.005, sol: h`$u = e^{0.2\sqrt{0.5}}$, backward induction → $${fx(v, 4)}$` }; },
      () => { const K = R.pick([100, 105, 110]); const v = MF.crr(100, K, 1, 0.05, 0.2, 2, 'put', true); return { q: h`2-step CRR: $S = 100$, $K = ${K}$, $T = 1$, $r = 5\%$, $\sigma = 20\%$. <b>American</b> put price?`, a: v, tol: 0.005, sol: h`Check early exercise at each node → $${fx(v, 4)}$` }; },
    ],
  });
})();
