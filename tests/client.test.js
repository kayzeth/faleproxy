/**
 * Client-side script.js tests
 */

describe('Client-side functionality', () => {
  // Mock DOM elements
  beforeEach(() => {
    // Create mock DOM elements
    document.body.innerHTML = `
      <form id="url-form">
        <input id="url-input" type="text">
        <div id="error-message" class="hidden"></div>
      </form>
      <div id="loading" class="hidden"></div>
      <div id="result-container" class="hidden">
        <div id="content-display"></div>
        <a id="original-url"></a>
        <div id="page-title"></div>
      </div>
    `;
    
    // Mock fetch function
    global.fetch = jest.fn();
    
    // Load the script
    require('../public/script.js');
  });
  
  afterEach(() => {
    jest.resetAllMocks();
  });
  
  test('should show error when URL is empty', () => {
    // Get elements
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const errorMessage = document.getElementById('error-message');
    
    // Set empty URL
    urlInput.value = '';
    
    // Trigger form submission
    urlForm.dispatchEvent(new Event('submit'));
    
    // Check error message
    expect(errorMessage.textContent).toBe('Please enter a valid URL');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
  
  test('should add http:// prefix to URLs without protocol', async () => {
    // Get elements
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    
    // Mock successful fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        title: 'Test Title',
        content: '<html><body>Test Content</body></html>'
      })
    });
    
    // Set URL without protocol
    urlInput.value = 'example.com';
    
    // Trigger form submission
    urlForm.dispatchEvent(new Event('submit'));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check fetch was called with correct URL
    expect(fetch).toHaveBeenCalledWith('/fetch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url: 'http://example.com' })
    });
  });
  
  test('should handle successful response', async () => {
    // Get elements
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const resultContainer = document.getElementById('result-container');
    const loadingElement = document.getElementById('loading');
    const originalUrlElement = document.getElementById('original-url');
    const pageTitleElement = document.getElementById('page-title');
    const contentDisplay = document.getElementById('content-display');
    
    // Mock iframe and document
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
    
    // Mock createElement to return our mock iframe
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'iframe') {
        return mockIframe;
      }
      return document.createElement(tag);
    });
    
    // Mock successful fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        title: 'Fale University',
        content: '<html><body>Welcome to Fale University</body></html>',
        originalUrl: 'http://yale.edu'
      })
    });
    
    // Set URL
    urlInput.value = 'http://yale.edu';
    
    // Trigger form submission
    urlForm.dispatchEvent(new Event('submit'));
    
    // Check loading state
    expect(loadingElement.classList.contains('hidden')).toBe(false);
    expect(resultContainer.classList.contains('hidden')).toBe(true);
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check final state
    expect(loadingElement.classList.contains('hidden')).toBe(true);
    expect(resultContainer.classList.contains('hidden')).toBe(false);
    expect(originalUrlElement.textContent).toBe('http://yale.edu');
    expect(pageTitleElement.textContent).toBe('Fale University');
    
    // Check iframe was created and content was written
    expect(document.createElement).toHaveBeenCalledWith('iframe');
    expect(mockIframe.contentDocument.write).toHaveBeenCalledWith(
      '<html><body>Welcome to Fale University</body></html>'
    );
    
    // Trigger onload to test iframe height adjustment
    mockIframe.onload();
    expect(mockIframe.style.height).toBe('500px');
  });
  
  test('should handle error response', async () => {
    // Get elements
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const errorMessage = document.getElementById('error-message');
    const loadingElement = document.getElementById('loading');
    
    // Mock failed fetch response
    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({
        error: 'Failed to fetch content'
      })
    });
    
    // Set URL
    urlInput.value = 'http://invalid-site.com';
    
    // Trigger form submission
    urlForm.dispatchEvent(new Event('submit'));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check error state
    expect(loadingElement.classList.contains('hidden')).toBe(true);
    expect(errorMessage.textContent).toBe('Failed to fetch content');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });
  
  test('should handle fetch network error', async () => {
    // Get elements
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    const errorMessage = document.getElementById('error-message');
    
    // Mock fetch network error
    global.fetch.mockRejectedValueOnce(new Error('Network error'));
    
    // Set URL
    urlInput.value = 'http://example.com';
    
    // Trigger form submission
    urlForm.dispatchEvent(new Event('submit'));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Check error state
    expect(errorMessage.textContent).toBe('Network error');
    expect(errorMessage.classList.contains('hidden')).toBe(false);
  });
  
  test('should handle iframe with links', async () => {
    // Get elements
    const urlForm = document.getElementById('url-form');
    const urlInput = document.getElementById('url-input');
    
    // Mock links in iframe
    const mockLinks = [
      { target: '', rel: '' },
      { target: '', rel: '' }
    ];
    
    // Mock iframe and document
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
    
    // Mock createElement to return our mock iframe
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'iframe') {
        return mockIframe;
      }
      return document.createElement(tag);
    });
    
    // Mock successful fetch response
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        title: 'Test Page',
        content: '<html><body><a href="http://example.com">Link</a></body></html>'
      })
    });
    
    // Set URL
    urlInput.value = 'http://example.com';
    
    // Trigger form submission
    urlForm.dispatchEvent(new Event('submit'));
    
    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));
    
    // Trigger onload to test link modification
    mockIframe.onload();
    
    // Check links were modified
    mockLinks.forEach(link => {
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    });
  });
});
