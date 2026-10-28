/* Shared 3D stage: renderer, studio lighting, render-only-when-visible loop,
   and HTML labels pinned to points in the scene. */
import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function hasWebGL() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); }
  catch { return false; }
}

export function makeStage(canvas, { fov = 32, exposure = 1 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.05, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false; // page scroll wins; the stage drives the camera
  canvas.style.touchAction = 'pan-y'; // sideways drags turn the model, vertical swipes still scroll the page

  const size = { w: 1, h: 1 };
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    size.w = w; size.h = h;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(canvas);
  resize();

  const ticks = [];
  let visible = false, raf = 0, last = 0, time = 0;
  function frame(now) {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now; time += dt;
    for (const f of ticks) f(dt, time);
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  new IntersectionObserver(es => { visible = es[es.length - 1].isIntersecting; if (visible) start(); }, { rootMargin: '120px' }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && visible) start(); });

  return { renderer, scene, camera, controls, size, onTick: f => ticks.push(f), isVisible: () => visible };
}

/* Key, rim and fill lights plus a soft contact shadow on an invisible floor. */
export function studio(scene, { floorY = -1, shadowSize = 4, rim = 0x7de9ff, fill = 0x8c6cff } = {}) {
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x1a1530, 0.55));
  const key = new THREE.DirectionalLight(0xfff3e6, 2.2);
  key.position.set(3.5, 6, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -shadowSize;
  key.shadow.camera.right = key.shadow.camera.top = shadowSize;
  key.shadow.bias = -0.0004;
  key.shadow.radius = 6;
  scene.add(key);
  const rimL = new THREE.DirectionalLight(rim, 1.6); rimL.position.set(-5, 3, -4); scene.add(rimL);
  const fillL = new THREE.DirectionalLight(fill, 0.8); fillL.position.set(-4, -1, 5); scene.add(fillL);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(shadowSize * 1.6, 64), new THREE.ShadowMaterial({ opacity: 0.38 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = floorY; floor.receiveShadow = true;
  scene.add(floor);
  const glow = new THREE.Mesh(new THREE.CircleGeometry(shadowSize * 1.2, 64),
    new THREE.MeshBasicMaterial({ map: radialTexture('rgba(125,233,255,0.22)'), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.rotation.x = -Math.PI / 2; glow.position.y = floorY - 0.002;
  scene.add(glow);
  return { key, floor };
}

export function radialTexture(inner, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function canvasTexture(w, h, draw, { srgb = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* Projects a world point into the canvas and moves an HTML element there.
   Returns false when the point is behind the camera. */
const _v = new THREE.Vector3();
export function pin(el, world, camera, size) {
  _v.copy(world).project(camera);
  if (_v.z > 1) { el.style.opacity = 0; return false; }
  const x = (_v.x * 0.5 + 0.5) * size.w, y = (-_v.y * 0.5 + 0.5) * size.h;
  el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
  el.style.opacity = '';
  return { x, y };
}

export const ease = {
  inOut: t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  out: t => 1 - Math.pow(1 - t, 4),
  back: t => { const c = 1.5; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
};

/* Glides the camera and orbit target to a new framing; any drag cancels it. */
export function cameraRig(camera, controls) {
  let tw = null;
  controls.addEventListener('start', () => { tw = null; });
  return {
    go(pos, target, dur = 1.4) {
      if (reduced || dur === 0) { camera.position.copy(pos); controls.target.copy(target); tw = null; return; }
      // Orbit around the target (spherical blend) so the camera never cuts through the model.
      const s0 = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
      const s1 = new THREE.Spherical().setFromVector3(pos.clone().sub(target));
      let d = s1.theta - s0.theta;
      if (d > Math.PI) d -= Math.PI * 2; else if (d < -Math.PI) d += Math.PI * 2;
      s1.theta = s0.theta + d;
      tw = { s0, s1, t0: controls.target.clone(), t1: target.clone(), k: 0, dur };
    },
    tick(dt) {
      if (!tw) return;
      tw.k = Math.min(1, tw.k + dt / tw.dur);
      const e = ease.inOut(tw.k), s = new THREE.Spherical(
        THREE.MathUtils.lerp(tw.s0.radius, tw.s1.radius, e),
        THREE.MathUtils.lerp(tw.s0.phi, tw.s1.phi, e),
        THREE.MathUtils.lerp(tw.s0.theta, tw.s1.theta, e));
      controls.target.lerpVectors(tw.t0, tw.t1, e);
      camera.position.setFromSpherical(s).add(controls.target);
      if (tw.k >= 1) tw = null;
    },
    get busy() { return !!tw; },
  };
}
