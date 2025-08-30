'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { SidebarService, type SidebarItem } from '@/lib/sidebar-service'
import { PageContentService } from '@/lib/page-content-service'
import { supabase, type Organization } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import DeleteConfirmation from '@/components/DeleteConfirmation'
import {
  Plus,
  Edit,
  Trash2,
  Settings,
  Save,
  X,
  ArrowLeft,
  Eye,
  EyeOff
} from 'lucide-react'

export default function SidebarManagementPage() {
  const params = useParams()
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<SidebarItem | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    item: SidebarItem | null
  }>({ isOpen: false, item: null })

  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    item_slug: '',
    parent_category: 'CLIENT CONTACT',
    icon: 'FileText',
    description: '',
    content_type: 'rich-text',
    sort_order: 0,
    is_active: true
  })

  useEffect(() => {
    fetchOrganization()
    fetchSidebarItems()
  }, [params.id])

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

  const fetchSidebarItems = async () => {
    try {
      setLoading(true)
      const items = await SidebarService.getOrganizationSidebarItems(params.id as string)
      setSidebarItems(items)
    } catch (error) {
      console.error('Error fetching sidebar items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingItem) {
        // Update existing item
        await SidebarService.updateSidebarItem(editingItem.id, formData)
      } else {
        // Create new item - exclude content_type from sidebar item data
        const { content_type, ...sidebarItemData } = formData
        const newSidebarItem = await SidebarService.createSidebarItem({
          ...sidebarItemData,
          organization_id: params.id as string,
          is_system: false
        })

        // Create default page content for the new sidebar item
        try {
          await PageContentService.createDefaultPageContent(newSidebarItem.id, content_type)
        } catch (contentError) {
          console.error('Error creating page content:', contentError)
          // Continue even if content creation fails
        }
      }

      // Reset form and refresh data
      resetForm()
      fetchSidebarItems()
    } catch (error) {
      console.error('Error saving sidebar item:', error)

      // Show user-friendly error message
      let errorMessage = 'Failed to save sidebar item. '
      if (error instanceof Error) {
        errorMessage += error.message
      } else {
        errorMessage += 'Please check your connection and try again.'
      }

      // You could show this in a toast notification or alert
      alert(errorMessage)
    }
  }

  const handleEdit = (item: SidebarItem) => {
    setEditingItem(item)
    setFormData({
      item_name: item.item_label,
      item_slug: item.item_href || '',
      parent_category: item.parent_category || 'CLIENT CONTACT',
      icon: item.icon_name,
      description: item.description || '',
      content_type: 'rich-text',
      sort_order: item.display_order,
      is_active: item.is_visible
    })
    setShowForm(true)
  }

  const handleDelete = (item: SidebarItem) => {
    setDeleteConfirmation({
      isOpen: true,
      item
    })
  }

  const handleDeleteConfirm = async () => {
    if (deleteConfirmation.item) {
      try {
        await SidebarService.deleteSidebarItem(deleteConfirmation.item.id)
        fetchSidebarItems()
      } catch (error) {
        console.error('Error deleting sidebar item:', error)
      }
    }
    setDeleteConfirmation({ isOpen: false, item: null })
  }

  const resetForm = () => {
    setFormData({
      item_name: '',
      item_slug: '',
      parent_category: 'CLIENT CONTACT',
      icon: 'FileText',
      description: '',
      content_type: 'rich-text',
      sort_order: 0,
      is_active: true
    })
    setEditingItem(null)
    setShowForm(false)
  }

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      item_name: name,
      item_slug: generateSlug(name)
    }))
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
              <div className="text-gray-400">Loading sidebar management...</div>
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
              <button
                onClick={() => router.push(`/organizations/${params.id}`)}
                className="flex items-center space-x-2 text-gray-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Organization</span>
              </button>
              <div>
                <h1 className="text-2xl font-semibold">Sidebar Management</h1>
                <p className="text-gray-400">{organization?.name}</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sidebar Item</span>
            </button>
          </div>

          {/* Sidebar Items Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <h2 className="text-lg font-medium">Custom Sidebar Items</h2>
              <p className="text-gray-400 text-sm mt-1">
                Manage custom navigation items for this organization
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-750">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Slug</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Icon</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {sidebarItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-750">
                      <td className="p-4">
                        <div className="font-medium text-white">{item.item_name}</div>
                        {item.description && (
                          <div className="text-sm text-gray-400">{item.description}</div>
                        )}
                      </td>
                      <td className="p-4 text-gray-300">{item.parent_category}</td>
                      <td className="p-4 text-gray-300 font-mono text-sm">{item.item_slug}</td>
                      <td className="p-4 text-gray-300">{item.icon}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                          item.is_active 
                            ? 'bg-green-900/20 text-green-400' 
                            : 'bg-gray-900/20 text-gray-400'
                        }`}>
                          {item.is_active ? (
                            <>
                              <Eye className="w-3 h-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <EyeOff className="w-3 h-3 mr-1" />
                              Inactive
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1 text-gray-400 hover:text-blue-400"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1 text-gray-400 hover:text-red-400"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {sidebarItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-8 text-gray-400">
                        No custom sidebar items found. Click "Add Sidebar Item" to create one.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">
                {editingItem ? 'Edit Sidebar Item' : 'Add Sidebar Item'}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.item_name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="e.g., Core Documentation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={formData.item_slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, item_slug: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-mono text-sm"
                  placeholder="e.g., core-documentation"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Parent Category *
                </label>
                <select
                  value={formData.parent_category}
                  onChange={(e) => setFormData(prev => ({ ...prev, parent_category: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  required
                >
                  {SidebarService.getAvailableCategories().map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  {SidebarService.getAvailableIcons().map(icon => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Content Type *
                </label>
                <select
                  value={formData.content_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, content_type: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  required
                >
                  {PageContentService.getContentTypes().map(contentType => (
                    <option key={contentType.id} value={contentType.id}>
                      {contentType.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  {PageContentService.getContentType(formData.content_type)?.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-300">
                  Active (show in sidebar)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingItem ? 'Update' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, item: null })}
        onConfirm={handleDeleteConfirm}
        title="Delete Sidebar Item"
        message="Are you sure you want to delete this sidebar item? This action cannot be undone."
        itemName={deleteConfirmation.item?.item_name}
      />
    </div>
  )
}
