# SmartTextbook — Agent Instructions (v3)

## Vision

An HTML-based interactive textbook, hosted on GitHub Pages, teaching **Heat and Mass Transfer**
to polymer science students. Each chapter is a self-contained `.html` file. Students read
sequentially. The textbook helps stuck students through: embedded AI chat with inline answer
evaluation, graduated hints, question pools with retry variants, and interactive parameter widgets.

---

## Core Philosophy

### Voice and Style
- **Clear and precise** — physical intuition first, math second (Feynman style).
- **Lucid prose** — short sentences, active voice, no unnecessary jargon, **no em-dashes**.
- **Logical persuasion** — build arguments brick by brick. Guide learners to discover answers.
- **Analogies lead** — introduce every concept with a 3D-printing or everyday analogy before any equation.

### Primary Analogy: The 3D Printer
The FDM printer is the central teaching device. All three heat transfer modes operate simultaneously:
- **Conduction** — heat travels up the nozzle metal from the heater block toward the cold end
- **Convection** — the part-cooling fan strips heat from each deposited bead
- **Radiation** — the heated bed exchanges infrared with the cooler room walls

Concrete numbers to use: PLA nozzle 190–220°C, ABS 240–270°C, bed 60°C (PLA) / 100°C (ABS),
HDPE k=0.44 W/m·K, PLA k=0.13 W/m·K, ABS k=0.17 W/m·K, nylon k=0.25 W/m·K.

### Pedagogical Sequence (every concept)
1. **Motivation** — a real problem from printing, processing, or lab work
2. **Physical law** — stated plainly in words first, then symbols
3. **Application** — worked on the motivating problem with real numbers
4. **Derivation on demand** — rigorous derivation in a collapsible `.derivation-box`

Shell balance derivations belong in derivation boxes in Ch. 1–2.
From Ch. 3 onward, shell balances appear in the main text as the primary derivation tool.

### Clean Number Policy for Numerical Problems
Every calculation problem must be designed so that the arithmetic is tractable by hand and the
answer comes out to a clean number. This is a hard requirement, not a preference.

Rules:
1. **Work backwards.** Pick a clean answer first (e.g., 500 W, 2.0 W/m²K, 75°C), then choose
   geometry and material properties that produce it. Never start with real-world values and
   accept whatever answer falls out.
2. **Input values should be round.** Use 100 W/m² not 109 W/m²; use 0.25 W/mK not 0.247 W/mK;
   use 0.010 m not 0.0103 m. Round to 1-2 significant figures where physically reasonable.
3. **Physical constants stay exact.** Do not round sigma = 5.67e-8 W/m²K⁴, R = 8.314 J/molK,
   or similar universal constants. Instead, choose temperatures and areas that make the
   constant cancel cleanly.
4. **T^4 calculations.** Choose temperatures in whole hundreds of Kelvin where possible
   (200 K, 300 K, 400 K). These give T^4 values that are multiples of easy powers:
   300^4 = 8.1e9, 200^4 = 1.6e9. Avoid temperatures like 387 K.
5. **Answers to 3 significant figures maximum.** If a correctly-set-up problem produces
   an answer like 4837.2 W, redesign the inputs until the answer is 4800 W or 5000 W.
6. **Intermediate steps should also be clean.** A student who follows the right method
   should get a clean number at each step, not just the final answer.
7. **Verification.** All answers must be verified in Python before embedding in the HTML.
   Record the verified value in the Verified Answers table in this file.

### Chapter 13: Convective Mass Transfer
The direct analogue of Chapter 9 (Forced Convection) for mass transfer. Introduce the film
theory picture first — concentration drops across a thin stagnant layer, just as temperature
drops across a thermal boundary layer. Then develop Sherwood, Schmidt, and Stanton numbers
using the heat-mass analogy. Polymer applications: hollow-fiber dialysis, spinning-line mass
transfer, membrane contactors.

### Chapter 14: Membrane Transport and Separation
Dedicated to the solution-diffusion model and the three permeation parameters: permeability P,
diffusivity D, and solubility S (P = D x S). Partition coefficients determine S; free-volume
theory governs D (already covered in Ch. 12, explicitly link back). Cover selectivity, the
permeability-selectivity trade-off (Robeson upper bound), reverse osmosis, dialysis, and gas
separation membranes. This is the chapter most directly useful to a practising polymer
scientist and should not be short-changed.

### Chapter 16: Polymer Nanopore Translocation
Keep this chapter as the capstone. It is not standard undergraduate content, but it is a
legitimate and growing research area that polymer scientists encounter. It unifies mass transfer
(diffusion through a confined channel), heat transfer (Joule heating in the pore), and polymer
dynamics. Treat it as an advanced capstone that rewards students who have completed the rest of
the course. Placed last, its difficulty is appropriate to where students are in the course.

---

## Recall-First Pedagogy

### The Goal: Recall Fluency, Not Recognition

The course aims to eliminate "I know it, but I don't know it off the top of my head."
Recognition (identifying the right equation when shown it) and recall fluency (producing
it cold, under pressure, in Junior Lab) are completely different cognitive states. This
textbook is designed to build recall fluency through repeated, low-stakes retrieval practice.

