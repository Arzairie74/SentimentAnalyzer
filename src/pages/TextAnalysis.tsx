import React, { useState } from 'react';
import { useHarassment } from '../contexts/SentimentContext';
import { Download, AlertTriangle, CheckCircle, Minus, BarChart3, Type } from 'lucide-react';
import { exportDetailedAnalysisToCSV } from '../utils/csvExport';

export default function TextAnalysis() {
  const { analyzeText } = useHarassment();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      console.log('Starting text analysis...');
      const analysis = await analyzeText(text);
      console.log('Analysis completed:', analysis);
      setResult(analysis);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Analysis failed';
      console.error('Text analysis error:', error);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (result) {
      exportDetailedAnalysisToCSV(result, 'text-analysis');
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'negative':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'No Harassment';
      case 'negative':
        return 'Harassment Detected';
      default:
        return 'Neutral';
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50';
      case 'negative':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getDominantSentiment = (results: any) => {
    if (results.positive >= results.neutral && results.positive >= results.negative) {
      return 'positive';
    }
    if (results.negative >= results.neutral && results.negative >= results.positive) {
      return 'negative';
    }
    return 'neutral';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Type className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900">Text Analysis</h1>
        </div>
        <p className="text-gray-600">Analyze custom text content for harassment detection</p>
      </div>

      {/* Input Form */}
      <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
        <div className="space-y-4">
          <div>
            <label htmlFor="text" className="block text-sm font-medium text-gray-700 mb-2">
              Text Content
            </label>
            <textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none"
              rows={6}
              placeholder="Enter or paste your text here to analyze for harassment content..."
            />
            <p className="text-sm text-gray-500 mt-2">
              Characters: {text.length} | Words: {text.trim() ? text.trim().split(/\s+/).length : 0}
            </p>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !text.trim()}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Analyzing Text...
              </>
            ) : (
              <>
                <BarChart3 className="h-5 w-5" />
                Analyze Text
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-red-800 mb-2">Text Analysis Failed</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="text-sm text-red-600 space-y-2">
                <p className="font-medium">Possible solutions:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Check that your OpenAI API credentials are properly configured</li>
                  <li>Ensure you have a stable internet connection</li>
                  <li>Try with a shorter text sample</li>
                  <li>The system will automatically fall back to keyword-based analysis if AI is unavailable</li>
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
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Results to CSV
            </button>
          </div>

          {/* Overview */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Text Analysis Results</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-600">{result.results.positive}</p>
                <p className="text-sm text-gray-600">No Harassment</p>
                <p className="text-xs text-gray-500">
                  {result.results.total > 0 ? ((result.results.positive / result.results.total) * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <Minus className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-yellow-600">{result.results.neutral}</p>
                <p className="text-sm text-gray-600">Neutral</p>
                <p className="text-xs text-gray-500">
                  {result.results.total > 0 ? ((result.results.neutral / result.results.total) * 100).toFixed(1) : 0}%
                </p>
              </div>

              <div className="text-center p-4 bg-red-50 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-600">{result.results.negative}</p>
                <p className="text-sm text-gray-600">Harassment Detected</p>
                <p className="text-xs text-gray-500">
                  {result.results.total > 0 ? ((result.results.negative / result.results.total) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>

            {/* Overall Assessment */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-gray-800 mb-2">Overall Text Assessment</h4>
              <div className="flex items-center">
                {getSentimentIcon(getDominantSentiment(result.results))}
                <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${getSentimentColor(getDominantSentiment(result.results))}`}>
                  {getSentimentLabel(getDominantSentiment(result.results))}
                </span>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">No Harassment</span>
                <span className="text-sm text-gray-600">
                  {result.results.total > 0 ? ((result.results.positive / result.results.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${result.results.total > 0 ? (result.results.positive / result.results.total) * 100 : 0}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Neutral</span>
                <span className="text-sm text-gray-600">
                  {result.results.total > 0 ? ((result.results.neutral / result.results.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${result.results.total > 0 ? (result.results.neutral / result.results.total) * 100 : 0}%` }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Harassment Detected</span>
                <span className="text-sm text-gray-600">
                  {result.results.total > 0 ? ((result.results.negative / result.results.total) * 100).toFixed(1) : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${result.results.total > 0 ? (result.results.negative / result.results.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Detailed Text Analysis</h3>
            
            <div className="space-y-3">
              {result.analysis.map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className={`p-2 rounded-full ${item.sentiment === 'positive' ? 'bg-green-50' : item.sentiment === 'negative' ? 'bg-red-50' : 'bg-yellow-50'}`}>
                    <div className={`w-2 h-2 rounded-full ${item.sentiment === 'positive' ? 'bg-green-500' : item.sentiment === 'negative' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 mb-2">{item.text}</p>
                    <div className="flex items-center gap-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${getSentimentColor(item.sentiment)}`}>
                        {getSentimentLabel(item.sentiment)}
                      </span>
                      <span className="text-xs text-gray-500">
                        Confidence: {item.score.toFixed(3)}
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