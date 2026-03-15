/**
 * SmartTextbook — Progress Tracker
 * Saves reading progress, quiz results, and chapter completion to localStorage.
 * All data is stored client-side — no server required.
 */

class ProgressTracker {
  constructor() {
    this.key = 'smarttextbook_progress';
    this.data = this._load();
    this.init();
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem(this.key)) || {};
    } catch { return {}; }
  }

  _save() {
    try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch {}
  }

  // ---- Chapter status ----
  getChapterStatus(chapterNum) {
    return this.data[`ch${chapterNum}_status`] || 'not-started';
  }

  setChapterStatus(chapterNum, status) {
    this.data[`ch${chapterNum}_status`] = status;
    this._save();
    this._updateBadge(chapterNum, status);
  }

  markChapterStarted(chapterNum) {
    if (this.getChapterStatus(chapterNum) === 'not-started') {
      this.setChapterStatus(chapterNum, 'in-progress');
    }
  }

  markChapterComplete(chapterNum) {
    this.setChapterStatus(chapterNum, 'completed');
  }

  // ---- Quiz results ----
  recordQuizAnswer(qid, correct) {
    if (!this.data.quizzes) this.data.quizzes = {};
    this.data.quizzes[qid] = { correct, timestamp: Date.now() };
    this._save();
  }

  recordCalcAnswer(pid, correct) {
    if (!this.data.calcs) this.data.calcs = {};
    this.data.calcs[pid] = { correct, timestamp: Date.now() };
    this._save();
  }

  // ---- Reading progress ----
  saveScrollPosition(chapterNum, pct) {
    this.data[`ch${chapterNum}_scroll`] = pct;
    this._save();
  }

  getScrollPosition(chapterNum) {
    return this.data[`ch${chapterNum}_scroll`] || 0;
  }

  // ---- UI updates ----
  _updateBadge(chapterNum, status) {
    const badge = document.getElementById(`status-chapter-${chapterNum}`);
    if (!badge) return;
    badge.className = `chapter-status ${status}`;
    const labels = { 'not-started': 'Not Started', 'in-progress': 'In Progress', 'completed': 'Completed' };
    badge.textContent = labels[status] || status;
  }

  // Load and display all saved statuses (call on index.html)
  loadProgress() {
    for (let i = 1; i <= 15; i++) {
      const status = this.getChapterStatus(i);
      if (status !== 'not-started') this._updateBadge(i, status);
    }
  }

  // Reading progress bar update
  updateReadingBar() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const pct = docHeight > 0 ? Math.min(100, (scrolled / docHeight) * 100) : 0;
    const bar = document.getElementById('readingProgress');
    if (bar) bar.style.width = pct + '%';

    // Auto-detect chapter from URL
    const m = window.location.pathname.match(/chapter(\d+)/);
    if (m) this.saveScrollPosition(parseInt(m[1]), pct);

    // Mark as in-progress once 5% read
    if (pct > 5 && m) this.markChapterStarted(parseInt(m[1]));
    // Mark as complete once 90% read
    if (pct > 90 && m) this.markChapterComplete(parseInt(m[1]));
  }

  init() {
    // Throttled scroll listener
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.updateReadingBar();
          ticking = false;
        });
        ticking = true;
      }
    });

    document.addEventListener('DOMContentLoaded', () => {
      this.loadProgress();
    });
  }
}

const progressTracker = new ProgressTracker();

// Exported helper for index.html
function loadProgress() { progressTracker.loadProgress(); }
