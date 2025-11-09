// Vercel serverless function handler for XPAY2WIN Agent
const path = require('path');

// Import the compiled Express app
// In production, this will be the compiled dist/agent.js
let app;
try {
  // Try to import from dist (production build)
  app = require('../dist/agent');
} catch (error) {
  // Fallback: if not built, use ts-node (development)
  // This won't work in Vercel production, but helps with local testing
  console.warn('Warning: dist/agent.js not found. Make sure to run npm run build before deploying.');
  // For Vercel, we need the compiled version
  throw new Error('Please run npm run build before deploying to Vercel');
}

// Export the app for Vercel
module.exports = app;

