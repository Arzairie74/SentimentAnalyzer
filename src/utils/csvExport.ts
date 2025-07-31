import type { SentimentAnalysis } from '../lib/supabase';

export const exportToCSV = (data: SentimentAnalysis[], filename: string = 'sentiment-analysis-export') => {
  // Define CSV headers
  const headers = [
    'Date',
    'Type',
    'Content/URL',
    'Total Comments/Texts',
    'Positive Count',
    'Neutral Count', 
    'Negative Count',
    'Positive %',
    'Neutral %',
    'Negative %',
    'Dominant Sentiment',
    'Sample Text',
    'Sample Sentiment',
    'Sample Score'
  ];

  // Convert data to CSV rows
  const csvRows = data.map(item => {
    const total = item.results.total;
    const positivePercent = total > 0 ? ((item.results.positive / total) * 100).toFixed(1) : '0';
    const neutralPercent = total > 0 ? ((item.results.neutral / total) * 100).toFixed(1) : '0';
    const negativePercent = total > 0 ? ((item.results.negative / total) * 100).toFixed(1) : '0';
    
    // Determine dominant sentiment
    const getDominantSentiment = () => {
      if (item.results.positive >= item.results.neutral && item.results.positive >= item.results.negative) {
        return 'Positive';
      }
      if (item.results.negative >= item.results.neutral && item.results.negative >= item.results.positive) {
        return 'Negative';
      }
      return 'Neutral';
    };

    // Get sample analysis data (first item)
    const sampleAnalysis = item.analysis[0] || {};
    const sampleText = sampleAnalysis.text ? `"${sampleAnalysis.text.replace(/"/g, '""').substring(0, 100)}..."` : '';
    const sampleSentiment = sampleAnalysis.sentiment || '';
    const sampleScore = sampleAnalysis.score ? sampleAnalysis.score.toFixed(3) : '';

    return [
      new Date(item.created_at).toLocaleString(),
      item.type === 'reddit' ? 'Reddit Post' : 'Text Analysis',
      `"${(item.url || item.content).replace(/"/g, '""')}"`,
      total,
      item.results.positive,
      item.results.neutral,
      item.results.negative,
      `${positivePercent}%`,
      `${neutralPercent}%`,
      `${negativePercent}%`,
      getDominantSentiment(),
      sampleText,
      sampleSentiment,
      sampleScore
    ];
  });

  // Combine headers and rows
  const csvContent = [headers, ...csvRows]
    .map(row => row.join(','))
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const exportDetailedAnalysisToCSV = (analysis: SentimentAnalysis, filename?: string) => {
  const baseFilename = filename || `${analysis.type}-analysis-${analysis.id}`;
  
  // Headers for detailed analysis
  const headers = [
    'Index',
    'Text/Comment',
    'Sentiment',
    'Confidence Score',
    'Text Length',
    'Word Count'
  ];

  // Convert analysis data to CSV rows
  const csvRows = analysis.analysis.map((item, index) => [
    index + 1,
    `"${item.text.replace(/"/g, '""')}"`,
   item.sentiment === 'positive' ? 'No Harassment' : 
   item.sentiment === 'negative' ? 'Harassment' : 'Neutral',
    item.score.toFixed(3),
    item.text.length,
    item.text.split(/\s+/).length
  ]);

  // Add summary row at the top
  const summaryRows = [
    ['SUMMARY'],
    ['Detection Date', new Date(analysis.created_at).toLocaleString()],
    ['Type', analysis.type === 'reddit' ? 'Reddit Harassment Detection' : 'Text Harassment Detection'],
    ['Source', analysis.url || 'Custom Text'],
    ['Total Items', analysis.results.total],
    ['No Harassment Count', analysis.results.positive],
    ['Neutral Count', analysis.results.neutral],
    ['Harassment Count', analysis.results.negative],
    [''],
    ['DETAILED HARASSMENT DETECTION RESULTS']
  ];

  // Combine all content
  const csvContent = [...summaryRows, headers, ...csvRows]
    .map(row => row.join(','))
    .join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${baseFilename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};