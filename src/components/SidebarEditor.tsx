'use client'

import { useState, useEffect } from 'react'
import { SidebarService } from '@/lib/sidebar-service'
import { type SidebarConfig, type SidebarCategory, type SidebarItem } from '@/lib/supabase'
import {
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Plus,
  Save,
  X,
  Settings
} from 'lucide-react'

interface SidebarEditorProps {
  organizationId: string
  onClose: () => void
  onSave: () => void
}

export default function SidebarEditor({ organizationId, onClose, onSave }: SidebarEditorProps) {
  const [config, setConfig] = useState<SidebarConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    loadSidebarConfig()
  }, [organizationId])

  const loadSidebarConfig = async () => {
    try {
      setLoading(true)
      const sidebarConfig = await SidebarService.getDynamicSidebarConfig(organizationId)
      setConfig(sidebarConfig)
    } catch (error) {
      console.error('Error loading sidebar config:', error)
    } finally {
      setLoading(false)
    }
  }

  const startEditingItem = (itemId: string, currentLabel: string) => {
    setEditingItem(itemId)
    setEditValue(currentLabel)
  }

  const startEditingCategory = (categoryId: string, currentName: string) => {
    setEditingCategory(categoryId)
    setEditValue(currentName)
  }

  const saveItemEdit = async () => {
    if (!editingItem || !editValue.trim()) return

    try {
      setSaving(true)
      await SidebarService.updateItemLabel(editingItem, editValue.trim())
      
      // Update local state
      if (config) {
        const updatedItems = config.items.map(item =>
          item.id === editingItem ? { ...item, item_label: editValue.trim() } : item
        )
        setConfig({ ...config, items: updatedItems })
      }
      
      setEditingItem(null)
      setEditValue('')
    } catch (error) {
      console.error('Error saving item edit:', error)
    } finally {
      setSaving(false)
    }
  }

  const saveCategoryEdit = async () => {
    if (!editingCategory || !editValue.trim()) return

    try {
      setSaving(true)
      await SidebarService.updateCategoryName(editingCategory, editValue.trim())
      
      // Update local state
      if (config) {
        const updatedCategories = config.categories.map(category =>
          category.id === editingCategory ? { ...category, category_name: editValue.trim() } : category
        )
        setConfig({ ...config, categories: updatedCategories })
      }
      
      setEditingCategory(null)
      setEditValue('')
    } catch (error) {
      console.error('Error saving category edit:', error)
    } finally {
      setSaving(false)
    }
  }

  const toggleItemVisibility = async (itemId: string, currentVisibility: boolean) => {
    try {
      setSaving(true)
      await SidebarService.toggleItemVisibility(itemId, !currentVisibility)
      
      // Update local state
      if (config) {
        const updatedItems = config.items.map(item =>
          item.id === itemId ? { ...item, is_visible: !currentVisibility } : item
        )
        setConfig({ ...config, items: updatedItems })
      }
    } catch (error) {
      console.error('Error toggling item visibility:', error)
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditingItem(null)
    setEditingCategory(null)
    setEditValue('')
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center space-x-2 text-white">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span>Loading sidebar configuration...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Customize Sidebar</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {config?.categories.map(category => {
            const categoryItems = config.items.filter(item => item.category_id === category.id)
            
            return (
              <div key={category.id} className="mb-8">
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  {editingCategory === category.id ? (
                    <div className="flex items-center space-x-2 flex-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded px-3 py-1 text-white flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCategoryEdit()
                          if (e.key === 'Escape') cancelEdit()
                        }}
                        autoFocus
                      />
                      <button
                        onClick={saveCategoryEdit}
                        disabled={saving}
                        className="p-1 text-green-400 hover:text-green-300"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="p-1 text-gray-400 hover:text-gray-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-300">{category.category_name}</h3>
                      <button
                        onClick={() => startEditingCategory(category.id, category.category_name)}
                        className="p-1 text-gray-400 hover:text-gray-300"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Category Items */}
                <div className="space-y-2 ml-4">
                  {categoryItems.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
                        
                        {editingItem === item.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveItemEdit()
                                if (e.key === 'Escape') cancelEdit()
                              }}
                              autoFocus
                            />
                            <button
                              onClick={saveItemEdit}
                              disabled={saving}
                              className="p-1 text-green-400 hover:text-green-300"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-gray-400 hover:text-gray-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="text-white">{item.item_label}</span>
                            {config.counts?.[item.item_key] !== undefined && (
                              <span className="text-xs text-gray-400">
                                ({config.counts[item.item_key]})
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => startEditingItem(item.id, item.item_label)}
                          className="p-1 text-gray-400 hover:text-gray-300"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleItemVisibility(item.id, item.is_visible)}
                          className={`p-1 ${item.is_visible ? 'text-green-400 hover:text-green-300' : 'text-gray-400 hover:text-gray-300'}`}
                        >
                          {item.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave()
              onClose()
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
