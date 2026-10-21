// The founder film. One full-frame canvas that sits behind Yasin's portrait and the dialogue box.
// A shared sky carries the arc (night rain, first light, a warm morning); each beat of the speech
// gets one scene with one idea, crossfaded over the sky. Everything is drawn live, so it holds and
// breathes for as long as the visitor takes to read.
//
//   const film = createFilm(hostEl); film.start(); film.scene('arrival'); film.event('yes'); film.destroy();
//   Deterministic use (the preview render): film.scene(name, t); film.frame(t)

const VW = 1600, VH = 900, TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const eOut = k => 1 - Math.pow(1 - clamp(k), 3);
const eInOut = k => { k = clamp(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; };
const mix = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const css = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const hash = n => rng(n * 9973 + 17)();
function keyed(stops, m) { for (let i = 1; i < stops.length; i++) if (m <= stops[i][0]) { const [a, ca] = stops[i - 1], [b, cb] = stops[i]; return mix(ca, cb, (m - a) / (b - a)); } return stops[stops.length - 1][1]; }

// ---------------- palette ----------------
const SKY_TOP = [[0, [7, 10, 21]], [.25, [13, 15, 36]], [.45, [22, 26, 66]], [.65, [29, 44, 100]], [.85, [36, 68, 136]], [1, [44, 84, 156]]];
const SKY_MID = [[0, [18, 24, 40]], [.25, [33, 31, 64]], [.45, [80, 64, 122]], [.65, [114, 104, 166]], [.85, [128, 146, 200]], [1, [146, 168, 216]]];
const SKY_HOR = [[0, [40, 48, 66]], [.25, [80, 64, 98]], [.45, [226, 134, 116]], [.65, [252, 180, 138]], [.85, [255, 206, 158]], [1, [255, 222, 176]]];
const GROUND = [[0, [6, 8, 16]], [.5, [14, 12, 28]], [1, [22, 18, 40]]];
const WARM = [255, 196, 130], GOLD = [251, 191, 36], CREAM = [255, 240, 218], TEAL = [34, 211, 238], VIOLET = [167, 139, 250], PINK = [244, 114, 182], AMBER = [255, 170, 90];

// ---------------- sprites ----------------
const glowCache = new Map();
function glowSprite(c) {
  const k = c.join(); let s = glowCache.get(k); if (s) return s;
  s = document.createElement('canvas'); s.width = s.height = 128; const g = s.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, css(c, 1)); gr.addColorStop(.2, css(c, .55)); gr.addColorStop(.5, css(c, .16)); gr.addColorStop(1, css(c, 0));
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); glowCache.set(k, s); return s;
}
function glow(g, x, y, r, c, a, ry) {
  if (a <= .002 || r <= 0) return;
  const op = g.globalCompositeOperation, ga = g.globalAlpha;
  g.globalCompositeOperation = 'lighter'; g.globalAlpha = ga * Math.min(1, a);
  g.drawImage(glowSprite(c), x - r, y - (ry || r), r * 2, (ry || r) * 2);
  g.globalCompositeOperation = op; g.globalAlpha = ga;
}
function cloudSprite(seed, tint) {
  const c = document.createElement('canvas'); c.width = 640; c.height = 200; const g = c.getContext('2d'); const r = rng(seed);
  for (let i = 0; i < 26; i++) {
    const x = 90 + r() * 460, y = 80 + r() * 60 - Math.abs(x - 320) * .08, rad = 40 + r() * 70 * (1 - Math.abs(x - 320) / 400);
    const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, css(tint, .5)); gr.addColorStop(1, css(tint, 0)); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  return c;
}

// a smooth curve through points (Catmull-Rom as cubic Béziers)
function curve(p, pts, move = true) {
  if (move) p.moveTo(pts[0][0], pts[0][1]); else p.lineTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[i], c = pts[i + 1], d = pts[Math.min(pts.length - 1, i + 2)];
    p.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]);
  }
}
const bez = (p0, p1, p2, p3, t) => { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; };

// ---------------- people ----------------
// a standing person, feet at (x, y), height h. o: { walk, arm (0..1 raised), hair: 'bob', fin, lean }
function personPath(x, y, h, o = {}) {
  const u = h / 100, p = new Path2D(), w = o.walk == null ? 0 : Math.sin(o.walk) * 6 * u, lx = (o.lean || 0) * u;
  p.arc(x + lx, y - 89 * u, 8 * u, 0, TAU);
  p.moveTo(x - 12 * u + lx * .6, y - 71 * u); p.quadraticCurveTo(x - 12 * u + lx * .6, y - 79 * u, x - 5 * u + lx * .6, y - 79 * u); p.lineTo(x + 5 * u + lx * .6, y - 79 * u);
  p.quadraticCurveTo(x + 12 * u + lx * .6, y - 79 * u, x + 12 * u + lx * .6, y - 71 * u); p.lineTo(x + 10 * u, y - 44 * u);
  p.lineTo(x + 7 * u - w, y); p.lineTo(x + 2 * u - w, y); p.lineTo(x, y - 40 * u); p.lineTo(x - 2 * u + w, y); p.lineTo(x - 7 * u + w, y); p.lineTo(x - 10 * u, y - 44 * u); p.closePath();
  if (o.hair === 'bob') { p.moveTo(x + lx + 11.5 * u, y - 90 * u); p.ellipse(x + lx, y - 90 * u, 11.5 * u, 10.5 * u, 0, 0, TAU); p.rect(x + lx - 11.5 * u, y - 91 * u, 23 * u, 9.5 * u); }
  if (o.fin) { p.moveTo(x + lx + 9 * u, y - 91 * u); p.lineTo(x + lx + 17 * u, y - 110 * u); p.lineTo(x + lx + 12 * u, y - 87 * u); p.closePath(); }
  return p;
}
function person(g, x, y, h, fill, o = {}) {
  const u = h / 100, p = personPath(x, y, h, o);
  if (o.rim) { g.save(); g.translate(o.rimDx || 0, o.rimDy ?? -1.6); g.fillStyle = css(o.rim, o.rimA ?? .9); g.fill(p); if (o.arm) arm(g, x, y, h, o.arm, css(o.rim, o.rimA ?? .9)); g.restore(); }
  g.fillStyle = fill; g.fill(p); if (o.arm) arm(g, x, y, h, o.arm, fill);
  if (o.fin) glow(g, x + 10 * u, y - 89 * u, 7 * u, TEAL, .9);
}
function arm(g, x, y, h, k, col) {
  const u = h / 100; g.strokeStyle = col; g.lineWidth = 4.6 * u; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x + 9 * u, y - 75 * u); g.quadraticCurveTo(x + lerp(14, 20, k) * u, y - lerp(60, 92, k) * u, x + lerp(13, 16, k) * u, y - lerp(46, 116, k) * u); g.stroke();
}

// ---------------- branching trees (garden, bench) ----------------
function growTree(seed, x, y, len, depth, spread = .5) {
  const r = rng(seed), segs = [], tips = [];
  (function br(x0, y0, a, l, d, born) {
    const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; segs.push({ x0, y0, x1, y1, d, born });
    if (d >= depth) { tips.push({ x: x1, y: y1, born: born + .1, c: r() }); return; }
    const n = d < 2 ? 2 : 2 + (r() < .3 ? 1 : 0);
    for (let i = 0; i < n; i++) br(x1, y1, a + (i - (n - 1) / 2) * spread * (1.1 + r() * .5) + (r() - .5) * .25, l * (.68 + r() * .14), d + 1, born + 1 / (depth + 2) + r() * .03);
  })(x, y, -Math.PI / 2 + (r() - .5) * .12, len, 0, 0);
  return { segs, tips };
}

// =====================================================================
// SCENES. Each: m (mood 0..1), hy (horizon), sunX, init(r), draw(g, t, E, S). t = seconds into the beat.
// =====================================================================
const SCENES = {};