**Why this matters:** In Junior Lab, Unit Ops Lab, and Kinetics, no one hands a student
a formula sheet. When a reactor runs hot, a membrane underperforms, or a cooling curve
looks wrong, the student must diagnose in real time — selecting the relevant transfer
mechanism, recalling the governing equation, estimating the limiting resistance, and
proposing a fix. That requires knowledge that is owned, not looked up.

### Mechanism: The Testing Effect

The single most evidence-backed intervention for long-term retention is **forced retrieval**.
Attempting to recall something — even failing — builds memory traces more durably than
re-reading the correct answer does. Every chapter therefore opens with a Cold Recall Quiz
that asks for previous-chapter equations before the student reads any new content. The
struggle is the learning.

### Problem Difficulty Labels: Type 1 / 2 / 3

Replace the labels "Easy / Medium / Hard" in all chapters with the following:

- **Type 1** — single equation, direct substitution. A student who knows the equation solves it in ≤ 3 min. CSS class: `diff-easy`, displayed text: `Type 1`.
- **Type 2** — two or more steps, or requires choosing which resistance dominates, or combining two formulas. CSS class: `diff-medium`, displayed text: `Type 2`.
- **Type 3** — derive from first principles, diagnose an open-ended scenario, or connect multiple chapters explicitly. CSS class: `diff-hard`, displayed text: `Type 3`.

CSS class names (`diff-easy`, `diff-medium`, `diff-hard`) remain unchanged (they control
colour). Only the displayed text changes. This labelling helps students triage exam time
without the psychological weight of "Easy / Hard."

### Cross-Chapter Bridge Problems

Every chapter from Ch. 2 onward should have one **Bridge Problem** (labelled B1) at the
end of Part B. A bridge problem:
- Does **not** announce which chapter or equation applies — students must diagnose first
- Frames the scenario as something the student will encounter in Junior Lab, Unit Ops Lab, or Kinetics
- Asks the student to (a) identify the limiting mechanism, (b) write the relevant equation, (c) estimate or calculate, and (d) propose a diagnostic or corrective action
- Uses AI Feedback (not auto-graded) because answers are open-ended
- Uses the `.bridge-problem` HTML component (see Component Reference)

These problems are the highest-leverage item for building the judgment that shows up in lab.

### Graduated Formula Policy

The formula burden on students should decrease over the semester as internalization builds:

| Stage | Formula Policy |
|-------|---------------|
| Ch. 1–4 problem sets | Formula provided inline in the problem text — students are learning the canon |
| Midterm exam | Only universal constants (σ, π, ln 2) — formulas recalled from memory |
| Ch. 5–14 problem sets | Formula given as a grey "Use: …" reminder hint below the problem; students should aim to recall without reading it |
| Final exam | No formulas provided — students write equations from scratch as part of demonstrating mastery |

Document this trajectory in the course introduction so students know what is expected at each stage.

### Cold Recall — Recommended Items per Chapter

When building or revising a chapter, include a Cold Recall Quiz covering these prior equations:

| Chapter | Recall from Prior Chapters |
|---------|---------------------------|
| Ch. 1 | (first chapter — activate prior physics knowledge: what is temperature? what is energy flux?) |
| Ch. 2 | Fourier's law (form + units + sign); Newton's law of cooling (Q = hAΔT, what h means) |
| Ch. 3 | Fourier's law; flat-wall resistance R'' = L/k; series resistance R''_total = ΣR''_i |
| Ch. 4 | Steady-state heat equation (d²T/dx² = 0 for no heat gen); shape of T profile; critical radius definition |
| Ch. 5 | Fourier's law; composite resistance in series; convective resistance R'' = 1/h |
| Ch. 6 | T_max in heat-generating slab; composite wall with convection; Newton's law |
| Ch. 7 | Thermal diffusivity α = k/(ρcₚ) and its physical meaning; k values for PLA, HDPE, steel |
| Ch. 8 | α definition; Newton's law (role of h); what the Biot number compares |
| Ch. 9 | Newton's law (h); what sets h (fluid, velocity, geometry); Bi number |
| Ch. 10 | h from forced convection; what makes convection "natural"; buoyancy role |
| Ch. 11 | Fourier's law (template for Fick); what diffusivity D means; analogy q↔N, k↔D, T↔C |
| Ch. 12 | Fick's 1st law; Fick's 2nd law; what concentration profile looks like at steady state |
| Ch. 13 | Fick's 1st law; k_m = D/δ; series resistance concept from Ch. 2 |
| Ch. 14 | k_m from Ch. 13; solution-diffusion concept; series resistance 1/K_ov = Σ(1/k_m) |

---

## Chapter Structure (Template)

### 0. Cold Recall Quiz (place before the Opening Hook)
- **Purpose:** Force retrieval of previous-chapter equations before new content arrives.
  The struggle of failing to recall is itself the most important learning event.
- **Content:** 3–5 questions, each asking the student to write a key equation from memory.
  Use the "Recommended Items per Chapter" table in the Recall-First Pedagogy section above.
- **Format:** Each item has a `<textarea>` for the student's attempt + "Reveal Answer" button.
  The revealed answer states the equation, defines every symbol, and gives polymer-relevant units.
- **Framing:** "Close your notes. Try each question from memory. The ones you can't recall are
  exactly what this chapter will reinforce."
- Uses the `.cold-recall` HTML component (see Component Reference).
- Ch. 1 is the exception: use activation questions about prior physics knowledge instead.

