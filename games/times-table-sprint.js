// Times Table Sprint - Complete full times tables for a single factor
import { Game } from './math-facts-base.js';
import { showScreen, flash } from '../modules/ui.js';
import { Leaderboard } from '../modules/leaderboard.js';

export default class TimesTableSprint extends Game {
  constructor() {
    super();
    this.gameId = 'times-table-sprint';
    this.leaderboard = new Leaderboard(this.gameId);

    this.state = {
      selectedFactor: null,
      running: false,
      currentIndex: 0, // 0-11 for problems 1×n through 12×n
      problems: [], // Array of {a, b, result, completed, timeMs}
      startTime: null,
      elapsedMs: 0,
      timerHandle: null,
    };

    this.currentAnswer = ''; // Track current answer being typed
    this.elements = {};
    this.boundKeydownHandler = null;
  }

  async init(container) {
    this.container = container;
    this.setupHTML();
    this.bindEvents();
    this.renderFactorGrid();
    this.leaderboard.renderBoard(this.elements.board1);

    // Add exit button to game screen
    this.addExitButton(this.elements.scrGame, 'hud');

    showScreen(this.elements.scrStart, [this.elements.scrStart, this.elements.scrGame, this.elements.scrEnd]);
  }

  setupHTML() {
    this.container.innerHTML = `
      <!-- START SCREEN -->
      <section class="screen" data-screen="start">
        <h1 class="app-title">Times Table Sprint</h1>
        <p class="tagline">Complete all 12 problems for a times table as fast as you can!</p>

        <div class="card">
          <h2 class="section-title">Choose a factor</h2>
          <div class="factor-grid" role="group" aria-label="Factor selection">
          </div>
          <p class="hint">Pick a factor to practice its complete times table (1× through 12×).</p>
        </div>

        <div class="actions">
          <button class="btn-start cta" disabled>Start</button>
          <button class="btn-home-start pill">Home</button>
        </div>

        <section class="card">
          <h2 class="section-title">Leaderboard</h2>
          <div class="board"></div>
          <div class="board-actions">
            <button class="btn-reset pill danger small" title="Clear saved scores from this browser">Reset Leaderboard</button>
          </div>
        </section>
      </section>

      <!-- GAME SCREEN -->
      <section class="screen hidden" data-screen="game" aria-live="polite">
        <header class="hud">
          <div class="hud-item">
            <div class="sprint-timer" role="timer" aria-live="polite">0.0</div>
            <div class="hud-label">seconds</div>
          </div>
          <div class="hud-item">
            <div class="sprint-progress stat">0 / 12</div>
            <div class="hud-label">complete</div>
          </div>
        </header>

        <div class="sprint-layout">
          <div class="problems-column">
            <div class="problems-grid" aria-label="Times table problems">
              <!-- Problems will be generated here -->
            </div>
          </div>

          <div class="keypad-column">
            <div class="keypad" aria-label="On-screen keypad">
              <button class="key">7</button>
              <button class="key">8</button>
              <button class="key">9</button>
              <button class="key">4</button>
              <button class="key">5</button>
              <button class="key">6</button>
              <button class="key">1</button>
              <button class="key">2</button>
              <button class="key">3</button>
              <button class="key zero">0</button>
              <button class="key back" aria-label="Delete last">⌫</button>
              <button class="key enter" aria-label="Submit answer">Enter</button>
            </div>
          </div>
        </div>
      </section>

      <!-- END SCREEN -->
      <section class="screen hidden" data-screen="end">
        <h2>Complete!</h2>
        <div class="summary card">
          <div class="summary-row"><span>Factor:</span><strong class="sum-factor">—</strong></div>
          <div class="summary-row"><span>Total time:</span><strong class="sum-time">0.0s</strong></div>
        </div>

        <div class="actions">
          <button class="btn-play-again cta">Play again</button>
          <button class="btn-home pill">Home</button>
        </div>

        <section class="card">
          <h2 class="section-title">Leaderboard</h2>
          <div class="board2"></div>
        </section>
      </section>
    `;

    // Cache element references
    this.elements = {
      scrStart: this.container.querySelector('[data-screen="start"]'),
      scrGame: this.container.querySelector('[data-screen="game"]'),
      scrEnd: this.container.querySelector('[data-screen="end"]'),
      factorGrid: this.container.querySelector('.factor-grid'),
      btnStart: this.container.querySelector('.btn-start'),
      btnHomeStart: this.container.querySelector('.btn-home-start'),
      timerEl: this.container.querySelector('.sprint-timer'),
      progressEl: this.container.querySelector('.sprint-progress'),
      problemsGrid: this.container.querySelector('.problems-grid'),
      keypad: this.container.querySelector('.keypad'),
      sumFactor: this.container.querySelector('.sum-factor'),
      sumTime: this.container.querySelector('.sum-time'),
      btnAgain: this.container.querySelector('.btn-play-again'),
      btnHome: this.container.querySelector('.btn-home'),
      board1: this.container.querySelector('.board'),
      board2: this.container.querySelector('.board2'),
      btnReset: this.container.querySelector('.btn-reset'),
    };
  }