// ---- 0. Arrival: night rain over a distant Technicity. The lights answer the visitor's yes. ----
SCENES.arrival = {
  m: .03, hy: 600, sunX: 800,
  init(r) {
    const b = []; let x = 330;
    while (x < 1270) {
      const w = 24 + r() * 34, c = x + w / 2, h = 40 + 170 * Math.exp(-(((c - 800) / 250) ** 2)) + r() * 60;
      const wins = []; const cols = Math.max(1, Math.floor((w - 8) / 7)), rows = Math.floor((h - 12) / 9);
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) wins.push({ x: x + 5 + i * 7, y: 600 - h + 8 + j * 9, on: r(), ph: r() * TAU, col: r() < .22 ? [130, 220, 255] : [255, 196, 120] });
      b.push({ x, w, h, wins }); x += w + 2 + r() * 6;
    }
    const tall = b.reduce((a, c) => c.h > a.h ? c : a); tall.spire = 70;
    return { b, tall };
  },
  draw(g, t, E, S) {
    const hy = 600, k = 1 + .05 * eInOut(t / 30);
    g.save(); g.translate(800, hy); g.scale(k, k); g.translate(-800, -hy);
    glow(g, 800, hy - 10, 700, [80, 100, 140], .3, 70);
    const yes = S.yes != null ? t - S.yes : -1, no = S.no != null ? t - S.no : -1;
    for (const bd of S.b) {
      g.fillStyle = 'rgb(13,17,31)'; g.fillRect(bd.x, hy - bd.h, bd.w, bd.h);
      if (bd.spire) { g.beginPath(); g.moveTo(bd.x + bd.w / 2 - 3, hy - bd.h); g.lineTo(bd.x + bd.w / 2, hy - bd.h - bd.spire); g.lineTo(bd.x + bd.w / 2 + 3, hy - bd.h); g.fill(); }
      let lit = 0, colSum = [0, 0, 0];
      for (const w of bd.wins) {
        const wave = yes >= 0 ? clamp((yes - Math.abs(w.x - 800) / 700) * 1.6) : 0;
        const thr = .26 + .34 * wave + (no >= 0 ? .06 * clamp(no) : 0);
        if (w.on > thr) continue;
        const a = (.35 + .25 * Math.sin(t * .7 + w.ph)) * (1 + wave * .6);
        const col = wave > 0 ? mix(w.col, [255, 214, 150], wave * .6) : w.col;
        g.fillStyle = css(col, Math.min(1, a)); g.fillRect(w.x, w.y, 3, 4); lit++; colSum = col;
      }
      // the wet ground carries each lit building down in broken streaks
      if (lit > 2) {
        const a = Math.min(1, lit / 10), rg = g.createLinearGradient(0, hy, 0, hy + 150); rg.addColorStop(0, css(colSum, .06 * a)); rg.addColorStop(1, css(colSum, 0));
        g.fillStyle = rg; g.fillRect(bd.x + bd.w * .32, hy + 2, bd.w * .36, 120);
        for (let y = hy + 6; y < hy + 130; y += 11) { const f = 1 - (y - hy) / 130, wv = Math.sin(y * .35 + t * 2.2 + bd.x) * 4; g.fillStyle = css(colSum, .2 * f * a); g.fillRect(bd.x + bd.w * .3 + wv, y, bd.w * .4 * f, 1.5); }
      }
    }
    const bt = S.tall, blink = Math.sin(t * 2.2) > .55 ? .9 : .12;
    glow(g, bt.x + bt.w / 2, hy - bt.h - bt.spire, 16, PINK, blink);
    if (yes >= 0) glow(g, 800, hy - 80, 520, [255, 190, 120], .22 * eOut(yes / 3), 160);
    g.restore();
    // someone on the near side of the water, under an umbrella, looking at the city
    const fx = 236, fy = 668, fh = 150, u = fh / 100;
    glow(g, fx + 40, fy - 70, 140, [90, 110, 160], .12);
    person(g, fx, fy, fh, 'rgb(5,6,12)', { rim: [120, 140, 190], rimDx: 1.6, rimDy: 0, rimA: .5 });
    g.strokeStyle = 'rgb(5,6,12)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(fx + 9 * u, fy - 60 * u); g.lineTo(fx + 9 * u, fy - 128 * u); g.stroke();
    const ux = fx + 9 * u, uy = fy - 126 * u, ur = 46 * u;
    g.fillStyle = 'rgb(7,8,16)'; g.beginPath(); g.moveTo(ux - ur, uy); for (let i = 0; i <= 6; i++) { const a = Math.PI + i / 6 * Math.PI; g.quadraticCurveTo(ux + Math.cos(a - Math.PI / 12) * ur * 1.02, uy + Math.sin(a - Math.PI / 12) * ur * .62 + 6, ux + Math.cos(a) * ur, uy + Math.sin(a) * ur * .6); } g.lineTo(ux - ur, uy); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(140,160,210,.45)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(ux, uy, ur, ur * .6, 0, Math.PI * 1.08, Math.PI * 1.92); g.stroke();
  },
};

// ---- 1. Clicks: a plain of cursors clicking in cold unison. Three people stand in it, warm and unmoved. ----
SCENES.clicks = {
  m: .1, hy: 300, sunX: 800,
  init() {
    const mk = bright => {
      const c = document.createElement('canvas'); c.width = 56; c.height = 72; const g = c.getContext('2d');
      g.translate(10, 8); g.shadowColor = bright ? 'rgba(170,200,255,.95)' : 'rgba(110,140,230,.6)'; g.shadowBlur = bright ? 12 : 6;
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 44); g.lineTo(11, 34); g.lineTo(19, 52); g.lineTo(26, 49); g.lineTo(18, 32); g.lineTo(32, 32); g.closePath();
      g.fillStyle = bright ? '#ffffff' : '#b8c6e6'; g.fill(); g.shadowBlur = 0; g.lineWidth = 2; g.strokeStyle = 'rgba(10,14,30,.8)'; g.stroke();
      return c;
    };
    const rows = []; for (let z = 7; z >= 1.2; z -= .34) rows.push(z);
    const people = [{ x: 610, z: 2.05, d: 3 }, { x: 930, z: 2.9, d: 3.8 }, { x: 1140, z: 1.72, d: 4.6 }];
    return { cur: mk(false), hot: mk(true), rows, people };
  },
  draw(g, t, E, S) {
    const hy = 300;
    // haze where the plain meets the sky
    const hz = g.createLinearGradient(0, hy - 40, 0, hy + 120); hz.addColorStop(0, 'rgba(60,72,110,0)'); hz.addColorStop(.35, 'rgba(60,72,110,.35)'); hz.addColorStop(1, 'rgba(60,72,110,0)'); g.fillStyle = hz; g.fillRect(0, hy - 40, VW, 160);
    const done = new Set();
    const drawPerson = p => {
      const a = eOut((t - p.d) / 1.6); if (a <= 0) return;
      const fy = hy + 360 / p.z, h = 300 / p.z;
      g.save(); g.globalAlpha = a;
      glow(g, p.x, fy - h * .5, h * 1.1, AMBER, .45); glow(g, p.x, fy, h * .9, AMBER, .35, h * .14);
      person(g, p.x, fy, h * (1 + Math.sin(t * 1.3 + p.x) * .004), 'rgb(18,12,16)', { rim: [255, 190, 120], rimDy: -1.4 });
      g.restore();
    };
    for (const z of S.rows) {
      for (const p of S.people) if (!done.has(p) && p.z > z) { drawPerson(p); done.add(p); }
      const y = hy + 360 / z, s = .95 / z, sp = 92 / z, n = Math.ceil(820 / sp) + 1, off = (Math.round(z * 3) % 2) * sp / 2;
      const rowIn = clamp((t * 3 - (7 - z)) / 1.5); if (rowIn <= 0) continue;
      const fog = Math.pow(1.2 / z, .7);
      for (let c = -n; c <= n; c++) {
        const x = 800 + c * sp + off; if (x < -40 || x > VW + 40) continue;
        let skip = false; for (const p of S.people) if (Math.abs(p.z - z) < .3 && Math.abs(x - p.x) < 70 / z && t > p.d - .4) skip = true; if (skip) continue;
        const ph = t * 1.35 - z * .5, pulse = Math.pow(Math.max(0, Math.sin(ph * Math.PI)), 14);
        const sc = s * (1 - pulse * .16), spr = pulse > .35 ? S.hot : S.cur;
        g.globalAlpha = rowIn * (.22 + .78 * fog) * (.75 + pulse * .25);
        g.drawImage(spr, x - 10 * sc, y - 60 * sc, 56 * sc, 72 * sc);
        if (pulse > .5 && z < 3.2) { g.strokeStyle = `rgba(180,200,255,${(pulse - .5) * .7})`; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y - 52 * sc, (1.4 - pulse) * 26 * s, 0, TAU); g.stroke(); }
      }
      g.globalAlpha = 1;
    }
    for (const p of S.people) if (!done.has(p)) drawPerson(p);
    // two decades of clicks
    const ya = eOut((t - .5) / 1.2) * (1 - .45 * sstep(6, 8, t)), year = 2006 + Math.round(20 * eInOut((t - .7) / 4.5));
    if (ya > 0) { g.font = '500 30px "DM Mono", ui-monospace, monospace'; g.textAlign = 'center'; g.fillStyle = css([196, 208, 238], .55 * ya); g.fillText(String(year), 800, 150); g.textAlign = 'start'; }
  },
};

