import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Normalize incoming payload to support multiple client field names
    const passwordRaw = body.password_value ?? body.password ?? body.password_encrypted
    const nameOrTitle: string | undefined = body.name ?? body.title

    console.log('🔐 Creating password with data (normalized):', {
      ...body,
      name: nameOrTitle,
      password_value: passwordRaw ? '[REDACTED]' : undefined,
      password: undefined,
      password_encrypted: undefined,
    })

    // Validate required fields
    if (!nameOrTitle || !passwordRaw) {
      return NextResponse.json(
        { success: false, error: 'Name and password are required' },
        { status: 400 }
      )
    }

    // Build a list of payload variants to handle differing schemas
    const variants: Record<string, any>[] = [
      // Modern schema with name + password_value
      {
        organization_id: body.organization_id,
        name: nameOrTitle,
        username: body.username ?? null,
        password_value: passwordRaw,
        password_type: body.password_type ?? 'general',
        category: body.category ?? null,
        shared_safe: body.shared_safe ?? null,
        url: body.url ?? null,
        notes: body.notes ?? null,
        otp_enabled: body.otp_enabled ?? false,
        otp_secret: body.otp_secret ?? null,
        archived: false,
      },
      // Modern schema but using title when it's required
      {
        organization_id: body.organization_id,
        title: nameOrTitle,
        username: body.username ?? null,
        password_value: passwordRaw,
        password_type: body.password_type ?? 'general',
        category: body.category ?? null,
        shared_safe: body.shared_safe ?? null,
        url: body.url ?? null,
        notes: body.notes ?? null,
        otp_enabled: body.otp_enabled ?? false,
        otp_secret: body.otp_secret ?? null,
        archived: false,
      },
      // Legacy schema with name + password
      {
        organization_id: body.organization_id,
        name: nameOrTitle,
        username: body.username ?? null,
        password: passwordRaw,
        resource_name: body.resource_name ?? null,
        shared: body.shared ?? false,
        expires_at: body.expires_at ?? null,
        last_rotated: body.last_rotated ?? null,
        url: body.url ?? null,
        notes: body.notes ?? null,
        category: body.category ?? null,
      },
      // Legacy schema with title + password
      {
        organization_id: body.organization_id,
        title: nameOrTitle,
        username: body.username ?? null,
        password: passwordRaw,
        resource_name: body.resource_name ?? null,
        shared: body.shared ?? false,
        expires_at: body.expires_at ?? null,
        last_rotated: body.last_rotated ?? null,
        url: body.url ?? null,
        notes: body.notes ?? null,
        category: body.category ?? null,
      },
      // Minimal legacy with password_encrypted + name
      {
        organization_id: body.organization_id,
        name: nameOrTitle,
        username: body.username ?? null,
        password_encrypted: passwordRaw,
        url: body.url ?? null,
        notes: body.notes ?? null,
        category: body.category ?? null,
      },
      // Minimal legacy with password_encrypted + title
      {
        organization_id: body.organization_id,
        title: nameOrTitle,
        username: body.username ?? null,
        password_encrypted: passwordRaw,
        url: body.url ?? null,
        notes: body.notes ?? null,
        category: body.category ?? null,
      },
    ]

    // Get user session from cookies
    const supabase = await getServerSupabase()

    // Accept token via Authorization header as a fallback when cookies aren't present
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization')
    let userId: string | null = null

    if (authHeader?.startsWith('Bearer ')) {
      // Validate the token using supabase-js
      const token = authHeader.slice('Bearer '.length)
      const { data: { user: hdrUser } } = await supabase.auth.getUser(token)
      userId = hdrUser?.id ?? null
    }

    // If header-based user not found, try cookie-based session
    if (!userId) {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Auth error:', authError)
        return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 })
      }
      userId = user.id
    }

    // Use service role client to check permissions (bypasses RLS)
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check user role with service client
    const { data: me, error: roleError } = await serviceSupabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (roleError) {
      console.error('Role check error:', roleError)
      return NextResponse.json({ success: false, error: 'Unable to verify permissions' }, { status: 403 })
    }

    const myRole = (me?.role || 'user').toLowerCase()
    const canWrite = myRole === 'admin' || myRole === 'super_admin'
    if (!canWrite) {
      console.error('Insufficient permissions:', { userId, role: myRole })
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    console.log('✅ Auth check passed:', { userId, role: myRole })

    let lastError: any = null
    for (let i = 0; i < variants.length; i++) {
      const payload = variants[i]
      const result = await serviceSupabase
        .from('passwords')
        .insert([payload])
        .select()
        .single()

      if (!result.error) {
        const saved = result.data
        console.log(`✅ Password created successfully with variant V${i + 1}:`, saved?.id)
        return NextResponse.json({ success: true, data: saved })
      }

      lastError = result.error
      console.warn(`⚠️ Insert attempt V${i + 1} failed:`, {
        code: lastError?.code,
        message: lastError?.message,
        details: lastError?.details,
        hint: lastError?.hint,
      })
    }

    console.error('❌ Database error (all strategies failed):', lastError)
    return NextResponse.json(
      { success: false, error: lastError?.message || 'Database insert failed' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('❌ API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}