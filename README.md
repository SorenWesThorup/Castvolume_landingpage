# CastVolume Landing Page

Static landing page for CastVolume, ready to deploy to Simply.com web hosting.

## Project structure

- `index.html`
- `styles.css`
- `script.js`
- `assets/`
- `.github/workflows/deploy-simply.yml` (auto deploy on push to `main`)

## Run locally

```bash
cd /Users/sorenthorup/Documents/xcode/CastVolume_Feb2026/landing-page
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Create GitHub repository

1. Create a new empty GitHub repository (for example: `castvolume-landing-page`).
2. Run:

```bash
cd /Users/sorenthorup/Documents/xcode/CastVolume_Feb2026/landing-page
git init
git add .
git commit -m "Initial CastVolume landing page"
git branch -M main
git remote add origin <YOUR_GITHUB_REPO_URL>
git push -u origin main
```

## Connect GitHub to Simply.com

1. In Simply.com, locate your FTP credentials:
- FTP host/server
- FTP username
- FTP password
2. Confirm your website files should be deployed to `/public_html/`.
3. In GitHub repo settings, add these Actions secrets:
- `SIMPLY_FTP_HOST`
- `SIMPLY_FTP_USERNAME`
- `SIMPLY_FTP_PASSWORD`
 - `SIMPLY_CASTVOLUME_REMOTE_DIR` (must be the CastVolume subdomain folder, not `/public_html/`)
4. Push to `main` (or run the workflow manually from Actions).

The workflow uploads this repo only to `SIMPLY_CASTVOLUME_REMOTE_DIR` using FTP Deploy Action.

## TLS and security checklist

If the browser shows `Not Secure` on your domain, verify all of this in Simply:

1. Domain mapping:
- `castvolume.kommaconsulting.com`
- `www.castvolume.kommaconsulting.com`
2. SSL certificate is issued and active for both hostnames (Let's Encrypt or purchased cert).
3. DNS for both hostnames points to your webhotel.
4. Keep `.htaccess` deployed (this repo includes HTTPS redirect + security headers).

## Notes

- This repo is intentionally locked to the CastVolume subdomain path and will fail if `SIMPLY_CASTVOLUME_REMOTE_DIR` is missing.
- If you want encrypted transfer, switch `protocol` and `port` to the values provided by Simply.com.
