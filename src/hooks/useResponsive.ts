// src/hooks/useResponsive.ts
/**
 * Comprehensive responsive utilities hook
 * Provides device detection, breakpoint management, and responsive behavior
 * @module hooks/useResponsive
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppSelector } from '@/store';
import { selectViewportSize } from '@/store/slices/uiSlice';

/**
 * Device capabilities interface
 */
export interface DeviceCapabilities {
  isTouch: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isWindows: boolean;
  isMacOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  maxTouchPoints: number;
}

/**
 * Viewport information interface
 */
export interface ViewportInfo {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: 'portrait' | 'landscape';
  breakpoint: Breakpoint;
  devicePixelRatio: number;
}

/**
 * Breakpoint types following Tailwind CSS conventions
 */
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

/**
 * Responsive configuration
 */
export interface ResponsiveConfig {
  breakpoints: Record<Breakpoint, number>;
  debounceMs: number;
  enableOrientationDetection: boolean;
  enableDeviceDetection: boolean;
}

/**
 * Default responsive configuration
 */
const DEFAULT_CONFIG: ResponsiveConfig = {
  breakpoints: {
    xs: 0,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },
  debounceMs: 100,
  enableOrientationDetection: true,
  enableDeviceDetection: true,
};

/**
 * Hook for comprehensive responsive utilities
 * @param config - Optional configuration object
 * @returns Responsive utilities and device information
 * 
 * @example
 * ```tsx
 * const { isMobile, breakpoint, device, viewport } = useResponsive();
 * 
 * return (
 *   <div className={isMobile ? 'mobile-layout' : 'desktop-layout'}>
 *     {breakpoint === 'sm' && <MobileComponent />}
 *   </div>
 * );
 * ```
 */
