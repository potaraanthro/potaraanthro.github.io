/* 01 Hands-on: a transistor radio modelled in code and assembled in nine steps.
   Each part knows where it lives in the finished radio and where it waits in the
   exploded "parts tray". Steps move parts home along an arc, the camera follows. */
import * as THREE from 'three';
import { makeStage, studio, canvasTexture, pin, ease, cameraRig, reduced } from './stage.js';

const C = {
  cream: 0xEFE6D2, navy: 0x1A2250, brass: 0xC99A4E, gun: 0x2A2D38, pcb: 0x0F4F3E,
  chip: 0x15161C, steel: 0xB8BEC9, leather: 0x6A3B24, red: 0xE0443E,
};

const STEPS = [
  { t: 'Meet the parts', d: 'Every part, numbered in the order it goes in. Drag to look around, or press play.', cam: [[3.3, 4.2, 11.6], [-0.3, 0.35, 0]] },
  { t: 'Rear housing', d: 'Lay the housing face up. Check all four mounting posts are intact before you start.', part: 'housing', cam: [[2.9, 3.0, 4.4], [0, -0.1, -0.2]] },
  { t: 'Circuit board', d: 'Lower the board onto the posts, components facing you. It should sit flat without any force.', part: 'pcb', cam: [[1.6, 2.6, 4.0], [0, 0, -0.3]] },
  { t: 'Speaker', d: 'Seat the speaker over the left of the board, magnet to the back. Red lead goes to the + pad.', part: 'speaker', cam: [[-2.4, 1.3, 3.6], [-0.7, 0, 0]] },
  { t: 'Tuning dial', d: 'Turn the capacitor shaft fully anticlockwise, then push the dial on so 530 sits under the needle.', part: 'dial', cam: [[2.7, 1.0, 3.1], [0.85, 0.12, 0]] },
  { t: '9V battery', d: 'Clip the battery into the bay under the dial, label facing out. Snap the clip on square.', part: 'battery', cam: [[2.5, -0.2, 3.0], [0.75, -0.55, 0]] },
  { t: 'Faceplate', d: 'Hook the top edge in first, then press along the bottom until both clips click.', part: 'faceplate', cam: [[2.6, 1.5, 5.0], [0, 0, 0.3]] },
  { t: 'Knobs, antenna, strap', d: 'Push the knobs on until they click. Raise the antenna. Clip the strap to both lugs.', part: 'knobs', cam: [[3.2, 2.2, 4.6], [0.3, 0.5, 0.2]] },
  { t: 'Four screws', d: 'Turn the radio over. Drive each screw a quarter-turn past snug, no more, or the posts crack.', part: 'screws', cam: [[-2.6, 1.6, -4.4], [0, -0.1, -0.4]] },
  { t: 'Power on and test', d: 'Turn the volume knob. You should hear static, then a station as you sweep the dial. Done.', part: 'power', cam: [[2.4, 1.3, 5.2], [0, 0.3, 0]] },
];

/* ---------- geometry helpers ---------- */
function rrShape(w, h, r, S = THREE.Shape) {
  const s = new S(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
function circlePath(cx, cy, r) { const p = new THREE.Path(); p.absarc(cx, cy, r, 0, Math.PI * 2, true); return p; }
function extrude(shape, depth, bevel = 0.03) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 40 });
  g.translate(0, 0, -depth / 2);
  return g;
}
const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, ...o });
function mesh(geo, material, parent, pos, rot) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = m.receiveShadow = true;
  if (pos) m.position.set(...pos);
  if (rot) m.rotation.set(...rot);
  parent.add(m);
  return m;
}
function rng(seed) { return () => (seed = (seed * 16807) % 2147483647) / 2147483647; }

