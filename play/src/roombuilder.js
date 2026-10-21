// Meeting Room Studio: build a hybrid meeting room in 3D, one decision at a time, and leave with a brief.
// three.js 0.160 (vendored), lazy-loaded. If WebGL is missing, the wizard still works and the brief still arrives.
import { save, session, on } from './core.js';
import { portrait } from './art.js';
import { audio } from './audio.js';
import { CONFIG } from './config.js';

// ---------------- the decisions ----------------
export const STEPS = [
  { id: 'size', title: 'How big is the room?', who: 'bill', line: "Start with the space. Pick the one closest to yours; we can fine-tune on the survey.",
    options: [
      { v: 'huddle', t: 'Huddle', d: '2 to 4 people · quick calls', meta: 'about 4 × 3.6 m' },
      { v: 'medium', t: 'Meeting room', d: '6 to 8 people · the workhorse', meta: 'about 6 × 5 m' },
      { v: 'board', t: 'Boardroom', d: '10 to 14 people · the big decisions', meta: 'about 9 × 6.5 m' },
      { v: 'training', t: 'Training room', d: '16 to 20 people · workshops and town halls', meta: 'about 10 × 8 m' },
    ] },
  { id: 'layout', title: 'How should people sit?', who: 'bob', line: "Layout decides whether remote people feel like guests or colleagues. Front Row puts them at eye level.",
    options: [
      { v: 'frontrow', t: 'Front Row', d: 'Everyone faces the screen; remote people life-size', meta: 'best for hybrid' },
      { v: 'board', t: 'Classic table', d: 'Long table pointing at the screen', meta: 'familiar' },
      { v: 'round', t: 'Round table', d: 'Small groups, equal voices', meta: 'huddles' },
      { v: 'class', t: 'Classroom', d: 'Rows facing the front', meta: 'training' },
    ] },
  { id: 'display', title: 'What goes on the wall?', who: 'bill', line: "One screen for faces, one for content is the sweet spot for most rooms.",
    options: [
      { v: 'single', t: 'Single 75" display', d: 'Simple, tidy, great for huddles', meta: '1 × 75"' },
      { v: 'dual', t: 'Dual 65" displays', d: 'People on one, content on the other', meta: '2 × 65"' },
      { v: 'led', t: 'LED video wall', d: 'Seamless, cinematic, life-size people', meta: 'about 3.2 m wide' },
    ] },
  { id: 'av', title: 'How will the room see and hear?', who: 'bob', line: "This is where most rooms fail. Nobody remembers the screen; everybody remembers not being heard.",
    options: [
      { v: 'bar', t: 'Video bar', d: 'Camera, mics and speakers in one slim unit', meta: 'up to 8 people' },
      { v: 'smart', t: 'Smart camera + ceiling mics', d: 'Frames whoever speaks; hands-free audio', meta: 'medium to large' },
      { v: 'multi', t: 'Multi-camera + mic array', d: 'Several angles, every seat covered', meta: 'boardrooms' },
    ] },
  { id: 'extras', title: 'Make it a room people choose.', who: 'bill', line: "Little things, big difference. Pick as many as you like.", multi: true,
    options: [
      { v: 'booking', t: 'Booking panel', d: 'See who has it, book it at the door' },
      { v: 'share', t: 'One-tap sharing', d: 'Wireless screen share, no cables' },
      { v: 'lights', t: 'Lighting scenes', d: 'Flattering light for cameras, one button' },
      { v: 'acoustic', t: 'Acoustic panels', d: 'Kill the echo so remote people hear voices' },
      { v: 'sensor', t: 'Occupancy sensor', d: 'Frees ghost bookings, counts real use' },
    ] },
  { id: 'platform', title: 'Which platform do you live on?', who: 'bob', line: "We build for the one you've got. The room should feel like the laptop, only better.",
    options: [
      { v: 'teams', t: 'Microsoft Teams Rooms', d: 'Join from the calendar, one tap' },
      { v: 'zoom', t: 'Zoom Rooms', d: 'Zoom-first organisations' },
      { v: 'meet', t: 'Google Meet hardware', d: 'Workspace-first organisations' },
      { v: 'byod', t: 'Bring your own device', d: 'Any platform, from a laptop, via USB-C' },
    ] },
];
const DEFAULTS = { size: 'medium', layout: 'frontrow', display: 'dual', av: 'smart', extras: ['booking', 'share'], platform: 'teams' };
const SIZES = { huddle: { w: 4.2, d: 3.6, seats: 4 }, medium: { w: 6, d: 5, seats: 8 }, board: { w: 9, d: 6.5, seats: 14 }, training: { w: 10, d: 8, seats: 20 } };
const name = (step, v) => STEPS.find(s => s.id === step).options.find(o => o.v === v)?.t || v;

