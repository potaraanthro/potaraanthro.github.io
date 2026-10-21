// The Arcade game: a flappy-bird-style flyer. Nixy's drone against server racks. Every milestone unlocks a lore paragraph.
// Own animation loop, no dependency on the game scheduler. Space / click / tap flaps, Esc leaves. Resolves { best } when closed.
import { on } from './core.js';
import { P, person, text, textC, textW } from './art.js';
import { audio } from './audio.js';
import { LORE } from '../data/lore.js';

const overlay = document.querySelector('#overlay');
const W = 320, H = 180, GROUND = 160;
const GAP = 84;      // the opening between the racks: roomy, but still a choice
const GRAV = 620, FLAP = -200, SPEED = 60, SPACING = 132; // gentler fall, easier to read
const HIT_X = 5, HIT_Y = 6; // the drone's collision box is smaller than its drawing

export function playArcade({ unlocked, onUnlock, best = 0 }) {
  return new Promise(res => {
    overlay.innerHTML = `<div id="arcp"><div class="crtin"><canvas id="arcc" width="${W}" height="${H}"></canvas>
      <div id="arcl" class="lorecard" hidden><h4></h4><p></p><button type="button" class="opt">Keep flapping ▶</button></div>
      <button type="button" id="arcx" class="vskip">LEAVE ✕</button></div></div>`;
    overlay.hidden = false;
    const cv = overlay.querySelector('#arcc'), g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const card = overlay.querySelector('#arcl'), btn = card.querySelector('button');
    const sprite = person('nixy', 0, 0);
    let st = 'ready', t = 0, score = 0, hi = best, last = performance.now(), raf = 0, closed = false, shake = 0;
    const bird = { x: 76, y: 80, vy: 0, rot: 0, sy: 1 };
    let pipes = [], nextPipe = 0, pending = null;
    const reset = () => { bird.y = 80; bird.vy = 0; bird.rot = 0; pipes = []; nextPipe = 190; score = 0; st = 'ready'; pending = null; };
    reset();
    const flap = () => {
      if (closed || !card.hidden) return;
      if (st === 'ready') st = 'play';
      if (st === 'play') { bird.vy = FLAP; bird.sy = 1.25; audio.sfx('select'); }
      else if (st === 'dead' && t > 500) reset();
    };
    const showLore = item => {
      st = 'lore'; card.querySelector('h4').textContent = 'UNLOCKED · ' + item.t; card.querySelector('p').textContent = item.b; card.hidden = false; audio.sfx('win');
      btn.focus({ preventScroll: true });
    };
    btn.onclick = e => { e.stopPropagation(); card.hidden = true; st = 'play'; last = performance.now(); };
    const die = () => { st = 'dead'; t = 0; shake = 6; audio.sfx('bump'); if (score > hi) hi = score; };
    const step = dt => {
      t += dt * 1000; if (shake > 0) shake = Math.max(0, shake - dt * 30);
      bird.sy += (1 - bird.sy) * Math.min(1, dt * 10);
      if (st === 'ready') { bird.y = 80 + Math.sin(t / 260) * 5; return; }
      if (st === 'lore') return;
      bird.vy = Math.min(bird.vy + GRAV * dt, 300); bird.y += bird.vy * dt;
      bird.rot = Math.max(-.5, Math.min(.9, bird.vy / 300)); // anticipation and follow-through
      if (st === 'dead') { if (bird.y > GROUND - 10) { bird.y = GROUND - 10; bird.vy = 0; } return; }
      const sp = SPEED; nextPipe -= sp * dt;
      if (nextPipe <= 0) { pipes.push({ x: W + 10, gap: 22 + Math.random() * (GROUND - GAP - 44), w: 26, done: false }); nextPipe = SPACING; }
      for (const p of pipes) {
        p.x -= sp * dt;
        if (!p.done && p.x + p.w < bird.x - 8) { p.done = true; score++; audio.sfx('coin'); const item = LORE.find(l => l.score === score); if (item) { onUnlock(item); showLore(item); } }
        const gt = p.gap, gb = p.gap + GAP, bx = bird.x, by = bird.y;
        if (bx + HIT_X > p.x && bx - HIT_X < p.x + p.w && (by - HIT_Y < gt || by + HIT_Y > gb)) die();
      }
      pipes = pipes.filter(p => p.x > -40);
      if (bird.y > GROUND - 10) { bird.y = GROUND - 10; die(); }
      if (bird.y < -6) { bird.y = -6; bird.vy = 0; }
    };
    const draw = () => {
      const ox = shake ? (Math.random() - .5) * shake : 0;
      g.save(); g.translate(ox, 0);
      const gr = g.createLinearGradient(0, 0, 0, GROUND); gr.addColorStop(0, '#6ec6ff'); gr.addColorStop(1, '#ffe9c7'); g.fillStyle = gr; g.fillRect(-10, 0, W + 20, GROUND);
      g.fillStyle = 'rgba(255,255,255,.85)'; for (let i = 0; i < 4; i++) { const cx = ((i * 110 - t * .012 * (1 + i * .3)) % 440 + 440) % 440 - 60; g.fillRect(cx, 24 + i * 22, 36, 8); g.fillRect(cx + 8, 18 + i * 22, 20, 8); }
      g.fillStyle = '#9fb4ff'; for (let i = 0; i < 9; i++) { const bx = ((i * 52 - t * .02) % 468 + 468) % 468 - 40, bh = 30 + (i * 37 % 40); g.fillRect(bx, GROUND - bh, 30, bh); }
      for (const p of pipes) rack(p.x, 0, p.w, p.gap, true), rack(p.x, p.gap + GAP, p.w, GROUND - p.gap - GAP, false);
      g.fillStyle = '#7ccf5a'; g.fillRect(-10, GROUND, W + 20, H - GROUND); g.fillStyle = '#5fb348'; g.fillRect(-10, GROUND, W + 20, 3);
      g.fillStyle = '#4a9a3a'; for (let i = 0; i < 14; i++) g.fillRect(((i * 28 - t * .072) % 336 + 336) % 336 - 10, GROUND + 8 + (i % 3) * 6, 10, 2);
      // the drone
      g.save(); g.translate(bird.x, bird.y); g.rotate(bird.rot); g.scale(1 / bird.sy, bird.sy);
      g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(-6, 9, 12, 2);
      g.drawImage(sprite, 0, 0, sprite.width, 26, -7 - (sprite.width - 18) * 7 / 36, -11, sprite.width * 14 / 18, 20); // smaller drone
      const wy = Math.sin(t / 45) * 1.5; g.fillStyle = P.cyan; g.fillRect(-10, -3 + wy, 4, 2); g.fillRect(6, -3 - wy, 4, 2);
      g.restore();
      g.restore();
      textC(g, String(score), W / 2, 12, '#fff', 3, '#06041c');
      if (st === 'ready') { textC(g, 'TAP OR SPACE TO FLAP', W / 2, 112, '#06041c', 1); textC(g, 'TAP OR SPACE TO FLAP', W / 2 - 0, 111, '#fff', 1); }
      if (st === 'dead') { g.fillStyle = 'rgba(10,10,31,.6)'; g.fillRect(70, 56, 180, 60); textC(g, 'DRONE DOWN', W / 2, 64, '#fbbf24', 2); textC(g, `SCORE ${score}   BEST ${hi}`, W / 2, 86, '#fff', 1); if (t > 500) textC(g, 'TAP TO TRY AGAIN', W / 2, 100, P.cyan, 1); }
      textC(g, `LORE ${unlocked().length}/${LORE.length}`, 40, 4, '#06041c', 1);
    };
    const rack = (x, y, w, h, top) => {
      if (h <= 0) return;
      g.fillStyle = P.ink; g.fillRect(x - 1, y - (top ? 1 : 0), w + 2, h + 1); g.fillStyle = '#1e3a8a'; g.fillRect(x, y, w, h);
      g.fillStyle = '#2f55b8'; g.fillRect(x + 2, y, 3, h);
      for (let j = 0; j < h - 6; j += 8) { g.fillStyle = '#0f1f55'; g.fillRect(x + 6, y + 3 + j, w - 9, 5); g.fillStyle = ((t / 300 | 0) + j) % 3 ? P.cyan : P.pink; g.fillRect(x + w - 7, y + 5 + j, 2, 1); }
      const ey = top ? y + h - 5 : y; g.fillStyle = P.pink; g.fillRect(x - 2, ey, w + 4, 5); g.fillStyle = P.ink; g.fillRect(x - 2, top ? ey + 4 : ey, w + 4, 1);
    };
    const loop = now => { if (closed) return; const dt = Math.min(.05, (now - last) / 1000); last = now; step(dt); draw(); raf = requestAnimationFrame(loop); };
    const key = e => { if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Enter') { e.preventDefault(); e.stopPropagation(); if (!card.hidden) { if (e.code !== 'Space' || true) btn.click(); } else flap(); } };
    const ptr = e => { if (e.target.closest('button')) return; e.preventDefault(); flap(); };
    const close = () => { if (closed) return; closed = true; cancelAnimationFrame(raf); window.removeEventListener('keydown', key, true); overlay.removeEventListener('pointerdown', ptr); offEsc(); overlay.hidden = true; overlay.innerHTML = ''; res({ best: hi }); };
    const offEsc = on('esc', close);
    window.addEventListener('keydown', key, true); overlay.addEventListener('pointerdown', ptr);
    overlay.querySelector('#arcx').addEventListener('click', e => { e.stopPropagation(); close(); });
    raf = requestAnimationFrame(loop);
    window.__arcade = { pos: () => ({ y: bird.y, vy: bird.vy, pipes: pipes.map(p => [p.x, p.gap]) }), unlock: n => { const it = LORE.find(l => l.score === n); if (it) { onUnlock(it); showLore(it); } }, score: () => score, state: () => st, flap, set: n => { score = n; }, close };
  });
}
