/* 03 Theory: a concept map that grows itself, wired to a beating 3D heart.
   Tapping an idea on the map finds it in the model; the knowledge check does the same. */
import * as THREE from 'three';
import { makeStage, studio, canvasTexture, radialTexture, pin, reduced } from './stage.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const BPM = 72, PERIOD = 60 / BPM;

/* ---------- the concept map ---------- */
const BR = { structure: '#FFB199', circulation: '#FF8FB3', electrical: '#7DE9FF', vessels: '#C3B4FF' };
const NODES = [
  { id: 'heart', t: 'The heart', x: 400, y: 312, l: 0, f: { mode: 'anatomy', parts: [], k: 'Explore', text: 'A fist-sized pump with two sides and four chambers. It beats about 100,000 times a day.' } },
  { id: 'structure', t: 'Structure', x: 225, y: 190, l: 1, p: 'heart', b: 'structure', f: { mode: 'anatomy', parts: ['ra', 'la', 'rv', 'lv'], k: 'Structure', text: 'Four chambers in two pairs. The right side handles used blood, the left side pumps fresh blood.' } },
  { id: 'atria', t: 'Atria', x: 92, y: 120, l: 2, p: 'structure', f: { mode: 'anatomy', parts: ['ra', 'la'], k: 'Structure', text: 'The two upper chambers. They collect blood coming back in and top up the ventricles below.' } },
  { id: 'ventricles', t: 'Ventricles', x: 250, y: 66, l: 2, p: 'structure', f: { mode: 'anatomy', parts: ['rv', 'lv'], k: 'Structure', text: 'The two lower chambers and the real pumps. The left wall is thicker: it pushes blood round the whole body.' } },
  { id: 'valves', t: 'Valves', x: 84, y: 255, l: 2, p: 'structure', f: { mode: 'anatomy', parts: ['valves'], k: 'Structure', text: 'Four one-way doors: tricuspid, pulmonary, mitral and aortic. Their closing is the lub-dub you hear.' } },
  { id: 'circulation', t: 'Circulation', x: 580, y: 190, l: 1, p: 'heart', b: 'circulation', f: { mode: 'flow', parts: [], k: 'Circulation', text: 'Two loops in a figure of eight. Right side to the lungs and back, left side to the body and back.' } },
  { id: 'lungloop', t: 'Lung loop', x: 556, y: 62, l: 2, p: 'circulation', f: { mode: 'flow', parts: ['rv', 'pa', 'pv', 'la'], k: 'Circulation', text: 'Right ventricle to the lungs to the left atrium. Blood drops off carbon dioxide and picks up oxygen.' } },
  { id: 'bodyloop', t: 'Body loop', x: 716, y: 128, l: 2, p: 'circulation', f: { mode: 'flow', parts: ['lv', 'aorta', 'svc', 'ivc', 'ra'], k: 'Circulation', text: 'Left ventricle, aorta, every organ, then back through the vena cavae to the right atrium.' } },
  { id: 'electrical', t: 'Electrical', x: 585, y: 440, l: 1, p: 'heart', b: 'electrical', f: { mode: 'electric', parts: [], k: 'Electrical', text: 'The heart sets its own beat. Each one is a wave of electricity spreading from top to bottom.' } },
  { id: 'sa', t: 'SA node', x: 724, y: 372, l: 2, p: 'electrical', f: { mode: 'electric', parts: ['sa'], k: 'Electrical', text: 'The natural pacemaker, in the wall of the right atrium. It fires 60 to 100 times a minute at rest.' } },
  { id: 'av', t: 'AV node', x: 728, y: 508, l: 2, p: 'electrical', f: { mode: 'electric', parts: ['av'], k: 'Electrical', text: 'The gatekeeper. It holds the signal for a split second so the atria finish emptying first.' } },
  { id: 'ecg', t: 'ECG trace', x: 590, y: 568, l: 2, p: 'electrical', f: { mode: 'electric', parts: [], k: 'Electrical', text: 'What a heart monitor draws: the P wave (atria), the QRS spike (ventricles) and the T wave (reset).' } },
  { id: 'vessels', t: 'Vessels', x: 222, y: 440, l: 1, p: 'heart', b: 'vessels', f: { mode: 'anatomy', parts: ['aorta', 'pa', 'svc', 'ivc', 'pv'], k: 'Vessels', text: 'The pipework. Arteries carry blood away from the heart, veins bring it back.' } },
  { id: 'aorta', t: 'Aorta', x: 80, y: 382, l: 2, p: 'vessels', f: { mode: 'anatomy', parts: ['aorta'], k: 'Vessels', text: 'The body’s largest artery, arching up and over from the left ventricle.' } },
  { id: 'cavae', t: 'Vena cavae', x: 92, y: 520, l: 2, p: 'vessels', f: { mode: 'anatomy', parts: ['svc', 'ivc'], k: 'Vessels', text: 'Two large veins that bring used blood from the upper and lower body into the right atrium.' } },
  { id: 'pulart', t: 'Pulmonary artery', x: 262, y: 570, l: 2, p: 'vessels', f: { mode: 'anatomy', parts: ['pa'], k: 'Vessels', text: 'The one artery carrying oxygen-poor blood: from the right ventricle out to the lungs.' } },
];
const LINKS = [
  ['sa', 'atria', 'triggers'], ['av', 'ventricles', 'relays to'], ['pulart', 'lungloop', 'feeds'],
  ['aorta', 'bodyloop', 'starts'], ['valves', 'circulation', 'keep it one-way'],
];
const byId = Object.fromEntries(NODES.map(n => [n.id, n]));
const branchOf = n => n.b || (n.p && branchOf(byId[n.p]));
const SVGNS = 'http://www.w3.org/2000/svg';
const sv = (tag, attrs = {}, parent) => { const e = document.createElementNS(SVGNS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); parent?.appendChild(e); return e; };

