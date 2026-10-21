// Crisp labels over the pixel world: building names (low on the facade, so they never fall off screen),
// approach cards that open as you walk up to a door, and the Technicity name on the gate.
import { W, T } from './core.js';
import { SERVICES } from '../data/services.js';
import { CITY_STYLE } from './art2.js';

const box = document.getElementById('tags'), game = document.getElementById('game');
let els = {}, gateEl = null, current = null;

export function clearTags() { box.querySelectorAll('.btag,.gtag').forEach(e => e.remove()); els = {}; gateEl = null; current = null; }

function make(b) {
  const s = SERVICES[b.id], st = CITY_STYLE[b.style];
  const el = document.createElement('div'); el.className = 'btag'; el.style.setProperty('--c', s?.color || st.trim);
  el.innerHTML = `<div class="more"></div><div class="pill"><i></i><span></span></div>`;
  box.appendChild(el); return el;
}

// state: { recommended, visited:Set, player }
export function updateTags(world, state) {
  const m = world.map;
  if (!m.sky) { if (current) clearTags(); return; }
  if (current !== m) { clearTags(); current = m; }
  const rect = game.getBoundingClientRect(), k = rect.width / W, cam = world.cam, pl = world.player;
  for (const b of m.buildings) {
    if (!CITY_STYLE[b.style]) continue;
    const el = els[b.id] ||= make(b), s = SERVICES[b.id];
    const wx = (b.door[0] * T + 8), wy = b.y * T + b.h * T - 22; // just above the canopy, on the storefront glass
    const sx = (wx - cam.x) * k, sy = (wy - cam.y) * k;
    const off = sx < -200 || sx > rect.width + 200 || sy < -60 || sy > rect.height + 120;
    el.style.opacity = off ? 0 : 1; if (off) continue;
    el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
    const near = pl && Math.abs(pl.x - b.door[0]) + Math.abs(pl.y - (b.door[1] + 1)) <= 3;
    const key = `${b.locked}|${near}|${state.recommended === b.id}|${state.visited.has(b.id)}`;
    if (el.dataset.k === key) continue;
    el.dataset.k = key;
    el.classList.toggle('locked', !!b.locked); el.classList.toggle('near', !!near);
    el.classList.toggle('rec', state.recommended === b.id && !b.locked); el.classList.toggle('done', state.visited.has(b.id));
    el.querySelector('.pill span').textContent = b.locked ? `Secret project 0${b.n}` : s.name;
    el.querySelector('.more').innerHTML = b.locked ? 'Taped off for now. Nixy has the key.<b>Keep exploring</b>' : `${s.line}<b>Walk in ▸</b>`;
  }
  // the city's name, on a small holographic plate beside the gate pylon
  const gate = m.props.find(p => p.kind === 'gate');
  if (gate) {
    if (!gateEl) { gateEl = document.createElement('div'); gateEl.className = 'gtag'; gateEl.innerHTML = 'Potara<br><b>Technicity</b>'; box.appendChild(gateEl); }
    gateEl.style.left = ((gate.x * T + 13 - cam.x) * k) + 'px'; gateEl.style.top = ((gate.y * T - 22 - cam.y) * k) + 'px';
  }
}

// speech bubbles and emotes for any world, as crisp DOM
const bubs = new Map();
const sentence = t => /[a-z]/.test(t) ? t : t.charAt(0) + t.slice(1).toLowerCase();
export function updateBubbles(world) {
  const rect = game.getBoundingClientRect(), z = world.zoom || 1, k = rect.width / W * z, cam = world.cam, live = new Set();
  const place = (key, cls, html, e, dy) => {
    let el = bubs.get(key); if (!el) { el = document.createElement('div'); el.className = cls; box.appendChild(el); bubs.set(key, el); }
    if (el.dataset.h !== html) { el.innerHTML = html; el.dataset.h = html; }
    el.style.transform = `translate3d(${((e.px + 8 + (e.sit && e.sitDx || 0) - cam.x) * k).toFixed(1)}px, ${((e.py + dy - cam.y) * k).toFixed(1)}px, 0) translate(-50%, -100%)`;
    live.add(key);
  };
  for (const b of world.bubbles) if (!b.ent.hidden) place('b:' + (b.ent.id || 'x'), 'bub', sentence(b.text).replace(/</g, '&lt;'), b.ent, -14);
  for (const e of world.ents) if (e.emote && !e.hidden) place('e:' + e.id, 'emo', e.emote, e, -12);
  for (const [key, el] of bubs) if (!live.has(key) || el.parentNode !== box) { el.remove(); bubs.delete(key); }
}

export function clearAll() { box.innerHTML = ''; els = {}; gateEl = null; current = null; bubs.clear(); }
