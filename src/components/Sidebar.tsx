'use client'

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { useParams } from 'next/navigation'
import { SidebarService, type SidebarCategory } from '@/lib/sidebar-service'
import { type SidebarConfig, type SidebarCategory as DBSidebarCategory, type SidebarItem as DBSidebarItem } from '@/lib/supabase'
import SidebarEditor from '@/components/SidebarEditor'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'
import { useSearchContext } from '@/hooks/useSearchContext'
import {
  ChevronDown,
  ChevronRight,
  Home,
  Building2,
  Users,
  FileText,
  Settings,
  MapPin,
  Globe,
  Key,
  Shield,
  HardDrive,
  Network,
  Clock,
  Star,
  AlertTriangle,
  Zap,
  Database,
  Monitor,
  Wifi,
  Server,
  Phone,
  Mail,
  Code,
  Lock,
  Calendar,
  Bug,
  CheckCircle,
  Info,
  Heart,
  Bookmark,
  Tag,
  Archive,
  History,
  FileX,
  Folder,
  Search
} from 'lucide-react'

// Icon mapping for dynamic sidebar items
const iconMap: Record<string, any> = {
  Home,
  Building2,
  Users,
  FileText,
  Settings,
  MapPin,
  Globe,
  Key,
  Shield,
  HardDrive,
  Network,
  Clock,
  Star,
  AlertTriangle,
  Zap,
  Database,
  Monitor,
  Wifi,
  Server,
  Phone,
  Mail,
  Code,
  Lock,
  Calendar,
  Bug,
  CheckCircle,
  Info,
  Heart,
  Bookmark,
  Tag,
  Archive,
  History,
  FileX,
  Folder
}

// Get icon component by name
const getIconComponent = (iconName: string) => {
  return iconMap[iconName] || FileText
}

// Sidebar configuration structure for easy editing
export interface SidebarItem {
  id: string
  label: string
  icon?: any
  count?: number
  children?: SidebarItem[]
  href?: string
  isExpanded?: boolean
}

export interface SidebarSection {
  id: string
  title?: string
  items: SidebarItem[]
  isCollapsible?: boolean
  isExpanded?: boolean
}

// Default sidebar configuration - easily editable
const defaultSidebarConfig: SidebarSection[] = [
  {
    id: 'main',
    items: [
      {
        id: 'home',
        label: 'Home',
        icon: Home,
        href: '/'
      }
    ]
  },
  {
    id: 'client-contact',
    title: 'CLIENT CONTACT',
    isCollapsible: true,
    isExpanded: true,
    items: [
      {
        id: 'site-summary',
        label: 'Site Summary',
        count: 1,
        href: '/site-summary'
      },
      {
        id: 'site-summary-legacy',
        label: 'Site Summary (Legacy)',
        count: 1,
        href: '/site-summary-legacy'
      },
      {
        id: 'after-hour-building',
        label: 'After Hour and Building/Site...',
        count: 1,
        href: '/after-hour-access'
      },
      {
        id: 'onsite-information',
        label: 'Onsite Information',
        href: '/onsite-information'
      },
      {
        id: 'locations',
        label: 'Locations',
        count: 13,
        href: '/locations'
      },
      {
        id: 'contacts',
        label: 'Contacts',
        count: 317,
        href: '/contacts'
      }
    ]
  },
  {
    id: 'core-documentation',
    title: 'CORE DOCUMENTATION',
    isCollapsible: true,
    isExpanded: true,
    items: [
      {
        id: 'f12-standards-exception',
        label: 'F12 Standards Exception',
        href: '/f12-standards-exception'
      },
      {
        id: 'f12-contract-exceptions',
        label: 'F12 Contract Exceptions',
        href: '/f12-contract-exceptions'
      },
      {
        id: 'request-change-form',
        label: 'Request for Change Form (RFC)',
        href: '/request-change-form'
      },
      {
        id: 'change-log',
        label: 'Change Log',
        href: '/change-log'
      },
      {
        id: 'configurations',
        label: 'Configurations',
        count: 119,
        href: '/configurations'
      },
      {
        id: 'documents',
        label: 'Documents',
        count: 419,
        href: '/documents'
      },
      {
        id: 'warranties-ungrouped',
        label: 'Warranties - Ungrouped',
        count: 13,
        href: '/warranties-ungrouped'
      },
      {
        id: 'domain-tracker',
        label: 'Domain Tracker',
        count: 11,
        href: '/domain-tracker'
      },
      {
        id: 'known-issues',
        label: 'Known Issues',
        count: 2,
        href: '/known-issues'
      },
      {
        id: 'maintenance-windows',
        label: 'Maintenance Windows',
        href: '/maintenance-windows'
      },
      {
        id: 'multi-factor-authentication',
        label: 'Multi Factor Authentication',
        count: 1,
        href: '/multi-factor-authentication'
      },
      {
        id: 'networks',
        label: 'Networks',
        href: '/networks'
      },
      {
        id: 'passwords',
        label: 'Passwords',
        count: 111,
        href: '/passwords'
      },
      {
        id: 'ssl-tracker',
        label: 'SSL Tracker',
        count: 4,
        href: '/ssl-tracker'
      }
    ]
  }
]

