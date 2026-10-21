/* ------------------------------------------------------------------
   POTARA SITE SETTINGS
   This is the only file you need to edit before launch. Both the
   homepage (index.html) and Nixy's World (play/) read it.
   Leave a value empty to keep the safe default.
------------------------------------------------------------------- */
window.POTARA_CONFIG = {
  // Where lead forms are sent. Create a free form at formspree.io or web3forms.com
  // and paste its URL here. Empty = demo mode: the forms work but nothing is sent.
  FORM_ENDPOINT: '',

  // Web3Forms only: your public access key. Formspree needs nothing here.
  FORM_ACCESS_KEY: '',

  // The address shown on the site and used for fallbacks if a form fails.
  CONTACT_EMAIL: 'hello@potara.co.uk',

  // The "Book a call" button. A mailto: link works, or paste a calendar link
  // (Calendly, Cal.com, Google Calendar booking page).
  BOOKING_URL: 'mailto:hello@potara.co.uk?subject=A%20call%20with%20Yasin%20and%20Nixy',

  // Link to your privacy policy. You collect email addresses, so you need one.
  PRIVACY_URL: '#privacy',

  // Optional: a URL that accepts anonymous event pings (journey steps). Empty = off.
  ANALYTICS_ENDPOINT: ''
};
