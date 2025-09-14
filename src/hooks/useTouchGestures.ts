// src/hooks/useTouchGestures.ts
/**
 * Advanced Touch Gesture Recognition System
 * Provides comprehensive gesture detection with velocity tracking, multi-touch support,
 * and complex gesture patterns for enterprise-grade applications
 * @module hooks/useTouchGestures
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

/**
 * Touch point information
 */
export interface TouchPoint {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  pressure: number;
  radius: number;
  timestamp: number;
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
}

/**
 * Gesture information with advanced metrics
 */
export interface GestureInfo {
  type: GestureType;
  startTime: number;
  endTime: number;
  duration: number;
  touchPoints: TouchPoint[];
  center: { x: number; y: number };
  velocity: { x: number; y: number; magnitude: number };
  acceleration: { x: number; y: number; magnitude: number };
  direction: GestureDirection;
  angle: number;
  distance: number;
  scale: number;
  rotation: number;
  pressure: number;
  confidence: number;
}

/**
 * Gesture types
 */
export type GestureType = 
  | 'tap'
  | 'double-tap'
  | 'long-press'
  | 'swipe'
  | 'pan'
  | 'pinch'
  | 'rotate'
  | 'multi-touch'
  | 'force-touch';

/**
 * Gesture directions
 */
export type GestureDirection = 
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right'
  | 'none';

/**
 * Gesture configuration
 */
export interface GestureConfig {
  // Tap gestures
  tapThreshold: number;
  doubleTapDelay: number;
  longPressDelay: number;
  
  // Swipe gestures
  swipeThreshold: number;
  swipeVelocityThreshold: number;
  
  // Pinch gestures
  pinchThreshold: number;
  pinchSensitivity: number;
  
  // Rotation gestures
  rotateThreshold: number;
  rotateSensitivity: number;
  
  // Force touch
  forceTouchThreshold: number;
  
  // General settings
  multiTouchDelay: number;
  velocitySmoothing: number;
  confidenceThreshold: number;
}

/**
 * Gesture callbacks
 */
export interface GestureCallbacks {
  onTap?: (gesture: GestureInfo) => void;
  onDoubleTap?: (gesture: GestureInfo) => void;
  onLongPress?: (gesture: GestureInfo) => void;
  onSwipe?: (direction: GestureDirection, gesture: GestureInfo) => void;
  onPan?: (gesture: GestureInfo) => void;
  onPinch?: (scale: number, gesture: GestureInfo) => void;
  onRotate?: (rotation: number, gesture: GestureInfo) => void;
  onMultiTouch?: (gesture: GestureInfo) => void;
  onForceTouch?: (pressure: number, gesture: GestureInfo) => void;
  onGestureStart?: (gesture: GestureInfo) => void;
  onGestureEnd?: (gesture: GestureInfo) => void;
}

/**
 * Default gesture configuration
 */
const DEFAULT_CONFIG: GestureConfig = {
  // Tap gestures
  tapThreshold: 10,
  doubleTapDelay: 300,
  longPressDelay: 500,
  
  // Swipe gestures
  swipeThreshold: 30,
  swipeVelocityThreshold: 0.3,
  
  // Pinch gestures
  pinchThreshold: 10,
  pinchSensitivity: 0.01,
  
  // Rotation gestures
  rotateThreshold: 5,
  rotateSensitivity: 0.5,
  
  // Force touch
  forceTouchThreshold: 0.5,
  
  // General settings
  multiTouchDelay: 50,
  velocitySmoothing: 0.8,
  confidenceThreshold: 0.7,
};

