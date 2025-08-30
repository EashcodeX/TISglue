'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileSidebar from './MobileSidebar'

interface OrganizationLayoutProps {
  children: React.ReactNode
  currentPage?: string
  organizationId?: string
}

export default function OrganizationLayout({ children, currentPage, organizationId }: OrganizationLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleSidebarItemClick = (item: any) => {
    // Handle navigation - use Next.js router for better performance
    if (item.href) {
      // Close mobile sidebar first
      setIsMobileSidebarOpen(false)
      // Use window.location for now to ensure navigation works
      if (item.href === '/') {
        window.location.href = '/'
      } else if (organizationId) {
        // For organization-specific routes, append the organization ID
        window.location.href = `/organizations/${organizationId}${item.href}`
      } else {
        window.location.href = item.href
      }
    }
  }

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen)
  }

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header 
        currentPage={currentPage} 
        onMenuToggle={toggleMobileSidebar}
      />
      
      <div className="flex h-[calc(100vh-64px)]">
        {/* Desktop Sidebar - Show organization-specific sidebar on desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="h-full overflow-y-auto">
            <Sidebar
              onItemClick={handleSidebarItemClick}
            />
          </div>
        </div>

        {/* Mobile Sidebar - Show main navigation on mobile */}
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={closeMobileSidebar}
          onItemClick={handleSidebarItemClick}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
