/**
 * Tests for app.js using mocks
 */

const request = require('supertest');
const { createApp, mockAxios } = require('./app.mock');
const path = require('path');
const fs = require('fs');

describe('Express App', () => {
  let app;
  
  beforeEach(() => {
    // Create a fresh app instance for each test
    app = createApp({ testing: true });
    
    // Reset mock calls
    mockAxios.get.mockReset();
  });
  
  describe('GET /', () => {
    test('should serve the index.html file', async () => {
      const response = await request(app).get('/');
      
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('<!DOCTYPE html>');
    });
    
    test('should serve static files from public directory', async () => {
      const response = await request(app).get('/script.js');
      
      expect(response.statusCode).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/javascript/);
    });
  });
  
  describe('POST /fetch', () => {
    test('should return 400 if URL is missing', async () => {
      const response = await request(app)
        .post('/fetch')
        .send({});
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('URL is required');
    });
    
    test('should return 400 if URL is empty string', async () => {
      const response = await request(app)
        .post('/fetch')
        .send({ url: '' });
      
      expect(response.statusCode).toBe(400);
      expect(response.body.error).toBe('URL is required');
    });
    
    test('should fetch and process content from URL', async () => {
      // Mock the axios response
      mockAxios.get.mockResolvedValueOnce({
        data: '<html><head><title>Yale University</title></head><body><h1>Yale University</h1></body></html>'
      });
      
      const response = await request(app)
        .post('/fetch')
        .send({ url: 'https://example.com/' });
      
      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.originalUrl).toBe('https://example.com/');
      expect(mockAxios.get).toHaveBeenCalledWith('https://example.com/');
    });
    
    test('should handle errors from external sites', async () => {
      // Mock a failing axios request
      mockAxios.get.mockRejectedValueOnce(new Error('Connection refused'));
      
      const response = await request(app)
        .post('/fetch')
        .send({ url: 'https://error-site.com/' });
      
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toContain('Failed to fetch content');
      expect(response.body.error).toContain('Connection refused');
    });
    
    test('should handle network errors', async () => {
      // Mock a network error
      mockAxios.get.mockRejectedValueOnce(new Error('Network Error'));
      
      const response = await request(app)
        .post('/fetch')
        .send({ url: 'https://network-error.com/' });
      
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toContain('Failed to fetch content');
      expect(response.body.error).toContain('Network Error');
    });
    
    test('should handle HTTP errors', async () => {
      // Mock an HTTP error
      const error = new Error('Request failed with status code 404');
      error.response = { status: 404 };
      mockAxios.get.mockRejectedValueOnce(error);
      
      const response = await request(app)
        .post('/fetch')
        .send({ url: 'https://not-found.com/' });
      
      expect(response.statusCode).toBe(500);
      expect(response.body.error).toContain('Failed to fetch content');
    });
  });
  
  describe('Server initialization', () => {
    test('should create an app without starting the server in test mode', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      
      // Create app in test mode
      createApp({ testing: true });
      
      // Should not log server running message
      expect(consoleSpy).not.toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
    
    test('should start the server when not in test mode', () => {
      const consoleSpy = jest.spyOn(console, 'log');
      const listenSpy = jest.spyOn(require('express')().listen, 'apply').mockImplementation(() => {});
      
      // Create app not in test mode
      createApp();
      
      // Should log server running message
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Faleproxy server running'));
      
      consoleSpy.mockRestore();
      listenSpy.mockRestore();
    });
  });
});
