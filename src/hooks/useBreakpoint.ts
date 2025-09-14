// src/hooks/useBreakpoint.ts
/**
 * Dynamic breakpoint detection hook
 * Provides real-time breakpoint information and utilities
 * @module hooks/useBreakpoint
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useResponsive } from './useResponsive';

/**
 * Breakpoint configuration interface
 */
export interface BreakpointConfig {
  xs: { min: number; max: number };
  sm: { min: number; max: number };
  md: { min: number; max: number };
  lg: { min: number; max: number };
  xl: { min: number; max: number };
  '2xl': { min: number; max: number };
}

/**
 * Breakpoint information interface
 */
export interface BreakpointInfo {
  current: Breakpoint;
  previous: Breakpoint | null;
  next: Breakpoint | null;
  isTransitioning: boolean;
  transitionDirection: 'up' | 'down' | null;
}

/**
 * Tailwind CSS default breakpoints
 */
const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  xs: { min: 0, max: 639 },
  sm: { min: 640, max: 767 },
  md: { min: 768, max: 1023 },
  lg: { min: 1024, max: 1279 },
  xl: { min: 1280, max: 1535 },
  '2xl': { min: 1536, max: Infinity },
};

export type Breakpoint = keyof typeof DEFAULT_BREAKPOINTS;

/**
 * Hook for dynamic breakpoint detection
 * @param customBreakpoints - Optional custom breakpoint configuration
 * @returns Comprehensive breakpoint information and utilities
 * 
 * @example
 * ```tsx
 * const { current, isBetween, isGreaterThan, isLessThan } = useBreakpoint();
 * 
 * return (
 *   <div className={isBetween('sm', 'lg') ? 'medium-layout' : 'other-layout'}>
 *     {current === 'md' && <TabletComponent />}
 *   </div>
 * );
 * ```
 */