// ---- 2. Faces: two people facing each other. Thoughts reach across; most fall short, a few land and stay. ----
const PROFILE = [[-170, -560], [-125, -360], [-100, -260], [-82, -175], [-70, -125], [-86, -96], [-68, -62], [-28, -12], [0, 28], [-6, 46], [-44, 60], [-38, 80], [-30, 96], [-48, 108], [-34, 122], [-56, 142], [-48, 176], [-68, 206], [-118, 224], [-150, 252], [-142, 330], [-160, 560]];
SCENES.faces = {
  m: .22, hy: 640, sunX: 800,
  init(r) {
    const head = new Path2D(); head.moveTo(-1200, -600); head.lineTo(-170, -600); curve(head, PROFILE, false); head.lineTo(-160, 600); head.lineTo(-1200, 600); head.closePath();
    const rim = new Path2D(); curve(rim, PROFILE.slice(1, -1));
    const parts = side => Array.from({ length: 150 }, () => ({ rx: 40 + r() * 230, ry: 30 + r() * 150, sp: (.08 + r() * .22) * (r() < .5 ? 1 : -1), ph: r() * TAU, s: .6 + r() * 1.8, c: r() < .5 ? 0 : 1, tw: r() * TAU }));
    return { head, rim, L: parts(), R: parts() };
  },
  draw(g, t, E, S) {
    const slide = 1 - eOut(t / 2.8), sc = .9, LX = 715 - slide * 300, RX = 885 + slide * 300, Y = 365;
    const toW = (side, lx, ly) => side ? [RX - lx * sc, Y + ly * sc] : [LX + lx * sc, Y + ly * sc];
    const heads = [[0, LX, [AMBER, PINK], [255, 186, 120]], [1, RX, [TEAL, VIOLET], [120, 220, 255]]];
    for (const [side, X, cols, rimC] of heads) {
      g.save(); g.translate(X, Y); g.scale(side ? -sc : sc, sc);
      g.fillStyle = 'rgb(5,7,14)'; g.fill(S.head);
      g.save(); g.clip(S.head);
      const cx = -330, cy = -150;
      glow(g, cx, cy, 330, cols[0], .13); glow(g, cx + 60, cy + 40, 220, cols[1], .1);
      for (const p of side ? S.R : S.L) {
        const a = p.ph + t * p.sp, x = cx + Math.cos(a) * p.rx, y = cy + Math.sin(a) * p.ry;
        glow(g, x, y, p.s * 7, cols[p.c], .55 + .35 * Math.sin(t * 2 + p.tw));
      }
      g.restore();
      g.lineJoin = 'round'; g.strokeStyle = css(rimC, .14); g.lineWidth = 14; g.globalCompositeOperation = 'lighter'; g.stroke(S.rim);
      g.globalCompositeOperation = 'source-over'; g.strokeStyle = css(rimC, .9); g.lineWidth = 2.6; g.stroke(S.rim);
      g.restore();
    }
    // thoughts thrown across the gap
    const START = 3, GAP = .8, FLY = 1.35, ORIG = [[-72, -100], [-34, 100], [-92, -230], [-60, -40]];
    const kMax = Math.floor((t - START) / GAP); if (kMax < 0) return;
    const arcOf = k => {
      const rr = rng(k * 31 + 7), side = rr() < .5 ? 0 : 1, o = ORIG[Math.floor(rr() * 4)], d = ORIG[Math.floor(rr() * 4)];
      const ok = k === 2 || k === 5 || (k > 5 && rr() < .38);
      const s = toW(side, o[0], o[1]); let e = toW(1 - side, d[0], d[1]);
      if (!ok) e = [800 + (side ? 1 : -1) * (30 + rr() * 50), Math.max(s[1], e[1]) + 120 + rr() * 80];
      const lift = 90 + rr() * 110, c1 = [lerp(s[0], 800, .6), Math.min(s[1], e[1]) - lift], c2 = [lerp(e[0], 800, .6), Math.min(s[1], e[1]) - lift * (ok ? 1 : .3)];
      return { side, ok, s, e, c1, c2, col: side ? [140, 225, 255] : [255, 196, 140] };
    };
    // the web of connections that landed
    let n = 0;
    for (let k = kMax; k >= 0 && n < 14; k--) {
      const A = arcOf(k); if (!A.ok || t < START + k * GAP + FLY) continue; n++;
      const age = t - (START + k * GAP + FLY);
      g.strokeStyle = `rgba(255,232,200,${.1 + .14 * Math.exp(-age * .5)})`; g.lineWidth = 1.2; g.beginPath(); g.moveTo(A.s[0], A.s[1]); g.bezierCurveTo(A.c1[0], A.c1[1], A.c2[0], A.c2[1], A.e[0], A.e[1]); g.stroke();
      const m = bez(A.s, A.c1, A.c2, A.e, .5);
      glow(g, m[0], m[1], 16, [255, 236, 200], .55 + .3 * Math.sin(t * 2.4 + k)); glow(g, A.e[0], A.e[1], 60, A.col, .9 * Math.exp(-age * 2.2));
    }
    for (let k = Math.max(0, kMax - 3); k <= kMax; k++) {
      const A = arcOf(k), p = (t - START - k * GAP) / FLY; if (p <= 0 || p > 1.05) continue;
      const a0 = Math.max(0, p - .32), a1 = Math.min(1, p), fade = A.ok ? 1 : 1 - sstep(.55, 1, p);
      g.lineCap = 'round';
      for (let i = 0; i < 18; i++) {
        const u0 = lerp(a0, a1, i / 18), u1 = lerp(a0, a1, (i + 1) / 18), P0 = bez(A.s, A.c1, A.c2, A.e, u0), P1 = bez(A.s, A.c1, A.c2, A.e, u1);
        g.strokeStyle = css(A.col, .85 * fade * (i + 1) / 18); g.lineWidth = 1 + 2.4 * (i / 18); g.beginPath(); g.moveTo(P0[0], P0[1]); g.lineTo(P1[0], P1[1]); g.stroke();
      }
      const H = bez(A.s, A.c1, A.c2, A.e, a1); glow(g, H[0], H[1], 22, A.col, fade);
    }
  },
};

