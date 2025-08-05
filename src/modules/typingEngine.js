/**
 * Typing engine - handles keystroke processing and real-time metrics
 */

export class TypingEngine extends EventTarget {
  constructor() {
    super();
    this.reset();
  }
  
  reset() {
    this.targetText = '';
    this.userInput = '';
    this.startTime = null;
    this.endTime = null;
    this.isActive = false;
    this.errors = [];
    this.updateInterval = null;
    this.lastUpdateTime = 0;
  }
  
  /**
   * Set the target text for typing
   * @param {string} text - Text to type
   */
  setTargetText(text) {
    this.reset();
    this.targetText = text;
  }
  
  /**
   * Process a keystroke
   * @param {string} input - Current user input
   */
  processInput(input) {
    this.userInput = input;
    
    // Start timer on first keystroke
    if (!this.startTime && input.length > 0) {
      this.startTime = Date.now();
      this.isActive = true;
      this.startUpdateLoop();
      this.dispatchEvent(new CustomEvent('start'));
    }
    
    // Check if completed
    if (input.length === this.targetText.length) {
      this.complete();
      return;
    }
    
    // Calculate current metrics
    this.calculateMetrics();
  }
  
  /**
   * Complete the typing test
   */
  complete() {
    if (!this.isActive) return;
    
    this.endTime = Date.now();
    this.isActive = false;
    this.stopUpdateLoop();
    
    const finalMetrics = this.calculateFinalMetrics();
    this.dispatchEvent(new CustomEvent('complete', { detail: finalMetrics }));
  }
  
  /**
   * Start the real-time update loop
   */
  startUpdateLoop() {
    this.updateInterval = setInterval(() => {
      if (this.isActive) {
        const metrics = this.calculateMetrics();
        this.dispatchEvent(new CustomEvent('update', { detail: metrics }));
      }
    }, 200); // Update every 200ms as specified
  }
  
  /**
   * Stop the update loop
   */
  stopUpdateLoop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
  
  /**
   * Calculate current typing metrics
   * @returns {Object} - Metrics object
   */
  calculateMetrics() {
    if (!this.startTime) {
      return {
        grossWPM: 0,
        netWPM: 0,
        accuracy: 0,
        errors: 0,
        timeElapsed: 0,
        progress: 0
      };
    }
    
    const timeElapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const charactersTyped = this.userInput.length;
    const errorsCount = this.countErrors();
    
    // Gross WPM = (total characters typed / 5) / time in minutes
    const grossWPM = timeElapsed > 0 ? (charactersTyped / 5) / timeElapsed : 0;
    
    // Net WPM = ((total characters typed - errors) / 5) / time in minutes
    const netWPM = timeElapsed > 0 ? Math.max(0, (charactersTyped - errorsCount) / 5) / timeElapsed : 0;
    
    // Accuracy = (correct characters / total characters typed) * 100
    const accuracy = charactersTyped > 0 ? ((charactersTyped - errorsCount) / charactersTyped) * 100 : 0;
    
    // Progress percentage
    const progress = (charactersTyped / this.targetText.length) * 100;
    
    return {
      grossWPM: Math.round(grossWPM),
      netWPM: Math.round(netWPM),
      accuracy: Math.round(accuracy),
      errors: errorsCount,
      timeElapsed: Math.round((Date.now() - this.startTime) / 1000),
      progress: Math.round(progress)
    };
  }
  
  /**
   * Calculate final metrics with more precision
   * @returns {Object} - Final metrics object
   */
  calculateFinalMetrics() {
    const timeElapsed = (this.endTime - this.startTime) / 1000 / 60; // minutes
    const charactersTyped = this.userInput.length;
    const errorsCount = this.countErrors();
    
    const grossWPM = timeElapsed > 0 ? (charactersTyped / 5) / timeElapsed : 0;
    const netWPM = timeElapsed > 0 ? Math.max(0, (charactersTyped - errorsCount) / 5) / timeElapsed : 0;
    const accuracy = charactersTyped > 0 ? ((charactersTyped - errorsCount) / charactersTyped) * 100 : 0;
    
    return {
      grossWPM: Math.round(grossWPM * 10) / 10, // One decimal place
      netWPM: Math.round(netWPM * 10) / 10,
      accuracy: Math.round(accuracy * 10) / 10,
      errors: errorsCount,
      timeElapsed: Math.round((this.endTime - this.startTime) / 1000),
      totalCharacters: charactersTyped,
      targetLength: this.targetText.length
    };
  }
  
  /**
   * Count typing errors in current input
   * @returns {number} - Number of errors
   */
  countErrors() {
    let errors = 0;
    const maxLength = Math.min(this.userInput.length, this.targetText.length);
    
    for (let i = 0; i < maxLength; i++) {
      if (this.userInput[i] !== this.targetText[i]) {
        errors++;
      }
    }
    
    return errors;
  }
  
  /**
   * Get the current character position and its status
   * @returns {Object} - Character analysis
   */
  getCurrentCharacter() {
    const position = this.userInput.length;
    
    if (position >= this.targetText.length) {
      return { position: -1, char: '', isCorrect: true, isComplete: true };
    }
    
    return {
      position,
      char: this.targetText[position],
      isCorrect: true,
      isComplete: false
    };
  }
  
  /**
   * Get character analysis for display highlighting
   * @returns {Array} - Array of character objects with status
   */
  getCharacterAnalysis() {
    const analysis = [];
    
    for (let i = 0; i < this.targetText.length; i++) {
      const targetChar = this.targetText[i];
      const userChar = i < this.userInput.length ? this.userInput[i] : null;
      
      let status = 'pending'; // not typed yet
      
      if (userChar !== null) {
        status = userChar === targetChar ? 'correct' : 'incorrect';
      } else if (i === this.userInput.length) {
        status = 'current'; // current character to type
      }
      
      analysis.push({
        char: targetChar,
        status,
        position: i
      });
    }
    
    return analysis;
  }
  
  /**
   * Format time as MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} - Formatted time string
   */
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}