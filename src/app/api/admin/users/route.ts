import { NextRequest, NextResponse } from 'next/server'
import { UserOrganizationService } from '@/lib/user-organization-service'
import { getAuthenticatedUser, getSupabaseClient } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')

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

    const supabase = getSupabaseClient()
    let query = supabase
      .from('users')
      .select(`
        *,
        user_organizations:user_organizations(
          id,
          organization_id,
          role,
          is_active,
          joined_at,
          organizations:organization_id(id, name)
        )
      `)
      .order('created_at', { ascending: false })

    const { data: users, error } = await query

    if (error) {
      console.error('❌ Error fetching users:', error)
      throw new Error(`Failed to fetch users: ${error.message}`)
    }

    // If organization filter is specified, filter users
    let filteredUsers = users || []
    if (organizationId) {
      filteredUsers = users?.filter(user => 
        user.user_organizations?.some((uo: any) => 
          uo.organization_id === organizationId && uo.is_active
        )
      ) || []
    }

    return NextResponse.json({
      success: true,
      data: filteredUsers,
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin users API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, organization_id, role = 'member' } = body

    if (!user_id || !organization_id) {
      return NextResponse.json(
        { success: false, error: 'User ID and organization ID are required' },
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

    // Add user to organization
    const userOrganization = await UserOrganizationService.addUserToOrganization(
      user_id,
      organization_id,
      role
    )

    return NextResponse.json({
      success: true,
      data: userOrganization,
      message: 'User added to organization successfully',
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin add user to organization error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add user to organization' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, role, organization_id } = body

    if (!user_id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
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

    let result

    if (organization_id && role) {
      // Update user role in specific organization
      result = await UserOrganizationService.updateUserRole(user_id, organization_id, role)
    } else if (role) {
      // Update user's global role
      const { data: updatedUser, error } = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', user_id)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update user role: ${error.message}`)
      }

      result = updatedUser
    } else {
      return NextResponse.json(
        { success: false, error: 'Role is required' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: 'User updated successfully',
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin user update error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}
