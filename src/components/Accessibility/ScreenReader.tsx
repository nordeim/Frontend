// src/components/Accessibility/ScreenReader.tsx
import React, { useEffect, useState } from 'react'
import { useAnnouncer } from '@/hooks/useAnnouncer'

interface ScreenReaderProps {
  children: React.ReactNode
  className?: string
  announceOnMount?: string
  announceOnUnmount?: string
}

/**
 * Component for managing screen reader announcements
 * WCAG 2.1 AA compliant with proper ARIA live regions
 */
export const ScreenReader: React.FC<ScreenReaderProps> = ({
  children,
  className,
  announceOnMount,
  announceOnUnmount
}) => {
  const { announce } = useAnnouncer()

  useEffect(() => {
    if (announceOnMount) {
      announce(announceOnMount, { priority: 'polite', clearAfter: 3000 })
    }

    return () => {
      if (announceOnUnmount) {
        announce(announceOnUnmount, { priority: 'polite', clearAfter: 3000 })
      }
    }
  }, [announce, announceOnMount, announceOnUnmount])

  return (
    <div
      className={clsx('screen-reader', className)}
      aria-live="polite"
      aria-atomic="true"
    >
      {children}
    </div>
  )
}

ScreenReader.displayName = 'ScreenReader'

/**
 * Screen reader provider
 */
export const ScreenReaderProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  // This would provide a global context for screen reader announcements
  // For now, just render the children
  return (
    <div className="screen-reader-provider">
      {children}
    </div>
  )
}

ScreenReaderProvider.displayName = 'ScreenReaderProvider'

// Import dependencies
import { clsx } from 'clsx'
