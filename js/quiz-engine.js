/**
 * SmartTextbook — Quiz Engine v2
 * Supports question pools: wrong answer advances to next question.
 * After exhausting the pool, shows the worked solution.
 * Tracks attempts per pool in localStorage.
 */

class QuizEngine {
  constructor() {
    this.progress = this._loadProgress();
    this.init();
  }

  _loadProgress() {
    try { return JSON.parse(localStorage.getItem('smarttextbook_progress') || '{}'); }
    catch { return {}; }
  }
  _saveProgress() {
    try { localStorage.setItem('smarttextbook_progress', JSON.stringify(this.progress)); } catch {}
  }

  init() {
    document.addEventListener('click', e => {
      if (e.target.classList.contains('check-btn')) {
        const q = e.target.closest('.quiz-question');
        if (q) this._checkMC(q);
      }
      if (e.target.classList.contains('calc-check-btn')) {
        const p = e.target.closest('.problem');
        if (p) this._checkCalc(p);
      }
    });

    document.addEventListener('keypress', e => {
      if (e.key === 'Enter' && e.target.classList.contains('calc-input')) {
        const p = e.target.closest('.problem');
        if (p) this._checkCalc(p);
      }
    });

    // Highlight selected option
    document.addEventListener('change', e => {
      if (e.target.type === 'radio') {
        const q = e.target.closest('.quiz-question');
        if (q) {
          q.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
          e.target.closest('.quiz-option')?.classList.add('selected');
        }
      }
    });
  }

  // ---- Multiple choice ----
  _checkMC(questionEl) {
    const selected = questionEl.querySelector('input[type="radio"]:checked');
    const feedback = questionEl.querySelector('.quiz-feedback');

    if (!selected) {
      if (feedback) {
        feedback.textContent = 'Select an answer first.';
        feedback.className = 'quiz-feedback incorrect';
      }
      return;
    }

    const correct = selected.dataset.correct === 'true';
    const explanation = selected.dataset.explanation || '';
    const poolEl = questionEl.closest('.question-pool');
    const qid = questionEl.closest('[data-qid]')?.dataset.qid || questionEl.dataset.qid;

    // Record attempt
    if (!this.progress.quizzes) this.progress.quizzes = {};
    if (!this.progress.quizzes[qid]) this.progress.quizzes[qid] = { attempts: 0, correct: false };
    this.progress.quizzes[qid].attempts++;

    // Highlight correct/wrong options
    questionEl.querySelectorAll('.quiz-option').forEach(opt => {
      const radio = opt.querySelector('input[type="radio"]');
      if (radio?.dataset.correct === 'true') opt.classList.add('correct-ans');
      if (radio === selected && !correct)     opt.classList.add('wrong-ans');
    });

    if (feedback) {
      feedback.className = `quiz-feedback ${correct ? 'correct' : 'incorrect'}`;
      feedback.textContent = correct
        ? `Correct! ${explanation}`
        : `Not quite. ${explanation}`;
    }

    // Disable question
    questionEl.querySelectorAll('input').forEach(r => r.disabled = true);
    questionEl.querySelector('.check-btn')?.setAttribute('disabled', true);

    if (correct) {
      this.progress.quizzes[qid].correct = true;
      this._saveProgress();
      // Mark pool dot
      if (poolEl) this._advanceDot(poolEl, 'correct');
    } else {
      this._saveProgress();
      // Advance to next pool question after a short delay
      if (poolEl) {
        setTimeout(() => this._advancePool(poolEl, false), 1200);
      }
    }

    this._updateAttemptIndicator(questionEl, this.progress.quizzes[qid].attempts);
  }

  _advancePool(poolEl, wasCorrect) {
    const questions = Array.from(poolEl.querySelectorAll('.pool-question'));
    const current = questions.findIndex(q => q.classList.contains('active'));

    // Update dot
    this._advanceDot(poolEl, wasCorrect ? 'correct' : 'wrong');

    const next = current + 1;
    if (next < questions.length) {
      // Show transition message
      const msg = poolEl.querySelector('.pool-transition-msg');
      if (msg) {
        msg.textContent = 'Try this related question:';
        msg.classList.add('show');
        setTimeout(() => msg.classList.remove('show'), 2500);
      }
      questions[current].classList.remove('active');
      questions[next].classList.add('active');
    } else {
      // Exhausted pool — show solution
      questions[current].classList.remove('active');
      const solution = poolEl.querySelector('.pool-solution');
      if (solution) solution.classList.add('show');
    }
  }

