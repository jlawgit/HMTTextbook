/**
 * SmartTextbook — Chapter Navigation + AI Chat (Ollama / Flask)
 * Supports Ollama directly (CORS-permissive) or a local Flask proxy.
 * ----------------------------------------------------------------
 * OLLAMA SETUP:
 *   1. Install Ollama: https://ollama.com
 *   2. Pull a model: ollama pull llama3.2 (or phi3, mistral, etc.)
 *   3. Run with CORS enabled:
 *      OLLAMA_ORIGINS="*" ollama serve
 *   4. Set OLLAMA_MODEL below to your model name.
 *   5. Open index.html (serve via: python3 -m http.server 8080)
 *
 * FLASK FALLBACK:
 *   If Ollama CORS is not enabled, run: python3 chatbot_server.py
 *   It proxies port 5000 → Ollama.
 * ----------------------------------------------------------------
 */

// ---- Configuration ----
const OLLAMA_URL  = 'http://localhost:11434/api/chat';
const FLASK_URL   = 'http://localhost:5000/api/chat';
const OLLAMA_MODEL = 'chemeng-tutor:latest'; // change to your model: qwen3.5:122b-256k, qwen3:235b-a22b, etc.

// ---- System prompt for the AI tutor ----
function buildSystemPrompt(chapterContext) {
  return `You are a patient, Socratic tutor for an undergraduate heat and mass transfer course, \
aimed at students with a polymer science background. Your style is like Feynman: physical first, \
math second. Keep answers concise (3-5 sentences unless a derivation is requested). \
Use concrete analogies — especially 3D printing and everyday objects — before abstract math. \
If a student asks the same question twice, try a completely different explanation or analogy. \
The current chapter context is: ${chapterContext}.`;
}

// ---- TOC scroll spy ----
class ChapterNav {
  constructor() {
    this.sections = [];
    this.tocLinks = [];
    this.init();
  }
  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.sections = Array.from(document.querySelectorAll('.chapter-section[id]'));
      this.tocLinks = Array.from(document.querySelectorAll('.toc-list a'));
      this._setupScrollSpy();
    });
  }
  _setupScrollSpy() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this._highlight();
          ticking = false;
        });
        ticking = true;
      }
    });
  }
  _highlight() {
    if (!this.sections.length) return;
    let current = this.sections[0].id;
    for (const s of this.sections) {
      if (window.scrollY >= s.offsetTop - 100) current = s.id;
    }
    this.tocLinks.forEach(a => {
      const href = (a.getAttribute('href') || '').replace('#', '');
      a.classList.toggle('active', href === current);
    });
  }
}

// ---- Chat widget ----
function toggleChat() {
  const panel = document.getElementById('chatPanel');
  if (!panel) return;
  const hidden = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = hidden ? 'block' : 'none';
  if (hidden) {
    document.getElementById('globalChatInput')?.focus();
  }
}

function handleGlobalChatKeyPress(e) {
  if (e.key === 'Enter') sendGlobalChatMessage();
}

async function sendGlobalChatMessage(contextHint) {
  const input = document.getElementById('globalChatInput');
  const message = input?.value?.trim();
  if (!message) return;

  const container = document.getElementById('globalChatMessages');
  if (!container) return;

  // Append user bubble
  appendMessage(container, 'user', message);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  // Show typing indicator
  const typingId = 'typing_' + Date.now();
  appendTyping(container, typingId);
  container.scrollTop = container.scrollHeight;

  // Build message history from DOM (last 8 turns)
  const bubbles = Array.from(container.querySelectorAll('.message:not(.typing-msg)'));
  const history = bubbles.slice(-8).map(b => ({
    role: b.classList.contains('user') ? 'user' : 'assistant',
    content: b.querySelector('.message-content')?.textContent?.trim() || ''
  }));

  const chapterCtx = contextHint || document.title || 'Heat and Mass Transfer';
  const systemPrompt = buildSystemPrompt(chapterCtx);

  // Track attempt count for this session
  const attemptKey = 'chat_attempts_' + chapterCtx.slice(0,20);
  const attempts = parseInt(localStorage.getItem(attemptKey) || '0') + 1;
  localStorage.setItem(attemptKey, attempts);

  let reply = '';
  try {
    reply = await callOllama(systemPrompt, history, message)
      .catch(() => callFlask(systemPrompt, history, message));
  } catch (err) {
    reply = `⚠️ Could not reach AI tutor.\n\n**To enable it:**\n1. Install Ollama: https://ollama.com\n2. Run: \`OLLAMA_ORIGINS="*" ollama serve\`\n3. Pull a model: \`ollama pull llama3.2\`\n4. Serve files: \`python3 -m http.server 8080\` then open http://localhost:8080\n\nOr run \`python3 chatbot_server.py\` as a proxy.`;
  }

  document.getElementById(typingId)?.remove();
  appendMessage(container, 'bot', reply);

  // Re-render math
  if (typeof renderMathInElement !== 'undefined') {
    const lastMsg = container.lastElementChild;
    if (lastMsg) renderMathInElement(lastMsg, {
      delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]
    });
  }

  container.scrollTop = container.scrollHeight;
}

async function callOllama(system, history, message) {
  const messages = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: message }
  ];
  const res = await fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false })
  });
  if (!res.ok) throw new Error('Ollama error ' + res.status);
  const data = await res.json();
  return data.message?.content || data.response || '';
}

