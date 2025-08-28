'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function RequireSuperAdmin({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      router.push('/auth/login')
    }
  }, [loading, isSuperAdmin, router])

  if (!isSuperAdmin) return null
  return <>{children}</>
}

