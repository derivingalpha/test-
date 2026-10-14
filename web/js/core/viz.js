/* MathForge visualisation engine: a world-coordinate canvas Graph, slider explorables and step-through walkthroughs. */
(function (G) {
  'use strict';
  const MF = G.MF, el = MF.el;

  const C = MF.colors = {
    fe: '#4cc9f0', fe2: '#a78bfa', speed: '#ffb347', speed2: '#ff7b54', good: '#34d399', bad: '#f87171',
    warn: '#fbbf24', pink: '#f472b6', text: '#e6ebf5', muted: '#95a1bb', dim: '#66728c', grid: '#1a2335', axis: '#3a4766', bg: '#070b13',
    series: ['#4cc9f0', '#ffb347', '#f472b6', '#34d399', '#a78bfa', '#fbbf24', '#ff7b54', '#93c5fd'],
  };
  const alpha = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
  C.alpha = alpha;

  /* ---------- Graph ---------- */
  class Graph {
    constructor(canvas, height) {
      this.cv = canvas; this.ctx = canvas.getContext('2d'); this.h0 = height || 320;
      this.pad = { l: 46, r: 16, t: 14, b: 30 };
      this.resize();
      this.view(0, 1, 0, 1);
    }
    resize() {
      const dpr = Math.min(G.devicePixelRatio || 1, 2);
      const w = this.cv.clientWidth || this.cv.parentElement.clientWidth || 600;
      this.W = w; this.H = this.h0;
      this.cv.style.height = this.H + 'px';
      this.cv.width = Math.round(w * dpr); this.cv.height = Math.round(this.H * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    /** world window. y0 maps to bottom, y1 to top (pass y0 > y1 for a y-down world). */
    view(x0, x1, y0, y1, pad) {
      if (pad) this.pad = Object.assign({}, this.pad, pad);
      this.x0 = x0; this.x1 = x1; this.y0 = y0; this.y1 = y1; return this;
    }
    noPad() { this.pad = { l: 0, r: 0, t: 0, b: 0 }; return this; }
    get pw() { return this.W - this.pad.l - this.pad.r; }
    get ph() { return this.H - this.pad.t - this.pad.b; }
    X(x) { return this.pad.l + (x - this.x0) / (this.x1 - this.x0) * this.pw; }
    Y(y) { return this.pad.t + (this.y1 - y) / (this.y1 - this.y0) * this.ph; }
    invX(px) { return this.x0 + (px - this.pad.l) / this.pw * (this.x1 - this.x0); }
    invY(py) { return this.y1 - (py - this.pad.t) / this.ph * (this.y1 - this.y0); }
    clear() { const c = this.ctx; c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.cv.width, this.cv.height); c.restore(); return this; }
    _style(o = {}) {
      const c = this.ctx;
      c.strokeStyle = o.color || C.fe; c.fillStyle = o.fill || o.color || C.fe;
      c.lineWidth = o.width || 2; c.setLineDash(o.dash || []); c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      c.lineJoin = 'round'; c.lineCap = 'round';
    }
    _reset() { const c = this.ctx; c.setLineDash([]); c.globalAlpha = 1; }
    static niceStep(range, target = 8) {
      const raw = range / target, p = Math.pow(10, Math.floor(Math.log10(raw))), m = raw / p;
      return (m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10) * p;
    }
    /** grid + axes + tick labels */
    axes(o = {}) {
      const c = this.ctx, xs = o.xstep || Graph.niceStep(Math.abs(this.x1 - this.x0), o.xt || 8), ys = o.ystep || Graph.niceStep(Math.abs(this.y1 - this.y0), o.yt || 6);
      const fx = o.fx || (v => MF.fmt(v, 4)), fy = o.fy || (v => MF.fmt(v, 4));
      const xl = Math.min(this.x0, this.x1), xh = Math.max(this.x0, this.x1), yl = Math.min(this.y0, this.y1), yh = Math.max(this.y0, this.y1);
      c.font = '11px ui-monospace, Menlo, monospace'; c.lineWidth = 1; c.setLineDash([]);
      c.textAlign = 'center'; c.textBaseline = 'top';
      for (let x = Math.ceil(xl / xs - 1e-9) * xs; x <= xh + 1e-9; x += xs) {
        const px = this.X(x); c.strokeStyle = C.grid; c.beginPath(); c.moveTo(px, this.pad.t); c.lineTo(px, this.H - this.pad.b); c.stroke();
        if (o.labels !== false) { c.fillStyle = C.dim; c.fillText(fx(M0(x)), px, this.H - this.pad.b + 6); }
      }
      c.textAlign = 'right'; c.textBaseline = 'middle';
      for (let y = Math.ceil(yl / ys - 1e-9) * ys; y <= yh + 1e-9; y += ys) {
        const py = this.Y(y); c.strokeStyle = C.grid; c.beginPath(); c.moveTo(this.pad.l, py); c.lineTo(this.W - this.pad.r, py); c.stroke();
        if (o.labels !== false) { c.fillStyle = C.dim; c.fillText(fy(M0(y)), this.pad.l - 6, py); }
      }
      c.strokeStyle = C.axis; c.lineWidth = 1.3;
      if (yl <= 0 && yh >= 0) { c.beginPath(); c.moveTo(this.pad.l, this.Y(0)); c.lineTo(this.W - this.pad.r, this.Y(0)); c.stroke(); }
      if (xl <= 0 && xh >= 0) { c.beginPath(); c.moveTo(this.X(0), this.pad.t); c.lineTo(this.X(0), this.H - this.pad.b); c.stroke(); }
      if (o.xlabel) { c.fillStyle = C.muted; c.textAlign = 'right'; c.textBaseline = 'bottom'; c.fillText(o.xlabel, this.W - this.pad.r - 2, this.H - this.pad.b - 4); }
      if (o.ylabel) { c.fillStyle = C.muted; c.textAlign = 'left'; c.textBaseline = 'top'; c.fillText(o.ylabel, this.pad.l + 6, this.pad.t + 2); }
      return this;
    }
    fn(f, o = {}) {
      const c = this.ctx, a = o.from != null ? o.from : Math.min(this.x0, this.x1), b = o.to != null ? o.to : Math.max(this.x0, this.x1), n = o.n || 400;
      this._style(o); c.beginPath(); let pen = false;
      const ylo = Math.min(this.y0, this.y1), yhi = Math.max(this.y0, this.y1), span = yhi - ylo;
      for (let i = 0; i <= n; i++) {
        const x = a + (b - a) * i / n, y = f(x);
        if (!Number.isFinite(y) || y > yhi + 5 * span || y < ylo - 5 * span) { pen = false; continue; }
        if (!pen) { c.moveTo(this.X(x), this.Y(y)); pen = true; } else c.lineTo(this.X(x), this.Y(y));
      }
      c.stroke(); this._reset(); return this;
    }
    /** shaded area between f and g (default 0) on [a,b] */
    area(f, a, b, o = {}) {
      const c = this.ctx, n = o.n || 200, g = o.g || (() => 0);
      c.fillStyle = o.color || alpha(C.fe, 0.25); c.globalAlpha = 1; c.beginPath();
      for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; const px = this.X(x), py = this.Y(f(x)); i ? c.lineTo(px, py) : c.moveTo(px, py); }
      for (let i = n; i >= 0; i--) { const x = a + (b - a) * i / n; c.lineTo(this.X(x), this.Y(g(x))); }
      c.closePath(); c.fill(); return this;
    }
    path(pts, o = {}) {
      const c = this.ctx; if (!pts.length) return this; this._style(o); c.beginPath();
      pts.forEach((p, i) => i ? c.lineTo(this.X(p[0]), this.Y(p[1])) : c.moveTo(this.X(p[0]), this.Y(p[1])));
      if (o.close) c.closePath();
      if (o.fill) { c.fillStyle = o.fill; c.fill(); }
      if (o.stroke !== false) c.stroke();
      this._reset(); return this;
    }
    line(x1, y1, x2, y2, o = {}) { return this.path([[x1, y1], [x2, y2]], o); }
    hline(y, o = {}) { return this.line(Math.min(this.x0, this.x1), y, Math.max(this.x0, this.x1), y, Object.assign({ width: 1, dash: [4, 4], color: C.muted }, o)); }
    vline(x, o = {}) { return this.line(x, Math.min(this.y0, this.y1), x, Math.max(this.y0, this.y1), Object.assign({ width: 1, dash: [4, 4], color: C.muted }, o)); }
    arrow(x1, y1, x2, y2, o = {}) {
      this.line(x1, y1, x2, y2, o);
      const c = this.ctx, X1 = this.X(x1), Y1 = this.Y(y1), X2 = this.X(x2), Y2 = this.Y(y2), ang = Math.atan2(Y2 - Y1, X2 - X1), s = o.head || 9;
      c.fillStyle = o.color || C.fe; c.beginPath(); c.moveTo(X2, Y2);
      c.lineTo(X2 - s * Math.cos(ang - 0.4), Y2 - s * Math.sin(ang - 0.4)); c.lineTo(X2 - s * Math.cos(ang + 0.4), Y2 - s * Math.sin(ang + 0.4)); c.closePath(); c.fill();
      return this;
    }
    /** pixel-space curved jump arrow between two world x positions at world y (number lines) */
    jump(xa, xb, y, o = {}) {
      const c = this.ctx, A = this.X(xa), B = this.X(xb), Y = this.Y(y), hgt = o.h || Math.min(60, Math.abs(B - A) * 0.45 + 12) * (o.below ? -1 : 1);
      c.strokeStyle = o.color || C.speed; c.lineWidth = o.width || 2.5; c.setLineDash([]); c.beginPath();
      c.moveTo(A, Y); c.quadraticCurveTo((A + B) / 2, Y - 2 * hgt, B, Y); c.stroke();
      const ang = Math.atan2(Y - (Y - 2 * hgt), B - (A + B) / 2), s = 9;
      c.fillStyle = o.color || C.speed; c.beginPath(); c.moveTo(B, Y); c.lineTo(B - s * Math.cos(ang - 0.45), Y - s * Math.sin(ang - 0.45)); c.lineTo(B - s * Math.cos(ang + 0.45), Y - s * Math.sin(ang + 0.45)); c.closePath(); c.fill();
      if (o.label != null) { this.ptext(o.label, (A + B) / 2, Y - hgt - (o.below ? -16 : 10), { color: o.color || C.speed, size: o.size || 14, bold: true }); }
      return this;
    }
    dot(x, y, o = {}) { const c = this.ctx; c.fillStyle = o.color || C.fe; c.globalAlpha = o.alpha == null ? 1 : o.alpha; c.beginPath(); c.arc(this.X(x), this.Y(y), o.r || 4, 0, Math.PI * 2); c.fill(); if (o.ring) { c.strokeStyle = o.ring; c.lineWidth = 2; c.stroke(); } c.globalAlpha = 1; return this; }
    rect(x, y, w, h, o = {}) { // world rect from (x,y) spanning w,h
      const c = this.ctx, X1 = this.X(x), Y1 = this.Y(y), X2 = this.X(x + w), Y2 = this.Y(y + h);
      const L = Math.min(X1, X2), T = Math.min(Y1, Y2), Wd = Math.abs(X2 - X1), Ht = Math.abs(Y2 - Y1);
      c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      if (o.fill) { c.fillStyle = o.fill; c.fillRect(L, T, Wd, Ht); }
      if (o.color) { c.strokeStyle = o.color; c.lineWidth = o.width || 1.5; c.setLineDash(o.dash || []); c.strokeRect(L + .5, T + .5, Wd - 1, Ht - 1); }
      this._reset();
      if (o.label != null) this.ptext(o.label, L + Wd / 2, T + Ht / 2, { color: o.labelColor || C.text, size: o.size || Math.max(10, Math.min(22, Math.min(Wd, Ht) * 0.3)), bold: true });
      return this;
    }
    text(s, x, y, o = {}) { return this.ptext(s, this.X(x) + (o.dx || 0), this.Y(y) + (o.dy || 0), o); }
    ptext(s, px, py, o = {}) {
      const c = this.ctx; c.font = `${o.bold ? '700 ' : ''}${o.size || 12}px ${o.mono ? 'ui-monospace, Menlo, monospace' : 'Inter, system-ui, sans-serif'}`;
      c.fillStyle = o.color || C.text; c.textAlign = o.align || 'center'; c.textBaseline = o.base || 'middle'; c.globalAlpha = o.alpha == null ? 1 : o.alpha;
      c.fillText(s, px, py); c.globalAlpha = 1; return this;
    }
    /** histogram from data on [a,b] with k bins, scaled as density if o.density */
    hist(data, a, b, k, o = {}) {
      const w = (b - a) / k, cnt = new Array(k).fill(0);
      for (const v of data) { const i = Math.floor((v - a) / w); if (i >= 0 && i < k) cnt[i]++; }
      const scale = o.density ? 1 / (data.length * w) : 1;
      cnt.forEach((n, i) => this.rect(a + i * w, 0, w, n * scale, { fill: o.fill || alpha(C.fe, 0.35), color: o.color || alpha(C.fe, 0.8), width: 1 }));
      return cnt.map(n => n * scale);
    }
    legend(items, o = {}) { // items [[label,color]]
      const c = this.ctx; let px = o.x != null ? o.x : this.pad.l + 10, py = o.y != null ? o.y : this.pad.t + 10;
      c.font = '12px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'; c.textAlign = 'left';
      for (const [lab, col] of items) { c.fillStyle = col; c.fillRect(px, py - 2, 14, 4); c.fillStyle = C.muted; c.fillText(lab, px + 20, py); py += 17; }
      return this;
    }
  }
  function M0(v) { return Math.abs(v) < 1e-10 ? 0 : v; }
  MF.Graph = Graph;

  /* ---------- containers ---------- */
  function shell(host, title) {
    const box = el('div', { class: 'viz' });
    if (title) box.append(el('div', { class: 'viz-title', text: title }));
    host.append(box); return box;
  }
  function makeCanvas(box, height) {
    const cv = el('canvas'); box.append(cv);
    const g = new Graph(cv, height);
    return g;
  }
  function onResize(box, g, redraw) {
    if (typeof ResizeObserver === 'undefined') return;
    let lastW = g.W;
    const ro = new ResizeObserver(() => { const w = g.cv.clientWidth; if (w && Math.abs(w - lastW) > 2) { lastW = w; g.resize(); redraw(); } });
    ro.observe(box);
  }

  /** Build a control (slider/number/select/toggle). Returns {node, get()} */
  function control(p, onChange) {
    const wrap = el('div', { class: 'ctl' });
    const fmt = p.fmt || (v => MF.fmt(v, 4));
    if (p.type === 'select') {
      const sel = el('select', null, ...p.options.map(o => el('option', { value: o[0] }, o[1])));
      sel.value = p.value; sel.addEventListener('change', onChange);
      wrap.append(el('div', { class: 'lab' }, el('span', { text: p.label })), sel);
      return { node: wrap, get: () => sel.value, set: v => { sel.value = v; } };
    }
    if (p.type === 'toggle') {
      const cb = el('input', { type: 'checkbox' }); cb.checked = !!p.value; cb.addEventListener('change', onChange);
      wrap.append(el('label', { class: 'chk' }, cb, p.label));
      return { node: wrap, get: () => cb.checked, set: v => { cb.checked = v; } };
    }
    if (p.type === 'number' || p.type === 'text') {
      const inp = el('input', { type: p.type === 'text' ? 'text' : 'number', value: p.value, min: p.min, max: p.max, step: p.step || 1 });
      inp.addEventListener('input', onChange);
      wrap.append(el('div', { class: 'lab' }, el('span', { text: p.label })), inp);
      const get = () => { if (p.type === 'text') return inp.value; let v = parseFloat(inp.value); if (!Number.isFinite(v)) v = p.value; if (p.min != null) v = Math.max(p.min, v); if (p.max != null) v = Math.min(p.max, v); return v; };
      return { node: wrap, get, set: v => { inp.value = v; } };
    }
    const val = el('b');
    const inp = el('input', { type: 'range', min: p.min, max: p.max, step: p.step || (p.max - p.min) / 100, value: p.value });
    const upd = () => { val.textContent = fmt(parseFloat(inp.value)); };
    inp.addEventListener('input', () => { upd(); onChange(); }); upd();
    wrap.append(el('div', { class: 'lab' }, el('span', { text: p.label }), val), inp);
    return { node: wrap, get: () => parseFloat(inp.value), set: v => { inp.value = v; upd(); } };
  }

  /**
   * Interactive explorable.
   * cfg: {title, height, params:[{id,label,min,max,step,value,fmt,type}], draw(g,p,state), info(p,state)->html,
   *       buttons:[{label, click(state,p)}], init(state), animate:bool, onPointer(g,p,state,{x,y,type})}
   */
  MF.explore = function (host, cfg) {
    const box = shell(host, cfg.title);
    const g = makeCanvas(box, cfg.height || 320);
    const state = {}; const ctls = {};
    const controls = el('div', { class: 'controls' });
    const info = el('div', { class: 'readout' });
    const params = () => { const p = {}; for (const k in ctls) p[k] = ctls[k].get(); return p; };
    let raf = 0;
    const redraw = () => {
      const p = params();
      g.clear(); g.pad = { l: 46, r: 16, t: 14, b: 30 };
      try { cfg.draw(g, p, state); } catch (e) { console.error(e); }
      if (cfg.info) { info.innerHTML = cfg.info(p, state) || ''; MF.renderMath(info); }
    };
    state.redraw = redraw;
    state.set = (id, v) => { if (ctls[id]) ctls[id].set(v); };
    (cfg.params || []).forEach(p => { const c = control(p, () => { if (cfg.onChange) cfg.onChange(params(), state); redraw(); }); ctls[p.id] = c; controls.append(c.node); });
    if (cfg.params && cfg.params.length) box.append(controls);
    if (cfg.buttons) {
      const bs = el('div', { class: 'btns' });
      cfg.buttons.forEach(b => bs.append(el('button', { class: 'btn sm', onclick: () => { b.click(state, params()); redraw(); } }, b.label)));
      box.append(bs);
    }
    box.append(info);
    if (cfg.init) cfg.init(state, params());
    if (cfg.onPointer) {
      const handler = type => ev => {
        if (type === 'move' && !state._down && ev.pointerType !== 'mouse') return;
        if (type === 'down') state._down = true; if (type === 'up') state._down = false;
        const r = g.cv.getBoundingClientRect(); const px = ev.clientX - r.left, py = ev.clientY - r.top;
        if (cfg.onPointer(g, params(), state, { x: g.invX(px), y: g.invY(py), px, py, type, down: state._down }) !== false) redraw();
      };
      g.cv.addEventListener('pointerdown', handler('down')); g.cv.addEventListener('pointermove', handler('move')); G.addEventListener('pointerup', () => { state._down = false; });
    }
    if (cfg.animate) {
      const loop = t => { if (!document.body.contains(box)) return; state.t = t; redraw(); raf = requestAnimationFrame(loop); };
      raf = requestAnimationFrame(loop);
    }
    // defer first draw until laid out
    requestAnimationFrame(() => { g.resize(); redraw(); });
    onResize(box, g, redraw);
    return { box, g, state, redraw };
  };

  /**
   * Step-through walkthrough. cfg: {title, height, inputs:[{id,label,value,min,max}], random()->values, frames(values)->[{draw(g), say:html}]}
   */
  MF.walk = function (host, cfg) {
    const box = shell(host, cfg.title);
    const g = makeCanvas(box, cfg.height || 300);
    const ctls = {}; const controls = el('div', { class: 'controls' });
    const caption = el('div', { class: 'caption' });
    const counter = el('span', { class: 'dim small' });
    let frames = [], i = 0;
    const vals = () => { const v = {}; for (const k in ctls) v[k] = ctls[k].get(); return v; };
    const build = () => { try { frames = cfg.frames(vals()); } catch (e) { console.error(e); frames = [{ draw() { }, say: 'Invalid input' }]; } i = Math.min(i, frames.length - 1); show(); };
    const show = () => {
      g.clear(); g.pad = { l: 10, r: 10, t: 10, b: 10 };
      const f = frames[i]; if (!f) return;
      try { f.draw(g); } catch (e) { console.error(e); }
      caption.innerHTML = f.say || ''; MF.renderMath(caption);
      counter.textContent = `step ${i + 1} / ${frames.length}`;
      prev.disabled = i === 0; next.disabled = i === frames.length - 1;
    };
    (cfg.inputs || []).forEach(p => { const c = control(Object.assign({ type: 'number' }, p), () => { i = 0; build(); }); ctls[p.id] = c; controls.append(c.node); });
    const prev = el('button', { class: 'btn sm', onclick: () => { if (i > 0) { i--; show(); } } }, '◀ Back');
    const next = el('button', { class: 'btn sm speedish', onclick: () => { if (i < frames.length - 1) { i++; show(); } } }, 'Next ▶');
    const btns = el('div', { class: 'btns' }, prev, next);
    if (cfg.random) btns.append(el('button', { class: 'btn sm ghost', onclick: () => { const v = cfg.random(); for (const k in v) if (ctls[k]) ctls[k].set(v[k]); i = 0; build(); } }, '🎲 New example'));
    btns.append(el('button', { class: 'btn sm ghost', onclick: () => { i = frames.length - 1; show(); } }, 'Show answer'));
    btns.append(el('span', { class: 'spacer' }), counter);
    if (cfg.inputs && cfg.inputs.length) box.append(controls);
    box.append(caption, btns);
    requestAnimationFrame(() => { g.resize(); build(); });
    onResize(box, g, show);
    return { box, g };
  };

  /** Static figure: draw once (and on resize). */
  MF.figure = function (host, cfg) {
    const box = shell(host, cfg.title);
    const g = makeCanvas(box, cfg.height || 260);
    const redraw = () => { g.clear(); g.pad = { l: 46, r: 16, t: 14, b: 30 }; cfg.draw(g); };
    if (cfg.caption) { const c = el('div', { class: 'readout', html: cfg.caption }); box.append(c); MF.renderMath(c); }
    requestAnimationFrame(() => { g.resize(); redraw(); });
    onResize(box, g, redraw);
    return { box, g };
  };

  /* ---------- reusable drawings ---------- */
  /** Draw a soroban (Japanese abacus) showing value n with `rods` rods inside pixel box. */
  MF.drawSoroban = function (g, n, rods, o = {}) {
    const c = g.ctx, W = o.w || g.W, H = o.h || g.H, ox = o.x || 0, oy = o.y || 0;
    const digits = String(Math.max(0, Math.floor(n))).padStart(rods, '0').slice(-rods).split('').map(Number);
    const fw = Math.min(W - 20, rods * 64), fx = ox + (W - fw) / 2, fy = oy + 12, fh = H - (o.labels ? 40 : 24), rw = fw / rods;
    const beamY = fy + fh * 0.32, bw = Math.min(rw * 0.78, 52), bh = Math.min(fh * 0.1, 22);
    c.fillStyle = '#2a1d12'; c.fillRect(fx - 8, fy - 8, fw + 16, fh + 16);
    c.fillStyle = '#120c08'; c.fillRect(fx, fy, fw, fh);
    c.fillStyle = '#6b4a2b'; c.fillRect(fx, beamY - 3, fw, 6);
    digits.forEach((d, i) => {
      const cx = fx + rw * (i + 0.5);
      c.strokeStyle = '#8c7a66'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, fy); c.lineTo(cx, fy + fh); c.stroke();
      const hl = o.highlight != null && o.highlight === i;
      const bead = (y, on) => { c.fillStyle = on ? (hl ? C.pink : C.speed) : '#4a3a2a'; c.beginPath(); c.ellipse(cx, y, bw / 2, bh / 2, 0, 0, Math.PI * 2); c.fill(); if (on) { c.strokeStyle = 'rgba(255,255,255,.25)'; c.lineWidth = 1; c.stroke(); } };
      const five = d >= 5, ones = d % 5;
      bead(five ? beamY - bh / 2 - 4 : fy + bh / 2 + 4, five);
      for (let k = 0; k < 4; k++) {
        const on = k < ones;
        const y = on ? beamY + 4 + bh / 2 + k * (bh + 2) : fy + fh - 4 - bh / 2 - (3 - k) * (bh + 2);
        bead(y, on);
      }
      if (o.labels) g.ptext(String(d), cx, fy + fh + 2, { color: hl ? C.pink : C.muted, size: 12, mono: true, base: 'top' });
    });
  };

  /** Draw a number line in world units on row y with ticks every `step`. */
  MF.numberLine = function (g, a, b, y, o = {}) {
    const step = o.step || Graph.niceStep(b - a, 10);
    g.line(a, y, b, y, { color: C.axis, width: 2 });
    for (let x = Math.ceil(a / step) * step; x <= b + 1e-9; x += step) {
      g.line(x, y, x, y, { color: C.axis });
      const px = g.X(x), py = g.Y(y); const c = g.ctx; c.strokeStyle = C.axis; c.lineWidth = 1.5; c.beginPath(); c.moveTo(px, py - 5); c.lineTo(px, py + 5); c.stroke();
      if (o.labels !== false) g.ptext(MF.fmt(x, 3), px, py + 16, { color: C.dim, size: 11, mono: true });
    }
  };
})(window);
