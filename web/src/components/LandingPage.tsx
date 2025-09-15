import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const LandingPage: React.FC = () => {
  const [adminPassword, setAdminPassword] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPassword = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';
    if (adminPassword === expectedPassword) {
      localStorage.setItem('admin_token', 'admin123');
      window.location.href = '/admin';
    } else {
      alert('Invalid admin password');
    }
  };

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Daily SMS Surveys',
      description: 'Automated daily surveys sent at 7am Eastern Time to track joy, achievement, and meaningfulness.'
    },
    {
      icon: ChartBarIcon,
      title: 'Score Visualization',
      description: 'Beautiful charts and progress tracking to visualize your daily and weekly scores over time.'
    },
    {
      icon: UserGroupIcon,
      title: 'Admin Dashboard',
      description: 'Comprehensive admin panel to manage users, campaigns, and view detailed analytics.'
    },
    {
      icon: ClockIcon,
      title: 'Real-time Feedback',
      description: 'Instant feedback and motivational messages sent after each survey submission.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">LIFE Matrix</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <form onSubmit={handleAdminLogin} className="flex items-center space-x-2">
                <input
                  type="password"
                  placeholder="Admin Password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="input-field w-32"
                />
                <button type="submit" className="btn-primary text-sm">
                  Admin Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Daily SMS Survey & Feedback System
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Track your daily joy, achievement, and meaningfulness with automated SMS surveys and beautiful visualizations.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                to="/admin"
                className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
              >
                Admin Dashboard
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Section */}
        <div className="mt-20 bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Demo the System</h2>
            <p className="mt-4 text-lg text-gray-600">
              Try out the survey system with sample data
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              to="/dashboard/1"
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-medium text-gray-900">User Dashboard</h3>
              <p className="mt-2 text-sm text-gray-600">View sample user dashboard with charts and progress tracking</p>
            </Link>

            <Link
              to="/survey/1/1"
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-medium text-gray-900">Survey Form</h3>
              <p className="mt-2 text-sm text-gray-600">Try the survey form that users see when they click the SMS link</p>
            </Link>

            <Link
              to="/admin"
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <h3 className="text-lg font-medium text-gray-900">Admin Panel</h3>
              <p className="mt-2 text-sm text-gray-600">Explore the admin dashboard for managing users and campaigns</p>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900">Features</h2>
            <p className="mt-4 text-lg text-gray-600">
              Everything you need to run a comprehensive daily survey system
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="flex justify-center">
                  <feature.icon className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-gray-500">
              Life Matrix - Daily SMS Survey & Feedback System
            </p>
            <p className="mt-2 text-xs text-gray-400">
              Built with React, Node.js, Twilio, and SQLite
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;