const express = require('express');
const router = express.Router();
const Database = require('../database');

// Twilio webhook for SMS status updates
router.post('/twilio/sms-status', async (req, res) => {
  try {
    const { MessageSid, MessageStatus, To, From } = req.body;

    if (!MessageSid) {
      return res.status(400).json({ success: false, error: 'MessageSid is required' });
    }

    // Update SMS log status
    const result = await Database.run(
      'UPDATE sms_logs SET status = ?, delivered_at = ? WHERE twilio_sid = ?',
      [MessageStatus, MessageStatus === 'delivered' ? new Date().toISOString() : null, MessageSid]
    );

    console.log(`SMS status updated: ${MessageSid} -> ${MessageStatus}`);

    res.json({ success: true, updated: result.changes > 0 });
  } catch (error) {
    console.error('Error updating SMS status:', error);
    res.status(500).json({ success: false, error: 'Failed to update SMS status' });
  }
});

// Twilio webhook for incoming SMS responses
router.post('/twilio/sms-reply', async (req, res) => {
  try {
    const { From, Body, MessageSid } = req.body;

    if (!From || !Body) {
      return res.status(400).json({ success: false, error: 'From and Body are required' });
    }

    // Find user by phone number
    const user = await Database.get('SELECT * FROM users WHERE phone_number = ?', [From]);
    
    if (!user) {
      console.log(`SMS reply from unknown number: ${From}`);
      return res.json({ success: true, message: 'User not found' });
    }

    // Get active campaign for user
    const activeCampaign = await Database.get(`
      SELECT * FROM campaigns 
      WHERE is_active = 1 
      AND date('now') BETWEEN start_date AND end_date
      ORDER BY start_date DESC
      LIMIT 1
    `);

    if (!activeCampaign) {
      console.log(`No active campaign for user: ${From}`);
      return res.json({ success: true, message: 'No active campaign' });
    }

    // Parse SMS response
    const response = parseSmsResponse(Body);
    
    if (!response.valid) {
      // Send error message back to user
      const errorMessage = `❌ Invalid format. Please reply with: "joy,achievement,meaningfulness,free_text" (e.g., "8,7,9,Great day!")`;
      
      // Log the invalid response
      await Database.run(
        `INSERT INTO sms_logs (user_id, campaign_id, message_type, message_content, twilio_sid, status, created_at)
         VALUES (?, ?, 'reply', ?, ?, 'invalid', CURRENT_TIMESTAMP)`,
        [user.id, activeCampaign.id, Body, MessageSid]
      );

      return res.json({ 
        success: true, 
        message: errorMessage,
        type: 'invalid_format'
      });
    }

    // Check if user already responded today
    const existingResponse = await Database.get(`
      SELECT id FROM survey_responses 
      WHERE user_id = ? AND campaign_id = ? AND response_date = date('now')
    `, [user.id, activeCampaign.id]);

    if (existingResponse) {
      const alreadyRespondedMessage = `✅ You've already responded today! Thank you for participating.`;
      return res.json({ 
        success: true, 
        message: alreadyRespondedMessage,
        type: 'already_responded'
      });
    }

    // Save the response
    const result = await Database.run(`
      INSERT INTO survey_responses 
      (user_id, campaign_id, response_date, joy_score, achievement_score, meaningfulness_score, free_text)
      VALUES (?, ?, date('now'), ?, ?, ?, ?)
    `, [user.id, activeCampaign.id, response.joy, response.achievement, response.meaningfulness, response.freeText]);

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
    `, [user.id, activeCampaign.id]);

    // Generate feedback message
    const feedbackMessage = generateFeedbackMessage(response, weeklyTotals);

    // Log the successful response
    await Database.run(
      `INSERT INTO sms_logs (user_id, campaign_id, message_type, message_content, twilio_sid, status, created_at)
       VALUES (?, ?, 'reply', ?, ?, 'processed', CURRENT_TIMESTAMP)`,
      [user.id, activeCampaign.id, Body, MessageSid]
    );

    res.json({ 
      success: true, 
      message: feedbackMessage,
      type: 'success'
    });

  } catch (error) {
    console.error('Error processing SMS reply:', error);
    res.status(500).json({ success: false, error: 'Failed to process SMS reply' });
  }
});

// Helper function to parse SMS response
function parseSmsResponse(body) {
  try {
    // Expected format: "joy,achievement,meaningfulness,free_text"
    const parts = body.split(',').map(part => part.trim());
    
    if (parts.length < 3) {
      return { valid: false, error: 'Not enough values' };
    }

    const joy = parseInt(parts[0]);
    const achievement = parseInt(parts[1]);
    const meaningfulness = parseInt(parts[2]);
    const freeText = parts.slice(3).join(',').trim() || null;

    // Validate scores
    if (isNaN(joy) || isNaN(achievement) || isNaN(meaningfulness)) {
      return { valid: false, error: 'Invalid score format' };
    }

    if (joy < 1 || joy > 10 || achievement < 1 || achievement > 10 || meaningfulness < 1 || meaningfulness > 10) {
      return { valid: false, error: 'Scores must be between 1 and 10' };
    }

    return {
      valid: true,
      joy,
      achievement,
      meaningfulness,
      freeText
    };
  } catch (error) {
    return { valid: false, error: 'Parse error' };
  }
}

// Helper function to generate feedback message
function generateFeedbackMessage(response, weeklyTotals) {
  const { joy, achievement, meaningfulness, freeText } = response;
  const total = joy + achievement + meaningfulness;
  const average = (total / 3).toFixed(1);

  let feedback = `📊 Your Scores:
Joy: ${joy}/10
Achievement: ${achievement}/10
Meaningfulness: ${meaningfulness}/10
Average: ${average}/10

📈 Weekly Totals:
Joy: ${weeklyTotals?.joy || 0}
Achievement: ${weeklyTotals?.achievement || 0}
Meaningfulness: ${weeklyTotals?.meaningfulness || 0}

${getMotivationalMessage(average)}`;

  return feedback;
}

function getMotivationalMessage(average) {
  const avg = parseFloat(average);
  if (avg >= 8) {
    return "🎉 Amazing! You're thriving! Keep up the great work!";
  } else if (avg >= 6) {
    return "👍 Good progress! You're on the right track!";
  } else if (avg >= 4) {
    return "💪 Keep going! Every day is a chance to grow!";
  } else {
    return "🤗 Remember, it's okay to have tough days. Tomorrow is a new opportunity!";
  }
}

module.exports = router;