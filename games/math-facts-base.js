// Base class for math facts games (multiplication, addition, etc.)
import { $, $$, showScreen, speak, flash } from '../modules/ui.js';
import { Leaderboard } from '../modules/leaderboard.js';

export class Game {
  // Minimal interface that all games must implement
  async init(container) {
    throw new Error('Game must implement init()');
  }

  async start(config) {
    throw new Error('Game must implement start()');
  }

  async cleanup() {
    // Optional cleanup
  }

  // Reusable exit functionality for any game type
  addExitButton(gameScreen, position = 'hud') {
    if (position === 'hud') {
      const hud = gameScreen.querySelector('.hud');
      if (hud) {
        const exitItem = document.createElement('div');
        exitItem.className = 'hud-item hud-exit';
        exitItem.innerHTML = '<button class="btn-exit" aria-label="Exit game" title="Exit game">✕</button>';
        hud.appendChild(exitItem);

        const exitBtn = exitItem.querySelector('.btn-exit');
        exitBtn.addEventListener('click', () => this.confirmExit());
      }
    }
  }

  confirmExit() {
    if (confirm('Exit game? Your progress will be lost.')) {
      this.goHome();
    }
  }

  goHome() {
    // Signal that we want to go back to splash screen
    if (this.onHome) this.onHome();
  }
}

export class MathFactsGame extends Game {
  constructor(gameId, config = {}) {
    super();
    this.gameId = gameId;
    this.config = {
      operation: '×',
      operationFn: (a, b) => a * b,
      minFactor: 1,
      maxFactor: 12,
      ...config
    };

    this.leaderboard = new Leaderboard(gameId);
    this.state = {
      timeLimit: 60,
      selectedTables: new Set(Array.from({length: 12}, (_, i) => i + 1)), // 1..12
      running: false,
      score: 0,
      total: 0,
      correctOnFirstTry: true,
      current: null,
      lastPair: null,
      remaining: 60,
      tickHandle: null,
      startedAt: 0,
    };

    // Elements will be set during init
    this.elements = {};
  }

  async init(container) {
    this.container = container;
    this.setupHTML();
    this.bindEvents();
    this.renderTablesGrid();
    this.selectTime(60);
    this.leaderboard.renderBoard(this.elements.board1);

    // Add exit button to game screen
    this.addExitButton(this.elements.scrGame, 'hud');

    showScreen(this.elements.scrStart, [this.elements.scrStart, this.elements.scrGame, this.elements.scrEnd]);
  }