// ---------------- the kit, in plain English ----------------
export function kitList(sel) {
  const z = SIZES[sel.size], L = [];
  L.push({ g: 'Space', t: `${name('size', sel.size)}, ${name('layout', sel.layout)} layout`, why: `${z.seats} seats arranged so every face reaches the camera.` });
  if (sel.display === 'single') L.push({ g: 'Display', t: '1 × 75" 4K display', why: 'Big enough for faces and content in a smaller room.' });
  if (sel.display === 'dual') L.push({ g: 'Display', t: '2 × 65" 4K displays', why: 'People on the left, content on the right. Nobody has to choose.' });
  if (sel.display === 'led') L.push({ g: 'Display', t: 'Direct-view LED wall, about 3.2 m', why: 'Remote colleagues appear life-size, at eye level.' });
  if (sel.av === 'bar') L.push({ g: 'Camera and audio', t: 'All-in-one video bar', why: 'Camera, beamforming mics and speakers in one tidy unit under the screen.' });
  if (sel.av === 'smart') L.push({ g: 'Camera and audio', t: 'Speaker-tracking camera + ceiling mic array', why: 'Frames whoever is talking; mics in the ceiling hear every seat.' }, { g: 'Camera and audio', t: 'Ceiling speakers', why: 'Sound comes from above, evenly, without feedback.' });
  if (sel.av === 'multi') L.push({ g: 'Camera and audio', t: 'Multi-camera system (front and side)', why: 'Several angles so nobody is a profile or the back of a head.' }, { g: 'Camera and audio', t: 'Table and ceiling mic array', why: 'Every seat covered in a long room.' });
  L.push({ g: 'Control', t: `${name('platform', sel.platform)} touch console`, why: 'Join from the calendar with one tap. No remote controls to lose.' });
  const ex = { booking: ['Booking panel at the door', 'Shows who has the room and lets people book on the spot.'], share: ['Wireless sharing', 'Share from any laptop without hunting for a cable.'], lights: ['Tunable lighting scenes', 'Faces lit properly for the camera, one button.'], acoustic: ['Acoustic wall and ceiling panels', 'Less echo, so remote people hear voices, not the room.'], sensor: ['Occupancy sensor', 'Frees ghost bookings and tells you how rooms are really used.'] };
  for (const e of sel.extras || []) L.push({ g: 'Experience', t: ex[e][0], why: ex[e][1] });
  L.push({ g: 'Support', t: 'Estate monitoring', why: 'Rooms report their own health, so problems are fixed before anyone notices.' });
  return L;
}

