// src/hooks/useAnnouncer.ts
import { useCallback, useRef, useEffect } from 'react'

interface AnnouncerOptions {
  priority?: 'polite' | 'assertive' | 'off'
  delay?: number
  clearAfter?: number
  region?: string
}

interface UseAnnouncerReturn {
  announce: (message: string, options?: AnnouncerOptions) => void
  clear: (region?: string) => void
  announceError: (message: string, options?: AnnouncerOptions) => void
  announceSuccess: (message: string, options?: AnnouncerOptions) => void
  announceLoading: (message: string, options?: AnnouncerOptions) => void
  announceNavigation: (message: string, options?: AnnouncerOptions) => void
}

/**
 * Hook for managing screen reader announcements
 * WCAG 2.1 AA compliant with proper ARIA live regions
 */
export function useAnnouncer(): UseAnnouncerReturn {
  const announcerRef = useRef<HTMLDivElement | null>(null)
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})

  // Create announcer element if it doesn't exist
  useEffect(() => {
    if (typeof document === 'undefined') return

    let announcer = document.getElementById('sr-announcer') as HTMLDivElement
    if (!announcer) {
      announcer = document.createElement('div')
      announcer.id = 'sr-announcer'
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.className = 'sr-only'
      document.body.appendChild(announcer)
    }
    announcerRef.current = announcer

    return () => {
      // Clean up timeouts
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const announce = useCallback((message: string, options: AnnouncerOptions = {}) => {
    if (!announcerRef.current || typeof document === 'undefined') return

    const {
      priority = 'polite',
      delay = 0,
      clearAfter = 3000,
      region = 'default'
    } = options

    // Clear existing timeout for this region
    if (timeoutRefs.current[region]) {
      clearTimeout(timeoutRefs.current[region])
    }

    const announceMessage = () => {
      if (!announcerRef.current) return

      // Create or update region-specific element
      let regionElement = document.getElementById(`sr-region-${region}`) as HTMLDivElement
      if (!regionElement) {
        regionElement = document.createElement('div')
        regionElement.id = `sr-region-${region}`
        regionElement.setAttribute('aria-live', priority)
        regionElement.setAttribute('aria-atomic', 'true')
        regionElement.className = 'sr-only'
        announcerRef.current.appendChild(regionElement)
      }

      // Update priority if changed
      regionElement.setAttribute('aria-live', priority)

      // Clear and then set new message for screen readers
      regionElement.textContent = ''
      setTimeout(() => {
        if (regionElement) {
          regionElement.textContent = message
        }
      }, 100)

      // Clear after specified time
      if (clearAfter > 0) {
        timeoutRefs.current[region] = setTimeout(() => {
          if (regionElement) {
            regionElement.textContent = ''
          }
        }, clearAfter)
      }
    }

    if (delay > 0) {
      timeoutRefs.current[region] = setTimeout(announceMessage, delay)
    } else {
      announceMessage()
    }
  }, [])

  const clear = useCallback((region?: string) => {
    if (!announcerRef.current) return

    if (region) {
      const regionElement = document.getElementById(`sr-region-${region}`)
      if (regionElement) {
        regionElement.textContent = ''
      }
      if (timeoutRefs.current[region]) {
        clearTimeout(timeoutRefs.current[region])
      }
    } else {
      // Clear all regions
      announcerRef.current.querySelectorAll('[id^="sr-region-"]').forEach(element => {
        (element as HTMLDivElement).textContent = ''
      })
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const announceError = useCallback((message: string, options: AnnouncerOptions = {}) => {
    announce(message, { ...options, priority: 'assertive', region: options.region || 'error' })
  }, [announce])

  const announceSuccess = useCallback((message: string, options: AnnouncerOptions = {}) => {
    announce(message, { ...options, priority: 'polite', region: options.region || 'success' })
  }, [announce])

  const announceLoading = useCallback((message: string, options: AnnouncerOptions = {}) => {
    announce(message, { ...options, priority: 'polite', region: options.region || 'loading' })
  }, [announce])

  const announceNavigation = useCallback((message: string, options: AnnouncerOptions = {}) => {
    announce(message, { ...options, priority: 'polite', region: options.region || 'navigation' })
  }, [announce])

  return {
    announce,
    clear,
    announceError,
    announceSuccess,
    announceLoading,
    announceNavigation
  }
}

/**
 * Global announcer utility for use outside React components
 */
export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer
  private announcer: HTMLDivElement | null = null
  private timeouts: Map<string, NodeJS.Timeout> = new Map()

  private constructor() {
    this.createAnnouncer()
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer()
    }
    return ScreenReaderAnnouncer.instance
  }

  private createAnnouncer() {
    if (typeof document === 'undefined') return

    this.announcer = document.createElement('div')
    this.announcer.id = 'global-sr-announcer'
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.className = 'sr-only'
    document.body.appendChild(this.announcer)
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite', delay: number = 0) {
    if (!this.announcer || typeof document === 'undefined') return

    const announceMessage = () => {
      if (!this.announcer) return
      
      // Clear first, then set message
      this.announcer.textContent = ''
      setTimeout(() => {
        if (this.announcer) {
          this.announcer.textContent = message
        }
      }, 100)
    }

    if (delay > 0) {
      const timeout = setTimeout(announceMessage, delay)
      this.timeouts.set('global', timeout)
    } else {
      announceMessage()
    }
  }

  clear() {
    if (this.announcer) {
      this.announcer.textContent = ''
    }
    this.timeouts.forEach(timeout => clearTimeout(timeout))
    this.timeouts.clear()
  }
}

/**
 * Hook for announcing form validation errors
 */
export function useFormAnnouncer() {
  const { announceError, announceSuccess } = useAnnouncer()

  const announceFormErrors = useCallback((errors: Record<string, string>, formName = 'form') => {
    const errorMessages = Object.values(errors)
    if (errorMessages.length === 0) return

    const message = errorMessages.length === 1
      ? `Form error: ${errorMessages[0]}`
      : `Form has ${errorMessages.length} errors: ${errorMessages.join('. ')}`

    announceError(message, { region: `${formName}-errors` })
  }, [announceError])

  const announceFormSuccess = useCallback((message: string, formName = 'form') => {
    announceSuccess(message, { region: `${formName}-success` })
  }, [announceSuccess])

  return {
    announceFormErrors,
    announceFormSuccess
  }
}

/**
 * Hook for announcing route changes
 */
export function useRouteAnnouncer() {
  const { announceNavigation } = useAnnouncer()

  const announceRouteChange = useCallback((pathname: string, title?: string) => {
    const pageName = title || document.title || 'New page'
    announceNavigation(`Navigated to ${pageName}`, { clearAfter: 5000 })
  }, [announceNavigation])

  return {
    announceRouteChange
  }
}