function buildMap(svg, onPick) {
  svg.innerHTML = '';
  const gl = sv('g', {}, svg), gx = sv('g', {}, svg), gn = sv('g', {}, svg);
  const els = {};
  for (const n of NODES) {
    if (n.p) {
      const a = byId[n.p], mx = (a.x + n.x) / 2;
      const d = n.l === 1 ? `M${a.x},${a.y} C${a.x},${(a.y + n.y) / 2} ${mx},${n.y} ${n.x},${n.y}` : `M${a.x},${a.y} Q${(a.x + n.x) / 2 + (n.y - a.y) * 0.15},${(a.y + n.y) / 2 - (n.x - a.x) * 0.15} ${n.x},${n.y}`;
      n.path = sv('path', { d, class: 'lk' + (n.l === 1 ? ' b1' : '') }, gl);
      n.path.style.stroke = BR[branchOf(n)];
      n.path.style.strokeOpacity = n.l === 1 ? 0.8 : 0.45;
    }
    const g = sv('g', { class: `nd l${n.l} grow hide`, tabindex: 0, role: 'button', 'aria-label': n.t }, gn);
    g.style.setProperty('--k', BR[branchOf(n)] || '#fff');
    const r = sv('rect', {}, g), t = sv('text', { x: n.x, y: n.y }, g);
    t.textContent = n.t;
    n.g = g; n.r = r; n.text = t; els[n.id] = g;
    const pick = () => onPick(n);
    g.addEventListener('click', pick);
    g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  }
  for (const [a, b, label] of LINKS) {
    const A = byId[a], B = byId[b];
    const cx = (A.x + B.x) / 2 + (400 - (A.x + B.x) / 2) * 0.55, cy = (A.y + B.y) / 2 + (312 - (A.y + B.y) / 2) * 0.55;
    const path = sv('path', { d: `M${A.x},${A.y} Q${cx},${cy} ${B.x},${B.y}`, class: 'xl' }, gx);
    const tx = sv('text', { class: 'xlt', 'text-anchor': 'middle' }, gx);
    const mid = { x: 0.25 * A.x + 0.5 * cx + 0.25 * B.x, y: 0.25 * A.y + 0.5 * cy + 0.25 * B.y };
    tx.setAttribute('x', mid.x); tx.setAttribute('y', mid.y - 6); tx.textContent = label;
    LINKS.find(l => l[0] === a && l[1] === b).els = [path, tx];
  }
  // size the pills to their labels
  requestAnimationFrame(() => {
    for (const n of NODES) {
      let w; try { w = n.text.getComputedTextLength(); } catch { w = n.t.length * 7.5; }
      const padX = n.l === 0 ? 22 : 14, h = n.l === 0 ? 46 : n.l === 1 ? 36 : 30;
      n.r.setAttribute('x', n.x - w / 2 - padX); n.r.setAttribute('y', n.y - h / 2);
      n.r.setAttribute('width', w + padX * 2); n.r.setAttribute('height', h); n.r.setAttribute('rx', h / 2);
    }
  });
  return els;
}

