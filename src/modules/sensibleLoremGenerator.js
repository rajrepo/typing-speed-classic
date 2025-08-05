/**
 * Sensible Lorem generator for beginner level - produces meaningful English sentences
 */

import sensibleLorem from 'sensible-lorem';

/**
 * Generate a passage for beginner level using sensible-lorem
 * @param {number} minLength - Minimum character length
 * @param {number} maxLength - Maximum character length
 * @returns {Object} - Passage object similar to book passages
 */
export function generateBeginnerPassage(minLength, maxLength) {
  const targetLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
  
  // Calculate approximate number of words needed (average 5 characters per word)
  const wordsNeeded = Math.ceil(targetLength / 5);
  
  // Generate words using sensible-lorem
  let passage = sensibleLorem(wordsNeeded);
  
  // Clean up the passage to make it more sentence-like
  passage = formatAsProperSentences(passage);
  
  // Adjust length if needed
  while (passage.length < minLength) {
    const additionalWords = sensibleLorem(Math.ceil((minLength - passage.length) / 5));
    const additionalText = formatAsProperSentences(additionalWords);
    passage += ' ' + additionalText;
  }
  
  // Trim to max length if necessary
  if (passage.length > maxLength) {
    // Find last complete sentence that fits
    const sentences = passage.split('. ');
    let trimmedPassage = '';
    
    for (const sent of sentences) {
      const testLength = trimmedPassage + (trimmedPassage ? '. ' : '') + sent;
      if (testLength.length <= maxLength) {
        trimmedPassage = testLength;
      } else {
        break;
      }
    }
    
    passage = trimmedPassage;
    
    // Ensure proper ending
    if (!passage.endsWith('.') && !passage.endsWith('!') && !passage.endsWith('?')) {
      passage += '.';
    }
  }
  
  // Clean up any issues
  passage = cleanPassageText(passage);
  
  // Create passage object similar to book passages
  const passageId = `sensible_beginner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id: passageId,
    text: passage.trim(),
    grade: 6, // Fixed grade for beginner
    ease: 85, // High ease score for beginners
    fingerprint: passage.substring(0, 50).toLowerCase().replace(/\s+/g, ' ').trim(),
    length: passage.length,
    wordCount: passage.split(/\s+/).length,
    source: 'sensible-lorem',
    difficulty: 'beginner'
  };
}

/**
 * Generate multiple beginner passages for caching
 * @param {number} count - Number of passages to generate
 * @param {number} minLength - Minimum character length
 * @param {number} maxLength - Maximum character length
 * @returns {Array} - Array of passage objects
 */
/**
 * Format raw words into proper sentences
 * @param {string} words - Raw words from sensible-lorem
 * @returns {string} - Formatted sentences
 */
function formatAsProperSentences(words) {
  // Split into words and create sentences of 6-12 words each
  const wordArray = words.split(' ');
  const sentences = [];
  
  let currentSentence = [];
  const sentenceLength = 6 + Math.floor(Math.random() * 7); // 6-12 words per sentence
  
  for (let i = 0; i < wordArray.length; i++) {
    currentSentence.push(wordArray[i]);
    
    if (currentSentence.length >= sentenceLength || i === wordArray.length - 1) {
      // Capitalize first word and add period
      if (currentSentence.length > 0) {
        currentSentence[0] = currentSentence[0].charAt(0).toUpperCase() + currentSentence[0].slice(1);
        sentences.push(currentSentence.join(' ') + '.');
        currentSentence = [];
      }
    }
  }
  
  return sentences.join(' ');
}

export function generateBeginnerPassages(count, minLength, maxLength) {
  const passages = [];
  const usedFingerprints = new Set();
  
  for (let i = 0; i < count; i++) {
    let attempts = 0;
    let passage;
    
    // Try to generate unique passages
    do {
      passage = generateBeginnerPassage(minLength, maxLength);
      attempts++;
    } while (usedFingerprints.has(passage.fingerprint) && attempts < 10);
    
    if (!usedFingerprints.has(passage.fingerprint)) {
      passages.push(passage);
      usedFingerprints.add(passage.fingerprint);
    }
  }
  
  return passages;
}

/**
 * Clean and normalize passage text for typing practice
 * @param {string} text - Raw passage text
 * @returns {string} - Cleaned passage text
 */
function cleanPassageText(text) {
  return text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim()
    // Ensure proper sentence spacing
    .replace(/([.!?])\s+/g, '$1 ')
    // Clean up quotes and apostrophes to avoid complexity for beginners
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    // Remove any remaining problematic punctuation for beginners
    .replace(/[;:—–\(\)\[\]]/g, ',') // Replace complex punctuation with commas
    // Clean up excessive punctuation
    .replace(/[.]{2,}/g, '...')
    .replace(/[!]{2,}/g, '!')
    .replace(/[?]{2,}/g, '?')
    // Remove quotes to keep it simple for beginners
    .replace(/["'"`]/g, '')
    // Clean up any double spaces
    .replace(/\s+/g, ' ')
    .trim();
}