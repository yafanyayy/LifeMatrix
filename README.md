# LIFE Matrix - Daily SMS Survey & Feedback System

A complete prototype system that sends daily SMS surveys to users and provides feedback with score visualizations for tracking joy, achievement, and meaningfulness.

## 🎯 What This System Does

Sends daily SMS surveys at 7am Eastern Time to users, collects responses, provides instant feedback with score visualizations, and tracks progress over time with beautiful charts through an admin dashboard.

## ✨ Features

- **Daily SMS Delivery**: Automated SMS at 7am Eastern Time
- **4-Question Survey**: Joy, Achievement, Meaningfulness (1-10) + free text
- **Response Handling**: Collect and process user responses
- **Feedback System**: Visual score tracking and progress visualization
- **Admin Dashboard**: Manage users, campaigns, and view responses
- **Configurable Campaigns**: Set start/end dates and manage phone numbers

## 🛠️ Tech Stack

- **Backend**: Node.js with Express
- **Database**: SQLite (stored in `./data/survey.db`)
- **SMS Service**: Twilio
- **Frontend**: React with TypeScript and Tailwind CSS
- **Scheduling**: node-cron for daily SMS delivery
- **Visualization**: Chart.js for score tracking

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Environment Variables
```bash
cp env.example .env
# Edit .env with your Twilio credentials
```

### 3. Initialize Database
```bash
npm run db:init
npm run db:seed
```

### 4. Start the Application
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend (port 3000).

### 5. Access the System

- **Landing Page**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin (password: `admin123`)
- **User Dashboard**: http://localhost:3000/dashboard/1
- **Survey Form**: http://localhost:3000/survey/1/1

## 📊 Database Structure

The system uses SQLite with 4 main tables:

- **`users`** - stores user info (phone, name, timezone)
- **`campaigns`** - stores survey campaigns (dates, active status)  
- **`survey_responses`** - stores all survey responses with scores
- **`sms_logs`** - tracks SMS delivery status

### How Users Are Stored When They Do Surveys:

1. System validates the response (scores 1-10, required fields)
2. Checks if user already responded today (prevents duplicates)
3. Stores response in `survey_responses` table with:
   - `user_id`, `campaign_id`, `response_date`
   - `joy_score`, `achievement_score`, `meaningfulness_score`
   - `free_text` (optional feedback)
   - `submitted_at` timestamp
4. Sends feedback SMS with scores and weekly totals

## 📱 SMS Survey Questions

1. "How much **joy** did you get from your day yesterday? (1–10)"
2. "How much **achievement** did you get from your day yesterday? (1–10)"
3. "How much **meaningfulness** did you get from your day yesterday? (1–10)"
4. "What was **one thing that influenced your ratings the most**? (free text)"

## 🧪 Testing the System

### Option 1: Use Sample Data
The system comes with 5 sample users and 1 active campaign:
- **5 Users**: John, Jane, Bob, Alice, Charlie
- **1 Campaign**: "Life Matrix Pilot" (7 days duration)
- **5 Sample Responses**: Various scores and feedback

### Option 2: Test with Real SMS (Requires Twilio Setup)
1. Set up Twilio account and get credentials
2. Add your phone number to the users table
3. Create an active campaign
4. Wait for 7am ET or send a test SMS

## 📈 Analytics & Insights

The system provides comprehensive analytics including daily response rates, score trends over time, user engagement metrics, campaign performance data, and SMS delivery statistics.

## 🔧 Configuration

Copy `env.example` to `.env` and configure Twilio credentials, database path, admin password, and timezone settings. Customize survey questions, scheduling times, and feedback messages in the respective service files.

## 📋 System Components & Functionality

### 📱 SMS Service
The SMS system is the core communication engine that:
- **Automated Daily Delivery**: Sends survey questions at 7:00 AM Eastern Time to all active users
- **Question Sequence**: Delivers 4 questions in order: Joy (1-10), Achievement (1-10), Meaningfulness (1-10), and free text feedback
- **Response Processing**: Captures user responses via SMS and processes them in real-time
- **Feedback Delivery**: Sends instant feedback SMS with scores and weekly progress summaries
- **Error Handling**: Manages delivery failures, invalid responses, and retry logic
- **Twilio Integration**: Uses Twilio's SMS API for reliable message delivery and status tracking

