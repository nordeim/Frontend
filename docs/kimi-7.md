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
```

```tsx
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
```

```tsx
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
```

```tsx
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
```

```tsx
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
 *
