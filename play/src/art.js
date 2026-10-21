// Placeholder art, drawn in code. Swap for generated sprite sheets later (Prompt 2 of the pack).
import { T } from './core.js';

export const P = {
  void: '#0a0a1f', void2: '#12122e', void3: '#1a1840', ink: '#06041c',
  grape: '#a855f7', grapeD: '#6d28d9', grapeS: '#3b0764', cyan: '#22d3ee', cyanD: '#0e7490',
  pink: '#f472b6', pinkD: '#be185d', amber: '#fbbf24', amberD: '#b45309', ok: '#4ade80',
  white: '#edebf9', mist: '#a9a4d0', steel: '#94a3b8', steelD: '#475569',
};

const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; };
export const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };

// ---------------- 3x5 pixel font ----------------
const GL = {
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
  G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
  M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
  S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
  Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
  4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
  ' ': '000000000000000', '.': '000000000000010', '!': '010010010000010', '?': '110001010000010', '-': '000000111000000', ':': '000010000010000',
  '/': '001001010100100', '&': '010101010101011', "'": '010010000000000', '+': '000010111010000', '#': '101111101111101', '♥': '000101111111010', ',': '000000000010100',
};
export function text(g, s, x, y, col, sc = 1) {
  s = String(s).toUpperCase(); g.fillStyle = col;
  for (let i = 0; i < s.length; i++) { const gl = GL[s[i]] || GL['?']; for (let j = 0; j < 15; j++) if (gl[j] === '1') g.fillRect(x + (i * 4 + j % 3) * sc, y + ((j / 3) | 0) * sc, sc, sc); }
}
export const textW = (s, sc = 1) => (String(s).length * 4 - 1) * sc;
export function textC(g, s, cx, y, col, sc = 1, shadow) { const x = Math.round(cx - textW(s, sc) / 2); if (shadow) text(g, s, x + sc, y + sc, shadow, sc); text(g, s, x, y, col, sc); }

// ---------------- sprite builder with automatic 1px outline ----------------
function sprite(w, h, paint, outline = P.ink) {
  const px = new Array(w * h).fill(null);
  const set = (x, y, c) => { x |= 0; y |= 0; if (x >= 0 && y >= 0 && x < w && y < h) px[y * w + x] = c; };
  const rect = (x, y, ww, hh, c) => { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) set(x + i, y + j, c); };
  paint({ set, rect });
  const [c, g] = mk(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const v = px[y * w + x];
    if (v) { if (v !== 'clear') { g.fillStyle = v; g.fillRect(x, y, 1, 1); } }
    else if (outline) {
      const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < w && yy < h && px[yy * w + xx] && px[yy * w + xx] !== 'clear';
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) { g.fillStyle = outline; g.fillRect(x, y, 1, 1); }
    }
  }
  return c;
}
function mirror(src) { const [c, g] = mk(src.width, src.height); g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0); return c; }

// ---------------- people ----------------
export const LOOKS = {
  nixy: { skin: '#f8b78d', hair: '#2f80ed', hairD: '#1d4fb8', hairL: '#6cb6ff', style: 'bob', top: '#edebf9', shade: '#b1b5e5', sleeve: '#334364', legs: '#22264a', shoes: '#06041c', visor: 1, pod: 1, gem: 1, mouth: '#c2410c' },
  yasin: { skin: '#7b4a2d', skinL: '#9a6343', style: 'bald', beard: '#141010', glasses: 1, top: '#8a6648', shade: '#6e4f36', sleeve: '#8a6648', legs: '#2b2b38', shoes: '#1b1b1b', lanyard: 1 },
  bob: { skin: '#e0ac69', hair: '#7a4b2a', hairD: '#5a361d', style: 'short', top: '#475569', shade: '#334155', sleeve: '#475569', legs: '#334155', shoes: '#1f2937', vest: 1 },
  bill: { skin: '#c68642', hair: '#1f1f1f', hairD: '#0f0f0f', style: 'curly', top: '#f472b6', shade: '#be185d', sleeve: '#f472b6', legs: '#1e293b', shoes: '#111827', headset: 1, clip: 1 },
  coach: { skin: '#c68863', hair: '#1f1a17', hairD: '#0f0c0b', style: 'short', top: '#3b82f6', shade: '#1d4ed8', sleeve: '#3b82f6', legs: '#1e293b', shoes: '#0f172a', glasses: 1, lanyard: 1 },
  teacher: { skin: '#f3d0b5', hair: '#a3a3a3', hairD: '#737373', style: 'bun', top: '#fb923c', shade: '#c2410c', sleeve: '#fb923c', legs: '#44403c', shoes: '#292524', glasses: 1 },
  v0: { skin: '#f1c27d', hair: '#3b2416', hairD: '#24150c', style: 'short', top: '#3b82f6', shade: '#1e40af', sleeve: '#3b82f6', legs: '#1f2937', shoes: '#111827' },
  v1: { skin: '#e8b48a', hair: '#111827', hairD: '#000', style: 'long', top: '#fbbf24', shade: '#b45309', sleeve: '#fbbf24', legs: '#312e81', shoes: '#1e1b4b' },
  v2: { skin: '#8d5524', hair: '#f5d76e', hairD: '#c9a227', style: 'short', top: '#f472b6', shade: '#be185d', sleeve: '#f472b6', legs: '#0f172a', shoes: '#020617' },
  v3: { skin: '#5c3a21', hair: '#1a1a1a', hairD: '#000', style: 'curly', top: '#22c55e', shade: '#15803d', sleeve: '#22c55e', legs: '#1c1917', shoes: '#0c0a09' },
};

