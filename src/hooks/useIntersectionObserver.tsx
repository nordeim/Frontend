// src/hooks/useIntersectionObserver.tsx
/**
 * Intersection Observer Hook
 * Advanced intersection observation with performance optimization,
 * memory management, and flexible configuration options
 * @module hooks/useIntersectionObserver
 */

import { useState, useEffect, useRef, useCallback } from 'react';

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
 * Enhanced intersection observer entry
 */
export interface EnhancedIntersectionObserverEntry extends IntersectionObserverEntry {
  visibilityRatio: number;
  isFullyVisible: boolean;
  isPartiallyVisible: boolean;
  viewportPosition: 'above' | 'below' | 'left' | 'right' | 'inside';
}

/**
 * Intersection observer hook
 * Provides advanced intersection observation with performance optimizations
 * 
 * @example
 * ```tsx
 * const { observe, unobserve, isIntersecting, visibilityRatio } = useIntersectionObserver({
 *   threshold: 0.1,
 *   rootMargin: '50px',
 *   enabled: true,
 *   once: false
 * });
 * 
 * useEffect(() => {
 *   if (elementRef.current) {
 *     observe(elementRef.current, (entry) => {
 *       console.log('Element visibility:', entry.isIntersecting);
 *     });
 *   }
 *   return () => disconnect();
 * }, [observe, disconnect]);
 * ```
 */
