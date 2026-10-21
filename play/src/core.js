// Core: canvas, scaling, loop, the one scheduler, input, scene manager, effects, save state.
export const W = 480, H = 270, T = 16;
export const LW = 320, LH = 180; // cinematic scenes (battle, founder) keep their original 320x180 canvas
export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d', { willReadFrequently: true });
canvas.width = W; canvas.height = H; ctx.imageSmoothingEnabled = false;

export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------------- scheduler: every timer and tween runs on game time ----------------
export const clock = { t: 0, paused: false };
const timers = new Set(), tweens = new Set();
export function wait(ms) { return new Promise(r => timers.add({ at: clock.t + ms, fn: r })); }
export function after(ms, fn) { const o = { at: clock.t + ms, fn }; timers.add(o); return () => timers.delete(o); }
export function tween(ms, fn, ease = easeInOut) {
  return new Promise(r => { if (RM) ms = Math.min(ms, 120); tweens.add({ t0: clock.t, ms: Math.max(1, ms), fn, ease, r }); });
}
export const easeInOut = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
export const lerp = (a, b, k) => a + (b - a) * k;
function tick(dt) {
  clock.t += dt;
  for (const tm of [...timers]) if (clock.t >= tm.at) { timers.delete(tm); tm.fn(); }
  for (const tw of [...tweens]) { const k = Math.min(1, (clock.t - tw.t0) / tw.ms); tw.fn(tw.ease(k)); if (k >= 1) { tweens.delete(tw); tw.r(); } }
}
// A promise that resolves on whichever comes first: the promise, or the timeout.
export function within(p, ms) { return Promise.race([p, wait(ms)]); }

// ---------------- events ----------------
const handlers = {};
export const on = (e, f) => { (handlers[e] ||= []).push(f); return () => handlers[e] = handlers[e].filter(x => x !== f); };
export const emit = (e, d) => (handlers[e] || []).slice().forEach(f => f(d));

// ---------------- effects ----------------
export const fx = { fade: 0, fadeColor: '#05030f', sat: 1, flash: 0, shake: 0 };
export const fadeOut = (ms = 350) => tween(ms, k => fx.fade = k);
export const fadeIn = (ms = 350) => tween(ms, k => fx.fade = 1 - k);

// ---------------- scenes ----------------
let scene = null;
export function setScene(s) { scene?.exit?.(); scene = s; s?.enter?.(); }
export const getScene = () => scene;

// ---------------- input ----------------
export const keys = {};
const DIRS = { ArrowDown: 0, s: 0, S: 0, ArrowLeft: 1, a: 1, A: 1, ArrowRight: 2, d: 2, D: 2, ArrowUp: 3, w: 3, W: 3 };
export const input = { dirHeld: () => { let best = -1, bt = -1; for (const k in DIRS) if (keys[k] && keys[k] > bt) { bt = keys[k]; best = DIRS[k]; } return best; } };
const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.tagName === 'SELECT'); };
addEventListener('keydown', e => {
  if (typing()) return;
  if (e.key in DIRS) { if (!keys[e.key]) keys[e.key] = performance.now(); e.preventDefault(); }
  if (e.key === ' ' || e.key === 'Enter' || e.key === 'z' || e.key === 'Z') {
    if (document.activeElement?.tagName === 'BUTTON' && e.key !== 'z' && e.key !== 'Z' && !document.activeElement.closest('#dlg')) return; // let buttons do their thing
    e.preventDefault(); if (!e.repeat) emit('act', 'key');
  }
  if (e.key === 'Escape') emit('esc');
  if (/^[1-4]$/.test(e.key)) emit('num', +e.key);
});
addEventListener('keyup', e => { delete keys[e.key]; });
addEventListener('blur', () => { for (const k in keys) delete keys[k]; });
export function toGame(e) {
  const r = canvas.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
const legacyPt = p => scene?.legacy ? { x: p.x * LW / W, y: p.y * LH / H } : p;
canvas.addEventListener('pointerdown', e => { e.preventDefault(); emit('point', legacyPt(toGame(e))); });
canvas.addEventListener('pointermove', e => { emit('hover', legacyPt(toGame(e))); });

// ---------------- scaling ----------------
const stage = document.getElementById('stage');
// the HD light layer and the ambient glow behind the window
export const hd = document.getElementById('fx'), hctx = hd.getContext('2d');
const amb = document.getElementById('ambient'), actx = amb.getContext('2d'); amb.width = 64; amb.height = 36;
export const view = { k: 1, css: 1 };
export function fit() {
  const vw = innerWidth, vh = innerHeight;
  const touch = matchMedia('(pointer: coarse)').matches, portrait = vh > vw * 1.05;
  // a phone held sideways: no frame, no margins, the game takes the whole height of the screen
  const land = touch && !portrait && vh <= 600;
  document.body.classList.toggle('portrait', portrait); document.body.classList.toggle('land', land); document.body.classList.toggle('touch', touch);
  const s = portrait ? vw / W : land ? Math.min(vw / W, vh / H) : Math.min(vw * .975 / W, vh * .955 / H);
  const gw = Math.round(W * s), gh = Math.round(H * s);
  canvas.style.width = gw + 'px'; canvas.style.height = gh + 'px';
  stage.style.setProperty('--gw', gw + 'px'); stage.style.setProperty('--gh', gh + 'px');
  const dpr = Math.min(window.devicePixelRatio || 1, 2), hw = Math.min(2560, Math.round(gw * dpr));
  hd.width = hw; hd.height = Math.round(hw * H / W); view.k = hd.width / W; view.css = s;
}
addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); fit();
// upright phones get a button that asks for landscape (Android can lock it; elsewhere it's a nudge to turn the phone)
document.getElementById('rotate')?.addEventListener('click', async () => {
  try { await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }); await screen.orientation?.lock?.('landscape'); } catch (e) { }
  setTimeout(fit, 300);
});

