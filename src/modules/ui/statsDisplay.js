/**
 * Statistics display UI component
 */

/**
 * Update the live statistics display
 * @param {Object} metrics - Current typing metrics
 */
export function updateStats(metrics) {
  // Update WPM
  const wpmElement = document.getElementById('wpm');
  if (wpmElement) {
    wpmElement.textContent = metrics.netWPM || 0;
  }
  
  // Update accuracy
  const accuracyElement = document.getElementById('accuracy');
  if (accuracyElement) {
    accuracyElement.textContent = metrics.accuracy || 0;
  }
  
  // Update timer
  const timerElement = document.getElementById('timer');
  if (timerElement) {
    timerElement.textContent = formatTime(metrics.timeElapsed || 0);
  }
}

/**
 * Reset statistics display to initial state
 */
export function resetStats() {
  updateStats({
    netWPM: 0,
    accuracy: 0,
    timeElapsed: 0
  });
}

/**
 * Show completion modal with final statistics
 * @param {Object} finalMetrics - Final typing test metrics
 * @param {Object} personalBest - Personal best for this difficulty
 * @param {Function} onTryAgain - Callback for try again button
 * @param {Function} onNewPassage - Callback for new passage button
 */
export function showCompletionModal(finalMetrics, personalBest, onTryAgain, onNewPassage) {
  const modal = document.getElementById('completion-modal');
  const statsContainer = document.getElementById('completion-stats');
  
  if (!modal || !statsContainer) return;
  
  // Check if this is a new personal best
  const isNewBest = !personalBest || finalMetrics.netWPM > personalBest.netWPM;
  
  // Build stats HTML
  let statsHtml = `
    <div class="grid grid-cols-2 gap-4 text-center">
      <div class="bg-gray-700 p-3 rounded">
        <div class="text-2xl font-bold text-amber-400">${finalMetrics.netWPM}</div>
        <div class="text-sm text-gray-400">WPM</div>
      </div>
      <div class="bg-gray-700 p-3 rounded">
        <div class="text-2xl font-bold text-green-400">${finalMetrics.accuracy}%</div>
        <div class="text-sm text-gray-400">Accuracy</div>
      </div>
      <div class="bg-gray-700 p-3 rounded">
        <div class="text-2xl font-bold text-blue-400">${formatTime(finalMetrics.timeElapsed)}</div>
        <div class="text-sm text-gray-400">Time</div>
      </div>
      <div class="bg-gray-700 p-3 rounded">
        <div class="text-2xl font-bold text-purple-400">${finalMetrics.errors}</div>
        <div class="text-sm text-gray-400">Errors</div>
      </div>
    </div>
  `;
  
  // Add personal best information
  if (isNewBest && finalMetrics.netWPM > 0) {
    statsHtml += `
      <div class="mt-4 p-3 bg-amber-900 border border-amber-600 rounded text-center">
        <div class="text-amber-300 font-bold">🎉 New Personal Best!</div>
        <div class="text-sm text-amber-200">Previous best: ${personalBest ? personalBest.netWPM : 0} WPM</div>
      </div>
    `;
  } else if (personalBest && personalBest.netWPM > 0) {
    statsHtml += `
      <div class="mt-4 p-3 bg-gray-700 rounded text-center">
        <div class="text-gray-300">Personal Best: ${personalBest.netWPM} WPM</div>
        <div class="text-sm text-gray-400">Accuracy: ${personalBest.accuracy}%</div>
      </div>
    `;
  }
  
  statsContainer.innerHTML = statsHtml;
  
  // Set up button handlers
  const tryAgainBtn = document.getElementById('try-again-btn');
  const newPassageBtn = document.getElementById('new-passage-modal-btn');
  
  if (tryAgainBtn) {
    tryAgainBtn.onclick = () => {
      hideCompletionModal();
      onTryAgain();
    };
  }
  
  if (newPassageBtn) {
    newPassageBtn.onclick = () => {
      hideCompletionModal();
      onNewPassage();
    };
  }
  
  // Show modal
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

/**
 * Hide the completion modal
 */
export function hideCompletionModal() {
  const modal = document.getElementById('completion-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

/**
 * Format seconds as MM:SS
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Update button states based on app state
 * @param {boolean} hasPassage - Whether a passage is loaded
 * @param {boolean} isTyping - Whether user is currently typing
 */
export function updateButtonStates(hasPassage, isTyping) {
  const newPassageBtn = document.getElementById('new-passage-btn');
  const typeBox = document.getElementById('type-box');
  
  if (newPassageBtn) {
    newPassageBtn.disabled = isTyping;
    newPassageBtn.classList.toggle('opacity-50', isTyping);
    newPassageBtn.classList.toggle('cursor-not-allowed', isTyping);
  }
  
  if (typeBox) {
    typeBox.disabled = !hasPassage;
    if (!hasPassage) {
      typeBox.placeholder = 'Select a difficulty to start...';
    } else {
      typeBox.placeholder = 'Start typing...';
    }
  }
}