/**
 * Hook for advanced touch gesture recognition
 * @param config - Custom gesture configuration
 * @param callbacks - Gesture event callbacks
 * @returns Gesture recognition utilities and state
 * 
 * @example
 * ```tsx
 * const { onTouchStart, onTouchMove, onTouchEnd, activeGesture } = useTouchGestures(
 *   { swipeThreshold: 50 },
 *   {
 *     onSwipe: (direction, gesture) => console.log('Swiped:', direction),
 *     onPinch: (scale, gesture) => console.log('Pinched:', scale),
 *   }
 * );
 * 
 * return (
 *   <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
 *     {activeGesture && <div>Gesture: {activeGesture.type}</div>}
 *   </div>
 * );
 * ```
 */
export const useTouchGestures = (
  config: Partial<GestureConfig> = {},
  callbacks: GestureCallbacks = {}
) => {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State for active gesture
  const [activeGesture, setActiveGesture] = useState<GestureInfo | null>(null);
  const [gestureHistory, setGestureHistory] = useState<GestureInfo[]>([]);
  
  // Refs for gesture tracking
  const gestureStartRef = useRef<{ time: number; touches: TouchPoint[] } | null>(null);
  const gestureCurrentRef = useRef<{ touches: TouchPoint[]; lastUpdate: number }>({ touches: [], lastUpdate: 0 });
  const gestureEndRef = useRef<{ time: number; touches: TouchPoint[] } | null>(null);
  
  // Refs for timing and detection
  const tapTimerRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; position: { x: number; y: number } } | null>(null);
  
  // Velocity tracking
  const velocityTrackerRef = useRef<{ x: number[]; y: number[]; timestamps: number[] }>({
    x: [],
    y: [],
    timestamps: [],
  });

  /**
   * Process touch points from TouchEvent
   */
  const processTouchPoints = useCallback((touches: TouchList, timestamp: number = Date.now()): TouchPoint[] => {
    return Array.from(touches).map(touch => {
      const startTouch = gestureStartRef.current?.touches.find(t => t.id === touch.identifier);
      
      return {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        startX: startTouch?.startX || touch.clientX,
        startY: startTouch?.startY || touch.clientY,
        deltaX: touch.clientX - (startTouch?.startX || touch.clientX),
        deltaY: touch.clientY - (startTouch?.startY || touch.clientY),
        pressure: touch.force || 0,
        radius: touch.radiusX || touch.radiusY || 0,
        timestamp,
        velocity: { x: 0, y: 0 },
        acceleration: { x: 0, y: 0 },
      };
    });
  }, []);

  /**
   * Calculate gesture velocity with smoothing
   */
  const calculateVelocity = useCallback((touchPoints: TouchPoint[]): { x: number; y: number; magnitude: number } => {
    if (touchPoints.length < 2) return { x: 0, y: 0, magnitude: 0 };
    
    const tracker = velocityTrackerRef.current;
    const now = Date.now();
    
    // Add current position to tracker
    const centerX = touchPoints.reduce((sum, t) => sum + t.x, 0) / touchPoints.length;
    const centerY = touchPoints.reduce((sum, t) => sum + t.y, 0) / touchPoints.length;
    
    tracker.x.push(centerX);
    tracker.y.push(centerY);
    tracker.timestamps.push(now);
    
    // Keep only recent data points
    const maxDataPoints = 10;
    if (tracker.x.length > maxDataPoints) {
      tracker.x.shift();
      tracker.y.shift();
      tracker.timestamps.shift();
    }
    
    if (tracker.x.length < 2) return { x: 0, y: 0, magnitude: 0 };
    
    // Calculate velocity using linear regression
    const timeSpan = tracker.timestamps[tracker.timestamps.length - 1] - tracker.timestamps[0];
    if (timeSpan === 0) return { x: 0, y: 0, magnitude: 0 };
    
    const deltaX = tracker.x[tracker.x.length - 1] - tracker.x[0];
    const deltaY = tracker.y[tracker.y.length - 1] - tracker.y[0];
    
    const vx = deltaX / timeSpan * 1000; // pixels per second
    const vy = deltaY / timeSpan * 1000;
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    
    return { x: vx, y: vy, magnitude };
  }, []);

  /**
   * Determine gesture direction
   */
  const determineDirection = useCallback((deltaX: number, deltaY: number): GestureDirection => {
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    
    if (absX < 5 && absY < 5) return 'none';
    
    if (absX > absY * 2) {
      // Horizontal dominant
      if (deltaX > 0) return 'right';
      return 'left';
    } else if (absY > absX * 2) {
      // Vertical dominant
      if (deltaY > 0) return 'down';
      return 'up';
    } else {
      // Diagonal
      if (deltaX > 0 && deltaY > 0) return 'down-right';
      if (deltaX > 0 && deltaY < 0) return 'up-right';
      if (deltaX < 0 && deltaY > 0) return 'down-left';
      return 'up-left';
    }
  }, []);

  /**
   * Calculate gesture confidence
   */
  const calculateConfidence = useCallback((gesture: Partial<GestureInfo>): number => {
    let confidence = 1.0;
    
    // Reduce confidence based on velocity consistency
    if (gesture.velocity && gesture.velocity.magnitude < mergedConfig.swipeVelocityThreshold) {
      confidence *= 0.8;
    }
    
    // Reduce confidence based on duration
    if (gesture.duration && gesture.duration < 100) {
      confidence *= 0.5;
    }
    
    // Reduce confidence based on distance
    if (gesture.distance && gesture.distance < mergedConfig.swipeThreshold) {
      confidence *= 0.7;
    }
    
    return Math.max(0, Math.min(1, confidence));
  }, [mergedConfig]);

  /**
   * Detect tap gesture
   */
  const detectTap = useCallback((gesture: GestureInfo): boolean => {
    const { distance, duration, touchPoints } = gesture;
    
    return (
      touchPoints.length === 1 &&
      distance <= mergedConfig.tapThreshold &&
      duration <= mergedConfig.doubleTapDelay &&
      gesture.velocity.magnitude < 1.0
    );
  }, [mergedConfig]);

  /**
   * Detect double tap
   */
  const detectDoubleTap = useCallback((gesture: GestureInfo): boolean => {
    if (!lastTapRef.current) return false;
    
    const timeSinceLastTap = gesture.startTime - lastTapRef.current.time;
    const distanceFromLastTap = Math.sqrt(
      Math.pow(gesture.center.x - lastTapRef.current.position.x, 2) +
      Math.pow(gesture.center.y - lastTapRef.current.position.y, 2)
    );
    
    return (
      timeSinceLastTap <= mergedConfig.doubleTapDelay &&
      distanceFromLastTap <= mergedConfig.tapThreshold &&
      detectTap(gesture)
    );
  }, [mergedConfig, detectTap]);

  /**
   * Detect long press
   */
  const detectLongPress = useCallback((gesture: GestureInfo): boolean => {
    return (
      gesture.duration >= mergedConfig.longPressDelay &&
      gesture.distance <= mergedConfig.tapThreshold
    );
  }, [mergedConfig]);

  /**
   * Detect swipe gesture
   */
  const detectSwipe = useCallback((gesture: GestureInfo): boolean => {
    const { distance, velocity, touchPoints } = gesture;
    
    return (
      touchPoints.length === 1 &&
      distance >= mergedConfig.swipeThreshold &&
      velocity.magnitude >= mergedConfig.swipeVelocityThreshold
    );
  }, [mergedConfig]);

  /**
   * Detect pinch gesture
   */
  const detectPinch = useCallback((gesture: GestureInfo): boolean => {
    if (gesture.touchPoints.length < 2) return false;
    
    const initialDistance = Math.sqrt(
      Math.pow(gesture.touchPoints[0].startX - gesture.touchPoints[1].startX, 2) +
      Math.pow(gesture.touchPoints[0].startY - gesture.touchPoints[1].startY, 2)
    );
    
    const currentDistance = Math.sqrt(
      Math.pow(gesture.touchPoints[0].x - gesture.touchPoints[1].x, 2) +
      Math.pow(gesture.touchPoints[0].y - gesture.touchPoints[1].y, 2)
    );
    
    const scaleChange = Math.abs(currentDistance - initialDistance) / initialDistance;
    
    return scaleChange >= mergedConfig.pinchSensitivity;
  }, [mergedConfig]);

  /**
   * Detect rotation gesture
   */
  const detectRotation = useCallback((gesture: GestureInfo): boolean => {
    if (gesture.touchPoints.length < 2) return false;
    
    const initialAngle = Math.atan2(
      gesture.touchPoints[0].startY - gesture.touchPoints[1].startY,
      gesture.touchPoints[0].startX - gesture.touchPoints[1].startX
    ) * 180 / Math.PI;
    
    const currentAngle = Math.atan2(
      gesture.touchPoints[0].y - gesture.touchPoints[1].y,
      gesture.touchPoints[0].x - gesture.touchPoints[1].x
    ) * 180 / Math.PI;
    
    const rotation = Math.abs(currentAngle - initialAngle);
    
    return rotation >= mergedConfig.rotateThreshold;
  }, [mergedConfig]);

  /**
   * Create gesture information
   */
  const createGestureInfo = useCallback((
    type: GestureType,
    startTime: number,
    endTime: number,
    touchPoints: TouchPoint[]
  ): GestureInfo => {
    const duration = endTime - startTime;
    
    // Calculate center point
    const centerX = touchPoints.reduce((sum, t) => sum + t.x, 0) / touchPoints.length;
    const centerY = touchPoints.reduce((sum, t) => sum + t.y, 0) / touchPoints.length;
    
    // Calculate distance
    const distance = touchPoints.length === 1 
      ? Math.sqrt(touchPoints[0].deltaX ** 2 + touchPoints[0].deltaY ** 2)
      : 0;
    
    // Calculate velocity and acceleration
    const velocity = calculateVelocity(touchPoints);
    const direction = determineDirection(
      touchPoints[0].deltaX,
      touchPoints[0].deltaY
    );
    
    // Calculate scale and rotation for multi-touch
    let scale = 1;
    let rotation = 0;
    
    if (touchPoints.length >= 2) {
      const initialDistance = Math.sqrt(
        (touchPoints[0].startX - touchPoints[1].startX) ** 2 +
        (touchPoints[0].startY - touchPoints[1].startY) ** 2
      );
      
      const currentDistance = Math.sqrt(
        (touchPoints[0].x - touchPoints[1].x) ** 2 +
        (touchPoints[0].y - touchPoints[1].y) ** 2
      );
      
      scale = currentDistance / (initialDistance || 1);
      
      const initialAngle = Math.atan2(
        touchPoints[0].startY - touchPoints[1].startY,
        touchPoints[0].startX - touchPoints[1].startX
      ) * 180 / Math.PI;
      
      const currentAngle = Math.atan2(
        touchPoints[0].y - touchPoints[1].y,
        touchPoints[0].x - touchPoints[1].x
      ) * 180 / Math.PI;
      
      rotation = currentAngle - initialAngle;
    }
    
    // Calculate average pressure
    const pressure = touchPoints.reduce((sum, t) => sum + t.pressure, 0) / touchPoints.length;
    
    const gesture: GestureInfo = {
      type,
      startTime,
      endTime,
      duration,
      touchPoints: [...touchPoints],
      center: { x: centerX, y: centerY },
      velocity,
      acceleration: { x: 0, y: 0, magnitude: 0 }, // TODO: Implement acceleration calculation
      direction,
      angle: Math.atan2(touchPoints[0].deltaY, touchPoints[0].deltaX) * 180 / Math.PI,
      distance,
      scale,
      rotation,
      pressure,
      confidence: 0.8, // TODO: Implement confidence calculation
    };
    
    gesture.confidence = calculateConfidence(gesture);
    
    return gesture;
  }, [calculateVelocity, determineDirection, calculateConfidence]);

  /**
   * Handle touch start
   */
  const onTouchStart = useCallback((e: TouchEvent) => {
    const now = Date.now();
    const touchPoints = processTouchPoints(e.touches, now);
    
    // Reset gesture tracking
    gestureStartRef.current = {
      time: now,
      touches: touchPoints,
    };
    
    gestureCurrentRef.current = {
      touches: touchPoints,
      lastUpdate: now,
    };
    
    gestureEndRef.current = null;
    
    // Clear existing timers
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    
    // Start long press detection
    longPressTimerRef.current = setTimeout(() => {
      if (gestureStartRef.current && gestureCurrentRef.current.touches.length === 1) {
        const gesture = createGestureInfo(
          'long-press',
          gestureStartRef.current.time,
          Date.now(),
          gestureCurrentRef.current.touches
        );
        
        setActiveGesture(gesture);
        setGestureHistory(prev => [...prev, gesture]);
        
        if (callbacks.onLongPress) {
          callbacks.onLongPress(gesture);
        }
      }
    }, mergedConfig.longPressDelay);
    
    if (callbacks.onGestureStart) {
      const gesture = createGestureInfo(
        'multi-touch',
        now,
        now,
        touchPoints
      );
      callbacks.onGestureStart(gesture);
    }
  }, [processTouchPoints, createGestureInfo, callbacks, mergedConfig.longPressDelay]);

  /**
   * Handle touch move
   */
  const onTouchMove = useCallback((e: TouchEvent) => {
    const now = Date.now();
    const touchPoints = processTouchPoints(e.touches, now);
    
    gestureCurrentRef.current = {
      touches: touchPoints,
      lastUpdate: now,
    };
    
    // Clear long press if moving too much
    if (gestureStartRef.current) {
      const distance = Math.sqrt(
        (touchPoints[0].x - gestureStartRef.current.touches[0].x) ** 2 +
        (touchPoints[0].y - gestureStartRef.current.touches[0].y) ** 2
      );
      
      if (distance > mergedConfig.tapThreshold && longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }
    
    // Handle pan gesture
    if (gestureStartRef.current && touchPoints.length === 1) {
      const gesture = createGestureInfo(
        'pan',
        gestureStartRef.current.time,
        now,
        touchPoints
      );
      
      setActiveGesture(gesture);
      
      if (callbacks.onPan) {
        callbacks.onPan(gesture);
      }
    }
    
    // Handle multi-touch gestures
    if (touchPoints.length >= 2 && gestureStartRef.current) {
      const gesture = createGestureInfo(
        'multi-touch',
        gestureStartRef.current.time,
        now,
        touchPoints
      );
      
      // Detect pinch
      if (detectPinch(gesture)) {
        gesture.type = 'pinch';
        if (callbacks.onPinch) {
          callbacks.onPinch(gesture.scale, gesture);
        }
      }
      
      // Detect rotation
      if (detectRotate(gesture)) {
        gesture.type = 'rotate';
        if (callbacks.onRotate) {
          callbacks.onRotate(gesture.rotation, gesture);
        }
      }
      
      setActiveGesture(gesture);
    }
  }, [processTouchPoints, createGestureInfo, callbacks, mergedConfig.tapThreshold]);

  /**
   * Handle touch end
   */
  const onTouchEnd = useCallback((e: TouchEvent) => {
    const now = Date.now();
    
    if (!gestureStartRef.current) return;
    
    const touchPoints = gestureCurrentRef.current.touches;
    
    // Clear timers
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    gestureEndRef.current = {
      time: now,
      touches: touchPoints,
    };
    
    // Create base gesture
    const gesture = createGestureInfo(
      'tap',
      gestureStartRef.current.time,
      now,
      touchPoints
    );
    
    // Detect gesture type
    if (detectDoubleTap(gesture)) {
      gesture.type = 'double-tap';
      if (callbacks.onDoubleTap) {
        callbacks.onDoubleTap(gesture);
      }
    } else if (detectTap(gesture)) {
      gesture.type = 'tap';
      
      // Set up for double tap detection
      lastTapRef.current = {
        time: now,
        position: { x: gesture.center.x, y: gesture.center.y },
      };
      
      // Delay execution to check for double tap
      tapTimerRef.current = setTimeout(() => {
        if (callbacks.onTap) {
          callbacks.onTap(gesture);
        }
      }, mergedConfig.doubleTapDelay);
      
    } else if (detectSwipe(gesture)) {
      gesture.type = 'swipe';
      if (callbacks.onSwipe) {
        callbacks.onSwipe(gesture.direction, gesture);
      }
    }
    
    // Handle force touch
    if (gesture.pressure > mergedConfig.forceTouchThreshold) {
      gesture.type = 'force-touch';
      if (callbacks.onForceTouch) {
        callbacks.onForceTouch(gesture.pressure, gesture);
      }
    }
    
    setActiveGesture(gesture);
    setGestureHistory(prev => [...prev, gesture]);
    
    if (callbacks.onGestureEnd) {
      callbacks.onGestureEnd(gesture);
    }
    
    // Reset for next gesture
    setTimeout(() => {
      gestureStartRef.current = null;
      gestureEndRef.current = null;
      velocityTrackerRef.current = { x: [], y: [], timestamps: [] };
    }, 10);
  }, [createGestureInfo, callbacks, mergedConfig, detectDoubleTap, detectTap, detectSwipe, detectPinch, detectRotate]);

  /**
   * Clear gesture state
   */
  const clearGesture = useCallback(() => {
    setActiveGesture(null);
    gestureStartRef.current = null;
    gestureCurrentRef.current = { touches: [], lastUpdate: 0 };
    gestureEndRef.current = null;
    velocityTrackerRef.current = { x: [], y: [], timestamps: [] };
    
    if (tapTimerRef.current) {
      clearTimeout(tapTimerRef.current);
      tapTimerRef.current = null;
    }
    
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  /**
   * Get gesture history
   */
  const getGestureHistory = useCallback((limit: number = 10): GestureInfo[] => {
    return gestureHistory.slice(-limit);
  }, [gestureHistory]);

  /**
   * Check if gesture is active
   */
  const isGestureActive = useCallback((type?: GestureType): boolean => {
    if (!activeGesture) return false;
    return type ? activeGesture.type === type : true;
  }, [activeGesture]);

  return {
    // Touch event handlers
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    
    // Gesture state
    activeGesture,
    gestureHistory,
    
    // Utility functions
    clearGesture,
    getGestureHistory,
    isGestureActive,
    
    // Convenience properties
    isActive: !!activeGesture,
    gestureType: activeGesture?.type || null,
    gestureDirection: activeGesture?.direction || null,
    gestureVelocity: activeGesture?.velocity.magnitude || 0,
  };
};

/**
 * Hook for gesture-specific callbacks
 */
export const useGestureCallback = (callbacks: GestureCallbacks, deps: React.DependencyList = []) => {
  const callbackRef = useRef(callbacks);
  callbackRef.current = callbacks;
  
  return useTouchGestures({}, callbackRef.current);
};

/**
 * Hook for swipe gesture detection with specific directions
 */
export const useSwipeGesture = (
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  onSwipeUp?: () => void,
  onSwipeDown?: () => void,
  config: Partial<GestureConfig> = {}
) => {
  return useTouchGestures(config, {
    onSwipe: (direction, gesture) => {
      switch (direction) {
        case 'left':
          onSwipeLeft?.();
          break;
        case 'right':
          onSwipeRight?.();
          break;
        case 'up':
          onSwipeUp?.();
          break;
        case 'down':
          onSwipeDown?.();
          break;
      }
    },
  });
};

// Default export
export default useTouchGestures;
