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
 * Check if a passage is a meaningful, complete sentence
 * @param {Object} passage - Passage object with text property
 * @param {string} difficulty - Difficulty level for specific validation rules
 * @returns {boolean} - True if passage is meaningful
 */
function isMeaningfulSentence(passage, difficulty) {
  if (!passage || !passage.text) return false;
  
  const text = passage.text.trim();
  if (text.length < 20) return false; // Too short to be meaningful
  
  // Must start with a capital letter
  if (!/^[A-Z]/.test(text)) return false;
  
  // Must end with proper punctuation
  if (difficulty === 'beginner') {
    // Beginners should have sentences ending with periods only
    if (!text.endsWith('.')) return false;
  } else {
    // Intermediate/expert can have periods, exclamation, or question marks
    if (!/[.!?]$/.test(text)) return false;
  }
  
  // Should contain at least one complete word (3+ letters)
  const words = text.split(/\s+/).filter(word => word.replace(/[.,!?]/g, '').length >= 3);
  if (words.length < 3) return false;
  
  // Should not start with common incomplete patterns
  const incompletePatterns = [
    /^(And|But|Or|So|For|Yet|Because|Since|When|Where|While|If|Although|Though)\s/i,
    /^(The|A|An)\s+(and|or|but)\s/i, // "The and...", "A or..."
    /^\w+ing\s/i, // Starting with gerund without context
    /^\w+ed\s/i   // Starting with past participle without context
  ];
  
  // Allow some patterns for intermediate/expert but be stricter for beginners
  if (difficulty === 'beginner') {
    for (const pattern of incompletePatterns) {
      if (pattern.test(text)) return false;
    }
  }
  
  // Should contain reasonable sentence structure (subject-predicate indicators)
  const hasCommonVerbs = /\b(is|was|are|were|has|have|had|do|does|did|can|will|would|could|should|may|might|must|said|says|went|goes|came|comes|made|makes|took|takes|got|gets|saw|sees|found|finds|became|becomes|looked|looks|turned|turns|felt|feels|thought|thinks|knew|knows|wanted|wants|needed|needs|tried|tries|began|begins|started|starts|stopped|stops|lived|lives|worked|works|played|plays|walked|walks|ran|runs|moved|moves|stayed|stays|left|leaves|arrived|arrives|returned|returns|helped|helps|asked|asks|told|tells|gave|gives|brought|brings|put|puts|kept|keeps|held|holds|opened|opens|closed|closes|built|builds|created|creates|discovered|discovers|learned|learns|taught|teaches|showed|shows|seemed|seems|appeared|appears|happened|happens|occurred|occurs|continued|continues|decided|decides|remembered|remembers|forgot|forgets|understood|understands|believed|believes|hoped|hopes|feared|fears|loved|loves|liked|likes|enjoyed|enjoys|hated|hates|preferred|prefers|chose|chooses|selected|selects|followed|follows|led|leads|joined|joins|met|meets|visited|visits|traveled|travels|explored|explores|studied|studies|examined|examines|watched|watches|listened|listens|heard|hears|spoke|speaks|talked|talks|answered|answers|called|calls|wrote|writes|read|reads|sang|sings|danced|dances|cooked|cooks|ate|eats|drank|drinks|slept|sleeps|woke|wakes|died|dies|born|births|grew|grows|changed|changes|improved|improves|failed|fails|succeeded|succeeds|won|wins|lost|loses|fought|fights|protected|protects|saved|saves|killed|kills|destroyed|destroys|fixed|fixes|broke|breaks|built|builds)\b/i;
  
  if (!hasCommonVerbs.test(text)) return false;
  
  return true;
}

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
    
    // Filter out used passages and validate meaningfulness
    const unusedPassages = passages.filter(p => !usedPassages[difficulty].has(p.id));
    const meaningfulUnusedPassages = unusedPassages.filter(p => isMeaningfulSentence(p, difficulty));
    
    // If no meaningful unused passages, try all unused passages as fallback
    let candidatePassages = meaningfulUnusedPassages.length > 0 ? meaningfulUnusedPassages : unusedPassages;
    
    // If all passages used, reset and try again with meaningful filter
    if (candidatePassages.length === 0) {
      console.log(`Resetting used passages for ${difficulty}`);
      usedPassages[difficulty].clear();
      const meaningfulPassages = passages.filter(p => isMeaningfulSentence(p, difficulty));
      candidatePassages = meaningfulPassages.length > 0 ? meaningfulPassages : passages;
    }
    
    // Get random passage from candidates
    const passage = getRandomFromArray(candidatePassages);
    if (passage) {
      usedPassages[difficulty].add(passage.id);
      console.log(`✅ Selected meaningful ${difficulty} passage: "${passage.text.substring(0, 50)}..."`);
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
  
  // Validate that the requested passage is meaningful
  if (passage && !isMeaningfulSentence(passage, difficulty)) {
    console.warn(`⚠️  Requested passage ${passageId} is not meaningful, trying alternative`);
    return getRandom(difficulty); // Fallback to a random meaningful passage
  }
  
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
  const meaningfulPassages = passages.filter(p => isMeaningfulSentence(p, difficulty));
  const previews = [];
  
  const sourcePassages = meaningfulPassages.length > 0 ? meaningfulPassages : passages;
  console.log(`📖 Preview: ${meaningfulPassages.length}/${passages.length} meaningful passages for ${difficulty}`);
  
  for (let i = 0; i < Math.min(count, sourcePassages.length); i++) {
    const passage = sourcePassages[i];
    previews.push({
      id: passage.id,
      preview: passage.text.substring(0, 100) + '...',
      grade: passage.grade,
      length: passage.length,
      wordCount: passage.wordCount,
      meaningful: isMeaningfulSentence(passage, difficulty)
    });
  }
  
  return previews;
}