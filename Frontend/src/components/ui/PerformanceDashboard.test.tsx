import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import PerformanceDashboard from './PerformanceDashboard';

// Mock the performance monitoring hook
vi.mock('@/hooks/usePerformance', () => ({
  usePerformanceMonitoring: () => ({
    coreWebVitalsScore: 85,
    metrics: [
      {
        metric: 'LCP',
        value: 2200,
        id: 'lcp-1',
        timestamp: Date.now(),
        url: 'http://localhost:3000',
        userAgent: 'test-agent',
      },
      {
        metric: 'FID',
        value: 50,
        id: 'fid-1',
        timestamp: Date.now(),
        url: 'http://localhost:3000',
        userAgent: 'test-agent',
      },
    ],
    isLoading: false,
  }),
}));

// Mock import.meta.env
vi.stubGlobal('import', {
  meta: {
    env: {
      DEV: true,
      PROD: false,
    },
  },
});

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders performance dashboard in development mode', () => {
    render(<PerformanceDashboard />);

    expect(screen.getByText('Show Performance')).toBeInTheDocument();
  });

  it('does not render in production mode', () => {
    vi.stubGlobal('import', {
      meta: {
        env: {
          DEV: false,
          PROD: true,
        },
      },
    });

    const { container } = render(<PerformanceDashboard />);
    expect(container.firstChild).toBeNull();
  });

  it('shows dashboard when toggle button is clicked', async () => {
    const { user } = render(<PerformanceDashboard />);

    const toggleButton = screen.getByText('Show Performance');
    await user.click(toggleButton);

    expect(screen.getByText('Performance Monitor')).toBeInTheDocument();
    expect(screen.getByText('Core Web Vitals Score')).toBeInTheDocument();
  });

  it('displays performance metrics correctly', async () => {
    const { user } = render(<PerformanceDashboard />);

    const toggleButton = screen.getByText('Show Performance');
    await user.click(toggleButton);

    expect(screen.getByText('Largest Contentful Paint')).toBeInTheDocument();
    expect(screen.getByText('First Input Delay')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument(); // Core Web Vitals Score
  });
});
