// src/components/Common/SwipeActions.tsx
/**
 * Swipe Actions Component
 * Provides swipe gesture actions with customizable thresholds, animations,
 * and multiple action support for mobile interfaces
 * @module components/Common/SwipeActions
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTouchGestures, GestureConfig } from '@/hooks/useTouchGestures';
import { useResponsive } from '@/hooks/useResponsive';
import { useHaptics } from '@/hooks/useHaptics';
import { clsx } from 'clsx';

/**
 * Swipe action configuration
 */
export interface SwipeAction {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'default';
  backgroundColor?: string;
  textColor?: string;
  threshold?: number; // Custom threshold for this action
  haptic?: boolean; // Enable haptic feedback
  confirmation?: {
    message: string;
    confirmText?: string;
    cancelText?: string;
  };
}

/**
 * Swipe actions props
 */
export interface SwipeActionsProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
  threshold?: number;
  velocityThreshold?: number;
  animationDuration?: number;
  enableHaptics?: boolean;
  enableBounce?: boolean;
  maxReveal?: number;
  onSwipeStart?: () => void;
  onSwipeEnd?: () => void;
  onActionTrigger?: (action: SwipeAction) => void;
  preventDefaultOnSwipe?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * Color mapping for actions
 */
const ACTION_COLORS = {
  primary: 'bg-primary-500 hover:bg-primary-600 text-white',
  secondary: 'bg-secondary-500 hover:bg-secondary-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
  warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  error: 'bg-red-500 hover:bg-red-600 text-white',
  default: 'bg-gray-500 hover:bg-gray-600 text-white',
};

/**
 * Swipe Actions Component
 * Enables swipe gestures to reveal actions on mobile devices
 * 
 * @example
 * ```tsx
 * const actions = [
 *   { id: 'edit', label: 'Edit', icon: EditIcon, onClick: handleEdit, color: 'primary' },
 *   { id: 'delete', label: 'Delete', icon: DeleteIcon, onClick: handleDelete, color: 'error' },
 * ];
 * 
 * <SwipeActions leftActions={actions} threshold={50} enableHaptics>
 *   <div className="p-4 bg-white rounded-lg">
 *     <h3>Swipe me left or right!</h3>
 *   </div>
 * </SwipeActions>
 * ```
 */
