/**
 * SmartTextbook — Chapter Navigation + AI Chat
 * ─────────────────────────────────────────────
 * AI backend: Cloudflare Worker (always-on, API key stored server-side).
 * Deploy cloudflare-worker.js to Cloudflare Workers, then paste your
 * Worker URL below as WORKER_URL.
 *
 * For local development only, the script also tries localhost Ollama
 * as a fallback when the Worker URL is not yet set.
 */

// ── Configuration ────────────────────────────────────────────────────────────
//
//  After deploying cloudflare-worker.js, replace the placeholder below with
//  your actual Worker URL, e.g.:
//    https://smarttextbook-ai.your-subdomain.workers.dev
//
const WORKER_URL = 'https://smarttextbook-ai.jimmymisc.workers.dev';

// Local Ollama fallback (only works when running locally — ignored by students)
const OLLAMA_URL   = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'glm-4.7-flash:latest';

// ── System prompt ─────────────────────────────────────────────────────────────
function buildSystemPrompt(chapterContext) {
  return `You are a patient, Socratic tutor for an undergraduate heat and mass transfer course \
aimed at students with a polymer science background. Your style is like Feynman: physical \
intuition first, mathematics second. Keep answers concise (3–5 sentences unless a derivation \
is explicitly requested). Use concrete analogies — especially 3D printing and everyday objects \
— before any abstract formula. If a student asks the same question twice, try a completely \
different explanation or analogy. Never give a direct numerical answer to a problem set \
question — guide the student to find it themselves. \
The current chapter context is: ${chapterContext}.`;
}

// ── TOC scroll spy ────────────────────────────────────────────────────────────
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
        requestAnimationFrame(() => { this._highlight(); ticking = false; });
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

// ── Chat widget ───────────────────────────────────────────────────────────────
function toggleChat() {
  const panel = document.getElementById('chatPanel');
  if (!panel) return;
  const hidden = panel.style.display === 'none' || panel.style.display === '';
  panel.style.display = hidden ? 'block' : 'none';
  if (hidden) document.getElementById('globalChatInput')?.focus();
}

function handleGlobalChatKeyPress(e) {
  if (e.key === 'Enter') sendGlobalChatMessage();
}

async function sendGlobalChatMessage(contextHint) {
  const input   = document.getElementById('globalChatInput');
  const message = input?.value?.trim();
  if (!message) return;

  const container = document.getElementById('globalChatMessages');
  if (!container) return;

  appendMessage(container, 'user', message);
  input.value = '';
  container.scrollTop = container.scrollHeight;

  const typingId = 'typing_' + Date.now();
  appendTyping(container, typingId);
  container.scrollTop = container.scrollHeight;

  // Build message history from visible bubbles (last 8 turns)
  const bubbles = Array.from(container.querySelectorAll('.message:not(.typing-msg)'));
  const history = bubbles.slice(-8).map(b => ({
    role:    b.classList.contains('user') ? 'user' : 'assistant',
    content: b.querySelector('.message-content')?.textContent?.trim() || ''
  }));

  const chapterCtx   = contextHint || document.title || 'Heat and Mass Transfer';
  const systemPrompt = buildSystemPrompt(chapterCtx);

  let reply = '';
  try {
    reply = await callWorker(systemPrompt, history, message);
  } catch (workerErr) {
    // Worker not reachable — try local Ollama as last resort (developer mode)
    try {
      reply = await callOllamaLocal(systemPrompt, history, message);
    } catch {
      reply = '⚠️ The AI tutor is temporarily unavailable. Please try again in a moment, ' +
              'or continue with the hints and worked examples in this chapter.';
    }
  }

  document.getElementById(typingId)?.remove();
  appendMessage(container, 'bot', reply);

  if (typeof renderMathInElement !== 'undefined') {
    const last = container.lastElementChild;
    if (last) renderMathInElement(last, {
      delimiters: [{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}]
    });
  }

  container.scrollTop = container.scrollHeight;
}

// ── Primary path: Cloudflare Worker ──────────────────────────────────────────
async function callWorker(system, history, message) {
  const chatUrl = workerChatUrl();
  const res = await fetch(chatUrl, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ message, history, context: system }),
    signal:  AbortSignal.timeout(60000),   // 60 s — cloud inference is fast
  });
  if (!res.ok) throw new Error('Worker error ' + res.status);
  const data = await res.json();
  return data.response || '';
}

// ── Local fallback: Ollama (developer only) ───────────────────────────────────
async function callOllamaLocal(system, history, message) {
  const messages = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: message }
  ];
  const res = await fetch(OLLAMA_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ model: OLLAMA_MODEL, messages, stream: false }),
    signal:  AbortSignal.timeout(3000),   // fail fast — only works on localhost
  });
  if (!res.ok) throw new Error('Ollama error ' + res.status);
  const data = await res.json();
  return data.message?.content || data.response || '';
}

