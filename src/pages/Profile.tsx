import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHarassment } from '../contexts/SentimentContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User, Mail, Calendar, BarChart3, MessageSquare, Type, Edit2, Save, X, Download } from 'lucide-react';
import { exportToCSV } from '../utils/csvExport';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { history } = useHarassment();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const totalAnalyses = history.length;
  const redditAnalyses = history.filter(h => h.type === 'reddit').length;
  const textAnalyses = history.filter(h => h.type === 'text').length;
  
  const totalResults = history.reduce((acc, h) => ({
    positive: acc.positive + h.results.positive,
    neutral: acc.neutral + h.results.neutral,
    negative: acc.negative + h.results.negative
  }), { positive: 0, neutral: 0, negative: 0 });

  // Update editName when user changes
  React.useEffect(() => {
    if (user?.name) {
      setEditName(user.name);
    }
  }, [user?.name]);

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      setSaveError('Name cannot be empty');
      return;
    }
    
    setSaveError(null);
    setSaveSuccess(false);
    updateProfile();
  };

  const updateProfile = async () => {
    if (!user) return;

    setSaving(true);
    
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('profiles')
          .update({ name: editName.trim() })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating profile:', error);
          setSaveError('Failed to update profile. Please try again.');
          return;
        }
      } else {
        // Simulate success for demo mode
        console.log('Demo mode: Profile update simulated');
      }

      // Update the user state in auth context
      updateUser({ name: editName.trim() });
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setIsEditing(false);
      
    } catch (error) {
      console.error('Error in updateProfile:', error);
      setSaveError('An unexpected error occurred. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditName(user?.name || '');
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleExportAllData = () => {
    if (history.length === 0) {
      alert('No analysis data to export');
      return;
    }
    
    exportToCSV(history, `${user?.name?.replace(/\s+/g, '-').toLowerCase()}-sentiment-analyses`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile</h1>
        <p className="text-gray-600">Manage your account and view your analytics</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Account Information</h3>
          <button
            onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-500 transition-colors"
          >
            {isEditing ? (
              <>
                <X className="h-4 w-4" />
                Cancel
              </>
            ) : (
              <>
                <Edit2 className="h-4 w-4" />
                Edit
              </>
            )}
          </button>
        </div>
        
        {/* Success Message */}
        {saveSuccess && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">Profile updated successfully!</p>
          </div>
        )}
        
        {/* Error Message */}
        {saveError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{saveError}</p>
          </div>
        )}
        
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-blue-600" />
          </div>
          
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    disabled={saving}
                  />
                </div>
                <button
                  onClick={handleSaveProfile}
                  disabled={saving || !editName.trim()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            ) : (
              <>
                <h4 className="text-xl font-semibold text-gray-900">{user?.name}</h4>
                <p className="text-gray-600">{user?.email}</p>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-sm text-gray-600">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">Member Since</p>
              <p className="text-sm text-gray-600">
                {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Analytics</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{totalAnalyses}</p>
            <p className="text-sm text-gray-600">Total Analyses</p>
          </div>
          
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <MessageSquare className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{redditAnalyses}</p>
            <p className="text-sm text-gray-600">Reddit Posts</p>
          </div>
          
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <Type className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{textAnalyses}</p>
            <p className="text-sm text-gray-600">Text Analyses</p>
          </div>
        </div>
        
        {/* Sentiment Distribution */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Overall Harassment Detection Results</h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">No Harassment</span>
              <span className="text-sm text-gray-600">{totalResults.positive}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${totalResults.positive + totalResults.neutral + totalResults.negative > 0 
                    ? (totalResults.positive / (totalResults.positive + totalResults.neutral + totalResults.negative)) * 100 
                    : 0}%` 
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Neutral</span>
              <span className="text-sm text-gray-600">{totalResults.neutral}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${totalResults.positive + totalResults.neutral + totalResults.negative > 0 
                    ? (totalResults.neutral / (totalResults.positive + totalResults.neutral + totalResults.negative)) * 100 
                    : 0}%` 
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Harassment Detected</span>
              <span className="text-sm text-gray-600">{totalResults.negative}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${totalResults.positive + totalResults.neutral + totalResults.negative > 0 
                    ? (totalResults.negative / (totalResults.positive + totalResults.neutral + totalResults.negative)) * 100 
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      {history.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Export Data</h3>
          <p className="text-gray-600 mb-4">
            Download all your harassment detection data as a CSV file for external analysis or backup.
          </p>
          
          <button
            onClick={handleExportAllData}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export All Data to CSV
          </button>
          
          <div className="mt-4 text-sm text-gray-500">
            <p>The CSV file will include:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Detection dates and types</li>
              <li>Harassment detection results and percentages</li>
              <li>Sample text and confidence scores</li>
              <li>All {history.length} of your analyses</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}