function paintPerson(L, dir, f, sit) {
  return ({ set, rect }) => {
    const o = 1; const R = (x, y, w, h, c) => rect(x + o, y + o, w, h, c); const S = (x, y, c) => set(x + o, y + o, c);
    const side = dir === 1 || dir === 2, back = dir === 3;
    const swing = f === 1 ? -1 : f === 2 ? 1 : 0;
    // legs
    if (sit) { R(5, 19, 6, 2, L.legs); R(5, 21, 2, 1, L.shoes); R(9, 21, 2, 1, L.shoes); }
    else if (!side) {
      const l = f === 1 ? 1 : 0, r = f === 2 ? 1 : 0;
      R(5, 19, 3, 5 - l, L.legs); R(5, 23 - l, 3, 1, L.shoes);
      R(8, 19, 3, 5 - r, L.legs); R(8, 23 - r, 3, 1, L.shoes);
    } else {
      if (f === 0) { R(6, 19, 4, 5, L.legs); R(6, 23, 4, 1, L.shoes); }
      else { R(4, 19, 3, 5, L.legs); R(3, 23, 4, 1, L.shoes); R(9, 19, 3, 4, L.legs); R(9, 22, 3, 1, L.shoes); }
    }
    // body
    const bx = side ? 5 : 4, bw = side ? 6 : 8;
    R(bx, 12, bw, 7, L.top); R(bx, 12, 1, 7, L.shade); R(bx + bw - 1, 12, 1, 7, L.shade);
    if (L.legs && L.top === '#edebf9') R(bx, 17, bw, 2, L.legs); // Nixy's suit bottom
    if (L.vest) { R(bx, 12, bw, 7, '#facc15'); R(bx, 16, bw, 1, '#e5e7eb'); R(bx + 3, 12, 2, 7, L.top); }
    if (L.lanyard && !back) { S(6, 13, '#22d3ee'); S(7, 14, '#22d3ee'); S(8, 14, '#22d3ee'); S(9, 13, '#22d3ee'); R(7, 15, 2, 2, P.white); }
    if (L.gem && !back) { if (side) { S(dir === 1 ? 6 : 9, 14, P.cyan); } else { R(7, 14, 2, 1, P.cyan); S(7, 15, '#3e9ece'); S(8, 15, '#3e9ece'); } }
    // arms
    if (!side) {
      R(3, 13 + swing, 1, 5, L.sleeve); S(3, 18 + swing, L.skin);
      R(12, 13 - swing, 1, 5, L.sleeve); S(12, 18 - swing, L.skin);
      if (L.clip && !back) { R(12, 15 - swing, 3, 4, '#8b5a2b'); R(12, 16 - swing, 2, 2, P.white); }
    } else {
      const ax = 7 + swing * 2; R(ax, 13, 2, 5, L.sleeve); R(ax, 18, 2, 1, L.skin);
    }
    // head
    const hx = side ? 4 : 3, hw = side ? 9 : 10;
    R(hx, 2, hw, 11, L.skin); S(hx, 2, 'clear'); S(hx + hw - 1, 2, 'clear'); S(hx, 12, 'clear'); S(hx + hw - 1, 12, 'clear');
    const st = L.style, H = L.hair, HD = L.hairD || L.hair;
    if (st === 'bald') { if (!side) { S(6, 3, L.skinL); S(7, 3, L.skinL); } else { S(7, 3, L.skinL); } }
    if (back) {
      if (st !== 'bald') { if (st === 'bob' || st === 'long' || st === 'curly') R(2, 1, 12, st === 'long' ? 15 : 12, H); else R(3, 1, 10, 11, H); R(4, 10, 8, 1, HD); }
      if (st === 'bun') R(6, 0, 4, 2, H);
      if (L.pod) { R(12, 6, 2, 4, P.white); R(13, 3, 1, 3, P.white); }
      if (L.headset) R(3, 1, 10, 1, '#111827');
    } else if (!side) {
      if (st === 'short') { R(3, 1, 10, 5, H); R(3, 6, 1, 3, H); R(12, 6, 1, 3, H); S(5, 6, H); S(8, 6, H); S(10, 6, H); R(3, 5, 10, 1, HD); }
      if (st === 'bob') { R(2, 1, 12, 6, H); R(2, 7, 2, 6, H); R(12, 7, 2, 6, H); S(4, 7, H); S(6, 7, H); S(9, 7, H); S(11, 7, H); R(2, 6, 12, 1, HD); S(5, 2, L.hairL); S(6, 2, L.hairL); S(7, 3, L.hairL); S(3, 9, HD); S(12, 10, HD); }
      if (st === 'long') { R(2, 1, 12, 6, H); R(2, 7, 2, 9, H); R(12, 7, 2, 9, H); R(2, 6, 12, 1, HD); }
      if (st === 'curly') { R(2, 0, 12, 6, H); S(2, 0, 'clear'); S(13, 0, 'clear'); R(2, 6, 1, 3, H); R(13, 6, 1, 3, H); S(4, 6, H); S(7, 6, H); S(11, 6, H); S(5, 1, HD); S(9, 2, HD); }
      if (st === 'bun') { R(3, 1, 10, 5, H); R(6, 0, 4, 1, H); R(3, 6, 1, 2, H); R(12, 6, 1, 2, H); R(3, 5, 10, 1, HD); }
      if (L.visor) { R(3, 7, 10, 1, '#7fe8f7'); R(3, 8, 10, 2, '#c9f6ff'); }
      if (L.glasses) { const fr = L.style === 'bald' ? '#d1d5db' : '#1f2937'; for (const gx of [4, 9]) { R(gx, 7, 3, 1, fr); R(gx, 9, 3, 1, fr); S(gx, 8, fr); S(gx + 2, 8, fr); } S(7, 8, fr); S(8, 8, fr); }
      // eyes
      S(5, 8, P.ink); S(10, 8, P.ink); if (!L.glasses) { S(5, 9, P.ink); S(10, 9, P.ink); }
      if (L.beard) { R(3, 10, 10, 3, L.beard); R(4, 13, 8, 1, L.beard); S(7, 11, '#5a2e1e'); S(8, 11, '#5a2e1e'); }
      else { S(4, 10, '#f79aa9'); S(11, 10, '#f79aa9'); if (L.mouth) { S(7, 11, L.mouth); S(8, 11, L.mouth); } }
      if (L.pod) { R(12, 6, 3, 4, P.white); S(13, 7, P.cyan); S(13, 8, P.cyan); R(14, 3, 1, 3, P.white); }
      if (L.headset) { R(3, 1, 10, 1, '#111827'); R(2, 7, 1, 3, '#111827'); S(3, 11, '#111827'); S(4, 11, '#111827'); }
    } else {
      // side (drawn facing left; right is mirrored)
      if (st === 'short') { R(4, 1, 9, 5, H); R(8, 6, 5, 3, H); R(4, 5, 9, 1, HD); }
      if (st === 'bob') { R(4, 1, 10, 6, H); R(8, 7, 6, 6, H); R(3, 3, 2, 4, H); S(6, 2, L.hairL); S(7, 2, L.hairL); }
      if (st === 'long') { R(4, 1, 10, 6, H); R(8, 7, 6, 9, H); }
      if (st === 'curly') { R(3, 0, 11, 6, H); R(9, 6, 5, 4, H); }
      if (st === 'bun') { R(4, 1, 9, 5, H); R(10, 0, 4, 3, H); R(9, 6, 4, 2, H); }
      if (st === 'bald') { }
      if (L.visor) { R(3, 7, 6, 1, '#7fe8f7'); R(3, 8, 6, 2, '#c9f6ff'); }
      if (L.glasses) { const fr = L.style === 'bald' ? '#d1d5db' : '#1f2937'; R(4, 7, 3, 1, fr); R(4, 9, 3, 1, fr); S(4, 8, fr); S(6, 8, fr); R(7, 8, 3, 1, fr); }
      S(5, 8, P.ink); if (!L.glasses) S(5, 9, P.ink);
      if (L.beard) { R(4, 10, 7, 3, L.beard); R(5, 13, 5, 1, L.beard); }
      else { S(6, 10, '#f79aa9'); if (L.mouth) S(4, 11, L.mouth); }
      if (L.pod) { R(9, 6, 3, 4, P.white); S(10, 7, P.cyan); S(10, 8, P.cyan); R(11, 3, 1, 3, P.white); }
      if (L.headset) { R(4, 1, 9, 1, '#111827'); R(9, 6, 2, 3, '#111827'); }
    }
  };
}

