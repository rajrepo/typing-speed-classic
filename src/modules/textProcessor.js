/**
 * FIXED Text processor - converts raw book text into typing passages
 * This version fixes the special character bug for beginner/intermediate levels
 */

import { analyze } from './difficultyAnalyzer.js';
import { storePassages } from './passageStore.js';

/**
 * Process raw book text into passages that meet the criteria
 * @param {string} rawText - Cleaned book text
 * @param {Object} bookCfg - Book configuration object
 * @returns {Array} - Array of passage objects
 */
export async function processBook(rawText, bookCfg) {
  console.log(`Processing ${bookCfg.title}...`);
  
  const passages = [];
  const [minLength, maxLength] = bookCfg.passageLength;
  const targetGrade = bookCfg.targetGrade;
  const usedFingerprints = new Set();
  
  // Split text into paragraphs
  const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  // Process paragraphs to create candidate passages
  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i].trim();
    
    // Try different passage lengths from this starting point
    const candidatePassages = generateCandidatePassages(
      paragraphs, 
      i, 
      minLength, 
      maxLength,
      bookCfg.difficulty
    );
    
    for (const candidate of candidatePassages) {
      if (candidate.length < minLength || candidate.length > maxLength) continue;
      
      // EXTRA VALIDATION: Double-check character filtering for beginner/intermediate
      if (!isCharacterSetValid(candidate, bookCfg.difficulty)) {
        continue;
      }
      
      // Create fingerprint for deduplication
      const fingerprint = createFingerprint(candidate);
      if (usedFingerprints.has(fingerprint)) continue;
      
      // Analyze difficulty
      const analysis = analyze(candidate);
      const gradeDiff = Math.abs(analysis.grade - targetGrade);
      
      // Check if passage is suitable for the difficulty level
      if (gradeDiff <= 1.5 && isPassageSuitableForDifficulty(candidate, bookCfg.difficulty)) {
        passages.push({
          id: `${bookCfg.id}_${passages.length}`,
          text: candidate,
          grade: analysis.grade,
          ease: analysis.ease,
          fingerprint,
          length: candidate.length,
          wordCount: candidate.split(/\s+/).length
        });
        
        usedFingerprints.add(fingerprint);
        
        // Limit number of passages to prevent memory issues
        if (passages.length >= 500) break;
      }
    }
    
    if (passages.length >= 500) break;
  }
  
  console.log(`Generated ${passages.length} passages for ${bookCfg.title}`);
  
  // FINAL VALIDATION: Double-check all passages before storing
  const validatedPassages = passages.filter(passage => {
    const isValid = isCharacterSetValid(passage.text, bookCfg.difficulty);
    if (!isValid) {
      console.warn(`Rejected passage with invalid characters: "${passage.text.substring(0, 50)}..."`);
    }
    return isValid;
  });
  
  console.log(`Final count after validation: ${validatedPassages.length} passages for ${bookCfg.title}`);
  
  // Store passages in IndexedDB
  await storePassages(bookCfg.difficulty, validatedPassages);
  
  return validatedPassages;
}

/**
 * FIXED: Validate character set for difficulty level
 * @param {string} text - Text to validate
 * @param {string} difficulty - Difficulty level
 * @returns {boolean} - True if character set is valid
 */
function isCharacterSetValid(text, difficulty) {
  if (difficulty === 'beginner' || difficulty === 'intermediate') {
    // STRICT: Only allow letters, numbers, spaces, periods, and commas
    const allowedPattern = /^[a-zA-Z0-9\s.,]+$/;
    return allowedPattern.test(text);
  }
  
  // Expert level allows more characters
  return true;
}

/**
 * Generate candidate passages of different lengths starting from a paragraph
 * @param {Array} paragraphs - Array of all paragraphs
 * @param {number} startIndex - Starting paragraph index
 * @param {number} minLength - Minimum character length
 * @param {number} maxLength - Maximum character length
 * @param {string} difficulty - Difficulty level for text cleaning
 * @returns {Array} - Array of candidate passage strings
 */
function generateCandidatePassages(paragraphs, startIndex, minLength, maxLength, difficulty = 'intermediate') {
  const candidates = [];
  let currentText = '';
  
  // Start with the current paragraph
  for (let i = startIndex; i < paragraphs.length && currentText.length < maxLength * 1.5; i++) {
    const paragraph = paragraphs[i].trim();
    
    if (currentText.length === 0) {
      currentText = paragraph;
    } else {
      currentText += ' ' + paragraph;
    }
    
    // If we have enough text, try to create passages
    if (currentText.length >= minLength) {
      // Try to break at sentence boundaries
      const sentences = currentText.match(/[^.!?]*[.!?]+/g) || [];
      let builtText = '';
      
      for (const sentence of sentences) {
        const newText = builtText + sentence;
        if (newText.length >= minLength && newText.length <= maxLength) {
          const cleanedText = cleanPassageText(newText.trim(), difficulty);
          if (cleanedText && cleanedText.length >= minLength) {
            candidates.push(cleanedText);
          }
        }
        builtText = newText;
        
        if (builtText.length > maxLength) break;
      }
      
      // Also try the full text if it fits
      if (currentText.length <= maxLength) {
        const cleanedText = cleanPassageText(currentText, difficulty);
        if (cleanedText && cleanedText.length >= minLength) {
          candidates.push(cleanedText);
        }
      }
    }
  }
  
  return candidates;
}

