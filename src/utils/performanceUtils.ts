// src/utils/performanceUtils.ts
/**
 * Performance Utilities
 * Comprehensive performance utility functions for Core Web Vitals,
 * memory management, and performance optimization
 * @module utils/performanceUtils
 */

import { PerformanceMetrics, PerformanceBudget } from '@/types/performance';

/**
 * Calculate Core Web Vitals score
 */
export function calculateCoreWebVitalsScore(metrics: {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
}): number {
  const weights = { lcp: 0.25, fid: 0.25, cls: 0.25, fcp: 0.15, ttfb: 0.1 };
  
  const lcpScore = Math.max(0, 1 - (metrics.lcp - 2500) / 4000);
  const fidScore = Math.max(0, 1 - (metrics.fid - 100) / 300);
  const clsScore = Math.max(0, 1 - (metrics.cls - 0.1) / 0.25);
  const fcpScore = Math.max(0, 1 - (metrics.fcp - 1800) / 3000);
  const ttfbScore = Math.max(0, 1 - (metrics.ttfb - 800) / 1800);
  
  return (
    lcpScore * weights.lcp +
    fidScore * weights.fid +
    clsScore * weights.cls +
    fcpScore * weights.fcp +
    ttfbScore * weights.ttff
  );
}

/**
 * Format performance metrics for display
 */
export function formatPerformanceMetrics(metrics: PerformanceMetrics): Record<string, string> {
  return {
    'LCP': `${metrics.timing.largestContentfulPaint.toFixed(0)}ms`,
    'FID': `${metrics.timing.firstInputDelay.toFixed(0)}ms`,
    'CLS': metrics.layout.cumulativeLayoutShift.toFixed(3),
    'FCP': `${metrics.timing.firstContentfulPaint.toFixed(0)}ms`,
    'TTFB': `${metrics.timing.timeToFirstByte.toFixed(0)}ms`,
    'Memory': formatBytes(metrics.memory.usedJSHeapSize),
    'Network': metrics.network.effectiveType.toUpperCase(),
  };
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Check if performance budget is exceeded
 */
export function isBudgetExceeded(
  metrics: Partial<PerformanceMetrics['timing'] & PerformanceMetrics['layout'] & PerformanceMetrics['memory']>,
  budgets: PerformanceBudget
): Record<string, boolean> {
  const exceeded: Record<string, boolean> = {};
  
  if (metrics.largestContentfulPaint !== undefined) {
    exceeded.lcp = metrics.largestContentfulPaint > budgets.lcp;
  }
  
  if (metrics.firstInputDelay !== undefined) {
    exceeded.fid = metrics.firstInputDelay > budgets.fid;
  }
  
  if (metrics.cumulativeLayoutShift !== undefined) {
    exceeded.cls = metrics.cumulativeLayoutShift > budgets.cls;
  }
  
  if (metrics.firstContentfulPaint !== undefined) {
    exceeded.fcp = metrics.firstContentfulPaint > budgets.fcp;
  }
  
  if (metrics.timeToFirstByte !== undefined) {
    exceeded.ttfb = metrics.timeToFirstByte > budgets.ttfb;
  }
  
  if (metrics.usedJSHeapSize !== undefined) {
    exceeded.memory = metrics.usedJSHeapSize > budgets.memory;
  }
  
  return exceeded;
}

/**
 * Detect memory leaks
 */
export function detectMemoryLeak(
  currentMemory: number,
  baselineMemory: number,
  threshold: number = 1.5
): { isLeak: boolean; severity: 'low' | 'medium' | 'high' } {
  const ratio = currentMemory / baselineMemory;
  
  if (ratio > threshold * 2) {
    return { isLeak: true, severity: 'high' };
  } else if (ratio > threshold) {
    return { isLeak: true, severity: 'medium' };
  } else if (ratio > threshold * 0.8) {
    return { isLeak: true, severity: 'low' };
  }
  
  return { isLeak: false, severity: 'low' };
}

/**
 * Optimize image loading
 */
export function optimizeImageLoading(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'jpg';
    crop?: string;
  } = {}
): string {
  const params = new URLSearchParams();
  
  if (options.width) params.set('w', options.width.toString());
  if (options.height) params.set('h', options.height.toString());
  if (options.quality) params.set('q', options.quality.toString());
  if (options.format) params.set('f', options.format);
  if (options.crop) params.set('crop', options.crop);
  
  const queryString = params.toString();
  return queryString ? `${src}?${queryString}` : src;
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number,
  immediate = false
): T & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;
  
  const debounced = function (this: any, ...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func.apply(this, args);
    };
    
    const callNow = immediate && !timeout;
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    
    if (callNow) func.apply(this, args);
  } as T & { cancel: () => void };
  
  debounced.cancel = () => {
    if (timeout) clearTimeout(timeout);
    timeout = null;
  };
  
  return debounced;
}

