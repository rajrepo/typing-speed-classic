/**
 * Passage display UI component with real-time highlighting
 */

/**
 * Display a passage for typing
 * @param {Object} passage - Passage object
 */
export function displayPassage(passage) {
  const passageBox = document.getElementById('passage-box');
  if (!passageBox) return;
  
  // Store passage data for highlighting
  passageBox.dataset.passageText = passage.text;
  passageBox.dataset.passageSource = passage.source || 'book';
  
  // Initial display without highlighting
  updatePassageDisplay([]);
  
  // Add source indicator
  addSourceIndicator(passage);
}

/**
 * Add a small indicator showing the passage source
 * @param {Object} passage - Passage object
 */
function addSourceIndicator(passage) {
  // Remove existing indicator
  const existingIndicator = document.querySelector('.passage-source-indicator');
  if (existingIndicator) {
    existingIndicator.remove();
  }
  
  // Create new indicator
  const indicator = document.createElement('div');
  indicator.className = 'passage-source-indicator text-xs text-gray-500 mt-2 text-right';
  
  // Determine source based on passage data
  if (passage.source === 'robinson-crusoe' || passage.bookId === 'robinson-crusoe') {
    indicator.innerHTML = '🏝️ Robinson Crusoe by Daniel Defoe';
  } else if (passage.source === 'tom-sawyer' || passage.bookId === 'tom') {
    indicator.innerHTML = '🏞️ The Adventures of Tom Sawyer by Mark Twain';
  } else if (passage.source === 'origin-species' || passage.bookId === 'darwin') {
    indicator.innerHTML = '🔬 On the Origin of Species by Charles Darwin';
  } else if (passage.source === 'sensible-lorem') {
    indicator.innerHTML = '✨ AI Generated Content';
  } else if (passage.source && passage.source.includes('fallback')) {
    indicator.innerHTML = '🔧 Fallback Content';
  } else {
    indicator.innerHTML = '📚 Classic Literature';
  }
  
  // Insert after passage box
  const passageBox = document.getElementById('passage-box');
  if (passageBox && passageBox.parentNode) {
    passageBox.parentNode.insertBefore(indicator, passageBox.nextSibling);
  }
}

/**
 * Update passage display with character highlighting
 * @param {Array} characterAnalysis - Array of character status objects
 */
export function updatePassageDisplay(characterAnalysis) {
  const passageBox = document.getElementById('passage-box');
  if (!passageBox) return;
  
  const passageText = passageBox.dataset.passageText || '';
  
  if (characterAnalysis.length === 0) {
    // Initial display - just show the text
    passageBox.innerHTML = escapeHtml(passageText);
    return;
  }
  
  // Build highlighted HTML
  let html = '';
  
  characterAnalysis.forEach(charData => {
    const char = charData.char;
    const status = charData.status;
    
    let className = '';
    
    switch (status) {
      case 'correct':
        className = 'mark-correct';
        break;
      case 'incorrect':
        className = 'mark-wrong';
        break;
      case 'current':
        className = 'mark-current';
        break;
      case 'pending':
      default:
        className = '';
        break;
    }
    
    if (char === ' ') {
      html += className ? `<span class="${className}">&nbsp;</span>` : '&nbsp;';
    } else if (char === '\n') {
      html += className ? `<span class="${className}">↵</span><br>` : '<br>';
    } else {
      const escapedChar = escapeHtml(char);
      html += className ? `<span class="${className}">${escapedChar}</span>` : escapedChar;
    }
  });
  
  passageBox.innerHTML = html;
  
  // Scroll to keep current character visible
  scrollToCurrentChar(passageBox);
}

/**
 * Scroll to keep the current character visible
 * @param {HTMLElement} passageBox - Passage container element
 */
function scrollToCurrentChar(passageBox) {
  const currentChar = passageBox.querySelector('.mark-current');
  if (!currentChar) return;
  
  const containerRect = passageBox.getBoundingClientRect();
  const charRect = currentChar.getBoundingClientRect();
  
  // Check if current character is outside visible area
  if (charRect.top < containerRect.top || charRect.bottom > containerRect.bottom) {
    currentChar.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
  }
}

/**
 * Clear the passage display
 */
export function clearPassage() {
  const passageBox = document.getElementById('passage-box');
  if (passageBox) {
    passageBox.innerHTML = '';
    passageBox.dataset.passageText = '';
    passageBox.dataset.passageSource = '';
  }
  
  // Remove source indicator
  const indicator = document.querySelector('.passage-source-indicator');
  if (indicator) {
    indicator.remove();
  }
}

/**
 * Show loading state in passage display
 */
export function showPassageLoading() {
  const passageBox = document.getElementById('passage-box');
  if (passageBox) {
    passageBox.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <div class="animate-pulse">Loading passage...</div>
      </div>
    `;
  }
}

/**
 * Show error state in passage display
 * @param {string} message - Error message
 */
export function showPassageError(message) {
  const passageBox = document.getElementById('passage-box');
  if (passageBox) {
    passageBox.innerHTML = `
      <div class="text-center text-red-400 py-8">
        <div class="mb-2">⚠️ Error</div>
        <div class="text-sm">${escapeHtml(message)}</div>
      </div>
    `;
  }
}

/**
 * Escape HTML special characters
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}