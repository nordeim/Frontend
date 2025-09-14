// src/components/Accessibility/ColorContrast.tsx
import React, { useEffect, useState } from 'react'
import { useColorContrastValidation } from '@/hooks/useHighContrast'

interface ColorContrastProps {
  children: React.ReactNode
  foregroundColor: string
  backgroundColor: string
  minRatio?: number
  className?: string
}

/**
 * Component for managing color contrast validation
 * WCAG 2.1 AA compliant with proper contrast ratio handling
 */
export const ColorContrast: React.FC<ColorContrastProps> = ({
  children,
  foregroundColor,
  backgroundColor,
  minRatio = 4.5,
  className
}) => {
  const { validateContrast } = useColorContrastValidation()
  const [isValid, setIsValid] = useState(false)

  useEffect(() => {
    setIsValid(validateContrast(foregroundColor, backgroundColor, minRatio))
  }, [foregroundColor, backgroundColor, minRatio, validateContrast])

  return (
    <div
      className={clsx('color-contrast', isValid ? 'contrast-valid' : 'contrast-invalid', className)}
      style={{ color: foregroundColor, backgroundColor }}
      aria-invalid={!isValid}
    >
      {children}
    </div>
  )
}

ColorContrast.displayName = 'ColorContrast'

/**
 * Color contrast toggle button
 */
export const ColorContrastToggle: React.FC<{
  label?: string
  className?: string
}> = ({
  label = 'Toggle color contrast validation',
  className
}) => {
  const { validateContrast } = useColorContrastValidation()

  const handleToggle = useCallback(() => {
    // This would toggle a global state for contrast validation
    // For now, just log the validation result
    console.log(validateContrast('#000', '#fff', 4.5))
  }, [validateContrast])

  return (
    <button
      onClick={handleToggle}
      className={clsx('color-contrast-toggle', className)}
      aria-label={label}
    >
      {label}
    </button>
  )
}

ColorContrastToggle.displayName = 'ColorContrastToggle'

/**
 * Color contrast provider
 */
export const ColorContrastProvider: React.FC<{
  children: React.ReactNode
}> = ({ children }) => {
  // This would provide a global context for contrast validation
  // For now, just render the children
  return (
    <div className="color-contrast-provider">
      {children}
    </div>
  )
}

ColorContrastProvider.displayName = 'ColorContrastProvider'

// Import dependencies
import { clsx } from 'clsx'