/**
 * Throttle function for performance optimization
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  limit: number
): T & { cancel: () => void } {
  let inThrottle = false;
  let lastArgs: Parameters<T> | null = null;
  
  const throttled = function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastArgs) {
          func.apply(this, lastArgs);
          lastArgs = null;
        }
      }, limit);
    } else {
      lastArgs = args;
    }
  } as T & { cancel: () => void };
  
  throttled.cancel = () => {
    inThrottle = false;
    lastArgs = null;
  };
  
  return throttled;
}

/**
 * Measure function execution time
 */
export function measurePerformance<T>(
  name: string,
  fn: () => T,
  reportThreshold: number = 16 // 1 frame at 60fps
): T {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  const duration = end - start;
  
  if (duration > reportThreshold) {
    console.warn(`Slow operation: ${name} took ${duration.toFixed(2)}ms`);
    
    // Report to analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', 'performance_slow_operation', {
        operation_name: name,
        duration: Math.round(duration),
      });
    }
  }
  
  return result;
}

/**
 * Create performance observer
 */
export function createPerformanceObserver(
  entryTypes: string[],
  callback: (entries: PerformanceEntry[]) => void
): PerformanceObserver | null {
  if (!('PerformanceObserver' in window)) {
    console.warn('PerformanceObserver not supported');
    return null;
  }
  
  try {
    const observer = new PerformanceObserver((list) => {
      callback(list.getEntries());
    });
    
    observer.observe({ entryTypes });
    return observer;
  } catch (error) {
    console.warn('Failed to create performance observer:', error);
    return null;
  }
}

/**
 * Get device performance characteristics
 */
export function getDevicePerformanceCharacteristics(): {
  hardwareConcurrency: number;
  deviceMemory?: number;
  isLowEndDevice: boolean;
} {
  const hardwareConcurrency = navigator.hardwareConcurrency || 1;
  const deviceMemory = (navigator as any).deviceMemory;
  
  // Consider device low-end if:
  // - Less than 4 CPU cores
  // - Less than 4GB RAM (if available)
  // - Slow connection
  const isLowEndDevice = 
    hardwareConcurrency < 4 ||
    (deviceMemory && deviceMemory < 4) ||
    ((navigator as any).connection?.effectiveType === '2g' || (navigator as any).connection?.effectiveType === 'slow-2g');
  
  return {
    hardwareConcurrency,
    deviceMemory,
    isLowEndDevice,
  };
}

/**
 * Optimize for low-end devices
 */
export function optimizeForLowEndDevice(
  optimizations: {
    reduceAnimations?: boolean;
    reduceImageQuality?: boolean;
    disableNonCriticalFeatures?: boolean;
    reduceConcurrency?: boolean;
  }
): void {
  const { isLowEndDevice } = getDevicePerformanceCharacteristics();
  
  if (!isLowEndDevice) return;
  
  if (optimizations.reduceAnimations) {
    document.documentElement.style.setProperty('--animation-duration', '0.1s');
    document.documentElement.classList.add('reduce-animations');
  }
  
  if (optimizations.reduceImageQuality) {
    document.documentElement.style.setProperty('--image-quality', '0.7');
  }
  
  if (optimizations.disableNonCriticalFeatures) {
    document.documentElement.classList.add('low-performance-mode');
  }
  
  if (optimizations.reduceConcurrency) {
    // Reduce concurrent operations
    document.documentElement.style.setProperty('--max-concurrent', '2');
  }
}

export default {
  calculateCoreWebVitalsScore,
  formatPerformanceMetrics,
  formatBytes,
  isBudgetExceeded,
  detectMemoryLeak,
  optimizeImageLoading,
  debounce,
  throttle,
  measurePerformance,
  createPerformanceObserver,
  getDevicePerformanceCharacteristics,
  optimizeForLowEndDevice,
};
