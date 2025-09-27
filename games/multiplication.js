// Multiplication Dash game
import { MathFactsGame } from './math-facts-base.js';

export default class MultiplicationGame extends MathFactsGame {
  constructor() {
    super('multiplication', {
      title: 'Multiplication Dash',
      tagline: 'How many facts can you get before the timer ends?',
      operation: '×',
      operationFn: (a, b) => a * b,
      minFactor: 1,
      maxFactor: 12
    });
  }
}