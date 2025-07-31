import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import cloud from 'd3-cloud';

interface WordCloudProps {
  data: Array<{
    text: string;
    sentiment: 'positive' | 'neutral' | 'negative';
  }>;
}

interface WordData {
  text: string;
  size: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  x?: number;
  y?: number;
  rotate?: number;
}

export default function WordCloud({ data }: WordCloudProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!data || data.length === 0) {
      setLoading(false);
      return;
    }

    generateWordCloud();
  }, [data]);

  const generateWordCloud = () => {
    setLoading(true);
    
    // Process text data to extract words
    const wordFrequency = new Map<string, { count: number; sentiment: 'positive' | 'neutral' | 'negative' }>();
    
    // Common stop words to filter out
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these',
      'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
      'my', 'your', 'his', 'her', 'its', 'our', 'their', 'not', 'no', 'yes', 'so', 'if', 'then',
      'than', 'as', 'like', 'just', 'only', 'also', 'even', 'still', 'now', 'here', 'there',
      'where', 'when', 'why', 'how', 'what', 'who', 'which', 'all', 'any', 'some', 'more', 'most',
      'much', 'many', 'very', 'too', 'really', 'quite', 'pretty', 'well', 'good', 'bad', 'get',
      'got', 'go', 'going', 'come', 'came', 'see', 'saw', 'know', 'knew', 'think', 'thought',
      'say', 'said', 'tell', 'told', 'make', 'made', 'take', 'took', 'give', 'gave', 'put',
      'one', 'two', 'first', 'last', 'new', 'old', 'long', 'short', 'high', 'low', 'big', 'small'
    ]);

    data.forEach(item => {
      // Clean and split text into words
      const words = item.text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ') // Remove punctuation
        .split(/\s+/)
        .filter(word => word.length > 2 && !stopWords.has(word)); // Filter short words and stop words

      words.forEach(word => {
        const existing = wordFrequency.get(word);
        if (existing) {
          existing.count++;
        } else {
          wordFrequency.set(word, { count: 1, sentiment: item.sentiment });
        }
      });
    });

    // Convert to array and sort by frequency
    const wordArray: WordData[] = Array.from(wordFrequency.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 50) // Take top 50 words
      .map(([text, data]) => ({
        text,
        size: Math.max(12, Math.min(48, data.count * 8)), // Scale font size
        sentiment: data.sentiment
      }));

    if (wordArray.length === 0) {
      setLoading(false);
      return;
    }

    // Clear previous content
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 600;
    const height = 400;

    // Create word cloud layout
    const layout = cloud()
      .size([width, height])
      .words(wordArray)
      .padding(5)
      .rotate(() => (Math.random() - 0.5) * 60) // Random rotation between -30 and 30 degrees
      .font('Inter, system-ui, sans-serif')
      .fontSize(d => d.size)
      .on('end', draw);

    layout.start();

    function draw(words: WordData[]) {
      const g = svg
        .attr('width', width)
        .attr('height', height)
        .append('g')
        .attr('transform', `translate(${width / 2},${height / 2})`);

      const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
          case 'positive': return '#10b981'; // green-500
          case 'negative': return '#ef4444'; // red-500
          default: return '#f59e0b'; // yellow-500
        }
      };

      g.selectAll('text')
        .data(words)
        .enter()
        .append('text')
        .style('font-size', d => `${d.size}px`)
        .style('font-family', 'Inter, system-ui, sans-serif')
        .style('font-weight', '600')
        .style('fill', d => getSentimentColor(d.sentiment))
        .style('cursor', 'default')
        .style('opacity', 0)
        .attr('text-anchor', 'middle')
        .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
        .text(d => d.text)
        .transition()
        .duration(1000)
        .delay((d, i) => i * 50)
        .style('opacity', 1);

      setLoading(false);
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">💭</div>
          <p>No text data available for word cloud</p>
          <p className="text-sm">Analyze some text or Reddit posts to see words here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Generating word cloud...</p>
          </div>
        </div>
      )}
      
      <div className="flex justify-center">
        <svg ref={svgRef} className="max-w-full h-auto"></svg>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">Positive words</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">Neutral words</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Negative words</span>
        </div>
      </div>
    </div>
  );
}