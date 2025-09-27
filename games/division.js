// Division Masters game
import { MathFactsGame } from './math-facts-base.js';

export default class DivisionGame extends MathFactsGame {
  constructor() {
    super('division', {
      title: 'Division Masters',
      tagline: 'How many division facts can you get before the timer ends?',
      operation: '÷',
      operationFn: (a, b) => a / b,
      minFactor: 1,
      maxFactor: 12
    });
  }

  // Override nextQuestion to ensure whole number results
  nextQuestion() {
    const tables = Array.from(this.state.selectedTables);

    // Generate multiplication fact and present as division
    // This ensures whole number results
    const divisor = tables[Math.floor(Math.random() * tables.length)]; // b (divisor)
    const quotient = Math.floor(Math.random() * 12) + 1; // result (quotient)
    const dividend = divisor * quotient; // a (dividend)

    const pair = `${dividend}÷${divisor}`;

    // Avoid repeating the same question
    if (this.state.lastPair === pair) return this.nextQuestion();
    this.state.lastPair = pair;
    this.state.current = { a: dividend, b: divisor, result: quotient };
    this.state.correctOnFirstTry = true;
    this.renderQuestion();
  }
}