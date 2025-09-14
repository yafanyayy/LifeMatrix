const express = require('express');
const router = express.Router();
const Database = require('../database');
const Scheduler = require('../services/scheduler');
const SmsService = require('../services/smsService');

// Basic auth middleware (simple password check)
const adminAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const expectedPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization header required' });
  }
  
  const token = authHeader.substring(7);
  if (token !== expectedPassword) {
    return res.status(401).json({ success: false, error: 'Invalid admin password' });
  }
  
  next();
};

// Apply auth to all admin routes
router.use(adminAuth);

// Get dashboard overview
router.get('/dashboard', async (req, res) => {
  try {
    // Get total users
    const totalUsers = await Database.get('SELECT COUNT(*) as count FROM users WHERE is_active = 1');
    
    // Get total campaigns
    const totalCampaigns = await Database.get('SELECT COUNT(*) as count FROM campaigns WHERE is_active = 1');
    
    // Get total responses
    const totalResponses = await Database.get('SELECT COUNT(*) as count FROM survey_responses');
    
    // Get today's responses
    const todayResponses = await Database.get(`
      SELECT COUNT(*) as count FROM survey_responses 
      WHERE response_date = date('now')
    `);
    
    // Get SMS stats
    const smsStats = await SmsService.getSmsStats();
    
    // Get recent responses
    const recentResponses = await Database.all(`
      SELECT 
        sr.*,
        u.name as user_name,
        u.phone_number,
        c.name as campaign_name
      FROM survey_responses sr
      JOIN users u ON sr.user_id = u.id
      JOIN campaigns c ON sr.campaign_id = c.id
      ORDER BY sr.submitted_at DESC
      LIMIT 10
    `);

    // Get next scheduled time
    const nextScheduled = await Scheduler.getNextScheduledTime();

    res.json({
      success: true,
      dashboard: {
        stats: {
          totalUsers: totalUsers.count,
          totalCampaigns: totalCampaigns.count,
          totalResponses: totalResponses.count,
          todayResponses: todayResponses.count
        },
        smsStats,
        recentResponses,
        nextScheduled
      }
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// Send test SMS
router.post('/test-sms', async (req, res) => {
  try {
    const { user_id, campaign_id } = req.body;

    if (!user_id || !campaign_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id and campaign_id are required' 
      });
    }

    const result = await Scheduler.sendTestSurvey(user_id, campaign_id);
    res.json(result);
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({ success: false, error: 'Failed to send test SMS' });
  }
});

// Get system status
router.get('/status', async (req, res) => {
  try {
    const nextScheduled = await Scheduler.getNextScheduledTime();
    const smsStats = await SmsService.getSmsStats();
    
    // Check database connection
    const dbTest = await Database.get('SELECT 1 as test');
    const dbStatus = dbTest ? 'connected' : 'disconnected';
    
    // Check Twilio configuration
    const twilioStatus = process.env.TWILIO_ACCOUNT_SID && 
                        process.env.TWILIO_AUTH_TOKEN && 
                        process.env.TWILIO_PHONE_NUMBER ? 'configured' : 'not_configured';

    res.json({
      success: true,
      status: {
        database: dbStatus,
        twilio: twilioStatus,
        scheduler: 'running',
        nextScheduled,
        smsStats: smsStats.slice(0, 5) // Last 5 SMS stats
      }
    });
  } catch (error) {
    console.error('Error checking system status:', error);
    res.status(500).json({ success: false, error: 'Failed to check system status' });
  }
});

// Bulk import users
router.post('/users/import', async (req, res) => {
  try {
    const { users } = req.body;

    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'users array is required and must not be empty' 
      });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const user of users) {
      try {
        const { phone_number, name, timezone } = user;
        
        if (!phone_number) {
          results.failed++;
          results.errors.push(`Missing phone number for user: ${JSON.stringify(user)}`);
          continue;
        }

        await Database.run(
          'INSERT OR IGNORE INTO users (phone_number, name, timezone) VALUES (?, ?, ?)',
          [phone_number, name || null, timezone || 'America/New_York']
        );
        
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error importing user ${user.phone_number}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      importResults: results
    });
  } catch (error) {
    console.error('Error importing users:', error);
    res.status(500).json({ success: false, error: 'Failed to import users' });
  }
});

// Export data
router.get('/export/responses', async (req, res) => {
  try {
    const { campaign_id, format = 'json' } = req.query;

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
    if (campaign_id) {
      query += ' WHERE sr.campaign_id = ?';
      params.push(campaign_id);
    }

    query += ' ORDER BY sr.submitted_at DESC';

    const responses = await Database.all(query, params);

    if (format === 'csv') {
      // Convert to CSV format
      const csvHeaders = 'ID,User Name,Phone Number,Campaign,Response Date,Joy Score,Achievement Score,Meaningfulness Score,Free Text,Submitted At\n';
      const csvRows = responses.map(r => 
        `${r.id},"${r.user_name || ''}","${r.phone_number}","${r.campaign_name}","${r.response_date}",${r.joy_score},${r.achievement_score},${r.meaningfulness_score},"${(r.free_text || '').replace(/"/g, '""')}","${r.submitted_at}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=survey_responses.csv');
      res.send(csvHeaders + csvRows);
    } else {
      res.json({
        success: true,
        data: responses,
        count: responses.length,
        exported_at: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error exporting responses:', error);
    res.status(500).json({ success: false, error: 'Failed to export responses' });
  }
});

module.exports = router;