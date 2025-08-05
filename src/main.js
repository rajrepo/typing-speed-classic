/**
 * Main application bootstrap - coordinates all modules
 */

import { getRandom, getById } from './modules/passageGenerator.js';
import { TypingEngine } from './modules/typingEngine.js';
import { createDifficultyPicker } from './modules/ui/difficultyPicker.js';
import { displayPassage, updatePassageDisplay, showPassageLoading, showPassageError } from './modules/ui/passageDisplay.js';
import { updateStats, resetStats, showCompletionModal, updateButtonStates } from './modules/ui/statsDisplay.js';

// Application state
const appState = {
  config: null,
  currentDifficulty: null,
  currentPassage: null,
  typingEngine: new TypingEngine(),
  isInitialized: false
};

/**
 * Initialize the application
 */
async function initApp() {
  try {
    console.log('Initializing Typing Speed Classic with Book Processing...');
    
    // Initialize IndexedDB
    const { initDB } = await import('./modules/passageStore.js');
    await initDB();
    
    // Load configuration
    appState.config = await loadConfig();
    
    // Set up UI
    setupUI();
    
    // Load and process books (including Robinson Crusoe)
    await loadAllBooks();
    
    // Show main app
    showMainApp();
    
    appState.isInitialized = true;
    console.log('Application initialized successfully with book processing!');
    
  } catch (error) {
    console.error('Failed to initialize application:', error);
    showError('Failed to initialize application. Please refresh the page.');
  }
}

/**
 * Load application configuration
 */
async function loadConfig() {
  const response = await fetch('./data/config.json');
  if (!response.ok) {
    throw new Error(`Failed to load config: ${response.status}`);
  }
  return await response.json();
}

/**
 * Set up UI components and event listeners
 */
function setupUI() {
  // Create difficulty picker
  createDifficultyPicker(appState.config.books, onDifficultySelected);
  
  // Set up typing engine event listeners
  setupTypingEngine();
  
  // Set up input event listener
  const typeBox = document.getElementById('type-box');
  if (typeBox) {
    typeBox.addEventListener('input', onUserInput);
    typeBox.addEventListener('paste', preventPaste);
  }
  
  // Set up new passage button
  const newPassageBtn = document.getElementById('new-passage-btn');
  if (newPassageBtn) {
    newPassageBtn.addEventListener('click', onNewPassageRequest);
  }
  
  // Initial button states
  updateButtonStates(false, false);
}

/**
 * Set up typing engine event listeners
 */
function setupTypingEngine() {
  appState.typingEngine.addEventListener('start', () => {
    console.log('Typing test started');
    updateButtonStates(true, true);
  });
  
  appState.typingEngine.addEventListener('update', (event) => {
    const metrics = event.detail;
    updateStats(metrics);
    
    // Update character highlighting
    const charAnalysis = appState.typingEngine.getCharacterAnalysis();
    updatePassageDisplay(charAnalysis);
  });
  
  appState.typingEngine.addEventListener('complete', (event) => {
    const finalMetrics = event.detail;
    console.log('Typing test completed:', finalMetrics);
    
    // Save personal best
    savePersonalBest(appState.currentDifficulty, finalMetrics);
    
    // Show completion modal
    getPersonalBest(appState.currentDifficulty).then(personalBest => {
      showCompletionModal(
        finalMetrics,
        personalBest,
        onTryAgain,
        onNewPassageRequest
      );
    });
    
    updateButtonStates(true, false);
  });
}

/**
 * Load and process books (including Robinson Crusoe for beginners)
 */
async function loadAllBooks() {
  console.log('🚀 Initializing Typing Speed App with Book Processing');
  console.log('📚 Processing Robinson Crusoe for beginner level');
  updateLoadingMessage('Loading books...');
  
  const books = appState.config.books;
  const cacheValidityDays = appState.config.cacheValidityDays;
  
  // Import required modules
  const { hasPassages } = await import('./modules/passageStore.js');
  const { loadRawBook } = await import('./modules/bookLoader.js');
  const { processBook } = await import('./modules/textProcessor.js');
  
  for (const book of books) {
    try {
      updateLoadingMessage(`Loading ${book.title}...`);
      
      // Check if passages already exist
      if (await hasPassages(book.difficulty)) {
        console.log(`✅ Passages already cached for ${book.difficulty} (${book.title})`);
        continue;
      }
      
      // Load raw book content
      const rawText = await loadRawBook(book, cacheValidityDays);
      
      // Process into passages with difficulty-specific filtering
      updateLoadingMessage(`Processing ${book.title} for ${book.difficulty} level...`);
      await processBook(rawText, book);
      
      console.log(`✅ Successfully processed ${book.title} for ${book.difficulty} level`);
      
    } catch (error) {
      console.error(`❌ Failed to load ${book.title}:`, error);
      // Continue with other books
    }
  }
  
  updateLoadingMessage('All books processed successfully');
  console.log('🎉 Book processing complete! All difficulty levels ready.');
}