async function growMap(token) {
  const live = () => token.id === token.cur;
  const w = ms => new Promise(r => setTimeout(r, reduced ? 0 : ms));
  for (const n of NODES) {
    n.g.classList.add('hide');
    if (n.path) { const L = n.path.getTotalLength(); n.path.style.transition = 'none'; n.path.style.strokeDasharray = L; n.path.style.strokeDashoffset = L; }
  }
  LINKS.forEach(l => l.els.forEach(e => e.classList.remove('on')));
  await w(200); if (!live()) return;
  const draw = n => { if (n.path) { n.path.style.transition = 'stroke-dashoffset .7s cubic-bezier(.2,.7,.1,1)'; n.path.style.strokeDashoffset = 0; } };
  byId.heart.g.classList.remove('hide');
  await w(500);
  for (const b of NODES.filter(n => n.l === 1)) {
    if (!live()) return;
    draw(b); await w(380); b.g.classList.remove('hide'); await w(220);
    for (const c of NODES.filter(n => n.p === b.id)) { draw(c); await w(200); c.g.classList.remove('hide'); await w(120); }
  }
  await w(400);
  for (const l of LINKS) { if (!live()) return; l.els.forEach(e => e.classList.add('on')); await w(450); }
}

/* ---------- the heart ---------- */
function shape(v, o) {
  const t = (1 - v.y) / 2, k = 1 - o.taper * t * t;
  const y = v.y < 0 ? v.y * (1 + o.apex) : v.y * 0.92;
  const n = 1 + o.noise * Math.sin(v.x * 4.1 + o.seed) * Math.sin(v.y * 3.3 + o.seed * 1.7) * Math.sin(v.z * 3.7 + o.seed * 0.6);
  return new THREE.Vector3(v.x * k * n * o.s[0], y * n * o.s[1], v.z * k * n * o.s[2]);
}
function blob(o) {
  o = { taper: 0, apex: 0, noise: 0.03, seed: 1, s: [1, 1, 1], ...o };
  const g = new THREE.SphereGeometry(1, 96, 72).rotateY(-Math.PI / 2); // seam to the back
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const f = shape(v, o); p.setXYZ(i, f.x, f.y, f.z); }
  g.computeVertexNormals();
  g.userData.o = o;
  return g;
}
function surfaceCurve(geo, dirs, lift = 1.012) {
  const pts = dirs.map(d => shape(new THREE.Vector3(...d).normalize(), geo.userData.o).multiplyScalar(lift));
  return new THREE.CatmullRomCurve3(pts);
}
const curve = pts => new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));

function fibreBump() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
    let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 900; i++) {
      const x = r() * w, y = r() * h, L = 30 + r() * 90, a = -0.9 + r() * 0.3;
      g.strokeStyle = `rgba(${r() < 0.5 ? '255,255,255' : '0,0,0'},${0.05 + r() * 0.12})`;
      g.lineWidth = 1 + r() * 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
  }, { srgb: false });
}

