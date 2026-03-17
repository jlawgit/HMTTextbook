#!/bin/bash
# ============================================================
#  start-tunnel.sh  —  SmartTextbook AI Tunnel Launcher
#  Run this from the SmartTextbookClaudeOnline folder:
#    chmod +x start-tunnel.sh   (first time only)
#    ./start-tunnel.sh
#
#  What it does:
#    1. Checks Ollama is running
#    2. Starts ngrok on port 11434
#    3. Reads the assigned public URL from ngrok's local API
#    4. Updates js/chapter-nav.js with that URL
#    5. Commits and pushes to GitHub Pages
#    6. Keeps the tunnel open until you press Ctrl+C
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

# ── 2. Kill any existing ngrok processes ─────────────────────
pkill -x ngrok 2>/dev/null || true
sleep 2

# ── 3. Start ngrok in background ─────────────────────────────
echo "→ Starting ngrok tunnel on port $OLLAMA_PORT..."
ngrok http $OLLAMA_PORT --log=stdout --log-level=warn > /tmp/ngrok-hmt.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to come up
for i in 1 2 3 4 5 6 7 8 9 10; do
  sleep 1
  NGROK_URL=$(curl -s "$NGROK_API" 2>/dev/null \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['tunnels'][0]['public_url'])" 2>/dev/null || true)
  if [ -n "$NGROK_URL" ]; then break; fi
  echo "   waiting for ngrok... ($i/10)"
done

if [ -z "$NGROK_URL" ]; then
  echo ""
  echo "❌  Could not get ngrok URL. Check /tmp/ngrok-hmt.log"
  echo ""
  cat /tmp/ngrok-hmt.log 2>/dev/null | tail -20
  kill $NGROK_PID 2>/dev/null
  exit 1
fi

echo "   ✅ ngrok URL: $NGROK_URL"

# ── 4. Update chapter-nav.js ──────────────────────────────────
echo "→ Updating $NAV_JS..."
# Replace the OLLAMA_URL line (handles both localhost and previous ngrok URLs)
sed -i '' "s|^const OLLAMA_URL.*|const OLLAMA_URL  = '$NGROK_URL/api/chat';|" "$NAV_JS"
echo "   ✅ OLLAMA_URL set to $NGROK_URL/api/chat"

# ── 5. Git commit + push ──────────────────────────────────────
echo "→ Pushing to GitHub Pages..."
git add "$NAV_JS"
git commit -m "chore: update AI tutor tunnel URL to $NGROK_URL" --allow-empty
git push origin main
echo "   ✅ Pushed. GitHub Pages will update in ~1 minute."

# ── 6. Keep tunnel alive ──────────────────────────────────────
echo ""
echo "======================================"
echo "🟢  AI Tutor is LIVE"
echo "    Tunnel  : $NGROK_URL"
echo "    Ollama  : http://localhost:$OLLAMA_PORT"
echo ""
echo "    Keep this window open."
echo "    Press Ctrl+C to stop the tunnel."
echo "======================================"
echo ""

# Restore OLLAMA_URL to localhost on exit so local dev still works
restore() {
  echo ""
  echo "→ Shutting down tunnel..."
  kill $NGROK_PID 2>/dev/null
  sed -i '' "s|^const OLLAMA_URL.*|const OLLAMA_URL  = 'http://localhost:$OLLAMA_PORT/api/chat';|" "$NAV_JS"
  git add "$NAV_JS"
  git commit -m "chore: restore AI tutor URL to localhost" --allow-empty
  git push origin main
  echo "✅  Tunnel closed. chapter-nav.js restored to localhost."
}
trap restore EXIT INT TERM

wait $NGROK_PID