### 1. Opening Hook (200–300 words)
- Concrete 3D-printing or polymer processing scenario
- Pose the central question the chapter answers
- No em-dashes; short, punchy sentences

### 2. Conceptual Sections (800–1200 words total)
- Pattern per concept: analogy → physical insight → formal law → polymer example
- `<div class="spotlight">` — green boxes for 3D printing / polymer connections
- `<div class="info-box">` — blue boxes for key clarifications
- `<div class="warning-box">` — amber boxes for common mistakes
- `<div class="derivation-box">` — purple collapsible boxes for rigorous derivations

### 3. Mathematical Framework
- State equations in words first, then symbols
- `<div class="equation-block">` with KaTeX math
- Define every symbol with units

### 4. Interactive Widget (at least one per chapter)
- Place after the relevant equation, before worked examples
- See widget component reference below
- Particularly important in: Ch. 2 (resistance sliders), Ch. 8 (animated cooling curve), Ch. 11 (diffusion animation)

### 5. Worked Examples (`<div class="worked-example">`)
- 2–3 per chapter with full solutions and physical commentary
- Each gets a `<div class="hint-container">` with 2–3 graduated hints

### 6. Question Pools (inline MC with retry)
- Each pool: 2–3 variant questions + `.pool-solution` at exhaustion

### 7. Problem Set
- **Part A — Conceptual** (C1–C5): each has a textarea + "Get AI Feedback" button.
  Label each with `<span class="problem-difficulty diff-easy">Type 1</span>` (or Type 2/3).
- **Part B — Calculation** (P1–P5): auto-graded, no number spinners, verified answers.
  Label each with Type 1 / Type 2 / Type 3.
  - Ch. 1–4: provide the formula inline in the problem text (learning phase).
  - Ch. 5+: provide formula as grey "Use: …" hint below the problem statement.
- **Part B — Bridge Problem** (B1, strongly encouraged from Ch. 2 onward):
  One open-ended cross-chapter scenario. No equation announced. Framed as a Junior Lab /
  Unit Ops / Kinetics situation. Uses AI Feedback, not auto-grading.
  Uses `<div class="problem bridge-problem">` component (see Component Reference).

### 8. Chapter Summary
- Key takeaways in prose (not bullet lists)
- Key equations (boxed KaTeX) — these are the items that will appear in future Cold Recall Quizzes
- "In the next chapter…" bridge
- Brief note: "By the final exam, you will be expected to write these equations from memory."

---

## File Structure

```
SmartTextbookClaudeOnline/
├── index.html
├── agent-instructions.md
├── chatbot_server.py           ← Flask proxy: port 5000 → Ollama 11434
├── css/
│   └── textbook-styles.css
├── js/
│   ├── chapter-nav.js          ← TOC scroll-spy + AI chat + evaluateConceptualAnswer()
│   ├── progress-tracker.js     ← localStorage progress
│   ├── hint-system.js          ← (legacy; merged into quiz-engine.js)
│   └── quiz-engine.js          ← MC pools, calc grading, hint system, derivation toggles
└── chapters/
    ├── chapter1.html           ← ✅ Complete
    ├── chapter2.html           ← 🔲 Pending
    └── ...
```

---

## Design System (Apple-Minimalist)

```css
--blue:       #0071e3;   /* primary actions */
--text:       #1d1d1f;   /* primary text */
--text-2:     #3d3d3f;
--text-3:     #6e6e73;
--bg:         #ffffff;
--bg-alt:     #f5f5f7;
--bg-deep:    #1d1d1f;   /* hero / footer */
--border:     #d2d2d7;
--green:      #1c7c4a;   /* spotlight boxes */
--green-light:#e9f5ee;
--purple:     #af52de;   /* derivation boxes */
--orange:     #c93b00;   /* warning boxes */
--r12: 12px; --r16: 16px;
--font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Nav: frosted glass (`backdrop-filter: saturate(180%) blur(20px)`).
Buttons: pill-shaped (`border-radius: 20px`). Cards: `border-radius: 12–16px`, subtle shadow.

---

## HTML Component Reference

### Equation Block
```html
<div class="equation-block">
  <div class="eq-label">Fourier's Law</div>
  <span class="eq-number">(2.1)</span>
  $$q = -k\frac{dT}{dx}$$
  <div class="eq-desc"><em>q</em> = heat flux (W/m²), <em>k</em> = conductivity (W/m·K)</div>
</div>
```

### Spotlight Box
```html
<div class="spotlight">
  <strong>3D Printing Connection</strong>
  <p>Connection to printer or polymer world.</p>
</div>
```

### Derivation Box (collapsible)
```html
<div class="derivation-box">
  <button class="derivation-toggle">
    <span>Where does this come from? (Shell balance derivation)</span>
    <span class="arrow">▼</span>
  </button>
  <div class="derivation-body">
    <!-- step-by-step with KaTeX -->
  </div>
