'use client'

import { usePathname } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/'

  // Public routes that shouldn't require auth
  const isPublic =
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/offline' ||
    pathname.startsWith('/api/health')

  if (isPublic) return <>{children}</>

  return (
    <ProtectedRoute>
      {children}
    </ProtectedRoute>
  )
}

