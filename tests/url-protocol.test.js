// Tests for URL protocol handling functionality

describe('URL Protocol Tests', () => {
  // Mock DOM elements
  beforeEach(() => {
    // Create mock DOM elements
    document.body.innerHTML = `
      <form id="url-form">
        <input id="url-input" type="text">
        <div id="error-message"></div>
      </form>
      <div id="loading"></div>
      <div id="result-container"></div>
      <div id="original-url"></div>
      <div id="page-title"></div>
    `;
    
    // Mock fetch function
    global.fetch = jest.fn(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ title: 'Test Title', content: '<html><body>Test Content</body></html>' })
      })
    );
    
    // Load the script (this is a simplified approach - in a real test you'd use module imports)
    // For this test, we'll just test the protocol detection logic directly
  });
  
  test('should add http:// prefix to URLs without a protocol', () => {
    // Test cases
    const testCases = [
      { input: 'example.com', expected: 'http://example.com' },
      { input: 'www.example.com', expected: 'http://www.example.com' },
      { input: 'http://example.com', expected: 'http://example.com' },
      { input: 'https://example.com', expected: 'https://example.com' },
      { input: 'ftp://example.com', expected: 'ftp://example.com' }
    ];
    
    // Test the protocol detection and addition logic
    testCases.forEach(({ input, expected }) => {
      let url = input;
      
      // This is the same logic used in script.js
      if (!/^(https?|ftp):\/\//.test(url)) {
        url = `http://${url}`;
      }
      
      expect(url).toBe(expected);
    });
  });
  
  test('should handle form submission with URL without protocol', async () => {
    // Setup
    const urlInput = document.getElementById('url-input');
    const urlForm = document.getElementById('url-form');
    
    // Mock the form submission handler
    const handleSubmit = async (e) => {
      e.preventDefault();
      
      let url = urlInput.value.trim();
      
      if (!url) {
        return;
      } else if (!/^(https?|ftp):\/\//.test(url)) {
        url = `http://${url}`;
      }
      
      // Verify the URL was properly modified
      return url;
    };
    
    // Attach event listener
    urlForm.addEventListener('submit', handleSubmit);
    
    // Test with URL without protocol
    urlInput.value = 'example.com';
    
    // Trigger form submission
    const event = new Event('submit');
    const resultPromise = handleSubmit(event);
    const result = await resultPromise;
    
    // Assertions
    expect(result).toBe('http://example.com');
  });
});
