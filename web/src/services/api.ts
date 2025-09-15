import axios from 'axios';
import { User, Campaign, SurveyResponse, UserDashboard, AdminDashboard } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Users API
export const usersApi = {
  getAll: (): Promise<{ success: boolean; users: User[] }> =>
    api.get('/users').then(res => res.data),
  
  getById: (id: number): Promise<{ success: boolean; user: User }> =>
    api.get(`/users/${id}`).then(res => res.data),
  
  create: (user: Partial<User>): Promise<{ success: boolean; user: User }> =>
    api.post('/users', user).then(res => res.data),
  
  update: (id: number, user: Partial<User>): Promise<{ success: boolean; user: User }> =>
    api.put(`/users/${id}`, user).then(res => res.data),
  
  delete: (id: number): Promise<{ success: boolean; message: string }> =>
    api.delete(`/users/${id}`).then(res => res.data),
  
  getDashboard: (id: number): Promise<{ success: boolean; dashboard?: UserDashboard; error?: string }> =>
    api.get(`/users/${id}/dashboard`).then(res => res.data),
};

// Campaigns API
export const campaignsApi = {
  getAll: (): Promise<{ success: boolean; campaigns: Campaign[] }> =>
    api.get('/campaigns').then(res => res.data),
  
  getById: (id: number): Promise<{ success: boolean; campaign: Campaign }> =>
    api.get(`/campaigns/${id}`).then(res => res.data),
  
  create: (campaign: Partial<Campaign>): Promise<{ success: boolean; campaign: Campaign }> =>
    api.post('/campaigns', campaign).then(res => res.data),
  
  update: (id: number, campaign: Partial<Campaign>): Promise<{ success: boolean; campaign: Campaign }> =>
    api.put(`/campaigns/${id}`, campaign).then(res => res.data),
  
  delete: (id: number): Promise<{ success: boolean; message: string }> =>
    api.delete(`/campaigns/${id}`).then(res => res.data),
  
  getActive: (): Promise<{ success: boolean; campaigns: Campaign[] }> =>
    api.get('/campaigns/active/list').then(res => res.data),
};

// Responses API
export const responsesApi = {
  getAll: (params?: { user_id?: number; campaign_id?: number; limit?: number; offset?: number }): Promise<{ success: boolean; responses: SurveyResponse[]; pagination: any }> =>
    api.get('/responses', { params }).then(res => res.data),
  
  getById: (id: number): Promise<{ success: boolean; response: SurveyResponse }> =>
    api.get(`/responses/${id}`).then(res => res.data),
  
  create: (response: Partial<SurveyResponse>): Promise<{ success: boolean; response?: SurveyResponse; message?: string; error?: string }> =>
    api.post('/responses', response).then(res => res.data),
  
  getAnalytics: (params?: { campaign_id?: number; days?: number }): Promise<{ success: boolean; analytics: any }> =>
    api.get('/responses/analytics/summary', { params }).then(res => res.data),
};

// Admin API
export const adminApi = {
  getDashboard: (): Promise<{ success: boolean; dashboard?: AdminDashboard; error?: string }> =>
    api.get('/admin/dashboard').then(res => res.data),
  
  getStatus: (): Promise<{ success: boolean; status: any }> =>
    api.get('/admin/status').then(res => res.data),
  
  sendTestSms: (userId: number, campaignId: number): Promise<{ success: boolean; message?: string; error?: string }> =>
    api.post('/admin/test-sms', { user_id: userId, campaign_id: campaignId }).then(res => res.data),
  
  importUsers: (users: Partial<User>[]): Promise<{ success: boolean; importResults: any }> =>
    api.post('/admin/users/import', { users }).then(res => res.data),
  
  exportResponses: (params?: { campaign_id?: number; format?: string }): Promise<any> =>
    api.get('/admin/export/responses', { params }).then(res => res.data),
};

// Auth helper
export const setAdminToken = (token: string) => {
  localStorage.setItem('admin_token', token);
};

export const getAdminToken = () => {
  return localStorage.getItem('admin_token');
};

export const clearAdminToken = () => {
  localStorage.removeItem('admin_token');
};

export default api;
