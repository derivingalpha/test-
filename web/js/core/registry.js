/* MathForge content registry: tracks → units → lessons. Content files call MF.unit() and MF.lesson(). */
(function (G) {
  'use strict';
  const MF = G.MF;
  MF.tracks = {
    speed: {
      id: 'speed', title: 'Speed Math', tag: 'Visual mental arithmetic',
      blurb: 'See numbers as shapes, lines and beads. A blend of Vedic, Trachtenberg, soroban (anzan) and area-model methods, drilled with spaced repetition until it is automatic.',
      units: [],
    },
    fe: {
      id: 'fe', title: 'Financial Engineering Math', tag: 'From addition to a master’s level',
      blurb: 'The complete mathematical spine of quantitative finance: arithmetic, algebra, calculus, linear algebra, probability, statistics, fixed income, portfolio theory, derivatives, stochastic calculus, Black–Scholes, numerical methods and advanced models.',
      units: [],
    },
  };
  MF.lessons = {};
  MF.lessonOrder = { speed: [], fe: [] };

  let curUnit = null;
  /** Declare a unit; subsequent lessons attach to it. */
  MF.unit = function (track, id, title, blurb) {
    curUnit = { id, title, blurb, track, lessons: [] };
    MF.tracks[track].units.push(curUnit);
    return curUnit;
  };
  /**
   * Declare a lesson.
   * L = { id, title, summary, minutes, sections:[html | {viz:fn(host)} | {callout, kind, html}], formulas:[tex],
   *       problems:[fn()->{q,a,tol?,rtol?,choices?,sol,hint?}], drill?: fn()->{q,a}, target?: seconds }
   */
  MF.lesson = function (L) {
    if (!curUnit) throw new Error('lesson declared before unit');
    L.track = curUnit.track; L.unit = curUnit.id; L.unitTitle = curUnit.title;
    L.minutes = L.minutes || 10;
    MF.lessons[L.id] = L; curUnit.lessons.push(L.id); MF.lessonOrder[L.track].push(L.id);
    return L;
  };
  /** pick a random problem from a lesson, falling back to its drill */
  MF.makeProblem = function (L) {
    const gens = (L.problems && L.problems.length) ? L.problems : [L.drill];
    const p = MF.R.pick(gens)();
    if (L.target && p.target == null) p.target = L.target;
    return p;
  };
})(window);
