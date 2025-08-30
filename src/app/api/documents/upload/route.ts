import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'
import { MicrosoftAuthService } from '@/lib/microsoft-auth-service'
import { getAuthenticatedUser } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Upload POST request received')

    // Check authentication
    const { user, error: authError } = await getAuthenticatedUser()

    console.log('🔐 Auth result:', {
      hasUser: !!user,
      userEmail: user?.email,
      hasError: !!authError,
      errorMessage: authError ? 'Has error response' : null
    })

    if (authError || !user) {
      console.log('❌ Authentication failed in upload route')
      return authError || NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      )
    }

    console.log('✅ User authenticated for upload:', user.email)

    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organization_id') as string
    const organizationName = formData.get('organization_name') as string
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const category = formData.get('category') as string

    if (!file || !organizationId || !organizationName) {
      return NextResponse.json(
        { success: false, error: 'File, organization ID, and organization name are required' },
        { status: 400 }
      )
    }

    // Get Microsoft access token for the user
    const tokens = await MicrosoftAuthService.getStoredTokens(user.id, organizationId)
    if (!tokens) {
      return NextResponse.json(
        { success: false, error: 'Microsoft authentication required. Please connect to OneDrive first.' },
        { status: 401 }
      )
    }

    // Check if token needs refresh
    let accessToken = tokens.access_token
    if (new Date() >= new Date(tokens.expires_at)) {
      try {
        const refreshedTokens = await MicrosoftAuthService.refreshToken(tokens.refresh_token)
        await MicrosoftAuthService.storeTokens(user.id, organizationId, refreshedTokens)
        accessToken = refreshedTokens.access_token
      } catch (refreshError) {
        return NextResponse.json(
          { success: false, error: 'Failed to refresh Microsoft token. Please re-authenticate.' },
          { status: 401 }
        )
      }
    }

    // Upload document to OneDrive and create database record
    const document = await DocumentService.uploadDocumentToOneDrive(
      file,
      organizationId,
      organizationName,
      {
        name: name || file.name,
        description,
        category
      },
      accessToken
    )

    return NextResponse.json({
      success: true,
      data: document,
      message: 'Document uploaded successfully'
    })

  } catch (error: any) {
    console.error('❌ Document upload error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload document' },
      { status: 500 }
    )
  }
}

// Handle file upload progress (for chunked uploads)
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('document_id')
    const status = searchParams.get('status')

    if (!documentId || !status) {
      return NextResponse.json(
        { success: false, error: 'Document ID and status are required' },
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

    // Update document upload status
    const document = await DocumentService.updateDocument(documentId, {
      upload_status: status as any,
      updated_at: new Date().toISOString()
    })

    return NextResponse.json({
      success: true,
      data: document
    })

  } catch (error: any) {
    console.error('❌ Upload status update error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update upload status' },
      { status: 500 }
    )
  }
}
