import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Paths that should be accessible without auth
  const { pathname } = req.nextUrl
  const isAuthRoute = pathname.startsWith('/auth')
  const isDebugRoute = pathname.startsWith('/test-') || pathname.startsWith('/debug-') || pathname.startsWith('/setup-')
  const isStatic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname.startsWith('/api/health') // allow simple health checks

  if (isAuthRoute || isStatic || isDebugRoute) {
    return res
  }

  // Create a Supabase client with the auth cookie from the request
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  console.log(`🔍 Middleware: ${pathname}, Session: ${session ? 'Yes' : 'No'}`)

  // If no session and not on an auth/static route, redirect to login
  if (!session) {
    console.log(`🔒 Redirecting ${pathname} to login (no session)`)
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    redirectUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is logged in and tries to access auth routes, send them home
  if (session && isAuthRoute) {
    const homeUrl = req.nextUrl.clone()
    homeUrl.pathname = '/'
    return NextResponse.redirect(homeUrl)
  }

  return res
}

// Run middleware on all routes except static assets
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|images|manifest.json|sw.js).*)',
  ],
}