const personCache = {};
// Draw a person canvas into a box sized for an 18x26 sprite (scaled by w/18), keeping it centred when the sheet's cells are wider.
export function drawPerson(g, s, x, y, w = 18, h = 26, sy = 0, sh = 26) {
  const k = w / 18, ox = (s.width - 18) / 2; g.drawImage(s, 0, sy, s.width, sh, Math.round(x - ox * k), y, s.width * k, h);
}
// Hand-made sprite sheets (assets/sprites): rows down/right/left/up, 3 frames, 18x26 cells. Code-drawn looks are the fallback.
const sheetImg = {};
export const spritesReady = Promise.all(['hero', 'nixy', 'yasin', 'yasin-sit', 'battle-yasin-wolf', 'battle-charge', 'battle-hero-back', 'battle-nixy-back', 'battle-ghost'].map(n => new Promise(r => {
  const i = new Image(); i.onload = () => { sheetImg[n] = i; r(); }; i.onerror = () => r(); i.src = `assets/sprites/${n}.png`;
}))).then(() => { for (const k in personCache) delete personCache[k]; for (const k in portCache) delete portCache[k]; for (const k in ghostCache) delete ghostCache[k]; });
export const sheet = n => sheetImg[n] || null;
export function person(lookKey, dir, f = 0, sit = false) {
  const k = lookKey + dir + f + (sit ? 's' : '');
  if (personCache[k]) return personCache[k];
  const im = sheetImg[lookKey];
  if (im) {
    const si = sit && sheetImg[lookKey + '-sit'], c = document.createElement('canvas'), g = c.getContext('2d');
    if (si) { c.width = si.width; c.height = si.height; g.drawImage(si, 0, 0); }
    else { const cw = im.width / 3; c.width = cw; c.height = 26; g.drawImage(im, (f % 3) * cw, (dir & 3) * 26, cw, 26, 0, 0, cw, 26); }
    return personCache[k] = c;
  }
  const L = LOOKS[lookKey];
  let c;
  if (dir === 2) c = mirror(person(lookKey, 1, f, sit));
  else c = sprite(18, 26, paintPerson(L, dir, f, sit));
  return personCache[k] = c;
}

// GeekMoth: a fuzzy moth with big round glasses
const mothCache = {};
export function moth(f) {
  if (mothCache[f]) return mothCache[f];
  return mothCache[f] = sprite(24, 22, ({ rect, set }) => {
    const wing = '#c4b5fd', wingD = '#8b5cf6', spot = '#fbbf24';
    if (f === 0) { rect(1, 4, 8, 10, wing); rect(15, 4, 8, 10, wing); rect(3, 7, 3, 3, wingD); rect(18, 7, 3, 3, wingD); set(4, 8, spot); set(19, 8, spot); rect(2, 14, 6, 3, wing); rect(16, 14, 6, 3, wing); }
    else { rect(4, 6, 5, 8, wing); rect(15, 6, 5, 8, wing); rect(5, 8, 2, 2, wingD); rect(17, 8, 2, 2, wingD); rect(5, 14, 4, 2, wing); rect(15, 14, 4, 2, wing); }
    rect(9, 7, 6, 11, '#f5e6c8'); rect(9, 12, 6, 1, '#e7cfa0'); rect(9, 15, 6, 1, '#e7cfa0');
    rect(8, 6, 8, 2, '#fff7e0');
    rect(9, 1, 6, 6, '#f5e6c8');
    set(9, 0, P.ink); set(8, -1, P.ink); set(14, 0, P.ink); set(15, -1, P.ink);
    rect(8, 2, 4, 4, '#1f2937'); rect(12, 2, 4, 4, '#1f2937'); rect(9, 3, 2, 2, '#e0f2fe'); rect(13, 3, 2, 2, '#e0f2fe'); set(10, 4, P.ink); set(14, 4, P.ink);
    rect(10, 6, 4, 1, '#d97706');
  });
}

