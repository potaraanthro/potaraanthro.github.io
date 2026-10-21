// Rich panels: crisp, fast-to-read information in glass cards. Each returns a promise of the visitor's choice.
// Every panel closes with the red ×, Esc, or a button; Space presses the default button.
import { on, save } from './core.js';
import { SERVICES, ORDER, CHALLENGES, PROOF } from '../data/services.js';
import { ROSENSHINE } from '../data/training.js';
import { CONFIG } from './config.js';
import { audio } from './audio.js';
import { avatarCanvas } from './art2.js';

const box = document.getElementById('panel');
let closeCurrent = null;
export const panelOpen = () => !box.hidden;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function panel(html, { color = '#19d3c5', mount, label = 'Panel' } = {}) {
  closeCurrent?.(null);
  return new Promise(res => {
    box.innerHTML = `<div class="pnl" role="dialog" aria-label="${esc(label)}" style="--c:${color}"><button class="px" type="button" aria-label="Close" data-v="__close">×</button>${html}</div>`;
    box.hidden = false; audio.sfx('select');
    const done = v => { if (!closeCurrent) return; closeCurrent = null; offEsc(); offAct(); box.hidden = true; box.innerHTML = ''; res(v === '__close' ? null : v); };
    closeCurrent = done;
    box.onclick = e => { const b = e.target.closest('[data-v]'); if (b && box.contains(b)) { e.preventDefault(); done(b.dataset.v); } else if (e.target === box) done(null); };
    const offEsc = on('esc', () => done(null));
    const offAct = on('act', () => { const d = box.querySelector('[data-default]'); if (d && document.activeElement?.tagName !== 'BUTTON') d.click(); });
    mount?.(box.querySelector('.pnl'), done);
    setTimeout(() => (box.querySelector('[data-default]') || box.querySelector('.px'))?.focus({ preventScroll: true }), 40);
  });
}
export function closePanel() { closeCurrent?.(null); }

// ---------------- the funnel: what's your challenge? ----------------
export function challengePanel() {
  const cards = CHALLENGES.map((c, i) => `<button type="button" data-v="${c.id}" style="--c:${SERVICES[c.id].color}"${i === 0 ? '' : ''}><kbd>${i + 1}</kbd><span class="ic">${c.icon}</span><b>${esc(c.t)}</b><span>${esc(c.d)}</span></button>`).join('');
  return panel(`<div class="kick"><i></i>Nixy · Where shall we start?</div>
    <h2>What's the <em>challenge</em> you want solved?</h2>
    <p class="lead">Pick the closest one and I'll take you straight to the people who fix it. Or let me show you everything, or wander on your own.</p>
    <div class="chal">${cards}</div>
    <div class="acts"><button class="cta" type="button" data-v="tour" data-default>Show me everything ▸</button><button class="cta alt" type="button" data-v="explore">I'll explore on my own</button></div>`,
    { label: 'Choose your challenge', mount: (el, done) => { const off = on('num', n => { const c = CHALLENGES[n - 1]; if (c) { off(); done(c.id); } }); } });
}

// ---------------- a service at a glance ----------------
export function briefPanel(id, { first = true } = {}) {
  const s = SERVICES[id];
  const proofs = s.proof.map(p => `<div><div class="n">${esc(p.n)}</div><p>${esc(p.t)}</p></div>`).join('');
  return panel(`<div class="kick"><i></i>${esc(s.kicker)}</div>
    <h2>${esc(s.name)}</h2>
    <p class="lead">${esc(s.line)}</p>
    <div class="brief"><div><h5>Who it's for</h5><p>${esc(s.for)}</p></div><div><h5>What we do</h5><p>${esc(s.what)}</p></div><div><h5>What you get</h5><p>${esc(s.get)}</p></div><div><h5>How it starts</h5><p>${esc(s.time)}</p></div></div>
    <div class="proofs">${proofs}</div>
    <div class="acts"><button class="cta" type="button" data-v="demo" data-default>${esc(s.demo)} ▸</button><button class="cta alt" type="button" data-v="story">Hear from ${esc(s.story.who)}</button><button class="cta alt" type="button" data-v="book">Book a call with Yasin and Nixy</button></div>`,
    { color: s.color, label: s.name });
}

