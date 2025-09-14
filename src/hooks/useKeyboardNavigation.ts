// src/hooks/useKeyboardNavigation.ts
import { useCallback, useEffect, useRef } from 'react'

interface KeyboardShortcut {
  key: string
  modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
  handler: (event: KeyboardEvent) => void
  description?: string
  preventDefault?: boolean
  stopPropagation?: boolean
  disabled?: boolean
}

interface UseKeyboardNavigationOptions {
  shortcuts?: KeyboardShortcut[]
  enableArrowNavigation?: boolean
  enableTabNavigation?: boolean
  enableEscape?: boolean
  enableEnter?: boolean
  enableSpace?: boolean
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
  disabled?: boolean
  target?: HTMLElement | Document | null
  capture?: boolean
}

interface UseKeyboardNavigationReturn {
  addShortcut: (shortcut: KeyboardShortcut) => void
  removeShortcut: (key: string) => void
  clearShortcuts: () => void
  getShortcuts: () => KeyboardShortcut[]
  isEnabled: boolean
  setEnabled: (enabled: boolean) => void
}

/**
 * Hook for managing keyboard navigation and shortcuts
 * WCAG 2.1 AA compliant with proper keyboard support
 */
export function useKeyboardNavigation(
  options: UseKeyboardNavigationOptions = {}
): UseKeyboardNavigationReturn {
  const {
    shortcuts: initialShortcuts = [],
    enableArrowNavigation = false,
    enableTabNavigation = false,
    enableEscape = false,
    enableEnter = false,
    enableSpace = false,
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
    onBackspace,
    disabled = false,
    target = typeof document !== 'undefined' ? document : null,
    capture = false
  } = options

  const shortcutsRef = useRef<KeyboardShortcut[]>(initialShortcuts)
  const isEnabledRef = useRef(!disabled)
  const targetRef = useRef(target)

  // Update target ref when target changes
  useEffect(() => {
    targetRef.current = target
  }, [target])

  // Check if shortcut matches keyboard event
  const matchesShortcut = useCallback((shortcut: KeyboardShortcut, event: KeyboardEvent): boolean => {
    if (shortcut.disabled) return false
    
    const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                      event.code.toLowerCase() === shortcut.key.toLowerCase()
    
    if (!keyMatches) return false
    
    if (shortcut.modifiers) {
      const modifierStates = {
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey,
        meta: event.metaKey
      }
      
      return shortcut.modifiers.every(modifier => modifierStates[modifier])
    }
    
    return !event.ctrlKey && !event.shiftKey && !event.altKey && !event.metaKey
  }, [])

  // Handle keyboard events
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isEnabledRef.current) return

    // Check custom shortcuts first
    for (const shortcut of shortcutsRef.current) {
      if (matchesShortcut(shortcut, event)) {
        if (shortcut.preventDefault !== false) {
          event.preventDefault()
        }
        if (shortcut.stopPropagation) {
          event.stopPropagation()
        }
        shortcut.handler(event)
        return
      }
    }

    // Handle built-in navigation
    switch (event.key) {
      case 'ArrowUp':
        if (enableArrowNavigation && onArrowUp) {
          event.preventDefault()
          onArrowUp()
        }
        break
      case 'ArrowDown':
        if (enableArrowNavigation && onArrowDown) {
          event.preventDefault()
          onArrowDown()
        }
        break
      case 'ArrowLeft':
        if (enableArrowNavigation && onArrowLeft) {
          event.preventDefault()
          onArrowLeft()
        }
        break
      case 'ArrowRight':
        if (enableArrowNavigation && onArrowRight) {
          event.preventDefault()
          onArrowRight()
        }
        break
      case 'Tab':
        if (enableTabNavigation) {
          if (event.shiftKey && onShiftTab) {
            event.preventDefault()
            onShiftTab()
          } else if (onTab) {
            event.preventDefault()
            onTab()
          }
        }
        break
      case 'Enter':
        if (enableEnter && onEnter) {
          event.preventDefault()
          onEnter()
        }
        break
      case ' ':
        if (enableSpace && onSpace) {
          event.preventDefault()
          onSpace()
        }
        break
      case 'Escape':
        if (enableEscape && onEscape) {
          event.preventDefault()
          onEscape()
        }
        break
      case 'Home':
        if (onHome) {
          event.preventDefault()
          onHome()
        }
        break
      case 'End':
        if (onEnd) {
          event.preventDefault()
          onEnd()
        }
        break
      case 'PageUp':
        if (onPageUp) {
          event.preventDefault()
          onPageUp()
        }
        break
      case 'PageDown':
        if (onPageDown) {
          event.preventDefault()
          onPageDown()
        }
        break
      case 'Delete':
        if (onDelete) {
          event.preventDefault()
          onDelete()
        }
        break
      case 'Backspace':
        if (onBackspace) {
          event.preventDefault()
          onBackspace()
        }
        break
    }
  }, [
    matchesShortcut,
    enableArrowNavigation,
    enableTabNavigation,
    enableEscape,
    enableEnter,
    enableSpace,
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
  ])

  // Add keyboard event listener
  useEffect(() => {
    const currentTarget = targetRef.current
    if (!currentTarget) return

    currentTarget.addEventListener('keydown', handleKeyDown, capture)

    return () => {
      currentTarget.removeEventListener('keydown', handleKeyDown, capture)
    }
  }, [handleKeyDown, capture])

  // Shortcut management functions
  const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
    shortcutsRef.current = [...shortcutsRef.current, shortcut]
  }, [])

  const removeShortcut = useCallback((key: string) => {
    shortcutsRef.current = shortcutsRef.current.filter(s => s.key !== key)
  }, [])

  const clearShortcuts = useCallback(() => {
    shortcutsRef.current = []
  }, [])

  const getShortcuts = useCallback(() => {
    return [...shortcutsRef.current]
  }, [])

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled
  }, [])

  return {
    addShortcut,
    removeShortcut,
    clearShortcuts,
    getShortcuts,
    isEnabled: isEnabledRef.current,
    setEnabled
  }
}

