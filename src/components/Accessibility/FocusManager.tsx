// src/components/Accessibility/FocusManager.tsx
import React, { useEffect, useRef, useCallback } from 'react'
import { useFocusManager, FocusManagerOptions } from '@/hooks/useFocusManager'
import { clsx } from 'clsx'

interface FocusManagerProps extends FocusManagerOptions {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
  onKeyDown?: (event: React.KeyboardEvent) => void
  role?: string
  ariaLabel?: string
  ariaLabelledBy?: string
  ariaDescribedBy?: string
}

/**
 * Component for managing focus in accessible applications
 * WCAG 2.1 AA compliant with proper focus trapping and management
 */
export const FocusManager: React.FC<FocusManagerProps> = ({
  children,
  className,
  as: Component = 'div',
  onKeyDown,
  role,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
  ...focusOptions
}) => {
  const { containerRef, focusFirst, focusLast, focusNext, focusPrevious, trapFocus, releaseFocus } = useFocusManager(focusOptions)

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Handle focus management keys
    switch (event.key) {
      case 'Home':
        event.preventDefault()
        focusFirst()
        break
      case 'End':
        event.preventDefault()
        focusLast()
        break
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault()
        focusNext()
        break
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault()
        focusPrevious()
        break
    }

    // Call custom key handler
    onKeyDown?.(event)
  }, [focusFirst, focusLast, focusNext, focusPrevious, onKeyDown])

  return (
    <Component
      ref={containerRef}
      className={clsx('focus-manager', className)}
      onKeyDown={handleKeyDown}
      role={role}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      tabIndex={-1}
    >
      {children}
    </Component>
  )
}

FocusManager.displayName = 'FocusManager'

/**
 * Modal focus manager with proper trapping
 */
export const ModalFocusManager: React.FC<Omit<FocusManagerProps, 'trapFocus' | 'restoreFocus' | 'autoFocus'>> = ({
  children,
  className,
  as: Component = 'div',
  ...props
}) => {
  return (
    <FocusManager
      as={Component}
      className={clsx('modal-focus-manager', className)}
      trapFocus={true}
      restoreFocus={true}
      autoFocus={true}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      {children}
    </FocusManager>
  )
}

ModalFocusManager.displayName = 'ModalFocusManager'

/**
 * Form focus manager with validation support
 */
export const FormFocusManager: React.FC<Omit<FocusManagerProps, 'initialFocus'> & {
  initialFocus?: string | (() => HTMLElement | null)
  onValidationError?: (errors: Record<string, string>) => void
}> = ({
  children,
  className,
  as: Component = 'form',
  initialFocus,
  onValidationError,
  ...props
}) => {
  const { formRef, focusFirst, focusFirstError, focusSubmitButton, ...rest } = useFormFocus({
    initialFocus,
    ...props
  })

  const handleSubmit = useCallback((event: React.FormEvent) => {
    // Focus first error if validation fails
    if (onValidationError) {
      // This would be called by form validation
      const errors = {} // Get from form validation
      if (Object.keys(errors).length > 0) {
        focusFirstError()
      }
    }
  }, [focusFirstError, onValidationError])

  return (
    <Component
      ref={formRef}
      className={clsx('form-focus-manager', className)}
      onSubmit={handleSubmit}
      noValidate
      {...props}
    >
      {children}
    </Component>
  )
}

FormFocusManager.displayName = 'FormFocusManager'

/**
 * List focus manager for keyboard navigation
 */