/* ---------- textures drawn on canvas ---------- */
function pcbTexture() {
  return canvasTexture(1024, 552, (g, w, h) => {
    g.fillStyle = '#0f4f3e'; g.fillRect(0, 0, w, h);
    const r = rng(7);
    g.strokeStyle = 'rgba(214,170,92,.75)'; g.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      g.lineWidth = r() < 0.3 ? 7 : 3.5;
      let x = r() * w, y = r() * h; g.beginPath(); g.moveTo(x, y);
      for (let k = 0; k < 4; k++) { if (k % 2) y = Math.max(20, Math.min(h - 20, y + (r() - 0.5) * 260)); else x = Math.max(20, Math.min(w - 20, x + (r() - 0.5) * 360)); g.lineTo(x, y); }
      g.stroke();
      g.fillStyle = '#d9b46a'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill();
    }
    g.fillStyle = 'rgba(255,255,255,.85)'; g.font = '600 26px "DM Mono", monospace';
    g.fillText('POTARA RX-1  rev.B', 640, 520); g.fillText('+  9V  −', 690, 420);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.strokeRect(610, 380, 220, 70);
    g.beginPath(); g.arc(220, 270, 230, 0, 7); g.setLineDash([10, 10]); g.stroke();
    g.fillText('SPK', 196, 280);
  });
}
function dialTexture() {
  return canvasTexture(512, 512, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#F3EBD8'; g.beginPath(); g.arc(c, c, c, 0, 7); g.fill();
    g.strokeStyle = '#C99A4E'; g.lineWidth = 10; g.beginPath(); g.arc(c, c, c - 14, 0, 7); g.stroke();
    g.strokeStyle = '#1A2250'; g.fillStyle = '#1A2250';
    const a0 = Math.PI * 0.75, span = Math.PI * 1.5;
    for (let i = 0; i <= 60; i++) {
      const a = a0 + span * i / 60, long = i % 5 === 0;
      g.lineWidth = long ? 4 : 2; g.beginPath();
      g.moveTo(c + Math.cos(a) * (c - 34), c + Math.sin(a) * (c - 34));
      g.lineTo(c + Math.cos(a) * (c - (long ? 66 : 50)), c + Math.sin(a) * (c - (long ? 66 : 50))); g.stroke();
    }
    g.font = '700 30px "DM Mono", monospace'; g.textAlign = 'center'; g.textBaseline = 'middle';
    ['53', '60', '70', '80', '100', '120', '140', '160'].forEach((n, i) => {
      const a = a0 + span * i / 7; g.fillText(n, c + Math.cos(a) * (c - 104), c + Math.sin(a) * (c - 104));
    });
    g.font = '800 40px Syne, sans-serif'; g.fillText('POTARA', c, c + 70);
    g.font = '500 22px "DM Mono", monospace'; g.fillStyle = '#C0392B'; g.fillText('AM · kHz ×10', c, c + 112);
  });
}
function grilleAlpha() {
  return canvasTexture(512, 512, (g, w) => {
    g.fillStyle = '#fff'; g.fillRect(0, 0, w, w); g.fillStyle = '#000';
    const s = 22;
    for (let y = 0, row = 0; y < w + s; y += s * 0.866, row++)
      for (let x = (row % 2) * s / 2; x < w + s; x += s) { g.beginPath(); g.arc(x, y, 6.5, 0, 7); g.fill(); }
  }, { srgb: false });
}
function labelTexture(draw, w = 256, h = 128) { return canvasTexture(w, h, draw); }

