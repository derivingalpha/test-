# MathForge

A Brilliant-style, dark-themed learning web app for two skills:

1. **Speed Math**: visual mental arithmetic that blends Vedic, Trachtenberg, soroban/anzan and area-model methods. Every skill is drilled with spaced repetition until it is automatic.
2. **Financial Engineering Math**: the full mathematical spine of quantitative finance, from basic addition to master's-level stochastic calculus, Black–Scholes, numerical methods and advanced models. Math only.

There is no backend, database, account system or AI. Every page, visual and practice problem is generated in your browser. Progress lives in `localStorage` and can be exported to or imported from a JSON file.

## What's inside

- **115 lessons**: 29 in Speed Math and 86 in Financial Engineering Math, across 19 units.
- **Interactive visuals in almost every lesson.** Some are slider explorables (price–yield curves, Greeks, efficient frontiers, GARCH, copulas, finite-difference stability…). Others are step-through walkthroughs (number-line jumps, area models, crosswise multiplication, soroban bead moves). There are also Monte Carlo simulations you can resample.
- **Infinite practice.** Problems are generated procedurally with fresh numbers each time. Answers accept fractions, `%`, scientific notation and arithmetic expressions. Each one comes with a worked solution.
- **Spaced repetition (SM-2 family).** Passing a lesson (4/5) adds it to your review deck. Reviews interleave skills from both tracks. Accuracy (and speed, for speed-math skills) sets the next interval: 1 → 3 → ~8 → 20+ days. A failed card is relearned 10 minutes later.
- **Speed drills.** These include timed sprints across any mix of skills (correct answers auto-advance) and **Flash Anzan**, which flashes numbers to sum on an imaginary abacus. There is also an **adaptive times-table grid**, a heat-map of your recall speed that serves your weakest products first.
- **Formula reference**, auto-built from every lesson's key formulas.
- **Progress page** with an activity heat-map, a 14-day review forecast, drill records, settings and export/import/reset.

## Run it

It is a static site with no build step and no dependencies to install. KaTeX is vendored in `web/vendor/katex`.

- **Locally:** `cd web && python3 -m http.server 8000`, then open <http://localhost:8000>. Opening `web/index.html` directly from disk also works, because it uses plain scripts and no ES modules.
- **Online (GitHub Pages):** the workflow in `.github/workflows/pages.yml` publishes the `web/` folder whenever you push to `main`/`master`. Enable it once under **Settings → Pages → Source: GitHub Actions**. Any static host also works (Netlify, Cloudflare Pages, S3): just upload `web/`.

## Project layout

```
web/
  index.html            entry point (script order = curriculum order)
  css/style.css         dark theme
  js/core/              util (math lib, RNG, answer parser), viz (canvas engine),
                        store (localStorage + SM-2 scheduler), registry
  js/content/           one file per unit: speed-*.js, fe-00 … fe-13
  js/app/               views (pages, problem runner, review), drills, router
  vendor/katex/         math rendering (MIT)
tools/                  Playwright checks (see below)
```

### Adding a lesson

Call `MF.lesson({...})` inside a content file after `MF.unit(...)`:

```js
MF.lesson({
  id: 'fe-my-topic', title: 'My topic', minutes: 10, summary: '…',
  sections: [h`<p>Text with $\LaTeX$</p>`, { viz: host => MF.explore(host, { params: [...], draw(g, p) { … } }) }],
  formulas: [h`E[X] = \mu`],
  problems: [() => ({ q: 'Question', a: 42, tol: 0.01, sol: 'Worked solution' })],
});
```

## Checks

With a local server on port 8765 (`cd web && python3 -m http.server 8765`) and Playwright installed:

- `node tools/validate.js` runs every problem generator 120× and checks answers are finite and accepted, the text is clean, and the KaTeX renders.
- `node tools/smoke.js` visits every lesson and page, drives the visuals, and reports console errors.
- `node tools/e2e.js` runs the full flow: complete a lesson, review (fail and pass), sprint drill, export, and mobile layout.

## Curriculum

### Speed Math

**Unit 1: Number Sense Foundations**: Complements: friends of 10, 100, 1000 · Seeing numbers as chunks · The mental abacus (soroban & anzan) · Instant tables to 20 × 20

**Unit 2: Addition & Subtraction**: Left-to-right addition · Round and adjust (compensation) · Subtraction by adding up · Column sums & grouping tens

