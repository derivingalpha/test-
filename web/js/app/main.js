/* MathForge router + boot. */
(function (G) {
  'use strict';
  const MF = G.MF;
  MF.updateBadge = function () { const b = document.getElementById('due-badge'); if (b) { const n = MF.Store.dueCards().length; b.textContent = n ? n : ''; } };
  MF.route = function () {
    const app = document.getElementById('app');
    const parts = (location.hash.replace(/^#\/?/, '') || '').split('/').filter(Boolean);
    app.innerHTML = '';
    const [a, b] = parts;
    document.querySelectorAll('#nav a').forEach(x => x.classList.remove('active'));
    const nav = n => { const x = document.querySelector(`#nav a[data-nav="${n}"]`); if (x) x.classList.add('active'); };
    try {
      if (!a) { nav('home'); MF.views.home(app); }
      else if (a === 'track') { nav(b); MF.views.track(app, b); }
      else if (a === 'lesson') { nav(MF.lessons[b] ? MF.lessons[b].track : ''); MF.views.lesson(app, b); }
      else if (a === 'review') { nav('review'); MF.views.review(app); }
      else if (a === 'drills') { nav('drills'); MF.views.drills(app, b); }
      else if (a === 'reference') { nav('reference'); MF.views.reference(app, b); }
      else if (a === 'progress') { nav('progress'); MF.views.progress(app); }
      else MF.views.notFound(app);
    } catch (e) { console.error(e); app.innerHTML = '<div class="callout warn"><b>Error</b>Something went wrong rendering this page.</div>'; }
    MF.updateBadge();
    G.scrollTo(0, 0);
    const T = parts[0] === 'lesson' && MF.lessons[b] ? MF.lessons[b].title + ' · ' : '';
    document.title = T + 'MathForge';
  };
  G.addEventListener('hashchange', MF.route);
  const boot = () => { MF.route(); setInterval(MF.updateBadge, 60000); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  // KaTeX may finish after first render (slow network) — re-render math once it lands.
  G.addEventListener('load', () => { if (G.renderMathInElement) MF.renderMath(document.getElementById('app')); });
})(window);
