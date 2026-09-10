# Potara — website

Static site. No build step, no dependencies. Three files and two images.

```
index.html
assets/room.mp4
assets/room-poster.jpg
assets/headshot.jpg
README.md
```

## Publishing on GitHub Pages

1. Create a repository. If you name it `yourusername.github.io` the site lives at
   `https://yourusername.github.io`. Any other name puts it at
   `https://yourusername.github.io/repo-name`.
2. Upload every file above, keeping `assets/` as a folder. Drag and drop into the
   GitHub web uploader works fine — no git required.
3. Repository **Settings → Pages → Source: Deploy from a branch → main → / (root)** → Save.
4. Wait a minute or two, then load the URL.

## Custom domain

Buy the domain, then in **Settings → Pages → Custom domain** enter it and save.
At your registrar add these DNS records:

| Type | Name | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | yourusername.github.io |

Tick **Enforce HTTPS** once the certificate has issued (can take up to an hour).

## Editing

Everything is in `index.html` — markup, CSS and the page-switching script.

- **Colours** — the `:root` block at the top of the `<style>` tag.
- **Pages** — four `<main>` blocks: `page-home`, `page-infra`, `page-digital`, `page-about`.
  Navigation swaps which one has the `on` class.
- **Replacing the headshot** — overwrite `assets/headshot.jpg`. Any 4:5 portrait works;
  it is converted to black and white by CSS, so upload the colour original.
- **Replacing the video** — overwrite `assets/room.mp4` and `assets/room-poster.jpg`.

## Notes

Repository size limit is 1 GB and single files must be under 100 MB, so the 2.3 MB
video is comfortable. If you later add several videos, host them on Vimeo or
Cloudflare Stream rather than committing them.