// ---------------- portraits for the dialogue box (non-Nixy speakers) ----------------
const portCache = {};
// a ghostly resident: the same person, drained to pale ice, legs fading to nothing (cached per frame)
const ghostCache = {};
export function ghostOf(lookKey, dir, f = 0) {
  const k = lookKey + dir + f; if (ghostCache[k]) return ghostCache[k];
  const s = person(lookKey, dir, f), [c, g] = mk(s.width, s.height);
  g.drawImage(s, 0, 0);
  // keep the dark outline, turn everything else to pale ice by brightness
  const d = g.getImageData(0, 0, c.width, c.height), px = d.data;
  for (let i = 0; i < px.length; i += 4) {
    if (!px[i + 3]) continue; const L = px[i] * .3 + px[i + 1] * .59 + px[i + 2] * .11;
    if (L < 46) { px[i] = 18; px[i + 1] = 24; px[i + 2] = 46; continue; }
    const v = Math.min(1, .35 + (L - 46) / 170); px[i] = 112 + 124 * v; px[i + 1] = 132 + 112 * v; px[i + 2] = 176 + 79 * v;
  }
  g.putImageData(d, 0, 0);
  g.globalCompositeOperation = 'destination-out';
  const fade = g.createLinearGradient(0, c.height - 10, 0, c.height); fade.addColorStop(0, 'rgba(0,0,0,0)'); fade.addColorStop(1, 'rgba(0,0,0,1)');
  g.fillStyle = fade; g.fillRect(0, c.height - 10, c.width, 10);
  return ghostCache[k] = c;
}
export function portrait(key) {
  if (portCache[key]) return portCache[key];
  const [c, g] = mk(48, 48);
  if (key === 'ghost' || key === 'past') {
    const bg = g.createLinearGradient(0, 0, 0, 48); bg.addColorStop(0, '#0b0f1e'); bg.addColorStop(1, '#25304d'); g.fillStyle = bg; g.fillRect(0, 0, 48, 48);
    const gi = sheetImg['battle-ghost'];
    if (key === 'past' && gi) g.drawImage(gi, 4, 0, 40, 40, 4, 6, 40, 40);
    else { const s = ghostOf('v1', 0, 0); g.drawImage(s, ((s.width - 16) >> 1), 0, 16, 16, 0, 2, 48, 48); }
    return portCache[key] = c.toDataURL();
  }
  const bg = g.createLinearGradient(0, 0, 0, 48); bg.addColorStop(0, '#1a1840'); bg.addColorStop(1, '#3b0764'); g.fillStyle = bg; g.fillRect(0, 0, 48, 48);
  if (key === 'moth') g.drawImage(moth(0), 0, 0, 24, 18, 0, 6, 48, 36);
  else { const s = person(key, 0, 0); g.drawImage(s, 1, 0, 16, 16, 0, 2, 48, 48); }
  return portCache[key] = c.toDataURL();
}

// ---------------- tiles ----------------
export const TL = { SKY: 0, PATH: 1, LAWN: 2, TALL: 3, WATER: 4, PLAZA: 5, RAIL: 6, FLOOR: 7, WALL: 8, GFLOOR: 9, GWALL: 10, MAT: 11, PROM: 12, ROCK: 13, RUG: 14, DUST: 15, DIRT: 16, WOOD: 17, WOODPATH: 18 };
export const SOLID = new Set([TL.SKY, TL.WATER, TL.RAIL, TL.WALL, TL.GWALL, TL.ROCK]);