// ---------------- loop ----------------
const STEP = 1000 / 60; let acc = 0, last = performance.now(), frameN = 0;
const lbuf = document.createElement('canvas'); lbuf.width = LW; lbuf.height = LH; const lctx = lbuf.getContext('2d'); lctx.imageSmoothingEnabled = false;
function desaturate(k) {
  // k = colour amount, 0 = Grey Office palette (cold grey-teal), 1 = full colour
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height), d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const y = d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11;
    const gr = y * .92, gg = y * .98 + 4, gb = y * 1.02 + 8; // teal-grey tint
    d[i] = gr + (d[i] - gr) * k; d[i + 1] = gg + (d[i + 1] - gg) * k; d[i + 2] = gb + (d[i + 2] - gb) * k;
  }
  ctx.putImageData(img, 0, 0);
}
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(100, now - last); last = now;
  if (document.hidden) return;
  acc += dt;
  while (acc >= STEP) { acc -= STEP; if (!clock.paused) { tick(STEP); scene?.update?.(STEP); } }
  ctx.save(); hctx.setTransform(1, 0, 0, 1, 0, 0); hctx.clearRect(0, 0, hd.width, hd.height);
  // shake in whole pixels, so it never blurs the art
  if (fx.shake > 0) { const sx = Math.round((Math.random() - .5) * fx.shake), sy = Math.round((Math.random() - .5) * fx.shake); ctx.translate(sx, sy); hctx.translate(sx * view.k, sy * view.k); }
  const cw = scene?.legacy ? LW : W;
  if (canvas.width !== cw) { canvas.width = cw; canvas.height = scene?.legacy ? LH : H; ctx.imageSmoothingEnabled = false; }
  if (scene?.legacy) { scene.render(ctx); }
  else scene?.render?.(ctx);
  scene?.renderHD?.(hctx, view.k);
  ctx.restore();
  hd.style.opacity = (1 - fx.fade) * (fx.sat < 1 ? fx.sat * fx.sat : 1);
  if ((frameN = (frameN + 1) % 4) === 0) actx.drawImage(canvas, 0, 0, amb.width, amb.height);
  if (fx.sat < 0.999) desaturate(fx.sat);
  scene?.renderTop?.(ctx);
  if (fx.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${fx.flash})`; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  if (fx.fade > 0) { ctx.globalAlpha = fx.fade; ctx.fillStyle = fx.fadeColor; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.globalAlpha = 1; }
}
export function start() { requestAnimationFrame(frame); }

// ---------------- save state (never personal details) ----------------
const KEY = 'nixy-world-v2';
export const save = (() => {
  let s = {};
  try { s = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { s = {}; }
  return {
    get: (k, d) => (k in s ? s[k] : d),
    set: (k, v) => { s[k] = v; try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { } },
    clear: () => { s = {}; try { localStorage.removeItem(KEY); } catch (e) { } },
  };
})();

// session-only memory for the visitor's details (cleared on reload)
export const session = { name: '', email: '', business: '', newsletter: null };
export function fill(text) {
  return text
    .replace(/\{name\|([^}]+)\}/g, (_, d) => session.name || d)
    .replace(/\{, name\}/g, session.name ? ', ' + session.name : '')
    .replace(/\{name\}/g, session.name || 'friend')
    .replace(/\{business\}/g, session.business || 'your business');
}
