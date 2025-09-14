// src/hooks/useTouch.ts
/**
 * Touch capability detection and gesture handling hook
 * @module hooks/useTouch
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Touch event handlers interface
 */
export interface TouchHandlers {
  onTouchStart?: (e: TouchEvent) => void;
  onTouchMove?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onTouchCancel?: (e: TouchEvent) => void;
}

/**
 * Touch gesture information
 */
export interface TouchGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  deltaX: number;
  deltaY: number;
  distance: number;
  angle: number;
  duration: number;
  velocity: number;
}

/**
 * Touch capability information
 */
export interface TouchCapabilities {
  isTouch: boolean;
  maxTouchPoints: number;
  supportsTouchEvents: boolean;
  supportsPointerEvents: boolean;
  supportsGestureEvents: boolean;
}

/**
 * Hook for touch capability detection and gesture handling
 * @returns Touch capabilities and gesture utilities
 * 
 * @example
 * ```tsx
 * const { isTouch, onTouchStart, onTouchEnd } = useTouch();
 * 
 * return (
 *   <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
 *     {isTouch && <span>Touch device detected</span>}
 *   </div>
 * );
 * ```
 */
export const useTouch = () => {
  // State for touch capabilities
  const [touchCapabilities, setTouchCapabilities] = useState<TouchCapabilities>({
    isTouch: false,
    maxTouchPoints: 0,
    supportsTouchEvents: false,
    supportsPointerEvents: false,
    supportsGestureEvents: false,
  });

  // Refs for gesture tracking
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const gestureRef = useRef<TouchGesture | null>(null);

  /**
   * Detect touch capabilities
   */
  const detectTouchCapabilities = useCallback((): TouchCapabilities => {
    const maxTouchPoints = navigator.maxTouchPoints || 0;
    const isTouch = 'ontouchstart' in window || maxTouchPoints > 0;
    const supportsTouchEvents = 'TouchEvent' in window;
    const supportsPointerEvents = 'PointerEvent' in window;
    const supportsGestureEvents = 'GestureEvent' in window;

    return {
      isTouch,
      maxTouchPoints,
      supportsTouchEvents,
      supportsPointerEvents,
      supportsGestureEvents,
    };
  }, []);

  /**
   * Initialize touch detection
   */
  useEffect(() => {
    setTouchCapabilities(detectTouchCapabilities());
  }, [detectTouchCapabilities]);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    const now = Date.now();
    
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
    };
    
    touchEndRef.current = null;
    gestureRef.current = null;
  }, []);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const now = Date.now();
    
    touchEndRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: now,
    };
  }, []);

  /**
   * Calculate gesture information
   */
  const calculateGesture = useCallback((): TouchGesture | null => {
    if (!touchStartRef.current || !touchEndRef.current) return null;
    
    const start = touchStartRef.current;
    const end = touchEndRef.current;
    
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const angle = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
    const duration = end.time - start.time;
    const velocity = distance / (duration || 1);
    
    return {
      startX: start.x,
      startY: start.y,
      endX: end.x,
      endY: end.y,
      deltaX,
      deltaY,
      distance,
      angle,
      duration,
      velocity,
    };
  }, []);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    const gesture = calculateGesture();
    if (gesture) {
      gestureRef.current = gesture;
    }
  }, [calculateGesture]);

  /**
   * Handle touch cancel
   */
  const handleTouchCancel = useCallback((e: TouchEvent) => {
    touchStartRef.current = null;
    touchEndRef.current = null;
    gestureRef.current = null;
  }, []);

  /**
   * Get current gesture information
   */
  const getGesture = useCallback((): TouchGesture | null => {
    return gestureRef.current;
  }, []);

  /**
   * Check if gesture is a swipe
   */
  const isSwipe = useCallback((minDistance: number = 30): boolean => {
    const gesture = getGesture();
    if (!gesture) return false;
    
    return gesture.distance >= minDistance && gesture.velocity > 0.3;
  }, [getGesture]);

  /**
   * Check if gesture is a tap
   */
  const isTap = useCallback((maxDistance: number = 10, maxDuration: number = 300): boolean => {
    const gesture = getGesture();
    if (!gesture) return false;
    
    return gesture.distance <= maxDistance && gesture.duration <= maxDuration;
  }, [getGesture]);

  /**
   * Get swipe direction
   */
  const getSwipeDirection = useCallback((): 'left' | 'right' | 'up' | 'down' | null => {
    const gesture = getGesture();
    if (!gesture || !isSwipe()) return null;
    
    const absX = Math.abs(gesture.deltaX);
    const absY = Math.abs(gesture.deltaY);
    
    if (absX > absY) {
      return gesture.deltaX > 0 ? 'right' : 'left';
    } else {
      return gesture.deltaY > 0 ? 'down' : 'up';
    }
  }, [getGesture, isSwipe]);

  /**
   * Touch event handlers
   */
  const touchHandlers: TouchHandlers = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  };

  return {
    // Touch capabilities
    ...touchCapabilities,
    
    // Gesture information
    gesture: getGesture(),
    
    // Utility functions
    getGesture,
    isSwipe,
    isTap,
    getSwipeDirection,
    
    // Event handlers
    ...touchHandlers,
    
    // Convenience properties
    isTouchDevice: touchCapabilities.isTouch,
    supportsTouch: touchCapabilities.supportsTouchEvents,
  };
};

/**
 * Hook for touch-specific callbacks
 * @param callbacks - Object with touch-specific callbacks
 */
export const useTouchCallback = (callbacks: {
  onTap?: (gesture: TouchGesture) => void;
  onSwipe?: (direction: string, gesture: TouchGesture) => void;
  onTouchStart?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
}) => {
  const { getGesture, isTap, isSwipe, getSwipeDirection, onTouchStart, onTouchEnd } = useTouch();

  const enhancedOnTouchEnd = useCallback((e: TouchEvent) => {
    // Call original touch end handler
    onTouchEnd(e);
    
    // Get gesture information
    const gesture = getGesture();
    if (!gesture) return;
    
    // Check for tap
    if (callbacks.onTap && isTap()) {
      callbacks.onTap(gesture);
    }
    
    // Check for swipe
    if (callbacks.onSwipe && isSwipe()) {
      const direction = getSwipeDirection();
      if (direction) {
        callbacks.onSwipe(direction, gesture);
      }
    }
    
    // Call custom touch end handler
    if (callbacks.onTouchEnd) {
      callbacks.onTouchEnd(e);
    }
  }, [getGesture, isTap, isSwipe, getSwipeDirection, onTouchEnd, callbacks]);

  const enhancedOnTouchStart = useCallback((e: TouchEvent) => {
    // Call original touch start handler
    onTouchStart(e);
    
    // Call custom touch start handler
    if (callbacks.onTouchStart) {
      callbacks.onTouchStart(e);
    }
  }, [onTouchStart, callbacks]);

  return {
    onTouchStart: enhancedOnTouchStart,
    onTouchEnd: enhancedOnTouchEnd,
  };
};

// Default export
export default useTouch;
