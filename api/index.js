const express = require('express');
const path = require('path');
const { createX402Service } = require('../dist/services/x402Service');

const app = express();

// Parse JSON
app.use(express.json({ limit: '10mb' }));

// Serve static files from public
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve main portal
app.get('/', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'index.html');
  res.sendFile(filePath);
});

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// x402 endpoints
const x402Service = createX402Service();

app.post('/api/x402/requirements', async (req, res) => {
  try {
    const { network, payTo, maxAmountRequired, description } = req.body;
    const result = x402Service.buildPaymentRequirements(network, payTo, maxAmountRequired, description);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/x402/verify', async (req, res) => {
  try {
    const { payload, requirements } = req.body;
    const result = await x402Service.verifyPayment(payload, requirements);
    res.json({ isValid: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/x402/settle', async (req, res) => {
  try {
    const { payload, requirements } = req.body;
    const result = await x402Service.settlePayment(payload, requirements);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export for Vercel
module.exports = app;
