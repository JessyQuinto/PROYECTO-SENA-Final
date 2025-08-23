import React, { useState } from 'react';
import { usePerformanceMonitoring } from '@/hooks/usePerformance';
import { PERFORMANCE_THRESHOLDS } from '@/lib/performance';
import { Card } from '@/components/ui/shadcn/card';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  threshold?: { good: number; poor: number };
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, threshold }) => {
  const getStatusColor = () => {
    if (!threshold) return 'text-gray-600';
    
    if (value <= threshold.good) return 'text-green-600';
    if (value <= threshold.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (!threshold) return 'N/A';
    
    if (value <= threshold.good) return 'Good';
    if (value <= threshold.poor) return 'Needs Improvement';
    return 'Poor';
  };

  return (
    <Card className="p-4">
      <div className="flex flex-col space-y-2">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-bold ${getStatusColor()}`}>
            {value.toFixed(value < 10 ? 3 : 0)}
          </span>
          <span className="text-sm text-gray-400">{unit}</span>
        </div>
        <span className={`text-xs ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>
    </Card>
  );
};

const PerformanceDashboard: React.FC = () => {
  const { coreWebVitalsScore, metrics, isLoading } = usePerformanceMonitoring();
  const [isVisible, setIsVisible] = useState(false);

  // Don't show in production
  if (import.meta.env.PROD) return null;

  // Get latest metrics for each type
  const getLatestMetric = (metricName: string) => {
    const metric = metrics
      .filter(m => m.metric === metricName)
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    return metric ? metric.value : 0;
  };

  const coreWebVitals = [
    {
      title: 'Largest Contentful Paint',
      value: getLatestMetric('LCP'),
      unit: 'ms',
      threshold: PERFORMANCE_THRESHOLDS.LCP,
    },
    {
      title: 'First Input Delay',
      value: getLatestMetric('FID'),
      unit: 'ms',
      threshold: PERFORMANCE_THRESHOLDS.FID,
    },
    {
      title: 'Cumulative Layout Shift',
      value: getLatestMetric('CLS'),
      unit: '',
      threshold: PERFORMANCE_THRESHOLDS.CLS,
    },
    {
      title: 'First Contentful Paint',
      value: getLatestMetric('FCP'),
      unit: 'ms',
      threshold: PERFORMANCE_THRESHOLDS.FCP,
    },
    {
      title: 'Time to First Byte',
      value: getLatestMetric('TTFB'),
      unit: 'ms',
      threshold: PERFORMANCE_THRESHOLDS.TTFB,
    },
  ];

  if (isLoading) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="mb-2 bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors text-sm font-medium"
      >
        {isVisible ? 'Hide' : 'Show'} Performance
      </button>

      {/* Dashboard panel */}
      {isVisible && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Performance Monitor</h2>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-500">Live</span>
            </div>
          </div>

          {/* Core Web Vitals Score */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Core Web Vitals Score</span>
              <span className={`text-lg font-bold ${
                coreWebVitalsScore >= 90 ? 'text-green-600' :
                coreWebVitalsScore >= 75 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {coreWebVitalsScore.toFixed(0)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  coreWebVitalsScore >= 90 ? 'bg-green-500' :
                  coreWebVitalsScore >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${coreWebVitalsScore}%` }}
              ></div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 gap-3">
            {coreWebVitals.map((metric, index) => (
              <MetricCard
                key={index}
                title={metric.title}
                value={metric.value}
                unit={metric.unit}
                threshold={metric.threshold}
              />
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <div className="text-xs text-gray-500 space-y-1">
              <div>Total Metrics: {metrics.length}</div>
              <div>Page: {window.location.pathname}</div>
              <div>Last Update: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;