export function drawTile(g, t, x, y, tx, ty, time = 0) {
  const h = hash(tx, ty), h2 = hash(tx, ty, 7);
  const f = (c, a, b, w, hh) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, hh); };
  switch (t) {
    case TL.SKY: break; // drawn live (art2.drawSky)
    case TL.PATH: f('#e6d3a3', 0, 0, 16, 16); f('#efdfb4', 1, 1, 7, 7); f('#efdfb4', 9, 1, 6, 7); f('#efdfb4', 1, 9, 4, 6); f('#efdfb4', 6, 9, 9, 6); if (h < .2) f('#d4bd88', (h2 * 12) | 0, (h * 60 | 0) % 12, 2, 1); break;
    case TL.PROM: f('#d8d3ea', 0, 0, 16, 16); f('#e7e3f4', 0, 0, 15, 15); if ((tx + ty) % 2) f('#dedaee', 2, 2, 11, 11); break;
    case TL.PLAZA: { // warm porcelain paving, banded every few tiles, with the odd light inlay
      const alt = (tx + ty) % 2 === 0; f(alt ? '#e6dff0' : '#ddd5ea', 0, 0, 16, 16); f('#cabfe0', 0, 15, 16, 1); f('#cabfe0', 15, 0, 1, 16);
      if (tx % 4 === 0) f('#b8abd4', 0, 0, 1, 16); if (ty % 4 === 0) f('#b8abd4', 0, 0, 16, 1);
      f('rgba(255,255,255,.45)', 1, 1, 5, 1);
      if ((tx * 7 + ty * 3) % 13 === 0) { f('#19d3c5', 7, 7, 2, 2); f('#bff7f2', 7, 7, 1, 1); }
      break;
    }
    case TL.LAWN: f('#7ccf5a', 0, 0, 16, 16); for (let i = 0; i < 5; i++) { const a = hash(tx, ty, i); f(i % 2 ? '#93de6c' : '#63b84a', (a * 15) | 0, (hash(ty, tx, i) * 15) | 0, 1, 2); } if (h < .07) { f(P.pink, 5, 6, 2, 2); f('#fff7c2', 5, 6, 1, 1); } if (h > .95) { f(P.amber, 10, 9, 2, 2); } break;
    case TL.TALL: {
      f('#4fae4a', 0, 0, 16, 16); const sw = Math.sin(time / 400 + tx * .7 + ty) > 0 ? 1 : 0;
      for (let i = 0; i < 4; i++) { const bx = 1 + i * 4; f('#2f8f3e', bx + sw, 3, 2, 5); f('#2f8f3e', bx, 8, 3, 6); f('#8be07a', bx + sw, 3, 1, 2); f('#8be07a', bx + 1, 9, 1, 1); }
      break;
    }
    case TL.WATER: { f('#4fb4f0', 0, 0, 16, 16); const k = ((time / 300 | 0) + tx + ty) % 4; f('#9fdcff', (k * 4) % 14, 4, 4, 1); f('#ffffff', ((k + 2) * 4) % 14, 11, 3, 1); break; }
    case TL.RAIL: f('#c9c3e3', 0, 0, 16, 16); f('#a59fcc', 0, 10, 16, 6); f(P.cyan, 0, 3, 16, 1); f('#8a84b6', 0, 9, 16, 1); for (let i = 0; i < 16; i += 4) f('#8a84b6', i, 3, 1, 7); break;
    case TL.ROCK: f('#9aa5b8', 0, 0, 16, 16); f('#b4bfd0', 1, 1, 14, 6); f('#b4bfd0', 3, 9, 11, 5); f('#7d889b', 0, 15, 16, 1); break;
    case TL.FLOOR: f('#17152f', 0, 0, 16, 16); f('#1c1a3a', 0, 0, 16, 7); f('#22204a', 0, 15, 16, 1); f('#22204a', 15, 0, 1, 16); if ((tx + ty) % 3 === 0) f('rgba(255,255,255,.05)', 2, 2, 10, 1); break;
    case TL.WALL: // interiors: a panoramic window onto the city above, a panelled wall with an LED strip below
      if (ty === 0) {
        f('#0c0b1e', 0, 0, 16, 16); const gy = [[0, '#5b62d8'], [5, '#9a7cf0'], [10, '#ffb08a']]; for (const [yy, c] of gy) f(c, 0, yy + 1, 16, 5);
        const hh = 4 + ((hash(tx, 3) * 8) | 0); f('#3b2f7a', 2, 16 - hh, 5, hh); f('#4a3f8f', 9, 16 - hh + 3, 6, hh - 3); if (hash(tx, 5) > .5) f('#ffd68a', 4, 16 - hh + 2, 1, 1);
        f('rgba(255,255,255,.18)', 1, 1, 6, 1); f('#0c0b1e', 15, 0, 1, 16);
      } else { f('#100e26', 0, 0, 16, 16); f('#17143a', 1, 0, 14, 15); f('rgba(255,255,255,.05)', 2, 1, 1, 13); }
      if (ty === 1) { f('#0a0918', 0, 11, 16, 1); f('#19d3c5', 0, 12, 16, 1); f('#0b0a1c', 0, 13, 16, 3); }
      break;
    case TL.DUST: f('#b8ae8a', 0, 0, 16, 16); for (let i = 0; i < 4; i++) { const a = hash(tx, ty, i); f(i % 2 ? '#a79d7b' : '#c6bd9b', (a * 14) | 0, (hash(ty, tx, i) * 14) | 0, 2, 1); } if (h < .06) { f('#8f9a6b', 4, 8, 1, 3); f('#8f9a6b', 6, 9, 1, 2); } break;
    case TL.DIRT: f('#9c8a66', 0, 0, 16, 16); f('#a8966f', 1, 1, 7, 7); f('#8b7a58', 9, 9, 6, 6); if (h < .25) f('#7c6c4d', (h2 * 12) | 0, (h * 70 | 0) % 12, 3, 1); break;
    case TL.WOOD: f('#1c3a33', 0, 0, 16, 16); for (let i = 0; i < 5; i++) { const a = hash(tx, ty, i + 3); f(i % 2 ? '#26493f' : '#142b26', (a * 14) | 0, (hash(ty, tx, i + 3) * 14) | 0, 2, 2); } if (h < .08) f('#4a6b52', 5, 5, 1, 1); break;
    case TL.WOODPATH: f('#3b382d', 0, 0, 16, 16); f('#4a4638', 1, 1, 6, 6); f('#4a4638', 8, 8, 7, 7); if (h < .3) f('#2a281f', (h2 * 12) | 0, (h * 60 | 0) % 12, 3, 1); if (h2 < .12) f('#7a6a3a', (h * 12) | 0, 6, 2, 1); break;
    case TL.GFLOOR: f('#5b5e66', 0, 0, 16, 16); f('#62656e', 1, 1, 7, 7); f('#585b63', 9, 9, 6, 6); if (h < .15) f('#4b4e55', (h2 * 13) | 0, 4, 3, 2); break;
    case TL.GWALL: f('#484b52', 0, 0, 16, 16); f('#52555d', 0, 0, 16, 11); f('#3a3d43', 0, 13, 16, 3); f('#6b6e76', 0, 12, 16, 1); break;
    case TL.MAT: f('#17152f', 0, 0, 16, 16); f('#2b2566', 1, 3, 14, 10); f('#19d3c5', 6, 6, 4, 1); f('#19d3c5', 7, 7, 2, 2); f('#19d3c5', 1, 3, 14, 1); break;
    case TL.RUG: f('#241f55', 0, 0, 16, 16); if ((tx + ty) % 2) f('#2b2566', 1, 1, 14, 14); f('rgba(255,214,10,.25)', 0, 15, 16, 1); break;
  }
}

