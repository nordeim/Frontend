// src/components/Accessibility/TextScaling.tsx
import React, { useEffect, useState } from 'react'
import { useTextScalingUtils } from '@/hooks/useHighContrast'

interface TextScalingProps {
  children: React.ReactNode
  className?: string
  baseFontSize?: number
}

/**
 * Component for managing text scaling support
 * WCAG 2.1 AA compliant with proper text scaling handling
 */
export const TextScaling: React.FC<TextScalingProps> = ({
  children,
  className,
  baseFontSize = 16
}) => {
  const { scale, getFontSize } = useTextScalingUtils()
  const [fontSize, setFontSize] = useState(baseFontSize)

  useEffect(() => {
    setFontSize(getFontSize(baseFontSize))
  }, [scale, getFontSize, baseFontSize])

  return (
    <div
      className={clsx('text-scaling', className)}
      style={{ fontSize: `${fontSize}px` }}
    >
      {children}
    </div>
  )
}

TextScaling.displayName = 'TextScaling'

/**
 * Text scaling toggle button
 */
export const TextScalingToggle: React.FC<{
  label?: string
  className?: string
}> = ({
  label = 'Toggle text scaling',
  className
}) => {
  const { scale, setScale } = useTextScalingUtils()

  const handleToggle = useCallback(() => {
    setScale(scale === 1 ? 1.5 : 1)
  }, [scale, setScale])

  return (
    <button
      onClick={handleToggle}
      className={clsx('text-scaling-toggle', className)}
      aria-label={label}
    >
      {scale === 1 ? 'Text Scaling: Off' : 'Text Scaling: On'}
    </button>
  )
}

TextScalingToggle.displayName = 'TextScalingToggle'

/**
 * Text scaling provider
 */
export const TextScalingProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  const { scale } = useTextScalingUtils()

  return (
    <div className="text-scaling-provider" style={{ fontSize: `${scale * 16}px` }}>
      {children}
    </div>
  )
}

TextScalingProvider.displayName = 'TextScalingProvider'

// Import dependencies
import { clsx } from 'clsx'
