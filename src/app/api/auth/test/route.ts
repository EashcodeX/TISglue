import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError) return authError

    // Get additional user info from our users table
    const supabase = getSupabaseClient()
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      auth_user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      user_profile: userProfile,
      profile_error: profileError?.message || null
    })

  } catch (error: any) {
    console.error('❌ Auth test error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Auth test failed' },
      { status: 500 }
    )
  }
}