/* ---------- build the radio ---------- */
function buildRadio(root) {
  const parts = {};
  const part = (name, label, step, home, away, extra = {}) => {
    const g = new THREE.Group(); g.name = name; root.add(g);
    parts[name] = Object.assign({ name, label, step, g, home: { p: new THREE.Vector3(...home.p), r: new THREE.Euler(...(home.r || [0, 0, 0])) },
      away: { p: new THREE.Vector3(...away.p), r: new THREE.Euler(...(away.r || [0, 0, 0])) }, mats: [] }, extra, { anchor: new THREE.Vector3(...(extra.anchor || [0, 0, 0])) });
    return g;
  };
  const track = (p, m) => { parts[p].mats.push(m); return m; };

  // 1 Housing: open shell plus back plate and mounting posts
  {
    const g = part('housing', 'Rear housing', 1, { p: [0, 0, 0] }, { p: [0, -0.1, -1.4], r: [0.2, 0, 0] }, { anchor: [1.0, 0.55, -0.32] });
    const m = track('housing', mat(C.cream, { clearcoat: 0.5, clearcoatRoughness: 0.3, roughness: 0.38 }));
    const shell = rrShape(3.0, 1.9, 0.34); shell.holes.push(rrShape(2.84, 1.74, 0.27, THREE.Path));
    mesh(extrude(shell, 0.8), m, g, [0, 0, -0.05]);
    mesh(extrude(rrShape(3.0, 1.9, 0.34), 0.06), m, g, [0, 0, -0.48]);
    const post = new THREE.CylinderGeometry(0.07, 0.08, 0.16, 20).rotateX(Math.PI / 2);
    for (const [x, y] of [[-1.0, 0.55], [1.0, 0.55], [-1.0, -0.55], [1.0, -0.55]]) mesh(post, m, g, [x, y, -0.37]);
  }

  // 2 Circuit board with parts on its front face
  {
    const g = part('pcb', 'Circuit board', 2, { p: [0, 0, -0.3] }, { p: [-0.2, 2.15, -1.0], r: [-0.55, 0.15, 0] }, { anchor: [-0.2, 0.45, 0.05] });
    const tex = pcbTexture();
    const board = mesh(new THREE.BoxGeometry(2.6, 1.4, 0.04), [mat(C.pcb), mat(C.pcb), mat(C.pcb), mat(C.pcb), track('pcb', mat(0xffffff, { map: tex, roughness: 0.55 })), mat(C.pcb)], g);
    board.material.forEach(x => parts.pcb.mats.push(x));
    const chipM = track('pcb', mat(C.chip, { roughness: 0.6 })), capB = track('pcb', mat(0x2C4BD8, { roughness: 0.35 })), capK = track('pcb', mat(0x1b1b22, { roughness: 0.3 }));
    const steelM = track('pcb', mat(C.steel, { metalness: 1, roughness: 0.3 }));
    mesh(new THREE.BoxGeometry(0.34, 0.2, 0.06), chipM, g, [0.05, 0.38, 0.05]);
    mesh(new THREE.BoxGeometry(0.22, 0.16, 0.05), chipM, g, [-0.05, -0.38, 0.045]);
    mesh(new THREE.BoxGeometry(0.44, 0.44, 0.24), steelM, g, [0.85, 0.12, 0.14]); // tuning capacitor
    const cap = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 20).rotateX(Math.PI / 2);
    [[0.32, 0.5, capB], [0.42, 0.5, capK], [0.3, -0.1, capB], [-0.12, 0.05, capK], [0.18, -0.48, capB], [1.25, 0.55, capK]].forEach(([x, y, m]) => mesh(cap, m, g, [x, y, 0.1]));
    const res = new THREE.CylinderGeometry(0.025, 0.025, 0.14, 12).rotateZ(Math.PI / 2);
    const resM = track('pcb', mat(0xD8B98A));
    [[0.2, 0.15], [0.2, 0.22], [0.45, -0.25], [0.45, -0.32], [-0.2, 0.55]].forEach(([x, y]) => mesh(res, resM, g, [x, y, 0.05]));
  }

  // 3 Speaker: lathed cone, surround, dust cap, magnet
  {
    const g = part('speaker', 'Speaker', 3, { p: [-0.72, -0.02, 0.0] }, { p: [-2.6, 1.5, -0.2], r: [-0.2, 0.7, 0.2] }, { anchor: [0, 0.3, 0.24] });
    const pts = [[0.1, 0], [0.16, 0.02], [0.3, 0.08], [0.44, 0.15], [0.54, 0.21], [0.58, 0.23]].map(([x, y]) => new THREE.Vector2(x, y));
    const coneM = track('speaker', mat(0x26262E, { roughness: 0.85, side: THREE.DoubleSide, sheen: 0.5, sheenColor: new THREE.Color(0x555566) }));
    mesh(new THREE.LatheGeometry(pts, 72).rotateX(Math.PI / 2), coneM, g, [0, 0, 0.02]);
    mesh(new THREE.TorusGeometry(0.585, 0.03, 12, 72), track('speaker', mat(0x111116, { roughness: 0.7 })), g, [0, 0, 0.25]);
    mesh(new THREE.SphereGeometry(0.11, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(Math.PI / 2).scale(1, 1, 0.5), coneM, g, [0, 0, 0.03]);
    mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 40).rotateX(Math.PI / 2), track('speaker', mat(0x8B93A3, { metalness: 1, roughness: 0.32 })), g, [0, 0, -0.07]);
    mesh(new THREE.TorusGeometry(0.6, 0.018, 8, 72), track('speaker', mat(C.steel, { metalness: 1, roughness: 0.35 })), g, [0, 0, 0.21]);
    // leads
    const lead = (color, pts2) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2.map(p => new THREE.Vector3(...p))), 20, 0.012, 6), track('speaker', mat(color)), g);
    lead(C.red, [[0.15, -0.12, -0.08], [0.35, -0.3, -0.12], [0.6, -0.35, -0.2]]);
    lead(0x111111, [[0.15, -0.16, -0.08], [0.33, -0.36, -0.12], [0.58, -0.42, -0.2]]);
  }

  // 4 Tuning dial with needle (needle animates when powered)
  let needle;
  {
    const g = part('dial', 'Tuning dial', 4, { p: [0.85, 0.12, 0.27] }, { p: [2.2, 1.7, 0.4], r: [0.1, -0.35, 1.2] }, { anchor: [0.3, 0.3, 0.02] });
    const tex = dialTexture(); tex.center.set(0.5, 0.5); tex.rotation = Math.PI / 2;
    const face = track('dial', mat(0xffffff, { map: tex, emissiveMap: tex, emissive: 0x000000, roughness: 0.4, clearcoat: 0.6 }));
    mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.03, 72).rotateX(Math.PI / 2), [track('dial', mat(C.brass, { metalness: 1, roughness: 0.35 })), face, face], g);
    mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.3, 16).rotateX(Math.PI / 2), track('dial', mat(C.steel, { metalness: 1, roughness: 0.3 })), g, [0, 0, -0.15]);
    needle = new THREE.Group(); needle.position.z = 0.03; g.add(needle);
    mesh(new THREE.BoxGeometry(0.016, 0.36, 0.008).translate(0, 0.17, 0), track('dial', mat(C.red, { emissive: 0x330000 })), needle);
    mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 20).rotateX(Math.PI / 2), track('dial', mat(C.brass, { metalness: 1, roughness: 0.3 })), needle);
    needle.rotation.z = Math.PI * 0.75; // parked at 530
    parts.dial.face = face;
  }

  // 5 Battery with label and snap
  {
    const g = part('battery', '9V battery', 5, { p: [0.75, -0.6, -0.14] }, { p: [2.1, -0.15, 1.5], r: [0.2, -0.3, 0.35] }, { anchor: [0.1, 0.12, 0.11] });
    const lab = labelTexture((x, w, h) => {
      x.fillStyle = '#16171d'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#C99A4E'; x.fillRect(0, h * 0.62, w, h * 0.2);
      x.fillStyle = '#fff'; x.font = '800 54px Syne, sans-serif'; x.fillText('9V', 18, 64);
      x.font = '500 18px "DM Mono", monospace'; x.fillText('ALKALINE', 120, 58);
      x.fillStyle = '#16171d'; x.fillText('+  POTARA POWER  −', 30, h * 0.75);
    });
    const body = track('battery', mat(0x16171d, { roughness: 0.4, clearcoat: 0.8 }));
    const front = track('battery', mat(0xffffff, { map: lab, roughness: 0.4, clearcoat: 0.8 }));
    mesh(new THREE.BoxGeometry(0.62, 0.3, 0.22), [body, body, body, body, front, body], g);
    const snap = track('battery', mat(C.steel, { metalness: 1, roughness: 0.25 }));
    mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 16).rotateZ(Math.PI / 2), snap, g, [0.335, 0.06, 0]);
    mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.05, 6).rotateZ(Math.PI / 2), snap, g, [0.335, -0.06, 0]);
  }

  // 6 Faceplate: navy enamel with speaker and dial cut-outs, grille, brass trims, badge
  {
    const g = part('faceplate', 'Faceplate', 6, { p: [0, 0, 0.39] }, { p: [-3.0, -0.05, 1.2], r: [-0.15, 0.55, 0] }, { anchor: [-1.1, 0.7, 0.06] });
    const plate = rrShape(3.0, 1.9, 0.34);
    plate.holes.push(circlePath(-0.72, -0.02, 0.6), circlePath(0.85, 0.12, 0.46));
    mesh(extrude(plate, 0.06, 0.025), track('faceplate', mat(C.navy, { roughness: 0.35, clearcoat: 0.9, clearcoatRoughness: 0.15, metalness: 0.2 })), g);
    const grille = track('faceplate', mat(C.brass, { metalness: 1, roughness: 0.42, alphaMap: grilleAlpha(), alphaTest: 0.5, side: THREE.DoubleSide }));
    mesh(new THREE.CircleGeometry(0.6, 72), grille, g, [-0.72, -0.02, -0.005]);
    const brass = track('faceplate', mat(C.brass, { metalness: 1, roughness: 0.28 }));
    mesh(new THREE.TorusGeometry(0.6, 0.035, 16, 96), brass, g, [-0.72, -0.02, 0.04]);
    mesh(new THREE.TorusGeometry(0.46, 0.035, 16, 96), brass, g, [0.85, 0.12, 0.04]);
    const glass = track('faceplate', new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.05, transmission: 0, transparent: true, opacity: 0.12, clearcoat: 1 }));
    mesh(new THREE.CircleGeometry(0.46, 72), glass, g, [0.85, 0.12, 0.02]).castShadow = false;
    const badge = labelTexture((x, w, h) => {
      x.fillStyle = '#C99A4E'; x.fillRect(0, 0, w, h);
      x.fillStyle = '#1A2250'; x.font = '800 64px Syne, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('POTARA', w / 2, h / 2 + 4);
    }, 512, 112);
    mesh(new THREE.BoxGeometry(0.72, 0.16, 0.02), [brass, brass, brass, brass, track('faceplate', mat(0xffffff, { map: badge, metalness: 0.6, roughness: 0.35 })), brass], g, [-0.72, -0.78, 0.04]);
    const led = mesh(new THREE.SphereGeometry(0.035, 20, 12), track('faceplate', mat(0x224433, { emissive: 0x000000 })), g, [1.32, -0.78, 0.04]);
    parts.faceplate.led = led;
  }

  // 7 Knobs, antenna and strap arrive together
  let antennaSegs = [];
  {
    const g = part('knobs', 'Knobs, antenna, strap', 7, { p: [0, 0, 0] }, { p: [1.5, 1.25, -1.5], r: [0.15, -0.2, 0.12] }, { anchor: [1.1, -0.6, 0.55] });
    const knurl = new THREE.CylinderGeometry(0.14, 0.15, 0.16, 96, 1);
    const pos = knurl.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z);
      if (r > 0.1) { const a = Math.atan2(z, x), k = 1 + 0.035 * Math.cos(a * 32); pos.setX(i, x * k); pos.setZ(i, z * k); }
    }
    knurl.rotateX(Math.PI / 2); knurl.computeVertexNormals();
    const cream = track('knobs', mat(C.cream, { roughness: 0.4, clearcoat: 0.6 })), brass = track('knobs', mat(C.brass, { metalness: 1, roughness: 0.3 }));
    for (const x of [0.6, 1.08]) {
      mesh(knurl, cream, g, [x, -0.6, 0.5]);
      mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 40).rotateX(Math.PI / 2), brass, g, [x, -0.6, 0.585]);
      mesh(new THREE.BoxGeometry(0.02, 0.07, 0.01), track('knobs', mat(C.red)), g, [x, -0.55, 0.598]);
    }
    // telescopic antenna
    const ant = new THREE.Group(); ant.position.set(1.15, 0.97, -0.22); ant.rotation.z = -0.32; g.add(ant);
    const chrome = track('knobs', mat(0xE8EBF2, { metalness: 1, roughness: 0.12 }));
    mesh(new THREE.SphereGeometry(0.07, 24, 16), chrome, ant);
    for (let i = 0; i < 4; i++) {
      const L = 0.5, r = 0.034 - i * 0.006;
      const s = mesh(new THREE.CylinderGeometry(r, r, L, 16).translate(0, L / 2, 0), chrome, ant);
      antennaSegs.push(s);
    }
    mesh(new THREE.SphereGeometry(0.026, 16, 12), chrome, antennaSegs[3], [0, 0.5, 0]);
    // leather strap between two brass lugs
    const strap = new THREE.CatmullRomCurve3([[-0.95, 0.9, 0], [-0.98, 1.3, 0], [-0.55, 1.62, 0], [0, 1.7, 0], [0.55, 1.62, 0], [0.98, 1.3, 0], [0.95, 0.9, 0]].map(p => new THREE.Vector3(...p)));
    mesh(new THREE.TubeGeometry(strap, 80, 0.05, 10).scale(1, 1, 1.9), track('knobs', mat(C.leather, { roughness: 0.6, sheen: 1, sheenColor: new THREE.Color(0x9a6040), clearcoat: 0.2 })), g);
    for (const x of [-0.95, 0.95]) mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 20).rotateX(Math.PI / 2), brass, g, [x, 0.92, 0]);
  }

  // 8 Screws at the back (each its own part so they can spin in)
  {
    const g = part('screws', 'Screws ×4', 8, { p: [0, 0, 0] }, { p: [2.4, -0.75, -0.9], r: [0, Math.PI * 0.8, 0] }, { anchor: [1.2, -0.68, -0.6], spin: 6 });
    const steel = track('screws', mat(C.steel, { metalness: 1, roughness: 0.28 })), dark = track('screws', mat(0x30333c, { metalness: 1, roughness: 0.4 }));
    parts.screws.items = [];
    for (const [x, y] of [[-1.2, 0.68], [1.2, 0.68], [-1.2, -0.68], [1.2, -0.68]]) {
      const s = new THREE.Group(); s.position.set(x, y, -0.55); g.add(s);
      mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.035, 28).rotateX(Math.PI / 2), steel, s);
      mesh(new THREE.BoxGeometry(0.11, 0.018, 0.02), dark, s, [0, 0, -0.012]);
      mesh(new THREE.BoxGeometry(0.018, 0.11, 0.02), dark, s, [0, 0, -0.012]);
      mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.22, 12).rotateX(Math.PI / 2), steel, s, [0, 0, 0.12]);
      parts.screws.items.push(s);
    }
  }

  return { parts, needle, antennaSegs };
}

