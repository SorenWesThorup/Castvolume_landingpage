#!/bin/bash
# SessionStart hook — prepares a Claude Code on the web container for this repo.
#
# This repo is a dependency-free static site, so there is nothing to install.
# The hook verifies the toolchain the checks and the local preview rely on, and
# exports the settings the rest of the session uses.
#
# Reusing this in another project: keep the CLAUDE_CODE_REMOTE guard and the
# CLAUDE_ENV_FILE exports, and add the install step for that project's manifest
# under "Dependencies" below (see the commented examples).
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"

# Local machines already have their own setup; only shape the cloud container.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  echo "session-start: not a remote session, skipping."
  exit 0
fi

echo "session-start: preparing $(basename "$PROJECT_DIR")"

# --- Toolchain ---------------------------------------------------------------
# node runs the repo checks; python3 serves the local preview.
missing=()
command -v node >/dev/null 2>&1 || missing+=("node")
command -v python3 >/dev/null 2>&1 || missing+=("python3")

if [ ${#missing[@]} -gt 0 ]; then
  echo "session-start: WARNING missing tools: ${missing[*]}" >&2
  echo "session-start: repo checks or local preview may not run." >&2
else
  echo "session-start: node $(node --version), python3 $(python3 --version 2>&1 | cut -d' ' -f2)"
fi

# --- Dependencies ------------------------------------------------------------
# Nothing to install: no package.json, no requirements.txt. The site is plain
# HTML/CSS/JS served as-is, and the deploy just FTPs these files verbatim.
#
# For coachbook / Komma, replace this block with the relevant installer. Prefer
# the non-frozen variant so the cached container layer can be reused:
#
#   [ -f "$PROJECT_DIR/package.json" ] && npm install --prefix "$PROJECT_DIR"
#   [ -f "$PROJECT_DIR/requirements.txt" ] && pip3 install -r "$PROJECT_DIR/requirements.txt"

# --- Session environment -----------------------------------------------------
# CLAUDE_ENV_FILE persists these for every later command in the session.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  {
    echo 'export CASTVOLUME_PREVIEW_PORT="8080"'
  } >> "$CLAUDE_ENV_FILE"
fi

echo "session-start: ready. Checks: .claude/scripts/check.sh"
echo "session-start: preview: python3 -m http.server 8080 (from repo root)"