  _advanceDot(poolEl, state) {
    const dots = Array.from(poolEl.querySelectorAll('.pool-dot'));
    const activeDot = dots.find(d => d.classList.contains('active'));
    if (activeDot) {
      activeDot.classList.remove('active');
      activeDot.classList.add(state);
      // Activate next dot
      const next = activeDot.nextElementSibling;
      if (next && next.classList.contains('pool-dot')) next.classList.add('active');
    }
  }

  _updateAttemptIndicator(questionEl, attempts) {
    const ind = questionEl.closest('.question-pool')?.querySelector('.attempt-indicator');
    if (!ind) return;
    ind.classList.add('show');
    if (attempts >= 3) {
      ind.classList.add('warn');
      ind.textContent = `${attempts} attempts — consider reviewing the concept above.`;
    } else {
      ind.textContent = `Attempt ${attempts}`;
    }
  }

  // ---- Calculation problems ----
  _checkCalc(problemEl) {
    const input = problemEl.querySelector('.calc-input');
    const result = problemEl.querySelector('.calc-result');
    if (!input || !result) return;

    const user = parseFloat(input.value);
    const correct = parseFloat(input.dataset.answer);
    const tol = parseFloat(input.dataset.tolerance || '0.02');
    const pid = problemEl.dataset.pid;

    if (!this.progress.calcs) this.progress.calcs = {};
    if (!this.progress.calcs[pid]) this.progress.calcs[pid] = { attempts: 0, correct: false };
    this.progress.calcs[pid].attempts++;
    this._saveProgress();

    if (isNaN(user)) {
      result.className = 'calc-result show incorrect';
      result.textContent = 'Please enter a number.';
      return;
    }

    const err = Math.abs((user - correct) / correct);
    const ok = err <= tol;

    result.className = `calc-result show ${ok ? 'correct' : 'incorrect'}`;
    if (ok) {
      result.textContent = `✓ Correct!`;
      this.progress.calcs[pid].correct = true;
      this._saveProgress();
      input.disabled = true;
      problemEl.querySelector('.calc-check-btn')?.setAttribute('disabled', true);
    } else {
      const dir = user < correct ? '(too low)' : '(too high)';
      const attempts = this.progress.calcs[pid].attempts;
      if (attempts >= 3) {
        result.textContent = `✗ Not quite ${dir}. Correct answer: ${correct}. Use the hint to see the steps.`;
      } else {
        result.textContent = `✗ Not quite ${dir}. Check your units. (Attempt ${attempts})`;
      }
    }
  }
}

// ---- Hint system ----
class HintSystem {
  constructor() {
    this.states = {};
    this.init();
  }
  init() {
    document.addEventListener('click', e => {
      const toggle = e.target.closest('.hint-toggle');
      if (toggle) {
        const id = toggle.dataset.hintId;
        this._toggle(id, toggle);
      }
      const nextBtn = e.target.closest('.hint-next-btn');
      if (nextBtn) {
        const id = nextBtn.dataset.hintId;
        this._next(id);
      }
    });
  }
  _toggle(id, toggleEl) {
    const content = document.getElementById(`hint-content-${id}`);
    if (!content) return;
    const isOpen = content.classList.contains('visible');
    content.classList.toggle('visible', !isOpen);
    toggleEl.classList.toggle('open', !isOpen);
    if (!isOpen && !(id in this.states)) {
      this.states[id] = 0;
      this._render(id);
    }
  }
  _render(id) {
    const content = document.getElementById(`hint-content-${id}`);
    if (!content) return;
    const steps = content.querySelectorAll('.hint-step');
    const cur = this.states[id] || 0;
    steps.forEach((s, i) => s.classList.toggle('show', i <= cur));
    const btn = content.querySelector('.hint-next-btn');
    if (btn) {
      const hasMore = cur < steps.length - 1;
      btn.style.display = hasMore ? 'inline-block' : 'none';
      if (hasMore) btn.textContent = `Next hint (${cur + 2}/${steps.length})`;
    }
  }
  _next(id) {
    const content = document.getElementById(`hint-content-${id}`);
    if (!content) return;
    const steps = content.querySelectorAll('.hint-step');
    const cur = this.states[id] || 0;
    if (cur < steps.length - 1) { this.states[id] = cur + 1; this._render(id); }
  }
}

// ---- Derivation boxes ----
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.derivation-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const body = btn.nextElementSibling;
      if (!body) return;
      const open = body.classList.toggle('open');
      btn.classList.toggle('open', open);
    });
  });
});

// ---- Auto-init ----
const quizEngine  = new QuizEngine();
const hintSystem  = new HintSystem();
