import { supabase, type Document } from './supabase'
import { MicrosoftGraphService, OneDriveFile, UploadProgress } from './microsoft-graph-service'
import { MicrosoftAuthService, MicrosoftTokens } from './microsoft-auth-service'

export interface DocumentUploadOptions {
  name: string
  description?: string
  category?: string
  onProgress?: (progress: UploadProgress) => void
}

export class DocumentService {
  /**
   * Upload document to OneDrive and save metadata to Supabase
   */
  static async uploadDocument(
    file: File,
    organizationId: string,
    organizationName: string,
    options: DocumentUploadOptions,
    accessToken: string
  ): Promise<Document> {
    try {
      console.log('📤 Starting document upload:', file.name)

      // Create initial document record in Supabase
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .insert({
          organization_id: organizationId,
          title: options.name || file.name, // Required field
          name: options.name || file.name,
          description: options.description,
          category: options.category,
          file_type: file.type || this.getFileTypeFromName(file.name),
          file_size: file.size,
          upload_status: 'uploading'
          // Other fields have defaults or are nullable
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      try {
        // Upload to OneDrive
        const graphService = new MicrosoftGraphService(accessToken)
        const oneDriveFile = await graphService.uploadFile(
          file,
          organizationId,
          organizationName,
          options.category,
          options.onProgress
        )

        // Update document record with OneDrive metadata
        const { data: updatedDocument, error: updateError } = await supabase
          .from('documents')
          .update({
            onedrive_file_id: oneDriveFile.id,
            onedrive_share_url: oneDriveFile.shareUrl,
            onedrive_download_url: oneDriveFile.downloadUrl,
            onedrive_folder_path: oneDriveFile.folderPath,
            upload_status: 'completed',
            last_sync_at: new Date().toISOString()
          })
          .eq('id', document.id)
          .select()
          .single()

        if (updateError) {
          throw new Error(`Failed to update document metadata: ${updateError.message}`)
        }

        console.log('✅ Document uploaded successfully:', updatedDocument.id)
        return updatedDocument

      } catch (uploadError) {
        // Mark upload as failed in database
        await supabase
          .from('documents')
          .update({ upload_status: 'failed' })
          .eq('id', document.id)

        throw uploadError
      }

    } catch (error) {
      console.error('❌ Error uploading document:', error)
      throw new Error(`Failed to upload document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download document from OneDrive
   */
  static async downloadDocument(documentId: string, accessToken: string): Promise<Blob> {
    try {
      console.log('📥 Downloading document:', documentId)

      // Get document metadata from Supabase
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      if (!document.onedrive_file_id) {
        throw new Error('Document not found in OneDrive')
      }

      // Download from OneDrive
      const graphService = new MicrosoftGraphService(accessToken)
      const fileBlob = await graphService.downloadFile(document.onedrive_file_id)

      console.log('✅ Document downloaded successfully')
      return fileBlob

    } catch (error) {
      console.error('❌ Error downloading document:', error)
      throw new Error(`Failed to download document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete document from both OneDrive and Supabase
   */
  static async deleteDocument(documentId: string, accessToken: string): Promise<void> {
    try {
      console.log('🗑️ Deleting document:', documentId)

      // Get document metadata from Supabase
      const { data: document, error: dbError } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Delete from OneDrive if file exists
      if (document.onedrive_file_id) {
        try {
          const graphService = new MicrosoftGraphService(accessToken)
          await graphService.deleteFile(document.onedrive_file_id)
        } catch (oneDriveError) {
          console.warn('⚠️ Could not delete from OneDrive (file may already be deleted):', oneDriveError instanceof Error ? oneDriveError.message : 'Unknown error')
        }
      }

      // Delete from Supabase
      const { error: deleteError } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (deleteError) {
        throw new Error(`Failed to delete from database: ${deleteError.message}`)
      }

      console.log('✅ Document deleted successfully')

    } catch (error) {
      console.error('❌ Error deleting document:', error)
      throw new Error(`Failed to delete document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get documents for an organization
   */
  static async getDocuments(organizationId: string): Promise<Document[]> {
    try {
      console.log('📋 Fetching documents for organization:', organizationId)

      const { data: documents, error } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log(`✅ Found ${documents?.length || 0} documents`)
      return documents || []

    } catch (error) {
      console.error('❌ Error fetching documents:', error)
      throw new Error(`Failed to fetch documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get document by ID
   */
  static async getDocument(documentId: string): Promise<Document | null> {
    try {
      const { data: document, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Document not found
        }
        throw new Error(`Database error: ${error.message}`)
      }

      return document

    } catch (error) {
      console.error('❌ Error fetching document:', error)
      throw new Error(`Failed to fetch document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Update document metadata
   */
  static async updateDocument(
    documentId: string,
    updates: Partial<Pick<Document, 'name' | 'description' | 'category'>>
  ): Promise<Document> {
    try {
      console.log('📝 Updating document:', documentId)

      const { data: document, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      console.log('✅ Document updated successfully')
      return document

    } catch (error) {
      console.error('❌ Error updating document:', error)
      throw new Error(`Failed to update document: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Sync documents with OneDrive (check for changes)
   */
  static async syncDocuments(
    organizationId: string,
    organizationName: string,
    accessToken: string
  ): Promise<{ synced: number; errors: string[] }> {
    try {
      console.log('🔄 Syncing documents with OneDrive')

      const graphService = new MicrosoftGraphService(accessToken)
      const oneDriveFiles = await graphService.listFiles(organizationId, organizationName)
      
      const { data: dbDocuments, error: dbError } = await supabase
        .from('documents')
        .select('*')
        .eq('organization_id', organizationId)

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      let synced = 0
      const errors: string[] = []

      // Check for files in OneDrive that aren't in database
      for (const oneDriveFile of oneDriveFiles) {
        const existingDoc = dbDocuments?.find(doc => doc.onedrive_file_id === oneDriveFile.id)
        
        if (!existingDoc) {
          try {
            // Create database record for OneDrive file
            await supabase
              .from('documents')
              .insert({
                organization_id: organizationId,
                name: oneDriveFile.name,
                file_type: oneDriveFile.mimeType,
                file_size: oneDriveFile.size,
                onedrive_file_id: oneDriveFile.id,
                onedrive_share_url: oneDriveFile.shareUrl,
                onedrive_download_url: oneDriveFile.downloadUrl,
                onedrive_folder_path: oneDriveFile.folderPath,
                upload_status: 'completed',
                last_sync_at: new Date().toISOString()
              })

            synced++
          } catch (error) {
            errors.push(`Failed to sync ${oneDriveFile.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }

      console.log(`✅ Sync completed: ${synced} files synced, ${errors.length} errors`)
      return { synced, errors }

    } catch (error) {
      console.error('❌ Error syncing documents:', error)
      throw new Error(`Failed to sync documents: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get file type from filename
   */
  private static getFileTypeFromName(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase()
    
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'txt': 'text/plain',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed'
    }

    return mimeTypes[extension || ''] || 'application/octet-stream'
  }

  /**
   * Get file icon based on file type
   */
  static getFileIcon(fileType: string): string {
    if (fileType.startsWith('image/')) return 'Image'
    if (fileType.includes('pdf')) return 'FileText'
    if (fileType.includes('word') || fileType.includes('document')) return 'FileText'
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return 'FileSpreadsheet'
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'FilePresentation'
    if (fileType.includes('zip') || fileType.includes('rar')) return 'Archive'
    if (fileType.startsWith('video/')) return 'Video'
    if (fileType.startsWith('audio/')) return 'Music'
    return 'File'
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }
}
