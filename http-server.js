const express = require('express');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware to parse JSON
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'YouTube Search Tester API is running' });
});

// Main search endpoint
app.post('/search', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    
    if (!searchTerm) {
      return res.status(400).json({ 
        error: 'searchTerm is required',
        example: { searchTerm: 'haulage trucks UK' }
      });
    }

    console.log(`🔍 Received search request for: "${searchTerm}"`);

    // Run the YouTube search script with the provided search term
    const scriptPath = path.join(__dirname, 'youtube-search.js');
    const child = spawn('node', [scriptPath], {
      env: { ...process.env, SEARCH_TERM: searchTerm },
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        // Extract the result from the output
        const resultMatch = output.match(/📋 First result: (.+)/);
        const firstResult = resultMatch ? resultMatch[1] : 'No result found';
        
        res.json({
          success: true,
          searchTerm: searchTerm,
          firstResult: firstResult,
          fullOutput: output
        });
      } else {
        res.status(500).json({
          success: false,
          error: 'Script execution failed',
          code: code,
          output: output,
          errorOutput: errorOutput
        });
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 YouTube Search Tester API running on http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   POST /search - Search YouTube`);
  console.log(`📝 Example usage:`);
  console.log(`   curl -X POST http://localhost:${PORT}/search -H "Content-Type: application/json" -d '{"searchTerm":"haulage trucks UK"}'`);
});