**Unit 3: Multiplication**: Multiply by 11 · Multiply by 5, 25, 50, 125 · Multiply by 9, 99, 999 · Big × single digit (left to right) · The area model: 2-digit × 2-digit · Vertically & crosswise · Near a base (Nikhilam) · Difference of squares · Teens and same-tens products

**Unit 4: Squares, Roots & Powers**: Squaring numbers ending in 5 · Squaring near 50 and 100 · Squaring any 2-digit number · Estimating square roots · Cube roots of perfect cubes

**Unit 5: Division, Fractions, Percent & Estimation**: Division tricks · Divisibility at a glance · Benchmark fractions ↔ decimals ↔ % · Percentage tricks · Casting out nines (instant checks) · Fast estimation & orders of magnitude · Choosing the method (interleaved)

### Financial Engineering Math

**Unit 0: Arithmetic Foundations**: Numbers & the four operations · Order of operations & expressions · Fractions & decimals · Percentages, ratios & returns · Exponents, roots & scientific notation

**Unit 1: Algebra & Functions**: Linear equations & straight lines · Systems of linear equations · Quadratics & parabolas · Functions, composition & inverses · Exponentials, e and logarithms · Sequences, series & Σ notation

**Unit 2: Time Value of Money**: Simple, compound & continuous interest · Present value & discounting · Annuities, perpetuities & loans · NPV & IRR · Rate conventions: real, nominal, continuous

**Unit 3: Calculus**: Limits & continuity · The derivative: slope of a curve · Differentiation rules: product, quotient, chain · Optimisation in one variable · Integrals: accumulation & area · Integration techniques & improper integrals · Taylor series & approximation · Partial derivatives, gradient & Hessian · Constrained optimisation & Lagrange multipliers · Ordinary differential equations

**Unit 4: Linear Algebra**: Vectors, dot products & norms · Matrices as transformations · Determinants, inverses & solving Ax = b · Eigenvalues & eigenvectors · Covariance matrices & Cholesky · PCA & the yield curve

**Unit 5: Probability**: Counting & combinatorics · Probability, conditioning & Bayes · Random variables, expectation & variance · Bernoulli, binomial & Poisson · The normal distribution · The lognormal distribution & returns · Joint distributions, covariance & correlation · Conditional expectation & the tower property · Moment generating & characteristic functions · Law of large numbers & central limit theorem

**Unit 6: Statistics & Econometrics**: Estimators & confidence intervals · Maximum likelihood estimation · Linear regression, OLS & beta · Hypothesis testing & p-values · Time series: stationarity & AR(1) · Volatility models: EWMA & GARCH(1,1)

**Unit 7: Fixed Income Mathematics**: Bond pricing & yield to maturity · Duration & convexity · Spot rates, forward rates & bootstrapping

**Unit 8: Portfolio Theory**: Portfolio risk & diversification · Efficient frontier, tangency & Sharpe · CAPM & factor models · Kelly criterion & log utility

**Unit 9: Derivatives: No-Arbitrage & Trees**: Forwards, futures & no-arbitrage · Option payoffs & strategies · Put–call parity & arbitrage bounds · One-period binomial model & risk-neutral pricing · Multi-period trees, American options & convergence

**Unit 10: Stochastic Calculus**: Random walks & martingales · Brownian motion · Quadratic variation: (dW)² = dt · The Itô integral · Itô's lemma · Geometric Brownian motion & SDEs · Ornstein–Uhlenbeck & mean reversion · Change of measure & Girsanov · Feynman–Kac: expectations ⇔ PDEs

**Unit 11: Black–Scholes & the Greeks**: Deriving the Black–Scholes PDE · The Black–Scholes formula · The Greeks · Implied volatility & the smile · Delta hedging P&L: gamma vs theta

**Unit 12: Numerical Methods**: Root finding: bisection, Newton, secant · Monte Carlo pricing · Variance reduction · Finite-difference PDE methods

**Unit 13: Advanced Models**: Short-rate models: Vasicek & CIR · Black-76, caps & the LIBOR market model · Stochastic volatility: Heston · Jump diffusions: Merton · Exotic options: digital, barrier, Asian, lookback · Risk measures: VaR & Expected Shortfall · Credit risk: hazard rates & structural models · Copulas & dependence in the tails
