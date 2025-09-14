// src/hooks/useOrientation.ts
/**
 * Screen orientation detection and handling hook
 * @module hooks/useOrientation
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Orientation information interface
 */
export interface OrientationInfo {
  angle: number;
  type: OrientationType;
  isLandscape: boolean;
  isPortrait: boolean;
  isFlat: boolean;
  isUpsideDown: boolean;
}

/**
 * Orientation type
 */
export type OrientationType = 
  | 'portrait-primary'
  | 'portrait-secondary'
  | 'landscape-primary'
  | 'landscape-secondary'
  | 'unknown';

/**
 * Device orientation information
 */
export interface DeviceOrientation {
  alpha: number | null; // Compass direction
  beta: number | null;  // Front-to-back tilt
  gamma: number | null; // Left-to-right tilt
}

/**
 * Hook for screen orientation detection and handling
 * @param enableDeviceOrientation - Enable device orientation API
 * @returns Orientation information and utilities
 * 
 * @example
 * ```tsx
 * const { orientation, lockOrientation, unlockOrientation } = useOrientation();
 * 
 * return (
 *   <div className={orientation.isLandscape ? 'landscape-view' : 'portrait-view'}>
 *     <p>Current orientation: {orientation.type}</p>
 *   </div>
 * );
 * ```
 */
