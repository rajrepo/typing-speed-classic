/**
 * Vercel Serverless Function - Passage API
 * GET /api/passages?difficulty=beginner&count=1
 */

const { sentence, sentences } = require('sensible-lorem');

// Simple in-memory cache for book passages (will be replaced with proper storage)
const bookPassages = {
  intermediate: [],
  expert: []
};

// Initialize with some sample passages for intermediate/expert
// In production, these would be pre-processed from the actual books
const sampleIntermediatePassages = [
  "The adventures of Tom Sawyer began on a bright summer morning when he discovered a hidden cave behind the old mill. His curiosity led him deeper into the mysterious passages, where echoes of his footsteps created an symphony of exploration.",
  "In the quiet village where Tom lived, every day brought new possibilities for mischief and discovery. The white fence that needed painting became a clever opportunity for negotiation and trade with his fellow youngsters.",
  "Summer afternoons in the small town were perfect for fishing by the river, where Tom would often contemplate the lazy clouds drifting overhead while waiting for the fish to bite his makeshift line."
];

const sampleExpertPassages = [
  "The origin of species through natural selection represents one of the most profound scientific discoveries in human history. Darwin's meticulous observations during his voyage aboard the Beagle provided compelling evidence for the gradual transformation of living organisms over geological time scales.",
  "Natural selection operates through the differential survival and reproduction of individuals within populations. Those organisms possessing advantageous characteristics in specific environmental conditions demonstrate higher fitness levels, subsequently passing these beneficial traits to their offspring with greater frequency.",
  "The intricate relationship between environmental pressures and adaptive responses illustrates the fundamental mechanisms underlying evolutionary processes. Through countless generations, species develop increasingly sophisticated adaptations that enable survival in diverse ecological niches across the planet."
];

// Initialize sample data
bookPassages.intermediate = sampleIntermediatePassages.map((text, index) => ({
  id: `intermediate_${index}`,
  text,
  difficulty: 'intermediate',
  source: 'tom-sawyer',
  grade: 9,
  length: text.length,
  wordCount: text.split(/\s+/).length,
  created: new Date().toISOString()
}));

bookPassages.expert = sampleExpertPassages.map((text, index) => ({
  id: `expert_${index}`,
  text,
  difficulty: 'expert', 
  source: 'origin-species',
  grade: 14,
  length: text.length,
  wordCount: text.split(/\s+/).length,
  created: new Date().toISOString()
}));

/**
 * Generate a beginner passage using sensible-lorem
 */
function generateBeginnerPassage(targetLength = 120) {
  const minLength = 80;
  const maxLength = 140;
  
  let passage = '';
  let sentenceCount = 0;
  
  // Generate sentences until we reach target length
  while (passage.length < targetLength && sentenceCount < 15) {
    const newSentence = sentence();
    
    const testPassage = passage + (passage ? ' ' : '') + newSentence;
    if (testPassage.length > maxLength && passage.length >= minLength) {
      break;
    }
    
    passage = testPassage;
    sentenceCount++;
  }
  
  // Clean up the passage
  passage = passage
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[;:—–\(\)\[\]]/g, ',')
    .replace(/["'"`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  
  return {
    id: `beginner_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    text: passage,
    difficulty: 'beginner',
    source: 'sensible-lorem',
    grade: 6,
    length: passage.length,
    wordCount: passage.split(/\s+/).length,
    created: new Date().toISOString()
  };
}

/**
 * Get passages for a specific difficulty
 */
function getPassagesForDifficulty(difficulty, count = 1) {
  if (difficulty === 'beginner') {
    // Generate fresh passages for beginners
    return Array.from({ length: count }, () => generateBeginnerPassage());
  }
  
  // For intermediate and expert, return from pre-defined samples
  const available = bookPassages[difficulty] || [];
  if (available.length === 0) {
    throw new Error(`No passages available for difficulty: ${difficulty}`);
  }
  
  // Return random passages
  const passages = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * available.length);
    passages.push({
      ...available[randomIndex],
      id: `${difficulty}_${Date.now()}_${i}` // Ensure unique IDs
    });
  }
  
  return passages;
}

/**
 * Main API handler
 */
module.exports = async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
  
  try {
    const { difficulty = 'beginner', count = '1', refresh = 'false' } = req.query;
    
    // Validate difficulty
    const validDifficulties = ['beginner', 'intermediate', 'expert'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty. Must be: beginner, intermediate, or expert'
      });
    }
    
    // Validate count
    const passageCount = Math.min(Math.max(parseInt(count, 10) || 1, 1), 10);
    
    // Generate passages
    const passages = getPassagesForDifficulty(difficulty, passageCount);
    
    // Set cache headers
    const cacheMaxAge = difficulty === 'beginner' ? 300 : 600; // 5min for beginner, 10min for others
    res.setHeader('Cache-Control', `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=300`);
    res.setHeader('ETag', `"${difficulty}-${Date.now()}"`);
    
    // Return success response
    return res.status(200).json({
      success: true,
      passages,
      metadata: {
        difficulty,
        count: passages.length,
        generated: new Date().toISOString(),
        source: difficulty === 'beginner' ? 'sensible-lorem' : 'book-samples'
      },
      cache: {
        maxAge: cacheMaxAge,
        etag: `${difficulty}-${Date.now()}`
      }
    });
    
  } catch (error) {
    console.error('Passages API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}