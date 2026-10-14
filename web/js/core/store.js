/* MathForge persistence + spaced-repetition scheduler (SM-2 family). Everything lives in localStorage. */
(function (G) {
  'use strict';
  const MF = G.MF;
  const KEY = 'mathforge.v1';
  const DAY = 86400000;

  const blank = () => ({ v: 1, lessons: {}, cards: {}, days: {}, drills: {}, settings: { dailyReviews: 40, problemsPerReview: 3 } });
  let mem = null;

  const Store = MF.Store = {
    load() {
      if (mem) return mem;
      try { mem = JSON.parse(G.localStorage.getItem(KEY)) || blank(); } catch (e) { mem = blank(); }
      mem = Object.assign(blank(), mem);
      return mem;
    },
    save() { try { G.localStorage.setItem(KEY, JSON.stringify(mem)); } catch (e) { /* storage unavailable */ } },
    get data() { return Store.load(); },
    reset() { mem = blank(); Store.save(); },
    exportJSON() { return JSON.stringify(Store.load(), null, 1); },
    importJSON(txt) { const d = JSON.parse(txt); if (!d || typeof d !== 'object' || !d.v) throw new Error('Not a MathForge progress file'); mem = Object.assign(blank(), d); Store.save(); },

    today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; },
    /** record answered problems for the activity heat-map and streak */
    logActivity(n, correct) {
      const d = Store.load(), k = Store.today();
      const e = d.days[k] || (d.days[k] = { n: 0, c: 0 });
      e.n += n; e.c += correct; Store.save();
    },
    streak() {
      const d = Store.load(); let s = 0; const t = new Date();
      for (let i = 0; ; i++) {
        const x = new Date(t.getFullYear(), t.getMonth(), t.getDate() - i);
        const k = `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
        if (d.days[k] && d.days[k].n > 0) s++; else if (i > 0) break; else continue;
      }
      return s;
    },

    lesson(id) { return Store.load().lessons[id]; },
    isDone(id) { const l = Store.lesson(id); return !!(l && l.done); },
    completeLesson(id, score) {
      const d = Store.load();
      const l = d.lessons[id] || (d.lessons[id] = {});
      l.done = true; l.best = Math.max(l.best || 0, score || 0); l.at = l.at || Date.now();
      if (!d.cards[id]) d.cards[id] = { ease: 2.5, ivl: 0, reps: 0, lapses: 0, due: Date.now() + DAY * 0.9, last: Date.now() };
      Store.save();
    },
    uncomplete(id) { const d = Store.load(); delete d.lessons[id]; delete d.cards[id]; Store.save(); },

    /** grade: 0..5 (SM-2). <3 is a lapse. */
    review(id, grade) {
      const d = Store.load(); const c = d.cards[id] || (d.cards[id] = { ease: 2.5, ivl: 0, reps: 0, lapses: 0 });
      if (grade < 3) {
        c.reps = 0; c.lapses++; c.ivl = 0; // relearn: due again in ~10 minutes, then tomorrow
        c.due = Date.now() + 10 * 60000;
        c.ease = Math.max(1.3, c.ease - 0.2);
      } else {
        c.reps++;
        if (c.reps === 1) c.ivl = 1; else if (c.reps === 2) c.ivl = grade >= 5 ? 4 : 3; else c.ivl = Math.round(c.ivl * c.ease * (grade === 3 ? 0.8 : grade === 5 ? 1.15 : 1));
        c.ivl = Math.max(1, Math.min(c.ivl, 365));
        c.ease = Math.max(1.3, c.ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
        const fuzz = 1 + (Math.random() - 0.5) * 0.1;
        c.due = Date.now() + c.ivl * DAY * fuzz - 3600000 * 4; // a few hours early so it lands on the right day
      }
      c.last = Date.now();
      Store.save(); return c;
    },
    dueCards(filterTrack) {
      const d = Store.load(), now = Date.now(), out = [];
      for (const id in d.cards) {
        const L = MF.lessons[id]; if (!L) continue;
        if (filterTrack && L.track !== filterTrack) continue;
        if (d.cards[id].due <= now) out.push(id);
      }
      return out.sort((a, b) => d.cards[a].due - d.cards[b].due);
    },
    /** cards whose due date falls within the next n days, bucketed by day */
    forecast(n = 14) {
      const d = Store.load(), out = new Array(n).fill(0), start = new Date(); start.setHours(0, 0, 0, 0);
      for (const id in d.cards) { if (!MF.lessons[id]) continue; const k = Math.floor((d.cards[id].due - start) / DAY); out[Math.max(0, Math.min(n - 1, k))] += k < n ? 1 : 0; }
      return out;
    },
    drillStat(skill, correct, secs) {
      const d = Store.load(); const s = d.drills[skill] || (d.drills[skill] = { n: 0, c: 0, t: 0, best: null });
      s.n++; if (correct) { s.c++; s.t += secs; if (s.best == null || secs < s.best) s.best = secs; }
      Store.save();
    },
  };
})(window);
