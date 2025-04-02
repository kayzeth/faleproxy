/**
 * Mocked version of app.js for testing
 */

const express = require('express');
const path = require('path');

// Create a mock for axios
const mockAxios = {
  get: jest.fn()
};

// Create a mock for cheerio
const mockCheerio = {
  load: jest.fn().mockImplementation(() => {
    return {
      html: jest.fn().mockReturnValue('<html><body>Fale University</body></html>'),
      $: jest.fn(),
      text: jest.fn().mockReturnValue('Fale University'),
      contents: jest.fn().mockReturnThis(),
      filter: jest.fn().mockReturnThis(),
      each: jest.fn(),
      replaceWith: jest.fn(),
      children: jest.fn().mockReturnValue({ length: 0 }),
      attr: jest.fn(),
      find: jest.fn()
    };
  })
};

// Export the app creator function for testing
function createApp(options = {}) {
  const app = express();
  const PORT = options.port || 3001;
  
  // Middleware to parse request bodies
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
  
      // Use the mock or real axios
      const axiosToUse = options.axios || mockAxios;
      
      // Mock the response or use real axios
      let response;
      if (options.mockResponse) {
        response = options.mockResponse;
      } else {
        response = await axiosToUse.get(url);
      }
      
      const html = response.data;
  
      // Use the mock or real cheerio
      const cheerioToUse = options.cheerio || mockCheerio;
      const $ = cheerioToUse.load(html);
      
      // Return the processed content
      return res.json({ 
        success: true, 
        content: $.html(),
        title: 'Fale University',
        originalUrl: url
      });
    } catch (error) {
      console.error('Error fetching URL:', error.message);
      return res.status(500).json({ 
        error: `Failed to fetch content: ${error.message}` 
      });
    }
  });
  
  // Only actually listen if we're not in test mode
  if (!options.testing) {
    app.listen(PORT, () => {
      console.log(`Faleproxy server running at http://localhost:${PORT}`);
    });
  }
  
  return app;
}

module.exports = {
  createApp,
  mockAxios,
  mockCheerio
};
