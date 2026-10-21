// Map builders. Layout per the pack: Grey Office → winding route past five fragments → plaza with four secret projects.
import { GameMap } from './world.js';
import { TL, hash } from './art.js';
import { SERVICES } from '../data/services.js';

// ---------------- Grey Office ----------------
export function greyOffice() {
  const m = new GameMap(20, 12, TL.GFLOOR);
  m.rect(0, 0, 20, 3, TL.GWALL); m.rect(0, 0, 1, 12, TL.GWALL); m.rect(19, 0, 1, 12, TL.GWALL); m.rect(0, 11, 20, 1, TL.GWALL);
  m.addProp({ kind: 'light', x: 4, y: 0, w: 3, solid: false, flat: true, flicker: true });
  m.addProp({ kind: 'light', x: 13, y: 0, w: 3, solid: false, flat: true });
  m.addProp({ kind: 'screen', x: 7, y: 1, w: 6, solid: false, flat: true });
  m.addProp({ kind: 'poster', x: 3, y: 1, solid: false, flat: true });
  m.addProp({ kind: 'table', x: 6, y: 7, w: 8, h: 2, grey: true });
  const chairs = ['#5b5b5b', '#6b6457', '#4f5a63', '#6a5f5f', '#5d5d4f', '#55606b'];
  for (let i = 0; i < 4; i++) { m.addProp({ kind: 'chair', x: 7 + i * 2, y: 6, c: chairs[i] }); m.addProp({ kind: 'chair', x: 7 + i * 2, y: 9, c: chairs[(i + 2) % 6] }); }
  m.addProp({ kind: 'crt', x: 17, y: 3, grey: true, act: 'crt' });
  m.addProp({ kind: 'cable', x: 3, y: 9, solid: false, flat: true });
  m.addProp({ kind: 'plant', x: 1, y: 3, grey: true });
  m.addProp({ kind: 'plant', x: 18, y: 9, grey: true });
  m.door = { x: 16, y: 11 };
  return m;
}

