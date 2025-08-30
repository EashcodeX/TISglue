import { NextRequest, NextResponse } from 'next/server'
import { UserOrganizationService } from '@/lib/user-organization-service'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const organizationId = searchParams.get('organization_id')

    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return authError || NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    if (userId) {
      // Get organizations for a specific user
      const organizations = await UserOrganizationService.getUserOrganizations(userId)
      return NextResponse.json({
        success: true,
        data: organizations
      })
    } else if (organizationId) {
      // Get members for a specific organization
      const members = await UserOrganizationService.getOrganizationMembers(organizationId)
      return NextResponse.json({
        success: true,
        data: members
      })
    } else {
      // Get current user's organizations
      const organizations = await UserOrganizationService.getUserOrganizations(user.id)
      return NextResponse.json({
        success: true,
        data: organizations
      })
    }

  } catch (error: any) {
    console.error('❌ User organizations API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch user organizations' },
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

    // For now, allow users to add themselves to organizations
    // In production, you might want to add permission checks here
    const userOrganization = await UserOrganizationService.addUserToOrganization(
      user_id,
      organization_id,
      role
    )

    return NextResponse.json({
      success: true,
      data: userOrganization,
      message: 'User added to organization successfully'
    })

  } catch (error: any) {
    console.error('❌ Add user to organization error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to add user to organization' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, organization_id, role } = body

    if (!user_id || !organization_id || !role) {
      return NextResponse.json(
        { success: false, error: 'User ID, organization ID, and role are required' },
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

    const userOrganization = await UserOrganizationService.updateUserRole(
      user_id,
      organization_id,
      role
    )

    return NextResponse.json({
      success: true,
      data: userOrganization,
      message: 'User role updated successfully'
    })

  } catch (error: any) {
    console.error('❌ Update user role error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update user role' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const organizationId = searchParams.get('organization_id')

    if (!userId || !organizationId) {
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

    await UserOrganizationService.removeUserFromOrganization(userId, organizationId)

    return NextResponse.json({
      success: true,
      message: 'User removed from organization successfully'
    })

  } catch (error: any) {
    console.error('❌ Remove user from organization error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to remove user from organization' },
      { status: 500 }
    )
  }
}
