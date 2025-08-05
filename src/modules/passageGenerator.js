/**
 * FIXED Passage generator - provides random passages for typing tests
 * Removed redundant validation since caching already handles it perfectly
 */

import { getPassages } from './passageStore.js';

// Track used passages to avoid repetition
const usedPassages = {
  beginner: new Set(),
  intermediate: new Set(),
  expert: new Set()
};

/**
 * Get a random unused passage for the specified difficulty
 * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
 * @returns {Object|null} - Passage object or null if none available
 */
export async function getRandom(difficulty) {
  try {
    console.log(`📖 Getting ${difficulty} passage from processed books`);
    
    const passages = await getPassages(difficulty);
    
    if (passages.length === 0) {
      console.warn(`No passages available for difficulty: ${difficulty}`);
      return null;
    }
    
    // Get unused passages and ensure no duplicates
    const unusedPassages = passages.filter(p => !usedPassages[difficulty].has(p.id));
    let candidatePassages = unusedPassages;
    
    // Track session stats
    const usedCount = usedPassages[difficulty].size;
    const totalCount = passages.length;
    const remainingCount = candidatePassages.length;
    
    console.log(`📊 ${difficulty.toUpperCase()} Stats: ${usedCount}/${totalCount} used, ${remainingCount} remaining`);
    
    // If all passages used, reset and shuffle for fresh randomization
    if (candidatePassages.length === 0) {
      console.log(`🔄 All ${totalCount} ${difficulty} passages exhausted - resetting with fresh shuffle`);
      usedPassages[difficulty].clear();
      
      // Shuffle passages for better randomization after reset
      candidatePassages = shuffleArray(passages);
      console.log(`🎲 Shuffled ${candidatePassages.length} passages for maximum randomization`);
    } else {
      // Shuffle remaining candidates for better randomization
      candidatePassages = shuffleArray(candidatePassages);
    }
    
    // Get random passage from shuffled candidates
    const passage = getRandomFromArray(candidatePassages);
    if (passage) {
      usedPassages[difficulty].add(passage.id);
      const newUsedCount = usedPassages[difficulty].size;
      const newRemainingCount = passages.length - newUsedCount;
      
      console.log(`✅ Selected unique ${difficulty} passage (${newUsedCount}/${totalCount}): "${passage.text.substring(0, 50)}..."`);
      console.log(`📈 Progress: ${newRemainingCount} passages remaining in ${difficulty} pool`);
      
      // Warn when approaching exhaustion
      if (newRemainingCount <= 3 && newRemainingCount > 0) {
        console.log(`⚠️  Only ${newRemainingCount} ${difficulty} passages left before reset!`);
      }
    }
    
    return passage;
  } catch (error) {
    console.error(`Failed to get ${difficulty} passage:`, error);
    return null;
  }
}

/**
 * Get a specific passage by ID (for "try again" functionality)
 * @param {string} difficulty - Difficulty level
 * @param {string} passageId - Passage ID
 * @returns {Object|null} - Passage object or null if not found
 */
export async function getById(difficulty, passageId) {
  const passages = await getPassages(difficulty);
  const passage = passages.find(p => p.id === passageId) || null;
  
  // Since passages are pre-validated during caching, no need for re-validation
  if (!passage) {
    console.warn(`⚠️  Passage ${passageId} not found for ${difficulty}, getting random passage`);
    return getRandom(difficulty);
  }
  
  console.log(`✅ Retrieved pre-validated passage: "${passage.text.substring(0, 50)}..."`);
  return passage;
}

/**
 * Get passage statistics for a difficulty level
 * @param {string} difficulty - Difficulty level
 * @returns {Object} - Statistics object
 */
