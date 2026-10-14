/* FE Math · Unit 4: linear algebra */
(function () {
  'use strict';
  const { h, R, M, fx, colors: C } = MF;
  const m2 = M.mat2;
  const texM = A => h`\begin{pmatrix}${A.map(r => r.join(' & ')).join(' \\\\ ')}\end{pmatrix}`;
  const texV = v => h`\begin{pmatrix}${v.join(' \\\\ ')}\end{pmatrix}`;

  MF.unit('fe', 'fe-u4', 'Linear Algebra', 'Vectors, matrices as transformations, determinants, eigen-decomposition, covariance matrices, Cholesky and PCA.');

  MF.lesson({
    id: 'fe-vectors', title: 'Vectors, dot products & norms', minutes: 12,
    summary: 'A portfolio is a vector of weights; its return is a dot product. Length, angle and projection.',
    sections: [
      h`<p>A vector $\mathbf v\in\mathbb R^n$ is a list of numbers. Think of an arrow, or a portfolio of $n$ weights. Vectors add component-wise and scale by numbers.</p>
      <ul><li><b>Dot product:</b> $\mathbf u\cdot\mathbf v = \sum u_iv_i = \|\mathbf u\|\|\mathbf v\|\cos\theta$. A portfolio's return is $\mathbf w\cdot\mathbf r$.</li>
      <li><b>Norm:</b> $\|\mathbf v\| = \sqrt{\mathbf v\cdot\mathbf v}$. Orthogonal means $\mathbf u\cdot\mathbf v = 0$.</li>
      <li><b>Projection</b> of $\mathbf u$ onto $\mathbf v$: $\frac{\mathbf u\cdot\mathbf v}{\mathbf v\cdot\mathbf v}\mathbf v$. Linear regression is exactly a projection.</li>
      <li><b>Correlation</b> of two demeaned data vectors is the cosine of the angle between them.</li></ul>`,
      { viz: host => MF.explore(host, {
        title: 'Drag the vectors: angle, dot product, projection', height: 340,
        init(s) { s.u = [2, 1]; s.v = [0.5, 2]; },
        onPointer(g, p, s, e) { if (!e.down) return false; const du = Math.hypot(e.x - s.u[0], e.y - s.u[1]), dv = Math.hypot(e.x - s.v[0], e.y - s.v[1]); if (e.type === 'down') s.drag = du < dv ? 'u' : 'v'; if (s.drag) s[s.drag] = [Math.round(e.x * 4) / 4, Math.round(e.y * 4) / 4]; },
        draw(g, p, s) {
          const asp = g.W / g.H; g.view(-3 * asp, 3 * asp, -3, 3).axes({ xstep: 1, ystep: 1 });
          const { u, v } = s, k = (u[0] * v[0] + u[1] * v[1]) / (v[0] * v[0] + v[1] * v[1] || 1);
          g.line(u[0], u[1], k * v[0], k * v[1], { color: C.dim, dash: [3, 3], width: 1 });
          g.arrow(0, 0, k * v[0], k * v[1], { color: C.good, width: 4 });
          g.arrow(0, 0, u[0], u[1], { color: C.fe, width: 2.5 }); g.arrow(0, 0, v[0], v[1], { color: C.speed, width: 2.5 });
          g.text('u', u[0], u[1], { dx: 10, dy: -10, color: C.fe, bold: true }); g.text('v', v[0], v[1], { dx: 10, dy: -10, color: C.speed, bold: true });
        },
        info: (p, s) => { const { u, v } = s; if (!u) return ''; const d = u[0] * v[0] + u[1] * v[1], nu = Math.hypot(...u), nv = Math.hypot(...v); return h`$\mathbf u\cdot\mathbf v = ${fx(d, 3)}$, $\|\mathbf u\| = ${fx(nu, 3)}$, $\|\mathbf v\| = ${fx(nv, 3)}$, $\cos\theta = ${fx(d / (nu * nv || 1), 3)}$ ($\theta = ${fx(Math.acos(Math.max(-1, Math.min(1, d / (nu * nv || 1)))) * 180 / Math.PI, 1)}°$). Green: projection of u on v. <i>Drag the arrow tips.</i>`; },
      }) },
    ],
    formulas: [h`\mathbf u\cdot\mathbf v = \sum_i u_iv_i = \|\mathbf u\|\|\mathbf v\|\cos\theta`, h`\|\mathbf v\| = \sqrt{\textstyle\sum v_i^2}`, h`\mathrm{proj}_{\mathbf v}\mathbf u = \frac{\mathbf u\cdot\mathbf v}{\|\mathbf v\|^2}\mathbf v`],
    problems: [
      () => { const u = [R.int(-5, 5), R.int(-5, 5), R.int(-5, 5)], v = [R.int(-5, 5), R.int(-5, 5), R.int(-5, 5)]; return { q: h`Compute $${texV(u)}\cdot${texV(v)}$`, a: u[0] * v[0] + u[1] * v[1] + u[2] * v[2], sol: `${u.map((x, i) => `(${x})(${v[i]})`).join(' + ')} = ${u[0] * v[0] + u[1] * v[1] + u[2] * v[2]}` }; },
      () => { const v = [R.int(-6, 6), R.int(-6, 6)]; return { q: h`Norm of $(${v[0]}, ${v[1]})$?`, a: Math.hypot(v[0], v[1]), tol: 0.005, sol: h`$\sqrt{${v[0] ** 2} + ${v[1] ** 2}} = ${fx(Math.hypot(...v), 4)}$` }; },
      () => { const w = [0.5, 0.3, 0.2].map(x => x), r = [R.pick([0.05, 0.08, 0.1, -0.02]), R.pick([0.02, 0.04, 0.12]), R.pick([-0.05, 0.01, 0.06])]; const pr = w[0] * r[0] + w[1] * r[1] + w[2] * r[2]; return { q: h`Weights $(0.5, 0.3, 0.2)$, asset returns $(${r.join(', ')})$. Portfolio return in %?`, a: pr * 100, tol: 0.005, unit: '%', sol: h`$\mathbf w\cdot\mathbf r = ${fx(pr * 100, 3)}\%$` }; },
      () => { const u = [R.int(1, 4), R.int(-3, 3)], v = [R.int(-3, 3), R.int(1, 4)]; const d = u[0] * v[0] + u[1] * v[1]; return { q: h`Angle (degrees) between $(${u})$ and $(${v})$?`, a: Math.acos(d / (Math.hypot(...u) * Math.hypot(...v))) * 180 / Math.PI, tol: 0.1, sol: h`$\cos\theta = \frac{${d}}{${fx(Math.hypot(...u), 3)}\cdot${fx(Math.hypot(...v), 3)}}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-matrices', title: 'Matrices as transformations', minutes: 14,
    summary: 'A matrix moves every point of space. Columns are where the basis vectors land; multiplication is composition.',
    sections: [
      h`<p>A $2\times2$ matrix $A$ maps $\mathbf x\mapsto A\mathbf x$. Its <b>columns are the images of the basis vectors</b> $\mathbf e_1, \mathbf e_2$, and every other point follows linearly. Rotations, stretches, shears and reflections are all matrices.</p>
      <p><b>Matrix multiplication</b> $(AB)_{ij} = \sum_k A_{ik}B_{kj}$ is composition: apply $B$ then $A$. In general $AB\ne BA$.</p>
      <p>Transpose $A^\top$ swaps rows and columns: $(AB)^\top = B^\top A^\top$. Portfolio variance $\mathbf w^\top\Sigma\mathbf w$ is a "matrix sandwich" you'll see constantly.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Watch the grid transform', height: 340,
        params: [{ id: 'a', label: 'a₁₁', min: -2, max: 2, step: 0.1, value: 1 }, { id: 'b', label: 'a₁₂', min: -2, max: 2, step: 0.1, value: 0.5 }, { id: 'c', label: 'a₂₁', min: -2, max: 2, step: 0.1, value: 0 }, { id: 'd', label: 'a₂₂', min: -2, max: 2, step: 0.1, value: 1 }, { id: 't', label: 'morph', min: 0, max: 1, step: 0.01, value: 1 }],
        draw(g, p) {
          const asp = g.W / g.H; g.view(-3 * asp, 3 * asp, -3, 3).axes({ labels: false, xstep: 1, ystep: 1 });
          const A = [[1 + (p.a - 1) * p.t, p.b * p.t], [p.c * p.t, 1 + (p.d - 1) * p.t]];
          const T = (x, y) => [A[0][0] * x + A[0][1] * y, A[1][0] * x + A[1][1] * y];
          for (let k = -4; k <= 4; k++) { g.path([T(k, -4), T(k, 4)], { color: C.alpha(C.fe, 0.35), width: 1 }); g.path([T(-4, k), T(4, k)], { color: C.alpha(C.fe, 0.35), width: 1 }); }
          g.path([T(0, 0), T(1, 0), T(1, 1), T(0, 1)], { close: true, fill: C.alpha(C.speed, 0.25), color: C.speed, width: 1.5 });
          const e1 = T(1, 0), e2 = T(0, 1); g.arrow(0, 0, e1[0], e1[1], { color: C.pink, width: 3 }); g.arrow(0, 0, e2[0], e2[1], { color: C.good, width: 3 });
        },
        info: p => h`$A = ${texM([[fx(p.a, 1), fx(p.b, 1)], [fx(p.c, 1), fx(p.d, 1)]])}$. Pink = $A\mathbf e_1$ (column 1), green = $A\mathbf e_2$ (column 2). The orange unit square has area $|\det A| = ${fx(Math.abs(p.a * p.d - p.b * p.c), 3)}$.`,
      }) },
    ],
    formulas: [h`(AB)_{ij} = \sum_k A_{ik}B_{kj}`, h`(AB)^\top = B^\top A^\top`, h`A\mathbf e_j = \text{column } j \text{ of } A`],
    problems: [
      () => { const A = [[R.int(-3, 3), R.int(-3, 3)], [R.int(-3, 3), R.int(-3, 3)]], B = [[R.int(-3, 3), R.int(-3, 3)], [R.int(-3, 3), R.int(-3, 3)]]; const P = m2.mul(A, B); const i = R.int(0, 1), j = R.int(0, 1); return { q: h`Compute entry $(${i + 1},${j + 1})$ of $${texM(A)}${texM(B)}$`, a: P[i][j], sol: h`Row ${i + 1} of A · column ${j + 1} of B = ${P[i][j]}. Full product $${texM(P)}$` }; },
      () => { const A = [[R.int(-3, 3), R.int(-3, 3)], [R.int(-3, 3), R.int(-3, 3)]], x = [R.int(-3, 3), R.int(-3, 3)]; const y = [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]]; return { q: h`Second component of $${texM(A)}${texV(x)}$?`, a: y[1], sol: h`$${texV(y)}$` }; },
      () => { const w = [R.pick([0.4, 0.5, 0.6]), 0], s1 = 0.2, s2 = 0.3, rho = R.pick([-0.5, 0, 0.3, 0.6]); w[1] = M.round(1 - w[0], 2); const v = w[0] ** 2 * s1 * s1 + w[1] ** 2 * s2 * s2 + 2 * w[0] * w[1] * rho * s1 * s2; return { q: h`$\Sigma = ${texM([[0.04, fx(rho * 0.06, 3)], [fx(rho * 0.06, 3), 0.09]])}$, $\mathbf w = (${w[0]}, ${w[1]})$. Compute $\mathbf w^\top\Sigma\mathbf w$.`, a: v, tol: 1e-4, sol: h`$w_1^2\Sigma_{11} + w_2^2\Sigma_{22} + 2w_1w_2\Sigma_{12} = ${fx(v, 5)}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-determinant', title: 'Determinants, inverses & solving Ax = b', minutes: 14,
    summary: 'The determinant is the area-scaling factor; zero means the space collapses and the matrix has no inverse.',
    sections: [
      h`<p>$\det\begin{pmatrix}a&b\\c&d\end{pmatrix} = ad - bc$ is the factor by which $A$ scales areas (its sign records whether orientation flips). For $n\times n$ it scales volumes. $\det(AB) = \det A\det B$.</p>
      <p>If $\det A\ne0$, $A$ is invertible:</p>
      $$A^{-1} = \frac{1}{ad-bc}\begin{pmatrix}d&-b\\-c&a\end{pmatrix},\qquad A\mathbf x = \mathbf b \Rightarrow \mathbf x = A^{-1}\mathbf b$$
      <p>If $\det A = 0$ the columns are linearly dependent and $A$ squashes space onto a line, so information is lost. In finance: a payoff can be replicated by a set of assets exactly when the payoff matrix has full rank. That's the market completeness you'll see in the binomial model.</p>
      <p>Numerically you never compute inverses explicitly. Use Gaussian elimination or the LU/Cholesky decompositions.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Area scaling and collapse', height: 320,
        params: [{ id: 'a', label: 'a', min: -2, max: 2, step: 0.05, value: 1.5 }, { id: 'b', label: 'b', min: -2, max: 2, step: 0.05, value: 0.5 }, { id: 'c', label: 'c', min: -2, max: 2, step: 0.05, value: 0.6 }, { id: 'd', label: 'd', min: -2, max: 2, step: 0.05, value: 1.2 }],
        draw(g, p) {
          const asp = g.W / g.H; g.view(-3 * asp, 3 * asp, -3, 3).axes({ xstep: 1, ystep: 1 });
          const D = p.a * p.d - p.b * p.c, col = D > 0 ? C.fe : D < 0 ? C.pink : C.bad;
          g.path([[0, 0], [1, 0], [1, 1], [0, 1]], { close: true, color: C.dim, width: 1, dash: [3, 3] });
          g.path([[0, 0], [p.a, p.c], [p.a + p.b, p.c + p.d], [p.b, p.d]], { close: true, fill: C.alpha(col, 0.3), color: col, width: 2 });
          g.arrow(0, 0, p.a, p.c, { color: C.speed }); g.arrow(0, 0, p.b, p.d, { color: C.good });
        },
        info: p => { const D = p.a * p.d - p.b * p.c; return h`$\det A = ${fx(p.a, 2)}\cdot${fx(p.d, 2)} - ${fx(p.b, 2)}\cdot${fx(p.c, 2)} = ${fx(D, 4)}$. ${Math.abs(D) < 0.02 ? '<b>Singular</b>: the parallelogram collapses to a line and there is no inverse.' : D < 0 ? 'Negative: orientation is flipped.' : 'Positive: orientation is preserved.'}`; },
      }) },
    ],
    formulas: [h`\det\begin{pmatrix}a&b\\c&d\end{pmatrix} = ad-bc`, h`A^{-1} = \frac{1}{\det A}\begin{pmatrix}d&-b\\-c&a\end{pmatrix}`, h`\det(AB) = \det A\,\det B`, h`\det\begin{pmatrix}a&b&c\\d&e&f\\g&h&i\end{pmatrix} = a(ei-fh) - b(di-fg) + c(dh-eg)`],
    problems: [
      () => { const A = [[R.int(-5, 5), R.int(-5, 5)], [R.int(-5, 5), R.int(-5, 5)]]; return { q: h`$\det ${texM(A)}$?`, a: m2.det(A), sol: h`$${A[0][0]}\cdot${A[1][1]} - ${A[0][1]}\cdot${A[1][0]} = ${m2.det(A)}$` }; },
      () => { const A = [[R.int(-3, 3), R.int(-3, 3), R.int(-3, 3)], [R.int(-3, 3), R.int(-3, 3), R.int(-3, 3)], [R.int(-3, 3), R.int(-3, 3), R.int(-3, 3)]]; const [[a, b, c], [d, e, f], [g, hh, i]] = A; const D = a * (e * i - f * hh) - b * (d * i - f * g) + c * (d * hh - e * g); return { q: h`$\det ${texM(A)}$?`, a: D, sol: h`Cofactor expansion along row 1: $${D}$` }; },
      () => { let A; do { A = [[R.int(-4, 4), R.int(-4, 4)], [R.int(-4, 4), R.int(-4, 4)]]; } while (m2.det(A) === 0); const x = [R.int(-4, 4), R.int(-4, 4)]; const bb = [A[0][0] * x[0] + A[0][1] * x[1], A[1][0] * x[0] + A[1][1] * x[1]]; return { q: h`Solve $${texM(A)}\mathbf x = ${texV(bb)}$. What is $x_1$?`, a: x[0], sol: h`$\mathbf x = A^{-1}\mathbf b = ${texV(x)}$` }; },
      () => { let A; do { A = [[R.int(-4, 4), R.int(-4, 4)], [R.int(-4, 4), R.int(-4, 4)]]; } while (m2.det(A) === 0); const D = m2.det(A); return { q: h`Entry (1,1) of $${texM(A)}^{-1}$?`, a: A[1][1] / D, tol: 0.002, sol: h`$d/\det = ${A[1][1]}/${D}$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-eigen', title: 'Eigenvalues & eigenvectors', minutes: 15,
    summary: 'Directions that a matrix only stretches. They diagonalise matrices, give matrix powers, and drive stability and PCA.',
    sections: [
      h`<p>$\mathbf v\ne\mathbf0$ is an <b>eigenvector</b> of $A$ with <b>eigenvalue</b> $\lambda$ if $A\mathbf v = \lambda\mathbf v$: the matrix just scales that direction. Eigenvalues solve the characteristic equation $\det(A-\lambda I) = 0$. For $2\times 2$:</p>
      $$\lambda^2 - (\operatorname{tr}A)\lambda + \det A = 0$$
      <p>So $\lambda_1+\lambda_2 = \operatorname{tr}A$ and $\lambda_1\lambda_2 = \det A$. If $A = V\Lambda V^{-1}$ then $A^k = V\Lambda^kV^{-1}$, which makes Markov chains and AR systems easy.</p>
      <p><b>Symmetric matrices</b> (covariance matrices!) have real eigenvalues and orthogonal eigenvectors: $\Sigma = Q\Lambda Q^\top$. This is the <b>spectral theorem</b>, the basis of PCA.</p>`,
      { viz: host => MF.explore(host, {
        title: 'The unit circle maps to an ellipse; eigen-directions stay put', height: 340,
        params: [{ id: 'a', label: 'a₁₁', min: -2, max: 3, step: 0.05, value: 2 }, { id: 'b', label: 'a₁₂ = a₂₁ (symmetric)', min: -1.5, max: 1.5, step: 0.05, value: 0.8 }, { id: 'd', label: 'a₂₂', min: -2, max: 3, step: 0.05, value: 1 }, { id: 'th', label: 'test vector angle', min: 0, max: 360, step: 1, value: 40, fmt: v => v + '°' }],
        draw(g, p) {
          const asp = g.W / g.H; g.view(-3.5 * asp, 3.5 * asp, -3.5, 3.5).axes({ xstep: 1, ystep: 1 });
          const A = [[p.a, p.b], [p.b, p.d]], T = v => [A[0][0] * v[0] + A[0][1] * v[1], A[1][0] * v[0] + A[1][1] * v[1]];
          const circ = [], ell = []; for (let k = 0; k <= 120; k++) { const t = 2 * Math.PI * k / 120, v = [Math.cos(t), Math.sin(t)]; circ.push(v); ell.push(T(v)); }
          g.path(circ, { color: C.dim, width: 1, dash: [3, 3] }); g.path(ell, { color: C.fe, width: 2 });
          const ls = m2.eig(A); if (ls) ls.forEach((l, i) => { const v = m2.eigvec(A, l); g.line(-4 * v[0], -4 * v[1], 4 * v[0], 4 * v[1], { color: C.alpha(i ? C.good : C.speed, 0.4), width: 1 }); g.arrow(0, 0, l * v[0], l * v[1], { color: i ? C.good : C.speed, width: 3 }); });
          const t = p.th * Math.PI / 180, v = [Math.cos(t), Math.sin(t)], w = T(v); g.arrow(0, 0, v[0], v[1], { color: C.pink, width: 2 }); g.arrow(0, 0, w[0], w[1], { color: C.pink, width: 2, dash: [5, 3] });
        },
        info: p => { const A = [[p.a, p.b], [p.b, p.d]], ls = m2.eig(A); return ls ? h`$\lambda_1 = ${fx(ls[0], 3)},\ \lambda_2 = ${fx(ls[1], 3)}$ (sum $= \operatorname{tr} = ${fx(p.a + p.d, 2)}$, product $= \det = ${fx(m2.det(A), 3)}$). The pink test vector (solid) and its image (dashed) are parallel only along the eigen-directions. Rotate it to see.` : 'Complex eigenvalues.'; },
      }) },
    ],
    formulas: [h`A\mathbf v = \lambda\mathbf v`, h`\det(A - \lambda I) = 0`, h`\lambda_1+\lambda_2 = \operatorname{tr}A,\ \lambda_1\lambda_2 = \det A`, h`\Sigma = Q\Lambda Q^\top`],
    problems: [
      () => { const l1 = R.int(-3, 6), l2 = R.intNot(-3, 6, [l1]); const A = [[2 * l1 - l2, l2 - l1], [2 * l1 - 2 * l2, 2 * l2 - l1]]; return { q: h`Larger eigenvalue of $${texM(A)}$?`, a: Math.max(l1, l2), sol: h`$\lambda^2 - ${l1 + l2}\lambda + ${l1 * l2} = 0$ (trace ${l1 + l2}, det ${l1 * l2}) → $\lambda = ${l1}, ${l2}$` }; },
      () => { const a = R.int(1, 5), d = R.int(1, 5), b = R.int(-3, 3); const ls = m2.eig([[a, b], [b, d]]); return { q: h`Smaller eigenvalue of the symmetric matrix $${texM([[a, b], [b, d]])}$?`, a: ls[1], tol: 0.005, sol: h`$\frac{${a + d}}{2} - \sqrt{\left(\frac{${a - d}}{2}\right)^2 + ${b * b}} = ${fx(ls[1], 4)}$` }; },
      () => { const l = R.pick([0.5, 0.8, 0.9, 1.1]), k = R.int(3, 10); return { q: h`$A\mathbf v = ${l}\mathbf v$. If $\mathbf x_0 = \mathbf v$ and $\mathbf x_{t+1} = A\mathbf x_t$, what multiple of $\mathbf v$ is $\mathbf x_{${k}}$?`, a: Math.pow(l, k), rtol: 1e-3, sol: h`$A^{${k}}\mathbf v = ${l}^{${k}}\mathbf v = ${fx(Math.pow(l, k), 5)}\mathbf v$` }; },
    ],
  });

  MF.lesson({
    id: 'fe-covmatrix', title: 'Covariance matrices & Cholesky', minutes: 15,
    summary: 'Σ = AAᵀ: how to turn independent normals into correlated ones. Positive definiteness and why it matters.',
    sections: [
      h`<p>For a random vector $\mathbf X$, the covariance matrix $\Sigma_{ij} = \operatorname{Cov}(X_i,X_j)$ is symmetric and <b>positive semi-definite</b>: $\mathbf w^\top\Sigma\mathbf w = \operatorname{Var}(\mathbf w^\top\mathbf X)\ge0$ for every $\mathbf w$. That's portfolio variance. A "correlation matrix" with a negative eigenvalue would imply negative variance for some portfolio, so it can't be real.</p>
      <p><b>Cholesky decomposition</b>: any positive-definite $\Sigma = LL^\top$ with $L$ lower triangular. If $\mathbf Z$ has independent standard normal entries then $\mathbf X = L\mathbf Z$ has covariance $LL^\top = \Sigma$. For two assets with correlation $\rho$:</p>
      $$X_1 = Z_1,\qquad X_2 = \rho Z_1 + \sqrt{1-\rho^2}\,Z_2$$
      <p>This is how every multi-asset Monte Carlo simulation generates correlated shocks.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Correlating independent samples with L', height: 340,
        params: [{ id: 'rho', label: 'correlation ρ', min: -0.99, max: 0.99, step: 0.01, value: 0.7 }, { id: 's2', label: 'σ₂ / σ₁', min: 0.3, max: 2, step: 0.05, value: 1 }],
        init(s) { const r = R.seeded(7); s.z = Array.from({ length: 700 }, () => [r.normal(), r.normal()]); },
        buttons: [{ label: '🎲 Resample', click: s => { const r = R.seeded(Math.random() * 1e9); s.z = Array.from({ length: 700 }, () => [r.normal(), r.normal()]); } }],
        draw(g, p, s) {
          const asp = g.W / g.H; g.view(-4 * asp, 4 * asp, -4, 4).axes({ xstep: 1, ystep: 1 });
          const c = g.ctx; c.fillStyle = C.alpha(C.fe, 0.5);
          const xs = s.z.map(([z1, z2]) => [z1, p.s2 * (p.rho * z1 + Math.sqrt(1 - p.rho * p.rho) * z2)]);
          xs.forEach(([x, y]) => { c.fillRect(g.X(x) - 1.5, g.Y(y) - 1.5, 3, 3); });
          const n = xs.length, mx = M.mean(xs.map(q => q[0])), my = M.mean(xs.map(q => q[1]));
          s.r = xs.reduce((a, q) => a + (q[0] - mx) * (q[1] - my), 0) / Math.sqrt(xs.reduce((a, q) => a + (q[0] - mx) ** 2, 0) * xs.reduce((a, q) => a + (q[1] - my) ** 2, 0)); void n;
        },
        info: (p, s) => h`$L = \begin{pmatrix}1 & 0\\ ${fx(p.rho * p.s2, 2)} & ${fx(p.s2 * Math.sqrt(1 - p.rho * p.rho), 2)}\end{pmatrix}$. Sample correlation of the cloud: <b>${fx(s.r || 0, 3)}</b> (target ${fx(p.rho, 2)}).`,
      }) },
    ],
    formulas: [h`\Sigma = LL^\top`, h`\mathbf X = \boldsymbol\mu + L\mathbf Z,\ \ \mathbf Z\sim N(\mathbf 0, I)`, h`L = \begin{pmatrix}\sigma_1 & 0\\ \rho\sigma_2 & \sigma_2\sqrt{1-\rho^2}\end{pmatrix}`, h`\mathbf w^\top\Sigma\mathbf w\ge 0`],
    problems: [
      () => { const rho = R.pick([0.3, 0.5, 0.6, 0.8, -0.4]); return { q: h`For $\Sigma = \begin{pmatrix}1&${rho}\\${rho}&1\end{pmatrix} = LL^\top$, what is $L_{22}$?`, a: Math.sqrt(1 - rho * rho), tol: 1e-3, sol: h`$\sqrt{1 - ${rho}^2} = ${fx(Math.sqrt(1 - rho * rho), 4)}$` }; },
      () => { const s1 = R.pick([2, 3]), s2 = R.pick([1, 2, 4]), rho = R.pick([0.25, 0.5]); return { q: h`$\Sigma = \begin{pmatrix}${s1 * s1}&${rho * s1 * s2}\\${rho * s1 * s2}&${s2 * s2}\end{pmatrix}$. Cholesky entry $L_{21}$?`, a: rho * s2, tol: 1e-3, sol: h`$L_{11} = ${s1}$, $L_{21} = \Sigma_{21}/L_{11} = ${rho * s2}$` }; },
      () => { const r = R.pick([0.5, 0.9, 1.2, 0.3]), valid = Math.abs(r) <= 1; return { q: h`Is $\begin{pmatrix}1 & ${r}\\ ${r} & 1\end{pmatrix}$ a valid correlation matrix?`, choices: ['Yes', 'No'], a: valid ? 0 : 1, sol: h`Eigenvalues $1\pm${r}$ ${valid ? 'are both ≥ 0' : 'include a negative one'}.` }; },
    ],
  });

  MF.lesson({
    id: 'fe-pca', title: 'PCA & the yield curve', minutes: 15,
    summary: 'Principal components are the eigenvectors of the covariance matrix. Three of them explain almost all yield-curve moves.',
    sections: [
      h`<p><b>Principal component analysis</b> rotates data onto the orthogonal directions of maximal variance. They are the eigenvectors of $\Sigma$, and the eigenvalues are the variances along them. The fraction of variance explained by component $k$ is $\lambda_k/\sum_j\lambda_j$.</p>
      <p>Applied to daily changes in interest rates across maturities, three components typically explain over 95% of variance:</p>
      <ol><li><b>Level</b>: all rates move together (a parallel shift).</li><li><b>Slope</b>: short and long ends move opposite ways (steepening and flattening).</li><li><b>Curvature</b>: the middle moves against the wings.</li></ol>
      <p>Risk managers hedge with these factors instead of dozens of individual maturities.</p>`,
      { viz: host => MF.explore(host, {
        title: 'Yield curve shocked by level, slope, curvature', height: 300,
        params: [{ id: 'L', label: 'level', min: -1, max: 1, step: 0.02, value: 0 }, { id: 'S', label: 'slope', min: -1, max: 1, step: 0.02, value: 0.4 }, { id: 'K', label: 'curvature', min: -1, max: 1, step: 0.02, value: 0 }],
        draw(g, p) {
          const base = t => 2 + 2.2 * (1 - Math.exp(-t / 3)), lv = () => 1, sl = t => (t - 10) / 10, cu = t => 1 - Math.pow((t - 7) / 7, 2);
          g.view(0, 30, 0, 6).axes({ xlabel: 'maturity (y)', ylabel: 'yield %' });
          g.fn(base, { color: C.dim, width: 2, dash: [5, 4], from: 0.25 });
          g.fn(t => base(t) + p.L * lv() + p.S * sl(t) + p.K * cu(t), { color: C.fe, width: 3, from: 0.25 });
          g.fn(t => 0.4 + 0.3 * lv(), { color: C.alpha(C.speed, 0.7), width: 1, from: 0.25 }); g.fn(t => 0.4 + 0.3 * sl(t), { color: C.alpha(C.pink, 0.7), width: 1, from: 0.25 }); g.fn(t => 0.4 + 0.3 * cu(t), { color: C.alpha(C.good, 0.7), width: 1, from: 0.25 });
          g.legend([['shocked curve', C.fe], ['base', C.dim], ['level', C.speed], ['slope', C.pink], ['curvature', C.good]], { x: g.W - 140, y: g.H - 110 });
        },
        info: () => 'Factor shapes (small lines at the bottom) are stylised eigenvectors of a typical covariance matrix of rate changes.',
      }) },
    ],
    formulas: [h`\Sigma = Q\Lambda Q^\top,\ \lambda_1\ge\lambda_2\ge\dots`, h`\text{explained}_k = \frac{\lambda_k}{\sum_j\lambda_j}`, h`\mathbf y = Q^\top(\mathbf x - \bar{\mathbf x})`],
    problems: [
      () => { const ls = [R.int(50, 90), R.int(5, 20), R.int(1, 6), R.int(0, 3)]; const tot = M.sum(ls); return { q: h`Eigenvalues of a covariance matrix: $${ls.join(', ')}$. What % of variance do the first two components explain?`, a: 100 * (ls[0] + ls[1]) / tot, tol: 0.05, unit: '%', sol: h`$\frac{${ls[0]} + ${ls[1]}}{${tot}} = ${fx(100 * (ls[0] + ls[1]) / tot, 2)}\%$` }; },
      () => { const a = R.int(2, 6), b = R.int(1, 2); const ls = m2.eig([[a, b], [b, a]]); return { q: h`$\Sigma = ${texM([[a, b], [b, a]])}$. Variance along the first principal component?`, a: ls[0], tol: 1e-3, sol: h`Eigenvalues $${a}\pm${b}$; first PC (direction $(1,1)/\sqrt2$) has variance $${a + b}$` }; },
      () => ({ q: h`Which yield-curve factor typically explains the most variance?`, choices: ['Level (parallel shift)', 'Slope', 'Curvature', 'They are equal'], a: 0, sol: 'Level typically explains 80–90% of daily rate-change variance.' }),
    ],
  });
})();
