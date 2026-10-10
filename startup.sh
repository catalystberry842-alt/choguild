#!/bin/sh
set -eu
cd /workspace
# :8081 is QA-only — a revive must never inherit a stale built-output preview.
node scripts/preview.mjs stop || true

# The preview gate boots as owner and answers 403 until this flips it.
# Retry: the proxy may still be starting when this script runs.
i=0
while [ "$i" -lt 20 ]; do
  if /usr/local/bin/xai-grok-preview-proxy --control-port 6015 --set-visibility public >/tmp/preview-visibility.log 2>&1; then
    break
  fi
  i=$((i + 1))
  sleep 0.5
done

if curl -sf -o /dev/null --max-time 2 http://127.0.0.1:8080/; then
  exit 0
fi
npm run dev >>/tmp/app-startup.log 2>&1 &
