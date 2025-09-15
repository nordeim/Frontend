// src/components/Performance/PerformanceMonitor.tsx
/**
 * Performance Monitor Component
 * Real-time performance monitoring with Core Web Vitals, memory tracking,
 * and comprehensive performance analytics for mobile optimization
 * @module components/Performance/PerformanceMonitor
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { usePerformanceMonitor, PerformanceMetrics, PerformanceWarning } from '@/hooks/usePerformanceMonitor';
import { useResponsive } from '@/hooks/useResponsive';
import { clsx } from 'clsx';

/**
 * Performance monitor configuration
 */
export interface PerformanceMonitorConfig {
  enableCoreWebVitals: boolean;
  enableMemoryMonitoring: boolean;
  enableNetworkMonitoring: boolean;
  enableBatteryMonitoring: boolean;
  performanceBudgets: PerformanceBudgets;
  alertThresholds: AlertThresholds;
  updateInterval: number;
  historySize: number;
  enableExport: boolean;
  enableAlerts: boolean;
}

/**
 * Performance budgets configuration
 */
export interface PerformanceBudgets {
  lcp: number; // Largest Contentful Paint (ms)
  fid: number; // First Input Delay (ms)
  cls: number; // Cumulative Layout Shift
  fcp: number; // First Contentful Paint (ms)
  ttfb: number; // Time to First Byte (ms)
  memory: number; // Memory usage (MB)
  cpu: number; // CPU usage (%)
  network: number; // Network requests count
}

/**
 * Alert thresholds configuration
 */
export interface AlertThresholds {
  warning: number; // 0-1 scale
  critical: number; // 0-1 scale
}

/**
 * Performance data point
 */
export interface PerformanceDataPoint {
  timestamp: number;
  metrics: PerformanceMetrics;
  warnings: PerformanceWarning[];
  budgetStatus: BudgetStatus;
}

/**
 * Budget status for each metric
 */
