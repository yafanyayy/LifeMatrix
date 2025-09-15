import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { usersApi } from '../services/api';
import { UserDashboard as UserDashboardType } from '../types';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  BarElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

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

const UserDashboard: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [dashboard, setDashboard] = useState<UserDashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await usersApi.getDashboard(parseInt(userId!));
        if (response.success && response.dashboard) {
          setDashboard(response.dashboard);
        } else {
          setError(response.error || 'Failed to load dashboard');
        }
      } catch (err) {
        setError('An error occurred while loading the dashboard');
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchDashboard();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No dashboard data available</p>
        </div>
      </div>
    );
  }

  const { user, recentResponses, weeklyTotals, allTimeStats } = dashboard;

  // Prepare chart data
  const chartData = {
    labels: recentResponses.map(r => new Date(r.response_date).toLocaleDateString()),
    datasets: [
      {
        label: 'Joy',
        data: recentResponses.map(r => r.joy_score),
        borderColor: 'rgb(234, 179, 8)',
        backgroundColor: 'rgba(234, 179, 8, 0.1)',
        tension: 0.1
      },
      {
        label: 'Achievement',
        data: recentResponses.map(r => r.achievement_score),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.1
      },
      {
        label: 'Meaningfulness',
        data: recentResponses.map(r => r.meaningfulness_score),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        tension: 0.1
      }
    ]
  };

  const weeklyChartData = {
    labels: ['Joy', 'Achievement', 'Meaningfulness'],
    datasets: [
      {
        label: 'Weekly Totals',
        data: [weeklyTotals.joy, weeklyTotals.achievement, weeklyTotals.meaningfulness],
        backgroundColor: [
          'rgba(234, 179, 8, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)'
        ],
        borderColor: [
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)'
        ],
        borderWidth: 1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Scores Over Time'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 10
      }
    }
  };

  const weeklyChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: 'Weekly Totals'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.name || 'User'}!
            </h1>
            <p className="mt-2 text-gray-600">
              Here's your daily life tracking dashboard
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm font-bold">J</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Weekly Joy</dt>
                    <dd className="text-lg font-medium text-gray-900">{weeklyTotals.joy}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 text-sm font-bold">A</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Weekly Achievement</dt>
                    <dd className="text-lg font-medium text-gray-900">{weeklyTotals.achievement}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 text-sm font-bold">M</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Weekly Meaningfulness</dt>
                    <dd className="text-lg font-medium text-gray-900">{weeklyTotals.meaningfulness}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 text-sm font-bold">T</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Responses</dt>
                    <dd className="text-lg font-medium text-gray-900">{allTimeStats.total_responses}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <Line data={chartData} options={chartOptions} />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <Bar data={weeklyChartData} options={weeklyChartOptions} />
          </div>
        </div>

        {/* Recent Responses */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Responses</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentResponses.length > 0 ? (
              recentResponses.map((response, index) => (
                <div key={index} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(response.response_date).toLocaleDateString()}
                      </p>
                      {response.free_text && (
                        <p className="text-sm text-gray-600 mt-1">"{response.free_text}"</p>
                      )}
                    </div>
                    <div className="flex space-x-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-yellow-600">{response.joy_score}</div>
                        <div className="text-xs text-gray-500">Joy</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{response.achievement_score}</div>
                        <div className="text-xs text-gray-500">Achievement</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-purple-600">{response.meaningfulness_score}</div>
                        <div className="text-xs text-gray-500">Meaningfulness</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center">
                <p className="text-gray-500">No responses yet. Check back after submitting your first survey!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
