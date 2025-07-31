import React from 'react';
import { Link } from 'react-router-dom';
import { useHarassment } from '../contexts/SentimentContext';
import WordCloud from '../components/WordCloud';
import HarassmentChart from '../components/SentimentChart';
import { MessageSquare, Type, TrendingUp, Activity, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { history } = useHarassment();

  const totalAnalyses = history.length;
  const redditAnalyses = history.filter(h => h.type === 'reddit').length;
  const textAnalyses = history.filter(h => h.type === 'text').length;
  
  const recentAnalyses = history.slice(0, 3);
  
  // Calculate total harassment counts across all analyses
  const totalResults = history.reduce((acc, h) => ({
    positive: acc.positive + h.results.positive,
    neutral: acc.neutral + h.results.neutral,
    negative: acc.negative + h.results.negative,
    total: acc.total + h.results.total
  }), { positive: 0, neutral: 0, negative: 0, total: 0 });
  
  // Prepare data for word cloud - combine all analysis text
  const wordCloudData = history.flatMap(item => 
    item.analysis.map(analysis => ({
      text: analysis.text,
      sentiment: analysis.sentiment // Keep as sentiment for word cloud compatibility
    }))
  );

  const stats = [
    {
      label: 'Total Analyses',
      value: totalAnalyses,
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Reddit Posts',
      value: redditAnalyses,
      icon: MessageSquare,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      label: 'Text Analyses',
      value: textAnalyses,
      icon: Type,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Harassment Detection Dashboard</h1>
        <p className="text-gray-600">Detect harassment in Reddit posts and text content</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          to="/reddit"
          className="group bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-orange-600" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-orange-600 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Reddit Analysis</h3>
          <p className="text-gray-600">Detect harassment in Reddit post comments</p>
        </Link>

        <Link
          to="/text"
          className="group bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-50 rounded-lg">
              <Type className="h-6 w-6 text-green-600" />
            </div>
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Text Analysis</h3>
          <p className="text-gray-600">Detect harassment in custom text input</p>
        </Link>
      </div>

      {/* Word Cloud */}
      {history.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Word Cloud</h3>
              <p className="text-sm text-gray-600">Most common words from your analyses</p>
            </div>
          </div>
          
          <WordCloud data={wordCloudData} />
        </div>
      )}

      {/* Sentiment Charts */}
      {history.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
          <HarassmentChart data={totalResults} />
        </div>
      )}

      {/* Recent Analyses */}
      {recentAnalyses.length > 0 && (
        <div className="bg-white/80 backdrop-blur-md rounded-xl p-6 shadow-lg border border-gray-200/50">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Recent Analyses</h3>
            <Link
              to="/history"
              className="text-blue-600 hover:text-blue-500 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentAnalyses.map((analysis) => (
              <div key={analysis.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${analysis.type === 'reddit' ? 'bg-orange-50' : 'bg-green-50'}`}>
                    {analysis.type === 'reddit' ? (
                      <MessageSquare className={`h-4 w-4 ${analysis.type === 'reddit' ? 'text-orange-600' : 'text-green-600'}`} />
                    ) : (
                      <Type className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {analysis.type === 'reddit' ? 'Reddit Post' : 'Text Analysis'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(analysis.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{analysis.results.positive}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{analysis.results.neutral}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-gray-600">{analysis.results.negative}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}