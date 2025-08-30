'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Home, Building2, BarChart3, FileText, User, Globe, Zap, Shield } from 'lucide-react'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onItemClick?: (item: any) => void
}

export default function MobileSidebar({ isOpen, onClose, onItemClick }: MobileSidebarProps) {
  const pathname = usePathname()

  // Close sidebar when clicking outside
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

  const handleItemClick = (item: any) => {
    onItemClick?.(item)
    onClose() // Close sidebar after navigation
  }

  // Main navigation items (same as Header)
  const navigationItems = [
    { label: 'Dashboard', href: '/', icon: Home, isActive: pathname === '/' },
    { label: 'Organizations', href: '/organizations', icon: Building2, isActive: pathname.startsWith('/organizations') },
    { label: 'Reports', href: '/reports', icon: BarChart3, isActive: pathname === '/reports' },
    { label: 'API Docs', href: '/api-docs', icon: FileText, isActive: pathname === '/api-docs' },
    { label: 'Personal', href: '/personal', icon: User, isActive: pathname === '/personal' },
    { label: 'Global', href: '/global', icon: Globe, isActive: pathname === '/global' },
    { label: 'GlueConnect', href: '/glue-connect', icon: Zap, isActive: pathname === '/glue-connect' },
    { label: 'Admin', href: '/admin', icon: Shield, isActive: pathname === '/admin' },
  ]

  const handleNavClick = (href: string) => {
    onClose() // Close sidebar first
    // Use Next.js router for better navigation
    if (typeof window !== 'undefined') {
      window.location.href = href
    }
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar - Now works on all screen sizes */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full bg-gray-800 border-r border-gray-700 shadow-xl">
          {/* Header with close button */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-sm font-bold">
                IT
              </div>
              <span className="text-sm text-gray-300">.net</span>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.label}
                    onClick={() => handleNavClick(item.href)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-left ${
                      item.isActive
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
                )
              })}
            </div>
          </nav>
        </div>
      </div>
    </>
  )
}
