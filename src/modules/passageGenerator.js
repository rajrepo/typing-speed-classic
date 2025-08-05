/**
 * Passage generator - provides random passages for typing tests
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
    
    // Filter out used passages
    const unusedPassages = passages.filter(p => !usedPassages[difficulty].has(p.id));
    
    // If all passages used, reset and use all passages again
    if (unusedPassages.length === 0) {
      console.log(`Resetting used passages for ${difficulty}`);
      usedPassages[difficulty].clear();
      return getRandomFromArray(passages);
    }
    
    // Get random unused passage
    const passage = getRandomFromArray(unusedPassages);
    usedPassages[difficulty].add(passage.id);
    
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
  return passages.find(p => p.id === passageId) || null;
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
  usedPassages[difficulty].clear();
}

/**
 * Reset all used passages
 */
export function resetAllUsed() {
  Object.keys(usedPassages).forEach(difficulty => {
    usedPassages[difficulty].clear();
  });
}

/**
 * Get a random element from an array
 * @param {Array} array - Array to select from
 * @returns {any} - Random element
 */
function getRandomFromArray(array) {
  return array[Math.floor(Math.random() * array.length)];
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
  
  for (let i = 0; i < Math.min(count, passages.length); i++) {
    const passage = passages[i];
    previews.push({
      id: passage.id,
      preview: passage.text.substring(0, 100) + '...',
      grade: passage.grade,
      length: passage.length,
      wordCount: passage.wordCount
    });
  }
  
  return previews;
}