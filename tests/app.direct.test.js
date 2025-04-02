/**
 * Tests for the direct implementation of app.js
 */

const request = require('supertest');
const { createApp, replaceYaleWithFale, processHtml } = require('./app.direct');

describe('Yale to Fale replacement functions', () => {
  test('replaceYaleWithFale should replace Yale with Fale in text', () => {
    expect(replaceYaleWithFale('Yale University')).toBe('Fale University');
    expect(replaceYaleWithFale('yale university')).toBe('fale university');
    expect(replaceYaleWithFale('YALE UNIVERSITY')).toBe('FALE UNIVERSITY');
    expect(replaceYaleWithFale('Welcome to Yale')).toBe('Welcome to Fale');
  });
  
  test('replaceYaleWithFale should handle null or undefined input', () => {
    expect(replaceYaleWithFale(null)).toBeNull();
    expect(replaceYaleWithFale(undefined)).toBeUndefined();
    expect(replaceYaleWithFale('')).toBe('');
  });
  
  test('processHtml should replace Yale with Fale in HTML content', () => {
    const html = '<html><head><title>Yale University</title></head><body><p>Welcome to Yale</p></body></html>';
    const result = processHtml(html);
    
    expect(result.content).toContain('<title>Fale University</title>');
    expect(result.content).toContain('<p>Welcome to Fale</p>');
    expect(result.title).toBe('Fale University');
  });
  
  test('processHtml should handle HTML with no Yale references', () => {
    const html = '<html><head><title>Example University</title></head><body><p>Welcome</p></body></html>';
    const result = processHtml(html);
    
    expect(result.content).toBe(html);
    expect(result.title).toBe('Example University');
  });
  
  test('processHtml should handle HTML with no title tag', () => {
    const html = '<html><head></head><body><p>Yale University</p></body></html>';
    const result = processHtml(html);
    
    expect(result.content).toContain('<p>Fale University</p>');
    expect(result.title).toBe('No Title');
  });
});

describe('Express App with direct testing', () => {
  let appInstance;
  
  beforeEach(() => {
    // Create a fresh app instance for each test with testing mode enabled
    appInstance = createApp({ testing: true });
  });
  
  test('GET / should serve the index.html file', async () => {
    const response = await request(appInstance.app).get('/');
    
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('<!DOCTYPE html>');
  });
  
  test('POST /fetch should return 400 if URL is missing', async () => {
    const response = await request(appInstance.app)
      .post('/fetch')
      .send({});
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });
  
  test('POST /fetch should return 400 if URL is empty string', async () => {
    const response = await request(appInstance.app)
      .post('/fetch')
      .send({ url: '' });
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });
  
  test('POST /fetch should process HTML and replace Yale with Fale', async () => {
    // Create app with custom HTML fetcher
    const customApp = createApp({
      testing: true,
      fetchHtml: async () => '<html><head><title>Yale University</title></head><body><p>Yale University</p></body></html>'
    });
    
    const response = await request(customApp.app)
      .post('/fetch')
      .send({ url: 'https://example.com/' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.title).toBe('Fale University');
    expect(response.body.content).toContain('<p>Fale University</p>');
    expect(response.body.originalUrl).toBe('https://example.com/');
  });
  
  test('POST /fetch should handle errors from fetching', async () => {
    // Create app with failing HTML fetcher
    const customApp = createApp({
      testing: true,
      fetchHtml: async () => {
        throw new Error('Network error');
      }
    });
    
    const response = await request(customApp.app)
      .post('/fetch')
      .send({ url: 'https://error-site.com/' });
    
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain('Failed to fetch content');
    expect(response.body.error).toContain('Network error');
  });
  
  test('createApp should return app and server objects', () => {
    // Create a simple app with testing mode
    const result = createApp({ testing: true });
    
    // Verify app was created
    expect(result.app).toBeDefined();
    
    // Create a simple app without testing mode but with a mock server
    // Mock the listen method to avoid actually starting a server
    const originalListen = express.application.listen;
    express.application.listen = jest.fn().mockReturnValue({ mockServer: true });
    
    try {
      // Call with testing false but port 0 to avoid conflicts
      const result2 = createApp({ testing: false, port: 0 });
      
      // Verify server was created
      expect(result2.server).toBeDefined();
      expect(result2.server).toEqual({ mockServer: true });
      expect(express.application.listen).toHaveBeenCalled();
    } finally {
      // Restore original listen method
      express.application.listen = originalListen;
    }
  });
});
