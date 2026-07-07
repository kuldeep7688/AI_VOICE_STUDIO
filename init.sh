#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
PASS=0
FAIL=0

green() { printf "\033[32m%s\033[0m\n" "$1"; }
red() { printf "\033[31m%s\033[0m\n" "$1"; }
bold() { printf "\033[1m%s\033[0m\n" "$1"; }

check() {
  local desc="$1"
  shift
  if "$@" > /tmp/init-check.log 2>&1; then
    green "  ✓ $desc"
    ((PASS++))
  else
    red "  ✗ $desc"
    cat /tmp/init-check.log
    ((FAIL++))
  fi
}

bold "──────────────────────────────"
bold "  AI Voice Studio — Init Check"
bold "──────────────────────────────"
echo ""

# ── Backend ────────────────────────────────────────────
bold "Backend"

cd "$ROOT_DIR/backend"

check "Python 3.11+" bash -c "python3 --version | grep -qE '3.(1[1-9]|[2-9][0-9])'"

if [ ! -d venv ]; then
  echo "  … creating venv"
  python3 -m venv venv
fi
source venv/bin/activate

check "pip install (requirements.txt)" pip install -q -r requirements.txt

if [ ! -f .env ]; then
  cp .env.example .env
  echo "  … created .env from .env.example (add your NVIDIA_API_KEY)"
fi

check "python imports clean" python3 -c "
from config import settings
from models import TTSCloneRequest, JobStatus
from job_manager import job_manager
print('  models, config, job_manager OK')
"

if grep -q "NVIDIA_API_KEY=nvapi-..." .env 2>/dev/null; then
  echo "  ⚠ NVIDIA_API_KEY not configured — NIM calls will fail"
fi

check "uvicorn boots and responds" bash -c "
  timeout 5 uvicorn main:app --port 18000 &
  UVPID=\$!
  sleep 2
  curl -sf http://localhost:18000/api/health | grep -q 'ok'
  kill \$UVPID 2>/dev/null; wait \$UVPID 2>/dev/null
"

echo ""

# ── Frontend ───────────────────────────────────────────
bold "Frontend"

cd "$ROOT_DIR/frontend"

check "Node 18+" bash -c "node --version | grep -qE 'v(18|19|20|21|22|23|24)'"

if [ ! -d node_modules ]; then
  echo "  … installing npm packages"
  npm install --silent
fi

check "npm install" npm install --silent 2>/dev/null

check "TypeScript type-check" npx tsc --noEmit

check "Vite build" npx vite build

# ── Summary ────────────────────────────────────────────
echo ""
bold "──────────────────────────────"
if [ "$FAIL" -eq 0 ]; then
  green "  All $PASS checks passed"
else
  red "  $FAIL checks failed, $PASS passed"
fi
bold "──────────────────────────────"

exit "$FAIL"