export const SwipeActions: React.FC<SwipeActionsProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  className,
  threshold = 50,
  velocityThreshold = 0.3,
  animationDuration = 300,
  enableHaptics = true,
  enableBounce = true,
  maxReveal = 200,
  onSwipeStart,
  onSwipeEnd,
  onActionTrigger,
  preventDefaultOnSwipe = true,
  disabled = false,
  ariaLabel = 'Swipeable content with actions',
}) => {
  const { isTouch } = useResponsive();
  const { triggerHaptic } = useHaptics();
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [triggeredAction, setTriggeredAction] = useState<SwipeAction | null>(null);
  const [showConfirmation, setShowConfirmation] = useState<SwipeAction | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ x: number; time: number } | null>(null);
  const lastOffsetRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  // Combine gesture config
  const gestureConfig: GestureConfig = {
    swipeThreshold: threshold,
    swipeVelocityThreshold: velocityThreshold,
  };

  // Touch gesture handling
  const { onTouchStart, onTouchMove, onTouchEnd, activeGesture } = useTouchGestures(
    gestureConfig,
    {
      onSwipe: (direction, gesture) => {
        if (disabled) return;
        
        if (direction === 'left' && leftActions.length > 0) {
          handleSwipeLeft(gesture);
        } else if (direction === 'right' && rightActions.length > 0) {
          handleSwipeRight(gesture);
        }
      },
    }
  );

  /**
   * Handle swipe left (reveal right actions)
   */
  const handleSwipeLeft = useCallback((gesture: any) => {
    if (rightActions.length === 0) return;
    
    const actionWidth = maxReveal / rightActions.length;
    const actionIndex = Math.min(
      Math.floor(Math.abs(offset) / actionWidth),
      rightActions.length - 1
    );
    
    const targetAction = rightActions[actionIndex];
    
    if (targetAction && Math.abs(offset) > (targetAction.threshold || threshold)) {
      triggerAction(targetAction);
    }
  }, [rightActions, offset, maxReveal, threshold]);

  /**
   * Handle swipe right (reveal left actions)
   */
  const handleSwipeRight = useCallback((gesture: any) => {
    if (leftActions.length === 0) return;
    
    const actionWidth = maxReveal / leftActions.length;
    const actionIndex = Math.min(
      Math.floor(Math.abs(offset) / actionWidth),
      leftActions.length - 1
    );
    
    const targetAction = leftActions[actionIndex];
    
    if (targetAction && Math.abs(offset) > (targetAction.threshold || threshold)) {
      triggerAction(targetAction);
    }
  }, [leftActions, offset, maxReveal, threshold]);

  /**
   * Trigger an action with optional confirmation
   */
  const triggerAction = useCallback(async (action: SwipeAction) => {
    if (action.confirmation) {
      setShowConfirmation(action);
      return;
    }
    
    // Execute action
    setTriggeredAction(action);
    onActionTrigger?.(action);
    
    // Haptic feedback
    if (enableHaptics) {
      triggerHaptic('medium');
    }
    
    // Reset position
    resetPosition();
  }, [onActionTrigger, enableHaptics, triggerHaptic]);

  /**
   * Handle action confirmation
   */
  const handleConfirmation = useCallback((confirmed: boolean) => {
    if (!showConfirmation) return;
    
    if (confirmed) {
      triggerAction(showConfirmation);
    }
    
    setShowConfirmation(null);
  }, [showConfirmation, triggerAction]);

  /**
   * Reset position with animation
   */
  const resetPosition = useCallback(() => {
    setIsTransitioning(true);
    setOffset(0);
    setVelocity(0);
    
    setTimeout(() => {
      setIsTransitioning(false);
      setTriggeredAction(null);
    }, animationDuration);
  }, [animationDuration]);

  /**
   * Handle touch start
   */
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || !isTouch) return;
    
    if (preventDefaultOnSwipe) {
      e.preventDefault();
    }
    
    const touch = e.touches[0];
    dragStartRef.current = { x: touch.clientX, time: Date.now() };
    lastOffsetRef.current = offset;
    setIsDragging(true);
    
    onSwipeStart?.();
    
    // Call original touch start
    onTouchStart(e);
  }, [disabled, isTouch, preventDefaultOnSwipe, offset, onSwipeStart, onTouchStart]);

  /**
   * Handle touch move with real-time tracking
   */
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging || !dragStartRef.current) return;
    
    e.preventDefault();
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStartRef.current.x;
    const currentTime = Date.now();
    const deltaTime = currentTime - dragStartRef.current.time;
    
    // Calculate current offset
    const newOffset = lastOffsetRef.current + deltaX;
    
    // Apply resistance beyond max reveal
    const resistanceFactor = enableBounce ? 0.3 : 0;
    const constrainedOffset = Math.max(
      -maxReveal - (Math.abs(newOffset + maxReveal) * resistanceFactor),
      Math.min(maxReveal + (Math.abs(newOffset - maxReveal) * resistanceFactor), newOffset)
    );
    
    setOffset(constrainedOffset);
    
    // Calculate velocity for momentum
    if (deltaTime > 0) {
      const newVelocity = deltaX / deltaTime * 1000; // pixels per second
      setVelocity(newVelocity);
    }
    
    // Real-time action preview
    if (Math.abs(constrainedOffset) > threshold / 2) {
      const actions = constrainedOffset < 0 ? leftActions : rightActions;
      const actionWidth = maxReveal / actions.length;
      const actionIndex = Math.min(
        Math.floor(Math.abs(constrainedOffset) / actionWidth),
        actions.length - 1
      );
      
      if (actions[actionIndex] && triggeredAction?.id !== actions[actionIndex].id) {
        setTriggeredAction(actions[actionIndex]);
      }
    }
    
    // Call original touch move
    onTouchMove(e);
  }, [disabled, isDragging, offset, maxReveal, threshold, enableBounce, triggeredAction, leftActions, rightActions, onTouchMove]);

  /**
   * Handle touch end with momentum and snap
   */
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled || !isDragging) return;
    
    setIsDragging(false);
    
    // Calculate momentum-based final position
    const momentum = velocity * 0.3; // Damping factor
    const finalOffset = offset + momentum;
    
    // Determine snap position
    let targetOffset = 0;
    let shouldTriggerAction = false;
    
    if (Math.abs(finalOffset) > threshold || Math.abs(velocity) > velocityThreshold) {
      const actions = finalOffset < 0 ? leftActions : rightActions;
      if (actions.length > 0) {
        const actionWidth = maxReveal / actions.length;
        const actionIndex = Math.min(
          Math.floor(Math.abs(finalOffset) / actionWidth),
          actions.length - 1
        );
        
        if (actions[actionIndex]) {
          targetOffset = finalOffset < 0 
            ? -(actionWidth * (actionIndex + 1))
            : (actionWidth * (actionIndex + 1));
          shouldTriggerAction = true;
        }
      }
    }
    
    // Animate to target position
    setIsTransitioning(true);
    setOffset(targetOffset);
    
    setTimeout(() => {
      if (shouldTriggerAction && triggeredAction) {
        triggerAction(triggeredAction);
      } else if (targetOffset === 0) {
        resetPosition();
      }
      
      onSwipeEnd?.();
    }, animationDuration);
    
    // Call original touch end
    onTouchEnd(e);
  }, [disabled, isDragging, velocity, offset, threshold, velocityThreshold, maxReveal, leftActions, rightActions, triggeredAction, animationDuration, onSwipeEnd, onTouchEnd, triggerAction, resetPosition]);

  /**
   * Handle drag with mouse (for testing)
   */
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled || isTouch) return;
    
    e.preventDefault();
    dragStartRef.current = { x: e.clientX, time: Date.now() };
    lastOffsetRef.current = offset;
    setIsDragging(true);
    
    onSwipeStart?.();
  }, [disabled, isTouch, offset, onSwipeStart]);

  /**
   * Handle mouse move
   */
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (disabled || !isDragging || !dragStartRef.current) return;
    
    const deltaX = e.clientX - dragStartRef.current.x;
    const newOffset = lastOffsetRef.current + deltaX;
    
    setOffset(Math.max(-maxReveal, Math.min(maxReveal, newOffset)));
  }, [disabled, isDragging, maxReveal]);

  /**
   * Handle mouse up
   */
  const handleMouseUp = useCallback(() => {
    if (disabled || !isDragging) return;
    
    setIsDragging(false);
    
    if (Math.abs(offset) > threshold) {
      // Trigger action
      const actions = offset < 0 ? leftActions : rightActions;
      if (actions.length > 0) {
        triggerAction(actions[0]);
      }
    } else {
      resetPosition();
    }
    
    onSwipeEnd?.();
  }, [disabled, isDragging, offset, threshold, leftActions, rightActions, triggerAction, resetPosition, onSwipeEnd]);

  /**
   * Setup mouse event listeners
   */
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  /**
   * Calculate action visibility
   */
  const getActionVisibility = useCallback((actions: SwipeAction[], index: number) => {
    if (!actions.length) return 0;
    
    const actionWidth = maxReveal / actions.length;
    const progress = Math.abs(offset) / actionWidth;
    
    return Math.max(0, Math.min(1, progress - index));
  }, [offset, maxReveal]);

  /**
   * Render action buttons
   */
  const renderActionButton = useCallback((action: SwipeAction, index: number, side: 'left' | 'right') => {
    const visibility = getActionVisibility(side === 'left' ? leftActions : rightActions, index);
    const isTriggered = triggeredAction?.id === action.id;
    
    return (
      <button
        key={action.id}
        onClick={() => triggerAction(action)}
        disabled={disabled}
        className={clsx(
          'flex-1 flex flex-col items-center justify-center',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus:ring-2 focus:ring-white',
          ACTION_COLORS[action.color] || ACTION_COLORS.default,
          {
            'opacity-0': visibility === 0 && !isTriggered,
            'opacity-100': visibility > 0 || isTriggered,
          }
        )}
        style={{
          transform: `scale(${0.8 + (visibility * 0.2)})`,
          opacity: visibility,
        }}
        aria-label={action.label}
      >
        {action.icon && (
          <action.icon className="w-5 h-5 mb-1" />
        )}
        <span className="text-xs font-medium text-center">
          {action.label}
        </span>
      </button>
    );
  }, [getActionVisibility, triggeredAction, disabled, triggerAction]);

  if (disabled || (!isTouch && leftActions.length === 0 && rightActions.length === 0)) {
    return <>{children}</>;
  }

  return (
    <div className={clsx('relative overflow-hidden', className)}>
      {/* Action confirmation modal */}
      {showConfirmation && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 m-4 max-w-sm">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {showConfirmation.confirmation?.message}
            </h3>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => handleConfirmation(false)}
                className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                {showConfirmation.confirmation?.cancelText || 'Cancel'}
              </button>
              <button
                onClick={() => handleConfirmation(true)}
                className="flex-1 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                {showConfirmation.confirmation?.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div 
          className="absolute left-0 top-0 h-full flex"
          style={{
            width: `${Math.min(Math.abs(offset), maxReveal)}px`,
            transform: `translateX(-100%) translateX(${Math.max(0, offset)}px)`,
          }}
        >
          {leftActions.map((action, index) => renderActionButton(action, index, 'left'))}
        </div>
      )}
      
      {/* Right actions */}
      {rightActions.length > 0 && (
        <div 
          className="absolute right-0 top-0 h-full flex"
          style={{
            width: `${Math.min(Math.abs(offset), maxReveal)}px`,
            transform: `translateX(100%) translateX(${Math.min(0, offset)}px)`,
          }}
        >
          {rightActions.map((action, index) => renderActionButton(action, index, 'right'))}
        </div>
      )}
      
      {/* Main content */}
      <div
        ref={containerRef}
        className={clsx(
          'relative bg-white dark:bg-gray-900',
          'transition-transform duration-200 ease-out',
          isTransitioning && `transition-duration-${animationDuration}ms`,
          isDragging && 'cursor-grabbing'
        )}
        style={{
          transform: `translateX(${offset}px)`,
          touchAction: 'pan-y', // Allow vertical scrolling
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        aria-label={ariaLabel}
        role="button"
        tabIndex={0}
      >
        {children}
      </div>
      
      {/* Visual feedback overlay */}
      {isDragging && (
        <div 
          className="absolute inset-0 bg-primary-500 bg-opacity-5 pointer-events-none"
          style={{
            opacity: Math.min(Math.abs(offset) / maxReveal, 0.3),
          }}
        />
      )}
    </div>
  );
};

/**
 * Hook for creating swipe actions with common patterns
 */
export const useSwipeActions = () => {
  const createDeleteAction = (
    onDelete: () => void,
    confirmation?: { message: string; confirmText?: string; cancelText?: string }
  ): SwipeAction => ({
    id: 'delete',
    label: 'Delete',
    color: 'error',
    onClick: onDelete,
    confirmation,
    haptic: true,
  });

  const createEditAction = (onEdit: () => void): SwipeAction => ({
    id: 'edit',
    label: 'Edit',
    color: 'primary',
    onClick: onEdit,
    haptic: true,
  });

  const createArchiveAction = (onArchive: () => void): SwipeAction => ({
    id: 'archive',
    label: 'Archive',
    color: 'secondary',
    onClick: onArchive,
    haptic: true,
  });

  return {
    createDeleteAction,
    createEditAction,
    createArchiveAction,
  };
};

export default SwipeActions;
