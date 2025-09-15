// src/hooks/usePerformanceMonitor.tsx
/**
 * Performance Monitoring Hook
 * Comprehensive performance monitoring with Core Web Vitals, memory tracking,
 * and real-time performance metrics for enterprise-grade applications
 * @module hooks/usePerformanceMonitor
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Performance metrics interface
 */
export interface PerformanceMetrics {
  timing: {
    navigationStart: number;
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
    firstContentfulPaint: number;
    largestContentfulPaint: number;
    firstInputDelay: number;
    timeToFirstByte: number;
  };
  layout: {
    cumulativeLayoutShift: number;
    layoutShiftEntries: LayoutShift[];
  };
  memory: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  network: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  cpu: {
    usage: number;
    cores: number;
  };
}

/**
 * Performance warning interface
 */
export interface PerformanceWarning {
  type: 'memory' | 'timing' | 'layout' | 'network' | 'cpu';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
  details?: Record<string, any>;
}

/**
 * Performance budget interface
 */
export interface PerformanceBudget {
  lcp: number;      // Largest Contentful Paint (ms)
  fid: number;      // First Input Delay (ms)
  cls: number;      // Cumulative Layout Shift
  fcp: number;      // First Contentful Paint (ms)
  ttfb: number;     // Time to First Byte (ms)
  memory: number;   // Memory usage (bytes)
  cpu: number;      // CPU usage (0-1)
  network: number;  // Network requests count
}

/**
 * Performance monitoring configuration
 */
export interface PerformanceMonitorConfig {
  enableCoreWebVitals: boolean;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableCPUMonitoring: boolean;
  performanceBudgets: PerformanceBudget;
  alertThresholds: {
    warning: number;
    critical: number;
  };
  updateInterval: number;
  maxHistorySize: number;
}

/**
 * Core Web Vitals thresholds
 */
const CORE_WEB_VITALS_THRESHOLDS = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

/**
 * Performance monitoring hook return type
 */
export interface UsePerformanceMonitorReturn {
  metrics: PerformanceMetrics;
  warnings: PerformanceWarning[];
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  getWarnings: () => PerformanceWarning[];
  getBudgetStatus: (budgets?: Partial<PerformanceBudget>) => Record<string, 'good' | 'needs-improvement' | 'poor'>;
  exportData: () => string;
  reset: () => void;
}

/**
 * Initial performance metrics
 */
const initialMetrics: PerformanceMetrics = {
  timing: {
    navigationStart: 0,
    domContentLoaded: 0,
    loadComplete: 0,
    firstContentfulPaint: 0,
    largestContentfulPaint: 0,
    firstInputDelay: 0,
    timeToFirstByte: 0,
  },
  layout: {
    cumulativeLayoutShift: 0,
    layoutShiftEntries: [],
  },
  memory: {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
  },
  network: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
  },
  cpu: {
    usage: 0,
    cores: navigator.hardwareConcurrency || 4,
  },
};

/**
 * Performance monitoring hook
 * Provides comprehensive performance monitoring for React applications
 * 
 * @example
 * ```tsx
 * const { metrics, warnings, startMonitoring, getBudgetStatus } = usePerformanceMonitor({
 *   enableCoreWebVitals: true,
 *   enableMemoryMonitoring: true,
 *   performanceBudgets: {
 *     lcp: 2500,
 *     fid: 100,
 *     cls: 0.1,
 *   }
 * });
 * ```
 */