export function useIntersectionObserver(
  config: IntersectionObserverConfig = {}
): UseIntersectionObserverReturn {
  const {
    threshold = 0,
    rootMargin = '0px',
    root = null,
    enabled = true,
    trackVisibility = false,
    delay = 0,
    once = false,
  } = config;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [visibilityRatio, setVisibilityRatio] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isAboveViewport, setIsAboveViewport] = useState(false);
  const [isBelowViewport, setIsBelowViewport] = useState(false);
  const [isLeftOfViewport, setIsLeftOfViewport] = useState(false);
  const [isRightOfViewport, setIsRightOfViewport] = useState(false);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElementsRef = useRef<Map<Element, (entry: IntersectionObserverEntry) => void>>(new Map());
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onceObservedRef = useRef<Set<Element>>(new Set());

  /**
   * Create enhanced intersection observer entry
   */
  const createEnhancedEntry = useCallback((entry: IntersectionObserverEntry): EnhancedIntersectionObserverEntry => {
    const visibilityRatio = entry.intersectionRatio;
    const isFullyVisible = visibilityRatio >= 1;
    const isPartiallyVisible = visibilityRatio > 0 && visibilityRatio < 1;
    
    let viewportPosition: 'above' | 'below' | 'left' | 'right' | 'inside' = 'inside';
    
    if (entry.boundingClientRect.bottom < 0) viewportPosition = 'above';
    else if (entry.boundingClientRect.top > window.innerHeight) viewportPosition = 'below';
    else if (entry.boundingClientRect.right < 0) viewportPosition = 'left';
    else if (entry.boundingClientRect.left > window.innerWidth) viewportPosition = 'right';

    return {
      ...entry,
      visibilityRatio,
      isFullyVisible,
      isPartiallyVisible,
      viewportPosition,
    };
  }, []);

  /**
   * Handle intersection changes
   */
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    entries.forEach((entry) => {
      const element = entry.target;
      const callback = observedElementsRef.current.get(element);
      
      if (!callback) return;

      // Skip if already observed and once is true
      if (once && onceObservedRef.current.has(element)) {
        return;
      }

      const enhancedEntry = createEnhancedEntry(entry);

      // Handle delay
      if (delay > 0) {
        if (delayTimeoutRef.current) {
          clearTimeout(delayTimeoutRef.current);
        }

        delayTimeoutRef.current = setTimeout(() => {
          processIntersectionEntry(enhancedEntry, callback);
          
          if (once && enhancedEntry.isIntersecting) {
            onceObservedRef.current.add(element);
          }
        }, delay);
      } else {
        processIntersectionEntry(enhancedEntry, callback);
        
        if (once && enhancedEntry.isIntersecting) {
          onceObservedRef.current.add(element);
        }
      }
    });
  }, [delay, once, createEnhancedEntry]);

  /**
   * Process intersection entry and update state
   */
  const processIntersectionEntry = useCallback((entry: EnhancedIntersectionObserverEntry, callback: (entry: IntersectionObserverEntry) => void) => {
    // Update component state
    setIsIntersecting(entry.isIntersecting);
    setEntry(entry);
    setVisibilityRatio(entry.visibilityRatio);
    setIsVisible(entry.isIntersecting);
    setIsAboveViewport(entry.viewportPosition === 'above');
    setIsBelowViewport(entry.viewportPosition === 'below');
    setIsLeftOfViewport(entry.viewportPosition === 'left');
    setIsRightOfViewport(entry.viewportPosition === 'right');

    // Call user callback
    callback(entry);
  }, []);

  /**
   * Create or get intersection observer
   */
  const getObserver = useCallback((): IntersectionObserver | null => {
    if (!enabled) return null;
    if (observerRef.current) return observerRef.current;

    try {
      const observer = new IntersectionObserver(
        handleIntersection,
        {
          threshold,
          rootMargin,
          root,
          trackVisibility,
          delay: trackVisibility ? delay : undefined,
        }
      );

      observerRef.current = observer;
      return observer;
    } catch (error) {
      console.warn('IntersectionObserver not supported:', error);
      return null;
    }
  }, [enabled, handleIntersection, threshold, rootMargin, root, trackVisibility, delay]);

  /**
   * Observe element
   */
  const observe = useCallback((element: Element, callback?: (entry: IntersectionObserverEntry) => void) => {
    const observer = getObserver();
    if (!observer) return;

    // Store callback for this element
    observedElementsRef.current.set(element, callback || (() => {}));
    
    // Start observing
    observer.observe(element);
  }, [getObserver]);

  /**
   * Unobserve element
   */
  const unobserve = useCallback((element: Element) => {
    const observer = observerRef.current;
    if (!observer) return;

    observer.unobserve(element);
    observedElementsRef.current.delete(element);
    onceObservedRef.current.delete(element);
  }, []);

  /**
   * Disconnect observer
   */
  const disconnect = useCallback(() => {
    const observer = observerRef.current;
    if (!observer) return;

    observer.disconnect();
    observerRef.current = null;
    observedElementsRef.current.clear();
    onceObservedRef.current.clear();

    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    observe,
    unobserve,
    disconnect,
    isIntersecting,
    entry,
    visibilityRatio,
    isVisible,
    isAboveViewport,
    isBelowViewport,
    isLeftOfViewport,
    isRightOfViewport,
  };
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyLoadIntersection(
  config: IntersectionObserverConfig = {}
) {
  const { observe, unobserve, isIntersecting, visibilityRatio } = useIntersectionObserver({
    ...config,
    threshold: config.threshold || 0.1,
    rootMargin: config.rootMargin || '50px',
  });

  return {
    observe,
    unobserve,
    isIntersecting,
    visibilityRatio,
  };
}

/**
 * Hook for infinite scroll with intersection observer
 */
export function useInfiniteScroll(
  onLoadMore: () => void | Promise<void>,
  config: IntersectionObserverConfig = {}
) {
  const { observe, unobserve, isIntersecting } = useIntersectionObserver({
    ...config,
    threshold: config.threshold || 0.5,
    rootMargin: config.rootMargin || '100px',
  });

  const targetRef = useRef<Element | null>(null);

  useEffect(() => {
    if (isIntersecting && targetRef.current) {
      onLoadMore();
    }
  }, [isIntersecting, onLoadMore]);

  const setTarget = useCallback((element: Element | null) => {
    if (targetRef.current) {
      unobserve(targetRef.current);
    }

    if (element) {
      observe(element);
      targetRef.current = element;
    }
  }, [observe, unobserve]);

  return { setTarget, isIntersecting };
}

export default useIntersectionObserver;
