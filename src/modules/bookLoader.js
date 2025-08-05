/**
 * Book loader module - fetches and caches raw book text
 */

import { storeRawBook, getRawBook, isRawBookFresh } from './passageStore.js';

/**
 * Load raw book content, using cache when available and fresh
 * @param {Object} bookCfg - Book configuration object
 * @param {number} cacheValidityDays - Number of days cache is valid
 * @returns {string} - Clean book text
 */
export async function loadRawBook(bookCfg, cacheValidityDays = 30) {
  const maxAgeMs = cacheValidityDays * 24 * 60 * 60 * 1000;
  
  // Check if we have fresh cached content
  if (await isRawBookFresh(bookCfg.id, maxAgeMs)) {
    const cachedBook = await getRawBook(bookCfg.id);
    return cachedBook.content;
  }
  
  // Fetch fresh content
  console.log(`Fetching book: ${bookCfg.title}`);
  
  try {
    const response = await fetch(bookCfg.file);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${bookCfg.file}: ${response.status}`);
    }
    
    const rawText = await response.text();
    const cleanText = cleanBookText(rawText);
    
    // Cache the cleaned content
    await storeRawBook(bookCfg.id, cleanText);
    
    return cleanText;
  } catch (error) {
    console.error(`Error loading book ${bookCfg.id}:`, error);
    
    // Try to return cached content even if stale
    const cachedBook = await getRawBook(bookCfg.id);
    if (cachedBook) {
      console.warn(`Using stale cached content for ${bookCfg.id}`);
      return cachedBook.content;
    }
    
    throw error;
  }
}

/**
 * Clean raw book text by removing headers, footers, and formatting
 * @param {string} rawText - Raw text from file
 * @returns {string} - Cleaned text
 */
function cleanBookText(rawText) {
  let text = rawText;
  
  // Handle line breaks from RTF conversion
  text = text.replace(/\\\s*/g, '\n');
  
  // Remove extra whitespace and normalize line breaks
  text = text.replace(/\n\s*\n\s*\n/g, '\n\n'); // Multiple line breaks to double
  text = text.replace(/[ \t]+/g, ' '); // Multiple spaces to single
  text = text.replace(/\n /g, '\n'); // Space at beginning of line
  
  // Remove common Project Gutenberg headers/footers
  text = removeGutenbergHeaders(text);
  
  // Clean up specific formatting artifacts
  text = text.replace(/\*\s*\*\s*\*.*?\*\s*\*\s*\*/g, ''); // Remove asterisk separators
  text = text.replace(/_{3,}/g, ''); // Remove underline separators
  text = text.replace(/-{3,}/g, ''); // Remove dash separators
  
  // Remove chapter numbers and excessive spacing around them
  text = text.replace(/\n\s*CHAPTER\s+[IVXLCDM\d]+\s*\n/gi, '\n\n');
  text = text.replace(/\n\s*Chapter\s+\d+\s*\n/gi, '\n\n');
  
  // Final cleanup
  text = text.replace(/\n{3,}/g, '\n\n'); // Max 2 consecutive line breaks
  text = text.trim();
  
  return text;
}

/**
 * Remove Project Gutenberg headers and footers
 * @param {string} text - Text to clean
 * @returns {string} - Text without headers/footers
 */
function removeGutenbergHeaders(text) {
  // Common Gutenberg markers
  const markers = [
    /\*\*\*\s*START OF .*?\*\*\*/i,
    /\*\*\*\s*END OF .*?\*\*\*/i,
    /\*\*\* START OF THIS PROJECT GUTENBERG.*?\*\*\*/i,
    /\*\*\* END OF THIS PROJECT GUTENBERG.*?\*\*\*/i,
    /Produced by.*?Gutenberg/i,
    /Project Gutenberg's.*?\n/gi,
    /This eBook is for the use of anyone anywhere.*?\n/gi,
    /Created by Judith Boss.*?\n/gi,
    /THE MILLENNIUM FULCRUM EDITION.*?\n/gi
  ];
  
  let cleanText = text;
  markers.forEach(marker => {
    cleanText = cleanText.replace(marker, '');
  });
  
  // Remove everything before the actual content starts
  // Look for the first substantial paragraph
  const lines = cleanText.split('\n');
  let startIndex = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Look for a line that starts the actual content (not metadata)
    if (line.length > 50 && !line.match(/^(produced|created|project|gutenberg|isbn|title|author|edition)/i)) {
      startIndex = i;
      break;
    }
  }
  
  // Also try to find common story beginnings
  const contentStart = cleanText.search(/(Alice was beginning|Tom|Most of the adventures|When on board)/i);
  if (contentStart > 0) {
    cleanText = cleanText.substring(contentStart);
  } else if (startIndex > 0) {
    cleanText = lines.slice(startIndex).join('\n');
  }
  
  return cleanText.trim();
}