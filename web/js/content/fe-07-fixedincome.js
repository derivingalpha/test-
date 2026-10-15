/* FE Math · Unit 7: fixed income */
(function () {
  'use strict';
  const { h, R, M, fx, fmt, colors: C } = MF;

  MF.unit('fe', 'fe-u7', 'Fixed Income Mathematics', 'Bond pricing, yield, duration and convexity, spot and forward rates, bootstrapping.');

  MF.lesson({
    id: 'fe-bonds', title: 'Bond pricing & yield to maturity', minutes: 15,
    summary: 'A bond is a sum of discounted cash flows. Yield to maturity is the single rate that reprices it, found by root-finding.',
    sections: [
      h`<p>A bond with face $F$, annual coupon rate $c$, paid $m$ times a year for $n$ years, priced at yield $y$:</p>
      $$P = \sum_{k=1}^{nm}\frac{cF/m}{(1+y/m)^k} + \frac{F}{(1+y/m)^{nm}}$$
      <p>Facts that fall out of the formula:</p>
      <ul><li>Price and yield move <b>inversely</b>, and the curve is <b>convex</b>.</li>
      <li>$c = y$ means the bond prices at <b>par</b>; $c>y$ is a premium and $c<y$ a discount.</li>
      <li>Longer maturity means more price sensitivity to yield.</li>
      <li>As maturity approaches, price is "pulled to par".</li></ul>
      <p>The <b>yield to maturity</b> is the IRR of the bond's cash flows. Given a market price there's no closed form, so it is solved numerically.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Price–yield curve', height: 300,
        params: [{ id: 'c', label: 'coupon rate', min: 0, max: 0.12, step: 0.0025, value: 0.05, fmt: v => MF.pct(v, 2) }, { id: 'n', label: 'maturity (y)', min: 1, max: 30, step: 1, value: 10, fmt: v => v }, { id: 'y', label: 'yield', min: 0.001, max: 0.15, step: 0.001, value: 0.06, fmt: v => MF.pct(v, 1) }],
        draw(g, p) {
          const P = y => M.bondPrice(100, p.c, y, p.n, 2);
          g.view(0, 0.15, 0, Math.max(P(0.001), 110) * 1.05).axes({ xlabel: 'yield', fx: v => MF.pct(v, 0) });
          g.hline(100, { color: C.dim }); g.fn(P, { color: C.fe, width: 2.5, from: 0.001 });
          g.vline(p.c, { color: C.dim }); g.dot(p.y, P(p.y), { color: C.speed, r: 6 });
          const D = -(P(p.y + 1e-4) - P(p.y - 1e-4)) / 2e-4; g.fn(y => P(p.y) - D * (y - p.y), { color: C.speed, width: 1, dash: [5, 4] });
        },
        info: p => { const P = M.bondPrice(100, p.c, p.y, p.n, 2); return h`Semi-annual coupons. Price = <b>${fx(P, 3)}</b> per 100 face (${P > 100.0001 ? 'premium' : P < 99.9999 ? 'discount' : 'par'}). The dashed tangent is the duration approximation; the gap to the curve is convexity.`; },
      }) },
    ],
    formulas: [h`P = \sum_{k=1}^{N}\frac{C}{(1+i)^k} + \frac{F}{(1+i)^N}`, h`P = C\,\frac{1-(1+i)^{-N}}{i} + F(1+i)^{-N}`, h`c = y \iff P = F`],
    problems: [
      () => { const c = R.pick([0.03, 0.04, 0.05, 0.06]), y = R.pick([0.02, 0.04, 0.05, 0.07]), n = R.int(2, 15); return { q: h`Annual-pay bond: face 100, coupon ${fx(c * 100, 4)}%, ${n} years, yield ${fx(y * 100, 4)}%. Price?`, a: M.bondPrice(100, c, y, n, 1), tol: 0.01, sol: h`$${fx(c * 100, 2)}\cdot\frac{1-(1+${y})^{-${n}}}{${y}} + 100(1+${y})^{-${n}} = ${fx(M.bondPrice(100, c, y, n, 1), 3)}$` }; },
      () => { const c = R.pick([0.04, 0.06]), n = R.int(3, 10), y = R.pick([0.03, 0.05, 0.07]); const P = M.round(M.bondPrice(100, c, y, n, 1), 2); return { q: h`Annual-pay bond, coupon ${fx(c * 100, 4)}%, ${n} years, price ${P}. YTM in %?`, a: 100 * M.bondYield(P, 100, c, n, 1), tol: 0.01, unit: '%', sol: h`Solve $P(y) = ${P}$ numerically: $y \approx ${fx(100 * M.bondYield(P, 100, c, n, 1), 3)}\%$` }; },
      () => { const c = R.pick([0.02, 0.05, 0.08]), y = R.pick([0.03, 0.05, 0.07]); return { q: h`Coupon ${fx(c * 100, 4)}%, yield ${fx(y * 100, 4)}%. The bond trades at…`, choices: ['a premium (above par)', 'par', 'a discount (below par)'], a: c > y ? 0 : c === y ? 1 : 2, sol: 'Coupon above yield means a premium, equal means par, below means a discount.' }; },
      () => { const n = R.int(1, 10), y = R.pick([0.03, 0.04, 0.05]); return { q: h`Zero-coupon bond, face 100, ${n} years, yield ${fx(y * 100, 4)}% (semi-annual compounding). Price?`, a: 100 / Math.pow(1 + y / 2, 2 * n), tol: 0.01, sol: h`$100/(1 + ${y}/2)^{${2 * n}} = ${fx(100 / Math.pow(1 + y / 2, 2 * n), 3)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-duration', title: 'Duration & convexity', minutes: 16,
    summary: 'Duration is the price sensitivity to yield (first derivative); convexity is the curvature (second derivative). Together they form a Taylor expansion.',
    sections: [
      h`<p><b>Macaulay duration</b> is the present-value-weighted average time of the cash flows: $D_{Mac} = \frac{1}{P}\sum t_k\,\text{PV}(CF_k)$. <b>Modified duration</b> $D_{mod} = \frac{D_{Mac}}{1+y/m} = -\frac{1}{P}\frac{dP}{dy}$.</p>
      <p><b>Convexity</b> $\mathcal C = \frac{1}{P}\frac{d^2P}{dy^2}$. Second-order Taylor expansion:</p>
      $$\frac{\Delta P}{P}\approx -D_{mod}\,\Delta y + \tfrac12\,\mathcal C\,(\Delta y)^2$$
      <ul><li>A zero-coupon bond's Macaulay duration equals its maturity.</li><li><b>DV01</b> (price value of a basis point) $= D_{mod}\cdot P\cdot 0.0001$.</li>
      <li>Positive convexity helps on both sides: price rises more than duration predicts when yields fall, and falls less when they rise.</li>
      <li><b>Immunisation:</b> match the durations (and convexities) of assets and liabilities.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Exact price change vs duration and duration + convexity', height: 300,
        params: [{ id: 'c', label: 'coupon', min: 0, max: 0.1, step: 0.005, value: 0.04, fmt: v => MF.pct(v, 1) }, { id: 'n', label: 'maturity', min: 1, max: 30, step: 1, value: 20, fmt: v => v }, { id: 'y', label: 'yield', min: 0.01, max: 0.1, step: 0.0025, value: 0.05, fmt: v => MF.pct(v, 2) }],
        draw(g, p) {
          const P = y => M.bondPrice(100, p.c, y, p.n, 1), P0 = P(p.y), e = 1e-4;
          const d1 = (P(p.y + e) - P(p.y - e)) / (2 * e), d2 = (P(p.y + e) - 2 * P0 + P(p.y - e)) / (e * e);
          g.view(-0.03, 0.03, -40, 50).axes({ xlabel: 'Δy', ylabel: 'ΔP/P %', fx: v => fx(v * 1e4, 0) + 'bp' });
          g.fn(dy => 100 * (P(p.y + dy) - P0) / P0, { color: C.fe, width: 3 });
          g.fn(dy => 100 * d1 * dy / P0, { color: C.speed, width: 1.5, dash: [6, 4] });
          g.fn(dy => 100 * (d1 * dy + 0.5 * d2 * dy * dy) / P0, { color: C.pink, width: 1.5, dash: [2, 3] });
          g.legend([['exact', C.fe], ['duration only', C.speed], ['+ convexity', C.pink]], { x: g.W - 150 });
        },
        info: p => { const P = y => M.bondPrice(100, p.c, y, p.n, 1), P0 = P(p.y), e = 1e-4, d1 = (P(p.y + e) - P(p.y - e)) / (2 * e), d2 = (P(p.y + e) - 2 * P0 + P(p.y - e)) / (e * e); return h`$D_{Mac} = ${fx(M.macaulay(100, p.c, p.y, p.n, 1), 3)}$, $D_{mod} = ${fx(-d1 / P0, 3)}$, convexity $= ${fx(d2 / P0, 1)}$, DV01 $= ${fx(-d1 * 1e-4, 4)}$ per 100.`; },
      }) },
    ],
    formulas: [h`D_{Mac} = \frac{1}{P}\sum_k t_k\frac{CF_k}{(1+y)^{t_k}}`, h`D_{mod} = \frac{D_{Mac}}{1+y/m} = -\frac1P\frac{dP}{dy}`, h`\mathcal C = \frac1P\frac{d^2P}{dy^2}`, h`\frac{\Delta P}{P}\approx -D_{mod}\Delta y + \tfrac12\mathcal C(\Delta y)^2`, h`\text{DV01} = D_{mod}\,P\times10^{-4}`],
    problems: [
      () => { const n = R.int(2, 6), y = R.pick([0.04, 0.05, 0.06]), c = R.pick([0.04, 0.05, 0.06]); return { q: h`Annual bond: coupon ${fx(c * 100, 4)}%, ${n} years, yield ${fx(y * 100, 4)}%. Macaulay duration?`, a: M.macaulay(100, c, y, n, 1), tol: 0.005, sol: h`PV-weighted average time = ${fx(M.macaulay(100, c, y, n, 1), 4)} years` }; },
      () => { const Dm = R.pick([4, 6.5, 8, 12]), Cv = R.pick([30, 60, 120, 200]), dy = R.pick([0.01, -0.01, 0.005, 0.02]); const v = -Dm * dy + 0.5 * Cv * dy * dy; return { q: h`$D_{mod} = ${Dm}$, convexity ${Cv}. Approximate % price change for $\Delta y = ${dy * 1e4}$bp?`, a: 100 * v, tol: 0.005, unit: '%', sol: h`$-${Dm}(${dy}) + \tfrac12(${Cv})(${dy})^2 = ${fx(100 * v, 4)}\%$` }; },
      () => { const T = R.int(2, 30); return { q: h`Macaulay duration of a ${T}-year zero-coupon bond?`, a: T, sol: 'All the value sits at maturity.' }; },
      () => { const Dm = R.pick([5, 7.2, 9]), P = R.pick([98, 101.5, 105]), N = R.pick([1e6, 1e7]); return { q: h`$D_{mod} = ${Dm}$, price ${P} per 100, position ${fmt(N, 0)} face. DV01 of the position?`, a: Dm * P / 100 * N * 1e-4, rtol: 1e-3, sol: h`$${Dm}\times${P / 100}\times${fmt(N, 0)}\times10^{-4} = ${fmt(Dm * P / 100 * N * 1e-4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-termstructure', title: 'Spot rates, forward rates & bootstrapping', minutes: 16,
    summary: 'The yield curve: zero rates for each maturity, forward rates implied between them, and bootstrapping zeros from coupon bonds.',
    sections: [
      h`<p>Each maturity $t$ has its own <b>spot (zero) rate</b> $z(t)$, with discount factor $D(t) = e^{-z(t)t}$ (continuous) or $(1+z_t)^{-t}$. Price any bond by discounting each cash flow at its own rate: $P = \sum CF_k D(t_k)$.</p>
      <p><b>Forward rates</b> are rates locked in today for borrowing between $t_1$ and $t_2$. No arbitrage forces:</p>
      $$e^{z_2t_2} = e^{z_1t_1}e^{f_{12}(t_2-t_1)} \Rightarrow f_{12} = \frac{z_2t_2 - z_1t_1}{t_2-t_1}$$
      <p>The instantaneous forward is $f(t) = z(t) + t\,z'(t)$: forwards lie above spot rates when the curve slopes up.</p>
      <p><b>Bootstrapping</b>: from par/coupon bonds of increasing maturity, solve one discount factor at a time. A 1y zero gives $D(1)$; then the 2y bond $P_2 = cD(1) + (1+c)D(2)$ gives $D(2)$, and so on.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Zero curve and its instantaneous forward curve', height: 300,
        params: [{ id: 'b0', label: 'long rate β₀', min: 0.01, max: 0.08, step: 0.001, value: 0.05, fmt: v => MF.pct(v, 1) }, { id: 'b1', label: 'short − long β₁', min: -0.04, max: 0.04, step: 0.001, value: -0.02, fmt: v => MF.pct(v, 1) }, { id: 'b2', label: 'hump β₂', min: -0.05, max: 0.05, step: 0.001, value: 0.01, fmt: v => MF.pct(v, 1) }, { id: 'tau', label: 'decay τ', min: 0.5, max: 6, step: 0.1, value: 2 }],
        draw(g, p) {
          const z = t => { const x = t / p.tau, a = (1 - Math.exp(-x)) / x; return p.b0 + p.b1 * a + p.b2 * (a - Math.exp(-x)); };
          const f = t => p.b0 + p.b1 * Math.exp(-t / p.tau) + p.b2 * (t / p.tau) * Math.exp(-t / p.tau);
          g.view(0, 30, 0, 0.1).axes({ xlabel: 'maturity', fy: v => MF.pct(v, 0) });
          g.fn(z, { color: C.fe, width: 2.5, from: 0.05 }); g.fn(f, { color: C.speed, width: 2, dash: [6, 4], from: 0.05 });
          g.legend([['zero rate z(t)', C.fe], ['forward f(t)', C.speed]], { x: g.W - 150 });
        },
        info: () => h`Nelson–Siegel parameterisation: $z(t) = \beta_0 + \beta_1\frac{1-e^{-t/\tau}}{t/\tau} + \beta_2\left(\frac{1-e^{-t/\tau}}{t/\tau} - e^{-t/\tau}\right)$. The forward curve crosses the zero curve at the zero curve's peak or trough.`,
      }) },
    ],
    formulas: [h`D(t) = e^{-z(t)\,t}`, h`f_{12} = \frac{z_2t_2 - z_1t_1}{t_2 - t_1}`, h`(1+z_2)^2 = (1+z_1)(1+f_{1,2})`, h`f(t) = z(t) + t\,z'(t) = -\frac{\partial\ln D(t)}{\partial t}`],
    problems: [
      () => { const z1 = R.pick([0.02, 0.03, 0.04]), z2 = z1 + R.pick([0.005, 0.01, -0.005]); const f = (1 + z2) ** 2 / (1 + z1) - 1; return { q: h`1y spot ${fx(z1 * 100, 2)}%, 2y spot ${fx(z2 * 100, 2)}% (annual comp.). 1y→2y forward rate in %?`, a: 100 * f, tol: 0.005, unit: '%', sol: h`$\frac{(1+${fx(z2, 4)})^2}{1+${z1}} - 1 = ${fx(100 * f, 4)}\%$` }; },
      () => { const z1 = R.pick([0.02, 0.03]), t1 = R.int(1, 3), t2 = t1 + R.int(1, 5), z2 = z1 + R.pick([0.005, 0.01, 0.015]); const f = (z2 * t2 - z1 * t1) / (t2 - t1); return { q: h`Continuous zeros: $z(${t1}) = ${z1}$, $z(${t2}) = ${fx(z2, 3)}$. Forward rate between them (as a decimal)?`, a: f, tol: 1e-5, sol: h`$\frac{${fx(z2, 3)}\cdot${t2} - ${z1}\cdot${t1}}{${t2 - t1}} = ${fx(f, 5)}$` }; },
      () => { const c = R.pick([0.04, 0.05, 0.06]), D1 = M.round(R.float(0.95, 0.98), 4), P2 = 100; const D2 = (P2 - 100 * c * D1) / (100 * (1 + c)); return { q: h`$D(1) = ${D1}$. A 2y annual ${fx(c * 100, 4)}% coupon bond trades at par (100). Bootstrap $D(2)$.`, a: D2, tol: 1e-5, sol: h`$100 = ${100 * c}\cdot${D1} + ${100 + 100 * c}D(2)$ → $D(2) = ${fx(D2, 5)}$` }; },
      () => { const z = [0.03, 0.035, 0.04].map(x => x + R.pick([0, 0.005])), c = R.pick([0.04, 0.05]); const P = 100 * c / (1 + z[0]) + 100 * c / (1 + z[1]) ** 2 + 100 * (1 + c) / (1 + z[2]) ** 3; return { q: h`Spot rates 1y/2y/3y: ${z.map(x => fx(x * 100, 1) + '%').join(', ')}. Price of a 3y annual ${fx(c * 100, 4)}% bond?`, a: P, tol: 0.01, sol: h`Discount each flow at its own spot rate: $${fx(P, 3)}$` }; },
    ],
  });
})();
