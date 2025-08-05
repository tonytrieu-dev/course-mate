/**
 * Performance Monitoring Utility
 * 
 * Tracks Core Web Vitals and application performance metrics
 * Integrates with Sentry for production monitoring
 */

import { onCLS, onINP, onFCP, onLCP, onTTFB, type Metric } from 'web-vitals';
import { captureMessage, addSentryBreadcrumb, measurePerformance } from '../config/sentry';
import { logger } from './logger';

interface PerformanceMetrics {
  CLS: number | null; // Cumulative Layout Shift
  INP: number | null; // Interaction to Next Paint (replaces FID)
  FCP: number | null; // First Contentful Paint
  LCP: number | null; // Largest Contentful Paint
  TTFB: number | null; // Time to First Byte
}

interface PerformanceThresholds {
  CLS: { good: number; needsImprovement: number };
  INP: { good: number; needsImprovement: number };
  FCP: { good: number; needsImprovement: number };
  LCP: { good: number; needsImprovement: number };
  TTFB: { good: number; needsImprovement: number };
}

// Performance thresholds based on Google's Core Web Vitals
const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  CLS: { good: 0.1, needsImprovement: 0.25 },
  INP: { good: 200, needsImprovement: 500 }, // INP replaces FID with different thresholds
  FCP: { good: 1800, needsImprovement: 3000 },
  LCP: { good: 2500, needsImprovement: 4000 },
  TTFB: { good: 800, needsImprovement: 1800 }
};

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    CLS: null,
    INP: null,
    FCP: null,
    LCP: null,
    TTFB: null
  };

  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (this.isInitialized || typeof window === 'undefined') {
      return;
    }

    try {
      // Collect Core Web Vitals
      this.collectCoreWebVitals();
      
      // Monitor resource loading
      this.monitorResources();
      
      // Monitor navigation timing
      this.monitorNavigation();
      
      this.isInitialized = true;
      logger.info('Performance monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Collect Core Web Vitals metrics
   */
  private collectCoreWebVitals(): void {
    const reportMetric = (metric: Metric) => {
      this.metrics[metric.name as keyof PerformanceMetrics] = metric.value;
      
      const rating = this.getRating(metric.name as keyof PerformanceMetrics, metric.value);
      
      logger.debug(`Core Web Vital: ${metric.name}`, {
        value: metric.value,
        rating,
        id: metric.id,
        navigationType: metric.navigationType
      });

      // Send to Sentry if performance is poor
      if (rating === 'poor' && process.env.NODE_ENV === 'production') {
        captureMessage(
          `Poor Core Web Vital: ${metric.name} = ${metric.value}`,
          'warning',
          {
            metricName: metric.name,
            value: metric.value,
            rating,
            navigationType: metric.navigationType
          }
        );
      }

      // Add breadcrumb for context
      addSentryBreadcrumb(
        `${metric.name}: ${metric.value} (${rating})`,
        'navigation',
        { value: metric.value, rating }
      );
    };

    // Collect all Core Web Vitals
    onCLS(reportMetric);
    onINP(reportMetric);
    onFCP(reportMetric);
    onLCP(reportMetric);
    onTTFB(reportMetric);
  }

  /**
   * Monitor resource loading performance
   */
  private monitorResources(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          
          // Flag slow resources
          if (resourceEntry.duration > 2000) {
            logger.warn('Slow resource detected:', {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              transferSize: resourceEntry.transferSize,
              encodedBodySize: resourceEntry.encodedBodySize
            });

            if (process.env.NODE_ENV === 'production') {
              captureMessage(
                `Slow resource loading: ${resourceEntry.name}`,
                'warning',
                {
                  duration: resourceEntry.duration,
                  transferSize: resourceEntry.transferSize,
                  resourceType: this.getResourceType(resourceEntry.name)
                }
              );
            }
          }
        }
      }
    });

    observer.observe({ entryTypes: ['resource'] });
    this.observers.push(observer);
  }

  /**
   * Monitor navigation timing
   */
  private monitorNavigation(): void {
    if (!('PerformanceObserver' in window)) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          const timings = {
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
            domComplete: navEntry.domComplete - navEntry.startTime,
            loadComplete: navEntry.loadEventEnd - navEntry.startTime,
            firstPaint: this.getFirstPaint(),
            firstContentfulPaint: this.getFirstContentfulPaint()
          };

          logger.info('Navigation timing:', timings);

          // Alert on slow page loads
          if (timings.loadComplete > 5000) {
            logger.warn('Slow page load detected:', timings);
            
            if (process.env.NODE_ENV === 'production') {
              captureMessage(
                'Slow page load performance',
                'warning',
                timings
              );
            }
          }
        }
      }
    });

    observer.observe({ entryTypes: ['navigation'] });
    this.observers.push(observer);
  }

  /**
   * Get performance rating for a metric
   */
  private getRating(metricName: keyof PerformanceMetrics, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = PERFORMANCE_THRESHOLDS[metricName];
    
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  /**
   * Get resource type from URL
   */
  private getResourceType(url: string): string {
    if (url.includes('.js')) return 'script';
    if (url.includes('.css')) return 'stylesheet';
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)/)) return 'image';
    if (url.includes('.woff') || url.includes('.ttf')) return 'font';
    return 'other';
  }

  /**
   * Get First Paint timing
   */
  private getFirstPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
    return firstPaint ? firstPaint.startTime : null;
  }

  /**
   * Get First Contentful Paint timing
   */
  private getFirstContentfulPaint(): number | null {
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    return fcp ? fcp.startTime : null;
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    overallRating: 'good' | 'needs-improvement' | 'poor';
    metrics: PerformanceMetrics;
    ratings: Record<keyof PerformanceMetrics, string>;
  } {
    const ratings: Record<keyof PerformanceMetrics, string> = {} as any;
    let poorCount = 0;
    let needsImprovementCount = 0;

    for (const [key, value] of Object.entries(this.metrics)) {
      if (value !== null) {
        const rating = this.getRating(key as keyof PerformanceMetrics, value);
        ratings[key as keyof PerformanceMetrics] = rating;
        
        if (rating === 'poor') poorCount++;
        else if (rating === 'needs-improvement') needsImprovementCount++;
      }
    }

    const overallRating = poorCount > 0 ? 'poor' : 
                         needsImprovementCount > 0 ? 'needs-improvement' : 'good';

    return {
      overallRating,
      metrics: this.metrics,
      ratings
    };
  }

  /**
   * Measure component render performance
   */
  async measureComponentRender<T>(
    componentName: string,
    renderFunction: () => Promise<T>
  ): Promise<T> {
    return measurePerformance(
      `component:${componentName}`,
      renderFunction,
      { component: componentName }
    );
  }

  /**
   * Measure API call performance
   */
  async measureApiCall<T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    return measurePerformance(
      `api:${endpoint}`,
      apiCall,
      { endpoint }
    );
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.isInitialized = false;
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  // Wait for page load to avoid interfering with startup
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      performanceMonitor.init();
    });
  } else {
    performanceMonitor.init();
  }
}

export default performanceMonitor;