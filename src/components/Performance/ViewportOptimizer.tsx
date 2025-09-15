// src/components/Performance/ViewportOptimizer.tsx
/**
 * Viewport Optimizer Component
 * Advanced viewport optimization with memory management, resource loading,
 * and mobile-specific performance enhancements
 * @module components/Performance/ViewportOptimizer
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { clsx } from 'clsx';

/**
 * Viewport optimization configuration
 */
export interface ViewportOptimizationConfig {
  // Memory management
  enableMemoryOptimization: boolean;
  maxMemoryUsageMB: number;
  garbageCollectionInterval: number;
  
  // Resource optimization
  enableResourceOptimization: boolean;
  maxConcurrentRequests: number;
  resourceLoadingDelay: number;
  
  // Viewport-specific optimizations
  enableViewportOptimization: boolean;
  preloadOffscreenContent: boolean;
  unloadInvisibleContent: boolean;
  viewportBuffer: number;
  
  // Mobile-specific optimizations
  enableMobileOptimizations: boolean;
  reduceAnimationsOnBattery: boolean;
  optimizeForLowMemory: boolean;
  enableNetworkAdaptation: boolean;
  
  // Performance monitoring
  enableMonitoring: boolean;
  performanceBudget: PerformanceBudget;
}

/**
 * Performance budget configuration
 */
export interface PerformanceBudget {
  maxLoadTime: number;
  maxMemoryUsage: number;
  maxCPUsage: number;
  maxNetworkRequests: number;
}

/**
 * Viewport optimizer state
 */
export interface ViewportOptimizerState {
  isOptimized: boolean;
  memoryUsage: number;
  resourceCount: number;
  optimizationLevel: 'none' | 'light' | 'medium' | 'aggressive';
  batteryLevel?: number;
  networkType?: string;
}

/**
 * Resource loading queue
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
 * Viewport Optimizer Component
 * Provides comprehensive viewport optimization for mobile performance
 * 
 * @example
 * ```tsx
 * const config: ViewportOptimizationConfig = {
 *   enableMemoryOptimization: true,
 *   enableResourceOptimization: true,
 *   enableMobileOptimizations: true,
 *   performanceBudget: {
 *     maxLoadTime: 2000,
 *     maxMemoryUsage: 100 * 1024 * 1024, // 100MB
 *   },
 * };
 * 
 * <ViewportOptimizer config={config}>
 *   <div className="content">
 *     <img src="large-image.jpg" loading="lazy" />
 *     <HeavyComponent />
 *   </div>
 * </ViewportOptimizer>
 * ```
 */