export const useResponsive = (config: Partial<ResponsiveConfig> = {}) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const viewport = useAppSelector(selectViewportSize);
  
  // State for device capabilities
  const [deviceCapabilities, setDeviceCapabilities] = useState<DeviceCapabilities>({
    isTouch: false,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    isIOS: false,
    isAndroid: false,
    isWindows: false,
    isMacOS: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    maxTouchPoints: 0,
  });

  // State for viewport information
  const [viewportInfo, setViewportInfo] = useState<ViewportInfo>({
    width: viewport.width,
    height: viewport.height,
    aspectRatio: viewport.width / viewport.height,
    orientation: viewport.width > viewport.height ? 'landscape' : 'portrait',
    breakpoint: 'lg',
    devicePixelRatio: 1,
  });

  /**
   * Detect device capabilities
   */
  const detectDeviceCapabilities = useCallback((): DeviceCapabilities => {
    const userAgent = navigator.userAgent.toLowerCase();
    const platform = navigator.platform.toLowerCase();
    const maxTouchPoints = navigator.maxTouchPoints || 0;

    // Detect operating system
    const isIOS = /iphone|ipad|ipod/.test(userAgent) || platform === 'macintel' && maxTouchPoints > 0;
    const isAndroid = /android/.test(userAgent);
    const isWindows = /windows|win32|win64/.test(userAgent);
    const isMacOS = /macintosh|mac os/.test(userAgent) && !isIOS;

    // Detect browser
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edg/.test(userAgent);
    const isFirefox = /firefox/.test(userAgent);

    // Detect touch capability
    const isTouch = 'ontouchstart' in window || maxTouchPoints > 0;

    // Determine device type based on viewport and touch capability
    const isMobile = viewport.isMobile && isTouch;
    const isTablet = viewport.isTablet && isTouch;
    const isDesktop = viewport.isDesktop || (!isMobile && !isTablet);

    return {
      isTouch,
      isMobile,
      isTablet,
      isDesktop,
      isIOS,
      isAndroid,
      isWindows,
      isMacOS,
      isSafari,
      isChrome,
      isFirefox,
      maxTouchPoints,
    };
  }, [viewport]);

  /**
   * Calculate current breakpoint
   */
  const getCurrentBreakpoint = useCallback((): Breakpoint => {
    const { width } = viewport;
    const { breakpoints } = mergedConfig;

    if (width >= breakpoints['2xl']) return '2xl';
    if (width >= breakpoints.xl) return 'xl';
    if (width >= breakpoints.lg) return 'lg';
    if (width >= breakpoints.md) return 'md';
    if (width >= breakpoints.sm) return 'sm';
    return 'xs';
  }, [viewport, mergedConfig.breakpoints]);

  /**
   * Update device capabilities and viewport info
   */
  useEffect(() => {
    setDeviceCapabilities(detectDeviceCapabilities());
    setViewportInfo({
      width: viewport.width,
      height: viewport.height,
      aspectRatio: viewport.width / viewport.height,
      orientation: viewport.width > viewport.height ? 'landscape' : 'portrait',
      breakpoint: getCurrentBreakpoint(),
      devicePixelRatio: window.devicePixelRatio || 1,
    });
  }, [viewport, detectDeviceCapabilities, getCurrentBreakpoint]);

  /**
   * Memoized responsive utilities
   */
  const responsiveUtils = useMemo(() => ({
    /**
     * Check if current viewport matches breakpoint
     */
    isBreakpoint: (breakpoint: Breakpoint): boolean => {
      return viewportInfo.breakpoint === breakpoint;
    },

    /**
     * Check if current viewport is at least specified breakpoint
     */
    isMinBreakpoint: (breakpoint: Breakpoint): boolean => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpoints.indexOf(viewportInfo.breakpoint);
      const targetIndex = breakpoints.indexOf(breakpoint);
      return currentIndex >= targetIndex;
    },

    /**
     * Check if current viewport is at most specified breakpoint
     */
    isMaxBreakpoint: (breakpoint: Breakpoint): boolean => {
      const breakpoints = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
      const currentIndex = breakpoints.indexOf(viewportInfo.breakpoint);
      const targetIndex = breakpoints.indexOf(breakpoint);
      return currentIndex <= targetIndex;
    },

    /**
     * Get responsive class name based on breakpoint
     */
    getResponsiveClass: (classes: Partial<Record<Breakpoint, string>>): string => {
      const breakpoint = viewportInfo.breakpoint;
      return classes[breakpoint] || '';
    },

    /**
     * Check if device is in landscape mode
     */
    isLandscape: (): boolean => viewportInfo.orientation === 'landscape',

    /**
     * Check if device is in portrait mode
     */
    isPortrait: (): boolean => viewportInfo.orientation === 'portrait',

    /**
     * Get current aspect ratio category
     */
    getAspectRatioCategory: (): 'square' | 'portrait' | 'landscape' | 'ultra-wide' => {
      const ratio = viewportInfo.aspectRatio;
      if (ratio >= 0.9 && ratio <= 1.1) return 'square';
      if (ratio < 0.9) return 'portrait';
      if (ratio > 2) return 'ultra-wide';
      return 'landscape';
    },

    /**
     * Check if device supports hover
     */
    supportsHover: (): boolean => !deviceCapabilities.isTouch,

    /**
     * Get device performance category
     */
    getPerformanceCategory: (): 'low' | 'medium' | 'high' => {
      const memory = (navigator as any).deviceMemory;
      const cores = navigator.hardwareConcurrency;
      
      if (memory && memory < 4) return 'low';
      if (cores && cores < 4) return 'low';
      if (memory && memory > 8) return 'high';
      if (cores && cores > 8) return 'high';
      return 'medium';
    },
  }), [viewportInfo, deviceCapabilities.isTouch]);

  return {
    // Device information
    device: deviceCapabilities,
    
    // Viewport information
    viewport: viewportInfo,
    
    // Responsive utilities
    ...responsiveUtils,
    
    // Convenience flags
    isMobile: deviceCapabilities.isMobile,
    isTablet: deviceCapabilities.isTablet,
    isDesktop: deviceCapabilities.isDesktop,
    isTouch: deviceCapabilities.isTouch,
    breakpoint: viewportInfo.breakpoint,
    orientation: viewportInfo.orientation,
    width: viewport.width,
    height: viewport.height,
  };
};

/**
 * Hook for responsive callback execution
 * @param mobileCallback - Callback for mobile devices
 * @param desktopCallback - Callback for desktop devices
 * @param tabletCallback - Optional callback for tablet devices
 */
export const useResponsiveCallback = (
  mobileCallback: () => void,
  desktopCallback: () => void,
  tabletCallback?: () => void
) => {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  useEffect(() => {
    if (isMobile) {
      mobileCallback();
    } else if (isTablet && tabletCallback) {
      tabletCallback();
    } else if (isDesktop) {
      desktopCallback();
    }
  }, [isMobile, isTablet, isDesktop, mobileCallback, desktopCallback, tabletCallback]);
};

/**
 * Hook for responsive media query matching
 * @param query - Media query string
 * @returns Whether the media query matches
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
};

/**
 * Hook for responsive value selection
 * @param mobileValue - Value for mobile devices
 * @param desktopValue - Value for desktop devices
 * @param tabletValue - Optional value for tablet devices
 * @returns Responsive value based on current device
 */
export const useResponsiveValue = <T>(
  mobileValue: T,
  desktopValue: T,
  tabletValue?: T
): T => {
  const { isMobile, isTablet } = useResponsive();
  
  if (isMobile) return mobileValue;
  if (isTablet && tabletValue !== undefined) return tabletValue;
  return desktopValue;
};

// Default export
export default useResponsive;
