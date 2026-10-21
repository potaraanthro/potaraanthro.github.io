import { start, fit } from './core.js';
import { person, spritesReady } from './art.js';
import { boot } from './story.js';
import { S, FRAGMENTS, SPEAKERS } from '../data/script.js';

// Never show a blank canvas: any failure shows Nixy and a way to the traditional site.
const fail = e => { console.error(e); document.getElementById('fail').hidden = false; };
addEventListener('error', e => { if (e.filename && e.filename.includes('/src/')) fail(e.error || e.message); });
addEventListener('unhandledrejection', e => fail(e.reason));

// Readable transcript of the whole script, for screen readers and search engines.
(function transcript() {
  const out = []; const line = l => out.push(`<p><b>${SPEAKERS[l[0]]?.name || ''}</b> ${String(l[1]).replace(/</g, '&lt;')}</p>`);
  for (const k in S) { const v = S[k]; if (Array.isArray(v)) v.forEach(x => { if (Array.isArray(x) && !SPEAKERS[x[0]]) x.forEach(t => out.push(`<p>${String(t).replace(/</g, '&lt;')}</p>`)); else if (Array.isArray(x)) line(x); else if (x && x.t) out.push(`<p>Choice: ${x.t}</p>`); else if (x && x.line) line(x.line); else if (x && x.lines) { x.lines.forEach(line); if (x.q) out.push(`<p>Choice: ${x.q}</p>`); (x.after || []).forEach(line); if (x.ask) { x.ask.choices.forEach(c => out.push(`<p>Choice: ${c.t}</p>`)); (x.ask.yes || []).forEach(line); (x.ask.no || []).forEach(line); } } }); }
  for (const f of Object.values(FRAGMENTS)) out.push(`<p><b>Fragment: ${f.t}.</b> ${f.b}</p>`);
  document.getElementById('transcript').innerHTML = '<h2>Transcript</h2>' + out.join('');
})();

await spritesReady;
// Draw the look picker previews.
document.querySelectorAll('[data-look] canvas').forEach(c => { const g = c.getContext('2d'); g.imageSmoothingEnabled = false; const s = person(c.parentElement.dataset.look, 0); g.drawImage(s, (18 - s.width) >> 1, 0); });

fit(); start();
boot().catch(fail);