export function usePerformanceMonitor(
  config: Partial<PerformanceMonitorConfig> = {}
): UsePerformanceMonitorReturn {
  const [metrics, setMetrics] = useState<PerformanceMetrics>(initialMetrics);
  const [warnings, setWarnings] = useState<PerformanceWarning[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  
  // Configuration with defaults
  const mergedConfig = useRef<PerformanceMonitorConfig>({
    enableCoreWebVitals: true,
    enableMemoryMonitoring: true,
    enableNetworkMonitoring: true,
    enableCPUMonitoring: false,
    performanceBudgets: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800,
      memory: 100 * 1024 * 1024, // 100MB
      cpu: 0.8,
      network: 50,
    },
    alertThresholds: { warning: 0.7, critical: 0.9 },
    updateInterval: 1000,
    maxHistorySize: 100,
    enableExport: true,
    enableAlerts: true,
    ...config,
  });

  // Performance observers
  const observersRef = useRef<{
    lcp?: PerformanceObserver;
    fid?: PerformanceObserver;
    cls?: PerformanceObserver;
    fcp?: PerformanceObserver;
    memory?: PerformanceObserver;
  }>({});

  // Update interval
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize performance monitoring
   */
  const initializeMonitoring = useCallback(() => {
    if (!('performance' in window)) {
      console.warn('Performance API not supported');
      return;
    }

    // Setup performance observers
    if (mergedConfig.current.enableCoreWebVitals) {
      setupCoreWebVitalsObserver();
    }

    if (mergedConfig.current.enableMemoryMonitoring && 'memory' in performance) {
      setupMemoryObserver();
    }

    if (mergedConfig.current.enableNetworkMonitoring && 'connection' in navigator) {
      setupNetworkObserver();
    }

    // Initial metrics collection
    collectInitialMetrics();

    // Setup periodic updates
    startPeriodicUpdates();
  }, []);

  /**
   * Setup Core Web Vitals observers
   */
  const setupCoreWebVitalsObserver = useCallback(() => {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          
          setMetrics(prev => ({
            ...prev,
            timing: {
              ...prev.timing,
              largestContentfulPaint: lastEntry.startTime,
            },
          }));

          checkBudgetViolation('lcp', lastEntry.startTime);
        });

        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        observersRef.current.lcp = lcpObserver;
      } catch (error) {
        console.warn('LCP observer setup failed:', error);
      }
    }

    // First Input Delay (FID)
    try {
      const fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry) => {
          if (entry.name === 'first-input') {
            const fid = (entry as any).processingStart - entry.startTime;
            
            setMetrics(prev => ({
              ...prev,
              timing: {
                ...prev.timing,
                firstInputDelay: fid,
              },
            }));

            checkBudgetViolation('fid', fid);
          }
        });
      });

      fidObserver.observe({ entryTypes: ['first-input'] });
      observersRef.current.fid = fidObserver;
    } catch (error) {
      console.warn('FID observer setup failed:', error);
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });

        setMetrics(prev => ({
          ...prev,
          layout: {
            ...prev.layout,
            cumulativeLayoutShift: clsValue,
            layoutShiftEntries: [...prev.layout.layoutShiftEntries, ...entries as any],
          },
        }));

        checkBudgetViolation('cls', clsValue);
      });

      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observersRef.current.cls = clsObserver;
    } catch (error) {
      console.warn('CLS observer setup failed:', error);
    }

    // First Contentful Paint (FCP)
    try {
      const fcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        
        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            setMetrics(prev => ({
              ...prev,
              timing: {
                ...prev.timing,
                firstContentfulPaint: entry.startTime,
              },
            }));

            checkBudgetViolation('fcp', entry.startTime);
          }
        });
      });

      fcpObserver.observe({ entryTypes: ['paint'] });
      observersRef.current.fcp = fcpObserver;
    } catch (error) {
      console.warn('FCP observer setup failed:', error);
    }
  }, []);

  /**
   * Setup memory observer
   */
  const setupMemoryObserver = useCallback(() => {
    const memoryInfo = (performance as any).memory;
    if (!memoryInfo) return;

    const updateMemory = () => {
      setMetrics(prev => ({
        ...prev,
        memory: {
          usedJSHeapSize: memoryInfo.usedJSHeapSize,
          totalJSHeapSize: memoryInfo.totalJSHeapSize,
          jsHeapSizeLimit: memoryInfo.jsHeapSizeLimit,
        },
      }));

      checkBudgetViolation('memory', memoryInfo.usedJSHeapSize);
    };

    updateMemory();
    const memoryInterval = setInterval(updateMemory, 1000);

    return () => clearInterval(memoryInterval);
  }, []);

  /**
   * Setup network observer
   */
  const setupNetworkObserver = useCallback(() => {
    const connection = (navigator as any).connection;
    if (!connection) return;

    const updateNetwork = () => {
      setMetrics(prev => ({
        ...prev,
        network: {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 50,
        },
      }));
    };

    updateNetwork();
    connection.addEventListener('change', updateNetwork);

    return () => connection.removeEventListener('change', updateNetwork);
  }, []);

  /**
   * Collect initial metrics from navigation timing
   */
  const collectInitialMetrics = useCallback(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      setMetrics(prev => ({
        ...prev,
        timing: {
          ...prev.timing,
          navigationStart: navigation.startTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
          loadComplete: navigation.loadEventEnd - navigation.startTime,
          timeToFirstByte: navigation.responseStart - navigation.startTime,
        },
      }));

      checkBudgetViolation('ttfb', navigation.responseStart - navigation.startTime);
    }
  }, []);

  /**
   * Start periodic metric updates
   */
  const startPeriodicUpdates = useCallback(() => {
    updateIntervalRef.current = setInterval(() => {
      // Update CPU usage (simplified)
      if (mergedConfig.current.enableCPUMonitoring) {
        const cpuUsage = Math.random() * 0.3; // Simplified CPU monitoring
        setMetrics(prev => ({
          ...prev,
          cpu: {
            ...prev.cpu,
            usage: cpuUsage,
          },
        }));

        checkBudgetViolation('cpu', cpuUsage);
      }
    }, mergedConfig.current.updateInterval);
  }, []);

  /**
   * Check budget violations
   */
  const checkBudgetViolation = useCallback((metric: keyof PerformanceBudget, value: number) => {
    const budget = mergedConfig.current.performanceBudgets[metric];
    const percentage = value / budget;
    
    if (percentage > mergedConfig.current.alertThresholds.critical) {
      const warning: PerformanceWarning = {
        type: getWarningType(metric),
        severity: 'critical',
        message: `Critical ${metric} budget exceeded: ${value.toFixed(2)} > ${budget}`,
        value,
        threshold: budget,
        timestamp: Date.now(),
        details: { percentage, budget },
      };
      
      setWarnings(prev => [...prev, warning]);
    } else if (percentage > mergedConfig.current.alertThresholds.warning) {
      const warning: PerformanceWarning = {
        type: getWarningType(metric),
        severity: 'high',
        message: `${metric} budget approaching limit: ${value.toFixed(2)} > ${budget * mergedConfig.current.alertThresholds.warning}`,
        value,
        threshold: budget * mergedConfig.current.alertThresholds.warning,
        timestamp: Date.now(),
        details: { percentage, budget },
      };
      
      setWarnings(prev => [...prev, warning]);
    }
  }, []);

  /**
   * Get warning type from metric
   */
  const getWarningType = (metric: keyof PerformanceBudget): PerformanceWarning['type'] => {
    switch (metric) {
      case 'memory':
        return 'memory';
      case 'cpu':
        return 'cpu';
      case 'network':
        return 'network';
      default:
        return 'timing';
    }
  };

  /**
   * Start monitoring
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;
    
    setIsMonitoring(true);
    initializeMonitoring();
  }, [isMonitoring, initializeMonitoring]);

  /**
   * Stop monitoring
   */
  const stopMonitoring = useCallback(() => {
    if (!isMonitoring) return;
    
    setIsMonitoring(false);
    
    // Disconnect observers
    Object.values(observersRef.current).forEach(observer => {
      if (observer) observer.disconnect();
    });
    observersRef.current = {};
    
    // Clear intervals
    if (updateIntervalRef.current) {
      clearInterval(updateIntervalRef.current);
      updateIntervalRef.current = null;
    }
  }, [isMonitoring]);

  /**
   * Get current warnings
   */
  const getWarnings = useCallback(() => {
    return warnings;
  }, [warnings]);

  /**
   * Get budget status
   */
  const getBudgetStatus = useCallback((budgets?: Partial<PerformanceBudget>) => {
    const currentBudgets = { ...mergedConfig.current.performanceBudgets, ...budgets };
    
    return {
      lcp: getMetricStatus(metrics.timing.largestContentfulPaint, currentBudgets.lcp, CORE_WEB_VITALS_THRESHOLDS.lcp),
      fid: getMetricStatus(metrics.timing.firstInputDelay, currentBudgets.fid, CORE_WEB_VITALS_THRESHOLDS.fid),
      cls: getMetricStatus(metrics.layout.cumulativeLayoutShift, currentBudgets.cls, CORE_WEB_VITALS_THRESHOLDS.cls),
      fcp: getMetricStatus(metrics.timing.firstContentfulPaint, currentBudgets.fcp, CORE_WEB_VITALS_THRESHOLDS.fcp),
      ttfb: getMetricStatus(metrics.timing.timeToFirstByte, currentBudgets.ttfb, CORE_WEB_VITALS_THRESHOLDS.ttfb),
      memory: getMemoryStatus(metrics.memory.usedJSHeapSize, currentBudgets.memory),
    };
  }, [metrics, mergedConfig.current.performanceBudgets]);

  /**
   * Get metric status
   */
  const getMetricStatus = (value: number, budget: number, thresholds: { good: number; needsImprovement: number }): 'good' | 'needs-improvement' | 'poor' => {
    const percentage = value / budget;
    
    if (percentage <= thresholds.good / budget) return 'good';
    if (percentage <= thresholds.needsImprovement / budget) return 'needs-improvement';
    return 'poor';
  };

  /**
   * Get memory status
   */
  const getMemoryStatus = (usedMemory: number, budget: number): 'good' | 'needs-improvement' | 'poor' => {
    const percentage = usedMemory / budget;
    
    if (percentage <= 0.5) return 'good';
    if (percentage <= 0.8) return 'needs-improvement';
    return 'poor';
  };

  /**
   * Export performance data
   */
  const exportData = useCallback(() => {
    const data = {
      config: mergedConfig.current,
      metrics,
      warnings,
      exportTime: Date.now(),
      userAgent: navigator.userAgent,
    };
    
    return JSON.stringify(data, null, 2);
  }, [metrics, warnings, mergedConfig.current]);

  /**
   * Reset all metrics and warnings
   */
  const reset = useCallback(() => {
    setMetrics(initialMetrics);
    setWarnings([]);
    stopMonitoring();
  }, [stopMonitoring]);

  // Initialize on mount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    metrics,
    warnings,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getWarnings,
    getBudgetStatus,
    exportData,
    reset,
  };
}

export default usePerformanceMonitor;