  bindEvents() {
    // Factor selection will be bound when grid is rendered

    // Game controls
    this.elements.btnStart.addEventListener('click', () => this.startRun());
    this.elements.btnAgain.addEventListener('click', () => {
      // Return to start screen to reselect factor
      showScreen(this.elements.scrStart, [this.elements.scrStart, this.elements.scrGame, this.elements.scrEnd]);
    });
    this.elements.btnHome.addEventListener('click', () => this.goHome());
    this.elements.btnHomeStart.addEventListener('click', () => this.goHome());

    // Keypad
    this.elements.keypad.addEventListener('click', (e) => this.handleKeypadClick(e));

    // Keyboard support
    this.boundKeydownHandler = (e) => this.handleKeydown(e);
    document.addEventListener('keydown', this.boundKeydownHandler);

    // Leaderboard
    this.elements.btnReset.addEventListener('click', () => {
      this.leaderboard.clear();
      this.leaderboard.renderBoard(this.elements.board1);
      this.leaderboard.renderBoard(this.elements.board2);
    });
  }

  renderFactorGrid() {
    this.elements.factorGrid.innerHTML = '';
    for (let n = 1; n <= 12; n++) {
      const btn = document.createElement('button');
      btn.className = 'factor-chip';
      btn.textContent = `${n}×`;
      btn.dataset.factor = String(n);
      btn.addEventListener('click', () => {
        this.selectFactor(n);
        this.updateFactorChips();
      });
      this.elements.factorGrid.appendChild(btn);
    }
  }

  selectFactor(n) {
    this.state.selectedFactor = n;
    this.elements.btnStart.disabled = false;
  }

  updateFactorChips() {
    this.container.querySelectorAll('.factor-chip').forEach(btn => {
      const factor = Number(btn.dataset.factor);
      btn.classList.toggle('selected', factor === this.state.selectedFactor);
    });
  }

  startRun() {
    if (this.state.selectedFactor === null) {
      return;
    }

    // Initialize problems
    this.state.problems = [];
    for (let a = 1; a <= 12; a++) {
      this.state.problems.push({
        a: a,
        b: this.state.selectedFactor,
        result: a * this.state.selectedFactor,
        completed: false,
        timeMs: 0
      });
    }

    this.state.running = true;
    this.state.currentIndex = 0;
    this.state.startTime = Date.now();
    this.state.elapsedMs = 0;

    // Render problems grid
    this.renderProblemsGrid();

    // Start timer (update every 100ms for 0.1s precision)
    clearInterval(this.state.timerHandle);
    this.state.timerHandle = setInterval(() => {
      this.state.elapsedMs = Date.now() - this.state.startTime;
      this.updateTimer();
    }, 100);

    this.updateProgress();
    showScreen(this.elements.scrGame, [this.elements.scrStart, this.elements.scrGame, this.elements.scrEnd]);
  }

  renderProblemsGrid() {
    this.elements.problemsGrid.innerHTML = '';
    this.state.problems.forEach((problem, index) => {
      const div = document.createElement('div');
      div.className = 'problem-item';
      div.dataset.index = String(index);

      if (index === this.state.currentIndex && this.state.running) {
        div.classList.add('active');
      }
      if (problem.completed) {
        div.classList.add('completed');
      }

      div.innerHTML = `
        <span class="problem-text">${problem.a} × ${problem.b} =</span>
        <span class="problem-input-box"></span>
        <span class="problem-check">✓</span>
      `;

      this.elements.problemsGrid.appendChild(div);
    });
  }

  updateProblemsGrid() {
    const items = this.elements.problemsGrid.querySelectorAll('.problem-item');
    items.forEach((item, index) => {
      const problem = this.state.problems[index];

      item.classList.toggle('active', index === this.state.currentIndex && this.state.running);
      item.classList.toggle('completed', problem.completed);

      const inputBox = item.querySelector('.problem-input-box');
      if (problem.completed) {
        inputBox.textContent = problem.result;
      } else if (index === this.state.currentIndex) {
        inputBox.textContent = this.getCurrentAnswer();
      } else {
        inputBox.textContent = '';
      }
    });
  }

