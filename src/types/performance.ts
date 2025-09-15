// src/types/performance.ts
/**
 * Performance Type Definitions
 * Comprehensive TypeScript definitions for performance monitoring,
 * Core Web Vitals, and optimization utilities
 * @module types/performance
 */

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
 * Layout shift entry
 */
export interface LayoutShift {
  value: number;
  startTime: number;
  hadRecentInput: boolean;
  sources?: any[];
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
  enableExport: boolean;
  enableAlerts: boolean;
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
 * Core Web Vitals thresholds
 */
export interface CoreWebVitalsThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

/**
 * Image preload configuration
 */
export interface ImagePreloadConfig {
  concurrency: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableWebP: boolean;
  enableAVIF: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  crossOrigin?: 'anonymous' | 'use-credentials';
}

/**
 * Image preload state
 */
export interface ImagePreloadState {
  isLoaded: boolean;
  isLoading: boolean;
  isError: boolean;
  loadProgress: number;
  loadTime: number;
  retryCount: number;
  error?: Error;
}

/**
 * Image preload item
 */
export interface ImagePreloadItem {
  id: string;
  src: string;
  webpSrc?: string;
  avifSrc?: string;
  fallbackSrc: string;
  alt: string;
  config?: Partial<ImagePreloadConfig>;
  state: ImagePreloadState;
  callbacks?: {
    onLoad?: (img: HTMLImageElement) => void;
    onError?: (error: Error) => void;
    onProgress?: (progress: number) => void;
  };
}

/**
 * Intersection observer configuration
 */
export interface IntersectionObserverConfig {
  threshold?: number | number[];
  rootMargin?: string;
  root?: Element | null;
  enabled?: boolean;
  trackVisibility?: boolean;
  delay?: number;
  once?: boolean;
}

/**
 * Enhanced intersection observer entry
 */
export interface EnhancedIntersectionObserverEntry extends IntersectionObserverEntry {
  visibilityRatio: number;
  isFullyVisible: boolean;
  isPartiallyVisible: boolean;
  viewportPosition: 'above' | 'below' | 'left' | 'right' | 'inside';
}

/**
 * Resource loading queue item
 */
export interface ResourceQueueItem {
  id: string;
  type: 'image' | 'script' | 'style' | 'font' | 'data';
  priority: 'low' | 'medium' | 'high' | 'critical';
  url: string;
  loadCallback: () => void;
  errorCallback?: (error: Error) => void;
}

/**
 * Viewport optimization configuration
 */
export interface ViewportOptimizationConfig {
  enableMemoryOptimization: boolean;
  maxMemoryUsageMB: number;
  garbageCollectionInterval: number;
  enableResourceOptimization: boolean;
  maxConcurrentRequests: number;
  resourceLoadingDelay: number;
  enableViewportOptimization: boolean;
  preloadOffscreenContent: boolean;
  unloadInvisibleContent: boolean;
  viewportBuffer: number;
  enableMobileOptimizations: boolean;
  reduceAnimationsOnBattery: boolean;
  optimizeForLowMemory: boolean;
  enableNetworkAdaptation: boolean;
  enableMonitoring: boolean;
  performanceBudget: PerformanceBudget;
}

/**
 * Performance utility functions
 */
export interface PerformanceUtils {
  calculateCoreWebVitalsScore: (metrics: any) => number;
  formatPerformanceMetrics: (metrics: PerformanceMetrics) => Record<string, string>;
  formatBytes: (bytes: number, decimals?: number) => string;
  isBudgetExceeded: (metrics: any, budgets: PerformanceBudget) => Record<string, boolean>;
  detectMemoryLeak: (currentMemory: number, baselineMemory: number, threshold?: number) => any;
  optimizeImageLoading: (src: string, options?: any) => string;
  debounce: <T extends (...args: any[]) => void>(func: T, wait: number, immediate?: boolean) => T & { cancel: () => void };
  throttle: <T extends (...args: any[]) => void>(func: T, limit: number) => T & { cancel: () => void };
  measurePerformance: <T>(name: string, fn: () => T, reportThreshold?: number) => T;
  createPerformanceObserver: (entryTypes: string[], callback: (entries: PerformanceEntry[]) => void) => PerformanceObserver | null;
  getDevicePerformanceCharacteristics: () => any;
  optimizeForLowEndDevice: (optimizations: any) => void;
}

/**
 * Device performance characteristics
 */
export interface DevicePerformanceCharacteristics {
  hardwareConcurrency: number;
  deviceMemory?: number;
  isLowEndDevice: boolean;
}

/**
 * Performance export types
 */
export type PerformanceExportType = 'json' | 'csv' | 'html';
export type PerformanceMetricType = 'timing' | 'layout' | 'memory' | 'network' | 'cpu';
export type PerformanceWarningSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PerformanceBudgetStatus = 'good' | 'needs-improvement' | 'poor';

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
  getBudgetStatus: (budgets?: Partial<PerformanceBudget>) => BudgetStatus;
  exportData: () => string;
  reset: () => void;
}

/**
 * Intersection observer return type
 */
export interface UseIntersectionObserverReturn {
  observe: (element: Element, callback?: (entry: IntersectionObserverEntry) => void) => void;
  unobserve: (element: Element) => void;
  disconnect: () => void;
  isIntersecting: boolean;
  entry: IntersectionObserverEntry | null;
  visibilityRatio: number;
  isVisible: boolean;
  isAboveViewport: boolean;
  isBelowViewport: boolean;
  isLeftOfViewport: boolean;
  isRightOfViewport: boolean;
}

/**
 * Image preloader return type
 */
export interface UseImagePreloaderReturn {
  preloadImage: (item: Omit<ImagePreloadItem, 'state' | 'id'>) => Promise<HTMLImageElement>;
  preloadImages: (items: Omit<ImagePreloadItem, 'state' | 'id'>[]) => Promise<HTMLImageElement[]>;
  getImageState: (src: string) => ImagePreloadState | undefined;
  getLoadingProgress: () => number;
  cancelPreload: (src: string) => void;
  cancelAllPreloads: () => void;
  isSupported: (format: 'webp' | 'avif') => boolean;
  preloadedImages: Map<string, HTMLImageElement>;
  loadingQueue: ImagePreloadItem[];
  loadingProgress: number;
}

// Re-export commonly used types
export type {
  PerformanceMetrics,
  PerformanceWarning,
  PerformanceBudget,
  PerformanceMonitorConfig,
  PerformanceDataPoint,
  BudgetStatus,
  CoreWebVitalsThresholds,
  ImagePreloadConfig,
  ImagePreloadState,
  ImagePreloadItem,
  IntersectionObserverConfig,
  EnhancedIntersectionObserverEntry,
  ResourceQueueItem,
  ViewportOptimizationConfig,
  PerformanceUtils,
  DevicePerformanceCharacteristics,
  PerformanceExportType,
  PerformanceMetricType,
  PerformanceWarningSeverity,
  PerformanceBudgetStatus,
  UsePerformanceMonitorReturn,
  UseIntersectionObserverReturn,
  UseImagePreloaderReturn,
};
