import React, { useState, useEffect } from 'react';
import { adminApi, usersApi, campaignsApi, responsesApi } from '../services/api';
import { AdminDashboard as AdminDashboardType, User, Campaign, SurveyResponse } from '../types';
import { 
  PlusIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

const AdminDashboard: React.FC = () => {
  const [dashboard, setDashboard] = useState<AdminDashboardType | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // User management states
  const [showUserUpload, setShowUserUpload] = useState(false);
  const [userUploadText, setUserUploadText] = useState('');
  const [newUser, setNewUser] = useState({ name: '', phone_number: '', timezone: 'America/New_York' });
  const [editingUser, setEditingUser] = useState<number | null>(null);
  const [editUserData, setEditUserData] = useState({ name: '', phone_number: '', timezone: '' });
  
  // Campaign management states
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ 
    name: '', 
    start_date: '', 
    end_date: '', 
    duration_days: 7 
  });
  
  // Response viewing states
  const [responseFilters, setResponseFilters] = useState({
    campaign_id: '',
    user_id: '',
    date_from: '',
    date_to: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, usersRes, campaignsRes, responsesRes] = await Promise.all([
          adminApi.getDashboard(),
          usersApi.getAll(),
          campaignsApi.getAll(),
          responsesApi.getAll()
        ]);

        if (dashboardRes.success && dashboardRes.dashboard) setDashboard(dashboardRes.dashboard);
        if (usersRes.success) setUsers(usersRes.users);
        if (campaignsRes.success) setCampaigns(campaignsRes.campaigns);
        if (responsesRes.success) setResponses(responsesRes.responses);
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // User management functions
  const handleBulkUserUpload = async () => {
    try {
      const lines = userUploadText.split('\n').filter(line => line.trim());
      const usersToImport = lines.map(line => {
        const [name, phone] = line.split(',').map(s => s.trim());
        return { name, phone_number: phone, timezone: 'America/New_York' };
      });

      const result = await adminApi.importUsers(usersToImport);
      if (result.success) {
        alert(`Successfully imported ${usersToImport.length} users`);
        setUserUploadText('');
        setShowUserUpload(false);
        const usersRes = await usersApi.getAll();
        if (usersRes.success) setUsers(usersRes.users);
      }
    } catch (error) {
      alert('Error importing users: ' + error);
    }
  };

  const handleAddUser = async () => {
    try {
      const result = await usersApi.create(newUser);
      if (result.success) {
        alert('User added successfully');
        setNewUser({ name: '', phone_number: '', timezone: 'America/New_York' });
        const usersRes = await usersApi.getAll();
        if (usersRes.success) setUsers(usersRes.users);
      }
    } catch (error) {
      alert('Error adding user: ' + error);
    }
  };

  const handleToggleUserStatus = async (userId: number, currentStatus: boolean) => {
    try {
      const result = await usersApi.update(userId, { is_active: !currentStatus });
      if (result.success) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        ));
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      }
    } catch (error) {
      alert('Error updating user status: ' + error);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user.id);
    setEditUserData({
      name: user.name || '',
      phone_number: user.phone_number,
      timezone: user.timezone || 'America/New_York'
    });
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    
    try {
      const result = await usersApi.update(editingUser, editUserData);
      if (result.success) {
        setUsers(users.map(user => 
          user.id === editingUser ? { ...user, ...editUserData } : user
        ));
        setEditingUser(null);
        alert('User updated successfully');
      }
    } catch (error) {
      alert('Error updating user: ' + error);
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditUserData({ name: '', phone_number: '', timezone: '' });
  };

  // Campaign management functions
  const handleCreateCampaign = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + newCampaign.duration_days);

      const campaignData = {
        name: newCampaign.name,
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        is_active: true
      };

      const result = await campaignsApi.create(campaignData);
      if (result.success) {
        alert('Campaign created successfully');
        setNewCampaign({ name: '', start_date: '', end_date: '', duration_days: 7 });
        setShowCampaignForm(false);
        const campaignsRes = await campaignsApi.getAll();
        if (campaignsRes.success) setCampaigns(campaignsRes.campaigns);
      }
    } catch (error) {
      alert('Error creating campaign: ' + error);
    }
  };

  // Response management functions
  const handleExportResponses = async () => {
    try {
      const result = await adminApi.exportResponses({ format: 'csv' });
      if (result) {
        const blob = new Blob([result], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `survey_responses_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      alert('Error exporting responses: ' + error);
    }
  };

  const handleFilterResponses = async () => {
    try {
      const params: any = {};
      if (responseFilters.campaign_id) params.campaign_id = parseInt(responseFilters.campaign_id);
      if (responseFilters.user_id) params.user_id = parseInt(responseFilters.user_id);
      
      const result = await responsesApi.getAll(params);
      if (result.success) setResponses(result.responses);
    } catch (error) {
      console.error('Error filtering responses:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">Failed to load dashboard</p>
      </div>
    );
  }

  const { stats, recentResponses, nextScheduled } = dashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-lg shadow-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center py-8">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 font-medium">SMS Campaign Management</p>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold text-gray-900">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
              <div className="text-sm text-gray-500">
                {new Date().toLocaleDateString('en-US', { year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Modern Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Users</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {stats.totalUsers}
              </p>
            </div>
          </div>

          <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600 mb-2">Campaigns</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                {stats.totalCampaigns}
              </p>
            </div>
          </div>

          <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600 mb-2">Total Responses</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {stats.totalResponses}
              </p>
            </div>
          </div>

          <div className="group relative bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative">
              <p className="text-sm font-medium text-gray-600 mb-2">Today's Responses</p>
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                {stats.todayResponses}
              </p>
            </div>
          </div>
        </div>

        {/* Next SMS Section */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 mb-8 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Next Scheduled SMS</h3>
                <p className="text-indigo-100 text-lg">
                  {new Date(nextScheduled.nextRun).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-white">
                  {Math.floor(nextScheduled.timeUntilNext / 60)}h {nextScheduled.timeUntilNext % 60}m
                </p>
                <p className="text-indigo-100">remaining</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-2 mb-8 shadow-xl border border-white/20">
          <nav className="flex space-x-2">
            {[
              { id: 'overview', name: 'Overview', icon: '📊' },
              { id: 'users', name: 'Users', icon: '👥' },
              { id: 'campaigns', name: 'Campaigns', icon: '📢' },
              { id: 'responses', name: 'Responses', icon: '💬' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 ${
                    activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg transform scale-105'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.name}</span>
                </div>
                </button>
              ))}
            </nav>
          </div>

        {/* Tab Content */}
            {activeTab === 'overview' && (
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-xl overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Recent Responses</h3>
              <p className="text-gray-600 mt-1">Latest user feedback and interactions</p>
            </div>
            <div className="p-8">
                  {recentResponses.length > 0 ? (
                <div className="space-y-6">
                  {recentResponses.map((response, index) => (
                    <div key={index} className="group bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4 shadow-lg">
                            {(response.user_name || response.phone_number || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-lg font-semibold text-gray-900">
                              {response.user_name || response.phone_number}
                            </p>
                            <p className="text-sm text-gray-600">
                              {new Date(response.submitted_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-center">
                            <p className="text-xl font-bold text-blue-600">{response.joy_score}</p>
                            <p className="text-xs text-gray-500">Joy</p>
                            </div>
                            <div className="text-center">
                            <p className="text-xl font-bold text-green-600">{response.achievement_score}</p>
                            <p className="text-xs text-gray-500">Achievement</p>
                            </div>
                            <div className="text-center">
                            <p className="text-xl font-bold text-purple-600">{response.meaningfulness_score}</p>
                            <p className="text-xs text-gray-500">Meaningfulness</p>
                          </div>
                        </div>
                      </div>
                      {response.free_text && (
                        <div className="bg-gray-50 rounded-xl p-4">
                          <p className="text-gray-700 italic">"{response.free_text}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <DocumentTextIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 text-lg">No recent responses</p>
                </div>
              )}
                </div>
              </div>
            )}

            {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Actions */}
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Users</h3>
              <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowUserUpload(!showUserUpload)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 w-32 text-center"
                    >
                      Bulk Upload
                    </button>
                    <button 
                      onClick={() => setNewUser({ name: '', phone_number: '', timezone: 'America/New_York' })}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 w-32 text-center"
                    >
                      Add User
                    </button>
                  </div>
                </div>

            {/* Forms */}
                {showUserUpload && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-medium text-gray-900 mb-4">Bulk Upload</h4>
                    <textarea
                      value={userUploadText}
                      onChange={(e) => setUserUploadText(e.target.value)}
                  placeholder="John Doe, +1234567890&#10;Jane Smith, +1234567891"
                      rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-4"
                    />
                <div className="flex space-x-3">
                      <button 
                        onClick={handleBulkUserUpload}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        disabled={!userUploadText.trim()}
                      >
                    Upload
                      </button>
                      <button 
                        onClick={() => setShowUserUpload(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-4">Add Single User</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Name"
                    />
                    <input
                      type="tel"
                      value={newUser.phone_number}
                      onChange={(e) => setNewUser({...newUser, phone_number: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Phone Number"
                    />
                    <button 
                      onClick={handleAddUser}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                      disabled={!newUser.name || !newUser.phone_number}
                    >
                      Add User
                    </button>
                  </div>
                </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUser === user.id ? (
                          <input
                            type="text"
                            value={editUserData.name}
                            onChange={(e) => setEditUserData({...editUserData, name: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500"
                            placeholder="Enter name"
                          />
                        ) : (
                          <div className="flex items-center">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                              <span className="text-sm font-medium text-gray-600">
                                {(user.name || 'U').charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3 text-sm font-medium text-gray-900">
                              {user.name || 'Unnamed User'}
                            </div>
                          </div>
                        )}
                          </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {editingUser === user.id ? (
                          <input
                            type="tel"
                            value={editUserData.phone_number}
                            onChange={(e) => setEditUserData({...editUserData, phone_number: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-blue-500 w-32"
                            placeholder="Phone number"
                          />
                        ) : (
                          user.phone_number
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.total_responses || 0}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          {editingUser === user.id ? (
                            <>
                              <button 
                                onClick={handleSaveUserEdit}
                                className="text-green-600 hover:text-green-900" 
                                title="Save changes"
                              >
                                ✓
                              </button>
                              <button 
                                onClick={handleCancelEdit}
                                className="text-gray-600 hover:text-gray-900" 
                                title="Cancel edit"
                              >
                                ✕
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="text-blue-600 hover:text-blue-900" 
                                title="Edit user"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleToggleUserStatus(user.id, user.is_active)}
                                className={`${user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                                title={user.is_active ? 'Deactivate user' : 'Activate user'}
                              >
                                {user.is_active ? '⏸️' : '▶️'}
                              </button>
                            </>
                          )}
                        </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'campaigns' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Campaigns</h3>
                  <button 
                    onClick={() => setShowCampaignForm(!showCampaignForm)}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                <PlusIcon className="h-4 w-4 mr-2" />
                    Create Campaign
                  </button>
                </div>

                {showCampaignForm && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="font-medium text-gray-900 mb-4">Create Campaign</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        value={newCampaign.name}
                        onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Campaign Name"
                      />
                        <select
                          value={newCampaign.duration_days}
                          onChange={(e) => setNewCampaign({...newCampaign, duration_days: parseInt(e.target.value)})}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={1}>1 day</option>
                          <option value={3}>3 days</option>
                          <option value={7}>7 days</option>
                          <option value={14}>14 days</option>
                          <option value={30}>30 days</option>
                        </select>
                      </div>
                <div className="mt-4 flex space-x-3">
                      <button 
                        onClick={handleCreateCampaign}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        disabled={!newCampaign.name}
                      >
                    Create
                      </button>
                      <button 
                        onClick={() => setShowCampaignForm(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

            <div className="grid gap-4">
                  {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-lg border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                          <p className="text-sm text-gray-500">
                            {new Date(campaign.start_date).toLocaleDateString()} - {new Date(campaign.end_date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {campaign.total_responses || 0} responses • {campaign.total_users || 0} users
                          </p>
                        </div>
                    <div className="flex items-center space-x-3">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'responses' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Responses</h3>
                  <button 
                    onClick={handleExportResponses}
                className="inline-flex items-center px-3 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export CSV
                  </button>
                </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="font-medium text-gray-900 mb-4">Filters</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select
                      value={responseFilters.campaign_id}
                      onChange={(e) => setResponseFilters({...responseFilters, campaign_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Campaigns</option>
                      {campaigns.map(campaign => (
                        <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
                      ))}
                    </select>
                    
                    <select
                      value={responseFilters.user_id}
                      onChange={(e) => setResponseFilters({...responseFilters, user_id: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">All Users</option>
                      {users.map(user => (
                        <option key={user.id} value={user.id}>{user.name || user.phone_number}</option>
                      ))}
                    </select>
                    
                    <input
                      type="date"
                      value={responseFilters.date_from}
                      onChange={(e) => setResponseFilters({...responseFilters, date_from: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    
                    <button 
                      onClick={handleFilterResponses}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                  Apply
                    </button>
                  </div>
                </div>

                {/* Responses Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joy</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Achievement</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Meaningfulness</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Feedback</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {responses.map((response) => (
                    <tr key={response.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                            {response.user_name || response.phone_number}
                        </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {response.campaign_name || `Campaign ${response.campaign_id}`}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(response.response_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                              {response.joy_score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                              {response.achievement_score}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
                              {response.meaningfulness_score}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                            {response.free_text || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {responses.length === 0 && (
                <div className="text-center py-12">
                  <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No responses found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your filters.</p>
                  </div>
                )}
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;