  getCurrentAnswer() {
    // Get current answer from a hidden input element or state
    return this.currentAnswer || '';
  }

  updateCurrentProblemAnswer() {
    const items = this.elements.problemsGrid.querySelectorAll('.problem-item');
    const currentItem = items[this.state.currentIndex];
    if (currentItem) {
      const inputBox = currentItem.querySelector('.problem-input-box');
      inputBox.textContent = this.currentAnswer || '';
    }
  }

  updateTimer() {
    const seconds = (this.state.elapsedMs / 1000).toFixed(1);
    this.elements.timerEl.textContent = seconds;
  }

  updateProgress() {
    const completed = this.state.problems.filter(p => p.completed).length;
    this.elements.progressEl.textContent = `${completed} / 12`;
  }

  submitAnswer() {
    if (!this.state.running) return;

    const val = Number(this.currentAnswer.trim());
    if (Number.isNaN(val) || this.currentAnswer.trim() === '') return;

    const currentProblem = this.state.problems[this.state.currentIndex];
    const correct = (val === currentProblem.result);

    if (correct) {
      currentProblem.completed = true;
      currentProblem.timeMs = Date.now() - this.state.startTime;

      // Visual feedback
      const currentItem = this.elements.problemsGrid.querySelector(`[data-index="${this.state.currentIndex}"]`);
      if (currentItem) {
        flash(currentItem, 'correct');
      }

      // Clear input
      this.currentAnswer = '';

      // Move to next problem or end game
      if (this.state.currentIndex < this.state.problems.length - 1) {
        this.state.currentIndex++;
        this.updateProblemsGrid();
        this.updateProgress();
      } else {
        // All problems complete!
        this.endRun();
      }
    } else {
      // Wrong answer - flash the current problem but don't advance
      const currentItem = this.elements.problemsGrid.querySelector(`[data-index="${this.state.currentIndex}"]`);
      if (currentItem) {
        flash(currentItem, 'wrong');
      }
      // Keep the wrong answer visible so user can backspace and fix
    }
  }

  endRun() {
    if (!this.state.running) return;
    this.state.running = false;

    // Capture final time before clearing interval
    this.state.elapsedMs = Date.now() - this.state.startTime;
    this.updateTimer();
    clearInterval(this.state.timerHandle);

    const totalSeconds = (this.state.elapsedMs / 1000).toFixed(1);

    const entry = {
      factor: this.state.selectedFactor,
      time: parseFloat(totalSeconds)
    };

    this.leaderboard.saveScore(entry);

    this.elements.sumFactor.textContent = `${this.state.selectedFactor}×`;
    this.elements.sumTime.textContent = `${totalSeconds}s`;

    this.leaderboard.renderBoard(this.elements.board1);
    this.leaderboard.renderBoard(this.elements.board2);
    showScreen(this.elements.scrEnd, [this.elements.scrStart, this.elements.scrGame, this.elements.scrEnd]);
  }

  handleKeypadClick(e) {
    const key = e.target.closest('.key');
    if (!key) return;

    const label = key.textContent.trim();
    if (key.classList.contains('enter')) {
      this.submitAnswer();
      return;
    }
    if (key.classList.contains('back')) {
      this.currentAnswer = this.currentAnswer.slice(0, -1);
      this.updateCurrentProblemAnswer();
      return;
    }
    if (/\d/.test(label)) {
      if (this.currentAnswer.length < 3) {
        this.currentAnswer += label;
        this.updateCurrentProblemAnswer();
      }
    }
  }

  handleKeydown(e) {
    if (this.elements.scrGame.classList.contains('hidden')) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    if (e.key === 'Enter') {
      e.preventDefault();
      this.submitAnswer();
      return;
    }

    if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault();
      this.currentAnswer = this.currentAnswer.slice(0, -1);
      this.updateCurrentProblemAnswer();
      return;
    }

    if (/^\d$/.test(e.key)) {
      e.preventDefault();
      if (this.currentAnswer.length < 3) {
        this.currentAnswer += e.key;
        this.updateCurrentProblemAnswer();
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      this.confirmExit();
      return;
    }

    if (e.key.length === 1) {
      e.preventDefault();
    }
  }

  async cleanup() {
    clearInterval(this.state.timerHandle);
    this.state.running = false;
    if (this.boundKeydownHandler) {
      document.removeEventListener('keydown', this.boundKeydownHandler);
      this.boundKeydownHandler = null;
    }
  }
}