function buildHeart(root) {
  const bump = fibreBump(); bump.wrapS = bump.wrapT = THREE.RepeatWrapping; bump.repeat.set(2, 2);
  const muscle = (c, sheen = 0xff5a6e) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.5, clearcoat: 0.75, clearcoatRoughness: 0.22, sheen: 0.7, sheenRoughness: 0.5, sheenColor: new THREE.Color(sheen), bumpMap: bump, bumpScale: 0.8, envMapIntensity: 0.7 });
  const vessel = c => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.38, clearcoat: 0.8, clearcoatRoughness: 0.18, sheen: 0.4, sheenColor: new THREE.Color(0xffc0c8), envMapIntensity: 0.7 });
  const P = {};
  const add = (name, label, geo, material, parent, pos = [0, 0, 0], rot = [0, 0, 0], anchor) => {
    const m = new THREE.Mesh(geo, material); m.position.set(...pos); m.rotation.set(...rot);
    m.castShadow = m.receiveShadow = true; parent.add(m);
    (P[name] ||= { name, label, meshes: [], anchor: new THREE.Vector3(...(anchor || pos)) }).meshes.push(m);
    return m;
  };
  const vent = new THREE.Group(); vent.position.set(0, 0.15, 0); root.add(vent);
  const atria = new THREE.Group(); root.add(atria);

  const lvGeo = blob({ s: [0.62, 0.98, 0.62], taper: 0.5, apex: 0.3, seed: 2 });
  const lv = add('lv', 'Left ventricle', lvGeo, muscle(0x7E1724), vent, [0.22, -0.55, -0.1], [0, -0.2, 0.42], [0.62, -0.75, 0.25]);
  const rvGeo = blob({ s: [0.54, 0.74, 0.5], taper: 0.45, apex: 0.15, seed: 5 });
  const rv = add('rv', 'Right ventricle', rvGeo, muscle(0x8C1F2C), vent, [-0.24, -0.38, 0.2], [0, 0.3, 0.5], [-0.35, -0.3, 0.62]);
  add('ra', 'Right atrium', blob({ s: [0.45, 0.48, 0.44], seed: 7, noise: 0.05 }), muscle(0x6E1A30), atria, [-0.62, 0.42, 0.02], [0, 0, 0], [-0.98, 0.42, 0.15]);
  add('ra', 'Right atrium', blob({ s: [0.22, 0.13, 0.15], seed: 3 }), muscle(0x6E1A30), atria, [-0.38, 0.72, 0.3], [0, 0, -0.5]);
  add('la', 'Left atrium', blob({ s: [0.46, 0.34, 0.4], seed: 9, noise: 0.05 }), muscle(0x6A182D), atria, [0.32, 0.5, -0.38], [0, 0, 0], [0.8, 0.5, -0.3]);
  add('la', 'Left atrium', blob({ s: [0.18, 0.11, 0.13], seed: 4 }), muscle(0x6A182D), atria, [0.6, 0.56, 0.06], [0, 0, 0.6]);

  // coronary arteries ride on the ventricle surfaces (children, so they beat with them)
  const cor = vessel(0xC7302E);
  const lad = surfaceCurve(lvGeo, [[-0.5, 0.95, 0.6], [-0.62, 0.4, 0.72], [-0.6, -0.2, 0.75], [-0.4, -0.75, 0.6], [-0.1, -1, 0.3]]);
  const diag = surfaceCurve(lvGeo, [[-0.62, 0.4, 0.72], [-0.2, 0.2, 0.95], [0.3, -0.1, 0.9]]);
  const circ = surfaceCurve(lvGeo, [[-0.3, 0.98, 0.3], [0.4, 0.9, 0.4], [0.9, 0.6, 0.1], [0.95, 0.3, -0.3]]);
  [lad, diag, circ].forEach((c, i) => add('coronary', 'Coronary arteries', new THREE.TubeGeometry(c, 48, i ? 0.016 : 0.022, 8), cor, lv));
  const rca = surfaceCurve(rvGeo, [[0.5, 0.9, 0.5], [-0.1, 0.92, 0.6], [-0.7, 0.7, 0.5], [-0.95, 0.2, 0.3]]);
  add('coronary', 'Coronary arteries', new THREE.TubeGeometry(rca, 48, 0.02, 8), cor, rv);

  // great vessels
  const red = vessel(0xA81F2A), blue = vessel(0x2B4296);
  const tube = (name, label, pts, r, m, anchor) => add(name, label, new THREE.TubeGeometry(curve(pts), 64, r, 20, false), m, root, undefined, undefined, anchor);
  tube('aorta', 'Aorta', [[0.05, 0.2, -0.05], [0.02, 0.75, 0.02], [0.05, 1.2, -0.05], [0.3, 1.42, -0.25], [0.55, 1.25, -0.48], [0.6, 0.75, -0.55], [0.6, -0.7, -0.6]], 0.17, red, [0.12, 1.38, 0.05]);
  tube('aorta', 'Aorta', [[0.12, 1.33, -0.12], [0.08, 1.85, -0.1]], 0.055, red);
  tube('aorta', 'Aorta', [[0.3, 1.4, -0.25], [0.33, 1.9, -0.25]], 0.05, red);
  tube('aorta', 'Aorta', [[0.47, 1.33, -0.42], [0.6, 1.85, -0.45]], 0.05, red);
  tube('pa', 'Pulmonary artery', [[-0.12, 0.2, 0.28], [-0.12, 0.7, 0.4], [0.0, 1.0, 0.25], [0.12, 1.08, 0.05]], 0.15, blue, [-0.18, 0.75, 0.55]);
  tube('pa', 'Pulmonary artery', [[0.1, 1.07, 0.06], [0.45, 1.08, -0.05], [0.88, 1.0, -0.15]], 0.1, blue);
  tube('pa', 'Pulmonary artery', [[0.0, 1.03, 0.15], [-0.2, 1.0, -0.2], [-0.65, 0.98, -0.25], [-0.98, 0.95, -0.25]], 0.1, blue);
  tube('svc', 'Superior vena cava', [[-0.66, 1.6, -0.05], [-0.65, 1.1, -0.02], [-0.63, 0.65, 0.0]], 0.13, blue, [-0.8, 1.35, 0.05]);
  tube('ivc', 'Inferior vena cava', [[-0.6, 0.1, -0.1], [-0.58, -0.35, -0.15], [-0.55, -0.85, -0.2]], 0.14, blue, [-0.72, -0.55, 0]);
  [[[0.6, 0.6, -0.45], [1.05, 0.72, -0.5]], [[0.58, 0.38, -0.5], [1.02, 0.3, -0.58]], [[0.05, 0.6, -0.6], [-0.3, 0.72, -0.78]], [[0.05, 0.4, -0.62], [-0.28, 0.3, -0.8]]]
    .forEach((pts, i) => tube('pv', 'Pulmonary veins', pts, 0.07, red, i ? undefined : [1.05, 0.72, -0.5]));

  // valves: glowing rings, only shown when asked for
  const valveM = new THREE.MeshBasicMaterial({ color: 0x7DE9FF, transparent: true, opacity: 0.95, depthTest: false });
  const valves = new THREE.Group(); valves.visible = false; root.add(valves);
  P.valves = { name: 'valves', meshes: [], items: [] };
  [['Tricuspid', [-0.4, 0.1, 0.18], [0.3, 0.6, 0.5]], ['Pulmonary', [-0.12, 0.25, 0.3], [1.4, 0, 0]], ['Mitral', [0.22, 0.2, -0.2], [0.4, -0.5, -0.5]], ['Aortic', [0.04, 0.24, -0.04], [1.5, 0, 0.2]]]
    .forEach(([label, p, r]) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.018, 10, 48), valveM); m.position.set(...p); m.rotation.set(...r); m.renderOrder = 10; valves.add(m);
      P.valves.items.push({ label: label + ' valve', anchor: new THREE.Vector3(...p) });
    });
  P.valves.group = valves;

  // conduction system: SA node, AV node and the pathway between them
  const sprite = (color, s) => { const m = new THREE.Sprite(new THREE.SpriteMaterial({ map: radialTexture(color), depthTest: false, transparent: true, blending: THREE.AdditiveBlending })); m.scale.setScalar(s); m.renderOrder = 12; return m; };
  const sa = sprite('rgba(255,240,170,1)', 0.35); sa.position.set(-0.5, 0.74, 0.22); root.add(sa);
  const av = sprite('rgba(255,240,170,1)', 0.28); av.position.set(-0.18, 0.18, 0.14); root.add(av);
  P.sa = { name: 'sa', label: 'SA node', meshes: [], anchor: sa.position.clone(), sprite: sa };
  P.av = { name: 'av', label: 'AV node', meshes: [], anchor: av.position.clone(), sprite: av };
  const paths = [
    curve([[-0.5, 0.74, 0.22], [-0.35, 0.45, 0.2], [-0.18, 0.18, 0.14]]),
    curve([[-0.18, 0.18, 0.14], [-0.05, -0.3, 0.12], [0.25, -0.9, 0.12], [0.62, -1.25, 0.05]]),
    curve([[0.62, -1.25, 0.05], [0.85, -0.6, -0.1], [0.75, 0.0, -0.2]]),
    curve([[-0.05, -0.3, 0.12], [-0.4, -0.55, 0.3], [-0.65, -0.15, 0.3]]),
  ];
  const lineM = new THREE.LineBasicMaterial({ color: 0xFFE9A0, transparent: true, opacity: 0, depthTest: false, blending: THREE.AdditiveBlending });
  const wires = paths.map(c => { const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(c.getPoints(60)), lineM); l.renderOrder = 11; root.add(l); return l; });
  const sparks = paths.map(() => { const s = sprite('rgba(255,236,150,1)', 0.3); s.visible = false; root.add(s); return s; });

  return { P, vent, atria, lv, rv, valves, sa, av, paths, sparks, lineM };
}