// ---------------- the 3D room ----------------
async function create3D(host) {
  const THREE = await import('three');
  const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');
  const { RoomEnvironment } = await import('three/addons/environments/RoomEnvironment.js');
  const { RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js');
  const { EffectComposer } = await import('three/addons/postprocessing/EffectComposer.js');
  const { RenderPass } = await import('three/addons/postprocessing/RenderPass.js');
  const { UnrealBloomPass } = await import('three/addons/postprocessing/UnrealBloomPass.js');
  const { OutputPass } = await import('three/addons/postprocessing/OutputPass.js');

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .82;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x0e0c22); scene.fog = new THREE.Fog(0x0e0c22, 24, 60);
  const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture; scene.environmentIntensity = .55;
  const camera = new THREE.PerspectiveCamera(38, 16 / 9, .05, 200);
  const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.dampingFactor = .08; controls.maxPolarAngle = Math.PI / 2.1; controls.minDistance = 3; controls.maxDistance = 30; controls.enablePan = false;
  const composer = new EffectComposer(renderer); composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), .38, .35, .92); composer.addPass(bloom); composer.addPass(new OutputPass());

  // lights: warm key through the glass, cool fill, a little rim
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x2a2140, .38));
  const sun = new THREE.DirectionalLight(0xffe2c0, 1.7); sun.position.set(-9, 11, 6); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -12, right: 12, top: 12, bottom: -12, near: 1, far: 40 }); sun.shadow.bias = -.0005; sun.shadow.radius = 4; scene.add(sun);
  const rim = new THREE.DirectionalLight(0x8f7cff, .7); rim.position.set(8, 6, -8); scene.add(rim);

  const std = o => new THREE.MeshStandardMaterial(o);
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const M = {
    floor: std({ map: tex(1024, 1024, (g, w, h) => { g.fillStyle = '#a88e6c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? 'rgba(120,85,50,.10)' : 'rgba(255,255,255,.05)'; g.fillRect(0, i * h / 16, w, h / 16 - 2); for (let k = 0; k < 40; k++) { g.fillStyle = 'rgba(90,60,30,.08)'; g.fillRect(Math.random() * w, i * h / 16 + Math.random() * h / 16, 60 + Math.random() * 120, 1); } } }), roughness: .55, metalness: 0 }),
    wall: std({ color: 0xcfc6b6, roughness: .95 }), media: std({ color: 0x1f2034, roughness: .7 }),
    oak: std({ color: 0xb98a5e, roughness: .42 }), white: std({ color: 0xe2ddd2, roughness: .4 }), black: std({ color: 0x15151c, roughness: .35, metalness: .4 }),
    metal: std({ color: 0xc9ccd6, roughness: .25, metalness: .9 }), felt: std({ color: 0x3d6f73, roughness: 1 }), felt2: std({ color: 0x59617a, roughness: 1 }),
    teal: std({ color: 0x19d3c5, emissive: 0x19d3c5, emissiveIntensity: 1.6 }), gold: std({ color: 0xffd60a, emissive: 0xffc400, emissiveIntensity: 1.2 }), warm: std({ color: 0xfff1d8, emissive: 0xffe6c0, emissiveIntensity: 1.6 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xcfe3ff, roughness: .05, transmission: .0, transparent: true, opacity: .16, metalness: 0, side: THREE.DoubleSide }),
    seat: [0x6b4dff, 0x19d3c5, 0xf472b6, 0xffb35c].map(c => std({ color: c, roughness: .8 })),
  };
  const skyline = tex(2048, 768, (g, w, h) => { const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#4f5bd5'); gr.addColorStop(.5, '#9a7cf0'); gr.addColorStop(.82, '#ffb08a'); gr.addColorStop(1, '#ffe2b4'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(255,241,207,.9)'; g.beginPath(); g.arc(w * .7, h * .7, 60, 0, 7); g.fill();
    for (const [col, base, hmax, win] of [['rgba(176,150,232,.8)', h, 380, null], ['#3d3285', h, 300, '#ffd68a']]) { let x = 0; while (x < w) { const bw = 50 + Math.random() * 110, bh = 120 + Math.random() * hmax; g.fillStyle = col; g.fillRect(x, base - bh, bw, bh); if (win) { g.fillStyle = win; for (let yy = base - bh + 14; yy < base - 10; yy += 18) for (let xx = x + 8; xx < x + bw - 8; xx += 14) if (Math.random() > .55) g.fillRect(xx, yy, 6, 9); } x += bw + 8 + Math.random() * 20; } } });

  // screen content: a meeting in progress (generic, no logos)
  const PEOPLE = ['#f59e0b', '#a78bfa', '#34d399', '#f472b6', '#60a5fa', '#fb7185'];
  function screenTex(kind, platform) {
    const label = { teams: 'Teams Rooms', zoom: 'Zoom Rooms', meet: 'Google Meet', byod: 'USB-C · any platform' }[platform] || '';
    return tex(1280, 720, (g, w, h) => {
      g.fillStyle = '#101225'; g.fillRect(0, 0, w, h);
      if (kind === 'people' || kind === 'both') {
        const cols = 3, rows = 2, pw = (kind === 'both' ? w * .5 : w) / cols - 16;
        for (let i = 0; i < cols * rows; i++) { const x = 12 + (i % cols) * (pw + 12), y = 70 + ((i / cols) | 0) * ((h - 110) / rows); const ph = (h - 130) / rows;
          const gg = g.createLinearGradient(0, y, 0, y + ph); gg.addColorStop(0, '#26304d'); gg.addColorStop(1, '#141a2e'); g.fillStyle = gg; g.beginPath(); g.roundRect(x, y, pw, ph, 18); g.fill();
          g.fillStyle = PEOPLE[i]; g.beginPath(); g.arc(x + pw / 2, y + ph * .42, ph * .17, 0, 7); g.fill(); g.beginPath(); g.roundRect(x + pw / 2 - ph * .28, y + ph * .64, ph * .56, ph * .36, 30); g.fill();
          if (i === 1) { g.strokeStyle = '#19d3c5'; g.lineWidth = 6; g.beginPath(); g.roundRect(x, y, pw, ph, 18); g.stroke(); } }
      }
      if (kind === 'content' || kind === 'both') {
        const x0 = kind === 'both' ? w * .52 : 40, cw = kind === 'both' ? w * .46 : w - 80;
        g.fillStyle = '#f4f1ea'; g.beginPath(); g.roundRect(x0, 70, cw, h - 110, 18); g.fill();
        g.fillStyle = '#1b1840'; g.font = '700 46px Syne, sans-serif'; g.fillText('Q3 workplace review', x0 + 40, 150);
        const bars = [.5, .62, .58, .78, .9]; bars.forEach((b, i) => { g.fillStyle = i === 4 ? '#19d3c5' : '#c9c3e6'; const bw = cw / 8; g.fillRect(x0 + 50 + i * bw * 1.3, h - 80 - b * 360, bw, b * 360); });
      }
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '500 28px "DM Mono", monospace'; g.fillText(label.toUpperCase(), 24, 46);
      g.fillStyle = '#ef4444'; g.beginPath(); g.arc(w - 40, 36, 10, 0, 7); g.fill();
    });
  }

  // ---------- builders ----------
  const room = new THREE.Group(); scene.add(room);
  const parts = {}; // key -> group, for pop-in animation and labels
  const anims = [];
  function pop(grp, delay = 0) { grp.scale.setScalar(.001); anims.push({ g: grp, t0: performance.now() + delay, dur: 650, y0: grp.position.y + .6, y1: grp.position.y }); }
  const box = (w, h, d, m, x, y, z, p, cast = true) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.castShadow = cast; o.receiveShadow = true; p.add(o); return o; };
  const rbox = (w, h, d, r, m, x, y, z, p) => { const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 4, r), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, p, seg = 32) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; p.add(o); return o; };
  function group(key, delay) { if (parts[key]) { room.remove(parts[key]); } const g = new THREE.Group(); g.userData.key = key; room.add(g); parts[key] = g; if (delay !== undefined) pop(g, delay); return g; }
  function chair(p, x, z, rot, mat) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rot; p.add(c);
    rbox(.48, .08, .46, .03, mat, 0, .46, 0, c); rbox(.46, .5, .06, .03, mat, 0, .76, -.22, c);
    cyl(.025, .025, .4, M.metal, 0, .24, 0, c, 12); cyl(.24, .24, .03, M.black, 0, .03, 0, c, 20);
    return c;
  }
  function person(p, x, z, rot, i) {
    const c = new THREE.Group(); c.position.set(x, 0, z); c.rotation.y = rot; p.add(c);
    const m = std({ color: PEOPLE[i % PEOPLE.length], roughness: .8 }), skin = std({ color: [0x8d5524, 0xc68642, 0xe0ac69, 0xf1c27d][i % 4], roughness: .7 });
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(.17, .32, 6, 12), m); body.position.set(0, .82, -.06); body.castShadow = true; c.add(body);
    const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 16), skin); head.position.set(0, 1.25, -.04); head.castShadow = true; c.add(head);
    return c;
  }
  let dims = SIZES.medium, sel = { ...DEFAULTS }, consoleAt = null;

  function buildShell() {
    const g = group('shell'); const { w, d } = dims, H = 2.9;
    box(w + .3, .12, d + .3, M.floor, 0, -.06, 0, g, false);
    const back = box(w + .3, H, .14, M.wall, 0, H / 2, -d / 2 - .07, g); back.castShadow = false;
    box(Math.min(w * .62, 5.2), H - .02, .05, M.media, 0, H / 2, -d / 2 + .01, g, false); // the media wall
    box(Math.min(w * .62, 5.2), .03, .03, M.teal, 0, H - .05, -d / 2 + .05, g, false); // LED cove
    // the glass side wall, with the city outside
    const sky = new THREE.Mesh(new THREE.PlaneGeometry(d * 3.2, 9), new THREE.MeshBasicMaterial({ map: skyline, fog: false })); sky.position.set(-w / 2 - 4, 3.2, 0); sky.rotation.y = Math.PI / 2; g.add(sky);
    for (let i = 0; i <= Math.ceil(d / 1.2); i++) { const z = -d / 2 + i * (d / Math.ceil(d / 1.2)); box(.06, H, .06, M.black, -w / 2 - .03, H / 2, z, g); }
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(d, H), M.glass); gl.position.set(-w / 2 - .03, H / 2, 0); gl.rotation.y = Math.PI / 2; g.add(gl);
    box(.08, .06, d, M.black, -w / 2 - .03, H, 0, g); box(.08, .1, d, M.black, -w / 2 - .03, .05, 0, g);
    // floor edge glow (the cutaway)
    box(w + .3, .02, .02, M.gold, 0, .01, d / 2 + .16, g, false); box(.02, .02, d + .3, M.gold, w / 2 + .16, .01, 0, g, false);
  }
  function buildLayout(animate) {
    const g = group('layout', animate ? 0 : undefined), { w, d, seats } = dims; let si = 0;
    const seatMat = () => M.seat[(si++) % M.seat.length];
    const ppl = Math.min(seats, 6); let pc = 0;
    const addPerson = (x, z, r) => { if (pc < ppl && (pc * 7 + si) % 3 !== 1) person(g, x, z, r, pc); pc++; };
    if (sel.layout === 'round') {
      const r = Math.min(.9, .35 + seats * .05); consoleAt = [.25, .8, .2]; cyl(r, r, .05, M.oak, 0, .74, 0, g, 48); cyl(.08, .08, .7, M.black, 0, .37, 0, g, 16);
      const n = Math.min(seats, 8); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + .3; const cx = Math.cos(a) * (r + .45), cz = Math.sin(a) * (r + .45); chair(g, cx, cz, -a - Math.PI / 2, seatMat()); }
    } else if (sel.layout === 'class') {
      const rows = Math.max(2, Math.round(seats / 6)), per = Math.ceil(seats / rows); consoleAt = null;
      for (let r = 0; r < rows; r++) for (let i = 0; i < per; i++) { const x = (i - (per - 1) / 2) * 1.0, z = -d / 2 + 2.4 + r * 1.35; if (z > d / 2 - .6) continue; box(.85, .04, .5, M.white, x, .74, z, g); box(.04, .72, .4, M.black, x - .38, .36, z, g); box(.04, .72, .4, M.black, x + .38, .36, z, g); chair(g, x, z + .5, Math.PI, seatMat()); if (r === 0 && i % 2 === 0) addPerson(x, z + .5, Math.PI); }
    } else if (sel.layout === 'frontrow') {
      // a gentle arc of table wrapped around the screen: everyone faces the camera, remote people are life-size
      const zc = -d / 2 + .3, R = Math.max(2.2, Math.min(d - 1.6, d * .55)), n = Math.min(seats, 10), span = Math.min(1.35, (n * .68) / R);
      const shape = new THREE.Shape(); shape.absarc(0, 0, R + .35, -Math.PI / 2 - span / 2, -Math.PI / 2 + span / 2, false); shape.absarc(0, 0, R - .35, -Math.PI / 2 + span / 2, -Math.PI / 2 - span / 2, true);
      const top = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: .05, bevelEnabled: true, bevelSize: .015, bevelThickness: .015, bevelSegments: 2, curveSegments: 48 }), M.oak);
      top.rotation.x = -Math.PI / 2; top.position.set(0, .72, zc); top.castShadow = true; top.receiveShadow = true; g.add(top);
      for (const f of [-.33, .33]) { const a = -Math.PI / 2 + f * span; box(.08, .7, .08, M.black, Math.cos(a) * R, .36, zc - Math.sin(a) * R, g); }
      for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + (i - (n - 1) / 2) * (span * .9 / Math.max(1, n - 1)), r2 = R + .8, x = Math.cos(a) * r2, z = zc - Math.sin(a) * r2, rot = Math.atan2(-x, zc - z);
        chair(g, x, z, rot, seatMat()); if (i % 2 === 0) addPerson(x, z, rot); }
      consoleAt = [.3, .8, zc + R];
    } else {
      const L = Math.min(d - 2.4, .9 + seats * .32), W2 = seats > 8 ? 1.5 : 1.2, z0 = -d / 2 + 1.7 + L / 2; consoleAt = [.3, .8, z0 - L / 2 + .35];
      rbox(W2, .06, L, .05, M.oak, 0, .75, z0, g); box(.5, .7, L * .6, M.black, 0, .36, z0, g);
      const per = Math.ceil(Math.min(seats, 14) / 2);
      for (let i = 0; i < per; i++) { const z = z0 - L / 2 + .45 + i * ((L - .9) / Math.max(1, per - 1)); for (const s of [-1, 1]) { const c = chair(g, s * (W2 / 2 + .4), z, s > 0 ? -Math.PI / 2 : Math.PI / 2, seatMat()); if ((i + (s > 0)) % 2 === 0) addPerson(s * (W2 / 2 + .4), z, c.rotation.y); } }
    }
    // a plant or two, because rooms are for people
    const plant = (x, z) => { const p = new THREE.Group(); p.position.set(x, 0, z); g.add(p); cyl(.22, .18, .45, M.white, 0, .22, 0, p, 24); for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(.16 + Math.random() * .1, 12, 10), std({ color: 0x3f8a55, roughness: .8 })); s.position.set((Math.random() - .5) * .35, .62 + Math.random() * .5, (Math.random() - .5) * .35); s.scale.y = 1.3; s.castShadow = true; p.add(s); } };
    plant(dims.w / 2 - .5, -dims.d / 2 + .5); if (dims.w > 5) plant(-dims.w / 2 + .5, dims.d / 2 - .6);
  }
  function buildDisplay(animate) {
    const g = group('display', animate ? 0 : undefined), { d } = dims, z = -d / 2 + .08, y = 1.5;
    const scr = (w2, h2, x, kind) => { rbox(w2 + .04, h2 + .04, .05, .01, M.black, x, y, z, g); const s = new THREE.Mesh(new THREE.PlaneGeometry(w2, h2), new THREE.MeshBasicMaterial({ map: screenTex(kind, sel.platform), toneMapped: true, color: 0xdddddd })); s.position.set(x, y, z + .03); g.add(s); };
    if (sel.display === 'single') scr(1.66, .94, 0, 'both');
    if (sel.display === 'dual') { scr(1.43, .81, -.8, 'people'); scr(1.43, .81, .8, 'content'); }
    if (sel.display === 'led') scr(3.2, 1.8, 0, 'both');
    g.userData.anchor = new THREE.Vector3(0, y + 1, z);
  }
  function buildAV(animate) {
    const g = group('av', animate ? 0 : undefined), { w, d } = dims, z = -d / 2 + .14, H = 2.9;
    const yBar = sel.display === 'led' ? .5 : 1.0;
    if (sel.av === 'bar') { rbox(.9, .1, .1, .03, M.black, 0, yBar, z, g); box(.06, .03, .01, M.teal, 0, yBar, z + .06, g, false); }
    if (sel.av === 'smart' || sel.av === 'multi') {
      rbox(.24, .12, .12, .03, M.black, 0, yBar, z, g); box(.05, .05, .01, M.teal, 0, yBar, z + .07, g, false);
      const n = sel.av === 'multi' ? 3 : 2; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * (w / (n + 1)), zz = -d / 2 + d * .45; cyl(.3, .3, .03, M.white, x, H - .02, zz, g, 32); const ring = new THREE.Mesh(new THREE.TorusGeometry(.3, .012, 8, 48), M.teal); ring.rotation.x = Math.PI / 2; ring.position.set(x, H - .04, zz); g.add(ring); cyl(.004, .004, .2, M.black, x, H + .08, zz, g, 6); }
      for (const s of [-1, 1]) { cyl(.14, .14, .02, M.white, s * w * .3, H - .01, d * .25, g, 24); }
    }
    if (sel.av === 'multi') { rbox(.18, .1, .1, .03, M.black, -w / 2 + .3, 2.1, -d / 2 + 1, g); box(.04, .04, .01, M.teal, -w / 2 + .36, 2.1, -d / 2 + 1, g, false); }
    // the touch console
    if (consoleAt) { rbox(.26, .03, .18, .02, M.black, consoleAt[0], consoleAt[1], consoleAt[2], g); box(.2, .005, .12, M.teal, consoleAt[0], consoleAt[1] + .02, consoleAt[2], g, false); }
    g.userData.anchor = new THREE.Vector3(0, H - .2, -d / 2 + d * .45);
  }
  function buildExtras(animate) {
    const g = group('extras', animate ? 0 : undefined), { w, d } = dims, H = 2.9, ex = new Set(sel.extras || []);
    let k = 0; const later = () => (k++) * 120;
    if (ex.has('booking')) { const b = new THREE.Group(); g.add(b); rbox(.26, .18, .03, .015, M.black, -w / 2 + .02, 1.25, d / 2 - .6, b).rotation.y = Math.PI / 2; const s = box(.2, .13, .005, std({ color: 0x22c55e, emissive: 0x22c55e, emissiveIntensity: 1.6 }), -w / 2 + .04, 1.25, d / 2 - .6, b, false); s.rotation.y = Math.PI / 2; if (animate) pop(b, later()); }
    if (ex.has('share')) { const b = new THREE.Group(); g.add(b); cyl(.07, .07, .03, M.black, -.4, .8, .3, b, 24); const r = new THREE.Mesh(new THREE.TorusGeometry(.07, .008, 8, 32), M.teal); r.rotation.x = Math.PI / 2; r.position.set(-.4, .815, .3); b.add(r); if (animate) pop(b, later()); }
    if (ex.has('lights')) { const b = new THREE.Group(); g.add(b); for (const s of [-1, 1]) { box(Math.min(3.2, w * .5), .04, .12, M.black, 0, 2.35, s * .5, b); box(Math.min(3.1, w * .48), .01, .08, M.warm, 0, 2.325, s * .5, b, false); cyl(.004, .004, .55, M.black, 0, 2.62, s * .5, b, 6); } if (animate) pop(b, later()); }
    if (ex.has('acoustic')) { const b = new THREE.Group(); g.add(b); const n = Math.max(3, Math.round(w / 1.6)); for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 1.05; if (Math.abs(x) < Math.min(w * .31, 2.6)) continue; rbox(.8, 1.2, .05, .02, i % 2 ? M.felt : M.felt2, x, 1.7, -d / 2 + .04, b); } rbox(Math.min(3, w * .45), .06, 1.4, .02, M.felt2, 0, 2.6, 0, b); if (animate) pop(b, later()); }
    if (ex.has('sensor')) { const b = new THREE.Group(); g.add(b); cyl(.06, .06, .03, M.white, w * .3, H - .02, -d * .1, b, 20); const r = new THREE.Mesh(new THREE.TorusGeometry(.06, .006, 8, 24), M.gold); r.rotation.x = Math.PI / 2; r.position.set(w * .3, H - .04, -d * .1); b.add(r); b.userData.pulse = r; if (animate) pop(b, later()); }
  }
  function rebuild(changed) {
    dims = SIZES[sel.size];
    if (!changed || changed === 'size') { buildShell(); buildLayout(); buildDisplay(); buildAV(); buildExtras(); if (changed) Object.values(parts).forEach((g, i) => pop(g, i * 90)); return; }
    if (changed === 'layout') buildLayout(true);
    if (changed === 'display' || changed === 'platform') { buildDisplay(changed === 'display'); if (changed === 'display') buildAV(); }
    if (changed === 'av') buildAV(true);
    if (changed === 'extras') buildExtras(true);
  }

  // ---------- camera choreography ----------
  let camTween = null;
  const VIEWS = {
    size: d => ({ r: d.w * 1.45 + 5, th: .78, ph: .95, ty: .6 }), layout: d => ({ r: d.w * 1.2 + 4, th: .55, ph: .7, ty: .5 }),
    display: d => ({ r: d.w * .9 + 3.5, th: .35, ph: 1.18, ty: 1.2, tz: -d.d * .25 }), av: d => ({ r: d.w * 1 + 3.5, th: .6, ph: .9, ty: 1.6 }),
    extras: d => ({ r: d.w * 1.3 + 4.5, th: .9, ph: .92, ty: .9 }), platform: d => ({ r: d.w * .7 + 3, th: .2, ph: 1.25, ty: 1.3, tz: -d.d * .3 }),
    brief: d => ({ r: d.w * 1.35 + 5, th: .7, ph: .98, ty: .7 }),
  };
  function view(step, ms = 1600) {
    const v = VIEWS[step](dims), tgt = new THREE.Vector3(0, v.ty, v.tz || 0);
    const pos = new THREE.Vector3(tgt.x + v.r * Math.sin(v.th) * Math.sin(v.ph), tgt.y + v.r * Math.cos(v.ph), tgt.z + v.r * Math.cos(v.th) * Math.sin(v.ph));
    camTween = { t0: performance.now(), ms, p0: camera.position.clone(), p1: pos, c0: controls.target.clone(), c1: tgt };
  }
  camera.position.set(14, 12, 14); controls.target.set(0, .5, 0);

  // ---------- loop ----------
  let raf = 0, alive = true, idle = 0;
  const ease = k => 1 - Math.pow(1 - k, 3), back = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
  function size() { const r = host.getBoundingClientRect(); const w = Math.max(10, r.width), h = Math.max(10, r.height); renderer.setSize(w, h, false); composer.setSize(w, h); camera.aspect = w / h; camera.setViewOffset(w, h, w > 900 ? -w * .05 : 0, h * .15, w, h); camera.updateProjectionMatrix(); }
  const ro = new ResizeObserver(size); ro.observe(host); size();
  controls.addEventListener('start', () => { camTween = null; idle = performance.now() + 6000; });
  function loop(now) {
    if (!alive) return; raf = requestAnimationFrame(loop);
    if (camTween) { const k = Math.min(1, (now - camTween.t0) / camTween.ms), e = ease(k); camera.position.lerpVectors(camTween.p0, camTween.p1, e); controls.target.lerpVectors(camTween.c0, camTween.c1, e); if (k >= 1) camTween = null; }
    else if (now > idle) { const off = camera.position.clone().sub(controls.target); off.applyAxisAngle(new THREE.Vector3(0, 1, 0), .0007); camera.position.copy(controls.target).add(off); }
    for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i], k = Math.min(1, Math.max(0, (now - a.t0) / a.dur)); a.g.scale.setScalar(Math.max(.001, back(k))); a.g.position.y = a.y0 + (a.y1 - a.y0) * ease(k); if (k >= 1) { a.g.scale.setScalar(1); a.g.position.y = a.y1; anims.splice(i, 1); } }
    const s = parts.extras?.children.find(c => c.userData.pulse); if (s) s.userData.pulse.material.emissiveIntensity = 1.2 + Math.sin(now / 300) * .8;
    controls.update(); composer.render();
  }
  raf = requestAnimationFrame(loop);
  rebuild();
  return {
    set(next, changed) { sel = { ...next }; rebuild(changed); },
    view,
    snapshot() { composer.render(); try { return renderer.domElement.toDataURL('image/jpeg', .85); } catch (e) { return ''; } },
    destroy() { alive = false; cancelAnimationFrame(raf); ro.disconnect(); controls.dispose(); renderer.dispose(); pmrem.dispose(); renderer.domElement.remove(); },
  };
}

