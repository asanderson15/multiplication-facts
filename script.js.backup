/* Multiplication Dash — static, touch-first, no deps */
(() => {
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  // Screens
  const scrStart = $('#screen-start');
  const scrGame  = $('#screen-game');
  const scrEnd   = $('#screen-end');

  // Start screen elements
  const timeChips = $$('.time-chip');
  const customSeconds = $('#custom-seconds');
  const tablesGrid = $('#tables-grid');
  const btnAll = $('#tables-all');
  const btnClear = $('#tables-clear');
  const btnStart = $('#btn-start');

  // Game screen elements
  const timerEl = $('#timer');
  const scoreEl = $('#score');
  const accEl = $('#accuracy');
  const qEl = $('#question');
  const answerEl = $('#answer');

  // End screen elements
  const sumCorrect = $('#sum-correct');
  const sumTotal = $('#sum-total');
  const sumAcc = $('#sum-accuracy');
  const sumTime = $('#sum-time');
  const sumTables = $('#sum-tables');
  const btnAgain = $('#btn-play-again');
  const btnHome = $('#btn-home');

  // Boards
  const board1 = $('#board');
  const board2 = $('#board2');
  const btnReset = $('#btn-reset');

  const live = $('#live');

  // App state
  const STATE = {
    timeLimit: 60,
    selectedTables: new Set(Array.from({length:12}, (_,i)=>i+1)), // 1..12
    // Run state
    running: false,
    score: 0,
    total: 0,
    correctOnFirstTry: true,
    current: null, // {a,b,product}
    lastPair: null,
    remaining: 60,
    tickHandle: null,
    startedAt: 0,
  };

  // Storage
  const LS_KEY = 'mfacts.leaderboard.v1';

  function saveScore(entry){
    const data = loadAll();
    data.push(entry);
    // Sort by score desc, accuracy desc, then date desc
    data.sort((a,b)=>{
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return new Date(b.date) - new Date(a.date);
    });
    // Keep top 25
    localStorage.setItem(LS_KEY, JSON.stringify(data.slice(0,25)));
  }
  function loadAll(){
    try{
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch{ return []; }
  }
  function clearScores(){
    localStorage.removeItem(LS_KEY);
  }

  // UI helpers
  function showScreen(which){
    [scrStart, scrGame, scrEnd].forEach(s => s.classList.add('hidden'));
    which.classList.remove('hidden');
  }
  function speak(msg){ live.textContent = msg; }

  // Setup tables grid
  function renderTablesGrid(){
    tablesGrid.innerHTML = '';
    for(let n=1; n<=12; n++){
      const b = document.createElement('button');
      b.className = 'table-chip selected';
      b.textContent = `${n}×`;
      b.dataset.n = String(n);
      b.addEventListener('click', ()=>{
        toggleTable(n);
        updateTableChip(b, n);
      });
      tablesGrid.appendChild(b);
    }
  }
  function toggleTable(n){
    if (STATE.selectedTables.has(n)) STATE.selectedTables.delete(n);
    else STATE.selectedTables.add(n);
    if (STATE.selectedTables.size === 0){
      // Prevent empty set; re-add n and announce
      STATE.selectedTables.add(n);
      speak('At least one table must be selected');
    }
  }
  function updateTableChip(btn, n){
    if (STATE.selectedTables.has(n)) btn.classList.add('selected');
    else btn.classList.remove('selected');
  }
  function setAllTables(on){
    STATE.selectedTables = new Set(on ? Array.from({length:12},(_,i)=>i+1) : []);
    $$('.table-chip').forEach((b)=> updateTableChip(b, Number(b.dataset.n)));
    if (!on && STATE.selectedTables.size === 0){
      // keep none until user picks
    }
  }

  // Time selection
  function selectTime(seconds){
    STATE.timeLimit = seconds;
    STATE.remaining = seconds;
    timeChips.forEach(c => c.classList.toggle('selected', Number(c.dataset.seconds) === seconds));
    if (customSeconds.value) customSeconds.value = '';
  }

  // Question generation
  function randChoice(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
  function nextQuestion(){
    const A = Array.from(STATE.selectedTables);
    const a = randChoice(A);
    const b = Math.floor(Math.random()*12)+1; // 1..12
    const pair = `${a}x${b}`;
    // avoid immediate repeat
    if (STATE.lastPair === pair) return nextQuestion();
    STATE.lastPair = pair;
    STATE.current = { a, b, product: a*b };
    STATE.correctOnFirstTry = true;
    renderQuestion();
  }
  function renderQuestion(){
    const {a,b} = STATE.current;
    qEl.textContent = `${a} × ${b} = ?`;
    qEl.classList.remove('correct','wrong');
    answerEl.value = '';
    answerEl.focus();
  }

  // Answer handling
  function submitAnswer(){
    if (!STATE.running) return;
    const val = Number(answerEl.value.trim());
    if (Number.isNaN(val)) return;
    const correct = (val === STATE.current.product);
    STATE.total += 1;
    if (correct){
      if (STATE.correctOnFirstTry) STATE.score += 1;
      flash(qEl, 'correct');
      updateHUD();
      nextQuestion();
    }else{
      STATE.correctOnFirstTry = false;
      flash(qEl, 'wrong');
      // brief shake feedback; do not advance
    }
  }
  function flash(el, cls){
    el.classList.remove('correct','wrong');
    void el.offsetWidth; // reflow
    el.classList.add(cls);
  }

  // HUD
  function updateHUD(){
    scoreEl.textContent = String(STATE.score);
    const acc = STATE.total ? Math.round((STATE.score/STATE.total)*100) : 100;
    accEl.textContent = `${acc}%`;
  }

  // Timer
  function startRun(){
    STATE.running = true;
    STATE.score = 0;
    STATE.total = 0;
    STATE.remaining = STATE.timeLimit;
    updateHUD();
    timerEl.textContent = String(STATE.remaining);
    STATE.startedAt = Date.now();
    showScreen(scrGame);
    nextQuestion();
    answerEl.focus({preventScroll:true});

    clearInterval(STATE.tickHandle);
    STATE.tickHandle = setInterval(()=>{
      STATE.remaining -= 1;
      timerEl.textContent = String(STATE.remaining);
      if (STATE.remaining <= 0){
        endRun();
      }
    }, 1000);
  }
  function endRun(){
    if (!STATE.running) return;
    STATE.running = false;
    clearInterval(STATE.tickHandle);
    // Compute accuracy
    const accuracy = STATE.total ? Math.round((STATE.score/STATE.total)*100) : 0;
    // Persist
    const entry = {
      score: STATE.score,
      total: STATE.total,
      accuracy,
      time: STATE.timeLimit,
      tables: tablesLabel(),
      date: new Date().toISOString()
    };
    saveScore(entry);
    // Render summary
    sumCorrect.textContent = String(STATE.score);
    sumTotal.textContent = String(STATE.total);
    sumAcc.textContent = `${accuracy}%`;
    sumTime.textContent = `${STATE.timeLimit}s`;
    sumTables.textContent = entry.tables;
    renderBoard(board1);
    renderBoard(board2);
    showScreen(scrEnd);
  }

  // Leaderboard
  function renderBoard(container){
    const rows = loadAll().map(e => {
      const d = new Date(e.date);
      const dateStr = d.toLocaleDateString(undefined, {year:'numeric', month:'short', day:'2-digit'});
      return `<tr>
        <td>${e.score}</td>
        <td>${e.accuracy}%</td>
        <td>${e.total}</td>
        <td>${e.time}s</td>
        <td>${e.tables}</td>
        <td>${dateStr}</td>
      </tr>`;
    }).join('');
    container.innerHTML = `
      <table class="board-table" aria-label="High scores">
        <thead>
          <tr><th>Correct</th><th>Accuracy</th><th>Answered</th><th>Time</th><th>Tables</th><th>Date</th></tr>
        </thead>
        <tbody>${rows || `<tr><td colspan="6">No scores yet</td></tr>`}</tbody>
      </table>
    `;
  }

  function tablesLabel(){
    const arr = Array.from(STATE.selectedTables).sort((a,b)=>a-b);
    if (arr.length === 12) return 'All 1–12';
    return arr.map(n => `${n}×`).join(', ');
  }

  // Event wiring
  function bindStartScreen(){
    timeChips.forEach(chip => {
      chip.addEventListener('click', () => selectTime(Number(chip.dataset.seconds)));
    });
    customSeconds.addEventListener('change', () => {
      const n = Number(customSeconds.value);
      if (Number.isInteger(n) && n>=10 && n<=600){
        selectTime(n);
        // visually deselect presets
        timeChips.forEach(c => c.classList.remove('selected'));
      } else {
        speak('Enter between 10 and 600 seconds');
        customSeconds.value = '';
      }
    });

    btnAll.addEventListener('click', ()=> setAllTables(true));
    btnClear.addEventListener('click', ()=> setAllTables(false));

    btnStart.addEventListener('click', startRun);
  }

  function bindGame(){
    // On-screen keypad
    $('.keypad').addEventListener('click', (e)=>{
      const t = e.target.closest('.key');
      if (!t) return;
      const label = t.textContent.trim();
      if (t.classList.contains('enter')) { submitAnswer(); return; }
      if (t.classList.contains('back'))  { answerEl.value = answerEl.value.slice(0,-1); return; }
      // digit
      if (/\d/.test(label)) {
        // 144 is max, cap at 3 digits
        if (answerEl.value.length < 3) answerEl.value += label;
      }
      answerEl.focus({preventScroll:true});
    });

    // Keyboard support
    document.addEventListener('keydown', (e)=>{
      if (scrGame.classList.contains('hidden')) return;
      if (e.key === 'Enter'){ submitAnswer(); }
      else if (e.key === 'Backspace'){ /* default behavior ok */ }
      else if (!/\d/.test(e.key)){ e.preventDefault(); }
    });

    // Enter on input
    answerEl.addEventListener('keydown', (e)=>{
      if (e.key === 'Enter'){ e.preventDefault(); submitAnswer(); }
    });
  }

  function bindEnd(){
    btnAgain.addEventListener('click', startRun);
    btnHome.addEventListener('click', ()=> showScreen(scrStart));
  }

  function bindBoard(){
    btnReset.addEventListener('click', ()=>{
      clearScores();
      renderBoard(board1);
      renderBoard(board2);
    });
  }

  function init(){
    renderTablesGrid();
    bindStartScreen();
    bindGame();
    bindEnd();
    bindBoard();
    selectTime(60);
    renderBoard(board1);
    showScreen(scrStart);
  }

  // Start
  init();
})();