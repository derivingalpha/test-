/* FE Math · Unit 2: time value of money */
(function () {
  'use strict';
  const { h, R, M, fx, fmt, colors: C } = MF;

  MF.unit('fe', 'fe-u2', 'Time Value of Money', 'Interest, discounting, annuities, loans, NPV and IRR: pricing cash flows across time.');

  MF.lesson({
    id: 'fe-interest', title: 'Simple, compound & continuous interest', minutes: 12,
    summary: 'Simple interest grows linearly; compound interest grows exponentially; continuous compounding is the limit e^{rt}.',
    sections: [
      h`<ul><li><b>Simple:</b> $A = P(1 + rt)$. Interest is paid only on the principal.</li>
      <li><b>Compound, $m$ times a year:</b> $A = P\left(1+\frac rm\right)^{mt}$. Interest earns interest.</li>
      <li><b>Continuous:</b> $A = Pe^{rt}$, the $m\to\infty$ limit.</li></ul>
      <p>The <b>effective annual rate</b> (EAR) puts them on the same footing: $\text{EAR} = \left(1+\frac rm\right)^m - 1$, or $e^r - 1$ for continuous. A 12% rate compounded monthly is really 12.68% a year.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Growth of 100 under each convention', height: 300,
        params: [{ id: 'r', label: 'nominal rate r', min: 0.01, max: 0.3, step: 0.005, value: 0.1, fmt: v => MF.pct(v, 1) }, { id: 'm', label: 'compounding per year m', min: 1, max: 12, step: 1, value: 1, fmt: v => v }, { id: 'T', label: 'years', min: 1, max: 40, step: 1, value: 20, fmt: v => v }],
        draw(g, p) {
          const top = 100 * Math.exp(p.r * p.T) * 1.08;
          g.view(0, p.T, 0, top).axes({ xlabel: 'years' });
          g.fn(t => 100 * (1 + p.r * t), { color: C.muted, width: 2 });
          g.fn(t => 100 * Math.pow(1 + p.r / p.m, p.m * t), { color: C.fe, width: 2.5 });
          g.fn(t => 100 * Math.exp(p.r * t), { color: C.speed, width: 2, dash: [6, 4] });
          g.legend([['simple', C.muted], [`compound m=${p.m}`, C.fe], ['continuous', C.speed]], { x: 60 });
        },
        info: p => h`After ${p.T}y: simple ${fmt(100 * (1 + p.r * p.T))}, compound ${fmt(100 * Math.pow(1 + p.r / p.m, p.m * p.T))}, continuous ${fmt(100 * Math.exp(p.r * p.T))}. EAR $= ${fx(100 * (Math.pow(1 + p.r / p.m, p.m) - 1), 3)}\%$`,
      }) },
    ],
    formulas: [h`A = P(1+rt)`, h`A = P\left(1+\tfrac{r}{m}\right)^{mt}`, h`A = Pe^{rt}`, h`\text{EAR} = \left(1+\tfrac rm\right)^m - 1`],
    problems: [
      () => { const P = R.pick([1000, 2500, 5000, 10000]), r = R.pick([0.04, 0.05, 0.06, 0.08]), t = R.int(2, 15); return { q: h`${P} at ${r * 100}% compounded annually for ${t} years. Final amount?`, a: P * Math.pow(1 + r, t), rtol: 1e-3, sol: h`$${P}(1+${r})^{${t}} = ${fmt(P * Math.pow(1 + r, t))}$` }; },
      () => { const r = R.pick([0.06, 0.08, 0.1, 0.12, 0.18]), m = R.pick([2, 4, 12, 365]); return { q: h`EAR of ${r * 100}% compounded ${{ 2: 'semi-annually', 4: 'quarterly', 12: 'monthly', 365: 'daily' }[m]}? (in %)`, a: 100 * (Math.pow(1 + r / m, m) - 1), tol: 0.01, unit: '%', sol: h`$(1 + ${r}/${m})^{${m}} - 1 = ${fx(100 * (Math.pow(1 + r / m, m) - 1), 3)}\%$` }; },
      () => { const P = R.pick([100, 1000]), r = R.pick([0.03, 0.05, 0.07]), t = R.int(1, 10); return { q: h`${P} continuously compounded at ${r * 100}% for ${t} years?`, a: P * Math.exp(r * t), rtol: 1e-3, sol: h`$${P}e^{${fx(r * t, 2)}} = ${fmt(P * Math.exp(r * t))}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-pv', title: 'Present value & discounting', minutes: 12,
    summary: 'A unit of money tomorrow is worth less than one today. Discount factors convert future cash into present value.',
    sections: [
      h`<p>If 1 today grows to $(1+r)^t$, then $X$ received at time $t$ is worth $\text{PV} = \frac{X}{(1+r)^t}$ today. The <b>discount factor</b> $D(t) = (1+r)^{-t}$ (or $e^{-rt}$ continuously) is the price today of 1 paid at $t$. It's the most fundamental object in all of pricing.</p>
      <p>A stream of cash flows $C_1,\dots,C_n$ has $\text{PV} = \sum_t C_t D(t)$. Pricing is just <b>linear</b>: value each cash flow and add.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Discount factor curve', height: 280,
        params: [{ id: 'r', label: 'rate r', min: 0, max: 0.2, step: 0.005, value: 0.06, fmt: v => MF.pct(v, 1) }, { id: 't', label: 'payment time t', min: 0, max: 30, step: 0.5, value: 10 }],
        draw(g, p) {
          g.view(0, 30, 0, 1.05).axes({ xlabel: 'years', ylabel: 'D(t)' });
          g.area(t => Math.pow(1 + p.r, -t), 0, p.t, { color: C.alpha(C.fe, 0.12) });
          g.fn(t => Math.pow(1 + p.r, -t), { color: C.fe, width: 2.5 });
          g.fn(t => Math.exp(-p.r * t), { color: C.speed, dash: [5, 4] });
          g.vline(p.t); g.dot(p.t, Math.pow(1 + p.r, -p.t), { color: C.good, r: 6 });
          g.legend([['(1+r)^{-t}', C.fe], ['e^{-rt}', C.speed]], { x: g.W - 140 });
        },
        info: p => h`$D(${p.t}) = (1+${fx(p.r, 3)})^{-${p.t}} = ${fx(Math.pow(1 + p.r, -p.t), 5)}$. So 100 at year ${p.t} is worth ${fmt(100 * Math.pow(1 + p.r, -p.t))} today.`,
      }) },
    ],
    formulas: [h`\text{PV} = \frac{X}{(1+r)^t} = X\,D(t)`, h`\text{PV} = \sum_t C_t\,D(t)`, h`D(t) = e^{-rt}\ \text{(continuous)}`],
    problems: [
      () => { const X = R.pick([1000, 5000, 10000]), r = R.pick([0.03, 0.05, 0.07, 0.1]), t = R.int(1, 20); return { q: h`PV of ${X} received in ${t} years at ${r * 100}%?`, a: X / Math.pow(1 + r, t), rtol: 1e-3, sol: h`$\frac{${X}}{(1+${r})^{${t}}} = ${fmt(X / Math.pow(1 + r, t))}$` }; },
      () => { const r = R.pick([0.04, 0.05, 0.06]), cfs = [R.int(50, 200), R.int(50, 200), R.int(500, 1200)]; const pv = cfs.reduce((s, c, i) => s + c / Math.pow(1 + r, i + 1), 0); return { q: h`Cash flows ${cfs.join(', ')} at years 1, 2, 3. PV at ${r * 100}%?`, a: pv, rtol: 1e-3, sol: h`$\sum C_t/(1+r)^t = ${fmt(pv)}$` }; },
      () => { const X = R.pick([100, 1000]), P = M.round(X * R.float(0.5, 0.95), 2), t = R.int(2, 10); const r = Math.pow(X / P, 1 / t) - 1; return { q: h`A zero-coupon bond pays ${X} in ${t} years and costs ${P}. Annual yield in %?`, a: 100 * r, tol: 0.01, unit: '%', sol: h`$(${X}/${P})^{1/${t}} - 1 = ${fx(100 * r, 3)}\%$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-annuities', title: 'Annuities, perpetuities & loans', minutes: 15,
    summary: 'Level payments summed with the geometric series: annuity formulas, mortgage payments and amortisation schedules.',
    sections: [
      h`<p>An <b>annuity</b> pays $C$ at the end of each of $n$ periods. Its PV is a finite geometric series:</p>
      $$\text{PV} = \sum_{k=1}^n \frac{C}{(1+r)^k} = C\,\frac{1-(1+r)^{-n}}{r}$$
      <p>Let $n\to\infty$ and you get a <b>perpetuity</b> worth $C/r$. A <b>growing perpetuity</b> (growth $g<r$) is worth $\frac{C}{r-g}$, which is the Gordon dividend model.</p>
      <p><b>Loans</b> invert the formula: to repay $P$ over $n$ periods, the payment is $C = \frac{P\,r}{1-(1+r)^{-n}}$. Each payment is part interest ($r\times$ balance) and part principal. Early payments are mostly interest.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Mortgage amortisation', height: 300,
        params: [{ id: 'P', label: 'loan', min: 50000, max: 1000000, step: 10000, value: 300000, fmt: v => fmt(v, 0) }, { id: 'r', label: 'annual rate', min: 0.01, max: 0.15, step: 0.0025, value: 0.06, fmt: v => MF.pct(v, 2) }, { id: 'yrs', label: 'term (years)', min: 5, max: 40, step: 1, value: 30, fmt: v => v }],
        draw(g, p) {
          const i = p.r / 12, n = p.yrs * 12, pay = M.payment(p.P, i, n);
          g.view(0, p.yrs, 0, pay * 12 * 1.1).axes({ xlabel: 'year', ylabel: 'per year', fy: v => fmt(v / 1000, 0) + 'k' });
          let bal = p.P;
          for (let y = 0; y < p.yrs; y++) { let I = 0, Pr = 0; for (let k = 0; k < 12; k++) { const it = bal * i; I += it; Pr += pay - it; bal -= pay - it; } g.rect(y + 0.05, 0, 0.9, I, { fill: C.alpha(C.speed, 0.7) }); g.rect(y + 0.05, I, 0.9, Pr, { fill: C.alpha(C.fe, 0.7) }); }
          g.legend([['interest', C.speed], ['principal', C.fe]], { x: g.W - 120 });
        },
        info: p => { const i = p.r / 12, n = p.yrs * 12, pay = M.payment(p.P, i, n); return h`Monthly payment $C = \frac{${fmt(p.P, 0)}\cdot ${fx(i, 5)}}{1-(1+${fx(i, 5)})^{-${n}}} = $ <b>${fmt(pay)}</b>. Total paid ${fmt(pay * n, 0)}, of which interest ${fmt(pay * n - p.P, 0)}.`; },
      }) },
    ],
    formulas: [h`\text{PV}_{\text{ann}} = C\,\frac{1-(1+r)^{-n}}{r}`, h`\text{FV}_{\text{ann}} = C\,\frac{(1+r)^n - 1}{r}`, h`\text{PV}_{\text{perp}} = \frac Cr,\qquad \text{PV}_{\text{grow}} = \frac{C}{r-g}`, h`C = \frac{P\,r}{1-(1+r)^{-n}}`],
    problems: [
      () => { const C0 = R.pick([100, 500, 1000]), r = R.pick([0.04, 0.05, 0.06, 0.08]), n = R.int(5, 30); return { q: h`PV of ${C0} per year for ${n} years at ${r * 100}%?`, a: M.annuityPV(C0, r, n), rtol: 1e-3, sol: h`$${C0}\cdot\frac{1-(1+${r})^{-${n}}}{${r}} = ${fmt(M.annuityPV(C0, r, n))}$` }; },
      () => { const P = R.pick([100000, 200000, 250000, 400000]), r = R.pick([0.03, 0.04, 0.05, 0.06, 0.07]), y = R.pick([15, 20, 25, 30]); const pay = M.payment(P, r / 12, y * 12); return { q: h`Monthly payment on ${fmt(P, 0)} over ${y} years at ${r * 100}% (monthly compounding)?`, a: pay, rtol: 1e-3, sol: h`$i = ${r}/12$, $n = ${y * 12}$ → $C = ${fmt(pay)}$` }; },
      () => { const D = R.pick([1, 2, 2.5, 3, 4]), r = R.pick([0.08, 0.09, 0.1, 0.12]), g = R.pick([0.02, 0.03, 0.04, 0.05]); return { q: h`Next year's dividend is ${D}, growing ${g * 100}% forever, discount rate ${r * 100}%. Price?`, a: D / (r - g), rtol: 1e-3, sol: h`$\frac{${D}}{${r} - ${g}} = ${fmt(D / (r - g))}$` }; },
      () => { const C0 = R.pick([100, 200, 500]), r = R.pick([0.05, 0.06, 0.07]), n = R.int(10, 40); return { q: h`Save ${C0} at the end of each year for ${n} years at ${r * 100}%. Future value?`, a: M.annuityFV(C0, r, n), rtol: 1e-3, sol: h`$${C0}\cdot\frac{(1+${r})^{${n}}-1}{${r}} = ${fmt(M.annuityFV(C0, r, n))}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-npv', title: 'NPV & IRR', minutes: 14,
    summary: 'Net present value prices a project; the internal rate of return is the discount rate that makes NPV zero, found as a root.',
    sections: [
      h`<p>For cash flows $C_0, C_1, \dots, C_n$ (usually $C_0<0$, the investment):</p>
      $$\text{NPV}(r) = \sum_{t=0}^n \frac{C_t}{(1+r)^t}$$
      <p>Accept if $\text{NPV}>0$. The <b>IRR</b> is the root $r^*$ with $\text{NPV}(r^*)=0$. There is generally no closed form, so you find it numerically by bisection or Newton's method. That's your first taste of <b>root finding</b>, which reappears in yields and implied volatility.</p>
      <div class="callout warn"><b>Watch out</b>When cash flows change sign more than once, NPV(r) can have several roots, and IRR becomes ambiguous. NPV is the more reliable criterion.</div>`,
      { viz: host => MF.explore(host, {
        title: 'NPV profile', height: 300,
        params: [{ id: 'c0', label: 'C₀ (investment)', min: -2000, max: -100, step: 50, value: -1000 }, { id: 'c1', label: 'C₁', min: 0, max: 800, step: 10, value: 300 }, { id: 'c2', label: 'C₂', min: 0, max: 800, step: 10, value: 400 }, { id: 'c3', label: 'C₃', min: -500, max: 800, step: 10, value: 500 }, { id: 'r', label: 'discount rate', min: 0, max: 0.5, step: 0.005, value: 0.08, fmt: v => MF.pct(v, 1) }],
        draw(g, p) {
          const cfs = [p.c0, p.c1, p.c2, p.c3]; const f = r => M.npv(r, cfs);
          const hi = Math.max(f(0), 50), lo = Math.min(f(0.5), -50);
          g.view(0, 0.5, lo * 1.1, hi * 1.1).axes({ xlabel: 'rate', fx: v => MF.pct(v, 0) });
          g.fn(f, { color: C.fe, width: 2.5 });
          g.vline(p.r); g.dot(p.r, f(p.r), { color: f(p.r) >= 0 ? C.good : C.bad, r: 6 });
          const irr = M.irr(cfs); if (Number.isFinite(irr) && irr <= 0.5 && irr >= 0) g.dot(irr, 0, { color: C.speed, r: 6, ring: C.text });
        },
        info: p => { const cfs = [p.c0, p.c1, p.c2, p.c3], irr = M.irr(cfs); return h`NPV at ${MF.pct(p.r, 1)} = <b>${fmt(M.npv(p.r, cfs))}</b>. IRR ${Number.isFinite(irr) ? '= <b>' + MF.pct(irr, 2) + '</b>' : 'not found in range'}.`; },
      }) },
    ],
    formulas: [h`\text{NPV}(r) = \sum_{t=0}^n C_t(1+r)^{-t}`, h`\text{NPV}(\text{IRR}) = 0`],
    problems: [
      () => { const c0 = -R.pick([1000, 2000, 5000]), r = R.pick([0.05, 0.08, 0.1]), cfs = [c0, ...Array.from({ length: 3 }, () => -c0 * R.float(0.25, 0.5, 2))]; return { q: h`Cash flows ${cfs.map(c => fmt(c)).join(', ')} at t = 0..3. NPV at ${r * 100}%?`, a: M.npv(r, cfs), tol: Math.max(0.5, Math.abs(M.npv(r, cfs)) * 0.002), sol: h`NPV = ${fmt(M.npv(r, cfs))}` }; },
      () => { const c0 = -R.pick([100, 1000]), r = R.pick([0.05, 0.1, 0.15, 0.2]); const c1 = -c0 * (1 + r); return { q: h`Invest ${-c0} today, receive ${fmt(c1)} in one year. IRR in %?`, a: r * 100, tol: 0.02, unit: '%', sol: h`$${fmt(c1)}/${-c0} - 1 = ${r * 100}\%$` }; },
      () => { const c0 = -R.pick([1000, 2000]), c = -c0 * R.float(0.3, 0.45, 2), n = 4; const cfs = [c0, c, c, c, c]; const irr = M.irr(cfs); return { q: h`Invest ${-c0}, receive ${fmt(c)} per year for ${n} years. IRR in % (numerical)?`, a: 100 * irr, tol: 0.05, unit: '%', sol: h`Solve $${-c0} = ${fmt(c)}\cdot\frac{1-(1+r)^{-4}}{r}$ → $r \approx ${fx(100 * irr, 2)}\%$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-rates', title: 'Rate conventions: real, nominal, continuous', minutes: 12,
    summary: 'Convert between compounding frequencies, separate inflation with the Fisher equation, and see why continuous rates are the quant default.',
    sections: [
      h`<p>The same economic rate can be quoted many ways. Two quotes are equivalent if they produce the same growth:</p>
      $$\left(1 + \frac{r_m}{m}\right)^m = e^{r_c} \iff r_c = m\ln\left(1+\frac{r_m}m\right),\quad r_m = m\left(e^{r_c/m} - 1\right)$$
      <p><b>Real vs nominal</b> (Fisher): $1 + r_{\text{nom}} = (1+r_{\text{real}})(1+\pi)$, so $r_{\text{real}}\approx r_{\text{nom}} - \pi$. With continuous rates it's exact: $r_{\text{real}} = r_{\text{nom}} - \pi$.</p>
      <p>Quants prefer continuous rates because they <b>add</b>: growing at $r_1$ for $t_1$ then $r_2$ for $t_2$ gives $e^{r_1t_1 + r_2t_2}$. They also make calculus clean.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Equivalent rates across frequencies', height: 260,
        params: [{ id: 'rc', label: 'continuous rate r_c', min: 0, max: 0.3, step: 0.005, value: 0.08, fmt: v => MF.pct(v, 2) }],
        draw(g, p) {
          const ms = [1, 2, 4, 12, 52, 365], vals = ms.map(m => m * (Math.exp(p.rc / m) - 1));
          g.view(-0.5, ms.length + 0.5, 0, Math.max(...vals) * 1.15).axes({ xstep: 1, fx: v => ['1', '2', '4', '12', '52', '365', '∞'][v] || '', fy: v => MF.pct(v, 1) });
          vals.forEach((v, i) => { g.rect(i - 0.3, 0, 0.6, v, { fill: C.alpha(C.fe, 0.6), color: C.fe }); g.text(MF.pct(v, 2), i, v, { dy: -10, size: 11, mono: true }); });
          g.rect(ms.length - 0.3, 0, 0.6, p.rc, { fill: C.alpha(C.speed, 0.6), color: C.speed }); g.text(MF.pct(p.rc, 2), ms.length, p.rc, { dy: -10, size: 11, mono: true });
        },
        info: () => 'Quoted rate for each compounding frequency m (x-axis) that gives the same growth. More frequent compounding needs a lower quoted rate.',
      }) },
    ],
    formulas: [h`r_c = m\ln\left(1 + \tfrac{r_m}{m}\right)`, h`r_m = m\left(e^{r_c/m}-1\right)`, h`1 + r_{\text{nom}} = (1+r_{\text{real}})(1+\pi)`],
    problems: [
      () => { const r = R.pick([0.04, 0.06, 0.08, 0.1, 0.12]), m = R.pick([1, 2, 4, 12]); return { q: h`Convert ${r * 100}% compounded ${m}× per year to a continuous rate (in %).`, a: 100 * m * Math.log(1 + r / m), tol: 0.005, unit: '%', sol: h`$${m}\ln(1 + ${r}/${m}) = ${fx(100 * m * Math.log(1 + r / m), 4)}\%$` }; },
      () => { const rn = R.pick([0.05, 0.06, 0.08, 0.1]), pi = R.pick([0.02, 0.03, 0.04]); return { q: h`Nominal rate ${rn * 100}%, inflation ${pi * 100}% (annual). Exact real rate in %?`, a: 100 * ((1 + rn) / (1 + pi) - 1), tol: 0.005, unit: '%', sol: h`$\frac{1+${rn}}{1+${pi}} - 1 = ${fx(100 * ((1 + rn) / (1 + pi) - 1), 4)}\%$` }; },
      () => { const rc = R.pick([0.03, 0.05, 0.07]), m = R.pick([2, 4, 12]); return { q: h`A continuous rate of ${rc * 100}% equals what rate compounded ${m}× per year (in %)?`, a: 100 * m * (Math.exp(rc / m) - 1), tol: 0.005, unit: '%', sol: h`$${m}(e^{${rc}/${m}} - 1) = ${fx(100 * m * (Math.exp(rc / m) - 1), 4)}\%$` }; },
    ],
  });
})();
