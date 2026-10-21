// The founder film's score: peaceful, futuristic, generative. One mood value drives it:
// 0 = rain at night (sparse minor pads), 1 = warm morning (major lift, bells, a soft pulse).
// createScore works on a live AudioContext or an OfflineAudioContext (the preview render uses the same code).

const BPM = 66, BEAT = 60 / BPM, BAR = BEAT * 4;
const hz = m => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sstep = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// [bass, ...pad voicing] in MIDI. A: night (A aeolian). B: first light. C: morning (C major, a Lydian lift on IV).
const PROG = {
  A: [[45, 57, 60, 64, 71], [41, 57, 60, 64, 69], [36, 55, 60, 64, 67], [40, 55, 59, 62, 67]],
  B: [[41, 57, 60, 64, 67], [43, 55, 59, 62, 64], [45, 55, 60, 64, 67], [40, 55, 60, 64, 71]],
  C: [[36, 55, 59, 62, 64], [43, 55, 59, 62, 66], [45, 55, 60, 64, 71], [41, 57, 59, 64, 69]],
};
// bell motif degrees: indexes into the chord's pad voicing, an octave up
const MOTIF = [4, 3, 2, 3, 4, 2, 1, 2];

function impulse(ac, secs = 5.5, decay = 2.6) {
  const n = Math.floor(ac.sampleRate * secs), b = ac.createBuffer(2, n, ac.sampleRate), r = rng(11);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, decay); }
  return b;
}
function noiseBuf(ac, secs = 4) {
  const n = Math.floor(ac.sampleRate * secs), b = ac.createBuffer(2, n, ac.sampleRate), r = rng(5);
  for (let c = 0; c < 2; c++) { const d = b.getChannelData(c); let b0 = 0, b1 = 0, b2 = 0; for (let i = 0; i < n; i++) { const w = r() * 2 - 1; b0 = .997 * b0 + w * .03; b1 = .96 * b1 + w * .1; b2 = .6 * b2 + w * .4; d[i] = (b0 + b1 + b2 + w * .08) * .5; } }
  return b;
}