// ── Helper: build consistent Worker URLs ─────────────────────────────────────
function workerChatUrl()   { return WORKER_URL.replace(/\/$/, '') + '/api/chat'; }
function workerStatusUrl() { return WORKER_URL.replace(/\/$/, '') + '/api/status'; }

// ── Conceptual answer evaluation ──────────────────────────────────────────────
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
    `Do not give the complete answer away. Be encouraging but precise.\n\n` +
    `Question: ${questionText}\n\nStudent answer: ${answerText}`;

  const sys = buildSystemPrompt(document.title || 'Heat and Mass Transfer');

  try {
    let reply = '';
    try   { reply = await callWorker(sys, [], evalPrompt); }
    catch { reply = await callOllamaLocal(sys, [], evalPrompt); }

    feedbackEl.className = 'concept-feedback visible';
    feedbackEl.innerHTML = reply
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/`([^`]+)`/g,'<code>$1</code>')
      .replace(/\n/g,'<br>');
  } catch {
    const hints = Array.from(problemEl.querySelectorAll('.hint-step p'))
                       .map(p => p.textContent).join(' ');
    feedbackEl.className = 'concept-feedback visible offline';
    feedbackEl.innerHTML =
      '<strong>AI tutor is temporarily unavailable.</strong><br><br>' +
      (hints ? '<strong>Key hint:</strong> ' + hints
             : 'Re-read the relevant section and compare your answer to the core definition.');
  }

  btn.disabled = false;
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.concept-submit-btn').forEach(btn => {
    btn.addEventListener('click', () => evaluateConceptualAnswer(btn));
  });
});

// ── AI status indicator ───────────────────────────────────────────────────────
async function checkAIStatus() {
  const dot   = document.getElementById('aiStatusDot');
  const label = document.getElementById('aiStatusLabel');
  if (!dot) return;

  dot.className = 'ai-status-dot checking';
  if (label) label.textContent = 'Connecting…';

  // 1. Try the Cloudflare Worker (primary path for all users)
  if (!WORKER_URL.includes('YOUR-WORKER')) {
    try {
      const res = await fetch(workerStatusUrl(), {
        signal: AbortSignal.timeout(6000)
      });
      if (res.ok) {
        const data = await res.json();
        dot.className = 'ai-status-dot online';
        if (label) label.textContent = `AI Tutor · ${data.provider || data.active_model || 'ready'}`;
        return;
      }
    } catch (_) { /* fall through */ }
  }

  // 2. Try local Ollama (developer machine only)
  try {
    const res = await fetch('http://localhost:11434/api/tags', {
      signal: AbortSignal.timeout(2000)
    });
    if (res.ok) {
      dot.className = 'ai-status-dot online';
      if (label) label.textContent = `Ollama · ${OLLAMA_MODEL} (local)`;
      return;
    }
  } catch (_) { /* fall through */ }

  // 3. All unreachable
  dot.className = 'ai-status-dot offline';
  if (label) label.textContent = 'AI tutor offline';
}

// ── Message rendering helpers ─────────────────────────────────────────────────
function appendMessage(container, role, text) {
  const div  = document.createElement('div');
  div.className = `message ${role}`;
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

// ── Progress report ───────────────────────────────────────────────────────────
function showProgressReport() {
  try {
    const parsed = JSON.parse(localStorage.getItem('smarttextbook_progress') || '{}');
    const quizzes = parsed.quizzes || {};
    const calcs   = parsed.calcs   || {};
    const total   = Object.keys(quizzes).length + Object.keys(calcs).length;
    const correct = Object.values(quizzes).filter(v=>v.correct).length
                  + Object.values(calcs).filter(v=>v.correct).length;

    const lines = [
      'SmartTextbook Progress Report',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      `Questions attempted: ${total}`,
      `Correct: ${correct} / ${total}`,
      ''
    ];
    for (const [qid, v] of Object.entries(quizzes)) {
      lines.push(`Quiz ${qid}: ${v.correct ? 'Correct' : 'Incorrect'} (${v.attempts||1} attempt(s))`);
    }
    for (const [pid, v] of Object.entries(calcs)) {
      lines.push(`Calc ${pid}: ${v.correct ? 'Correct' : 'Incorrect'} (${v.attempts||1} attempt(s))`);
    }
    alert(lines.join('\n'));
  } catch {
    alert('No progress data found yet. Complete some questions first.');
  }
}

// ── Auto-init ─────────────────────────────────────────────────────────────────
const chapterNav = new ChapterNav();
document.addEventListener('DOMContentLoaded', checkAIStatus);