</div>
```
Toggle JS is in `quiz-engine.js` DOMContentLoaded listener.

### Interactive Widget
Each widget is a self-contained HTML + inline `<script>` block. Use SVG (not Canvas) for
math diagrams — it scales cleanly on all screens. Sliders update results in real time via
`input` event listeners. No external libraries needed.

```html
<div class="interactive-widget">
  <div class="widget-title">Explore: Thermal Resistance</div>
  <div class="widget-body">
    <div class="widget-controls">
      <div class="slider-row">
        <label>Thickness <em>L</em></label>
        <input type="range" id="w-L" min="0.001" max="0.1" step="0.001" value="0.025">
        <span class="slider-val" id="w-L-val">25 mm</span>
      </div>
      <div class="slider-row">
        <label>Conductivity <em>k</em></label>
        <input type="range" id="w-k" min="0.05" max="5" step="0.01" value="0.44">
        <span class="slider-val" id="w-k-val">0.44 W/m·K</span>
      </div>
    </div>
    <div class="widget-output">
      <span class="widget-result-label">Heat flux</span>
      <span class="widget-result-value" id="w-flux">—</span>
      <span class="widget-result-unit">W/m²</span>
    </div>
    <svg id="w-svg" viewBox="0 0 300 120" xmlns="http://www.w3.org/2000/svg">
      <!-- updated by JS -->
    </svg>
  </div>
</div>
<script>
(function() {
  const Lslider = document.getElementById('w-L');
  const kSlider = document.getElementById('w-k');
  const dT = 170; // fixed ΔT for this widget

  function update() {
    const L = parseFloat(Lslider.value);
    const k = parseFloat(kSlider.value);
    const flux = k * dT / L;
    document.getElementById('w-L-val').textContent = (L * 1000).toFixed(0) + ' mm';
    document.getElementById('w-k-val').textContent = k.toFixed(2) + ' W/m·K';
    document.getElementById('w-flux').textContent = flux.toFixed(0);
    // update SVG colours proportionally...
  }
  Lslider.addEventListener('input', update);
  kSlider.addEventListener('input', update);
  update();
})();
</script>
```

Widget CSS (already in textbook-styles.css):
```css
.interactive-widget { background: var(--bg-alt); border-radius: var(--r16); padding: 1.25rem; margin: 1.5rem 0; }
.widget-title { font-weight: 700; font-size: .9rem; color: var(--blue); margin-bottom: .875rem; }
.widget-body { display: flex; flex-direction: column; gap: 1rem; }
.widget-controls { display: flex; flex-direction: column; gap: .625rem; }
.slider-row { display: flex; align-items: center; gap: .75rem; font-size: .85rem; }
.slider-row label { min-width: 130px; color: var(--text-2); }
.slider-row input[type=range] { flex: 1; }
.slider-val { min-width: 70px; font-weight: 600; font-size: .85rem; color: var(--blue); }
.widget-output { display: flex; align-items: baseline; gap: .375rem; }
.widget-result-label { font-size: .85rem; color: var(--text-3); }
.widget-result-value { font-size: 1.5rem; font-weight: 700; color: var(--text); }
.widget-result-unit { font-size: .85rem; color: var(--text-3); }
```

### Conceptual Problem with AI Evaluation
```html
<div class="problem">
  <div class="problem-header">
    <div class="problem-number">C1</div>
    <span class="problem-difficulty diff-easy">Easy</span>
  </div>
  <p>Question text here.</p>
  <div class="concept-answer-area">
    <textarea class="concept-input" placeholder="Write your answer here…" rows="3"></textarea>
    <button class="concept-submit-btn btn btn-sm btn-primary">Get AI Feedback</button>
    <div class="concept-feedback"></div>
  </div>
  <!-- optional hint-container -->
</div>
```
The `evaluateConceptualAnswer()` function in `chapter-nav.js` handles the button click.
It sends the question text + student answer to the AI tutor and renders feedback inline.
Offline fallback: shows amber box with hint text.

### Calculation Problem (no spinner)
```html
<div class="problem" data-pid="UNIQUE_PID">
  <div class="problem-header">
    <div class="problem-number">P1</div>
    <span class="problem-difficulty diff-easy">Easy</span>
  </div>
  <p>Problem statement with all given values.</p>
  <div class="calc-answer">
    <span>q =</span>
    <input class="calc-input" type="number" placeholder="your answer"
      data-answer="VERIFIED_VALUE" data-tolerance="0.02">
    <span class="calc-unit">W/m²</span>
    <button class="calc-check-btn btn btn-sm btn-primary">Check</button>
  </div>
  <div class="calc-result"></div>
</div>
```
Note: number spinners are hidden globally via CSS (`-webkit-inner-spin-button: none`).
Students type their answer directly.

### Question Pool (MC with retry)
```html
<div class="question-pool" data-pool-id="QP1">
  <div class="pool-dots">
    <span class="pool-dot active"></span>
    <span class="pool-dot"></span>
  </div>
  <div class="pool-transition-msg"></div>
  <div class="attempt-indicator"></div>

  <div class="pool-question active quiz-question" data-qid="QP1_v1">
    <p class="q-text">Question variant 1?</p>
    <ul class="quiz-options">
      <li class="quiz-option">
        <input type="radio" name="QP1_v1" id="QP1_v1_a"
          data-correct="true" data-explanation="Why A is correct.">
        <label for="QP1_v1_a">Option A</label>
      </li>
      <!-- b, c, d ... -->
    </ul>
    <button class="check-btn btn btn-sm btn-primary">Check Answer</button>
    <div class="quiz-feedback"></div>
  </div>

  <div class="pool-question quiz-question" data-qid="QP1_v2">
    <!-- variant 2 -->
  </div>

  <div class="pool-solution">
    <h4>Worked Solution</h4>
    <p>Full explanation shown after pool is exhausted.</p>
  </div>
