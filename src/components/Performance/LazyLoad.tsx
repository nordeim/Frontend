// src/components/Performance/LazyLoad.tsx
/**
 * Lazy Load Component
 * Priority-based lazy loading with intersection observer, resource optimization,
 * and advanced loading strategies for maximum performance
 * @module components/Performance/LazyLoad
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor';
import { useResponsive } from '@/hooks/useResponsive';
import { clsx } from 'clsx';

/**
 * Lazy load priority levels
 */
export type LazyLoadPriority = 'critical' | 'high' | 'medium' | 'low' | 'idle';

/**
 * Lazy load strategy
 */
export type LazyLoadStrategy = 'intersection' | 'viewport' | 'network' | 'battery' | 'hybrid';

/**
 * Lazy load configuration
 */
export interface LazyLoadConfig {
  strategy: LazyLoadStrategy;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
  enablePreload?: boolean;
  enablePrefetch?: boolean;
  priority?: LazyLoadPriority;
  performanceBudget?: number;
}

/**
 * Lazy load state
 */
export interface LazyLoadState {
  isLoaded: boolean;
  isLoading: boolean;
  isVisible: boolean;
  isIntersecting: boolean;
  loadAttempts: number;
  lastError?: Error;
  loadTime?: number;
}

/**
 * Lazy load props
 */
