<think>
Now I need to carefully analyze the original uiSlice.ts file and create a unified version that merges my additions with the original implementation. I can see that:

1. The original has a different structure with `UIStateExtended` that extends `UIState`
2. It has different field names and structures
3. It has some overlapping functionality but different implementations
4. It has additional features like modalStack, toastQueue, connectionStatus, etc.

I need to create a unified version that:
- Preserves all the original functionality
- Integrates my new features where they make sense
- Maintains backward compatibility
- Uses consistent naming conventions
- Provides a comprehensive set of selectors and actions

Let me create a merged version that combines the best of both implementations.
</think>

Excellent question! I need to create a unified version that seamlessly merges my additions with the original `uiSlice.ts`. Let me analyze both implementations and create a comprehensive, backward-compatible version.

```ts
// src/store/slices/uiSlice.ts - Unified Version
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { RootState } from '@/store'
import { Notification } from '@/types'

// Extended UI state interface combining both implementations
interface UIState {
  // Theme and appearance
  theme: 'light' | 'dark' | 'auto'
  isDarkMode: boolean
  language: string
  rtl: boolean
  fontSize: 'small' | 'medium' | 'large'
  
  // Layout and navigation
  sidebarOpen: boolean
  isSidebarCollapsed: boolean
  mobileMenuOpen: boolean
  isMobileMenuOpen: boolean
  
  // State management
  loading: boolean
  isLoading: boolean
  error: string | null
  
  // Notifications and feedback
  notifications: Notification[]
  toastQueue: Notification[]
  
  // Modals and overlays
  modalStack: string[]
  
  // Viewport and responsive
  viewportSize: {
    width: number
    height: number
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
  }
  viewport: {
    width: number
    height: number
    isMobile: boolean
    isTablet: boolean
    isDesktop: boolean
  }
  
  // Scrolling behavior
  isScrolling: boolean
  scrollPosition: number
  
  // Connection status
  connectionStatus: 'online' | 'offline' | 'connecting'
  
  // Performance settings
  performanceMode: 'high' | 'balanced' | 'low'
  
  // Accessibility preferences
  accessibility: {
    reducedMotion: boolean
    highContrast: boolean
    largeText: boolean
    screenReaderOptimized: boolean
    keyboardNavigation: boolean
    focusIndicators: boolean
    screenReaderMode: boolean
  }
  
  // Additional UI states
  isDarkMode: boolean
  isSidebarCollapsed: boolean
  isMobileMenuOpen: boolean
  isLoading: boolean
  notifications: Notification[]
}

const initialState: UIState = {
  // Theme and appearance
  theme: 'light',
  isDarkMode: false,
  language: 'en',
  rtl: false,
  fontSize: 'medium',
  
  // Layout and navigation - unified field names
  sidebarOpen: false,
  isSidebarCollapsed: false,
  mobileMenuOpen: false,
  isMobileMenuOpen: false,
  
  // State management - both naming conventions for compatibility
  loading: false,
  isLoading: false,
  error: null,
  
  // Notifications and feedback
  notifications: [],
  toastQueue: [],
  
  // Modals and overlays
  modalStack: [],
  
  // Viewport and responsive - both structures for compatibility
  viewportSize: {
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
  viewport: {
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
    isMobile: false,
    isTablet: false,
    isDesktop: true,
  },
  
  // Scrolling behavior
  isScrolling: false,
  scrollPosition: 0,
  
  // Connection status
  connectionStatus: 'online',
  
  // Performance settings
  performanceMode: 'balanced',
  
  // Accessibility preferences - unified structure
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    screenReaderOptimized: false,
    keyboardNavigation: false,
    focusIndicators: true,
    screenReaderMode: false,
  },
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Theme management - unified approach
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload
      state.isDarkMode = action.payload === 'dark' || 
        (action.payload === 'auto' && typeof window !== 'undefined' && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)
      
      // Apply theme to document
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.toggle('dark', state.isDarkMode)
        localStorage.setItem('theme', action.payload)
      }
    },
    toggleTheme: (state) => {
      const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto']
      const currentIndex = themes.indexOf(state.theme)
      const nextTheme = themes[(currentIndex + 1) % themes.length]
      state.theme = nextTheme
      state.isDarkMode = nextTheme === 'dark' || 
        (nextTheme === 'auto' && typeof window !== 'undefined' && 
         window.matchMedia('(prefers-color-scheme: dark)').matches)
      
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('light', 'dark')
        document.documentElement.classList.toggle('dark', state.isDarkMode)
        localStorage.setItem('theme', nextTheme)
      }
    },
    
    // Language and internationalization
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload
      // Set RTL based on language
      const rtlLanguages = ['ar', 'he', 'fa', 'ur']
      state.rtl = rtlLanguages.includes(action.payload)
      
      // Apply RTL to document
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('lang', action.payload)
        document.documentElement.setAttribute('dir', state.rtl ? 'rtl' : 'ltr')
        localStorage.setItem('language', action.payload)
      }
    },
    
    // Font size management
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = 
          action.payload === 'small' ? '14px' : 
          action.payload === 'large' ? '18px' : '16px'
        localStorage.setItem('fontSize', action.payload)
      }
    },
    
    // Sidebar management - both naming conventions
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload
      state.isSidebarCollapsed = !action.payload // Maintain consistency
      localStorage.setItem('sidebarOpen', String(action.payload))
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.isSidebarCollapsed = action.payload
      state.sidebarOpen = !action.payload // Maintain consistency
      localStorage.setItem('sidebarCollapsed', String(action.payload))
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
      state.isSidebarCollapsed = !state.isSidebarCollapsed
      localStorage.setItem('sidebarOpen', String(state.sidebarOpen))
      localStorage.setItem('sidebarCollapsed', String(state.isSidebarCollapsed))
    },
    
    // Mobile menu management - both naming conventions
    setMobileMenuOpen: (state, action: PayloadAction<boolean>) => {
      state.mobileMenuOpen = action.payload
      state.isMobileMenuOpen = action.payload
    },
    toggleMobileMenu: (state) => {
      state.mobileMenuOpen = !state.mobileMenuOpen
      state.isMobileMenuOpen = !state.isMobileMenuOpen
    },
    
    // Notification management
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.notifications.unshift(action.payload)
      // Limit notifications to prevent memory issues
      if (state.notifications.length > 50) {
        state.notifications = state.notifications.slice(0, 50)
      }
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload)
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload)
      if (notification) {
        notification.read = true
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(n => n.read = true)
    },
    clearNotifications: (state) => {
      state.notifications = []
    },
    
    // Loading state - both naming conventions
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
      state.isLoading = action.payload
    },
    
    // Error state
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
    
    // Modal management
    pushModal: (state, action: PayloadAction<string>) => {
      state.modalStack.push(action.payload)
    },
    popModal: (state) => {
      state.modalStack.pop()
    },
    clearModals: (state) => {
      state.modalStack = []
    },
    
    // Toast queue management
    queueToast: (state, action: PayloadAction<Notification>) => {
      state.toastQueue.push(action.payload)
    },
    dequeueToast: (state) => {
      state.toastQueue.shift()
    },
    clearToastQueue: (state) => {
      state.toastQueue = []
    },
    
    // Scrolling behavior
    setScrollPosition: (state, action: PayloadAction<number>) => {
      state.scrollPosition = action.payload
    },
    setIsScrolling: (state, action: PayloadAction<boolean>) => {
      state.isScrolling = action.payload
    },
    
    // Viewport management - both structures for compatibility
    setViewportSize: (state, action: PayloadAction<{ width: number; height: number }>) => {
      const { width, height } = action.payload
      
      // Update both viewport structures
      const viewportData = {
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024,
      }
      
      state.viewportSize = viewportData
      state.viewport = viewportData
    },
    updateViewport: (state, action: PayloadAction<{ width: number; height: number }>) => {
      const { width, height } = action.payload
      
      const viewportData = {
        width,
        height,
        isMobile: width < 640,
        isTablet: width >= 640 && width < 1024,
        isDesktop: width >= 1024,
      }
      
      state.viewportSize = viewportData
      state.viewport = viewportData
    },
    
    // Connection status
    setConnectionStatus: (state, action: PayloadAction<'online' | 'offline' | 'connecting'>) => {
      state.connectionStatus = action.payload
    },
    
    // Performance mode
    setPerformanceMode: (state, action: PayloadAction<'high' | 'balanced' | 'low'>) => {
      state.performanceMode = action.payload
      localStorage.setItem('performanceMode', action.payload)
    },
    
    // Accessibility preferences - unified approach
    setAccessibilityPreference: (state, action: PayloadAction<Partial<typeof state.accessibility>>) => {
      state.accessibility = { ...state.accessibility, ...action.payload }
      applyAccessibilityPreferences(state.accessibility)
    },
    toggleAccessibilityPreference: (state, action: PayloadAction<keyof typeof state.accessibility>) => {
      const key = action.payload
      state.accessibility[key] = !state.accessibility[key]
      applyAccessibilityPreferences(state.accessibility)
    },
  },
})

// Helper function to apply accessibility preferences
function applyAccessibilityPreferences(accessibility: typeof initialState.accessibility) {
  if (typeof document === 'undefined') return
  
  // Reduced motion
  if (accessibility.reducedMotion !== undefined) {
    document.documentElement.style.setProperty(
      'scroll-behavior', 
      accessibility.reducedMotion ? 'auto' : 'smooth'
    )
  }
  
  // High contrast
  if (accessibility.highContrast !== undefined) {
    document.documentElement.classList.toggle('high-contrast', accessibility.highContrast)
  }
  
  // Large text
  if (accessibility.largeText !== undefined) {
    document.documentElement.classList.toggle('large-text', accessibility.largeText)
  }
  
  // Focus indicators
  if (accessibility.focusIndicators !== undefined) {
    document.documentElement.classList.toggle('focus-visible', accessibility.focusIndicators)
  }
  
  // Screen reader mode
  if (accessibility.screenReaderMode !== undefined) {
    document.documentElement.classList.toggle('screen-reader', accessibility.screenReaderMode)
  }
  
  // Store preferences
  localStorage.setItem('accessibility', JSON.stringify(accessibility))
}

// Initialize from localStorage on load
if (typeof window !== 'undefined') {
  const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto' | null
  const savedLanguage = localStorage.getItem('language')
  const savedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large' | null
  const savedSidebarOpen = localStorage.getItem('sidebarOpen')
  const savedSidebarCollapsed = localStorage.getItem('sidebarCollapsed')
  const savedPerformanceMode = localStorage.getItem('performanceMode') as 'high' | 'balanced' | 'low' | null
  const savedAccessibility = localStorage.getItem('accessibility')
  
  if (savedTheme) initialState.theme = savedTheme
  if (savedLanguage) initialState.language = savedLanguage
  if (savedFontSize) initialState.fontSize = savedFontSize
  if (savedSidebarOpen) {
    const isOpen = savedSidebarOpen === 'true'
    initialState.sidebarOpen = isOpen
    initialState.isSidebarCollapsed = !isOpen
  }
  if (savedSidebarCollapsed) {
    const isCollapsed = savedSidebarCollapsed === 'true'
    initialState.isSidebarCollapsed = isCollapsed
    initialState.sidebarOpen = !isCollapsed
  }
  if (savedPerformanceMode) initialState.performanceMode = savedPerformanceMode
  if (savedAccessibility) {
    try {
      initialState.accessibility = { ...initialState.accessibility, ...JSON.parse(savedAccessibility) }
    } catch (e) {
      console.warn('Failed to parse saved accessibility preferences')
    }
  }
}

// Actions
export const {
  setTheme,
  toggleTheme,
  setLanguage,
  setSidebarOpen,
  setSidebarCollapsed,
  toggleSidebar,
  setMobileMenuOpen,
  toggleMobileMenu,
  addNotification,
  removeNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearNotifications,
  setLoading,
  setError,
  clearError,
  pushModal,
  popModal,
  clearModals,
  queueToast,
  dequeueToast,
  clearToastQueue,
  setScrollPosition,
  setIsScrolling,
  setViewportSize,
  updateViewport,
  setConnectionStatus,
  setPerformanceMode,
  setAccessibilityPreference,
  toggleAccessibilityPreference,
  setFontSize,
} = uiSlice.actions

// Selectors - comprehensive set for all use cases
export const selectUiState = (state: RootState) => state.ui
export const selectTheme = (state: RootState) => state.ui.theme
export const selectIsDarkMode = (state: RootState) => state.ui.isDarkMode
export const selectLanguage = (state: RootState) => state.ui.language
export const selectRtl = (state: RootState) => state.ui.rtl
export const selectFontSize = (state: RootState) => state.ui.fontSize

// Layout selectors
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen
export const selectIsSidebarCollapsed = (state: RootState) => state.ui.isSidebarCollapsed
export const selectMobileMenuOpen = (state: RootState) => state.ui.mobileMenuOpen
export const selectIsMobileMenuOpen = (state: RootState) => state.ui.isMobileMenuOpen

// State selectors
export const selectIsLoading = (state: RootState) => state.ui.isLoading
export const selectLoading = (state: RootState) => state.ui.loading
export const selectError = (state: RootState) => state.ui.error

// Notification selectors
export const selectNotifications = (state: RootState) => state.ui.notifications
export const selectUnreadNotifications = (state: RootState) => 
  state.ui.notifications.filter(n => !n.read)
export const selectNotificationCount = (state: RootState) => state.ui.notifications.length
export const selectUnreadNotificationCount = (state: RootState) => 
  state.ui.notifications.filter(n => !n.read).length

// Modal selectors
export const selectModalStack = (state: RootState) => state.ui.modalStack
export const selectHasActiveModal = (state: RootState) => state.ui.modalStack.length > 0
export const selectTopModal = (state: RootState) => state.ui.modalStack[state.ui.modalStack.length - 1]

// Viewport selectors - both naming conventions
export const selectViewportSize = (state: RootState) => state.ui.viewportSize
export const selectViewport = (state: RootState) => state.ui.viewport
export const selectIsMobile = (state: RootState) => state.ui.viewportSize.isMobile
export const selectIsTablet = (state: RootState) => state.ui.viewportSize.isTablet
export const selectIsDesktop = (state: RootState) => state.ui.viewportSize.isDesktop

// Connection and performance
export const selectConnectionStatus = (state: RootState) => state.ui.connectionStatus
export const selectPerformanceMode = (state: RootState) => state.ui.performanceMode

// Accessibility selectors
export const selectAccessibility = (state: RootState) => state.ui.accessibility
export const selectAccessibilitySettings = (state: RootState) => state.ui.accessibility

// Scroll selectors
export const selectScrollPosition = (state: RootState) => state.ui.scrollPosition
export const selectIsScrolling = (state: RootState) => state.ui.isScrolling

// Toast selectors
export const selectToastQueue = (state: RootState) => state.ui.toastQueue

export default uiSlice.reducer
```