const FLOW = {
  blue: [
    [[-0.66, 1.6, -0.05], [-0.64, 0.9, 0], [-0.6, 0.42, 0.05], [-0.38, 0.08, 0.18], [-0.3, -0.4, 0.22], [-0.2, -0.2, 0.32], [-0.12, 0.25, 0.33], [-0.12, 0.7, 0.4], [0, 1.0, 0.25], [0.45, 1.08, -0.05], [0.88, 1.0, -0.15]],
    [[-0.55, -0.85, -0.2], [-0.58, -0.2, -0.1], [-0.6, 0.35, 0.0], [-0.38, 0.08, 0.18], [-0.32, -0.45, 0.2], [-0.2, -0.2, 0.32], [-0.12, 0.25, 0.33], [-0.12, 0.7, 0.4], [0, 1.0, 0.25], [-0.2, 1.0, -0.2], [-0.98, 0.95, -0.25]],
  ],
  red: [
    [[1.05, 0.72, -0.5], [0.62, 0.6, -0.45], [0.32, 0.5, -0.38], [0.25, 0.15, -0.2], [0.45, -0.6, -0.05], [0.2, -0.3, 0.0], [0.05, 0.2, -0.05], [0.02, 0.75, 0.02], [0.05, 1.2, -0.05], [0.3, 1.42, -0.25], [0.55, 1.25, -0.48], [0.6, 0.75, -0.55], [0.6, -0.7, -0.6]],
    [[-0.3, 0.72, -0.78], [0.05, 0.6, -0.6], [0.32, 0.5, -0.38], [0.25, 0.15, -0.2], [0.45, -0.6, -0.05], [0.2, -0.3, 0.0], [0.05, 0.2, -0.05], [0.02, 0.75, 0.02], [0.05, 1.2, -0.05], [0.3, 1.42, -0.25], [0.55, 1.25, -0.48], [0.6, 0.75, -0.55], [0.6, -0.7, -0.6]],
  ],
};

