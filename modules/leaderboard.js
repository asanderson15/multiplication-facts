// Leaderboard management with game-specific storage
import { formatDate } from './ui.js';

const OLD_KEY = 'mfacts.leaderboard.v1';

export class Leaderboard {
  constructor(gameId) {
    this.gameId = gameId;
    this.storageKey = `mfacts.leaderboard.${gameId}.v1`;
    this.migrateOldData();
  }

  migrateOldData() {
    // Migrate existing multiplication data from old format
    if (this.gameId === 'multiplication') {
      try {
        const oldData = localStorage.getItem(OLD_KEY);
        if (oldData && !localStorage.getItem(this.storageKey)) {
          localStorage.setItem(this.storageKey, oldData);
          localStorage.removeItem(OLD_KEY);
        }
      } catch (e) {
        console.warn('Failed to migrate old leaderboard data:', e);
      }
    }
  }

  saveScore(entry) {
    const data = this.loadAll();
    data.push({
      ...entry,
      date: new Date().toISOString()
    });

    // Sort by score desc, accuracy desc, then date desc
    data.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy;
      return new Date(b.date) - new Date(a.date);
    });

    // Keep top 25
    localStorage.setItem(this.storageKey, JSON.stringify(data.slice(0, 25)));
  }

  loadAll() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }

  renderBoard(container) {
    const entries = this.loadAll();
    const rows = entries.map(entry => {
      const date = new Date(entry.date);
      const dateStr = formatDate(date);
      return `<tr>
        <td>${entry.score}</td>
        <td>${entry.accuracy}%</td>
        <td>${entry.total}</td>
        <td>${entry.time}s</td>
        <td>${entry.tables}</td>
        <td>${dateStr}</td>
      </tr>`;
    }).join('');

    container.innerHTML = `
      <table class="board-table" aria-label="High scores">
        <thead>
          <tr>
            <th>Correct</th>
            <th>Accuracy</th>
            <th>Answered</th>
            <th>Time</th>
            <th>Tables</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${rows || '<tr><td colspan="6">No scores yet</td></tr>'}
        </tbody>
      </table>
    `;
  }
}