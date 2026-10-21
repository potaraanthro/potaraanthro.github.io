// The HD light layer: drawn at screen resolution over the pixel world, blended with "screen".
// Lights, bloom, particles, drone lights, the hologram, the guide line. Pixel art stays pixel; light stays smooth.
import { T, W, H, clock, canvas as GAME } from './core.js';
import { CITY_STYLE } from './art2.js';

const NIXY = new Image(); NIXY.src = 'assets/nixy.webp';
const rgbCache = {};
function rgb(hex) {
  if (rgbCache[hex]) return rgbCache[hex];
  const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return rgbCache[hex] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; };
function glow(g, x, y, r, hex, a) {
  if (r <= 0 || a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, rgba(hex, a)); gr.addColorStop(.35, rgba(hex, a * .45)); gr.addColorStop(1, rgba(hex, 0));
  g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
}

// ---------------- the hologram above Virtual Foreground ----------------
let holo = null;
function hologram() {
  if (holo || !NIXY.complete || !NIXY.naturalWidth) return holo;
  const c = document.createElement('canvas'); c.width = 260; c.height = 344; const g = c.getContext('2d');
  g.imageSmoothingEnabled = false; g.drawImage(NIXY, 0, 0, c.width, c.height);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(34,211,238,.55)'; g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = 'rgba(0,0,0,.55)';
  for (let y = 0; y < c.height; y += 4) g.fillRect(0, y, c.width, 2);
  return holo = c;
}

// ---------------- particles ----------------
const parts = [];
function particles(g, w, k, cam, t, region, vw, vh) {
  const want = region === 'city' ? 46 : region === 'woods' ? 34 : region === 'inside' ? 18 : 16;
  while (parts.length < want) parts.push({ x: cam.x + Math.random() * vw, y: cam.y + Math.random() * vh, v: Math.random(), ph: Math.random() * 6.28, life: 0 });
  while (parts.length > want) parts.pop();
  for (const p of parts) {
    p.life += 16;
    if (region === 'city') { p.y -= .05 + p.v * .08; p.x += Math.sin(t / 1800 + p.ph) * .05; }
    else if (region === 'woods') { p.x += Math.sin(t / 900 + p.ph) * .18; p.y += Math.cos(t / 1100 + p.ph * 2) * .12; }
    else { p.y += .02; p.x += .03 * Math.sin(t / 2000 + p.ph); }
    if (p.x < cam.x - 10 || p.x > cam.x + vw + 10 || p.y < cam.y - 10 || p.y > cam.y + vh + 10) { p.x = cam.x + Math.random() * vw; p.y = region === 'city' ? cam.y + vh + 4 : cam.y + Math.random() * vh; }
    const sx = (p.x - cam.x) * k, sy = (p.y - cam.y) * k;
    if (region === 'woods') { const a = Math.max(0, Math.sin(t / 500 + p.ph * 3)); glow(g, sx, sy, 6 * k * .5, '#d9f99d', .55 * a); g.fillStyle = rgba('#f7fee7', .9 * a); g.fillRect(sx - 1, sy - 1, 2, 2); }
    else if (region === 'city') { const a = .35 + .35 * Math.sin(t / 700 + p.ph * 5); g.fillStyle = rgba(p.v > .5 ? '#ffd60a' : '#7ff3ea', a); g.beginPath(); g.arc(sx, sy, Math.max(1, k * .35 * (1 + p.v)), 0, 7); g.fill(); }
    else { g.fillStyle = rgba(region === 'inside' ? '#bff7f2' : '#e8dcc0', .18 + .12 * Math.sin(t / 900 + p.ph)); g.fillRect(sx, sy, Math.max(1, k * .4), Math.max(1, k * .4)); }
  }
}

// ---------------- drones: shared positions so the pixel layer and light layer agree ----------------
export function dronePos(i, t) {
  const a = t / (5200 + i * 900) + i * 2.1;
  return { x: (44 + Math.sin(a) * 13 + Math.sin(a * 2.3) * 3) * T, y: (6 + i * 4.5 + Math.cos(a * 1.4) * 2.2) * T, dir: Math.cos(a) };
}
const trails = [[], [], []];