export interface LazyLoadProps {
  children: React.ReactNode | ((state: LazyLoadState) => React.ReactNode);
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  placeholder?: React.ReactNode;
  config?: Partial<LazyLoadConfig>;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
  onIntersectionChange?: (isIntersecting: boolean) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

/**
 * Resource loading queue
 */
export interface LoadingQueueItem {
  id: string;
  priority: LazyLoadPriority;
  load: () => Promise<void>;
  retry: () => Promise<void>;
  abort: () => void;
}

/**
 * Performance budget tracker
 */
export interface PerformanceBudget {
  maxLoadTime: number;
  maxMemoryUsage: number;
  maxConcurrentLoads: number;
}

/**
 * Lazy Load Component
 * Provides advanced lazy loading with priority queues, performance budgets,
 * and intelligent loading strategies
 * 
 * @example
 * ```tsx
 * const config: LazyLoadConfig = {
 *   strategy: 'hybrid',
 *   threshold: 0.1,
 *   priority: 'high',
 *   enablePreload: true,
 * };
 * 
 * <LazyLoad config={config} fallback={<Skeleton />}>
 *   <HeavyComponent />
 * </LazyLoad>
 * ```
 */
export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback = null,
  errorFallback = null,
  placeholder = null,
  config = {},
  className,
  onLoad,
  onError,
  onVisibilityChange,
  onIntersectionChange,
  disabled = false,
  id = `lazy-${Math.random().toString(36).substr(2, 9)}`,
  ariaLabel = 'Lazy loaded content',
}) => {
  const { isMobile, isTouch, viewport } = useResponsive();
  const { performanceMetrics } = usePerformanceMonitor();
  const [state, setState] = useState<LazyLoadState>({
    isLoaded: false,
    isLoading: false,
    isVisible: false,
    isIntersecting: false,
    loadAttempts: 0,
  });

  const elementRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadStartTimeRef = useRef<number>(0);

  // Merge configuration with defaults
  const mergedConfig = useMemo<LazyLoadConfig>(() => ({
    strategy: 'intersection',
    threshold: 0.1,
    rootMargin: '50px',
    delay: 0,
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000,
    enablePreload: false,
    enablePrefetch: false,
    priority: 'medium',
    performanceBudget: 50,
    ...config,
  }), [config]);

  // Setup intersection observer
  const { observe, unobserve, isIntersecting } = useIntersectionObserver({
    threshold: mergedConfig.threshold,
    rootMargin: mergedConfig.rootMargin,
    enabled: !disabled && mergedConfig.strategy === 'intersection',
  });

  /**
   * Determine if component should load based on strategy
   */
  const shouldLoad = useCallback(async (): Promise<boolean> => {
    switch (mergedConfig.strategy) {
      case 'intersection':
        return isIntersecting;
      
      case 'viewport':
        return isElementInViewport(elementRef.current, mergedConfig.threshold);
      
      case 'network':
        return await shouldLoadForNetwork();
      
      case 'battery':
        return shouldLoadForBattery();
      
      case 'hybrid':
        return await shouldLoadHybrid();
      
      default:
        return isIntersecting;
    }
  }, [mergedConfig.strategy, isIntersecting, mergedConfig.threshold]);

  /**
   * Check if element is in viewport
   */
  const isElementInViewport = useCallback((element: HTMLElement | null, threshold: number = 0): boolean => {
    if (!element) return false;
    
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    
    const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
    const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);
    
    return vertInView && horInView;
  }, []);

  /**
   * Check network conditions for loading
   */
  const shouldLoadForNetwork = useCallback(async (): Promise<boolean> => {
    if (!('connection' in navigator)) return true;
    
    const connection = (navigator as any).connection;
    const effectiveType = connection.effectiveType;
    
    // Don't load on slow connections unless critical
    if (mergedConfig.priority !== 'critical' && 
        (effectiveType === '2g' || effectiveType === 'slow-2g')) {
      return false;
    }
    
    return true;
  }, [mergedConfig.priority]);

  /**
   * Check battery conditions for loading
   */
  const shouldLoadForBattery = useCallback((): boolean => {
    if (!('getBattery' in navigator)) return true;
    
    // For now, always load - battery API is async
    return true;
  }, []);

  /**
   * Hybrid loading strategy
   */
  const shouldLoadHybrid = useCallback(async (): Promise<boolean> => {
    // Check intersection first
    if (!isIntersecting) return false;
    
    // Then check network
    const networkOk = await shouldLoadForNetwork();
    if (!networkOk) return false;
    
    // Check performance budget
    const performanceOk = checkPerformanceBudget();
    if (!performanceOk) return false;
    
    return true;
  }, [isIntersecting, shouldLoadForNetwork]);

  /**
   * Check performance budget
   */
  const checkPerformanceBudget = useCallback((): boolean => {
    const { memory, timing } = performanceMetrics;
    
    if (mergedConfig.performanceBudget) {
      if (memory.usedJSHeapSize > mergedConfig.performanceBudget * 1024 * 1024) {
        return false;
      }
      
      if (timing.loadEventEnd - timing.navigationStart > mergedConfig.performanceBudget * 1000) {
        return false;
      }
    }
    
    return true;
  }, [performanceMetrics, mergedConfig.performanceBudget]);

  /**
   * Load content with retry logic
   */
  const loadContent = useCallback(async (): Promise<void> => {
    if (loadingRef.current || state.isLoaded || disabled) return;
    
    loadingRef.current = true;
    setState(prev => ({ ...prev, isLoading: true, loadAttempts: prev.loadAttempts + 1 }));
    loadStartTimeRef.current = performance.now();
    
    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();
    
    try {
      // Apply loading delay if specified
      if (mergedConfig.delay && mergedConfig.delay > 0) {
        await new Promise(resolve => setTimeout(resolve, mergedConfig.delay));
      }
      
      // Check if should still load (conditions may have changed)
      const shouldStillLoad = await shouldLoad();
      if (!shouldStillLoad) {
        throw new Error('Loading conditions no longer met');
      }
      
      // Simulate content loading (in real app, this would load actual content)
      await simulateContentLoading();
      
      // Mark as loaded
      const loadTime = performance.now() - loadStartTimeRef.current;
      setState(prev => ({ 
        ...prev, 
        isLoaded: true, 
        isLoading: false,
        loadTime,
      }));
      
      onLoad?.();
      
    } catch (error) {
      const maxAttempts = mergedConfig.retryAttempts || 0;
      
      if (state.loadAttempts < maxAttempts) {
        // Retry after delay
        setTimeout(() => {
          loadContent();
        }, mergedConfig.retryDelay || 1000);
      } else {
        // Max attempts reached
        setState(prev => ({ 
          ...prev, 
          isLoading: false,
          lastError: error as Error,
        }));
        
        onError?.(error as Error);
      }
    } finally {
      loadingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [shouldLoad, mergedConfig, state.isLoaded, state.loadAttempts, disabled, onLoad, onError]);

  /**
   * Simulate content loading (replace with actual loading logic)
   */
  const simulateContentLoading = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(resolve, Math.random() * 1000 + 500);
    });
  }, []);

  /**
   * Handle intersection changes
   */
  const handleIntersectionChange = useCallback((isIntersecting: boolean) => {
    setState(prev => ({ ...prev, isIntersecting }));
    onIntersectionChange?.(isIntersecting);
    
    if (isIntersecting && !state.isLoaded && !state.isLoading) {
      loadContent();
    }
  }, [state.isLoaded, state.isLoading, loadContent, onIntersectionChange]);

  /**
   * Handle visibility changes
   */
  const handleVisibilityChange = useCallback((isVisible: boolean) => {
    setState(prev => ({ ...prev, isVisible }));
    onVisibilityChange?.(isVisible);
  }, [onVisibilityChange]);

  /**
   * Setup intersection observer
   */
  useEffect(() => {
    if (!elementRef.current || disabled) return;
    
    observe(elementRef.current, handleIntersectionChange);
    
    return () => {
      if (elementRef.current) {
        unobserve(elementRef.current);
      }
    };
  }, [observe, unobserve, handleIntersectionChange, disabled]);

  /**
   * Handle visibility change events
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      handleVisibilityChange(!document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const config = getFeedbackConfig();
  const baseClasses = clsx(
    'relative transition-all duration-200 ease-out',
    {
      'transform scale-95': isPressed && config.type === 'scale',
      'opacity-70': isPressed && config.type === 'opacity',
      'bg-blue-100 bg-opacity-10': isPressed && config.type === 'highlight',
      'shadow-lg': isPressed && config.type === 'glow',
      'animate-pulse': isPressed && config.type === 'pulse',
      'animate-bounce': isPressed && config.type === 'bounce',
    },
    className
  );

  // Render based on state
  if (state.isLoaded) {
    return (
      <div
        ref={elementRef}
        className={baseClasses}
        aria-label={ariaLabel}
        aria-busy="false"
      >
        {typeof children === 'function' ? children(state) : children}
      </div>
    );
  }

  if (state.lastError && errorFallback) {
    return (
      <div
        ref={elementRef}
        className={baseClasses}
        aria-label={`${ariaLabel} - Error state`}
      >
        {typeof errorFallback === 'function' ? errorFallback(state.lastError) : errorFallback}
      </div>
    );
  }

  if (state.isLoading && placeholder) {
    return (
      <div
        ref={elementRef}
        className={baseClasses}
        aria-label={`${ariaLabel} - Loading`}
        aria-busy="true"
      >
        {typeof placeholder === 'function' ? placeholder(state) : placeholder}
      </div>
    );
  }

  return (
    <div
      ref={elementRef}
      className={baseClasses}
      aria-label={ariaLabel}
      aria-busy={state.isLoading ? 'true' : 'false'}
    >
      {typeof fallback === 'function' ? fallback(state) : fallback}
    </div>
  );
};

/**
 * Lazy load list component
 */
