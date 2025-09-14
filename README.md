# Daily SMS Survey & Feedback System

A prototype system that sends daily SMS surveys to users and provides feedback with score visualizations.

## 🎯 Objective

Build a working prototype that demonstrates technical execution and creative problem-solving for a daily SMS survey system that tracks user's joy, achievement, and meaningfulness scores.

## ✨ Features

- **Daily SMS Delivery**: Automated SMS at 7am Eastern Time
- **4-Question Survey**: Joy, Achievement, Meaningfulness (1-10) + free text
- **Response Handling**: Collect and process user responses
- **Feedback System**: Visual score tracking and progress visualization
- **Admin Dashboard**: Manage users, campaigns, and view responses
- **Configurable Campaigns**: Set start/end dates and manage phone numbers

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite
- **SMS Service**: Twilio
- **Frontend**: React with Tailwind CSS
- **Scheduling**: node-cron for daily SMS delivery
- **Visualization**: Chart.js for score tracking

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Set up Environment Variables**
   ```bash
   cp .env.example .env
   # Edit .env with your Twilio credentials
   ```

3. **Initialize Database**
   ```bash
   npm run db:init
   ```

4. **Start the Application**
   ```bash
   npm run dev
   ```

5. **Access Admin Dashboard**
   - Open http://localhost:3000/admin
   - Add phone numbers and configure campaigns

## 📱 SMS Survey Questions

1. "How much **joy** did you get from your day yesterday? (1–10)"
2. "How much **achievement** did you get from your day yesterday? (1–10)"
3. "How much **meaningfulness** did you get from your day yesterday? (1–10)"
4. "What was **one thing that influenced your ratings the most**? (free text)"

## 🎨 Features Implemented

- ✅ Daily SMS scheduling at 7am ET
- ✅ 4-question survey system
- ✅ Response collection and storage
- ✅ Score visualization dashboard
- ✅ Admin panel for user management
- ✅ Campaign configuration
- ✅ Progress tracking with weekly summaries

## 🔧 Development Choices

- **SQLite**: Chosen for simplicity and portability in prototype
- **Twilio**: Industry standard for SMS delivery
- **React**: Fast development and good visualization capabilities
- **node-cron**: Reliable scheduling for daily tasks
- **Chart.js**: Easy-to-use charting library for score visualization

## 📊 Score Calculation

- **Weekly Totals**: Sum of daily scores for each metric
- **Progress Tracking**: Visual comparison against recommended thresholds
- **Trend Analysis**: Week-over-week progress visualization

## 🎯 Future Enhancements

- Advanced analytics and insights
- Motivational feedback system
- Mobile app integration
- Email backup notifications
- Advanced user segmentation
- Export capabilities for data analysis

## 📝 Demo

See the `demo/` folder for screenshots and screen recordings of the system in action.

## 🤝 Contributing

This is a prototype project. Feel free to fork and extend for your own use cases!