function buildFlow(root) {
  const curves = [...FLOW.blue.map(p => [curve(p), new THREE.Color(0x5A86FF)]), ...FLOW.red.map(p => [curve(p), new THREE.Color(0xFF4D5E)])];
  const N = 70, total = N * curves.length;
  const pos = new Float32Array(total * 3), col = new Float32Array(total * 3), seeds = [];
  curves.forEach(([, c], ci) => { for (let i = 0; i < N; i++) { const k = ci * N + i; c.toArray(col, k * 3); seeds.push({ ci, u: i / N + Math.random() * 0.01, j: [(Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.08] }); } });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({ size: 0.09, map: radialTexture('rgba(255,255,255,1)', 64), vertexColors: true, transparent: true, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0 });
  const pts = new THREE.Points(geo, mat); pts.renderOrder = 9; root.add(pts);
  const v = new THREE.Vector3();
  return {
    mat,
    tick(dt, speed) {
      seeds.forEach((s, k) => {
        s.u = (s.u + dt * speed) % 1;
        curves[s.ci][0].getPointAt(s.u, v);
        pos[k * 3] = v.x + s.j[0]; pos[k * 3 + 1] = v.y + s.j[1]; pos[k * 3 + 2] = v.z + s.j[2];
      });
      geo.attributes.position.needsUpdate = true;
    },
  };
}

/* ---------- ECG strip: a sweeping trace like a bedside monitor ---------- */
function ecgWave(p) {
  const g = (c, w, a) => a * Math.exp(-((p - c) ** 2) / (2 * w * w));
  return g(0.1, 0.025, 0.12) + g(0.2, 0.008, -0.12) + g(0.22, 0.01, 1) + g(0.245, 0.01, -0.28) + g(0.45, 0.04, 0.26);
}
function makeEcg(canvas) {
  const ctx = canvas.getContext('2d');
  let W = 0, H = 0, x = 0, lastY = null;
  const dpr = Math.min(devicePixelRatio, 2);
  function size() { W = canvas.clientWidth; H = canvas.clientHeight; canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); x = 0; lastY = null; }
  new ResizeObserver(size).observe(canvas); size();
  const pxPerSec = 120;
  return (dt, t, bright) => {
    if (!W) return;
    const steps = Math.max(1, Math.round(dt * pxPerSec));
    for (let s = 0; s < steps; s++) {
      const tt = t - (steps - s) / pxPerSec, p = (tt % PERIOD) / PERIOD;
      const y = H * 0.68 - ecgWave(p) * H * 0.6;
      ctx.clearRect(x, 0, 14, H);
      ctx.strokeStyle = bright ? '#7DE9FF' : 'rgba(94,240,192,.85)';
      ctx.lineWidth = bright ? 2 : 1.5; ctx.lineJoin = 'round';
      if (lastY !== null && x > 0) { ctx.beginPath(); ctx.moveTo(x - 1, lastY); ctx.lineTo(x, y); ctx.stroke(); }
      lastY = y; x += 1;
      if (x >= W) { x = 0; lastY = null; }
    }
    ctx.fillStyle = bright ? '#fff' : '#5EF0C0';
    ctx.beginPath(); ctx.arc(Math.max(0, x - 1), lastY ?? H * 0.68, 2.5, 0, 7); ctx.fill();
  };
}

/* ---------- the chapter ---------- */
export function init(root, { gl }) {
  const svg = $('#mindmap', root);
  const info = $('#heartInfo', root), hiK = $('#hiK', root), hiT = $('#hiT', root), hiP = $('#hiP', root);
  let heart = null, selected = null;

  function pick(n) {
    selected = n;
    NODES.forEach(m => m.g.classList.toggle('sel', m === n));
    show(n.f.k, n.t, n.f.text);
    heart?.focus(n.f);
    setModeTabs(n.f.mode);
  }
  function show(k, t, p) { hiK.textContent = k; hiT.textContent = t; hiP.textContent = p; info.classList.remove('swap'); void info.offsetWidth; info.classList.add('swap'); }

  buildMap(svg, pick);
  const token = { id: 0, cur: 0 };
  const grow = () => { token.cur = ++token.id; growMap({ ...token, get cur() { return token.cur; } }).then(() => root.dispatchEvent(new CustomEvent('progress', { bubbles: true, detail: { chapter: 'theory', step: 1, of: 3 } }))); };
  let grown = false;
  new IntersectionObserver(es => { if (!grown && es.some(e => e.isIntersecting)) { grown = true; grow(); } }, { threshold: 0.3 }).observe(svg);
  $('#mapReplay', root).addEventListener('click', grow);

  const tabs = $$('[data-hmode]', root);
  function setModeTabs(m) { tabs.forEach(b => b.setAttribute('aria-checked', String(b.dataset.hmode === m))); }
  tabs.forEach(b => b.addEventListener('click', () => {
    const m = b.dataset.hmode, n = { anatomy: byId.heart, flow: byId.circulation, electric: byId.electrical }[m];
    pick(n);
  }));

  if (gl) heart = initHeart(root);
  else $$('.nogl', root).forEach(n => n.hidden = false);

  initQuiz(root, f => { const n = byId[f]; pick(n); });
}

