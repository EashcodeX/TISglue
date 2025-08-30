import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'
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

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError) return authError

    const filters = {
      ...(category && { category }),
      ...(search && { search }),
      ...(archived !== null && { archived: archived === 'true' }),
      ...(limit && { limit: parseInt(limit) }),
      ...(offset && { offset: parseInt(offset) })
    }

    const result = await DocumentService.getDocuments(organizationId, filters)

    return NextResponse.json({
      success: true,
      data: result.documents,
      total: result.total
    })

  } catch (error: any) {
    console.error('❌ Documents API error:', error)
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
    if (authError) return authError

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
      data: document
    })

  } catch (error: any) {
    console.error('❌ Document creation error:', error)
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
    if (authError) return authError

    const document = await DocumentService.updateDocument(id, updates)

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error: any) {
    console.error('❌ Document update error:', error)
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
    if (authError) return authError

    await DocumentService.deleteDocument(id)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error: any) {
    console.error('❌ Document deletion error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete document' },
      { status: 500 }
    )
  }
}
