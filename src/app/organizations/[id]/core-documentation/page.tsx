'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import DeleteConfirmation from '@/components/DeleteConfirmation'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Download,
  Filter,
  FileText,
  Shield,
  Calendar,
  User,
  ExternalLink
} from 'lucide-react'

interface CoreDocumentation {
  id: string
  organization_id: string
  document_name: string
  document_type: string
  category: string
  description?: string
  file_url?: string
  file_size_kb?: number
  version?: string
  author?: string
  status: string
  is_confidential: boolean
  last_reviewed_date?: string
  next_review_date?: string
  tags?: string
  access_level: string
  approval_required: boolean
  approved_by?: string
  approved_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export default function CoreDocumentationPage() {
  const params = useParams()
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [documents, setDocuments] = useState<CoreDocumentation[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [filteredDocuments, setFilteredDocuments] = useState<CoreDocumentation[]>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    item: CoreDocumentation | null
  }>({ isOpen: false, item: null })

  useEffect(() => {
    fetchOrganization()
    fetchDocuments()
  }, [params.id])

  useEffect(() => {
    filterDocuments()
  }, [documents, searchTerm, categoryFilter, statusFilter])

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
      const { data, error } = await supabase
        .from('core_documentation')
        .select('*')
        .eq('organization_id', params.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching core documentation:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDocuments = () => {
    let filtered = documents

    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.document_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.author?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(doc => doc.category === categoryFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === statusFilter)
    }

    setFilteredDocuments(filtered)
  }

  const handleEdit = (doc: CoreDocumentation) => {
    router.push(`/organizations/${params.id}/core-documentation/${doc.id}/edit`)
  }

  const handleDelete = (doc: CoreDocumentation) => {
    setDeleteConfirmation({
      isOpen: true,
      item: doc
    })
  }

  const handleDeleteConfirm = () => {
    fetchDocuments()
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      isOpen: false,
      item: null
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-900/20 text-green-400'
      case 'draft':
        return 'bg-yellow-900/20 text-yellow-400'
      case 'archived':
        return 'bg-gray-900/20 text-gray-400'
      case 'under_review':
        return 'bg-blue-900/20 text-blue-400'
      default:
        return 'bg-gray-900/20 text-gray-400'
    }
  }

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'public':
        return 'bg-green-900/20 text-green-400'
      case 'internal':
        return 'bg-blue-900/20 text-blue-400'
      case 'restricted':
        return 'bg-yellow-900/20 text-yellow-400'
      case 'confidential':
        return 'bg-red-900/20 text-red-400'
      default:
        return 'bg-gray-900/20 text-gray-400'
    }
  }

  const formatFileSize = (sizeKb?: number) => {
    if (!sizeKb) return '-'
    if (sizeKb < 1024) return `${sizeKb} KB`
    return `${(sizeKb / 1024).toFixed(1)} MB`
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Organizations" />
        <div className="flex">
          <Sidebar onItemClick={handleSidebarItemClick} />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading core documentation...</div>
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
            <div>
              <h1 className="text-2xl font-semibold">Core Documentation</h1>
              <p className="text-gray-400">{organization?.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={() => router.push(`/organizations/${params.id}/core-documentation/new`)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="all">All Categories</option>
                <option value="policy">Policy</option>
                <option value="procedure">Procedure</option>
                <option value="manual">Manual</option>
                <option value="contract">Contract</option>
                <option value="specification">Specification</option>
                <option value="other">Other</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="under_review">Under Review</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Document</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Access Level</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Author</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Last Updated</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredDocuments.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-750">
                      <td className="p-4">
                        <div className="flex items-start space-x-3">
                          <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium text-white flex items-center space-x-2">
                              <span>{doc.document_name}</span>
                              {doc.is_confidential && (
                                <Shield className="w-4 h-4 text-red-400" />
                              )}
                              {doc.file_url && (
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            {doc.description && (
                              <div className="text-sm text-gray-400 mt-1">{doc.description}</div>
                            )}
                            {doc.version && (
                              <div className="text-xs text-gray-500 mt-1">Version: {doc.version}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-gray-300 capitalize">{doc.category}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                          {doc.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${getAccessLevelColor(doc.access_level)}`}>
                          {doc.access_level}
                        </span>
                      </td>
                      <td className="p-4 text-gray-300">{doc.author || '-'}</td>
                      <td className="p-4 text-gray-300">
                        {new Date(doc.updated_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button 
                            className="p-1 text-gray-400 hover:text-white"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEdit(doc)}
                            className="p-1 text-gray-400 hover:text-blue-400"
                            title="Edit Document"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(doc)}
                            className="p-1 text-gray-400 hover:text-red-400"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredDocuments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-gray-400">
                        {documents.length === 0 
                          ? 'No core documentation found. Click "New" to create your first document.'
                          : 'No documents match your current filters.'
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Core Documentation"
        message="Are you sure you want to delete this document? This action cannot be undone."
        itemName={deleteConfirmation.item?.document_name}
        tableName="core_documentation"
        itemId={deleteConfirmation.item?.id}
      />
    </div>
  )
}