/* ---------- sound: static that tunes into a warm chord ---------- */
let audio;
function playRadio() {
  audio = audio || new (window.AudioContext || window.webkitAudioContext)();
  const a = audio, t = a.currentTime;
  const buf = a.createBuffer(1, a.sampleRate * 2.6, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const noise = a.createBufferSource(); noise.buffer = buf;
  const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 0.8;
  bp.frequency.setValueAtTime(600, t); bp.frequency.exponentialRampToValueAtTime(2400, t + 1.4);
  const ng = a.createGain(); ng.gain.setValueAtTime(0, t); ng.gain.linearRampToValueAtTime(0.16, t + 0.15); ng.gain.linearRampToValueAtTime(0.0, t + 1.9);
  noise.connect(bp).connect(ng).connect(a.destination); noise.start(t); noise.stop(t + 2.6);
  const master = a.createGain(); master.connect(a.destination);
  master.gain.setValueAtTime(0, t + 1.1); master.gain.linearRampToValueAtTime(0.12, t + 1.7); master.gain.setTargetAtTime(0, t + 3.2, 0.5);
  [261.63, 329.63, 392, 523.25].forEach((f, i) => {
    const o = a.createOscillator(); o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f;
    const og = a.createGain(); og.gain.value = 0.5 / (i + 1);
    o.frequency.setValueAtTime(f * 0.97, t + 1.1); o.frequency.exponentialRampToValueAtTime(f, t + 1.6);
    o.connect(og).connect(master); o.start(t + 1.1 + i * 0.12); o.stop(t + 5);
  });
}

/* ---------- the chapter ---------- */
export function init(rootEl) {
  const canvas = rootEl.querySelector('#radioCanvas');
  const st = makeStage(canvas, { fov: 30, exposure: 1.05 });
  const { scene, camera, controls, size } = st;
  studio(scene, { floorY: -0.99, shadowSize: 4.5, rim: 0x7de9ff, fill: 0xff9f80 });
  const radio = new THREE.Group(); scene.add(radio);
  const { parts, needle, antennaSegs } = buildRadio(radio);
  const list = Object.values(parts);
  const rig = cameraRig(camera, controls);
  controls.minPolarAngle = 0.2; controls.maxPolarAngle = Math.PI / 2 + 0.08;

  // power-on rings coming out of the grille
  const rings = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0x7DE9FF, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.position.set(-0.72, -0.02, 0.48); radio.add(m); return m;
  });

  // start everything in the tray
  for (const p of list) { p.g.position.copy(p.away.p); p.g.rotation.copy(p.away.r); p.state = 0; }

  /* DOM */
  const stepsEl = rootEl.querySelector('#radioSteps');
  stepsEl.innerHTML = STEPS.map((s, i) => `<li data-n="${i}" tabindex="0" role="button"><b>${s.t}</b><span>${s.d}</span></li>`).join('');
  const lis = [...stepsEl.children];
  const tagsEl = rootEl.querySelector('#radioTags');
  for (const p of list) {
    p.tag = document.createElement('div'); p.tag.className = 'tag off';
    p.tag.innerHTML = `<i>${p.step}</i><span>${p.label}</span>`; tagsEl.appendChild(p.tag);
  }
  const callout = rootEl.querySelector('#radioCallout');
  const badge = rootEl.querySelector('#radioBadge'), tl = rootEl.querySelector('#radioTl');
  const playBtn = rootEl.querySelector('#radioPlay'), explodeBtn = rootEl.querySelector('#radioExplode');

  let step = -1, playing = !reduced, timer = 0, powered = 0, active = null, glowT = 0, exploded = false;
  const DWELL = 3.6;

  function camFor(i) {
    const [p, t] = STEPS[i].cam;
    const pos = new THREE.Vector3(...p), target = new THREE.Vector3(...t);
    const k = Math.max(1, (i === 0 ? 1.5 : 1.2) / camera.aspect); // pull back on narrower screens so the frame still fits
    return [pos.sub(target).multiplyScalar(k).add(target), target];
  }

  function go(i, { instant = false } = {}) {
    i = (i + STEPS.length) % STEPS.length;
    const back = i < step;
    step = i; timer = 0; exploded = false; explodeBtn.setAttribute('aria-pressed', 'false');
    for (const p of list) moveTo(p, p.step <= i ? 1 : 0, instant ? 0 : back ? 0.8 : 1.25);
    active = parts[STEPS[i].part] || null; glowT = 0;
    const [pos, target] = camFor(i);
    rig.go(pos, target, instant ? 0 : 1.6);
    lis.forEach((li, k) => { li.classList.toggle('on', k === i); li.classList.toggle('done', k < i); });
    if (matchMedia('(max-width:900px)').matches && lis[i] && rootEl.getBoundingClientRect().top < innerHeight) lis[i].parentElement.scrollTo({ left: lis[i].offsetLeft - 4, behavior: reduced ? 'auto' : 'smooth' });
    badge.textContent = i === 0 ? 'The parts' : `Step ${i} / ${STEPS.length - 1}`;
    tl.style.width = `${(i / (STEPS.length - 1)) * 100}%`;
    callout.hidden = true;
    if (active) {
      callout.querySelector('.c-n').textContent = `Step ${i}`;
      callout.querySelector('b').textContent = STEPS[i].t;
      setTimeout(() => { if (step === i) callout.hidden = false; }, instant ? 0 : 900);
    }
    rootEl.dispatchEvent(new CustomEvent('progress', { bubbles: true, detail: { chapter: 'hands', step: i, of: STEPS.length - 1 } }));
  }

  function moveTo(p, state, dur) {
    if (p.state === state && !p.tw) return;
    p.state = state;
    const to = state ? p.home : p.away;
    if (!dur || reduced) { p.g.position.copy(to.p); p.g.rotation.copy(to.r); p.tw = null; return; }
    p.tw = { p0: p.g.position.clone(), q0: p.g.quaternion.clone(), p1: to.p.clone(), q1: new THREE.Quaternion().setFromEuler(to.r), k: 0, dur, delay: state ? 0.15 : 0 };
  }

  function explode(on) {
    exploded = on; explodeBtn.setAttribute('aria-pressed', String(on));
    for (const p of list) moveTo(p, on ? 0 : (p.step <= step ? 1 : 0), 1.1);
    const [pos, target] = on ? camFor(0) : camFor(step);
    rig.go(pos, target, 1.4);
    callout.hidden = on || !active;
  }

  lis.forEach((li, i) => {
    const pick = () => { setPlaying(false); go(i); };
    li.addEventListener('click', pick);
    li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
  });
  rootEl.querySelector('#radioPrev').addEventListener('click', () => { setPlaying(false); go(step - 1); });
  rootEl.querySelector('#radioNext').addEventListener('click', () => { setPlaying(false); go(step + 1); });
  playBtn.addEventListener('click', () => { setPlaying(!playing); if (playing && step === STEPS.length - 1) go(0); });
  explodeBtn.addEventListener('click', () => { setPlaying(false); explode(!exploded); });
  rootEl.querySelector('#radioSound').addEventListener('click', () => { setPlaying(false); if (step !== STEPS.length - 1) go(STEPS.length - 1); playRadio(); sweep = 0; });
  controls.addEventListener('start', () => setPlaying(false));
  function setPlaying(v) { playing = v; playBtn.textContent = v ? '❚❚' : '▶'; playBtn.setAttribute('aria-label', v ? 'Pause' : 'Play'); }
  setPlaying(playing);

  let sweep = 1, antExt = 0;
  const tmp = new THREE.Vector3();
  st.onTick((dt, t) => {
    rig.tick(dt);
    // autoplay
    if (playing && !rig.busy) {
      timer += dt;
      const dwell = step === 0 ? DWELL + 1.4 : step === STEPS.length - 1 ? DWELL + 3 : DWELL;
      if (timer > dwell) go(step + 1);
    }
    // part tweens: an arc on the way home, screws spin in
    for (const p of list) {
      const w = p.tw; if (!w) continue;
      if (w.delay > 0) { w.delay -= dt; continue; }
      w.k = Math.min(1, w.k + dt / w.dur);
      const e = ease.inOut(w.k);
      p.g.position.lerpVectors(w.p0, w.p1, e);
      p.g.position.y += Math.sin(Math.PI * e) * 0.35 * (p.state ? 1 : -0.4);
      p.g.quaternion.slerpQuaternions(w.q0, w.q1, e);
      if (p.spin) for (const s of p.items) s.rotation.z = (1 - e) * p.spin * Math.PI * (p.state ? 1 : -1);
      if (w.k >= 1) p.tw = null;
    }
    // antenna telescopes out once the strap step lands
    antExt = THREE.MathUtils.lerp(antExt, parts.knobs.state && !parts.knobs.tw ? 1 : 0, reduced ? 1 : 0.05);
    antennaSegs.forEach((s, i) => { s.position.y = i * (0.03 + 0.43 * antExt); });
    // active part glow
    glowT += dt;
    const g = active && glowT < 3.2 ? (0.5 + 0.5 * Math.sin(glowT * 5)) * Math.max(0, 1 - glowT / 3.2) * 0.22 : 0;
    for (const p of list) for (const m of p.mats) if (m.emissive && m !== parts.dial.face && !(p.name === 'faceplate' && m === parts.faceplate.led.material)) {
      if (p === active) m.emissive.setRGB(0.49 * g, 0.91 * g, g); else if (m.emissive.r || m.emissive.g) m.emissive.setRGB(0, 0, 0);
    }
    // power on
    const on = step === STEPS.length - 1 && !exploded && !parts.screws.tw;
    powered = THREE.MathUtils.lerp(powered, on ? 1 : 0, on ? 0.04 : 0.15);
    parts.dial.face.emissive.setRGB(1.0 * powered, 0.62 * powered, 0.28 * powered);
    parts.dial.face.emissiveIntensity = 0.55;
    parts.faceplate.led.material.emissive.setRGB(0.37 * powered * 3, 0.94 * powered * 3, 0.75 * powered * 3);
    if (on) sweep = Math.min(1, sweep + dt * 0.35);
    const a0 = Math.PI * 0.75;
    const tuned = a0 - (powered > 0.5 ? ease.out(sweep) * 2.6 + Math.sin(t * 7) * 0.02 * (1 - sweep) : 0);
    needle.rotation.z = THREE.MathUtils.lerp(needle.rotation.z, tuned, 0.12);
    rings.forEach((r, i) => {
      const k = ((t * 0.55 + i / 3) % 1);
      r.scale.setScalar(1 + k * 1.6);
      r.position.z = 0.48 + k * 0.9;
      r.material.opacity = powered > 0.3 && !reduced ? (1 - k) * 0.6 * powered : 0;
    });
    // gentle idle sway of the finished radio
    radio.rotation.y = on && !reduced ? Math.sin(t * 0.5) * 0.06 : radio.rotation.y * 0.95;

    // labels
    const showTags = step === 0 || exploded;
    for (const p of list) {
      p.g.localToWorld(tmp.copy(p.anchor));
      const visible = showTags && !p.tw;
      p.tag.classList.toggle('off', !visible);
      if (visible) pin(p.tag, tmp, camera, size);
    }
    if (active && !callout.hidden) {
      active.g.localToWorld(tmp.copy(active.anchor));
      const at = pin(callout, tmp, camera, size);
      if (at) callout.classList.toggle('flip', at.x > size.w * 0.62);
    }
  });

  go(0, { instant: true });
  // jump straight to the finished radio for reduced motion
  if (reduced) go(STEPS.length - 1, { instant: true });
  return { go };
}
