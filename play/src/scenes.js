// Scenes beyond the walkable world: bait and switch, battle encounter, founder cinematic, room sim panel, avatar studio.
import { LW as W, LH as H, T, clock, wait, after, tween, on, emit, fx, fadeIn, fadeOut, setScene, getScene, session, RM } from './core.js';
import { P, person, drawPerson, sheet, text, textC, textW, LOOKS, hash } from './art.js';
import { S } from '../data/script.js';
import { SHEET } from '../data/spreadsheet.js';
import { say, cue, closeDialogue, choose, ui } from './ui.js';
import { audio } from './audio.js';
import { CONFIG } from './config.js';

const $ = s => document.querySelector(s);
const overlay = $('#overlay');
const big = (look, dir, sc = 3, f = 0) => { const s = person(look, dir, f); const c = document.createElement('canvas'); c.width = s.width * sc; c.height = s.height * sc; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s, 0, 0, c.width, c.height); return c; };

// =====================================================================
// C. THE 25-SECOND BAIT AND SWITCH (cue sheet on the scheduler)
// =====================================================================
function sheetRows() {
  const rows = []; let id = 1, k = 0;
  for (let pass = 0; pass < 2; pass++) for (const sec in SHEET.SECTIONS) SHEET.SECTIONS[sec].forEach(rq => rows.push([`R-${String(id++).padStart(3, '0')}`, pass ? sec + ' (Rm 2.0' + (1 + k % 3) + ')' : sec, rq[0], rq[1], rq[2], rq[3], rq[4], rq[5], rq[6], '', ['£', '££', '£££', ''][k % 4], SHEET.OWNERS[k % SHEET.OWNERS.length], SHEET.STATUS[k++ % SHEET.STATUS.length], SHEET.COMMENTS[k % SHEET.COMMENTS.length]]));
  return rows;
}
export async function baitSwitch(lookKey, replay) {
  const rows = sheetRows();
  const head = SHEET.COLS.map((c, i) => `<th>${String.fromCharCode(66 + i)}</th>`).join('');
  overlay.innerHTML = `<div id="bait" class="enter">
    <div class="xltop"><span class="xlapp">▦</span> Room_Spec_v12_FINAL(3).xlsx <span class="xlro">Read-only</span></div>
    <div class="xlrib"><span>File</span><span>Home</span><span>Insert</span><span>Formulas</span><span>Data</span><span>Review</span></div>
    <div class="xlbar"><span class="xlref">K7</span><span class="xlfx">fx</span><span class="xlf">=IF(ISBLANK(J7),"TBC",VLOOKUP(J7,Options!A:F,3,FALSE))</span></div>
    <div class="xlgrid"><table><thead><tr><th class="corner"><canvas id="baitSprites" width="40" height="28"></canvas></th>${head}</tr></thead>
    <tbody>${rows.map((r, i) => `<tr><th>${i + 2}</th>${r.map((v, j) => `<td class="${j === 12 ? 'st ' + (v === 'Agreed' ? 'ok' : v === 'TBC' ? 'tbc' : 'aw') : ''}${j === 13 && v === '#REF!' ? 'ref' : ''}">${v || ''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
    <div class="xltabs"><span class="on">Spec</span><span>Options</span><span>Costs (old)</span><span>Sheet7</span></div>
    <div id="baitFly"></div>
    <div id="baitCrt" hidden><div class="crtin"><img id="baitImg" alt="The room sim building a meeting room"><span class="rec">● ROOM SIM</span></div></div>
    ${replay ? '<button id="baitSkip" class="opt small" type="button">Skip ▶▶</button>' : ''}
  </div>`;
  overlay.hidden = false;
  // the visitor and Nixy, drawn big, fly into the corner cell
  const fly = $('#baitFly'); const a = big(lookKey, 0, 4), b = big('nixy', 0, 4); fly.append(a, b);
  const sp = $('#baitSprites').getContext('2d'); sp.imageSmoothingEnabled = false; drawPerson(sp, person(lookKey, 0), 2, 2); drawPerson(sp, person('nixy', 0), 20, 2);
  let skipR = null; const skipP = () => new Promise(r => skipR = r);
  const offAct = on('act', () => skipR?.()); const tap = () => skipR?.(); overlay.addEventListener('pointerdown', tap);
  let skipped = false; $('#baitSkip')?.addEventListener('click', e => { e.stopPropagation(); skipped = true; skipR?.(); });
  const seg = async ms => { await Promise.race([wait(ms), skipP()]); };
  const t0 = clock.t;
  requestAnimationFrame(() => $('#bait').classList.remove('enter'));
  fly.classList.add('go');                                         // 0:00 shrink into the corner
  await seg(3000); if (skipped) return endBait(t0);
  cue(S.bait[1].line); $('#bait').classList.add('scroll');         // 0:03 boring spreadsheet
  await seg(8000); if (skipped) return endBait(t0);
  $('#bait').classList.add('glitch'); audio.sfx('swirl');          // 0:11 glitch into the CRT
  await wait(350); $('#bait').classList.remove('glitch'); $('#baitCrt').hidden = false;
  let fi = 0; const img = $('#baitImg'); img.src = `assets/capture/room-00-legacy.webp`;
  const frames = ['00-legacy', '01-survey', '02-design', '03-cabling', '04-install1', '05-install2', '06-install3', '07-test', '08-live', '09-final'];
  const flip = () => { fi = Math.min(frames.length - 1, fi + 1); img.src = `assets/capture/room-${frames[fi]}.webp`; if (fi < frames.length - 1) stopFlip = after(860, flip); };
  let stopFlip = after(860, flip);
  cue(S.bait[2].line);
  await seg(8650); if (skipped) { stopFlip(); return endBait(t0); }
  cue(S.bait[3].line);                                              // 0:20 workshop line
  await seg(5000); stopFlip();
  return endBait(t0);
  async function endBait(start) {
    offAct(); overlay.removeEventListener('pointerdown', tap);
    const dur = clock.t - start; window.__baitMs = dur;
    await fadeOut(300); overlay.hidden = true; overlay.innerHTML = ''; closeDialogue(); await fadeIn(300);
    return dur;
  }
}

// =====================================================================
// G. THE TALL-GRASS ENCOUNTER (a battle-screen layout, original art)
// =====================================================================
export function encounterScene(lookKey) {
  const s = {
    legacy: true, t: 0, yIn: 0,
    update(dt) { this.t += dt; },
    render(g) {
      const t = this.t;
      const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#1e1b4b'); sky.addColorStop(.55, '#9d174d'); sky.addColorStop(1, '#f59e0b'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.08)'; for (let i = 0; i < 6; i++) g.fillRect(((t / 40 + i * 70) % 380) - 40, 18 + i * 9, 50, 2);
      g.fillStyle = '#fde68a'; g.beginPath(); g.arc(250, 120, 34, Math.PI, 0); g.fill();
      g.fillStyle = '#134e4a'; g.fillRect(0, 118, W, 62); g.fillStyle = '#0f766e'; for (let x = 0; x < W; x += 6) g.fillRect(x, 116 + (x % 12 ? 0 : 2), 3, 4);
      // platforms
      const ell = (x, y, rx, ry, c) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); };
      ell(232, 86, 52, 12, '#0f766e'); ell(232, 84, 48, 9, '#2f9e86');
      ell(84, 150, 64, 14, '#0f766e'); ell(84, 148, 60, 11, '#2f9e86');
      // Yasin slides in from the right, the visitor and Nixy from the left
      const k = Math.min(1, t / 700), slide = (1 - k) * 160;
      const yb = Math.round(Math.sin(t / 400) * 1.5);
      // Yasin and his wolf charge in, skid to a stop (squash), then stand side by side; the visitor and Nixy slide in from the left
      const duo = sheet('battle-yasin-wolf'), charge = sheet('battle-charge');
      if (duo) {
        const land = Math.max(0, Math.min(1, (t - 700) / 260)), sq = land > 0 && land < 1 ? Math.sin(land * Math.PI) * .08 : 0;
        if (t < 700 && charge) g.drawImage(charge, Math.round(232 - charge.width / 2 + slide), 88 - charge.height);
        else { const w = Math.round(duo.width * (1 + sq)), h = Math.round(duo.height * (1 - sq)); g.drawImage(duo, Math.round(232 - w / 2), 88 - h + (t > 960 ? yb : 0), w, h); }
      } else drawPerson(g, person('yasin', 0, 0), 232 - 27 + slide, 86 - 74 + yb, 54, 78);
      const hb = lookKey === 'hero' && sheet('battle-hero-back'), nb = sheet('battle-nixy-back'), bob = Math.round(Math.sin(t / 300) * 1.5);
      if (hb) g.drawImage(hb, Math.round(64 - hb.width / 2 - slide), 150 - hb.height); else drawPerson(g, person(lookKey, 3, 0), 56 - slide, 148 - 80, 54, 78);
      if (nb) g.drawImage(nb, Math.round(112 - nb.width / 2 - slide), 152 - nb.height + bob); else drawPerson(g, person('nixy', 3, 0), 104 - slide, 148 - 72 + bob, 48, 70);
      // status boxes
      const box = (x, y, name, lv, stat, frac, col) => {
        g.fillStyle = P.ink; g.fillRect(x - 2, y - 2, 104, 26); g.fillStyle = '#f8fafc'; g.fillRect(x, y, 100, 22);
        text(g, name, x + 4, y + 3, P.ink); text(g, lv, x + 96 - textW(lv), y + 3, P.ink);
        text(g, stat, x + 4, y + 13, '#334155'); g.fillStyle = '#334155'; g.fillRect(x + 40, y + 13, 56, 5); g.fillStyle = col; g.fillRect(x + 41, y + 14, 54 * frac, 3);
      };
      box(18, 14, 'FOUNDER', 'LV30', 'VISION', 1, P.ok);
      box(204, 100, 'YOU', 'LV1', 'CURIOSITY', Math.min(1, .35 + t / 9000), P.cyan);
    },
  };
  return s;
}
export async function swirl() {
  audio.sfx('swirl');
  for (let i = 0; i < 3; i++) { await tween(90, k => fx.flash = k * .9); await tween(90, k => fx.flash = .9 - k * .9); }
  await tween(380, k => { fx.fade = k; fx.shake = 3 * (1 - k); }); fx.shake = 0;
}

