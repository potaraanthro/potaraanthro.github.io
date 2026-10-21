// The tile world: maps, entities, grid movement, A* click-to-walk, Nixy's lead/follow modes, camera, rendering.
import { W, H, T, clock, emit, input } from './core.js';
import { TL, SOLID, drawTile, drawProp, drawBuilding, person, moth, ghostOf, P, text, textC } from './art.js';
import { drawSky, DRAW2, drawCityBuilding, CITY_STYLE } from './art2.js';
import { dronePos } from './hd.js';

// a little delivery robot that trundles round the plaza
function drawBot(g, x, y, t, dir, moving) {
  const bx = x + 4, by = y + 13 + (moving ? ((t / 90 | 0) % 2) : 0);
  g.fillStyle = P.ink; g.fillRect(bx - 1, by - 1, 12, 11);
  g.fillStyle = '#e9e6ff'; g.fillRect(bx, by, 10, 8); g.fillStyle = '#c4b5fd'; g.fillRect(bx, by + 6, 10, 2);
  g.fillStyle = '#0c0b14'; g.fillRect(bx + 2, by + 2, 6, 3);
  const ex = dir === 1 ? 0 : dir === 2 ? 2 : 1; if (dir !== 3) { g.fillStyle = '#22d3ee'; g.fillRect(bx + 2 + ex, by + 3, 1, 1); g.fillRect(bx + 5 + ex, by + 3, 1, 1); }
  g.fillStyle = '#334155'; g.fillRect(bx + 1, by + 8, 3, 2); g.fillRect(bx + 6, by + 8, 3, 2);
  g.fillStyle = '#ffd60a'; g.fillRect(bx + 3, by - 3, 4, 2); // the parcel
  g.fillStyle = (t / 400 | 0) % 2 ? '#f472b6' : '#22d3ee'; g.fillRect(bx + 8, by - 3, 1, 2);
}

export class GameMap {
  constructor(w, h, fill) {
    this.w = w; this.h = h; this.t = new Uint8Array(w * h).fill(fill);
    this.block = new Uint8Array(w * h); // props and buildings
    this.props = []; this.buildings = []; this.warps = []; this.steps = []; this.sky = false;
    this.cache = null;
  }
  get(x, y) { return x < 0 || y < 0 || x >= this.w || y >= this.h ? TL.ROCK : this.t[y * this.w + x]; }
  set(x, y, v) { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.t[y * this.w + x] = v; }
  rect(x, y, w, h, v) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, v); }
  solid(x, y) { return SOLID.has(this.get(x, y)) || (x >= 0 && y >= 0 && x < this.w && y < this.h && this.block[y * this.w + x] > 0); }
  addProp(p) {
    p.w ||= 1; p.h ||= 1; this.props.push(p);
    if (p.solid !== false) for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) this.block[(p.y + j) * this.w + p.x + i]++;
    return p;
  }
  addBuilding(b) {
    this.buildings.push(b);
    for (let j = 0; j < b.h; j++) for (let i = 0; i < b.w; i++) if (!(b.x + i === b.door[0] && b.y + j === b.door[1])) this.block[(b.y + j) * this.w + b.x + i]++;
    return b;
  }
  propAt(x, y) { return this.props.find(p => p.act && x >= p.x && x < p.x + p.w && y >= p.y && y < p.y + p.h); }
  buildingAt(x, y) { return this.buildings.find(b => x >= b.x && x < b.x + b.w && y >= b.y - 1 && y < b.y + b.h); }
  bake() {
    const c = document.createElement('canvas'); c.width = this.w * T; c.height = this.h * T;
    const g = c.getContext('2d');
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) { const t = this.get(x, y); if (t !== TL.TALL && t !== TL.WATER) drawTile(g, t, x * T, y * T, x, y); }
    this.cache = c;
  }
}

export class Ent {
  constructor(o) {
    Object.assign(this, { dir: 0, f: 0, px: 0, py: 0, speed: 150, blocking: true, path: [], hidden: false, sit: false, bob: 0, emote: null }, o);
    this.px = this.x * T; this.py = this.y * T; this.mv = null; this.anim = 0;
  }
  get busy() { return !!this.mv || this.path.length > 0; }
}

