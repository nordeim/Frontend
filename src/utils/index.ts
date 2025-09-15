// src/utils/index.ts
/**
 * Utilities Export Barrel
 * Centralized exports for all utility functions
 * @module utils
 */

// Performance utilities
export { default as performanceUtils } from './performanceUtils';
export type { PerformanceUtils } from './performanceUtils';

// Existing utilities (maintained for compatibility)
export { default as apiUtils } from './apiUtils';
export { default as dateUtils } from './dateUtils';
export { default as formatUtils } from './formatUtils';
export { default as storageUtils } from './storageUtils';
export { default as validationUtils } from './validationUtils';

// Re-export performance utilities for direct access
export {
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
} from './performanceUtils';
