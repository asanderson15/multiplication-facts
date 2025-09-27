// Subtraction Challenge game
import { MathFactsGame } from './math-facts-base.js';

export default class SubtractionGame extends MathFactsGame {
  constructor() {
    super('subtraction', {
      title: 'Subtraction Challenge',
      tagline: 'How many subtraction facts can you get before the timer ends?',
      operation: '−',
      operationFn: (a, b) => a - b,
      minFactor: 1,
      maxFactor: 12
    });
  }

  // Override nextQuestion to ensure positive results only
  nextQuestion() {
    const tables = Array.from(this.state.selectedTables);

    // Generate addition fact and present as subtraction
    // This ensures positive results always
    const result = tables[Math.floor(Math.random() * tables.length)]; // answer (from selected tables)
    const subtrahend = Math.floor(Math.random() * 12) + 1; // number being subtracted (1-12)
    const minuend = result + subtrahend; // number being subtracted from

    const pair = `${minuend}−${subtrahend}`;

    // Avoid repeating the same question
    if (this.state.lastPair === pair) return this.nextQuestion();
    this.state.lastPair = pair;
    this.state.current = { a: minuend, b: subtrahend, result: result };
    this.state.correctOnFirstTry = true;
    this.renderQuestion();
  }
}