// ---------------- props (drawn at their footprint's top-left in world pixels) ----------------
export function drawProp(g, p, x, y, time) {
  const f = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
  const pulse = (Math.sin(time / 500 + (p.x || 0)) + 1) / 2;
  switch (p.kind) {
    case 'pine': {
      f('rgba(0,0,0,.3)', 1, 12, 14, 4); f('#2b1d14', 7, 8, 3, 8);
      f(P.ink, 2, -14, 12, 8); f('#0f2e27', 3, -13, 10, 6); f(P.ink, 0, -8, 16, 8); f('#12362e', 1, -7, 14, 6); f(P.ink, -1, -2, 18, 10); f('#18423a', 0, -1, 16, 8); f('#256052', 3, -6, 3, 2); f('#256052', 9, 1, 3, 2); break;
    }
    case 'deadtree': {
      f('rgba(0,0,0,.2)', 2, 13, 11, 3); f('#5b4b3a', 7, -2, 2, 16); f('#5b4b3a', 4, 1, 3, 2); f('#5b4b3a', 3, -1, 1, 3); f('#5b4b3a', 9, 3, 4, 2); f('#5b4b3a', 12, 0, 1, 3); f('#5b4b3a', 6, -6, 1, 5); f('#3f3326', 8, -2, 1, 16); break;
    }
    case 'crate': { f('rgba(0,0,0,.25)', 1, 12, 14, 4); f(P.ink, 1, 2, 14, 13); f('#8a6a3d', 2, 3, 12, 11); f('#6b4f2b', 2, 8, 12, 1); f('#6b4f2b', 7, 3, 1, 11); break; }
    case 'tree': {
      f('rgba(0,0,0,.25)', 2, 12, 12, 4); f('#3f2a1d', 6, 6, 4, 10); f('#2a1b12', 6, 6, 1, 10);
      const c1 = p.v > .5 ? '#7e22ce' : '#be185d', c2 = p.v > .5 ? '#a855f7' : '#f472b6', c3 = p.v > .5 ? '#d8b4fe' : '#fbcfe8';
      f(P.ink, 0, -11, 16, 16); f(c1, 1, -10, 14, 14); f(c2, 2, -12, 11, 11); f(c2, 0, -7, 3, 6); f(c3, 4, -11, 3, 2); f(c3, 9, -8, 2, 2); f(c1, 3, 0, 10, 3);
      g.fillStyle = P.ink; g.fillRect(x + 1, y - 13, 12, 1); break;
    }
    case 'lamp': {
      f('rgba(0,0,0,.25)', 4, 13, 8, 3); f('#334155', 7, -6, 2, 20); f('#1e293b', 5, 12, 6, 2);
      g.globalAlpha = .25 + .2 * pulse; g.fillStyle = P.cyan; g.beginPath(); g.arc(x + 8, y - 8, 7, 0, 7); g.fill(); g.globalAlpha = 1;
      f(P.cyan, 5, -10, 6, 4); f('#cffafe', 6, -9, 4, 2); break;
    }
    case 'bench': {
      f('rgba(0,0,0,.25)', 1, 11, 30, 4); f('#78350f', 1, 2, 30, 3); f('#92400e', 1, 6, 30, 4); f('#451a03', 1, 10, 30, 1);
      f('#1f2937', 3, 10, 2, 5); f('#1f2937', 27, 10, 2, 5); f(P.amber, 1, 2, 30, 1); break;
    }
    case 'fountain': {
      f('#312e81', 0, 2, 32, 28); f('#4338ca', 2, 4, 28, 24); f('#1e3a8a', 4, 6, 24, 20);
      const k = (time / 200 | 0) % 3; f(P.cyan, 14, 8 - k, 4, 14); f('#cffafe', 15, 6 - k, 2, 4);
      for (let i = 0; i < 6; i++) { const a = time / 600 + i; f('#7dd3fc', 16 + Math.cos(a) * 9 | 0, 16 + Math.sin(a) * 6 | 0, 2, 1); }
      f('#6366f1', 0, 2, 32, 1); break;
    }
    case 'arcade': {
      f('rgba(0,0,0,.3)', 1, 13, 15, 3); f('#1e1b4b', 1, -14, 14, 28); f('#312e81', 2, -13, 12, 26);
      f(P.pink, 2, -13, 12, 3); text(g, 'ARC', x + 3, y - 13, P.ink);
      const scr = ['#0f172a', '#4c1d95'][(time / 400 | 0) % 2]; f(scr, 3, -8, 10, 8); f(P.cyan, 4 + ((time / 120 | 0) % 7), -5, 2, 2); f(P.amber, 8, -3, 2, 1);
      f('#0f172a', 3, 2, 10, 4); f(P.pink, 5, 3, 2, 2); f(P.cyan, 9, 3, 2, 2); break;
    }
    case 'phone': {
      f('rgba(0,0,0,.3)', 1, 13, 15, 3); f(P.pinkD, 1, -16, 14, 30); f(P.pink, 2, -15, 12, 3); text(g, 'TEL', x + 3, y - 15, P.ink);
      f('#fdf2f8', 3, -10, 10, 18); f('#9d174d', 3, -10, 10, 1);
      f('#111827', 5, -6, 6, 5); g.fillStyle = '#e5e7eb'; g.beginPath(); g.arc(x + 8, y - 3.5, 1.5, 0, 7); g.fill();
      if (p.ring) { f(P.amber, 0, -18 + ((time / 80 | 0) % 2), 2, 2); f(P.amber, 14, -18 + ((time / 80 | 0) % 2), 2, 2); } break;
    }
    case 'vault': {
      f('#334155', 0, -8, 32, 24); f('#475569', 2, -6, 28, 20);
      g.fillStyle = '#94a3b8'; g.beginPath(); g.arc(x + 16, y + 4, 10, 0, 7); g.fill(); g.fillStyle = '#64748b'; g.beginPath(); g.arc(x + 16, y + 4, 7, 0, 7); g.fill();
      g.save(); g.translate(x + 16, y + 4); g.rotate(time / 2000); g.fillStyle = '#cbd5e1'; for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillRect(-1, -9, 2, 6); } g.restore();
      f(P.amber, 15, 3, 2, 2); f('#1e293b', 0, -8, 32, 1); break;
    }
    case 'monolith': {
      f('rgba(0,0,0,.35)', 0, 13, 16, 3); f('#0b0a1e', 2, -22, 12, 36); f('#17153a', 3, -21, 10, 34);
      g.globalAlpha = .4 + .5 * pulse; f(P.grape, 4, -16, 8, 8); g.globalAlpha = 1;
      text(g, 'P', x + 7, y - 15, P.cyan); f(P.cyan, 3, -21, 10, 1); f(P.grape, 3, 12, 10, 1);
      if (p.knocks) { for (let i = 0; i < p.knocks; i++) f(P.amber, 4 + i * 3, -25, 2, 2); } break;
    }
    case 'pad': {
      g.fillStyle = '#1e1b4b'; g.beginPath(); g.arc(x + 24, y + 24, 22, 0, 7); g.fill();
      g.strokeStyle = P.cyan; g.globalAlpha = .5 + .5 * pulse; g.lineWidth = 2; g.beginPath(); g.arc(x + 24, y + 24, 18, 0, 7); g.stroke(); g.globalAlpha = 1;
      g.strokeStyle = P.amber; g.lineWidth = 1; g.beginPath(); g.arc(x + 24, y + 24, 10, 0, 7); g.stroke();
      textC(g, 'GO', x + 24, y + 22, P.white); break;
    }
    case 'sign': { f('#1f2937', 7, 4, 2, 12); f('#0f172a', 0, -4, 16, 9); f(p.col || P.cyan, 0, -4, 16, 1); textC(g, p.label || '', x + 8, y - 2, p.col || P.cyan); break; }
    case 'flowers': { for (let i = 0; i < 6; i++) { const a = hash(p.x, p.y, i); f(['#f472b6', '#fbbf24', '#22d3ee'][i % 3], (a * 13) | 0, (hash(p.y, p.x, i) * 13) | 0, 2, 2); } break; }
    case 'holo': { g.globalAlpha = .35 + .3 * pulse; f(P.cyan, 3, -14, 10, 14); g.globalAlpha = 1; f('#1e293b', 2, 0, 12, 3); f(P.cyan, 5, -10, 6, 1); f(P.pink, 5, -7, 4, 1); f(P.amber, 5, -4, 5, 1); break; }
    case 'star': {
      const tw = (Math.sin(time / 180) + 1) / 2; const c = p.found ? P.amber : (tw > .5 ? '#fde68a' : '#c4b5fd');
      f(c, 7, 4, 2, 8); f(c, 4, 7, 8, 2); f(P.white, 7, 7, 2, 2); if (tw > .7) { f(c, 7, 1, 2, 2); f(c, 7, 13, 2, 2); f(c, 1, 7, 2, 2); f(c, 13, 7, 2, 2); } break;
    }
    // ---- interiors ----
    case 'table': { f('rgba(0,0,0,.25)', 2, 4, p.w * 16 - 4, p.h * 16); f(p.grey ? '#6b5d4f' : '#3b2f6b', 0, 0, p.w * 16, p.h * 16 - 4); f(p.grey ? '#857565' : '#4c3d8a', 1, 1, p.w * 16 - 2, p.h * 16 - 7); f(p.grey ? '#4a4038' : '#251f4a', 0, p.h * 16 - 4, p.w * 16, 2); if (p.grey) { f('#3a3a3a', p.w * 8 - 6, p.h * 8 - 3, 12, 4); } else { f(P.cyan, 4, p.h * 8 - 3, p.w * 16 - 8, 1); } break; }
    case 'chair': { const c = p.c || '#4b5563'; f('rgba(0,0,0,.25)', 3, 11, 11, 4); f(c, 3, 2, 10, 8); f('#1f2937', 4, 10, 2, 4); f('#1f2937', 10, 10, 2, 4); f('rgba(255,255,255,.12)', 4, 3, 8, 2); break; }
    case 'screen': { f('#d6d3c4', 0, 0, p.w * 16, 26); f('#bdb9a8', 0, 24, p.w * 16, 2); f('#9a958a', 0, 0, p.w * 16, 2); f('#c7c3b4', 6, 6, p.w * 16 - 12, 14); break; }
    case 'crt': {
      f('rgba(0,0,0,.25)', 0, 14, 18, 3); f('#6b4f35', 0, 4, 18, 12); f('#4a3626', 0, 14, 18, 2);
      f('#8a8a85', 2, -10, 14, 14); f('#2a2a2a', 4, -8, 10, 9);
      if (p.grey) { const fl = (time / 260 | 0) % 7 === 0; for (let i = 0; i < 9; i++) f(fl ? '#555' : '#777', 5 + (i % 3) * 3, -7 + ((i / 3) | 0) * 3, 2, 2); f('#bbb', 8, -4, 2, 2); }
      break;
    }
    case 'poster': { f('#7a7a72', 0, 0, 14, 18); f('#8f8f86', 1, 1, 12, 16); textC(g, 'TEAM', x + 7, y + 4, '#5b5b55'); textC(g, 'WORK', x + 7, y + 10, '#5b5b55'); break; }
    case 'cable': { g.strokeStyle = '#2f2f2f'; g.lineWidth = 1; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x + 8, y + 9, 6 - i, 3 - i * .7, 0, 0, 7); g.stroke(); } break; }
    case 'plant': { f('#7c2d12', 4, 8, 8, 7); f('#9a3412', 4, 8, 8, 2); f(p.grey ? '#556b55' : '#22c55e', 3, -2, 4, 10); f(p.grey ? '#4a5d4a' : '#16a34a', 8, -5, 5, 13); f(p.grey ? '#607560' : '#4ade80', 6, -8, 3, 9); break; }
    case 'bigscreen': {
      f('#0f172a', 0, 0, p.w * 16, 28); f('#1e293b', 1, 1, p.w * 16 - 2, 26);
      f(P.cyan, 0, 27, p.w * 16, 1); textC(g, p.label || '', x + p.w * 8, y + 11, P.cyan); if (p.blink && (time / 500 | 0) % 2) textC(g, 'CLICK ME', x + p.w * 8, y + 18, P.amber); break;
    }
    case 'tv': {
      f('rgba(0,0,0,.25)', 0, 14, 28, 3); f('#5b21b6', 0, 4, 28, 12); f('#3b0764', 0, 14, 28, 2);
      f('#d4d4d8', 2, -14, 24, 18); f('#18181b', 4, -12, 17, 14); f('#71717a', 22, -10, 3, 3); f('#3f3f46', 22, -4, 3, 4);
      const n = (time / 70 | 0); for (let i = 0; i < 12; i++) f(['#3f3f46', '#52525b', '#a1a1aa'][(n + i * 7) % 3], 5 + (i % 4) * 4, -11 + ((i / 4) | 0) * 4, 4, 4);
      if (p.blink && (time / 500 | 0) % 2) f(P.amber, 9, -21, 8, 5); break;
    }
    case 'sofa': { f('rgba(0,0,0,.25)', 0, 12, p.w * 16, 4); f('#be185d', 0, 0, p.w * 16, 12); f('#f472b6', 2, 2, p.w * 16 - 4, 6); f('#9d174d', 0, 10, p.w * 16, 2); break; }
    case 'whiteboard': { f('#e2e8f0', 0, 0, p.w * 16, 22); f('#94a3b8', 0, 20, p.w * 16, 2); if (p.draw) p.draw(g, x, y, time); break; }
    case 'chalkboard': { f('#78350f', 0, 0, p.w * 16, 24); f('#14532d', 2, 2, p.w * 16 - 4, 19); if (p.draw) p.draw(g, x, y, time); break; }
    case 'desk': { f('rgba(0,0,0,.25)', 1, 12, p.w * 16 - 2, 4); f('#92400e', 0, 0, p.w * 16, 12); f('#b45309', 1, 1, p.w * 16 - 2, 4); f('#78350f', 2, 12, 2, 4); f('#78350f', p.w * 16 - 4, 12, 2, 4); break; }
    case 'pupildesk': { f('#a16207', 1, 2, 14, 7); f('#ca8a04', 2, 3, 12, 2); f('#713f12', 2, 9, 2, 5); f('#713f12', 12, 9, 2, 5); break; }
    case 'workstation': { f('#0f172a', 0, 2, 32, 12); f('#1e293b', 2, -10, 12, 10); f(P.ok, 3, -9, 10, 8); f('#1e293b', 18, -10, 12, 10); f(P.cyan, 19, -9, 10, 8); f(P.ink, 4 + ((time / 200 | 0) % 8), -6, 1, 1); break; }
    case 'shelf': { f('#3b0764', 0, -8, p.w * 16, 22); for (let i = 0; i < p.w * 4; i++) f(['#22d3ee', '#f472b6', '#fbbf24', '#a3e635'][i % 4], 2 + i * 4, -6 + (i % 2), 2, 6); f('#1e1b4b', 0, -1, p.w * 16, 2); for (let i = 0; i < p.w * 4; i++) f(['#f472b6', '#a3e635', '#22d3ee'][i % 3], 2 + i * 4, 2, 3, 5); break; }
    case 'olddoor': { f('#3a3d43', 0, 0, 16, 16); f('#5e6167', 2, 1, 12, 15); f('#8a8d93', 11, 8, 2, 2); break; }
    case 'light': { const on = p.flicker ? ((time / 90 | 0) % 23 !== 0 && (time / 90 | 0) % 31 !== 0) : true; f(on ? '#e5e7eb' : '#6b7280', 0, 0, p.w * 16, 3); f('#9ca3af', 0, 3, p.w * 16, 1); break; }
  }
}

