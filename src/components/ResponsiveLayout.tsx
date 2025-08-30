'use client'

import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MobileSidebar from './MobileSidebar'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  currentPage?: string
}

export default function ResponsiveLayout({ children, currentPage }: ResponsiveLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const handleSidebarItemClick = (item: any) => {
    // Handle navigation - use Next.js router for better performance
    if (item.href) {
      // Close mobile sidebar first
      setIsMobileSidebarOpen(false)
      // Use window.location for now to ensure navigation works
      window.location.href = item.href
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
        {/* Desktop Sidebar */}
        <Sidebar onItemClick={handleSidebarItemClick} />
        
        {/* Mobile Sidebar */}
        <MobileSidebar
          isOpen={isMobileSidebarOpen}
          onClose={closeMobileSidebar}
          onItemClick={handleSidebarItemClick}
        />
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
