// src/components/Navigation/BottomNavigation.tsx
/**
 * Bottom Navigation Component
 * Material Design bottom navigation with enhanced features
 * @module components/Navigation/BottomNavigation
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { useTouch } from '@/hooks/useTouch';
import { clsx } from 'clsx';

/**
 * Bottom navigation item interface
 */
export interface BottomNavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon?: React.ComponentType<{ className?: string }>;
  badge?: number;
  href?: string;
  onClick?: () => void;
  isActive?: boolean;
}

/**
 * Bottom navigation props
 */
export interface BottomNavigationProps {
  items: BottomNavItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
  variant?: 'default' | 'shifting' | 'fixed';
  showLabels?: boolean;
  enableAnimation?: boolean;
  enableHaptics?: boolean;
  ariaLabel?: string;
}

/**
 * Bottom Navigation Component
 * Material Design compliant bottom navigation with enhancements
 * 
 * @example
 * ```tsx
 * const [activeTab, setActiveTab] = useState('home');
 * 
 * const tabs = [
 *   { id: 'home', label: 'Home', icon: HomeIcon, activeIcon: HomeActiveIcon },
 *   { id: 'search', label: 'Search', icon: SearchIcon },
 *   { id: 'profile', label: 'Profile', icon: ProfileIcon, badge: 3 },
 * ];
 * 
 * <BottomNavigation
 *   items={tabs}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 *   variant="shifting"
 *   enableAnimation
 * />
 * ```
 */
