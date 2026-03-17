#!/usr/bin/env python3
"""
SmartTextbook — Local AI Chat Server
Proxies requests from the textbook frontend to Ollama (or any OpenAI-compatible API).

Usage:
  pip install flask requests flask-cors
  python3 chatbot_server.py

Then open the textbook from http://localhost:8080 (serve with python3 -m http.server 8080)
The chat widget will connect automatically.

Configuration:
  OLLAMA_URL   — Ollama API endpoint (default: http://localhost:11434/api/chat)
  OLLAMA_MODEL — Model to use (default: llama3.2)
"""

import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Allow requests from file:// and any localhost port

OLLAMA_URL   = os.getenv('OLLAMA_URL',   'http://localhost:11434/api/chat')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'glm-4.7-flash:latest')  # fast 19GB model

DEFAULT_SYSTEM = (
    "You are a patient, Socratic tutor for a heat and mass transfer course aimed at "
    "polymer science students. Keep answers concise (3-5 sentences unless a derivation "
    "is requested). Use 3D printing and everyday analogies before abstract math. "
    "If a student asks the same question twice, try a completely different explanation."
)


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.get_json(force=True)
    user_message = data.get('message', '').strip()
    history       = data.get('history', [])   # [{role, content}, ...]
    context       = data.get('context', '')    # chapter context hint

    if not user_message:
        return jsonify({'response': ''}), 400

    system_prompt = DEFAULT_SYSTEM
    if context:
        system_prompt += f" Current chapter context: {context}."

    messages = [{'role': 'system', 'content': system_prompt}]
    messages += history[-8:]  # keep last 8 turns
    messages.append({'role': 'user', 'content': user_message})

    try:
        resp = requests.post(
            OLLAMA_URL,
            json={'model': OLLAMA_MODEL, 'messages': messages, 'stream': False},
            timeout=60
        )
        resp.raise_for_status()
        ollama_data = resp.json()
        reply = ollama_data.get('message', {}).get('content', '')
        if not reply:
            reply = ollama_data.get('response', 'No response from model.')
        return jsonify({'response': reply})
    except requests.exceptions.ConnectionError:
        return jsonify({
            'response': (
                "Ollama is not running. Start it with:\n"
                f"  OLLAMA_ORIGINS='*' ollama serve\n"
                f"  ollama pull {OLLAMA_MODEL}"
            )
        }), 503
    except Exception as e:
        return jsonify({'response': f'Error: {str(e)}'}), 500


@app.route('/api/status', methods=['GET'])
def status():
    """Check if Ollama is reachable and which models are available."""
    try:
        resp = requests.get('http://localhost:11434/api/tags', timeout=5)
        models = [m['name'] for m in resp.json().get('models', [])]
        return jsonify({'ollama': True, 'models': models, 'active_model': OLLAMA_MODEL})
    except Exception:
        return jsonify({'ollama': False, 'models': [], 'active_model': OLLAMA_MODEL})


if __name__ == '__main__':
    print("=" * 55)
    print(" SmartTextbook Chat Server")
    print(f" Ollama endpoint : {OLLAMA_URL}")
    print(f" Model           : {OLLAMA_MODEL}")
    print("=" * 55)
    print("\n Quick start:")
    print("   1. In another terminal: OLLAMA_ORIGINS='*' ollama serve")
    print(f"   2. ollama pull {OLLAMA_MODEL}")
    print("   3. Serve textbook:  python3 -m http.server 8080")
    print("      Open: http://localhost:8080/SmartTextbookClaudeOnline/")
    print()
    app.run(host='127.0.0.1', port=5000, debug=False)