// =====================================================================
// M. THE FOUNDER'S FULL PITCH: a letterboxed, click-through cinematic
// =====================================================================
const SC = {};
const lbx = g => { g.fillStyle = '#000'; g.fillRect(0, 0, W, 12); };
SC.avatars = {
  props: [0, 1, 2, 3].map(i => ({ x: 50 + i * 58, y: 64, w: 44, h: 44, id: 'av' + i })),
  draw(g, t, st) {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1840'); bg.addColorStop(1, '#3b0764'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2e1065'; g.fillRect(0, 108, W, 72); for (let x = 0; x < W; x += 20) { g.fillStyle = '#3b0764'; g.fillRect(x, 108, 1, 72); }
    ['TEAM', 'PROJECT', 'DEPARTMENT'].forEach((l, i) => {
      const on = t > 500 + i * 650; const x = 30 + i * 96;
      g.fillStyle = P.ink; g.fillRect(x - 2, 16, 72, 40); g.fillStyle = on ? '#0e7490' : '#111827'; g.fillRect(x, 18, 68, 36);
      if (on) { drawPerson(g, person(['v1', 'nixy', 'v3'][i], 0), x + 25, 20, 18, 14, 0, 14); textC(g, l + ' AVATAR', x + 34, 46, P.white); }
    });
    if (t > 2400) st.avs.forEach((im, i) => {
      if (!im.complete) return; const k = Math.min(1, (t - 2400 - i * 200) / 400); if (k <= 0) return;
      const x = 50 + i * 58, y = 64 + (1 - k) * 40, c = st.avCol[i] || P.cyan;
      const p = (Math.sin(t / 300 + i) + 1) / 2; g.fillStyle = c; g.globalAlpha = .4 + .5 * p; g.fillRect(x - 3, y - 3, 50, 50); g.globalAlpha = 1;
      g.fillStyle = P.ink; g.fillRect(x - 1, y - 1, 46, 46); g.drawImage(im, x, y, 44, 44);
    });
  },
  click(st, p) { const i = +p.id.slice(2); const cols = [P.cyan, P.pink, P.amber, P.ok, P.grape]; st.avCol[i] = cols[(cols.indexOf(st.avCol[i] || P.cyan) + 1) % cols.length]; audio.sfx('select'); },
};
SC.careers = {
  props: [{ x: 150, y: 14, w: 20, h: 100, id: 'seam' }],
  draw(g, t, st) {
    const gap = st.phase ? Math.max(0, 40 - (t - st.phaseAt) / 25) : 40; if (st.snap) st.gap = 0;
    const gp = st.snap ? 0 : gap;
    // boardroom (left)
    g.fillStyle = '#0c1a33'; g.fillRect(0, 0, 160 - gp / 2, H); g.fillStyle = '#16325c'; g.fillRect(10, 18, 130 - gp / 2, 50);
    g.fillStyle = '#0f172a'; g.fillRect(30, 24, 70, 30); g.fillStyle = P.cyan; g.fillRect(34, 28, 20, 3); g.fillRect(34, 34, 40, 2);
    g.fillStyle = '#4c3d8a'; g.fillRect(20, 84, 110 - gp / 2, 14);
    // classroom (right)
    const rx = 160 + gp / 2; g.fillStyle = '#2b1606'; g.fillRect(rx, 0, W - rx, H); g.fillStyle = '#14532d'; g.fillRect(rx + 12, 18, 120, 44); text(g, 'Y7 Y8 Y9', rx + 40, 34, '#e5e7eb');
    for (let i = 0; i < 3; i++) { g.fillStyle = '#a16207'; g.fillRect(rx + 16 + i * 40, 84, 26, 8); const lab = 'Y' + (7 + i); if (t > 400 + i * 400) { g.fillStyle = P.amber; g.fillRect(rx + 20 + i * 40, 70, 18, 9); text(g, lab, rx + 23 + i * 40, 72, P.ink); } }
    // seam
    if (gp < 2) { const p = (Math.sin(t / 200) + 1) / 2; g.fillStyle = P.cyan; g.globalAlpha = .5 + .5 * p; g.fillRect(157, 0, 6, H); g.globalAlpha = 1; g.fillStyle = P.ink; g.fillRect(118, 50, 84, 16); textC(g, 'POTARA', 160, 54, P.cyan, 1); }
    else { g.fillStyle = '#000'; g.fillRect(160 - gp / 2, 0, gp, H); }
    const yx = 60 + ((t / 30) % 200); g.drawImage(person('yasin', yx % 200 < 100 ? 2 : 1, (t / 200 | 0) % 2 + 1), Math.round(yx > 160 ? 320 - yx : yx), 96);
  },
  click(st) { st.snap = true; audio.sfx('build'); },
};
SC.film = {
  props: [{ x: 30, y: 60, w: 40, h: 40, id: 'reel' }],
  draw(g, t, st) {
    g.fillStyle = '#05030f'; g.fillRect(0, 0, W, H); for (let i = 0; i < 40; i++) { g.fillStyle = hash(i, 2) > .8 ? P.white : '#6d28d9'; g.fillRect(hash(i, 1) * W | 0, hash(i, 3) * 60 | 0, 1, 1); }
    g.fillStyle = '#7c2d12'; g.fillRect(110, 20, 120, 90); g.fillStyle = P.ink; g.fillRect(116, 26, 108, 22);
    'HOME'.split('').forEach((ch, i) => { const on = t > 300 + i * 450; textC(g, ch, 136 + i * 22, 31, on ? P.amber : '#3f2a1d', 3); });
    for (let i = 0; i < 14; i++) { g.fillStyle = (t / 150 + i) % 2 < 1 ? P.amber : '#78350f'; g.fillRect(114 + i * 8, 50, 3, 3); }
    g.fillStyle = '#e5e7eb'; g.fillRect(124, 58, 92, 46); for (let i = 0; i < 18; i++) { g.fillStyle = ['#a855f7', '#22d3ee', '#f472b6', '#fbbf24'][i % 4]; const x = 128 + (i % 6) * 14, y = 62 + ((i / 6) | 0) * 14; g.fillRect(x + 4, y, 4, 4); g.fillRect(x + 2, y + 5, 8, 6); }
    st.rot = (st.rot || 0) + (st.fast ? .25 : .06);
    g.save(); g.translate(50, 80); g.rotate(st.rot); g.fillStyle = '#9ca3af'; g.beginPath(); g.arc(0, 0, 18, 0, 7); g.fill(); g.fillStyle = '#111827'; for (let i = 0; i < 5; i++) { g.rotate(Math.PI * 2 / 5); g.beginPath(); g.arc(0, -10, 4, 0, 7); g.fill(); } g.restore();
    if (t > 2000) { g.fillStyle = P.ink; g.fillRect(232, 66, 84, 26); textC(g, 'AS FEATURED ON', 274, 70, P.white); textC(g, 'THE BBC AND', 274, 77, P.amber); textC(g, 'VICE NEWS', 274, 84, P.amber); }
  },
  click(st) { st.fast = !st.fast; audio.sfx('select'); },
};
SC.doom = {
  props: [0, 1, 2, 3, 4].map(i => ({ x: 20 + i * 60, y: 18, w: 46, h: 26, id: 'c' + i })),
  draw(g, t, st) {
    const k = st.phase ? Math.min(1, (t - st.phaseAt) / 5000) : 0;
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, k > .5 ? '#1e3a8a' : '#374151'); sky.addColorStop(1, k > .3 ? '#f59e0b' : '#6b7280'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fde68a'; g.beginPath(); g.arc(160, 120, 10 + k * 60, Math.PI, 0); g.fill();
    g.fillStyle = '#1f2937'; g.fillRect(0, 118, W, 62);
    for (let i = 0; i < 5; i++) {
      if (st.popped?.[i]) { if (t - st.popped[i] < 500) { g.fillStyle = P.amber; for (let j = 0; j < 8; j++) g.fillRect(43 + i * 60 + Math.cos(j) * (t - st.popped[i]) / 20, 30 + Math.sin(j) * (t - st.popped[i]) / 25, 2, 2); } continue; }
      const x = 20 + i * 60 + Math.sin(t / 900 + i) * 6 - k * (i < 2 ? 80 : -80), y = 18 + (i % 2) * 6;
      g.fillStyle = '#4b5563'; g.fillRect(x, y + 6, 46, 16); g.fillRect(x + 8, y, 30, 10); g.fillStyle = '#9ca3af'; g.fillRect(x + 14, y + 10, 3, 3); g.fillRect(x + 29, y + 10, 3, 3); g.fillRect(x + 17, y + 17, 12, 1);
    }
    drawPerson(g, person('yasin', 0), 145, 76, 36, 52);
  },
  click(st, p) { (st.popped ||= {})[+p.id.slice(1)] = st.t; audio.sfx('coin'); },
};
SC.tools = {
  props: [0, 1, 2, 3, 4].map(i => ({ x: 6 + i * 63, y: 18, w: 56, h: 84, id: 't' + i })),
  draw(g, t, st) {
    g.fillStyle = '#0a0a1f'; g.fillRect(0, 0, W, H);
    const lit = Math.min(5, Math.floor(t / 900) + 1);
    for (let i = 0; i < 5; i++) {
      const x = 6 + i * 63, on = i < lit || (st.poked?.[i]);
      g.fillStyle = on ? '#1a1840' : '#0f0d26'; g.fillRect(x, 18, 56, 84); g.fillStyle = on ? P.grapeD : '#1f1b3a'; g.fillRect(x, 18, 56, 1);
      const ox = x + 14, oy = 44; g.fillStyle = on ? '#e5e7eb' : '#374151';
      g.fillRect(ox + 4, oy, 8, 8); g.fillRect(ox + 3, oy + 9, 10, 18); g.fillRect(ox + 4, oy + 27, 3, 12); g.fillRect(ox + 9, oy + 27, 3, 12);
      const wob = st.poked?.[i] ? Math.sin(t / 60) * 3 : 0; const tx = ox + 16, ty = oy + 10 + wob;
      g.fillStyle = on ? P.amber : '#4b5563';
      if (i === 0) { g.fillRect(tx, ty, 8, 6); }
      if (i === 1) { g.fillRect(tx, ty + 2, 3, 14); g.fillRect(tx - 3, ty, 10, 4); }
      if (i === 2) { g.fillRect(tx, ty - 4, 2, 14); g.fillRect(tx, ty + 10, 2, 2); }
      if (i === 3) { g.fillRect(tx - 2, ty + 6, 18, 6); g.fillStyle = on ? P.ink : '#1f2937'; for (let j = 0; j < 6; j++) g.fillRect(tx - 1 + j * 3, ty + 7, 2, 2); }
      if (i === 4) { drawPerson(g, person('nixy', 1), tx - 2, ty - 12); }
      if (on) { g.fillStyle = P.cyan; g.globalAlpha = .7; g.fillRect(ox + 13, ty + 2, tx - ox - 13, 1); g.globalAlpha = 1; }
      textC(g, ['STONE', 'HAMMER', 'PEN', 'KEYS', 'NIXY'][i], x + 28, 92, on ? P.cyan : '#374151');
    }
    if (st.found) { g.fillStyle = P.amber; g.globalAlpha = .25; g.fillRect(0, 18, W, 84); g.globalAlpha = 1; }
    g.fillStyle = P.ink; g.fillRect(40, 106, 240, 10); textC(g, 'PETER SLOTERDIJK: THE PRACTISING ANIMAL', 160, 108, P.amber);
  },
  click(st, p) { (st.poked ||= {})[+p.id.slice(1)] = true; audio.sfx('select'); },
};
SC.means = {
  props: [],
  draw(g, t, st) {
    g.fillStyle = '#05030f'; g.fillRect(0, 0, W, H);
    const press = Math.min(1, t / 2500), comp = Math.max(0, Math.min(1, (t - 2600) / 2500));
    g.fillStyle = '#1f2937'; g.fillRect(40 + press * 40, 30, 240 - press * 80, 90);
    g.fillStyle = '#0b0a1e'; g.fillRect(0, 0, 40 + press * 40, H); g.fillRect(280 - press * 40, 0, 40 + press * 40, H);
    { const ys = person('yasin', 0, 0, true); if (ys.width <= 18) { g.fillStyle = '#92400e'; g.fillRect(140, 96, 40, 10); } g.drawImage(ys, 160 - (ys.width >> 1), 108 - ys.height); }
    // the thought bubble
    g.fillStyle = '#f8fafc'; g.beginPath(); g.ellipse(160, 46, 70 + comp * 10, 26 + comp * 6, 0, 0, 7); g.fill(); g.fillRect(156, 74, 4, 4); g.fillRect(160, 80, 3, 3);
    g.save(); g.beginPath(); g.ellipse(160, 46, 66 + comp * 10, 23 + comp * 6, 0, 0, 7); g.clip();
    if (st.townImg) {
      const cols = Math.floor(comp * 40);
      g.drawImage(st.townImg, 0, 0, st.townImg.width, st.townImg.height, 90, 18, 140, 112);
      g.fillStyle = '#f8fafc'; for (let i = cols; i < 40; i++) g.fillRect(90 + i * 3.5, 18, 4, 60);
    }
    g.restore();
  },
};
SC.pullback = {
  props: [],
  draw(g, t, st) {
    g.fillStyle = '#05030f'; g.fillRect(0, 0, W, H);
    if (!st.townImg) return;
    const k = Math.min(1, t / 2600), e = 1 - Math.pow(1 - k, 3);
    const fitSc = 112 / st.townImg.height, sc = 1.2 + (fitSc - 1.2) * e;
    const iw = st.townImg.width * sc, ih = st.townImg.height * sc;
    // keep the plaza centre steady while pulling back
    const fx_ = 36 * 16 + 8, fy_ = 26 * 16 + 8, cx = 160 - fx_ * sc + (fx_ * sc - iw / 2) * e, cy = 70 - fy_ * sc + (fy_ * sc - ih / 2) * e;
    g.drawImage(st.townImg, cx, cy, iw, ih);
    if (k >= 1) {
      const P2 = ([x, y]) => [cx + (x * 16 + 8) * sc, cy + (y * 16 + 8) * sc];
      const n = Math.min(st.route.length, Math.floor((t - 2600) / 8));
      g.strokeStyle = P.cyan; g.lineWidth = 2; g.shadowColor = P.cyan; g.shadowBlur = 6; g.beginPath();
      st.route.slice(0, n).forEach((pt, i) => { const [px, py] = P2(pt); i ? g.lineTo(px, py) : g.moveTo(px, py); }); g.stroke(); g.shadowBlur = 0;
      st.sites.forEach(([x, y, found]) => { const [px, py] = P2([x, y]); g.fillStyle = P.ink; g.fillRect(px - 3, py - 3, 7, 7); g.fillStyle = found ? P.amber : P.grape; g.fillRect(px - 2, py - 2, 5, 5); });
      [[28, 19], [45, 29], [15, 27], [32, 34]].forEach(([x, y]) => { const [px, py] = P2([x, y]); const pulse = (Math.sin(t / 250 + x) + 1) / 2; g.fillStyle = `rgba(244,114,182,${.4 + pulse * .6})`; g.fillRect(px - 2, py - 4, 5, 5); });
      drawPerson(g, person('nixy', 0, (t / 250 | 0) % 2 ? 1 : 2), 262, 60 + Math.round(Math.sin(t / 150) * 2), 36, 52);
      g.fillStyle = P.ink; g.fillRect(250, 116, 64, 9); textC(g, 'YOUR ROUTE', 282, 118, P.cyan);
    }
  },
};

