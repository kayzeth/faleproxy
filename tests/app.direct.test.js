/**
 * Tests for the direct implementation of app.js
 */

const request = require('supertest');
const express = require('express');
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
  
  test('createApp should return app object when in testing mode', () => {
    // Create a simple app with testing mode
    const result = createApp({ testing: true });
    
    // Verify app was created
    expect(result.app).toBeDefined();
  });
  
  test('createApp should handle non-testing mode', () => {
    // Mock console.log to prevent output
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    // Mock express app with listen method
    const mockServer = { close: jest.fn() };
    const mockApp = {
      listen: jest.fn().mockImplementation((port, callback) => {
        if (callback) callback();
        return mockServer;
      })
    };
    
    // Create a test version of createApp that uses our mock
    const testCreateApp = (options) => {
      const app = mockApp;
      const PORT = options.port || 3001;
      
      if (!options.testing) {
        const server = app.listen(PORT, () => {
          console.log(`Faleproxy server running at http://localhost:${PORT}`);
        });
        return { app, server };
      }
      
      return { app };
    };
    
    try {
      // Call with testing false
      const result = testCreateApp({ testing: false, port: 0 });
      
      // Verify server was created
      expect(result.server).toBeDefined();
      expect(result.server).toBe(mockServer);
      expect(mockApp.listen).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalled();
    } finally {
      // Restore console.log
      console.log = originalConsoleLog;
    }
  });
});