export const ListFocusManager: React.FC<Omit<FocusManagerProps, 'role'> & {
  itemsCount: number
  onItemSelect?: (index: number) => void
  loop?: boolean
  orientation?: 'vertical' | 'horizontal' | 'both'
}> = ({
  children,
  className,
  itemsCount,
  onItemSelect,
  loop = true,
  orientation = 'vertical',
  ...props
}) => {
  const [focusedIndex, setFocusedIndex] = React.useState(0)
  const { containerRef, focusElement, ...focusManagerProps } = useFocusManager(props)

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    let newIndex = focusedIndex

    switch (event.key) {
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          newIndex = focusedIndex > 0 
            ? focusedIndex - 1 
            : (loop ? itemsCount - 1 : 0)
        }
        break
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          event.preventDefault()
          newIndex = focusedIndex < itemsCount - 1 
            ? focusedIndex + 1 
            : (loop ? 0 : itemsCount - 1)
        }
        break
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          newIndex = focusedIndex > 0 
            ? focusedIndex - 1 
            : (loop ? itemsCount - 1 : 0)
        }
        break
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          event.preventDefault()
          newIndex = focusedIndex < itemsCount - 1 
            ? focusedIndex + 1 
            : (loop ? 0 : itemsCount - 1)
        }
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onItemSelect?.(focusedIndex)
        break
      case 'Home':
        event.preventDefault()
        newIndex = 0
        break
      case 'End':
        event.preventDefault()
        newIndex = itemsCount - 1
        break
    }

    if (newIndex !== focusedIndex) {
      setFocusedIndex(newIndex)
      const item = containerRef.current?.querySelector(`[data-index="${newIndex}"]`) as HTMLElement
      if (item) {
        focusElement(item)
      }
    }
  }, [focusedIndex, itemsCount, loop, orientation, onItemSelect, focusElement])

  return (
    <FocusManager
      ref={containerRef}
      className={clsx('list-focus-manager', className)}
      role="listbox"
      aria-label="List items"
      onKeyDown={handleKeyDown}
      {...focusManagerProps}
    >
      {React.Children.map(children, (child, index) =>
        React.cloneElement(child as React.ReactElement, {
          'data-index': index,
          'aria-selected': focusedIndex === index,
          tabIndex: focusedIndex === index ? 0 : -1,
        })
      )}
    </FocusManager>
  )
}

ListFocusManager.displayName = 'ListFocusManager'

/**
 * Skip link component for keyboard navigation
 */
export const SkipLinks: React.FC<{
  links: Array<{
    id: string
    text: string
    target: string
  }>
  className?: string
}> = ({ links, className }) => {
  const [isVisible, setIsVisible] = useState(false)

  const handleFocus = useCallback(() => {
    setIsVisible(true)
  }, [])

  const handleBlur = useCallback(() => {
    setIsVisible(false)
  }, [])

  const handleClick = useCallback((target: string) => {
    const element = document.querySelector(target) as HTMLElement
    if (element) {
      element.focus()
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setIsVisible(false)
  }, [])

  return (
    <div
      className={clsx(
        'skip-links',
        'fixed top-0 left-0 z-50',
        'bg-primary-600 text-white',
        'p-2 shadow-lg',
        'transform transition-transform',
        isVisible ? 'translate-y-0' : '-translate-y-full',
        className
      )}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <nav role="navigation" aria-label="Skip links">
        <ul className="space-y-1">
          {links.map(link => (
            <li key={link.id}>
              <button
                onClick={() => handleClick(link.target)}
                className="block w-full text-left px-3 py-2 text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-white rounded"
              >
                {link.text}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

SkipLinks.displayName = 'SkipLinks'

/**
 * Focus indicator component for visual feedback
 */
export const FocusIndicator: React.FC<{
  children: React.ReactNode
  className?: string
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  thickness?: 'thin' | 'medium' | 'thick'
  offset?: number
}> = ({
  children,
  className,
  color = 'primary',
  thickness = 'medium',
  offset = 2
}) => {
  const thicknessClasses = {
    thin: 'focus:ring-1',
    medium: 'focus:ring-2',
    thick: 'focus:ring-4'
  }

  const colorClasses = {
    primary: 'focus:ring-primary-500 focus:border-primary-500',
    secondary: 'focus:ring-secondary-500 focus:border-secondary-500',
    success: 'focus:ring-success-500 focus:border-success-500',
    warning: 'focus:ring-warning-500 focus:border-warning-500',
    error: 'focus:ring-error-500 focus:border-error-500'
  }

  return (
    <div
      className={clsx(
        'focus-indicator',
        'focus:outline-none',
        thicknessClasses[thickness],
        colorClasses[color],
        'focus:ring-offset-' + offset,
        'transition-all duration-200',
        'focus:ring-opacity-50',
        className
      )}
      tabIndex={-1}
    >
      {children}
    </div>
  )
}

FocusIndicator.displayName = 'FocusIndicator'

// Import React and hooks
import React, { useState, useCallback } from 'react'
import { useFormFocus } from '@/hooks/useFocusManager'
