import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'
import { getAuthenticatedUser } from '@/lib/auth-utils'

interface RouteParams {
  params: {
    id: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()

    if (authError || !user) {
      return authError || NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const document = await DocumentService.getDocument(id)

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error: any) {
    console.error('❌ Document fetch error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params
    const updates = await request.json()

    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()

    if (authError || !user) {
      return authError || NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

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

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params

    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()

    if (authError || !user) {
      return authError || NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

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
