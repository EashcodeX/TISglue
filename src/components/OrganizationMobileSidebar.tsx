'use client'

import { useEffect } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'
export interface SidebarSection {
  id: string
  title?: string
  isCollapsible?: boolean
  isExpanded?: boolean
  items: SidebarItem[]
}

export interface SidebarItem {
  id: string
  label: string
  icon?: any
  count?: number
  children?: SidebarItem[]
  href?: string
  isExpanded?: boolean
}

interface OrganizationMobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onItemClick?: (item: SidebarItem) => void
  sidebarConfig: SidebarSection[]
  onToggleSection?: (sectionId: string) => void
}

export default function OrganizationMobileSidebar({ 
  isOpen, 
  onClose, 
  onItemClick, 
  sidebarConfig,
  onToggleSection 
}: OrganizationMobileSidebarProps) {
  
  // Close sidebar when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  const handleItemClick = (item: SidebarItem) => {
    onItemClick?.(item)
    onClose() // Close sidebar after navigation
  }

  const handleNavClick = (href: string) => {
    onClose()
    window.location.href = href
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      
      {/* Sidebar - Slides in from right for organization menu */}
      <div className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="flex flex-col h-full bg-gray-800 border-l border-gray-700 shadow-xl">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold text-white">Organization Menu</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              aria-label="Close organization menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Organization Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {sidebarConfig.map(section => (
                <div key={section.id} className="mb-4">
                  {section.title && (
                    <div
                      className={`px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center justify-between ${
                        section.isCollapsible ? 'cursor-pointer hover:text-gray-300' : ''
                      }`}
                      onClick={() => section.isCollapsible && onToggleSection?.(section.id)}
                    >
                      <span>{section.title}</span>
                      {section.isCollapsible && (
                        <div>
                          {section.isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  {section.isExpanded && (
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const Icon = item.icon
                        return (
                          <button
                            key={item.id}
                            onClick={() => item.href ? handleNavClick(item.href) : handleItemClick(item)}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left text-gray-300 hover:bg-gray-700 hover:text-white group"
                          >
                            <div className="flex items-center space-x-3">
                              {Icon && <Icon className="w-4 h-4" />}
                              <span>{item.label}</span>
                            </div>
                            {item.count !== undefined && (
                              <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded-full group-hover:bg-gray-600 group-hover:text-white">
                                {item.count}
                              </span>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
