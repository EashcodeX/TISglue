import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug auth endpoint called')
    
    // Get cookies
    const cookieStore = cookies()
    console.log('🍪 Cookies available:', cookieStore.getAll().map(c => c.name))
    
    // Create Supabase client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            const cookie = cookieStore.get(name)
            console.log(`🍪 Getting cookie ${name}:`, cookie?.value ? 'Found' : 'Not found')
            return cookie?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: '', ...options })
          },
        },
      }
    )
    
    // Try to get session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    console.log('📝 Session check:', session ? 'Found' : 'Not found', sessionError?.message || '')
    
    // Try to get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('👤 User check:', user ? user.email : 'Not found', userError?.message || '')
    
    // Try to query users table
    let userProfile = null
    let profileError = null
    if (user) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      userProfile = data
      profileError = error
      console.log('👤 User profile:', data ? 'Found' : 'Not found', error?.message || '')
    }

    return NextResponse.json({
      success: true,
      debug: {
        cookies_count: cookieStore.getAll().length,
        session_exists: !!session,
        user_exists: !!user,
        user_email: user?.email || null,
        user_id: user?.id || null,
        session_error: sessionError?.message || null,
        user_error: userError?.message || null,
        profile_exists: !!userProfile,
        profile_error: profileError?.message || null,
        environment: {
          supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
          supabase_key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing'
        }
      },
      session,
      user,
      userProfile
    })

  } catch (error: any) {
    console.error('❌ Debug auth error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message,
        stack: error.stack
      },
      { status: 500 }
    )
  }
}