export interface BudgetStatus {
  lcp: 'good' | 'needs-improvement' | 'poor';
  fid: 'good' | 'needs-improvement' | 'poor';
  cls: 'good' | 'needs-improvement' | 'poor';
  fcp: 'good' | 'needs-improvement' | 'poor';
  ttfb: 'good' | 'needs-improvement' | 'poor';
  memory: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Performance monitor props
 */
export interface PerformanceMonitorProps {
  config?: Partial<PerformanceMonitorConfig>;
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  theme?: 'light' | 'dark' | 'auto';
  showDetails?: boolean;
  showHistory?: boolean;
  showAlerts?: boolean;
  enableInteraction?: boolean;
  onPerformanceWarning?: (warning: PerformanceWarning) => void;
  onBudgetExceeded?: (metric: string, value: number, budget: number) => void;
}

/**
 * Performance monitor state
 */
export interface PerformanceMonitorState {
  isVisible: boolean;
  isMinimized: boolean;
  currentView: 'overview' | 'details' | 'history' | 'alerts';
  performanceData: PerformanceDataPoint[];
  currentMetrics: PerformanceMetrics;
  alerts: PerformanceWarning[];
  budgetStatus: BudgetStatus;
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
 * Performance Monitor Component
 * Provides comprehensive real-time performance monitoring and analytics
 * 
 * @example
 * ```tsx
 * const config: PerformanceMonitorConfig = {
 *   enableCoreWebVitals: true,
 *   enableMemoryMonitoring: true,
 *   performanceBudgets: {
 *     lcp: 2500,
 *     fid: 100,
 *     cls: 0.1,
 *   },
 *   alertThresholds: { warning: 0.7, critical: 0.9 },
 * };
 * 
 * <PerformanceMonitor 
 *   config={config}
 *   position="bottom-right"
 *   size="medium"
 *   showDetails={true}
 * />
 * ```
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  config = {},
  className,
  position = 'bottom-right',
  size = 'medium',
  theme = 'auto',
  showDetails = true,
  showHistory = true,
  showAlerts = true,
  enableInteraction = true,
  onPerformanceWarning,
  onBudgetExceeded,
}) => {
  const { isMobile } = useResponsive();
  const { performanceMetrics, startMonitoring, stopMonitoring, getWarnings } = usePerformanceMonitor();
  
  // Merge configuration with defaults
  const mergedConfig = useMemo<PerformanceMonitorConfig>(() => ({
    enableCoreWebVitals: true,
    enableMemoryMonitoring: true,
    enableNetworkMonitoring: true,
    enableBatteryMonitoring: true,
    performanceBudgets: {
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      fcp: 1800,
      ttfb: 800,
      memory: 100,
      cpu: 0.8,
      network: 50,
    },
    alertThresholds: { warning: 0.7, critical: 0.9 },
    updateInterval: 1000,
    historySize: 100,
    enableExport: true,
    enableAlerts: true,
    ...config,
  }), [config]);

  // State management
  const [monitorState, setMonitorState] = useState<PerformanceMonitorState>({
    isVisible: true,
    isMinimized: false,
    currentView: 'overview',
    performanceData: [],
    currentMetrics: performanceMetrics,
    alerts: [],
    budgetStatus: getBudgetStatus(performanceMetrics, mergedConfig.performanceBudgets),
  });

  // Refs for monitoring
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const historyRef = useRef<PerformanceDataPoint[]>([]);

  /**
   * Initialize performance monitoring
   */
  const initializeMonitoring = useCallback(() => {
    startMonitoring();
    
    // Setup periodic updates
    updateIntervalRef.current = setInterval(() => {
      updatePerformanceData();
    }, mergedConfig.updateInterval);
    
    // Initial data collection
    updatePerformanceData();
  }, [startMonitoring, mergedConfig.updateInterval]);

  /**
   * Update performance data
   */
  const updatePerformanceData = useCallback(() => {
    const currentTime = Date.now();
    const currentMetrics = performanceMetrics;
    const currentWarnings = getWarnings();
    const budgetStatus = getBudgetStatus(currentMetrics, mergedConfig.performanceBudgets);
    
    // Create data point
    const dataPoint: PerformanceDataPoint = {
      timestamp: currentTime,
      metrics: currentMetrics,
      warnings: currentWarnings,
      budgetStatus,
    };
    
    // Add to history
    historyRef.current.push(dataPoint);
    if (historyRef.current.length > mergedConfig.historySize) {
      historyRef.current.shift();
    }
    
    // Update state
    setMonitorState(prev => ({
      ...prev,
      currentMetrics,
      alerts: currentWarnings,
      budgetStatus,
      performanceData: [...historyRef.current],
    }));
    
    // Handle warnings
    if (currentWarnings.length > 0 && mergedConfig.enableAlerts) {
      currentWarnings.forEach(warning => {
        onPerformanceWarning?.(warning);
      });
    }
    
    // Check budget violations
    checkBudgetViolations(budgetStatus);
  }, [performanceMetrics, getWarnings, mergedConfig.performanceBudgets, mergedConfig.historySize, mergedConfig.enableAlerts, onPerformanceWarning]);

  /**
   * Get budget status for metrics
   */
  const getBudgetStatus = useCallback((metrics: PerformanceMetrics, budgets: PerformanceBudgets): BudgetStatus => {
    return {
      lcp: getMetricStatus(metrics.timing.lcp, budgets.lcp, CORE_WEB_VITALS_THRESHOLDS.lcp),
      fid: getMetricStatus(metrics.timing.fid, budgets.fid, CORE_WEB_VITALS_THRESHOLDS.fid),
      cls: getMetricStatus(metrics.layout.cls, budgets.cls, CORE_WEB_VITALS_THRESHOLDS.cls),
      fcp: getMetricStatus(metrics.timing.fcp, budgets.fcp, CORE_WEB_VITALS_THRESHOLDS.fcp),
      ttfb: getMetricStatus(metrics.timing.ttfb, budgets.ttfb, CORE_WEB_VITALS_THRESHOLDS.ttfb),
      memory: getMemoryStatus(metrics.memory.usedJSHeapSize, budgets.memory * 1024 * 1024),
    };
  }, []);

  /**
   * Get metric status based on thresholds
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
   * Check budget violations
   */
  const checkBudgetViolations = useCallback((budgetStatus: BudgetStatus) => {
    Object.entries(budgetStatus).forEach(([metric, status]) => {
      if (status === 'poor') {
        const value = getMetricValue(metric as keyof BudgetStatus);
        const budget = mergedConfig.performanceBudgets[metric as keyof PerformanceBudgets];
        
        onBudgetExceeded?.(metric, value, budget);
      }
    });
  }, [budgetStatus, mergedConfig.performanceBudgets, onBudgetExceeded]);

  /**
   * Get metric value from current metrics
   */
  const getMetricValue = (metric: keyof BudgetStatus): number => {
    switch (metric) {
      case 'lcp':
        return monitorState.currentMetrics.timing.lcp;
      case 'fid':
        return monitorState.currentMetrics.timing.fid;
      case 'cls':
        return monitorState.currentMetrics.layout.cls;
      case 'fcp':
        return monitorState.currentMetrics.timing.fcp;
      case 'ttfb':
        return monitorState.currentMetrics.timing.ttfb;
      case 'memory':
        return monitorState.currentMetrics.memory.usedJSHeapSize;
      default:
        return 0;
    }
  };

  /**
   * Export performance data
   */
  const exportData = useCallback(() => {
    const data = {
      config: mergedConfig,
      history: monitorState.performanceData,
      currentMetrics: monitorState.currentMetrics,
      exportTime: Date.now(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mergedConfig, monitorState]);

  /**
   * Render overview panel
   */
  const renderOverview = useCallback(() => {
    const { currentMetrics, budgetStatus } = monitorState;
    
    return (
      <div className="space-y-4">
        {/* Core Web Vitals */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="LCP"
            value={currentMetrics.time}
