// src/components/Accessibility/ScreenReaderAnnouncer.tsx
import React, { useEffect, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useAnnouncer } from '@/hooks/useAnnouncer'

interface ScreenReaderAnnouncerProps {
  announcements?: Array<{
    id: string
    message: string
    priority?: 'polite' | 'assertive'
    delay?: number
    clearAfter?: number
  }>
  global?: boolean
  containerId?: string
}

interface AnnouncementConfig {
  id: string
  message: string
  priority: 'polite' | 'assertive'
  delay: number
  clearAfter: number
}

/**
 * Global screen reader announcer component
 * WCAG 2.1 AA compliant with proper ARIA live regions
 */
export const ScreenReaderAnnouncer: React.FC<ScreenReaderAnnouncerProps> = ({
  announcements = [],
  global = true,
  containerId = 'sr-announcer-container'
}) => {
  const [announcementQueue, setAnnouncementQueue] = useState<AnnouncementConfig[]>([])
  const { announce, clear } = useAnnouncer()

  // Process announcements
  useEffect(() => {
    if (announcements.length === 0) return

    const newAnnouncements = announcements.map(ann => ({
      id: ann.id,
      message: ann.message,
      priority: ann.priority || 'polite',
      delay: ann.delay || 0,
      clearAfter: ann.clearAfter || 3000
    }))

    setAnnouncementQueue(prev => [...prev, ...newAnnouncements])
  }, [announcements])

  // Process queue
  useEffect(() => {
    if (announcementQueue.length === 0) return

    const processNext = () => {
      const [next, ...rest] = announcementQueue
      if (next) {
        announce(next.message, {
          priority: next.priority,
          delay: next.delay,
          clearAfter: next.clearAfter,
          region: next.id
        })
        setAnnouncementQueue(rest)
      }
    }

    const timeout = setTimeout(processNext, 100)
    return () => clearTimeout(timeout)
  }, [announcementQueue, announce])

  if (!global) return null

  return createPortal(
    <div
      id={containerId}
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />,
    document.body
  )
}

ScreenReaderAnnouncer.displayName = 'ScreenReaderAnnouncer'

/**
 * ARIA Live Region component for dynamic content announcements
 */
export const AriaLiveRegion: React.FC<{
  id: string
  priority?: 'polite' | 'assertive' | 'off'
  atomic?: boolean
  relevant?: 'additions' | 'removals' | 'text' | 'all' | 'additions text'
  className?: string
  children?: React.ReactNode
}> = ({
  id,
  priority = 'polite',
  atomic = true,
  relevant = 'additions text',
  className,
  children
}) => {
  return (
    <div
      id={id}
      role="status"
      aria-live={priority}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className={className}
    >
      {children}
    </div>
  )
}

AriaLiveRegion.displayName = 'AriaLiveRegion'

/**
 * Visually hidden content for screen readers
 */
export const VisuallyHidden: React.FC<{
  children: React.ReactNode
  as?: React.ElementType
  focusable?: boolean
  className?: string
}> = ({
  children,
  as: Component = 'span',
  focusable = false,
  className
}) => {
  return (
    <Component
      className={[
        'sr-only',
        focusable && 'focus:not-sr-only focus:absolute focus:p-2 focus:bg-white focus:text-black focus:shadow-lg',
        className
      ].filter(Boolean).join(' ')}
    >
      {children}
    </Component>
  )
}

VisuallyHidden.displayName = 'VisuallyHidden'

/**
 * Status announcement component
 */
export const StatusAnnouncement: React.FC<{
  message: string
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading'
  priority?: 'polite' | 'assertive'
  clearAfter?: number
  id?: string
}> = ({
  message,
  type = 'info',
  priority = 'polite',
  clearAfter = 3000,
  id = `status-${Date.now()}`
}) => {
  const { announce } = useAnnouncer()

  useEffect(() => {
    if (message) {
      announce(message, {
        priority,
        clearAfter,
        region: `status-${type}`
      })
    }
  }, [message, type, priority, clearAfter, announce])

  return (
    <AriaLiveRegion
      id={id}
      priority={priority}
      atomic={true}
      relevant="additions text"
      className="sr-only"
    >
      {message}
    </AriaLiveRegion>
  )
}

