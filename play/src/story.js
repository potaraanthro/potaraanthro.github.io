// The journey state machine: BOOT → INTRO → BAITSWITCH → INTERESTED → YES/NO → WALK → ENCOUNTER → ASK → FREEROAM ⇄ buildings, FOUNDER_FULL, FINALE.
import { T, W, H, clock, wait, after, tween, on, emit, fx, fadeIn, fadeOut, setScene, getScene, save, session, RM } from './core.js';
import { World, Ent, findPath } from './world.js';
import { greyOffice, town, interior } from './maps.js';
import { TL, text, person } from './art.js';
import { S, FRAGMENTS, READING_LIST } from '../data/script.js';
import { QUESTIONS } from '../data/consult.js';
import { say, choose, askInput, closeDialogue, setExitable, DialogueExit, ui, uiOpts, hud, showCard, quip, openMenu, menuOpen, closeMenu } from './ui.js';
import { baitSwitch, encounterScene, swirl, founderScene, roomPanel, avatarStudio, submitLead } from './scenes.js';
import { audio } from './audio.js';
import { video } from './video.js';
import { createFilm } from './film.js';
import { score } from './music.js';
import { playArcade } from './arcade.js';
import { LORE } from '../data/lore.js';
import { ROSENSHINE } from '../data/training.js';
import { CONFIG, leaveWorld } from './config.js';
import { hdWorld } from './hd.js';
import { updateTags, clearTags, updateBubbles, clearAll as clearOverlayTags } from './tags.js';
import { SERVICES, ORDER } from '../data/services.js';
import { roomBuilder } from './roombuilder.js';
import { panel, panelOpen, closePanel, challengePanel, briefPanel, storyPanel, servicesPanel, bookPanel, rosenPanel, siPanel, schoolPanel } from './panels.js';

const $ = s => document.querySelector(s);
const talk = async lines => { await say(lines); closeDialogue(); };
const track = (e, d) => { if (CONFIG.ANALYTICS_ENDPOINT && navigator.doNotTrack !== '1') try { navigator.sendBeacon(CONFIG.ANALYTICS_ENDPOINT, JSON.stringify({ e, d, t: Date.now() })); } catch (x) { } };
const external = () => /^https?:/.test(CONFIG.TRADITIONAL_URL);
const goTraditional = () => {
  track('traditional_clicked');
  if (CONFIG.EMBEDDED) { leaveWorld(); return; }
  if (!external()) { location.href = CONFIG.TRADITIONAL_URL; return; }
  showCard('The traditional site', `No problem. <a class="opt" href="${CONFIG.TRADITIONAL_URL}" target="_blank" rel="noopener">Open the traditional site ↗</a>`, 'GOODBYE FOR NOW');
};

// ---------------- the walkable-world scene ----------------
class WorldScene {
  constructor(world, h) { this.w = world; this.h = h; this.walkId = 0; }
  enter() { this.offs = [on('point', p => this.point(p)), on('act', () => this.act()), on('arrive', a => this.h.arrive?.(a.x, a.y))]; }
  exit() { this.offs.forEach(f => f()); clearOverlayTags(); }
  update(dt) { this.w.camBias += ((ui.open ? 34 : 0) - this.w.camBias) * Math.min(1, dt / 160); this.w.update(dt); }
  render(g) { this.w.render(g, this.w.greyNixy); }
  renderHD(g, k) { hdWorld(g, this.w, k); updateTags(this.w, { recommended: G.challenge, visited: G.visited }); updateBubbles(this.w); }
  renderTop(g) { if (this.w.greyNixy) this.w.renderNixy(g); }
  free() { return !ui.open && !menuOpen() && !this.w.locked && $('#card').hidden && $('#overlay').hidden && $('#panel').hidden; }
  resolve(tx, ty) {
    const w = this.w, m = w.map;
    const ent = w.ents.find(e => e.talk && !e.hidden && e.x === tx && (e.y === ty || e.y === ty + 1));
    if (ent) return { ent };
    const prop = m.props.find(p => p.act && tx >= p.x && tx < p.x + p.w && ty >= p.y - (p.tall ?? 1) && ty < p.y + p.h);
    if (prop) return { prop };
    const b = m.buildingAt(tx, ty); if (b) return { door: b };
    return { tile: [tx, ty] };
  }
  async point(p) {
    if (!this.free()) return;
    const w = this.w, z = w.zoom || 1, tx = Math.floor((p.x / z + w.cam.x) / T), ty = Math.floor((p.y / z + w.cam.y) / T), id = ++this.walkId, pl = w.player;
    const r = this.resolve(tx, ty);
    if (r.ent) { w.marker = null; const ok = await w.walkTo(pl, r.ent.x, r.ent.y, true); if (ok && id === this.walkId && this.free()) { w.face(pl, r.ent); this.h.talk?.(r.ent); } return; }
    if (r.prop) { if (await this.reachProp(r.prop, id)) this.h.prop?.(r.prop); return; }
    if (r.door) { w.marker = r.door.door; await w.walkTo(pl, ...r.door.door); w.marker = null; return; }
    if (w.passable(tx, ty, pl)) { w.marker = [tx, ty]; await w.walkTo(pl, tx, ty); if (id === this.walkId) w.marker = null; }
    else audio.sfx('bump');
  }
  near(p) { const pl = this.w.player, rg = p.range || 1; for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) if (Math.abs(pl.x - p.x - i) + Math.abs(pl.y - p.y - j) <= rg) return true; return false; }
  async reachProp(p, id) {
    const w = this.w, pl = w.player;
    if (this.near(p)) { w.dir = 0; return true; }
    const rg = p.range || 1, goals = [];
    for (let y = p.y - rg; y < p.y + p.h + rg; y++) for (let x = p.x - rg; x < p.x + p.w + rg; x++) {
      let d = 99; for (let j = 0; j < p.h; j++) for (let i = 0; i < p.w; i++) d = Math.min(d, Math.abs(x - p.x - i) + Math.abs(y - p.y - j));
      if (d >= 1 && d <= rg && w.passable(x, y, pl)) goals.push([x, y]);
    }
    const path = findPath(w, pl.x, pl.y, goals, pl); if (!path) return false;
    pl.path = path; await new Promise(r => pl._arrive = r);
    if (id !== this.walkId || !this.free()) return false;
    pl.dir = w.dirTo(pl, p.x, p.y); return true;
  }
  act() {
    if (!this.free()) return;
    const w = this.w, pl = w.player, d = [[0, 1], [-1, 0], [1, 0], [0, -1]][pl.dir], fx_ = pl.x + d[0], fy = pl.y + d[1];
    const e = w.entAt(fx_, fy, pl); if (e && e.talk) { w.face(pl, e); return this.h.talk?.(e); }
    const p = w.map.props.find(p => p.act && fx_ >= p.x && fx_ < p.x + p.w && fy >= p.y && fy < p.y + p.h) || w.map.props.find(p => p.act && p.range > 1 && this.near(p));
    if (p) return this.h.prop?.(p);
  }
}