// ---------------- the studio UI ----------------
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export function roomBuilder({ submitLead, onTrack = () => { } }) {
  return new Promise(async res => {
    const overlay = document.getElementById('overlay');
    const saved = save.get('room', null);
    let sel = { ...DEFAULTS, ...(saved?.sel || {}) }, step = Math.min(saved?.step || 0, STEPS.length);
    overlay.innerHTML = `<div id="studio"><div class="s3d"><div class="sload">Building the room…</div></div>
      <nav class="srail"></nav>
      <aside class="sspec"><div class="sk">Your room so far</div><ol></ol></aside>
      <section class="scard"></section>
      <button type="button" class="sx" aria-label="Close the studio">×</button></div>`;
    overlay.hidden = false;
    const $ = q => overlay.querySelector(q), host = $('.s3d');
    let R = null;
    const weak = !window.WebGLRenderingContext || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    if (!weak) { try { R = await Promise.race([create3D(host), new Promise((_, rj) => setTimeout(() => rj('timeout'), 9000))]); } catch (e) { R = null; } }
    $('.sload').remove();
    if (!R) host.innerHTML = `<div class="snogl">The 3D preview needs WebGL. Your choices and the brief still work.</div>`;
    const persist = () => save.set('room', { sel, step });
    const close = v => { offEsc(); offNum(); R?.destroy(); overlay.hidden = true; overlay.innerHTML = ''; res(v); };
    $('.sx').onclick = () => close(null);
    const offEsc = on('esc', () => close(null));
    let offNum = () => { };

    function rail() {
      $('.srail').innerHTML = [...STEPS.map((s, i) => `<button type="button" data-step="${i}" class="${i < step ? 'done' : i === step ? 'now' : ''}"><i>${i + 1}</i><span>${esc(s.title.replace(/[?.]$/, '').replace('How big is the room', 'Size').replace('How should people sit', 'Layout').replace('What goes on the wall', 'Display').replace('How will the room see and hear', 'Camera & audio').replace('Make it a room people choose', 'Extras').replace('Which platform do you live on', 'Platform'))}</span></button>`), `<button type="button" data-step="${STEPS.length}" class="${step === STEPS.length ? 'now' : ''}"><i>✓</i><span>Brief</span></button>`].join('');
      $('.srail').querySelectorAll('[data-step]').forEach(b => b.onclick = () => { const n = +b.dataset.step; if (n <= step || n === step + 1) go(n); });
    }
    function spec() {
      const L = kitList(sel);
      $('.sspec ol').innerHTML = L.map(k => `<li><span>${esc(k.g)}</span><b>${esc(k.t)}</b></li>`).join('');
    }
    function card() {
      offNum();
      if (step >= STEPS.length) return brief();
      const s = STEPS[step], cur = sel[s.id];
      $('.scard').innerHTML = `<div class="shead"><img alt="" src="${portrait(s.who)}"><div><div class="sk">Step ${step + 1} of ${STEPS.length} · ${s.who === 'bob' ? 'Bob builds' : 'Bill asks'}</div><h3>${esc(s.title)}</h3></div></div>
        <p class="sline">${esc(s.line)}</p>
        <div class="sopts ${s.multi ? 'multi' : ''}">${s.options.map((o, i) => { const on = s.multi ? cur.includes(o.v) : cur === o.v; return `<button type="button" data-v="${o.v}" class="${on ? 'on' : ''}"><kbd>${i + 1}</kbd><b>${esc(o.t)}</b><span>${esc(o.d)}</span>${o.meta ? `<em>${esc(o.meta)}</em>` : ''}</button>`; }).join('')}</div>
        <div class="snav">${step > 0 ? '<button type="button" class="cta alt" data-nav="back">◂ Back</button>' : ''}<button type="button" class="cta" data-nav="next">${step === STEPS.length - 1 ? 'See my room brief ▸' : 'Next ▸'}</button><span class="shint"><kbd>1</kbd>–<kbd>${s.options.length}</kbd> to choose · <kbd>Space</kbd> next</span></div>`;
      const pickOpt = v => {
        if (s.multi) { const set = new Set(sel[s.id]); set.has(v) ? set.delete(v) : set.add(v); sel = { ...sel, [s.id]: [...set] }; }
        else {
          sel = { ...sel, [s.id]: v };
          if (s.id === 'size') { // sensible companions
            if (v === 'huddle') sel = { ...sel, layout: 'round', display: 'single', av: 'bar' };
            if (v === 'medium') sel = { ...sel, layout: 'frontrow', display: 'dual', av: 'smart' };
            if (v === 'board') sel = { ...sel, layout: 'board', display: 'led', av: 'multi' };
            if (v === 'training') sel = { ...sel, layout: 'class', display: 'led', av: 'smart' };
          }
        }
        audio.sfx('build'); R?.set(sel, s.id); spec(); persist(); card();
      };
      $('.scard').querySelectorAll('[data-v]').forEach(b => b.onclick = () => pickOpt(b.dataset.v));
      $('.scard').querySelector('[data-nav=next]').onclick = () => go(step + 1);
      const bk = $('.scard').querySelector('[data-nav=back]'); if (bk) bk.onclick = () => go(step - 1);
      offNum = on('num', n => { const o = s.options[n - 1]; if (o) pickOpt(o.v); });
      setTimeout(() => $('.scard [data-nav=next]')?.focus({ preventScroll: true }), 30);
    }
    function brief() {
      const L = kitList(sel), groups = {};
      for (const k of L) (groups[k.g] ||= []).push(k);
      $('.scard').classList.add('wide');
      $('.scard').innerHTML = `<div class="shead"><img alt="" src="${portrait('bill')}"><div><div class="sk">Your room brief · Meeting Room Studio</div><h3>${esc(name('size', sel.size))}, ${esc(name('layout', sel.layout))}, ${esc(name('display', sel.display))}.</h3></div></div>
        <div class="sbrief">${Object.entries(groups).map(([g, ks]) => `<div><h5>${esc(g)}</h5>${ks.map(k => `<p><b>${esc(k.t)}</b><span>${esc(k.why)}</span></p>`).join('')}</div>`).join('')}</div>
        <ol class="sflow"><li><b>Survey</b><span>We measure, listen to the room, check the network.</span></li><li><b>Design</b><span>A design pack and kit list you can approve.</span></li><li><b>Install</b><span>Clean, cable-free, out of hours.</span></li><li><b>Support</b><span>Rooms monitored; issues fixed before anyone notices.</span></li></ol>
        <form class="sform" novalidate><label><span>Email</span><input name="email" type="email" autocomplete="email" placeholder="${esc(session.email || 'you@company.com')}"></label><label><span>Organisation</span><input name="business" autocomplete="organization" placeholder="${esc(session.business || 'Company or school')}"></label><label class="w"><span>Anything else? Number of rooms, deadline…</span><input name="note" maxlength="200" placeholder="Optional"></label><input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
          <div class="snav"><button class="cta" type="submit">Send me this brief ▸</button><button type="button" class="cta alt" data-nav="book">Book a call with Yasin and Nixy</button><button type="button" class="lnk" data-nav="edit">Change something</button></div><p class="serr" hidden></p></form>`;
      R?.view('brief');
      const f = $('.sform');
      f.onsubmit = async e => {
        e.preventDefault(); const d = Object.fromEntries(new FormData(f)); if (d.website) return;
        const email = (d.email || session.email || '').trim(), er = f.querySelector('.serr');
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { er.hidden = false; er.textContent = "Add an email and we'll send the brief there."; return; }
        f.querySelector('[type=submit]').disabled = true; f.querySelector('[type=submit]').textContent = 'Sending…';
        const r = await submitLead({ kind: 'room-brief', name: session.name, email, business: d.business || session.business, note: d.note, newsletterOptIn: !!session.newsletter, room: sel, kit: L.map(k => k.t).join(' | ') });
        onTrack('room_brief_sent');
        f.innerHTML = `<div class="sdone"><b>${r === 'failed' ? "That didn't send." : 'Sent. Bill has it.'}</b><span>${r === 'failed' ? `Email ${esc(CONFIG.CONTACT_EMAIL)} and paste your kit list; we'll pick it up.` : "We'll come back with a proper scope for this room. Nixy will remind us."}</span><div class="snav"><button type="button" class="cta" data-nav="done">Back to the city ▸</button><button type="button" class="cta alt" data-nav="book">Book a call with Yasin and Nixy</button></div></div>`;
        f.querySelectorAll('[data-nav]').forEach(b => b.onclick = () => close(b.dataset.nav === 'book' ? 'book' : 'sent'));
      };
      f.querySelector('[data-nav=book]').onclick = () => close('book');
      f.querySelector('[data-nav=edit]').onclick = () => { $('.scard').classList.remove('wide'); go(0); };
    }
    function go(n) {
      step = Math.max(0, Math.min(STEPS.length, n)); $('.scard').classList.toggle('wide', step >= STEPS.length);
      persist(); rail(); card(); spec(); R?.view(step >= STEPS.length ? 'brief' : STEPS[step].id); onTrack('room_step_' + step);
    }
    // Space moves on (unless typing or a button has focus, which handles itself)
    const offAct = on('act', () => { const b = $('.scard [data-nav=next]'); if (b) b.click(); });
    const _close = close; // make sure the act handler goes too
    $('.sx').onclick = () => { offAct(); _close(null); };
    go(step);
    const origRes = res; res = v => { offAct(); origRes(v); };
  });
}
