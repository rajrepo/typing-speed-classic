/**
 * Remote Passage Service - Fetches passages from API instead of local generation
 */

import { generateBeginnerPassage } from './sensibleLoremGenerator.js';

class RemotePassageService {
  constructor() {
    this.cache = new Map();
    this.cacheConfig = {
      beginner: { maxAge: 300000, maxCount: 20 },      // 5 min, 20 passages
      intermediate: { maxAge: 600000, maxCount: 15 },  // 10 min, 15 passages  
      expert: { maxAge: 900000, maxCount: 10 }         // 15 min, 10 passages
    };
    this.requestQueue = new Map(); // Prevent duplicate requests
  }

  /**
   * Get a random passage for the specified difficulty
   * @param {string} difficulty - Difficulty level
   * @returns {Promise<Object>} - Passage object
   */
  async getPassage(difficulty) {
    try {
      // Check cache first
      const cachedPassage = this.getCachedPassage(difficulty);
      if (cachedPassage) {
        // console.log(`Using cached passage for ${difficulty}`); // Uncomment for debugging  
        return cachedPassage;
      }

      // Check if there's already a request in progress
      if (this.requestQueue.has(difficulty)) {
        // console.log(`Waiting for existing request for ${difficulty}`); // Uncomment for debugging
        return await this.requestQueue.get(difficulty);
      }

      // Create new request
      const requestPromise = this.fetchFromAPI(difficulty);
      this.requestQueue.set(difficulty, requestPromise);

      try {
        const passage = await requestPromise;
        this.requestQueue.delete(difficulty);
        return passage;
      } catch (error) {
        this.requestQueue.delete(difficulty);
        throw error;
      }

    } catch (error) {
      // Use warn instead of error to reduce console noise in dev mode
      console.warn(`API unavailable for ${difficulty}, using fallback:`, error.message);
      return this.getFallbackPassage(difficulty);
    }
  }

  /**
   * Fetch passage from API
   * @param {string} difficulty - Difficulty level
   * @returns {Promise<Object>} - Passage object
   */
  async fetchFromAPI(difficulty) {
    const url = `/api/passages?difficulty=${difficulty}&count=1`;
    // console.log(`Fetching passage from API: ${url}`); // Uncomment for debugging

    try {
      const response = await fetch(url);
      
      // Check if we got a proper API response (should be JSON)
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error(`API returned non-JSON content: ${contentType || 'unknown'}`);
      }
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.passages || data.passages.length === 0) {
        throw new Error('Invalid API response format');
      }

      const passage = data.passages[0];
      
      // Cache the passage
      this.cachePassage(passage);
      
      // Pre-fetch additional passages in background
      this.prefetchPassages(difficulty);
      
