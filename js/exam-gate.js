/**
 * SmartTextbook — Shared Exam Gate
 * ---------------------------------
 * Handles password verification (SHA-256, never plaintext), near-miss
 * detection with an unauthorized-access overlay, and name collection.
 *
 * Each exam page sets window.EXAM_CONFIG before loading this file:
 *   window.EXAM_CONFIG = {
 *     sessionKey:   'mtp',          // unique per page (session storage key)
 *     timerKey:     null,           // set to a string if page has a countdown timer
 *     durationSecs: 0,              // timer duration; 0 = no timer
 *   };
 */
(function () {

  /* ── Password (SHA-256 only — plaintext never stored) ─────────────── */
  const _HASH = 'e2eaf4046fed57ec5a143ae75ebcfba27822cb90f8a0fc872dc52277bf43cc82';

  /* ── Near-miss / known-bad attempts that trigger the warning ─────── */
  const _TRAPS = new Set([
    'hmt2026lawrence',      // missing the 'j' — most likely near-miss
    'hmt2026 jlawrence',    // with space
    'hmt2026jlawrence1',
    'hmt2026jlawrencee',
    'hmt2026jlawrenc',
    'hmt2027jlawrence',
    'hmt2025jlawrence',
    'jlawrence',
    'hmt2026',
    'jlawrence2026',
    'lawrencehmt2026',
  ]);

  /* ── Cloudflare Worker URL (for logging unauthorized attempts) ────── */
  const _WORKER = 'https://smarttextbook-ai.jimmymisc.workers.dev';

  /* ────────────────────────────────────────────────────────────────── */
  /* Public entry point called by each page's "Begin Exam" button       */
  /* ────────────────────────────────────────────────────────────────── */
  window.checkPassword = async function () {
    const raw = document.getElementById('pw-input').value.trim();
    const low = raw.toLowerCase();

    /* 1. Trap near-miss attempts */
    if (_TRAPS.has(low)) {
      _showUnauthorized(raw);
      return;
    }

    /* 2. Hash and compare */
    let hex;
    try {
      const buf = await crypto.subtle.digest(
        'SHA-256', new TextEncoder().encode(raw)
      );
      hex = Array.from(new Uint8Array(buf))
              .map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (_) {
      hex = '';
    }

    if (hex === _HASH) {
      _maybeCollectName(_unlockPage);
    } else {
      const err = document.getElementById('pw-error');
      if (err) { err.style.display = 'block'; }
      document.getElementById('pw-input').value = '';
      document.getElementById('pw-input').focus();
    }
  };

  /* ────────────────────────────────────────────────────────────────── */
  /* Unlock: hide gate, start timer, show welcome name                  */
  /* ────────────────────────────────────────────────────────────────── */
  function _unlockPage() {
    const cfg = window.EXAM_CONFIG || {};
    document.getElementById('password-gate').style.display = 'none';
    if (cfg.sessionKey) {
      sessionStorage.setItem('gate_' + cfg.sessionKey, '1');
    }
    _showWelcomeName();
    if (cfg.durationSecs > 0 && typeof window._startExamTimer === 'function') {
      window._startExamTimer(cfg.durationSecs);
      const timerEl = document.getElementById('exam-timer');
      if (timerEl) timerEl.style.display = 'flex';
    }
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Name collection (asks once, stores in localStorage across sessions) */
  /* ────────────────────────────────────────────────────────────────── */
  function _maybeCollectName(cb) {
    if (localStorage.getItem('smarttextbook_username')) {
      cb();
      return;
    }
    const overlay = document.getElementById('name-gate');
    if (!overlay) { cb(); return; }
    overlay.style.display = 'flex';

    function submit() {
      const v = document.getElementById('name-field').value.trim();
      if (!v) { document.getElementById('name-field').focus(); return; }
      localStorage.setItem('smarttextbook_username', v);
      overlay.style.display = 'none';
      cb();
    }
    document.getElementById('name-submit-btn').onclick = submit;
    document.getElementById('name-field').onkeypress = function (e) {
      if (e.key === 'Enter') submit();
    };
    document.getElementById('name-field').focus();
  }

  function _showWelcomeName() {
    const name = localStorage.getItem('smarttextbook_username') || '';
    const el = document.getElementById('welcome-name');
    if (el && name) el.textContent = name;
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Unauthorized-access overlay                                         */
  /* ────────────────────────────────────────────────────────────────── */
  function _showUnauthorized(attempt) {
    document.getElementById('password-gate').style.display = 'none';
    const overlay = document.getElementById('unauth-overlay');
    if (!overlay) return;

    /* Generate a pseudo incident reference for psychological effect */
    const ref = [
      'LSU', '-',
      Date.now().toString(36).toUpperCase().slice(-6), '-',
      Math.random().toString(36).slice(2, 6).toUpperCase()
    ].join('');
    const refEl = document.getElementById('incident-ref');
    if (refEl) refEl.textContent = ref;

    overlay.style.display = 'flex';

    /* Log to Cloudflare Worker (visible in Cloudflare → Workers → Observability) */
    fetch(_WORKER + '/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'unauthorized_exam_attempt',
        attempt: attempt,
        page: document.title,
        ref: ref,
        ts: new Date().toISOString(),
        name: localStorage.getItem('smarttextbook_username') || 'unknown'
      })
    }).catch(() => { /* silent — logging is best-effort */ });
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* DOMContentLoaded: restore session state or show gate               */
  /* ────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    const cfg = window.EXAM_CONFIG || {};
    const unlocked = cfg.sessionKey &&
                     sessionStorage.getItem('gate_' + cfg.sessionKey);

    if (unlocked) {
      document.getElementById('password-gate').style.display = 'none';
      _showWelcomeName();
      if (cfg.durationSecs > 0 && typeof window._startExamTimer === 'function') {
        const saved = parseInt(
          sessionStorage.getItem('timer_' + cfg.sessionKey), 10
        );
        window._startExamTimer(
          !isNaN(saved) && saved > 0 ? saved : cfg.durationSecs
        );
        const timerEl = document.getElementById('exam-timer');
        if (timerEl) timerEl.style.display = 'flex';
      }
    } else {
      document.getElementById('password-gate').style.display = 'flex';
    }

    const pwInput = document.getElementById('pw-input');
    if (pwInput) {
      pwInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') window.checkPassword();
      });
    }

    /* Log page visit to Cloudflare (analytics) */
    fetch(_WORKER + '/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'exam_page_visit',
        page: document.title,
        ts: new Date().toISOString(),
        name: localStorage.getItem('smarttextbook_username') || 'unknown'
      })
    }).catch(() => {});
  });

})();

/* ────────────────────────────────────────────────────────────────────
   Countdown timer — shared by midterm-exam and final-exam pages.
   Called as window._startExamTimer(seconds).
   Timer state is saved to sessionStorage using EXAM_CONFIG.sessionKey.
──────────────────────────────────────────────────────────────────── */
window._startExamTimer = function (seconds) {
  const cfg = window.EXAM_CONFIG || {};
  let remaining = seconds;
  const display = document.getElementById('timer-display');
  const timerEl = document.getElementById('exam-timer');
  if (!display || !timerEl) return;

  function tick() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    display.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    if (cfg.sessionKey) {
      sessionStorage.setItem('timer_' + cfg.sessionKey, remaining);
    }
    if (remaining <= 300 && remaining > 60) {
      timerEl.className = 'no-print timer-warning';
    } else if (remaining <= 60) {
      timerEl.className = 'no-print timer-critical';
    } else {
      timerEl.className = 'no-print';
    }
    if (remaining <= 0) {
      clearInterval(_timerInterval);
      display.textContent = '00:00';
      timerEl.className = 'no-print timer-critical';
    }
  }
  tick();
  var _timerInterval = setInterval(function () { remaining--; tick(); }, 1000);
};
