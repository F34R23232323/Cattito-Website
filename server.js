// server.js
const express = require('express');
const path = require('path');
const app = express();

// Serve static files from the current directory
app.use(express.static(path.join(__dirname, '.')));

// Optional: fallback to index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Use a single fixed port (change 3000 to whatever you want)

const PORT = 2820;
app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 Cat Bot Web running at http://127.0.0.1:${PORT}`);
});

