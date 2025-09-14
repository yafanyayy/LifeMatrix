const twilio = require('twilio');
const Database = require('../database');

class SmsService {
  constructor() {
    this.client = null;
    this.phoneNumber = null;
  }

  async init() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !this.phoneNumber) {
      throw new Error('Twilio credentials not configured. Please check your environment variables.');
    }

    this.client = twilio(accountSid, authToken);
    console.log('Twilio SMS service initialized');
  }

  async sendSurveySms(userId, campaignId) {
    try {
      const user = await Database.get('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const campaign = await Database.get('SELECT * FROM campaigns WHERE id = ?', [campaignId]);
      if (!campaign) {
        throw new Error(`Campaign with ID ${campaignId} not found`);
      }

      const surveyMessage = this.generateSurveyMessage();
      const responseUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/survey/${userId}/${campaignId}`;

      const message = await this.client.messages.create({
        body: surveyMessage,
        from: this.phoneNumber,
        to: user.phone_number
      });

      // Log the SMS
      await Database.run(
        `INSERT INTO sms_logs (user_id, campaign_id, message_type, message_content, twilio_sid, status, sent_at)
         VALUES (?, ?, 'survey', ?, ?, 'sent', CURRENT_TIMESTAMP)`,
        [userId, campaignId, surveyMessage, message.sid]
      );

      console.log(`Survey SMS sent to ${user.phone_number}: ${message.sid}`);
      return { success: true, messageSid: message.sid };

    } catch (error) {
      console.error('Error sending survey SMS:', error);
      
      // Log the error
      await Database.run(
        `INSERT INTO sms_logs (user_id, campaign_id, message_type, message_content, status, error_message, created_at)
         VALUES (?, ?, 'survey', ?, 'failed', ?, CURRENT_TIMESTAMP)`,
        [userId, campaignId, 'Survey message', error.message]
      );

      return { success: false, error: error.message };
    }
  }

  async sendFeedbackSms(userId, campaignId, scores) {
    try {
      const user = await Database.get('SELECT * FROM users WHERE id = ?', [userId]);
      if (!user) {
        throw new Error(`User with ID ${userId} not found`);
      }

      const feedbackMessage = this.generateFeedbackMessage(scores);
      const dashboardUrl = `${process.env.BASE_URL || 'http://localhost:3001'}/dashboard/${userId}`;

      const message = await this.client.messages.create({
        body: feedbackMessage,
        from: this.phoneNumber,
        to: user.phone_number
      });

      // Log the SMS
      await Database.run(
        `INSERT INTO sms_logs (user_id, campaign_id, message_type, message_content, twilio_sid, status, sent_at)
         VALUES (?, ?, 'feedback', ?, ?, 'sent', CURRENT_TIMESTAMP)`,
        [userId, campaignId, feedbackMessage, message.sid]
      );

      console.log(`Feedback SMS sent to ${user.phone_number}: ${message.sid}`);
      return { success: true, messageSid: message.sid };

    } catch (error) {
      console.error('Error sending feedback SMS:', error);
      
      // Log the error
      await Database.run(
        `INSERT INTO sms_logs (user_id, campaign_id, message_type, message_content, status, error_message, created_at)
         VALUES (?, ?, 'feedback', ?, 'failed', ?, CURRENT_TIMESTAMP)`,
        [userId, campaignId, 'Feedback message', error.message]
      );

      return { success: false, error: error.message };
    }
  }

  generateSurveyMessage() {
    return `🌟 Daily Life Check-in 🌟

How was your day yesterday? Please rate each area (1-10):

1️⃣ Joy: How much joy did you get?
2️⃣ Achievement: How much achievement did you get?
3️⃣ Meaningfulness: How much meaningfulness did you get?
4️⃣ What influenced your ratings most? (free text)

Reply with your scores like: "8,7,9,Spent time with family"

Or visit: ${process.env.BASE_URL || 'http://localhost:3001'}/survey

Thank you for participating! 🙏`;
  }

  generateFeedbackMessage(scores) {
    const { joy, achievement, meaningfulness, weeklyTotals } = scores;
    const total = joy + achievement + meaningfulness;
    const average = (total / 3).toFixed(1);

    let feedback = `📊 Your Daily Scores:
Joy: ${joy}/10
Achievement: ${achievement}/10
Meaningfulness: ${meaningfulness}/10
Average: ${average}/10

📈 Weekly Progress:
Joy: ${weeklyTotals.joy}
Achievement: ${weeklyTotals.achievement}
Meaningfulness: ${weeklyTotals.meaningfulness}

${this.getMotivationalMessage(average)}`;

    return feedback;
  }

  getMotivationalMessage(average) {
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

  async getSmsStats() {
    try {
      const stats = await Database.all(`
        SELECT 
          status,
          COUNT(*) as count,
          DATE(created_at) as date
        FROM sms_logs 
        WHERE created_at >= date('now', '-7 days')
        GROUP BY status, DATE(created_at)
        ORDER BY date DESC
      `);
      return stats;
    } catch (error) {
      console.error('Error getting SMS stats:', error);
      return [];
    }
  }
}

module.exports = new SmsService();