// ---------------- state ----------------
const G = { look: 'hero', world: null, town: null, scene: null, fragments: new Set(save.get('frags', [])), visited: new Set(save.get('visited', [])), knocks: 0 };
const updateHud = () => hud({ frags: G.fragments.size, projects: save.get('stage') === 'free' ? G.visited.size : -1 });

function makePlayer(world, x, y, dir = 0) { const p = world.add(new Ent({ id: 'player', look: G.look, x, y, dir, speed: 140 })); world.player = p; return p; }
function makeNixy(world, x, y, mode) { const n = world.add(new Ent({ id: 'nixy', look: 'nixy', x, y, dir: 0, speed: 140, blocking: false, mode, idleBob: true })); world.nixy = n; return n; }
const lock = v => { if (G.world) { G.world.locked = v; if (v && G.world.player) { G.world.player.path = []; G.world.marker = null; } } };

// ---------------- fragments ----------------
async function giveFragment(k) {
  const f = FRAGMENTS[k]; const isNew = !G.fragments.has(k);
  G.fragments.add(k); save.set('frags', [...G.fragments]); updateHud();
  if (G.world?.nixy) G.world.nixy.emote = '♥', after(1500, () => G.world?.nixy && (G.world.nixy.emote = null));
  await showCard(f.t, f.b, isNew ? `FRAGMENT ${G.fragments.size} OF 5 FOUND` : 'FRAGMENT');
  if (isNew && G.fragments.size === 5) { audio.sfx('win'); await showCard('Reading list unlocked', READING_LIST, 'ALL FIVE FRAGMENTS'); quip('All five! You absolute philosopher.'); }
  else if (isNew) quip(['Ooh, a fragment!', 'Another one!', 'You have a good eye.', 'One more after this!'][G.fragments.size - 1] || 'Nice!');
}
async function propAct(p) {
  if (p.act === 'star') return giveFragment('star').then(() => p.found = true);
  if (p.act === 'arcade') { audio.sfx('coin'); quip('Insert coin...'); await wait(500); return giveFragment('arcade'); }
  if (p.act === 'logo') { p.knocks = (p.knocks || 0) + 1; audio.sfx('knock'); fx.shake = 1.5; after(120, () => fx.shake = 0); const n = p.knocks; after(1400, () => { if (p.knocks === n && n < 3) p.knocks = 0; }); if (p.knocks >= 3) { p.knocks = 0; return giveFragment('logo'); } quip(['Knock...', 'Knock knock...'][n - 1]); return; }
  if (p.act === 'phone') { p.ring = true; audio.sfx('select'); await wait(700); p.ring = false; return giveFragment('phone'); }
  if (p.act === 'vault') { audio.sfx('door'); return giveFragment('vault'); }
}

// =====================================================================
// BOOT
// =====================================================================
export async function boot() {
  document.body.dataset.txt = save.get('txt', 0); if (save.get('crt')) document.body.classList.add('crt');
  for (const a of document.querySelectorAll('#hudTrad, #tTrad, #fail a')) { a.href = CONFIG.TRADITIONAL_URL; if (external()) { a.target = '_blank'; a.rel = 'noopener'; } }
  $('#hudSound').addEventListener('click', () => { audio.toggle(); emit('soundchange'); });
  on('soundchange', soundLabel);
  $('#hudMenu').addEventListener('click', () => openMenu({ places: save.get('stage') === 'free' && G.scene === 'town' ? places() : null }));
  $('#hudDossier').addEventListener('click', () => openServices());
  on('esc', () => { if (menuOpen()) closeMenu(); });
  const title = $('#title'); title.hidden = false;
  const stage = save.get('stage'), progress = stage === 'free' || stage === 'town';
  $('#tContinue').hidden = !progress;
  if (progress) {
    const ins = save.get('inside'), n = (save.get('visited', [])).length;
    $('#tResume').hidden = false;
    $('#tResume').textContent = stage === 'town' ? 'Last time: on your way to Technicity.' : `Last time: ${ins ? 'inside ' + SERVICES[ins].name : 'in Technicity'} · ${n} of 6 places explored`;
    $('#tStart').textContent = 'Start again';
    setTimeout(() => $('#tContinue').focus({ preventScroll: true }), 60);
  } else setTimeout(() => $('#tStart').focus({ preventScroll: true }), 60);
  const pick = await new Promise(r => { $('#tStart').onclick = () => r('start'); $('#tContinue').onclick = () => r('continue'); });
  track(pick);
  if (pick === 'start' && progress) { const keep = { txt: save.get('txt', 0), crt: save.get('crt', false) }; save.clear(); for (const k in keep) save.set(k, keep[k]); G.visited = new Set(); G.fragments = new Set(); }
  if (pick === 'continue' && save.get('look')) G.look = save.get('look');
  else {
    $('#tMain').hidden = true; $('#tLook').hidden = false;
    G.look = await new Promise(r => title.querySelectorAll('[data-look]').forEach(b => b.onclick = () => r(b.dataset.look)));
  }
  save.set('look', G.look); title.hidden = true; title.querySelector('video')?.pause(); hud({ show: true }); updateHud();
  fx.fade = 1;
  if (pick === 'continue') {
    G.challenge = save.get('challenge', null); G.tour = save.get('tour', false);
    if (stage === 'town') return townArrival();
    const pos = save.get('pos'); if (pos) G.returnTo = pos;
    await freeRoam(true);
    const ins = save.get('inside'); if (ins && SERVICES[ins]) { const b = G.town.map.buildings.find(b => b.id === ins); if (b) enterBuilding(ins); }
    return;
  }
  await greyOfficeAct();
}
function soundLabel() { const b = $('#hudSound'); b.textContent = audio.on ? '♪ On' : '♪ Off'; b.setAttribute('aria-pressed', audio.on); if (audio.on && G.scene !== 'founder') audio.music(G.scene === 'grey' ? 'grey' : G.scene === 'town' ? 'town' : 'inside', true); }