export const useBreakpoint = (customBreakpoints?: Partial<BreakpointConfig>) => {
  const breakpoints = useMemo(() => {
    if (!customBreakpoints) return DEFAULT_BREAKPOINTS;
    return { ...DEFAULT_BREAKPOINTS, ...customBreakpoints };
  }, [customBreakpoints]);

  const { width } = useResponsive();
  
  // State for breakpoint information
  const [breakpointInfo, setBreakpointInfo] = useState<BreakpointInfo>({
    current: 'lg',
    previous: null,
    next: null,
    isTransitioning: false,
    transitionDirection: null,
  });

  /**
   * Get current breakpoint based on width
   */
  const getCurrentBreakpoint = useCallback((): Breakpoint => {
    for (const [name, range] of Object.entries(breakpoints)) {
      if (width >= range.min && width <= range.max) {
        return name as Breakpoint;
      }
    }
    return 'lg'; // Default fallback
  }, [width, breakpoints]);

  /**
   * Get breakpoint ordering
   */
  const breakpointOrder = useMemo(() => Object.keys(breakpoints) as Breakpoint[], [breakpoints]);

  /**
   * Get previous and next breakpoints
   */
  const getAdjacentBreakpoints = useCallback((current: Breakpoint) => {
    const currentIndex = breakpointOrder.indexOf(current);
    const previous = currentIndex > 0 ? breakpointOrder[currentIndex - 1] : null;
    const next = currentIndex < breakpointOrder.length - 1 ? breakpointOrder[currentIndex + 1] : null;
    return { previous, next };
  }, [breakpointOrder]);

  /**
   * Update breakpoint information
   */
  useEffect(() => {
    const newBreakpoint = getCurrentBreakpoint();
    const { previous, next } = getAdjacentBreakpoints(newBreakpoint);
    
    setBreakpointInfo(prev => {
      const isTransitioning = prev.current !== newBreakpoint;
      const transitionDirection = prev.current && newBreakpoint ? 
        (breakpointOrder.indexOf(newBreakpoint) > breakpointOrder.indexOf(prev.current) ? 'up' : 'down') : null;
      
      return {
        current: newBreakpoint,
        previous: prev.current,
        next,
        isTransitioning,
        transitionDirection,
      };
    });
  }, [width, getCurrentBreakpoint, getAdjacentBreakpoints, breakpointOrder]);

  /**
   * Check if current width is between two breakpoints
   */
  const isBetween = useCallback((min: Breakpoint, max: Breakpoint): boolean => {
    const minIndex = breakpointOrder.indexOf(min);
    const maxIndex = breakpointOrder.indexOf(max);
    const currentIndex = breakpointOrder.indexOf(breakpointInfo.current);
    
    return currentIndex >= minIndex && currentIndex <= maxIndex;
  }, [breakpointInfo.current, breakpointOrder]);

  /**
   * Check if current width is greater than specified breakpoint
   */
  const isGreaterThan = useCallback((breakpoint: Breakpoint): boolean => {
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    const currentIndex = breakpointOrder.indexOf(breakpointInfo.current);
    return currentIndex > targetIndex;
  }, [breakpointInfo.current, breakpointOrder]);

  /**
   * Check if current width is less than specified breakpoint
   */
  const isLessThan = useCallback((breakpoint: Breakpoint): boolean => {
    const targetIndex = breakpointOrder.indexOf(breakpoint);
    const currentIndex = breakpointOrder.indexOf(breakpointInfo.current);
    return currentIndex < targetIndex;
  }, [breakpointInfo.current, breakpointOrder]);

  /**
   * Check if current width matches specified breakpoint
   */
  const is = useCallback((breakpoint: Breakpoint): boolean => {
    return breakpointInfo.current === breakpoint;
  }, [breakpointInfo.current]);

  /**
   * Get breakpoint range
   */
  const getRange = useCallback((breakpoint: Breakpoint) => {
    return breakpoints[breakpoint];
  }, [breakpoints]);

  /**
   * Check if transitioning to specific breakpoint
   */
  const isTransitioningTo = useCallback((breakpoint: Breakpoint): boolean => {
    return breakpointInfo.isTransitioning && breakpointInfo.next === breakpoint;
  }, [breakpointInfo.isTransitioning, breakpointInfo.next]);

  /**
   * Execute callback on breakpoint change
   */
  const onBreakpointChange = useCallback((callback: (breakpoint: Breakpoint) => void) => {
    useEffect(() => {
      if (breakpointInfo.current) {
        callback(breakpointInfo.current);
      }
    }, [breakpointInfo.current, callback]);
  }, [breakpointInfo.current]);

  return {
    // Current breakpoint information
    current: breakpointInfo.current,
    previous: breakpointInfo.previous,
    next: breakpointInfo.next,
    isTransitioning: breakpointInfo.isTransitioning,
    transitionDirection: breakpointInfo.transitionDirection,
    
    // Comparison utilities
    is,
    isBetween,
    isGreaterThan,
    isLessThan,
    isTransitioningTo,
    
    // Utility functions
    getRange,
    onBreakpointChange,
    
    // Convenience properties
    isXs: breakpointInfo.current === 'xs',
    isSm: breakpointInfo.current === 'sm',
    isMd: breakpointInfo.current === 'md',
    isLg: breakpointInfo.current === 'lg',
    isXl: breakpointInfo.current === 'xl',
    is2xl: breakpointInfo.current === '2xl',
  };
};

/**
 * Hook for breakpoint-specific callbacks
 * @param callbacks - Object with breakpoint-specific callbacks
 */
export const useBreakpointCallback = (callbacks: Partial<Record<Breakpoint, () => void>>) => {
  const { current, onBreakpointChange } = useBreakpoint();

  useEffect(() => {
    const callback = callbacks[current];
    if (callback) {
      callback();
    }
  }, [current, callbacks, onBreakpointChange]);
};

/**
 * Hook for responsive class name generation
 * @param classMap - Object mapping breakpoints to CSS classes
 * @returns Appropriate class name based on current breakpoint
 */
export const useResponsiveClass = (classMap: Partial<Record<Breakpoint, string>>): string => {
  const { current } = useBreakpoint();
  
  return useMemo(() => {
    // Get class for current breakpoint, fallback to smaller breakpoints
    const breakpoints: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
    const currentIndex = breakpoints.indexOf(current);
    
    for (let i = currentIndex; i >= 0; i--) {
      const breakpoint = breakpoints[i];
      if (classMap[breakpoint]) {
        return classMap[breakpoint]!;
      }
    }
    
    return '';
  }, [current, classMap]);
};

// Default export
export default useBreakpoint;
