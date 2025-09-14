// src/components/Accessibility/KeyboardNavigation.tsx
import React, { useEffect, useState } from 'react'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

interface KeyboardNavigationProps {
  children: React.ReactNode
  className?: string
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  onEnter?: () => void
  onSpace?: () => void
  onEscape?: () => void
  onHome?: () => void
  onEnd?: () => void
  onPageUp?: () => void
  onPageDown?: () => void
  onDelete?: () => void
  onBackspace?: () => void
}

/**
 * Component for managing keyboard navigation
 * WCAG 2.1 AA compliant with proper keyboard support
 */
export const KeyboardNavigation: React.FC<KeyboardNavigationProps> = ({
  children,
  className,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  onShiftTab,
  onEnter,
  onSpace,
  onEscape,
  onHome,
  onEnd,
  onPageUp,
  onPageDown,
  onDelete,
  onBackspace
}) => {
  const { addShortcut, removeShortcut, clearShortcuts, setEnabled } = useKeyboardNavigation({
    enableArrowNavigation: true,
    enableTabNavigation: true,
    enableEscape: true,
    enableEnter: true,
    enableSpace: true,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab,
    onEnter,
    onSpace,
    onEscape,
    onHome,
    onEnd,
    onPageUp,
    onPageDown,
    onDelete,
    onBackspace
  })

  useEffect(() => {
    // Add custom shortcuts if needed
    // Example: addShortcut({ key: 's', modifiers: ['ctrl'], handler: () => console.log('Ctrl+S pressed') })

    return () => {
      // Clean up shortcuts on unmount
      clearShortcuts()
    }
  }, [clearShortcuts])

  return (
    <div
      className={clsx('keyboard-navigation', className)}
      tabIndex={0}
    >
      {children}
    </div>
  )
}

KeyboardNavigation.displayName = 'KeyboardNavigation'

/**
 * Keyboard navigation provider
 */
export const KeyboardNavigationProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  // This would provide a global context for keyboard navigation
  // For now, just render the children
  return (
    <div className="keyboard-navigation-provider">
      {children}
    </div>
  )
}

KeyboardNavigationProvider.displayName = 'KeyboardNavigationProvider'

// Import dependencies
import { clsx } from 'clsx'
