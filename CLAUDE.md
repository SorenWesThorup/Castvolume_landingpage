# CastVolume Landing Page

Static marketing site for CastVolume, an iOS app for volume control on Google
Cast devices. Served from `castvolume.kommaconsulting.com` on Simply.com shared
hosting.

## Shape of the project

No build step, no framework, no package manager. Five things ship:

| File | Role |
|---|---|
| `index.html` | The entire page — single file, all sections |
| `styles.css` | All styling |
| `script.js` | Footer year + `IntersectionObserver` reveal animations |
| `assets/` | App icon and screenshots |
| `.htaccess` | HTTPS redirect, security headers, directory listing off |

Do not introduce a bundler, framework, or dependency manifest without being
asked. The deploy assumes these files are directly servable.

## Working locally

```bash
python3 -m http.server 8080   # from the repo root, then open http://localhost:8080
```

Open the file over `http://`, not `file://` — the CSP and the relative asset
paths do not behave the same way on `file://`.

## Checks

```bash
.claude/scripts/check.sh
```

Dependency-free, runs in about a second. Catches the mistakes that this deploy
model turns into a broken production page: an asset path that resolves to
nothing, an in-page `#anchor` with no matching `id`, a truncated stylesheet, a
missing `.htaccess`, and CSP drift between `index.html` and `.htaccess`.

There is no unit test suite — there is no application logic to test. Verify
visual changes by loading the local preview.

## Deploying

Push to `main`. `.github/workflows/deploy-simply.yml` FTPs the repo to
Simply.com. No manual step.

Two things about that workflow are easy to get wrong:

- **It uploads the working tree verbatim** (`local-dir: ./`), minus the
  `exclude:` list. Anything new at the repo root ships to the live web server
  unless it is excluded. `.git*`, `.github/`, `.claude/`, `CLAUDE.md`,
  `README.md`, and `node_modules/` are already excluded — extend that list when
  you add tooling.
- **`SIMPLY_CASTVOLUME_REMOTE_DIR` must point at the CastVolume subdomain
  folder**, not `/public_html/`. The workflow hard-fails if it is unset, which
  is deliberate: pointing it at `/public_html/` would overwrite the parent site.

FTP credentials live in GitHub Actions secrets (`SIMPLY_FTP_HOST`,
`SIMPLY_FTP_USERNAME`, `SIMPLY_FTP_PASSWORD`). Transfer is plain FTP on port 21.

## Gotchas

- **The CSP is declared twice** — a `<meta http-equiv>` in `index.html` and a
  real header in `.htaccess`. They must stay identical; `check.sh` enforces it.
  It is strict (`'self'` plus Google Fonts), so any new third-party script,
  style, image, or XHR endpoint is blocked until you add it in *both* places.
- **Assets are cache-busted by query string** (`?v=20260315c`). FTP overwrites
  the file but browsers and the host's cache will serve the old bytes. Bump the
  `v=` value in every reference when you replace an image.
- **`.htaccess` must keep deploying.** It carries the HTTPS redirect and every
  security header. Losing it silently downgrades the site to plain HTTP.
- **Some assets are unreferenced**: `assets/widget.png` and
  `assets/screenshots/*.jpg` are not used by `index.html`. They still get
  uploaded. Leave them unless asked to clean up.
- **`README.md` contains stale absolute paths** from the original local machine
  (`/Users/sorenthorup/...`). Ignore those; use the commands in this file.

## Remote sessions

`.claude/hooks/session-start.sh` runs at session start in Claude Code on the web
(it no-ops locally). This repo has nothing to install, so the hook only verifies
`node` and `python3` and exports session settings — it is the template the other
projects' hooks are based on, with the dependency-install step commented out.

Containers are ephemeral. Commit and push anything worth keeping.
