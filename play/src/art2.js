// HD-2D city art: the Technicity skyline, glass buildings, modern props, high-tech interiors.
// Pixel art drawn in code at the game's resolution; hd.js adds the light on top.
import { P, hash, person } from './art.js';
import { W as VW } from './core.js';

const R = (g, c, x, y, w, h) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };

// ---------------- sky: golden hour over a city that is still being built ----------------
const SKY_TOP = '#4f5bd5', SKY_MID = '#9a7cf0', SKY_LOW = '#ffb08a', SKY_HZN = '#ffe2b4';
let skyCache = null;
function skylineLayer(seed, wpx, hMin, hMax, body, win, spacing) {
  // pre-render one long strip of towers; drawn with parallax each frame
  const c = document.createElement('canvas'); c.width = wpx; c.height = 80; const g = c.getContext('2d');
  let x = 0, i = 0;
  while (x < wpx) {
    const r = hash(i, seed), bw = 10 + ((r * 18) | 0), bh = hMin + ((hash(seed, i) * (hMax - hMin)) | 0);
    const y = 80 - bh;
    R(g, body, x, y, bw, bh);
    // crown shapes: spire, stepped top, antenna
    const crown = (hash(i, seed + 3) * 4) | 0;
    if (crown === 0) { R(g, body, x + (bw >> 1) - 1, y - 7, 2, 7); }
    if (crown === 1) { R(g, body, x + 2, y - 4, bw - 4, 4); R(g, body, x + 4, y - 7, bw - 8, 3); }
    if (crown === 2) { R(g, body, x + bw - 3, y - 10, 1, 10); }
    // lit windows
    if (win) for (let yy = y + 3; yy < 78; yy += 4) for (let xx = x + 2; xx < x + bw - 2; xx += 3) if (hash(xx, yy, seed) > .62) R(g, win, xx, yy, 1, 2);
    // a lighter edge facing the sun
    R(g, 'rgba(255,220,190,.18)', x, y, 1, bh);
    x += bw + spacing + ((hash(seed, i + 7) * 6) | 0); i++;
  }
  return c;
}
export function drawSky(g, cx, cy, t, mapW, skyH) {
  const W = VW, top = -cy, h = skyH + 18;
  if (!skyCache) skyCache = {
    far: skylineLayer(11, 1400, 18, 50, 'rgba(176,150,232,.75)', null, 3),
    mid: skylineLayer(29, 1600, 14, 40, '#4a3f8f', '#ffd68a', 4),
  };
  const gr = g.createLinearGradient(0, top, 0, top + h);
  gr.addColorStop(0, SKY_TOP); gr.addColorStop(.42, SKY_MID); gr.addColorStop(.78, SKY_LOW); gr.addColorStop(1, SKY_HZN);
  g.fillStyle = gr; g.fillRect(0, top, W, h);
  // the sun, low over the city
  const sx = 238 - cx * .06, sy = top + skyH - 30;
  g.fillStyle = 'rgba(255,240,200,.35)'; g.beginPath(); g.arc(sx, sy, 17, 0, 7); g.fill();
  g.fillStyle = '#fff3d1'; g.beginPath(); g.arc(sx, sy, 11, 0, 7); g.fill();
  // drifting clouds (long, flat, lit from below)
  for (let i = 0; i < 6; i++) {
    const w = 30 + ((hash(i, 5) * 40) | 0), y = top + 6 + i * 7, x = ((i * 97 + t * (.004 + i * .001) - cx * .12) % (W + w + 40) + W + w + 40) % (W + w + 40) - w - 20;
    R(g, 'rgba(255,236,226,.55)', x, y, w, 2); R(g, 'rgba(255,200,170,.5)', x + 4, y + 2, w - 8, 1);
  }
  // far and mid skylines, with parallax
  const far = skyCache.far, mid = skyCache.mid;
  g.drawImage(far, -((cx * .22) % (far.width - W)) , top + skyH - 80 + 6);
  g.drawImage(mid, -((cx * .45) % (mid.width - W)), top + skyH - 80 + 12);
  // sky-train on its line
  const ly = top + skyH - 26, span = mapW + 260, tx = ((t / 20) % span) - 130 - cx * .45;
  R(g, 'rgba(255,255,255,.55)', 0, ly + 7, W, 1);
  for (let px = -((cx * .45) % 40); px < W; px += 40) R(g, 'rgba(255,255,255,.35)', px, ly + 8, 2, 10);
  R(g, '#f6f3ff', tx, ly, 70, 6); R(g, '#19d3c5', tx, ly + 4, 70, 1); R(g, '#f6f3ff', tx + 70, ly + 1, 6, 5);
  for (let i = 0; i < 8; i++) R(g, '#3b2f7a', tx + 4 + i * 8, ly + 1, 5, 2);
}

