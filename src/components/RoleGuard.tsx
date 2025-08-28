'use client'

import { useAuth } from '@/contexts/AuthContext'

export default function RoleGuard({ allow, children }: { allow: Array<'user'|'admin'|'super_admin'>, children: React.ReactNode }) {
  const { role, loading } = useAuth()
  if (loading) return null
  if (!role) return null
  if (!allow.includes(role)) return null
  return <>{children}</>
}

