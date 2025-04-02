/**
 * Tests for the direct implementation of script.js
 */

const { addProtocolToUrl, showError, handleFormSubmit, displayContent } = require('./script.direct');

describe('URL Protocol Handling', () => {
  test('addProtocolToUrl should add http:// to URLs without protocol', () => {
    expect(addProtocolToUrl('example.com')).toBe('http://example.com');
    expect(addProtocolToUrl('www.example.com')).toBe('http://www.example.com');
    expect(addProtocolToUrl('subdomain.example.com')).toBe('http://subdomain.example.com');
  });
  
  test('addProtocolToUrl should not modify URLs with protocol', () => {
    expect(addProtocolToUrl('http://example.com')).toBe('http://example.com');
    expect(addProtocolToUrl('https://example.com')).toBe('https://example.com');
    expect(addProtocolToUrl('ftp://example.com')).toBe('ftp://example.com');
  });
  
  test('addProtocolToUrl should handle null or empty input', () => {
    expect(addProtocolToUrl(null)).toBeNull();
    expect(addProtocolToUrl('')).toBe('');
    expect(addProtocolToUrl(undefined)).toBeUndefined();
  });
});

describe('Error Handling', () => {
  test('showError should update error element text and visibility', () => {
    // Create mock error element
    const errorElement = {
      textContent: '',
      classList: {
        remove: jest.fn()
      }
    };
    
    showError('Test error message', errorElement);
    
    expect(errorElement.textContent).toBe('Test error message');
    expect(errorElement.classList.remove).toHaveBeenCalledWith('hidden');
  });
  
  test('showError should handle null error element', () => {
    // Should not throw an error
    expect(() => showError('Test message', null)).not.toThrow();
  });
});

describe('Form Submission Handling', () => {
  test('handleFormSubmit should call onError if URL is empty', async () => {
    const onError = jest.fn();
    
    await handleFormSubmit({
      url: '',
      onError
    });
    
    expect(onError).toHaveBeenCalledWith('Please enter a valid URL');
  });
  
  test('handleFormSubmit should process URL and call fetch', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });
    const showLoadingFn = jest.fn();
    const hideResultFn = jest.fn();
    const hideErrorFn = jest.fn();
    const onSuccess = jest.fn();
    
    await handleFormSubmit({
      url: 'example.com',
      fetchFn,
      showLoadingFn,
      hideResultFn,
      hideErrorFn,
      onSuccess
    });
    
    expect(fetchFn).toHaveBeenCalledWith('http://example.com');
    expect(showLoadingFn).toHaveBeenCalled();
    expect(hideResultFn).toHaveBeenCalled();
    expect(hideErrorFn).toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalled();
  });
  
  test('handleFormSubmit should handle fetch error', async () => {
    const fetchFn = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Server error' })
    });
    const hideLoadingFn = jest.fn();
    const onError = jest.fn();
    
    await handleFormSubmit({
      url: 'example.com',
      fetchFn,
      hideLoadingFn,
      onError
    });
    
    expect(fetchFn).toHaveBeenCalledWith('http://example.com');
    expect(hideLoadingFn).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Server error');
  });
  
  test('handleFormSubmit should handle network error', async () => {
    const fetchFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const hideLoadingFn = jest.fn();
    const onError = jest.fn();
    
    await handleFormSubmit({
      url: 'example.com',
      fetchFn,
      hideLoadingFn,
      onError
    });
    
    expect(fetchFn).toHaveBeenCalledWith('http://example.com');
    expect(hideLoadingFn).toHaveBeenCalled();
    expect(onError).toHaveBeenCalledWith('Network error');
  });
});

describe('Content Display', () => {
  beforeEach(() => {
    // Set up document for testing
    document.body.innerHTML = '<div id="container"></div>';
    
    // Mock iframe
    const mockIframeDocument = {
      open: jest.fn(),
      write: jest.fn(),
      close: jest.fn(),
      body: {
        scrollHeight: 500
      },
      querySelectorAll: jest.fn().mockReturnValue([
        { target: '', rel: '' },
        { target: '', rel: '' }
      ])
    };
    
    const mockIframe = {
      sandbox: '',
      style: {},
      contentDocument: mockIframeDocument,
      contentWindow: {
        document: mockIframeDocument
      }
    };
    
    // Mock createElement
    document.createElement = jest.fn().mockImplementation((tag) => {
      if (tag === 'iframe') {
        return mockIframe;
      }
      const element = document.createElement(tag);
      return element;
    });
  });
  
  test('displayContent should create iframe and write content', () => {
    const container = document.getElementById('container');
    const content = '<html><body>Test content</body></html>';
    
    const iframe = displayContent(content, container);
    
    expect(iframe).toBeDefined();
    // In test environment, we don't actually append to container
    expect(iframe.sandbox).toBe('allow-same-origin allow-scripts');
    expect(iframe.contentDocument.open).toHaveBeenCalled();
    expect(iframe.contentDocument.write).toHaveBeenCalledWith(content);
    expect(iframe.contentDocument.close).toHaveBeenCalled();
  });
  
  test('displayContent should set up onload handler', () => {
    const container = document.getElementById('container');
    const content = '<html><body>Test content</body></html>';
    
    const iframe = displayContent(content, container);
    
    // Trigger onload
    iframe.onload();
    
    // Check height was set
    expect(iframe.style.height).toBe('500px');
    
    // Check links were modified
    const links = iframe.contentDocument.querySelectorAll('a');
    links.forEach(link => {
      expect(link.target).toBe('_blank');
      expect(link.rel).toBe('noopener noreferrer');
    });
  });
  
  test('displayContent should handle null container', () => {
    const result = displayContent('<html></html>', null);
    expect(result).toBeNull();
  });
});
