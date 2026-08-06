#!/bin/bash
# Repo checks for the CastVolume landing page.
#
# There is no build step and no test framework here — the deploy uploads these
# files verbatim, so a broken asset path or a typo'd anchor ships straight to
# production. These checks cover exactly that class of mistake, with no
# dependencies to install.
#
# Usage: .claude/scripts/check.sh
set -euo pipefail

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)}"
cd "$PROJECT_DIR"

status=0

echo "==> JavaScript syntax"
if node --check script.js; then
  echo "    ok: script.js parses"
else
  status=1
fi

echo "==> Structure, links and assets"
if node .claude/scripts/check-html.mjs; then
  :
else
  status=1
fi

if [ "$status" -eq 0 ]; then
  echo
  echo "All checks passed."
else
  echo
  echo "Checks FAILED." >&2
fi

exit "$status"
