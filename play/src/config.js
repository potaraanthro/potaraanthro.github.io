// Settings live in ../config.js (one file for the whole site). This module reads them,
// and falls back to safe defaults if the game is ever hosted on its own.
const O = (typeof window !== 'undefined' && window.POTARA_CONFIG) || {};
const pick = (k, d) => (O[k] !== undefined && O[k] !== '' ? O[k] : d);

// True when the game is running inside the homepage (an iframe).
const EMBEDDED = (() => { try { return window.parent !== window; } catch (e) { return true; } })();

export const CONFIG = {
  FORM_ENDPOINT: pick('FORM_ENDPOINT', ''),
  FORM_ACCESS_KEY: pick('FORM_ACCESS_KEY', ''),
  BOOKING_URL: pick('BOOKING_URL', 'mailto:hello@potara.co.uk?subject=A%20call%20with%20Yasin%20and%20Nixy'),
  CONTACT_EMAIL: pick('CONTACT_EMAIL', 'hello@potara.co.uk'),
  PRIVACY_URL: pick('PRIVACY_URL', '#privacy'),
  ANALYTICS_ENDPOINT: pick('ANALYTICS_ENDPOINT', ''),
  // The game lives at /play/, so the homepage is one level up.
  TRADITIONAL_URL: '../index.html',
  EMBEDDED,
};

// Inside the homepage, "traditional site" must not load the homepage inside the game.
// Tell the page around us to close the game and carry on scrolling instead.
export function leaveWorld() {
  try { window.parent.postMessage({ source: 'nixy-world', type: 'leave' }, '*'); } catch (e) { /* nothing to tell */ }
}
if (EMBEDDED) {
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a[href]');
    if (a && a.getAttribute('href') === CONFIG.TRADITIONAL_URL) { e.preventDefault(); leaveWorld(); }
  }, true);
}
