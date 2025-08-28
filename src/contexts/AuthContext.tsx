'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

type Role = 'user' | 'admin' | 'super_admin'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  role: Role | null
  isAdmin: boolean
  isSuperAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, userData?: any) => Promise<{ error: any }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [role, setRole] = useState<Role | null>(null)

  useEffect(() => {
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user?.id) await fetchUserRole(session.user.id)
      setLoading(false)
    }
    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user?.id) await fetchUserRole(session.user.id)
        setLoading(false)
        if (session?.user && event === 'SIGNED_IN') {
          await updateUserProfile(session.user)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()
      if (error || !data?.role) {
        // Fallback: check server-side helper in case row is missing
        const { data: isSA } = await supabase.rpc('is_super_admin')
        if (isSA === true) {
          setRole('super_admin')
        } else {
          setRole('user')
        }
      } else {
        // normalize common variants
        const raw = String(data.role).toLowerCase()
        const r = raw.replace('-', '_').replace(' ', '_')
        if (r === 'super_admin' || r === 'superadmin') setRole('super_admin')
        else if (r === 'admin' || r === 'manager') setRole('admin')
        else if (r === 'read_only' || r === 'readonly' || r === 'viewer') setRole('user')
        else setRole('user')
      }
    } catch {
      setRole('user')
    }
  }

  const updateUserProfile = async (user: User) => {
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single()
      if (existingUser) {
        await supabase
          .from('users')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id)
      }
    } catch (error) {
      console.error('Error updating user profile:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { error }
  }

  const signUp = async (email: string, password: string, userData?: any) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { error }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    role,
    isAdmin: role === 'admin' || role === 'super_admin',
    isSuperAdmin: role === 'super_admin',
    signIn,
    signUp,
    signOut,
    resetPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext
