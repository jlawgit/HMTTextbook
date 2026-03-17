#!/bin/bash
# ============================================================
#  start-tunnel.sh  —  SmartTextbook AI Tunnel Launcher
#
#  Architecture:
#    GitHub Pages → ngrok (port 5000) → Flask proxy → Ollama (11434)
#
#  Flask handles CORS so no OLLAMA_ORIGINS env var needed.
#
#  Run:  ./start-tunnel.sh
# ============================================================

OLLAMA_PORT=11434
FLASK_PORT=5000
NGROK_DOMAIN="exergual-dilemmic-tricia.ngrok-free.dev"
NAV_JS="js/chapter-nav.js"
NGROK_CFG="$HOME/.config/ngrok/ngrok.yml"

echo ""
echo "🚀  SmartTextbook AI Tunnel Launcher"
echo "======================================"

# ── 1. Check Ollama ───────────────────────────────────────────
echo "→ Checking Ollama on port $OLLAMA_PORT..."
if ! curl -s --max-time 3 "http://localhost:$OLLAMA_PORT/api/tags" > /dev/null 2>&1; then
  echo "❌  Ollama is not running. Start it: open the Ollama app or run 'ollama serve'"
  exit 1
fi
echo "   ✅ Ollama is running."

# ── 2. Update ngrok config to point at Flask (port 5000) ─────
echo "→ Updating ngrok config to forward port $FLASK_PORT..."
if [ -f "$NGROK_CFG" ]; then
  # Change any addr: XXXX line under tunnels to addr: 5000
  sed -i '' "s/addr: $OLLAMA_PORT/addr: $FLASK_PORT/g" "$NGROK_CFG"
  sed -i '' "s/addr: 80$/addr: $FLASK_PORT/g" "$NGROK_CFG"
  echo "   ✅ ngrok.yml updated."
else
  echo "   ⚠️  ngrok.yml not found at $NGROK_CFG — skipping config update."
fi

# ── 3. Install Flask deps if needed ──────────────────────────
echo "→ Checking Python dependencies..."
pip3 install flask flask-cors requests --quiet 2>/dev/null || true
echo "   ✅ Dependencies ready."

# ── 4. Start Flask proxy in background ───────────────────────
echo "→ Starting Flask proxy on port $FLASK_PORT..."
pkill -f "chatbot_server.py" 2>/dev/null || true
sleep 1
python3 chatbot_server.py > /tmp/flask-hmt.log 2>&1 &
FLASK_PID=$!

# Wait for Flask to be ready
for i in $(seq 1 10); do
  sleep 1
  if curl -s --max-time 2 "http://localhost:$FLASK_PORT/api/status" > /dev/null 2>&1; then
    echo "   ✅ Flask is running (PID $FLASK_PID)."
    break
  fi
  echo "   waiting for Flask... ($i/10)"
done

if ! curl -s --max-time 2 "http://localhost:$FLASK_PORT/api/status" > /dev/null 2>&1; then
  echo "❌  Flask failed to start. Log:"
  cat /tmp/flask-hmt.log
  exit 1
fi

# ── 5. Restart ngrok agent to pick up new config ─────────────
echo "→ Restarting ngrok agent..."
pkill ngrok 2>/dev/null || true
killall ngrok 2>/dev/null || true
sleep 2
ngrok start --all > /tmp/ngrok-hmt.log 2>&1 &
NGROK_PID=$!
sleep 3
echo "   ✅ ngrok restarted."

# ── 6. Ensure chapter-nav.js has correct URLs ─────────────────
echo "→ Checking $NAV_JS..."
if grep -q "$NGROK_DOMAIN" "$NAV_JS"; then
  echo "   ✅ URLs already correct."
else
  sed -i '' "s|^const FLASK_URL.*|const FLASK_URL   = 'https://$NGROK_DOMAIN/api/chat'; // public via Flask proxy|" "$NAV_JS"
  git add "$NAV_JS"
  git commit -m "chore: update Flask URL to ngrok tunnel"
  git push origin main
  echo "   ✅ Pushed to GitHub Pages."
fi

# ── 7. Status ─────────────────────────────────────────────────
echo ""
echo "======================================"
echo "🟢  AI Tutor is LIVE"
echo "    Tunnel : https://$NGROK_DOMAIN"
echo "    Flask  : http://localhost:$FLASK_PORT"
echo "    Ollama : http://localhost:$OLLAMA_PORT"
echo ""
echo "    Keep this window open."
echo "    Press Ctrl+C to stop."
echo "======================================"
echo ""

# On Ctrl+C: stop Flask and ngrok
cleanup() {
  echo ""
  echo "→ Shutting down..."
  kill $FLASK_PID 2>/dev/null
  kill $NGROK_PID 2>/dev/null
  echo "✅  Done."
}
trap cleanup EXIT INT TERM

wait
