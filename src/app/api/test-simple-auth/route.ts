import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Simple auth test called')
    
    // Get cookies directly
    const cookieStore = cookies()
    const allCookies = cookieStore.getAll()
    
    console.log('🍪 All cookies:', allCookies.map(c => `${c.name}=${c.value?.substring(0, 20)}...`))
    
    // Look for Supabase auth cookies
    const authCookies = allCookies.filter(c => 
      c.name.includes('supabase') || 
      c.name.includes('auth') ||
      c.name.includes('sb-')
    )
    
    console.log('🔐 Auth-related cookies:', authCookies.map(c => c.name))
    
    return NextResponse.json({
      success: true,
      cookies_total: allCookies.length,
      auth_cookies: authCookies.length,
      auth_cookie_names: authCookies.map(c => c.name),
      all_cookie_names: allCookies.map(c => c.name),
      has_cookies: allCookies.length > 0
    })

  } catch (error: any) {
    console.error('❌ Simple auth test error:', error)
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
