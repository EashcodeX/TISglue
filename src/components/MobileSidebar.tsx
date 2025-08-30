'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import Sidebar from './Sidebar'

interface MobileSidebarProps {
  isOpen: boolean
  onClose: () => void
  onItemClick?: (item: any) => void
}

export default function MobileSidebar({ isOpen, onClose, onItemClick }: MobileSidebarProps) {
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

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] lg:hidden transform transition-transform duration-300 ease-in-out ${
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
          
          {/* Sidebar content */}
          <div className="flex-1 overflow-y-auto">
            <Sidebar 
              onItemClick={handleItemClick}
              className="w-full border-r-0"
            />
          </div>
        </div>
      </div>
    </>
  )
}
