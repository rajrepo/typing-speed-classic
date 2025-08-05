/**
 * IndexedDB wrapper for storing passages and raw book text
 */

import { openDB } from 'idb';

const DB_NAME = 'TypingSpeedDB';
const DB_VERSION = 1;

let dbPromise;

/**
 * Initialize the database
 */
export async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Store for raw book content
        if (!db.objectStoreNames.contains('rawBooks')) {
          const rawBooksStore = db.createObjectStore('rawBooks', { keyPath: 'id' });
          rawBooksStore.createIndex('timestamp', 'timestamp');
        }
        
        // Stores for processed passages by difficulty
        ['beginner', 'intermediate', 'expert'].forEach(difficulty => {
          const storeName = `passages_${difficulty}`;
          if (!db.objectStoreNames.contains(storeName)) {
            const passagesStore = db.createObjectStore(storeName, { keyPath: 'id' });
            passagesStore.createIndex('fingerprint', 'fingerprint');
            passagesStore.createIndex('grade', 'grade');
          }
        });
        
        // Store for user statistics and personal bests
        if (!db.objectStoreNames.contains('userStats')) {
          db.createObjectStore('userStats', { keyPath: 'difficulty' });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Store raw book content
 * @param {string} bookId - Book identifier
 * @param {string} content - Raw book text
 */
export async function storeRawBook(bookId, content) {
  const db = await initDB();
  const tx = db.transaction('rawBooks', 'readwrite');
  await tx.store.put({
    id: bookId,
    content,
    timestamp: Date.now()
  });
  await tx.done;
}

/**
 * Get raw book content
 * @param {string} bookId - Book identifier
 * @returns {Object|null} - Book data or null if not found
 */
export async function getRawBook(bookId) {
  const db = await initDB();
  return await db.get('rawBooks', bookId);
}

/**
 * Check if raw book is cached and fresh
 * @param {string} bookId - Book identifier
 * @param {number} maxAgeMs - Maximum age in milliseconds
 * @returns {boolean} - True if fresh, false if stale or missing
 */
export async function isRawBookFresh(bookId, maxAgeMs) {
  const book = await getRawBook(bookId);
  if (!book) return false;
  
  const age = Date.now() - book.timestamp;
  return age < maxAgeMs;
}

/**
 * Store processed passages for a difficulty level
 * @param {string} difficulty - Difficulty level (beginner, intermediate, expert)
 * @param {Array} passages - Array of passage objects
 */
export async function storePassages(difficulty, passages) {
  const db = await initDB();
  const storeName = `passages_${difficulty}`;
  const tx = db.transaction(storeName, 'readwrite');
  
  // Clear existing passages
  await tx.store.clear();
  
  // Store new passages
  for (const passage of passages) {
    await tx.store.put(passage);
  }
  
  await tx.done;
}

/**
 * Get all passages for a difficulty level
 * @param {string} difficulty - Difficulty level
 * @returns {Array} - Array of passage objects
 */
export async function getPassages(difficulty) {
  const db = await initDB();
  const storeName = `passages_${difficulty}`;
  return await db.getAll(storeName);
}

/**
 * Check if passages exist for a difficulty level
 * @param {string} difficulty - Difficulty level
 * @returns {boolean} - True if passages exist
 */
export async function hasPassages(difficulty) {
  const passages = await getPassages(difficulty);
  return passages.length > 0;
}

/**
 * Store user statistics
 * @param {string} difficulty - Difficulty level
 * @param {Object} stats - Statistics object
 */
export async function storeUserStats(difficulty, stats) {
  const db = await initDB();
  const tx = db.transaction('userStats', 'readwrite');
  await tx.store.put({
    difficulty,
    ...stats,
    timestamp: Date.now()
  });
  await tx.done;
}

/**
 * Get user statistics
 * @param {string} difficulty - Difficulty level
 * @returns {Object|null} - Statistics object or null
 */
export async function getUserStats(difficulty) {
  const db = await initDB();
  return await db.get('userStats', difficulty);
}

/**
 * Clear all data (for development/debugging)
 */
export async function clearAllData() {
  const db = await initDB();
  const storeNames = ['rawBooks', 'passages_beginner', 'passages_intermediate', 'passages_expert', 'userStats'];
  
  for (const storeName of storeNames) {
    if (db.objectStoreNames.contains(storeName)) {
      const tx = db.transaction(storeName, 'readwrite');
      await tx.store.clear();
      await tx.done;
    }
  }
}