/**
 * FIXED: Clean and normalize passage text with stricter filtering
 * @param {string} text - Raw passage text
 * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
 * @returns {string} - Cleaned passage text
 */
function cleanPassageText(text, difficulty = 'intermediate') {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text
    // Normalize whitespace first
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();

  if (difficulty === 'beginner' || difficulty === 'intermediate') {
    // ULTRA-STRICT cleaning for beginner and intermediate
    cleaned = cleaned
      // First pass: Remove known problematic patterns
      .replace(/\b(gutenberg|project gutenberg|produced by|created by|ebook|etext)\b/gi, '')
      .replace(/\b(isbn|edition|volume|copyright|public domain|gutenberg\.org)\b/gi, '')
      .replace(/\*+[^*]*\*+/g, '') // Remove anything between asterisks
      .replace(/\[[^\]]*\]/g, '') // Remove anything in square brackets
      .replace(/\([^)]*\)/g, '') // Remove anything in parentheses for safety
      
      // Second pass: Character-by-character filtering
      // Split into characters and only keep allowed ones
      .split('')
      .filter(char => {
        const code = char.charCodeAt(0);
        // Only allow:
        // - Letters: A-Z, a-z (65-90, 97-122)
        // - Numbers: 0-9 (48-57)
        // - Space (32)
        // - Period (46)
        // - Comma (44)
        return (
          (code >= 65 && code <= 90) ||   // A-Z
          (code >= 97 && code <= 122) ||  // a-z
          (code >= 48 && code <= 57) ||   // 0-9
          code === 32 ||                  // space
          code === 46 ||                  // period
          code === 44                     // comma
        );
      })
      .join('')
      
      // Third pass: Clean up spacing and punctuation
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/([.,])\s+/g, '$1 ') // Ensure space after punctuation
      .replace(/\s+([.,])/g, '$1') // Remove space before punctuation
      .replace(/[.,]{2,}/g, '.') // Remove repeated punctuation
      .replace(/^\s*[.,]\s*/, '') // Remove leading punctuation
      .replace(/\s*[.,]\s*$/, '.') // Ensure proper ending
      .trim();
      
    // Final validation: If any non-allowed characters remain, reject
    if (!/^[a-zA-Z0-9\s.,]*$/.test(cleaned)) {
      console.warn(`Rejected text with remaining special characters: "${cleaned.substring(0, 50)}..."`);
      return '';
    }
    
    // Make sure we still have meaningful content
    if (cleaned.length < 20 || !/[a-zA-Z]/.test(cleaned)) {
      return '';
    }
    
  } else {
    // Expert level: Normal cleaning but preserve more punctuation
    cleaned = cleaned
      // Remove Gutenberg references
      .replace(/\b(Project Gutenberg|gutenberg\.org|Produced by|Created by)\b/gi, '')
      .replace(/\b(This eBook|ebook|etext|ISBN|Edition|Volume|Copyright)\b/gi, '')
      .replace(/\*\*\*[^*]*\*\*\*/g, '') // Remove *** blocks
      // Normalize quotes and spacing
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/([.!?])\s+/g, '$1 ')
      .replace(/[.]{2,}/g, '...')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?');
  }

  return cleaned;
}

/**
 * ENHANCED: Check if passage is suitable for the given difficulty level
 * @param {string} text - Passage text
 * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
 * @returns {boolean} - True if suitable
 */
function isPassageSuitableForDifficulty(text, difficulty) {
  if (difficulty === 'beginner' || difficulty === 'intermediate') {
    // Double-check character set one more time
    if (!/^[a-zA-Z0-9\s.,]+$/.test(text)) {
      console.warn(`Rejected passage with invalid characters for ${difficulty}: "${text.substring(0, 50)}..."`);
      return false;
    }
    
    // Additional quality checks for beginners
    if (difficulty === 'beginner') {
      const sentenceCount = (text.match(/[.]/g) || []).length;
      
      // Reject if sentences are too long on average
      const avgSentenceLength = text.length / Math.max(sentenceCount, 1);
      if (avgSentenceLength > 120) return false;
      
      // Reject if too many numbers (should focus on letters)
      const numberCount = (text.match(/[0-9]/g) || []).length;
      const numberRatio = numberCount / text.length;
      if (numberRatio > 0.05) return false; // More than 5% numbers
      
      // Reject if too many capital letters
      const capitalCount = (text.match(/[A-Z]/g) || []).length;
      const capitalRatio = capitalCount / text.length;
      if (capitalRatio > 0.08) return false; // More than 8% capitals
    }
  }
  
  return true;
}

/**
 * Create a fingerprint for deduplication
 * @param {string} text - Passage text
 * @returns {string} - Fingerprint string
 */
function createFingerprint(text) {
  // Use first 50 characters as fingerprint, normalized
  return text.substring(0, 50).toLowerCase().replace(/\s+/g, ' ').trim();
}