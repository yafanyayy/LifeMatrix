const cron = require('node-cron');
const moment = require('moment-timezone');
const Database = require('../database');
const SmsService = require('./smsService');

class Scheduler {
  constructor() {
    this.job = null;
    this.timezone = process.env.TIMEZONE || 'America/New_York';
  }

  start() {
    // Schedule daily SMS at 7am Eastern Time
    // Cron format: minute hour day month dayOfWeek
    // '0 7 * * *' = 7:00 AM every day
    this.job = cron.schedule('0 7 * * *', async () => {
      console.log('🕰️ Daily SMS job triggered at 7am ET');
      await this.sendDailySurveys();
    }, {
      scheduled: true,
      timezone: this.timezone
    });

    console.log(`📅 Daily SMS scheduler started - will send surveys at 7:00 AM ${this.timezone}`);
  }

  stop() {
    if (this.job) {
      this.job.stop();
      console.log('🛑 Daily SMS scheduler stopped');
    }
  }

  async sendDailySurveys() {
    try {
      console.log('📱 Starting daily survey distribution...');

      // Get active campaigns
      const activeCampaigns = await Database.all(`
        SELECT * FROM campaigns 
        WHERE is_active = 1 
        AND date('now') BETWEEN start_date AND end_date
      `);

      if (activeCampaigns.length === 0) {
        console.log('ℹ️ No active campaigns found for today');
        return;
      }

      // Get active users
      const activeUsers = await Database.all(`
        SELECT * FROM users 
        WHERE is_active = 1
      `);

      if (activeUsers.length === 0) {
        console.log('ℹ️ No active users found');
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Send surveys to each user for each active campaign
      for (const campaign of activeCampaigns) {
        for (const user of activeUsers) {
          try {
            // Check if user already responded today
            const existingResponse = await Database.get(`
              SELECT id FROM survey_responses 
              WHERE user_id = ? AND campaign_id = ? AND response_date = date('now')
            `, [user.id, campaign.id]);

            if (existingResponse) {
              console.log(`⏭️ Skipping ${user.phone_number} - already responded today`);
              continue;
            }

            // Send SMS
            const result = await SmsService.sendSurveySms(user.id, campaign.id);
            
            if (result.success) {
              successCount++;
              console.log(`✅ Survey sent to ${user.phone_number} for campaign "${campaign.name}"`);
            } else {
              errorCount++;
              console.error(`❌ Failed to send survey to ${user.phone_number}: ${result.error}`);
            }

            // Add small delay to avoid rate limiting
            await this.delay(100);

          } catch (error) {
            errorCount++;
            console.error(`❌ Error processing user ${user.phone_number}:`, error);
          }
        }
      }

      console.log(`📊 Daily survey distribution complete: ${successCount} sent, ${errorCount} errors`);

    } catch (error) {
      console.error('❌ Error in daily survey distribution:', error);
    }
  }

  async sendTestSurvey(userId, campaignId) {
    try {
      console.log(`🧪 Sending test survey to user ${userId} for campaign ${campaignId}`);
      const result = await SmsService.sendSurveySms(userId, campaignId);
      
      if (result.success) {
        console.log('✅ Test survey sent successfully');
        return { success: true, message: 'Test survey sent successfully' };
      } else {
        console.error('❌ Test survey failed:', result.error);
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('❌ Error sending test survey:', error);
      return { success: false, error: error.message };
    }
  }

  async getNextScheduledTime() {
    const now = moment().tz(this.timezone);
    const next7am = now.clone().hour(7).minute(0).second(0);
    
    // If it's already past 7am today, get 7am tomorrow
    if (now.isAfter(next7am)) {
      next7am.add(1, 'day');
    }

    return {
      nextRun: next7am.format(),
      timezone: this.timezone,
      timeUntilNext: next7am.diff(now, 'minutes')
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new Scheduler();