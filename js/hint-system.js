/**
 * SmartTextbook — Hint System
 * Manages graduated, multi-step hints for problems.
 * Hints are revealed one step at a time so students are guided, not given answers.
 */

class HintSystem {
  constructor() {
    this.hintStates = {}; // { hintId: currentStep }
    this.init();
  }

  init() {
    document.addEventListener('click', (e) => {
      const toggle = e.target.closest('.hint-toggle');
      if (toggle) {
        const hintId = toggle.dataset.hintId;
        this.toggleHint(hintId, toggle);
      }

      const nextBtn = e.target.closest('.hint-next-btn');
      if (nextBtn) {
        const hintId = nextBtn.dataset.hintId;
        this.revealNextStep(hintId);
      }
    });
  }

  toggleHint(hintId, toggleEl) {
    const content = document.getElementById(`hint-content-${hintId}`);
    if (!content) return;

    const isOpen = content.classList.contains('visible');
    if (isOpen) {
      content.classList.remove('visible');
      toggleEl.classList.remove('open');
    } else {
      content.classList.add('visible');
      toggleEl.classList.add('open');
      // Show first step if none revealed yet
      if (!(hintId in this.hintStates)) {
        this.hintStates[hintId] = 0;
        this.renderSteps(hintId);
      }
    }
  }

  renderSteps(hintId) {
    const content = document.getElementById(`hint-content-${hintId}`);
    if (!content) return;

    const allSteps = content.querySelectorAll('.hint-step');
    const current = this.hintStates[hintId] || 0;

    allSteps.forEach((step, i) => {
      step.style.display = i <= current ? 'block' : 'none';
    });

    // Update "Next Hint" button
    const nextBtn = content.querySelector('.hint-next-btn');
    if (nextBtn) {
      const hasMore = current < allSteps.length - 1;
      nextBtn.style.display = hasMore ? 'inline-block' : 'none';
      nextBtn.textContent = hasMore
        ? `Reveal Hint ${current + 2} of ${allSteps.length}`
        : 'All hints shown';
    }
  }

  revealNextStep(hintId) {
    const content = document.getElementById(`hint-content-${hintId}`);
    if (!content) return;

    const allSteps = content.querySelectorAll('.hint-step');
    const current = this.hintStates[hintId] || 0;

    if (current < allSteps.length - 1) {
      this.hintStates[hintId] = current + 1;
      this.renderSteps(hintId);
    }
  }
}

/**
 * Build a hint block from a data array.
 * hints: [{ label: "Hint 1", text: "..." }, ...]
 * Returns an HTML string to inject into the page.
 */
function buildHintBlock(hintId, title, hints) {
  const steps = hints.map((h, i) => `
    <div class="hint-step">
      <div class="hint-step-label">${h.label || `Hint ${i + 1}`}</div>
      <p>${h.text}</p>
    </div>
  `).join('');

  return `
    <div class="hint-container">
      <button class="hint-toggle" data-hint-id="${hintId}">
        <span class="hint-icon">💡</span>
        ${title || 'Need a hint?'}
        <span class="hint-arrow">▼</span>
      </button>
      <div class="hint-content" id="hint-content-${hintId}">
        ${steps}
        <button class="hint-next-btn btn btn-sm" data-hint-id="${hintId}" style="margin-top:.75rem;">
          Reveal Hint 2
        </button>
      </div>
    </div>
  `;
}

// Auto-initialise
const hintSystem = new HintSystem();