// ---------------- city buildings ----------------
export const CITY_STYLE = {
  rooms:    { body: '#1d2c55', body2: '#25386b', glass: '#3a5a9a', trim: '#19d3c5', win: '#ffe3a8', name: 'Meeting Room Studio' },
  arcade:   { body: '#4a1240', body2: '#5e1852', glass: '#8a2a74', trim: '#ffd60a', win: '#ffc4ef', name: 'The Arcade' },
  training: { body: '#16205a', body2: '#1c2a70', glass: '#3b56b8', trim: '#93c5fd', win: '#dbeafe', name: 'Training Studio' },
  vf:       { body: '#2b1a62', body2: '#35207a', glass: '#5d43c4', trim: '#ffd60a', win: '#f5d0fe', name: 'Virtual Foreground' },
  si:       { body: '#0f3a3c', body2: '#14484a', glass: '#1f7a74', trim: '#a3e635', win: '#d9f99d', name: 'SI Academy' },
  school:   { body: '#5b2e1e', body2: '#6e3a24', glass: '#a35a33', trim: '#fb923c', win: '#fde68a', name: 'Schoolhouse' },
};
export function drawCityBuilding(g, b, x, y, t) {
  const s = CITY_STYLE[b.style], W = b.w * 16, Hf = b.h * 16, top = -(b.top || 30), H = Hf - top;
  const ground = Hf - 20;
  // shadow on the plaza
  g.fillStyle = 'rgba(20,10,60,.28)'; g.fillRect(x + 4, y + Hf - 3, W, 6);
  // body with a lit left edge and a darker right edge (volume)
  R(g, P.ink, x - 1, y + top - 1, W + 2, H + 1);
  R(g, s.body, x, y + top, W, H);
  R(g, s.body2, x + 3, y + top + 4, W - 8, ground - top - 4);
  R(g, 'rgba(255,255,255,.14)', x, y + top, 2, H); R(g, 'rgba(0,0,0,.25)', x + W - 3, y + top, 3, H);
  // curtain wall: ribbon windows between spandrel panels, slim mullions, warm lit stretches
  for (let yy = top + 7; yy < ground - 5; yy += 9) {
    R(g, s.glass, x + 4, y + yy, W - 9, 5);
    R(g, 'rgba(255,255,255,.26)', x + 4, y + yy, W - 9, 1);
    R(g, 'rgba(0,0,0,.28)', x + 4, y + yy + 4, W - 9, 1);
    for (let xx = 5; xx < W - 8; xx += 12) if (hash(xx, yy, b.x) > .5) R(g, s.win, x + xx + 1, y + yy + 1, 9, 3);
    for (let xx = 4; xx < W - 5; xx += 12) R(g, 'rgba(10,8,30,.6)', x + xx, y + yy, 1, 5);
  }
  // the slow reflection that sweeps across the glass
  g.save(); g.beginPath(); g.rect(x, y + top, W, ground - top); g.clip();
  const sw = ((t / 28 + b.x * 37) % (W + 120)) - 60;
  g.fillStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.moveTo(x + sw, y + top); g.lineTo(x + sw + 14, y + top); g.lineTo(x + sw - 26, y + ground); g.lineTo(x + sw - 40, y + ground); g.fill();
  g.fillStyle = 'rgba(255,255,255,.06)'; g.beginPath(); g.moveTo(x + sw + 20, y + top); g.lineTo(x + sw + 26, y + top); g.lineTo(x + sw - 14, y + ground); g.lineTo(x + sw - 20, y + ground); g.fill();
  g.restore();
  // roof: parapet and the emissive trim line
  R(g, P.ink, x - 2, y + top - 3, W + 4, 4); R(g, s.trim, x - 2, y + top, W + 4, 1);
  ROOF[b.style]?.(g, s, x, y + top, W, t, b);
  // ground floor: storefront glass, canopy, door
  R(g, '#0d0b22', x + 2, y + ground, W - 4, 20);
  for (let xx = 4; xx < W - 4; xx += 10) R(g, 'rgba(255,255,255,.08)', x + xx, y + ground + 2, 8, 16);
  STORE[b.style]?.(g, s, x, y + ground, W, t, b);
  R(g, s.trim, x, y + ground - 2, W, 2); R(g, 'rgba(255,255,255,.35)', x, y + ground - 2, W, 1);
  const dx = (b.door[0] - b.x) * 16;
  R(g, P.ink, x + dx + 1, y + Hf - 17, 14, 17); R(g, b.locked ? '#1a1a2e' : '#e9fbff', x + dx + 2, y + Hf - 16, 12, 16);
  if (!b.locked) { R(g, s.trim, x + dx + 7, y + Hf - 16, 1, 16); g.globalAlpha = .5 + .3 * Math.sin(t / 380); R(g, s.trim, x + dx + 2, y + Hf - 16, 12, 1); g.globalAlpha = 1; }
  // locked: a thin holographic barrier rather than tape
  if (b.locked) {
    g.save(); g.beginPath(); g.rect(x, y + top, W, H); g.clip();
    for (const [ox, ang] of [[0, .3], [0, -.3]]) {
      g.save(); g.translate(x + W / 2 + ox, y + Hf / 2 - 2); g.rotate(ang);
      g.fillStyle = 'rgba(250,204,21,.85)'; g.fillRect(-W, -2, W * 2, 4); g.fillStyle = P.ink;
      for (let i = -W; i < W; i += 6) g.fillRect(i, -2, 2, 4);
      g.restore();
    }
    g.restore();
  }
}
const ROOF = {
  rooms(g, s, x, y, W, t) { // rooftop garden and a satellite uplink
    R(g, '#2f6b4f', x + 6, y - 5, 22, 3); for (let i = 0; i < 5; i++) R(g, '#48a36d', x + 7 + i * 4, y - 7, 3, 3);
    R(g, '#c9d4ff', x + W - 18, y - 9, 8, 2); R(g, '#c9d4ff', x + W - 15, y - 7, 2, 4); R(g, s.trim, x + W - 11, y - 11, 1, 2);
  },
  arcade(g, s, x, y, W, t) { // the marquee with chaser bulbs
    R(g, P.ink, x + 8, y - 13, W - 16, 12); R(g, '#2a0b24', x + 9, y - 12, W - 18, 10);
    for (let i = 0; i < (W - 18) / 4; i++) R(g, ((t / 120 | 0) + i) % 3 ? s.trim : '#7c2d12', x + 10 + i * 4, y - 12, 2, 1), R(g, ((t / 120 | 0) + i + 1) % 3 ? s.trim : '#7c2d12', x + 10 + i * 4, y - 4, 2, 1);
    for (let i = 0; i < 6; i++) R(g, ['#f472b6', '#22d3ee', '#ffd60a', '#a855f7', '#4ade80', '#f472b6'][i], x + W / 2 - 18 + i * 6, y - 10, 4, 4);
  },
  training(g, s, x, y, W, t) { // ON AIR light and a camera on the roof
    R(g, P.ink, x + 8, y - 8, 18, 7); R(g, (t / 700 | 0) % 2 ? '#ef4444' : '#7f1d1d', x + 9, y - 7, 16, 5);
    R(g, '#e5e7eb', x + W - 22, y - 8, 10, 6); R(g, '#111827', x + W - 12, y - 7, 4, 4); R(g, '#9ca3af', x + W - 18, y - 2, 2, 2);
  },
  vf(g, s, x, y, W, t) { // the hologram emitter (the hologram itself is drawn in HD)
    R(g, P.ink, x + W / 2 - 10, y - 7, 20, 6); R(g, '#6d5bd0', x + W / 2 - 9, y - 6, 18, 4); R(g, s.trim, x + W / 2 - 6, y - 7, 12, 1);
    R(g, '#c4b5fd', x + W / 2 - 1, y - 12, 2, 5);
  },
  si(g, s, x, y, W, t) { // a dome laced with circuit light
    g.fillStyle = P.ink; g.beginPath(); g.arc(x + W / 2, y, 19, Math.PI, 0); g.fill();
    g.fillStyle = '#17605c'; g.beginPath(); g.arc(x + W / 2, y, 18, Math.PI, 0); g.fill();
    g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(x + W / 2 - 5, y - 9, 6, Math.PI, 0); g.fill();
    for (let i = 0; i < 5; i++) { const on = ((t / 200 | 0) + i) % 5 === 0; R(g, on ? s.trim : '#2c7a6a', x + W / 2 - 14 + i * 7, y - 4 - (i % 2) * 6, 3, 1); }
  },
  school(g, s, x, y, W, t) { // solar panels and a green roof
    R(g, '#3f7a3a', x + 2, y - 3, W - 4, 3);
    for (let i = 0; i < 4; i++) { R(g, P.ink, x + 6 + i * 21, y - 9, 18, 7); R(g, '#1e3a8a', x + 7 + i * 21, y - 8, 16, 5); R(g, '#60a5fa', x + 7 + i * 21, y - 8, 16, 1); }
  },
};
const STORE = {
  rooms(g, s, x, y, W, t) { // a meeting in progress, seen through the glass
    R(g, '#16244a', x + 6, y + 3, W - 12, 14);
    R(g, '#0b1022', x + 12, y + 4, 22, 9); R(g, '#19d3c5', x + 13, y + 5, 20, 7);
    for (let i = 0; i < 4; i++) R(g, ['#fbcfe8', '#93c5fd', '#fde68a', '#c4b5fd'][i], x + 14 + i * 5, y + 6, 3, 3);
    R(g, '#e9e2d0', x + 40, y + 12, 40, 2);
    for (let i = 0; i < 5; i++) { const bob = Math.round(Math.sin(t / 400 + i) * .5); R(g, '#0b0a1a', x + 42 + i * 8, y + 8 + bob, 4, 4); R(g, ['#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#60a5fa'][i], x + 42 + i * 8, y + 12, 4, 2); }
  },
  arcade(g, s, x, y, W, t) { for (let i = 0; i < 4; i++) { R(g, '#1a0716', x + 8 + i * 22, y + 3, 10, 14); R(g, ((t / 300 | 0) + i) % 2 ? '#22d3ee' : '#f472b6', x + 9 + i * 22, y + 4, 8, 6); } },
  training(g, s, x, y, W, t) { R(g, '#0b1230', x + 8, y + 3, 30, 13); R(g, '#93c5fd', x + 9, y + 4, 28, 8); R(g, '#f9a8d4', x + 11, y + 6, 10, 1); R(g, '#f9a8d4', x + 11, y + 8, 16, 1); R(g, '#fff', x + 60, y + 6, 4, 8); R(g, '#1f2937', x + 58, y + 4, 8, 3); },
  vf(g, s, x, y, W, t) { for (let i = 0; i < 3; i++) { R(g, '#160d33', x + 10 + i * 26, y + 3, 16, 14); R(g, ['#22d3ee', '#f472b6', '#ffd60a'][i], x + 15 + i * 26, y + 6, 6, 6); R(g, '#160d33', x + 16 + i * 26, y + 7, 4, 1); } },
  si(g, s, x, y, W, t) { R(g, '#062221', x + 8, y + 3, W - 16, 13); for (let i = 0; i < 6; i++) { const on = ((t / 250 | 0) + i) % 6 === 0; R(g, on ? '#a3e635' : '#1f5c4e', x + 12 + i * 12, y + 9, 8, 2); if (i < 5) R(g, '#1f5c4e', x + 20 + i * 12, y + 9, 4, 1); } },
  school(g, s, x, y, W, t) { R(g, '#173d2b', x + 8, y + 3, 34, 13); R(g, '#fde68a', x + 12, y + 6, 12, 1); R(g, '#fde68a', x + 12, y + 9, 20, 1); R(g, '#4ade80', x + 58, y + 8, 4, 8); R(g, '#4ade80', x + 64, y + 5, 4, 11); R(g, '#4ade80', x + 70, y + 2, 4, 14); },
};

