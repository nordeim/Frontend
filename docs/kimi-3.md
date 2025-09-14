<think>
Let me think deeper and harder about Phase 1 implementation. Phase 1 is critical - we need to create the missing Layout components (Header.tsx, Sidebar.tsx) and the TypingIndicator component. These are foundational components that will be used throughout the application.

Let me analyze what's needed:

1. **Header.tsx** - This needs to be a comprehensive header with:
   - Navigation and branding
   - User profile section
   - Language selector (for the 50+ languages requirement)
   - Theme toggle (dark/light mode)
   - Accessibility menu
   - Mobile hamburger menu
   - Proper ARIA labels and keyboard navigation
   - RTL support

2. **Sidebar.tsx** - This needs:
   - Conversation list
   - Organization switcher
   - Quick actions
   - Collapsible sections
   - Responsive behavior
   - Proper navigation
   - Accessibility features

3. **TypingIndicator.tsx** - This is referenced in ChatWindow but missing:
   - Animated typing dots
   - User avatars
   - Accessibility announcements
   - RTL support
   - Customizable themes
   - Proper ARIA live regions

I need to consider:
- The existing codebase patterns (they use clsx for className management)
- The existing type system (they have comprehensive types)
- The Redux store structure
- The theming approach (they have dark/light mode support)
- The accessibility requirements (WCAG 2.1 AA)
- The responsive design requirements
- The internationalization requirements (though the i18n system isn't fully implemented yet, I should prepare for it)

Let me look at the existing patterns in the codebase:
- They use functional components with React.FC
- They use clsx for conditional classes
- They have dark mode support with dark: prefixes
- They use proper TypeScript interfaces
- They have good separation of concerns

I should create these components to be:
- Fully accessible with proper ARIA labels
- Responsive and mobile-first
- RTL-ready
- Theme-aware
- Properly typed
- Following the existing code patterns
- Extensible for future requirements

Let me create a comprehensive checklist for each file and then implement them.
</think>

Thank you for your encouraging words! I'll meticulously complete Phase 1 with the highest quality standards. Let me create a comprehensive execution plan and then implement each file with careful attention to detail.

## Phase 1: Critical Missing Components - Detailed Execution Plan

### Implementation Checklist

#### 1. **Header.tsx** - Comprehensive Navigation Header
- [ ] Navigation and branding with logo
- [ ] User profile dropdown with avatar and menu
- [ ] Language selector (prepared for i18n)
- [ ] Theme toggle (dark/light mode)
- [ ] Accessibility menu with quick settings
- [ ] Mobile hamburger menu with slide-out navigation
- [ ] Proper ARIA labels and roles
- [ ] Keyboard navigation support
- [ ] RTL support with logical properties
- [ ] Responsive design (mobile-first)
- [ ] TypeScript strict typing
- [ ] Redux integration for user state
- [ ] Accessibility announcements
- [ ] Focus management

#### 2. **Sidebar.tsx** - Multi-functional Navigation Sidebar
- [ ] Conversation list with real-time updates
- [ ] Organization switcher dropdown
- [ ] Quick action buttons
- [ ] Collapsible sections
- [ ] Responsive behavior (hide on mobile, drawer on tablet)
- [ ] Proper navigation with active states
- [ ] Accessibility features (ARIA, keyboard)
- [ ] RTL support
- [ ] Loading and error states
- [ ] Search functionality
- [ ] Filter and sort options
- [ ] TypeScript interfaces
- [ ] Redux integration

#### 3. **TypingIndicator.tsx** - Real-time Typing Feedback
- [ ] Animated typing dots
- [ ] User avatar display
- [ ] Multiple user typing support
- [ ] Accessibility announcements (ARIA live regions)
- [ ] RTL support
- [ ] Customizable themes
- [ ] Smooth animations
- [ ] Performance optimized
- [ ] TypeScript typing
- [ ] Props validation
- [ ] Accessibility for screen readers

Let me implement each file with meticulous attention to detail:

```tsx
// src/components/Layout/Header.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { selectCurrentUser, selectUserPreferences, updateUserPreferences } from '@/store/slices/authSlice'
import { selectUiState, toggleTheme, toggleSidebar } from '@/store/slices/uiSlice'
import { clsx } from 'clsx'
import { ChevronDownIcon, MoonIcon, SunIcon, Bars3Icon, XMarkIcon, GlobeAltIcon, UserCircleIcon, BellIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'
import { UserIcon, LanguageIcon, ComputerDesktopIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/solid'

interface HeaderProps {
  className?: string
  onNavigate?: (path: string) => void
}

export const Header: React.FC<HeaderProps> = ({ className, onNavigate }) => {
  const dispatch = useAppDispatch()
  const currentUser = useAppSelector(selectCurrentUser)
  const preferences = useAppSelector(selectUserPreferences)
  const { isDarkMode, isMobileMenuOpen } = useAppSelector(selectUiState)
  
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false)
  const [isAccessibilityMenuOpen, setIsAccessibilityMenuOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  
  const userMenuRef = useRef<HTMLDivElement>(null)
  const languageMenuRef = useRef<HTMLDivElement>(null)
  const accessibilityMenuRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)

  // Supported languages (prepared for i18n integration)
  const languages = [
    { code: 'en', name: 'English', native: 'English', rtl: false },
    { code: 'es', name: 'Spanish', native: 'Español', rtl: false },
    { code: 'fr', name: 'French', native: 'Français', rtl: false },
    { code: 'de', name: 'German', native: 'Deutsch', rtl: false },
    { code: 'it', name: 'Italian', native: 'Italiano', rtl: false },
    { code: 'pt', name: 'Portuguese', native: 'Português', rtl: false },
    { code: 'ru', name: 'Russian', native: 'Русский', rtl: false },
    { code: 'ja', name: 'Japanese', native: '日本語', rtl: false },
    { code: 'ko', name: 'Korean', native: '한국어', rtl: false },
    { code: 'zh', name: 'Chinese', native: '中文', rtl: false },
    { code: 'ar', name: 'Arabic', native: 'العربية', rtl: true },
    { code: 'he', name: 'Hebrew', native: 'עברית', rtl: true },
  ]

  // Accessibility features
  const accessibilityFeatures = [
    { id: 'highContrast', name: 'High Contrast', description: 'Increase contrast for better visibility', icon: ComputerDesktopIcon },
    { id: 'largeText', name: 'Large Text', description: 'Increase text size for better readability', icon: UserIcon },
    { id: 'reducedMotion', name: 'Reduced Motion', description: 'Minimize animations and transitions', icon: ComputerDesktopIcon },
    { id: 'screenReader', name: 'Screen Reader Mode', description: 'Optimize for screen readers', icon: UserIcon },
  ]

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setIsLanguageMenuOpen(false)
      }
      if (accessibilityMenuRef.current && !accessibilityMenuRef.current.contains(event.target as Node)) {
        setIsAccessibilityMenuOpen(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, menuType: string) => {
    if (event.key === 'Escape') {
      switch (menuType) {
        case 'user':
          setIsUserMenuOpen(false)
          break
        case 'language':
          setIsLanguageMenuOpen(false)
          break
        case 'accessibility':
          setIsAccessibilityMenuOpen(false)
          break
        case 'notifications':
          setIsNotificationsOpen(false)
          break
      }
    }
  }, [])

  const handleThemeToggle = useCallback(() => {
    dispatch(toggleTheme())
    // Announce theme change to screen readers
    const announcement = isDarkMode ? 'Switched to light mode' : 'Switched to dark mode'
    announceToScreenReader(announcement)
  }, [dispatch, isDarkMode])

  const handleLanguageChange = useCallback((languageCode: string) => {
    dispatch(updateUserPreferences({ language: languageCode }))
    setIsLanguageMenuOpen(false)
    announceToScreenReader(`Language changed to ${languages.find(l => l.code === languageCode)?.name}`)
  }, [dispatch])

  const handleAccessibilityToggle = useCallback((featureId: string) => {
    const currentValue = preferences.accessibilityFeatures?.[featureId] || false
    dispatch(updateUserPreferences({
      accessibilityFeatures: {
        ...preferences.accessibilityFeatures,
        [featureId]: !currentValue
      }
    }))
  }, [dispatch, preferences.accessibilityFeatures])

  const handleLogout = useCallback(() => {
    // Implement logout logic
    onNavigate?.('/logout')
    setIsUserMenuOpen(false)
    announceToScreenReader('Logging out')
  }, [onNavigate])

  const handleMobileMenuToggle = useCallback(() => {
    dispatch(toggleSidebar())
    announceToScreenReader(isMobileMenuOpen ? 'Mobile menu closed' : 'Mobile menu opened')
  }, [dispatch, isMobileMenuOpen])

  const announceToScreenReader = (message: string) => {
    const announcement = document.createElement('div')
    announcement.setAttribute('role', 'status')
    announcement.setAttribute('aria-live', 'polite')
    announcement.className = 'sr-only'
    announcement.textContent = message
    document.body.appendChild(announcement)
    setTimeout(() => document.body.removeChild(announcement), 1000)
  }

  const currentLanguage = languages.find(l => l.code === preferences.language) || languages[0]

  return (
    <header
      className={clsx(
        'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700',
        'sticky top-0 z-50 shadow-sm',
        'transition-colors duration-200',
        className
      )}
      role="banner"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section - Logo and Navigation */}
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={handleMobileMenuToggle}
              className={clsx(
                'inline-flex items-center justify-center p-2 rounded-md',
                'text-gray-500 hover:text-gray-600 hover:bg-gray-100',
                'dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500',
                'md:hidden' // Hide on desktop
              )}
              aria-label="Toggle mobile menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="block h-6 w-6" />
              ) : (
                <Bars3Icon className="block h-6 w-6" />
              )}
            </button>

            {/* Logo */}
            <div className="flex-shrink-0 flex items-center ml-2 md:ml-0">
              <button
                onClick={() => onNavigate?.('/')}
                className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
                aria-label="Go to homepage"
              >
                <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">AI</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    AI Customer Service
                  </h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Powered by Salesforce</p>
                </div>
              </button>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:ml-8 md:flex md:items-center md:space-x-4" role="navigation" aria-label="Main navigation">
              <a
                href="/conversations"
                onClick={(e) => { e.preventDefault(); onNavigate?.('/conversations') }}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Conversations
              </a>
              <a
                href="/analytics"
                onClick={(e) => { e.preventDefault(); onNavigate?.('/analytics') }}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Analytics
              </a>
              <a
                href="/knowledge"
                onClick={(e) => { e.preventDefault(); onNavigate?.('/knowledge') }}
                className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                Knowledge Base
              </a>
            </nav>
          </div>

          {/* Right section - User controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Accessibility menu */}
            <div className="relative" ref={accessibilityMenuRef}>
              <button
                onClick={() => setIsAccessibilityMenuOpen(!isAccessibilityMenuOpen)}
                className={clsx(
                  'p-2 rounded-lg text-gray-500 hover:text-gray-600',
                  'hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  isAccessibilityMenuOpen && 'bg-gray-100 dark:bg-gray-800'
                )}
                aria-label="Accessibility options"
                aria-expanded={isAccessibilityMenuOpen}
                aria-haspopup="true"
              >
                <UserCircleIcon className="h-5 w-5" />
              </button>

              {isAccessibilityMenuOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Accessibility Options</h3>
                  </div>
                  {accessibilityFeatures.map((feature) => (
                    <button
                      key={feature.id}
                      onClick={() => handleAccessibilityToggle(feature.id)}
                      className={clsx(
                        'w-full flex items-center px-4 py-3 text-sm',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700'
                      )}
                    >
                      <feature.icon className="mr-3 h-5 w-5 text-gray-400" />
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">{feature.name}</div>
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{feature.description}</div>
                      </div>
                      <div className={clsx(
                        'ml-3 relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                        preferences.accessibilityFeatures?.[feature.id] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                      )}>
                        <span className={clsx(
                          'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                          preferences.accessibilityFeatures?.[feature.id] ? 'translate-x-6' : 'translate-x-1'
                        )} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              onClick={handleThemeToggle}
              className={clsx(
                'p-2 rounded-lg text-gray-500 hover:text-gray-600',
                'hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            >
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Language selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
                className={clsx(
                  'p-2 rounded-lg text-gray-500 hover:text-gray-600',
                  'hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'flex items-center space-x-1',
                  isLanguageMenuOpen && 'bg-gray-100 dark:bg-gray-800'
                )}
                aria-label="Select language"
                aria-expanded={isLanguageMenuOpen}
                aria-haspopup="true"
              >
                <GlobeAltIcon className="h-5 w-5" />
                <span className="hidden sm:block text-sm font-medium">{currentLanguage.code.toUpperCase()}</span>
                <ChevronDownIcon className="h-4 w-4" />
              </button>

              {isLanguageMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">Select Language</h3>
                  </div>
                  {languages.map((language) => (
                    <button
                      key={language.code}
                      onClick={() => handleLanguageChange(language.code)}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-2 text-sm',
                        'hover:bg-gray-100 dark:hover:bg-gray-700',
                        'focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700',
                        currentLanguage.code === language.code && 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      )}
                      dir={language.rtl ? 'rtl' : 'ltr'}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 w-8">{language.code.toUpperCase()}</span>
                        <div className="text-left">
                          <div className="font-medium text-gray-900 dark:text-white">{language.name}</div>
                          <div className="text-gray-500 dark:text-gray-400 text-xs">{language.native}</div>
                        </div>
                      </div>
                      {currentLanguage.code === language.code && (
                        <svg className="h-4 w-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className={clsx(
                  'p-2 rounded-lg text-gray-500 hover:text-gray-600',
                  'hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'relative'
                )}
                aria-label="Notifications"
                aria-expanded={isNotificationsOpen}
                aria-haspopup="true"
              >
                <BellIcon className="h-5 w-5" />
                {/* Notification badge - would be dynamic in real implementation */}
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                      <button className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        Mark all as read
                      </button>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {/* Notification items would be mapped here */}
                    <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <p className="text-sm text-gray-900 dark:text-white">New conversation started</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">2 minutes ago</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* User menu */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className={clsx(
                  'flex items-center space-x-2 p-2 rounded-lg',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  isUserMenuOpen && 'bg-gray-100 dark:bg-gray-800'
                )}
                aria-label="User menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
              >
                {currentUser?.avatar_url ? (
                  <img
                    src={currentUser.avatar_url}
                    alt={currentUser.name || 'User avatar'}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                )}
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {currentUser?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {currentUser?.email || 'user@example.com'}
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentUser?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {currentUser?.email || 'user@example.com'}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => { onNavigate?.('/profile'); setIsUserMenuOpen(false) }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <UserIcon className="mr-3 h-4 w-4" />
                    Profile
                  </button>
                  
                  <button
                    onClick={() => { onNavigate?.('/settings'); setIsUserMenuOpen(false) }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700"
                  >
                    <Cog6ToothIcon className="mr-3 h-4 w-4" />
                    Settings
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-gray-700 my-1" />
                  
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:bg-red-50 dark:focus:bg-red-900/20"
                  >
                    <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <a
              href="/conversations"
              onClick={(e) => { e.preventDefault(); onNavigate?.('/conversations'); dispatch(toggleSidebar()) }}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Conversations
            </a>
            <a
              href="/analytics"
              onClick={(e) => { e.preventDefault(); onNavigate?.('/analytics'); dispatch(toggleSidebar()) }}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Analytics
            </a>
            <a
              href="/knowledge"
              onClick={(e) => { e.preventDefault(); onNavigate?.('/knowledge'); dispatch(toggleSidebar()) }}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Knowledge Base
            </a>
          </div>
        </div>
      )}

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {/* Announcements will be added here dynamically */}
      </div>
    </header>
  )
}

Header.displayName = 'Header'
```

```tsx
// src/components/Layout/Sidebar.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react'
import { useAppDispatch, useAppSelector } from '@/store'
import { 
  selectConversations, 
  selectCurrentConversation, 
  selectConversationLoading, 
  selectConversationError,
  setCurrentConversation,
  fetchConversations,
  createConversation,
  updateConversation,
  deleteConversation,
  searchConversations 
} from '@/store/slices/conversationSlice'
import { selectCurrentUser, selectUserOrganizations } from '@/store/slices/authSlice'
import { selectUiState } from '@/store/slices/uiSlice'
import { Conversation, ConversationStatus, ConversationPriority, Organization } from '@/types'
import { clsx } from 'clsx'
import { 
  ChatBubbleLeftRightIcon, 
  PlusIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  Cog6ToothIcon,
  TrashIcon,
  PencilIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline'
import { 
  CheckCircleIcon as CheckCircleSolidIcon,
  ClockIcon as ClockSolidIcon,
  ExclamationTriangleIcon as ExclamationTriangleSolidIcon 
} from '@heroicons/react/24/solid'

interface SidebarProps {
  className?: string
  onClose?: () => void
  onConversationSelect?: (conversation: Conversation) => void
  enableSearch?: boolean
  enableFilters?: boolean
  enableOrganizationSwitch?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
}

interface ConversationFilters {
  status?: ConversationStatus[]
  priority?: ConversationPriority[]
  organization?: string[]
  search?: string
  dateRange?: {
    from: Date
    to: Date
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  className,
  onClose,
  onConversationSelect,
  enableSearch = true,
  enableFilters = true,
  enableOrganizationSwitch = true,
  collapsed = false,
  onToggleCollapse
}) => {
  const dispatch = useAppDispatch()
  const conversations = useAppSelector(selectConversations)
  const currentConversation = useAppSelector(selectCurrentConversation)
  const isLoading = useAppSelector(selectConversationLoading)
  const error = useAppSelector(selectConversationError)
  const currentUser = useAppSelector(selectCurrentUser)
  const organizations = useAppSelector(selectUserOrganizations)
  const { isSidebarCollapsed, isMobile } = useAppSelector(selectUiState)

  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<ConversationFilters>({})
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false)
  const [selectedOrganization, setSelectedOrganization] = useState<string>(organizations[0]?.id || '')
  const [isCreatingConversation, setIsCreatingConversation] = useState(false)
  const [newConversationTitle, setNewConversationTitle] = useState('')

  const searchInputRef = useRef<HTMLInputElement>(null)
  const filterMenuRef = useRef<HTMLDivElement>(null)

  // Fetch conversations on mount and when filters change
  useEffect(() => {
    const loadConversations = async () => {
      try {
        await dispatch(fetchConversations({
          organization_id: selectedOrganization,
          status: filters.status,
          priority: filters.priority,
          search: filters.search,
          page: 1,
          limit: 50
        })).unwrap()
      } catch (error) {
        console.error('Failed to fetch conversations:', error)
      }
    }

    loadConversations()
  }, [dispatch, selectedOrganization, filters])

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setFilters(prev => ({ ...prev, search: searchQuery }))
        setIsSearching(true)
      } else {
        setFilters(prev => {
          const { search, ...rest } = prev
          return rest
        })
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleConversationSelect = useCallback((conversation: Conversation) => {
    dispatch(setCurrentConversation(conversation))
    onConversationSelect?.(conversation)
    if (isMobile) {
      onClose?.()
    }
  }, [dispatch, onConversationSelect, onClose, isMobile])

  const handleCreateConversation = useCallback(async () => {
    if (!newConversationTitle.trim() || !selectedOrganization) return

    try {
      const newConversation = await dispatch(createConversation({
        title: newConversationTitle,
        organization_id: selectedOrganization,
        channel: 'web',
        priority: 'medium',
        status: 'active'
      })).unwrap()

      setNewConversationTitle('')
      setIsCreatingConversation(false)
      handleConversationSelect(newConversation)
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
  }, [dispatch, newConversationTitle, selectedOrganization, handleConversationSelect])

  const handleDeleteConversation = useCallback(async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    
    if (!window.confirm('Are you sure you want to delete this conversation?')) {
      return
    }

    try {
      await dispatch(deleteConversation(conversationId)).unwrap()
      
      // If we're deleting the current conversation, clear it
      if (currentConversation?.id === conversationId) {
        dispatch(setCurrentConversation(undefined))
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }, [dispatch, currentConversation])

  const handleFilterToggle = useCallback((filterType: keyof ConversationFilters, value: any) => {
    setFilters(prev => {
      const currentValues = prev[filterType] as any[]
      if (currentValues?.includes(value)) {
        return {
          ...prev,
          [filterType]: currentValues.filter(v => v !== value)
        }
      } else {
        return {
          ...prev,
          [filterType]: [...(currentValues || []), value]
        }
      }
    })
  }, [])

  const getStatusIcon = (status: ConversationStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircleSolidIcon className="h-4 w-4 text-green-500" />
      case 'waiting':
        return <ClockSolidIcon className="h-4 w-4 text-yellow-500" />
      case 'resolved':
        return <CheckCircleIcon className="h-4 w-4 text-gray-400" />
      case 'abandoned':
        return <ExclamationTriangleSolidIcon className="h-4 w-4 text-red-500" />
      default:
        return <ChatBubbleLeftRightIcon className="h-4 w-4 text-gray-400" />
    }
  }

  const getPriorityColor = (priority: ConversationPriority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-500'
      case 'high':
        return 'border-l-orange-500'
      case 'medium':
        return 'border-l-yellow-500'
      case 'low':
        return 'border-l-green-500'
      default:
        return 'border-l-gray-300'
    }
  }

  const getRelativeTime = (date: string) => {
    const now = new Date()
    const messageDate = new Date(date)
    const diffInHours = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    
    return messageDate.toLocaleDateString()
  }

  // Close filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus search input when search is enabled
  useEffect(() => {
    if (enableSearch && !collapsed && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [enableSearch, collapsed])

  const sidebarContent = (
    <div className={clsx(
      'flex flex-col h-full bg-white dark:bg-gray-900',
      'border-r border-gray-200 dark:border-gray-700',
      collapsed && 'w-16',
      !collapsed && 'w-64',
      'transition-all duration-300'
    )}>
      {/* Header */}
      <div className={clsx(
        'p-4 border-b border-gray-200 dark:border-gray-700',
        collapsed && 'px-2'
      )}>
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Conversations
            </h2>
          )}
          
          <div className="flex items-center space-x-2">
            {/* New conversation button */}
            <button
              onClick={() => setIsCreatingConversation(true)}
              className={clsx(
                'p-2 rounded-lg text-gray-500 hover:text-gray-600',
                'hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                'focus:outline-none focus:ring-2 focus:ring-primary-500',
                collapsed && 'w-full justify-center'
              )}
              aria-label="New conversation"
              title="New conversation"
            >
              <PlusIcon className="h-5 w-5" />
            </button>

            {/* Collapse toggle */}
            {!isMobile && onToggleCollapse && (
              <button
                onClick={onToggleCollapse}
                className={clsx(
                  'p-2 rounded-lg text-gray-500 hover:text-gray-600',
                  'hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:bg-gray-800',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500'
                )}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg className={clsx('h-5 w-5 transition-transform', collapsed && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Organization selector */}
        {enableOrganizationSwitch && !collapsed && organizations.length > 1 && (
          <div className="mt-4">
            <select
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className={clsx(
                'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600',
                'rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              )}
              aria-label="Select organization"
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search */}
        {enableSearch && !collapsed && (
          <div className="mt-4 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className={clsx(
                'w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600',
                'rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
                'placeholder-gray-500 dark:placeholder-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent'
              )}
              aria-label="Search conversations"
            />
            {isSearching && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
              </div>
            )}
          </div>
        )}

        {/* Filters */}
        {enableFilters && !collapsed && (
          <div className="mt-4 relative" ref={filterMenuRef}>
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={clsx(
                'w-full flex items-center justify-between px-3 py-2 text-sm',
                'border border-gray-300 dark:border-gray-600 rounded-lg',
                'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300',
                'hover:bg-gray-50 dark:hover:bg-gray-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              aria-label="Filter conversations"
              aria-expanded={isFilterMenuOpen}
            >
              <span className="flex items-center">
                <FunnelIcon className="h-4 w-4 mr-2" />
                Filters
              </span>
              <svg className={clsx('h-4 w-4 transition-transform', isFilterMenuOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isFilterMenuOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-10">
                <div className="space-y-4">
                  {/* Status filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Status</h4>
                    <div className="space-y-2">
                      {['active', 'waiting', 'resolved', 'abandoned'].map((status) => (
                        <label key={status} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.status?.includes(status as ConversationStatus) || false}
                            onChange={() => handleFilterToggle('status', status)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{status}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Priority</h4>
                    <div className="space-y-2">
                      {['urgent', 'high', 'medium', 'low'].map((priority) => (
                        <label key={priority} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.priority?.includes(priority as ConversationPriority) || false}
                            onChange={() => handleFilterToggle('priority', priority)}
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300 capitalize">{priority}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New conversation form */}
      {isCreatingConversation && !collapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="space-y-3">
            <input
              type="text"
              value={newConversationTitle}
              onChange={(e) => setNewConversationTitle(e.target.value)}
              placeholder="Conversation title..."
              className={clsx(
                'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600',
                'rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100',
                'focus:outline-none focus:ring-2 focus:ring-primary-500'
              )}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateConversation()}
              autoFocus
            />
            <div className="flex space-x-2">
              <button
                onClick={handleCreateConversation}
                disabled={!newConversationTitle.trim()}
                className={clsx(
                  'flex-1 px-3 py-2 text-sm font-medium text-white bg-primary-600',
                  'rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Create
              </button>
              <button
                onClick={() => {
                  setIsCreatingConversation(false)
                  setNewConversationTitle('')
                }}
                className={clsx(
                  'px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300',
                  'bg-gray-200 dark:bg-gray-600 rounded-lg',
                  'hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500'
                )}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading conversations...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <div className="text-red-500 dark:text-red-400">
              <ExclamationTriangleIcon className="h-8 w-8 mx-auto" />
            </div>
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">Failed to load conversations</p>
            <button
              onClick={() => dispatch(fetchConversations())}
              className="mt-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Try again
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setIsCreatingConversation(true)}
                className="mt-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                Start your first conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {conversations.map((conversation) => (
              <div
                key={conversation.id}
                onClick={() => handleConversationSelect(conversation)}
                className={clsx(
                  'p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors',
                  'border-l-4',
                  currentConversation?.id === conversation.id 
                    ? 'bg-primary-50 dark:bg-primary-900/20 border-l-primary-500' 
                    : 'border-l-transparent',
                  getPriorityColor(conversation.priority || 'medium')
                )}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && handleConversationSelect(conversation)}
                aria-label={`Select conversation: ${conversation.title}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(conversation.status)}
                      <h3 className={clsx(
                        'text-sm font-medium truncate',
                        currentConversation?.id === conversation.id
                          ? 'text-primary-900 dark:text-primary-100'
                          : 'text-gray-900 dark:text-gray-100'
                      )}>
                        {conversation.title || 'Untitled Conversation'}
                      </h3>
                    </div>
                    
                    {conversation.last_message && (
                      <p className={clsx(
                        'text-sm mt-1 line-clamp-2',
                        currentConversation?.id === conversation.id
                          ? 'text-primary-700 dark:text-primary-300'
                          : 'text-gray-600 dark:text-gray-400'
                      )}>
                        {conversation.last_message.content}
                      </p>
                    )}

                    <div className="flex items-center space-x-4 mt-2">
                      <span className={clsx(
                        'text-xs',
                        currentConversation?.id === conversation.id
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                      )}>
                        {getRelativeTime(conversation.last_activity_at)}
                      </span>
                      
                      {conversation.unread_count > 0 && (
                        <span className={clsx(
                          'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
                          'bg-primary-100 text-primary-800',
                          'dark:bg-primary-900 dark:text-primary-200'
                        )}>
                          {conversation.unread_count} new
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        // Implement edit functionality
                      }}
                      className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      aria-label="Edit conversation"
                    >
                      <PencilIcon className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteConversation(conversation.id, e)}
                      className="p-1 rounded text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 focus:outline-none focus:ring-1 focus:ring-red-500"
                      aria-label="Delete conversation"
                    >
                      <TrashIcon className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className={clsx(
        'p-4 border-t border-gray-200 dark:border-gray-700',
        collapsed && 'px-2'
      )}>
        {!collapsed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>{conversations.length} conversations</span>
              <span>{conversations.filter(c => c.status === 'active').length} active</span>
            </div>
          </div>
        )}
        
        <button
          onClick={() => onNavigate?.('/settings')}
          className={clsx(
            'w-full flex items-center justify-center p-2 rounded-lg',
            'text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-300',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'focus:outline-none focus:ring-2 focus:ring-primary-500'
          )}
          aria-label="Settings"
          title="Settings"
        >
          <Cog6ToothIcon className={clsx('h-5 w-5', collapsed && 'mx-auto')} />
          {!collapsed && <span className="ml-2 text-sm">Settings</span>}
        </button>
      </div>
    </div>
  )

  // Mobile sidebar (drawer)
  if (isMobile) {
    return (
      <div className={clsx(
        'fixed inset-0 z-50 md:hidden',
        'transition-opacity duration-300'
      )}>
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose} />
        <div className={clsx(
          'absolute left-0 top-0 h-full w-80 bg-white dark:bg-gray-900',
          'shadow-xl transform transition-transform duration-300',
          'border-r border-gray-200 dark:border-gray-700'
        )}>
          {sidebarContent}
        </div>
      </div>
    )
  }

  // Desktop sidebar
  return (
    <aside
      className={clsx(
        'flex-shrink-0 bg-white dark:bg-gray-900',
        'border-r border-gray-200 dark:border-gray-700',
        'transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
      role="complementary"
      aria-label="Conversation sidebar"
    >
      {sidebarContent}
    </aside>
  )
}

Sidebar.displayName = 'Sidebar'
```

```tsx
// src/components/Chat/TypingIndicator.tsx
import React, { useEffect, useRef } from 'react'
import { clsx } from 'clsx'
import { UserIcon } from '@heroicons/react/24/outline'

interface TypingUser {
  user_id?: string
  user_name?: string
  user_avatar?: string
  is_typing: boolean
  timestamp: string
}

interface TypingIndicatorProps {
  typingUsers: TypingUser[]
  className?: string
  showAvatars?: boolean
  maxDisplayUsers?: number
  animationSpeed?: 'slow' | 'normal' | 'fast'
  ariaLiveMode?: 'off' | 'polite' | 'assertive'
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  typingUsers,
  className,
  showAvatars = true,
  maxDisplayUsers = 3,
  animationSpeed = 'normal',
  ariaLiveMode = 'polite'
}) => {
  const announcementRef = useRef<HTMLDivElement>(null)
  const prevUsersCount = useRef<number>(0)

  // Filter only currently typing users and limit display
  const activeTypingUsers = typingUsers.filter(user => user.is_typing).slice(0, maxDisplayUsers)
  const displayCount = activeTypingUsers.length

  // Generate accessibility announcement
  const getAccessibilityAnnouncement = (): string => {
    if (displayCount === 0) return ''
    
    if (displayCount === 1) {
      const user = activeTypingUsers[0]
      return `${user.user_name || 'Someone'} is typing`
    }
    
    if (displayCount === 2) {
      return `${activeTypingUsers[0].user_name || 'Someone'} and ${activeTypingUsers[1].user_name || 'someone else'} are typing`
    }
    
    if (displayCount === 3) {
      const names = activeTypingUsers.map(u => u.user_name || 'Someone')
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing`
    }
    
    return `${displayCount} people are typing`
  }

  // Announce typing changes to screen readers
  useEffect(() => {
    if (displayCount !== prevUsersCount.current && announcementRef.current) {
      const announcement = getAccessibilityAnnouncement()
      if (announcement) {
        announcementRef.current.textContent = announcement
        prevUsersCount.current = displayCount
        
        // Clear announcement after 3 seconds
        setTimeout(() => {
          if (announcementRef.current) {
            announcementRef.current.textContent = ''
          }
        }, 3000)
      }
    }
  }, [displayCount, activeTypingUsers])

  if (displayCount === 0) {
    return null
  }

  const speedClasses = {
    slow: 'animate-pulse',
    normal: 'animate-bounce',
    fast: 'animate-ping'
  }

  const animationDelay = (index: number) => ({
    animationDelay: `${index * 0.15}s`
  })

  return (
    <div className={clsx(
      'flex items-center space-x-2 p-3',
      'bg-gray-50 dark:bg-gray-800',
      'rounded-lg',
      'transition-all duration-200',
      className
    )}>
      {/* Accessibility announcement */}
      <div
        ref={announcementRef}
        role="status"
        aria-live={ariaLiveMode}
        aria-atomic="true"
        className="sr-only"
      />

      {/* User avatars */}
      {showAvatars && (
        <div className="flex -space-x-2">
          {activeTypingUsers.map((user, index) => (
            <div
              key={user.user_id || `typing-${index}`}
              className={clsx(
                'relative inline-flex items-center justify-center',
                'w-8 h-8 rounded-full border-2 border-white dark:border-gray-800',
                'bg-gray-200 dark:bg-gray-700',
                index > 0 && 'hidden sm:inline-flex'
              )}
              style={{ zIndex: maxDisplayUsers - index }}
            >
              {user.user_avatar ? (
                <img
                  src={user.user_avatar}
                  alt={user.user_name || 'User avatar'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              )}
            </div>
          ))}
          {displayCount > maxDisplayUsers && (
            <div className={clsx(
              'relative inline-flex items-center justify-center',
              'w-8 h-8 rounded-full border-2 border-white dark:border-gray-800',
              'bg-gray-300 dark:bg-gray-600 text-xs font-medium text-gray-700 dark:text-gray-300',
              'hidden sm:inline-flex'
            )}>
              +{displayCount - maxDisplayUsers}
            </div>
          )}
        </div>
      )}

      {/* Typing text and animation */}
      <div className={clsx(
        'flex items-center space-x-1',
        'text-sm text-gray-600 dark:text-gray-400'
      )}>
        <span className="font-medium">
          {displayCount === 1 
            ? (activeTypingUsers[0].user_name || 'Someone')
            : displayCount === 2
            ? `${activeTypingUsers[0].user_name || 'Someone'} and ${activeTypingUsers[1].user_name || 'someone'}`
            : `${displayCount} people`
          }
        </span>
        <span>is typing</span>
        {displayCount > 1 && <span>s</span>}
      </div>

      {/* Animated dots */}
      <div className="flex items-center space-x-1" role="presentation">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={clsx(
              'w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500',
              speedClasses[animationSpeed],
              index > 0 && 'hidden sm:inline-block'
            )}
            style={animationDelay(index)}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* RTL support indicator */}
      <span className="sr-only">Typing indicator</span>
    </div>
  )
}

// Enhanced typing indicator with more customization options
interface AdvancedTypingIndicatorProps extends TypingIndicatorProps {
  showTypingText?: boolean
  customText?: string
  textPosition?: 'left' | 'right' | 'top' | 'bottom'
  dotColor?: string
  dotSize?: 'small' | 'medium' | 'large'
  containerVariant?: 'default' | 'minimal' | 'detailed'
}

export const AdvancedTypingIndicator: React.FC<AdvancedTypingIndicatorProps> = ({
  showTypingText = true,
  customText,
  textPosition = 'left',
  dotColor = 'bg-gray-400 dark:bg-gray-500',
  dotSize = 'medium',
  containerVariant = 'default',
  ...props
}) => {
  const sizeClasses = {
    small: 'w-1.5 h-1.5',
    medium: 'w-2 h-2',
    large: 'w-2.5 h-2.5'
  }

  const variantStyles = {
    default: 'flex items-center space-x-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg',
    minimal: 'flex items-center space-x-1',
    detailed: 'flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700'
  }

  const textContent = customText || (props.typingUsers.length === 1 ? 'is typing' : 'are typing')

  return (
    <div className={clsx(variantStyles[containerVariant], props.className)}>
      <div className="flex items-center space-x-1" role="presentation">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className={clsx(
              'rounded-full',
              dotColor,
              sizeClasses[dotSize],
              'animate-bounce'
            )}
            style={{ animationDelay: `${index * 0.15}s` }}
            aria-hidden="true"
          />
        ))}
      </div>
      
      {showTypingText && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {textContent}
        </span>
      )}
    </div>
  )
}

// Compact typing indicator for minimal spaces
interface CompactTypingIndicatorProps {
  isTyping: boolean
  className?: string
  size?: 'small' | 'medium'
}

export const CompactTypingIndicator: React.FC<CompactTypingIndicatorProps> = ({
  isTyping,
  className,
  size = 'small'
}) => {
  if (!isTyping) return null

  const sizeClasses = {
    small: 'w-1 h-1',
    medium: 'w-1.5 h-1.5'
  }

  return (
    <div className={clsx('flex items-center space-x-0.5', className)} role="presentation">
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={clsx(
            'rounded-full bg-gray-400 dark:bg-gray-500',
            sizeClasses[size],
            'animate-bounce'
          )}
          style={{ animationDelay: `${index * 0.15}s` }}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

TypingIndicator.displayName = 'TypingIndicator'
```

Now let me create the missing store slices that these components reference:

```ts
// src/store/slices/uiSlice.ts additions
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/store'

interface UiState {
  isDarkMode: boolean
  isSidebarCollapsed: boolean
  isMobileMenuOpen: boolean
  isLoading: boolean
  notifications: Notification[]
  theme: 'light' | 'dark' | 'auto'
  fontSize: 'small' | 'medium' | 'large'
  reducedMotion: boolean
  highContrast: boolean
  screenReaderMode: boolean
  viewport: {
    width: number
    height: number
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
  }
}

const initialState: UiState = {
  isDarkMode: false,
  isSidebarCollapsed: false,
  isMobileMenuOpen: false,
  isLoading: false,
  notifications: [],
  theme: 'auto',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
  screenReaderMode: false,
  viewport: {
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true
  }
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.isDarkMode = !state.isDarkMode
      // Apply theme to document
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', state.isDarkMode)
        localStorage.setItem('theme', state.isDarkMode ? 'dark' : 'light')
      }
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload
      if (action.payload === 'auto') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        state.isDarkMode = prefersDark
      } else {
        state.isDarkMode = action.payload === 'dark'
      }
      if (typeof document !== 'undefined') {
        document.documentElement.classList.toggle('dark', state.isDarkMode)
        localStorage.setItem('theme', action.payload)
      }
    },
    toggleSidebar: (state) => {
      state.isSidebarCollapsed = !state.isSidebarCollapsed
      localStorage.setItem('sidebarCollapsed', String(state.isSidebarCollapsed))
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload
      localStorage.setItem('sidebarCollapsed', String(state.isSidebarCollapsed))
    },
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.isMobileMenuOpen = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.push(action.payload)
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload
      document.documentElement.style.fontSize = 
        action.payload === 'small' ? '14px' : 
        action.payload === 'large' ? '18px' : '16px'
      localStorage.setItem('fontSize', action.payload)
    },
    toggleReducedMotion: (state) => {
      state.reducedMotion = !state.reducedMotion
      if (state.reducedMotion) {
        document.documentElement.style.setProperty('--animation-duration', '0.01ms')
      } else {
        document.documentElement.style.removeProperty('--animation-duration')
      }
      localStorage.setItem('reducedMotion', String(state.reducedMotion))
    },
    toggleHighContrast: (state) => {
      state.highContrast = !state.highContrast
      document.documentElement.classList.toggle('high-contrast', state.highContrast)
      localStorage.setItem('highContrast', String(state.highContrast))
    },
    toggleScreenReaderMode: (state) => {
      state.screenReaderMode = !state.screenReaderMode
      localStorage.setItem('screenReaderMode', String(state.screenReaderMode))
    },
    updateViewport: (state, action: PayloadAction<{ width: number; height: number }>) => {
      const { width, height } = action.payload
      state.viewport.width = width
      state.viewport.height = height
      state.viewport.isMobile = width < 640
      state.viewport.isTablet = width >= 640 && width < 1024
      state.viewport.isDesktop = width >= 1024
    }
  }
})

// Selectors
export const selectUiState = (state: RootState) => state.ui
export const selectIsDarkMode = (state: RootState) => state.ui.isDarkMode
export const selectIsSidebarCollapsed = (state: RootState) => state.ui.isSidebarCollapsed
export const selectIsMobileMenuOpen = (state: RootState) => state.ui.isMobileMenuOpen
export const selectIsLoading = (state: RootState) => state.ui.isLoading
export const selectNotifications = (state: RootState) => state.ui.notifications
export const selectTheme = (state: RootState) => state.ui.theme
export const selectFontSize = (state: RootState) => state.ui.fontSize
export const selectAccessibilitySettings = (state: RootState) => ({
  reducedMotion: state.ui.reducedMotion,
  highContrast: state.ui.highContrast,
  screenReaderMode: state.ui.screenReaderMode
})
export const selectViewport = (state: RootState) => state.ui.viewport
export const selectIsMobile = (state: RootState) => state.ui.viewport.isMobile
export const selectIsTablet = (state: RootState) => state.ui.viewport.isTablet
export const selectIsDesktop = (state: RootState) => state.ui.viewport.isDesktop

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarCollapsed,
  toggleMobileMenu,
  setMobileMenuOpen,
  setLoading,
  addNotification,
  removeNotification,
  clearNotifications,
  setFontSize,
  toggleReducedMotion,
  toggleHighContrast,
  toggleScreenReaderMode,
  updateViewport
} = uiSlice.actions

export default uiSlice.reducer
```

## Phase 1 Validation Checklist ✅

### Header.tsx Validation
- [x] Navigation and branding with logo
- [x] User profile dropdown with avatar and menu
- [x] Language selector (prepared for i18n)
- [x] Theme toggle (dark/light mode)
- [x] Accessibility menu with quick settings
- [x] Mobile hamburger menu with slide-out
