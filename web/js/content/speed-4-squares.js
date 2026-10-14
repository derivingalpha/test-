/* Speed Math · Unit 4: squares, roots and powers */
(function () {
  'use strict';
  const { h, R, M, colors: C } = MF;

  /** draw (a+b)^2 square decomposition in pixel space */
  function squareParts(g, a, b, o = {}) {
    g.noPad(); const S = Math.min(g.W - 200, g.H - 30), tot = a + b, u = S / tot, ox = 30, oy = 15, c = g.ctx;
    const cells = [[0, 0, a, a, C.speed, `${a}²=${a * a}`], [a, 0, b, a, C.fe, `${a}·${b}`], [0, a, a, b, C.fe, `${a}·${b}`], [a, a, b, b, C.pink, `${b}²`]];
    cells.forEach(([x, y, w, hh, col, lab], i) => { if (o.show && !o.show.includes(i)) return; c.fillStyle = C.alpha(col, 0.65); c.fillRect(ox + x * u + 1, oy + y * u + 1, w * u - 2, hh * u - 2); if (w * u > 40 && hh * u > 16) g.ptext(lab, ox + (x + w / 2) * u, oy + (y + hh / 2) * u, { bold: true, size: 13, color: '#0b0f17' }); });
    c.strokeStyle = C.text; c.lineWidth = 1.5; c.strokeRect(ox, oy, S, S);
    return { ox, oy, S, u };
  }

  MF.unit('speed', 'sm-u4', 'Squares, Roots & Powers', 'Squares are pictures: big square, two strips, small corner. Roots run that picture backwards.');

  MF.lesson({
    id: 'sm-sq5', title: 'Squaring numbers ending in 5', minutes: 6,
    summary: 'n5² = n(n+1) | 25. So 65² = 6·7 | 25 = 4225.',
    sections: [
      h`<p>$(10n+5)^2 = 100n^2 + 100n + 25 = 100\,n(n+1) + 25$. So multiply the leading part by its successor and append 25:</p>
      <p>$35^2 = 3\cdot4\,|\,25 = 1225$, $85^2 = 72|25 = 7225$, $115^2 = 11\cdot12\,|\,25 = 13225$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Rearranging the strips', height: 300,
        params: [{ id: 'n', label: 'tens part n', min: 1, max: 12, step: 1, value: 6, fmt: v => v }],
        draw(g, p) {
          const n = p.n, a = 10 * n, b = 5; const { ox, oy, u } = squareParts(g, a, b);
          const lx = ox + (a + b) * u + 20; const c = g.ctx;
          [[C.speed, `${a}² = ${a * a}`], [C.fe, `2 strips ${a}×5 = ${a * 10} total`], [C.pink, '5² = 25']].forEach(([col, t], i) => { c.fillStyle = col; c.fillRect(lx, oy + 10 + i * 22, 10, 10); g.ptext(t, lx + 16, oy + 15 + i * 22, { align: 'left', size: 12, color: C.muted }); });
          g.ptext(`${a}² + ${a * 10} = ${a * a + a * 10} = ${n}·${n + 1}·100`, lx, oy + 100, { align: 'left', size: 13, color: C.text, mono: true });
        },
        info: p => h`The two strips $2\times ${10 * p.n}\times 5 = ${100 * p.n}$ add exactly one more "$n$" of hundreds: $${p.n}\cdot${p.n}+${p.n} = ${p.n}\cdot${p.n + 1}$. So $${10 * p.n + 5}^2 = ${p.n * (p.n + 1)}|25 = ${(10 * p.n + 5) ** 2}$.`,
      }) },
      { callout: 'tip', html: 'The same idea gives n5 × m5 when n+m is even: 35 × 75 = (3·7 + (3+7)/2) | 25 = 26|25 = 2625.' },
    ],
    formulas: [h`(10n+5)^2 = 100\,n(n+1) + 25`],
    target: 3,
    drill() { const n = R.int(1, 19); const x = 10 * n + 5; return { q: `${x}²`, a: x * x, sol: `${n}×${n + 1} = ${n * (n + 1)} | 25 → ${x * x}` }; },
  });

  MF.lesson({
    id: 'sm-sq-near', title: 'Squaring near 50 and 100', minutes: 8,
    summary: 'Near 50: (25 ± d) | d². Near 100: (n ± d) | d². For example 47² = 22|09 = 2209 and 96² = 92|16 = 9216.',
    sections: [
      h`<p><b>Near 100:</b> $(100 \pm d)^2 = 100(100 \pm 2d) + d^2$. Add or subtract the deviation <i>again</i> to get the leading part, then square the deviation: $97^2 = (97-3)|3^2 = 94|09 = 9409$; $108^2 = 116|64 = 11664$.</p>
      <p><b>Near 50:</b> $(50 \pm d)^2 = 100(25 \pm d) + d^2$. The leading part is $25\pm d$: $53^2 = 28|09 = 2809$; $46^2 = 21|16 = 2116$.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Square with a deviation', height: 300,
        params: [{ id: 'base', label: 'base', type: 'select', value: '100', options: [['50', '50'], ['100', '100']] }, { id: 'd', label: 'deviation d', min: -12, max: 12, step: 1, value: -4, fmt: v => v }],
        draw(g, p) {
          const B = +p.base, d = p.d, n = B + d;
          g.noPad(); const S = Math.min(g.W - 80, g.H - 30), Mx = Math.max(B, n), u = S / Mx, ox = 30, oy = 15, c = g.ctx;
          c.strokeStyle = C.dim; c.setLineDash([4, 4]); c.strokeRect(ox, oy, B * u, B * u); c.setLineDash([]);
          c.fillStyle = C.alpha(C.speed, 0.55); c.fillRect(ox, oy, n * u, n * u);
          if (d < 0) { c.fillStyle = C.alpha(C.pink, 0.8); c.fillRect(ox + n * u, oy + n * u, -d * u, -d * u); }
          else if (d > 0) { c.fillStyle = C.alpha(C.pink, 0.8); c.fillRect(ox + B * u, oy + B * u, d * u, d * u); }
          g.ptext(`${n}²`, ox + n * u / 2, oy + n * u / 2, { bold: true, size: 18, color: '#1d0e02' });
          g.ptext(`base ${B} (dashed)`, ox + B * u / 2, oy + B * u + 10, { size: 11, color: C.dim, base: 'top' });
        },
        info: p => { const B = +p.base, d = p.d, n = B + d, lead = B === 100 ? n + d : 25 + d; return h`$${n}^2 = ${B === 100 ? `100\\,(${n}${d >= 0 ? '+' : ''}${d})` : `100\\,(25${d >= 0 ? '+' : ''}${d})`} + ${d}^2 = ${lead}|${String(d * d).padStart(2, '0')} = ${n * n}$`; },
      }) },
      { callout: 'tip', html: 'Near 1000 works identically with three trailing digits: 996² = 992|016 = 992016.' },
    ],
    formulas: [h`(100+d)^2 = 100(100+2d) + d^2`, h`(50+d)^2 = 100(25+d) + d^2`],
    target: 4,
    drill() { const near50 = R.rand() < 0.5; const d = R.intNot(-9, 9, [0]); const n = (near50 ? 50 : 100) + d; return { q: `${n}²`, a: n * n, sol: near50 ? `(25${d > 0 ? '+' : ''}${d}) | ${d}² → ${25 + d}|${String(d * d).padStart(2, '0')} = ${n * n}` : `(${n}${d > 0 ? '+' : ''}${d}) | ${d}² → ${n + d}|${String(d * d).padStart(2, '0')} = ${n * n}` }; },
  });

  MF.lesson({
    id: 'sm-sq-any', title: 'Squaring any 2-digit number', minutes: 10,
    summary: 'The up-down method: 43² = 40 × 46 + 3² = 1849. Round to a friendly number, compensate on the other side, add the square of the shift.',
    sections: [
      h`<p>Because $n^2 = (n-d)(n+d) + d^2$, you can move one factor down to a round number and the other up by the same amount:</p>
      <p>$43^2 = 40\times 46 + 3^2 = 1840 + 9 = 1849$.<br>$78^2 = 80\times 76 + 2^2 = 6080 + 4 = 6084$.<br>$67^2 = 70 \times 64 + 9 = 4480 + 9 = 4489$.</p>
      <p>Geometrically: take the strip off one side of the square and glue it on the adjacent side. The result is a rectangle missing one small corner square.</p>`,
      { viz: host => MF.walk(host, {
        title: 'Up-down squaring', height: 300,
        inputs: [{ id: 'n', label: 'n', value: 43, min: 11, max: 99 }],
        random: () => ({ n: R.int(11, 99) }),
        frames({ n }) {
          n = Math.round(n); const lo = Math.floor(n / 10) * 10, hi = lo + 10, r = (n - lo <= hi - n) ? lo : hi, d = Math.abs(n - r), other = n + (n - r);
          const pic = step => g => {
            g.noPad(); const S = Math.min(g.W - 120, g.H - 30), Mx = Math.max(n, other) + 2, u = S / Mx, ox = 30, oy = 15, c = g.ctx;
            if (step === 0) { c.fillStyle = C.alpha(C.speed, 0.6); c.fillRect(ox, oy, n * u, n * u); g.ptext(`${n}×${n}`, ox + n * u / 2, oy + n * u / 2, { bold: true, size: 18, color: '#1d0e02' }); }
            else {
              c.fillStyle = C.alpha(C.speed, 0.6); c.fillRect(ox, oy, r * u, other * u);
              g.ptext(`${r}×${other} = ${r * other}`, ox + r * u / 2, oy + other * u / 2, { bold: true, size: 15, color: '#1d0e02' });
              if (step >= 2) { c.fillStyle = C.alpha(C.pink, 0.85); const cx = r < n ? ox + r * u : ox + n * u, cy = r < n ? oy + n * u : oy + r * u; c.fillRect(cx, oy + Math.min(n, other) * u, d * u, d * u); void cy; g.ptext(`${d}²`, cx + d * u / 2 + 14, oy + Math.min(n, other) * u + d * u / 2, { color: C.pink, bold: true }); }
              c.strokeStyle = C.dim; c.setLineDash([4, 4]); c.strokeRect(ox, oy, n * u, n * u); c.setLineDash([]);
            }
          };
          if (d === 0) return [{ draw: pic(0), say: `${n} is already round: ${n}² = ${n * n}` }];
          return [
            { draw: pic(0), say: `Square ${n}. Nearest round number: <b>${r}</b> (shift ${d}).` },
            { draw: pic(1), say: `Move one side ${r < n ? 'down' : 'up'} to ${r} and the other ${r < n ? 'up' : 'down'} to ${other}: ${r} × ${other} = <b>${r * other}</b>` },
            { draw: pic(2), say: `Add back the corner $${d}^2 = ${d * d}$: <b>${n}² = ${r * other} + ${d * d} = ${n * n}</b>` },
          ];
        },
      }) },
      h`<h3>Successive squares</h3><p>Know one square and get its neighbours for free: $(n+1)^2 = n^2 + 2n + 1 = n^2 + n + (n+1)$. From $40^2 = 1600$: $41^2 = 1600+40+41 = 1681$.</p>`,
      { callout: 'tip', html: 'Memorise squares to 30 by heart (these make the later sections far faster), then use up-down for 31–99.' },
    ],
    formulas: [h`n^2 = (n-d)(n+d) + d^2`, h`(n+1)^2 = n^2 + n + (n+1)`],
    target: 6,
    drill() { const n = R.int(11, 99); const r = Math.round(n / 10) * 10, d = n - r; return { q: `${n}²`, a: n * n, sol: d ? `${r} × ${n + d} + ${d * d} = ${r * (n + d)} + ${d * d} = ${n * n}` : `${n * n}` }; },
  });

  MF.lesson({
    id: 'sm-sqrt', title: 'Estimating square roots', minutes: 10,
    summary: 'Bracket between perfect squares, then linear-interpolate with one Newton step: √x ≈ n + (x − n²)/(2n).',
    sections: [
      h`<p>To estimate $\sqrt{x}$, find the nearest perfect square $n^2$ and nudge it. Since $(n+\delta)^2 \approx n^2 + 2n\delta$:</p>
      $$\sqrt{x} \approx n + \frac{x - n^2}{2n}$$
      <p>$\sqrt{50}$: $n=7$, $\delta \approx \frac{50-49}{14} \approx 0.071$, so $\sqrt{50}\approx 7.071$ (true value 7.0711). This is <b>one step of Newton's method</b>, the same idea you will meet in the financial engineering track for implied volatility.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Tangent-line estimate of √x', height: 300,
        params: [{ id: 'x', label: 'x', min: 2, max: 150, step: 1, value: 50, fmt: v => v }],
        draw(g, p) {
          const x = p.x, n = Math.round(Math.sqrt(x)), est = n + (x - n * n) / (2 * n);
          const lo = Math.max(0, Math.min(x, n * n) - 15), hi = Math.max(x, n * n) + 15;
          g.view(lo, hi, Math.sqrt(lo) - 0.5, Math.sqrt(hi) + 0.3).axes();
          g.fn(Math.sqrt, { color: C.speed, width: 2.5 });
          g.fn(t => n + (t - n * n) / (2 * n), { color: C.fe, dash: [6, 4] });
          g.dot(n * n, n, { color: C.fe, r: 5 }); g.text(`${n}² = ${n * n}`, n * n, n, { dy: -14, color: C.fe, size: 11 });
          g.vline(x); g.dot(x, Math.sqrt(x), { color: C.speed, r: 5 }); g.dot(x, est, { color: C.fe, r: 5, ring: C.text });
          g.legend([['√x', C.speed], ['tangent at n²', C.fe]], { x: g.W - 140 });
        },
        info: p => { const x = p.x, n = Math.round(Math.sqrt(x)), est = n + (x - n * n) / (2 * n); return h`$\sqrt{${x}} \approx ${n} + \frac{${x - n * n}}{${2 * n}} = ${MF.fx(est, 4)}$ vs true ${MF.fx(Math.sqrt(x), 4)} (error ${MF.fx(Math.abs(est - Math.sqrt(x)), 4)})`; },
      }) },
      { callout: 'tip', html: 'Bigger numbers: pair the digits from the right. √2025 → "20|25", so the root starts with 4 (4² ≤ 20) and it\'s 45. √7000 = √70 × 10 ≈ (8 + 6/16) × 10 ≈ 83.7.' },
    ],
    formulas: [h`\sqrt{x}\approx n + \frac{x-n^2}{2n}`, h`\sqrt{100x} = 10\sqrt{x}`],
    target: 8,
    drill() { const x = R.int(5, 400); const sq = Math.round(Math.sqrt(x)) ** 2 === x; return { q: `√${x} (2 dp)`, a: M.round(Math.sqrt(x), 2), tol: 0.03, enter: true, sol: `≈ ${MF.fx(Math.sqrt(x), 3)}${sq ? ' (perfect square)' : ''}` }; },
  });

  MF.lesson({
    id: 'sm-cuberoot', title: 'Cube roots of perfect cubes', minutes: 7,
    summary: 'Last digit gives the units (via a unique map); the leading part gives the tens. ∛571787 = 83.',
    sections: [
      h`<p>Cubes of 0–9 end in distinct digits, so the last digit of a perfect cube gives away the units digit of its root:</p>
      <table><tr><th>root ends in</th><td>0</td><td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td><td>8</td><td>9</td></tr>
      <tr><th>cube ends in</th><td>0</td><td>1</td><td>8</td><td>7</td><td>4</td><td>5</td><td>6</td><td>3</td><td>2</td><td>9</td></tr></table>
      <p>Notice that only 2↔8 and 3↔7 swap. Everything else maps to itself. Then drop the last three digits and find the largest cube $\le$ what is left: that's the tens digit.</p>
      <p>$\sqrt[3]{571787}$: ends in 7, so the units digit is 3. Drop "787" to leave 571, and $8^3 = 512 \le 571 < 729$, so the root is <b>83</b>.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Cubes 1–9 as volumes', height: 220,
        params: [{ id: 'n', label: 'n', min: 1, max: 9, step: 1, value: 4, fmt: v => v }],
        draw(g, p) {
          g.noPad(); const n = p.n, s = Math.min(16, 150 / n), c = g.ctx, ox = g.W / 2 - n * s * 0.6, oy = 180;
          for (let z = n - 1; z >= 0; z--) for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const px = ox + x * s + z * s * 0.5, py = oy - y * s - z * s * 0.5;
            c.fillStyle = C.alpha(C.speed, 0.15 + 0.5 * (1 - z / n)); c.strokeStyle = C.alpha(C.speed, 0.6); c.lineWidth = 0.5;
            c.fillRect(px, py - s, s, s); c.strokeRect(px, py - s, s, s);
          }
          g.ptext(`${n}³ = ${n ** 3}`, g.W - 90, 40, { size: 20, bold: true, mono: true, color: C.speed });
        },
        info: p => `Last digit of ${p.n}³ = ${p.n ** 3} is ${p.n ** 3 % 10}.`,
      }) },
    ],
    formulas: [h`n^3 \bmod 10:\ 0,1,8,7,4,5,6,3,2,9`],
    target: 6,
    drill() { const n = R.int(12, 99); return { q: `∛${n ** 3}`, a: n, sol: `ends in ${n ** 3 % 10} → units ${n % 10}; ${Math.floor(n ** 3 / 1000)} ≥ ${Math.floor(n / 10)}³ = ${Math.floor(n / 10) ** 3} → tens ${Math.floor(n / 10)}` }; },
  });
})();