interface SidebarProps {
  config?: SidebarSection[]
  className?: string
  onItemClick?: (item: SidebarItem) => void
  onConfigChange?: (config: SidebarSection[]) => void
}

export interface SidebarRef {
  toggleSection: (sectionId: string) => void
}

const Sidebar = forwardRef<SidebarRef, SidebarProps>(({
  config = defaultSidebarConfig,
  className = '',
  onItemClick,
  onConfigChange
}, ref) => {
  const params = useParams()
  const { openSearch } = useGlobalSearch()
  const searchContext = useSearchContext()
  const [sidebarConfig, setSidebarConfig] = useState<SidebarSection[]>([])
  const [dynamicConfig, setDynamicConfig] = useState<SidebarConfig | null>(null)
  const [loading, setLoading] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [currentOrgId, setCurrentOrgId] = useState<string | null>(null)
  const [showEditor, setShowEditor] = useState(false)

  // Load dynamic sidebar items for the current organization
  useEffect(() => {
    if (params?.id) {
      const newOrgId = params.id as string
      console.log('🔄 Organization changed, loading sidebar for:', newOrgId)

      // Only reload if we're switching to a different organization
      if (currentOrgId !== newOrgId) {
        console.log('🔄 Different organization detected, reloading sidebar')
        setCurrentOrgId(newOrgId)
        SidebarService.clearCacheIfDifferentOrg(newOrgId)
        // Only clear sidebar if we don't have data for this org
        if (!isInitialized || currentOrgId !== newOrgId) {
          setSidebarConfig([])
          setIsInitialized(false)
        }
        loadDynamicSidebar(newOrgId)
      } else {
        console.log('🔄 Same organization, keeping existing sidebar')
      }
    } else {
      console.log('🔄 No organization ID, using default sidebar')
      setCurrentOrgId(null)
      setSidebarConfig(config)
      setIsInitialized(true)
    }
  }, [params?.id, currentOrgId, isInitialized])

  // Add a refresh function that can be called externally
  const refreshSidebar = () => {
    if (params?.id) {
      loadDynamicSidebar(params.id as string)
    }
  }

  // Expose refresh function globally for debugging (removed temporarily to fix SSR error)
  // TODO: Re-add debugging functions with proper SSR handling

  const loadDynamicSidebar = async (organizationId: string) => {
    try {
      setLoading(true)
      console.log('🔄 Loading dynamic sidebar for organization:', organizationId)

      // First, try to initialize default sidebar if it doesn't exist
      console.log('🔧 About to call SidebarService.initializeDefaultSidebar for org:', organizationId)
      try {
        await SidebarService.initializeDefaultSidebar(organizationId)
        console.log('✅ SidebarService.initializeDefaultSidebar completed successfully')
      } catch (initError) {
        console.error('❌ SidebarService.initializeDefaultSidebar failed:')
        console.error('- Error message:', (initError as any)?.message)
        console.error('- Full error:', initError)
        console.warn('⚠️ Failed to initialize default sidebar, continuing with existing data:', initError)
      }

      // Load the dynamic configuration
      const dynamicConfig = await SidebarService.getDynamicSidebarConfig(organizationId)
      console.log('📊 Dynamic config loaded:', dynamicConfig)
      setDynamicConfig(dynamicConfig)

      // Convert to sidebar sections format
      const dynamicSections: SidebarSection[] = [
        {
          id: 'main',
          items: [
            {
              id: 'home',
              label: 'Home',
              icon: Home,
              href: '/'
            }
          ]
        }
      ]

      // Group items by category
      const itemsByCategory = new Map<string, DBSidebarItem[]>()
      dynamicConfig.items.forEach(item => {
        const categoryId = item.category_id || 'uncategorized'
        if (!itemsByCategory.has(categoryId)) {
          itemsByCategory.set(categoryId, [])
        }
        itemsByCategory.get(categoryId)!.push(item)
      })

      // Create sections from categories
      dynamicConfig.categories.forEach(category => {
        const categoryItems = itemsByCategory.get(category.id) || []

        const section: SidebarSection = {
          id: category.category_key,
          title: category.category_name,
          isCollapsible: category.is_collapsible,
          isExpanded: category.is_expanded,
          items: []
        }

        // Add items to section
        categoryItems.forEach(item => {
          const count = dynamicConfig.counts?.[item.item_key]
          section.items.push({
            id: item.id,
            label: item.item_label,
            icon: getIconComponent(item.icon_name),
            href: item.item_href || `/${item.item_key}`,
            count: count
          })
        })

        if (section.items.length > 0) {
          dynamicSections.push(section)
        }
      })

      console.log('✅ Final dynamic sidebar sections:', dynamicSections)
      setSidebarConfig(dynamicSections)
      setIsInitialized(true)
    } catch (error) {
      console.error('❌ Error loading dynamic sidebar:', error)
      // Fall back to legacy method
      try {
        const sidebarData = await SidebarService.getOrganizationSidebarByCategory(organizationId)
        console.log('📊 Fallback to legacy sidebar data:', sidebarData)

        // Convert legacy format (existing code)
        const dynamicSections: SidebarSection[] = [
          {
            id: 'main',
            items: [
              {
                id: 'home',
                label: 'Home',
                icon: Home,
                href: '/'
              }
            ]
          }
        ]

        Object.entries(sidebarData).forEach(([categoryKey, category]) => {
          const section: SidebarSection = {
            id: categoryKey.toLowerCase().replace(/\s+/g, '-'),
            title: (category as any).name,
            isCollapsible: true,
            isExpanded: true,
            items: []
          };

          (category as any).systemItems.forEach((systemItem: any, index: number) => {
            section.items.push({
              id: `${categoryKey}-system-${index}`,
              label: systemItem.name,
              icon: getIconComponent(systemItem.icon),
              href: systemItem.href,
              count: systemItem.count
            })
          })

          if (section.items.length > 0) {
            dynamicSections.push(section)
          }
        })

        setSidebarConfig(dynamicSections)
        setIsInitialized(true)
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError)
        setSidebarConfig(config)
        setIsInitialized(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const toggleSection = (sectionId: string) => {
    setSidebarConfig(prev => {
      const newConfig = prev.map(section =>
        section.id === sectionId
          ? { ...section, isExpanded: !section.isExpanded }
          : section
      )
      onConfigChange?.(newConfig)
      return newConfig
    })
  }

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    toggleSection
  }), [])

  // Call onConfigChange when sidebarConfig changes
  useEffect(() => {
    if (sidebarConfig.length > 0) {
      onConfigChange?.(sidebarConfig)
    }
  }, [sidebarConfig, onConfigChange])

  const toggleItem = (sectionId: string, itemId: string) => {
    setSidebarConfig(prev => 
      prev.map(section => 
        section.id === sectionId
          ? {
              ...section,
              items: section.items.map(item =>
                item.id === itemId
                  ? { ...item, isExpanded: !item.isExpanded }
                  : item
              )
            }
          : section
      )
    )
  }

  const handleItemClick = (item: SidebarItem) => {
    if (onItemClick) {
      onItemClick(item)
    }
  }

  const renderItem = (item: SidebarItem, sectionId: string, depth = 0) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const paddingLeft = depth * 16 + 12

    return (
      <div key={item.id}>
        <div 
          className={`flex items-center justify-between py-1 px-3 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer group`}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleItem(sectionId, item.id)
            } else {
              handleItemClick(item)
            }
          }}
        >
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
            <span className="truncate">{item.label}</span>
            {item.count !== undefined && (
              <span className="text-xs text-gray-500 ml-auto">{item.count}</span>
            )}
          </div>
          {hasChildren && (
            <div className="ml-2">
              {item.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </div>
          )}
        </div>
        {hasChildren && item.isExpanded && (
          <div>
            {item.children?.map(child => renderItem(child, sectionId, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`w-64 bg-gray-800 border-r border-gray-700 h-full overflow-y-auto ${className || ''}`}>
      {/* Context-Aware Search Button */}
      <div className="p-3 border-b border-gray-700">
        <button
          onClick={openSearch}
          className={`w-full flex items-center space-x-3 px-3 py-2 text-sm text-gray-300 rounded-lg transition-colors group ${
            searchContext.scope === 'global'
              ? 'bg-blue-600/20 hover:bg-blue-600/30 ring-1 ring-blue-500/30'
              : 'bg-green-600/20 hover:bg-green-600/30 ring-1 ring-green-500/30'
          }`}
        >
          {searchContext.scope === 'global' ? (
            <Globe className="w-4 h-4 text-blue-400" />
          ) : (
            <Building2 className="w-4 h-4 text-green-400" />
          )}
          <div className="flex-1 text-left">
            <div className="font-medium">
              {searchContext.scope === 'global' ? 'Global Search' : 'Organization Search'}
            </div>
            <div className="text-xs text-gray-400">
              {searchContext.scope === 'global' ? 'Search all data' : 'Search within org'}
            </div>
          </div>
          <kbd className="px-2 py-1 text-xs bg-gray-600 group-hover:bg-gray-500 rounded border border-gray-500">
            Q
          </kbd>
        </button>

        {/* Customize Sidebar Button */}
        {currentOrgId && (
          <button
            onClick={() => setShowEditor(true)}
            className="w-full mt-2 flex items-center space-x-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Settings className="w-3 h-3" />
            <span>Customize Sidebar</span>
          </button>
        )}
      </div>

      <div className="py-4">
        {loading && sidebarConfig.length === 0 ? (
          <div className="px-3 py-4">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              <span className="text-sm">Loading sidebar...</span>
            </div>
          </div>
        ) : (
          sidebarConfig.map(section => (
            <div key={section.id} className="mb-4">
              {section.title && (
                <div
                  className={`px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between ${
                    section.isCollapsible ? 'cursor-pointer hover:text-gray-300' : ''
                  }`}
                  onClick={() => section.isCollapsible && toggleSection(section.id)}
                >
                  <span>{section.title}</span>
                  {section.isCollapsible && (
                    <div>
                      {section.isExpanded ? (
                        <ChevronDown className="w-3 h-3" />
                      ) : (
                        <ChevronRight className="w-3 h-3" />
                      )}
                    </div>
                  )}
                </div>
              )}
              {(!section.isCollapsible || section.isExpanded) && (
                <div>
                  {section.items.map(item => renderItem(item, section.id))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sidebar Editor Modal */}
      {showEditor && currentOrgId && (
        <SidebarEditor
          organizationId={currentOrgId}
          onClose={() => setShowEditor(false)}
          onSave={() => {
            // Reload sidebar after saving
            loadDynamicSidebar(currentOrgId)
          }}
        />
      )}
    </div>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
