// src/components/Navigation/MobileNavigation.tsx
/**
 * Mobile Navigation Component
 * Provides mobile-first navigation with touch gestures and accessibility
 * @module components/Navigation/MobileNavigation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { useAppDispatch, useAppSelector } from '@/store';
import { selectIsMobileMenuOpen, toggleMobileMenu } from '@/store/slices/uiSlice';
import { useTouch } from '@/hooks/useTouch';
import { clsx } from 'clsx';

/**
 * Navigation item interface
 */
export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: number;
  isActive?: boolean;
  isDisabled?: boolean;
}

/**
 * Mobile navigation props
 */
export interface MobileNavigationProps {
  items: NavigationItem[];
  className?: string;
  position?: 'top' | 'bottom';
  variant?: 'default' | 'floating';
  showLabels?: boolean;
  enableGestures?: boolean;
  enableHaptics?: boolean;
  ariaLabel?: string;
}

/**
 * Mobile Navigation Component
 * Provides touch-optimized navigation for mobile devices
 * 
 * @example
 * ```tsx
 * const navigationItems = [
 *   { id: 'home', label: 'Home', icon: HomeIcon, href: '/' },
 *   { id: 'chats', label: 'Chats', icon: ChatIcon, href: '/chats', badge: 3 },
 *   { id: 'profile', label: 'Profile', icon: UserIcon, href: '/profile' },
 * ];
 * 
 * <MobileNavigation items={navigationItems} position="bottom" enableGestures />
 * ```
 */