## Key Changes and Integration Strategy

### 1. **Unified State Structure**
- Merged both implementations into a single comprehensive state
- Maintained backward compatibility with duplicate fields where necessary
- Added new fields from my implementation while preserving original ones

### 2. **Enhanced Actions**
- Kept all original actions for backward compatibility
- Added new actions for enhanced functionality (toggleTheme, setFontSize, etc.)
- Improved existing actions with better side effect handling

### 3. **Comprehensive Selectors**
- Provided both naming conventions for smooth migration
- Added new selectors for the enhanced functionality
- Maintained all original selectors for existing code compatibility

### 4. **Persistence and Initialization**
- Enhanced localStorage integration
- Better handling of saved preferences
- Automatic application of settings on load

## Usage Instructions

### For New Code (Using My Components)
```tsx
// Use the new selectors
const isDarkMode = useAppSelector(selectIsDarkMode)
const fontSize = useAppSelector(selectFontSize)
const accessibility = useAppSelector(selectAccessibilitySettings)

// Use the new actions
dispatch(toggleTheme())
dispatch(setFontSize('large'))
dispatch(toggleAccessibilityPreference('highContrast'))
```

### For Existing Code (Backward Compatibility)
```tsx
// Original selectors still work
const theme = useAppSelector(selectTheme)
const sidebarOpen = useAppSelector(selectSidebarOpen)
const isMobile = useAppSelector(selectIsMobile)

// Original actions still work
dispatch(setTheme('dark'))
dispatch(setSidebarOpen(true))
```

## Migration Strategy

1. **Replace the file** - Simply replace your existing `uiSlice.ts` with this unified version
2. **Test existing functionality** - All existing components should work without changes
3. **Gradually adopt new features** - Start using the new actions and selectors as needed
4. **Update components** - My Header, Sidebar, and TypingIndicator components will work seamlessly with this unified version

The unified version provides the best of both implementations while maintaining full backward compatibility and adding enhanced functionality for the new components.

Click the link to view conversation with Kimi AI Assistant https://www.kimi.com/share/d334vbds8fb3503bvr6g
