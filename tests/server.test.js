/**
 * Tests for the Express server functionality
 */

const request = require('supertest');
const express = require('express');
const path = require('path');
const nock = require('nock');
const axios = require('axios');
const { sampleHtmlWithYale } = require('./test-utils');

// Create a test app with the same routes as the main app
const createTestApp = () => {
  const app = express();
  
  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, '..', 'public')));
  
  // Route to serve the main page
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
  });
  
  // API endpoint to fetch and modify content
  app.post('/fetch', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
  
      // Fetch the content from the provided URL
      const response = await axios.get(url);
      const html = response.data;
  
      // Use cheerio to parse HTML and selectively replace text content, not URLs
      const $ = require('cheerio').load(html);
      
      // Process text nodes in the body
      $('body *').contents().filter(function() {
        return this.nodeType === 3; // Text nodes only
      }).each(function() {
        // Replace text content but not in URLs or attributes
        const text = $(this).text();
        const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
        if (text !== newText) {
          $(this).replaceWith(newText);
        }
      });
      
      // Process title separately
      const title = $('title').text().replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
      $('title').text(title);
      
      return res.json({ 
        success: true, 
        content: $.html(),
        title: title,
        originalUrl: url
      });
    } catch (error) {
      console.error('Error fetching URL:', error.message);
      return res.status(500).json({ 
        error: `Failed to fetch content: ${error.message}` 
      });
    }
  });
  
  return app;
};

describe('Express Server Tests', () => {
  let app;
  
  beforeAll(() => {
    // Create test app
    app = createTestApp();
    
    // Disable real HTTP requests during testing
    nock.disableNetConnect();
    // Allow localhost connections for supertest
    nock.enableNetConnect('127.0.0.1');
  });
  
  afterAll(() => {
    // Clean up nock
    nock.cleanAll();
    nock.enableNetConnect();
  });
  
  afterEach(() => {
    // Clear any lingering nock interceptors after each test
    nock.cleanAll();
  });
  
  test('GET / should serve the index.html file', async () => {
    const response = await request(app).get('/');
    
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('<!DOCTYPE html>');
    expect(response.text).toContain('<title>FaleProxy</title>');
  });
  
  test('POST /fetch should return 400 if URL is missing', async () => {
    const response = await request(app)
      .post('/fetch')
      .send({});
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });
  
  test('POST /fetch should return 400 if URL is empty string', async () => {
    const response = await request(app)
      .post('/fetch')
      .send({ url: '' });
    
    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe('URL is required');
  });
  
  test('POST /fetch should fetch and replace Yale with Fale', async () => {
    // Mock the external URL
    nock('https://example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale);
    
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://example.com/' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.title).toBe('Fale University Test Page');
    expect(response.body.content).toContain('Welcome to Fale University');
    expect(response.body.content).toContain('https://www.yale.edu/about');  // URL should be unchanged
    expect(response.body.content).toContain('>About Fale<');  // Link text should be changed
  });
  
  test('POST /fetch should handle non-HTML responses', async () => {
    // Mock a JSON response
    nock('https://api.example.com')
      .get('/')
      .reply(200, { name: 'Yale University', location: 'New Haven' });
    
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://api.example.com/' });
    
    expect(response.statusCode).toBe(200);
    // Even though it's JSON, cheerio will try to parse it as HTML
    expect(response.body.success).toBe(true);
    expect(response.body.content).toBeDefined();
  });
  
  test('POST /fetch should handle network errors', async () => {
    // Mock a network error
    nock('https://error.example.com')
      .get('/')
      .replyWithError('Connection refused');
    
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://error.example.com/' });
    
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain('Failed to fetch content');
    expect(response.body.error).toContain('Connection refused');
  });
  
  test('POST /fetch should handle HTTP errors', async () => {
    // Mock a 404 response
    nock('https://notfound.example.com')
      .get('/')
      .reply(404, 'Not Found');
    
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://notfound.example.com/' });
    
    expect(response.statusCode).toBe(500);
    expect(response.body.error).toContain('Failed to fetch content');
    expect(response.body.error).toContain('404');
  });
  
  test('POST /fetch should handle malformed HTML', async () => {
    // Mock malformed HTML
    nock('https://malformed.example.com')
      .get('/')
      .reply(200, '<html><body><div>Yale University</div><div>Unclosed tag');
    
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://malformed.example.com/' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.content).toContain('Fale University');
  });
  
  test('POST /fetch should handle large HTML documents', async () => {
    // Create a large HTML document with many Yale references
    let largeHtml = '<html><head><title>Yale University</title></head><body>';
    for (let i = 0; i < 100; i++) {
      largeHtml += `<div>Yale University paragraph ${i}</div>`;
    }
    largeHtml += '</body></html>';
    
    // Mock the large HTML response
    nock('https://large.example.com')
      .get('/')
      .reply(200, largeHtml);
    
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://large.example.com/' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.title).toBe('Fale University');
    expect(response.body.content).toContain('Fale University paragraph 0');
    expect(response.body.content).toContain('Fale University paragraph 99');
    expect(response.body.content).not.toContain('Yale University');
  });
  
  test('POST /fetch should handle different content types', async () => {
    // Mock a response with content-type text/plain
    nock('https://text.example.com')
      .get('/')
      .reply(200, 'This is Yale University plain text', {
        'Content-Type': 'text/plain'
      });
    
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://text.example.com/' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    // Cheerio will still try to parse it as HTML
    expect(response.body.content).toBeDefined();
  });
});
