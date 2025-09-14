// src/hooks/useHighContrast.ts
import { useCallback, useEffect, useState } from 'react'

interface HighContrastOptions {
  onChange?: (isHighContrast: boolean) => void
}

interface UseHighContrastReturn {
  isHighContrast: boolean
  toggleHighContrast: () => void
  setHighContrast: (enabled: boolean) => void
}

/**
 * Hook for managing high contrast mode
 * WCAG 2.1 AA compliant with proper contrast ratio handling
 */
export function useHighContrast(options: HighContrastOptions = {}): UseHighContrastReturn {
  const { onChange } = options
  const [isHighContrast, setIsHighContrast] = useState(false)

  const toggleHighContrast = useCallback(() => {
    setIsHighContrast(!isHighContrast)
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast', !isHighContrast)
      localStorage.setItem('highContrast', String(!isHighContrast))
    }
  }, [isHighContrast])

  const setHighContrast = useCallback((enabled: boolean) => {
    setIsHighContrast(enabled)
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast', enabled)
      localStorage.setItem('highContrast', String(enabled))
    }
  }, [])

  // Check if high contrast mode is enabled on load
  useEffect(() => {
    const savedHighContrast = localStorage.getItem('highContrast')
    const isHCEnabled = savedHighContrast === 'true'
    setIsHighContrast(isHCEnabled)
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('high-contrast', isHCEnabled)
    }
    onChange?.(isHCEnabled)
  }, [onChange])

  return {
    isHighContrast,
    toggleHighContrast,
    setHighContrast
  }
}

/**
 * Utility function to check color contrast ratio
 */
export function checkColorContrastRatio(foregroundColor: string, backgroundColor: string): number {
  const rgb1 = hexToRgb(foregroundColor)
  const rgb2 = hexToRgb(backgroundColor)
  
  if (!rgb1 || !rgb2) return 0
  
  const lum1 = luminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = luminance(rgb2.r, rgb2.g, rgb2.b)
  
  return (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05)
}

/**
 * Utility function to convert hex color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i
  hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b)
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null
}

/**
 * Utility function to calculate luminance
 */
function luminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  })
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722
}

/**
 * Hook for ensuring minimum contrast ratio
 */
export function useMinimumContrastRatio(
  foregroundColor: string,
  backgroundColor: string,
  minRatio: number = 4.5
): boolean {
  const contrastRatio = checkColorContrastRatio(foregroundColor, backgroundColor)
  return contrastRatio >= minRatio
}

/**
 * Hook for text scaling support
 */
export function useTextScaling(): { scale: number; setScale: (scale: number) => void } {
  const [scale, setScale] = useState(1)

  const handleResize = useCallback(() => {
    if (typeof window === 'undefined') return
    const newScale = Math.min(window.innerWidth / 1200, 2)
    setScale(newScale)
  }, [])

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [handleResize])

  return { scale, setScale }
}

/**
 * Hook for high contrast mode detection
 */
export function useHighContrastMode(): boolean {
  const { isHighContrast } = useHighContrast()
  return isHighContrast
}

/**
 * Hook for text scaling utilities
 */
export function useTextScalingUtils(): {
  scale: number
  setScale: (scale: number) => void
  getFontSize: (baseSize: number) => number
} {
  const { scale, setScale } = useTextScaling()

  const getFontSize = useCallback((baseSize: number) => {
    return baseSize * scale
  }, [scale])

  return { scale, setScale, getFontSize }
}

/**
 * Hook for color contrast validation
 */
export function useColorContrastValidation(): {
  validateContrast: (foregroundColor: string, backgroundColor: string, minRatio: number) => boolean
} {
  const validateContrast = useCallback((foregroundColor: string, backgroundColor: string, minRatio: number) => {
    return checkColorContrastRatio(foregroundColor, backgroundColor) >= minRatio
  }, [])

  return { validateContrast }
}
