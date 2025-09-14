const express = require('express');
const router = express.Router();
const Database = require('../database');

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await Database.all(`
      SELECT 
        u.*,
        COUNT(sr.id) as total_responses,
        MAX(sr.submitted_at) as last_response
      FROM users u
      LEFT JOIN survey_responses sr ON u.id = sr.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await Database.get('SELECT * FROM users WHERE id = ?', [req.params.id]);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get user's response history
    const responses = await Database.all(`
      SELECT 
        sr.*,
        c.name as campaign_name
      FROM survey_responses sr
      JOIN campaigns c ON sr.campaign_id = c.id
      WHERE sr.user_id = ?
      ORDER BY sr.response_date DESC
    `, [req.params.id]);

    // Get weekly totals
    const weeklyTotals = await Database.get(`
      SELECT 
        SUM(joy_score) as joy,
        SUM(achievement_score) as achievement,
        SUM(meaningfulness_score) as meaningfulness,
        COUNT(*) as total_days
      FROM survey_responses 
      WHERE user_id = ? 
      AND response_date >= date('now', '-7 days')
    `, [req.params.id]);

    res.json({ 
      success: true, 
      user: {
        ...user,
        responses,
        weeklyTotals: weeklyTotals || { joy: 0, achievement: 0, meaningfulness: 0, total_days: 0 }
      }
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', async (req, res) => {
  try {
    const { phone_number, name, timezone } = req.body;

    if (!phone_number) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }

    // Validate phone number format (basic validation)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({ success: false, error: 'Invalid phone number format' });
    }

    const result = await Database.run(
      'INSERT INTO users (phone_number, name, timezone) VALUES (?, ?, ?)',
      [phone_number, name || null, timezone || 'America/New_York']
    );

    const newUser = await Database.get('SELECT * FROM users WHERE id = ?', [result.id]);

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ success: false, error: 'Phone number already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  }
});

// Update user
router.put('/:id', async (req, res) => {
  try {
    const { name, timezone, is_active } = req.body;
    const userId = req.params.id;

    const result = await Database.run(
      'UPDATE users SET name = ?, timezone = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, timezone, is_active, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const updatedUser = await Database.get('SELECT * FROM users WHERE id = ?', [userId]);

    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;

    // Check if user has responses
    const responses = await Database.get(
      'SELECT COUNT(*) as count FROM survey_responses WHERE user_id = ?',
      [userId]
    );

    if (responses.count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete user with existing responses. Deactivate instead.' 
      });
    }

    const result = await Database.run('DELETE FROM users WHERE id = ?', [userId]);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Failed to delete user' });
  }
});

// Get user dashboard data
router.get('/:id/dashboard', async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user info
    const user = await Database.get('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Get recent responses (last 7 days)
    const recentResponses = await Database.all(`
      SELECT 
        sr.*,
        c.name as campaign_name
      FROM survey_responses sr
      JOIN campaigns c ON sr.campaign_id = c.id
      WHERE sr.user_id = ? 
      AND sr.response_date >= date('now', '-7 days')
      ORDER BY sr.response_date DESC
    `, [userId]);

    // Get weekly totals
    const weeklyTotals = await Database.get(`
      SELECT 
        SUM(joy_score) as joy,
        SUM(achievement_score) as achievement,
        SUM(meaningfulness_score) as meaningfulness,
        COUNT(*) as total_days,
        AVG(joy_score) as avg_joy,
        AVG(achievement_score) as avg_achievement,
        AVG(meaningfulness_score) as avg_meaningfulness
      FROM survey_responses 
      WHERE user_id = ? 
      AND response_date >= date('now', '-7 days')
    `, [userId]);

    // Get all-time stats
    const allTimeStats = await Database.get(`
      SELECT 
        COUNT(*) as total_responses,
        AVG(joy_score) as avg_joy,
        AVG(achievement_score) as avg_achievement,
        AVG(meaningfulness_score) as avg_meaningfulness,
        MIN(response_date) as first_response,
        MAX(response_date) as last_response
      FROM survey_responses 
      WHERE user_id = ?
    `, [userId]);

    res.json({
      success: true,
      dashboard: {
        user,
        recentResponses,
        weeklyTotals: weeklyTotals || { joy: 0, achievement: 0, meaningfulness: 0, total_days: 0, avg_joy: 0, avg_achievement: 0, avg_meaningfulness: 0 },
        allTimeStats: allTimeStats || { total_responses: 0, avg_joy: 0, avg_achievement: 0, avg_meaningfulness: 0, first_response: null, last_response: null }
      }
    });
  } catch (error) {
    console.error('Error fetching user dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;