  setupHTML() {
    this.container.innerHTML = `
      <!-- START SCREEN -->
      <section class="screen" data-screen="start">
        <h1 class="app-title">${this.config.title || 'Math Facts'}</h1>
        <p class="tagline">${this.config.tagline || 'How many facts can you get before the timer ends?'}</p>

        <div class="card">
          <h2 class="section-title">1) Pick a time</h2>
          <div class="time-choices" role="group" aria-label="Time limit">
            <button class="chip time-chip" data-seconds="30">30s</button>
            <button class="chip time-chip selected" data-seconds="60">60s</button>
            <button class="chip time-chip" data-seconds="90">90s</button>
            <button class="chip time-chip" data-seconds="120">120s</button>
            <label class="chip custom-time">
              <input class="custom-seconds" type="number" min="10" max="600" step="5" placeholder="Custom s" aria-label="Custom seconds" />
            </label>
          </div>
        </div>

        <div class="card">
          <h2 class="section-title">2) Choose tables to practice</h2>
          <div class="table-controls">
            <button class="tables-all pill small">All</button>
            <button class="tables-clear pill small">Clear</button>
          </div>
          <div class="tables-grid" role="group" aria-label="Times tables">
          </div>
          <p class="hint">Tip: Picking 3 and 4 focuses on 3${this.config.operation} and 4${this.config.operation} facts.</p>
        </div>

        <div class="actions">
          <button class="btn-start cta">Start</button>
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
            <div class="timer" role="timer" aria-live="polite">60</div>
            <div class="hud-label">seconds</div>
          </div>
          <div class="hud-item">
            <div class="score stat">0</div>
            <div class="hud-label">correct</div>
          </div>
          <div class="hud-item">
            <div class="accuracy stat">100%</div>
            <div class="hud-label">accuracy</div>
          </div>
        </header>

        <div class="stage">
          <div class="question" aria-label="Question">3 ${this.config.operation} 4 = ?</div>
          <div class="answer-wrap">
            <div class="answer-input" aria-label="Your answer" role="textbox" aria-readonly="true"></div>
          </div>

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
      </section>

      <!-- END SCREEN -->
      <section class="screen hidden" data-screen="end">
        <h2>Time!</h2>
        <div class="summary card">
          <div class="summary-row"><span>Correct:</span><strong class="sum-correct">0</strong></div>
          <div class="summary-row"><span>Questions answered:</span><strong class="sum-total">0</strong></div>
          <div class="summary-row"><span>Accuracy:</span><strong class="sum-accuracy">0%</strong></div>
          <div class="summary-row"><span>Time limit:</span><strong class="sum-time">60s</strong></div>
          <div class="summary-row"><span>Tables:</span><strong class="sum-tables">All 1–12</strong></div>
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
      timeChips: this.container.querySelectorAll('.time-chip'),
      customSeconds: this.container.querySelector('.custom-seconds'),
      tablesGrid: this.container.querySelector('.tables-grid'),
      btnAll: this.container.querySelector('.tables-all'),
      btnClear: this.container.querySelector('.tables-clear'),
      btnStart: this.container.querySelector('.btn-start'),
      timerEl: this.container.querySelector('.timer'),
      scoreEl: this.container.querySelector('.score'),
      accEl: this.container.querySelector('.accuracy'),
      qEl: this.container.querySelector('.question'),
      answerEl: this.container.querySelector('.answer-input'),
      sumCorrect: this.container.querySelector('.sum-correct'),
      sumTotal: this.container.querySelector('.sum-total'),
      sumAcc: this.container.querySelector('.sum-accuracy'),
      sumTime: this.container.querySelector('.sum-time'),
      sumTables: this.container.querySelector('.sum-tables'),
      btnAgain: this.container.querySelector('.btn-play-again'),
      btnHome: this.container.querySelector('.btn-home'),
      board1: this.container.querySelector('.board'),
      board2: this.container.querySelector('.board2'),
      btnReset: this.container.querySelector('.btn-reset'),
      keypad: this.container.querySelector('.keypad'),
    };
  }

  bindEvents() {
    // Time selection
    this.elements.timeChips.forEach(chip => {
      chip.addEventListener('click', () => this.selectTime(Number(chip.dataset.seconds)));
    });

    this.elements.customSeconds.addEventListener('change', () => {
      const n = Number(this.elements.customSeconds.value);
      if (Number.isInteger(n) && n >= 10 && n <= 600) {
        this.selectTime(n, true); // Pass true to indicate this is from custom input
        this.elements.timeChips.forEach(c => c.classList.remove('selected'));
      } else {
        speak('Enter between 10 and 600 seconds');
        this.elements.customSeconds.value = '';
      }
    });

    // Tables
    this.elements.btnAll.addEventListener('click', () => this.setAllTables(true));
    this.elements.btnClear.addEventListener('click', () => this.setAllTables(false));

    // Game controls
    this.elements.btnStart.addEventListener('click', () => this.startRun());
    this.elements.btnAgain.addEventListener('click', () => this.startRun());
    this.elements.btnHome.addEventListener('click', () => this.goHome());

    // Keypad
    this.elements.keypad.addEventListener('click', (e) => this.handleKeypadClick(e));

    // Keyboard support
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Leaderboard
    this.elements.btnReset.addEventListener('click', () => {
      this.leaderboard.clear();
      this.leaderboard.renderBoard(this.elements.board1);
      this.leaderboard.renderBoard(this.elements.board2);
    });
  }

  renderTablesGrid() {
    this.elements.tablesGrid.innerHTML = '';
    for (let n = 1; n <= 12; n++) {
      const btn = document.createElement('button');
      btn.className = 'table-chip selected';
      btn.textContent = `${n}${this.config.operation}`;
      btn.dataset.n = String(n);
      btn.addEventListener('click', () => {
        this.toggleTable(n);
        this.updateTableChip(btn, n);
      });
      this.elements.tablesGrid.appendChild(btn);
    }
  }

  toggleTable(n) {
    if (this.state.selectedTables.has(n)) this.state.selectedTables.delete(n);
    else this.state.selectedTables.add(n);
    if (this.state.selectedTables.size === 0) {
      this.state.selectedTables.add(n);
      speak('At least one table must be selected');
    }
  }

  updateTableChip(btn, n) {
    btn.classList.toggle('selected', this.state.selectedTables.has(n));
  }

  setAllTables(on) {
    this.state.selectedTables = new Set(on ? Array.from({length: 12}, (_, i) => i + 1) : []);
    this.container.querySelectorAll('.table-chip').forEach((btn) =>
      this.updateTableChip(btn, Number(btn.dataset.n))
    );
  }

  selectTime(seconds, fromCustomInput = false) {
    this.state.timeLimit = seconds;
    this.state.remaining = seconds;
    this.elements.timeChips.forEach(c =>
      c.classList.toggle('selected', Number(c.dataset.seconds) === seconds)
    );
    // Only clear custom input if selection came from a preset button, not from the custom input itself
    if (!fromCustomInput && this.elements.customSeconds.value) {
      this.elements.customSeconds.value = '';
    }
  }

  nextQuestion() {
    const tables = Array.from(this.state.selectedTables);
    const a = tables[Math.floor(Math.random() * tables.length)];
    const b = Math.floor(Math.random() * 12) + 1;
    const pair = `${a}${this.config.operation}${b}`;

    if (this.state.lastPair === pair) return this.nextQuestion();
    this.state.lastPair = pair;
    this.state.current = { a, b, result: this.config.operationFn(a, b) };
    this.state.correctOnFirstTry = true;
    this.renderQuestion();
  }

  renderQuestion() {
    const { a, b } = this.state.current;
    this.elements.qEl.textContent = `${a} ${this.config.operation} ${b} = ?`;
    this.elements.qEl.classList.remove('correct', 'wrong');
    this.elements.answerEl.textContent = '';
  }

  submitAnswer() {
    if (!this.state.running) return;
    const val = Number(this.elements.answerEl.textContent.trim());
    if (Number.isNaN(val) || this.elements.answerEl.textContent.trim() === '') return;

    const correct = (val === this.state.current.result);
    this.state.total += 1;

    if (correct) {
      if (this.state.correctOnFirstTry) this.state.score += 1;
      flash(this.elements.qEl, 'correct');
      this.updateHUD();
      this.nextQuestion();
    } else {
      this.state.correctOnFirstTry = false;
      flash(this.elements.qEl, 'wrong');
    }
  }

  updateHUD() {
    this.elements.scoreEl.textContent = String(this.state.score);
    const acc = this.state.total ? Math.round((this.state.score / this.state.total) * 100) : 100;
    this.elements.accEl.textContent = `${acc}%`;
  }

  startRun() {
    this.state.running = true;
    this.state.score = 0;
    this.state.total = 0;
    this.state.remaining = this.state.timeLimit;
    this.updateHUD();
    this.elements.timerEl.textContent = String(this.state.remaining);
    this.state.startedAt = Date.now();
    showScreen(this.elements.scrGame, [this.elements.scrStart, this.elements.scrGame, this.elements.scrEnd]);
    this.nextQuestion();

    clearInterval(this.state.tickHandle);
    this.state.tickHandle = setInterval(() => {
      this.state.remaining -= 1;
      this.elements.timerEl.textContent = String(this.state.remaining);
      if (this.state.remaining <= 0) {
        this.endRun();
      }
    }, 1000);
  }

  endRun() {
    if (!this.state.running) return;
    this.state.running = false;
    clearInterval(this.state.tickHandle);

    const accuracy = this.state.total ? Math.round((this.state.score / this.state.total) * 100) : 0;
    const entry = {
      score: this.state.score,
      total: this.state.total,
      accuracy,
      time: this.state.timeLimit,
      tables: this.tablesLabel(),
    };

    this.leaderboard.saveScore(entry);

    this.elements.sumCorrect.textContent = String(this.state.score);
    this.elements.sumTotal.textContent = String(this.state.total);
    this.elements.sumAcc.textContent = `${accuracy}%`;
    this.elements.sumTime.textContent = `${this.state.timeLimit}s`;
    this.elements.sumTables.textContent = entry.tables;

    this.leaderboard.renderBoard(this.elements.board1);
    this.leaderboard.renderBoard(this.elements.board2);
    showScreen(this.elements.scrEnd, [this.elements.scrStart, this.elements.scrGame, this.elements.scrEnd]);
  }

  tablesLabel() {
    const arr = Array.from(this.state.selectedTables).sort((a, b) => a - b);
    if (arr.length === 12) return 'All 1–12';
    return arr.map(n => `${n}${this.config.operation}`).join(', ');
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
      this.elements.answerEl.textContent = this.elements.answerEl.textContent.slice(0, -1);
      return;
    }
    if (/\d/.test(label)) {
      if (this.elements.answerEl.textContent.length < 3) {
        this.elements.answerEl.textContent += label;
      }
    }
  }

  handleKeydown(e) {
    if (this.elements.scrGame.classList.contains('hidden')) return;
    if (e.key === 'Enter') {
      this.submitAnswer();
    } else if (e.key === 'Backspace') {
      // default behavior ok
    } else if (!/\d/.test(e.key)) {
      e.preventDefault();
    }
  }

  async cleanup() {
    clearInterval(this.state.tickHandle);
    this.state.running = false;
  }
}