</div>
```

### Cold Recall Quiz
```html
<div class="cold-recall">
  <div class="cold-recall-header">
    <span class="cold-recall-icon">&#9997;</span>
    <div>
      <strong>Cold Recall &mdash; Before You Read</strong>
      <p class="cold-recall-subtext">Close your notes. Try each question from memory, then reveal
      the answer. The ones you cannot recall are exactly what this chapter will reinforce.</p>
    </div>
  </div>

  <div class="recall-item" id="rc-ch2-1">
    <p class="recall-question">Write Fourier&rsquo;s law of heat conduction from memory
    (equation, symbol definitions, units):</p>
    <textarea class="recall-input" rows="2" placeholder="Your answer&hellip;"></textarea>
    <button class="recall-reveal-btn btn btn-sm" onclick="revealRecall('rc-ch2-1')">Reveal Answer</button>
    <div class="recall-answer" id="rc-ch2-1-ans" style="display:none;">
      <strong>Answer:</strong> $q = -k\,\dfrac{dT}{dx}$ &mdash; heat flux $q$ (W/m&sup2;) equals
      negative conductivity $k$ (W/m&middot;K) times the temperature gradient (K/m). The negative
      sign means heat flows <em>down</em> the gradient, from hot to cold.
    </div>
  </div>

  <!-- Add 2–4 more recall-item blocks; use IDs rc-chN-1, rc-chN-2, etc. -->
</div>

