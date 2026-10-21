// Tiny WebAudio chiptune kit. Off by default; nothing plays until the visitor turns sound on.
let ac = null, master = null, musicTimer = null, track = null;
const PITCH = { nixy: 880, yasin: 330, bob: 220, bill: 520, moth: 1200, teacher: 440, coach: 400, clerk: 700, npc: 500, sys: 660, user: 600, you: 620, past: 150, ghost: 180 };

function ctx() {
  if (!ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; ac = new A(); master = ac.createGain(); master.gain.value = .18; master.connect(ac.destination); }
  if (ac.state === 'suspended') ac.resume();
  return ac;
}
function tone(freq, dur = .06, type = 'square', vol = .5, when = 0, slide = 0) {
  const a = ctx(); if (!a) return;
  const t = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + dur);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .02);
}
const SONGS = {
  grey: { bpm: 60, notes: [110, 0, 104, 0, 98, 0, 104, 0], type: 'triangle', vol: .22 },
  town: { bpm: 112, notes: [523, 659, 784, 659, 587, 740, 880, 740, 523, 659, 784, 988, 880, 784, 659, 587], bass: [131, 131, 147, 147, 165, 165, 147, 147], type: 'square', vol: .1 },
  battle: { bpm: 150, notes: [440, 523, 659, 523, 440, 523, 698, 659, 587, 523, 494, 523, 587, 659, 523, 440], bass: [110, 110, 98, 98], type: 'square', vol: .1 },
  haunt: { bpm: 52, notes: [220, 0, 208, 0, 196, 0, 233, 0, 220, 0, 175, 0, 165, 0, 0, 0], bass: [55, 55, 52, 49], type: 'triangle', vol: .16 },
  boss: { bpm: 132, notes: [220, 262, 330, 311, 220, 262, 349, 330, 208, 247, 311, 294, 208, 247, 330, 311], bass: [55, 55, 52, 52, 49, 49, 52, 52], type: 'sawtooth', vol: .06 },
  inside: { bpm: 90, notes: [392, 494, 587, 494, 440, 523, 659, 523], bass: [98, 110], type: 'triangle', vol: .14 },
};

export const audio = {
  on: false,
  toggle() { this.on = !this.on; if (this.on) { ctx(); this.music(track, true); } else { clearInterval(musicTimer); musicTimer = null; } return this.on; },
  blip(sp) { if (this.on) tone(PITCH[sp] || 600, .035, 'square', .25); },
  sfx(k) {
    if (!this.on) return;
    if (k === 'select') { tone(988, .05); tone(1319, .07, 'square', .5, .05); }
    if (k === 'coin') { tone(988, .08); tone(1319, .25, 'square', .5, .08); }
    if (k === 'door') { tone(196, .12, 'triangle', .6); tone(147, .2, 'triangle', .6, .1); }
    if (k === 'step') tone(90, .03, 'triangle', .3);
    if (k === 'swirl') { for (let i = 0; i < 10; i++) tone(300 + i * 80, .05, 'square', .3, i * .04); }
    if (k === 'bump') tone(70, .06, 'square', .4);
    if (k === 'knock') tone(160, .08, 'triangle', .9, 0, -60);
    if (k === 'build') { for (let i = 0; i < 4; i++) tone(220 + i * 110, .05, 'square', .35, i * .06); }
    if (k === 'tape') tone(1400, .25, 'sawtooth', .2, 0, -1100);
    if (k === 'hit') { tone(220, .12, 'square', .5, 0, -150); tone(110, .16, 'triangle', .7, .03, -50); }
    if (k === 'ghost') { tone(440, .5, 'sine', .35, 0, -260); tone(466, .5, 'sine', .25, .05, -280); }
    if (k === 'thunder') { tone(60, .9, 'sawtooth', .35, 0, -20); tone(45, 1.2, 'triangle', .5, .1, -5); }
    if (k === 'heal') [392, 523, 659].forEach((f, i) => tone(f, .14, 'triangle', .45, i * .07));
    if (k === 'win') [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'square', .4, i * .1));
  },
  music(name, force) {
    if (!force && name === track) return; track = name; clearInterval(musicTimer); musicTimer = null;
    if (!this.on || !name || !SONGS[name]) return;
    const s = SONGS[name], beat = 60 / s.bpm / 2; let i = 0;
    musicTimer = setInterval(() => {
      const n = s.notes[i % s.notes.length]; if (n) tone(n, beat * .9, s.type, s.vol);
      if (s.bass && i % 2 === 0) tone(s.bass[(i / 2 | 0) % s.bass.length], beat * 1.8, 'triangle', s.vol * 1.6);
      i++;
    }, beat * 1000);
  },
};
