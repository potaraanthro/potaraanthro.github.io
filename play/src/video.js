// Video layer: plays a clip in a CRT frame over the game. Resolves when the clip ends, is skipped (button, Esc, Space/Enter) or fails.
// Never blocks: a missing or broken file resolves at once with a still frame, and a watchdog ends any clip after duration + 8 s.
import { on } from './core.js';
import { audio } from './audio.js';

const overlay = document.querySelector('#overlay');
let current = null;

// Background clip: plays above the game, below the dialogue box, never takes clicks. Missing files simply don't show.
function bg(opts) {
  const wrap = document.createElement('div'); wrap.className = 'vbg';
  const v = document.createElement('video'); v.playsInline = true; v.preload = 'auto'; v.muted = !audio.on; v.loop = !!opts.loop; v.setAttribute('aria-hidden', 'true');
  for (const u of [].concat(opts.src)) { const so = document.createElement('source'); so.src = u; so.type = u.endsWith('.webm') ? 'video/webm' : 'video/mp4'; v.append(so); }
  let dead = false;
  const kill = () => { if (dead) return; dead = true; try { v.pause(); } catch (e) { } wrap.classList.remove('on'); setTimeout(() => { wrap.remove(); if (!overlay.children.length) overlay.hidden = true; }, 350); };
  v.lastElementChild?.addEventListener('error', kill); v.addEventListener('error', kill);
  v.addEventListener('canplay', () => { if (!dead) wrap.classList.add('on'); }, { once: true });
  wrap.append(v); overlay.append(wrap); overlay.hidden = false;
  const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(kill); });
  return { stop: kill, el: v };
}

export const video = {
  bg,
  get playing() { return !!current; },
  // opts: { src, poster, caption, label, muted }
  play(opts) {
    if (current) current.stop();
    return new Promise(res => {
      const wrap = document.createElement('div'); wrap.id = 'vidp';
      const v = document.createElement('video');
      for (const u of [].concat(opts.src)) { const so = document.createElement('source'); so.src = u; so.type = u.endsWith('.webm') ? 'video/webm' : 'video/mp4'; v.append(so); }
      if (opts.poster) v.poster = opts.poster;
      v.playsInline = true; v.preload = 'auto'; v.muted = !!opts.muted; v.setAttribute('aria-label', opts.label || 'Video');
      const cap = document.createElement('div'); cap.className = 'vcap'; cap.textContent = opts.caption || ''; cap.hidden = !opts.caption;
      const skip = document.createElement('button'); skip.type = 'button'; skip.className = 'vskip'; skip.textContent = 'SKIP ▶▶';
      wrap.append(v, cap, skip);
      const hadHtml = overlay.innerHTML; overlay.innerHTML = ''; overlay.append(wrap); overlay.hidden = false;
      let done = false, dog = null;
      const stop = () => {
        if (done) return; done = true; clearTimeout(dog); offEsc(); offAct();
        try { v.pause(); } catch (e) { }
        wrap.remove(); current = null; audio.resume?.(); res();
      };
      const fail = () => { if (done) return; v.remove(); const f = document.createElement('div'); f.className = 'vfall'; f.textContent = opts.fallback || 'Video unavailable. Carry on.'; wrap.prepend(f); setTimeout(stop, 2200); };
      const born = performance.now(); const early = () => performance.now() - born > 700; // ignore stray clicks right after opening
      const offEsc = on('esc', stop), offAct = on('act', () => { if (early()) stop(); });
      skip.addEventListener('click', stop);
      v.addEventListener('ended', stop); v.addEventListener('error', fail); v.lastElementChild?.addEventListener('error', fail);
      v.addEventListener('loadedmetadata', () => { clearTimeout(dog); dog = setTimeout(stop, (isFinite(v.duration) ? v.duration : 60) * 1000 + 8000); });
      dog = setTimeout(stop, 70000);
      const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(fail); });
      current = { stop };
      skip.focus({ preventScroll: true });
    });
  },
};
