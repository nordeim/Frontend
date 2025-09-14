// src/hooks/useBreakpoint.ts
import { useState, useEffect, useCallback } from 'react'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'ultra-wide'

interface BreakpointConfig {
  name: Breakpoint
  minWidth: number
  maxWidth: number
  deviceType: DeviceType
}

const BREAKPOINTS: BreakpointConfig[] = [
  { name: 'xs', minWidth: 0, maxWidth: 479, deviceType: 'mobile' },
  { name: 'sm', minWidth: 480, maxWidth: 639, deviceType: 'mobile' },
  { name: 'md', minWidth: 640, maxWidth: 767, deviceType: 'tablet' },
  { name: 'lg', minWidth: 768, maxWidth: 1023, deviceType: 'tablet' },
  { name: 'xl', minWidth: 1024, maxWidth: 1279, deviceType: 'desktop' },
  { name: '2xl', minWidth: 1280, maxWidth: Infinity, deviceType: 'ultra-wide' }
]

interface UseBreakpointReturn {
  currentBreakpoint: Breakpoint
  currentDevice: DeviceType
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isUltraWide: boolean
  isBelow: (breakpoint: Breakpoint) => boolean
  isAbove: (breakpoint: Breakpoint) => boolean
  isBetween: (min: Breakpoint, max: Breakpoint) => boolean
  width: number
  height: number
  orientation: 'portrait' | 'landscape'
  aspectRatio: number
  pixelRatio: number
  touchSupported: boolean
}

/**
 * Hook for responsive breakpoint detection
 * Mobile-first approach with comprehensive device detection
 */
export function useBreakpoint(): UseBreakpointReturn {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768
  })

  const [pixelRatio, setPixelRatio] = useState(
    typeof window !== 'undefined' ? window.devicePixelRatio : 1
  )

  const [touchSupported, setTouchSupported] = useState(
    typeof window !== 'undefined' ? 'ontouchstart' in window : false
  )

  // Handle window resize
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
      setPixelRatio(window.devicePixelRatio)
    }

    const handleOrientationChange = () => {
      // Small delay to ensure dimensions are updated after orientation change
      setTimeout(handleResize, 100)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)

    // Initial check
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  const { width, height } = dimensions
  const orientation = width > height ? 'landscape' : 'portrait'
  const aspectRatio = width / height

  // Find current breakpoint
  const currentConfig = BREAKPOINTS.find(
    bp => width >= bp.minWidth && width <= bp.maxWidth
  ) || BREAKPOINTS[BREAKPOINTS.length - 1]

  const currentBreakpoint = currentConfig.name
  const currentDevice = currentConfig.deviceType

  // Device type booleans
  const isMobile = currentDevice === 'mobile'
  const isTablet = currentDevice === 'tablet'
  const isDesktop = currentDevice === 'desktop' || currentDevice === 'ultra-wide'
  const isUltraWide = currentDevice === 'ultra-wide'

  // Breakpoint comparison functions
  const isBelow = useCallback((breakpoint: Breakpoint): boolean => {
    const targetIndex = BREAKPOINTS.findIndex(bp => bp.name === breakpoint)
    const currentIndex = BREAKPOINTS.findIndex(bp => bp.name === currentBreakpoint)
    return currentIndex < targetIndex
  }, [currentBreakpoint])

  const isAbove = useCallback((breakpoint: Breakpoint): boolean => {
    const targetIndex = BREAKPOINTS.findIndex(bp => bp.name === breakpoint)
    const currentIndex = BREAKPOINTS.findIndex(bp => bp.name === currentBreakpoint)
    return currentIndex > targetIndex
  }, [currentBreakpoint])

  const isBetween = useCallback((min: Breakpoint, max: Breakpoint): boolean => {
    const minIndex = BREAKPOINTS.findIndex(bp => bp.name === min)
    const maxIndex = BREAKPOINTS.findIndex(bp => bp.name === max)
    const currentIndex = BREAKPOINTS.findIndex(bp => bp.name === currentBreakpoint)
    return currentIndex >= minIndex && currentIndex <= maxIndex
  }, [currentBreakpoint])

  return {
    currentBreakpoint,
    currentDevice,
    isMobile,
    isTablet,
    isDesktop,
    isUltraWide,
    isBelow,
    isAbove,
    isBetween,
    width,
    height,
    orientation,
    aspectRatio,
    pixelRatio,
    touchSupported
  }
}

/**
 * Hook for responsive design with custom breakpoints
 */
export function useCustomBreakpoint(customBreakpoints: Record<string, number>) {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<string>('default')
  const { width } = useBreakpoint()

  useEffect(() => {
    const sortedBreakpoints = Object.entries(customBreakpoints)
      .sort(([, a], [, b]) => a - b)
    
    let foundBreakpoint = 'default'
    
    for (const [name, minWidth] of sortedBreakpoints) {
      if (width >= minWidth) {
        foundBreakpoint = name
      } else {
        break
      }
    }
    
    setCurrentBreakpoint(foundBreakpoint)
  }, [width, customBreakpoints])

  return currentBreakpoint
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    setMatches(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [query])

  return matches
}

/**
 * Hook for container queries (using ResizeObserver)
 */
export function useContainerQuery(ref: React.RefObject<HTMLElement>, queries: Record<string, number>) {
  const [currentQuery, setCurrentQuery] = useState<string>('default')

  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (!entry) return

      const { width } = entry.contentRect
      const sortedQueries = Object.entries(queries).sort(([, a], [, b]) => a - b)
      
      let foundQuery = 'default'
      for (const [name, minWidth] of sortedQueries) {
        if (width >= minWidth) {
          foundQuery = name
        } else {
          break
        }
      }
      
      setCurrentQuery(foundQuery)
    })

    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [ref, queries])

  return currentQuery
}

/**
 * Hook for responsive values based on breakpoint
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const { currentBreakpoint } = useBreakpoint()
  
  // Find the most specific value for current breakpoint
  for (let i = BREAKPOINTS.findIndex(bp => bp.name === currentBreakpoint); i >= 0; i--) {
    const breakpoint = BREAKPOINTS[i].name
    if (values[breakpoint] !== undefined) {
      return values[breakpoint] as T
    }
  }
  
  return defaultValue
}

/**
 * Hook for responsive classes
 */
export function useResponsiveClasses(classes: Partial<Record<Breakpoint, string>>): string {
  const { currentBreakpoint } = useBreakpoint()
  const [currentClasses, setCurrentClasses] = useState('')

  useEffect(() => {
    const classList: string[] = []
    
    // Add classes for current and smaller breakpoints
    for (let i = 0; i <= BREAKPOINTS.findIndex(bp => bp.name === currentBreakpoint); i++) {
      const breakpoint = BREAKPOINTS[i].name
      if (classes[breakpoint]) {
        classList.push(classes[breakpoint]!)
      }
    }
    
    setCurrentClasses(classList.join(' '))
  }, [currentBreakpoint, classes])

  return currentClasses
}
