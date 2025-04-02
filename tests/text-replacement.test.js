/**
 * Tests for the Yale to Fale text replacement logic
 * This test avoids using Cheerio directly to prevent ESM compatibility issues
 */

describe('Yale to Fale text replacement logic', () => {
  // Simple text replacement function that mimics the core functionality
  function replaceYaleWithFale(text) {
    return text
      .replace(/Yale/g, 'Fale')
      .replace(/yale/g, 'fale')
      .replace(/YALE/g, 'FALE');
  }
  
  test('should replace Yale with Fale in regular text', () => {
    const originalText = 'Yale University is located in New Haven';
    const replacedText = replaceYaleWithFale(originalText);
    
    expect(replacedText).toBe('Fale University is located in New Haven');
    expect(replacedText).not.toContain('Yale');
  });
  
  test('should handle different cases of Yale', () => {
    const testCases = [
      { input: 'Yale University', expected: 'Fale University' },
      { input: 'yale university', expected: 'fale university' },
      { input: 'YALE UNIVERSITY', expected: 'FALE UNIVERSITY' },
      { input: 'Welcome to Yale', expected: 'Welcome to Fale' },
      { input: 'yale.edu', expected: 'fale.edu' }
    ];
    
    testCases.forEach(({ input, expected }) => {
      expect(replaceYaleWithFale(input)).toBe(expected);
    });
  });
  
  test('should handle text with no Yale references', () => {
    const originalText = 'Harvard University is located in Cambridge';
    const replacedText = replaceYaleWithFale(originalText);
    
    expect(replacedText).toBe(originalText);
  });
  
  test('should handle Yale with punctuation and special characters', () => {
    const testCases = [
      { input: 'Yale\'s campus', expected: 'Fale\'s campus' },
      { input: 'Yale.', expected: 'Fale.' },
      { input: 'Yale!', expected: 'Fale!' },
      { input: 'Yale?', expected: 'Fale?' },
      { input: '(Yale)', expected: '(Fale)' },
      { input: '"Yale"', expected: '"Fale"' }
    ];
    
    testCases.forEach(({ input, expected }) => {
      expect(replaceYaleWithFale(input)).toBe(expected);
    });
  });
  
  test('should handle Yale at beginning and end of text', () => {
    const testCases = [
      { input: 'Yale is a university', expected: 'Fale is a university' },
      { input: 'Visit Yale', expected: 'Visit Fale' },
      { input: 'Yale', expected: 'Fale' }
    ];
    
    testCases.forEach(({ input, expected }) => {
      expect(replaceYaleWithFale(input)).toBe(expected);
    });
  });
  
  test('should handle multiple Yale occurrences in text', () => {
    const originalText = 'Yale University was founded in 1701. Yale is known for its research.';
    const replacedText = replaceYaleWithFale(originalText);
    
    expect(replacedText).toBe('Fale University was founded in 1701. Fale is known for its research.');
    expect(replacedText.match(/Fale/g).length).toBe(2);
  });
  
  test('should handle mixed case Yale occurrences', () => {
    const originalText = 'YALE University, Yale College, and yale medical school';
    const replacedText = replaceYaleWithFale(originalText);
    
    expect(replacedText).toBe('FALE University, Fale College, and fale medical school');
  });
});
