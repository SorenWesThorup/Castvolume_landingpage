// Static checks for the CastVolume landing page.
//
// Deliberately dependency-free: the repo ships no package.json and the deploy
// FTPs the working tree as-is, so these checks run on nothing but node's stdlib.
//
// Covers the failure modes that a verbatim-upload deploy turns into a broken
// production page:
//   1. a local src/href pointing at a file that is not in the repo
//   2. an in-page #anchor with no matching id
//   3. a truncated or unbalanced stylesheet
//   4. a missing .htaccess (carries the HTTPS redirect and security headers)

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root =
  process.env.CLAUDE_PROJECT_DIR ??
  join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const problems = [];
const note = (msg) => console.log(`    ${msg}`);

const html = readFileSync(join(root, "index.html"), "utf8");

// --- 1. Local asset references ----------------------------------------------
// Anything remote, inline, or protocol-relative is out of scope here.
const isExternal = (url) =>
  /^(https?:)?\/\//i.test(url) || /^(data|mailto|tel):/i.test(url);

const refs = [...html.matchAll(/\b(?:src|href)\s*=\s*"([^"]+)"/gi)]
  .map((m) => m[1].trim())
  .filter((url) => url && !url.startsWith("#") && !isExternal(url));

const seen = new Set();
let checked = 0;
for (const ref of refs) {
  // Strip the cache-busting query and any fragment before hitting the disk.
  const path = ref.split(/[?#]/)[0].replace(/^\.\//, "");
  if (!path || seen.has(path)) continue;
  seen.add(path);
  checked++;
  if (!existsSync(join(root, path))) {
    problems.push(`missing asset: ${path} (referenced as "${ref}")`);
  }
}
note(`ok: ${checked} local asset reference(s) resolve`);

// --- 2. In-page anchors ------------------------------------------------------
const ids = new Set(
  [...html.matchAll(/\bid\s*=\s*"([^"]+)"/gi)].map((m) => m[1].trim()),
);
const anchors = [...html.matchAll(/\bhref\s*=\s*"#([^"]+)"/gi)].map((m) =>
  m[1].trim(),
);
for (const anchor of new Set(anchors)) {
  if (!ids.has(anchor)) {
    problems.push(`anchor href="#${anchor}" has no matching id`);
  }
}
note(`ok: ${new Set(anchors).size} in-page anchor(s) resolve`);

// --- 3. Stylesheet integrity -------------------------------------------------
// A full CSS parse is overkill; unbalanced braces is the failure that actually
// happens (truncated write, botched merge) and it silently kills the styling.
const css = readFileSync(join(root, "styles.css"), "utf8").replace(
  /\/\*[\s\S]*?\*\//g,
  "",
);
const opens = (css.match(/{/g) ?? []).length;
const closes = (css.match(/}/g) ?? []).length;
if (opens !== closes) {
  problems.push(`styles.css unbalanced braces: ${opens} "{" vs ${closes} "}"`);
} else {
  note(`ok: styles.css braces balanced (${opens} blocks)`);
}

// Balance alone misses a truncation that happens to land just after a "}",
// which leaves a dangling selector at EOF. Every rule must be closed, so the
// last meaningful character is always "}".
const tail = css.trimEnd();
if (tail.length > 0 && !tail.endsWith("}")) {
  const dangling = tail.slice(tail.lastIndexOf("}") + 1).trim();
  problems.push(
    `styles.css ends mid-rule — trailing "${dangling.slice(0, 40)}" after the last "}"`,
  );
} else {
  note("ok: styles.css ends on a closed rule");
}

// --- 4. Deploy prerequisites -------------------------------------------------
const htaccessPath = join(root, ".htaccess");
if (!existsSync(htaccessPath)) {
  problems.push(".htaccess is missing (HTTPS redirect + security headers)");
} else {
  note("ok: .htaccess present");

  // The CSP is declared twice — a <meta> tag for local preview (where Apache
  // is not in play) and the real header in .htaccess. They have to agree, or
  // the page behaves differently in preview than in production.
  const squash = (s) => s.replace(/\s+/g, " ").trim();
  const metaCsp = html.match(
    /http-equiv\s*=\s*"Content-Security-Policy"[\s\S]*?content\s*=\s*"([^"]+)"/i,
  )?.[1];
  const headerCsp = readFileSync(htaccessPath, "utf8").match(
    /Header\s+always\s+set\s+Content-Security-Policy\s+"([^"]+)"/i,
  )?.[1];

  if (!metaCsp) {
    problems.push("index.html has no Content-Security-Policy meta tag");
  } else if (!headerCsp) {
    problems.push(".htaccess sets no Content-Security-Policy header");
  } else if (squash(metaCsp) !== squash(headerCsp)) {
    problems.push(
      "Content-Security-Policy differs between index.html and .htaccess",
    );
  } else {
    note("ok: CSP matches between index.html and .htaccess");
  }
}

if (problems.length > 0) {
  console.error("");
  for (const p of problems) console.error(`    FAIL: ${p}`);
  process.exit(1);
}
