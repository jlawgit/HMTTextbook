#!/bin/bash
# ============================================================
#  start-tunnel.sh  —  SmartTextbook AI Tunnel Launcher
#  Your ngrok agent manages the tunnel automatically.
#  This script just verifies everything is live and keeps
#  the terminal open as a status monitor.
#
#  Run:  ./start-tunnel.sh
# ============================================================

OLLAMA_PORT=11434
NGROK_URL="https://exergual-dilemmic-tricia.ngrok-free.dev"
NAV_JS="js/chapter-nav.js"

echo ""
echo "🚀  SmartTextbook AI Tunnel Launcher"
echo "======================================"

# ── 1. Check Ollama ───────────────────────────────────────────
echo "→ Checking Ollama on port $OLLAMA_PORT..."
if ! curl -s --max-time 3 "http://localhost:$OLLAMA_PORT/api/tags" > /dev/null 2>&1; then
  echo ""
  echo "❌  Ollama is not running. Start it first:"
  echo "    OLLAMA_ORIGINS=\"*\" ollama serve"
  echo ""
  exit 1
fi
echo "   ✅ Ollama is running."

# ── 2. Check ngrok tunnel is reachable ────────────────────────
echo "→ Checking ngrok tunnel is reachable..."
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$NGROK_URL" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "000" ]; then
  echo "   ⚠️  Tunnel may be starting up — continuing anyway."
else
  echo "   ✅ Tunnel is live (HTTP $HTTP_STATUS)."
fi

# ── 3. Ensure chapter-nav.js has the correct URL ─────────────
echo "→ Checking $NAV_JS..."
CURRENT=$(grep "^const OLLAMA_URL" "$NAV_JS" || true)
EXPECTED="const OLLAMA_URL  = '$NGROK_URL/api/chat';"

if echo "$CURRENT" | grep -q "$NGROK_URL"; then
  echo "   ✅ URL already correct — no push needed."
else
  echo "   → Updating URL..."
  sed -i '' "s|^const OLLAMA_URL.*|const OLLAMA_URL  = '$NGROK_URL/api/chat';|" "$NAV_JS"
  git add "$NAV_JS"
  git commit -m "chore: set AI tutor URL to ngrok tunnel"
  git push origin main
  echo "   ✅ Pushed. GitHub Pages will update in ~1 minute."
fi

# ── 4. Status display ─────────────────────────────────────────
echo ""
echo "======================================"
echo "🟢  AI Tutor is LIVE"
echo "    Tunnel : $NGROK_URL"
echo "    Ollama : http://localhost:$OLLAMA_PORT"
echo ""
echo "    Your ngrok agent keeps the tunnel"
echo "    open automatically in the background."
echo ""
echo "    Press Ctrl+C to exit this monitor."
echo "======================================"
echo ""

# ── 5. Monitor: warn if Ollama goes down ─────────────────────
while true; do
  sleep 30
  if ! curl -s --max-time 3 "http://localhost:$OLLAMA_PORT/api/tags" > /dev/null 2>&1; then
    echo "⚠️  $(date '+%H:%M:%S')  Ollama is no longer responding!"
  fi
done