<script>
(function() {
  window.revealRecall = function(id) {
    const ans = document.getElementById(id + '-ans');
    const btn = document.querySelector('#' + id + ' .recall-reveal-btn');
    if (!ans || !btn) return;
    const hidden = ans.style.display === 'none';
    ans.style.display = hidden ? 'block' : 'none';
    btn.textContent = hidden ? 'Hide Answer' : 'Reveal Answer';
  };
})();
</script>
```

Cold Recall CSS — add once to `textbook-styles.css`:
```css
.cold-recall {
  background: #f5f0ff;
  border: 1.5px solid var(--purple, #af52de);
  border-radius: var(--r16);
  padding: 1.25rem;
  margin: 0 0 2rem;
}
.cold-recall-header { display: flex; gap: .875rem; align-items: flex-start; margin-bottom: 1rem; }
.cold-recall-icon { font-size: 1.4rem; line-height: 1; }
.cold-recall-header strong { font-size: .95rem; }
.cold-recall-subtext { font-size: .82rem; color: var(--text-3); margin: .25rem 0 0; }
.recall-item { margin-bottom: 1rem; }
.recall-question { font-size: .9rem; font-weight: 600; margin-bottom: .375rem; }
.recall-input {
  width: 100%; border: 1px solid var(--border); border-radius: 8px;
  padding: .5rem .75rem; font-size: .875rem; resize: vertical;
  font-family: var(--font-ui);
}
.recall-reveal-btn { margin-top: .375rem; }
.recall-answer {
  margin-top: .5rem; background: #fff; border-radius: 8px;
  padding: .625rem .875rem; font-size: .875rem;
  border-left: 3px solid var(--purple, #af52de);
}
```

### Bridge Problem
```html
<div class="problem bridge-problem">
  <div class="problem-header">
    <div class="problem-number">B1</div>
    <span class="problem-difficulty diff-bridge">Bridge &rarr; Unit Ops Lab</span>
  </div>
  <p>You are troubleshooting a jacketed reactor in Unit Ops Lab where the polymer inside
  heats more slowly than your energy balance predicts. Without doing a full calculation:
  (a) identify the three thermal resistances between the heating jacket and the polymer core,
  (b) rank them by which is most likely limiting given that the polymer wall is 40 mm thick
  and the jacket-side film coefficient is very high, and (c) describe one measurement you
  would make to confirm your diagnosis.</p>
  <div class="concept-answer-area">
    <textarea class="concept-input" placeholder="Write your diagnosis here&hellip;" rows="5"></textarea>
    <button class="concept-submit-btn btn btn-sm btn-primary">Get AI Feedback</button>
    <div class="concept-feedback"></div>
  </div>
</div>
```

Bridge Problem CSS — add once to `textbook-styles.css`:
```css
.bridge-problem { border-color: var(--blue, #0071e3); border-width: 2px; background: #f0f6ff; }
.diff-bridge {
  background: var(--blue, #0071e3); color: #fff;
  border-radius: 20px; padding: .15rem .75rem;
  font-size: .75rem; font-weight: 600; letter-spacing: .01em;
}
```

### Chat Header with AI Status Dot
```html
<div class="chat-header">
  <div class="chat-header-info">
    <span class="ai-status-dot checking" id="aiStatusDot"></span>
    <div>
      <h3>AI Tutor</h3>
      <span class="ai-status-label" id="aiStatusLabel">Connecting…</span>
    </div>
  </div>
  <button class="chat-close" onclick="toggleChat()">&times;</button>
</div>
```
Status dot colours: green (Ollama direct), yellow (Flask proxy), red (offline).
`checkAIStatus()` in `chapter-nav.js` runs on DOMContentLoaded, pings `/api/tags`.

---

## AI Integration

### Architecture
`chapter-nav.js` tries two endpoints in order:
1. Direct Ollama: `http://localhost:11434/api/chat` (requires `OLLAMA_ORIGINS="*" ollama serve`)
2. Flask proxy: `http://localhost:5000/api/chat` (run `python3 chatbot_server.py`)

Current model: `chemeng-tutor:latest` (set `OLLAMA_MODEL` constant in `chapter-nav.js`).

### Status Check
`checkAIStatus()` pings `http://localhost:11434/api/tags` (lightweight, no model inference).
Sets the dot in the chat header: green / yellow / red.

### Conceptual Answer Evaluation
`evaluateConceptualAnswer(btn)` in `chapter-nav.js`:
- Reads question text and student textarea value from the same `.problem` container
- Sends a structured prompt to the AI: evaluate correctness, identify gaps, one improvement suggestion
- Renders feedback inline in `.concept-feedback` div (no chat panel needed)
- Offline fallback: amber box with hint text from the problem's `.hint-step` elements

### Chat Widget
- Chat panel opens by default on chapter pages (`style="display:block"`)
- Students can close it; it reopens via the floating bubble
- `sendGlobalChatMessage()` handles free-form questions
- History: last 8 turns from DOM, passed as message array to Ollama

### System Prompt Philosophy
The tutor should:
1. Use 3D printing analogies first, then polymer science, then abstract math
2. Keep answers to 3–5 sentences unless a derivation is requested
3. Ask leading questions rather than giving answers directly
4. Try a different analogy if the student asks the same thing twice
5. Reference the current chapter context (injected via `buildSystemPrompt(chapterContext)`)

---

## Interactive Widget Strategy

### When to Use
- Every chapter should have at least one widget
- Sliders updating formulas in real time are the primary format
- Animations (using `requestAnimationFrame`) for transient phenomena

### Key Widgets by Chapter
| Chapter | Widget | What changes |
|---------|--------|--------------|
| Ch. 2 | Thermal resistance explorer | L, k, ΔT → flux + SVG slab colour |
| Ch. 3 | Boundary condition visualizer | BC type toggle → temperature profile shape |
| Ch. 4 | Cylinder resistance slider | r1, r2, k → R_cyl + heat flux |
| Ch. 8 | **Animated cooling curve** | Bi, Fo → T(t) animation + profile |
| Ch. 9 | Boundary layer thickness | Re, Pr → δ_T / δ |
| Ch. 11 | Diffusion animation | D, time → concentration profile animation |
| Ch. 13 | Mass transfer coefficient explorer | Re, Sc → Sh, k_m + boundary layer visual |
| Ch. 14 | Membrane permeability slider | P, D, S → flux + selectivity map |

### Implementation Rules
- Self-contained: each widget is a `<div>` + inline `<script>` block
- Use SVG (not Canvas) for static diagrams; use Canvas for animations
- Wrap JS in an IIFE `(function(){...})()` to avoid polluting global scope
- No external libraries
- Mobile-friendly: use `width: 100%` on SVG with `viewBox`

---

## Progress Tracking

All progress stored in `localStorage` key `smarttextbook_progress`:
```json
{
  "quizzes": { "QP1_v1": { "correct": true, "timestamp": 1234567890 } },
  "calcs":   { "p1_ch1": { "correct": false, "attempts": 2 } }
}
```
`showProgressReport()` in `chapter-nav.js` → reads localStorage → `alert()` summary.
`<button class="progress-report-btn">` placed bottom-right of each chapter.

---

## Deployment

### Local
```bash
# Tab 1: Ollama (with CORS)
OLLAMA_ORIGINS="*" ollama serve

# Tab 2: File server
cd ~/Downloads
python3 -m http.server 8080

# Open:
open http://localhost:8080/SmartTextbookClaudeOnline/index.html
```
Flask proxy only needed if CORS is blocked:
```bash
python3 ~/Downloads/SmartTextbookClaudeOnline/chatbot_server.py
```

### GitHub Pages
Push to GitHub → Settings → Pages → Source: main branch, root `/`.
AI chat shows offline message gracefully; all other features work without internet.

---

## Verified Calculation Answers — Chapter 8

| Problem | Setup | Answer |
|---------|-------|--------|
| P1 | HDPE film, Lc=0.001 m, k=0.44, ρ=950, cp=2000, h=19 | Bi=0.043 ✓; **τ = 100 s** |
| P2 | Nylon sphere r=5 mm, Lc=r/3, k=0.25, h=200 | **Bi = 1.33 → lumped cap fails** |
| P3 | τ=100 s, Ti=200°C, T∞=20°C, at t=τ | **T = 86.2°C** |
| P4 | τ=200 s, Ti=200°C, T∞=0°C, at t=600 s (3τ) | **T = 9.96°C ≈ 10°C** |
| P5 | τ=80 s, Ti=160°C, T∞=20°C, target T=60°C | **t = 100 s** (ln(7/2)=1.253) |

---

## Verified Calculation Answers — Chapter 1

| Problem | Setup | Answer |
|---------|-------|--------|
| P1 | HDPE, k=0.44, L=0.025 m, ΔT=170°C | **2992 W/m²** |
| P2 | PLA radiation, ε=0.92, Ts=353 K, Tr=295 K | **415 W/m²** |
| P3 | Convection, h=18, A=0.08 m², ΔT=45°C | **64.8 W** |
| P4 | Nylon ε=0.88, radiation fraction at 120°C vs 30°C | **39%** |
| P5 | Foam k=0.033, ΔT=58°C, q_max=30 W/m² | **63.8 mm** |

---

## Chapter Progression

### Phase 1: Heat Transfer Foundations (Ch. 1–4)
- **Ch. 1** ✅ Introduction — three modes, rate equations, 3D printer as unified example
- **Ch. 2** ✅ Thermal Resistance — electrical analogy, multilayer walls, cylindrical shells
- **Ch. 3** ✅ General Heat Conduction Equation — derivation, BCs, limiting cases
- **Ch. 4** ✅ 1-D Steady-State Solutions — cylinders, spheres, critical radius, fins

### Phase 2: Polymer Processing Applications (Ch. 5–7)
- **Ch. 5** 🔲 Heat Transfer in Polymer Extrusion
- **Ch. 6** 🔲 Heat Transfer in Injection Molding
- **Ch. 7** 🔲 Thermal Characterisation (DSC, TGA, TMA)

### Phase 3: Transient Conduction and Convection (Ch. 8–10)
- **Ch. 8** ✅ Transient Conduction — lumped capacitance, animated cooling curves
- **Ch. 9** 🔲 Forced Convection — boundary layers, Nusselt correlations
- **Ch. 10** 🔲 Natural Convection — buoyancy, polymer melt pools

### Phase 4: Mass Transfer (Ch. 11–14)
- **Ch. 11** 🔲 Molecular Diffusion — Fick's laws, analogy with Fourier
- **Ch. 12** 🔲 Diffusion in Polymers — free volume, solvent uptake, anomalous transport
- **Ch. 13** 🔲 Convective Mass Transfer — film theory, Sherwood and Schmidt numbers (new)
- **Ch. 14** 🔲 Membrane Transport and Separation — solution-diffusion, permeability, selectivity, partition coefficients, RO and gas separation (new)

### Phase 5: Advanced Topics (Ch. 15–16)
- **Ch. 15** 🔲 Coupled Heat and Mass Transfer — drying, reactive extrusion, Lewis number
- **Ch. 16** 🔲 Polymer Nanopore Translocation — Joule heating, confinement, sequencing (capstone)

### Exam Milestones
- **Midterm Practice** 🔲 — instructor only, covers Ch. 1–7 (heat transfer foundations + polymer processing)
- **Midterm Exam** 🔲 — instructor only, password protected, covers Ch. 1–7
- **Final Practice** 🔲 — instructor only, covers Ch. 1–16 (full course)
- **Final Exam** 🔲 — instructor only, password protected, covers Ch. 1–16

---

## Exam Pages

### LSU Semester Context
This textbook is designed for use at LSU. The academic calendar follows Louisiana state holidays:
- **Mardi Gras break** falls in late February or early March (Fat Tuesday varies year to year)
- **Midterm grade deadline** is typically around week 8 of the Spring semester
- The midterm exam should therefore be administered in week 7–8, shortly after Mardi Gras break

Given ~1 chapter per week, by the midterm students will have covered Ch. 1–7:
Phase 1 (Ch. 1–4: heat transfer foundations) and Phase 2 (Ch. 5–7: polymer processing).
This is a clean conceptual break — all of steady-state and processing heat transfer, before
transient conduction and convection begin.

### Instructor-Only Policy
All four exam pages (midterm practice, midterm exam, final practice, final exam) are for
**instructor use only**. They are not student-facing resources.

- In index.html, exam sections are clearly labelled "Instructor Resources — Not for Students"
- The pages are designed to be **printed and distributed** as paper exams, not completed online
- The password gate prevents accidental student access when the URL is shared
- The AI chat and progress tracker are disabled on all exam pages
- Exam pages should have a print-friendly CSS block (`@media print`) that hides the nav,
  password gate, and all interactive widgets, leaving clean printable questions

### File Locations
```
chapters/midterm-practice.html   ← instructor only, printable
chapters/midterm-exam.html       ← instructor only, password protected, printable
chapters/final-practice.html     ← instructor only, printable
chapters/final-exam.html         ← instructor only, password protected, printable
```

### Scope
- **Midterm** covers Chapters 1–7 (heat transfer foundations + polymer processing applications).
  Placed in index.html between Phase 2 and Phase 3.
- **Final** covers Chapters 1–16 (full course). Placed in index.html after Phase 5.

### Structure of Each Exam Page
Practice pages:
- Print-friendly layout: no sidebar, no chat, no progress button
- 10 conceptual short-answer questions (C1–C10)
- 10 calculation problems (P1–P10) with answer key shown at the bottom (print: hidden, toggle: visible)
- All answers follow clean number policy; verified in Python

Exam pages (password protected):
- Same question set as practice, different numerical values
- Password gate blocks all content before unlock
- No answer key, no hints, no worked solutions
- Print-optimised: on print, password gate is hidden, content fills the page cleanly
- Timer shown on screen (non-blocking) but does not appear on print

### Password Gate Pattern
```html
<div id="password-gate" style="
  position:fixed; inset:0; background:var(--bg);
  display:flex; align-items:center; justify-content:center; z-index:9999;">
  <div style="max-width:400px; width:90%; text-align:center; padding:2rem;">
    <h2 style="margin-bottom:.5rem;">Midterm Exam</h2>
    <p style="color:var(--text-3); margin-bottom:1.5rem; font-size:.9rem;">
      Enter the password provided by your instructor to begin.
    </p>
    <input id="pw-input" type="password" placeholder="Password"
      style="width:100%; padding:.625rem 1rem; border:1px solid var(--border);
             border-radius:8px; font-size:1rem; margin-bottom:.75rem;"
      onkeypress="if(event.key==='Enter') checkPassword()">
    <button class="btn btn-primary" onclick="checkPassword()"
      style="width:100%;">Begin Exam</button>
    <p id="pw-error" style="color:#c93b00; font-size:.85rem;
       margin-top:.625rem; display:none;">Incorrect password. Try again.</p>
  </div>
</div>
<script>
function checkPassword() {
  const input = document.getElementById('pw-input').value.trim();
  const hash  = 'hmt2026jlawrence'; // store plaintext for static hosting; upgrade to hash if needed
  if (input === hash) {
    document.getElementById('password-gate').style.display = 'none';
    sessionStorage.setItem('exam_unlocked', '1');
  } else {
    document.getElementById('pw-error').style.display = 'block';
    document.getElementById('pw-input').value = '';
  }
}
// Re-lock if navigated back without session
if (!sessionStorage.getItem('exam_unlocked')) {
  document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('password-gate').style.display = 'flex';
  });
}
</script>
```

### Exam Quality Checklist
- [ ] Page header clearly states "Instructor Use Only — Not for Distribution to Students"
- [ ] Practice and exam have the same topics but different numerical values
- [ ] All calculation answers verified in Python with clean number policy applied
- [ ] Password gate renders correctly and blocks all content before unlock (exam pages only)
- [ ] Timer displays on screen but is hidden on print (exam pages only)
- [ ] No hints, AI feedback, chat widget, or progress button on any exam page
- [ ] Answer key present on practice pages; hidden from print via CSS
- [ ] @media print block: hides nav, password gate, timer, answer-key toggles; shows clean questions
- [ ] Page title clearly states "Midterm Exam" / "Final Exam" and "Chapters X–Y"

---

## Quality Checklist (before finalising each chapter)

### Recall-First Layer
- [ ] Cold Recall Quiz present at the top of the chapter (before Opening Hook)
- [ ] Cold Recall items match the "Recommended Items per Chapter" table above (3–5 items)
- [ ] Each recall item has a unique ID (rc-chN-M), textarea, Reveal button, and answer div
- [ ] Reveal answer defines every symbol and gives units — not just the equation symbol
- [ ] At least one Bridge Problem (B1) using `.bridge-problem` + AI Feedback (Ch. 2+)
- [ ] Bridge problem frames scenario as Junior Lab / Unit Ops / Kinetics — not a textbook exercise
- [ ] All C and P problems carry Type 1 / Type 2 / Type 3 labels (text), with correct CSS class
- [ ] Formula policy matches chapter stage: inline (Ch. 1–4) or grey "Use:" hint (Ch. 5+)
- [ ] Chapter Summary ends with: "By the final exam, you will be expected to write these equations from memory."

### Content and Pedagogy
- [ ] Opening hook uses a concrete 3D-printing or polymer scenario
- [ ] Every concept introduced with analogy before equation
- [ ] No em-dashes anywhere in the text
- [ ] At least one interactive widget with working sliders or animation
- [ ] Each quiz concept has a question pool (2+ variants + solution)
- [ ] All C1–C5 have textarea + "Get AI Feedback" button + `.concept-feedback` div
- [ ] Calculation answers verified in Python; spinners hidden via CSS
- [ ] Hint containers have 2–3 graduated hints (direction → equation → setup)
- [ ] Shell balance in collapsible derivation-box (Ch. 1–2) or main text (Ch. 3+)

### Technical
- [ ] Chat header has AI status dot (`aiStatusDot` / `aiStatusLabel`)
- [ ] Chat panel defaults open (`style="display:block"`)
- [ ] Progress report button present (bottom-right)
- [ ] Chapter renders correctly: KaTeX, pools, hints, widgets, chat
- [ ] Internal prev/next chapter links correct
- [ ] No `&sup4;` entities — use Unicode ⁴ directly; `&sup2;` and `&sup3;` are valid, ⁴ is not
- [ ] No stray `$` delimiters in prose near HTML entities (common KaTeX garbling cause)

### Per-Chapter Retrofit Status
When a chapter is revised, update this table:

| Chapter | Cold Recall | Type Labels | Bridge Problem | Formula Policy |
|---------|-------------|-------------|----------------|----------------|
| Ch. 1 | ⬜ | ⬜ | n/a | inline |
| Ch. 2 | ⬜ | ⬜ | ⬜ | inline |
| Ch. 3 | ⬜ | ⬜ | ⬜ | inline |
| Ch. 4 | ⬜ | ⬜ | ⬜ | inline |
| Ch. 8 | ✅ | ✅ | ✅ | grey hint |
| Ch. 11 | ⬜ | ⬜ | ⬜ | grey hint |
| Ch. 12 | ⬜ | ⬜ | ⬜ | grey hint |
| Ch. 13 | ⬜ | ⬜ | ⬜ | grey hint |
| Ch. 14 | ⬜ | ⬜ | ⬜ | grey hint |
