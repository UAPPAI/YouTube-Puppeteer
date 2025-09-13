const { spawn } = require('child_process');
const path = require('path');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed. Use POST.',
      example: { searchTerm: 'haulage trucks UK' }
    });
  }

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
    const scriptPath = path.join(process.cwd(), 'youtube-search-vercel.js');
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

    // Set a timeout for the search operation
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      res.status(408).json({
        success: false,
        error: 'Search timeout - operation took too long',
        searchTerm: searchTerm
      });
    }, 25000); // 25 second timeout

    child.on('close', (code) => {
      clearTimeout(timeout);
      
      if (code === 0) {
        // Extract the result from the output
        const resultMatch = output.match(/📋 First result: (.+)/);
        const firstResult = resultMatch ? resultMatch[1] : 'No result found';
        
        res.status(200).json({
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
}