/**
 * Handle difficulty selection
 */
async function onDifficultySelected(difficulty, bookConfig) {
  console.log(`Selected difficulty: ${difficulty}`);
  
  appState.currentDifficulty = difficulty;
  appState.currentPassage = null;
  
  // Reset typing engine
  appState.typingEngine.reset();
  resetStats();
  
  // Clear current input
  const typeBox = document.getElementById('type-box');
  if (typeBox) {
    typeBox.value = '';
  }
  
  // Load a new passage
  await loadNewPassage();
}

/**
 * Load a new passage for the current difficulty
 */
async function loadNewPassage() {
  if (!appState.currentDifficulty) return;
  
  try {
    showPassageLoading();
    
    const passage = await getRandom(appState.currentDifficulty);
    if (!passage) {
      throw new Error('No passages available for this difficulty');
    }
    
    appState.currentPassage = passage;
    appState.typingEngine.setTargetText(passage.text);
    
    displayPassage(passage);
    updateButtonStates(true, false);
    
    // Focus the input box
    const typeBox = document.getElementById('type-box');
    if (typeBox) {
      typeBox.focus();
    }
    
  } catch (error) {
    console.error('Failed to load passage:', error);
    showPassageError('Failed to load passage. Please try again.');
    updateButtonStates(false, false);
  }
}

/**
 * Handle user input
 */
function onUserInput(event) {
  if (!appState.currentPassage) return;
  
  const input = event.target.value;
  appState.typingEngine.processInput(input);
}

/**
 * Prevent paste events
 */
function preventPaste(event) {
  event.preventDefault();
}

/**
 * Handle new passage request
 */
async function onNewPassageRequest() {
  if (!appState.currentDifficulty) return;
  
  // Reset input
  const typeBox = document.getElementById('type-box');
  if (typeBox) {
    typeBox.value = '';
  }
  
  // Reset engine and stats
  appState.typingEngine.reset();
  resetStats();
  
  // Load new passage
  await loadNewPassage();
}

/**
 * Handle try again request (same passage)
 */
async function onTryAgain() {
  if (!appState.currentPassage || !appState.currentDifficulty) return;
  
  try {
    // Get the same passage by ID
    const passage = await getById(appState.currentDifficulty, appState.currentPassage.id);
    if (!passage) {
      // Fallback to new passage
      await onNewPassageRequest();
      return;
    }
    
    // Reset input
    const typeBox = document.getElementById('type-box');
    if (typeBox) {
      typeBox.value = '';
      typeBox.focus();
    }
    
    // Reset engine and stats
    appState.typingEngine.reset();
    appState.typingEngine.setTargetText(passage.text);
    resetStats();
    
    // Display passage
    displayPassage(passage);
    updateButtonStates(true, false);
    
  } catch (error) {
    console.error('Failed to reload passage:', error);
    await onNewPassageRequest();
  }
}

/**
 * Save personal best score
 */
async function savePersonalBest(difficulty, metrics) {
  if (!difficulty || metrics.netWPM <= 0) return;
  
  try {
    const currentBest = await getPersonalBest(difficulty);
    
    if (!currentBest || metrics.netWPM > currentBest.netWPM) {
      const bestData = {
        netWPM: metrics.netWPM,
        grossWPM: metrics.grossWPM,
        accuracy: metrics.accuracy,
        timeElapsed: metrics.timeElapsed,
        date: new Date().toISOString()
      };
      
      localStorage.setItem(`typing-speed-best-${difficulty}`, JSON.stringify(bestData));
      console.log(`New personal best for ${difficulty}: ${metrics.netWPM} WPM`);
    }
  } catch (error) {
    console.error('Failed to save personal best:', error);
  }
}

/**
 * Get personal best for difficulty
 */
async function getPersonalBest(difficulty) {
  try {
    const stored = localStorage.getItem(`typing-speed-best-${difficulty}`);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Failed to get personal best:', error);
    return null;
  }
}

/**
 * Update loading message
 */
function updateLoadingMessage(message) {
  const loadingElement = document.querySelector('#loading p');
  if (loadingElement) {
    loadingElement.textContent = message;
  }
}

/**
 * Show main application
 */
function showMainApp() {
  const loading = document.getElementById('loading');
  const mainApp = document.getElementById('main-app');
  
  if (loading) loading.classList.add('hidden');
  if (mainApp) mainApp.classList.remove('hidden');
}

/**
 * Show error message
 */
function showError(message) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.innerHTML = `
      <div class="text-center py-8">
        <div class="text-red-400 text-xl mb-4">⚠️ Error</div>
        <p class="text-gray-400">${message}</p>
        <button onclick="location.reload()" class="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded">
          Retry
        </button>
      </div>
    `;
  }
}

