import React, { useState } from 'react';
import {
  useDatabaseMonitoring,
  DatabaseUtils,
} from '@/hooks/useDatabaseMonitoring';
import { Card } from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';

interface DatabaseDashboardProps {
  isVisible?: boolean;
}

const DatabaseDashboard: React.FC<DatabaseDashboardProps> = ({
  isVisible = false,
}) => {
  const [isDashboardVisible, setIsDashboardVisible] = useState(isVisible);
  const {
    performanceMetrics,
    healthStatus,
    tableStats,
    isLoading,
    error,
    refreshHealthStatus,
    refreshTableStats,
    clearMetrics,
  } = useDatabaseMonitoring();

  // Don't show in production
  if (import.meta.env.PROD) return null;

  const queryStats = DatabaseUtils.getQueryStats(performanceMetrics);
  const healthSummary = DatabaseUtils.getHealthSummary(healthStatus);
  const performanceScore =
    DatabaseUtils.getPerformanceScore(performanceMetrics);
  const slowQueries = DatabaseUtils.getSlowQueries(performanceMetrics);

  return (
    <div className='fixed bottom-20 right-4 z-40'>
      {/* Toggle button */}
      <button
        onClick={() => setIsDashboardVisible(!isDashboardVisible)}
        className='mb-2 bg-purple-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-purple-700 transition-colors text-sm font-medium'
      >
        {isDashboardVisible ? 'Hide' : 'Show'} Database
      </button>

      {/* Dashboard panel */}
      {isDashboardVisible && (
        <div className='bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-96 max-h-96 overflow-y-auto'>
          <div className='flex items-center justify-between mb-4'>
            <h2 className='text-lg font-semibold text-gray-900'>
              Database Monitor
            </h2>
            <div className='flex items-center space-x-2'>
              <div className='w-2 h-2 bg-purple-500 rounded-full animate-pulse'></div>
              <span className='text-xs text-gray-500'>Live</span>
            </div>
          </div>

          {error && (
            <div className='mb-4 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700'>
              {error}
            </div>
          )}

          {/* Performance Score */}
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
              <span className='text-sm font-medium text-gray-700'>
                Performance Score
              </span>
              <span
                className={`text-lg font-bold ${
                  performanceScore >= 90
                    ? 'text-green-600'
                    : performanceScore >= 70
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {performanceScore}
              </span>
            </div>
            <div className='w-full bg-gray-200 rounded-full h-2'>
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  performanceScore >= 90
                    ? 'bg-green-500'
                    : performanceScore >= 70
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                }`}
                style={{ width: `${performanceScore}%` }}
              ></div>
            </div>
          </div>

          {/* Query Statistics */}
          <div className='mb-4'>
            <h3 className='text-sm font-medium text-gray-700 mb-2'>
              Query Statistics
            </h3>
            <div className='grid grid-cols-2 gap-2 text-xs'>
              <div className='bg-gray-50 p-2 rounded'>
                <div className='font-medium'>Total Queries</div>
                <div className='text-lg font-bold text-blue-600'>
                  {queryStats.totalQueries}
                </div>
              </div>
              <div className='bg-gray-50 p-2 rounded'>
                <div className='font-medium'>Success Rate</div>
                <div className='text-lg font-bold text-green-600'>
                  {queryStats.successRate.toFixed(1)}%
                </div>
              </div>
              <div className='bg-gray-50 p-2 rounded'>
                <div className='font-medium'>Avg Time</div>
                <div className='text-lg font-bold text-purple-600'>
                  {DatabaseUtils.formatExecutionTime(
                    queryStats.avgExecutionTime
                  )}
                </div>
              </div>
              <div className='bg-gray-50 p-2 rounded'>
                <div className='font-medium'>Slow Queries</div>
                <div
                  className={`text-lg font-bold ${
                    queryStats.slowQueries > 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {queryStats.slowQueries}
                </div>
              </div>
            </div>
          </div>

          {/* Health Status */}
          <div className='mb-4'>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-sm font-medium text-gray-700'>
                Database Health
              </h3>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  healthSummary.overallStatus === 'GOOD'
                    ? 'bg-green-100 text-green-800'
                    : healthSummary.overallStatus === 'OK'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {healthSummary.overallStatus}
              </span>
            </div>
            <div className='space-y-1'>
              {healthStatus.slice(0, 3).map((health, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between text-xs'
                >
                  <span className='truncate'>{health.metric}</span>
                  <span
                    className={`px-1 py-0.5 rounded text-xs ${
                      health.status === 'GOOD'
                        ? 'bg-green-100 text-green-800'
                        : health.status === 'OK'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {health.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Table Statistics */}
          {tableStats.length > 0 && (
            <div className='mb-4'>
              <h3 className='text-sm font-medium text-gray-700 mb-2'>
                Table Sizes
              </h3>
              <div className='space-y-1'>
                {tableStats.slice(0, 3).map((table, index) => (
                  <div
                    key={index}
                    className='flex items-center justify-between text-xs'
                  >
                    <span className='truncate'>{table.tableName}</span>
                    <span className='text-gray-500'>
                      {table.sizeMb.toFixed(1)} MB
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Slow Queries */}
          {slowQueries.length > 0 && (
            <div className='mb-4'>
              <h3 className='text-sm font-medium text-red-700 mb-2'>
                Slow Queries ({slowQueries.length})
              </h3>
              <div className='space-y-1'>
                {slowQueries.slice(0, 3).map((query, index) => (
                  <div key={index} className='text-xs bg-red-50 p-2 rounded'>
                    <div className='font-medium truncate'>
                      {query.queryName}
                    </div>
                    <div className='text-red-600'>
                      {DatabaseUtils.formatExecutionTime(query.executionTime)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={refreshHealthStatus}
              disabled={isLoading}
              variant='outline'
              className='text-xs h-8'
            >
              Refresh Health
            </Button>
            <Button
              onClick={refreshTableStats}
              disabled={isLoading}
              variant='outline'
              className='text-xs h-8'
            >
              Refresh Stats
            </Button>
            <Button
              onClick={clearMetrics}
              variant='outline'
              className='text-xs h-8'
            >
              Clear Metrics
            </Button>
          </div>

          {/* Additional Info */}
          <div className='mt-4 pt-3 border-t border-gray-200'>
            <div className='text-xs text-gray-500 space-y-1'>
              <div>Metrics: {performanceMetrics.length}/100</div>
              <div>Health Checks: {healthStatus.length}</div>
              <div>Tables: {tableStats.length}</div>
              <div>Last Update: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Database Health Status component for admin dashboard
export const DatabaseHealthStatus: React.FC = () => {
  const { healthStatus, isLoading, refreshHealthStatus } =
    useDatabaseMonitoring();
  const healthSummary = DatabaseUtils.getHealthSummary(healthStatus);

  return (
    <Card className='p-6'>
      <div className='flex items-center justify-between mb-4'>
        <h3 className='text-lg font-semibold'>Database Health</h3>
        <div className='flex items-center space-x-2'>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              healthSummary.overallStatus === 'GOOD'
                ? 'bg-green-100 text-green-800'
                : healthSummary.overallStatus === 'OK'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
            }`}
          >
            {healthSummary.overallStatus}
          </span>
          <Button
            onClick={refreshHealthStatus}
            disabled={isLoading}
            variant='outline'
            className='text-sm'
          >
            Refresh
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
        <div className='bg-green-50 p-3 rounded-lg'>
          <div className='text-sm font-medium text-green-800'>Good</div>
          <div className='text-2xl font-bold text-green-600'>
            {healthSummary.good}
          </div>
        </div>
        <div className='bg-yellow-50 p-3 rounded-lg'>
          <div className='text-sm font-medium text-yellow-800'>OK</div>
          <div className='text-2xl font-bold text-yellow-600'>
            {healthSummary.ok}
          </div>
        </div>
        <div className='bg-red-50 p-3 rounded-lg'>
          <div className='text-sm font-medium text-red-800'>Poor</div>
          <div className='text-2xl font-bold text-red-600'>
            {healthSummary.poor}
          </div>
        </div>
        <div className='bg-blue-50 p-3 rounded-lg'>
          <div className='text-sm font-medium text-blue-800'>Score</div>
          <div className='text-2xl font-bold text-blue-600'>
            {healthSummary.score}
          </div>
        </div>
      </div>

      <div className='space-y-3'>
        {healthStatus.map((health, index) => (
          <div
            key={index}
            className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
          >
            <div>
              <div className='font-medium'>{health.metric}</div>
              <div className='text-sm text-gray-600'>
                {health.recommendation}
              </div>
            </div>
            <div className='text-right'>
              <div className='font-medium'>{health.value}</div>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                  health.status === 'GOOD'
                    ? 'bg-green-100 text-green-800'
                    : health.status === 'OK'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}
              >
                {health.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default DatabaseDashboard;
