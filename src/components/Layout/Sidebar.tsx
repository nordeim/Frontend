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
