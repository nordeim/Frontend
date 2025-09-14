// src/hooks/useRTL.ts
import { useCallback, useEffect, useState } from 'react'
import { useAppSelector } from '@/store'
import { selectLanguage, selectRtl } from '@/store/slices/uiSlice'

interface RTLConfig {
  language: string
  isRTL: boolean
  direction: 'ltr' | 'rtl'
}

interface UseRTLReturn {
  isRTL: boolean
  direction: 'ltr' | 'rtl'
  language: string
  toggleRTL: () => void
  setRTL: (rtl: boolean) => void
  getRTLLanguages: () => string[]
  isRTLLanguage: (lang: string) => boolean
  mirrorClass: string
  logicalStyles: {
    start: 'left' | 'right'
    end: 'left' | 'right'
    inlineStart: string
    inlineEnd: string
    blockStart: string
    blockEnd: string
  }
}

const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'yi', 'ji', 'iw', 'ku', 'ps', 'sd']

/**
 * Hook for managing RTL (Right-to-Left) language support
 * WCAG 2.1 AA compliant with proper text direction handling
 */
export function useRTL(): UseRTLReturn {
  const currentLanguage = useAppSelector(selectLanguage)
  const isRTLEnabled = useAppSelector(selectRtl)
  const [isRTL, setIsRTL] = useState(isRTLEnabled)
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(isRTLEnabled ? 'rtl' : 'ltr')

  // Update RTL state when language or RTL setting changes
  useEffect(() => {
    const shouldBeRTL = isRTLLanguage(currentLanguage) || isRTLEnabled
    setIsRTL(shouldBeRTL)
    setDirection(shouldBeRTL ? 'rtl' : 'ltr')
    
    // Apply to document
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', shouldBeRTL ? 'rtl' : 'ltr')
      document.body.setAttribute('dir', shouldBeRTL ? 'rtl' : 'ltr')
    }
  }, [currentLanguage, isRTLEnabled])

  const toggleRTL = useCallback(() => {
    setRTL(!isRTL)
  }, [isRTL])

  const setRTL = useCallback((rtl: boolean) => {
    setIsRTL(rtl)
    setDirection(rtl ? 'rtl' : 'ltr')
    
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('dir', rtl ? 'rtl' : 'ltr')
      document.body.setAttribute('dir', rtl ? 'rtl' : 'ltr')
      localStorage.setItem('rtl', String(rtl))
    }
  }, [])

  const getRTLLanguages = useCallback(() => {
    return [...RTL_LANGUAGES]
  }, [])

  const isRTLLanguage = useCallback((lang: string): boolean => {
    const languageCode = lang.split('-')[0].toLowerCase()
    return RTL_LANGUAGES.includes(languageCode)
  }, [])

  // Logical properties based on RTL state
  const logicalStyles = {
    start: isRTL ? 'right' : 'left',
    end: isRTL ? 'left' : 'right',
    inlineStart: isRTL ? 'right' : 'left',
    inlineEnd: isRTL ? 'left' : 'right',
    blockStart: 'top',
    blockEnd: 'bottom'
  }

  const mirrorClass = isRTL ? 'rtl' : 'ltr'

  return {
    isRTL,
    direction,
    language: currentLanguage,
    toggleRTL,
    setRTL,
    getRTLLanguages,
    isRTLLanguage,
    mirrorClass,
    logicalStyles
  }
}

/**
 * Hook for RTL-aware styling
 */
export function useRTLStyles() {
  const { isRTL, logicalStyles } = useRTL()

  const getLogicalStyle = useCallback((property: string, value: string | number) => {
    if (typeof value !== 'string') return value

    // Handle directional values
    if (property.includes('left') || property.includes('right')) {
      if (value.includes('left')) {
        return isRTL ? value.replace('left', 'right') : value
      }
      if (value.includes('right')) {
        return isRTL ? value.replace('right', 'left') : value
      }
      if (value.includes('start')) {
        return value.replace('start', logicalStyles.inlineStart)
      }
      if (value.includes('end')) {
        return value.replace('end', logicalStyles.inlineEnd)
      }
    }

    // Handle margin and padding logical properties
    if (property.includes('margin') || property.includes('padding')) {
      if (property.includes('inline')) {
        return isRTL ? 'logical' : 'physical'
      }
      if (property.includes('block')) {
        return 'logical' // Block direction doesn't change with RTL
      }
    }

    return value
  }, [isRTL, logicalStyles])

  const getTextAlign = useCallback((align: 'left' | 'right' | 'center' | 'start' | 'end') => {
    if (align === 'start') return isRTL ? 'right' : 'left'
    if (align === 'end') return isRTL ? 'left' : 'right'
    return align
  }, [isRTL])

  const getTransformOrigin = useCallback((origin: string) => {
    if (origin.includes('left')) {
      return isRTL ? origin.replace('left', 'right') : origin
    }
    if (origin.includes('right')) {
      return isRTL ? origin.replace('right', 'left') : origin
    }
    return origin
  }, [isRTL])

  return {
    isRTL,
    getLogicalStyle,
    getTextAlign,
    getTransformOrigin,
    logicalStyles
  }
}

