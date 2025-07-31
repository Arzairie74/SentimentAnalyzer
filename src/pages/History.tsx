import React, { useState } from 'react';
import { useHarassment } from '../contexts/SentimentContext';
import { MessageSquare, Type, Calendar, TrendingUp, AlertCircle, Filter, Download, FileText } from 'lucide-react';
import { exportToCSV, exportDetailedAnalysisToCSV } from '../utils/csvExport';

export default function History() {
  const { history } = useHarassment();
  const [filter, setFilter] = useState<'all' | 'reddit' | 'text'>('all');

  const filteredHistory = history.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getDominantSentiment = (results: any) => {
    if (results.positive >= results.neutral && results.positive >= results.negative) {
      return 'no-harassment';
    }
    if (results.negative >= results.neutral && results.negative >= results.positive) {
      return 'harassment';
    }
    return 'neutral';
  };

  const handleExportAll = () => {
    if (filteredHistory.length === 0) {
      alert('No data to export');
      return;
    }
    
    const filename = filter === 'all' ? 'all-sentiment-analyses' : `${filter}-analyses`;
    exportToCSV(filteredHistory, filename);
  };

  const handleExportSingle = (analysis: any) => {
    exportDetailedAnalysisToCSV(analysis);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Harassment Detection History</h1>
          <p className="text-gray-600">View your past harassment detection analyses</p>
        </div>
        
        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'reddit' | 'text')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Analyses</option>
              <option value="reddit">Reddit Posts</option>
              <option value="text">Text Analyses</option>
            </select>
          </div>
          
          {filteredHistory.length > 0 && (
            <button
              onClick={handleExportAll}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Analyses</p>
              <p className="text-2xl font-bold text-gray-900">{history.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Reddit Posts</p>
              <p className="text-2xl font-bold text-gray-900">
                {history.filter(h => h.type === 'reddit').length}
              </p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Text Analyses</p>
              <p className="text-2xl font-bold text-gray-900">
                {history.filter(h => h.type === 'text').length}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Type className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl shadow-lg border border-gray-200/50">
        {filteredHistory.length === 0 ? (
          <div className="p-12 text-center">
            <div className="p-4 bg-gray-50 rounded-full w-16 h-16 mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analyses yet</h3>
            <p className="text-gray-600">Start analyzing Reddit posts or text to see your history here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredHistory.map((item) => {
              const dominantSentiment = getDominantSentiment(item.results);
              
              return (
                <div key={item.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${item.type === 'reddit' ? 'bg-orange-50' : 'bg-green-50'}`}>
                        {item.type === 'reddit' ? (
                          <MessageSquare className="h-6 w-6 text-orange-600" />
                        ) : (
                          <Type className="h-6 w-6 text-green-600" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {item.type === 'reddit' ? 'Reddit Harassment Detection' : 'Text Harassment Detection'}
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            dominantSentiment === 'no-harassment' ? 'bg-green-100 text-green-800' :
                            dominantSentiment === 'harassment' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {dominantSentiment === 'no-harassment' ? 'No Harassment' : 
                             dominantSentiment === 'harassment' ? 'Harassment Detected' : 'Neutral'}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {item.type === 'reddit' ? item.url : item.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                          
                          {item.type === 'reddit' && (
                            <span>{item.results.total} comments analyzed</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full" title="No Harassment"></div>
                          <span className="text-sm text-gray-600">{item.results.positive}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-yellow-500 rounded-full" title="Neutral"></div>
                          <span className="text-sm text-gray-600">{item.results.neutral}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-red-500 rounded-full" title="Harassment"></div>
                          <span className="text-sm text-gray-600">{item.results.negative}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleExportSingle(item)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Export detailed analysis"
                      >
                        <FileText className="h-4 w-4" />
                        Export
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}