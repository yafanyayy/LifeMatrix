const Database = require('../src/database');

async function seedDatabase() {
  try {
    console.log('🌱 Seeding database with sample data...');
    
    await Database.init();
    
    // Create sample users
    const users = [
      { phone_number: '+1234567890', name: 'John Doe', timezone: 'America/New_York' },
      { phone_number: '+1234567891', name: 'Jane Smith', timezone: 'America/New_York' },
      { phone_number: '+1234567892', name: 'Bob Johnson', timezone: 'America/Los_Angeles' },
      { phone_number: '+1234567893', name: 'Alice Brown', timezone: 'America/Chicago' },
      { phone_number: '+1234567894', name: 'Charlie Wilson', timezone: 'America/New_York' }
    ];

    console.log('👥 Creating sample users...');
    for (const user of users) {
      try {
        await Database.run(
          'INSERT OR IGNORE INTO users (phone_number, name, timezone) VALUES (?, ?, ?)',
          [user.phone_number, user.name, user.timezone]
        );
        console.log(`   ✅ Created user: ${user.name} (${user.phone_number})`);
      } catch (error) {
        console.log(`   ⚠️  User already exists: ${user.name}`);
      }
    }

    // Create sample campaign
    console.log('📅 Creating sample campaign...');
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 7); // 7 days from now

    const campaignResult = await Database.run(
      'INSERT OR IGNORE INTO campaigns (name, start_date, end_date) VALUES (?, ?, ?)',
      ['Life Matrix Pilot', today.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    if (campaignResult.changes > 0) {
      console.log('   ✅ Created campaign: Life Matrix Pilot');
    } else {
      console.log('   ⚠️  Campaign already exists');
    }

    // Get the campaign ID
    const campaign = await Database.get('SELECT * FROM campaigns WHERE name = ?', ['Life Matrix Pilot']);
    
    if (campaign) {
      // Create some sample responses
      console.log('📝 Creating sample responses...');
      const sampleResponses = [
        { user_id: 1, joy: 8, achievement: 7, meaningfulness: 9, free_text: 'Had a great day with family' },
        { user_id: 2, joy: 6, achievement: 8, meaningfulness: 7, free_text: 'Completed important project' },
        { user_id: 3, joy: 7, achievement: 6, meaningfulness: 8, free_text: 'Helped a friend in need' },
        { user_id: 1, joy: 9, achievement: 8, meaningfulness: 9, free_text: 'Went hiking in nature' },
        { user_id: 2, joy: 5, achievement: 7, meaningfulness: 6, free_text: 'Busy day at work' }
      ];

      for (const response of sampleResponses) {
        try {
          // Use yesterday's date for sample responses
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          await Database.run(
            'INSERT OR IGNORE INTO survey_responses (user_id, campaign_id, response_date, joy_score, achievement_score, meaningfulness_score, free_text) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [response.user_id, campaign.id, yesterday.toISOString().split('T')[0], response.joy, response.achievement, response.meaningfulness, response.free_text]
          );
          console.log(`   ✅ Created response for user ${response.user_id}`);
        } catch (error) {
          console.log(`   ⚠️  Response already exists for user ${response.user_id}`);
        }
      }
    }

    console.log('✅ Database seeded successfully!');
    console.log('📊 Sample data created:');
    console.log('   - 5 users');
    console.log('   - 1 active campaign');
    console.log('   - 5 sample responses');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to seed database:', error);
    process.exit(1);
  }
}

seedDatabase();