export const LazyLoadList: React.FC<{
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  config?: Partial<LazyLoadConfig>;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
  itemClassName?: string;
  staggerDelay?: number;
}> = ({
  items,
  renderItem,
  config = {},
  placeholder,
  errorFallback,
  className,
  itemClassName,
  staggerDelay = 50,
}) => {
  return (
    <div className={clsx('space-y-4', className)}>
      {items.map((item, index) => (
        <LazyLoad
          key={index}
          config={{
            ...config,
            delay: index * staggerDelay,
          }}
          placeholder={placeholder}
          errorFallback={errorFallback}
          className={itemClassName}
        >
          {renderItem(item, index)}
        </LazyLoad>
      ))}
    </div>
  );
};

/**
 * Lazy load image component
 */
export const LazyLoadImage: React.FC<{
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  config?: Partial<LazyLoadConfig>;
  placeholder?: React.ReactNode;
  errorFallback?: React.ReactNode;
  className?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}> = ({
  src,
  alt,
  srcSet,
  sizes,
  width,
  height,
  config = {},
  placeholder,
  errorFallback,
  className,
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageSrcSet, setImageSrcSet] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  const { isMobile } = useResponsive();

  // Generate responsive image sources
  useEffect(() => {
    if (isMobile) {
      setImageSrc(`${src}?w=400`);
      setImageSrcSet(srcSet ? `${srcSet}&w=400 400w, ${srcSet}&w=600 600w` : '');
    } else {
      setImageSrc(src);
      setImageSrcSet(srcSet || '');
    }
  }, [src, srcSet, isMobile]);

  return (
    <LazyLoad
      config={config}
      placeholder={placeholder || (
        <div 
          className={clsx('bg-gray-200 animate-pulse', className)}
          style={{ width, height }}
        />
      )}
      errorFallback={errorFallback || (
        <div 
          className={clsx('bg-red-100 flex items-center justify-center', className)}
          style={{ width, height }}
        >
          <span className="text-red-600 text-sm">Image failed to load</span>
        </div>
      )}
      onLoad={() => setIsLoaded(true)}
      onError={onError}
    >
      <img
        src={imageSrc}
        srcSet={imageSrcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        className={clsx(className, isLoaded && 'loaded')}
        loading="lazy"
        decoding="async"
      />
    </LazyLoad>
  );
};

export default LazyLoad;