// Debug function to clear all book processing cache
window.clearTypingCache = async function() {
  const { clearAllData } = await import('./modules/passageStore.js');
  try {
    await clearAllData();
    console.log('✅ Cache cleared! Refresh the page to reprocess books.');
    alert('Cache cleared! Refresh the page to see newly processed passages.');
  } catch (error) {
    console.error('❌ Failed to clear cache:', error);
  }
};

// Get passage statistics for all difficulties
window.getPassageStats = async function() {
  try {
    const { getStats } = await import('./modules/passageGenerator.js');
    const beginnerStats = await getStats('beginner');
    const intermediateStats = await getStats('intermediate');
    const expertStats = await getStats('expert');
    
    console.log('📊 Passage Statistics:');
    console.log('Beginner (Robinson Crusoe):', beginnerStats);
    console.log('Intermediate (Tom Sawyer):', intermediateStats);
    console.log('Expert (Origin of Species):', expertStats);
    
    alert(`Passage Stats:
Beginner: ${beginnerStats.total} passages (${beginnerStats.remaining} remaining)
Intermediate: ${intermediateStats.total} passages (${intermediateStats.remaining} remaining)  
Expert: ${expertStats.total} passages (${expertStats.remaining} remaining)`);
  } catch (error) {
    console.error('❌ Failed to get passage stats:', error);
  }
};

// Test passage generation for Robinson Crusoe
window.testRobinsonCrusoe = async function() {
  try {
    const { getRandom } = await import('./modules/passageGenerator.js');
    const passage = await getRandom('beginner');
    console.log('📖 Robinson Crusoe passage sample:', passage);
    alert(`Robinson Crusoe Sample:
"${passage.text.substring(0, 100)}..."
Length: ${passage.length} chars
Grade: ${passage.grade}`);
  } catch (error) {
    console.error('❌ Failed to test Robinson Crusoe:', error);
  }
};

window.testMeaningfulSentences = async function() {
  try {
    const { preview } = await import('./modules/passageGenerator.js');
    const difficulties = ['beginner', 'intermediate', 'expert'];
    
    for (const difficulty of difficulties) {
      const previews = await preview(difficulty, 10);
      const meaningful = previews.filter(p => p.meaningful);
      console.log(`\n📖 ${difficulty.toUpperCase()}: ${meaningful.length}/${previews.length} meaningful passages`);
      
      // Show first meaningful passage
      if (meaningful.length > 0) {
        console.log(`✅ Sample meaningful passage: "${meaningful[0].preview}"`);
      }
      
      // Show any non-meaningful passages for debugging
      const nonMeaningful = previews.filter(p => !p.meaningful);
      if (nonMeaningful.length > 0) {
        console.log(`❌ Non-meaningful passages found:`, nonMeaningful.map(p => p.preview));
      }
    }
    
    alert('✅ Check console for meaningful sentence analysis!\n\nThis shows the quality of passages before users see them.');
  } catch (error) {
    console.error('❌ Error testing meaningful sentences:', error);
  }
};

window.checkGutenbergCleanup = async function() {
  try {
    const { getPassages } = await import('./modules/passageStore.js');
    const difficulties = ['beginner', 'intermediate', 'expert'];
    const gutenbergTerms = /\b(gutenberg|project gutenberg|produced by|created by|ebook|etext|isbn|edition|volume|copyright|public domain|gutenberg\.org|this ebook|literary archive|foundation|distributed|proofreading)\b/i;
    
    console.log('\n🧹 GUTENBERG CLEANUP ANALYSIS');
    
    for (const difficulty of difficulties) {
      const passages = await getPassages(difficulty);
      const gutenbergPassages = passages.filter(p => gutenbergTerms.test(p.text));
      
      console.log(`\n📖 ${difficulty.toUpperCase()}:`);
      console.log(`   Total passages: ${passages.length}`);
      console.log(`   Gutenberg references found: ${gutenbergPassages.length}`);
      
      if (gutenbergPassages.length > 0) {
        console.log(`   ❌ Problematic passages:`);
        gutenbergPassages.forEach((p, i) => {
          const match = p.text.match(gutenbergTerms);
          console.log(`      ${i + 1}. "${p.text.substring(0, 80)}..." (contains: "${match[0]}")`);
        });
      } else {
        console.log(`   ✅ All passages are clean!`);
      }
    }
    
    alert(`🧹 Gutenberg cleanup analysis complete!\n\nCheck console for detailed results. This verifies no Project Gutenberg references remain in passages.`);
  } catch (error) {
    console.error('❌ Error checking Gutenberg cleanup:', error);
  }
};

// Initialize application when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}