/**
 * Hook for RTL-aware icons and directional content
 */
export function useRTLIcons() {
  const { isRTL } = useRTL()

  const shouldMirrorIcon = useCallback((iconName: string): boolean => {
    const mirrorableIcons = [
      'arrow-left', 'arrow-right', 'chevron-left', 'chevron-right',
      'caret-left', 'caret-right', 'angle-left', 'angle-right',
      'triangle-left', 'triangle-right', 'play', 'forward', 'backward',
      'next', 'previous', 'step-forward', 'step-backward', 'fast-forward', 'rewind'
    ]
    
    return mirrorableIcons.some(name => iconName.toLowerCase().includes(name))
  }, [])

  const getIconDirection = useCallback((iconName: string): 'mirror' | 'normal' => {
    return shouldMirrorIcon(iconName) && isRTL ? 'mirror' : 'normal'
  }, [isRTL, shouldMirrorIcon])

  const getArrowDirection = useCallback((direction: 'left' | 'right' | 'next' | 'previous'): string => {
    if (isRTL) {
      if (direction === 'left') return 'right'
      if (direction === 'right') return 'left'
      if (direction === 'next') return 'previous'
      if (direction === 'previous') return 'next'
    }
    return direction
  }, [isRTL])

  return {
    shouldMirrorIcon,
    getIconDirection,
    getArrowDirection
  }
}

/**
 * Hook for RTL-aware animations
 */
export function useRTLAnimations() {
  const { isRTL } = useRTL()

  const getAnimationDirection = useCallback((animation: string): string => {
    if (animation.includes('left')) {
      return isRTL ? animation.replace('left', 'right') : animation
    }
    if (animation.includes('right')) {
      return isRTL ? animation.replace('right', 'left') : animation
    }
    return animation
  }, [isRTL])

  const getSlideDirection = useCallback((direction: 'left' | 'right' | 'in' | 'out'): string => {
    if (direction === 'left') return isRTL ? 'right' : 'left'
    if (direction === 'right') return isRTL ? 'left' : 'right'
    return direction
  }, [isRTL])

  return {
    getAnimationDirection,
    getSlideDirection
  }
}

/**
 * Utility function to create RTL-aware class names
 */
export function createRTLClasses(baseClasses: string, rtlClasses?: string): string {
  const { isRTL } = useRTL()
  
  if (!rtlClasses) return baseClasses
  
  return isRTL 
    ? `${baseClasses} ${rtlClasses}`
    : baseClasses
}

/**
 * Hook for RTL-aware CSS custom properties
 */
export function useRTLCustomProperties() {
  const { isRTL, logicalStyles } = useRTL()

  const customProperties = {
    '--direction': isRTL ? 'rtl' : 'ltr',
    '--inline-start': logicalStyles.inlineStart,
    '--inline-end': logicalStyles.inlineEnd,
    '--block-start': logicalStyles.blockStart,
    '--block-end': logicalStyles.blockEnd,
    '--text-align-start': isRTL ? 'right' : 'left',
    '--text-align-end': isRTL ? 'left' : 'right'
  }

  useEffect(() => {
    if (typeof document === 'undefined') return

    Object.entries(customProperties).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value)
    })

    return () => {
      Object.keys(customProperties).forEach(property => {
        document.documentElement.style.removeProperty(property)
      })
    }
  }, [isRTL, logicalStyles])

  return customProperties
}

/**
 * Global RTL initializer
 */
export function initializeRTL() {
  if (typeof document === 'undefined') return

  const savedRTL = localStorage.getItem('rtl')
  const language = document.documentElement.getAttribute('lang') || 'en'
  const isRTLLanguage = RTL_LANGUAGES.includes(language.split('-')[0])

  if (savedRTL !== null) {
    const isRTL = savedRTL === 'true'
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
    document.body.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
  } else if (isRTLLanguage) {
    document.documentElement.setAttribute('dir', 'rtl')
    document.body.setAttribute('dir', 'rtl')
  }
}

// Initialize on module load
initializeRTL()
