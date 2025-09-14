// src/hooks/useFocusManager.ts
import { useCallback, useEffect, useRef, useState } from 'react'

interface FocusManagerOptions {
  trapFocus?: boolean
  restoreFocus?: boolean
  initialFocus?: string | (() => HTMLElement | null)
  returnFocus?: string | (() => HTMLElement | null)
  autoFocus?: boolean
  focusVisible?: boolean
  onFocusChange?: (element: HTMLElement | null) => void
}

interface UseFocusManagerReturn {
  containerRef: React.RefObject<HTMLElement>
  focusFirst: () => void
  focusLast: () => void
  focusNext: () => void
  focusPrevious: () => void
  focusElement: (element: HTMLElement | string) => void
  trapFocus: () => void
  releaseFocus: () => void
  getFocusableElements: () => HTMLElement[]
  currentFocusedElement: HTMLElement | null
}

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'area[href]',
  'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
  'select:not([disabled]):not([aria-hidden])',
  'textarea:not([disabled]):not([aria-hidden])',
  'button:not([disabled]):not([aria-hidden])',
  'iframe',
  'object',
  'embed',
  '[contenteditable]',
  '[tabindex]:not([tabindex^="-"])'
]

/**
 * Hook for managing focus in accessible applications
 * WCAG 2.1 AA compliant with proper focus trapping and restoration
 */
export function useFocusManager(options: FocusManagerOptions = {}): UseFocusManagerReturn {
  const {
    trapFocus: shouldTrapFocus = false,
    restoreFocus = true,
    initialFocus,
    returnFocus,
    autoFocus = true,
    focusVisible = true,
    onFocusChange
  } = options

  const containerRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [currentFocusedElement, setCurrentFocusedElement] = useState<HTMLElement | null>(null)

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []
    
    const elements = containerRef.current.querySelectorAll(FOCUSABLE_ELEMENTS.join(', '))
    return Array.from(elements).filter((el): el is HTMLElement => {
      const htmlEl = el as HTMLElement
      return htmlEl.offsetWidth > 0 && htmlEl.offsetHeight > 0 && !htmlEl.hasAttribute('hidden')
    })
  }, [])

  // Focus management functions
  const focusElement = useCallback((element: HTMLElement | string) => {
    let targetElement: HTMLElement | null
    
    if (typeof element === 'string') {
      targetElement = containerRef.current?.querySelector(element) as HTMLElement | null
    } else {
      targetElement = element
    }

    if (targetElement && targetElement.focus) {
      targetElement.focus()
      if (focusVisible) {
        targetElement.setAttribute('data-focus-visible', 'true')
      }
      setCurrentFocusedElement(targetElement)
      onFocusChange?.(targetElement)
    }
  }, [focusVisible, onFocusChange])

  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusElement(focusableElements[0])
    }
  }, [getFocusableElements, focusElement])

  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements()
    if (focusableElements.length > 0) {
      focusElement(focusableElements[focusableElements.length - 1])
    }
  }, [getFocusableElements, focusElement])

  const focusNext = useCallback(() => {
    const focusableElements = getFocusableElements()
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement)
    
    if (currentIndex === -1) {
      focusFirst()
    } else if (currentIndex < focusableElements.length - 1) {
      focusElement(focusableElements[currentIndex + 1])
    } else if (shouldTrapFocus) {
      focusFirst() // Loop back to first element
    }
  }, [getFocusableElements, focusElement, focusFirst, shouldTrapFocus])

  const focusPrevious = useCallback(() => {
    const focusableElements = getFocusableElements()
    const currentIndex = focusableElements.findIndex(el => el === document.activeElement)
    
    if (currentIndex === -1) {
      focusLast()
    } else if (currentIndex > 0) {
      focusElement(focusableElements[currentIndex - 1])
    } else if (shouldTrapFocus) {
      focusLast() // Loop back to last element
    }
  }, [getFocusableElements, focusElement, focusLast, shouldTrapFocus])

  // Focus trapping
  const trapFocus = useCallback(() => {
    if (!containerRef.current || typeof document === 'undefined') return

    // Store current focus
    previousFocusRef.current = document.activeElement as HTMLElement

    // Focus initial element
    let initialElement: HTMLElement | null = null
    if (initialFocus) {
      if (typeof initialFocus === 'string') {
        initialElement = containerRef.current.querySelector(initialFocus) as HTMLElement
      } else if (typeof initialFocus === 'function') {
        initialElement = initialFocus()
      }
    }

    if (!initialElement) {
      initialElement = getFocusableElements()[0]
    }

    if (initialElement && autoFocus) {
      setTimeout(() => focusElement(initialElement), 0)
    }

    // Set up focus trapping
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const focusableElements = getFocusableElements()
        if (focusableElements.length === 0) return

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault()
          focusElement(lastElement)
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault()
          focusElement(firstElement)
        }
      }
    }

    const handleFocusIn = () => {
      setCurrentFocusedElement(document.activeElement as HTMLElement)
      onFocusChange?.(document.activeElement as HTMLElement)
    }

    containerRef.current.addEventListener('keydown', handleKeyDown)
    containerRef.current.addEventListener('focusin', handleFocusIn)

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown)
        containerRef.current.removeEventListener('focusin', handleFocusIn)
      }
    }
  }, [initialFocus, autoFocus, getFocusableElements, focusElement, onFocusChange])

  const releaseFocus = useCallback(() => {
    if (restoreFocus && previousFocusRef.current && typeof document !== 'undefined') {
      // Determine return focus element
      let returnElement: HTMLElement | null = null
      if (returnFocus) {
        if (typeof returnFocus === 'string') {
          returnElement = document.querySelector(returnFocus) as HTMLElement
        } else if (typeof returnFocus === 'function') {
          returnElement = returnFocus()
        }
      } else {
        returnElement = previousFocusRef.current
      }

      if (returnElement && returnElement.focus) {
        returnElement.focus()
        if (focusVisible) {
          returnElement.setAttribute('data-focus-visible', 'true')
        }
      }
    }
    
    // Clear current focus tracking
    setCurrentFocusedElement(null)
    onFocusChange?.(null)
  }, [restoreFocus, returnFocus, focusVisible, onFocusChange])

  // Track current focused element
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleFocusChange = () => {
      setCurrentFocusedElement(document.activeElement as HTMLElement)
    }

    document.addEventListener('focusin', handleFocusChange)
    document.addEventListener('focusout', handleFocusChange)

    return () => {
      document.removeEventListener('focusin', handleFocusChange)
      document.removeEventListener('focusout', handleFocusChange)
    }
  }, [])

  // Initialize focus management
  useEffect(() => {
    if (shouldTrapFocus && containerRef.current) {
      const cleanup = trapFocus()
      return cleanup
    }
  }, [shouldTrapFocus, trapFocus])

  return {
    containerRef,
    focusFirst,
    focusLast,
    focusNext,
    focusPrevious,
    focusElement,
    trapFocus,
    releaseFocus,
    getFocusableElements,
    currentFocusedElement
  }
}