// ---------------- A* ----------------
export function findPath(world, sx, sy, goals, ignore) {
  const m = world.map, key = (x, y) => y * m.w + x;
  const goalSet = new Set(goals.map(([x, y]) => key(x, y)));
  if (!goalSet.size) return null;
  const hfn = (x, y) => Math.min(...goals.map(([gx, gy]) => Math.abs(gx - x) + Math.abs(gy - y)));
  const open = [[sx, sy, 0, hfn(sx, sy)]], came = new Map(), gsc = new Map([[key(sx, sy), 0]]);
  let n = 0;
  while (open.length && n++ < 6000) {
    let bi = 0; for (let i = 1; i < open.length; i++) if (open[i][3] < open[bi][3]) bi = i;
    const [x, y, gc] = open.splice(bi, 1)[0];
    if (goalSet.has(key(x, y))) { const path = []; let k = key(x, y); while (k !== key(sx, sy)) { path.unshift([k % m.w, (k / m.w) | 0]); k = came.get(k); } return path; }
    for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy; if (!world.passable(nx, ny, ignore)) continue;
      const k = key(nx, ny), ng = gc + 1;
      if (ng < (gsc.get(k) ?? 1e9)) { gsc.set(k, ng); came.set(k, key(x, y)); open.push([nx, ny, ng, ng + hfn(nx, ny)]); }
    }
  }
  return null;
}

