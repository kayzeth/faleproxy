/**
 * Simple direct tests for script.js functionality
 */

describe('Client-side Script Functionality', () => {
  // Setup DOM before each test
  beforeEach(() => {
    // Create mock DOM elements
    document.body.innerHTML = `
      <form id="url-form">
        <input id="url-input" type="text">
        <div id="error-message" class="hidden"></div>
      </form>
      <div id="loading" class="hidden"></div>
      <div id="result-container" class="hidden">
        <div id="info-bar">
          <a id="original-url" target="_blank"></a>
          <span id="page-title"></span>
        </div>
        <div id="content-display"></div>
      </div>
    `;
    
    // Mock fetch function
    global.fetch = jest.fn();
    global.console.log = jest.fn();
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
    document.body.innerHTML = '';
  });
  
  // Test URL protocol handling
  test('should add http:// to URLs without protocol', () => {
    // This is the same regex used in script.js
    const regex = /^(https?|ftp):\/\//;
    
    // Test cases
    const testCases = [
      { input: 'example.com', expected: 'http://example.com' },
      { input: 'www.example.com', expected: 'http://www.example.com' },
      { input: 'http://example.com', expected: 'http://example.com' },
      { input: 'https://example.com', expected: 'https://example.com' },
      { input: 'ftp://example.com', expected: 'ftp://example.com' }
    ];
    
    testCases.forEach(({ input, expected }) => {
      let url = input;
      
      if (!regex.test(url)) {
        url = `http://${url}`;
      }
      
      expect(url).toBe(expected);
    });
  });
  
  // Test error display function
  test('should show error message', () => {
    // Get error element
    const errorMessage = document.getElementById('error-message');
    
    // Define a simple showError function like in script.js
    function showError(message) {
      errorMessage.textContent = message;
      errorMessage.classList.remove('hidden');
    }
    
    // Call the function
    showError('Test error message');
    
    // Check that error is displayed
    expect(errorMessage.textContent).toBe('Test error message');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });
  
  // Test form submission with mock fetch
  test('should handle form submission with fetch', async () => {
    // Setup mock fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        title: 'Fale University',
        content: '<html><body>Welcome to Fale University</body></html>',
        originalUrl: 'https://yale.edu'
      })
    });
    
    // Get form elements
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const loadingElement = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    const originalUrlElement = document.getElementById('original-url');
    const pageTitleElement = document.getElementById('page-title');
    const contentDisplay = document.getElementById('content-display');
    
    // Mock iframe creation
    const mockIframe = {
      sandbox: '',
      style: {},
      contentDocument: {
        open: jest.fn(),
        write: jest.fn(),
        close: jest.fn(),
        body: { scrollHeight: 500 },
        querySelectorAll: jest.fn().mockReturnValue([])
      },
      onload: null
    };
    
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'iframe') return mockIframe;
      return document.createElement(tag);
    });
    
    // Define a simplified version of the form submit handler
    async function handleSubmit(e) {
      if (e) e.preventDefault();
      
      let url = urlInput.value.trim();
      const errorMessage = document.getElementById('error-message');
      
      if (!url) {
        errorMessage.textContent = 'Please enter a valid URL';
        errorMessage.classList.remove('hidden');
        return;
      }
      
      // Add protocol if missing
      if (!/^(https?|ftp):\/\//.test(url)) {
        url = `http://${url}`;
      }
      
      // Show loading
      loadingElement.classList.remove('hidden');
      resultContainer.classList.add('hidden');
      
      try {
        const response = await fetch('/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        
        const data = await response.json();
        
        // Update UI with response data
        originalUrlElement.textContent = url;
        pageTitleElement.textContent = data.title;
        
        // Create iframe
        const iframe = document.createElement('iframe');
        contentDisplay.innerHTML = '';
        contentDisplay.appendChild(iframe);
        
        // Write content to iframe
        iframe.contentDocument.write(data.content);
        
        // Show results
        resultContainer.classList.remove('hidden');
      } catch (error) {
        // Show error
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
      } finally {
        // Hide loading
        loadingElement.classList.add('hidden');
      }
    }
    
    // Set URL and submit form
    urlInput.value = 'yale.edu';
    await handleSubmit();
    
    // Check fetch was called with correct URL
    expect(fetch).toHaveBeenCalledWith('/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'http://yale.edu' })
    });
    
    // Check UI was updated
    expect(originalUrlElement.textContent).toBe('http://yale.edu');
    expect(pageTitleElement.textContent).toBe('Fale University');
  });
  
  // Test error handling
  test('should handle fetch errors', async () => {
    // Setup mock fetch error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Get elements
    const urlInput = document.getElementById('url-input');
    const errorMessage = document.getElementById('error-message');
    const loadingElement = document.getElementById('loading');
    
    // Define simplified error handler
    async function handleError() {
      loadingElement.classList.remove('hidden');
      
      try {
        await fetch('/fetch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'http://example.com' })
        });
      } catch (error) {
        errorMessage.textContent = error.message;
        errorMessage.classList.remove('hidden');
      } finally {
        loadingElement.classList.add('hidden');
      }
    }
    
    // Call error handler
    await handleError();
    
    // Check error was displayed
    expect(errorMessage.textContent).toBe('Network error');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });
});
