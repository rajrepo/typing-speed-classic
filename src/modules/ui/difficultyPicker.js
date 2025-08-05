/**
 * Difficulty picker UI component
 */

/**
 * Create and render the difficulty picker
 * @param {Array} books - Array of book configurations
 * @param {Function} onSelect - Callback when difficulty is selected
 */
export function createDifficultyPicker(books, onSelect) {
  const container = document.getElementById('difficulty-picker');
  if (!container) return;
  
  container.innerHTML = '';
  
  books.forEach(book => {
    const card = createDifficultyCard(book, () => {
      // Update selection state
      updateSelection(container, book.difficulty);
      onSelect(book.difficulty, book);
    });
    
    container.appendChild(card);
  });
}

/**
 * Create a difficulty card element
 * @param {Object} book - Book configuration
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} - Card element
 */
function createDifficultyCard(book, onClick) {
  const card = document.createElement('div');
  card.className = 'difficulty-card';
  card.dataset.difficulty = book.difficulty;
  
  const difficultyColors = {
    beginner: 'text-green-400',
    intermediate: 'text-yellow-400',
    expert: 'text-red-400'
  };
  
  const difficultyLabels = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    expert: 'Expert'
  };
  
  card.innerHTML = `
    <div class="text-center">
      <div class="text-xl font-bold ${difficultyColors[book.difficulty]} mb-2">
        ${difficultyLabels[book.difficulty]}
      </div>
      <div class="text-lg font-semibold text-gray-100 mb-1">
        ${book.title}
      </div>
      <div class="text-sm text-gray-400 mb-2">
        ${book.generated ? 'AI Generated Content' : `by ${book.author}`}
      </div>
      <div class="text-xs text-gray-500">
        Grade Level: ${book.targetGrade}
      </div>
      <div class="text-xs text-gray-500">
        Length: ${book.passageLength[0]}-${book.passageLength[1]} chars
      </div>
    </div>
  `;
  
  card.addEventListener('click', onClick);
  
  return card;
}

/**
 * Update selection state of difficulty cards
 * @param {HTMLElement} container - Container element
 * @param {string} selectedDifficulty - Selected difficulty level
 */
function updateSelection(container, selectedDifficulty) {
  const cards = container.querySelectorAll('.difficulty-card');
  
  cards.forEach(card => {
    if (card.dataset.difficulty === selectedDifficulty) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });
}

/**
 * Get currently selected difficulty
 * @returns {string|null} - Selected difficulty or null
 */
export function getSelectedDifficulty() {
  const selectedCard = document.querySelector('.difficulty-card.selected');
  return selectedCard ? selectedCard.dataset.difficulty : null;
}