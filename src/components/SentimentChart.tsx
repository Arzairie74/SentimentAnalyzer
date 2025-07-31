import React, { useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { BarChart3, PieChart, BarChart } from 'lucide-react';

interface SentimentChartProps {
  data: {
    positive: number;
    neutral: number;
    negative: number;
    total: number;
  };
}

type ChartType = 'histogram' | 'pie' | 'bar';

export default function SentimentChart({ data }: SentimentChartProps) {
  const [chartType, setChartType] = useState<ChartType>('histogram');
  const svgRef = useRef<SVGSVGElement>(null);

  const chartOptions = [
    { value: 'histogram', label: 'Histogram', icon: BarChart3 },
    { value: 'pie', label: 'Pie Chart', icon: PieChart },
    { value: 'bar', label: 'Bar Chart', icon: BarChart }
  ];

  useEffect(() => {
    if (data.total === 0) return;
    
    switch (chartType) {
      case 'histogram':
        drawHistogram();
        break;
      case 'pie':
        drawPieChart();
        break;
      case 'bar':
        drawBarChart();
        break;
    }
  }, [chartType, data]);

  const drawHistogram = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const chartData = [
      { sentiment: 'Positive', count: data.positive, color: '#10b981' },
      { sentiment: 'Neutral', count: data.neutral, color: '#f59e0b' },
      { sentiment: 'Negative', count: data.negative, color: '#ef4444' }
    ];

    const x = d3.scaleBand()
      .domain(chartData.map(d => d.sentiment))
      .range([margin.left, width - margin.right])
      .padding(0.3);

    const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count) || 0])
      .nice()
      .range([height - margin.bottom, margin.top]);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g');

    // Add bars
    g.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', d => x(d.sentiment)!)
      .attr('y', height - margin.bottom)
      .attr('width', x.bandwidth())
      .attr('height', 0)
      .attr('fill', d => d.color)
      .attr('rx', 4)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200)
      .attr('y', d => y(d.count))
      .attr('height', d => height - margin.bottom - y(d.count));

    // Add value labels on bars
    g.selectAll('.label')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', d => x(d.sentiment)! + x.bandwidth() / 2)
      .attr('y', height - margin.bottom)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', 'white')
      .text(d => d.count)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200)
      .attr('y', d => y(d.count) + 20)
      .style('opacity', 1);

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280');

    // Add y-axis
    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y).ticks(5))
      .selectAll('text')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280');

    // Style axes
    g.selectAll('.domain, .tick line')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1);
  };

  const drawPieChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 400;
    const height = 300;
    const radius = Math.min(width, height) / 2 - 20;

    const chartData = [
      { sentiment: 'Positive', count: data.positive, color: '#10b981' },
      { sentiment: 'Neutral', count: data.neutral, color: '#f59e0b' },
      { sentiment: 'Negative', count: data.negative, color: '#ef4444' }
    ].filter(d => d.count > 0);

    const pie = d3.pie<any>()
      .value(d => d.count)
      .sort(null);

    const arc = d3.arc<any>()
      .innerRadius(0)
      .outerRadius(radius);

    const labelArc = d3.arc<any>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.6);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    const arcs = g.selectAll('.arc')
      .data(pie(chartData))
      .enter()
      .append('g')
      .attr('class', 'arc');

    // Add pie slices
    arcs.append('path')
      .attr('d', arc)
      .attr('fill', d => d.data.color)
      .attr('stroke', 'white')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200)
      .style('opacity', 1)
      .attrTween('d', function(d) {
        const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return function(t) {
          return arc(interpolate(t));
        };
      });

    // Add labels
    arcs.append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', 'white')
      .style('opacity', 0)
      .text(d => d.data.count)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200 + 400)
      .style('opacity', 1);

    // Add percentage labels
    arcs.append('text')
      .attr('transform', d => `translate(${labelArc.centroid(d)})`)
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '10px')
      .attr('fill', 'white')
      .attr('dy', '1.2em')
      .style('opacity', 0)
      .text(d => `${((d.data.count / data.total) * 100).toFixed(1)}%`)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200 + 600)
      .style('opacity', 1);
  };

  const drawBarChart = () => {
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 500;
    const height = 300;
    const margin = { top: 20, right: 30, bottom: 40, left: 80 };

    const chartData = [
      { sentiment: 'Positive', count: data.positive, color: '#10b981' },
      { sentiment: 'Neutral', count: data.neutral, color: '#f59e0b' },
      { sentiment: 'Negative', count: data.negative, color: '#ef4444' }
    ];

    const x = d3.scaleLinear()
      .domain([0, d3.max(chartData, d => d.count) || 0])
      .nice()
      .range([margin.left, width - margin.right]);

    const y = d3.scaleBand()
      .domain(chartData.map(d => d.sentiment))
      .range([margin.top, height - margin.bottom])
      .padding(0.3);

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g');

    // Add bars
    g.selectAll('.bar')
      .data(chartData)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', margin.left)
      .attr('y', d => y(d.sentiment)!)
      .attr('width', 0)
      .attr('height', y.bandwidth())
      .attr('fill', d => d.color)
      .attr('ry', 4)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200)
      .attr('width', d => x(d.count) - margin.left);

    // Add value labels
    g.selectAll('.label')
      .data(chartData)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', margin.left)
      .attr('y', d => y(d.sentiment)! + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', 'white')
      .text(d => d.count)
      .style('opacity', 0)
      .transition()
      .duration(800)
      .delay((d, i) => i * 200)
      .attr('x', d => x(d.count) - 10)
      .style('opacity', 1);

    // Add x-axis
    g.append('g')
      .attr('transform', `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280');

    // Add y-axis
    g.append('g')
      .attr('transform', `translate(${margin.left},0)`)
      .call(d3.axisLeft(y))
      .selectAll('text')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-size', '12px')
      .attr('fill', '#6b7280');

    // Style axes
    g.selectAll('.domain, .tick line')
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 1);
  };

  if (data.total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No data available for visualization</p>
          <p className="text-sm">Analyze some text or Reddit posts to see charts here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Sentiment Distribution</h4>
          <p className="text-sm text-gray-600">Visual breakdown of your analysis results</p>
        </div>
        
        <div className="relative">
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value as ChartType)}
            className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {chartOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="flex justify-center bg-gray-50 rounded-lg p-6">
        <svg ref={svgRef} className="max-w-full h-auto"></svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-gray-600">No Harassment ({data.positive})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span className="text-gray-600">Neutral ({data.neutral})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-gray-600">Harassment ({data.negative})</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {data.total > 0 ? ((data.positive / data.total) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-gray-600">No Harassment</div>
        </div>
        <div className="p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">
            {data.total > 0 ? ((data.neutral / data.total) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-gray-600">Neutral</div>
        </div>
        <div className="p-3 bg-red-50 rounded-lg">
          <div className="text-lg font-bold text-red-600">
            {data.total > 0 ? ((data.negative / data.total) * 100).toFixed(1) : 0}%
          </div>
          <div className="text-gray-600">Harassment</div>
        </div>
      </div>
    </div>
  );
}