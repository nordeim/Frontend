// src/hooks/index.ts
/**
 * Hooks Export Barrel
 * Centralized exports for all custom React hooks
 * @module hooks
 */

// Performance hooks
export { default as usePerformanceMonitor } from './usePerformanceMonitor';
export type { 
  UsePerformanceMonitorReturn, 
  PerformanceMetrics, 
  PerformanceWarning, 
  PerformanceBudget 
} from './usePerformanceMonitor';

export { default as useIntersectionObserver } from './useIntersectionObserver';
export type { 
  UseIntersectionObserverReturn, 
  IntersectionObserverConfig, 
  EnhancedIntersectionObserverEntry 
} from './useIntersectionObserver';

export { default as useImagePreloader } from './useImagePreloader';
export type { 
  UseImagePreloaderReturn, 
  ImagePreloadConfig, 
  ImagePreloadState, 
  ImagePreloadItem 
} from './useImagePreloader';

// Existing hooks (maintained for compatibility)
export { default as useChat } from './useChat';
export { default as useAnnouncer } from './useAnnouncer';
export { default as useBreakpoint } from './useBreakpoint';
export { default as useDevice } from './useDevice';
export { default as useFocusManager } from './useFocusManager';
export { default as useHighContrast } from './useHighContrast';
export { default as useKeyboardNavigation } from './useKeyboardNavigation';
export { default as useRTL } from './useRTL';

// Re-export types
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
} from './usePerformanceMonitor';