export class World {
  constructor(map) {
    this.map = map; this.ents = []; this.cam = { x: 0, y: 0 }; this.player = null; this.nixy = null;
    this.trail = []; this.camBias = 0; this.marker = null; this.locked = false; this.greyNixy = false; this.bubbles = [];
    if (!map.cache) map.bake();
    // small rooms are shown closer (1.5x) so they fill the wider screen
    const mw = map.w * T, mh = map.h * T; this.zoom = (mw < W * .8 && mh < H * .85) ? 1.5 : 1;
    this.vw = W / this.zoom; this.vh = H / this.zoom;
  }
  add(e) { this.ents.push(e); return e; }
  entAt(x, y, except) { return this.ents.find(e => e !== except && !e.hidden && e.x === x && e.y === y); }
  passable(x, y, ignore) {
    if (this.map.solid(x, y)) return false;
    const e = this.entAt(x, y, ignore); return !e || !e.blocking || e === this.nixy;
  }
  // ----- movement -----
  step(e, dir) {
    const d = [[0, 1], [-1, 0], [1, 0], [0, -1]][dir]; e.dir = dir;
    const nx = e.x + d[0], ny = e.y + d[1];
    if (!this.passable(nx, ny, e) || (e !== this.player && e !== this.nixy && this.player && this.player.x === nx && this.player.y === ny)) return false;
    if (e === this.nixy && this.player && this.player.x === nx && this.player.y === ny) return false;
    e.mv = { fx: e.x, fy: e.y, t: 0 }; e.x = nx; e.y = ny; e.stepN = (e.stepN || 0) + 1;
    if (e === this.player) { this.onPlayerStep(e.mv.fx, e.mv.fy); }
    return true;
  }
  dirTo(e, x, y) { return x > e.x ? 2 : x < e.x ? 1 : y > e.y ? 0 : 3; }
  face(e, other) { e.dir = this.dirTo(e, other.x, other.y); }
  walkTo(e, x, y, adjacent = false) {
    const goals = adjacent ? [[x, y + 1], [x - 1, y], [x + 1, y], [x, y - 1]].filter(([gx, gy]) => this.passable(gx, gy, e) || (gx === e.x && gy === e.y)) : [[x, y]];
    if (goals.some(([gx, gy]) => gx === e.x && gy === e.y)) { e.path = []; return Promise.resolve(true); }
    const p = findPath(this, e.x, e.y, goals, e);
    e.path = p || [];
    return new Promise(r => { e._arrive = r; if (!p) { e._arrive = null; r(false); } });
  }
  onPlayerStep(fx, fy) {
    // follower: Nixy steps into the tile the player just left
    const n = this.nixy;
    if (n && n.mode === 'follow' && !n.hidden) {
      const dist = Math.abs(n.x - fx) + Math.abs(n.y - fy);
      if (dist === 1 && !n.mv) { n.path = [[fx, fy]]; }
      else if (dist > 1) { const p = findPath(this, n.x, n.y, [[fx, fy]], n); n.path = p ? p.slice(0, 6) : []; if (!p && dist > 6) { n.x = fx; n.y = fy; n.px = fx * T; n.py = fy * T; } }
    }
  }
  update(dt) {
    const pl = this.player;
    // held-key movement
    if (pl && !this.locked && !pl.mv) {
      const d = input.dirHeld();
      if (d >= 0) { pl.path = []; this.marker = null; if (!this.step(pl, d)) { pl.dir = d; } }
    }
    for (const e of this.ents) {
      if (e.loop && !e.mv && !e.path.length && !e.talking) {
        e.pause = (e.pause || 0) - dt;
        if (e.pause <= 0) { e.li = ((e.li ?? -1) + 1) % e.loop.length; const [gx, gy] = e.loop[e.li]; const p = findPath(this, e.x, e.y, [[gx, gy]], e); e.path = p || []; e.pause = 1500 + Math.random() * 2500; }
      }
      if (e.mv) {
        e.mv.t += dt / e.speed; e.anim += dt;
        const k = Math.min(1, e.mv.t);
        e.px = (e.mv.fx + (e.x - e.mv.fx) * k) * T; e.py = (e.mv.fy + (e.y - e.mv.fy) * k) * T;
        e.f = k < .62 ? (e.stepN % 2 ? 1 : 2) : 0;
        if (k >= 1) { e.mv = null; e.f = 0; e.px = e.x * T; e.py = e.y * T; if (e === pl) emit('arrive', { x: e.x, y: e.y }); }
      }
      if (!e.mv && e.path.length) {
        // Nixy leading waits when the player falls behind
        if (e === this.nixy && e.mode === 'lead' && pl) {
          const far = Math.abs(pl.x - e.x) + Math.abs(pl.y - e.y);
          if (far > 5) { if (!e.waiting) { e.waiting = true; emit('nixyWaiting'); } continue; }
          e.waiting = false;
        }
        const [nx, ny] = e.path[0];
        const dir = this.dirTo(e, nx, ny);
        if (Math.abs(nx - e.x) + Math.abs(ny - e.y) !== 1) { e.path = []; continue; }
        if (this.step(e, dir)) e.path.shift();
        else {
          e.blockedFor = (e.blockedFor || 0) + dt;
          if (e.blockedFor > 400) { // re-route around whatever is in the way
            e.blockedFor = 0; const goal = e.path[e.path.length - 1];
            const p = findPath(this, e.x, e.y, [goal], e); e.path = p || [];
            if (!p) { e.path = []; e._arrive?.(false); e._arrive = null; }
          }
        }
      }
      if (!e.mv && !e.path.length && e._arrive) { const r = e._arrive; e._arrive = null; r(true); }
    }
    // camera
    if (pl) {
      const mw = this.map.w * T, mh = this.map.h * T;
      const VW = this.vw, VH = this.vh;
      let cx = pl.px + 8 - VW / 2, cy = pl.py + 8 - VH / 2 + 8 + this.camBias / this.zoom;
      cx = mw <= VW ? (mw - VW) / 2 : Math.max(0, Math.min(mw - VW, cx));
      cy = mh <= VH ? (mh - VH) / 2 : Math.max(0, Math.min(mh - VH, cy));
      this.cam.x = Math.round(cx); this.cam.y = Math.round(cy);
    }
    this.bubbles = this.bubbles.filter(b => clock.t < b.until);
  }
  // ----- rendering -----
  render(g, skipNixy) {
    g.fillStyle = '#05030f'; g.fillRect(0, 0, W, H);
    if (this.zoom !== 1) { g.save(); g.scale(this.zoom, this.zoom); this.renderBody(g, skipNixy, this.vw, this.vh); g.restore(); }
    else this.renderBody(g, skipNixy, W, H);
  }
  renderBody(g, skipNixy, W, H) {
    const t = clock.t, cx = this.cam.x, cy = this.cam.y, m = this.map;
    if (m.sky) drawSky(g, cx, cy, t, m.w * T, m.skyRows * T);
    g.drawImage(m.cache, -cx, -cy);
    const x0 = Math.max(0, (cx / T) | 0), y0 = Math.max(0, (cy / T) | 0), x1 = Math.min(m.w, x0 + W / T + 2), y1 = Math.min(m.h, y0 + H / T + 2);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const tt = m.get(x, y); if (tt === TL.TALL || tt === TL.WATER) drawTile(g, tt, x * T - cx, y * T - cy, x, y, t); }
    if (this.guide && this.guide.pts) { // the gold line: a trail of pulses from the visitor to the next stop
      const pts = this.guide.pts, c = this.guide.color || '#ffd60a';
      for (let i = 1; i < pts.length; i++) {
        const [gx, gy] = pts[i], px = gx * T + 8 - cx, py = gy * T + 9 - cy; if (px < -8 || px > W + 8 || py < -8 || py > H + 8) continue;
        const wave = (Math.sin(i * .9 - t / 140) + 1) / 2, r = 1 + (wave > .7 ? 1 : 0);
        g.fillStyle = 'rgba(12,11,20,.55)'; g.fillRect(px - r - 1, py - r - 1, r * 2 + 3, r * 2 + 3);
        g.fillStyle = wave > .55 ? '#fff6c2' : c; g.fillRect(px - r, py - r, r * 2 + 1, r * 2 + 1);
      }
    }
    if (this.marker) { const a = (Math.sin(t / 120) + 1) / 2; g.strokeStyle = `rgba(34,211,238,${.5 + a * .5})`; g.strokeRect(this.marker[0] * T - cx + 2.5, this.marker[1] * T - cy + 2.5, 11, 11); }
    // depth-sorted drawables
    const list = [];
    const dp = p => { const x = p.x * T - cx, y = p.y * T - cy, d2 = DRAW2[p.kind]; if (!(d2 && d2(g, p, x, y, t) !== false)) drawProp(g, p, x, y, t); };
    for (const p of m.props) { if (p.x * T - cx > W + 48 || p.x * T - cx < -80 || p.y * T - cy > H + 48 || p.y * T - cy < -60) continue; list.push({ y: (p.kind === 'pad' || p.flat) ? -1 : (p.y + p.h) * T - 1, d: () => dp(p) }); }
    for (const b of m.buildings) list.push({ y: (b.y + b.h) * T - 2, d: () => (CITY_STYLE[b.style] ? drawCityBuilding : drawBuilding)(g, b, b.x * T - cx, b.y * T - cy, t) });
    for (const e of this.ents) if (!e.hidden && !(skipNixy && e === this.nixy)) list.push({ y: e.py + T, d: () => this.drawEnt(g, e) });
    list.sort((a, b) => a.y - b.y).forEach(o => o.d());
    if (m.sky) { this.drawTaxis(g, t, cx, cy, W); this.drawDrones(g, t, cx, cy, W, H); }
    if (m.haunt) this.drawHaunt(g, t, cx, cy, W, H);
  }
  // a full render of the map (tiles, props, buildings, no characters) for cinematics
  snapshot() {
    const c = document.createElement('canvas'); c.width = this.map.w * T; c.height = this.map.h * T; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const keep = { ...this.cam }, ents = this.ents, mk = this.marker, bub = this.bubbles; this.cam = { x: 0, y: 0 }; this.ents = []; this.marker = null; this.bubbles = [];
    const sw = W, sh = H, z = this.zoom; this.zoom = 1;
    // render in screen-sized chunks so the culling logic still applies
    for (let y = 0; y < c.height; y += sh) for (let x = 0; x < c.width; x += sw) { this.cam = { x, y }; const tmp = document.createElement('canvas'); tmp.width = sw; tmp.height = sh; const tg = tmp.getContext('2d'); this.render(tg); g.drawImage(tmp, x, y); }
    this.zoom = z; this.cam = keep; this.ents = ents; this.marker = mk; this.bubbles = bub; return c;
  }
  renderNixy(g) { if (this.nixy && !this.nixy.hidden) { g.save(); g.scale(this.zoom, this.zoom); this.drawEnt(g, this.nixy); g.restore(); } }
  drawEnt(g, e) {
    const x = Math.round(e.px - this.cam.x) - 1, y = Math.round(e.py - this.cam.y) - 10;
    if (e.ghost) { // no shadow, a slow float, a flicker; now and then it nearly vanishes
      const s = ghostOf(e.look, e.dir, e.f), ph = clock.t / 260 + e.x * 1.3;
      let a = .7 + .14 * Math.sin(ph); if (((clock.t / 120 | 0) + e.id.length * 11) % 53 === 0) a = .1;
      g.globalAlpha = a; g.drawImage(s, x + ((18 - s.width) >> 1), y + 26 - s.height + Math.round(Math.sin(clock.t / 480 + e.x) * 2) - 3); g.globalAlpha = 1;
      return;
    }
    g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(x + 4, y + 23, 10, 3);
    if (e.kind === 'bot') { drawBot(g, x, y, clock.t, e.dir, !!e.mv); return; }
    if (e.kind === 'moth') { const fl = (clock.t / 160 | 0) % 2; g.drawImage(moth(fl), x - 3, y - 2 + Math.round(Math.sin(clock.t / 300) * 2)); }
    else {
      const bob = e.idleBob && !e.mv ? Math.round(Math.sin(clock.t / 350 + e.x) * .6) : 0;
      const s = person(e.look, e.dir, e.f, e.sit); g.drawImage(s, x + (e.sit && e.sitDx || 0) + ((18 - s.width) >> 1), y + 26 - s.height + bob + (e.sit ? 2 : 0));
    }
  }
  drawBubbles(g) {
    for (const b of this.bubbles) {
      const e = b.ent; const s = b.text.toUpperCase(); const w = s.length * 4 + 5;
      let x = Math.round(e.px - this.cam.x + 8 - w / 2), y = Math.round(e.py - this.cam.y - 22);
      x = Math.max(2, Math.min(W - w - 2, x)); y = Math.max(2, y);
      g.fillStyle = P.ink; g.fillRect(x - 1, y - 1, w + 2, 11); g.fillStyle = P.white; g.fillRect(x, y, w, 9);
      g.fillRect(Math.round(e.px - this.cam.x + 7), y + 9, 2, 2);
      text(g, s, x + 3, y + 2, P.ink);
    }
  }
  bubble(ent, txt, ms = 2200) { this.bubbles = this.bubbles.filter(b => b.ent !== ent); this.bubbles.push({ ent, text: txt, until: clock.t + ms }); }
  // the old town after dark: colour drained, cold night, fog, rain, lightning, things watching from doorways
  drawHaunt(g, t, cx, cy, W, H) {
    const hz = this.map.haunt, x0 = hz.x0 * T - cx, x1 = hz.x1 * T - cx; if (x1 <= 0) return;
    const R = Math.min(W, Math.ceil(x1)), grad = (c0, c1) => { const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, c0); gr.addColorStop(1, c1); return gr; };
    g.save();
    g.globalCompositeOperation = 'saturation'; g.fillStyle = grad('rgba(128,128,128,.9)', 'rgba(128,128,128,0)'); g.fillRect(0, 0, R, H);
    g.globalCompositeOperation = 'multiply'; g.fillStyle = grad('rgb(86,98,136)', 'rgb(255,255,255)'); g.fillRect(0, 0, R, H);
    g.globalCompositeOperation = 'source-over';
    g.beginPath(); g.rect(0, 0, R, H); g.clip();
    // eyes in the dark doorways, blinking open now and then
    for (const b of this.map.buildings) {
      if (b.style !== 'old') continue;
      const bx = b.x * T - cx, by = b.y * T - cy; if (bx > W || bx + b.w * T < 0) continue;
      const k = Math.sin(t / 1400 + b.x * 1.7 + b.y);
      if (k > .78 && (t / 160 | 0) % 17) { const dx = b.door[0] * T - cx, dy = (b.y + b.h) * T - cy - 13; g.fillStyle = '#ff3b3b'; g.fillRect(dx + 5, dy, 2, 1); g.fillRect(dx + 9, dy, 2, 1); g.fillStyle = 'rgba(255,80,80,.35)'; g.fillRect(dx + 4, dy - 1, 8, 3); }
      // cobwebs in the top corners
      g.strokeStyle = 'rgba(225,232,248,.45)'; g.lineWidth = 1; g.beginPath();
      for (const [ox, sx] of [[bx + 1, 1], [bx + b.w * T - 1, -1]]) { const oy = by + 1; g.moveTo(ox, oy + 8); g.lineTo(ox, oy); g.lineTo(ox + 8 * sx, oy); g.moveTo(ox, oy); g.lineTo(ox + 6 * sx, oy + 6); g.moveTo(ox, oy + 4); g.quadraticCurveTo(ox + 3 * sx, oy + 3, ox + 4 * sx, oy); }
      g.stroke();
    }
    // fog banks drifting along the street
    for (let i = 0; i < 7; i++) {
      const wy = (5.5 + i * 2.4) * T, wx = ((t / (55 + i * 9) + i * 173) % (hz.x1 * T + 160)) - 120, sx = Math.round(wx - cx), sy = Math.round(wy - cy);
      if (sx > R || sx < -140) continue;
      for (let j = 0; j < 3; j++) { g.fillStyle = `rgba(196,206,230,${.05 - j * .012})`; g.fillRect(sx - j * 10, sy - j * 3, 120 + j * 20, 10 + j * 6); }
    }
    // rain
    g.fillStyle = 'rgba(190,204,238,.32)';
    for (let i = 0; i < 90; i++) { const rx = ((i * 37.7 + t * .09) % (R + 30)) - 10, ry = ((i * 53.3 + t * .42) % (H + 10)) - 5; g.fillRect(rx | 0, ry | 0, 1, 3); g.fillRect((rx | 0) - 1, (ry | 0) + 3, 1, 2); }
    // lightning: a double flicker every so often
    const ph = t % 7300; if (ph < 60 || (ph > 130 && ph < 175)) { g.fillStyle = 'rgba(214,224,255,.28)'; g.fillRect(0, 0, R, H); }
    const n = t / 7300 | 0; if (n !== this._thN) { this._thN = n; if (this.player && this.player.x < hz.x1) emit('thunder'); }
    g.restore();
  }
  // air taxis gliding over Technicity (only over the city, never the old town)
  drawTaxis(g, t, cx, cy, W) {
    const cx0 = (this.map.cityX || 27) * T, cw = (this.map.w - (this.map.cityX || 27)) * T;
    for (let i = 0; i < 3; i++) {
      const dir = i % 2 ? -1 : 1, sp = 26 + i * 7, u = ((t / sp + i * 211) % (cw + 60)), wx = dir > 0 ? cx0 - 30 + u : cx0 + cw + 30 - u, wy = (1.1 + i * .85) * T;
      const x = Math.round(wx - cx), y = Math.round(wy - cy + Math.sin(t / 700 + i) * 1.5); if (x < -20 || x > W + 20 || wx < cx0 - 4) continue;
      g.fillStyle = P.ink; g.fillRect(x - 1, y - 1, 16, 7);
      g.fillStyle = ['#e9e6ff', '#fde68a', '#bff7f2'][i]; g.fillRect(x, y, 14, 5);
      g.fillStyle = '#22d3ee'; g.fillRect(dir > 0 ? x + 8 : x + 2, y + 1, 4, 2);
      g.fillStyle = (t / 300 | 0) % 2 ? '#f472b6' : '#ffd60a'; g.fillRect(dir > 0 ? x : x + 13, y + 2, 1, 1);
      g.fillStyle = 'rgba(167,139,250,.6)'; g.fillRect(x + 3, y + 6, 8, 1);
    }
  }
  drawDrones(g, t, cx, cy, W, H) {
    for (let i = 0; i < 3; i++) {
      const d = dronePos(i, t), x = Math.round(d.x - cx), y = Math.round(d.y - cy); if (x < -10 || x > W + 10 || y < -10 || y > H + 10) continue;
      g.fillStyle = 'rgba(20,10,60,.18)'; g.fillRect(x - 3, y + 14, 7, 2);
      g.fillStyle = P.ink; g.fillRect(x - 4, y - 1, 9, 4); g.fillStyle = '#e9e6ff'; g.fillRect(x - 3, y, 7, 2);
      const r = (t / 40 | 0) % 2; g.fillStyle = '#c4b5fd'; g.fillRect(x - 6 + r, y - 2, 3, 1); g.fillRect(x + 4 - r, y - 2, 3, 1);
    }
  }
  drawMonorail(g, t, cx, cy) {
    // a train glides across the sky band, in the distance
    const span = this.map.w * T + 200, x = ((t / 22) % span) - 100 - cx, y = 2.2 * T - cy;
    g.fillStyle = '#c4b5fd'; g.fillRect(-cx, y + 9, this.map.w * T, 1);
    g.fillStyle = P.ink; g.fillRect(x - 1, y - 1, 62, 10);
    g.fillStyle = '#e9d5ff'; g.fillRect(x, y, 60, 8); g.fillStyle = P.grapeD; g.fillRect(x, y + 6, 60, 2);
    for (let i = 0; i < 6; i++) { g.fillStyle = P.amber; g.fillRect(x + 4 + i * 9, y + 2, 5, 3); }
  }
}
