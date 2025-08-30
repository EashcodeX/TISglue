import { NextRequest, NextResponse } from 'next/server'
import { UserOrganizationService } from '@/lib/user-organization-service'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return authError || NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    const isSuperAdmin = await UserOrganizationService.isSuperAdmin(user.id)
    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      )
    }

    // Get all organizations for super admin
    const organizations = await UserOrganizationService.getAccessibleOrganizations(user.id)

    return NextResponse.json({
      success: true,
      data: organizations,
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin organizations API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch organizations' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, status = 'active', timezone = 'UTC' } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Organization name is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Check if user is super admin
    const isSuperAdmin = await UserOrganizationService.isSuperAdmin(user.id)
    if (!isSuperAdmin) {
      return NextResponse.json(
        { success: false, error: 'Super admin access required' },
        { status: 403 }
      )
    }

    // Create organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert({
        name,
        description,
        status,
        timezone,
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error creating organization:', error)
      throw new Error(`Failed to create organization: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      data: organization,
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin organization creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create organization' },
      { status: 500 }
    )
  }
}