// =====================================================================
// B–E. THE GREY OFFICE, THE BAIT AND SWITCH, THE QUESTION
// =====================================================================
async function greyOfficeAct() {
  G.scene = 'grey'; audio.music('grey');
  const m = greyOffice(); const w = new World(m); G.world = w; w.greyNixy = true; fx.sat = 0;
  makePlayer(w, 8, 5, 2); const n = makeNixy(w, 16, 10, 'idle'); n.hidden = true;
  const sc = new WorldScene(w, { prop: p => { if (p.act === 'crt') talk(S.crtGag); } });
  setScene(sc); lock(true); await fadeIn(600);
  await wait(700);
  n.hidden = false; audio.sfx('door'); await w.walkTo(n, 11, 5); n.dir = 1; w.face(w.player, n);
  await say(S.hello);
  const c = await choose(S.helloChoice);
  if (c === 'trad') { closeDialogue(); return goTraditional(); }
  await say([S.intro[0]]);
  const crt = m.props.find(p => p.kind === 'crt'); fx.shake = 1; after(250, () => fx.shake = 0);
  await say(S.crtGag); await say(S.intro.slice(1));
  await baitSwitch(G.look, save.get('baitSeen', false)); save.set('baitSeen', true);
  // the question
  for (; ;) {
    const v = await choose(S.interestedChoice, S.interested[0]);
    if (v === 'unpro') { n.emote = '!'; await say(S.unpro); n.emote = null; continue; }
    if (v === 'much') { n.emote = '♥'; await say(S.much); n.emote = null; continue; }
    if (v === 'no') {
      track('no'); await say(S.no);
      const v2 = await choose(S.noChoice);
      if (v2 === 'trad') { closeDialogue(); return goTraditional(); }
    }
    break;
  }
  track('yes');
  await say(S.yes);
  const tell = await choose(S.tellChoice);
  await say(tell === 'will' ? S.will : S.wont);
  await say(S.follow); closeDialogue();
  m.set(16, 11, TL.GFLOOR); audio.sfx('door');
  n.speed = 120; const p1 = w.walkTo(n, 16, 11); await wait(300); const p2 = w.walkTo(w.player, 16, 10); await Promise.all([p1, p2]);
  n.hidden = true; await w.walkTo(w.player, 16, 11);
  await fadeOut(450);
  save.set('stage', 'town');
  return townArrival();
}

// =====================================================================
// F. THE TOWN, THE ROUTE, THE FRAGMENTS
// =====================================================================
function buildTown() {
  if (G.town) return G.town;
  const m = town(); const w = new World(m); G.town = w; return w;
}
async function townArrival() {
  G.scene = 'town'; audio.music('town');
  const w = buildTown(); G.world = w; const m = w.map;
  makePlayer(w, m.start.x, m.start.y, 3); const n = makeNixy(w, m.start.x + 2, m.start.y, 'lead');
  w.greyNixy = true; fx.sat = 0; placeCityNpcs(w);
  const sc = townScene(w); setScene(sc); lock(true);
  await fadeIn(500);
  await tween(1800, k => fx.sat = .45 * k); w.greyNixy = false;
  // the encounter can fire whenever the visitor steps into the tall grass
  G.encounterP = new Promise(r => G.onGrass = r);
  await talk(S.firstSight); lock(false);
  runRoute(w);
  await G.encounterP;
  G.routeDone = true;
  return encounterAct();
}
async function runRoute(w) {
  const n = w.nixy, m = w.map;
  let qi = 0; const offWait = on('nixyWaiting', () => { if (!G.routeDone) w.bubble(n, S.quips[1], 1800); });
  for (const stop of m.route) {
    if (G.routeDone) break;
    await w.walkTo(n, ...stop.to);
    if (G.routeDone) break;
    const f = FRAGMENTS[stop.stop];
    if (f) { n.dir = 3; w.bubble(n, G.fragments.has(stop.stop) ? 'FOUND THIS ONE!' : 'PSST. POKE IT!', 2600); if (!G.fragments.has(stop.stop)) quip(f.clue, 3800); }
    else if (stop.stop === 'meadow') { w.bubble(n, 'THROUGH THE GRASS!', 4000); quip('Walk through the tall grass. Watch your step...', 4000); }
    // wait for the visitor to catch up (or give up after a while)
    const t0 = clock.t; while (!G.routeDone && clock.t - t0 < 9000) { const pl = w.player; if (Math.abs(pl.x - n.x) + Math.abs(pl.y - n.y) <= 3 && clock.t - t0 > 1600) break; await wait(200); }
    if (stop.stop !== 'meadow') { await wait(500); if (!G.routeDone && qi < 3 && Math.random() < .6) w.bubble(n, S.quips[[0, 2, 3][qi++]], 1600); }
  }
  offWait();
}
function townScene(w) {
  const m = w.map;
  return new WorldScene(w, {
    talk: e => { if (e.id === 'yasin') founderAct(); else if (e.npcLines) npcTalk(e); },
    prop: p => { if (p.act === 'pad') finaleAct(); else if (FRAGMENTS[p.act] || p.act === 'logo') { lock(true); propAct(p).finally(() => lock(false)); } },
    arrive: (x, y) => {
      if (!G.met && m.get(x, y) === TL.TALL) { G.met = true; G.onGrass?.(); return; }
      if (save.get('stage') === 'free') { if (clock.t - (G.lastSave || 0) > 1500) { G.lastSave = clock.t; save.set('pos', [x, y]); } refreshGuide(); }
      const b = m.buildings.find(b => b.door[0] === x && b.door[1] === y);
      if (b && b.style === 'old') { lock(true); quip(b.id === 'old' ? 'That way lies the grey. Onwards!' : ['Closed since 1998.', 'Out to lunch. Since 2003.', 'The sign says back in five minutes.'][b.x % 3]); w.walkTo(w.player, x, y + 1).then(() => lock(false)); return; }
      if (b) {
        if (b.locked) { lock(true); w.player.path = []; talk(S.noPeek).then(() => { w.walkTo(w.player, x, y + 1).then(() => lock(false)); }); return; }
        enterBuilding(b.id);
      }
      const pad = m.props.find(p => p.kind === 'pad'); if (pad && x === pad.x + 1 && y === pad.y + 1 && save.get('stage') === 'free') finaleAct();
    },
  });
}