/**
 * Hook for arrow key navigation in lists
 */
export function useArrowKeyNavigation(
  itemCount: number,
  currentIndex: number,
  onIndexChange: (index: number) => void,
  options: {
    loop?: boolean
    vertical?: boolean
    horizontal?: boolean
    disabled?: boolean
  } = {}
) {
  const { loop = true, vertical = true, horizontal = false, disabled = false } = options

  const handleArrowUp = useCallback(() => {
    if (disabled) return
    const newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? itemCount - 1 : 0)
    onIndexChange(newIndex)
  }, [currentIndex, itemCount, loop, disabled, onIndexChange])

  const handleArrowDown = useCallback(() => {
    if (disabled) return
    const newIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : (loop ? 0 : itemCount - 1)
    onIndexChange(newIndex)
  }, [currentIndex, itemCount, loop, disabled, onIndexChange])

  const handleArrowLeft = useCallback(() => {
    if (disabled) return
    const newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? itemCount - 1 : 0)
    onIndexChange(newIndex)
  }, [currentIndex, itemCount, loop, disabled, onIndexChange])

  const handleArrowRight = useCallback(() => {
    if (disabled) return
    const newIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : (loop ? 0 : itemCount - 1)
    onIndexChange(newIndex)
  }, [currentIndex, itemCount, loop, disabled, onIndexChange])

  useKeyboardNavigation({
    enableArrowNavigation: true,
    ...(vertical && { onArrowUp, onArrowDown }),
    ...(horizontal && { onArrowLeft, onArrowRight }),
    disabled
  })
}

/**
 * Hook for keyboard navigation in menus
 */
export function useMenuKeyboardNavigation(
  isOpen: boolean,
  itemCount: number,
  currentIndex: number,
  onIndexChange: (index: number) => void,
  onSelect: (index: number) => void,
  onClose: () => void,
  options: {
    loop?: boolean
    disabled?: boolean
  } = {}
) {
  const { loop = true, disabled = false } = options

  const handleArrowDown = useCallback(() => {
    if (!isOpen || disabled) return
    const newIndex = currentIndex < itemCount - 1 ? currentIndex + 1 : (loop ? 0 : itemCount - 1)
    onIndexChange(newIndex)
  }, [isOpen, currentIndex, itemCount, loop, disabled, onIndexChange])

  const handleArrowUp = useCallback(() => {
    if (!isOpen || disabled) return
    const newIndex = currentIndex > 0 ? currentIndex - 1 : (loop ? itemCount - 1 : 0)
    onIndexChange(newIndex)
  }, [isOpen, currentIndex, itemCount, loop, disabled, onIndexChange])

  const handleEnter = useCallback(() => {
    if (!isOpen || disabled) return
    onSelect(currentIndex)
  }, [isOpen, disabled, currentIndex, onSelect])

  const handleEscape = useCallback(() => {
    if (!isOpen || disabled) return
    onClose()
  }, [isOpen, disabled, onClose])

  useKeyboardNavigation({
    enableArrowNavigation: true,
    enableEnter: true,
    enableEscape: true,
    onArrowUp,
    onArrowDown,
    onEnter,
    onEscape,
    disabled: !isOpen || disabled
  })
}

/**
 * Hook for keyboard shortcuts with descriptions
 */
export function useKeyboardShortcuts(
  shortcuts: Array<{
    key: string
    modifiers?: ('ctrl' | 'shift' | 'alt' | 'meta')[]
    handler: () => void
    description: string
    disabled?: boolean
  }>,
  options: { disabled?: boolean } = {}
) {
  const { disabled = false } = options

  const keyboardShortcuts: KeyboardShortcut[] = shortcuts.map(shortcut => ({
    ...shortcut,
    description: shortcut.description,
    preventDefault: true
  }))

  const { getShortcuts } = useKeyboardNavigation({
    shortcuts: keyboardShortcuts,
    disabled
  })

  // Return shortcuts with descriptions for help/documentation
  const getShortcutsWithDescriptions = useCallback(() => {
    return getShortcuts().map(shortcut => ({
      key: shortcut.key,
      modifiers: shortcut.modifiers || [],
      description: shortcut.description || '',
      disabled: shortcut.disabled || false
    }))
  }, [getShortcuts])

  return {
    shortcuts: getShortcutsWithDescriptions(),
    getShortcuts: getShortcutsWithDescriptions
  }
}

/**
 * Utility to create keyboard shortcut descriptions
 */
export function formatShortcutDescription(
  key: string,
  modifiers: string[] = []
): string {
  const modifierSymbols = {
    ctrl: 'Ctrl',
    shift: 'Shift',
    alt: 'Alt',
    meta: '⌘' // Command key on Mac
  }

  const parts = [
    ...modifiers.map(mod => modifierSymbols[mod as keyof typeof modifierSymbols]),
    key.toUpperCase()
  ]

  return parts.join('+')
}

/**
 * Hook for announcing keyboard shortcuts to screen readers
 */
export function useKeyboardShortcutsAnnouncer() {
  const { announce } = useAnnouncer()

  const announceShortcut = useCallback((description: string) => {
    announce(`Keyboard shortcut: ${description}`, { priority: 'polite', clearAfter: 3000 })
  }, [announce])

  return {
    announceShortcut
  }
}

// Import the announcer hook
import { useAnnouncer } from './useAnnouncer'
