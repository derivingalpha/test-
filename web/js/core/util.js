/* MathForge core utilities: random numbers, math library, formatting, answer parsing. */
(function (G) {
  'use strict';
  const MF = G.MF = G.MF || {};

  /** String.raw so LaTeX backslashes can be written once inside lesson text. */
  MF.h = String.raw;

  /* ---------- random ---------- */
  const R = MF.R = {
    rand: Math.random,
    int(a, b) { return a + Math.floor(R.rand() * (b - a + 1)); },
    float(a, b, dp) { const v = a + R.rand() * (b - a); return dp == null ? v : M.round(v, dp); },
    pick(arr) { return arr[Math.floor(R.rand() * arr.length)]; },
    sign() { return R.rand() < 0.5 ? -1 : 1; },
    shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(R.rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    intNot(a, b, bad) { let v; do { v = R.int(a, b); } while (bad.includes(v)); return v; },
    normal() { let u = 0, v = 0; while (u === 0) u = R.rand(); while (v === 0) v = R.rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
    /** deterministic generator, for reproducible simulated paths */
    seeded(seed) {
      let s = seed >>> 0;
      const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
      let spare = null;
      rnd.normal = () => {
        if (spare !== null) { const v = spare; spare = null; return v; }
        let u = 0, v = 0; while (u === 0) u = rnd(); v = rnd();
        const r = Math.sqrt(-2 * Math.log(u)); spare = r * Math.sin(2 * Math.PI * v); return r * Math.cos(2 * Math.PI * v);
      };
      return rnd;
    },
  };

  /* ---------- math ---------- */
  const M = MF.M = {
    round(x, dp = 0) { const f = Math.pow(10, dp); return Math.round((x + Number.EPSILON * Math.sign(x)) * f) / f; },
    clamp(x, a, b) { return Math.max(a, Math.min(b, x)); },
    lerp(a, b, t) { return a + (b - a) * t; },
    gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; },
    lcm(a, b) { return Math.abs(a * b) / M.gcd(a, b); },
    fact(n) { let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; },
    choose(n, k) { if (k < 0 || k > n) return 0; k = Math.min(k, n - k); let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); },
    digitSum(n) { return String(Math.abs(n)).split('').reduce((s, d) => s + (+d || 0), 0); },
    digitalRoot(n) { n = Math.abs(n); return n === 0 ? 0 : 1 + ((n - 1) % 9); },
    sum(a) { return a.reduce((s, x) => s + x, 0); },
    mean(a) { return M.sum(a) / a.length; },
    variance(a, sample = true) { const m = M.mean(a); return a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - (sample ? 1 : 0)); },
    std(a, sample = true) { return Math.sqrt(M.variance(a, sample)); },
    linspace(a, b, n) { const r = []; for (let i = 0; i < n; i++) r.push(a + (b - a) * i / (n - 1)); return r; },
    erf(x) { // Abramowitz-Stegun 7.1.26 refined via erfc series for accuracy ~1e-7
      const s = Math.sign(x); x = Math.abs(x);
      const t = 1 / (1 + 0.5 * x);
      const y = 1 - t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
      return s * y;
    },
    npdf(x, mu = 0, s = 1) { const z = (x - mu) / s; return Math.exp(-0.5 * z * z) / (s * Math.sqrt(2 * Math.PI)); },
    ncdf(x, mu = 0, s = 1) { return 0.5 * (1 + M.erf((x - mu) / (s * Math.SQRT2))); },
    ninv(p) { // Acklam's algorithm
      if (p <= 0) return -Infinity; if (p >= 1) return Infinity;
      const a = [-39.69683028665376, 220.9460984245205, -275.9285104469687, 138.357751867269, -30.66479806614716, 2.506628277459239];
      const b = [-54.47609879822406, 161.5858368580409, -155.6989798598866, 66.80131188771972, -13.28068155288572];
      const c = [-0.007784894002430293, -0.3223964580411365, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
      const d = [0.007784695709041462, 0.3224671290700398, 2.445134137142996, 3.754408661907416];
      const pl = 0.02425; let q, r;
      if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
      if (p > 1 - pl) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
      q = p - 0.5; r = q * q;
      return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
    },
    binomPmf(n, k, p) { return M.choose(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k); },
    poissonPmf(l, k) { return Math.exp(-l + k * Math.log(l) - M.lnFact(k)); },
    lnFact(n) { let s = 0; for (let i = 2; i <= n; i++) s += Math.log(i); return s; },
    /* Black-Scholes */
    bsD1(S, K, T, r, s, q = 0) { return (Math.log(S / K) + (r - q + 0.5 * s * s) * T) / (s * Math.sqrt(T)); },
    bs(S, K, T, r, s, type = 'call', q = 0) {
      if (T <= 0) return Math.max(type === 'call' ? S - K : K - S, 0);
      const d1 = M.bsD1(S, K, T, r, s, q), d2 = d1 - s * Math.sqrt(T);
      return type === 'call' ? S * Math.exp(-q * T) * M.ncdf(d1) - K * Math.exp(-r * T) * M.ncdf(d2)
        : K * Math.exp(-r * T) * M.ncdf(-d2) - S * Math.exp(-q * T) * M.ncdf(-d1);
    },
    greeks(S, K, T, r, s, type = 'call') {
      const d1 = M.bsD1(S, K, T, r, s), d2 = d1 - s * Math.sqrt(T), sq = Math.sqrt(T), n1 = M.npdf(d1);
      const call = type === 'call';
      return {
        delta: call ? M.ncdf(d1) : M.ncdf(d1) - 1,
        gamma: n1 / (S * s * sq),
        vega: S * n1 * sq,
        theta: call ? -S * n1 * s / (2 * sq) - r * K * Math.exp(-r * T) * M.ncdf(d2) : -S * n1 * s / (2 * sq) + r * K * Math.exp(-r * T) * M.ncdf(-d2),
        rho: call ? K * T * Math.exp(-r * T) * M.ncdf(d2) : -K * T * Math.exp(-r * T) * M.ncdf(-d2),
      };
    },
    impliedVol(price, S, K, T, r, type = 'call') {
      let lo = 1e-4, hi = 5;
      for (let i = 0; i < 100; i++) { const mid = (lo + hi) / 2; if (M.bs(S, K, T, r, mid, type) > price) hi = mid; else lo = mid; }
      return (lo + hi) / 2;
    },
    /* time value of money */
    annuityPV(C, r, n) { return r === 0 ? C * n : C * (1 - Math.pow(1 + r, -n)) / r; },
    annuityFV(C, r, n) { return r === 0 ? C * n : C * (Math.pow(1 + r, n) - 1) / r; },
    payment(P, r, n) { return r === 0 ? P / n : P * r / (1 - Math.pow(1 + r, -n)); },
    npv(r, cfs) { return cfs.reduce((s, c, t) => s + c / Math.pow(1 + r, t), 0); },
    irr(cfs) { let lo = -0.99, hi = 10; const f = r => M.npv(r, cfs); if (f(lo) * f(hi) > 0) return NaN; for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (f(lo) * f(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; },
    bondPrice(F, c, y, n, m = 1) { const C = F * c / m, i = y / m, N = n * m; return M.annuityPV(C, i, N) + F / Math.pow(1 + i, N); },
    bondYield(P, F, c, n, m = 1) { let lo = -0.5, hi = 2; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (M.bondPrice(F, c, mid, n, m) > P) lo = mid; else hi = mid; } return (lo + hi) / 2; },
    macaulay(F, c, y, n, m = 1) { const C = F * c / m, i = y / m, N = n * m; let pv = 0, w = 0; for (let k = 1; k <= N; k++) { const cf = C + (k === N ? F : 0), d = cf / Math.pow(1 + i, k); pv += d; w += (k / m) * d; } return w / pv; },
    /* small linear algebra */
    mat2: {
      mul(A, B) { return [[A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]], [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]]]; },
      det(A) { return A[0][0] * A[1][1] - A[0][1] * A[1][0]; },
      eig(A) { const tr = A[0][0] + A[1][1], d = M.mat2.det(A), disc = tr * tr / 4 - d; if (disc < 0) return null; const s = Math.sqrt(disc); return [tr / 2 + s, tr / 2 - s]; },
      eigvec(A, l) { const b = A[0][1], c = A[1][0]; let v; if (Math.abs(b) > 1e-12) v = [b, l - A[0][0]]; else if (Math.abs(c) > 1e-12) v = [l - A[1][1], c]; else v = Math.abs(A[0][0] - l) < 1e-12 ? [1, 0] : [0, 1]; const n = Math.hypot(v[0], v[1]); return [v[0] / n, v[1] / n]; },
    },
  };

  /* ---------- formatting ---------- */
  MF.fmt = function (x, dp = 2) {
    if (x == null || Number.isNaN(x)) return '—';
    if (!Number.isFinite(x)) return x > 0 ? '∞' : '−∞';
    const v = M.round(x, dp);
    const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: dp });
    return (v < 0 ? '−' : '') + s;
  };
  /** fixed decimals, no separators — for TeX */
  MF.fx = function (x, dp = 2) { const v = M.round(x, dp); let s = v.toFixed(dp); if (dp > 0) s = s.replace(/\.?0+$/, ''); return s === '-0' ? '0' : s; };
  MF.pct = function (x, dp = 2) { return MF.fmt(x * 100, dp) + '%'; };
  /** integer with thin-space thousands grouping usable in TeX */
  MF.num = function (n) { const s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '{,}'); return (n < 0 ? '-' : '') + s; };
  MF.esc = function (s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); };

  /* ---------- answer parsing ---------- */
  /** Parse a user answer: numbers with commas, %, fractions, scientific notation and simple + - * / ^ ( ) expressions, sqrt(), ln(), exp(), pi, e. */
  MF.parseAnswer = function (raw) {
    if (raw == null) return { ok: false };
    let s = String(raw).trim().toLowerCase();
    if (!s) return { ok: false };
    s = s.replace(/[\s$€£₹]/g, '').replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/');
    s = s.replace(/(\d),(?=\d{3}(\D|$))/g, '$1');
    let pctSign = false;
    if (s.endsWith('%')) { pctSign = true; s = s.slice(0, -1); }
    const toks = []; let i = 0;
    while (i < s.length) {
      const c = s[i];
      const m = /^(\d+\.?\d*|\.\d+)(e[+-]?\d+)?/.exec(s.slice(i));
      if (m) { toks.push({ t: 'n', v: parseFloat(m[0]) }); i += m[0].length; continue; }
      const w = /^(sqrt|ln|log|exp|pi|e)/.exec(s.slice(i));
      if (w) { toks.push(w[0] === 'pi' ? { t: 'n', v: Math.PI } : w[0] === 'e' ? { t: 'n', v: Math.E } : { t: 'f', v: w[0] }); i += w[0].length; continue; }
      if ('+-*/^()'.includes(c)) { toks.push({ t: c }); i++; continue; }
      return { ok: false };
    }
    let p = 0;
    const peek = () => toks[p], eat = t => (toks[p] && toks[p].t === t ? toks[p++] : null);
    function expr() { let v = term(); for (;;) { if (eat('+')) v += term(); else if (eat('-')) v -= term(); else return v; } }
    function term() { let v = unary(); for (;;) { if (eat('*')) v *= unary(); else if (eat('/')) v /= unary(); else if (peek() && (peek().t === 'n' || peek().t === '(' || peek().t === 'f')) v *= unary(); else return v; } }
    function unary() { if (eat('-')) return -unary(); if (eat('+')) return unary(); return power(); }
    function power() { const b = atom(); if (eat('^')) return Math.pow(b, unary()); return b; }
    function atom() {
      const t = toks[p++]; if (!t) throw 0;
      if (t.t === 'n') return t.v;
      if (t.t === '(') { const v = expr(); if (!eat(')')) throw 0; return v; }
      if (t.t === 'f') { const a = atom(); return { sqrt: Math.sqrt, ln: Math.log, log: Math.log10, exp: Math.exp }[t.v](a); }
      throw 0;
    }
    try { const v = expr(); if (p !== toks.length || !Number.isFinite(v)) return { ok: false }; return { ok: true, v, pct: pctSign }; }
    catch (e) { return { ok: false }; }
  };

  /** Check a parsed answer against problem p ({a, tol, rtol}). */
  MF.checkAnswer = function (p, raw) {
    const r = MF.parseAnswer(raw);
    if (!r.ok) return { valid: false };
    const a = p.a;
    const tol = p.tol != null ? p.tol : p.rtol != null ? Math.abs(a) * p.rtol
      : (Number.isInteger(a) ? 1e-9 : Math.max(Math.abs(a) * 0.005, 0.006));
    const near = v => Math.abs(v - a) <= tol + 1e-12;
    const ok = near(r.v) || (r.pct && near(r.v / 100));
    return { valid: true, ok, value: r.v };
  };

  /* ---------- DOM helpers ---------- */
  MF.el = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) {
      const v = attrs[k];
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
    }
    for (const k of kids.flat()) if (k != null) e.append(k.nodeType ? k : document.createTextNode(k));
    return e;
  };
  MF.renderMath = function (node) {
    if (!node || typeof G.renderMathInElement !== 'function') return;
    try {
      G.renderMathInElement(node, {
        delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
        throwOnError: false, ignoredTags: ['script', 'noscript', 'style', 'textarea', 'pre', 'code', 'input'],
      });
    } catch (e) { /* render best-effort */ }
  };
  MF.tex = function (s, display) {
    if (G.katex) { try { return G.katex.renderToString(s, { throwOnError: false, displayMode: !!display }); } catch (e) { } }
    return MF.esc(s);
  };
})(typeof window !== 'undefined' ? window : globalThis);
