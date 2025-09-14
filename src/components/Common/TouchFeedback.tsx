// src/components/Common/TouchFeedback.tsx
/**
 * Touch Feedback Component
 * Provides visual and haptic feedback for touch interactions
 * @module components/Common/TouchFeedback
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useHaptics } from '@/hooks/useHaptics';
import { useResponsive } from '@/hooks/useResponsive';
import { clsx } from 'clsx';

/**
 * Touch feedback types
 */
export type TouchFeedbackType = 
  | 'ripple'
  | 'scale'
  | 'opacity'
  | 'highlight'
  | 'glow'
  | 'pulse'
  | 'bounce';

/**
 * Touch feedback configuration
 */
export interface TouchFeedbackConfig {
  type: TouchFeedbackType;
  duration?: number;
  scale?: number;
  opacity?: number;
  color?: string;
  size?: number;
  intensity?: number;
}

/**
 * Touch feedback props
 */
export interface TouchFeedbackProps {
  children: React.ReactNode;
  feedback?: TouchFeedbackType | TouchFeedbackConfig;
  haptic?: 'light' | 'medium' | 'heavy' | boolean;
  disabled?: boolean;
  className?: string;
  onTouchStart?: (e: React.TouchEvent) => void;
  onTouchEnd?: (e: React.TouchEvent) => void;
  onMouseDown?: (e: React.MouseEvent) => void;
  onMouseUp?: (e: React.MouseEvent) => void;
  enableMouseEvents?: boolean;
  enableKeyboardEvents?: boolean;
  ariaLabel?: string;
}

/**
 * Ripple effect component
 */
export interface RippleEffectProps {
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
}

const RippleEffect: React.FC<RippleEffectProps> = ({ x, y, size, color, duration }) => {
  return (
    <span
      className="absolute rounded-full pointer-events-none"
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        backgroundColor: color,
        transform: 'translate(-50%, -50%)',
        animation: `ripple ${duration}ms ease-out`,
      }}
    />
  );
};

/**
 * Touch Feedback Component
 * Provides visual and haptic feedback for touch interactions
 * 
 * @example
 * ```tsx
 * <TouchFeedback feedback="ripple" haptic="medium">
 *   <button className="px-4 py-2 bg-blue-500 text-white rounded-lg">
 *     Touch Me
 *   </button>
 * </TouchFeedback>
 * 
 * <TouchFeedback 
 *   feedback={{ type: 'scale', scale: 0.95, duration: 200 }}
 *   haptic={true}
 * >
 *   <div className="p-4 bg-gray-100 rounded-lg">
 *     Custom Feedback
 *   </div>
 * </TouchFeedback>
 */
