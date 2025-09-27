// Main application controller with game registry
import { $, showScreen } from './modules/ui.js';

// Game registry - games register themselves with minimal interface
const gameRegistry = {
  'multiplication': {
    module: () => import('./games/multiplication.js'),
    title: 'Multiplication Dash',
    symbol: '×',
    description: 'Master your times tables',
    color: 'var(--accent)' // green
  },
  'addition': {
    module: () => import('./games/addition.js'),
    title: 'Addition Sprint',
    symbol: '+',
    description: 'Master your addition facts',
    color: 'var(--accent-2)' // blue
  },
  'subtraction': {
    module: () => import('./games/subtraction.js'),
    title: 'Subtraction Challenge',
    symbol: '−',
    description: 'Master your subtraction facts',
    color: 'var(--focus)' // orange
  },
  'division': {
    module: () => import('./games/division.js'),
    title: 'Division Masters',
    symbol: '÷',
    description: 'Master your division facts',
    color: 'var(--danger)' // red
  }
};

class MathFactsApp {
  constructor() {
    this.currentGame = null;
    this.screens = {
      splash: null,
      gameContainer: null
    };
  }

  async init() {
    this.screens.splash = $('#screen-splash');
    this.screens.gameContainer = $('#game-container');

    this.renderSplashScreen();
    this.showSplash();
  }

  renderSplashScreen() {
    const gameCards = Object.entries(gameRegistry).map(([gameId, game]) => `
      <div class="game-card" data-game-id="${gameId}" style="--game-color: ${game.color}">
        <div class="game-symbol">${game.symbol}</div>
        <div class="game-info">
          <h2 class="game-title">${game.title}</h2>
          <p class="game-description">${game.description}</p>
        </div>
      </div>
    `).join('');

    this.screens.splash.innerHTML = `
      <div class="splash-content">
        <h1 class="app-title">Math Facts</h1>
        <p class="splash-tagline">Choose your game to practice math facts!</p>

        <div class="game-cards">
          ${gameCards}
        </div>
      </div>
    `;

    // Add click handlers
    this.screens.splash.addEventListener('click', (e) => {
      const gameCard = e.target.closest('.game-card');
      if (gameCard) {
        const gameId = gameCard.dataset.gameId;
        this.loadGame(gameId);
      }
    });
  }

  async loadGame(gameId) {
    const gameInfo = gameRegistry[gameId];
    if (!gameInfo) {
      console.error(`Game '${gameId}' not found in registry`);
      return;
    }

    try {
      // Clean up current game if exists
      if (this.currentGame) {
        await this.currentGame.cleanup();
      }

      // Dynamic import the game module
      const gameModule = await gameInfo.module();
      const GameClass = gameModule.default;

      // Create and initialize new game
      this.currentGame = new GameClass();
      this.currentGame.onHome = () => this.showSplash();

      // Initialize game in container
      await this.currentGame.init(this.screens.gameContainer);

      // Show game container
      showScreen(this.screens.gameContainer, [this.screens.splash, this.screens.gameContainer]);

      // Update page title
      document.title = gameInfo.title;

    } catch (error) {
      console.error(`Failed to load game '${gameId}':`, error);
      alert(`Failed to load ${gameInfo.title}. Please try again.`);
    }
  }

  showSplash() {
    document.title = 'Math Facts';
    showScreen(this.screens.splash, [this.screens.splash, this.screens.gameContainer]);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new MathFactsApp();
  app.init();
});