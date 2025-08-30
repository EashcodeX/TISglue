'use client'

import { useState, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileSidebar from './MobileSidebar'
import OrganizationMobileSidebar from './OrganizationMobileSidebar'

interface OrganizationLayoutProps {
  children: React.ReactNode
  currentPage?: string
  organizationId?: string
}

export default function OrganizationLayout({ children, currentPage, organizationId }: OrganizationLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isOrgMobileSidebarOpen, setIsOrgMobileSidebarOpen] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [sidebarConfig, setSidebarConfig] = useState<any[]>([])
  const [sidebarRef, setSidebarRef] = useState<any>(null)

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024)
    }

    // Check initial screen size
    checkScreenSize()

    // Add event listener for window resize
    window.addEventListener('resize', checkScreenSize)

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

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

  const toggleOrgMobileSidebar = () => {
    setIsOrgMobileSidebarOpen(!isOrgMobileSidebarOpen)
  }

  const closeOrgMobileSidebar = () => {
    setIsOrgMobileSidebarOpen(false)
  }

  const handleToggleSection = (sectionId: string) => {
    // This will be handled by the sidebar component
    if (sidebarRef && sidebarRef.toggleSection) {
      sidebarRef.toggleSection(sectionId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header
        currentPage={currentPage}
        onMenuToggle={toggleMobileSidebar}
        onOrgMenuToggle={toggleOrgMobileSidebar}
        showOrgMenu={!isDesktop}
      />
      
      <div className="flex h-[calc(100vh-64px)] w-full">
        {/* Desktop Sidebar - Show organization-specific sidebar on desktop only */}
        {isDesktop && (
          <div className="w-64 flex-shrink-0">
            <div className="h-full overflow-y-auto w-full">
              <Sidebar
                onItemClick={handleSidebarItemClick}
                ref={setSidebarRef}
                onConfigChange={setSidebarConfig}
              />
            </div>
          </div>
        )}

        {/* Mobile Sidebar - Show main navigation on mobile */}
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={closeMobileSidebar}
          onItemClick={handleSidebarItemClick}
        />

        {/* Organization Mobile Sidebar - Show organization-specific navigation on mobile */}
        <OrganizationMobileSidebar
          isOpen={isOrgMobileSidebarOpen}
          onClose={closeOrgMobileSidebar}
          onItemClick={handleSidebarItemClick}
          sidebarConfig={sidebarConfig}
          onToggleSection={handleToggleSection}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto w-full lg:w-auto">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