export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  items,
  activeTab,
  onTabChange,
  className,
  variant = 'default',
  showLabels = true,
  enableAnimation = true,
  enableHaptics = true,
  ariaLabel = 'Bottom navigation',
}) => {
  const { isMobile } = useResponsive();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pressedTab, setPressedTab] = useState<string | null>(null);
  
  // Touch handling for better mobile experience
  const { onTouchStart, onTouchEnd, isTap } = useTouch();

  /**
   * Handle tab selection
   */
  const handleTabSelect = useCallback((item: BottomNavItem) => {
    if (item.id === activeTab) return;
    
    setIsTransitioning(true);
    
    // Haptic feedback
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    // Execute item action
    if (item.onClick) {
      item.onClick();
    }
    
    // Change active tab
    onTabChange(item.id);
    
    // Reset transition state
    setTimeout(() => setIsTransitioning(false), 200);
  }, [activeTab, onTabChange, enableHaptics]);

  /**
   * Handle touch interactions
   */
  const handleTouchStart = useCallback((tabId: string) => (e: React.TouchEvent) => {
    setPressedTab(tabId);
    onTouchStart(e.nativeEvent);
  }, [onTouchStart]);

  const handleTouchEnd = useCallback((item: BottomNavItem) => (e: React.TouchEvent) => {
    onTouchEnd(e.nativeEvent);
    
    if (isTap()) {
      handleTabSelect(item);
    }
    
    setPressedTab(null);
  }, [onTouchEnd, isTap, handleTabSelect]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent, item: BottomNavItem) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleTabSelect(item);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        const currentIndex = items.findIndex(i => i.id === item.id);
        if (currentIndex > 0) {
          onTabChange(items[currentIndex - 1].id);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        const currentIndexRight = items.findIndex(i => i.id === item.id);
        if (currentIndexRight < items.length - 1) {
          onTabChange(items[currentIndexRight + 1].id);
        }
        break;
    }
  }, [items, onTabChange, handleTabSelect]);

  /**
   * Get animation styles based on variant
   */
  const getAnimationStyles = useCallback((item: BottomNavItem, index: number) => {
    if (!enableAnimation) return {};
    
    const isActive = item.id === activeTab;
    const isPressed = pressedTab === item.id;
    
    switch (variant) {
      case 'shifting':
        return {
          transform: isActive ? 'scale(1.1)' : 'scale(1)',
          transition: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        };
      case 'fixed':
        return {
          transform: isPressed ? 'scale(0.95)' : 'scale(1)',
          transition: 'transform 150ms ease-out',
        };
      default:
        return {
          transform: isActive || isPressed ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 200ms ease-out',
        };
    }
  }, [activeTab, pressedTab, variant, enableAnimation]);

  // Don't render if not on mobile
  if (!isMobile) return null;

  const baseClasses = clsx(
    'fixed bottom-0 left-0 right-0 z-50',
    'bg-white dark:bg-gray-900',
    'border-t border-gray-200 dark:border-gray-700',
    'h-16 safe-area-bottom',
    className
  );

  return (
    <nav
      className={baseClasses}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div className="flex h-full relative">
        {items.map((item, index) => {
          const isActive = item.id === activeTab;
          const animationStyles = getAnimationStyles(item, index);

          return (
            <button
              key={item.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`${item.id}-panel`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleTabSelect(item)}
              onTouchStart={handleTouchStart(item.id)}
              onTouchEnd={handleTouchEnd(item)}
              onKeyDown={(e) => handleKeyDown(e, item)}
              className={clsx(
                'flex-1 flex flex-col items-center justify-center',
                'relative overflow-hidden',
                'transition-all duration-200 ease-out',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                'hover:bg-gray-50 dark:hover:bg-gray-800',
                isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400',
                variant === 'shifting' && isActive && 'bg-primary-50 dark:bg-primary-900/20'
              )}
              style={animationStyles}
            >
              {/* Icon with badge support */}
              <div className="relative mb-1">
                {isActive && item.activeIcon ? (
                  <item.activeIcon className="w-6 h-6" />
                ) : (
                  <item.icon className="w-6 h-6" />
                )}
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <span className={clsx(
                    'absolute -top-1 -right-2 flex items-center justify-center',
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
                  'text-xs font-medium transition-all duration-200',
                  variant === 'shifting' && isActive ? 'opacity-100' : 'opacity-70',
                  variant === 'shifting' && !isActive && 'scale-0'
                )}>
                  {item.label}
                </span>
              )}
              
              {/* Ripple effect */}
              {variant === 'shifting' && isActive && (
                <div className="absolute inset-0 bg-primary-500 opacity-10 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Active indicator */}
      {variant !== 'shifting' && (
        <div 
          className="absolute bottom-0 h-1 bg-primary-600 dark:bg-primary-400 rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${100 / items.length * 0.6}%`,
            left: `${items.findIndex(item => item.id === activeTab) * (100 / items.length) + (100 / items.length) * 0.2}%`,
          }}
          aria-hidden="true"
        />
      )}
    </nav>
  );
};

/**
 * Bottom navigation with floating action button
 */
export const BottomNavigationWithFab: React.FC<BottomNavigationProps & {
  fabIcon: React.ComponentType<{ className?: string }>;
  onFabClick: () => void;
  fabPosition?: 'center' | 'end';
}> = ({
  fabIcon: FabIcon,
  onFabClick,
  fabPosition = 'center',
  ...bottomNavProps
}) => {
  const items = bottomNavProps.items;
  const fabIndex = fabPosition === 'center' ? Math.floor(items.length / 2) : items.length;
  
  return (
    <div className="relative">
      <BottomNavigation {...bottomNavProps} />
      
      <button
        onClick={onFabClick}
        className={clsx(
          'fixed bottom-20 z-60 w-14 h-14 rounded-full',
          'bg-primary-600 hover:bg-primary-700 text-white',
          'shadow-lg hover:shadow-xl transition-all duration-200',
          'flex items-center justify-center',
          'focus:outline-none focus:ring-2 focus:ring-primary-500',
          fabPosition === 'center' ? 'left-1/2 -translate-x-1/2' : 'right-6'
        )}
        aria-label="Floating action button"
      >
        <FabIcon className="w-6 h-6" />
      </button>
    </div>
  );
};

export default BottomNavigation;
