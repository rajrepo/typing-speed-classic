/**
 * Text processor - converts raw book text into typing passages
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
  
  // Store passages in IndexedDB
  await storePassages(bookCfg.difficulty, passages);
  
  return passages;
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
          candidates.push(cleanPassageText(newText.trim(), difficulty));
        }
        builtText = newText;
        
        if (builtText.length > maxLength) break;
      }
      
      // Also try the full text if it fits
      if (currentText.length <= maxLength) {
        candidates.push(cleanPassageText(currentText, difficulty));
      }
    }
  }
  
  return candidates;
}

/**
 * Clean and normalize passage text
 * @param {string} text - Raw passage text
 * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
 * @returns {string} - Cleaned passage text
 */
function cleanPassageText(text, difficulty = 'intermediate') {
  let cleaned = text
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    // Remove leading/trailing whitespace
    .trim();

  if (difficulty === 'beginner') {
    // For beginners: Remove ALL special characters except periods and commas
    cleaned = cleaned
      // Remove quotes, apostrophes, and all other special punctuation
      .replace(/['"'""`]/g, '')              // Remove all types of quotes
      .replace(/[!?;:—–\-\(\)\[\]{}]/g, '')  // Remove exclamation, question, semicolon, colon, dashes, brackets
      .replace(/[&@#$%^*+=<>|\\\/~`_]/g, '') // Remove symbols INCLUDING underscores
      // Keep only letters, numbers, spaces, periods, and commas (NOT \w which includes _)
      .replace(/[^a-zA-Z0-9\s.,]/g, '')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Ensure proper sentence spacing with periods
      .replace(/([.])\s+/g, '$1 ')
      // Clean up excessive punctuation
      .replace(/[.]{2,}/g, '.')
      .replace(/[,]{2,}/g, ',')
      .trim();
  } else {
    // For intermediate and expert: Normal cleaning
    cleaned = cleaned
      // Ensure proper sentence spacing
      .replace(/([.!?])\s+/g, '$1 ')
      // Clean up quotes and apostrophes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Remove excessive punctuation
      .replace(/[.]{2,}/g, '...')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?');
  }

  return cleaned;
}

/**
 * Check if passage is suitable for the given difficulty level
 * @param {string} text - Passage text
 * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
 * @returns {boolean} - True if suitable
 */
function isPassageSuitableForDifficulty(text, difficulty) {
  if (difficulty === 'beginner') {
    // For beginners, eliminate all complexity
    const quoteCount = (text.match(/['"'""`]/g) || []).length;
    const sentenceCount = (text.match(/[.!?]/g) || []).length;
    
    // Reject if ANY quotes present (zero tolerance for beginners)
    if (quoteCount > 0) return false;
    
    // Reject if sentences are too long on average (more lenient)
    const avgSentenceLength = text.length / Math.max(sentenceCount, 1);
    if (avgSentenceLength > 150) return false;
    
    // Reject passages with complex punctuation patterns (slightly more lenient)
    const complexPunctuation = /[;:—–\(\)\[\]]/g;
    const complexCount = (text.match(complexPunctuation) || []).length;
    if (complexCount > 3) return false;
    
    // Reject passages with too many capital letters (more lenient)
    const capitalCount = (text.match(/[A-Z]/g) || []).length;
    const capitalRatio = capitalCount / text.length;
    if (capitalRatio > 0.12) return false; // More than 12% capitals
  }
  
  return true;
}

/**
 * Create a fingerprint for deduplication
 * @param {string} text - Passage text
 * @returns {string} - Fingerprint string
 */
function createFingerprint(text) {
  // Use first 50 characters as fingerprint
  return text.substring(0, 50).toLowerCase().replace(/\s+/g, ' ').trim();
}