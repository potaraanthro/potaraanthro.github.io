/* 02 Software: one expense claim travels from Sam's phone to Alex's laptop and back.
   "Watch it" drives a ghost finger and cursor through the flow; "Try it yourself"
   hands over the controls and only nudges when the learner taps the wrong place. */
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function init(root) {
  const stage = $('#devStage', root), wrap = $('#devWrap', root);
  const phone = $('#phone', root), laptop = $('#laptop', root);
  const pScreen = $('#pScreen', root), lScreen = $('#lScreen', root);
  const coach = { phone: coachFor(pScreen, '.finger'), laptop: coachFor(lScreen, '.cursor') };
  const capN = $('#softN', root), capT = $('#softT', root), capD = $('#softD', root), capBox = capT.parentElement;
  const playBtn = $('#softPlay', root), dotsEl = $('#softDots', root);
  const el = id => $('#' + id, root);

  const showPhone = name => $$('.ps', pScreen).forEach(s => { const on = s.dataset.ps === name; s.classList.toggle('out', s.classList.contains('on') && !on); s.classList.toggle('on', on); });

  async function typeFields(tk) {
    for (const b of $$('.fld b', pScreen)) {
      const text = b.dataset.type; b.classList.add('typing');
      for (let i = 1; i <= text.length; i++) { b.textContent = text.slice(0, i); if (!(await wait(reduced ? 0 : 45, tk))) return; }
      b.classList.remove('typing'); b.parentElement.classList.add('filled');
      if (!(await wait(160, tk))) return;
    }
  }

  const STEPS = [
    { dev: 'phone', target: 'pNew', t: 'Start a claim', d: 'Sam had lunch with a client and wants the money back. It starts with one tap.', tip: 'Tap “New claim”',
      act: () => showPhone('camera') },
    { dev: 'phone', target: 'pShutter', t: 'Snap the receipt', d: 'Line the receipt up inside the frame and take the photo. No typing, no scanning later.', tip: 'Take the photo',
      act: async tk => { $('.flash', pScreen).classList.add('on'); await wait(380, tk); showPhone('review'); await wait(450, tk); await typeFields(tk); } },
    { dev: 'phone', target: 'pCatMeals', t: 'Check what it read', d: 'The app reads the merchant, date and amount for you. Sam checks them, then picks a category.', tip: 'Choose “Meals”',
      act: () => { el('pCatMeals').classList.add('on'); el('pSubmit').disabled = false; } },
    { dev: 'phone', target: 'pSubmit', t: 'Send it', d: 'One tap sends the claim, receipt attached, to Sam’s manager.', tip: 'Submit the claim',
      act: async tk => {
        showPhone('sent'); await wait(1300, tk);
        el('lToast').classList.add('on'); el('lBadge').textContent = '1'; el('lBadge').classList.add('on');
        el('lWaiting').textContent = '1'; el('lRow').classList.add('on');
      } },
    { dev: 'laptop', target: 'lToast', t: 'Alex gets a nudge', d: 'On Alex’s laptop a notification lands. Alex opens it straight from there.', tip: 'Open the notification',
      act: () => { el('lToast').classList.remove('on'); el('lRow').classList.add('sel'); el('lPanel').classList.add('on'); } },
    { dev: 'laptop', target: 'lApprove', t: 'Review and approve', d: 'Receipt, amount and the policy check sit side by side. Alex approves in one click.', tip: 'Approve the claim',
      act: async tk => {
        const s = el('lRowStatus'); s.textContent = 'Approved'; s.className = 'st ok pop';
        el('lApprove').textContent = 'Approved ✓'; el('lApprove').classList.add('done');
        el('lBadge').classList.remove('on'); el('lWaiting').textContent = '0'; el('lApprovedCount').textContent = '15';
        await wait(1000, tk); el('lPanel').classList.remove('on');
        showPhone('home'); el('pNewItem').classList.add('on'); await wait(500, tk); el('pPush').classList.add('on');
      } },
    { dev: 'phone', target: 'pPush', t: 'Loop closed', d: 'Sam’s phone buzzes: approved. Seven steps, two devices, no paperwork.', tip: 'Open the notification',
      act: () => { el('pPush').classList.remove('on'); const s = el('pNewStatus'); s.textContent = 'Approved'; s.className = 'ok'; el('pMonth').textContent = '£267.00'; } },
  ];

  dotsEl.innerHTML = STEPS.map(() => '<li></li>').join('');
  const dots = [...dotsEl.children];

  function reset() {
    showPhone('home');
    $$('.ps', pScreen).forEach(s => s.classList.remove('out'));
    $('.flash', pScreen).classList.remove('on');
    $$('.fld b', pScreen).forEach(b => { b.textContent = ''; b.classList.remove('typing'); b.parentElement.classList.remove('filled'); });
    el('pCatMeals').classList.remove('on'); el('pSubmit').disabled = true;
    ['pPush', 'lToast', 'lPanel', 'lRow', 'pNewItem', 'lBadge'].forEach(id => el(id).classList.remove('on', 'sel'));
    el('lBadge').textContent = '0'; el('lWaiting').textContent = '0'; el('lApprovedCount').textContent = '14'; el('pMonth').textContent = '£248.60';
    const s = el('lRowStatus'); s.textContent = 'Waiting'; s.className = 'st wait';
    el('lApprove').textContent = 'Approve'; el('lApprove').classList.remove('done');
    const ps = el('pNewStatus'); ps.textContent = 'Pending'; ps.className = '';
    coach.phone.hide(); coach.laptop.hide();
    $('.try-done', wrap)?.remove();
  }

  function caption(i) {
    const s = STEPS[i];
    capN.textContent = `Step ${i + 1} of ${STEPS.length}`;
    capT.textContent = s.t; capD.textContent = s.d;
    capBox.classList.remove('swap'); void capBox.offsetWidth; capBox.classList.add('swap');
    dots.forEach((d, k) => { d.className = k < i ? 'done' : k === i ? 'on' : ''; });
    focusDevice(s.dev);
    root.dispatchEvent(new CustomEvent('progress', { bubbles: true, detail: { chapter: 'software', step: i + 1, of: STEPS.length } }));
  }

  /* ---------- modes ---------- */
  let mode = 'watch', token = 0, playing = !reduced, inView = false, running = false;
  const tkNow = () => token;
  function wait(ms, tk) { return new Promise(r => setTimeout(() => r(tk === undefined || tk === token), ms)); }

  async function watch() {
    if (running) return;
    running = true;
    const tk = ++token;
    reset();
    for (let i = 0; i < STEPS.length; i++) {
      const s = STEPS[i], c = coach[s.dev], target = el(s.target);
      caption(i);
      if (!(await wait(i ? 500 : 900, tk))) break;
      c.point(target, s.tip, false);
      if (!(await wait(reduced ? 300 : 1500, tk))) break;
      c.press(target);
      if (!(await wait(250, tk))) break;
      c.hide(true);
      await s.act(tk);
      if (tk !== token) break;
      if (!(await wait(1500, tk))) break;
      while (!playing || !inView) { if (!(await wait(300, tk))) break; }
      if (tk !== token) break;
    }
    if (tk === token) { dots.forEach(d => d.className = 'done'); await wait(3200, tk); }
    running = false;
    if (tk === token && mode === 'watch') { while (!playing || !inView) { if (!(await wait(300, tk))) return; } if (tk === token) watch(); }
  }

  let tryStep = 0, nudges = 0, busy = false;
  function startTry() {
    token++; running = false; reset();
    tryStep = 0; nudges = 0; busy = false;
    promptTry();
  }
  function promptTry() {
    const s = STEPS[tryStep];
    caption(tryStep);
    coach.phone.hide(); coach.laptop.hide();
    coach[s.dev].point(el(s.target), 'Your turn: ' + s.tip.charAt(0).toLowerCase() + s.tip.slice(1), true);
  }
  async function onTryClick(e) {
    if (mode !== 'try' || busy || tryStep >= STEPS.length) return;
    const s = STEPS[tryStep], target = el(s.target);
    const scr = e.currentTarget;
    if (scr !== (s.dev === 'phone' ? pScreen : lScreen)) { coach[s.dev].nudge(); nudges++; return; }
    if (!target.contains(e.target)) { coach[s.dev].nudge(); nudges++; return; }
    busy = true;
    const tk = token;
    coach[s.dev].ripple(target); coach[s.dev].hide(true);
    await s.act(tk);
    if (tk !== token) return;
    busy = false;
    tryStep++;
    if (tryStep < STEPS.length) { await wait(300, tk); if (tk === token) promptTry(); }
    else finishTry();
  }
  function finishTry() {
    dots.forEach(d => d.className = 'done');
    const box = document.createElement('div'); box.className = 'try-done';
    box.innerHTML = `<div><span class="mono" style="color:var(--mint)">Practice complete</span><b>7 of 7. Nicely done.</b><span>${nudges ? `${nudges} nudge${nudges > 1 ? 's' : ''} along the way. ` : 'Not a single nudge. '}That’s the whole claim, end to end, on two devices.</span><button class="btn btn-pearl btn-sm">Try again</button></div>`;
    box.querySelector('button').addEventListener('click', startTry);
    wrap.appendChild(box);
    root.dispatchEvent(new CustomEvent('progress', { bubbles: true, detail: { chapter: 'software', step: STEPS.length, of: STEPS.length } }));
  }
  [pScreen, lScreen].forEach(s => s.addEventListener('click', e => {
    if (mode === 'watch') { setMode('try'); return; } // clicking in watch mode hands over the controls
    onTryClick(e);
  }));
  // the real buttons should never submit anything
  $$('button', stage).forEach(b => b.setAttribute('type', 'button'));

  const segBtns = $$('[data-mode]', root);
  function setMode(m) {
    mode = m;
    segBtns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.mode === m)));
    playBtn.hidden = m === 'try';
    if (m === 'try') startTry(); else { token++; running = false; watch(); }
  }
  segBtns.forEach(b => b.addEventListener('click', () => setMode(b.dataset.mode)));
  playBtn.addEventListener('click', () => { playing = !playing; playBtn.textContent = playing ? '❚❚' : '▶'; playBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play'); });
  playBtn.textContent = playing ? '❚❚' : '▶';
  $('#softPrev', root).addEventListener('click', () => { if (mode === 'try') startTry(); else { token++; running = false; watch(); } });

  /* ---------- layout: both devices side by side, or one at a time on narrow screens ---------- */
  let solo = false, activeDev = 'phone';
  function focusDevice(dev) { activeDev = dev; layout(); }
  function layout() {
    const cs = getComputedStyle(wrap), W = wrap.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    solo = W < 760;
    stage.classList.toggle('solo', solo);
    phone.classList.toggle('dim', solo && activeDev !== 'phone');
    laptop.classList.toggle('dim', solo && activeDev !== 'laptop');
    const dev = activeDev === 'phone' ? phone : laptop;
    const w = solo ? dev.offsetWidth : 1040, h = solo ? dev.offsetHeight + 8 : 570;
    const k = Math.min(1, W / w);
    Object.assign(stage.style, { width: w + 'px', height: h + 'px', transform: `scale(${k})`, marginLeft: `${Math.max(0, (W - w * k) / 2)}px`, marginBottom: `${h * k - h}px` });
  }
  new ResizeObserver(layout).observe(wrap);
  layout();

  new IntersectionObserver(es => {
    inView = es[es.length - 1].isIntersecting;
    if (inView && mode === 'watch' && !running) watch();
  }, { threshold: 0.35 }).observe(wrap);

  return { setMode };
}

/* A ring, a tip and a pointer that live inside one device screen. Positions come from
   the layout (offsetLeft/Top), so they stay correct when the stage is scaled. */
function coachFor(screen, pointerSel) {
  const box = screen.querySelector('.coach'), ring = box.querySelector('.ring'), tip = box.querySelector('.tip'), ptr = box.querySelector(pointerSel);
  const isCursor = pointerSel === '.cursor';
  ptr.style.transform = `translate(${screen.clientWidth * 0.6}px,${screen.clientHeight * 0.7}px)`;
  function rect(el) {
    let x = 0, y = 0, e = el;
    while (e && e !== screen) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; }
    return { x, y, w: el.offsetWidth, h: el.offsetHeight };
  }
  return {
    point(el, text, tryMode) {
      const r = rect(el), pad = 6;
      Object.assign(ring.style, { left: r.x - pad + 'px', top: r.y - pad + 'px', width: r.w + pad * 2 + 'px', height: r.h + pad * 2 + 'px', borderRadius: Math.min(22, (r.h + pad * 2) / 2) + 'px' });
      ring.classList.add('on'); ring.classList.toggle('try', tryMode);
      tip.textContent = text;
      tip.classList.add('on');
      const tw = tip.offsetWidth, sw = screen.clientWidth;
      const below = r.y < screen.clientHeight * 0.45;
      tip.style.left = Math.max(8, Math.min(sw - tw - 8, r.x + r.w / 2 - tw / 2)) + 'px';
      tip.style.top = (below ? r.y + r.h + 14 : r.y - 44) + 'px';
      if (!tryMode) {
        ptr.classList.add('on');
        const px = r.x + r.w / 2 + (isCursor ? -4 : 0), py = r.y + r.h / 2 + (isCursor ? -2 : 0);
        ptr.style.transform = `translate(${px}px,${py}px)`;
      } else ptr.classList.remove('on');
    },
    press(el) { ptr.classList.remove('press'); void ptr.offsetWidth; ptr.classList.add('press'); this.ripple(el); },
    ripple(el) {
      const r = rect(el), d = document.createElement('i');
      d.className = 'ripple'; d.style.left = r.x + r.w / 2 + 'px'; d.style.top = r.y + r.h / 2 + 'px';
      box.appendChild(d); setTimeout(() => d.remove(), 700);
    },
    nudge() { tip.classList.remove('shake'); void tip.offsetWidth; tip.classList.add('shake'); },
    hide(keepPointer) { ring.classList.remove('on', 'try'); tip.classList.remove('on'); if (!keepPointer) ptr.classList.remove('on'); },
  };
}
