# Demo Guide - Daily SMS Survey & Feedback System

## 🎯 What This System Does

This is a complete prototype of a Daily SMS Survey & Feedback System that:

1. **Sends daily SMS surveys** at 7am Eastern Time to users
2. **Collects responses** via SMS or web form
3. **Provides instant feedback** with score visualizations
4. **Tracks progress** over time with beautiful charts
5. **Manages campaigns** and users through an admin dashboard

## 🚀 Quick Start Demo

### 1. Initialize the Database
```bash
npm run db:init
npm run db:seed
```

### 2. Start the System
```bash
npm run dev
```

This will start both the backend server (port 3001) and frontend (port 3000).

### 3. Access the System

- **Landing Page**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin (password: `admin123`)
- **User Dashboard**: http://localhost:3000/dashboard/1
- **Survey Form**: http://localhost:3000/survey/1/1

## 📱 Demo Features

### Admin Dashboard
- View system statistics and health
- Manage users and campaigns
- See recent responses in real-time
- Monitor SMS delivery status
- Export data for analysis

### User Dashboard
- Beautiful score visualizations
- Weekly progress tracking
- Historical data charts
- Motivational feedback

### Survey Form
- Interactive sliders for scoring
- Real-time score calculation
- Free text feedback
- Mobile-responsive design

## 🧪 Testing the SMS System

### Option 1: Use Sample Data
The system comes with 5 sample users and 1 active campaign. You can:
- View user dashboards with sample responses
- Test the survey form
- Explore the admin interface

### Option 2: Test with Real SMS (Requires Twilio Setup)
1. Set up Twilio account and get credentials
2. Add your phone number to the users table
3. Create an active campaign
4. Wait for 7am ET or send a test SMS

## 📊 Sample Data Included

- **5 Users**: John, Jane, Bob, Alice, Charlie
- **1 Campaign**: "Life Matrix Pilot" (7 days duration)
- **5 Sample Responses**: Various scores and feedback
- **Realistic Data**: Joy, Achievement, Meaningfulness scores

## 🎨 Key Features Demonstrated

### Technical Implementation
- ✅ Node.js/Express backend with SQLite database
- ✅ React frontend with TypeScript and Tailwind CSS
- ✅ Twilio SMS integration
- ✅ Automated scheduling with node-cron
- ✅ Real-time data visualization with Chart.js
- ✅ RESTful API with proper error handling
- ✅ Responsive design for mobile and desktop

### User Experience
- ✅ Intuitive survey interface
- ✅ Beautiful progress visualizations
- ✅ Motivational feedback messages
- ✅ Comprehensive admin dashboard
- ✅ Real-time updates and notifications

### Business Logic
- ✅ Daily SMS scheduling at 7am ET
- ✅ 4-question survey (Joy, Achievement, Meaningfulness + free text)
- ✅ Score validation and processing
- ✅ Weekly totals and progress tracking
- ✅ Campaign management and user segmentation

## 🔧 Configuration

### Environment Variables
Copy `env.example` to `.env` and configure:
- Twilio credentials (for real SMS)
- Database path
- Admin password
- Timezone settings

### Customization
- Modify survey questions in `src/services/smsService.js`
- Adjust scheduling time in `src/services/scheduler.js`
- Customize feedback messages and thresholds
- Add new visualization types in React components

## 📈 Analytics & Insights

The system provides comprehensive analytics:
- Daily response rates
- Score trends over time
- User engagement metrics
- Campaign performance data
- SMS delivery statistics

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

---

**Built with ❤️ for the Life Matrix prototype challenge**