export const ViewportOptimizer: React.FC<{
  children: React.ReactNode;
  config?: Partial<ViewportOptimizationConfig>;
  className?: string;
  onOptimizationChange?: (state: ViewportOptimizerState) => void;
  onPerformanceWarning?: (warning: PerformanceWarning) => void;
}> = ({
  children,
  config = {},
  className,
  onOptimizationChange,
  onPerformanceWarning,
}) => {
  const { isMobile, isTablet, device, viewport } = useResponsive();
  const { performanceMetrics, startMonitoring, stopMonitoring } = usePerformanceMonitor();
  
  // Merge configuration with defaults
  const mergedConfig = useMemo<ViewportOptimizationConfig>(() => ({
    enableMemoryOptimization: true,
    maxMemoryUsageMB: 100,
    garbageCollectionInterval: 30000,
    enableResourceOptimization: true,
    maxConcurrentRequests: 6,
    resourceLoadingDelay: 100,
    enableViewportOptimization: true,
    preloadOffscreenContent: true,
    unloadInvisibleContent: true,
    viewportBuffer: 200,
    enableMobileOptimizations: true,
    reduceAnimationsOnBattery: true,
    optimizeForLowMemory: true,
    enableNetworkAdaptation: true,
    enableMonitoring: true,
    performanceBudget: {
      maxLoadTime: 2000,
      maxMemoryUsage: 100 * 1024 * 1024,
      maxCPUsage: 0.8,
      maxNetworkRequests: 50,
    },
    ...config,
  }), [config]);

  // State management
  const [optimizationState, setOptimizationState] = useState<ViewportOptimizerState>({
    isOptimized: false,
    memoryUsage: 0,
    resourceCount: 0,
    optimizationLevel: 'none',
  });

  const [resourceQueue, setResourceQueue] = useState<ResourceQueueItem[]>([]);
  const [activeResources, setActiveResources] = useState<Set<string>>(new Set());
  const [invisibleElements, setInvisibleElements] = useState<Set<Element>>(new Set());

  // Refs for optimization
  const intersectionObserverRef = useRef<IntersectionObserver | null>(null);
  const resourceLoaderRef = useRef<ResourceLoader | null>(null);
  const memoryMonitorRef = useRef<MemoryMonitor | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  /**
   * Initialize viewport optimization
   */
  const initializeOptimization = useCallback(() => {
    if (mergedConfig.enableMonitoring) {
      startMonitoring();
    }

    if (mergedConfig.enableMemoryOptimization) {
      initializeMemoryOptimization();
    }

    if (mergedConfig.enableResourceOptimization) {
      initializeResourceOptimization();
    }

    if (mergedConfig.enableViewportOptimization) {
      initializeViewportOptimization();
    }

    if (mergedConfig.enableMobileOptimizations && isMobile) {
      initializeMobileOptimizations();
    }

    setOptimizationState(prev => ({ ...prev, isOptimized: true }));
  }, [mergedConfig, isMobile, startMonitoring]);

  /**
   * Memory optimization initialization
   */
  const initializeMemoryOptimization = useCallback(() => {
    // Initialize memory monitoring
    memoryMonitorRef.current = new MemoryMonitor({
      maxMemoryUsage: mergedConfig.maxMemoryUsageMB * 1024 * 1024,
      onMemoryWarning: handleMemoryWarning,
      onMemoryLimit: handleMemoryLimit,
    });

    // Schedule periodic garbage collection
    const gcInterval = setInterval(() => {
      if ('gc' in window) {
        (window as any).gc();
      }
      
      // Clear unused resources
      cleanupUnusedResources();
    }, mergedConfig.garbageCollectionInterval);

    return () => clearInterval(gcInterval);
  }, [mergedConfig]);

  /**
   * Resource optimization initialization
   */
  const initializeResourceOptimization = useCallback(() => {
    resourceLoaderRef.current = new ResourceLoader({
      maxConcurrent: mergedConfig.maxConcurrentRequests,
      onResourceLoad: handleResourceLoad,
      onResourceError: handleResourceError,
    });

    // Setup resource queue processing
    processResourceQueue();
  }, [mergedConfig]);

  /**
   * Viewport optimization initialization
   */
  const initializeViewportOptimization = useCallback(() => {
    // Setup intersection observer for viewport-based loading
    intersectionObserverRef.current = new IntersectionObserver(
      handleIntersectionChange,
      {
        rootMargin: `${mergedConfig.viewportBuffer}px`,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      }
    );

    // Observe all elements with optimization attributes
    observeViewportElements();
  }, [mergedConfig]);

  /**
   * Mobile-specific optimizations
   */
  const initializeMobileOptimizations = useCallback(() => {
    // Monitor battery level
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setOptimizationState(prev => ({ ...prev, batteryLevel: battery.level * 100 }));
        
        battery.addEventListener('levelchange', () => {
          setOptimizationState(prev => ({ ...prev, batteryLevel: battery.level * 100 }));
          adjustOptimizationsForBattery(battery.level);
        });
      });
    }

    // Monitor network type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setOptimizationState(prev => ({ ...prev, networkType: connection.effectiveType }));
      
      connection.addEventListener('change', () => {
        setOptimizationState(prev => ({ ...prev, networkType: connection.effectiveType }));
        adjustOptimizationsForNetwork(connection.effectiveType);
      });
    }

    // Reduce animations on low battery
    if (mergedConfig.reduceAnimationsOnBattery && device.isMobile) {
      document.documentElement.style.setProperty('--animation-duration', '0.1s');
    }
  }, [mergedConfig, device]);

  /**
   * Handle intersection changes for viewport optimization
   */
  const handleIntersectionChange = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach(entry => {
      const element = entry.target as HTMLElement;
      const elementId = element.dataset.optimizeId;
      
      if (!elementId) return;

      if (entry.isIntersecting) {
        // Element is visible - load resources
        loadElementResources(element);
        invisibleElements.delete(element);
      } else {
        // Element is invisible - unload resources if enabled
        if (mergedConfig.unloadInvisibleContent) {
          unloadElementResources(element);
          invisibleElements.add(element);
        }
      }
    });
  }, [mergedConfig, invisibleElements]);

  /**
   * Resource loading with priority queue
   */
  const loadElementResources = useCallback(async (element: HTMLElement) => {
    const resources = extractElementResources(element);
    
    for (const resource of resources) {
      await addToResourceQueue(resource);
    }
  }, []);

  /**
   * Resource unloading for memory optimization
   */
  const unloadElementResources = useCallback((element: HTMLElement) => {
    const resources = extractElementResources(element);
    
    for (const resource of resources) {
      // Remove from active resources
      activeResources.delete(resource.id);
      
      // Cancel loading if in progress
      if (resourceLoaderRef.current) {
        resourceLoaderRef.current.cancel(resource.id);
      }
      
      // Clear cached data
      clearResourceCache(resource.id);
    }
  }, [activeResources]);

  /**
   * Add resource to loading queue
   */
  const addToResourceQueue = useCallback(async (resource: ResourceQueueItem) => {
    return new Promise<void>((resolve, reject) => {
      const enhancedResource: ResourceQueueItem = {
        ...resource,
        loadCallback: () => {
          setActiveResources(prev => new Set(prev).add(resource.id));
          resource.loadCallback();
          resolve();
        },
        errorCallback: (error) => {
          resource.errorCallback?.(error);
          reject(error);
        },
      };

      setResourceQueue(prev => [...prev, enhancedResource]);
    });
  }, []);

  /**
   * Process resource queue with priority
   */
  const processResourceQueue = useCallback(async () => {
    if (!resourceLoaderRef.current) return;

    // Sort by priority
    const sortedQueue = [...resourceQueue].sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Process queue
    for (const resource of sortedQueue) {
      try {
        await resourceLoaderRef.current.load(resource);
      } catch (error) {
        console.error(`Failed to load resource ${resource.id}:`, error);
      }
    }

    setResourceQueue([]);
  }, [resourceQueue]);

  /**
   * Performance monitoring and alerts
   */
  const handlePerformanceWarning = useCallback((warning: PerformanceWarning) => {
    onPerformanceWarning?.(warning);
    
    // Adjust optimization level based on performance
    if (warning.type === 'memory' && warning.severity === 'high') {
      setOptimizationState(prev => ({ ...prev, optimizationLevel: 'aggressive' }));
      applyAggressiveOptimizations();
    }
  }, [onPerformanceWarning]);

  /**
   * Apply aggressive optimizations for low performance
   */
  const applyAggressiveOptimizations = useCallback(() => {
    // Reduce animation complexity
    document.documentElement.style.setProperty('--animation-complexity', '0.5');
    
    // Reduce image quality
    document.documentElement.style.setProperty('--image-quality', '0.7');
    
    // Disable non-essential features
    document.documentElement.classList.add('performance-mode-aggressive');
  }, []);

  /**
   * Cleanup function
   */
  const cleanup = useCallback(() => {
    if (intersectionObserverRef.current) {
      intersectionObserverRef.current.disconnect();
    }
    
    if (resourceLoaderRef.current) {
      resourceLoaderRef.current.cleanup();
    }
    
    if (memoryMonitorRef.current) {
      memoryMonitorRef.current.cleanup();
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setOptimizationState(prev => ({ ...prev, isOptimized: false }));
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeOptimization();
    
    return cleanup;
  }, [initializeOptimization, cleanup]);

  // Process resource queue when it changes
  useEffect(() => {
    if (resourceQueue.length > 0) {
      processResourceQueue();
    }
  }, [resourceQueue, processResourceQueue]);

  // Monitor performance metrics
  useEffect(() => {
    if (!mergedConfig.enableMonitoring) return;
    
    const updateState = () => {
      setOptimizationState(prev => ({
        ...prev,
        memoryUsage: performanceMetrics.memory.used,
        resourceCount: activeResources.size,
        optimizationLevel: determineOptimizationLevel(),
      }));
    };
    
    updateState();
    const interval = setInterval(updateState, 1000);
    
    return () => clearInterval(interval);
  }, [performanceMetrics, activeResources.size, mergedConfig.enableMonitoring]);

  /**
   * Determine optimization level based on current conditions
   */
  const determineOptimizationLevel = useCallback((): 'none' | 'light' | 'medium' | 'aggressive' => {
    const { memoryUsage } = performanceMetrics;
    const { maxMemoryUsage } = mergedConfig.performanceBudget;
    
    if (memoryUsage > maxMemoryUsage * 0.9) return 'aggressive';
    if (memoryUsage > maxMemoryUsage * 0.7) return 'medium';
    if (memoryUsage > maxMemoryUsage * 0.5) return 'light';
    return 'none';
  }, [performanceMetrics, mergedConfig.performanceBudget]);

  const baseClasses = clsx(
    'relative overflow-hidden',
    optimizationState.optimizationLevel === 'aggressive' && 'performance-mode-aggressive',
    optimizationState.optimizationLevel === 'medium' && 'performance-mode-medium',
    optimizationState.optimizationLevel === 'light' && 'performance-mode-light',
    className
  );

  return (
    <div className={baseClasses}>
      {/* Performance monitoring overlay */}
      {mergedConfig.enableMonitoring && (
        <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
          <div>Memory: {(optimizationState.memoryUsage / 1024 / 1024).toFixed(1)}MB</div>
          <div>Resources: {optimizationState.resourceCount}</div>
          <div>Level: {optimizationState.optimizationLevel}</div>
        </div>
      )}
      
      {/* Content with optimization context */}
      <OptimizationContext.Provider value={{
        config: mergedConfig,
        state: optimizationState,
        addToResourceQueue,
        loadElementResources,
        unloadElementResources,
      }}>
        {children}
      </OptimizationContext.Provider>
    </div>
  );
};