// =====================================================================
// G–H. TALL GRASS ENCOUNTER, YASIN'S SHORT PITCH, NIXY'S ASK
// =====================================================================
async function encounterAct() {
  const w = G.world; lock(true); track('encounter');
  await swirl();
  G.scene = 'battle'; audio.music('battle');
  setScene(encounterScene(G.look)); await fadeIn(250);
  await say(S.encounter);
  const h = await choose(S.handsChoice);
  await say(h === 'yes' ? S.handsYes : S.handsNo);
  await say(S.shortPitch); closeDialogue();
  await swirl();
  // back to the town: Yasin now sits on the bench, and stays there for good
  placeYasin(w);
  const n = w.nixy; n.mode = 'idle'; n.path = []; const pl = w.player;
  const spot = [[pl.x - 1, pl.y], [pl.x + 1, pl.y], [pl.x, pl.y + 1], [pl.x, pl.y - 1]].find(([x, y]) => w.passable(x, y, n)) || [pl.x, pl.y];
  n.x = spot[0]; n.y = spot[1]; n.px = n.x * T; n.py = n.y * T; w.face(n, pl);
  G.scene = 'town'; audio.music('town'); setScene(townScene(w)); fx.fade = 1; fx.sat = .45; await fadeIn(400);
  save.set('met', true);
  audio.sfx('win'); await tween(1600, k => fx.sat = .45 + .55 * k); await talk(S.citySight);
  await askAct();
  // unlock the secret projects
  for (const b of w.map.buildings) if (b.locked) { b.locked = false; audio.sfx('tape'); await wait(260); }
  await talk(S.askDone);
  n.mode = 'follow'; save.set('stage', 'free'); save.set('pos', [pl.x, pl.y]); updateHud(); $('#hudDossier').hidden = false;
  await funnel(); lock(false);
}
function placeYasin(w) {
  if (w.ents.find(e => e.id === 'yasin')) return;
  const b = w.map.bench; const y = w.add(new Ent({ id: 'yasin', look: 'yasin', x: b.x, y: b.y, dir: 0, sit: true, talk: true, blocking: true }));
  y.emote = save.get('founderHeard') ? null : '!';
  // his hand-drawn seated sprite brings its own bench, so the plain map bench steps aside and he sits centred on it
  if (person('yasin', 0, 0, true).width > 18) { y.sitDx = 8; const bp = w.map.props.find(p => p.kind === 'bench'); if (bp) bp.under = true; }
}
async function askAct() {
  track('ask');
  await say(S.ask1);
  const a = await askInput(S.askEmail, [{ name: 'email', label: 'Email', type: 'email', auto: 'email', ph: 'you@company.com' }, { name: 'name', label: 'First name (optional)', auto: 'given-name', ph: 'First name', max: 40 }], 'None of your business');
  let b = null, nl = null;
  if (a) { session.email = a.email || ''; session.name = a.name || ''; }
  b = await askInput(S.askBusiness, [{ name: 'business', label: 'Business name', auto: 'organization', ph: 'Company or school', max: 60 }], 'Also none of your business');
  if (b) session.business = b.business || '';
  nl = await choose(S.newsChoice, S.askNews); session.newsletter = nl;
  const any = session.email || session.business;
  if (any) {
    const res = await submitLead({ kind: 'ask', name: session.name, email: session.email, business: session.business, newsletterOptIn: !!nl });
    await say(S.askThanks);
    if (res === 'failed') await say([['nixy', `Hmm, that didn't send. You can always email ${CONFIG.CONTACT_EMAIL}.`, 'sheepish']]);
    track('ask_completed');
  } else { await say(S.askSkipped); track('ask_skipped'); }
}

