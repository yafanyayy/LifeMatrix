import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { responsesApi } from '../services/api';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const SurveyForm: React.FC = () => {
  const { userId, campaignId } = useParams<{ userId: string; campaignId: string }>();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    joy_score: 5,
    achievement_score: 5,
    meaningfulness_score: 5,
    free_text: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await responsesApi.create({
        user_id: parseInt(userId!),
        campaign_id: parseInt(campaignId!),
        ...formData
      });

      if (response.success && response.response) {
        setIsSubmitted(true);
        setTimeout(() => {
          navigate(`/dashboard/${userId}`);
        }, 3000);
      } else {
        setError(response.error || 'Failed to submit response');
      }
    } catch (err) {
      setError('An error occurred while submitting your response');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: number | string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-4">
            Your response has been submitted successfully. You'll receive feedback via SMS shortly.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Daily Life Check-in
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            How was your day yesterday? Please rate each area (1-10):
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Joy Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🌟 Joy: How much joy did you get from your day yesterday?
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.joy_score}
                onChange={(e) => handleInputChange('joy_score', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500">10</span>
              <span className="text-lg font-semibold text-yellow-600 w-8 text-center">
                {formData.joy_score}
              </span>
            </div>
          </div>

          {/* Achievement Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              🎯 Achievement: How much achievement did you get from your day yesterday?
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.achievement_score}
                onChange={(e) => handleInputChange('achievement_score', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500">10</span>
              <span className="text-lg font-semibold text-green-600 w-8 text-center">
                {formData.achievement_score}
              </span>
            </div>
          </div>

          {/* Meaningfulness Score */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💜 Meaningfulness: How much meaningfulness did you get from your day yesterday?
            </label>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">1</span>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.meaningfulness_score}
                onChange={(e) => handleInputChange('meaningfulness_score', parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-gray-500">10</span>
              <span className="text-lg font-semibold text-purple-600 w-8 text-center">
                {formData.meaningfulness_score}
              </span>
            </div>
          </div>

          {/* Free Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              💭 What was one thing that influenced your ratings the most?
            </label>
            <textarea
              value={formData.free_text}
              onChange={(e) => handleInputChange('free_text', e.target.value)}
              rows={3}
              className="input-field"
              placeholder="Share what made the biggest impact on your day..."
            />
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </button>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Your Scores:</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{formData.joy_score}</div>
                <div className="text-xs text-gray-500">Joy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{formData.achievement_score}</div>
                <div className="text-xs text-gray-500">Achievement</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">{formData.meaningfulness_score}</div>
                <div className="text-xs text-gray-500">Meaningfulness</div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <div className="text-lg font-semibold text-gray-900">
                Average: {((formData.joy_score + formData.achievement_score + formData.meaningfulness_score) / 3).toFixed(1)}/10
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SurveyForm;
