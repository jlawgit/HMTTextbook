#!/bin/bash
# ============================================================
#  start-tunnel.sh  —  SmartTextbook AI Tunnel Launcher
#  Run this from the SmartTextbookClaudeOnline folder:
#    chmod +x start-tunnel.sh   (first time only)
#    ./start-tunnel.sh
# ============================================================

set -e

OLLAMA_PORT=11434
NGROK_API="http://localhost:4040/api/tunnels"
NAV_JS="js/chapter-nav.js"

echo ""
echo "🚀  SmartTextbook AI Tunnel Launcher"
echo "======================================"

# ── 1. Check Ollama is reachable ──────────────────────────────
echo "→ Checking Ollama on port $OLLAMA_PORT..."
if ! curl -s --max-time 3 "http://localhost:$OLLAMA_PORT/api/tags" > /dev/null 2>&1; then
  echo ""
  echo "❌  Ollama is not running. Start it first:"
  echo "    OLLAMA_ORIGINS=\"*\" ollama serve"
  echo ""
  exit 1
fi
echo "   ✅ Ollama is running."

# ── 2. Check if ngrok is already running ─────────────────────
echo "→ Checking for existing ngrok tunnel..."
NGROK_URL=$(curl -s --max-time 3 "$NGROK_API" 2>/dev/null \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || true)

if [ -n "$NGROK_URL" ]; then
  echo "   ✅ Tunnel already running: $NGROK_URL"
  NGROK_PID=""
else
  # ── 3. Kill stale ngrok and start fresh ──────────────────
  echo "→ Starting ngrok tunnel on port $OLLAMA_PORT..."
  # Kill any lingering ngrok processes
  pkill ngrok 2>/dev/null || true
  killall ngrok 2>/dev/null || true
  sleep 2

  ngrok http $OLLAMA_PORT --log=stdout --log-level=warn > /tmp/ngrok-hmt.log 2>&1 &
  NGROK_PID=$!

  # Wait up to 15s for ngrok to come up
  for i in $(seq 1 15); do
    sleep 1
    NGROK_URL=$(curl -s "$NGROK_API" 2>/dev/null \
      | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || true)
    if [ -n "$NGROK_URL" ]; then break; fi
    echo "   waiting for ngrok... ($i/15)"
  done

  if [ -z "$NGROK_URL" ]; then
    echo ""
    echo "❌  Could not start ngrok. Log:"
    cat /tmp/ngrok-hmt.log 2>/dev/null | tail -20
    exit 1
  fi
  echo "   ✅ ngrok URL: $NGROK_URL"
fi

# ── 4. Update chapter-nav.js ──────────────────────────────────
echo "→ Updating $NAV_JS..."
sed -i '' "s|^const OLLAMA_URL.*|const OLLAMA_URL  = '$NGROK_URL/api/chat';|" "$NAV_JS"
echo "   ✅ OLLAMA_URL set to $NGROK_URL/api/chat"

# ── 5. Git commit + push ──────────────────────────────────────
echo "→ Pushing to GitHub Pages..."
git add "$NAV_JS"
git commit -m "chore: update AI tutor tunnel URL to $NGROK_URL" --allow-empty
git push origin main
echo "   ✅ Pushed. GitHub Pages will update in ~1 minute."

# ── 6. Keep running ───────────────────────────────────────────
echo ""
echo "======================================"
echo "🟢  AI Tutor is LIVE"
echo "    Tunnel : $NGROK_URL"
echo "    Ollama : http://localhost:$OLLAMA_PORT"
echo ""
echo "    Keep this window open."
echo "    Press Ctrl+C to stop."
echo "======================================"
echo ""

# On exit: restore chapter-nav.js to localhost
restore() {
  echo ""
  echo "→ Shutting down..."
  [ -n "$NGROK_PID" ] && kill $NGROK_PID 2>/dev/null
  sed -i '' "s|^const OLLAMA_URL.*|const OLLAMA_URL  = 'http://localhost:$OLLAMA_PORT/api/chat';|" "$NAV_JS"
  git add "$NAV_JS"
  git commit -m "chore: restore AI tutor URL to localhost" --allow-empty
  git push origin main
  echo "✅  Done. chapter-nav.js restored to localhost."
}
trap restore EXIT INT TERM

# If we started ngrok, wait on it; otherwise just sleep forever
if [ -n "$NGROK_PID" ]; then
  wait $NGROK_PID
else
  while true; do sleep 60; done
fi
