/* FE Math · Unit 5: probability */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;

  MF.unit('fe', 'fe-u5', 'Probability', 'Counting, conditional probability, random variables, the key distributions, dependence, conditional expectation, MGFs and the limit theorems.');

  MF.lesson({
    id: 'fe-counting', title: 'Counting & combinatorics', minutes: 12,
    summary: 'Permutations, combinations and Pascal\'s triangle: the counting behind binomial trees and probabilities.',
    sections: [
      h`<ul><li><b>Multiplication principle:</b> $k$ independent choices with $n_1,\dots,n_k$ options give $n_1\cdots n_k$ outcomes.</li>
      <li><b>Permutations</b> (order matters): $P(n,k) = \frac{n!}{(n-k)!}$.</li>
      <li><b>Combinations</b> (order doesn't): $\binom nk = \frac{n!}{k!(n-k)!}$.</li>
      <li><b>Pascal's rule:</b> $\binom nk = \binom{n-1}{k-1} + \binom{n-1}{k}$.</li>
      <li><b>Binomial theorem:</b> $(a+b)^n = \sum_k\binom nk a^kb^{n-k}$.</li></ul>
      <p>In an $n$-step binomial price tree, the number of paths reaching the node with $k$ up-moves is $\binom nk$. That's why the binomial distribution appears in option pricing.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Pascal\'s triangle = paths through a binomial tree', height: 340,
        params: [{ id: 'n', label: 'rows n', min: 2, max: 14, step: 1, value: 8, fmt: v => v }, { id: 'k', label: 'highlight k', min: 0, max: 14, step: 1, value: 3, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const n = p.n, k = Math.min(p.k, n), dy = (g.H - 30) / n, dx = Math.min(dy * 1.15, (g.W - 40) / (n + 1));
          for (let i = 0; i <= n; i++) for (let j = 0; j <= i; j++) {
            const x = g.W / 2 + (j - i / 2) * dx, y = 18 + i * dy;
            if (i < n) { const c = g.ctx; c.strokeStyle = '#1f2a40'; c.lineWidth = 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x - dx / 2, y + dy); c.moveTo(x, y); c.lineTo(x + dx / 2, y + dy); c.stroke(); }
          }
          for (let i = 0; i <= n; i++) for (let j = 0; j <= i; j++) {
            const x = g.W / 2 + (j - i / 2) * dx, y = 18 + i * dy, v = M.choose(i, j), hl = i === n && j === k;
            const c = g.ctx; c.fillStyle = hl ? C.speed : C.alpha(C.fe, 0.15 + 0.6 * v / M.choose(n, Math.floor(n / 2))); c.beginPath(); c.arc(x, y, Math.min(dx, dy) * 0.42, 0, 7); c.fill();
            g.ptext(String(v), x, y, { size: Math.min(12, dx / 3.2), mono: true, bold: hl, color: hl ? '#1d0e02' : C.text });
          }
        },
        info: p => { const k = Math.min(p.k, p.n); return h`$\binom{${p.n}}{${k}} = ${M.choose(p.n, k)}$ paths with ${k} up-moves out of $2^{${p.n}} = ${2 ** p.n}$. With a fair coin, $P = ${fx(M.choose(p.n, k) / 2 ** p.n, 4)}$.`; },
      }) },
    ],
    formulas: [h`\binom nk = \frac{n!}{k!\,(n-k)!}`, h`P(n,k) = \frac{n!}{(n-k)!}`, h`\binom nk = \binom{n-1}{k-1} + \binom{n-1}{k}`, h`(a+b)^n = \sum_{k=0}^n\binom nk a^kb^{n-k}`],
    problems: [
      () => { const n = R.int(5, 15), k = R.int(1, Math.min(n - 1, 6)); return { q: h`Compute $\binom{${n}}{${k}}$`, a: M.choose(n, k), sol: h`$\frac{${n}!}{${k}!\,${n - k}!} = ${M.choose(n, k)}$` }; },
      () => { const n = R.int(5, 10), k = R.int(2, 4); return { q: h`How many ways to rank the top ${k} of ${n} funds (order matters)?`, a: M.fact(n) / M.fact(n - k), sol: h`$P(${n},${k}) = ${M.fact(n) / M.fact(n - k)}$` }; },
      () => { const n = R.int(4, 10), k = R.int(0, n); return { q: h`In a ${n}-step binomial tree, how many paths end with exactly ${k} up-moves?`, a: M.choose(n, k), sol: h`$\binom{${n}}{${k}} = ${M.choose(n, k)}$` }; },
      () => { const n = R.int(20, 50), k = R.int(2, 3); return { q: h`A portfolio manager picks ${k} stocks from ${n}. How many portfolios?`, a: M.choose(n, k), sol: h`$\binom{${n}}{${k}} = ${M.choose(n, k)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-prob', title: 'Probability, conditioning & Bayes', minutes: 15,
    summary: 'Axioms, independence, conditional probability as restricting the universe, the law of total probability and Bayes\' rule.',
    sections: [
      h`<p>A probability $P$ assigns numbers in $[0,1]$ to events, with $P(\Omega) = 1$ and additivity for disjoint events. Consequences: $P(A^c) = 1-P(A)$, $P(A\cup B) = P(A)+P(B)-P(A\cap B)$.</p>
      <p><b>Conditional probability</b> restricts the universe to $B$: $P(A\mid B) = \frac{P(A\cap B)}{P(B)}$. Events are <b>independent</b> if $P(A\cap B) = P(A)P(B)$.</p>
      <p><b>Total probability:</b> $P(A) = \sum_i P(A\mid B_i)P(B_i)$ for a partition $\{B_i\}$. <b>Bayes:</b></p>
      $$P(B\mid A) = \frac{P(A\mid B)\,P(B)}{P(A)}$$
      <p>Classic trap: a 99%-accurate test for a 1%-prevalence condition gives only a 50% chance you have it after a positive result. The same base-rate logic applies to fraud alerts and default signals.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Bayes as areas', height: 300,
        params: [{ id: 'pr', label: 'prior P(D)', min: 0.001, max: 0.5, step: 0.001, value: 0.02, fmt: v => MF.pct(v, 1) }, { id: 'sens', label: 'P(+ | D) sensitivity', min: 0.5, max: 1, step: 0.005, value: 0.95, fmt: v => MF.pct(v, 1) }, { id: 'fpr', label: 'P(+ | not D) false-positive', min: 0, max: 0.3, step: 0.005, value: 0.05, fmt: v => MF.pct(v, 1) }],
        draw(g, p) {
          g.noPad(); const W = g.W - 40, H = g.H - 40, ox = 20, oy = 20, c = g.ctx, wD = Math.max(W * p.pr, 3);
          c.fillStyle = '#111827'; c.fillRect(ox, oy, W, H);
          c.fillStyle = C.alpha(C.pink, 0.25); c.fillRect(ox, oy, wD, H); c.fillStyle = C.alpha(C.pink, 0.85); c.fillRect(ox, oy, wD, H * p.sens);
          c.fillStyle = C.alpha(C.fe, 0.12); c.fillRect(ox + wD, oy, W - wD, H); c.fillStyle = C.alpha(C.fe, 0.7); c.fillRect(ox + wD, oy, W - wD, H * p.fpr);
          g.ptext('D', ox + wD / 2, oy + H + 12, { color: C.pink, size: 12, bold: true }); g.ptext('not D', ox + wD + (W - wD) / 2, oy + H + 12, { color: C.fe, size: 12, bold: true });
          g.ptext('bright = tested positive', ox + W - 80, oy + H - 12, { size: 11, color: C.muted });
        },
        info: p => { const tp = p.pr * p.sens, fp = (1 - p.pr) * p.fpr, post = tp / (tp + fp); return h`$P(D\mid +) = \frac{${fx(p.sens, 3)}\cdot${fx(p.pr, 3)}}{${fx(p.sens, 3)}\cdot${fx(p.pr, 3)} + ${fx(p.fpr, 3)}\cdot${fx(1 - p.pr, 3)}} = $ <b>${MF.pct(post, 1)}</b>. That's the bright pink area as a share of all bright area.`; },
      }) },
    ],
    formulas: [h`P(A\mid B) = \frac{P(A\cap B)}{P(B)}`, h`P(A) = \sum_i P(A\mid B_i)P(B_i)`, h`P(B\mid A) = \frac{P(A\mid B)P(B)}{P(A)}`, h`P(A\cup B) = P(A)+P(B)-P(A\cap B)`],
    problems: [
      () => { const pr = R.pick([0.01, 0.02, 0.05, 0.1]), se = R.pick([0.9, 0.95, 0.99]), fp = R.pick([0.02, 0.05, 0.1]); const post = pr * se / (pr * se + (1 - pr) * fp); return { q: h`A default signal fires for ${se * 100}% of firms that default and ${fp * 100}% of those that don't. ${pr * 100}% of firms default. P(default | signal) in %?`, a: 100 * post, tol: 0.05, unit: '%', sol: h`$\frac{${se}\cdot${pr}}{${se}\cdot${pr} + ${fp}\cdot${fx(1 - pr, 2)}} = ${fx(100 * post, 2)}\%$` }; },
      () => { const a = R.pick([0.3, 0.4, 0.5]), b = R.pick([0.2, 0.5, 0.6]); return { q: h`$A, B$ independent with $P(A) = ${a}$, $P(B) = ${b}$. $P(A\cup B)$?`, a: a + b - a * b, tol: 1e-4, sol: h`$${a} + ${b} - ${a}\cdot${b} = ${fx(a + b - a * b, 4)}$` }; },
      () => { const p = R.pick([0.5, 0.6, 0.55]), n = R.int(3, 6); return { q: h`A strategy wins each day independently with probability ${p}. P(at least one loss in ${n} days)?`, a: 1 - Math.pow(p, n), tol: 1e-4, sol: h`$1 - ${p}^{${n}} = ${fx(1 - Math.pow(p, n), 4)}$` }; },
      () => { const pB = [0.3, 0.5, 0.2], pA = [R.pick([0.1, 0.2]), R.pick([0.3, 0.4]), R.pick([0.6, 0.7])]; const t = M.sum(pB.map((x, i) => x * pA[i])); return { q: h`Regimes bull/flat/bear have probabilities 0.3/0.5/0.2; P(loss | regime) = ${pA.join('/')}. P(loss)?`, a: t, tol: 1e-4, sol: h`$\sum P(\text{loss}\mid B_i)P(B_i) = ${fx(t, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-rv', title: 'Random variables, expectation & variance', minutes: 15,
    summary: 'A random variable is a number determined by chance. Expectation is its centre of mass, variance its spread.',
    sections: [
      h`<p>A <b>random variable</b> $X$ maps outcomes to numbers. It is described by its pmf $p(x)$ (discrete) or pdf $f(x)$ (continuous), or by the CDF $F(x) = P(X\le x)$.</p>
      <ul><li><b>Expectation:</b> $E[X] = \sum x\,p(x)$ or $\int x f(x)\,dx$, the centre of mass. It is <b>linear</b>: $E[aX+bY] = aE[X]+bE[Y]$ always, even for dependent variables.</li>
      <li><b>Function of X</b> (LOTUS): $E[g(X)] = \sum g(x)p(x)$. Option prices are expectations of payoff functions.</li>
      <li><b>Variance:</b> $\operatorname{Var}X = E[(X-\mu)^2] = E[X^2] - \mu^2$. $\operatorname{Var}(aX+b) = a^2\operatorname{Var}X$. Standard deviation $\sigma = \sqrt{\operatorname{Var}X}$, which in finance is <b>volatility</b>.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Centre of mass and spread of a discrete distribution', height: 300,
        params: [{ id: 'p1', label: 'P(−20%)', min: 0, max: 1, step: 0.01, value: 0.2 }, { id: 'p2', label: 'P(0%)', min: 0, max: 1, step: 0.01, value: 0.3 }, { id: 'p3', label: 'P(+10%)', min: 0, max: 1, step: 0.01, value: 0.35 }, { id: 'p4', label: 'P(+40%)', min: 0, max: 1, step: 0.01, value: 0.15 }],
        draw(g, p) {
          const xs = [-20, 0, 10, 40], raw = [p.p1, p.p2, p.p3, p.p4], s = M.sum(raw) || 1, ps = raw.map(v => v / s);
          const mu = M.sum(xs.map((x, i) => x * ps[i])), sd = Math.sqrt(M.sum(xs.map((x, i) => (x - mu) ** 2 * ps[i])));
          g.view(-30, 50, 0, 1).axes({ xlabel: 'return %' });
          xs.forEach((x, i) => g.rect(x - 2.5, 0, 5, ps[i], { fill: C.alpha(C.fe, 0.6), color: C.fe }));
          g.ctx.fillStyle = C.alpha(C.speed, 0.12); g.ctx.fillRect(g.X(mu - sd), g.Y(1), g.X(mu + sd) - g.X(mu - sd), g.Y(0) - g.Y(1));
          g.vline(mu, { color: C.speed, dash: [], width: 2.5 }); g.text('▲ E[X]', mu, 0.02, { color: C.speed, base: 'bottom', dy: -2, size: 11 });
        },
        info: p => { const xs = [-20, 0, 10, 40], raw = [p.p1, p.p2, p.p3, p.p4], s = M.sum(raw) || 1, ps = raw.map(v => v / s), mu = M.sum(xs.map((x, i) => x * ps[i])), v = M.sum(xs.map((x, i) => (x - mu) ** 2 * ps[i])); return h`Normalised probabilities ${ps.map(x => fx(x, 2)).join(', ')}. $E[X] = ${fx(mu, 2)}\%$, $\operatorname{Var} = ${fx(v, 1)}$, $\sigma = ${fx(Math.sqrt(v), 2)}\%$ (shaded ±1σ).`; },
      }) },
    ],
    formulas: [h`E[X] = \sum_x x\,p(x) = \int x f(x)\,dx`, h`E[g(X)] = \sum_x g(x)p(x)`, h`\operatorname{Var}X = E[X^2] - (E[X])^2`, h`\operatorname{Var}(aX+b) = a^2\operatorname{Var}X`],
    problems: [
      () => { const xs = [R.int(-5, 0), R.int(1, 4), R.int(5, 10)], ps = R.pick([[0.2, 0.5, 0.3], [0.25, 0.25, 0.5], [0.1, 0.6, 0.3]]); const mu = M.sum(xs.map((x, i) => x * ps[i])); return { q: h`$X$ takes values $${xs.join(', ')}$ with probabilities $${ps.join(', ')}$. $E[X]$?`, a: mu, tol: 1e-4, sol: h`$\sum x p = ${fx(mu, 4)}$` }; },
      () => { const xs = [R.int(-5, 0), R.int(1, 4), R.int(5, 10)], ps = R.pick([[0.2, 0.5, 0.3], [0.25, 0.25, 0.5], [0.1, 0.6, 0.3]]); const mu = M.sum(xs.map((x, i) => x * ps[i])), v = M.sum(xs.map((x, i) => x * x * ps[i])) - mu * mu; return { q: h`$X$ takes values $${xs.join(', ')}$ with probabilities $${ps.join(', ')}$. $\operatorname{Var}X$?`, a: v, tol: 1e-3, sol: h`$E[X^2] - E[X]^2 = ${fx(v + mu * mu, 4)} - ${fx(mu, 4)}^2 = ${fx(v, 4)}$` }; },
      () => { const a = R.int(-4, 4), b = R.int(-5, 5), s = R.int(1, 5); return { q: h`$\operatorname{Var}X = ${s * s}$. Find $\operatorname{Var}(${a}X ${b < 0 ? '-' : '+'} ${Math.abs(b)})$.`, a: a * a * s * s, sol: h`$${a}^2\cdot${s * s} = ${a * a * s * s}$ (the shift doesn't matter)` }; },
      () => { const K = R.int(95, 105); const xs = [80, 100, 120], ps = [0.25, 0.5, 0.25]; const v = M.sum(xs.map((x, i) => Math.max(x - K, 0) * ps[i])); return { q: h`$S_T\in\{80, 100, 120\}$ with probabilities $0.25, 0.5, 0.25$. $E[(S_T - ${K})^+]$?`, a: v, tol: 1e-4, sol: h`Only paying states count: $${fx(v, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-binompois', title: 'Bernoulli, binomial & Poisson', minutes: 14,
    summary: 'Counting successes in n trials, and rare events in continuous time. These are models for defaults, jumps and tree prices.',
    sections: [
      h`<ul><li><b>Bernoulli($p$):</b> 1 with prob. $p$, else 0. Mean $p$, variance $p(1-p)$.</li>
      <li><b>Binomial($n,p$):</b> the number of successes in $n$ independent trials. $P(X=k) = \binom nk p^k(1-p)^{n-k}$, mean $np$, variance $np(1-p)$.</li>
      <li><b>Poisson($\lambda$):</b> counts of rare events in a fixed window. $P(N=k) = e^{-\lambda}\frac{\lambda^k}{k!}$, mean = variance = $\lambda$. It's the limit of Binomial($n, \lambda/n$) as $n\to\infty$.</li></ul>
      <p>Uses: defaults in a credit portfolio, jumps in Merton's model, order arrivals in market microstructure.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Binomial(n, λ/n) → Poisson(λ)', height: 300,
        params: [{ id: 'lam', label: 'λ = np', min: 0.5, max: 12, step: 0.1, value: 4 }, { id: 'n', label: 'n', min: 13, max: 200, step: 1, value: 15, fmt: v => v }],
        draw(g, p) {
          const K = Math.ceil(p.lam + 4 * Math.sqrt(p.lam) + 3), q = p.lam / p.n;
          const bp = Array.from({ length: K + 1 }, (_, k) => M.binomPmf(p.n, k, q)), pp = Array.from({ length: K + 1 }, (_, k) => M.poissonPmf(p.lam, k));
          g.view(-0.8, K + 0.8, 0, Math.max(...bp, ...pp) * 1.15).axes({ xstep: Math.max(1, Math.round(K / 12)) });
          for (let k = 0; k <= K; k++) { g.rect(k - 0.4, 0, 0.4, bp[k], { fill: C.alpha(C.fe, 0.7) }); g.rect(k, 0, 0.4, pp[k], { fill: C.alpha(C.speed, 0.7) }); }
          g.legend([[`Binomial(${p.n}, ${fx(q, 3)})`, C.fe], [`Poisson(${fx(p.lam, 1)})`, C.speed]], { x: g.W - 190 });
        },
        info: p => { const K = 40, q = p.lam / p.n; let tv = 0; for (let k = 0; k <= K; k++) tv += Math.abs(M.binomPmf(p.n, k, q) - M.poissonPmf(p.lam, k)); return `Total variation distance ≈ ${fx(tv / 2, 4)}. It shrinks as n grows.`; },
      }) },
    ],
    formulas: [h`P(X=k) = \binom nk p^k(1-p)^{n-k}`, h`E[X] = np,\ \operatorname{Var}X = np(1-p)`, h`P(N=k) = e^{-\lambda}\frac{\lambda^k}{k!}`, h`E[N] = \operatorname{Var}N = \lambda`],
    problems: [
      () => { const n = R.int(5, 12), p = R.pick([0.1, 0.2, 0.3, 0.5]), k = R.int(0, 3); return { q: h`$X\sim\text{Bin}(${n}, ${p})$. $P(X = ${k})$?`, a: M.binomPmf(n, k, p), tol: 1e-4, sol: h`$\binom{${n}}{${k}}${p}^{${k}}${fx(1 - p, 2)}^{${n - k}} = ${fx(M.binomPmf(n, k, p), 5)}$` }; },
      () => { const l = R.pick([0.5, 1, 2, 3]), k = R.int(0, 3); return { q: h`Defaults per year $\sim$ Poisson(${l}). P(exactly ${k} defaults)?`, a: M.poissonPmf(l, k), tol: 1e-4, sol: h`$e^{-${l}}\frac{${l}^{${k}}}{${k}!} = ${fx(M.poissonPmf(l, k), 5)}$` }; },
      () => { const l = R.pick([0.5, 1, 2]); return { q: h`Jumps $\sim$ Poisson(${l}) per year. P(at least one jump this year)?`, a: 1 - Math.exp(-l), tol: 1e-4, sol: h`$1 - e^{-${l}} = ${fx(1 - Math.exp(-l), 5)}$` }; },
      () => { const n = R.int(50, 500), p = R.pick([0.01, 0.02, 0.05]); return { q: h`${n} independent loans each default w.p. ${p}. Standard deviation of the number of defaults?`, a: Math.sqrt(n * p * (1 - p)), tol: 0.005, sol: h`$\sqrt{np(1-p)} = ${fx(Math.sqrt(n * p * (1 - p)), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-normal', title: 'The normal distribution', minutes: 15,
    summary: 'The bell curve, z-scores, the standard normal CDF Φ, quantiles, and why sums of many shocks are normal.',
    sections: [
      h`<p>$X\sim N(\mu,\sigma^2)$ has density $f(x) = \frac{1}{\sigma\sqrt{2\pi}}e^{-(x-\mu)^2/(2\sigma^2)}$. Standardise with $Z = \frac{X-\mu}{\sigma}\sim N(0,1)$, then use $\Phi(z) = P(Z\le z)$.</p>
      <ul><li>68–95–99.7 rule: within 1, 2, 3 σ.</li><li>Key quantiles: $\Phi^{-1}(0.95) = 1.645$, $\Phi^{-1}(0.975) = 1.96$, $\Phi^{-1}(0.99) = 2.326$.</li>
      <li>Linear combinations of jointly normal variables are normal: $aX+bY \sim N(a\mu_X+b\mu_Y,\ a^2\sigma_X^2 + b^2\sigma_Y^2 + 2ab\sigma_{XY})$.</li>
      <li>Symmetry: $\Phi(-z) = 1-\Phi(z)$.</li></ul>
      <p>Black–Scholes prices are written in terms of $\Phi(d_1)$ and $\Phi(d_2)$, and parametric VaR is $\mu + \sigma\Phi^{-1}(\alpha)$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Shade P(a < X < b)', height: 300,
        params: [{ id: 'mu', label: 'μ', min: -2, max: 2, step: 0.1, value: 0 }, { id: 's', label: 'σ', min: 0.3, max: 2.5, step: 0.05, value: 1 }, { id: 'a', label: 'a', min: -5, max: 5, step: 0.05, value: -1 }, { id: 'b', label: 'b', min: -5, max: 5, step: 0.05, value: 1.5 }],
        draw(g, p) {
          g.view(-6, 6, 0, M.npdf(0, 0, Math.min(p.s, 1)) * 1.12).axes();
          const lo = Math.min(p.a, p.b), hi = Math.max(p.a, p.b);
          g.area(x => M.npdf(x, p.mu, p.s), lo, hi, { color: C.alpha(C.fe, 0.35) });
          g.fn(x => M.npdf(x, p.mu, p.s), { color: C.fe, width: 2.5 });
          g.fn(x => M.npdf(x), { color: C.dim, width: 1, dash: [4, 4] });
          g.vline(p.mu, { color: C.speed });
        },
        info: p => { const lo = Math.min(p.a, p.b), hi = Math.max(p.a, p.b), za = (lo - p.mu) / p.s, zb = (hi - p.mu) / p.s; return h`$P(${fx(lo, 2)} < X < ${fx(hi, 2)}) = \Phi(${fx(zb, 3)}) - \Phi(${fx(za, 3)}) = $ <b>${fx(M.ncdf(zb) - M.ncdf(za), 4)}</b>`; },
      }) },
    ],
    formulas: [h`f(x) = \frac{1}{\sigma\sqrt{2\pi}}e^{-\frac{(x-\mu)^2}{2\sigma^2}}`, h`Z = \frac{X-\mu}{\sigma}`, h`\Phi(-z) = 1 - \Phi(z)`, h`\Phi^{-1}(0.975) \approx 1.96,\ \Phi^{-1}(0.99)\approx 2.326`],
    problems: [
      () => { const mu = R.pick([0, 5, 8, 10]), s = R.pick([10, 15, 20]), x = mu + R.pick([-2, -1.5, -1, 1, 1.645, 2]) * s; return { q: h`Annual return $\sim N(${mu}\%, ${s}\%^2)$. $P(\text{return} < ${fx(x, 2)}\%)$?`, a: M.ncdf((x - mu) / s), tol: 0.002, sol: h`$z = ${fx((x - mu) / s, 3)}$, $\Phi(z) = ${fx(M.ncdf((x - mu) / s), 4)}$` }; },
      () => { const a = R.pick([0.9, 0.95, 0.975, 0.99]); return { q: h`$\Phi^{-1}(${a})$?`, a: M.ninv(a), tol: 0.005, sol: h`$${fx(M.ninv(a), 4)}$` }; },
      () => { const mu = R.pick([0.01, 0.0005, 0]), s = R.pick([0.01, 0.02, 0.015]), alpha = R.pick([0.95, 0.99]); const v = -(mu - s * M.ninv(alpha)); return { q: h`Daily P&L return $\sim N(${mu}, ${s}^2)$. ${alpha * 100}% VaR as a positive loss fraction?`, a: v, tol: 1e-4, sol: h`$-\mu + \sigma\,\Phi^{-1}(${alpha}) = ${fx(v, 5)}$` }; },
      () => { const s1 = R.pick([0.1, 0.2]), s2 = R.pick([0.15, 0.3]), rho = R.pick([0, 0.5, -0.5]); const v = 0.25 * s1 * s1 + 0.25 * s2 * s2 + 0.5 * rho * s1 * s2; return { q: h`$X\sim N(0, ${s1}^2)$, $Y\sim N(0, ${s2}^2)$, correlation ${rho}. Std. dev. of $\tfrac12(X+Y)$?`, a: Math.sqrt(v), tol: 1e-3, sol: h`$\sqrt{\tfrac14\sigma_X^2 + \tfrac14\sigma_Y^2 + \tfrac12\rho\sigma_X\sigma_Y} = ${fx(Math.sqrt(v), 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-lognormal', title: 'The lognormal distribution & returns', minutes: 14,
    summary: 'If log-returns are normal, prices are lognormal: positive, right-skewed, with E[S] = exp(μ + σ²/2).',
    sections: [
      h`<p>If $\ln S = X\sim N(\mu,\sigma^2)$ then $S = e^X$ is <b>lognormal</b>. It's always positive (prices can't go below 0) and right-skewed.</p>
      $$E[S] = e^{\mu+\sigma^2/2},\qquad \operatorname{Var}S = e^{2\mu+\sigma^2}(e^{\sigma^2}-1),\qquad \text{median} = e^\mu$$
      <p>Notice that the mean exceeds the median. Under geometric Brownian motion $S_T = S_0\exp\left((m - \tfrac12\sigma^2)T + \sigma\sqrt T Z\right)$. The $-\frac12\sigma^2$ term makes $E[S_T] = S_0e^{mT}$, and the typical (median) path grows only at $m - \frac12\sigma^2$. This gap is <b>volatility drag</b>.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Lognormal density of S_T', height: 300,
        params: [{ id: 'm', label: 'drift m', min: -0.1, max: 0.3, step: 0.01, value: 0.08, fmt: v => MF.pct(v, 0) }, { id: 's', label: 'volatility σ', min: 0.05, max: 1, step: 0.01, value: 0.35, fmt: v => MF.pct(v, 0) }, { id: 'T', label: 'horizon T', min: 0.25, max: 10, step: 0.25, value: 3 }],
        draw(g, p) {
          const mu = Math.log(100) + (p.m - p.s * p.s / 2) * p.T, sg = p.s * Math.sqrt(p.T);
          const pdf = x => x <= 0 ? 0 : M.npdf(Math.log(x), mu, sg) / x;
          const hi = Math.exp(mu + 3 * sg), mode = Math.exp(mu - sg * sg);
          g.view(0, hi, 0, pdf(mode) * 1.15).axes({ xlabel: 'S_T' });
          g.area(pdf, 0.01, hi, { color: C.alpha(C.fe, 0.2) }); g.fn(pdf, { color: C.fe, width: 2.5, from: 0.01 });
          g.vline(Math.exp(mu), { color: C.speed }); g.vline(Math.exp(mu + sg * sg / 2), { color: C.good }); g.vline(100, { color: C.dim });
          g.legend([['median e^μ', C.speed], ['mean e^{μ+σ²/2}', C.good], ['S₀ = 100', C.dim]], { x: g.W - 170 });
        },
        info: p => { const mu = Math.log(100) + (p.m - p.s * p.s / 2) * p.T, sg = p.s * Math.sqrt(p.T); return h`Median ${fx(Math.exp(mu), 2)}, mean ${fx(Math.exp(mu + sg * sg / 2), 2)} $= 100e^{mT}$. $P(S_T < 100) = \Phi\left(\frac{-(m - \sigma^2/2)T}{\sigma\sqrt T}\right) = ${fx(M.ncdf((Math.log(100) - mu) / sg), 4)}$`; },
      }) },
    ],
    formulas: [h`\ln S\sim N(\mu,\sigma^2)\Rightarrow E[S] = e^{\mu+\sigma^2/2}`, h`\operatorname{Var}S = e^{2\mu+\sigma^2}\left(e^{\sigma^2}-1\right)`, h`S_T = S_0e^{(m-\sigma^2/2)T + \sigma\sqrt T Z}`],
    problems: [
      () => { const mu = R.pick([0, 0.05, 0.1]), s = R.pick([0.2, 0.3, 0.5]); return { q: h`$\ln S\sim N(${mu}, ${s}^2)$. $E[S]$?`, a: Math.exp(mu + s * s / 2), tol: 1e-4, sol: h`$e^{${mu} + ${s}^2/2} = ${fx(Math.exp(mu + s * s / 2), 5)}$` }; },
      () => { const S0 = 100, m = R.pick([0.05, 0.08, 0.1]), s = R.pick([0.2, 0.3, 0.4]), T = R.int(1, 5); const med = S0 * Math.exp((m - s * s / 2) * T); return { q: h`GBM with $S_0 = 100$, $m = ${m}$, $\sigma = ${s}$. Median of $S_{${T}}$?`, a: med, tol: 0.01, sol: h`$100e^{(${m} - ${s}^2/2)\cdot${T}} = ${fx(med, 3)}$` }; },
      () => { const m = R.pick([0.05, 0.08]), s = R.pick([0.2, 0.3, 0.4]), T = R.int(1, 10); const pr = M.ncdf(-(m - s * s / 2) * T / (s * Math.sqrt(T))); return { q: h`GBM, $m = ${m}$, $\sigma = ${s}$. Probability the price is below its start after ${T} years?`, a: pr, tol: 0.002, sol: h`$\Phi\left(\frac{-(${m} - ${s * s / 2})\cdot${T}}{${s}\sqrt{${T}}}\right) = ${fx(pr, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-joint', title: 'Joint distributions, covariance & correlation', minutes: 14,
    summary: 'How two random quantities move together: covariance, correlation, independence vs uncorrelatedness, and the variance of sums.',
    sections: [
      h`<p>For two random variables, $\operatorname{Cov}(X,Y) = E[(X-\mu_X)(Y-\mu_Y)] = E[XY]-\mu_X\mu_Y$ and $\rho = \frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y}\in[-1,1]$.</p>
      <ul><li>$\operatorname{Var}(X+Y) = \operatorname{Var}X + \operatorname{Var}Y + 2\operatorname{Cov}(X,Y)$. Diversification works because of that last term.</li>
      <li>Covariance is bilinear: $\operatorname{Cov}(aX+bY, Z) = a\operatorname{Cov}(X,Z) + b\operatorname{Cov}(Y,Z)$.</li>
      <li>Independent ⇒ uncorrelated, but <b>not</b> conversely: $X\sim N(0,1)$ and $Y = X^2$ are uncorrelated yet perfectly dependent.</li>
      <li>Correlation measures only <i>linear</i> dependence and says nothing about tail co-movement. That's what copulas are for.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Uncorrelated ≠ independent', height: 320,
        params: [{ id: 'kind', label: 'relationship', type: 'select', value: 'lin', options: [['lin', 'Y = ρX + noise'], ['sq', 'Y = X² − 1'], ['circ', 'circle'], ['tail', 'joint crashes only']] }, { id: 'rho', label: 'ρ (linear case)', min: -1, max: 1, step: 0.05, value: 0.6 }],
        init(s) { const r = R.seeded(11); s.z = Array.from({ length: 600 }, () => [r.normal(), r.normal(), r()]); },
        draw(g, p, s) {
          const asp = g.W / g.H; g.view(-3.5 * asp, 3.5 * asp, -3.5, 3.5).axes({ xstep: 1, ystep: 1 });
          const pts = s.z.map(([a, b, u]) => p.kind === 'lin' ? [a, p.rho * a + Math.sqrt(1 - p.rho * p.rho) * b] : p.kind === 'sq' ? [a, a * a - 1] : p.kind === 'circ' ? [2.2 * Math.cos(6.283 * u) + 0.1 * a, 2.2 * Math.sin(6.283 * u) + 0.1 * b] : (u < 0.06 ? [-2.5 + 0.4 * a, -2.5 + 0.4 * b] : [a, b]));
          const c = g.ctx; c.fillStyle = C.alpha(C.fe, 0.55); pts.forEach(([x, y]) => c.fillRect(g.X(x) - 1.5, g.Y(y) - 1.5, 3, 3));
          const mx = M.mean(pts.map(q => q[0])), my = M.mean(pts.map(q => q[1]));
          s.r = M.sum(pts.map(q => (q[0] - mx) * (q[1] - my))) / Math.sqrt(M.sum(pts.map(q => (q[0] - mx) ** 2)) * M.sum(pts.map(q => (q[1] - my) ** 2)));
        },
        info: (p, s) => `Sample correlation: <b>${fx(s.r || 0, 3)}</b>. ${p.kind === 'lin' ? '' : 'Correlation misses this obvious dependence.'}`,
      }) },
    ],
    formulas: [h`\operatorname{Cov}(X,Y) = E[XY] - E[X]E[Y]`, h`\rho = \frac{\operatorname{Cov}(X,Y)}{\sigma_X\sigma_Y}`, h`\operatorname{Var}\left(\sum a_iX_i\right) = \sum_{i,j}a_ia_j\operatorname{Cov}(X_i,X_j)`],
    problems: [
      () => { const sx = R.pick([0.1, 0.2]), sy = R.pick([0.15, 0.25, 0.3]), rho = R.pick([-0.5, 0, 0.3, 0.8]); const v = sx * sx + sy * sy + 2 * rho * sx * sy; return { q: h`$\sigma_X = ${sx}$, $\sigma_Y = ${sy}$, $\rho = ${rho}$. $\operatorname{Var}(X+Y)$?`, a: v, tol: 1e-4, sol: h`$${sx}^2 + ${sy}^2 + 2(${rho})(${sx})(${sy}) = ${fx(v, 5)}$` }; },
      () => { const c = R.pick([0.006, 0.012, -0.004]), sx = 0.2, sy = 0.3; return { q: h`$\operatorname{Cov}(X,Y) = ${c}$, $\sigma_X = ${sx}$, $\sigma_Y = ${sy}$. Correlation?`, a: c / (sx * sy), tol: 1e-3, sol: h`$\frac{${c}}{${sx}\cdot${sy}} = ${fx(c / (sx * sy), 4)}$` }; },
      () => { const a = R.int(1, 4), b = R.int(1, 4), cxz = R.pick([0.5, 1, -1]), cyz = R.pick([2, -0.5, 1]); return { q: h`$\operatorname{Cov}(X,Z) = ${cxz}$, $\operatorname{Cov}(Y,Z) = ${cyz}$. $\operatorname{Cov}(${a}X + ${b}Y, Z)$?`, a: a * cxz + b * cyz, tol: 1e-6, sol: h`Bilinearity: $${a}(${cxz}) + ${b}(${cyz}) = ${a * cxz + b * cyz}$` }; },
      () => ({ q: h`$X\sim N(0,1)$ and $Y = X^2$. Which is true?`, choices: ['Correlated and dependent', 'Uncorrelated but dependent', 'Uncorrelated and independent', 'Correlated but independent'], a: 1, sol: h`$\operatorname{Cov}(X,X^2) = E[X^3] = 0$, yet $Y$ is a function of $X$.` }),
    ],
  });

  MF.lesson({
    id: 'fe-condexp', title: 'Conditional expectation & the tower property', minutes: 15,
    summary: 'E[X | information] is the best forecast given what you know. The tower property and martingales grow from here.',
    sections: [
      h`<p>$E[X\mid Y]$ is a <b>random variable</b>, a function of $Y$: the best mean-square prediction of $X$ given $Y$. More abstractly, $E[X\mid\mathcal F]$ conditions on an information set (σ-algebra) $\mathcal F$.</p>
      <ul><li><b>Tower property:</b> $E\big[E[X\mid\mathcal G]\mid\mathcal F\big] = E[X\mid\mathcal F]$ for $\mathcal F\subseteq\mathcal G$. The coarser information wins. In particular $E[E[X\mid Y]] = E[X]$.</li>
      <li><b>Taking out what is known:</b> $E[ZX\mid\mathcal F] = Z\,E[X\mid\mathcal F]$ if $Z$ is $\mathcal F$-measurable.</li>
      <li><b>Law of total variance:</b> $\operatorname{Var}X = E[\operatorname{Var}(X\mid Y)] + \operatorname{Var}(E[X\mid Y])$.</li></ul>
      <p>The fundamental pricing formula is a conditional expectation: $V_t = E^{\mathbb Q}\big[e^{-r(T-t)}V_T\mid\mathcal F_t\big]$. A <b>martingale</b> is a process whose best forecast of the future is its present value: $E[M_T\mid\mathcal F_t] = M_t$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Conditioning on the first step of a two-step tree', height: 280,
        params: [{ id: 'u', label: 'up factor u', min: 1.05, max: 1.6, step: 0.01, value: 1.2 }, { id: 'p', label: 'P(up)', min: 0.05, max: 0.95, step: 0.01, value: 0.5 }],
        draw(g, p) {
          g.noPad(); const d = 1 / p.u, S = 100, W = g.W, H = g.H;
          const nodes = [[0, 0, S], [1, 1, S * p.u], [1, -1, S * d], [2, 2, S * p.u * p.u], [2, 0, S], [2, -2, S * d * d]];
          const X = t => 60 + t * (W - 160) / 2, Y = k => H / 2 - k * (H - 60) / 5;
          const e = (a, b) => { const c = g.ctx; c.strokeStyle = C.axis; c.lineWidth = 1.5; c.beginPath(); c.moveTo(X(a[0]), Y(a[1])); c.lineTo(X(b[0]), Y(b[1])); c.stroke(); };
          e(nodes[0], nodes[1]); e(nodes[0], nodes[2]); e(nodes[1], nodes[3]); e(nodes[1], nodes[4]); e(nodes[2], nodes[4]); e(nodes[2], nodes[5]);
          nodes.forEach(([t, k, v]) => { const c = g.ctx; c.fillStyle = C.panel || '#141b29'; c.strokeStyle = C.fe; c.beginPath(); c.arc(X(t), Y(k), 22, 0, 7); c.fill(); c.stroke(); g.ptext(fx(v, 1), X(t), Y(k), { mono: true, size: 11 }); });
          const eu = p.p * S * p.u * p.u + (1 - p.p) * S, ed = p.p * S + (1 - p.p) * S * d * d;
          g.ptext(`E[S₂ | up] = ${fx(eu, 2)}`, X(1), Y(1) - 34, { color: C.speed, size: 12 });
          g.ptext(`E[S₂ | down] = ${fx(ed, 2)}`, X(1), Y(-1) + 34, { color: C.speed, size: 12 });
          g.ptext(`E[E[S₂|S₁]] = ${fx(p.p * eu + (1 - p.p) * ed, 3)}`, X(0), Y(0) + 40, { color: C.good, size: 12 });
        },
        info: p => { const d = 1 / p.u, q = (1 - d) / (p.u - d); return h`Direct $E[S_2] = ${fx(100 * (p.p * p.u + (1 - p.p) * d) ** 2, 3)}$, the same as averaging the conditional expectations (tower property). With $p = \frac{1-d}{u-d} = ${fx(q, 3)}$ the price process is a martingale: $E[S_2|S_1] = S_1$.`; },
      }) },
    ],
    formulas: [h`E\big[E[X\mid\mathcal G]\mid\mathcal F\big] = E[X\mid\mathcal F],\ \mathcal F\subseteq\mathcal G`, h`E[E[X\mid Y]] = E[X]`, h`\operatorname{Var}X = E[\operatorname{Var}(X\mid Y)] + \operatorname{Var}(E[X\mid Y])`, h`E[M_T\mid\mathcal F_t] = M_t`],
    problems: [
      () => { const p = R.pick([0.3, 0.5, 0.6]), a = R.int(2, 8), b = R.int(10, 20); return { q: h`With probability ${p} the regime is calm, where $E[X] = ${a}$; otherwise $E[X] = ${b}$. $E[X]$?`, a: p * a + (1 - p) * b, tol: 1e-6, sol: h`$${p}\cdot${a} + ${fx(1 - p, 2)}\cdot${b} = ${fx(p * a + (1 - p) * b, 3)}$` }; },
      () => { const v1 = R.int(1, 4), v2 = R.int(4, 9), m1 = R.int(0, 3), m2 = R.int(4, 8); const ev = 0.5 * v1 + 0.5 * v2, ve = 0.25 * (m1 - m2) ** 2; return { q: h`Two equally likely regimes: (mean ${m1}, var ${v1}) and (mean ${m2}, var ${v2}). Total $\operatorname{Var}X$?`, a: ev + ve, tol: 1e-6, sol: h`$E[\operatorname{Var}] + \operatorname{Var}(E) = ${ev} + ${ve} = ${ev + ve}$` }; },
      () => { const S = R.int(80, 120); return { q: h`$M_t$ is a martingale with $M_3 = ${S}$. What is $E[M_{10}\mid\mathcal F_3]$?`, a: S, sol: 'A martingale\'s best forecast is its current value.' }; },
    ],
  });

  MF.lesson({
    id: 'fe-mgf', title: 'Moment generating & characteristic functions', minutes: 14,
    summary: 'Encode an entire distribution in one function. Moments by differentiation, sums by multiplication, and the Gaussian identity E[e^{aZ}] = e^{a²/2}.',
    sections: [
      h`<p>The <b>MGF</b> $M_X(t) = E[e^{tX}]$ (when finite) generates moments: $M^{(n)}(0) = E[X^n]$. The <b>characteristic function</b> $\varphi_X(u) = E[e^{iuX}]$ always exists. Fourier option-pricing methods (Heston, Carr–Madan) are built on it.</p>
      <ul><li>Independent sums: $M_{X+Y}(t) = M_X(t)M_Y(t)$.</li>
      <li>Normal: $M(t) = e^{\mu t + \sigma^2t^2/2}$. Hence the workhorse identity $E[e^{\sigma Z}] = e^{\sigma^2/2}$, which explains the lognormal mean and the $-\frac12\sigma^2$ in GBM.</li>
      <li>Poisson($\lambda$): $M(t) = e^{\lambda(e^t-1)}$. Exponential($\lambda$): $\frac{\lambda}{\lambda-t}$.</li>
      <li><b>Cumulants</b> $\kappa_n$ come from $\ln M(t) = \sum \kappa_n\frac{t^n}{n!}$: mean, variance, and (scaled) skewness and kurtosis.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Monte Carlo check of E[e^{σZ}] = e^{σ²/2}', height: 260,
        params: [{ id: 's', label: 'σ', min: 0.1, max: 2, step: 0.05, value: 0.8 }, { id: 'n', label: 'samples (log₁₀)', min: 1, max: 5, step: 0.25, value: 3 }],
        init(s) { s.seed = 3; },
        buttons: [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }],
        draw(g, p, s) {
          const r = R.seeded(s.seed), N = Math.round(10 ** p.n), pts = []; let sum = 0;
          for (let i = 1; i <= N; i++) { sum += Math.exp(p.s * r.normal()); if (i % Math.max(1, Math.floor(N / 300)) === 0) pts.push([Math.log10(i), sum / i]); }
          const tru = Math.exp(p.s * p.s / 2), ys = pts.map(q => q[1]);
          g.view(0, p.n, Math.min(...ys, tru) * 0.9, Math.max(...ys, tru) * 1.1).axes({ xlabel: 'log₁₀ N' });
          g.hline(tru, { color: C.speed, dash: [6, 4], width: 2 }); g.path(pts, { color: C.fe, width: 2 });
          s.est = sum / N; s.tru = tru;
        },
        info: (p, s) => h`Running average after $10^{${p.n}}$ samples: ${fx(s.est, 4)} vs exact $e^{\sigma^2/2} = ${fx(s.tru, 4)}$. Larger σ means a heavier right tail and slower convergence.`,
      }) },
    ],
    formulas: [h`M_X(t) = E[e^{tX}],\ M_X^{(n)}(0) = E[X^n]`, h`M_{X+Y} = M_XM_Y\ (\text{indep.})`, h`X\sim N(\mu,\sigma^2):\ M_X(t) = e^{\mu t + \frac12\sigma^2t^2}`, h`\varphi_X(u) = E[e^{iuX}]`],
    problems: [
      () => { const mu = R.pick([0, 0.05, 0.1]), s = R.pick([0.2, 0.3, 0.5]), t = R.pick([1, 2, -1]); return { q: h`$X\sim N(${mu}, ${s}^2)$. Compute $E[e^{${t}X}]$.`, a: Math.exp(mu * t + s * s * t * t / 2), tol: 1e-4, sol: h`$e^{${mu}\cdot${t} + \frac12 ${s}^2\cdot${t * t}} = ${fx(Math.exp(mu * t + s * s * t * t / 2), 5)}$` }; },
      () => { const l = R.pick([1, 2, 3, 0.5]); return { q: h`$M(t) = e^{${l}(e^t - 1)}$. Compute $E[X^2]$ via $M''(0)$.`, a: l + l * l, tol: 1e-6, sol: h`Poisson(${l}): $E[X^2] = \lambda + \lambda^2 = ${l + l * l}$` }; },
      () => { const l = R.pick([2, 4, 5]); return { q: h`$X\sim\text{Exp}(${l})$ with $M(t) = \frac{${l}}{${l} - t}$. Compute $E[X]$.`, a: 1 / l, tol: 1e-4, sol: h`$M'(0) = \frac{${l}}{${l}^2} = ${fx(1 / l, 4)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-limits-thm', title: 'Law of large numbers & central limit theorem', minutes: 15,
    summary: 'Averages converge to the mean (LLN), and their fluctuations are normal with size σ/√n (CLT). This is the foundation of Monte Carlo and statistics.',
    sections: [
      h`<p>For i.i.d. $X_i$ with mean $\mu$ and variance $\sigma^2$, let $\bar X_n = \frac1n\sum X_i$:</p>
      <ul><li><b>LLN:</b> $\bar X_n\to\mu$. Monte Carlo pricing works because of this.</li>
      <li><b>CLT:</b> $\frac{\bar X_n - \mu}{\sigma/\sqrt n}\Rightarrow N(0,1)$ <i>whatever</i> the distribution of $X_i$. Errors shrink like $1/\sqrt n$: 100× more samples buys one more decimal digit.</li></ul>
      <p>Finance: daily returns summed over a year look roughly normal (CLT), and annual vol ≈ daily vol × √252. Fat tails and dependence break the CLT's assumptions, which is why crashes are more frequent than the normal predicts.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Sample means of a skewed distribution become normal', height: 300,
        params: [{ id: 'n', label: 'sample size n', min: 1, max: 100, step: 1, value: 5, fmt: v => v }, { id: 'dist', label: 'base distribution', type: 'select', value: 'exp', options: [['exp', 'Exponential (skewed)'], ['unif', 'Uniform'], ['bern', 'Bernoulli(0.1)']] }],
        init(s) { s.seed = 5; },
        buttons: [{ label: '🎲 Resample', click: s => { s.seed = Math.floor(Math.random() * 1e9); } }],
        draw(g, p, s) {
          const r = R.seeded(s.seed), D = { exp: [() => -Math.log(1 - r()), 1, 1], unif: [() => r(), 0.5, Math.sqrt(1 / 12)], bern: [() => (r() < 0.1 ? 1 : 0), 0.1, Math.sqrt(0.09)] }[p.dist];
          const means = []; for (let k = 0; k < 3000; k++) { let t = 0; for (let i = 0; i < p.n; i++) t += D[0](); means.push(t / p.n); }
          const se = D[2] / Math.sqrt(p.n), lo = D[1] - 4 * se, hi = D[1] + 4 * se;
          g.view(lo, hi, 0, M.npdf(0, 0, se) * 1.6).axes();
          g.hist(means, lo, hi, 50, { density: true });
          g.fn(x => M.npdf(x, D[1], se), { color: C.speed, width: 2.5 });
        },
        info: p => { const sd = { exp: 1, unif: Math.sqrt(1 / 12), bern: 0.3 }[p.dist]; return h`Histogram of 3000 sample means vs the CLT normal with s.e. $\sigma/\sqrt n = ${fx(sd / Math.sqrt(p.n), 4)}$.`; },
      }) },
    ],
    formulas: [h`\bar X_n \xrightarrow{a.s.} \mu`, h`\sqrt n\,\frac{\bar X_n - \mu}{\sigma}\Rightarrow N(0,1)`, h`\operatorname{s.e.}(\bar X_n) = \frac{\sigma}{\sqrt n}`, h`\sigma_{\text{annual}}\approx\sigma_{\text{daily}}\sqrt{252}`],
    problems: [
      () => { const s = R.pick([10, 20, 30]), n = R.pick([100, 400, 2500, 10000]); return { q: h`A Monte Carlo payoff has std. dev. ${s}. Standard error of the price estimate with ${n} paths?`, a: s / Math.sqrt(n), tol: 1e-4, sol: h`$${s}/\sqrt{${n}} = ${fx(s / Math.sqrt(n), 4)}$` }; },
      () => { const d = R.pick([0.01, 0.012, 0.015, 0.02]); return { q: h`Daily vol ${d * 100}%. Annualised vol (252 days) in %?`, a: 100 * d * Math.sqrt(252), tol: 0.01, unit: '%', sol: h`$${d}\sqrt{252} = ${fx(100 * d * Math.sqrt(252), 3)}\%$` }; },
      () => { const f = R.pick([2, 4, 10]); return { q: h`To cut Monte Carlo error by a factor of ${f}, multiply the number of paths by?`, a: f * f, sol: h`Error $\propto 1/\sqrt N$ → $${f}^2 = ${f * f}$` }; },
      () => { const n = R.pick([100, 400]), p = 0.5; const se = Math.sqrt(p * (1 - p) / n), z = R.pick([1, 2]); return { q: h`Flip a fair coin ${n} times. By CLT, P(fraction of heads > ${fx(0.5 + z * se, 3)})?`, a: 1 - M.ncdf(z), tol: 0.002, sol: h`That's $${z}$ standard errors above: $1 - \Phi(${z}) = ${fx(1 - M.ncdf(z), 4)}$` }; },
    ],
  });
})();
