// Shared UI utilities and helpers
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function showScreen(activeScreen, allScreens) {
  allScreens.forEach(screen => screen.classList.add('hidden'));
  activeScreen.classList.remove('hidden');
}

export function speak(message) {
  const live = $('#live');
  if (live) live.textContent = message;
}

export function flash(element, className) {
  element.classList.remove('correct', 'wrong');
  void element.offsetWidth; // force reflow
  element.classList.add(className);
}

export function createButton(text, className = '', onClick = null) {
  const button = document.createElement('button');
  button.textContent = text;
  if (className) button.className = className;
  if (onClick) button.addEventListener('click', onClick);
  return button;
}

export function createChip(text, isSelected = false, onClick = null) {
  const chip = document.createElement('button');
  chip.textContent = text;
  chip.className = 'chip' + (isSelected ? ' selected' : '');
  if (onClick) chip.addEventListener('click', onClick);
  return chip;
}

export function formatDate(date) {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });
}