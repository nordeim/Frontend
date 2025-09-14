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