// =====================================================================
// FREE ROAM, PLACES, BUILDINGS
// =====================================================================
async function freeRoam(fromContinue) {
  const w = buildTown(); G.world = w; G.scene = 'town'; audio.music('town');
  w.ents = []; const m = w.map; placeCityNpcs(w);
  for (const b of m.buildings) b.locked = false;
  G.met = true; placeYasin(w);
  const at = G.returnTo || [m.cityStart.x, m.cityStart.y]; G.returnTo = null;
  makePlayer(w, at[0], at[1], 0); const n = makeNixy(w, at[0], Math.min(at[1] + 1, m.h - 1), 'follow');
  if (!w.passable(n.x, n.y, n)) { n.x = at[0] + 1; n.y = at[1]; n.px = n.x * T; n.py = n.y * T; }
  fx.sat = 1; w.greyNixy = false;
  if (!w.passable(at[0], at[1], w.player)) { w.player.x = m.cityStart.x; w.player.y = m.cityStart.y; w.player.px = w.player.x * T; w.player.py = w.player.y * T; }
  document.body.classList.remove('inside'); $('#hudDossier').hidden = false;
  setScene(townScene(w)); updateHud(); lock(false); await fadeIn(350);
  nextObjective(fromContinue);
}
function places() {
  const walk = (x, y) => () => { if (G.scene !== 'town') return; G.world.marker = [x, y]; G.world.walkTo(G.world.player, x, y); };
  return [
    { label: 'Meeting Room Building', go: walk(31, 10) }, { label: 'The Arcade', go: walk(39, 10) },
    { label: 'Training Studio', go: walk(47, 10) }, { label: 'Virtual Foreground', go: walk(55, 10) },
    { label: 'SI Enhancement Academy', go: walk(32, 17) }, { label: 'Schoolhouse', go: walk(46, 17) },
    { label: 'Founder on the bench', go: walk(28, 16) }, { label: 'Launch pad', go: walk(40, 19) },
  ];
}
// colleagues around Technicity: a few, working in new ways
function placeWalkers(w) {
  if (!w.map.walkers || w.ents.some(e => e.loop)) return;
  w.map.walkers.forEach((d, i) => w.add(new Ent({ id: 'walker' + i, look: d.look, x: d.loop[0][0], y: d.loop[0][1], loop: d.loop, blocking: false, speed: 210, pause: 600 * i })));
}
function placeCityNpcs(w) {
  placeWalkers(w);
  if (w.ents.some(e => e.npcLines)) return;
  const list = [
    ['npc1', 'v1', 52, 15, 0], ['npc2', 'v2', 54, 15, 0], ['npc3', 'v3', 36, 12, 1], ['npc4', 'v0', 47, 19, 2],
  ];
  for (const [id, look, x, y, dir] of list) w.add(new Ent({ id, look, x, y, dir, talk: true, idleBob: true, blocking: true, npcLines: S.npcLines[id] }));
}
async function npcTalk(e) { lock(true); const l = e.npcLines; e._i = ((e._i ?? -1) + 1) % l.length; await talk([['npc', l[e._i]]]); lock(false); }
async function enterBuilding(id) {
  lock(true); audio.sfx('door'); track('building_entered', id);
  const b = G.town.map.buildings.find(b => b.id === id); G.returnTo = [b.door[0], b.door[1] + 1];
  await fadeOut(300);
  const m = interior(id); const w = new World(m); G.world = w; G.scene = 'inside'; audio.music('inside'); document.body.classList.add('inside'); clearTags();
  makePlayer(w, m.start.x, m.start.y, 3); makeNixy(w, m.start.x + 1, m.start.y, 'follow');
  for (const np of m.npcs || []) w.add(new Ent({ ...np, talk: true, idleBob: true }));
  if (id === 'training') { const bd = m.props.find(p => p.act === 'rosen'); if (bd) bd.draw = (g, x, y) => { text(g, 'ROSENSHINE', x + 6, y + 5, '#1d4ed8'); text(g, '10 PRINCIPLES', x + 6, y + 12, '#334155'); }; }
  const first = !G.visited.has(id); G.visited.add(id); save.set('visited', [...G.visited]); save.set('inside', id); updateHud(); setObjective(SERVICES[id].name + ' · talk to anyone here');
  const sc = new WorldScene(w, {
    talk: e => runBuilding(id, e),
    prop: p => runBuilding(id, p),
    arrive: (x, y) => { if (x === m.exit.x && y === m.exit.y) leaveBuilding(); },
  });
  setScene(sc); await fadeIn(300); lock(false);
  if (first) w.bubble(w.nixy, ({ rooms: S.roomFirst, vf: S.avatarFirst, si: S.mothFirst, school: S.schoolFirst, arcade: S.arcadeFirst, training: S.trainFirst })[id], 3000);
  // the useful bit first: what this place does, in ten seconds
  if (first || G.challenge === id) runBuilding(id, { brief: true });
  else quip('Talk to anyone here. ' + SERVICES[id].story.who + ' has a story.', 2800);
}
async function leaveBuilding() { lock(true); audio.sfx('door'); closePanel(); await fadeOut(300); document.body.classList.remove('inside'); save.set('inside', null); return freeRoam(); }
let buildingBusy = false;
async function runBuilding(id, target) {
  if (buildingBusy) return; buildingBusy = true; lock(true);
  setExitable(true);
  try {
    const t = target || {};
    if (t.brief) await serviceMenu(id);
    else if (t.id === 'story') await serviceMenu(id, 'story');
    else if (id === 'arcade' && t.act === 'dud') quip(S.arcadeDud[(t.x + t.y) % S.arcadeDud.length], 2600);
    else if (id === 'arcade' && t.act === 'flap') await serviceMenu(id, 'demo');
    else if (id === 'training' && t.act === 'tv') await trainVideo();
    else if (id === 'training' && t.act === 'rosen') await serviceMenu(id, await rosenPanel());
    else if (id === 'vf' && t.act === 'tv') await serviceMenu(id, 'demo');
    else if (t.act === 'sim') await serviceMenu(id, 'demo');
    else if (t.id || t.act) await serviceMenu(id);
  } catch (e) { if (!(e instanceof DialogueExit)) throw e; roomPanel.close(); avatarStudio.close(); }
  finally { setExitable(false); buildingBusy = false; closeDialogue(); lock(false); }
}