export function founderScene(state) {
  const sc = {
    legacy: true, key: 'avatars', t: 0, state,
    set(k) { this.key = k; this.t = 0; state.t = 0; state.phase = 0; },
    update(dt) { this.t += dt; state.t = this.t; },
    render(g) {
      SC[this.key].draw(g, this.t, state); lbx(g);
      // Nixy fidgets in the corner
      const n = (this.t / 1800 | 0) % 4; const em = ['', '♥', '!', '♥'][n];
      if (this.key !== 'pullback') { drawPerson(g, person('nixy', n % 2 ? 1 : 0, 0), 296, 14); if (em) { g.fillStyle = P.white; g.fillRect(286, 14, 7, 7); text(g, em, 288, 15, P.pink); } }
      textC(g, 'ESC TO LEAVE', 160, 4, '#6b7280');
    },
    hit(p) { for (const pr of SC[this.key].props) if (p.x >= pr.x && p.x <= pr.x + pr.w && p.y >= pr.y && p.y <= pr.y + pr.h) { SC[this.key].click?.(state, pr); return true; } return false; },
  };
  return sc;
}

// =====================================================================
// I. ROOM SIM PANEL: Nixy Live's three.js room (lazy) or recorded stills
// =====================================================================
let roomReady = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
const STILL = { legacy: '00-legacy', survey: '01-survey', design: '02-design', cabling: '03-cabling', install1: '04-install1', install2: '05-install2', install3: '06-install3', test: '07-test', live: '08-live', final: '09-final' };
export const roomPanel = {
  mode: 'img',
  async open() {
    overlay.innerHTML = `<div id="roomp"><div class="crtin"><canvas id="gl"></canvas><img id="roomImg" alt="" hidden><div id="labels"></div><span class="rec">● ROOM SIM <b id="roomState">LEGACY</b></span><div id="build" hidden></div></div></div>`;
    overlay.hidden = false;
    const weak = matchMedia('(pointer:coarse)').matches || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    if (!weak) {
      try {
        roomReady ||= (async () => { window.$ ||= s => document.querySelector(s); window.sfx ||= { pop() { }, scan() { }, tick() { } }; await loadScript('vendor/three.min.js'); await loadScript('vendor/room3d.js'); })();
        await Promise.race([roomReady, new Promise((_, r) => setTimeout(() => r('timeout'), 6000))]);
        if (window.Room && window.Room.init()) { this.mode = '3d'; window.Room.on(true); window.Room.state('legacy'); window.Room.cam('hero'); }
      } catch (e) { this.mode = 'img'; }
    }
    if (this.mode !== '3d') { $('#gl').hidden = true; const im = $('#roomImg'); im.hidden = false; im.src = 'assets/capture/room-00-legacy.webp'; im.alt = 'The meeting room, before'; }
  },
  async apply(state, cam) {
    const b = $('#build'); if (b) { b.hidden = false; b.classList.remove('go'); void b.offsetWidth; b.classList.add('go'); audio.sfx('build'); }
    await wait(450);
    if (this.mode === '3d' && window.Room) { window.Room.state(state); if (cam) window.Room.cam(cam); }
    else { const im = $('#roomImg'); if (im) im.src = `assets/capture/room-${STILL[state] || '08-live'}.webp`; }
    const rs = $('#roomState'); if (rs) rs.textContent = state.replace(/\d/, '').toUpperCase();
    await wait(400); if (b) b.hidden = true;
  },
  snapshot() { try { return this.mode === '3d' ? window.Room.snapshot() : ''; } catch (e) { return ''; } },
  close() { if (this.mode === '3d' && window.Room) window.Room.on(false); overlay.hidden = true; overlay.innerHTML = ''; },
};