      return passage;
      
    } catch (error) {
      // Handle JSON parsing errors and other API failures
      if (error.name === 'SyntaxError' || error.message.includes('JSON')) {
        console.warn(`API endpoint not available (likely in dev mode): ${error.message}`);
      } else {
        console.warn(`API fetch failed: ${error.message}`);
      }
      throw new Error(`API unavailable: ${error.message}`);
    }
  }

  /**
   * Get cached passage if available and fresh
   * @param {string} difficulty - Difficulty level
   * @returns {Object|null} - Cached passage or null
   */
  getCachedPassage(difficulty) {
    const cacheKey = `passages_${difficulty}`;
    const cached = this.cache.get(cacheKey);
    
    if (!cached || cached.passages.length === 0) {
      return null;
    }

    const config = this.cacheConfig[difficulty];
    const now = Date.now();
    
    // Remove expired passages
    cached.passages = cached.passages.filter(p => 
      (now - p.cachedAt) < config.maxAge
    );
    
    if (cached.passages.length === 0) {
      this.cache.delete(cacheKey);
      return null;
    }

    // Return random passage from cache
    const randomIndex = Math.floor(Math.random() * cached.passages.length);
    const passage = cached.passages[randomIndex];
    
    // Remove used passage from cache
    cached.passages.splice(randomIndex, 1);
    
    return passage;
  }

  /**
   * Cache a passage
   * @param {Object} passage - Passage to cache
   */
  cachePassage(passage) {
    const cacheKey = `passages_${passage.difficulty}`;
    const config = this.cacheConfig[passage.difficulty];
    
    if (!this.cache.has(cacheKey)) {
      this.cache.set(cacheKey, { passages: [] });
    }

    const cached = this.cache.get(cacheKey);
    
    // Add timestamp
    passage.cachedAt = Date.now();
    
    // Add to cache
    cached.passages.push(passage);
    
    // Trim cache if too large
    if (cached.passages.length > config.maxCount) {
      cached.passages = cached.passages.slice(-config.maxCount);
    }
  }

  /**
   * Pre-fetch additional passages in background
   * @param {string} difficulty - Difficulty level
   */
  async prefetchPassages(difficulty) {
    try {
      // Don't prefetch if we already have enough cached
      const cacheKey = `passages_${difficulty}`;
      const cached = this.cache.get(cacheKey);
      if (cached && cached.passages.length >= 5) {
        return;
      }

      // Fetch multiple passages
      const url = `/api/passages?difficulty=${difficulty}&count=3`;
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.passages) {
          data.passages.forEach(passage => this.cachePassage(passage));
          console.log(`Pre-fetched ${data.passages.length} passages for ${difficulty}`);
        }
      }
    } catch (error) {
      console.warn('Pre-fetch failed:', error);
    }
  }

  /**
   * Get fallback passage when API fails
   * @param {string} difficulty - Difficulty level
   * @returns {Object} - Fallback passage
   */
  getFallbackPassage(difficulty) {
    console.log(`📝 Generated fallback passage for ${difficulty} level`);
    
    if (difficulty === 'beginner') {
      // Generate locally for beginners
      return generateBeginnerPassage(80, 140);
    }
    
    // Enhanced fallback passages for development
    const intermediateFallbacks = [
      "Tom discovered the hidden cave behind the old mill on a bright summer morning. His adventurous spirit led him to explore the mysterious passages echoing with his footsteps. The excitement of discovery filled his heart as he ventured deeper into the unknown.",
      "The white fence stood before Tom, representing both a chore and an opportunity. His clever mind quickly devised a plan to turn the mundane task of painting into an exciting adventure that would attract his friends.",
      "Summer afternoons by the river provided perfect opportunities for fishing and contemplation. Tom would often sit quietly, watching the lazy clouds drift overhead while waiting patiently for fish to bite his makeshift line."
    ];
    
    const expertFallbacks = [
      "The origin of species through natural selection represents one of the most profound scientific discoveries in human history. Darwin's meticulous observations during his voyage aboard the Beagle provided compelling evidence for the gradual transformation of living organisms over geological time scales.",
      "Natural selection operates through the differential survival and reproduction of individuals within populations. Those organisms possessing advantageous characteristics in specific environmental conditions demonstrate higher fitness levels, subsequently passing these beneficial traits to their offspring.",
      "The intricate relationship between environmental pressures and adaptive responses illustrates the fundamental mechanisms underlying evolutionary processes. Through countless generations, species develop increasingly sophisticated adaptations that enable survival in diverse ecological niches."
    ];
    
    // Select random fallback passage
    const fallbacks = {
      intermediate: intermediateFallbacks,
      expert: expertFallbacks
    };
    
    const passages = fallbacks[difficulty] || fallbacks.intermediate;
    const selectedText = passages[Math.floor(Math.random() * passages.length)];
    
    return {
      id: `fallback_${difficulty}_${Date.now()}`,
      text: selectedText,
      difficulty: difficulty,
      source: 'fallback-dev',
      grade: difficulty === 'intermediate' ? 9 : 14,
      length: selectedText.length,
      wordCount: selectedText.split(/\s+/).length,
      created: new Date().toISOString()
    };
  }

  /**
   * Clear all cached passages
   */
  clearCache() {
    this.cache.clear();
    console.log('Passage cache cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getCacheStats() {
    const stats = {};
    
    for (const [difficulty] of Object.entries(this.cacheConfig)) {
      const cacheKey = `passages_${difficulty}`;
      const cached = this.cache.get(cacheKey);
      stats[difficulty] = {
        count: cached ? cached.passages.length : 0,
        maxCount: this.cacheConfig[difficulty].maxCount
      };
    }
    
    return stats;
  }
}

// Export singleton instance
export const remotePassageService = new RemotePassageService();

// Expose for debugging
if (typeof window !== 'undefined') {
  window.remotePassageService = remotePassageService;
}