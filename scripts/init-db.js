const Database = require('../src/database');

async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database...');
    
    await Database.init();
    
    console.log('✅ Database initialized successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - campaigns');
    console.log('   - survey_responses');
    console.log('   - sms_logs');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }
}

initializeDatabase();
