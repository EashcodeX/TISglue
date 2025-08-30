'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useClient, useClientInitials, useClientColor } from '@/contexts/ClientContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  Search,
  Settings,
  Bell,
  User,
  ChevronRight,
  LogOut,
  UserCircle,
  Menu,
  X
} from 'lucide-react'

interface HeaderProps {
  currentPage?: string
  onMenuToggle?: () => void
  onOrgMenuToggle?: () => void
  showOrgMenu?: boolean
}

export default function Header({ currentPage, onMenuToggle, onOrgMenuToggle, showOrgMenu }: HeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { selectedClient } = useClient()
  const { user, signOut, isSuperAdmin } = useAuth()

  const navigationItems = [
    { label: 'Dashboard', href: '/', isActive: pathname === '/' },
    { label: 'Organizations', href: '/organizations', isActive: pathname.startsWith('/organizations') },
    { label: 'Reports', href: '/reports', isActive: pathname === '/reports' },
    { label: 'API Docs', href: '/api-docs', isActive: pathname === '/api-docs' },
    { label: 'Personal', href: '/personal', isActive: pathname === '/personal' },
    { label: 'Global', href: '/global', isActive: pathname === '/global' },
    { label: 'GlueConnect', href: '/glueconnect', isActive: pathname === '/glueconnect' },
    ...(isSuperAdmin ? [{ label: 'Admin', href: '/admin', isActive: pathname.startsWith('/admin') }] : [])
  ]

  const getInitials = useClientInitials
  const getClientColor = useClientColor

  return (
    <header className="bg-gray-800 border-b border-gray-700 relative z-30">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3">
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Mobile Menu Button */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-all touch-manipulation"
            aria-label="Toggle mobile menu"
            type="button"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-sm font-bold">
              IT
            </div>
            <span className="text-sm text-gray-300">.net</span>
          </Link>
          
          {/* Navigation - Hidden on mobile */}
          <nav className="hidden md:flex space-x-6">
            {navigationItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  item.isActive
                    ? 'text-white bg-gray-700'
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Client Context Breadcrumb */}
          {selectedClient && pathname.startsWith('/organizations/') && (
            <div className="flex items-center space-x-2 text-sm text-gray-300">
              <ChevronRight className="w-4 h-4" />
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 ${getClientColor(selectedClient.name)} rounded-full flex items-center justify-center`}>
                  <span className="text-white font-bold text-xs">
                    {getInitials(selectedClient.name)}
                  </span>
                </div>
                <span>{selectedClient.name}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Right side actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Organization Menu Button - Only show on mobile and organization pages */}
          {showOrgMenu && (
            <button
              onClick={onOrgMenuToggle}
              className="lg:hidden p-2 text-orange-400 hover:text-white hover:bg-orange-600 rounded-md transition-all touch-manipulation border border-orange-400"
              aria-label="Toggle organization menu"
              type="button"
              title="Organization Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <button className="p-2 text-gray-400 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="hidden sm:block p-2 text-gray-400 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
          </button>
          <button className="hidden sm:block p-2 text-gray-400 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          {user ? (
            <div className="relative group">
              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <UserCircle className="w-4 h-4 text-white" />
                </div>
                <span className="hidden sm:block text-sm text-gray-300">{user.user_metadata?.full_name || user.email}</span>
              </div>

              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <div className="px-4 py-2 border-b border-gray-700">
                    <p className="text-sm font-medium text-white">{user.user_metadata?.full_name || 'User'}</p>
                    <p className="text-xs text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white flex items-center space-x-2"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
            >
              <User className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