// ---- 3. Dawn: the wake-up call. The horizon cracks open; creativity, ingenuity and fun rise into the light. ----
SCENES.dawn = {
  m: .45, hy: 590, sunX: 800,
  init(r) {
    const gear = new Path2D(), N = 12, R1 = 58, R0 = 46;
    for (let i = 0; i < N * 4; i++) { const a = i / (N * 4) * TAU, rr = (i % 4 === 1 || i % 4 === 2) ? R1 : R0; i ? gear.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : gear.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
    gear.closePath(); gear.moveTo(17, 0); gear.arc(0, 0, 17, 0, TAU, true);
    const motes = Array.from({ length: 46 }, () => ({ x: r() * VW, sp: 10 + r() * 22, ph: r() * 400, s: 1 + r() * 2 }));
    return { gear, motes };
  },
  draw(g, t, E, S) {
    const hy = 590, crack = eOut((t - .3) / 2.8);
    if (crack > 0) {
      const w = 1700 * crack;
      glow(g, 800, hy - 2, w * .6, [255, 200, 140], .8, 26 + crack * 30);
      g.fillStyle = css([255, 238, 205], .9 * crack); g.fillRect(800 - w / 2, hy - 1.5, w, 2.4);
      glow(g, 800, hy, 260, [255, 226, 180], .5 * crack, 60);
    }
    for (const m of S.motes) { const y = hy - ((t * m.sp + m.ph) % 420); glow(g, m.x + Math.sin(t * .5 + m.ph) * 14, y, m.s * 5, [255, 214, 160], .5 * crack * (1 - (hy - y) / 420)); }
    const X = [470, 800, 1130], Y = [262, 196, 268];
    for (let i = 0; i < 3; i++) {
      const T = 3.2 + i * 1.1, k = eOut((t - T) / 3.4); if (k <= 0) continue;
      const cx = X[i], cy = lerp(hy + 60, Y[i], k) + Math.sin(t * .9 + i * 2) * 8 * k;
      glow(g, cx, cy, 150, [255, 190, 140], .26 * k);
      g.save(); g.globalAlpha = clamp(k * 1.4);
      if (i === 0) { // creativity: a ribbon of paint drawing itself
        const rv = eOut((t - T - .4) / 3), steps = 70;
        for (let j = 0; j < steps * rv; j++) {
          const s = j / steps, px = cx - 150 + 300 * s, py = cy + 46 * Math.sin(TAU * s * 1.1 + t * .6) * (.45 + .55 * s), w = 3 + 15 * Math.pow(Math.sin(Math.PI * s), .8);
          g.fillStyle = css(mix(PINK, GOLD, s), .9); g.beginPath(); g.arc(px, py, w, 0, TAU); g.fill();
        }
        const s = rv, hx = cx - 150 + 300 * s, hyy = cy + 46 * Math.sin(TAU * s * 1.1 + t * .6) * (.45 + .55 * s); glow(g, hx, hyy, 34, CREAM, .9 * k);
      } else if (i === 1) { // ingenuity: a gear turning
        g.save(); g.translate(cx, cy); g.rotate(t * .28); g.fillStyle = 'rgb(28,24,48)'; g.fill(S.gear, 'evenodd');
        g.strokeStyle = css([255, 210, 130], .95); g.lineWidth = 2.6; g.stroke(S.gear); g.restore();
        glow(g, cx, cy, 30, [255, 224, 170], .7);
      } else { // fun: a paper plane looping
        const a = t * .9, px = cx + 80 * Math.sin(a), py = cy + 32 * Math.sin(2 * a), dx = 80 * Math.cos(a), dy = 64 * Math.cos(2 * a);
        for (let j = 1; j < 14; j++) { const b = a - j * .09; g.fillStyle = css(CREAM, .5 * (1 - j / 14)); g.fillRect(cx + 80 * Math.sin(b) - 1.5, cy + 32 * Math.sin(2 * b) - 1.5, 3, 3); }
        g.save(); g.translate(px, py); g.rotate(Math.atan2(dy, dx));
        g.fillStyle = '#fff8ec'; g.beginPath(); g.moveTo(34, 0); g.lineTo(-26, -18); g.lineTo(-12, -1); g.closePath(); g.fill();
        g.fillStyle = '#d9d3e6'; g.beginPath(); g.moveTo(34, 0); g.lineTo(-12, -1); g.lineTo(-22, 13); g.closePath(); g.fill(); g.restore();
      }
      g.restore();
    }
  },
};

// ---- 4. Fridays: the report stack peels away, each page becomes a bird, and the birds build something new. ----
SCENES.fridays = {
  m: .58, hy: 600, sunX: 1110,
  init(r) {
    const C = [1110, 642], RAD = [0, 95, 165, 232, 292], SEG = 8, ring = RAD.map(R => Array.from({ length: SEG + 1 }, (_, j) => { const a = Math.PI + j / SEG * Math.PI; return [C[0] + Math.cos(a) * R, C[1] + Math.sin(a) * R]; }));
    const tris = [];
    for (let j = 0; j < SEG; j++) tris.push([C, ring[1][j], ring[1][j + 1]]);
    for (let i = 1; i < RAD.length - 1; i++) for (let j = 0; j < SEG; j++) { tris.push([ring[i][j], ring[i + 1][j], ring[i + 1][j + 1]]); tris.push([ring[i][j], ring[i + 1][j + 1], ring[i][j + 1]]); }
    const PAL = [[255, 196, 140], [250, 160, 170], [140, 220, 230], [255, 226, 170], [190, 170, 250]];
    tris.forEach((tr, i) => { tr.c = [(tr[0][0] + tr[1][0] + tr[2][0]) / 3, (tr[0][1] + tr[1][1] + tr[2][1]) / 3]; tr.col = PAL[Math.floor(r() * PAL.length)]; });
    tris.sort((a, b) => b.c[1] - a.c[1] || a.c[0] - b.c[0]);
    const sheets = tris.map((tr, k) => ({ dx: (r() - .5) * 8, tilt: (r() - .5) * .025, y: 640 - (tris.length - k) * 4.6 }));
    return { tris, sheets, C };
  },
  draw(g, t, E, S) {
    const L0 = 1.3, GAP = .3, F = 2.4, N = S.tris.length;
    let filled = 0;
    // the blueprint, then the panels as they land
    g.strokeStyle = 'rgba(210,220,255,.13)'; g.lineWidth = 1;
    for (const tr of S.tris) { g.beginPath(); g.moveTo(tr[0][0], tr[0][1]); g.lineTo(tr[1][0], tr[1][1]); g.lineTo(tr[2][0], tr[2][1]); g.closePath(); g.stroke(); }
    S.tris.forEach((tr, k) => {
      const land = L0 + k * GAP + F; if (t < land) return; filled++;
      const fl = 1 - clamp((t - land) / .7);
      g.beginPath(); g.moveTo(tr[0][0], tr[0][1]); g.lineTo(tr[1][0], tr[1][1]); g.lineTo(tr[2][0], tr[2][1]); g.closePath();
      g.fillStyle = css(mix(tr.col, CREAM, fl * .6), .42 + .3 * fl); g.fill(); g.strokeStyle = css(CREAM, .5); g.lineWidth = 1.4; g.stroke();
      if (fl > 0) glow(g, tr.c[0], tr.c[1], 70, [255, 220, 170], fl * .8);
    });
    const frac = filled / N; glow(g, 1110, 540, 420, [255, 200, 140], .28 * frac, 300);
    // the stack of reports
    const SX = 330;
    for (let k = N - 1; k >= 0; k--) {
      const sh = S.sheets[k]; if (t >= L0 + k * GAP) continue;
      g.save(); g.translate(SX + sh.dx, sh.y); g.rotate(sh.tilt); g.fillStyle = k % 2 ? 'rgb(122,126,138)' : 'rgb(134,138,150)'; g.fillRect(-95, -4.6, 190, 4.6); g.restore();
    }
    let top = 0; while (top < N && t >= L0 + top * GAP) top++;
    if (top < N) { // the top page of the current report, face up
      const sh = S.sheets[top], y = sh.y - 4.6;
      g.save(); g.translate(SX + sh.dx, y); g.fillStyle = 'rgb(176,178,188)'; g.beginPath(); g.moveTo(-95, 0); g.lineTo(95, 0); g.lineTo(80, -26); g.lineTo(-80, -26); g.closePath(); g.fill();
      g.fillStyle = 'rgba(70,74,90,.55)'; for (let i = 0; i < 4; i++) g.fillRect(-58 + i * 3, -21 + i * 5, 110 - i * 14, 1.6); g.restore();
    }
    // a desk calendar that says which day this is
    g.save(); g.translate(205, 600); g.rotate(-.06); g.fillStyle = 'rgb(200,198,206)'; g.fillRect(-30, -30, 60, 62); g.fillStyle = 'rgb(150,80,90)'; g.fillRect(-30, -30, 60, 16);
    g.fillStyle = 'rgb(48,46,60)'; g.font = '600 20px "DM Mono", ui-monospace, monospace'; g.textAlign = 'center'; g.fillText('FRI', 0, 18); g.textAlign = 'start'; g.restore();
    // pages in flight, folding into birds
    for (let k = 0; k < N; k++) {
      const p = (t - L0 - k * GAP) / F; if (p <= 0 || p >= 1) continue;
      const sh = S.sheets[k], tr = S.tris[k], s0 = [SX + sh.dx, sh.y - 6], e = tr.c, c1 = [s0[0] + 140, s0[1] - 280], c2 = [e[0] - 180, e[1] - 240];
      const P = bez(s0, c1, c2, e, eInOut(p)), col = mix([150, 152, 160], [255, 238, 214], sstep(.12, .55, p));
      g.save(); g.translate(P[0], P[1]);
      if (p < .22) { const w = lerp(190, 40, p / .22); g.rotate(-p * 2); g.fillStyle = css(col); g.fillRect(-w / 2, -3, w, 6); }
      else { const f = Math.sin(t * 13 + k) * .7, w = 22; g.fillStyle = css(col); g.beginPath(); g.moveTo(-6, 0); g.lineTo(-w, -w * f); g.lineTo(4, -2); g.closePath(); g.fill(); g.beginPath(); g.moveTo(6, 0); g.lineTo(w, -w * f); g.lineTo(-4, -2); g.closePath(); g.fill(); g.fillRect(-3, -2, 6, 4); }
      g.restore(); if (p > .35) glow(g, P[0], P[1], 26, [255, 214, 160], .5 * sstep(.35, .7, p));
    }
    // the small team
    const ta = eOut((t - 3.5) / 2);
    if (ta > 0) {
      g.save(); g.globalAlpha = ta;
      [[880, 100], [930, 92, .9 * eOut((t - 5) / 1.5)], [1300, 104], [1350, 88]].forEach(([x, h, a]) => person(g, x, 652, h, 'rgb(18,14,30)', { rim: [255, 206, 150], rimDx: x < 1110 ? 1.4 : -1.4, rimDy: -1, arm: a }));
      g.restore();
    }
  },
};

// ---- 5. Potara: two rings meet and fuse; people gather beneath the light. ----
SCENES.potara = {
  m: .7, hy: 610, sunX: 1270, sunH: .8,
  init(r) {
    const people = Array.from({ length: 16 }, (_, i) => { const left = i % 2 === 0, x = left ? 520 + (i / 2) * 34 : 1080 - ((i - 1) / 2) * 34; return { x: x + (r() - .5) * 10, from: left ? -60 : VW + 60, h: 64 + r() * 26, y: 646 + r() * 10, d: 5.2 + r() * 2.4, sp: 150 + r() * 50, hair: r() < .3 ? 'bob' : null }; });
    const motes = Array.from({ length: 30 }, () => ({ a: r() * TAU, sp: .15 + r() * .25, rr: 122 + (r() - .5) * 40, s: 1 + r() * 1.6 }));
    return { people, motes };
  },
  draw(g, t, E, S) {
    const F = 4.15, CY = 300 + Math.sin(t * .7) * 4, R = 112;
    const ring = (x, y, rad, col, a, lw = 6) => {
      glow(g, x, y, rad * 1.9, col, .22 * a);
      g.globalCompositeOperation = 'lighter'; g.strokeStyle = css(col, .18 * a); g.lineWidth = lw * 4; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke();
      g.strokeStyle = css(mix(col, [255, 255, 255], .35), .95 * a); g.lineWidth = lw; g.beginPath(); g.arc(x, y, rad, 0, TAU); g.stroke(); g.globalCompositeOperation = 'source-over';
    };
    if (t < F) {
      const k = eInOut((t - .4) / (F - .4)), a = eOut(t / 1.2);
      ring(lerp(430, 800, k), CY, R, TEAL, a); ring(lerp(1170, 800, k), CY, R, VIOLET, a);
    } else {
      const f = t - F;
      if (f < 1.4) { g.strokeStyle = css(CREAM, .7 * (1 - f / 1.4)); g.lineWidth = 3; g.beginPath(); g.arc(800, CY, 120 + f * 640, 0, TAU); g.stroke(); glow(g, 800, CY, 200 + f * 600, [255, 236, 210], .9 * (1 - f / 1.4)); }
      const pulse = .85 + .15 * Math.sin(t * 1.6);
      glow(g, 800, CY, 110, [255, 214, 150], .16 * pulse);
      ring(800, CY, 122, GOLD, eOut(f / .6) * pulse, 7);
      for (const m of S.motes) { const a = m.a + t * m.sp; glow(g, 800 + Math.cos(a) * m.rr, CY + Math.sin(a) * m.rr, m.s * 6, [255, 226, 170], .7 * eOut(f / 1.5)); }
      const wa = eOut((f - .7) / 1.6);
      if (wa > 0) {
        glow(g, 800, 500, 300, GOLD, .12 * wa, 70);
        g.save(); g.font = '800 64px Syne, "Instrument Sans", sans-serif'; g.textAlign = 'center'; try { g.letterSpacing = '22px'; } catch (e) { }
        g.fillStyle = css(CREAM, wa); g.shadowColor = 'rgba(20,10,40,.35)'; g.shadowBlur = 18; g.fillText('POTARA', 811, 522 + (1 - wa) * 14); g.restore();
      }
    }
    for (const p of S.people) {
      const dist = Math.abs(p.x - p.from), tt = (t - p.d) * p.sp; if (tt <= 0) continue;
      const k = clamp(tt / dist), x = lerp(p.from, p.x, k), walking = k < 1;
      person(g, x, p.y, p.h, 'rgb(16,12,30)', { walk: walking ? tt * .07 : null, hair: p.hair, rim: [255, 214, 160], rimDy: -1.6, rimA: .85 });
    }
  },
};

// ---- 6. Technicity: the city rises; its reflection shows what it means: tools woven through people. ----
SCENES.technicity = {
  m: .78, hy: 470, sunX: 980,
  init(r) {
    const b = []; let x = 70;
    while (x < 1520) {
      const w = 30 + r() * 34, c = x + w / 2, h = 50 + 240 * Math.exp(-(((c - 800) / 400) ** 2)) + r() * 90;
      const kind = r(), shape = kind < .38 ? 'tier' : kind < .52 ? 'spire' : kind < .66 ? 'crown' : kind < .74 ? 'dome' : 'flat';
      b.push({ x, w, h, shape, d: .2 + Math.abs(c - 800) / 800 * 1.6 + r() * .3, acc: r() < .22 ? [TEAL, PINK, GOLD, VIOLET][Math.floor(r() * 4)] : null, wins: Array.from({ length: 14 }, () => [r(), r(), r() < .5 ? TEAL : AMBER]) });
      x += w + 3 + r() * 7;
    }
    const people = Array.from({ length: 22 }, (_, i) => ({ x: 140 + i * (1320 / 21) + (r() - .5) * 20, ph: r() * TAU }));
    b.forEach((bd, i) => { const cx = bd.x + bd.w / 2; let best = 0; people.forEach((p, j) => { if (Math.abs(p.x - cx) < Math.abs(people[best].x - cx)) best = j; }); bd.to = best; bd.jog = 520 + r() * 60; });
    const glit = Array.from({ length: 70 }, () => ({ y: r(), w: r(), ph: r() * TAU }));
    return { b, people, glit };
  },
  draw(g, t, E, S) {
    const hy = 470, sky = E.hor, rip = (x, y) => x + Math.sin(y * .05 + t * 1.6) * 3 * (y - hy) / 200;
    // water
    const wg = g.createLinearGradient(0, hy, 0, VH); wg.addColorStop(0, css(mix(sky, [40, 60, 110], .55))); wg.addColorStop(.25, css(mix(sky, [16, 24, 52], .82))); wg.addColorStop(1, 'rgb(6,9,22)');
    g.fillStyle = wg; g.fillRect(0, hy, VW, VH - hy);
    for (const gl of S.glit) { const y = hy + 6 + gl.y * 230, f = 1 - (y - hy) / 240, w = (8 + gl.w * 40) * f; g.fillStyle = css([255, 224, 180], .55 * f * (.5 + .5 * Math.sin(t * 3 + gl.ph))); g.fillRect(rip(E.sunX, y) - w / 2 + Math.sin(gl.ph) * 30 * (1 - f), y, w, 2); }
    // the city
    const cg = g.createLinearGradient(0, hy - 420, 0, hy); cg.addColorStop(0, 'rgb(52,48,104)'); cg.addColorStop(1, 'rgb(24,24,58)');
    for (const bd of S.b) {
      const k = eOut((t - bd.d) / 1.3); if (k <= 0) continue; const h = bd.h * k, top = hy - h, cx = bd.x + bd.w / 2, lit = cx < E.sunX ? 1 : -1;
      const p = new Path2D(); p.rect(bd.x, top, bd.w, h);
      if (bd.shape === 'tier') { p.rect(bd.x + bd.w * .18, top - h * .12, bd.w * .64, h * .12 + 1); p.rect(bd.x + bd.w * .36, top - h * .2, bd.w * .28, h * .08 + 1); }
      if (bd.shape === 'spire') { p.moveTo(cx - 4, top); p.lineTo(cx, top - 26 - h * .18); p.lineTo(cx + 4, top); p.closePath(); }
      if (bd.shape === 'crown') { p.moveTo(bd.x, top + 1); p.lineTo(cx, top - bd.w * .55); p.lineTo(bd.x + bd.w, top + 1); p.closePath(); }
      if (bd.shape === 'dome') { p.moveTo(bd.x + bd.w, top + 1); p.arc(cx, top + 1, bd.w / 2, 0, Math.PI, true); }
      g.fillStyle = cg; g.fill(p);
      g.save(); g.clip(p); g.fillStyle = css([255, 204, 160], .55); g.fillRect(lit > 0 ? bd.x + bd.w - 2.5 : bd.x, top - h * .3, 2.5, h * 1.3);
      g.fillStyle = 'rgba(255,255,255,.035)'; for (let fy = top + 14; fy < hy; fy += 14) g.fillRect(bd.x, fy, bd.w, 1); g.restore();
      for (const [wx, wy, c] of bd.wins) if (wy * bd.h < h - 10) { g.fillStyle = css(c, .4); g.fillRect(bd.x + 4 + wx * (bd.w - 10), hy - 8 - wy * (bd.h - 14), 3, 4); }
      if (bd.acc && k > .95) { const ty = bd.shape === 'tier' ? top - h * .2 : bd.shape === 'spire' ? top - 26 - h * .18 : bd.shape === 'crown' ? top - bd.w * .55 : top; glow(g, cx, ty, 30, bd.acc, .85); if (bd.shape === 'flat') { g.fillStyle = css(bd.acc, .9); g.fillRect(bd.x, top, bd.w, 2); } }
    }
    // the reflection: outlines, then traces down to the people they serve
    g.lineWidth = 1.4; g.lineJoin = 'round';
    S.b.forEach((bd, i) => {
      const k = eOut((t - bd.d - .6) / 1.6); if (k <= 0) return;
      const rh = bd.h * .55 * k, y1 = hy + rh, cx = bd.x + bd.w / 2, p = S.people[bd.to];
      g.strokeStyle = css([120, 228, 255], .38 * k); g.beginPath();
      for (let y = hy; y <= y1; y += 8) g.lineTo(rip(bd.x, y), y);
      for (let y = y1; y >= hy; y -= 8) g.lineTo(rip(bd.x + bd.w, y), y);
      g.stroke(); g.beginPath(); g.moveTo(rip(bd.x, y1), y1); g.lineTo(rip(bd.x + bd.w, y1), y1); g.stroke();
      const tk = eOut((t - bd.d - 1.6) / 1.6); if (tk <= 0) return;
      const path = [[cx, y1], [cx, bd.jog], [p.x, bd.jog + 20], [p.x, 628]];
      g.strokeStyle = css([255, 214, 140], .32 * tk); g.beginPath(); path.forEach(([x, y], j) => j ? g.lineTo(rip(x, y), y) : g.moveTo(rip(x, y), y)); g.stroke();
      const u = (t * .32 + i * .137) % 1, dir = i % 2 ? u : 1 - u, seg = Math.min(2, Math.floor(dir * 3)), lu = dir * 3 - seg, a = path[seg], b2 = path[seg + 1];
      const px = lerp(a[0], b2[0], lu), py = lerp(a[1], b2[1], lu); glow(g, rip(px, py), py, 12, [255, 220, 150], .9 * tk);
    });
    S.people.forEach((p, i) => {
      const k = eOut((t - 2.4 - i * .05) / 1.2); if (k <= 0) return;
      g.save(); g.globalAlpha = k; glow(g, p.x, 640, 24, [255, 214, 160], .35);
      person(g, p.x, 662, 36 + Math.sin(t * 1.2 + p.ph) * .3, 'rgb(255,226,190)'); g.restore();
    });
  },
};

// ---- 7. Garden: many ideas are planted and tried; most rest, a few take root and flourish. ----
SCENES.garden = {
  m: .86, hy: 520, sunX: 1200,
  init(r) {
    const rows = [548, 574, 604, 638, 668], seeds = [], winners = [[1, 390], [2, 640], [1, 860], [2, 1070], [0, 1270]];
    rows.forEach((y, ri) => { const s = (y - 520) / 120 + .3; for (let x = 230 + r() * 40; x < 1390; x += 70 + 40 / s + r() * 30) seeds.push({ x, y, s, sprout: .4 + r() * 3.6, wilt: 0, win: false, lean: (r() - .5) * .5 }); });
    for (const [ri, x] of winners) { let best = null; for (const sd of seeds) if (sd.y === rows[ri] && (!best || Math.abs(sd.x - x) < Math.abs(best.x - x))) best = sd; best.win = true; best.sprout = .6 + r() * 1.4; }
    let n = 0; for (const sd of seeds) if (sd.win) { sd.tree = growTree(4000 + n++, sd.x, sd.y, (58 + r() * 34) * sd.s, 6, .48); sd.grow = sd.sprout + 1.3 + r() * 1.2; sd.dur = 6 + r() * 2; } else sd.wilt = sd.sprout + 2.2 + r() * 3.4;
    const pollen = Array.from({ length: 60 }, () => ({ x: 200 + r() * 1200, ph: r() * 500, sp: 8 + r() * 16, s: 1 + r() * 1.8 }));
    const COL = [[255, 190, 150], [255, 226, 160], [180, 240, 210], [244, 170, 205], [190, 220, 255]];
    return { seeds, pollen, COL, rows };
  },
  draw(g, t, E, S) {
    g.strokeStyle = 'rgba(120,100,150,.18)'; g.lineWidth = 1; for (const y of S.rows) { g.beginPath(); g.moveTo(140, y + 3); g.lineTo(1460, y + 3); g.stroke(); }
    for (const sd of S.seeds) {
      const ts = t - sd.sprout;
      if (ts <= 0) { glow(g, sd.x, sd.y, 8 * sd.s, [255, 230, 170], .35 + .2 * Math.sin(t * 3 + sd.x)); continue; }
      if (!sd.win) { // a sprout that was tried, then rests
        const rest = sstep(0, 1.6, t - sd.wilt), hgt = 16 * sd.s * eOut(ts / .8), bend = rest * .9 + sd.lean;
        const tx = sd.x + Math.sin(bend) * hgt, ty = sd.y - Math.cos(bend) * hgt;
        g.strokeStyle = css(mix([200, 255, 210], [110, 96, 130], rest), .9 - rest * .5); g.lineWidth = 1.6 * sd.s; g.beginPath(); g.moveTo(sd.x, sd.y); g.quadraticCurveTo(sd.x, sd.y - hgt * .6, tx, ty); g.stroke();
        glow(g, tx, ty, 9 * sd.s, rest > .5 ? [140, 110, 150] : [200, 255, 210], .7 - rest * .45);
        continue;
      }
      const gk = eInOut((t - sd.grow) / sd.dur), early = eOut(ts / .8);
      if (gk <= 0) { g.strokeStyle = 'rgba(210,255,220,.9)'; g.lineWidth = 1.8 * sd.s; g.beginPath(); g.moveTo(sd.x, sd.y); g.lineTo(sd.x, sd.y - 16 * sd.s * early); g.stroke(); glow(g, sd.x, sd.y - 16 * sd.s * early, 10 * sd.s, [210, 255, 220], .8); continue; }
      glow(g, sd.x, sd.y - 120 * sd.s * gk, 220 * sd.s * gk, [255, 220, 170], .18 * gk);
      g.lineCap = 'round';
      for (const sg of sd.tree.segs) {
        const k = clamp((gk - sg.born) * 6); if (k <= 0) continue;
        g.strokeStyle = css(mix([255, 236, 196], [255, 196, 140], sg.d / 6), .95); g.lineWidth = Math.max(1, (6.5 - sg.d) * 1.6 * sd.s);
        g.beginPath(); g.moveTo(sg.x0, sg.y0); g.lineTo(lerp(sg.x0, sg.x1, k), lerp(sg.y0, sg.y1, k)); g.stroke();
      }
      if (gk > .5) { let cx = 0, cy = 0; for (const tp of sd.tree.tips) { cx += tp.x; cy += tp.y; } const n = sd.tree.tips.length; glow(g, cx / n, cy / n, 150 * sd.s, [255, 214, 170], .3 * sstep(.5, 1, gk)); }
      for (const tp of sd.tree.tips) {
        const k = clamp((gk - tp.born * .8) * 4); if (k <= 0) continue; const col = S.COL[Math.floor(tp.c * S.COL.length)], x = tp.x + Math.sin(t + tp.c * 9) * 2, rad = (3 + tp.c * 4) * sd.s * k;
        g.fillStyle = css(col, .9); g.beginPath(); g.arc(x, tp.y, rad, 0, TAU); g.fill(); glow(g, x, tp.y, rad * 3.2, col, .5 * k);
      }
    }
    for (const p of S.pollen) { const y = 640 - ((t * p.sp + p.ph) % 560); glow(g, p.x + Math.sin(t * .6 + p.ph) * 18, y, p.s * 4.5, [255, 230, 180], .45 * sstep(1.5, 4, t) * (1 - (640 - y) / 560)); }
    [[520, 610, 76], [960, 598, 70], [1160, 626, 80]].forEach(([x, y, h], i) => person(g, x, y, h, 'rgb(24,18,40)', { rim: [255, 214, 170], rimDx: x < 1200 ? 1.2 : -1.2, rimDy: -1, lean: i === 1 ? -2 : 0 }));
  },
};

// ---- 8. Bench: Yasin and Nixy on a hill at sunrise. A third seat, kept warm. ----
SCENES.bench = {
  m: .93, hy: 520, sunX: 690, sunH: .5,
  init(r) {
    const tree = growTree(12, 290, 606, 96, 7, .62);
    const leaves = []; for (const tp of tree.tips) for (let i = 0; i < 6; i++) leaves.push({ x: tp.x + (r() - .5) * 34, y: tp.y + (r() - .5) * 26, r: 4 + r() * 7, ph: r() * TAU });
    const birds = Array.from({ length: 4 }, (_, i) => ({ y: 210 + r() * 90, d: i * 1.4 + r(), sp: 26 + r() * 10, s: .7 + r() * .5 }));
    return { tree, leaves, birds };
  },
  draw(g, t, E, S) {
    // the near hill
    g.fillStyle = 'rgb(18,14,32)'; g.beginPath(); g.moveTo(0, 640); g.bezierCurveTo(300, 560, 560, 600, 860, 588); g.bezierCurveTo(1150, 578, 1400, 610, 1600, 600); g.lineTo(1600, 900); g.lineTo(0, 900); g.closePath(); g.fill();
    g.strokeStyle = 'rgba(255,214,170,.35)'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 640); g.bezierCurveTo(300, 560, 560, 600, 860, 588); g.bezierCurveTo(1150, 578, 1400, 610, 1600, 600); g.stroke();
    // the tree
    g.lineCap = 'round'; g.strokeStyle = 'rgb(18,14,32)';
    for (const sg of S.tree.segs) { g.lineWidth = Math.max(1.2, (8 - sg.d) * 2); g.beginPath(); g.moveTo(sg.x0, sg.y0); g.lineTo(sg.x1, sg.y1); g.stroke(); }
    g.fillStyle = 'rgb(18,14,32)'; for (const l of S.leaves) { g.beginPath(); g.arc(l.x + Math.sin(t * .8 + l.ph) * 2, l.y, l.r, 0, TAU); g.fill(); }
    // birds
    for (const b of S.birds) {
      const x = 1700 - ((t + b.d) * b.sp * 2.4) % 2000, f = Math.sin(t * 6 + b.d * 3) * 7 * b.s, y = b.y + Math.sin(t * .5 + b.d) * 10;
      g.strokeStyle = 'rgba(30,24,52,.8)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 10 * b.s, y - f); g.quadraticCurveTo(x - 4 * b.s, y - 2, x, y); g.quadraticCurveTo(x + 4 * b.s, y - 2, x + 10 * b.s, y - f); g.stroke();
    }
    // two figures seen from behind, rim-lit by the sun in front of them
    const BX = 860, SEAT = 590, sil = 'rgb(16,12,28)', rim = [255, 210, 160];
    const yasin = new Path2D(), nixy = new Path2D(), tilt = Math.sin(t * .35) > .55 ? .12 : 0;
    yasin.arc(BX - 70, SEAT - 108, 21, 0, TAU); yasin.rect(BX - 78, SEAT - 92, 16, 14);
    yasin.moveTo(BX - 118, SEAT - 30); yasin.quadraticCurveTo(BX - 120, SEAT - 78, BX - 92, SEAT - 82); yasin.lineTo(BX - 48, SEAT - 82); yasin.quadraticCurveTo(BX - 20, SEAT - 78, BX - 22, SEAT - 30); yasin.closePath();
    const nx = BX + 22, ny = SEAT - 92;
    nixy.moveTo(nx - 36, SEAT - 30); nixy.quadraticCurveTo(nx - 37, SEAT - 66, nx - 16, SEAT - 70); nixy.lineTo(nx + 16, SEAT - 70); nixy.quadraticCurveTo(nx + 37, SEAT - 66, nx + 36, SEAT - 30); nixy.closePath(); nixy.rect(nx - 6, SEAT - 80, 12, 12);
    const head = new Path2D(); head.ellipse(0, 0, 21, 19, 0, 0, TAU); head.rect(-21, -1, 42, 15); head.moveTo(17, -6); head.lineTo(31, -30); head.lineTo(22, 4); head.closePath();
    const fig = (p, dx, dy) => { g.save(); g.translate(dx, dy); g.fill(p); g.save(); g.translate(nx, ny); g.rotate(tilt); g.fill(head); g.restore(); g.restore(); };
    g.fillStyle = css(rim, .95); g.save(); g.translate(0, -2); g.fill(yasin); g.restore(); fig(nixy, 0, -2); g.save(); g.translate(1.5, 0); g.fill(yasin); g.restore(); fig(nixy, -1.5, 0);
    g.fillStyle = sil; g.fill(yasin); fig(nixy, 0, 0);
    glow(g, nx + 14 * Math.cos(tilt), ny + 8, 9, TEAL, .9);
    // the empty seat, kept warm
    const pul = .55 + .25 * Math.sin(t * 1.4);
    glow(g, BX + 110, SEAT - 40, 80, [255, 214, 160], .35 * pul * eOut((t - 1.5) / 2));
    for (let i = 0; i < 8; i++) { const ph = (t * .4 + i / 8) % 1; glow(g, BX + 90 + hash(i) * 40, SEAT - 30 - ph * 110, 5, [255, 230, 190], .8 * Math.sin(ph * Math.PI) * eOut((t - 1.5) / 2)); }
    // the bench: backrest planks in front of them, legs into the grass
    g.fillStyle = 'rgb(40,30,44)'; g.fillRect(BX - 150, SEAT - 40, 330, 9); g.fillRect(BX - 150, SEAT - 24, 330, 9);
    g.fillStyle = css(rim, .5); g.fillRect(BX - 150, SEAT - 41, 330, 1.6); g.fillRect(BX - 150, SEAT - 25, 330, 1.6);
    g.fillStyle = 'rgb(28,22,36)'; g.fillRect(BX - 140, SEAT - 40, 8, 52); g.fillRect(BX + 162, SEAT - 40, 8, 52);
  },
};

