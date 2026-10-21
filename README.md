# Potara website

The Potara homepage with **Nixy's World** (the Pokémon-style journey) built into it. Plain HTML, CSS and JavaScript: no build step, no server, nothing to install. It works on free GitHub Pages hosting.

```
index.html      The homepage. Scroll-driven story, Nixy's cameos, and the "Press start" section for the game
config.js       Your settings (form address, email, booking link). The only file you must edit
play/           Nixy's World, the game. Also works on its own at yoursite/play/
img/ video/     Homepage images and videos
.nojekyll       Tells GitHub Pages to serve the files exactly as they are
```

**How they fit together.** The homepage has a "Don't read about it. Walk through it." section right after the hero. It shows a start screen; the game only loads when a visitor presses start, so the page stays quick. The game can run inline, expand to fill the screen, or open in its own tab. The nav link, the hero button and Nixy's cameo all open it full screen. If the visitor picks "classic site" inside the game, it closes and the homepage scrolls on.

---

## 1. Before you publish (10 minutes)

1. **Open `config.js`** in any text editor and fill in:
   - `FORM_ENDPOINT`: create a free form at [formspree.io](https://formspree.io) or [web3forms.com](https://web3forms.com) and paste its URL. Until you do, forms run in demo mode: they look like they work, but nothing is sent to you.
   - `FORM_ACCESS_KEY`: Web3Forms only. Formspree needs nothing here.
   - `CONTACT_EMAIL` and `BOOKING_URL`: check they are right. `BOOKING_URL` can be a Calendly or Cal.com link.
   - `PRIVACY_URL`: Nixy asks for email addresses, so you need a privacy policy. Point this at it.
2. **Read the draft lines.** Dialogue in `play/data/script.js` marked `// DRAFT` still needs your sign-off, as do the lines in `play/data/lore.js` and `play/data/services.js`.
3. **Test it on your computer** (see below).

## 2. Test it on your computer

Opening `index.html` by double-clicking will **not** work properly: browsers block the game's code when a page is opened straight from a file. Use a tiny local server instead.

- **Python** (Mac and most Linux have it): open a terminal in this folder and run `python3 -m http.server 8000`, then visit <http://localhost:8000>
- **VS Code:** install the "Live Server" extension, right-click `index.html`, choose "Open with Live Server".

Stop the server with `Ctrl+C`.

## 3. Put it on GitHub

You need a free account at [github.com](https://github.com). Pick **one** of these.

### Option A: GitHub Desktop (no command line, easiest)

1. Install [GitHub Desktop](https://desktop.github.com) and sign in.
2. **File → Add local repository…**, choose this folder. When it says "this directory does not appear to be a Git repository", click **create a repository**.
3. Name it (for example `potara-site`), leave everything else, click **Create repository**.
4. Click **Commit to main** (put "First version" in the summary box).
5. Click **Publish repository**. Untick "Keep this code private" if you want to use free GitHub Pages (see the note below), then **Publish**.

### Option B: command line

First create an empty repository on github.com: click **+ → New repository**, name it `potara-site`, **do not** tick "Add a README", click **Create repository**. Then, in a terminal inside this folder (replace `YOUR-USERNAME`):

```bash
git init
git add .
git commit -m "First version of the Potara site"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/potara-site.git
git push -u origin main
```

If you use the GitHub CLI you can do it in one go: `gh repo create potara-site --public --source=. --push`

### Option C: upload in the browser (works, but fiddly)

GitHub's web uploader accepts about 100 files at a time and this site has about 125, so upload in two batches: first `index.html`, `config.js`, `.nojekyll`, `img` and `video`; then the `play` folder. On your repository page choose **Add file → Upload files**, drag them in, click **Commit changes**. Options A or B are easier.

> **Public or private?** Free accounts can only use GitHub Pages on **public** repositories. Private repositories need a paid plan. Nothing secret lives in this site (the form address in `config.js` is meant to be public), but never put passwords or private keys in it.

## 4. Turn the site on (GitHub Pages)

1. On your repository page: **Settings → Pages** (left sidebar).
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
3. Set the branch to **main** and the folder to **/ (root)**, then **Save**.
4. Wait one to two minutes and refresh. A banner shows your address:
   `https://YOUR-USERNAME.github.io/potara-site/`

Open it and check: the homepage loads, press **Press start** in the game section, and play a few steps. If you called the repository `YOUR-USERNAME.github.io`, the site is served at `https://YOUR-USERNAME.github.io/` with no subfolder. Everything works either way, because all links are relative.

### Using your own domain (optional)

In **Settings → Pages → Custom domain**, enter your domain (for example `potara.co.uk`) and follow the DNS instructions GitHub shows, then tick **Enforce HTTPS**. GitHub's guide: search "GitHub Pages custom domain".

## 5. Updating the site later

- **GitHub Desktop:** change files, write a summary, **Commit to main**, then **Push origin**.
- **Command line:** `git add .`, then `git commit -m "What changed"`, then `git push`.

The live site refreshes about a minute after each push. If you still see the old version, hard-refresh (`Ctrl+Shift+R`, or `Cmd+Shift+R` on a Mac).

## Troubleshooting

| Problem | Fix |
| --- | --- |
| The game area is blank or says Nixy tripped over a cable | You opened the files straight from your computer. Use a local server (section 2), or test on the live GitHub address. |
| Page shows "404" on GitHub | Pages isn't on yet, or the branch/folder is wrong (section 4). The first deploy takes a couple of minutes. |
| Form says it sent but nothing arrives | `FORM_ENDPOINT` in `config.js` is still empty (demo mode), or you haven't confirmed your Formspree/Web3Forms email. |
| Old version still showing | Hard-refresh, and wait a minute after pushing. |
| Fonts look plain | Fonts load from Google Fonts, so the visitor needs an internet connection. |

## Good to know

- The game remembers progress in the visitor's browser (so "Continue where you left off" works). It stores nothing on any server.
- The homepage and the game each carry their own copy of a few images and videos. That is deliberate: it keeps `play/` self-contained so it also works on its own.
- GitHub Pages is a fine home for this. If you ever need a server-side feature (accounts, a database), the forms services above cover the common case without one.
