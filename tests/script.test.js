/**
 * Tests for client-side script.js functionality
 */

describe('Client-side script functionality', () => {
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
    
    // Create a mock iframe
    const mockIframe = {
      sandbox: '',
      style: {},
      contentDocument: {
        open: jest.fn(),
        write: jest.fn(),
        close: jest.fn(),
        body: {
          scrollHeight: 500
        },
        querySelectorAll: jest.fn().mockReturnValue([])
      }
    };
    
    // Mock createElement to return our mock iframe
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'iframe') {
        return mockIframe;
      }
      return document.createElement(tag);
    });
    
    // Load the script
    require('../public/script');
  });
  
  afterEach(() => {
    // Clean up
    jest.resetAllMocks();
    document.body.innerHTML = '';
  });
  
  // Helper function to submit the form
  function submitForm(url) {
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    
    urlInput.value = url;
    urlForm.dispatchEvent(new Event('submit'));
  }
  
  test('should show error when URL is empty', () => {
    // Set up
    const errorMessage = document.getElementById('error-message');
    
    // Submit form with empty URL
    submitForm('');
    
    // Assertions
    expect(errorMessage.textContent).toBe('Please enter a valid URL');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(global.fetch).not.toHaveBeenCalled();
  });
  
  test('should add http:// prefix to URLs without protocol', () => {
    // Set up
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        title: 'Test Title',
        content: '<html><body>Test Content</body></html>'
      })
    });
    
    // Submit form with URL without protocol
    submitForm('example.com');
    
    // Assertions
    expect(global.console.log).toHaveBeenCalledWith('fixing url example.com');
    expect(global.console.log).toHaveBeenCalledWith('fixed url http://example.com');
    expect(global.fetch).toHaveBeenCalledWith('/fetch', expect.objectContaining({
      body: JSON.stringify({ url: 'http://example.com' })
    }));
  });
  
  test('should not modify URLs with protocol', () => {
    // Set up
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        title: 'Test Title',
        content: '<html><body>Test Content</body></html>'
      })
    });
    
    // Submit form with URL with protocol
    submitForm('https://example.com');
    
    // Assertions
    expect(global.fetch).toHaveBeenCalledWith('/fetch', expect.objectContaining({
      body: JSON.stringify({ url: 'https://example.com' })
    }));
  });
  
  test('should show loading indicator when fetching', () => {
    // Set up
    const loadingElement = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => new Promise(resolve => setTimeout(() => resolve({
        success: true,
        title: 'Test Title',
        content: '<html><body>Test Content</body></html>'
      }), 100))
    });
    
    // Submit form
    submitForm('https://example.com');
    
    // Assertions
    expect(loadingElement.classList.contains('hidden')).toBe(false);
    expect(resultContainer.classList.contains('hidden')).toBe(true);
  });
  
  test('should handle successful response', async () => {
    // Set up
    const loadingElement = document.getElementById('loading');
    const resultContainer = document.getElementById('result-container');
    const originalUrlElement = document.getElementById('original-url');
    const pageTitleElement = document.getElementById('page-title');
    const contentDisplay = document.getElementById('content-display');
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        title: 'Fale University',
        content: '<html><body>Welcome to Fale University</body></html>',
        originalUrl: 'https://yale.edu'
      })
    });
    
    // Submit form
    submitForm('https://yale.edu');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Assertions
    expect(loadingElement.classList.contains('hidden')).toBe(true);
    expect(resultContainer.classList.contains('hidden')).toBe(false);
    expect(originalUrlElement.textContent).toBe('https://yale.edu');
    expect(originalUrlElement.href).toBe('https://yale.edu/');
    expect(pageTitleElement.textContent).toBe('Fale University');
    expect(contentDisplay.innerHTML).not.toBe('');
  });
  
  test('should handle error response', async () => {
    // Set up
    const errorMessage = document.getElementById('error-message');
    const loadingElement = document.getElementById('loading');
    
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Failed to fetch content'
      })
    });
    
    // Submit form
    submitForm('https://example.com');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Assertions
    expect(loadingElement.classList.contains('hidden')).toBe(true);
    expect(errorMessage.textContent).toBe('Failed to fetch content');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });
  
  test('should handle network error', async () => {
    // Set up
    const errorMessage = document.getElementById('error-message');
    const loadingElement = document.getElementById('loading');
    
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Submit form
    submitForm('https://example.com');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Assertions
    expect(loadingElement.classList.contains('hidden')).toBe(true);
    expect(errorMessage.textContent).toBe('Network error');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });
  
  test('should update iframe with content and adjust height', async () => {
    // Set up
    const mockIframe = {
      sandbox: '',
      style: {},
      contentDocument: {
        open: jest.fn(),
        write: jest.fn(),
        close: jest.fn(),
        body: {
          scrollHeight: 500
        },
        querySelectorAll: jest.fn().mockReturnValue([])
      },
      onload: null
    };
    
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'iframe') {
        return mockIframe;
      }
      return document.createElement(tag);
    });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        title: 'Fale University',
        content: '<html><body>Welcome to Fale University</body></html>',
        originalUrl: 'https://yale.edu'
      })
    });
    
    // Submit form
    submitForm('https://yale.edu');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Trigger onload callback
    expect(typeof mockIframe.onload).toBe('function');
    mockIframe.onload();
    
    // Assertions
    expect(mockIframe.style.height).toBe('500px');
    expect(mockIframe.contentDocument.querySelectorAll).toHaveBeenCalledWith('a');
  });
  
  test('should make links open in new tab', async () => {
    // Set up
    const mockLinks = [
      { target: '', rel: '' },
      { target: '', rel: '' }
    ];
    
    const mockIframe = {
      sandbox: '',
      style: {},
      contentDocument: {
        open: jest.fn(),
        write: jest.fn(),
        close: jest.fn(),
        body: {
          scrollHeight: 500
        },
        querySelectorAll: jest.fn().mockReturnValue(mockLinks)
      },
      onload: null
    };
    
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'iframe') {
        return mockIframe;
      }
      return document.createElement(tag);
    });
    
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        title: 'Fale University',
        content: '<html><body><a href="https://yale.edu">Yale</a></body></html>',
        originalUrl: 'https://yale.edu'
      })
    });
    
    // Submit form
    submitForm('https://yale.edu');
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Trigger onload callback
    mockIframe.onload();
    
    // Assertions
    mockLinks.forEach(link => {
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    });
  });
});
