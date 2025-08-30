import { NextRequest, NextResponse } from 'next/server'
import { DocumentService } from '@/lib/document-service'
import { MicrosoftAuthService } from '@/lib/microsoft-auth-service'
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

    // Get document metadata
    const document = await DocumentService.getDocument(id)
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    if (!document.onedrive_file_id) {
      return NextResponse.json(
        { success: false, error: 'Document is not stored in OneDrive' },
        { status: 400 }
      )
    }

    // Get Microsoft access token for the user
    const tokens = await MicrosoftAuthService.getStoredTokens(user.id, document.organization_id)
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
        await MicrosoftAuthService.storeTokens(user.id, document.organization_id, refreshedTokens)
        accessToken = refreshedTokens.access_token
      } catch (refreshError) {
        return NextResponse.json(
          { success: false, error: 'Failed to refresh Microsoft token. Please re-authenticate.' },
          { status: 401 }
        )
      }
    }

    // Download file from OneDrive
    const fileBlob = await DocumentService.downloadDocument(id, accessToken)

    // Convert blob to buffer for response
    const buffer = Buffer.from(await fileBlob.arrayBuffer())

    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', document.file_type || 'application/octet-stream')
    headers.set('Content-Disposition', `attachment; filename="${document.name}"`)
    headers.set('Content-Length', buffer.length.toString())

    return new NextResponse(buffer, {
      status: 200,
      headers
    })

  } catch (error: any) {
    console.error('❌ Document download error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to download document' },
      { status: 500 }
    )
  }
}