StatusAnnouncement.displayName = 'StatusAnnouncement'

/**
 * Loading announcement component
 */
export const LoadingAnnouncement: React.FC<{
  isLoading: boolean
  message?: string
  completionMessage?: string
  priority?: 'polite' | 'assertive'
}> = ({
  isLoading,
  message = 'Loading',
  completionMessage = 'Loading complete',
  priority = 'polite'
}) => {
  const { announceLoading } = useAnnouncer()
  const [hasAnnouncedComplete, setHasAnnouncedComplete] = useState(false)

  useEffect(() => {
    if (isLoading) {
      setHasAnnouncedComplete(false)
      announceLoading(message, { priority })
    } else if (!hasAnnouncedComplete) {
      announceLoading(completionMessage, { priority })
      setHasAnnouncedComplete(true)
    }
  }, [isLoading, message, completionMessage, priority, hasAnnouncedComplete, announceLoading])

  return (
    <AriaLiveRegion priority={priority} atomic={true}>
      {isLoading ? message : completionMessage}
    </AriaLiveRegion>
  )
}

LoadingAnnouncement.displayName = 'LoadingAnnouncement'

/**
 * Error announcement component
 */
export const ErrorAnnouncement: React.FC<{
  error: string | null
  priority?: 'polite' | 'assertive'
  clearAfter?: number
}> = ({
  error,
  priority = 'assertive',
  clearAfter = 5000
}) => {
  const { announceError } = useAnnouncer()

  useEffect(() => {
    if (error) {
      announceError(error, { priority, clearAfter })
    }
  }, [error, priority, clearAfter, announceError])

  return (
    <AriaLiveRegion priority={priority} atomic={true} className="sr-only">
      {error}
    </AriaLiveRegion>
  )
}

ErrorAnnouncement.displayName = 'ErrorAnnouncement'

/**
 * Navigation announcement component
 */
export const NavigationAnnouncement: React.FC<{
  pathname: string
  title?: string
  priority?: 'polite' | 'assertive'
}> = ({
  pathname,
  title,
  priority = 'polite'
}) => {
  const { announceNavigation } = useAnnouncer()

  useEffect(() => {
    const pageTitle = title || document.title || 'New page'
    announceNavigation(`Navigated to ${pageTitle}`, { priority })
  }, [pathname, title, priority, announceNavigation])

  return (
    <AriaLiveRegion priority={priority} atomic={true} className="sr-only">
      Navigated to {title || document.title || pathname}
    </AriaLiveRegion>
  )
}

NavigationAnnouncement.displayName = 'NavigationAnnouncement'

/**
 * Form announcement component
 */
export const FormAnnouncement: React.FC<{
  errors?: Record<string, string>
  successMessage?: string
  formName?: string
  priority?: 'polite' | 'assertive'
}> = ({
  errors,
  successMessage,
  formName = 'form',
  priority = 'assertive'
}) => {
  const { announceFormErrors, announceFormSuccess } = useFormAnnouncer()

  useEffect(() => {
    if (errors && Object.keys(errors).length > 0) {
      announceFormErrors(errors, formName)
    } else if (successMessage) {
      announceFormSuccess(successMessage, formName)
    }
  }, [errors, successMessage, formName, announceFormErrors, announceFormSuccess])

  return (
    <div className="sr-only">
      {errors && Object.keys(errors).length > 0 && (
        <AriaLiveRegion priority={priority} atomic={true}>
          Form has {Object.keys(errors).length} errors
        </AriaLiveRegion>
      )}
      {successMessage && (
        <AriaLiveRegion priority="polite" atomic={true}>
          {successMessage}
        </AriaLiveRegion>
      )}
    </div>
  )
}

FormAnnouncement.displayName = 'FormAnnouncement'

// Import dependencies
import { useFormAnnouncer } from '@/hooks/useAnnouncer'
