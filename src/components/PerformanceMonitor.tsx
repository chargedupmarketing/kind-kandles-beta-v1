'use client';

import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  bundleSize?: number;
}

interface PerformanceMonitorProps {
  componentName: string;
  children: React.ReactNode;
  showMetrics?: boolean;
}

export default function PerformanceMonitor({ 
  componentName, 
  children, 
  showMetrics = process.env.NODE_ENV === 'development' 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [startTime] = useState(() => performance.now());

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Get memory usage if available
    const memoryUsage = (performance as any).memory?.usedJSHeapSize;

    setMetrics({
      renderTime: Math.round(renderTime * 100) / 100,
      componentCount: 1, // This could be enhanced to count child components
      memoryUsage: memoryUsage ? Math.round(memoryUsage / 1024 / 1024 * 100) / 100 : undefined
    });

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 Performance [${componentName}]:`, {
        renderTime: `${renderTime.toFixed(2)}ms`,
        memoryUsage: memoryUsage ? `${(memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'N/A'
      });
    }
  }, [componentName, startTime]);

  return (
    <>
      {children}
      {showMetrics && metrics && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white text-xs p-2 rounded-lg font-mono z-50">
          <div className="font-bold">{componentName}</div>
          <div>Render: {metrics.renderTime}ms</div>
          {metrics.memoryUsage && <div>Memory: {metrics.memoryUsage}MB</div>}
        </div>
      )}
    </>
  );
}
