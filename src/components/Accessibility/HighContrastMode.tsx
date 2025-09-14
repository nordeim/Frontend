// src/components/Accessibility/HighContrastMode.tsx
import React, { useEffect, useState } from 'react'
import { useHighContrast } from '@/hooks/useHighContrast'

interface HighContrastModeProps {
  children: React.ReactNode
  className?: string
  onToggle?: () => void
}

/**
 * Component for managing high contrast mode
 * WCAG 2.1 AA compliant with proper contrast ratio handling
 */
export const HighContrastMode: React.FC<HighContrastModeProps> = ({
  children,
  className,
  onToggle
}) => {
  const { isHighContrast, toggleHighContrast } = useHighContrast()

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast', isHighContrast)
    }
  }, [isHighContrast])

  const handleToggle = useCallback(() => {
    toggleHighContrast()
    onToggle?.()
  }, [toggleHighContrast, onToggle])

  return (
    <div
      className={clsx('high-contrast-mode', isHighContrast && 'high-contrast-enabled', className)}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      aria-pressed={isHighContrast}
    >
      {children}
    </div>
  )
}

HighContrastMode.displayName = 'HighContrastMode'

/**
 * High contrast toggle button
 */
export const HighContrastToggle: React.FC<{
  label?: string
  className?: string
}> = ({
  label = 'Toggle high contrast mode',
  className
}) => {
  const { isHighContrast, toggleHighContrast } = useHighContrast()

  return (
    <button
      onClick={toggleHighContrast}
      className={clsx('high-contrast-toggle', className)}
      aria-pressed={isHighContrast}
      aria-label={label}
    >
      {isHighContrast ? 'High Contrast Mode: On' : 'High Contrast Mode: Off'}
    </button>
  )
}

HighContrastToggle.displayName = 'HighContrastToggle'

/**
 * High contrast mode provider
 */
export const HighContrastProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { isHighContrast } = useHighContrast()

  return (
    <div className={clsx('high-contrast-provider', isHighContrast && 'high-contrast-enabled')}>
      {children}
    </div>
  )
}

HighContrastProvider.displayName = 'HighContrastProvider'

// Import dependencies
import { clsx } from 'clsx'