export function createScore(ac, out) {
  const r = rng(2026);
  const master = ac.createGain(); master.gain.value = 0;
  const comp = ac.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = .02; comp.release.value = .4;
  master.connect(comp); comp.connect(out);
  // reverb and a ping-pong echo as send busses
  const verb = ac.createConvolver(); verb.buffer = impulse(ac); const verbIn = ac.createGain(); const verbOut = ac.createGain(); verbOut.gain.value = .55;
  verbIn.connect(verb); verb.connect(verbOut); verbOut.connect(master);
  const echoIn = ac.createGain(), dl = ac.createDelay(2), dr = ac.createDelay(2), fb = ac.createGain(), lp = ac.createBiquadFilter(), mL = ac.createStereoPanner(), mR = ac.createStereoPanner();
  dl.delayTime.value = BEAT * .75; dr.delayTime.value = BEAT * .75; fb.gain.value = .38; lp.type = 'lowpass'; lp.frequency.value = 2600; mL.pan.value = -.7; mR.pan.value = .7;
  echoIn.connect(dl); dl.connect(lp); lp.connect(dr); dr.connect(fb); fb.connect(dl); dl.connect(mL); dr.connect(mR); mL.connect(master); mR.connect(master); mL.connect(verbIn); mR.connect(verbIn);
  const bus = (dry, wet, echo = 0) => { const g = ac.createGain(); g.gain.value = 0; const d = ac.createGain(); d.gain.value = dry; const w = ac.createGain(); w.gain.value = wet; g.connect(d); d.connect(master); g.connect(w); w.connect(verbIn); if (echo) { const e = ac.createGain(); e.gain.value = echo; g.connect(e); e.connect(echoIn); } return g; };
  const padF = ac.createBiquadFilter(); padF.type = 'lowpass'; padF.Q.value = .5; padF.frequency.value = 600;
  const L = { pad: bus(.55, .7), bass: bus(.8, .15), arp: bus(.35, .45, .6), bell: bus(.4, .6, .45), pulse: bus(.75, .12), rain: bus(.9, .2) };
  padF.connect(L.pad);
  // rain bed: filtered noise, always running, level set by mood
  const rain = ac.createBufferSource(); rain.buffer = noiseBuf(ac); rain.loop = true;
  const rhp = ac.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 500; const rlp = ac.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 5200;
  rain.connect(rhp); rhp.connect(rlp); rlp.connect(L.rain);
  const shaker = noiseBuf(ac, .5);

  const timeline = [[0, 0]];
  const moodAt = t => { let m = timeline[0][1]; for (const [at, v] of timeline) if (at <= t + 1e-6) m = v; return m; };
  const levels = m => ({ rain: .2 * (1 - sstep(.15, .5, m)), pad: .2 + .05 * m, bass: .3 + .1 * m, arp: .26 * sstep(.18, .45, m), bell: .2 * sstep(.45, .72, m), pulse: .3 * sstep(.68, .9, m), cut: 520 + 2300 * sstep(0, 1, m) });
  function applyMood(m, when) {
    const v = levels(m);
    for (const k of ['rain', 'pad', 'bass', 'arp', 'bell', 'pulse']) L[k].gain.setTargetAtTime(v[k], when, 1.6);
    padF.frequency.setTargetAtTime(v.cut, when, 2.2);
  }

  function env(g, t, a, peak, hold, rel) { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.setValueAtTime(peak, t + a + hold); g.gain.exponentialRampToValueAtTime(.0001, t + a + hold + rel); return t + a + hold + rel + .05; }
  function voice(freq, t, type, dest, { a = .01, peak = .3, hold = 0, rel = .5, detune = 0, pan = 0 } = {}) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = freq; o.detune.value = detune;
    let node = g; if (pan) { const p = ac.createStereoPanner(); p.pan.value = pan; g.connect(p); node = p; }
    o.connect(g); node.connect(dest); const end = env(g, t, a, peak, hold, rel); o.start(t); o.stop(end);
  }
  function bell(freq, t, peak, pan) {
    const c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain(), p = ac.createStereoPanner();
    c.frequency.value = freq; m.frequency.value = freq * 3.5; mg.gain.setValueAtTime(freq * 1.6, t); mg.gain.exponentialRampToValueAtTime(freq * .05, t + 1.6);
    m.connect(mg); mg.connect(c.frequency); c.connect(g); g.connect(p); p.pan.value = pan; p.connect(L.bell);
    const end = env(g, t, .006, peak, 0, 3.2); c.start(t); m.start(t); c.stop(end); m.stop(end);
  }
  function kick(t, peak) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + .28);
    o.connect(g); g.connect(L.pulse); const end = env(g, t, .004, peak, 0, .45); o.start(t); o.stop(end);
  }
  function shake(t, peak, pan) {
    const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(), p = ac.createStereoPanner(); s.buffer = shaker; f.type = 'highpass'; f.frequency.value = 6500; p.pan.value = pan;
    s.connect(f); f.connect(g); g.connect(p); p.connect(L.pulse); const end = env(g, t, .01, peak, 0, .09); s.start(t, r() * .3); s.stop(end);
  }

  let nextBar = 0, barN = 0, started = false, stopped = false;
  function scheduleBar(n, t) {
    const m = moodAt(t), set = m < .3 ? 'A' : m < .64 ? 'B' : 'C';
    const ch = PROG[set][n % 4], [bassN, ...pad] = ch;
    // pad: three detuned saws per note, long swell that overlaps the next bar
    for (const nt of pad) for (const d of [-7, 0, 7]) voice(hz(nt), t, 'sawtooth', padF, { a: 1.6, peak: .045, hold: BAR - 1.2, rel: 2.2, detune: d + (r() - .5) * 3, pan: d / 14 });
    for (const nt of pad.slice(0, 2)) voice(hz(nt - 12), t, 'sine', padF, { a: 1.2, peak: .06, hold: BAR - .8, rel: 1.8 });
    // bass: soft sine root with a sub
    voice(hz(bassN), t, 'sine', L.bass, { a: .25, peak: .32, hold: BAR * .5, rel: BAR * .6 });
    voice(hz(bassN - 12), t, 'sine', L.bass, { a: .4, peak: .22, hold: BAR * .4, rel: BAR * .6 });
    // arpeggio: eighth notes over the chord, an octave up; sparse at night, fuller in daylight
    const up = [...pad, pad[1] + 12, pad[2] + 12], pat = [0, 2, 1, 3, 2, 4, 3, 5];
    for (let i = 0; i < 8; i++) {
      if (r() > .35 + .6 * m) continue;
      const nt = up[pat[i] % up.length] + 12;
      voice(hz(nt), t + i * BEAT / 2 + (r() - .5) * .012, 'triangle', L.arp, { a: .004, peak: .12 + r() * .06, rel: .55 + m * .4, pan: (i % 2 ? .4 : -.4) });
    }
    // bells: a slow motif, two notes per bar
    for (let i = 0; i < 2; i++) { const deg = MOTIF[(n * 2 + i) % MOTIF.length]; bell(hz(pad[Math.min(deg, pad.length - 1)] + 12), t + i * BEAT * 2 + BEAT * .02, .16, i ? .3 : -.3); }
    // pulse: a heartbeat kick on 1 and 3, a breath of shaker on the off-beats
    kick(t, .5); kick(t + BEAT * 2, .35);
    for (let i = 0; i < 8; i++) if (i % 2) shake(t + i * BEAT / 2, .06 + r() * .03, (r() - .5) * .8);
  }

  return {
    BAR,
    start(when = ac.currentTime, mood = 0) {
      if (started) return; started = true; nextBar = when + .05; timeline.length = 0; timeline.push([0, mood]);
      applyMood(mood, when); rain.start(when);
      master.gain.setValueAtTime(0, when); master.gain.linearRampToValueAtTime(.9, when + 3);
    },
    setMood(m, when = ac.currentTime) { timeline.push([when, m]); timeline.sort((a, b) => a[0] - b[0]); applyMood(m, when); },
    scheduleUntil(t) { if (!started || stopped) return; while (nextBar < t) { scheduleBar(barN++, nextBar); nextBar += BAR; } },
    stop(when = ac.currentTime, fade = 2.2) {
      if (stopped) return; stopped = true; master.gain.cancelScheduledValues(when); master.gain.setValueAtTime(master.gain.value, when); master.gain.linearRampToValueAtTime(0, when + fade);
      try { rain.stop(when + fade + .1); } catch (e) { }
      if (!(typeof OfflineAudioContext !== 'undefined' && ac instanceof OfflineAudioContext)) setTimeout(() => { try { comp.disconnect(); } catch (e) { } }, (fade + .5) * 1000);
    },
  };
}

// Live wrapper for the game: one context, a lookahead scheduler, fades in and out.
let ac = null, cur = null, timer = null;
export const score = {
  get playing() { return !!cur; },
  start(mood = 0) {
    if (cur) return;
    const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
    ac ||= new A(); if (ac.state === 'suspended') ac.resume();
    cur = createScore(ac, ac.destination); cur.start(ac.currentTime + .05, mood);
    const s = cur; timer = setInterval(() => s.scheduleUntil(ac.currentTime + 1.2), 200); s.scheduleUntil(ac.currentTime + 1.2);
  },
  mood(m) { cur?.setMood(m, ac.currentTime); },
  stop(fade = 2.2) { if (!cur) return; cur.stop(ac.currentTime, fade); cur = null; clearInterval(timer); timer = null; },
};