// ---------------- building facades ----------------
const BSTYLE = {
  rooms: { wall: '#16325c', wall2: '#1e4a80', trim: P.cyan, sign: 'ROOMS', win: '#67e8f9' },
  vf: { wall: '#3b0764', wall2: '#581c87', trim: P.amber, sign: 'VIRTUAL FOREGROUND', win: '#f0abfc' },
  si: { wall: '#134e4a', wall2: '#115e59', trim: '#a3e635', sign: 'SI ACADEMY', win: '#bef264' },
  school: { wall: '#7c2d12', wall2: '#9a3412', trim: '#fb923c', sign: 'SCHOOLHOUSE', win: '#fde68a' },
  arcade: { wall: '#7a1b4b', wall2: '#a21d62', trim: '#fde047', sign: 'THE ARCADE', win: '#fbcfe8' },
  training: { wall: '#17306e', wall2: '#1e46a8', trim: '#f9a8d4', sign: 'TRAINING STUDIO', win: '#bfdbfe' },
  old: { wall: '#4b4e55', wall2: '#5b5e66', trim: '#8a8d93', sign: 'OLD OFFICE', win: '#9ca3af' },
};
export function drawBuilding(g, b, x, y, time) {
  const s = BSTYLE[b.style], w = b.w * 16, h = b.h * 16;
  const f = (c, a, bb, ww, hh) => { g.fillStyle = c; g.fillRect(x + a, y + bb, ww, hh); };
  const top = -14; // facades rise above their footprint
  f('rgba(0,0,0,.3)', 3, h - 2, w - 2, 5);
  f(s.wall, 0, top, w, h - top); f(s.wall2, 2, top + 12, w - 4, h - top - 14);
  // roof
  f(P.ink, -2, top - 4, w + 4, 6); f(s.trim, -2, top + 1, w + 4, 1);
  if (b.style === 'si') { g.fillStyle = s.wall; g.beginPath(); g.moveTo(x + w / 2 - 16, y + top - 4); g.lineTo(x + w / 2, y + top - 16); g.lineTo(x + w / 2 + 16, y + top - 4); g.fill(); f(s.trim, w / 2 - 1, top - 14, 2, 2); }
  if (b.style === 'rooms') { for (let i = 0; i < 3; i++) f(P.ink, 8 + i * ((w - 20) / 2), top - 10, 4, 6); f(s.trim, w / 2 - 10, top - 8, 20, 2); }
  if (b.style === 'school') { f(s.wall, w / 2 - 6, top - 18, 12, 14); f(P.ink, w / 2 - 8, top - 20, 16, 3); f(P.amber, w / 2 - 2, top - 12, 4, 4); }
  if (b.style === 'vf' || b.style === 'arcade') { for (let i = 0; i < 10; i++) f(((time / 200 | 0) + i) % 2 ? P.amber : '#7c2d12', 4 + i * ((w - 10) / 9), top + 3, 2, 2); }
  // sign
  f(P.ink, 4, top + 6, w - 8, 9); textC(g, b.label || s.sign, x + w / 2, top + 8 + y, s.trim);
  // windows
  for (let i = 0; i < b.w * 2 - 1; i++) {
    const wx = 5 + i * 8; if (Math.abs(wx + 3 - w / 2) < 9) continue;
    const lit = hash(i, b.w, b.h) > .25 ? s.win : '#1f2937';
    f(P.ink, wx - 1, top + 19, 7, 9); f(lit, wx, top + 20, 5, 7); f('rgba(255,255,255,.35)', wx, top + 20, 2, 2);
    if (h > 40) { f(P.ink, wx - 1, top + 33, 7, 9); f(hash(i, 3, b.w) > .4 ? s.win : '#1f2937', wx, top + 34, 5, 7); }
  }
  // door
  const dx = (b.door[0] - b.x) * 16;
  f(P.ink, dx + 1, h - 18, 14, 18); f(b.style === 'old' ? '#3a3d43' : '#0b0a1e', dx + 2, h - 17, 12, 17);
  if (!b.locked) { g.globalAlpha = .55 + .35 * Math.sin(time / 400); f(s.trim, dx + 3, h - 16, 10, 2); g.globalAlpha = 1; }
  f(s.trim, dx + 1, h - 19, 14, 1);
  // CLASSIFIED tape
  if (b.locked) {
    g.save(); g.beginPath(); g.rect(x, y + top, w, h - top); g.clip();
    for (const [ox, ang] of [[0, .32], [0, -.32]]) {
      g.save(); g.translate(x + w / 2 + ox, y + h / 2 - 6); g.rotate(ang);
      g.fillStyle = '#facc15'; g.fillRect(-w, -4, w * 2, 8); g.fillStyle = P.ink;
      for (let i = -w; i < w; i += 8) g.fillRect(i, -4, 3, 8);
      g.fillStyle = '#facc15'; g.fillRect(-22, -4, 44, 8); text(g, 'CLASSIFIED', -19, -2, P.ink);
      g.restore();
    }
    g.restore();
    f(P.ink, w / 2 - 34, h + 1, 68, 9); textC(g, 'SECRET PROJECT 0' + b.n, x + w / 2, y + h + 3, '#facc15');
  }
}

// extra characters derived from existing looks
LOOKS.clerk = { ...LOOKS.v2, top: '#ec4899', shade: '#be185d', sleeve: '#ec4899' };
LOOKS.npc = { ...LOOKS.v1 };
LOOKS.hero = { ...LOOKS.v0, hair: '#f5b324', hairD: '#d97706', top: '#a855f7', shade: '#7e22ce', sleeve: '#22d3ee' };