async function callFlask(system, history, message) {
  const res = await fetch(FLASK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, context: system })
  });
  if (!res.ok) throw new Error('Flask error ' + res.status);
  const data = await res.json();
  return data.response || '';
}

function appendMessage(container, role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;
  // Simple markdown: bold, code, line breaks
  const html = text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\n/g,'<br>');
  div.innerHTML = `<div class="message-content">${html}</div>`;
  container.appendChild(div);
  return div;
}

function appendTyping(container, id) {
  const div = document.createElement('div');
  div.className = 'message bot typing-msg';
  div.id = id;
  div.innerHTML = `<div class="message-content typing-indicator">
    <span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>
  </div>`;
  container.appendChild(div);
}

// ---- Progress report ----
function showProgressReport() {
  const data = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith('smarttextbook')) data[k] = localStorage.getItem(k);
  }

  try {
    const parsed = JSON.parse(localStorage.getItem('smarttextbook_progress') || '{}');
    const quizzes = parsed.quizzes || {};
    const calcs   = parsed.calcs   || {};
    const total   = Object.keys(quizzes).length + Object.keys(calcs).length;
    const correct = Object.values(quizzes).filter(v=>v.correct).length
                  + Object.values(calcs).filter(v=>v.correct).length;

    const lines = [
      `SmartTextbook Progress Report`,
      `Generated: ${new Date().toLocaleString()}`,
      ``,
      `Questions attempted: ${total}`,
      `Correct: ${correct} / ${total}`,
      ``
    ];
    for (const [qid, v] of Object.entries(quizzes)) {
      lines.push(`Quiz ${qid}: ${v.correct ? 'Correct' : 'Incorrect'} (${v.attempts || 1} attempt(s))`);
    }
    for (const [pid, v] of Object.entries(calcs)) {
      lines.push(`Calc ${pid}: ${v.correct ? 'Correct' : 'Incorrect'} (${v.attempts || 1} attempt(s))`);
    }
    alert(lines.join('\n'));
  } catch {
    alert('No progress data found yet. Complete some questions first.');
  }
}

// ---- Conceptual answer AI evaluation ----
async function evaluateConceptualAnswer(btn) {
  const problemEl = btn.closest('.problem');
  if (!problemEl) return;

  const questionText = problemEl.querySelector('p')?.textContent?.trim() || '';
  const textarea     = problemEl.querySelector('.concept-input');
  const answerText   = textarea?.value?.trim() || '';
  const feedbackEl   = problemEl.querySelector('.concept-feedback');
  if (!feedbackEl) return;

  if (!answerText) { textarea?.focus(); return; }

  feedbackEl.className = 'concept-feedback visible loading';
  feedbackEl.textContent = 'Evaluating your answer…';
  btn.disabled = true;

  const evalPrompt =
    `A student answered the following conceptual question. ` +
    `Evaluate their answer in 3–5 sentences. Be specific: note what is correct, ` +
    `what is incomplete or missing, and give one concrete suggestion for improvement. ` +
    `Do not give the full answer away. Be encouraging but precise.\n\n` +
    `Question: ${questionText}\n\n` +
    `Student answer: ${answerText}`;

  const sys = buildSystemPrompt('Chapter 1 — Introduction to Heat Transfer');

  try {
    let reply = '';
    try   { reply = await callOllama(sys, [], evalPrompt); }
    catch { reply = await callFlask(sys,  [], evalPrompt); }

    feedbackEl.className = 'concept-feedback visible';
    feedbackEl.innerHTML = reply
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\n/g,'<br>');
  } catch {
    // Offline fallback — surface hint text if available
    const hints = Array.from(problemEl.querySelectorAll('.hint-step p'))
                       .map(p => p.textContent).join(' ');
    feedbackEl.className = 'concept-feedback visible offline';
    feedbackEl.innerHTML =
      '<strong>AI tutor is offline.</strong> Start Ollama with ' +
      '<code>OLLAMA_ORIGINS="*" ollama serve</code> to get feedback.<br><br>' +
      (hints ? '<strong>Key hint:</strong> ' + hints : 'Re-read the relevant section and compare your answer to the core definition.');
  }

  btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.concept-submit-btn').forEach(btn => {
    btn.addEventListener('click', () => evaluateConceptualAnswer(btn));
  });
});

// ---- AI status check ----
async function checkAIStatus() {
  const dot   = document.getElementById('aiStatusDot');
  const label = document.getElementById('aiStatusLabel');
  if (!dot) return;

  dot.className = 'ai-status-dot checking';
  if (label) label.textContent = 'Connecting…';

  // 1. Try Ollama directly — /api/tags is a lightweight listing endpoint
  try {
    const res = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) {
      dot.className = 'ai-status-dot online';
      if (label) label.textContent = `Ollama · ${OLLAMA_MODEL}`;
      return;
    }
  } catch (_) { /* fall through */ }

  // 2. Try Flask proxy
  try {
    const res = await fetch('http://localhost:5000/api/status', {
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) {
      dot.className = 'ai-status-dot flask';
      if (label) label.textContent = 'Flask proxy · ready';
      return;
    }
  } catch (_) { /* fall through */ }

  // 3. Both unreachable
  dot.className = 'ai-status-dot offline';
  if (label) label.textContent = 'AI offline — see setup below';
}

// ---- Auto-init ----
const chapterNav = new ChapterNav();
document.addEventListener('DOMContentLoaded', checkAIStatus);