function initHeart(root) {
  const canvas = $('#heartCanvas', root);
  const st = makeStage(canvas, { fov: 30, exposure: 0.95 });
  const { scene, camera, controls, size } = st;
  studio(scene, { floorY: -1.75, shadowSize: 3, rim: 0xff8fb3, fill: 0x7de9ff });
  const root3 = new THREE.Group(); root3.rotation.set(0.05, -0.15, -0.12); scene.add(root3);
  const H = buildHeart(root3);
  const flow = buildFlow(root3);
  const ecg = makeEcg($('#ecg', root));
  camera.position.set(0.3, 0.7, 8.6); controls.target.set(0.05, 0.15, 0);
  controls.autoRotate = !reduced; controls.autoRotateSpeed = 0.7;
  let idle;
  controls.addEventListener('start', () => { controls.autoRotate = false; clearTimeout(idle); });
  controls.addEventListener('end', () => { clearTimeout(idle); if (!reduced) idle = setTimeout(() => controls.autoRotate = true, 7000); });
  const fit = () => {
    const k = camera.aspect < 0.85 ? 1.15 : 1;
    camera.position.sub(controls.target).setLength(8.6 * k).add(controls.target);
    // nudge the picture right and down, clear of the info card, without moving the orbit pivot
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w && h) { if (w > 420) camera.setViewOffset(w, h, -w * 0.1, -h * 0.04, w, h); else camera.clearViewOffset(); }
  };
  new ResizeObserver(fit).observe(canvas);

  // every mesh with its own material so it can dim or glow alone
  const all = Object.values(H.P).flatMap(p => p.meshes);
  for (const m of all) { m.material = m.material.clone(); m.userData.base = m.material.color.clone(); }

  const tagsEl = $('#heartTags', root);
  let tags = [];
  let focus = { mode: 'anatomy', parts: [] }, glowT = 0;

  function setTags(list) {
    tagsEl.innerHTML = ''; tags = [];
    for (const { label, anchor } of list) {
      const el = document.createElement('div'); el.className = 'tag'; el.style.setProperty('--c', 'var(--ice)');
      el.innerHTML = `<i>•</i><span>${label}</span>`; tagsEl.appendChild(el); tags.push({ el, anchor });
    }
  }
  function apply() {
    const sel = new Set(focus.parts), dimOthers = sel.size > 0, see = focus.mode !== 'anatomy';
    for (const p of Object.values(H.P)) for (const m of p.meshes) {
      const on = sel.has(p.name), isMuscle = ['lv', 'rv', 'ra', 'la'].includes(p.name);
      const op = see ? (on ? 0.55 : isMuscle ? 0.16 : 0.3) : dimOthers && !on ? 0.2 : 1;
      const tr = op < 1;
      if (m.material.transparent !== tr) { m.material.transparent = tr; m.material.depthWrite = !tr; m.material.needsUpdate = true; }
      m.material.opacity = op;
    }
    H.valves.visible = sel.has('valves');
    const labels = [];
    for (const name of sel) {
      const p = H.P[name];
      if (p.items) labels.push(...p.items);
      else if (p.label) labels.push({ label: p.label, anchor: p.anchor });
    }
    setTags(labels);
    glowT = 0;
  }
  const tmp = new THREE.Vector3();
  const flowSpeed = { v: 0 }, wireOp = { v: 0 };

  st.onTick((dt, t) => {
    const p = (t % PERIOD) / PERIOD;
    const bumpF = (a, b) => (p < a || p > b ? 0 : Math.sin(Math.PI * (p - a) / (b - a)));
    const atr = bumpF(0.06, 0.22), ven = bumpF(0.2, 0.52);
    if (!reduced) {
      H.vent.scale.set(1 - 0.05 * ven, 1 - 0.035 * ven, 1 - 0.05 * ven);
      H.atria.scale.setScalar(1 - 0.05 * atr);
    }
    // highlight glow
    glowT += dt;
    const g = 0.07 + 0.05 * Math.sin(glowT * 4);
    const sel = new Set(focus.parts);
    for (const pp of Object.values(H.P)) for (const m of pp.meshes) {
      if (!m.material.emissive) continue;
      if (sel.has(pp.name)) m.material.emissive.setRGB(0.49 * g, 0.91 * g, g); else m.material.emissive.setRGB(0, 0, 0);
    }
    // blood flow
    const flowOn = focus.mode === 'flow';
    flow.mat.opacity += ((flowOn ? 1 : 0) - flow.mat.opacity) * 0.08;
    if (flow.mat.opacity > 0.01) flow.tick(dt, (0.05 + 0.13 * ven) * (reduced ? 0 : 1));
    // electrical
    const elec = focus.mode === 'electric';
    wireOp.v += ((elec ? 0.55 : 0) - wireOp.v) * 0.08; H.lineM.opacity = wireOp.v;
    const fire = (k0, k1) => (p >= k0 && p <= k1 ? (p - k0) / (k1 - k0) : -1);
    const legs = [fire(0.0, 0.1), fire(0.17, 0.26), fire(0.26, 0.36), fire(0.2, 0.3)];
    H.sparks.forEach((s, i) => { const u = legs[i]; s.visible = elec && u >= 0; if (s.visible) H.paths[i].getPointAt(Math.min(1, u), s.position); });
    const saGlow = sel.has('sa') || elec, avGlow = sel.has('av') || elec;
    H.sa.visible = saGlow; H.av.visible = avGlow;
    H.sa.scale.setScalar(0.3 + (p < 0.08 ? 0.35 * (1 - p / 0.08) : 0) + (sel.has('sa') ? 0.12 * Math.sin(t * 6) : 0));
    H.av.scale.setScalar(0.24 + (p > 0.1 && p < 0.2 ? 0.25 : 0) + (sel.has('av') ? 0.1 * Math.sin(t * 6) : 0));
    // ECG
    ecg(dt, t, elec);
    // labels
    for (const tg of tags) { root3.localToWorld(tmp.copy(tg.anchor)); pin(tg.el, tmp, camera, size); }
  });

  apply();
  return { focus(f) { focus = f; apply(); } };
}