// ---------------- before and after, told by someone who was there ----------------
export function storyPanel(id) {
  const s = SERVICES[id], st = s.story;
  return panel(`<div class="kick"><i></i>Before and after · ${esc(s.name)}</div>
    <h2>${esc(st.who)}'s <em>story</em></h2>
    <div class="ba"><div class="bef"><h5>Before</h5><q>${esc(st.before)}</q><ul>${st.bl.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
      <div class="arr">→</div>
      <div class="aft"><h5>After ${esc(s.name)}</h5><q>${esc(st.after)}</q><ul>${st.al.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div></div>
    <div class="who"><span class="av"></span><div><b>${esc(st.who)}</b><span>${esc(st.role)} · a Technicity resident</span></div></div>
    <div class="acts"><button class="cta" type="button" data-v="demo" data-default>${esc(s.demo)} ▸</button><button class="cta alt" type="button" data-v="book">Book a call with Yasin and Nixy</button></div>`,
    { color: s.color, label: st.who + "'s story", mount: el => el.querySelector('.av').replaceWith(avatarCanvas(st.look)) });
}

// ---------------- everything Potara does, on one screen ----------------
export function servicesPanel(visited = new Set()) {
  const cards = ORDER.map(id => { const s = SERVICES[id]; return `<div class="svc${visited.has(id) ? ' seen' : ''}" style="--c:${s.color}"><span class="k">${esc(s.kicker)}</span><h4>${esc(s.name)}</h4><p>${esc(s.line)}</p><ul><li>${esc(s.get)}</li></ul><button class="go" type="button" data-v="go:${id}">Take me there ▸</button></div>`; }).join('');
  const proof = PROOF.map(p => `<div><div class="n">${esc(p.n)}</div><p>${esc(p.t)}</p></div>`).join('');
  return panel(`<div class="kick"><i></i>Potara · Future workplace consultancy</div>
    <h2>Six ways in. <em>One team</em> behind all of them.</h2>
    <p class="lead">From the first curious question to a platform that's already live. Here's everything at a glance.</p>
    <div class="svcgrid">${cards}</div>
    <div class="proofs">${proof}</div>
    <p class="note">Enterprise and public sector work for the European Central Bank, NatWest and BT. PGCE with QTS.</p>
    <div class="acts"><button class="cta" type="button" data-v="book" data-default>Book a call with Yasin and Nixy</button><button class="cta alt" type="button" data-v="__close">Back to the city</button></div>`,
    { label: 'Services' });
}

// ---------------- the booking card ----------------
export function bookPanel(context = '') {
  const subject = encodeURIComponent('A call with Yasin and Nixy' + (context ? ` (${context})` : ''));
  const href = CONFIG.BOOKING_URL.startsWith('mailto:') ? `mailto:${CONFIG.CONTACT_EMAIL}?subject=${subject}` : CONFIG.BOOKING_URL;
  return panel(`<div class="kick"><i></i>Start with a conversation</div>
    <h2>A call with <em>Yasin and Nixy</em>.</h2>
    <p class="lead">Thirty minutes. No charge. No deck. Tell us what's actually broken; we'll say honestly whether we're the right people to fix it, and what it would cost.</p>
    <div class="brief" style="grid-template-columns:repeat(3,minmax(0,1fr))"><div><h5>Where</h5><p>Manchester and the North West in person. Nationally online.</p></div><div><h5>Who</h5><p>Yasin, Potara's founder. Nixy takes the notes and sends the follow-up.</p></div><div><h5>Email</h5><p class="sel">${esc(CONFIG.CONTACT_EMAIL)}</p></div></div>
    <div class="acts"><a class="cta" href="${href}" target="_blank" rel="noopener" data-default>Book a call ▸</a><button class="cta alt" type="button" data-v="copy">Copy the email address</button><button class="lnk" type="button" data-v="__close">Not yet</button></div>`,
    { label: 'Book a call', mount: (el, done) => {
      el.querySelector('[data-v=copy]').addEventListener('click', e => { e.stopPropagation(); try { navigator.clipboard.writeText(CONFIG.CONTACT_EMAIL); e.target.textContent = 'Copied ✓'; } catch (x) { e.target.textContent = CONFIG.CONTACT_EMAIL; } }, true);
      el.querySelector('a.cta').addEventListener('click', () => setTimeout(() => done('booked'), 200));
    } });
}

