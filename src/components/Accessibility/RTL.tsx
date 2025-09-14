// src/components/Accessibility/RTL.tsx
import React, { useEffect, useState } from 'react'
import { useRTL } from '@/hooks/useRTL'

interface RTLProps {
  children: React.ReactNode
  className?: string
  language?: string
}

/**
 * Component for managing RTL (Right-to-Left) language support
 * WCAG 2.1 AA compliant with proper text direction handling
 */
export const RTL: React.FC<RTLProps> = ({
  children,
  className,
  language
}) => {
  const { isRTL, direction, mirrorClass, logicalStyles } = useRTL()

  useEffect(() => {
    if (typeof document !== 'undefined' && language) {
      document.documentElement.setAttribute('lang', language)
      document.documentElement.setAttribute('dir', direction)
    }
  }, [language, direction])

  return (
    <div
      className={clsx('rtl', mirrorClass, className)}
      style={{
        direction,
        ...logicalStyles
      }}
    >
      {children}
    </div>
  )
}

RTL.displayName = 'RTL'

/**
 * RTL provider
 */
export const RTLProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  // This would provide a global context for RTL support
  // For now, just render the children
  return (
    <div className="rtl-provider">
      {children}
    </div>
  )
}

RTLProvider.displayName = 'RTLProvider'

// Import dependencies
import { clsx } from 'clsx'