/**
 * Hook for managing focus within a modal or dialog
 */
export function useModalFocus(options: Omit<FocusManagerOptions, 'trapFocus'> = {}) {
  return useFocusManager({
    ...options,
    trapFocus: true,
    restoreFocus: true,
    autoFocus: true
  })
}

/**
 * Hook for managing focus within a form
 */
export function useFormFocus(options: FocusManagerOptions = {}) {
  const formRef = useRef<HTMLFormElement>(null)
  
  const { focusFirst, focusElement, ...rest } = useFocusManager({
    ...options,
    initialFocus: options.initialFocus || 'input:not([disabled]):not([type="hidden"]), textarea:not([disabled]), select:not([disabled])'
  })

  const focusFirstError = useCallback(() => {
    if (!formRef.current) return
    
    const firstError = formRef.current.querySelector('[aria-invalid="true"], .error, [data-error="true"]') as HTMLElement
    if (firstError) {
      focusElement(firstError)
    } else {
      focusFirst()
    }
  }, [focusElement, focusFirst])

  const focusSubmitButton = useCallback(() => {
    if (!formRef.current) return
    
    const submitButton = formRef.current.querySelector('button[type="submit"], input[type="submit"]') as HTMLElement
    if (submitButton) {
      focusElement(submitButton)
    }
  }, [focusElement])

  return {
    formRef,
    focusFirst,
    focusFirstError,
    focusSubmitButton,
    focusElement,
    ...rest
  }
}

/**
 * Utility function to check if an element is focusable
 */
export function isFocusable(element: HTMLElement): boolean {
  if (element.hidden || element.disabled) return false
  
  const tabIndex = element.getAttribute('tabindex')
  if (tabIndex && parseInt(tabIndex) < 0) return false
  
  return FOCUSABLE_ELEMENTS.some(selector => element.matches(selector))
}

/**
 * Utility function to get the next focusable element
 */
export function getNextFocusableElement(
  currentElement: HTMLElement,
  container: HTMLElement,
  loop = false
): HTMLElement | null {
  const focusableElements = Array.from(
    container.querySelectorAll(FOCUSABLE_ELEMENTS.join(', '))
  ).filter(isFocusable) as HTMLElement[]
  
  const currentIndex = focusableElements.indexOf(currentElement)
  if (currentIndex === -1) return null
  
  const nextIndex = currentIndex + 1
  if (nextIndex < focusableElements.length) {
    return focusableElements[nextIndex]
  }
  
  return loop ? focusableElements[0] : null
}

/**
 * Utility function to get the previous focusable element
 */
export function getPreviousFocusableElement(
  currentElement: HTMLElement,
  container: HTMLElement,
  loop = false
): HTMLElement | null {
  const focusableElements = Array.from(
    container.querySelectorAll(FOCUSABLE_ELEMENTS.join(', '))
  ).filter(isFocusable) as HTMLElement[]
  
  const currentIndex = focusableElements.indexOf(currentElement)
  if (currentIndex === -1) return null
  
  const prevIndex = currentIndex - 1
  if (prevIndex >= 0) {
    return focusableElements[prevIndex]
  }
  
  return loop ? focusableElements[focusableElements.length - 1] : null
}
