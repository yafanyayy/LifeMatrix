import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';
import SurveyForm from './components/SurveyForm';
import LandingPage from './components/LandingPage';
import './index.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/dashboard/:userId" element={<UserDashboard />} />
          <Route path="/survey/:userId/:campaignId" element={<SurveyForm />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;