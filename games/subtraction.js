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
}