### 👤 User Dashboard (`/dashboard/:userId`)
A personalized dashboard for individual users that provides:
- **Welcome Interface**: Personalized greeting with user's name and motivational messaging
- **Stats Cards**: Visual display of weekly totals for Joy, Achievement, and Meaningfulness scores
- **Progress Charts**: 
  - Line chart showing daily scores over the last 7 days
  - Bar chart displaying weekly totals for each category
- **Recent Responses**: List of recent survey submissions with scores and feedback text
- **All-Time Statistics**: Total responses, average scores, and engagement metrics
- **Visual Design**: Clean, modern interface with color-coded score categories (yellow for Joy, green for Achievement, purple for Meaningfulness)

### 🏢 Admin Dashboard - Overview Tab
The main admin dashboard provides a comprehensive system overview:
- **System Statistics**: Total users, active campaigns, total responses, and response rate metrics
- **Next Scheduled SMS**: Countdown timer showing time until next daily SMS delivery
- **Recent Activity**: Latest survey responses with user names, scores, and feedback
- **Quick Actions**: Access to key administrative functions
- **Real-time Updates**: Live data refresh and status monitoring
- **Visual Indicators**: Color-coded status badges and progress indicators

### 👥 Admin Dashboard - User Management
Comprehensive user administration system featuring:
- **User List**: Complete table of all users with names, phone numbers, response counts, and active status
- **Bulk Upload**: CSV/text import functionality for adding multiple users at once
- **Individual User Addition**: Form to add single users with name, phone number, and timezone
- **User Editing**: Inline editing capabilities to update user names, phone numbers, and timezones
- **Status Management**: Toggle users between active/inactive states
- **Response Tracking**: View each user's response history and engagement metrics
- **Search & Filter**: Find specific users quickly
- **Data Validation**: Phone number format validation and duplicate prevention

### 📊 Admin Dashboard - Campaign Management
Campaign creation and management system that includes:
- **Campaign Creation**: Set up new survey campaigns with start/end dates and duration
- **Active Campaign Display**: List of current campaigns with status indicators
- **Campaign Details**: View campaign performance, user participation, and response rates
- **Date Management**: Configure campaign duration and scheduling
- **Status Control**: Activate/deactivate campaigns as needed
- **Performance Metrics**: Track campaign effectiveness and user engagement
- **Campaign Analytics**: Response rates, completion statistics, and user feedback

### 📈 Admin Dashboard - Responses Section
Advanced response analysis and management featuring:
- **Response Table**: Complete list of all survey responses with user names, dates, scores, and feedback
- **Advanced Filtering**: Filter responses by campaign, user, date range, or score ranges
- **Export Functionality**: Download response data as CSV for external analysis
- **Score Visualization**: Color-coded score displays with visual indicators
- **Response Summary**: Aggregate statistics and trends analysis
- **User Identification**: Link responses to specific users with contact information
- **Feedback Analysis**: Review and analyze user text feedback
- **Data Export**: Comprehensive data export capabilities for reporting

## 🎯 Next Steps for Production

If this were to go to production, consider:
1. **Database**: Migrate to PostgreSQL or MySQL
2. **Authentication**: Add proper user authentication
3. **Scaling**: Use Redis for caching and job queues
4. **Monitoring**: Add logging and error tracking
5. **Security**: Implement rate limiting and input validation
6. **Testing**: Add comprehensive test suite
7. **Deployment**: Containerize with Docker

## 💡 Creative Extensions

Some ideas for extending the system:
- **Gamification**: Add points, badges, and leaderboards
- **Social Features**: Allow users to share progress
- **AI Insights**: Use ML to provide personalized recommendations
- **Integration**: Connect with fitness trackers or calendar apps
- **Mobile App**: Native iOS/Android app
- **Advanced Analytics**: Predictive modeling and trend analysis

## 📝 Demo

See the `demo/` folder for screenshots and screen recordings of the system in action.