export const useOrientation = (enableDeviceOrientation: boolean = false) => {
  // State for screen orientation
  const [orientation, setOrientation] = useState<OrientationInfo>({
    angle: 0,
    type: 'unknown',
    isLandscape: false,
    isPortrait: true,
    isFlat: false,
    isUpsideDown: false,
  });

  // State for device orientation
  const [deviceOrientation, setDeviceOrientation] = useState<DeviceOrientation>({
    alpha: null,
    beta: null,
    gamma: null,
  });

  // State for permission
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  /**
   * Get current screen orientation
   */
  const getScreenOrientation = useCallback((): OrientationInfo => {
    const screenOrientation = (screen as any).orientation || (screen as any).mozOrientation || (screen as any).msOrientation;
    
    let angle = 0;
    let type: OrientationType = 'unknown';
    let isLandscape = false;
    let isPortrait = true;
    let isFlat = false;
    let isUpsideDown = false;

    if (screenOrientation) {
      angle = screenOrientation.angle || 0;
      type = screenOrientation.type as OrientationType;
      
      isLandscape = type.includes('landscape');
      isPortrait = type.includes('portrait');
      isUpsideDown = angle === 180 || angle === -180;
    } else {
      // Fallback for browsers without screen orientation API
      angle = window.orientation || 0;
      isLandscape = Math.abs(angle) === 90;
      isPortrait = !isLandscape;
      isUpsideDown = angle === 180 || angle === -180;
      
      if (isLandscape) {
        type = angle === 90 ? 'landscape-primary' : 'landscape-secondary';
      } else {
        type = angle === 0 ? 'portrait-primary' : 'portrait-secondary';
      }
    }

    return {
      angle,
      type,
      isLandscape,
      isPortrait,
      isFlat: Math.abs(angle) < 5,
      isUpsideDown,
    };
  }, []);

  /**
   * Handle orientation change
   */
  const handleOrientationChange = useCallback(() => {
    setOrientation(getScreenOrientation());
  }, [getScreenOrientation]);

  /**
   * Lock orientation (if supported)
   */
  const lockOrientation = useCallback(async (orientation: OrientationType): Promise<boolean> => {
    const screenOrientation = (screen as any).orientation;
    
    if (!screenOrientation || !screenOrientation.lock) {
      console.warn('Screen Orientation API not supported');
      return false;
    }

    try {
      await screenOrientation.lock(orientation);
      return true;
    } catch (error) {
      console.error('Failed to lock orientation:', error);
      return false;
    }
  }, []);

  /**
   * Unlock orientation (if supported)
   */
  const unlockOrientation = useCallback(async (): Promise<boolean> => {
    const screenOrientation = (screen as any).orientation;
    
    if (!screenOrientation || !screenOrientation.unlock) {
      console.warn('Screen Orientation API not supported');
      return false;
    }

    try {
      screenOrientation.unlock();
      return true;
    } catch (error) {
      console.error('Failed to unlock orientation:', error);
      return false;
    }
  }, []);

  /**
   * Handle device orientation (if enabled)
   */
  const handleDeviceOrientation = useCallback((event: DeviceOrientationEvent) => {
    setDeviceOrientation({
      alpha: event.alpha,
      beta: event.beta,
      gamma: event.gamma,
    });
  }, []);

  /**
   * Request device orientation permission
   */
  const requestDeviceOrientationPermission = useCallback(async (): Promise<boolean> => {
    if (!enableDeviceOrientation) return false;

    try {
      // Check if we need to request permission (iOS 13+)
      if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        setHasPermission(permission === 'granted');
        return permission === 'granted';
      } else {
        // For other browsers, assume permission is granted
        setHasPermission(true);
        return true;
      }
    } catch (error) {
      console.error('Failed to request device orientation permission:', error);
      return false;
    }
  }, [enableDeviceOrientation]);

  /**
   * Initialize orientation detection
   */
  useEffect(() => {
    // Set initial orientation
    setOrientation(getScreenOrientation());

    // Listen for orientation changes
    const screenOrientation = (screen as any).orientation;
    
    if (screenOrientation) {
      screenOrientation.addEventListener('change', handleOrientationChange);
    } else {
      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);
    }

    return () => {
      if (screenOrientation) {
        screenOrientation.removeEventListener('change', handleOrientationChange);
      } else {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
      }
    };
  }, [getScreenOrientation, handleOrientationChange]);

  /**
   * Initialize device orientation (if enabled)
   */
  useEffect(() => {
    if (!enableDeviceOrientation || !hasPermission) return;

    window.addEventListener('deviceorientation', handleDeviceOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleDeviceOrientation);
    };
  }, [enableDeviceOrientation, hasPermission, handleDeviceOrientation]);

  /**
   * Get orientation-based class name
   */
  const getOrientationClass = useCallback((classes: {
    portrait?: string;
    landscape?: string;
    flat?: string;
    upsideDown?: string;
  }): string => {
    const { isPortrait, isLandscape, isFlat, isUpsideDown } = orientation;
    
    if (isUpsideDown && classes.upsideDown) return classes.upsideDown;
    if (isFlat && classes.flat) return classes.flat;
    if (isPortrait && classes.portrait) return classes.portrait;
    if (isLandscape && classes.landscape) return classes.landscape;
    
    return '';
  }, [orientation]);

  /**
   * Check if orientation is supported
   */
  const isOrientationSupported = useCallback((): boolean => {
    return !!(screen as any).orientation || 'orientation' in window;
  }, []);

  /**
   * Check if device orientation is supported
   */
  const isDeviceOrientationSupported = useCallback((): boolean => {
    return 'DeviceOrientationEvent' in window;
  }, []);

  return {
    // Screen orientation
    orientation,
    
    // Device orientation (if enabled)
    deviceOrientation: enableDeviceOrientation ? deviceOrientation : null,
    hasDeviceOrientationPermission: hasPermission,
    
    // Control functions
    lockOrientation,
    unlockOrientation,
    requestDeviceOrientationPermission,
    
    // Utility functions
    getOrientationClass,
    isOrientationSupported,
    isDeviceOrientationSupported,
    
    // Convenience properties
    angle: orientation.angle,
    type: orientation.type,
    isLandscape: orientation.isLandscape,
    isPortrait: orientation.isPortrait,
    isFlat: orientation.isFlat,
    isUpsideDown: orientation.isUpsideDown,
  };
};

/**
 * Hook for orientation-specific callbacks
 * @param callbacks - Object with orientation-specific callbacks
 */
export const useOrientationCallback = (callbacks: {
  onPortrait?: () => void;
  onLandscape?: () => void;
  onOrientationChange?: (orientation: OrientationInfo) => void;
}) => {
  const { orientation, onOrientationChange } = useOrientation();

  useEffect(() => {
    if (callbacks.onOrientationChange) {
      callbacks.onOrientationChange(orientation);
    }

    if (orientation.isPortrait && callbacks.onPortrait) {
      callbacks.onPortrait();
    }

    if (orientation.isLandscape && callbacks.onLandscape) {
      callbacks.onLandscape();
    }
  }, [orientation, callbacks, onOrientationChange]);
};

// Default export
export default useOrientation;
