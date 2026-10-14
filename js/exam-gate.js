/**
 * SmartTextbook — Shared Exam Gate
 * ---------------------------------
 * The exam questions are NOT in this repository. They are stored in Workers KV
 * and served by the Cloudflare Worker (POST /api/exam) only after the Worker
 * checks the password on the server. Nothing in this file can unlock an exam.
 *
 * The Worker returns a short-lived signed token with the exam, so a reload during
 * the exam does not ask for the password again.
 *
 * Each exam page sets window.EXAM_CONFIG before loading this file:
 *   window.EXAM_CONFIG = {
 *     examId:       'midterm',      // key of the exam body in Workers KV
 *     sessionKey:   'mte',          // unique per page (session storage key)
 *     durationSecs: 0,              // countdown length; 0 = no timer
 *   };
 * and has an empty <div id="exam-body"></div> where the exam is inserted.
 */
(function () {

  const _WORKER = 'https://smarttextbook-ai.jimmymisc.workers.dev';
  const _MATH = { delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$',  right: '$',  display: false }
  ] };

  function _cfg() { return window.EXAM_CONFIG || {}; }

  async function _requestExam(body) {
    try {
      const r = await fetch(_WORKER + '/api/exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (r.status === 401) return { denied: true };
      if (!r.ok) return { error: true };
      return await r.json();
    } catch (_) {
      return { error: true };
    }
  }

  function _insertExam(html) {
    const el = document.getElementById('exam-body');
    if (!el) return;
    el.innerHTML = html;
    if (typeof window.renderMathInElement === 'function') {
      window.renderMathInElement(el, _MATH);
    }
  }

  function _showError(msg) {
    const err = document.getElementById('pw-error');
    if (err) { err.textContent = msg; err.style.display = 'block'; }
  }

  /* ────────────────────────────────────────────────────────────────── */
  /* Public entry point called by each page's "Begin Exam" button       */
  /* ────────────────────────────────────────────────────────────────── */
  window.checkPassword = async function () {
    const cfg = _cfg();
    const input = document.getElementById('pw-input');
    const raw = input.value.trim();
    if (!raw) { input.focus(); return; }

    const res = await _requestExam({
      exam: cfg.examId,
      password: raw,
      name: localStorage.getItem('smarttextbook_username') || 'unknown'
    });

    if (res && res.ok && res.html) {
      sessionStorage.setItem('token_' + cfg.sessionKey, res.token || '');
      _insertExam(res.html);
      _maybeCollectName(_unlockPage);
    } else if (res && res.denied) {
      _showError('Incorrect password. Please try again.');
      input.value = '';
      input.focus();
    } else {
      _showError('The exam server could not be reached. Please try again in a moment.');
    }
  };

  /* ────────────────────────────────────────────────────────────────── */
  /* Unlock: hide gate, start timer, show welcome name                  */
  /* ────────────────────────────────────────────────────────────────── */
  function _unlockPage(resumeSecs) {
    const cfg = _cfg();
    document.getElementById('password-gate').style.display = 'none';
    _showWelcomeName();
    if (cfg.durationSecs > 0 && typeof window._startExamTimer === 'function') {
      window._startExamTimer(resumeSecs || cfg.durationSecs);
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
  /* On load: resume with a valid token, otherwise show the gate        */
  /* ────────────────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', async function () {
    const cfg = _cfg();
    const gate = document.getElementById('password-gate');
    const token = sessionStorage.getItem('token_' + cfg.sessionKey);

    const pwInput = document.getElementById('pw-input');
    if (pwInput) {
      pwInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') window.checkPassword();
      });
    }

    if (token) {
      const res = await _requestExam({ exam: cfg.examId, token: token });
      if (res && res.ok && res.html) {
        _insertExam(res.html);
        const saved = parseInt(sessionStorage.getItem('timer_' + cfg.sessionKey), 10);
        _unlockPage(!isNaN(saved) && saved > 0 ? saved : 0);
        return;
      }
      sessionStorage.removeItem('token_' + cfg.sessionKey);
    }
    if (gate) gate.style.display = 'flex';
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
