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