// ---------------- I. Bob and Bill ----------------
async function roomFlow() {
  await roomPanel.open();
  await say(S.roomHello);
  const brief = [], answers = {};
  const STATES = [['legacy', 'hero'], ['survey', 'top'], ['design', 'front'], ['design', 'back'], ['cabling', 'ceiling'], ['live', 'hero']];
  for (let qi = 0; qi < QUESTIONS.length; qi++) {
    const q = QUESTIONS[qi];
    const v = await choose(q.opts.map((o, i) => ({ t: o.t, v: i, primary: true })), ['bill', q.ask]);
    const o = q.opts[v]; answers[q.id] = o.t; brief.push(o.note);
    if (q.id === 'when') { for (const s of ['install1', 'install2', 'install3']) await roomPanel.apply(s, 'hero'); }
    let [st, cam] = STATES[qi]; if (q.id === 'pain') { st = o.state || 'cabling'; cam = o.cam || cam; }
    await roomPanel.apply(st, cam);
    await say([['bob', o.react]]);
  }
  await say(S.roomDone);
  const d = await askInput(['bill', 'Where should we send it?'], [
    { name: 'email', label: 'Email', type: 'email', auto: 'email', ph: session.email || 'you@company.com' },
    { name: 'business', label: 'Business', auto: 'organization', ph: session.business || 'Company or school' },
    { name: 'note', label: 'Anything else? (optional)', ph: 'Room size, deadline, anything', max: 200 }], 'Not now');
  if (d) {
    const res = await submitLead({ kind: 'room-enquiry', name: session.name, email: d.email || session.email, business: d.business || session.business, note: d.note, newsletterOptIn: !!session.newsletter, answers, brief: brief.join(' | ') });
    await say([['bill', res === 'failed' ? `It didn't send. Email us at ${CONFIG.CONTACT_EMAIL} and we'll pick it up.` : "Lovely. We'll be in touch with this room and a proper scope."]]);
  } else await say([['bob', "No problem. The room's not going anywhere."]]);
  roomPanel.close();
}

// ---------------- J. Virtual Foreground ----------------
async function avatarFlow() {
  await avatarStudio.ad();
  avatarStudio.close(); closeDialogue();
  await video.play({ src: ['assets/video/hybrid-teaser.mp4', 'assets/video/hybrid-teaser.webm'], poster: 'assets/video/hybrid-teaser-poster.jpg', caption: 'POTARA · ANYTHING DIGITAL', label: 'Potara avatar teaser video' });
  await say(S.avatarAd);
  const v = await choose(S.avatarOfferChoice, S.avatarOffer[0]);
  if (v === 'yes') { await avatarStudio.picker(); await say(S.avatarDone); }
  await say([['nixy', `Email ${CONFIG.CONTACT_EMAIL} and mention the avatar studio. I'll know.`, 'wink']]);
  avatarStudio.close();
}

// ---------------- The Arcade ----------------
const unlockedLore = () => save.get('lore', []);
async function arcadeFlow(target) {
  if (target?.act === 'dud') { quip(S.arcadeDud[(target.x + target.y) % S.arcadeDud.length], 2600); return; }
  if (target?.act !== 'flap' && !target?.id) return;
  await say(S.arcadeHello.slice(0, save.get('arcadeSeen') ? 0 : 2)); save.set('arcadeSeen', true);
  for (; ;) {
    const v = await choose(S.arcadeMenu, ['clerk', unlockedLore().length ? `${unlockedLore().length} of ${LORE.length} unlocked. What now?` : 'Ready?']);
    if (v === 'leave') return;
    if (v === 'read') {
      const got = LORE.filter(l => unlockedLore().includes(l.score));
      if (!got.length) { await say(S.arcadeNone); continue; }
      closeDialogue(); for (const l of got) await showCard(l.t, l.b, 'UNLOCKED');
      continue;
    }
    closeDialogue();
    const r = await playArcade({ unlocked: unlockedLore, best: save.get('arcadeBest', 0), onUnlock: l => { const u = new Set(unlockedLore()); u.add(l.score); save.set('lore', [...u]); } });
    save.set('arcadeBest', Math.max(save.get('arcadeBest', 0), r.best));
  }
}

// ---------------- The Training Studio ----------------
async function trainingFlow(target) {
  if (target?.act === 'tv') { await trainVideo(); return; }
  if (target?.act === 'rosen') { await rosen(); return; }
  await say(S.trainHello);
  for (; ;) {
    const v = await choose(S.trainMenu, ['coach', 'Where shall we start?']);
    if (v === 'leave') return;
    if (v === 'video') await trainVideo();
    if (v === 'rosen') await rosen();
    if (v === 'book') { closeDialogue(); await showCard('Book a call with Yasin and Nixy', `A call with Yasin and Nixy. Thirty minutes, no deck. <a class="opt" href="${CONFIG.BOOKING_URL}" target="_blank" rel="noopener">Book a time ↗</a><br><br>Or email <b class="sel">${CONFIG.CONTACT_EMAIL}</b>`, 'TRAINING STUDIO'); }
  }
}
async function trainVideo() {
  await say(S.trainTv); closeDialogue();
  await video.play({ src: ['assets/video/training-workshop.mp4', 'assets/video/training-workshop.webm'], poster: 'assets/video/training-workshop-poster.jpg', caption: 'TRAINING WORKSHOP', label: 'Training workshop video', fallback: 'Workshop video arriving soon.' });
  await say(S.trainEnd);
}
async function rosen() {
  await say(S.trainRosen);
  for (let i = 0; i < ROSENSHINE.length; i++) await say([['coach', `${i + 1}. ${ROSENSHINE[i][0]}. ${ROSENSHINE[i][1]}`]]);
  await say(S.trainEnd);
}

// ---------------- K. GeekMoth ----------------
async function mothFlow() {
  const board = G.world.map.props.find(p => p.kind === 'whiteboard');
  const v = await choose(S.mothChoice, S.moth[0]);
  await say(S.mothAll);
  board.draw = (g, x, y, t) => {
    const f = (c, a, b, w, h) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
    if (v === 'tech') { for (let i = 0; i < 4; i++) { const on = (t / 400 | 0) % 5 > i; g.fillStyle = on ? '#16a34a' : '#94a3b8'; g.beginPath(); g.arc(x + 12 + i * 22, y + 11, 6, 0, 7); g.fill(); if (i < 3) f('#334155', 18 + i * 22, 10, 10, 2); } }
    else if (v === 'sales') { f('#334155', 6, 4, 20, 14); f('#be185d', 36, 4, 20, 14); f('#334155', 27, 10, 8, 2); f('#fbbf24', 60, 6, 30, 10); f('#0f172a', 66 + ((t / 150 | 0) % 18), 9, 3, 3); }
    else { for (let i = 0; i < 5; i++) f(['#f472b6', '#22d3ee', '#fbbf24', '#a855f7', '#4ade80'][i], 8 + i * 17, 16 - ((t / 200 + i) % 4) * 3, 12, 4 + ((t / 200 + i) % 4) * 3); }
  };
  await say(v === 'sales' ? S.mothSales : v === 'tech' ? S.mothTech : S.mothMarketing);
  await say([['moth', `Curious? Email ${CONFIG.CONTACT_EMAIL}. I check it between lamps.`]]);
}