// ---------------- city props (override the old ones in the city) ----------------
export const DRAW2 = {
  grave(g, p, x, y, t) { // a crooked headstone; the old town buries its fax machines
    const lean = p.lean || 0; R(g, 'rgba(0,0,0,.3)', x + 3, y + 13, 11, 3);
    R(g, P.ink, x + 3 + lean, y + 1, 10, 13); R(g, '#9aa0ad', x + 4 + lean, y + 2, 8, 11); R(g, '#b9bfcb', x + 4 + lean, y + 2, 8, 2); R(g, '#7b8190', x + 11 + lean, y + 3, 1, 10);
    R(g, '#5c6270', x + 6 + lean, y + 5, 4, 1); R(g, '#5c6270', x + 7 + lean, y + 4, 2, 5);
    R(g, '#4b5a3a', x + 2, y + 13, 3, 2); R(g, '#4b5a3a', x + 11, y + 14, 3, 1);
  },
  oldlamp(g, p, x, y, t) { // a rusted gas lamp that can't decide whether it's on
    R(g, 'rgba(0,0,0,.3)', x + 5, y + 13, 7, 3);
    R(g, '#2b2a2e', x + 7, y - 12, 2, 26); R(g, '#45434a', x + 7, y - 12, 1, 26);
    R(g, P.ink, x + 4, y - 18, 8, 7); const on = p.on = (Math.sin(t / 90 + p.x) > -.2) && ((t / 170 | 0) + p.x) % 11 > 1;
    R(g, on ? '#f6d77a' : '#5a5136', x + 5, y - 17, 6, 5); R(g, '#2b2a2e', x + 4, y - 19, 8, 1);
  },
  pine(g, p, x, y, t) { // layered conifer, cool and dark, catching a little light on one side
    R(g, 'rgba(0,0,0,.32)', x + 1, y + 12, 15, 4); R(g, '#2b1d14', x + 7, y + 7, 3, 8);
    const L = (yy, hw, c1, c2) => { for (let i = 0; i < 6; i++) { const w2 = Math.round(hw * (i + 2) / 7); R(g, i === 5 ? P.ink : c1, x + 8 - w2, y + yy + i, w2 * 2, 1); R(g, c2, x + 8 - w2, y + yy + i, Math.max(1, w2 - 2), 1); } };
    L(-14, 5, '#123a33', '#1f5a4c'); L(-9, 7, '#103430', '#1c5246'); L(-3, 8, '#0e2f2b', '#194a40');
    if (hash(p.x, p.y, 4) > .7) R(g, '#d9f99d', x + 4, y - 4, 1, 1);
  },
  lamp(g, p, x, y, t) { // slim light pole, head glows in HD
    R(g, 'rgba(20,10,60,.25)', x + 5, y + 13, 7, 3);
    R(g, '#2a2650', x + 7, y - 14, 2, 28); R(g, '#d9d6ff', x + 7, y - 14, 1, 28);
    R(g, P.ink, x + 3, y - 17, 10, 4); R(g, '#e9fbff', x + 4, y - 16, 8, 2);
  },
  holo(g, p, x, y, t) { // info kiosk with a floating panel
    R(g, 'rgba(20,10,60,.25)', x + 3, y + 12, 10, 3);
    R(g, P.ink, x + 5, y + 2, 6, 12); R(g, '#3a3470', x + 6, y + 3, 4, 10);
    const a = .55 + .25 * Math.sin(t / 400 + p.x); g.globalAlpha = a;
    R(g, '#19d3c5', x + 1, y - 12, 14, 11); R(g, '#e9fffd', x + 3, y - 10, 8, 1); R(g, '#e9fffd', x + 3, y - 7, 10, 1); R(g, '#e9fffd', x + 3, y - 4, 6, 1);
    g.globalAlpha = 1;
  },
  tree(g, p, x, y, t) { // rounded canopy, fresh greens, a little gold
    if (!p.city) return false;
    R(g, 'rgba(20,10,60,.28)', x + 1, y + 11, 15, 5);
    R(g, '#5b3a29', x + 7, y + 3, 3, 11);
    const sway = Math.round(Math.sin(t / 900 + p.x) * .6);
    const c1 = p.v > .5 ? '#2f9e6e' : '#3aa36a', c2 = p.v > .5 ? '#4cc58a' : '#5fd08a', c3 = '#b9f5cf';
    g.fillStyle = P.ink; g.beginPath(); g.arc(x + 8 + sway, y - 3, 9, 0, 7); g.fill();
    g.fillStyle = c1; g.beginPath(); g.arc(x + 8 + sway, y - 3, 8, 0, 7); g.fill();
    g.fillStyle = c2; g.beginPath(); g.arc(x + 6 + sway, y - 6, 5, 0, 7); g.fill();
    R(g, c3, x + 4 + sway, y - 9, 2, 2);
    if (p.v > .7) { R(g, '#ffd60a', x + 11 + sway, y - 4, 2, 2); R(g, '#ffd60a', x + 5 + sway, y, 2, 2); }
  },
  bench(g, p, x, y) { if (p.under) return; R(g, 'rgba(20,10,60,.25)', x + 1, y + 11, p.w * 16 - 2, 4); R(g, P.ink, x + 1, y + 2, p.w * 16 - 2, 10); R(g, '#d9cbb0', x + 2, y + 3, p.w * 16 - 4, 3); R(g, '#b49a74', x + 2, y + 6, p.w * 16 - 4, 2); R(g, '#3a3470', x + 4, y + 8, 2, 4); R(g, '#3a3470', x + p.w * 16 - 6, y + 8, 2, 4); R(g, '#19d3c5', x + 2, y + 11, p.w * 16 - 4, 1); },
  fountain(g, p, x, y, t) { // a ring fountain with a slow holographic sculpture
    R(g, 'rgba(20,10,60,.25)', x, y + 26, 32, 6);
    g.fillStyle = P.ink; g.beginPath(); g.ellipse(x + 16, y + 20, 16, 9, 0, 0, 7); g.fill();
    g.fillStyle = '#e8e4f6'; g.beginPath(); g.ellipse(x + 16, y + 19, 15, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#4fb4f0'; g.beginPath(); g.ellipse(x + 16, y + 19, 12, 6, 0, 0, 7); g.fill();
    g.fillStyle = '#9fdcff'; g.fillRect(x + 8 + ((t / 200 | 0) % 14), y + 18, 3, 1);
    const r = Math.sin(t / 700) * 4; g.globalAlpha = .7;
    g.strokeStyle = '#19d3c5'; g.lineWidth = 1; g.beginPath(); g.ellipse(x + 16, y + 6, 6 + r * .3, 3, 0, 0, 7); g.stroke();
    g.strokeStyle = '#ffd60a'; g.beginPath(); g.ellipse(x + 16, y + 1, 4, 2, t / 900, 0, 7); g.stroke();
    g.globalAlpha = 1;
  },
  pad(g, p, x, y, t) { // the launch pad: a ring of light set in the plaza
    const cxp = x + 24, cyp = y + 26;
    g.fillStyle = '#1b1840'; g.beginPath(); g.ellipse(cxp, cyp, 22, 12, 0, 0, 7); g.fill();
    g.strokeStyle = '#6b4dff'; g.lineWidth = 2; g.beginPath(); g.ellipse(cxp, cyp, 20, 10, 0, 0, 7); g.stroke();
    g.strokeStyle = '#ffd60a'; g.lineWidth = 1; g.beginPath(); g.ellipse(cxp, cyp, 13, 6.5, t / 800, 0, 4.2); g.stroke();
    g.fillStyle = '#f6f3ff'; g.font = '6px monospace';
  },
  monolith(g, p, x, y, t) { // a black glass obelisk with the Potara mark
    R(g, 'rgba(20,10,60,.3)', x, y + 12, 16, 4);
    R(g, P.ink, x + 2, y - 22, 12, 36); R(g, '#1a1735', x + 3, y - 21, 10, 34); R(g, 'rgba(255,255,255,.18)', x + 3, y - 21, 2, 34);
    R(g, '#ffd60a', x + 6, y - 14, 4, 4); R(g, '#1a1735', x + 7, y - 13, 2, 2); R(g, '#ffd60a', x + 6, y - 10, 1, 4);
  },
  gate(g, p, x, y, t) { // a slim pylon; the arch of light and the name are drawn in HD
    R(g, 'rgba(20,10,60,.3)', x + 3, y + 12, 10, 4);
    R(g, P.ink, x + 5, y - 26, 6, 40); R(g, '#e9e6ff', x + 6, y - 25, 4, 38); R(g, '#b7b0e8', x + 9, y - 25, 1, 38);
    R(g, '#ffd60a', x + 6, y - 27, 4, 2); R(g, '#19d3c5', x + 6, y - 8, 4, 1);
  },
  planter(g, p, x, y) { R(g, 'rgba(20,10,60,.25)', x + 1, y + 11, 14, 4); R(g, P.ink, x + 1, y + 4, 14, 10); R(g, '#e8e4f6', x + 2, y + 5, 12, 8); R(g, '#3aa36a', x + 2, y + 1, 12, 5); R(g, '#5fd08a', x + 4, y - 1, 5, 3); R(g, '#f472b6', x + 10, y, 2, 2); },
  // ---- interiors (skip the grey office's own versions) ----
  table(g, p, x, y) { if (p.grey) return false; const w = p.w * 16, h = p.h * 16;
    R(g, 'rgba(0,0,0,.35)', x + 3, y + 5, w - 2, h); R(g, P.ink, x, y, w, h - 2); R(g, '#b98a5e', x + 1, y + 1, w - 2, h - 4);
    for (let i = 0; i < w - 4; i += 7) R(g, 'rgba(90,50,20,.18)', x + 2 + i, y + 2, 4, h - 7); R(g, 'rgba(255,255,255,.22)', x + 2, y + 2, w - 4, 1);
    R(g, '#8a6040', x + 1, y + h - 5, w - 2, 2); R(g, '#19d3c5', x + 1, y + h - 3, w - 2, 1);
    R(g, '#0c0b14', x + w / 2 - 7, y + h / 2 - 3, 14, 4); R(g, '#19d3c5', x + w / 2 - 5, y + h / 2 - 2, 2, 2); },
  chair(g, p, x, y) { if (p.grey) return false; const c = p.c || '#4b5563'; R(g, 'rgba(0,0,0,.3)', x + 3, y + 11, 11, 4); R(g, P.ink, x + 3, y + 1, 10, 12); R(g, c, x + 4, y + 2, 8, 9); R(g, 'rgba(255,255,255,.25)', x + 4, y + 2, 8, 1); R(g, '#9ca3af', x + 7, y + 11, 2, 3); },
  shelf(g, p, x, y, t) { const w = p.w * 16; R(g, P.ink, x, y - 8, w, 22); R(g, '#15132e', x + 1, y - 7, w - 2, 20); for (let r = 0; r < 3; r++) { R(g, 'rgba(255,255,255,.12)', x + 1, y - 2 + r * 6, w - 2, 1); for (let i = 0; i < w / 5 - 1; i++) if (hash(i, r, p.x) > .4) R(g, ['#19d3c5', '#6b4dff', '#ffd60a', '#f472b6'][(i + r) % 4], x + 3 + i * 5, y - 6 + r * 6, 3, 3); } },
  plant(g, p, x, y) { if (p.grey) return false; R(g, 'rgba(0,0,0,.25)', x + 3, y + 12, 10, 3); R(g, P.ink, x + 3, y + 6, 10, 9); R(g, '#e8e4f6', x + 4, y + 7, 8, 7); g.fillStyle = '#2f9e6e'; g.beginPath(); g.arc(x + 8, y + 2, 6, 0, 7); g.fill(); R(g, '#5fd08a', x + 5, y - 2, 3, 3); R(g, '#5fd08a', x + 9, y, 3, 3); },
  desk(g, p, x, y) { const w = p.w * 16; R(g, 'rgba(0,0,0,.3)', x + 1, y + 12, w - 2, 4); R(g, P.ink, x, y, w, 12); R(g, '#f1ece0', x + 1, y + 1, w - 2, 8); R(g, '#19d3c5', x + 1, y + 9, w - 2, 1); R(g, '#0c0b14', x + 4, y - 8, 12, 9); R(g, '#3b82f6', x + 5, y - 7, 10, 6); },
  workstation(g, p, x, y, t) { R(g, 'rgba(0,0,0,.3)', x, y + 13, 32, 3); R(g, P.ink, x, y + 2, 32, 11); R(g, '#f1ece0', x + 1, y + 3, 30, 6); for (let i = 0; i < 2; i++) { R(g, P.ink, x + 2 + i * 15, y - 11, 13, 11); R(g, ((t / 500 | 0) + i) % 2 ? '#0f766e' : '#134e4a', x + 3 + i * 15, y - 10, 11, 8); R(g, '#a3e635', x + 4 + i * 15, y - 8, 6, 1); R(g, '#a3e635', x + 4 + i * 15, y - 5, 8, 1); } },
  sofa(g, p, x, y) { const w = p.w * 16; R(g, 'rgba(0,0,0,.3)', x, y + 12, w, 4); R(g, P.ink, x, y, w, 13); R(g, '#3b2f7a', x + 1, y + 1, w - 2, 11); R(g, '#5a48b0', x + 2, y + 5, w - 4, 5); R(g, '#ffd60a', x + 4, y + 3, 6, 3); R(g, '#19d3c5', x + w - 10, y + 3, 6, 3); },
  whiteboard(g, p, x, y, t) { const w = p.w * 16; R(g, P.ink, x, y, w, 24); R(g, '#0f1430', x + 1, y + 1, w - 2, 21); R(g, 'rgba(147,197,253,.35)', x + 1, y + 1, w - 2, 1); if (p.draw) p.draw(g, x, y, t); else { R(g, '#93c5fd', x + 6, y + 6, w * .4, 1); R(g, '#93c5fd', x + 6, y + 10, w * .6, 1); R(g, '#f9a8d4', x + 6, y + 14, w * .3, 1); } },
  tv(g, p, x, y, t) { const w = p.w * 16; R(g, P.ink, x - 2, y - 6, w + 4, 22); R(g, '#0b0a1a', x - 1, y - 5, w + 2, 20); const k = (t / 600 | 0) % 3; R(g, ['#2b1a62', '#0f3a3c', '#4a1240'][k], x, y - 4, w, 18); R(g, '#ffd60a', x + 3, y + 8, w - 6, 1); R(g, '#19d3c5', x + w / 2 - 3, y - 1, 6, 6); R(g, P.ink, x + w / 2 - 4, y + 16, 8, 3); },
  bigscreen(g, p, x, y, t) { const w = p.w * 16; R(g, P.ink, x, y, w, 26); R(g, '#0b1022', x + 1, y + 1, w - 2, 23); R(g, '#19d3c5', x + 1, y + 23, w - 2, 1); for (let i = 0; i < 4; i++) { R(g, '#1d2c55', x + 6 + i * (w - 12) / 4, y + 5, (w - 12) / 4 - 3, 12); R(g, ['#fbcfe8', '#93c5fd', '#fde68a', '#c4b5fd'][i], x + 9 + i * (w - 12) / 4, y + 8, 4, 4); } if (p.label) { g.fillStyle = '#e9fffd'; } },
};

// ---------------- portraits for HTML panels (small canvases) ----------------
export function avatarCanvas(look) { const c = document.createElement('canvas'); c.width = 18; c.height = 26; const s = person(look, 0); c.getContext('2d').drawImage(s, (18 - s.width) >> 1, 0); return c; }
