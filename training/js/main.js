/* Training Lab journey: path picking, progress rail, lazy chapters, Nixy's
   running commentary and the programme builder at the end. */
import { hasWebGL } from './stage.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const CFG = window.POTARA_CONFIG || {};
const journey = { picked: new Set(), seen: new Set() };
const rm = document.documentElement.classList.contains('rm');

/* ---------- reveal on scroll ---------- */
const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pending'); rev.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
$$('[data-reveal]').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pending'); rev.observe(el); } });

/* ---------- nav progress + rail ---------- */
const navProg = $('#navProg'), rail = $('.rail');
const chapters = $$('[data-ch]');
function onScroll() {
  const h = document.documentElement.scrollHeight - innerHeight;
  navProg.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`;
  rail.classList.toggle('show', scrollY > innerHeight * 0.6);
}
addEventListener('scroll', onScroll, { passive: true }); onScroll();
const chObs = new IntersectionObserver(es => es.forEach(e => {
  const id = e.target.id;
  if (e.isIntersecting) {
    $$('.rail a, .nav-links a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
    say(id);
  }
}), { rootMargin: '-45% 0px -45% 0px' });
chapters.forEach(c => chObs.observe(c));

function markSeen(ch) {
  if (journey.seen.has(ch)) return;
  journey.seen.add(ch);
  $(`.rail a[data-rail="${ch}"]`)?.classList.add('done');
  syncMediums();
}
// A chapter counts as seen once the learner has followed most of it.
document.addEventListener('progress', e => {
  const { chapter, step, of } = e.detail;
  if (step >= of * 0.6) markSeen(chapter);
});

/* ---------- path cards ---------- */
$$('[data-path]').forEach(b => b.addEventListener('click', () => {
  const p = b.dataset.path;
  const all = p === 'all' ? ['hands', 'software', 'theory'] : [p];
  all.forEach(x => journey.picked.add(x));
  $$('.path').forEach(c => c.classList.toggle('picked', journey.picked.has(c.dataset.path)));
  $$('.rail a').forEach(a => a.classList.toggle('pick', journey.picked.has(a.dataset.rail)));
  syncMediums();
  $('#' + all[0]).scrollIntoView({ behavior: rm ? 'auto' : 'smooth' });
}));

/* ---------- lazy chapters ---------- */
const gl = hasWebGL();
const lazy = [
  ['#radio', () => import('./radio.js'), true],
  ['#soft', () => import('./software.js'), false],
  ['#theory', () => import('./theory.js'), false],
];
for (const [sel, load, needsGL] of lazy) {
  const el = $(sel);
  const io = new IntersectionObserver(es => {
    if (!es.some(e => e.isIntersecting)) return;
    io.disconnect();
    if (needsGL && !gl) { $$('.nogl', el).forEach(n => n.hidden = false); return; }
    load().then(m => m.init(el, { gl })).catch(err => { console.error(err); $$('.nogl', el).forEach(n => n.hidden = false); });
  }, { rootMargin: '600px 0px' });
  io.observe(el);
}

/* ---------- Nixy, the guide ---------- */
const LINES = {
  hands: 'Hands-on first! Drag the radio around. Every part glows when it is its turn.',
  software: 'Watch it once, then hit "Try it yourself". I will only help if you get stuck.',
  theory: 'Tap any idea on the map and I will show you where it lives in the heart.',
  plan: 'Your turn. Tell me about your team and I will sketch a draft for Yasin.',
};
const guide = $('#guide'), gLine = $('#guideLine');
let guideOff = false, guideTimer = 0, said = new Set();
$('#guideX').addEventListener('click', () => { guideOff = true; guide.classList.add('off'); });
function say(ch) {
  if (guideOff || !LINES[ch] || said.has(ch)) return;
  said.add(ch);
  guide.classList.remove('off');
  type(gLine, LINES[ch]);
  clearTimeout(guideTimer);
  guideTimer = setTimeout(() => guide.classList.add('off'), 8000);
}
function type(el, text) {
  if (rm) { el.textContent = text; return; }
  let i = 0; el.textContent = '';
  const id = setInterval(() => { el.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(id); }, 22);
}

/* ---------- programme builder ---------- */
const MODS = {
  hands: [['Exploded-view parts primer', 'Every part named, in the order it goes in', 3], ['3D assembly walkthrough', 'Step by step, from every angle', 6], ['Spot the mistake', 'Learners catch a wrong step before it happens', 4]],
  software: [['Guided walkthrough', 'Your real workflow, on desktop and mobile', 5], ['Try-it practice mode', 'Hands on the screens, hints only when stuck', 6], ['Quick-reference card', 'One page to keep next to the keyboard', 2]],
  theory: [['Concept map, built live', 'Ideas appear one by one, then the links', 5], ['3D model to explore', 'Turn it, open it, see each idea in place', 6], ['Knowledge check', 'Short questions tied back to the model', 3]],
};
const COL = { hands: 'var(--peach)', software: 'var(--ice)', theory: 'var(--lilac)' };
const FORMAT = { video: 'Video', interactive: 'Interactive', blended: 'Blended + live workshop' };
const form = $('#bForm'), team = $('#bTeam'), goal = $('#bGoal');
let touched = false;
form.addEventListener('input', () => { touched = true; render(); });
form.addEventListener('submit', e => e.preventDefault());
function syncMediums() {
  if (touched) return;
  const want = new Set([...journey.picked, ...journey.seen]);
  $$('input[name=m]', form).forEach(i => { i.checked = want.has(i.value); });
  render();
}
function esc(s) { return s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
function render() {
  const ms = $$('input[name=m]:checked', form).map(i => i.value);
  const f = $('input[name=f]:checked', form).value;
  const who = team.value.trim(), what = goal.value.trim();
  $('#oTitle').textContent = who ? `Training for ${who}` : 'Your team’s training';
  $('#oGoal').textContent = !ms.length ? 'Pick at least one medium to see a draft.' : what ? `Goal: ${what}` : 'Add a goal and the plan will name it.';
  const mods = ms.flatMap(m => MODS[m].map(x => [...x, m]));
  if (f === 'blended') mods.push(['Live workshop', 'Two hours, hands on, with the team’s own work', 120, 'live']);
  $('#oMods').innerHTML = mods.map(([t, d, min, m], i) => `<li style="--mc:${COL[m] || 'var(--mint)'};animation-delay:${i * 60}ms"><div><b>${esc(t)}</b><span>${esc(d)}</span></div><em>${min} min</em></li>`).join('');
  const total = mods.reduce((a, m) => a + (m[3] === 'live' ? 0 : m[2]), 0);
  $('#oMeta').innerHTML = ms.length ? [`${mods.length} modules`, `≈ ${total} min self-paced`, FORMAT[f], 'Draft · we refine it with you'].map(x => `<span>${x}</span>`).join('') : '';
  const body = [
    `Team: ${who || '(not given)'}`, `Goal: ${what || '(not given)'}`,
    `Mediums: ${ms.map(m => ({ hands: '3D hands-on', software: 'Software walkthrough', theory: 'Mind map + 3D model' })[m]).join(', ') || '(none yet)'}`,
    `Format: ${FORMAT[f]}`, '', 'Draft modules:', ...mods.map(([t], i) => `${i + 1}. ${t}`), '', 'Sent from the Potara Training Lab',
  ].join('\n');
  const mail = CFG.CONTACT_EMAIL || 'hello@potara.co.uk';
  $('#bSend').href = `mailto:${mail}?subject=${encodeURIComponent('Training brief' + (who ? ': ' + who : ''))}&body=${encodeURIComponent(body)}`;
}
$('#bCall').href = CFG.BOOKING_URL || `mailto:${CFG.CONTACT_EMAIL || 'hello@potara.co.uk'}`;
render();
