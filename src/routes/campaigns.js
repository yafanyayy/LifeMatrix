const express = require('express');
const router = express.Router();
const Database = require('../database');

// Get all campaigns
router.get('/', async (req, res) => {
  try {
    const campaigns = await Database.all(`
      SELECT 
        c.*,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(sr.id) as total_responses,
        COUNT(CASE WHEN sr.response_date = date('now') THEN 1 END) as today_responses
      FROM campaigns c
      LEFT JOIN users u ON u.is_active = 1
      LEFT JOIN survey_responses sr ON sr.campaign_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaigns' });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Database.get('SELECT * FROM campaigns WHERE id = ?', [req.params.id]);
    
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    // Get campaign stats
    const stats = await Database.get(`
      SELECT 
        COUNT(DISTINCT sr.user_id) as unique_respondents,
        COUNT(sr.id) as total_responses,
        AVG(sr.joy_score) as avg_joy,
        AVG(sr.achievement_score) as avg_achievement,
        AVG(sr.meaningfulness_score) as avg_meaningfulness,
        MIN(sr.response_date) as first_response,
        MAX(sr.response_date) as last_response
      FROM survey_responses sr
      WHERE sr.campaign_id = ?
    `, [req.params.id]);

    // Get daily response counts
    const dailyStats = await Database.all(`
      SELECT 
        response_date,
        COUNT(*) as response_count,
        AVG(joy_score) as avg_joy,
        AVG(achievement_score) as avg_achievement,
        AVG(meaningfulness_score) as avg_meaningfulness
      FROM survey_responses
      WHERE campaign_id = ?
      GROUP BY response_date
      ORDER BY response_date DESC
    `, [req.params.id]);

    res.json({ 
      success: true, 
      campaign: {
        ...campaign,
        stats: stats || { unique_respondents: 0, total_responses: 0, avg_joy: 0, avg_achievement: 0, avg_meaningfulness: 0, first_response: null, last_response: null },
        dailyStats
      }
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch campaign' });
  }
});

// Create new campaign
router.post('/', async (req, res) => {
  try {
    const { name, start_date, end_date } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: name, start_date, end_date' 
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid date format. Use YYYY-MM-DD' 
      });
    }

    if (startDate >= endDate) {
      return res.status(400).json({ 
        success: false, 
        error: 'End date must be after start date' 
      });
    }

    const result = await Database.run(
      'INSERT INTO campaigns (name, start_date, end_date) VALUES (?, ?, ?)',
      [name, start_date, end_date]
    );

    const newCampaign = await Database.get('SELECT * FROM campaigns WHERE id = ?', [result.id]);

    res.status(201).json({ success: true, campaign: newCampaign });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to create campaign' });
  }
});

// Update campaign
router.put('/:id', async (req, res) => {
  try {
    const { name, start_date, end_date, is_active } = req.body;
    const campaignId = req.params.id;

    const result = await Database.run(
      'UPDATE campaigns SET name = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, start_date, end_date, is_active, campaignId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    const updatedCampaign = await Database.get('SELECT * FROM campaigns WHERE id = ?', [campaignId]);

    res.json({ success: true, campaign: updatedCampaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to update campaign' });
  }
});

// Delete campaign
router.delete('/:id', async (req, res) => {
  try {
    const campaignId = req.params.id;

    // Check if campaign has responses
    const responses = await Database.get(
      'SELECT COUNT(*) as count FROM survey_responses WHERE campaign_id = ?',
      [campaignId]
    );

    if (responses.count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete campaign with existing responses. Deactivate instead.' 
      });
    }

    const result = await Database.run('DELETE FROM campaigns WHERE id = ?', [campaignId]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    res.json({ success: true, message: 'Campaign deleted successfully' });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, error: 'Failed to delete campaign' });
  }
});

// Get active campaigns
router.get('/active/list', async (req, res) => {
  try {
    const activeCampaigns = await Database.all(`
      SELECT * FROM campaigns 
      WHERE is_active = 1 
      AND date('now') BETWEEN start_date AND end_date
      ORDER BY start_date ASC
    `);
    
    res.json({ success: true, campaigns: activeCampaigns });
  } catch (error) {
    console.error('Error fetching active campaigns:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch active campaigns' });
  }
});

module.exports = router;