/**
 * Difficulty analyzer using Flesch-Kincaid formula
 */

/**
 * Calculate Flesch-Kincaid Grade Level and Reading Ease
 * @param {string} text - The text to analyze
 * @returns {object} - {grade: number, ease: number}
 */
export function analyze(text) {
  if (!text || text.trim().length === 0) {
    return { grade: 0, ease: 0 };
  }

  // Clean the text and calculate basic metrics
  const cleanText = text.replace(/[^\w\s.!?]/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Count sentences (split by sentence endings)
  const sentences = cleanText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const sentenceCount = sentences.length || 1;
  
  // Count words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length || 1;
  
  // Count syllables
  let syllableCount = 0;
  words.forEach(word => {
    syllableCount += countSyllables(word);
  });
  
  // Ensure we have at least some syllables
  syllableCount = Math.max(syllableCount, wordCount);
  
  // Calculate averages
  const avgSentenceLength = wordCount / sentenceCount;
  const avgSyllablesPerWord = syllableCount / wordCount;
  
  // Flesch Reading Ease Score (0-100, higher = easier)
  const ease = Math.max(0, Math.min(100, 
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  ));
  
  // Flesch-Kincaid Grade Level
  const grade = Math.max(0, 
    (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59
  );
  
  return {
    grade: Math.round(grade * 10) / 10,
    ease: Math.round(ease * 10) / 10
  };
}

/**
 * Count syllables in a word using heuristic rules
 * @param {string} word - The word to count syllables for
 * @returns {number} - Number of syllables
 */
function countSyllables(word) {
  if (!word || word.length === 0) return 0;
  
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length === 0) return 0;
  
  // Count vowel groups
  let syllables = 0;
  let previousWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const char = word[i];
    const isVowel = 'aeiouy'.includes(char);
    
    if (isVowel && !previousWasVowel) {
      syllables++;
    }
    previousWasVowel = isVowel;
  }
  
  // Handle silent 'e'
  if (word.endsWith('e') && syllables > 1) {
    syllables--;
  }
  
  // Handle special cases
  if (word.endsWith('le') && word.length > 2 && !'aeiouy'.includes(word[word.length - 3])) {
    syllables++;
  }
  
  // Ensure at least 1 syllable
  return Math.max(1, syllables);
}