// ---------------- L. Schoolhouse ----------------
async function schoolFlow() {
  const board = G.world.map.props.find(p => p.kind === 'chalkboard');
  board.draw = (g, x, y, t) => {
    const labels = ['SENSE', 'MODEL', 'ACT', 'CHANGE'], k = (t / 700 | 0) % 6;
    labels.forEach((l, i) => text(g, l, x + 6 + i * 31, y + 6, i < k ? '#fde68a' : '#d1fae5'));
    for (let i = 0; i < 3; i++) { g.fillStyle = i < k - 1 ? '#fde68a' : '#4b5563'; g.fillRect(x + 27 + i * 31, y + 8, 6, 1); }
    g.fillStyle = k >= 5 ? '#fbbf24' : '#4b5563'; g.fillRect(x + 10, y + 16, 104, 1); g.fillRect(x + 10, y + 13, 1, 3); g.fillRect(x + 113, y + 13, 1, 3);
    if (k >= 5) text(g, 'RETURN PATH', x + 40, y + 12, '#fbbf24');
  };
  await say(S.school);
  const v = await choose(S.schoolChoice);
  await say(v === 'teacher' ? S.schoolTeacher : v === 'leader' ? S.schoolLeader : S.schoolIt);
  await say([['teacher', `If that sounds like your school, email ${CONFIG.CONTACT_EMAIL}.`]]);
}

// =====================================================================
// M. THE FOUNDER'S FULL PITCH
// =====================================================================
let founderBusy = false;
// The founder film: a full-frame canvas behind the dialogue box (src/film.js) and its own score (src/music.js).
const BLANK = { render(g) { g.fillStyle = '#05030f'; g.fillRect(0, 0, W, H); } };
async function founderAct() {
  if (founderBusy) return; founderBusy = true; lock(true); track('founder_full_started');
  const heard = save.get('founderHeard', false);
  let abort = false, abortR; const abortP = new Promise(r => abortR = r);
  const offEsc = on('esc', () => { if (!menuOpen()) { abort = true; abortR(); } }); const offX = on('dlgx', () => { abort = true; abortR(); }); setExitable(true);
  const step = p => Promise.race([Promise.resolve(p).catch(() => { }), abortP]);
  await fadeOut(350);
  const prevScene = getScene(); setScene(BLANK); G.scene = 'founder'; audio.music(null);
  // the film layer, with a one-time nudge to turn the score on
  const host = document.createElement('div'); host.id = 'film'; $('#screen').insertBefore(host, $('#hud'));
  const film = createFilm(host); film.start(); film.scene(S.founder[0].film);
  let pill = null;
  if (!audio.on) {
    pill = document.createElement('button'); pill.type = 'button'; pill.className = 'scorepill'; pill.textContent = '\u266a This part has a score. Turn sound on';
    pill.addEventListener('click', e => { e.stopPropagation(); if (!audio.on) { audio.toggle(); emit('soundchange'); } });
    host.append(pill); after(9000, () => pill?.classList.add('gone'));
  }
  const syncScore = () => { if (audio.on) { score.start(film.mood); pill?.classList.add('gone'); } else score.stop(1); };
  const offSnd = on('soundchange', syncScore); syncScore();
  uiOpts.canvasAdvance = true; // a click anywhere on the film moves the speech on
  await fadeIn(350);
  const play = async part => {
    film.scene(part.film); score.mood(film.moodOf(part.film));
    if (part.lines.length) await step(say(part.lines));
    if (abort || !part.ask) return;
    const v = await step(choose(part.ask.choices)); if (abort) return;
    film.event(v); await step(say(part.ask[v] || []));
  };
  if (!heard) for (const part of S.founder) { if (abort) break; await play(part); }
  // chapter menu
  while (!abort) {
    const v = await step(choose([...S.founder.map((p, i) => ({ t: p.label, v: i, primary: i < 3 })), { t: 'Back to the plaza \u25b6', v: 'back', primary: true }], S.founderAgain[0]));
    if (v === 'back' || abort) break;
    await play(S.founder[v]);
  }
  closeDialogue(); offEsc(); offX(); offSnd(); setExitable(false);
  save.set('founderHeard', true); track('founder_full_finished');
  const y = G.town.ents.find(e => e.id === 'yasin'); if (y) y.emote = null;
  score.stop(1.6); host.classList.add('out'); await wait(650); film.destroy(); host.remove();
  await fadeOut(200); setScene(prevScene); G.scene = 'town'; audio.music('town'); await fadeIn(350);
  founderBusy = false; lock(false);
  if (!heard) quip(S.founderHeard, 3000);
  nextObjective();
}

// =====================================================================
// N. FINALE
// =====================================================================
let finaleBusy = false;
async function finaleAct() {
  if (finaleBusy || !G.world || G.scene !== 'town') return; finaleBusy = true; lock(true);
  await say(S.finale); closeDialogue();
  const v = await bookPanel('Launch pad'); if (v === 'booked') track('book_clicked');
  finaleBusy = false; lock(false);
}

// Test hook for automated playthroughs (tools/playthrough.cjs). Harmless in production.
window.__nixy = {
  G,
  walk: (x, y) => G.world.walkTo(G.world.player, x, y),
  talk: id => { const e = G.world.ents.find(e => e.id === id); const sc = getScene(); return sc?.h?.talk?.(e); },
  prop: act => { const p = G.world.map.props.find(p => p.act === act); const sc = getScene(); return sc?.h?.prop?.(p); },
  where: () => G.world?.player && [G.world.player.x, G.world.player.y, G.scene],
  tp: (x, y) => { const pl = G.world.player, n = G.world.nixy; pl.x = x; pl.y = y; pl.px = x * T; pl.py = y * T; pl.path = []; if (n) { n.x = x - 1; n.y = y; n.px = n.x * T; n.py = y * T; n.path = []; } },
  enter: id => enterBuilding(id),
  funnel: () => funnel(),
  services: () => openServices(),
  guide: id => guideTo(id),
  founder: () => founderAct(),
  exit: () => { const m = G.world.map; return G.world.walkTo(G.world.player, m.exit.x, m.exit.y); },
};

