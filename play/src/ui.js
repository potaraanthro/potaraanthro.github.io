// UI: dialogue box (typewriter, portraits, choices, inputs), HUD, cards, menu. DOM over the canvas for crisp text and accessibility.
import { on, emit, after, clock, fill, save, wait } from './core.js';
import { SPEAKERS, FRAGMENTS, READING_LIST, S } from '../data/script.js';
import { portrait } from './art.js';
import { audio } from './audio.js';
import { CONFIG } from './config.js';

const $ = s => document.querySelector(s);
const dlg = $('#dlg'), tag = $('#dlgTag'), line = $('#dlgLine'), opts = $('#dlgOpts'), por = $('#dlgPor'), next = $('#dlgNext'), live = $('#live');
const NIXY_IMG = 'assets/nixy.webp';
const YAS = { neutral: 'assets/sprites/yasin-neutral.png', smile: 'assets/sprites/yasin-smile.png', talk: 'assets/sprites/yasin-talk.png' };

let typing = null, waiting = null, current = null, choosing = false;
// Red X: character conversations can be closed at any time. Pending dialogue promises reject with DialogueExit; flows catch it.
export class DialogueExit extends Error { constructor() { super('dialogue-exit'); this.name = 'DialogueExit'; } }
const rejecters = new Set(); const xBtn = $('#dlgX'); let exitable = false;
export function setExitable(v) { exitable = !!v; if (xBtn) xBtn.hidden = !(exitable && !dlg.hidden); }
function exitNow() { if (!exitable) return; closeDialogue(); const rs = [...rejecters]; rejecters.clear(); rs.forEach(j => j(new DialogueExit())); emit('dlgx'); }
xBtn?.addEventListener('click', e => { e.stopPropagation(); exitNow(); });
on('esc', () => { if (exitable && !dlg.hidden) exitNow(); });
const pend = fn => new Promise((res, rej) => { rejecters.add(rej); fn(v => { rejecters.delete(rej); res(v); }); });
export const uiOpts = { canvasAdvance: true };
export const ui = {
  get busy() { return !dlg.hidden && (!!waiting || !!typing || choosing); },
  get open() { return !dlg.hidden; },
};

