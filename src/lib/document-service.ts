import { supabase, type Document } from './supabase'
import { MicrosoftGraphService, OneDriveFile, UploadProgress } from './microsoft-graph-service'
import { MicrosoftAuthService, MicrosoftTokens } from './microsoft-auth-service'

export interface DocumentUploadOptions {
  name: string
  description?: string
  category?: string
  onProgress?: (progress: UploadProgress) => void
}

export interface DocumentFilters {
  category?: string
  search?: string
  archived?: boolean
  limit?: number
  offset?: number
}

export class DocumentService {
  /**
   * Get all documents for an organization with proper RLS (supports super admin access)
   */
  static async getDocuments(
    organizationId: string,
    filters: DocumentFilters = {}
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      console.log('📄 Fetching documents for organization:', organizationId)

      let query = supabase
        .from('documents')
        .select('*', { count: 'exact' })
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.archived !== undefined) {
        query = query.eq('archived', filters.archived)
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Error fetching documents:', error)
        throw new Error(`Failed to fetch documents: ${error.message}`)
      }

      return {
        documents: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('❌ Document fetch error:', error)
      throw error
    }
  }

  /**
   * Get all documents across all organizations (super admin only)
   */
  static async getAllDocuments(
    filters: DocumentFilters = {}
  ): Promise<{ documents: Document[]; total: number }> {
    try {
      console.log('📄 Fetching all documents (super admin)')

      let query = supabase
        .from('documents')
        .select(`
          *,
          organizations:organization_id(id, name)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
      }

      if (filters.archived !== undefined) {
        query = query.eq('archived', filters.archived)
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        console.error('❌ Error fetching all documents:', error)
        throw new Error(`Failed to fetch all documents: ${error.message}`)
      }

      return {
        documents: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('❌ All documents fetch error:', error)
      throw error
    }
  }

  /**
   * Get a single document by ID with proper RLS
   */
  static async getDocument(documentId: string): Promise<Document | null> {
    try {
      console.log('📄 Fetching document:', documentId)

      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', documentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Document not found or no access
        }
        console.error('❌ Error fetching document:', error)
        throw new Error(`Failed to fetch document: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('❌ Document fetch error:', error)
      throw error
    }
  }

  /**
   * Create a new document record in Supabase
   */
  static async createDocument(documentData: Partial<Document>): Promise<Document> {
    try {
      console.log('📝 Creating document:', documentData.name)

      const { data, error } = await supabase
        .from('documents')
        .insert([{
          ...documentData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          upload_status: documentData.upload_status || 'pending',
          is_public: documentData.is_public || false,
          archived: documentData.archived || false
        }])
        .select()
        .single()

      if (error) {
        console.error('❌ Error creating document:', error)
        throw new Error(`Failed to create document: ${error.message}`)
      }

      console.log('✅ Document created successfully:', data.id)
      return data
    } catch (error) {
      console.error('❌ Document creation error:', error)
      throw error
    }
  }

  /**
   * Update an existing document
   */
  static async updateDocument(documentId: string, updates: Partial<Document>): Promise<Document> {
    try {
      console.log('📝 Updating document:', documentId)

      const { data, error } = await supabase
        .from('documents')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating document:', error)
        throw new Error(`Failed to update document: ${error.message}`)
      }

      console.log('✅ Document updated successfully')
      return data
    } catch (error) {
      console.error('❌ Document update error:', error)
      throw error
    }
  }

  /**
   * Delete a document (basic version - just from Supabase)
   */
  static async deleteDocument(documentId: string): Promise<void> {
    try {
      console.log('🗑️ Deleting document:', documentId)

      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentId)

      if (error) {
        console.error('❌ Error deleting document:', error)
        throw new Error(`Failed to delete document: ${error.message}`)
      }

      console.log('✅ Document deleted successfully')
    } catch (error) {
      console.error('❌ Document deletion error:', error)
      throw error
    }
  }

  /**
   * Delete document from both OneDrive and Supabase
   */
  static async deleteDocumentWithOneDrive(documentId: string, accessToken: string): Promise<void> {
    try {
      console.log('🗑️ Deleting document from OneDrive and Supabase:', documentId)

      // Get document metadata first
      const document = await this.getDocument(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      // Delete from OneDrive if file exists
      if (document.onedrive_file_id && accessToken) {
        try {
          const graphService = new MicrosoftGraphService(accessToken)
          await graphService.deleteFile(document.onedrive_file_id)
          console.log('✅ Document deleted from OneDrive')
        } catch (oneDriveError) {
          console.warn('⚠️ Could not delete from OneDrive (file may already be deleted):', oneDriveError)
        }
      }

      // Delete from Supabase
      await this.deleteDocument(documentId)
      console.log('✅ Document deleted from database')

    } catch (error) {
      console.error('❌ Error deleting document:', error)
      throw error
    }
  }

  /**
   * Upload document to OneDrive and save metadata to Supabase
   */
  static async uploadDocumentToOneDrive(
    file: File,
    organizationId: string,
    organizationName: string,
    options: DocumentUploadOptions,
    accessToken: string
  ): Promise<Document> {
    try {
      console.log('📤 Starting document upload to OneDrive:', file.name)

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

      // Get document metadata
      const document = await this.getDocument(documentId)
      if (!document) {
        throw new Error('Document not found')
      }

      if (!document.onedrive_file_id) {
        throw new Error('Document is not stored in OneDrive')
      }

      // Download from OneDrive
      const graphService = new MicrosoftGraphService(accessToken)
      const fileBlob = await graphService.downloadFile(document.onedrive_file_id)

      console.log('✅ Document downloaded successfully')
      return fileBlob

    } catch (error) {
      console.error('❌ Error downloading document:', error)
      throw error
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

      const { documents: dbDocuments } = await this.getDocuments(organizationId)

      let synced = 0
      const errors: string[] = []

      // Check for files in OneDrive that aren't in database
      for (const oneDriveFile of oneDriveFiles) {
        const existingDoc = dbDocuments.find(doc => doc.onedrive_file_id === oneDriveFile.id)

        if (!existingDoc) {
          try {
            // Create database record for OneDrive file
            await this.createDocument({
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
      throw error
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