export async function getStats(difficulty) {
  const passages = await getPassages(difficulty);
  
  if (passages.length === 0) {
    return {
      total: 0,
      used: 0,
      remaining: 0,
      avgGrade: 0,
      avgLength: 0
    };
  }
  
  const used = usedPassages[difficulty].size;
  const avgGrade = passages.reduce((sum, p) => sum + p.grade, 0) / passages.length;
  const avgLength = passages.reduce((sum, p) => sum + p.length, 0) / passages.length;
  
  return {
    total: passages.length,
    used: used,
    remaining: passages.length - used,
    avgGrade: Math.round(avgGrade * 10) / 10,
    avgLength: Math.round(avgLength)
  };
}

/**
 * Reset used passages for a difficulty (force refresh)
 * @param {string} difficulty - Difficulty level
 */
export function resetUsed(difficulty) {
  const previousCount = usedPassages[difficulty].size;
  usedPassages[difficulty].clear();
  console.log(`🔄 Manually reset ${previousCount} used ${difficulty} passages - all passages available again`);
}

/**
 * Reset all used passages
 */
export function resetAllUsed() {
  let totalReset = 0;
  Object.keys(usedPassages).forEach(difficulty => {
    const count = usedPassages[difficulty].size;
    totalReset += count;
    usedPassages[difficulty].clear();
    console.log(`🔄 Reset ${count} used ${difficulty} passages`);
  });
  console.log(`🎯 Total reset: ${totalReset} passages across all difficulties`);
}

/**
 * Enhanced Fisher-Yates shuffle for better randomization
 * @param {Array} array - Array to shuffle (creates a copy)
 * @returns {Array} - Shuffled copy of the array
 */
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a truly random element from array using crypto-secure randomization when available
 * @param {Array} array - Array to select from
 * @returns {any} - Random element
 */
function getRandomFromArray(array) {
  if (array.length === 0) return null;
  if (array.length === 1) return array[0];
  
  // Use crypto-secure random if available, fallback to Math.random
  let randomIndex;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    randomIndex = randomArray[0] % array.length;
  } else {
    randomIndex = Math.floor(Math.random() * array.length);
  }
  
  return array[randomIndex];
}

/**
 * Preview passages for a difficulty (for debugging/admin)
 * @param {string} difficulty - Difficulty level
 * @param {number} count - Number of passages to preview
 * @returns {Array} - Array of passage previews
 */
export async function preview(difficulty, count = 5) {
  const passages = await getPassages(difficulty);
  const previews = [];
  
  console.log(`📖 Preview: ${passages.length} pre-validated passages for ${difficulty}`);
  
  for (let i = 0; i < Math.min(count, passages.length); i++) {
    const passage = passages[i];
    previews.push({
      id: passage.id,
      preview: passage.text.substring(0, 100) + '...',
      grade: passage.grade,
      length: passage.length,
      wordCount: passage.wordCount,
      validated: true // All passages are pre-validated during caching
    });
  }
  
  return previews;
}

/**
 * Quick validation check for debugging - verify character sets match expected
 * @param {string} difficulty - Difficulty level
 * @returns {Object} - Validation summary
 */
export async function validateCachedPassages(difficulty) {
  const passages = await getPassages(difficulty);
  const results = {
    total: passages.length,
    valid: 0,
    invalid: 0,
    invalidExamples: []
  };
  
  for (const passage of passages) {
    let isValid = true;
    
    if (difficulty === 'beginner' || difficulty === 'intermediate') {
      // Should only contain letters, numbers, spaces, periods, and commas
      const allowedPattern = /^[a-zA-Z0-9\s.,]+$/;
      if (!allowedPattern.test(passage.text)) {
        isValid = false;
        const invalidChars = passage.text.match(/[^a-zA-Z0-9\s.,]/g);
        results.invalidExamples.push({
          id: passage.id,
          preview: passage.text.substring(0, 50),
          invalidChars: invalidChars ? [...new Set(invalidChars)] : []
        });
      }
    }
    
    if (isValid) {
      results.valid++;
    } else {
      results.invalid++;
    }
  }
  
  return results;
}