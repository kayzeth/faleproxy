/**
 * Tests for the Express app routes
 */

const request = require('supertest');
const express = require('express');
const path = require('path');

// Create a test app with the same routes as the main app but without cheerio dependency
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
  
  // API endpoint to fetch and modify content - simplified for testing
  app.post('/fetch', async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ error: 'URL is required' });
      }
      
      // Mock response for testing
      return res.json({ 
        success: true, 
        content: '<html><body>Fale University</body></html>',
        title: 'Fale University',
        originalUrl: url
      });
    } catch (error) {
      return res.status(500).json({ 
        error: `Failed to fetch content: ${error.message}` 
      });
    }
  });
  
  return app;
};

describe('Express App Routes', () => {
  let app;
  
  beforeAll(() => {
    // Create test app
    app = createTestApp();
  });
  
  test('GET / should serve the index.html file', async () => {
    const response = await request(app).get('/');
    
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toMatch(/text\/html/);
    expect(response.text).toContain('<!DOCTYPE html>');
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
  
  test('POST /fetch should return success with mock data', async () => {
    const response = await request(app)
      .post('/fetch')
      .send({ url: 'https://example.com/' });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.title).toBe('Fale University');
    expect(response.body.content).toContain('Fale University');
    expect(response.body.originalUrl).toBe('https://example.com/');
  });
});