// ---- 9. Dream: everyone lets a light go. Together they make one ring in the sky. ----
SCENES.dream = {
  m: 1, hy: 600, sunX: 1270,
  init(r) {
    const crowd = []; for (let i = 0; i < 46; i++) { const x = 50 + i * (1500 / 45) + (r() - .5) * 18, back = i % 2; crowd.push({ x, y: back ? 640 : 664, h: back ? 58 + r() * 14 : 78 + r() * 18, ph: r() * TAU, hair: r() < .25 ? 'bob' : null }); }
    crowd.sort((a, b) => a.y - b.y);
    const Y = crowd.find(c => c.y === 664 && Math.abs(c.x - 770) < 30) || crowd[30]; Y.x = 770; Y.h = 92; Y.hair = null; Y.me = 1;
    const N = crowd.find(c => c.y === 664 && Math.abs(c.x - 836) < 30 && c !== Y) || crowd[32]; N.x = 836; N.h = 80; N.hair = 'bob'; N.fin = true; N.me = 2;
    const order = crowd.map((c, i) => i).sort(() => r() - .5); order.splice(order.indexOf(crowd.indexOf(Y)), 1); order.splice(order.indexOf(crowd.indexOf(N)), 1); order.unshift(crowd.indexOf(Y), crowd.indexOf(N));
    const RING = 30, CX = 800, CY = 255, RR = 150, COLS = [[255, 214, 150], [255, 226, 176], [255, 196, 140], TEAL, PINK];
    const orbs = order.map((ci, k) => {
      const c = crowd[ci], ring = k < RING, a = ring ? -Math.PI / 2 + (k * 11 % RING) / RING * TAU : 0;
      const tx = ring ? CX + Math.cos(a) * RR : 120 + r() * 1360, ty = ring ? CY + Math.sin(a) * RR : 80 + r() * 330;
      if (!ring && Math.hypot(tx - CX, ty - CY) < 210) return { ci, k, ring, tx: tx < CX ? tx - 220 : tx + 220, ty, rel: .8 + k * .085, col: COLS[Math.floor(r() * COLS.length)], sw: r() * TAU, slot: 0 };
      return { ci, k, ring, tx, ty, rel: .8 + k * .085, col: ring ? COLS[k % 3] : COLS[Math.floor(r() * COLS.length)], sw: r() * TAU, slot: ring ? (k * 11 % RING) : 0 };
    });
    for (const o of orbs) crowd[o.ci].orb = o;
    return { crowd, orbs, RING, CX, CY, RR };
  },
  draw(g, t, E, S) {
    const FLY = 4.6;
    const pos = o => { const c = S.crowd[o.ci], s = [c.x + 8, c.y - c.h * 1.12], p = clamp((t - o.rel) / FLY), e = eInOut(p); if (p <= 0) return null;
      const P = bez(s, [s[0], s[1] - 220], [o.tx, o.ty + 160], [o.tx, o.ty], e); return [P[0] + Math.sin(t * 1.3 + o.sw) * 14 * (1 - e), P[1] + (p >= 1 ? Math.sin(t * .8 + o.sw) * (o.ring ? 1.5 : 5) : 0), p]; };
    // constellation lines once neighbours have both arrived
    const ringPts = new Array(S.RING); let arrived = 0;
    for (const o of S.orbs) if (o.ring) { const P = pos(o); if (P && P[2] >= 1) { ringPts[o.slot] = P; arrived++; } }
    g.strokeStyle = 'rgba(255,228,180,.4)'; g.lineWidth = 1.3;
    for (let i = 0; i < S.RING; i++) { const a = ringPts[i], b = ringPts[(i + 1) % S.RING]; if (a && b) { g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); } }
    const full = sstep(S.RING - 2, S.RING, arrived) * eOut((t - (.8 + S.RING * .085 + FLY)) / 2);
    if (full > 0) { glow(g, S.CX, S.CY, 330, [255, 206, 150], .3 * full); glow(g, S.CX, S.CY, 30, CREAM, .9 * full); }
    for (const o of S.orbs) { const P = pos(o); if (!P) continue; glow(g, P[0], P[1], 26, o.col, .75); g.fillStyle = css([255, 250, 238], .95); g.beginPath(); g.arc(P[0], P[1], 2.6, 0, TAU); g.fill(); }
    // the crowd, each raising a hand as they let go
    for (const c of S.crowd) {
      const o = c.orb, raise = o ? sstep(o.rel - .7, o.rel - .1, t) * (1 - sstep(o.rel + 1.4, o.rel + 2.4, t)) : 0;
      person(g, c.x, c.y, c.h * (1 + Math.sin(t * 1.1 + c.ph) * .004), 'rgb(22,16,38)', { hair: c.hair, fin: c.fin, arm: raise, rim: [255, 214, 170], rimDy: -1.5, rimA: .8 });
      if (raise > .6 && o && t < o.rel) glow(g, c.x + 16 * c.h / 100, c.y - c.h * 1.16, 22, o.col, raise);
    }
  },
};