// ---------------- Old town → the woods → Potara Technicity ----------------
export const TOWN = { w: 62, h: 25 };
export const CITY_X = 27; // first column of Technicity
export function town() {
  const m = new GameMap(TOWN.w, TOWN.h, TL.DUST);
  m.sky = true; m.skyRows = 4;
  m.rect(0, 0, TOWN.w, 4, TL.SKY); m.rect(0, 4, TOWN.w, 1, TL.RAIL);
  // the old town: dusty and low-tech (west), the woods (middle), the city (east)
  m.rect(0, 5, 18, 17, TL.DUST);
  m.rect(18, 5, 9, 17, TL.WOOD);
  m.rect(CITY_X, 5, TOWN.w - CITY_X, 17, TL.LAWN);
  m.rect(1, 11, 17, 2, TL.DIRT);                // the old high street
  m.rect(18, 11, 9, 2, TL.WOODPATH);            // the narrow passage through the woods
  m.rect(24, 11, 3, 2, TL.TALL);                // tall grass where the woods open out
  // Technicity: street, plaza, lanes
  m.rect(CITY_X, 10, TOWN.w - CITY_X - 1, 3, TL.PLAZA);  // main street (y 10-12)
  m.rect(36, 13, 8, 4, TL.PLAZA);               // lane between the two rows
  m.rect(CITY_X, 17, TOWN.w - CITY_X - 1, 5, TL.PLAZA);  // south plaza
  m.rect(CITY_X, 13, 3, 4, TL.PLAZA);
  m.set(24, 10, TL.WOODPATH); m.set(25, 10, TL.WOODPATH);
  // water and edges
  m.rect(1, 22, TOWN.w - 2, 2, TL.WATER); m.rect(0, 24, TOWN.w, 1, TL.ROCK);
  m.rect(0, 5, 1, 19, TL.ROCK); m.rect(TOWN.w - 1, 5, 1, 19, TL.ROCK);

  // ---- buildings: the old town (scenery, never enterable) ----
  m.addBuilding({ id: 'old', style: 'old', x: 2, y: 7, w: 4, h: 3, door: [3, 9] });
  m.addBuilding({ id: 'shack1', style: 'old', label: 'FAX AND FIX', x: 8, y: 6, w: 4, h: 3, door: [9, 8] });
  m.addBuilding({ id: 'shack2', style: 'old', label: 'TYPEWRITERS', x: 13, y: 15, w: 4, h: 3, door: [14, 17] });
  m.addBuilding({ id: 'shack3', style: 'old', label: 'FLOPPIES', x: 4, y: 15, w: 3, h: 3, door: [5, 17] });
  // ---- buildings: Technicity, row A (doors open onto the main street) ----
  m.addBuilding({ id: 'rooms', style: 'rooms', n: 1, x: 29, y: 6, w: 6, h: 4, door: [31, 9], locked: true, top: 40 });
  m.addBuilding({ id: 'arcade', style: 'arcade', n: 5, x: 37, y: 6, w: 6, h: 4, door: [39, 9], locked: true, top: 40 });
  m.addBuilding({ id: 'training', style: 'training', n: 6, x: 45, y: 6, w: 6, h: 4, door: [47, 9], locked: true, top: 40 });
  m.addBuilding({ id: 'vf', style: 'vf', n: 2, x: 53, y: 6, w: 6, h: 4, door: [55, 9], locked: true, top: 34 });
  // row B (doors open onto the south plaza)
  m.addBuilding({ id: 'si', style: 'si', n: 3, x: 30, y: 13, w: 6, h: 4, door: [32, 16], locked: true, top: 18 });
  m.addBuilding({ id: 'school', style: 'school', n: 4, x: 44, y: 13, w: 6, h: 4, door: [46, 16], locked: true, top: 18 });
  for (const b of m.buildings) if (b.style !== 'old' || b.id === 'old') m.set(b.door[0], b.door[1], b.style === 'old' ? TL.DIRT : TL.PLAZA);

  // ---- fragment sites ----
  m.addProp({ kind: 'phone', x: 10, y: 10, act: 'phone' });          // the old payphone
  m.addProp({ kind: 'star', x: 21, y: 8, solid: false, act: 'star', range: 4 });  // a gap in the trees
  m.addProp({ kind: 'monolith', x: 27, y: 7, act: 'logo' });          // the gate monolith
  m.addProp({ kind: 'arcade', x: 42, y: 9, act: 'arcade' });          // the cabinet by the Arcade door
  m.addProp({ kind: 'vault', x: 56, y: 18, w: 2, act: 'vault' });
  // furniture
  m.addProp({ kind: 'gate', x: 26, y: 10 });
  m.addProp({ kind: 'sign', x: 6, y: 10, label: 'OLD TOWN', col: '#d6cfa6' });
  m.addProp({ kind: 'bench', x: 28, y: 15, w: 2 });
  m.addProp({ kind: 'fountain', x: 33, y: 19, w: 2, h: 2 });
  m.addProp({ kind: 'pad', x: 39, y: 18, w: 3, h: 3, solid: false, act: 'pad' });
  for (const [x, y] of [[28, 13], [36, 10], [44, 10], [52, 10], [36, 17], [43, 17], [52, 17], [58, 12]]) m.addProp({ kind: 'lamp', x, y });
  for (const [x, y] of [[48, 19], [30, 20]]) m.addProp({ kind: 'holo', x, y });
  // a room-booking kiosk in the south-east (meetings themselves happen indoors, in rooms built for them)
  m.addProp({ kind: 'holo', x: 53, y: 14 });
  m.addProp({ kind: 'planter', x: 51, y: 14 }); m.addProp({ kind: 'planter', x: 55, y: 14 });
  // the old town after dark: a few broken gas lamps and a small graveyard for the office machines
  for (const [x, y] of [[2, 10], [13, 10], [8, 13]]) m.addProp({ kind: 'oldlamp', x, y });
  for (const [x, y, lean] of [[8, 19, 0], [10, 19, 1], [12, 19, -1], [9, 20, 0], [11, 20, 1]]) m.addProp({ kind: 'grave', x, y, lean });
  m.addProp({ kind: 'sign', x: 7, y: 20, label: 'RIP FAX', col: '#b9bfcb' });
  m.addProp({ kind: 'crate', x: 15, y: 9 }); m.addProp({ kind: 'crate', x: 16, y: 9 });
  // trees: dead and sparse in the old town, a dense dark pine wood, bright blossom trees in the city
  const onRoad = (x, y) => [TL.DIRT, TL.WOODPATH, TL.TALL, TL.PLAZA].includes(m.get(x, y));
  const free = (x, y) => !onRoad(x, y) && !m.solid(x, y) && !m.buildings.some(b => x >= b.x - 1 && x <= b.x + b.w && y >= b.y - 1 && y <= b.y + b.h + 1) && !m.props.some(p => Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2);
  for (let y = 5; y < 22; y++) for (let x = 1; x < TOWN.w - 1; x++) {
    if (!free(x, y)) continue;
    if (x < 18) { if (hash(x, y, 4) < .06) m.addProp({ kind: 'deadtree', x, y }); }
    else if (x < CITY_X) { if (hash(x, y, 5) < .62 && !(y >= 10 && y <= 13)) m.addProp({ kind: 'pine', x, y }); }
    else if (m.get(x, y) === TL.LAWN && (x === TOWN.w - 2 || y === 5) && hash(x, y, 9) < .5) m.addProp({ kind: 'tree', x, y, v: hash(x, y, 1), city: true });
  }
  m.start = { x: 3, y: 11 };
  for (const x of [29, 37, 45, 51, 58]) if (!m.solid(x, 21)) m.addProp({ kind: 'planter', x, y: 21 });
  for (const [x, y] of [[36, 5], [43, 5], [51, 5], [44, 9], [52, 9], [36, 9]]) if (!m.solid(x, y)) m.addProp({ kind: 'tree', x, y, v: hash(x, y, 2), city: true });
  m.cityX = CITY_X;
  // people going about their day (ambient; they don't block the way)
  m.walkers = [
    { look: 'v2', loop: [[29, 11], [57, 11]] }, { look: 'v3', loop: [[56, 20], [31, 18]] }, { look: 'v0', loop: [[38, 13], [42, 16], [38, 16]] },
  ];
  m.walkers.push({ kind: 'bot', loop: [[30, 19], [48, 19], [48, 21], [30, 21]] });
  // the old town's ghostly residents drift up and down, forever
  m.ghosts = [
    { look: 'v0', loop: [[2, 13], [7, 13], [7, 14], [2, 14]] },
    { look: 'v2', loop: [[12, 9], [16, 13], [12, 13]] },
    { look: 'v3', loop: [[1, 18], [6, 19], [13, 19], [6, 21]] },
    { look: 'v1', loop: [[7, 6], [7, 9], [1, 10]] },
  ];
  m.haunt = { x0: 18, x1: 24 }; // full gloom up to the woods, fading out by the tall grass
  m.cityStart = { x: 29, y: 12 };
  // Nixy's guided route (short): the payphone, the stars in the woods, then the tall grass
  m.route = [
    { to: [10, 11], stop: 'phone' },
    { to: [20, 11], stop: 'star' },
    { to: [24, 11], stop: 'meadow' },
  ];
  m.meadow = { x: 24, y: 11, w: 3, h: 2 };
  m.bench = { x: 28, y: 15 };
  return m;
}

