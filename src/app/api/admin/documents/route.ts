import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'
import { UserOrganizationService } from '@/lib/user-organization-service'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const organizationId = searchParams.get('organization_id')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const archived = searchParams.get('archived')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const allOrganizations = searchParams.get('all_organizations') === 'true'

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

    const filters = {
      ...(category && { category }),
      ...(search && { search }),
      ...(archived !== null && { archived: archived === 'true' }),
      ...(limit && { limit: parseInt(limit) }),
      ...(offset && { offset: parseInt(offset) })
    }

    let result

    if (allOrganizations || !organizationId) {
      // Super admin can get all documents across all organizations
      result = await DocumentService.getAllDocuments(filters)
    } else {
      // Get documents for specific organization
      result = await DocumentService.getDocuments(organizationId, filters)
    }

    return NextResponse.json({
      success: true,
      data: result.documents,
      total: result.total,
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin documents API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch documents' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organization_id, name, description, category, file_type, file_size } = body

    if (!organization_id || !name) {
      return NextResponse.json(
        { success: false, error: 'Organization ID and name are required' },
        { status: 400 }
      )
    }

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

    const documentData = {
      organization_id,
      name,
      description,
      category,
      file_type,
      file_size,
      upload_status: 'pending' as const,
      is_public: false,
      archived: false
    }

    const document = await DocumentService.createDocument(documentData)

    return NextResponse.json({
      success: true,
      data: document,
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin document creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create document' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

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

    const document = await DocumentService.updateDocument(id, updates)

    return NextResponse.json({
      success: true,
      data: document,
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin document update error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update document' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      )
    }

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

    await DocumentService.deleteDocument(id)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      is_super_admin: true
    })

  } catch (error: any) {
    console.error('❌ Admin document deletion error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete document' },
      { status: 500 }
    )
  }
}
