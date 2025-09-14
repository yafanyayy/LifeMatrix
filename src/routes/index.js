const express = require('express');
const router = express.Router();

// Import route modules
const users = require('./users');
const campaigns = require('./campaigns');
const responses = require('./responses');
const admin = require('./admin');
const webhooks = require('./webhooks');

// Mount routes
router.use('/users', users);
router.use('/campaigns', campaigns);
router.use('/responses', responses);
router.use('/admin', admin);
router.use('/webhooks', webhooks);

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Daily SMS Survey System'
  });
});

module.exports = router;