// =====================================================================
// THE FUNNEL: challenge → guided route → the right building → a plan
// =====================================================================
function setObjective(text) { const o = $('#obj'); if (!text) { o.hidden = true; return; } $('#objText').textContent = text; o.hidden = false; o.style.animation = 'none'; void o.offsetWidth; o.style.animation = ''; }
async function funnel() {
  const v = await challengePanel();
  track('challenge', v);
  if (v && SERVICES[v]) {
    G.challenge = v; G.tour = false; save.set('challenge', v); save.set('tour', false);
    await talk([['nixy', S.funnelPick.replace('{place}', SERVICES[v].name), 'happy']]);
    guideTo(v);
  } else if (v === 'tour') {
    G.tour = true; G.challenge = null; save.set('tour', true); save.set('challenge', null);
    await talk([['nixy', S.funnelTour, 'happy']]);
    nextObjective();
  } else {
    G.tour = false; save.set('tour', false);
    await talk([['nixy', S.funnelExplore, 'wink']]);
    nextObjective();
  }
}
function guideTo(target) {
  // target: a building id, 'bench' (the founder) or 'pad' (the launch pad)
  G.guideId = target;
  const m = G.town?.map; if (!m) return;
  if (SERVICES[target]) setObjective((G.tour ? `Tour ${Math.min(6, G.visited.size + 1)} of 6 · ` : 'Follow the gold line to ') + SERVICES[target].name);
  else if (target === 'bench') setObjective('Meet the founder on the bench');
  else if (target === 'pad') setObjective('Book a call at the launch pad');
  refreshGuide();
}
function guideGoal() {
  const m = G.town.map, id = G.guideId; if (!id) return null;
  if (SERVICES[id]) { const b = m.buildings.find(b => b.id === id); return { x: b.door[0], y: b.door[1], c: SERVICES[id].color }; }
  if (id === 'bench') return { x: m.bench.x, y: m.bench.y + 1, c: '#ffd60a' };
  if (id === 'pad') { const p = m.props.find(p => p.kind === 'pad'); return { x: p.x + 1, y: p.y + 1, c: '#6b4dff' }; }
  return null;
}
function refreshGuide() {
  const w = G.town; if (!w || G.world !== w || !w.player) return;
  const goal = guideGoal(); if (!goal) { w.guide = null; return; }
  const pl = w.player; if (Math.abs(pl.x - goal.x) + Math.abs(pl.y - goal.y) <= 1) { w.guide = null; return; }
  const path = findPath({ map: w.map, passable: (x, y) => !w.map.solid(x, y) || (x === goal.x && y === goal.y) }, pl.x, pl.y, [[goal.x, goal.y]]);
  w.guide = path ? { pts: [[pl.x, pl.y], ...path], color: goal.c } : null;
}
function nextObjective(resumed) {
  const heard = save.get('founderHeard', false);
  if (G.challenge && !G.visited.has(G.challenge)) { guideTo(G.challenge); if (resumed) quip('Welcome back. The gold line still goes to ' + SERVICES[G.challenge].name + '.', 3200); return; }
  if (G.tour) { const nx = ORDER.find(id => !G.visited.has(id)); if (nx) { guideTo(nx); if (resumed) quip('Welcome back. Next stop: ' + SERVICES[nx].name + '.', 3000); return; } }
  if ((G.challenge || G.tour || G.visited.size >= 2) && !heard) { guideTo('bench'); if (!G.nudged) { G.nudged = true; after(900, () => quip(S.nudgeYasin, 3200)); } return; }
  if (heard && (G.challenge || G.tour || G.visited.size >= 3)) { guideTo('pad'); return; }
  G.guideId = null; if (G.town) G.town.guide = null;
  setObjective('Explore Technicity · the Services button has everything at a glance');
  if (resumed) quip("You're back! Pick up wherever you like.", 2800);
}
async function openServices() {
  if (panelOpen() || ui.open) return;
  lock(true); const v = await servicesPanel(G.visited); lock(false);
  if (v === 'book') return bookPanel();
  if (v && v.startsWith('go:')) {
    const id = v.slice(3); G.challenge = G.challenge || id; guideTo(id);
    if (G.scene === 'inside') quip('Head outside and follow the gold line.', 2800); else quip('Follow the gold line.', 2200);
  }
}
const HOSTS = { rooms: 'bill', vf: 'nixy', si: 'moth', training: 'coach', school: 'teacher', arcade: 'clerk' };
async function serviceMenu(id, start) {
  closeDialogue();
  let v = start || await briefPanel(id);
  for (let guard = 0; v && guard < 8; guard++) {
    if (v === 'demo') v = await demo(id);
    else if (v === 'story') v = await storyPanel(id);
    else if (v === 'book') { const r = await bookPanel(SERVICES[id].name); if (r === 'booked') track('book_clicked', id); v = null; }
    else v = null;
  }
  setObjective(G.challenge === id || G.tour ? 'Done here? Head out and Nixy will show you the next stop' : SERVICES[id].name);
}
async function demo(id) {
  track('demo', id);
  if (id === 'rooms') { await say(S.roomHello); closeDialogue(); const r = await roomBuilder({ submitLead, onTrack: track }); return r === 'book' ? 'book' : null; }
  if (id === 'vf') { await avatarFlow(); return null; }
  if (id === 'si') { await say(S.mothIntro); closeDialogue(); return siPanel(); }
  if (id === 'school') { await say(S.schoolIntro); closeDialogue(); return schoolPanel(); }
  if (id === 'training') { await trainVideo(); return rosenPanel(); }
  if (id === 'arcade') { await arcadeFlow({ id: 'clerk' }); return null; }
  return null;
}
