// Use direct fetch instead of Microsoft Graph SDK to avoid import issues
interface GraphResponse {
  id: string
  name: string
  webUrl?: string
  '@microsoft.graph.downloadUrl'?: string
}

export interface OneDriveFile {
  id: string
  name: string
  size: number
  mimeType: string
  downloadUrl?: string
  shareUrl?: string
  folderPath: string
  lastModified: string
  parentFolderId?: string
}

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export class MicrosoftGraphService {
  private accessToken: string
  private rootFolder: string
  private baseUrl = 'https://graph.microsoft.com/v1.0'
  private driveId: string | null = null

  constructor(accessToken: string) {
    this.accessToken = accessToken
    this.rootFolder = process.env.ONEDRIVE_ROOT_FOLDER || 'ITGlue_Documents'
  }

  private async makeGraphRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Graph API error:', { status: response.status, error: errorText })
      throw new Error(`Graph API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  private async getPersonalDriveId(): Promise<string> {
    if (this.driveId) {
      return this.driveId
    }

    try {
      // For personal accounts, get the default drive
      const driveResponse = await this.makeGraphRequest('/me/drive')
      this.driveId = driveResponse.id
      console.log('✅ Personal OneDrive detected:', this.driveId)
      return this.driveId!
    } catch (error: any) {
      console.error('❌ Failed to get personal drive:', error)
      throw new Error(`Failed to access personal OneDrive: ${error.message}`)
    }
  }

  /**
   * Create organization folder structure in OneDrive
   */
  async createOrganizationFolder(organizationId: string, organizationName: string): Promise<string> {
    try {
      console.log('🗂️ Creating organization folder:', organizationName)

      // First, ensure root ITGlue folder exists
      const rootFolderId = await this.ensureRootFolder()

      // Create organization folder
      const folderName = `${organizationName}_${organizationId.slice(0, 8)}`
      const organizationFolder = await this.makeGraphRequest(`/me/drive/items/${rootFolderId}/children`, {
        method: 'POST',
        body: JSON.stringify({
          name: folderName,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      })

      console.log('✅ Organization folder created:', organizationFolder.id)
      return organizationFolder.id

    } catch (error: any) {
      console.error('❌ Error creating organization folder:', error)
      throw new Error(`Failed to create organization folder: ${error.message}`)
    }
  }

  /**
   * Upload file to OneDrive
   */
  async uploadFile(
    file: File,
    organizationId: string,
    organizationName: string,
    category?: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<OneDriveFile> {
    try {
      console.log('📤 Uploading file to OneDrive:', file.name)

      // Get or create organization folder
      const organizationFolderId = await this.getOrCreateOrganizationFolder(organizationId, organizationName)

      // Create category subfolder if specified
      let targetFolderId = organizationFolderId
      if (category) {
        targetFolderId = await this.getOrCreateCategoryFolder(organizationFolderId, category)
      }

      // Generate unique filename to avoid conflicts
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `${timestamp}_${file.name}`

      let uploadedFile

      if (file.size <= 4 * 1024 * 1024) {
        // Small file upload (< 4MB) - simple upload
        uploadedFile = await this.uploadSmallFile(file, targetFolderId, fileName)
      } else {
        // Large file upload (>= 4MB) - resumable upload
        uploadedFile = await this.uploadLargeFile(file, targetFolderId, fileName, onProgress)
      }

      // Get download URL and create share link
      const downloadUrl = await this.getDownloadUrl(uploadedFile.id)
      const shareUrl = await this.createShareLink(uploadedFile.id)

      const result: OneDriveFile = {
        id: uploadedFile.id,
        name: uploadedFile.name,
        size: uploadedFile.size,
        mimeType: uploadedFile.file?.mimeType || 'application/octet-stream',
        downloadUrl,
        shareUrl,
        folderPath: `${this.rootFolder}/${organizationName}_${organizationId.slice(0, 8)}${category ? `/${category}` : ''}`,
        lastModified: uploadedFile.lastModifiedDateTime,
        parentFolderId: targetFolderId
      }

      console.log('✅ File uploaded successfully:', result.id)
      return result

    } catch (error: any) {
      console.error('❌ Error uploading file:', error)
      throw new Error(`Failed to upload file: ${error.message}`)
    }
  }

  /**
   * Download file from OneDrive
   */
  async downloadFile(fileId: string): Promise<Blob> {
    try {
      console.log('📥 Downloading file from OneDrive:', fileId)

      const response = await fetch(`${this.baseUrl}/me/drive/items/${fileId}/content`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.status}`)
      }

      return await response.blob()

    } catch (error) {
      console.error('❌ Error downloading file:', error)
      throw new Error(`Failed to download file: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Delete file from OneDrive
   */
  async deleteFile(fileId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting file from OneDrive:', fileId)

      await this.makeGraphRequest(`/me/drive/items/${fileId}`, {
        method: 'DELETE'
      })

      console.log('✅ File deleted successfully')

    } catch (error: any) {
      console.error('❌ Error deleting file:', error)
      throw new Error(`Failed to delete file: ${error.message}`)
    }
  }

  /**
   * Get shareable link for file
   */
  async createShareLink(fileId: string, type: 'view' | 'edit' = 'view'): Promise<string> {
    try {
      const permission = await this.makeGraphRequest(`/me/drive/items/${fileId}/createLink`, {
        method: 'POST',
        body: JSON.stringify({
          type: type,
          scope: 'organization'
        })
      })

      return permission.link.webUrl

    } catch (error: any) {
      console.error('❌ Error creating share link:', error)
      throw new Error(`Failed to create share link: ${error.message}`)
    }
  }

  /**
   * List files in organization folder
   */
  async listFiles(organizationId: string, organizationName: string): Promise<OneDriveFile[]> {
    try {
      console.log('📋 Listing files for organization:', organizationName)

      const organizationFolderId = await this.getOrCreateOrganizationFolder(organizationId, organizationName)

      const response = await this.makeGraphRequest(`/me/drive/items/${organizationFolderId}/children?$expand=children`)

      const files: OneDriveFile[] = []

      for (const item of response.value) {
        if (item.file) {
          // It's a file
          files.push({
            id: item.id,
            name: item.name,
            size: item.size,
            mimeType: item.file.mimeType,
            folderPath: `${this.rootFolder}/${organizationName}_${organizationId.slice(0, 8)}`,
            lastModified: item.lastModifiedDateTime,
            parentFolderId: organizationFolderId
          })
        } else if (item.folder) {
          // It's a folder - recursively get files
          const subFiles = await this.listFilesInFolder(item.id, `${this.rootFolder}/${organizationName}_${organizationId.slice(0, 8)}/${item.name}`)
          files.push(...subFiles)
        }
      }

      console.log(`✅ Found ${files.length} files`)
      return files

    } catch (error: any) {
      console.error('❌ Error listing files:', error)
      throw new Error(`Failed to list files: ${error.message}`)
    }
  }

  // Private helper methods

  private async ensureRootFolder(): Promise<string> {
    try {
      // Ensure we have the drive ID for personal OneDrive
      await this.getPersonalDriveId()

      // Try to find existing root folder
      const response = await this.makeGraphRequest(`/me/drive/root/children?$filter=name eq '${this.rootFolder}'`)

      if (response.value.length > 0) {
        console.log('✅ Found existing root folder:', response.value[0].id)
        return response.value[0].id
      }

      // Create root folder if it doesn't exist
      console.log('📁 Creating root folder:', this.rootFolder)
      const rootFolder = await this.makeGraphRequest('/me/drive/root/children', {
        method: 'POST',
        body: JSON.stringify({
          name: this.rootFolder,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'rename'
        })
      })

      console.log('✅ Root folder created:', rootFolder.id)
      return rootFolder.id

    } catch (error: any) {
      throw new Error(`Failed to ensure root folder: ${error.message}`)
    }
  }

  private async getOrCreateOrganizationFolder(organizationId: string, organizationName: string): Promise<string> {
    const folderName = `${organizationName}_${organizationId.slice(0, 8)}`
    const rootFolderId = await this.ensureRootFolder()

    try {
      // Try to find existing organization folder
      const response = await this.makeGraphRequest(`/me/drive/items/${rootFolderId}/children?$filter=name eq '${folderName}'`)

      if (response.value.length > 0) {
        return response.value[0].id
      }

      // Create organization folder if it doesn't exist
      const orgFolder = await this.makeGraphRequest(`/me/drive/items/${rootFolderId}/children`, {
        method: 'POST',
        body: JSON.stringify({
          name: folderName,
          folder: {}
        })
      })

      return orgFolder.id

    } catch (error: any) {
      throw new Error(`Failed to get or create organization folder: ${error.message}`)
    }
  }

  private async getOrCreateCategoryFolder(parentFolderId: string, category: string): Promise<string> {
    try {
      // Try to find existing category folder
      const response = await this.makeGraphRequest(`/me/drive/items/${parentFolderId}/children?$filter=name eq '${category}'`)

      if (response.value.length > 0) {
        return response.value[0].id
      }

      // Create category folder if it doesn't exist
      const categoryFolder = await this.makeGraphRequest(`/me/drive/items/${parentFolderId}/children`, {
        method: 'POST',
        body: JSON.stringify({
          name: category,
          folder: {}
        })
      })

      return categoryFolder.id

    } catch (error: any) {
      throw new Error(`Failed to get or create category folder: ${error.message}`)
    }
  }

  private async uploadSmallFile(file: File, folderId: string, fileName: string): Promise<any> {
    const arrayBuffer = await file.arrayBuffer()

    const response = await fetch(`${this.baseUrl}/me/drive/items/${folderId}:/${fileName}:/content`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: arrayBuffer
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Upload failed: ${response.status} - ${errorText}`)
    }

    return response.json()
  }

  private async uploadLargeFile(
    file: File, 
    folderId: string, 
    fileName: string, 
    onProgress?: (progress: UploadProgress) => void
  ): Promise<any> {
    // Create upload session
    const uploadSession = await this.makeGraphRequest(`/me/drive/items/${folderId}:/${fileName}:/createUploadSession`, {
      method: 'POST',
      body: JSON.stringify({
        item: {
          '@microsoft.graph.conflictBehavior': 'rename'
        }
      })
    })

    const uploadUrl = uploadSession.uploadUrl
    const fileSize = file.size
    const chunkSize = 320 * 1024 // 320KB chunks

    let uploadedBytes = 0

    // Upload file in chunks
    while (uploadedBytes < fileSize) {
      const chunkEnd = Math.min(uploadedBytes + chunkSize, fileSize)
      const chunk = file.slice(uploadedBytes, chunkEnd)
      const chunkBuffer = await chunk.arrayBuffer()

      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Range': `bytes ${uploadedBytes}-${chunkEnd - 1}/${fileSize}`,
          'Content-Length': (chunkEnd - uploadedBytes).toString()
        },
        body: chunkBuffer
      })

      if (onProgress) {
        onProgress({
          loaded: chunkEnd,
          total: fileSize,
          percentage: Math.round((chunkEnd / fileSize) * 100)
        })
      }

      if (response.status === 201 || response.status === 200) {
        // Upload complete
        return await response.json()
      } else if (response.status !== 202) {
        throw new Error(`Upload failed with status: ${response.status}`)
      }

      uploadedBytes = chunkEnd
    }

    throw new Error('Upload completed but no final response received')
  }

  private async getDownloadUrl(fileId: string): Promise<string> {
    try {
      const response = await this.makeGraphRequest(`/me/drive/items/${fileId}`)

      return response['@microsoft.graph.downloadUrl'] || ''
    } catch (error) {
      console.warn('Could not get download URL:', error)
      return ''
    }
  }

  private async listFilesInFolder(folderId: string, folderPath: string): Promise<OneDriveFile[]> {
    const response = await this.makeGraphRequest(`/me/drive/items/${folderId}/children`)

    const files: OneDriveFile[] = []

    for (const item of response.value) {
      if (item.file) {
        files.push({
          id: item.id,
          name: item.name,
          size: item.size,
          mimeType: item.file.mimeType,
          folderPath,
          lastModified: item.lastModifiedDateTime,
          parentFolderId: folderId
        })
      }
    }

    return files
  }
}