export const TouchFeedback: React.FC<TouchFeedbackProps> = ({
  children,
  feedback = 'ripple',
  haptic = true,
  disabled = false,
  className,
  onTouchStart,
  onTouchEnd,
  onMouseDown,
  onMouseUp,
  enableMouseEvents = true,
  enableKeyboardEvents = true,
  ariaLabel,
}) => {
  const { isTouch } = useResponsive();
  const { triggerHaptic } = useHaptics();
  const [isPressed, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<RippleEffectProps[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Parse feedback configuration
  const feedbackConfig: TouchFeedbackConfig = useMemo(() => {
    if (typeof feedback === 'string') {
      return { type: feedback };
    }
    return feedback;
  }, [feedback]);

  /**
   * Get feedback configuration with defaults
   */
  const getFeedbackConfig = useCallback((): Required<TouchFeedbackConfig> => {
    const defaults: Record<TouchFeedbackType, Required<TouchFeedbackConfig>> = {
      ripple: { type: 'ripple', duration: 600, scale: 1, opacity: 0.3, color: 'rgba(255, 255, 255, 0.3)', size: 100, intensity: 1 },
      scale: { type: 'scale', duration: 200, scale: 0.95, opacity: 1, color: 'transparent', size: 100, intensity: 1 },
      opacity: { type: 'opacity', duration: 200, scale: 1, opacity: 0.7, color: 'transparent', size: 100, intensity: 1 },
      highlight: { type: 'highlight', duration: 200, scale: 1, opacity: 1, color: 'rgba(59, 130, 246, 0.1)', size: 100, intensity: 1 },
      glow: { type: 'glow', duration: 300, scale: 1, opacity: 1, color: 'rgba(59, 130, 246, 0.5)', size: 120, intensity: 1 },
      pulse: { type: 'pulse', duration: 1000, scale: 1, opacity: 1, color: 'rgba(59, 130, 246, 0.2)', size: 100, intensity: 1 },
      bounce: { type: 'bounce', duration: 300, scale: 1, opacity: 1, color: 'transparent', size: 100, intensity: 1 },
    };
    
    return { ...defaults[feedbackConfig.type], ...feedbackConfig };
  }, [feedbackConfig]);

  /**
   * Create ripple effect
   */
  const createRipple = useCallback((x: number, y: number) => {
    const config = getFeedbackConfig();
    const ripple: RippleEffectProps = {
      x,
      y,
      size: config.size,
      color: config.color,
      duration: config.duration,
    };
    
    setRipples(prev => [...prev, ripple]);
    
    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== ripple));
    }, config.duration);
  }, [getFeedbackConfig]);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(true);
    
    // Haptic feedback
    if (haptic && isTouch) {
      const hapticType = typeof haptic === 'string' ? haptic : 'light';
      triggerHaptic(hapticType);
    }
    
    // Create visual feedback
    if (feedbackConfig.type === 'ripple') {
      const touch = e.touches[0];
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        createRipple(touch.clientX - rect.left, touch.clientY - rect.top);
      }
    }
    
    // Call custom handler
    onTouchStart?.(e);
  }, [disabled, haptic, isTouch, feedbackConfig.type, triggerHaptic, createRipple, onTouchStart]);

  /**
   * Handle touch end
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    setIsPressed(false);
    
    // Call custom handler
    onTouchEnd?.(e);
  }, [disabled, onTouchEnd]);

  /**
   * Handle mouse events (for testing/desktop)
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || !enableMouseEvents) return;
    
    setIsPressed(true);
    
    // Create visual feedback
    if (feedbackConfig.type === 'ripple') {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        createRipple(e.clientX - rect.left, e.clientY - rect.top);
      }
    }
    
    onMouseDown?.(e);
  }, [disabled, enableMouseEvents, feedbackConfig.type, createRipple, onMouseDown]);

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    setIsPressed(false);
    onMouseUp?.(e);
  }, [disabled, onMouseUp]);

  /**
   * Handle keyboard events
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboardEvents) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsPressed(true);
      
      // Simulate feedback
      if (feedbackConfig.type === 'ripple') {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const centerX = rect.width / 2;
          const centerY = rect.height / 2;
          createRipple(centerX, centerY);
        }
      }
    }
  }, [enableKeyboardEvents, feedbackConfig.type, createRipple]);

  const handleKeyUp = useCallback((e: React.KeyboardEvent) => {
    if (!enableKeyboardEvents) return;
    
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPressed(false);
    }
  }, [enableKeyboardEvents]);

  /**
   * Get CSS classes for feedback effect
   */
  const getFeedbackClasses = useCallback(() => {
    const config = getFeedbackConfig();
    
    switch (config.type) {
      case 'scale':
        return isPressed ? `transform scale-${config.scale * 100}` : 'transform scale-100';
      case 'opacity':
        return isPressed ? `opacity-${config.opacity * 100}` : 'opacity-100';
      case 'highlight':
        return isPressed ? `bg-opacity-${config.opacity * 100}` : 'bg-opacity-100';
      case 'glow':
        return isPressed ? 'shadow-lg' : 'shadow-none';
      case 'pulse':
        return isPressed ? 'animate-pulse' : '';
      case 'bounce':
        return isPressed ? 'animate-bounce' : '';
      default:
        return '';
    }
  }, [isPressed, getFeedbackConfig]);

  // Add CSS animation for ripple
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes ripple {
        0% {
          transform: translate(-50%, -50%) scale(0);
          opacity: 0.5;
        }
        100% {
          transform: translate(-50%, -50%) scale(4);
          opacity: 0;
        }
      }
      .ripple-animation {
        animation: ripple 0.6s ease-out;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const baseClasses = clsx(
    'relative overflow-hidden select-none',
    'transition-all duration-200 ease-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
    getFeedbackClasses(),
    {
      'cursor-pointer': !disabled,
      'cursor-not-allowed opacity-50': disabled,
      'transform-gpu': isPressed, // Enable hardware acceleration
    },
    className
  );

  return (
    <div
      ref={containerRef}
      className={baseClasses}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={enableMouseEvents ? handleMouseDown : undefined}
      onMouseUp={enableMouseEvents ? handleMouseUp : undefined}
      onKeyDown={enableKeyboardEvents ? handleKeyDown : undefined}
      onKeyUp={enableKeyboardEvents ? handleKeyUp : undefined}
      tabIndex={disabled ? -1 : 0}
      role="button"
      aria-label={ariaLabel}
      aria-pressed={isPressed}
      aria-disabled={disabled}
    >
      {children}
      
      {/* Ripple effects */}
      {feedbackConfig.type === 'ripple' && ripples.map((ripple, index) => (
        <RippleEffect key={index} {...ripple} />
      ))}
      
      {/* Glow effect overlay */}
      {feedbackConfig.type === 'glow' && isPressed && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-inherit"
          style={{
            boxShadow: `0 0 ${getFeedbackConfig().size}px ${getFeedbackConfig().color}`,
          }}
        />
      )}
      
      {/* Highlight effect overlay */}
      {feedbackConfig.type === 'highlight' && isPressed && (
        <div 
          className="absolute inset-0 pointer-events-none rounded-inherit"
          style={{
            backgroundColor: getFeedbackConfig().color,
          }}
        />
      )}
    </div>
  );
};

/**
 * Touch feedback wrapper for lists
 */
export const TouchFeedbackList: React.FC<{
  children: React.ReactNode;
  onItemTouch?: (index: number, e: React.TouchEvent) => void;
  feedback?: TouchFeedbackType | TouchFeedbackConfig;
  haptic?: 'light' | 'medium' | 'heavy' | boolean;
  className?: string;
}> = ({ children, onItemTouch, feedback = 'highlight', haptic = 'light', className }) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={clsx('space-y-2', className)}>
      {childrenArray.map((child, index) => (
        <TouchFeedback
          key={index}
          feedback={feedback}
          haptic={haptic}
          onTouchStart={(e) => onItemTouch?.(index, e)}
        >
          {child}
        </TouchFeedback>
      ))}
    </div>
  );
};

/**
 * Touch feedback for buttons with loading states
 */
export const TouchFeedbackButton: React.FC<TouchFeedbackProps & {
  loading?: boolean;
  loadingText?: string;
}> = ({ loading, loadingText, children, ...props }) => {
  return (
    <TouchFeedback {...props} disabled={props.disabled || loading}>
      <div className="relative">
        {children}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
            {loadingText && <span className="ml-2">{loadingText}</span>}
          </div>
        )}
      </div>
    </TouchFeedback>
  );
};

export default TouchFeedback;