export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  items,
  className,
  position = 'bottom',
  variant = 'default',
  showLabels = true,
  enableGestures = true,
  enableHaptics = true,
  ariaLabel = 'Mobile navigation',
}) => {
  const { isMobile, isTouch } = useResponsive();
  const dispatch = useAppDispatch();
  const isMenuOpen = useAppSelector(selectIsMobileMenuOpen);
  const [activeItem, setActiveItem] = useState<string>(items[0]?.id || '');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Touch gesture handling
  const { onTouchStart, onTouchEnd, isSwipe, getSwipeDirection } = useTouch();

  /**
   * Handle navigation item click
   */
  const handleItemClick = useCallback((item: NavigationItem) => {
    if (item.isDisabled) return;
    
    setActiveItem(item.id);
    
    // Haptic feedback if enabled
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Execute item action
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      // Handle navigation
      window.location.href = item.href;
    }
    
    // Close menu if open
    if (isMenuOpen) {
      dispatch(toggleMobileMenu());
    }
  }, [dispatch, isMenuOpen, enableHaptics]);

  /**
   * Handle swipe gestures for navigation
   */
  const handleSwipeGesture = useCallback((e: React.TouchEvent) => {
    if (!enableGestures || !isTouch) return;
    
    const gestureResult = onTouchEnd(e.nativeEvent);
    if (gestureResult && isSwipe()) {
      const direction = getSwipeDirection();
      
      if (direction === 'left' || direction === 'right') {
        const currentIndex = items.findIndex(item => item.id === activeItem);
        let newIndex = currentIndex;
        
        if (direction === 'left' && currentIndex < items.length - 1) {
          newIndex = currentIndex + 1;
        } else if (direction === 'right' && currentIndex > 0) {
          newIndex = currentIndex - 1;
        }
        
        if (newIndex !== currentIndex) {
          handleItemClick(items[newIndex]);
        }
      }
    }
  }, [enableGestures, isTouch, onTouchEnd, isSwipe, getSwipeDirection, items, activeItem, handleItemClick]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const currentIndex = items.findIndex(item => item.id === activeItem);
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (currentIndex > 0) {
          handleItemClick(items[currentIndex - 1]);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (currentIndex < items.length - 1) {
          handleItemClick(items[currentIndex + 1]);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleItemClick(items[currentIndex]);
        break;
      case 'Home':
        e.preventDefault();
        handleItemClick(items[0]);
        break;
      case 'End':
        e.preventDefault();
        handleItemClick(items[items.length - 1]);
        break;
    }
  }, [items, activeItem, handleItemClick]);

  /**
   * Auto-hide on desktop
   */
  useEffect(() => {
    if (!isMobile && position === 'bottom') {
      // Hide navigation on desktop if at bottom
      setIsTransitioning(true);
      const timer = setTimeout(() => setIsTransitioning(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isMobile, position]);

  // Don't render on desktop unless explicitly needed
  if (!isMobile && position === 'bottom' && variant === 'default') {
    return null;
  }

  const baseClasses = clsx(
    'fixed z-50 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700',
    {
      'top-0 left-0 right-0 border-b': position === 'top',
      'bottom-0 left-0 right-0 border-t': position === 'bottom',
    },
    variant === 'floating' && 'mx-4 mb-4 rounded-lg shadow-lg border',
    isTransitioning && 'transition-all duration-300',
    className
  );

  return (
    <nav
      className={baseClasses}
      role="navigation"
      aria-label={ariaLabel}
      onTouchStart={enableGestures ? onTouchStart : undefined}
      onTouchEnd={handleSwipeGesture}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className={clsx(
        'flex items-center',
        position === 'top' ? 'px-4 py-2' : 'px-2 py-2',
        variant === 'floating' ? 'px-4 py-3' : ''
      )}>
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item)}
            disabled={item.isDisabled}
            className={clsx(
              'relative flex flex-col items-center justify-center',
              'transition-all duration-200 ease-in-out',
              'hover:bg-gray-100 dark:hover:bg-gray-800',
              'focus:outline-none focus:ring-2 focus:ring-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              variant === 'floating' ? 'flex-1 py-2' : 'flex-1 py-1',
              {
                'text-primary-600 dark:text-primary-400': item.id === activeItem,
                'text-gray-600 dark:text-gray-400': item.id !== activeItem,
              }
            )}
            aria-label={item.label}
            aria-current={item.id === activeItem ? 'page' : undefined}
            aria-disabled={item.isDisabled}
            role="tab"
            tabIndex={item.isDisabled ? -1 : 0}
          >
            {/* Icon with badge support */}
            <div className="relative">
              <item.icon className={clsx(
                'w-6 h-6 transition-transform duration-200',
                item.id === activeItem ? 'scale-110' : 'scale-100'
              )} />
              
              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span className={clsx(
                  'absolute -top-1 -right-1 flex items-center justify-center',
                  'w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full',
                  'animate-pulse'
                )}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </div>
            
            {/* Label */}
            {showLabels && (
              <span className={clsx(
                'text-xs mt-1 font-medium transition-all duration-200',
                item.id === activeItem ? 'opacity-100' : 'opacity-70'
              )}>
                {item.label}
              </span>
            )}
            
            {/* Active indicator */}
            {item.id === activeItem && (
              <div className={clsx(
                'absolute bottom-0 left-1/2 transform -translate-x-1/2',
                'w-1 h-1 bg-primary-600 dark:bg-primary-400 rounded-full',
                position === 'bottom' ? '-bottom-1' : '-top-1'
              )} />
            )}
          </button>
        ))}
      </div>
      
      {/* Active item indicator bar */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 bg-primary-600 dark:bg-primary-400 transition-all duration-300 ease-out"
        style={{
          width: `${100 / items.length}%`,
          transform: `translateX(${items.findIndex(item => item.id === activeItem) * 100}%)`,
        }}
        aria-hidden="true"
      />
    </nav>
  );
};

/**
 * Floating Action Button for mobile navigation
 */
export const FloatingNavButton: React.FC<{
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  color?: 'primary' | 'secondary' | 'accent';
}> = ({
  onClick,
  icon: Icon,
  label,
  position = 'bottom-right',
  color = 'primary',
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  const colorClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-600 hover:bg-secondary-700 text-white',
    accent: 'bg-accent-600 hover:bg-accent-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      className={clsx(
        'fixed z-50 p-4 rounded-full shadow-lg transition-all duration-200',
        'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2',
        positionClasses[position],
        colorClasses[color]
      )}
      aria-label={label || 'Floating action button'}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
};

export default MobileNavigation;