// ---------------- Training Studio: Rosenshine's ten, as flip cards ----------------
export function rosenPanel() {
  const cards = ROSENSHINE.map(([t, w], i) => `<button class="flip" type="button" aria-label="${esc(t)}"><div class="f"><span class="n">${i + 1}</span><b>${esc(t)}</b><span class="hint">Tap to flip</span></div><div class="b"><span>In your training</span><p>${esc(w)}</p></div></button>`).join('');
  return panel(`<div class="kick"><i></i>Training Studio · The method</div>
    <h2>Rosenshine's <em>ten principles</em>, at work.</h2>
    <p class="lead">Barak Rosenshine studied what the most effective teachers do. We build every training video and workshop on the same ten ideas. Flip any card to see how it shows up in your training.</p>
    <div class="flipgrid">${cards}</div>
    <div class="acts"><button class="cta" type="button" data-v="flipall" data-default>Flip them all</button><button class="cta alt" type="button" data-v="book">Book a call with Yasin and Nixy</button></div>`,
    { color: SERVICES.training.color, label: "Rosenshine's principles", mount: el => {
      el.querySelectorAll('.flip').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); b.classList.toggle('on'); }));
      el.querySelector('[data-v=flipall]').addEventListener('click', e => { e.stopPropagation(); el.querySelectorAll('.flip').forEach((b, i) => setTimeout(() => b.classList.add('on'), i * 70)); e.target.textContent = 'Done ✓'; delete e.target.dataset.default; }, true);
    } });
}