// =====================================================================
// J. VIRTUAL FOREGROUND: the cassette, the avatar ad, the vibe picker
// =====================================================================
export const avatarStudio = {
  async ad() {
    overlay.innerHTML = `<div id="tvp"><div class="crtin tvin"><div class="cass"></div><div class="avgrid" hidden>${['khulan', 'jeyoon', 'sanjar', 'meiling'].map((n, i) => `<figure style="--d:${i * .25}s"><img src="assets/avatar-${n}.png" alt="Made-to-measure avatar concept ${i + 1}"><figcaption>${['OPERATIONS LEAD', 'CREATIVE DIRECTOR', 'ENGINEER', 'FINANCE DIRECTOR'][i]}</figcaption></figure>`).join('')}</div><span class="rec">▶ PLAY · POTARA AVATARS</span></div></div>`;
    overlay.hidden = false; audio.sfx('door');
    await wait(1400); overlay.querySelector('.cass').remove(); overlay.querySelector('.avgrid').hidden = false;
  },
  async picker() {
    const scheme = await choose([{ t: 'Neon grape', v: ['#a855f7', '#22d3ee'], primary: true }, { t: 'Ocean cyan', v: ['#0891b2', '#f472b6'], primary: true }, { t: 'Sunset amber', v: ['#f59e0b', '#be185d'], primary: true }, { t: 'Rose pink', v: ['#f472b6', '#fbbf24'], primary: true }], ['nixy', 'Pick a colour scheme.']);
    const mood = await choose([{ t: 'Corporate', v: 'corp', primary: true }, { t: 'Balanced', v: 'bal', primary: true }, { t: 'Playful', v: 'play', primary: true }], ['nixy', 'Corporate, playful, or somewhere in between?']);
    const glow = await choose([{ t: 'Earpiece', v: 'ear', primary: true }, { t: 'Visor', v: 'visor', primary: true }, { t: 'Pendant', v: 'pend', primary: true }, { t: 'Tie pin', v: 'pin', primary: true }], ['nixy', 'And the one detail that glows?']);
    return this.card(scheme, mood, glow);
  },
  card([c1, c2], mood, glow) {
    const look = { skin: '#e8b48a', hair: mood === 'corp' ? '#1f2937' : c2, hairD: '#111', hairL: '#fff', style: mood === 'corp' ? 'short' : mood === 'bal' ? 'bun' : 'bob', top: mood === 'corp' ? '#1e293b' : c1, shade: '#0f172a', sleeve: mood === 'corp' ? '#1e293b' : c1, legs: '#0f172a', shoes: '#000', visor: glow === 'visor' ? 1 : 0, pod: glow === 'ear' ? 1 : 0, gem: glow === 'pend' ? 1 : 0, mouth: '#9f1239' };
    const key = 'custom' + Math.round(clock.t); LOOKS[key] = look;
    const c = document.createElement('canvas'); c.width = 240; c.height = 135; const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
    const bg = g.createLinearGradient(0, 0, 240, 135); bg.addColorStop(0, '#0a0a1f'); bg.addColorStop(1, c1); g.fillStyle = bg; g.fillRect(0, 0, 240, 135);
    g.fillStyle = 'rgba(255,255,255,.06)'; for (let y = 0; y < 135; y += 3) g.fillRect(0, y, 240, 1);
    const s = person(key, 0, 0); drawPerson(g, s, 18, 14, 72, 104);
    if (glow === 'pin') { g.fillStyle = c2; g.fillRect(50, 70, 6, 6); g.globalAlpha = .4; g.fillRect(46, 66, 14, 14); g.globalAlpha = 1; }
    g.fillStyle = 'rgba(6,4,28,.78)'; g.fillRect(98, 12, 136, 112);
    text(g, 'AVATAR CONCEPT', 104, 20, c2, 1); text(g, (session.business || 'YOUR BUSINESS').slice(0, 22), 104, 34, '#ffffff', 2);
    text(g, 'VIBE: ' + { corp: 'CORPORATE', bal: 'BALANCED', play: 'PLAYFUL' }[mood], 104, 60, '#e5e7eb'); text(g, 'GLOW: ' + { ear: 'EARPIECE', visor: 'VISOR', pend: 'PENDANT', pin: 'TIE PIN' }[glow], 104, 70, '#e5e7eb');
    text(g, 'MADE TO MEASURE BY POTARA', 104, 118, c2);
    const url = c.toDataURL('image/png');
    overlay.innerHTML = `<div id="tvp"><div class="crtin tvin"><img class="avcard" src="${url}" alt="Your avatar concept card"><a class="opt small dl" href="${url}" download="potara-avatar-concept.png">Download card ⤓</a></div></div>`;
    overlay.hidden = false; audio.sfx('win');
    return url;
  },
  close() { overlay.hidden = true; overlay.innerHTML = ''; },
};

// =====================================================================
// Lead capture: posts to a static-friendly form service, or demo mode.
// =====================================================================
export async function submitLead(payload) {
  const body = { source: 'nixy-world', timestamp: new Date().toISOString(), ...payload };
  if (!CONFIG.FORM_ENDPOINT) { console.info('[Nixy demo mode] Would send:', body); return 'demo'; }
  if (CONFIG.FORM_ACCESS_KEY) body.access_key = CONFIG.FORM_ACCESS_KEY;
  try {
    const r = await Promise.race([fetch(CONFIG.FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) }), new Promise((_, rej) => setTimeout(() => rej('timeout'), 8000))]);
    return r.ok ? 'sent' : 'failed';
  } catch (e) { return 'failed'; }
}
