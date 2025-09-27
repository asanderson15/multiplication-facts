// Addition Sprint game
import { MathFactsGame } from './math-facts-base.js';

export default class AdditionGame extends MathFactsGame {
  constructor() {
    super('addition', {
      title: 'Addition Sprint',
      tagline: 'How many addition facts can you get before the timer ends?',
      operation: '+',
      operationFn: (a, b) => a + b,
      minFactor: 1,
      maxFactor: 12
    });
  }
}