// ---------------- SI Academy: where agents slot into your role ----------------
const FLOWS = {
  sales: ['A lead arrives', 'Agent researches the account and drafts a reply', 'You edit and approve', 'CRM updated, follow-up booked', 'Monday pipeline summary, written for you'],
  marketing: ['A brief lands', 'Agent drafts variants in your brand voice', 'You pick and polish', 'Published on schedule', 'Weekly performance digest'],
  technical: ['A ticket comes in', 'Agent triages, finds similar fixes, proposes one', 'Engineer reviews and approves', 'Change shipped and documented', 'Trends spotted before they become incidents'],
  operations: ['Month-end data drop', 'Agent reconciles across systems', 'Your lead checks and signs', 'Ledger and dashboards updated', 'Exceptions report, nothing else'],
};
function flowSvg(steps, c) {
  const n = steps.length, w = 1000, h = 250, bw = 168, gap = (w - n * bw) / (n - 1);
  let out = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(steps.join(', then '))}"><defs><linearGradient id="ag" x1="0" x2="1"><stop offset="0" stop-color="${c}" stop-opacity=".25"/><stop offset="1" stop-color="${c}" stop-opacity=".05"/></linearGradient></defs>`;
  steps.forEach((s, i) => {
    const x = i * (bw + gap), human = /You|Engineer|lead checks/.test(s), agent = /Agent/.test(s);
    out += `<g style="animation: avin .5s ${i * .12}s both"><rect x="${x}" y="60" width="${bw}" height="130" rx="18" fill="${agent ? 'url(#ag)' : 'rgba(255,255,255,.04)'}" stroke="${agent ? c : human ? '#ffd60a' : 'rgba(255,255,255,.25)'}" stroke-width="2"/>
      <text x="${x + 16}" y="92" font-family="DM Mono, monospace" font-size="15" letter-spacing="2" fill="${agent ? c : human ? '#ffd60a' : '#a29fb8'}">${agent ? 'AGENT' : human ? 'HUMAN' : 'SYSTEM'}</text>
      <foreignObject x="${x + 12}" y="100" width="${bw - 24}" height="86"><div xmlns="http://www.w3.org/1999/xhtml" style="font:600 20px/1.25 'Instrument Sans',sans-serif;color:#f2eee2">${esc(s)}</div></foreignObject></g>`;
    if (i < n - 1) out += `<path d="M${x + bw + 6} 125 H${x + bw + gap - 6}" stroke="${c}" stroke-width="3" stroke-dasharray="6 7"><animate attributeName="stroke-dashoffset" from="26" to="0" dur="1s" repeatCount="indefinite"/></path><path d="M${x + bw + gap - 14} 117 L${x + bw + gap - 4} 125 L${x + bw + gap - 14} 133" fill="none" stroke="${c}" stroke-width="3"/>`;
  });
  return out + `<text x="0" y="232" font-family="DM Mono, monospace" font-size="14" fill="#a29fb8">Gold = a person decides. Every agent step is logged in your own tenant.</text></svg>`;
}
export function siPanel(start = 'sales') {
  const c = SERVICES.si.color;
  return panel(`<div class="kick"><i></i>SI Academy · Use-case engineering</div>
    <h2>Where agents slot into <em>your</em> week.</h2>
    <p class="lead">Synthetic Intelligence does the drafting and the drudge; your people make the calls. Pick a role to see a typical workflow we'd pilot. Illustrative, and every one is built on tools you already license.</p>
    <div class="tabs">${Object.keys(FLOWS).map(k => `<button type="button" data-role="${k}" class="${k === start ? 'on' : ''}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
    <div class="pipe">${flowSvg(FLOWS[start], c)}</div>
    <div class="steps3"><div><b>1 · Analyse</b><p>We sit with the team and map the real workflow, not the org chart version.</p></div><div><b>2 · Pilot</b><p>An agent in your tenant, on one workflow, with real users, in weeks.</p></div><div><b>3 · Iterate</b><p>Measure, tune, train people, then decide what to scale.</p></div></div>
    <div class="acts"><button class="cta" type="button" data-v="book" data-default>Book a call with Yasin and Nixy</button><button class="cta alt" type="button" data-v="story">Hear from ${esc(SERVICES.si.story.who)}</button></div>`,
    { color: c, label: 'SI workflows', mount: el => el.querySelectorAll('[data-role]').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation(); el.querySelectorAll('[data-role]').forEach(x => x.classList.toggle('on', x === b)); el.querySelector('.pipe').innerHTML = flowSvg(FLOWS[b.dataset.role], c); audio.sfx('select');
    })) });
}

// ---------------- Schoolhouse: the sequence that moved the grades ----------------
export function schoolPanel() {
  const c = SERVICES.school.color;
  const chart = `<svg viewBox="0 0 1000 300" role="img" aria-label="End-of-lesson attainment rose from 78 percent to 93 percent across a four-lesson sequence">
    <line x1="80" y1="250" x2="960" y2="250" stroke="rgba(255,255,255,.2)"/>
    ${[60, 70, 80, 90, 100].map(v => `<g><line x1="80" x2="960" y1="${250 - (v - 50) * 4.4}" y2="${250 - (v - 50) * 4.4}" stroke="rgba(255,255,255,.06)"/><text x="64" y="${255 - (v - 50) * 4.4}" text-anchor="end" font-family="DM Mono, monospace" font-size="14" fill="#a29fb8">${v}%</text></g>`).join('')}
    <rect x="200" y="${250 - 28 * 4.4}" width="170" height="${28 * 4.4}" rx="10" fill="rgba(255,255,255,.12)" style="animation: avin .6s both"/>
    <rect x="640" y="${250 - 43 * 4.4}" width="170" height="${43 * 4.4}" rx="10" fill="${c}" style="animation: avin .6s .25s both"/>
    <text x="285" y="${238 - 28 * 4.4}" text-anchor="middle" font-family="Syne, sans-serif" font-weight="800" font-size="44" fill="#fff">78%</text>
    <text x="725" y="${238 - 43 * 4.4}" text-anchor="middle" font-family="Syne, sans-serif" font-weight="800" font-size="44" fill="#fff">93%</text>
    <text x="285" y="280" text-anchor="middle" font-family="DM Mono, monospace" font-size="15" fill="#a29fb8">LESSON 1</text><text x="725" y="280" text-anchor="middle" font-family="DM Mono, monospace" font-size="15" fill="#a29fb8">LESSON 4</text>
    <path d="M390 150 C 470 120, 540 100, 620 92" stroke="#ffd60a" stroke-width="3" fill="none" stroke-dasharray="8 8"><animate attributeName="stroke-dashoffset" from="32" to="0" dur="1.2s" repeatCount="indefinite"/></path>
    <text x="400" y="70" font-family="DM Mono, monospace" font-size="16" fill="#ffd60a">each lesson planned from the last one's exit tickets</text></svg>`;
  return panel(`<div class="kick"><i></i>Schoolhouse · Potara Learning and Systems</div>
    <h2>Interventions that <em>move grades</em>, and prove it.</h2>
    <p class="lead">End-of-lesson attainment across a four-lesson maths sequence in a Salford secondary. Same teacher, same pupils, a better-designed sequence.</p>
    <div class="chart">${chart}</div>
    <div class="steps3"><div><b>Diagnose</b><p>A baseline mapped to your scheme of work and exam board, not a generic screener.</p></div><div><b>Sequence</b><p>Small groups, qualified teachers, each session planned from the last one's data.</p></div><div><b>Evidence</b><p>One page per block: baseline, endpoint, objectives secured, pupils to watch.</p></div></div>
    <div class="pills"><span>Foundations · KS3, 12 weeks</span><span>Grade Line · GCSE 3/4 boundary</span><span>Second Sitting · post-16 resits</span><span>AI Estate Audit · DfE standards, 2 to 3 weeks</span></div>
    <div class="acts"><button class="cta" type="button" data-v="book" data-default>Book a call with Yasin and Nixy</button><button class="cta alt" type="button" data-v="story">Hear from ${esc(SERVICES.school.story.who)}</button></div>`,
    { color: c, label: 'Schoolhouse results' });
}
