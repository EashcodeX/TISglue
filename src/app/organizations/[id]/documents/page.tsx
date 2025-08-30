'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization, type Document } from '@/lib/supabase'
import { DocumentService } from '@/lib/document-service'
import { useClient } from '@/contexts/ClientContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import OneDriveFileUpload from '@/components/OneDriveFileUpload'
import {
  Search,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Folder,
  FolderOpen,
  File,
  FileText,
  Image,
  Download,
  ChevronRight,
  ChevronDown,
  Cloud,
  CheckCircle,
  AlertCircle,
  Clock,
  X
} from 'lucide-react'

interface DocumentCategory {
  id: string
  name: string
  expanded: boolean
  documents: Document[]
  documentCount: number
}

export default function DocumentsPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedClient } = useClient()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [categories, setCategories] = useState<DocumentCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadCategory, setUploadCategory] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchOrganization()
    fetchDocuments()
  }, [params.id])

  useEffect(() => {
    organizeDocuments()
  }, [documents, searchTerm, includeArchived])

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setOrganization(data)
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      setLoading(true)

      // Use the new API route with proper RLS
      const response = await fetch(`/api/documents?organization_id=${params.id}`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch documents')
      }

      const result = await response.json()
      setDocuments(result.data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
      // Show user-friendly error message
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  const organizeDocuments = () => {
    let filteredDocs = documents

    if (searchTerm) {
      filteredDocs = filteredDocs.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (!includeArchived) {
      filteredDocs = filteredDocs.filter(doc => !doc.archived)
    }

    // Group documents by category
    const categoryMap = new Map<string, Document[]>()
    
    // Default categories from the screenshot
    const defaultCategories = [
      'Account Files',
      'Applications', 
      'Archived',
      'Change Management',
      'Client Relations',
      'Documents from Previous Provider',
      'Knowledgebase',
      'Server File NTFS Permissions',
      'Site Photos'
    ]

    // Initialize default categories
    defaultCategories.forEach(cat => {
      categoryMap.set(cat, [])
    })

    // Group documents
    filteredDocs.forEach(doc => {
      const category = doc.category || 'Uncategorized'
      if (!categoryMap.has(category)) {
        categoryMap.set(category, [])
      }
      categoryMap.get(category)!.push(doc)
    })

    // Convert to category objects
    const categoryList: DocumentCategory[] = Array.from(categoryMap.entries()).map(([name, docs]) => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      expanded: false,
      documents: docs,
      documentCount: docs.length
    }))

    setCategories(categoryList)
  }

  const toggleCategory = (categoryId: string) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, expanded: !cat.expanded } : cat
    ))
  }

  const handleSidebarItemClick = (item: any) => {
    if (item.href) {
      if (item.href === '/') {
        router.push('/')
      } else {
        router.push(`/organizations/${params.id}${item.href}`)
      }
    }
  }

  const handleUploadComplete = (document: Document) => {
    console.log('✅ Document uploaded:', document)
    setDocuments(prev => [document, ...prev])
    setShowUploadModal(false)
  }

  const handleUploadError = (error: string) => {
    console.error('❌ Upload error:', error)
    // You could show a toast notification here
  }

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/documents/${doc.id}/download`)

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.authRequired) {
          window.location.href = errorData.authUrl
          return
        }
        throw new Error(errorData.error || 'Download failed')
      }

      // Create blob and download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.name
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      console.error('❌ Download error:', error)
      alert(`Failed to download: ${error.message}`)
    }
  }

  const handleView = async (doc: Document) => {
    try {
      console.log('👁️ Viewing document:', doc.name)

      // First check document status via view endpoint
      const viewResponse = await fetch(`/api/documents/${doc.id}/view`)

      if (!viewResponse.ok) {
        const errorData = await viewResponse.json()
        if (errorData.authRequired) {
          window.location.href = errorData.authUrl
          return
        }
        throw new Error(errorData.error || 'Failed to load document info')
      }

      const viewData = await viewResponse.json()
      console.log('📄 Document view data:', viewData)

      if (!viewData.viewable) {
        // Document not ready for viewing
        let message = `Document "${doc.name}" is not available for viewing.\n\n`

        if (viewData.reason === 'no_file_content') {
          message += `Reason: This document was created for testing purposes and contains only metadata.\n\n`
          message += `To view actual files:\n`
          message += `1. Complete Microsoft OneDrive authentication\n`
          message += `2. Upload new files using the "Upload to OneDrive" button\n`
          message += `3. Files will be stored in OneDrive and viewable here`
        } else {
          message += `Status: ${doc.upload_status}\n\n`
          message += `Please wait for the upload to complete or try re-uploading the file.`
        }

        alert(message)
        return
      }

      // Document is viewable, download and display
      const downloadResponse = await fetch(`/api/documents/${doc.id}/download`)

      if (!downloadResponse.ok) {
        const errorData = await downloadResponse.json()
        if (errorData.authRequired) {
          window.location.href = errorData.authUrl
          return
        }
        throw new Error(errorData.error || 'Failed to download file')
      }

      const blob = await downloadResponse.blob()
      const url = window.URL.createObjectURL(blob)
      const fileExtension = doc.name.split('.').pop()?.toLowerCase()

      // Handle different file types
      if (['pdf'].includes(fileExtension || '')) {
        // Open PDF in new tab
        window.open(url, '_blank')
      } else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(fileExtension || '')) {
        // Open image in new tab
        window.open(url, '_blank')
      } else if (['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(fileExtension || '')) {
        // Open text files in new tab
        window.open(url, '_blank')
      } else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExtension || '')) {
        // For Office files, trigger download (browser will handle with installed apps)
        const a = document.createElement('a')
        a.href = url
        a.download = doc.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        alert(`File "${doc.name}" has been downloaded. It will open with your default application.`)
      } else {
        // For other files, trigger download
        const a = document.createElement('a')
        a.href = url
        a.download = doc.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)

        alert(`File "${doc.name}" has been downloaded to your Downloads folder.`)
      }
    } catch (error: any) {
      console.error('❌ View error:', error)
      alert(`Failed to view file: ${error.message}`)
    }
  }

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) {
      return
    }

    try {
      setIsDeleting(doc.id)
      const response = await fetch(`/api/documents/${doc.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.authRequired) {
          window.location.href = errorData.authUrl
          return
        }
        throw new Error(errorData.error || 'Delete failed')
      }

      // Remove from local state
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (error: any) {
      console.error('❌ Delete error:', error)
      alert(`Failed to delete: ${error.message}`)
    } finally {
      setIsDeleting(null)
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()

    switch (extension) {
      case 'pdf':
        return <FileText className="w-4 h-4 text-red-400" />
      case 'doc':
      case 'docx':
        return <FileText className="w-4 h-4 text-blue-400" />
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return <Image className="w-4 h-4 text-green-400" />
      default:
        return <File className="w-4 h-4 text-gray-400" />
    }
  }

  const getUploadStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <div title="Uploaded to OneDrive">
            <CheckCircle className="w-4 h-4 text-green-400" />
          </div>
        )
      case 'uploading':
        return (
          <div title="Uploading to OneDrive">
            <Clock className="w-4 h-4 text-blue-400 animate-pulse" />
          </div>
        )
      case 'failed':
        return (
          <div title="Upload failed">
            <AlertCircle className="w-4 h-4 text-red-400" />
          </div>
        )
      default:
        return (
          <div title="Pending upload">
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const totalDocuments = categories.reduce((sum, cat) => sum + cat.documentCount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Organizations" />
        <div className="flex">
          <Sidebar onItemClick={handleSidebarItemClick} />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading documents...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header currentPage="Organizations" />
      <div className="flex">
        <Sidebar onItemClick={handleSidebarItemClick} />
        
        <div className="flex-1 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Documents</h1>
                <div className="text-sm text-gray-400">
                  {organization?.name}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  const authUrl = `/api/auth/microsoft?organization_id=${params.id}&return_url=${encodeURIComponent(window.location.pathname)}`
                  console.log('🔐 Testing authentication:', authUrl)
                  window.location.href = authUrl
                }}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded text-sm"
              >
                <span>🔐 Test Auth</span>
              </button>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
              >
                <Cloud className="w-4 h-4" />
                <Upload className="w-4 h-4" />
                <span>Upload to OneDrive</span>
              </button>
              <button
                onClick={() => router.push(`/organizations/${params.id}/documents/new`)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filter columns or Search keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include archived</span>
                </label>
              </div>
              <div className="text-sm text-gray-400">
                {totalDocuments} of {totalDocuments} Results
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">
                      <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Size</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">OneDrive Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Updated</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {categories.map((category) => (
                    <React.Fragment key={category.id}>
                      {/* Category Header */}
                      <tr className="bg-gray-750">
                        <td className="p-4">
                          <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                        </td>
                        <td className="p-4" colSpan={8}>
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="flex items-center space-x-2 text-white hover:text-blue-400"
                          >
                            {category.expanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            {category.expanded ? (
                              <FolderOpen className="w-4 h-4 text-yellow-400" />
                            ) : (
                              <Folder className="w-4 h-4 text-yellow-400" />
                            )}
                            <span>{category.name}</span>
                            <span className="text-gray-400 text-sm">({category.documentCount} documents)</span>
                          </button>
                        </td>
                      </tr>
                      
                      {/* Category Documents */}
                      {category.expanded && category.documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-gray-700/50">
                          <td className="p-4">
                            <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3 pl-6">
                              {getFileIcon(doc.name)}
                              <div>
                                <span className="text-white">{doc.name}</span>
                                {doc.description && (
                                  <div className="text-xs text-gray-400">{doc.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">
                            {doc.file_size ? DocumentService.formatFileSize(doc.file_size) : '-'}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              {getUploadStatusIcon(doc.upload_status)}
                              <span className="text-xs text-gray-400">
                                {doc.upload_status === 'completed' ? 'Synced' :
                                 doc.upload_status === 'uploading' ? 'Uploading...' :
                                 doc.upload_status === 'failed' ? 'Failed' : 'Pending'}
                              </span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">{formatDate(doc.updated_at)}</td>
                          <td className="p-4 text-gray-300">{doc.category || '-'}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleView(doc)}
                                className="p-1 text-gray-400 hover:text-green-400"
                                title="View document"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              {doc.upload_status === 'completed' && doc.onedrive_file_id && (
                                <button
                                  onClick={() => handleDownload(doc)}
                                  className="p-1 text-gray-400 hover:text-blue-400"
                                  title="Download from OneDrive"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(doc)}
                                disabled={isDeleting === doc.id}
                                className="p-1 text-gray-400 hover:text-red-400 disabled:opacity-50"
                                title="Delete document"
                              >
                                {isDeleting === doc.id ? (
                                  <Clock className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  
                  {totalDocuments === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-400">
                        <div className="flex flex-col items-center space-y-2">
                          <Cloud className="w-8 h-8 text-gray-500" />
                          <span>No documents found</span>
                          <button
                            onClick={() => setShowUploadModal(true)}
                            className="text-blue-400 hover:text-blue-300 text-sm"
                          >
                            Upload your first document to OneDrive
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* OneDrive Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                <Cloud className="w-6 h-6 text-blue-400" />
                <span>Upload to OneDrive Pro</span>
              </h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category (Optional)
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="">Select category...</option>
                <option value="Account Files">Account Files</option>
                <option value="Applications">Applications</option>
                <option value="Change Management">Change Management</option>
                <option value="Client Relations">Client Relations</option>
                <option value="Documents from Previous Provider">Documents from Previous Provider</option>
                <option value="Knowledgebase">Knowledgebase</option>
                <option value="Server File NTFS Permissions">Server File NTFS Permissions</option>
                <option value="Site Photos">Site Photos</option>
              </select>
            </div>

            <OneDriveFileUpload
              organizationId={params.id as string}
              organizationName={organization?.name || 'Unknown Organization'}
              category={uploadCategory || undefined}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFileSize={100 * 1024 * 1024} // 100MB
              multiple={true}
            />
          </div>
        </div>
      )}
    </div>
  )
}
