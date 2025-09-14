// src/components/Common/GestureRecognizer.tsx
/**
 * Gesture Recognizer Component
 * Provides a wrapper for advanced gesture pattern recognition with visual feedback
 * @module components/Common/GestureRecognizer
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useGestureRecognizer } from '@/hooks/useGestureRecognizer';
import { GesturePattern, RecognizedGesture } from '@/hooks/useGestureRecognizer';
import { useResponsive } from '@/hooks/useResponsive';
import { clsx } from 'clsx';

/**
 * Gesture recognizer props
 */
export interface GestureRecognizerProps {
  children: React.ReactNode;
  patterns?: GesturePattern[];
  config?: Partial<GestureRecognizerConfig>;
  onGestureRecognized?: (gesture: RecognizedGesture) => void;
  onGestureStart?: () => void;
  onGestureEnd?: () => void;
  className?: string;
  feedback?: 'visual' | 'haptic' | 'none';
  feedbackConfig?: TouchFeedbackConfig;
  haptic?: 'light' | 'medium' | 'heavy' | boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Gesture Recognizer Component
 * Enables advanced gesture recognition with visual and haptic feedback
 * 
 * @example
 * ```tsx
 * const customPatterns = [
 *   {
 *     id: 'custom-checkmark',
 *     name: 'Custom Checkmark',
 *     points: [
 *       { x: 0.2, y: 0.6, timestamp: 0 },
 *       { x: 0.4, y: 0.8, timestamp: 100 },
 *       { x: 0.8, y: 0.2, timestamp: 200 },
 *     ],
 *     confidence: 0.9,
 *   },
 * ];
 * 
 * <GestureRecognizer
 *   patterns={customPatterns}
 *   onGestureRecognized={(gesture) => console.log('Recognized:', gesture.pattern.name)}
 *   feedback="visual"
 * >
 *   <div className="p-4 bg-white rounded-lg">
 *     <h3>Draw a checkmark</h3>
 *   </div>
 * </GestureRecognizer>
 * ```
 */
export const GestureRecognizer: React.FC<GestureRecognizerProps> = ({
  children,
  patterns = [],
  config = {},
  onGestureRecognized,
  onGestureStart,
  onGestureEnd,
  className,
  feedback = 'visual',
  feedbackConfig = { type: 'highlight' },
  haptic = 'light',
  disabled = false,
  ariaLabel = 'Gesture recognizer',
}) => {
  const { isTouch } = useResponsive();
  const { isRecording, recognizedGesture, startRecording, addPoint, stopRecording } = useGestureRecognizer(patterns, config);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gesturePath, setGesturePath] = useState<string>('');
  const [gesturePoints, setGesturePoints] = useState<GesturePoint[]>([]);
  const [feedbackElement, setFeedbackElement] = useState<JSX.Element | null>(null);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    onGestureStart?.();
    startRecording();
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      addPoint({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now(),
      });
    }
    
    setIsDrawing(true);
  }, [disabled, onGestureStart, startRecording, addPoint]);

  /**
   * Handle touch move
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    const touch = e.touches[0];
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      addPoint({
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        timestamp: Date.now(),
      });
    }
  }, [isDrawing, disabled, addPoint]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    stopRecording();
    setIsDrawing(false);
    
    onGestureEnd?.();
    
    if (recognizedGesture) {
      onGestureRecognized?.(recognizedGesture);
      
      // Visual feedback
      if (feedback === 'visual') {
        setFeedbackElement(
          <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg pointer-events-none" />
        );
        
        setTimeout(() => {
          setFeedbackElement(null);
        }, 1000);
      }
      
      // Haptic feedback
      if (feedback === 'haptic' || haptic) {
        const hapticType = typeof haptic === 'string' ? haptic : 'light';
        // Trigger haptic feedback (implementation depends on platform)
        console.log('Haptic feedback:', hapticType);
      }
    }
  }, [isDrawing, disabled, stopRecording, recognizedGesture, onGestureRecognized, onGestureEnd, feedback, haptic]);

  /**
   * Handle mouse events (for testing/desktop)
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || !isTouch) return;
    
    onGestureStart?.();
    startRecording();
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      addPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        timestamp: Date.now(),
      });
    }
    
    setIsDrawing(true);
  }, [disabled, isTouch, onGestureStart, startRecording, addPoint]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDrawing || disabled || !isTouch) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      addPoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        timestamp: Date.now(),
      });
    }
  }, [isDrawing, disabled, isTouch, addPoint]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isDrawing || disabled || !isTouch) return;
    
    stopRecording();
    setIsDrawing(false);
    
    onGestureEnd?.();
    
    if (recognizedGesture) {
      onGestureRecognized?.(recognizedGesture);
    }
  }, [isDrawing, disabled, isTouch, stopRecording, recognizedGesture, onGestureRecognized, onGestureEnd]);

  /**
   * Setup mouse event listeners
   */
  useEffect(() => {
    if (isDrawing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDrawing, handleMouseMove, handleMouseUp]);

  /**
   * Update gesture path for visual feedback
   */
  useEffect(() => {
    if (gesturePoints.length === 0) {
      setGesturePath('');
      return;
    }
    
    const path = gesturePoints.map((point, index) => {
      if (index === 0) {
        return `M${point.x},${point.y}`;
      }
      return `L${point.x},${point.y}`;
    }).join(' ');
    
    setGesturePath(path);
  }, [gesturePoints]);

  /**
   * Render visual feedback
   */
  const renderVisualFeedback = useCallback(() => {
    if (feedback !== 'visual') return null;
    
    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        viewBox={`0 0 ${containerRef.current?.clientWidth || 100} ${containerRef.current?.clientHeight || 100}`}
      >
        <path
          d={gesturePath}
          fill="none"
          stroke="rgba(59, 130, 246, 0.8)"
          strokeWidth="2"
        />
      </svg>
    );
  }, [feedback, gesturePath]);

  return (
    <div
      ref={containerRef}
      className={clsx('relative overflow-hidden', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      aria-label={ariaLabel}
      role="button"
      tabIndex={0}
    >
      {children}
      
      {/* Visual feedback */}
      {renderVisualFeedback()}
      
      {/* Feedback element */}
      {feedbackElement}
    </div>
  );
};

export default GestureRecognizer;
