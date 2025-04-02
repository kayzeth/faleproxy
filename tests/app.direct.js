/**
 * Direct testing version of app.js
 * This file contains the core functionality of app.js but with testable components
 */

const express = require('express');
const path = require('path');

// Create a function to replace Yale with Fale in text
function replaceYaleWithFale(text) {
  if (!text) return text;
  return text
    .replace(/Yale/g, 'Fale')
    .replace(/yale/g, 'fale')
    .replace(/YALE/g, 'FALE');
}

// Function to process HTML content
function processHtml(html) {
  // In a real implementation, this would use cheerio to parse and modify the HTML
  // For testing purposes, we'll use a simple regex replacement
  let processedHtml = html;
  
  // Replace Yale with Fale in text content (simplified version)
  processedHtml = processedHtml.replace(/>([^<]*Yale[^<]*)</gi, (match, p1) => {
    return '>' + replaceYaleWithFale(p1) + '<';
  });
  
  // Replace Yale in title tags
  processedHtml = processedHtml.replace(/<title>([^<]*Yale[^<]*)<\/title>/gi, (match, p1) => {
    return '<title>' + replaceYaleWithFale(p1) + '</title>';
  });
  
  // Extract title
  const titleMatch = processedHtml.match(/<title>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1] : 'No Title';
  
  return {
    content: processedHtml,
    title: title
  };
}

// Create the Express app
function createApp(options = {}) {
  const app = express();
  const PORT = options.port || 3001;
  
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
      
      // In a real implementation, this would use axios to fetch the content
      // For testing, we'll use a mock function
      let fetchedHtml;
      if (options.fetchHtml) {
        fetchedHtml = await options.fetchHtml(url);
      } else {
        // Default mock response
        fetchedHtml = `<html><head><title>Yale University</title></head><body><p>Yale University</p></body></html>`;
      }
      
      // Process the HTML
      const { content, title } = processHtml(fetchedHtml);
      
      return res.json({
        success: true,
        content: content,
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
  
  // Start the server if not in test mode
  if (!options.testing) {
    const server = app.listen(PORT, () => {
      console.log(`Faleproxy server running at http://localhost:${PORT}`);
    });
    return { app, server };
  }
  
  return { app };
}

module.exports = {
  createApp,
  replaceYaleWithFale,
  processHtml
};
