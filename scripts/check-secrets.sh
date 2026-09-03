#!/usr/bin/env bash
set -euo pipefail

patterns=(
  'xnd_[a-zA-Z0-9]+'
  'sk_live_[A-Za-z0-9]+'
  'sk_test_[A-Za-z0-9]+'
  'pk_live_[A-Za-z0-9]+'
  'pk_test_[A-Za-z0-9]+'
  'AIza[0-9A-Za-z\-_]+'
)

for pattern in "${patterns[@]}"; do
  if git grep -nE "$pattern" -- . ':!backend/.env' ':!frontend/.env' ':!**/.env' 2>/dev/null; then
    echo "Possible secret pattern detected: $pattern"
    exit 1
  fi
done

echo "No obvious secrets found in tracked files."