// ---------------- main entry ----------------
export function hdWorld(g, w, k0) {
  const k = k0 * (w.zoom || 1), t = clock.t, cam = w.cam, m = w.map, vw = W / (w.zoom || 1), vh = H / (w.zoom || 1);
  const S = (wx, wy) => [(wx - cam.x) * k, (wy - cam.y) * k];
  const inView = (wx, wy, pad = 60) => wx > cam.x - pad && wx < cam.x + vw + pad && wy > cam.y - pad && wy < cam.y + vh + pad;
  g.save(); g.globalCompositeOperation = 'lighter';
  const pl = w.player, region = !m.sky ? 'inside' : !pl ? 'city' : pl.x < 18 ? 'old' : pl.x < (m.cityX || 27) ? 'woods' : 'city';

  if (m.sky) {
    // the low sun blooms through everything
    const skyH = m.skyRows * T, [sx, sy] = S(238 - cam.x * .06 + cam.x, skyH - 30);
    glow(g, sx, sy, 150 * k * .5, '#ffb48a', .5); glow(g, sx, sy, 46 * k * .5, '#fff1cf', .9);
    // god rays
    g.save(); g.translate(sx, sy); g.rotate(Math.sin(t / 9000) * .05);
    for (let i = 0; i < 7; i++) { const a = 1.55 + i * .26 + Math.sin(t / 7000 + i) * .03, len = 520 * k * .5, wd = .045 + (i % 3) * .02;
      const gr = g.createLinearGradient(0, 0, Math.cos(a) * len, Math.sin(a) * len); gr.addColorStop(0, 'rgba(255,214,170,.14)'); gr.addColorStop(1, 'rgba(255,214,170,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a - wd) * len, Math.sin(a - wd) * len); g.lineTo(Math.cos(a + wd) * len, Math.sin(a + wd) * len); g.fill(); }
    g.restore();
  }

  // props
  for (const p of m.props) {
    const wx = p.x * T, wy = p.y * T; if (!inView(wx, wy)) continue;
    let [x, y] = S(wx, wy); const pw = p.w * T * k, ph = p.h * T * k, u = k; const pulse = .5 + .5 * Math.sin(t / 600 + p.x);
    switch (p.kind) {
      case 'lamp': glow(g, x + 8 * u, y - 15 * u, 26 * u, '#bff7ff', .55); glow(g, x + 8 * u, y + 14 * u, 16 * u, '#7ff3ea', .14); break;
      case 'holo': glow(g, x + 8 * u, y - 6 * u, 18 * u, '#19d3c5', .35 + .2 * pulse); break;
      case 'fountain': glow(g, x + 16 * u, y + 6 * u, 28 * u, '#19d3c5', .3 + .15 * pulse); glow(g, x + 16 * u, y + 1 * u, 10 * u, '#ffd60a', .3); break;
      case 'pad': glow(g, x + 24 * u, y + 26 * u, 36 * u, '#6b4dff', .4 + .25 * pulse); glow(g, x + 24 * u, y + 26 * u, 14 * u, '#ffd60a', .25 + .2 * pulse); break;
      case 'arcade': glow(g, x + 8 * u, y - 2 * u, 16 * u, '#f472b6', .45 + .2 * pulse); break;
      case 'monolith': glow(g, x + 8 * u, y - 12 * u, 16 * u, '#ffd60a', .3 + .15 * pulse); break;
      case 'gate': glow(g, x + 8 * u, y - 26 * u, 12 * u, '#ffd60a', .6); break;
      case 'star': glow(g, x + 8 * u, y + 4 * u, 10 * u, '#ffffff', p.found ? .2 : .55 + .35 * pulse); break;
      case 'phone': glow(g, x + 8 * u, y - 2 * u, 10 * u, '#fde68a', .16); break;
      case 'tv': case 'bigscreen': case 'whiteboard': glow(g, x + pw / 2, y + 8 * u, Math.max(pw, 40 * u) * .7, p.kind === 'tv' ? '#a78bfa' : '#38bdf8', .26 + .08 * pulse); break;
      case 'workstation': case 'desk': glow(g, x + pw / 2, y - 6 * u, 18 * u, '#22d3ee', .22); break;
      case 'shelf': glow(g, x + pw / 2, y, pw * .6, '#6b4dff', .12); break;
    }
  }
  // the threshold: a quiet curtain of light where the woods end and the city begins
  const gate = m.props.find(p => p.kind === 'gate');
  if (gate && inView(gate.x * T, gate.y * T, 120)) {
    const tx = (m.cityX || 27) * T, [ax, ay] = S(tx, 11 * T - 2), [, by] = S(tx, 13 * T + 2);
    const gr = g.createLinearGradient(ax - 10 * k, 0, ax + 10 * k, 0); gr.addColorStop(0, 'rgba(255,214,10,0)'); gr.addColorStop(.5, rgba('#ffd60a', .18 + .08 * Math.sin(t / 500))); gr.addColorStop(1, 'rgba(255,214,10,0)');
    g.fillStyle = gr; g.fillRect(ax - 10 * k, ay, 20 * k, by - ay);
    const [px, py] = S(gate.x * T + 8, gate.y * T - 26); const beam = g.createLinearGradient(0, py, 0, py - 50 * k); beam.addColorStop(0, 'rgba(255,214,10,.35)'); beam.addColorStop(1, 'rgba(255,214,10,0)');
    g.fillStyle = beam; g.fillRect(px - 1.5 * k, py - 50 * k, 3 * k, 50 * k);
  }

  // buildings: roof trims, storefront canopies, door spill, signature effects
  for (const b of m.buildings) {
    const s = CITY_STYLE[b.style]; if (!s) continue;
    const wx = b.x * T, wy = b.y * T; if (!inView(wx, wy, 140)) continue;
    const top = -(b.top || 30), Wd = b.w * T, Hf = b.h * T, ground = Hf - 20;
    const [x, y] = S(wx, wy), u = k;
    // the glass plaza mirrors the storefronts
    if (w.zoom === 1) {
      const sx = wx - cam.x, sw = Wd, base = wy + Hf - cam.y, rh = 26;
      if (base > 0 && base < vh + rh) for (let i = 0; i < 3; i++) {
        const sl = rh / 3, srcY = base - (i + 1) * sl; if (srcY < 0) continue;
        g.globalAlpha = .2 - i * .06; g.save(); g.translate(sx * k, (base + i * sl) * k); g.scale(1, -1);
        g.drawImage(GAME, Math.max(0, sx), srcY, Math.min(sw, W - Math.max(0, sx)), sl, Math.max(0, -sx) * k, -sl * k, Math.min(sw, W - Math.max(0, sx)) * k, sl * k); g.restore();
      }
      g.globalAlpha = 1;
    }
    const line = (yy, a, lw) => { g.strokeStyle = rgba(s.trim, a); g.lineWidth = lw * u * .5; g.beginPath(); g.moveTo(x - 2 * u, y + yy * u); g.lineTo(x + (Wd + 2) * u, y + yy * u); g.stroke(); };
    line(top + .5, .16, 9); line(top + .5, .7, 1.6);
    line(ground - 1.5, .14, 8); line(ground - 1.5, .6, 1.4);
    if (!b.locked) { const dx = (b.door[0] - b.x) * T; glow(g, x + (dx + 8) * u, y + (Hf - 2) * u, 26 * u, s.trim, .35 + .1 * Math.sin(t / 380)); }
    // window warmth
    glow(g, x + Wd * .5 * u, y + (top + (ground - top) * .5) * u, Wd * .55 * u, s.win, .07);
    if (b.style === 'arcade') glow(g, x + Wd / 2 * u, y + (top - 8) * u, 40 * u, '#ff4fb0', .28 + .1 * Math.sin(t / 200));
    if (b.style === 'training') glow(g, x + 17 * u, y + (top - 5) * u, 12 * u, '#ef4444', (t / 700 | 0) % 2 ? .6 : .1);
    if (b.style === 'si') glow(g, x + Wd / 2 * u, y + (top - 6) * u, 30 * u, '#a3e635', .2);
    if (b.style === 'rooms') glow(g, x + 23 * u, y + (ground + 8) * u, 22 * u, '#19d3c5', .3);
    if (b.style === 'vf') {
      const img = hologram(), cx = x + Wd / 2 * u, base = y + (top - 7) * u;
      // the cone of light from the emitter
      const cone = g.createLinearGradient(0, base, 0, base - 60 * u); cone.addColorStop(0, 'rgba(34,211,238,.32)'); cone.addColorStop(1, 'rgba(34,211,238,0)');
      g.fillStyle = cone; g.beginPath(); g.moveTo(cx - 5 * u, base); g.lineTo(cx + 5 * u, base); g.lineTo(cx + 26 * u, base - 58 * u); g.lineTo(cx - 26 * u, base - 58 * u); g.fill();
      if (img) {
        const hh = 42 * u, ww = hh * img.width / img.height, jit = (Math.random() < .03 ? (Math.random() - .5) * 6 : 0);
        g.globalAlpha = .55 + .15 * Math.sin(t / 300) + (Math.random() < .02 ? -.3 : 0);
        g.drawImage(img, cx - ww / 2 + jit, base - hh - 2 * u + Math.sin(t / 900) * 2 * u, ww, hh);
        g.globalAlpha = 1;
      }
      glow(g, cx, base, 18 * u, '#22d3ee', .5);
    }
  }

  // drones over the city: their lights and trails
  if (m.sky) for (let i = 0; i < 3; i++) {
    const d = dronePos(i, t); if (!inView(d.x, d.y)) { trails[i].length = 0; continue; }
    const [x, y] = S(d.x, d.y); const tr = trails[i]; tr.push([d.x, d.y]); if (tr.length > 26) tr.shift();
    g.lineWidth = 1.2 * k * .5; for (let j = 1; j < tr.length; j++) { const [ax, ay] = S(...tr[j - 1]), [bx, by] = S(...tr[j]); g.strokeStyle = rgba(i === 1 ? '#f472b6' : '#22d3ee', j / tr.length * .35); g.beginPath(); g.moveTo(ax, ay); g.lineTo(bx, by); g.stroke(); }
    glow(g, x, y + 3 * k, 9 * k, (t / 400 | 0) % 2 ? '#ef4444' : '#22d3ee', .7);
  }

  // Nixy carries a little light with her
  if (w.nixy && !w.nixy.hidden && !w.greyNixy) { const [x, y] = S(w.nixy.px + 8, w.nixy.py + 4); glow(g, x, y, 14 * k, '#22d3ee', .28); }

  // the guide line: from the visitor to wherever Nixy is sending them
  if (w.guide && w.guide.pts && w.guide.pts.length > 1) {
    const pts = w.guide.pts.map(([gx, gy]) => S(gx * T + 8, gy * T + 10));
    const draw = (lw, a, dash) => { g.setLineDash(dash || []); g.lineDashOffset = -t / 22 * k * .5; g.strokeStyle = rgba(w.guide.color || '#ffd60a', a); g.lineWidth = lw * k * .5; g.lineJoin = 'round'; g.lineCap = 'round';
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; g.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); } g.lineTo(...pts[pts.length - 1]); g.stroke(); };
    draw(7, .12); draw(2.2, .75, [5 * k * .5, 7 * k * .5]);
    g.setLineDash([]);
    const [ex, ey] = pts[pts.length - 1], r = (8 + 4 * Math.sin(t / 250)) * k * .5;
    g.strokeStyle = rgba(w.guide.color || '#ffd60a', .9); g.lineWidth = 1.5 * k * .5; g.beginPath(); g.ellipse(ex, ey, r * 1.6, r * .8, 0, 0, 7); g.stroke();
    glow(g, ex, ey, 24 * k * .5, w.guide.color || '#ffd60a', .45);
  }

  // interiors: LED strip along the back wall, pools of light on the floor
  if (!m.sky && m.accent) {
    const [x0, y0] = S(0, 12.5), [x1] = S(m.w * T, 12.5);
    for (const [lw, a] of [[10, .1], [3, .45]]) { g.strokeStyle = rgba(m.accent, a); g.lineWidth = lw * k * .5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y0); g.stroke(); }
    for (let i = 0; i < 4; i++) { const [lx, ly] = S((3 + i * 4.6) * T, 5.5 * T); glow(g, lx, ly, 46 * k * .5, '#e0f2fe', .07); }
  }

  particles(g, w, k, cam, t, region, vw, vh);
  g.restore();
}