// ---------------- interiors ----------------
function room(w, h) {
  const m = new GameMap(w, h, TL.FLOOR);
  m.rect(0, 0, w, 2, TL.WALL); m.rect(0, 0, 1, h, TL.WALL); m.rect(w - 1, 0, 1, h, TL.WALL); m.rect(0, h - 1, w, 1, TL.WALL);
  const dx = (w / 2) | 0; m.set(dx, h - 1, TL.MAT); m.exit = { x: dx, y: h - 1 }; m.start = { x: dx, y: h - 2 };
  return m;
}
export function interior(id) {
  const m = room(20, 11), o = 3; // o: horizontal offset so the 14-wide layouts sit centred
  m.accent = SERVICES[id]?.color || '#19d3c5';
  const A = pr => m.addProp({ ...pr, x: pr.x + o });
  if (id === 'rooms') {
    A({ kind: 'bigscreen', x: 3, y: 0, w: 8, solid: false, flat: true, label: 'ROOM SIM', blink: true, act: 'sim', range: 3, tall: 0 });
    A({ kind: 'table', x: 4, y: 4, w: 6, h: 2 });
    for (let i = 0; i < 3; i++) { A({ kind: 'chair', x: 4 + i * 2, y: 3, c: '#6d28d9' }); A({ kind: 'chair', x: 5 + i * 2, y: 6, c: '#0e7490' }); }
    A({ kind: 'plant', x: -2, y: 2 }); A({ kind: 'plant', x: 15, y: 2 }); A({ kind: 'shelf', x: -2, y: 7, w: 2 }); A({ kind: 'shelf', x: 14, y: 7, w: 2 });
    m.npcs = [{ id: 'bill', look: 'bill', x: 3 + o, y: 7, dir: 2 }, { id: 'bob', look: 'bob', x: 10 + o, y: 7, dir: 1 },
      // a real hybrid meeting at the table, the Leeds office on the wall behind them
      { id: 'meet1', look: 'v0', x: 5 + o, y: 3, dir: 0, lines: 'meet1' }, { id: 'meet2', look: 'v3', x: 7 + o, y: 3, dir: 0, lines: 'meet2' }];
  }
  if (id === 'vf') {
    m.rect(3 + o, 4, 8, 4, TL.RUG);
    A({ kind: 'tv', x: 6, y: 2, w: 2, act: 'tv', blink: true });
    A({ kind: 'sofa', x: 5, y: 6, w: 4 });
    A({ kind: 'shelf', x: -2, y: 2, w: 4 }); A({ kind: 'shelf', x: 12, y: 2, w: 4 });
    A({ kind: 'plant', x: 15, y: 8 }); A({ kind: 'plant', x: -2, y: 8 });
    m.npcs = [{ id: 'avatar', look: 'v3', x: 10 + o, y: 5, dir: 1, lines: 'avatar' }];
  }
  if (id === 'si') {
    A({ kind: 'whiteboard', x: 2, y: 0, w: 7, solid: false, flat: true, board: true });
    A({ kind: 'workstation', x: 11, y: 3, w: 2 }); A({ kind: 'workstation', x: -1, y: 3, w: 2 });
    A({ kind: 'desk', x: 3, y: 5, w: 3 }); A({ kind: 'plant', x: 15, y: 8 }); A({ kind: 'shelf', x: -2, y: 7, w: 2 });
    m.npcs = [{ id: 'moth', kind: 'moth', look: 'v0', x: 8 + o, y: 5, dir: 0 }];
  }
  if (id === 'arcade') {
    m.rect(3 + o, 3, 8, 6, TL.RUG);
    for (let i = 0; i < 5; i++) A({ kind: 'arcade', x: 1 + i * 3, y: 1, act: i === 2 ? 'flap' : 'dud' });
    A({ kind: 'arcade', x: -1, y: 5 }); A({ kind: 'arcade', x: 13, y: 5 });
    A({ kind: 'plant', x: -2, y: 8 }); A({ kind: 'plant', x: 15, y: 8 }); A({ kind: 'shelf', x: 14, y: 2, w: 2 });
    m.npcs = [{ id: 'clerk', look: 'v2', x: 4 + o, y: 6, dir: 0 }];
  }
  if (id === 'training') {
    A({ kind: 'tv', x: 5, y: 1, w: 3, act: 'tv', blink: true });
    A({ kind: 'whiteboard', x: -1, y: 0, w: 5, solid: false, flat: true, board: true, act: 'rosen', range: 3 });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) A({ kind: 'pupildesk', x: 2 + i * 3, y: 5 + j * 2 });
    A({ kind: 'desk', x: 11, y: 3, w: 2 }); A({ kind: 'plant', x: -2, y: 8 }); A({ kind: 'shelf', x: 14, y: 7, w: 2 });
    m.npcs = [{ id: 'coach', look: 'coach', x: 9 + o, y: 3, dir: 0 }];
  }
  if (id === 'school') {
    A({ kind: 'chalkboard', x: 2, y: 0, w: 9, solid: false, flat: true, board: true });
    A({ kind: 'desk', x: 11, y: 3, w: 2 });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) A({ kind: 'pupildesk', x: 1 + i * 3, y: 5 + j * 2 });
    A({ kind: 'plant', x: -2, y: 2 }); A({ kind: 'shelf', x: 14, y: 7, w: 2 });
    m.npcs = [{ id: 'teacher', look: 'teacher', x: 9 + o, y: 3, dir: 0 }];
  }
  if (SERVICES[id]?.story) (m.npcs ||= []).push({ id: 'story', look: SERVICES[id].story.look, x: 15, y: 8, dir: 1 });
  return m;
}
