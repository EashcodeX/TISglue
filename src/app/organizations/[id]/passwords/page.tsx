'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization, type Password } from '@/lib/supabase'
import { useClient } from '@/contexts/ClientContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import DeleteConfirmation from '@/components/DeleteConfirmation'
import { useAuth } from '@/contexts/AuthContext'
import {
  Search,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  MoreHorizontal,
  Key,
  Shield,
  Clock,
  User,
  Lock,
  Unlock
} from 'lucide-react'

export default function PasswordsPage() {
  const params = useParams()
  const router = useRouter()
  const { isAdmin, isSuperAdmin } = useAuth()

  const { selectedClient } = useClient()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [passwords, setPasswords] = useState<Password[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [filteredPasswords, setFilteredPasswords] = useState<Password[]>([])
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean
    item: Password | null
  }>({ isOpen: false, item: null })

  useEffect(() => {
    fetchOrganization()
    fetchPasswords()
  }, [params.id])

  useEffect(() => {
    filterPasswords()
  }, [passwords, searchTerm, includeArchived])

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

  const fetchPasswords = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('passwords')
        .select('*')
        .eq('organization_id', params.id)
        .order('name')

      if (error) throw error
      setPasswords(data || [])
    } catch (error) {
      console.error('Error fetching passwords:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterPasswords = () => {
    let filtered = passwords

    if (searchTerm) {
      filtered = filtered.filter(password =>
        password.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        password.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        password.category?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (!includeArchived) {
      filtered = filtered.filter(password => !password.archived)
    }

    setFilteredPasswords(filtered)
  }

  const togglePasswordVisibility = (passwordId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev)
      if (newSet.has(passwordId)) {
        newSet.delete(passwordId)
      } else {
        newSet.add(passwordId)
      }
      return newSet
    })
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
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

  const handleEdit = (password: Password) => {
    router.push(`/organizations/${params.id}/passwords/${password.id}/edit`)
  }

  const handleDelete = (password: Password) => {
    setDeleteConfirmation({
      isOpen: true,
      item: password
    })
  }

  const handleDeleteConfirm = () => {
    fetchPasswords()
  }

  const handleDeleteCancel = () => {
    setDeleteConfirmation({
      isOpen: false,
      item: null
    })
  }

  const getPasswordTypeIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'admin':
        return <Shield className="w-4 h-4 text-red-400" />
      case 'user':
        return <User className="w-4 h-4 text-blue-400" />
      case 'service':
        return <Key className="w-4 h-4 text-green-400" />
      default:
        return <Lock className="w-4 h-4 text-gray-400" />
    }
  }

  const maskPassword = (password: string) => {
    return '•'.repeat(password.length)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Organizations" />
        <div className="flex">
          <Sidebar onItemClick={handleSidebarItemClick} />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading passwords...</div>
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
              <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Passwords</h1>
                <div className="text-sm text-gray-400">
                  {organization?.name}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
                <Upload className="w-4 h-4" />
                <span>Import</span>
              </button>
              {(isAdmin || isSuperAdmin) && (
                <button
                  onClick={() => router.push(`/organizations/${params.id}/passwords/new`)}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>New</span>
                </button>
              )}
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
                {filteredPasswords.length} of {filteredPasswords.length} Results
              </div>
            </div>
          </div>

          {/* Passwords Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">
                      <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Username</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Sharedsafe</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Type</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Category</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">🔒</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">OTP</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Next Rotate</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredPasswords.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-gray-400">
                        No passwords found
                      </td>
                    </tr>
                  ) : (
                    filteredPasswords.map((password) => (
                      <tr key={password.id} className="hover:bg-gray-700/50">
                        <td className="p-4">
                          <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            {getPasswordTypeIcon(password.password_type || '')}
                            <span className="text-white">{password.name}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-300">{password.username || '-'}</span>
                            {password.username && (
                              <button
                                onClick={() => copyToClipboard(password.username || '')}
                                className="p-1 text-gray-400 hover:text-white"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{password.shared_safe || '-'}</td>
                        <td className="p-4 text-gray-300 capitalize">{password.password_type || 'General'}</td>
                        <td className="p-4 text-gray-300 capitalize">{password.category || 'General'}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => togglePasswordVisibility(password.id)}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              {visiblePasswords.has(password.id) ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                            <span className="text-gray-300 font-mono text-sm">
                              {visiblePasswords.has(password.id)
                                ? password.password_value
                                : maskPassword(password.password_value || '••••••••')
                              }
                            </span>
                            <button
                              onClick={() => copyToClipboard(password.password_value || '')}
                              className="p-1 text-gray-400 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                        <td className="p-4">
                          {password.otp_enabled && (
                            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          )}
                        </td>
                        <td className="p-4 text-gray-300">
                          {password.next_rotation_date ? formatDate(password.next_rotation_date) : '-'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </button>
                            {(isAdmin || isSuperAdmin) && (
                              <>
                                <button
                                  onClick={() => handleEdit(password)}
                                  className="p-1 text-gray-400 hover:text-blue-400"
                                  title="Edit Password"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(password)}
                                  className="p-1 text-gray-400 hover:text-red-400"
                                  title="Delete Password"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            <button className="p-1 text-gray-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
        title="Delete Password"
        message="Are you sure you want to delete this password? This action cannot be undone."
        itemName={deleteConfirmation.item?.name}
        tableName="passwords"
        itemId={deleteConfirmation.item?.id}
      />
    </div>
  )
}
