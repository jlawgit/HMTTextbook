/**
 * SmartTextbook — Cloudflare Worker AI Proxy
 * ============================================
 * Replaces the local Flask + ngrok setup entirely.
 * Your API key lives here as a Cloudflare secret — never in the browser.
 *
 * ── DEPLOY IN 5 MINUTES ──────────────────────────────────────────────
 *
 *  1. Sign up free at https://dash.cloudflare.com (no credit card needed)
 *
 *  2. Go to  Workers & Pages  →  Create  →  Create Worker
 *     Name it something like: smarttextbook-ai
 *     Click Deploy, then Edit Code — paste this entire file.
 *
 *  3. Add environment variables (Settings → Variables & Secrets):
 *
 *     Variable name       Type      Example value
 *     ─────────────────── ───────── ──────────────────────────────────────
 *     AI_API_KEY          Secret    gsk_abc123...   ← your Groq/MiniMax key
 *     AI_BASE_URL         Text      https://api.groq.com/openai/v1
 *     AI_MODEL            Text      llama-3.1-8b-instant
 *     AI_PROVIDER_NAME    Text      Groq · Llama-3.1
 *
 *     For MiniMax instead:
 *       AI_BASE_URL  →  https://api.minimax.chat/v1
 *       AI_MODEL     →  MiniMax-Text-01
 *
 *  4. Click  Save and Deploy.
 *     Your Worker URL will be something like:
 *       https://smarttextbook-ai.YOUR-SUBDOMAIN.workers.dev
 *
 *  5. Copy that URL into js/chapter-nav.js as WORKER_URL.
 *     That is the only file you need to edit in the textbook repo.
 *
 * ── RECOMMENDED FREE AI PROVIDERS ───────────────────────────────────
 *
 *  Groq (recommended — fastest, free tier, no credit card):
 *    Get key at https://console.groq.com
 *    AI_BASE_URL  = https://api.groq.com/openai/v1
 *    AI_MODEL     = llama-3.1-8b-instant     (fastest)
 *                 = llama-3.3-70b-versatile  (smarter, good for tutoring)
 *                 = gemma2-9b-it             (alternative)
 *
 *  MiniMax (if you already have an account):
 *    Get key at https://platform.minimax.chat
 *    AI_BASE_URL  = https://api.minimax.chat/v1
 *    AI_MODEL     = MiniMax-Text-01
 *
 *  OpenRouter (access to many free models):
 *    Get key at https://openrouter.ai
 *    AI_BASE_URL  = https://openrouter.ai/api/v1
 *    AI_MODEL     = meta-llama/llama-3.1-8b-instruct:free
 *
 * ── PRIVACY / SECURITY NOTES ─────────────────────────────────────────
 *
 *  ✅  API key never reaches the student's browser — it lives only here.
 *  ✅  Each student's chat session is completely isolated from others.
 *      This Worker is stateless: it holds no memory between requests.
 *      Student A cannot see Student B's questions, ever.
 *  ✅  Only the current session's last 8 turns are sent in any one request.
 *  ✅  The system prompt (chapter context) is sent per-request — fine,
 *      it contains no sensitive data.
 *  ⚠️  If you include exam answers in the system prompt, students with
 *      DevTools open can read the system prompt from the JS source.
 *      Keep exam answers out of the system prompt.
 *
 * ─────────────────────────────────────────────────────────────────────
 */

export default {
  async fetch(request, env) {

    const CORS = {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, ngrok-skip-browser-warning',
    };

    // ── CORS preflight ──────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // ── Status endpoint (GET /api/status) ───────────────────────────
    // chapter-nav.js calls this to light up the green dot.
    if (path.endsWith('/api/status')) {
      return json({
        ollama:        true,           // backward-compat field name
        active_model:  env.AI_MODEL         || 'cloud-ai',
        provider:      env.AI_PROVIDER_NAME || 'Cloud AI',
      }, CORS);
    }

    // ── Analytics / audit log (POST /api/log) ──────────────────────
    // Receives page visit and unauthorized-attempt events from the browser.
    // Events are written to console.log() — visible in Cloudflare dashboard
    // under Workers → smarttextbook-ai → Observability → Logs.
    if (path.endsWith('/api/log') && request.method === 'POST') {
      try {
        const payload = await request.json();
        const type = payload.event || 'unknown';
        if (type === 'unauthorized_exam_attempt') {
          console.warn('[SECURITY] unauthorized_exam_attempt', JSON.stringify(payload));
        } else {
          console.log('[VISIT]', JSON.stringify(payload));
        }
      } catch (_) { /* ignore malformed bodies */ }
      return json({ ok: true }, CORS);
    }

    // ── Chat endpoint (POST /api/chat) ──────────────────────────────
    if (!path.endsWith('/api/chat')) {
      return new Response('Not found', { status: 404, headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405, headers: CORS });
    }

    // Parse request body (same format as the old Flask proxy)
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad request — expected JSON', { status: 400, headers: CORS });
    }

    const { message = '', history = [], context = '' } = body;
    if (!message) {
      return new Response('Missing message field', { status: 400, headers: CORS });
    }

    // Build OpenAI-format message array
    const messages = [
      { role: 'system', content: context },
      ...history.slice(-8),              // last 8 turns max — keeps token cost low
      { role: 'user',   content: message }
    ];

    // Call the AI API
    const baseUrl    = (env.AI_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
    const model      = env.AI_MODEL    || 'llama-3.1-8b-instant';
    const apiKey     = env.AI_API_KEY  || '';

    if (!apiKey) {
      return json({ response: '⚠️ Worker is not configured: AI_API_KEY secret is missing. See cloudflare-worker.js setup instructions.' }, CORS, 500);
    }

    let aiData;
    try {
      const aiRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens:   600,
          temperature:  0.7,
          stream:       false,
        }),
      });

      if (!aiRes.ok) {
        const errBody = await aiRes.text().catch(() => '');
        throw new Error(`Upstream ${aiRes.status}: ${errBody.slice(0, 200)}`);
      }

      aiData = await aiRes.json();

    } catch (err) {
      return json({ response: `⚠️ AI service error: ${err.message}` }, CORS, 502);
    }

    // Extract reply from OpenAI-format response
    const reply = aiData?.choices?.[0]?.message?.content
               || aiData?.choices?.[0]?.text
               || '';

    // Return in the same shape as the old Flask proxy
    return json({ response: reply }, CORS, 200);
  }
};

// ── Helper ────────────────────────────────────────────────────────────
function json(data, corsHeaders, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