function split(text, max = 104) {
  if (text.length <= max) return [text];
  const parts = text.match(/[^.!?]+[.!?]+["')]*\s*|[^.!?]+$/g) || [text]; const out = []; let cur = '';
  for (const p of parts) { if ((cur + p).length > max && cur) { out.push(cur.trim()); cur = p; } else cur += p; }
  if (cur.trim()) out.push(cur.trim()); return out;
}

function setSpeaker(sp, mood, look) {
  const s = SPEAKERS[sp] || SPEAKERS.sys;
  tag.textContent = s.name; tag.hidden = !s.name; tag.style.setProperty('--c', s.color);
  dlg.dataset.speaker = sp; dlg.dataset.mood = mood || '';
  if (sp === 'sys' || sp === 'user' || sp === 'you') { por.hidden = true; }
  else { por.hidden = false; const img = por.querySelector('img'); const src = sp === 'nixy' ? NIXY_IMG : sp === 'yasin' ? (mood === 'happy' || mood === 'wink' ? YAS.smile : YAS.neutral) : portrait(look || sp); img.dataset.base = src; if (img.getAttribute('src') !== src) img.src = src; img.alt = s.name; }
}

function typeOut(text, speed = 22) {
  return new Promise(res => {
    line.textContent = ''; next.hidden = true; let i = 0; const sp = dlg.dataset.speaker;
    const img = por.querySelector('img'), flap = sp === 'yasin' && img.dataset.base === YAS.neutral;
    const finish = () => { line.textContent = text; typing = null; next.hidden = false; if (flap) img.src = YAS.neutral; res(); };
    typing = { finish };
    const step = () => {
      if (!typing) return;
      i += 1; line.textContent = text.slice(0, i);
      if (i % 3 === 1 && text[i - 1] !== ' ') audio.blip(sp);
      if (flap && i % 4 === 0) img.src = (i / 4) % 2 && text[i - 1] !== ' ' ? YAS.talk : YAS.neutral; // his mouth moves as the line types
      if (i >= text.length) finish(); else after(speed, step);
    };
    after(speed, step);
  });
}

function advance() {
  if (typing) { typing.finish(); return true; }
  if (waiting) { const w = waiting; waiting = null; w(); return true; }
  return false;
}
on('act', () => { if (!dlg.hidden && !choosing) advance(); });
dlg.addEventListener('pointerdown', e => { if (e.target.closest('button,input,a,label')) return; if (!choosing) advance(); else if (typing) typing.finish(); });
on('point', () => { if (uiOpts.canvasAdvance && !dlg.hidden && !choosing) advance(); });

export async function show(sp, text, mood, look) {
  dlg.hidden = false; if (xBtn) xBtn.hidden = !exitable; setSpeaker(sp, mood, look); opts.innerHTML = ''; dlg.classList.remove('choosing');
  text = fill(text); live.textContent = (SPEAKERS[sp]?.name ? SPEAKERS[sp].name + ': ' : '') + text;
  await pend(r => typeOut(text).then(r)); // X during typing must also end the flow
}
// say: a list of [speaker, text, mood] lines, each waits for a click / Space
export async function say(lines) {
  if (!Array.isArray(lines[0])) lines = [lines];
  for (const [sp, text, mood, look] of lines) { // look: whose face to show, for speakers without their own portrait
    for (const chunk of split(fill(text))) {
      await show(sp, chunk, mood, look);
      await pend(r => waiting = r);
    }
  }
}
// line shown on a clock (no wait); used by the bait and switch
export function cue(l) { if (!l) return; show(l[0], l[1], l[2]); }
export function closeDialogue() { dlg.hidden = true; if (xBtn) xBtn.hidden = true; opts.innerHTML = ''; typing = null; waiting = null; choosing = false; }

// choose: buttons inside the box. Primary choices big, secondary smaller below.
export function choose(list, prompt, o2 = {}) {
  return pend(res => {
   (async () => {
    if (prompt) { await show(prompt[0], prompt[1], prompt[2]); }
    else if (dlg.hidden) { dlg.hidden = false; setSpeaker('user'); line.textContent = ''; }
    choosing = true; next.hidden = true; dlg.classList.add('choosing'); opts.innerHTML = '';
    const prim = document.createElement('div'); prim.className = 'prim' + (o2.grid ? ' grid' : ''); const sec = document.createElement('div'); sec.className = 'sec';
    list.forEach((o, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = o.primary ? 'opt' : 'opt small';
      b.innerHTML = `<kbd>${i + 1}</kbd>`;
      if (o.d) { // a move with a short description under its name
        const sp = document.createElement('span'); sp.className = 'ot'; const nm = document.createElement('b'); nm.textContent = o.t; const ds = document.createElement('small'); ds.textContent = o.d;
        sp.append(nm, ds); b.append(sp); b.classList.add('move');
      } else b.append(document.createTextNode(o.t));
      if (o.locked) { b.classList.add('locked'); b.setAttribute('aria-disabled', 'true'); }
      if (o.cls) b.classList.add(o.cls);
      b.addEventListener('click', () => pick(i));
      (o.primary ? prim : sec).appendChild(b);
    });
    opts.append(prim); if (sec.children.length) opts.append(sec);
    let offAct = () => { };
    const pick = i => { if (!choosing) return; choosing = false; offNum(); offAct(); opts.innerHTML = ''; dlg.classList.remove('choosing'); audio.sfx('select'); emit('chose', list[i]); res(list[i].v); };
    const offNum = on('num', n => { if (n <= list.length) pick(n - 1); });
    // Space picks the first option (the default), so a visitor can just keep pressing Space
    offAct = on('act', () => { if (choosing && list.length) pick(0); });
    setTimeout(() => opts.querySelector('button')?.focus({ preventScroll: true }), 30);
   })();
  });
}

// ask: an input inside the dialogue box (real HTML input: autofill, mobile keyboards, screen readers)
export function askInput(prompt, fields, skipText) {
  return pend(res => {
   (async () => {
    await show(prompt[0], prompt[1], prompt[2]);
    choosing = true; next.hidden = true; dlg.classList.add('choosing');
    const f = document.createElement('form'); f.className = 'askf'; f.noValidate = true;
    f.innerHTML = fields.map(fl => `<label><span>${fl.label}</span><input name="${fl.name}" type="${fl.type || 'text'}" ${fl.auto ? `autocomplete="${fl.auto}"` : ''} placeholder="${fl.ph || ''}" maxlength="${fl.max || 80}" ${fl.type === 'email' ? 'inputmode="email"' : ''}></label>`).join('')
      + `<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true"><div class="row"><button class="opt" type="submit">OK ▶</button><button class="opt small" type="button" data-skip>${skipText}</button></div><p class="err" hidden></p><p class="fine">${S.smallPrint} <a href="${CONFIG.PRIVACY_URL}" target="_blank" rel="noopener">Privacy policy</a></p>`;
    opts.innerHTML = ''; opts.append(f);
    const done = v => { choosing = false; opts.innerHTML = ''; dlg.classList.remove('choosing'); res(v); };
    f.addEventListener('submit', e => {
      e.preventDefault(); const d = Object.fromEntries(new FormData(f)); if (d.website) return done(null);
      const em = fields.find(x => x.type === 'email');
      if (em && d[em.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d[em.name].trim())) { const er = f.querySelector('.err'); er.hidden = false; er.textContent = "Hmm, that email doesn't look quite right. Try again, or skip."; return; }
      for (const k in d) d[k] = String(d[k]).trim().slice(0, 120); delete d.website;
      if (!Object.values(d).some(Boolean)) return done(null);
      audio.sfx('select'); done(d);
    });
    f.querySelector('[data-skip]').addEventListener('click', () => { audio.sfx('select'); done(null); });
    setTimeout(() => f.querySelector('input')?.focus({ preventScroll: true }), 40);
   })();
  });
}

// ---------------- HUD ----------------
const hudFrag = $('#hudFrag'), hudProj = $('#hudProj');
export function hud({ frags, projects, show: s } = {}) {
  if (s !== undefined) $('#hud').classList.toggle('on', s);
  if (frags !== undefined) { hudFrag.textContent = `◆ ${frags}/5`; hudFrag.title = `${frags} of 5 philosophy fragments found`; }
  if (projects !== undefined) { hudProj.hidden = projects < 0; hudProj.textContent = `▣ ${Math.max(0, projects)}/6`; hudProj.title = `${projects} of 6 secret projects visited`; }
}

// ---------------- cards (fragments, reading list) ----------------
const card = $('#card');
export function showCard(title, body, kicker = 'FRAGMENT') {
  return new Promise(res => {
    card.innerHTML = `<div class="cardbox" role="dialog" aria-label="${title}"><span class="kick">${kicker}</span><h3>${title}</h3><p>${body}</p><button class="opt" type="button">CLOSE ▶</button></div>`;
    card.hidden = false; audio.sfx('coin');
    const close = () => { card.hidden = true; off(); res(); };
    card.querySelector('button').addEventListener('click', close); card.querySelector('button').focus({ preventScroll: true });
    const off = on('esc', close);
  });
}

// ---------------- battle move card: the name of an attack, with its description underneath ----------------
export function moveCard(name, desc, side) {
  const c = $('#bcard'); if (!c) return;
  c.className = 'bcard ' + (side || ''); c.innerHTML = ''; const b = document.createElement('b'); b.textContent = name; const d = document.createElement('span'); d.textContent = desc; c.append(b, d);
  c.hidden = false; c.classList.remove('in'); void c.offsetWidth; c.classList.add('in');
}
export function hideMoveCard() { const c = $('#bcard'); if (c) c.hidden = true; }

// ---------------- toast (non-blocking quips) ----------------
const toast = $('#toast'); let toastOff = null;
export function quip(text, ms = 2600) { toast.textContent = text; toast.hidden = false; toast.classList.remove('in'); void toast.offsetWidth; toast.classList.add('in'); toastOff?.(); toastOff = after(ms, () => toast.hidden = true); }

// ---------------- menu ----------------
const menu = $('#menu');
export function openMenu(actions) {
  if (!menu.hidden) { closeMenu(); return; }
  clock.paused = true;
  const found = save.get('frags', []);
  const fragList = Object.entries(FRAGMENTS).map(([k, f]) => found.includes(k) ? `<li><button type="button" data-frag="${k}">◆ ${f.t}</button></li>` : `<li class="dim">◇ Fragment ${f.n}: ${f.clue}</li>`).join('');
  menu.innerHTML = `<div class="menubox" role="dialog" aria-label="Menu"><h3>MENU</h3>
    <div class="mgrid"><button type="button" data-a="resume">Resume</button><button type="button" data-a="sound">Sound: ${audio.on ? 'on' : 'off'}</button>
    <button type="button" data-a="crt">CRT effect: ${document.body.classList.contains('nocrt') ? 'off' : 'on'}</button><button type="button" data-a="text">Text size</button>
    ${actions.places ? '<button type="button" data-a="places">Go to a place</button>' : ''}<button type="button" data-a="restart">Restart</button>
    <a href="${CONFIG.TRADITIONAL_URL}">Traditional site</a><a href="mailto:${CONFIG.CONTACT_EMAIL}">Contact</a></div>
    <h4>FRAGMENTS ${found.length}/5</h4><ul class="frags">${fragList}</ul>${found.length === 5 ? `<p class="reading"><b>READING LIST UNLOCKED</b><br>${READING_LIST}</p>` : ''}
    <div class="places" hidden></div></div>`;
  menu.hidden = false;
  menu.querySelector('[data-a=resume]').focus({ preventScroll: true });
  menu.onclick = e => {
    const b = e.target.closest('button'); if (!b) return;
    const a = b.dataset.a;
    if (a === 'resume') closeMenu();
    if (a === 'sound') { audio.toggle(); b.textContent = 'Sound: ' + (audio.on ? 'on' : 'off'); emit('soundchange'); }
    if (a === 'crt') { document.body.classList.toggle('nocrt'); b.textContent = 'CRT effect: ' + (document.body.classList.contains('nocrt') ? 'off' : 'on'); save.set('nocrt', document.body.classList.contains('nocrt')); }
    if (a === 'text') { const s = ((save.get('txt', 0) + 1) % 3); save.set('txt', s); document.body.dataset.txt = s; }
    if (a === 'restart') { save.clear(); location.reload(); }
    if (a === 'places') { const p = menu.querySelector('.places'); p.hidden = false; p.innerHTML = '<h4>GO TO</h4>' + actions.places.map((pl, i) => `<button type="button" data-p="${i}">${pl.label}</button>`).join(''); }
    if (b.dataset.p) { closeMenu(); actions.places[+b.dataset.p].go(); }
    if (b.dataset.frag) { const f = FRAGMENTS[b.dataset.frag]; closeMenu(); showCard(f.t, f.b); }
  };
}
export function closeMenu() { menu.hidden = true; clock.paused = false; }
export const menuOpen = () => !menu.hidden;
