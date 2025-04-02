/**
 * Tests for edge cases in the Yale to Fale replacement logic
 */

const cheerio = require('cheerio');

describe('Yale to Fale replacement edge cases', () => {
  test('should handle nested elements correctly', () => {
    const nestedHtml = `
      <div>
        <p>Yale <span>University</span> has a <strong>Yale</strong> campus.</p>
        <div>This is <em>Yale</em> text.</div>
      </div>
    `;
    
    const $ = cheerio.load(nestedHtml);
    
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
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced in all text nodes
    expect(modifiedHtml).toContain('Fale ');
    expect(modifiedHtml).toContain('a <strong>Fale</strong>');
    expect(modifiedHtml).toContain('<em>Fale</em>');
  });

  test('should handle Yale in JavaScript code blocks', () => {
    const htmlWithScript = `
      <script>
        const university = "Yale";
        const location = "New Haven";
        console.log(university + " is in " + location);
      </script>
    `;
    
    const $ = cheerio.load(htmlWithScript);
    
    // Process script content
    $('script').each(function() {
      const content = $(this).html();
      const newContent = content.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
      $(this).html(newContent);
    });
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced in script content
    expect(modifiedHtml).toContain('const university = "Fale"');
    expect(modifiedHtml).not.toContain('"Yale"');
  });

  test('should handle Yale in CSS style blocks', () => {
    const htmlWithStyle = `
      <style>
        .yale-header {
          color: blue;
        }
        /* Yale University colors */
        .yale-blue {
          background-color: #0f4d92;
        }
      </style>
    `;
    
    const $ = cheerio.load(htmlWithStyle);
    
    // Process style content
    $('style').each(function() {
      const content = $(this).html();
      const newContent = content.replace(/yale/gi, 'fale');
      $(this).html(newContent);
    });
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced in style content
    expect(modifiedHtml).toContain('.fale-header');
    expect(modifiedHtml).toContain('/* Fale University colors */');
    expect(modifiedHtml).toContain('.fale-blue');
    expect(modifiedHtml).not.toContain('yale-');
  });

  test('should handle Yale in HTML comments', () => {
    const htmlWithComments = `
      <!-- Yale University Website -->
      <div>
        <!-- This section is about Yale -->
        <p>Content about the university</p>
      </div>
    `;
    
    const $ = cheerio.load(htmlWithComments);
    
    // Process HTML comments
    $('*').contents().filter(function() {
      return this.type === 'comment';
    }).each(function() {
      const comment = this.data;
      const newComment = comment.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
      this.data = newComment;
    });
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced in comments
    expect(modifiedHtml).toContain('<!-- Fale University Website -->');
    expect(modifiedHtml).toContain('<!-- This section is about Fale -->');
    expect(modifiedHtml).not.toContain('Yale');
  });

  test('should handle Yale in meta tags', () => {
    const htmlWithMeta = `
      <head>
        <meta name="description" content="Yale University official website">
        <meta property="og:title" content="Yale University">
        <meta name="keywords" content="Yale, university, education">
      </head>
    `;
    
    const $ = cheerio.load(htmlWithMeta);
    
    // Process meta tag content
    $('meta').each(function() {
      const content = $(this).attr('content');
      if (content) {
        const newContent = content.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
        $(this).attr('content', newContent);
      }
    });
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced in meta content
    expect(modifiedHtml).toContain('content="Fale University official website"');
    expect(modifiedHtml).toContain('content="Fale University"');
    expect(modifiedHtml).toContain('content="Fale, university, education"');
    expect(modifiedHtml).not.toContain('content="Yale');
  });

  test('should handle Yale in data attributes', () => {
    const htmlWithDataAttrs = `
      <div data-university="Yale" data-location="New Haven">
        <span data-info="Founded by Yale in 1701"></span>
      </div>
    `;
    
    const $ = cheerio.load(htmlWithDataAttrs);
    
    // Process data attributes
    $('[data-university], [data-info]').each(function() {
      const attrs = $(this).attr();
      Object.keys(attrs).forEach(attr => {
        if (attr.startsWith('data-')) {
          const value = attrs[attr];
          const newValue = value.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
          $(this).attr(attr, newValue);
        }
      });
    });
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced in data attributes
    expect(modifiedHtml).toContain('data-university="Fale"');
    expect(modifiedHtml).toContain('data-info="Founded by Fale in 1701"');
    expect(modifiedHtml).not.toContain('"Yale"');
  });

  test('should handle special characters around Yale', () => {
    const htmlWithSpecialChars = `
      <p>Yale's campus</p>
      <p>(Yale)</p>
      <p>"Yale"</p>
      <p>Yale!</p>
      <p>Yale?</p>
      <p>Yale;</p>
    `;
    
    const $ = cheerio.load(htmlWithSpecialChars);
    
    // Process text nodes
    $('body *').contents().filter(function() {
      return this.nodeType === 3; // Text nodes only
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced with special characters
    expect(modifiedHtml).toContain('Fale\'s campus');
    expect(modifiedHtml).toContain('(Fale)');
    expect(modifiedHtml).toContain('"Fale"');
    expect(modifiedHtml).toContain('Fale!');
    expect(modifiedHtml).toContain('Fale?');
    expect(modifiedHtml).toContain('Fale;');
    expect(modifiedHtml).not.toContain('Yale');
  });

  test('should handle Yale at the beginning and end of text', () => {
    const htmlWithYaleAtEnds = `
      <p>Yale is a university</p>
      <p>Visit Yale</p>
      <p>Welcome to Yale</p>
    `;
    
    const $ = cheerio.load(htmlWithYaleAtEnds);
    
    // Process text nodes
    $('body *').contents().filter(function() {
      return this.nodeType === 3; // Text nodes only
    }).each(function() {
      const text = $(this).text();
      const newText = text.replace(/Yale/g, 'Fale').replace(/yale/g, 'fale').replace(/YALE/g, 'FALE');
      if (text !== newText) {
        $(this).replaceWith(newText);
      }
    });
    
    const modifiedHtml = $.html();
    
    // Check that Yale is replaced at beginning and end of text
    expect(modifiedHtml).toContain('Fale is a university');
    expect(modifiedHtml).toContain('Visit Fale');
    expect(modifiedHtml).toContain('Welcome to Fale');
    expect(modifiedHtml).not.toContain('Yale');
  });
});
