export interface User {
  id: number;
  phone_number: string;
  name?: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_responses?: number;
  last_response?: string;
}

export interface Campaign {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  total_users?: number;
  total_responses?: number;
  today_responses?: number;
}

export interface SurveyResponse {
  id: number;
  user_id: number;
  campaign_id: number;
  response_date: string;
  joy_score: number;
  achievement_score: number;
  meaningfulness_score: number;
  free_text?: string;
  submitted_at: string;
  user_name?: string;
  phone_number?: string;
  campaign_name?: string;
}

export interface WeeklyTotals {
  joy: number;
  achievement: number;
  meaningfulness: number;
  total_days: number;
  avg_joy?: number;
  avg_achievement?: number;
  avg_meaningfulness?: number;
}

export interface AllTimeStats {
  total_responses: number;
  avg_joy: number;
  avg_achievement: number;
  avg_meaningfulness: number;
  first_response?: string;
  last_response?: string;
}

export interface UserDashboard {
  user: User;
  recentResponses: SurveyResponse[];
  weeklyTotals: WeeklyTotals;
  allTimeStats: AllTimeStats;
}

export interface AdminDashboard {
  stats: {
    totalUsers: number;
    totalCampaigns: number;
    totalResponses: number;
    todayResponses: number;
  };
  smsStats: any[];
  recentResponses: SurveyResponse[];
  nextScheduled: {
    nextRun: string;
    timezone: string;
    timeUntilNext: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