/* ---------- knowledge check ---------- */
function initQuiz(root, focusNode) {
  const Q = [
    { q: 'Which chamber pumps oxygen-rich blood out to the whole body?', a: ['Right atrium', 'Left ventricle', 'Right ventricle'], ok: 1, node: 'ventricles', why: 'The left ventricle. That’s why its wall is the thickest in the heart.' },
    { q: 'What sets the rhythm of every heartbeat?', a: ['The AV node', 'The aortic valve', 'The SA node'], ok: 2, node: 'sa', why: 'The SA node, the heart’s own pacemaker in the right atrium.' },
    { q: 'Where does blood go straight after the right ventricle?', a: ['To the lungs', 'Into the aorta', 'Back to the vena cava'], ok: 0, node: 'lungloop', why: 'To the lungs, through the pulmonary artery, to pick up oxygen.' },
  ];
  const qEl = $('#quizQ', root), aEl = $('#quizA', root), fEl = $('#quizF', root), sEl = $('#quizScore', root);
  let i = 0, score = 0, tries = 0;
  function render() {
    if (i >= Q.length) {
      qEl.textContent = score === Q.length ? 'Three for three. Concepts tied.' : `${score} of ${Q.length} first time. The map is always there to revisit.`;
      aEl.innerHTML = '<button type="button">Go again</button>';
      aEl.firstChild.addEventListener('click', () => { i = 0; score = 0; sEl.textContent = '0 / 3'; fEl.textContent = ''; render(); });
      root.dispatchEvent(new CustomEvent('progress', { bubbles: true, detail: { chapter: 'theory', step: 3, of: 3 } }));
      return;
    }
    const q = Q[i]; tries = 0;
    qEl.textContent = q.q;
    aEl.innerHTML = q.a.map((a, k) => `<button type="button" data-k="${k}">${a}</button>`).join('');
    $$('button', aEl).forEach(b => b.addEventListener('click', () => answer(+b.dataset.k, b)));
  }
  function answer(k, b) {
    const q = Q[i];
    if (k === q.ok) {
      b.classList.add('right'); if (!tries) score++;
      sEl.textContent = `${score} / ${Q.length}`;
      fEl.textContent = q.why; focusNode(q.node);
      $$('button', aEl).forEach(x => x.disabled = true);
      setTimeout(() => { i++; render(); }, 2600);
    } else { tries++; b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); fEl.textContent = 'Not quite. Have another look at the map.'; }
  }
  render();
}