export const FILM_SCENES = Object.keys(SCENES);

// =====================================================================
// The film
// =====================================================================
export function createFilm(host, opts = {}) {
  const cv = document.createElement('canvas'); cv.className = 'film'; cv.setAttribute('aria-hidden', 'true'); host.append(cv);
  const g = cv.getContext('2d');
  const RM = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const r0 = rng(42);
  const stars = Array.from({ length: 240 }, () => ({ x: r0() * VW, y: r0() * .78, s: .6 + r0() * 1.8, ph: r0() * TAU }));
  const drops = Array.from({ length: 300 }, () => ({ x: r0() * 1900 - 150, sp: 900 + r0() * 600, ph: r0() * 1000, len: 14 + r0() * 22, big: r0() < .1 }));
  const clouds = Array.from({ length: 9 }, (_, i) => ({ seed: i, y: 70 + r0() * 300, x: r0() * 2200, sp: 4 + r0() * 8, s: .8 + r0() * .9 }));
  const cloudDark = clouds.map(c => cloudSprite(c.seed + 1, [34, 40, 62])), cloudLit = clouds.map(c => cloudSprite(c.seed + 1, [255, 220, 196]));
  const hills = [0, 1].map(l => Array.from({ length: 82 }, (_, i) => { const x = i * 20; return [x, (l ? 14 : 30) * (.5 + .5 * Math.sin(x * .004 + l * 2) * Math.sin(x * .0013 + 1 + l)) + (l ? 4 : 10) * Math.sin(x * .02 + l)]; }));
  const grain = document.createElement('canvas'); grain.width = grain.height = 160; { const gg = grain.getContext('2d'), im = gg.createImageData(160, 160); for (let i = 0; i < im.data.length; i += 4) { const v = r0() * 255; im.data[i] = im.data[i + 1] = im.data[i + 2] = v; im.data[i + 3] = 255; } gg.putImageData(im, 0, 0); }
  let grainPat = null, vig = null, layers = null;

  const states = {}; const st = name => states[name] ||= SCENES[name].init(rng(name.length * 101 + name.charCodeAt(0)));
  const E = { m: 0, hy: 600, sunX: 800, sunH: 1, hor: [0, 0, 0] };
  let cur = null, prev = null, fadeAt = 0, now = 0, last = null, raf = 0, openAt = null;

  function size() {
    const w = Math.max(2, Math.round((opts.width || host.clientWidth || VW) * Math.min(1.5, opts.dpr || window.devicePixelRatio || 1)));
    const W = Math.min(opts.maxWidth || 1920, w), H = Math.round(W * VH / VW);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; vig = null; layers = null; }
  }
  function layer() { const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; return c; }
  const base = (ctx) => { const k = cv.width / VW; ctx.setTransform(k, 0, 0, k, 0, 0); };

  function drawSky(t) {
    const m = E.m, hy = E.hy, top = keyed(SKY_TOP, m), mid = keyed(SKY_MID, m), hor = keyed(SKY_HOR, m); E.hor = hor;
    const sg = g.createLinearGradient(0, 0, 0, hy); sg.addColorStop(0, css(top)); sg.addColorStop(.62, css(mid)); sg.addColorStop(1, css(hor));
    g.fillStyle = sg; g.fillRect(0, 0, VW, hy + 1);
    // stars
    const sa = 1 - sstep(.2, .55, m);
    if (sa > 0) for (const s of stars) { const y = s.y * hy; if (y > hy - 30) continue; g.fillStyle = `rgba(220,228,255,${sa * (.25 + .55 * (.5 + .5 * Math.sin(t * 1.3 + s.ph))) * (1 - y / hy * .6)})`; g.fillRect(s.x, y, s.s, s.s); }
    // the sun
    const sun = sstep(.36, .62, m), lift = eOut((m - .38) / .62) * hy * .42 * E.sunH, sy = hy + 40 - lift; E.sunY = sy;
    if (sun > 0) {
      glow(g, E.sunX, sy, 620, [255, 180, 120], .36 * sun); glow(g, E.sunX, sy, 200, [255, 214, 160], .6 * sun);
      // rays
      const rays = sun * (1 - .5 * sstep(.88, 1, m));
      if (rays > 0) {
        const rg = g.createRadialGradient(E.sunX, sy, 30, E.sunX, sy, 1100); rg.addColorStop(0, `rgba(255,220,170,${.075 * rays})`); rg.addColorStop(1, 'rgba(255,220,170,0)');
        g.fillStyle = rg; g.beginPath();
        for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + t * .015 + Math.sin(i * 3.1) * .1, w = .035 + .02 * Math.sin(i * 1.7 + t * .2); g.moveTo(E.sunX, sy); g.lineTo(E.sunX + Math.cos(a - w) * 1400, sy + Math.sin(a - w) * 1400); g.lineTo(E.sunX + Math.cos(a + w) * 1400, sy + Math.sin(a + w) * 1400); g.closePath(); }
        g.globalCompositeOperation = 'lighter'; g.fill(); g.globalCompositeOperation = 'source-over';
      }
      g.fillStyle = css([255, 244, 222], sun); g.beginPath(); g.arc(E.sunX, sy, 40, 0, TAU); g.fill();
    }
    // clouds: heavy at night, lit from beneath by morning
    const dk = .75 * (1 - sstep(.3, .8, m)), lt = .5 * sstep(.3, .9, m);
    clouds.forEach((c, i) => {
      const x = ((c.x + t * c.sp) % 2400) - 500, y = c.y * (hy / 600), w = 640 * c.s, h = 200 * c.s;
      if (dk > .01) { g.globalAlpha = dk; g.drawImage(cloudDark[i], x, y - h / 2, w, h); }
      if (lt > .01) { g.globalAlpha = lt * (y < hy - 60 ? 1 : .4); g.drawImage(cloudLit[i], x, y - h / 2, w, h); }
    });
    g.globalAlpha = 1;
    // distant hills and the ground
    const gr = keyed(GROUND, m);
    hills.forEach((pts, l) => { g.fillStyle = css(mix(hor, gr, l ? .72 : .45)); g.beginPath(); g.moveTo(0, hy + 2); for (const [x, h] of pts) g.lineTo(x, hy - h); g.lineTo(VW, hy + 2); g.closePath(); g.fill(); });
    const gg = g.createLinearGradient(0, hy, 0, VH); gg.addColorStop(0, css(mix(hor, gr, .78))); gg.addColorStop(.35, css(gr)); gg.addColorStop(1, css(mix(gr, [0, 0, 0], .4)));
    g.fillStyle = gg; g.fillRect(0, hy, VW, VH - hy);
    if (sun > 0) glow(g, E.sunX, hy, 700, [255, 200, 150], .35 * sun, 18);
  }
  function drawRain(t) {
    const amt = 1 - sstep(.12, .48, E.m); if (amt <= .01) return;
    g.lineCap = 'round';
    for (const big of [false, true]) {
      g.strokeStyle = big ? `rgba(190,206,240,${.32 * amt})` : `rgba(160,180,225,${.22 * amt})`; g.lineWidth = big ? 2 : 1.1; g.beginPath();
      for (const d of drops) { if (d.big !== big) continue; const y = ((t * d.sp + d.ph) % 1050) - 80, x = d.x + y * .16, l = d.len * (big ? 1.6 : 1); g.moveTo(x, y); g.lineTo(x + l * .16, y + l); }
      g.stroke();
    }
  }
  function drawFinish(t) {
    const bg = g.createLinearGradient(0, VH * .6, 0, VH); bg.addColorStop(0, 'rgba(4,4,12,0)'); bg.addColorStop(1, 'rgba(4,4,12,.62)'); g.fillStyle = bg; g.fillRect(0, VH * .6, VW, VH * .4);
    g.setTransform(1, 0, 0, 1, 0, 0);
    if (!vig) { vig = document.createElement('canvas'); vig.width = cv.width; vig.height = cv.height; const vg = vig.getContext('2d'), R = Math.hypot(cv.width, cv.height) / 2, rg = vg.createRadialGradient(cv.width / 2, cv.height * .45, R * .45, cv.width / 2, cv.height * .45, R); rg.addColorStop(0, 'rgba(0,0,8,0)'); rg.addColorStop(1, 'rgba(0,0,8,.55)'); vg.fillStyle = rg; vg.fillRect(0, 0, cv.width, cv.height); }
    g.drawImage(vig, 0, 0);
    grainPat ||= g.createPattern(grain, 'repeat');
    g.save(); g.globalAlpha = .045; g.globalCompositeOperation = 'overlay'; g.translate((t * 977 % 160) | 0, (t * 613 % 160) | 0); g.fillStyle = grainPat; g.fillRect(-160, -160, cv.width + 320, cv.height + 320); g.restore();
    if (openAt != null) { const k = 1 - clamp((t - openAt) / 1.6); if (k > 0) { g.fillStyle = `rgba(5,3,15,${k})`; g.fillRect(0, 0, cv.width, cv.height); } }
  }
  function drawScene(ctx, s, t) { const S = st(s.name); ctx.save(); SCENES[s.name].draw(ctx, t - s.t0, E, S); ctx.restore(); }

  function frame(t) {
    size(); now = t; const dt = last == null ? 0 : Math.min(.1, Math.max(0, t - last)); last = t;
    const def = cur ? SCENES[cur.name] : SCENES.arrival, ease = tau => 1 - Math.exp(-dt / tau);
    E.m += (def.m - E.m) * ease(2.4); E.hy += (def.hy - E.hy) * ease(1.5); E.sunX += (def.sunX - E.sunX) * ease(2.2); E.sunH += ((def.sunH || 1) - E.sunH) * ease(2.2);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    base(g); drawSky(t);
    const fk = prev ? clamp((t - fadeAt) / 1.8) : 1;
    if (prev && fk < 1) {
      layers ||= [layer(), layer()];
      for (const [i, s] of [[0, prev], [1, cur]]) { const lg = layers[i].getContext('2d'); lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, cv.width, cv.height); base(lg); drawScene(lg, s, t); }
      g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1 - eInOut(fk); g.drawImage(layers[0], 0, 0); g.globalAlpha = eInOut(fk); g.drawImage(layers[1], 0, 0); g.restore();
    } else { prev = null; if (cur) drawScene(g, cur, t); }
    base(g); drawRain(t); drawFinish(t);
  }
  const loop = () => { raf = requestAnimationFrame(loop); if (document.hidden) return; frame(performance.now() / 1000 * (RM ? .6 : 1)); };
  const clockNow = () => opts.manual ? now : performance.now() / 1000 * (RM ? .6 : 1);

  const film = {
    canvas: cv,
    get mood() { return cur ? SCENES[cur.name].m : 0; },
    moodOf: name => SCENES[name]?.m ?? 0,
    scene(name, t = clockNow()) {
      if (!SCENES[name]) return;
      if (states[name]) { delete states[name].yes; delete states[name].no; }
      if (openAt == null) { openAt = t; E.m = SCENES[name].m; E.hy = SCENES[name].hy; E.sunX = SCENES[name].sunX; E.sunH = SCENES[name].sunH || 1; }
      if (cur) { prev = cur; fadeAt = t; }
      cur = { name, t0: t };
    },
    event(kind, t = clockNow()) { if (!cur) return; const S = st(cur.name); S[kind] = t - cur.t0; },
    frame,
    start() { if (!raf) loop(); },
    stop() { cancelAnimationFrame(raf); raf = 0; },
    destroy() { film.stop(); cv.remove(); },
  };
  return film;
}
