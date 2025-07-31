import React, { useState } from 'react';
import { useHarassment } from '../contexts/SentimentContext';
import { MessageSquare, Link as LinkIcon, BarChart3, TrendingUp, Users, AlertCircle, Download } from 'lucide-react';
import { exportDetailedAnalysisToCSV } from '../utils/csvExport';

export default function RedditAnalysis() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const { analyzeRedditPost } = useHarassment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const analysis = await analyzeRedditPost(url);
      setResult(analysis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Analysis failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getSentimentBg = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-50';
      case 'negative': return 'bg-red-50';
      default: return 'bg-yellow-50';
    }
  };

  const handleExportResult = () => {
    if (!result) return;
    exportDetailedAnalysisToCSV(result, 'reddit-analysis');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Reddit Analysis</h1>
        <p className="text-gray-600">Analyze sentiment from Reddit post comments</p>
      </div>

      {/* Input Form */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              Reddit Post URL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                placeholder="https://www.reddit.com/r/..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing...
              </>
            ) : (
              <>
                <BarChart3 className="h-5 w-5" />
                Analyze Comments
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Detection Failed</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="text-sm text-red-600 space-y-2">
                <p className="font-medium">Possible solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Verify the Reddit post URL is correct and accessible</li>
                  <li>Ensure the post is public and has comments</li>
                  <li>Check that your OpenAI API credentials are properly configured in the .env file</li>
                  <li>Try a different Reddit post with more comments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Export Button */}
          <div className="flex justify-end">
            <button
              onClick={handleExportResult}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Results to CSV
            </button>
          </div>
          
          {/* Overview */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Harassment Detection Overview</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="p-3 bg-blue-50 rounded-lg mb-2">
                  <Users className="h-6 w-6 text-blue-600 mx-auto" />
                </div>
                <p className="text-2xl font-bold text-gray-900">{result.results.total}</p>
                <p className="text-sm text-gray-600">Total Comments</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-green-50 rounded-lg mb-2">
                  <TrendingUp className="h-6 w-6 text-green-600 mx-auto" title="No Harassment" />
                </div>
                <p className="text-2xl font-bold text-green-600">{result.results.positive}</p>
                <p className="text-sm text-gray-600">No Harassment</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-yellow-50 rounded-lg mb-2">
                  <MessageSquare className="h-6 w-6 text-yellow-600 mx-auto" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{result.results.neutral}</p>
                <p className="text-sm text-gray-600">Neutral</p>
              </div>
              
              <div className="text-center">
                <div className="p-3 bg-red-50 rounded-lg mb-2">
                  <AlertCircle className="h-6 w-6 text-red-600 mx-auto" title="Harassment Detected" />
                </div>
                <p className="text-2xl font-bold text-red-600">{result.results.negative}</p>
                <p className="text-sm text-gray-600">Harassment</p>
              </div>
            </div>

            {/* Sentiment Distribution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">No Harassment</span>
                <span className="text-sm text-gray-600">{((result.results.positive / result.results.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(result.results.positive / result.results.total) * 100}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Neutral</span>
                <span className="text-sm text-gray-600">{((result.results.neutral / result.results.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(result.results.neutral / result.results.total) * 100}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Harassment Detected</span>
                <span className="text-sm text-gray-600">{((result.results.negative / result.results.total) * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${(result.results.negative / result.results.total) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Comment Details */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
           <h3 className="text-xl font-semibold text-gray-900 mb-4">Harassment Detection Results</h3>
            
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {result.analysis.map((comment: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${getSentimentBg(comment.sentiment)}`}>
                    <div className={`w-2 h-2 rounded-full ${comment.sentiment === 'positive' ? 'bg-green-500' : comment.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{comment.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs font-medium ${getSentimentColor(comment.sentiment)}`}>
                        {comment.sentiment === 'positive' ? 'No Harassment' : 
                         comment.sentiment === 'negative' ? 'Harassment' : 'Neutral'}
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {comment.score.toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}