/**
 * Resource loader class
 */
class ResourceLoader {
  private maxConcurrent: number;
  private activeRequests: Set<string> = new Set();
  private requestQueue: ResourceQueueItem[] = [];
  private onResourceLoad: (resource: ResourceQueueItem) => void;
  private onResourceError: (resource: ResourceQueueItem, error: Error) => void;

  constructor(config: {
    maxConcurrent: number;
    onResourceLoad: (resource: ResourceQueueItem) => void;
    onResourceError: (resource: ResourceQueueItem, error: Error) => void;
  }) {
    this.maxConcurrent = config.maxConcurrent;
    this.onResourceLoad = config.onResourceLoad;
    this.onResourceError = config.onResourceError;
  }

  async load(resource: ResourceQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(resource);
      this.processQueue();
    });
  }

  cancel(resourceId: string): void {
    this.activeRequests.delete(resourceId);
    this.requestQueue = this.requestQueue.filter(r => r.id !== resourceId);
  }

  cleanup(): void {
    this.activeRequests.clear();
    this.requestQueue = [];
  }

  private async processQueue(): Promise<void> {
    while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrent) {
      const resource = this.requestQueue.shift()!;
      this.activeRequests.add(resource.id);
      
      try {
        await this.loadResource(resource);
        this.onResourceLoad(resource);
      } catch (error) {
        this.onResourceError(resource, error as Error);
      } finally {
        this.activeRequests.delete(resource.id);
      }
    }
  }

  private async loadResource(resource: ResourceQueueItem): Promise<void> {
    return new Promise((resolve, reject) => {
      switch (resource.type) {
        case 'image':
          this.loadImage(resource.url, resolve, reject);
          break;
        case 'script':
          this.loadScript(resource.url, resolve, reject);
          break;
        case 'style':
          this.loadStyle(resource.url, resolve, reject);
          break;
        case 'font':
          this.loadFont(resource.url, resolve, reject);
          break;
        case 'data':
          this.loadData(resource.url, resolve, reject);
          break;
        default:
          reject(new Error(`Unknown resource type: ${resource.type}`));
      }
    });
  }

  private loadImage(url: string, resolve: () => void, reject: (error: Error) => void): void {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  }

  private loadScript(url: string, resolve: () => void, reject: (error: Error) => void): void {
    const script = document.createElement('script');
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
    script.src = url;
    document.head.appendChild(script);
  }

  private loadStyle(url: string, resolve: () => void, reject: (error: Error) => void): void {
    const link = document.createElement('link');
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load style: ${url}`));
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  private loadFont(url: string, resolve: () => void, reject: (error: Error) => void): void {
    const font = new FontFace('CustomFont', `url(${url})`);
    font.load().then(() => {
      document.fonts.add(font);
      resolve();
    }).catch(reject);
  }

  private loadData(url: string, resolve: () => void, reject: (error: Error) => void): void {
    fetch(url)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        return response.json();
      })
      .then(() => resolve())
      .catch(reject);
  }
}

/**
 * Memory monitor class
 */
class MemoryMonitor {
  private maxMemoryUsage: number;
  private onMemoryWarning: (warning: PerformanceWarning) => void;
  private onMemoryLimit: () => void;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor(config: {
    maxMemoryUsage: number;
    onMemoryWarning: (warning: PerformanceWarning) => void;
    onMemoryLimit: () => void;
  }) {
    this.maxMemoryUsage = config.maxMemoryUsage;
    this.onMemoryWarning = config.onMemoryWarning;
    this.onMemoryLimit = config.onMemoryLimit;
  }

  start(): void {
    this.checkInterval = setInterval(() => this.checkMemoryUsage(), 1000);
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  cleanup(): void {
    this.stop();
  }

  private checkMemoryUsage(): void {
    if (!('memory' in performance)) return;
    
    const memoryInfo = (performance as any).memory;
    const usedMemory = memoryInfo.usedJSHeapSize;
    
    if (usedMemory > this.maxMemoryUsage) {
      this.onMemoryLimit();
    } else if (usedMemory > this.maxMemoryUsage * 0.8) {
      this.onMemoryWarning({
        type: 'memory',
        severity: 'high',
        message: 'Memory usage approaching limit',
        details: { usedMemory, maxMemory: this.maxMemoryUsage },
      });
    } else if (usedMemory > this.maxMemoryUsage * 0.6) {
      this.onMemoryWarning({
        type: 'memory',
        severity: 'medium',
        message: 'Memory usage elevated',
        details: { usedMemory, maxMemory: this.maxMemoryUsage },
      });
    }
  }
}

// Context for optimization utilities
const OptimizationContext = React.createContext<{
  config: ViewportOptimizationConfig;
  state: ViewportOptimizerState;
  addToResourceQueue: (resource: ResourceQueueItem) => Promise<void>;
  loadElementResources: (element: HTMLElement) => Promise<void>;
  unloadElementResources: (element: HTMLElement) => void;
} | null>(null);

export { ViewportOptimizer, OptimizationContext };
export type { ViewportOptimizationConfig, ViewportOptimizerState, ResourceQueueItem };
