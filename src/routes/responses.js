const express = require('express');
const router = express.Router();
const Database = require('../database');
const SmsService = require('../services/smsService');

// Submit survey response
router.post('/', async (req, res) => {
  try {
    const { user_id, campaign_id, joy_score, achievement_score, meaningfulness_score, free_text } = req.body;

    // Validate required fields
    if (!user_id || !campaign_id || !joy_score || !achievement_score || !meaningfulness_score) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: user_id, campaign_id, joy_score, achievement_score, meaningfulness_score' 
      });
    }

    // Validate score ranges
    const scoreArray = [joy_score, achievement_score, meaningfulness_score];
    for (const score of scoreArray) {
      if (score < 1 || score > 10 || !Number.isInteger(score)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Scores must be integers between 1 and 10' 
        });
      }
    }

    // Check if user already responded today
    const existingResponse = await Database.get(`
      SELECT id FROM survey_responses 
      WHERE user_id = ? AND campaign_id = ? AND response_date = date('now')
    `, [user_id, campaign_id]);

    if (existingResponse) {
      return res.status(409).json({ 
        success: false, 
        error: 'User has already responded today for this campaign' 
      });
    }

    // Insert response
    const result = await Database.run(`
      INSERT INTO survey_responses 
      (user_id, campaign_id, response_date, joy_score, achievement_score, meaningfulness_score, free_text)
      VALUES (?, ?, date('now'), ?, ?, ?, ?)
    `, [user_id, campaign_id, joy_score, achievement_score, meaningfulness_score, free_text || null]);

    // Get weekly totals for feedback
    const weeklyTotals = await Database.get(`
      SELECT 
        SUM(joy_score) as joy,
        SUM(achievement_score) as achievement,
        SUM(meaningfulness_score) as meaningfulness
      FROM survey_responses 
      WHERE user_id = ? 
      AND campaign_id = ?
      AND response_date >= date('now', '-7 days')
    `, [user_id, campaign_id]);

    // Send feedback SMS
    const scores = {
      joy: joy_score,
      achievement: achievement_score,
      meaningfulness: meaningfulness_score,
      weeklyTotals: weeklyTotals || { joy: 0, achievement: 0, meaningfulness: 0 }
    };

    await SmsService.sendFeedbackSms(user_id, campaign_id, scores);

    // Get the created response
    const newResponse = await Database.get(`
      SELECT 
        sr.*,
        u.name as user_name,
        u.phone_number,
        c.name as campaign_name
      FROM survey_responses sr
      JOIN users u ON sr.user_id = u.id
      JOIN campaigns c ON sr.campaign_id = c.id
      WHERE sr.id = ?
    `, [result.id]);

    res.status(201).json({ 
      success: true, 
      response: newResponse,
      message: 'Response submitted successfully and feedback sent!'
    });

  } catch (error) {
    console.error('Error submitting response:', error);
    res.status(500).json({ success: false, error: 'Failed to submit response' });
  }
});

// Get all responses
router.get('/', async (req, res) => {
  try {
    const { user_id, campaign_id, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        sr.*,
        u.name as user_name,
        u.phone_number,
        c.name as campaign_name
      FROM survey_responses sr
      JOIN users u ON sr.user_id = u.id
      JOIN campaigns c ON sr.campaign_id = c.id
    `;
    
    const params = [];
    const conditions = [];

    if (user_id) {
      conditions.push('sr.user_id = ?');
      params.push(user_id);
    }

    if (campaign_id) {
      conditions.push('sr.campaign_id = ?');
      params.push(campaign_id);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY sr.submitted_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const responses = await Database.all(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM survey_responses sr';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    const countResult = await Database.get(countQuery, params.slice(0, -2));
    const total = countResult.total;

    res.json({ 
      success: true, 
      responses,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch responses' });
  }
});

// Get response by ID
router.get('/:id', async (req, res) => {
  try {
    const response = await Database.get(`
      SELECT 
        sr.*,
        u.name as user_name,
        u.phone_number,
        c.name as campaign_name
      FROM survey_responses sr
      JOIN users u ON sr.user_id = u.id
      JOIN campaigns c ON sr.campaign_id = c.id
      WHERE sr.id = ?
    `, [req.params.id]);

    if (!response) {
      return res.status(404).json({ success: false, error: 'Response not found' });
    }

    res.json({ success: true, response });
  } catch (error) {
    console.error('Error fetching response:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch response' });
  }
});

// Get response analytics
router.get('/analytics/summary', async (req, res) => {
  try {
    const { campaign_id, days = 7 } = req.query;

    let query = `
      SELECT 
        COUNT(*) as total_responses,
        AVG(joy_score) as avg_joy,
        AVG(achievement_score) as avg_achievement,
        AVG(meaningfulness_score) as avg_meaningfulness,
        MIN(response_date) as first_response,
        MAX(response_date) as last_response
      FROM survey_responses
      WHERE response_date >= date('now', '-${parseInt(days)} days')
    `;

    const params = [];
    if (campaign_id) {
      query += ' AND campaign_id = ?';
      params.push(campaign_id);
    }

    const summary = await Database.get(query, params);

    // Get daily breakdown
    const dailyQuery = `
      SELECT 
        response_date,
        COUNT(*) as response_count,
        AVG(joy_score) as avg_joy,
        AVG(achievement_score) as avg_achievement,
        AVG(meaningfulness_score) as avg_meaningfulness
      FROM survey_responses
      WHERE response_date >= date('now', '-${parseInt(days)} days')
    `;

    const dailyParams = [];
    if (campaign_id) {
      dailyQuery += ' AND campaign_id = ?';
      dailyParams.push(campaign_id);
    }

    dailyQuery += ' GROUP BY response_date ORDER BY response_date DESC';

    const dailyBreakdown = await Database.all(dailyQuery, dailyParams);

    res.json({ 
      success: true, 
      analytics: {
        summary: summary || { total_responses: 0, avg_joy: 0, avg_achievement: 0, avg_meaningfulness: 0, first_response: null, last_response: null },
        dailyBreakdown
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

module.exports = router;