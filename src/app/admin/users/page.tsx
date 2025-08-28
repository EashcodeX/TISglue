'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import RequireSuperAdmin from '@/components/RequireSuperAdmin'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Users, Shield, User, Crown, CheckCircle, AlertTriangle, Clock, Loader2 } from 'lucide-react'

interface AppUser {
  id: string
  email: string
  role: string
  status: string
  last_login_at: string | null
  first_name?: string
  last_name?: string
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<AppUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase
        .from('users')
        .select('id,email,role,status,last_login_at,first_name,last_name')
        .order('email')

      if (error) throw error
      setUsers(data || [])
    } catch (err: any) {
      console.error('Error fetching users:', err)
      setError(err.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (id: string, newRole: string) => {
    try {
      setUpdatingUserId(id)
      setError(null)
      setSuccessMessage(null)

      const user = users.find(u => u.id === id)
      if (!user) {
        throw new Error('User not found')
      }

      // Prevent self-demotion from super_admin
      if (user.role === 'super_admin' && newRole !== 'super_admin') {
        const currentUser = await supabase.auth.getUser()
        if (currentUser.data.user?.id === id) {
          throw new Error('You cannot demote yourself from Super Admin')
        }
      }

      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', id)

      if (error) throw error

      // Show success message
      const roleNames = {
        'user': 'User',
        'admin': 'Admin',
        'super_admin': 'Super Admin'
      }
      setSuccessMessage(`Successfully updated ${user.email} to ${roleNames[newRole as keyof typeof roleNames]}`)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)

      // Refresh users list
      await fetchUsers()
    } catch (err: any) {
      console.error('Error updating user role:', err)
      setError(err.message || 'Failed to update user role')
    } finally {
      setUpdatingUserId(null)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'super_admin': return <Crown className="w-4 h-4 text-purple-400" />
      case 'admin': return <Shield className="w-4 h-4 text-blue-400" />
      default: return <User className="w-4 h-4 text-gray-400" />
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      'super_admin': 'bg-purple-600 text-purple-100',
      'admin': 'bg-blue-600 text-blue-100',
      'user': 'bg-gray-600 text-gray-100'
    }
    return styles[role as keyof typeof styles] || styles.user
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'inactive': return <Clock className="w-4 h-4 text-yellow-400" />
      default: return <AlertTriangle className="w-4 h-4 text-red-400" />
    }
  }

  return (
    <RequireSuperAdmin>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Admin" />
        <div className="flex">
          <Sidebar onItemClick={() => {}} />
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-gray-400">Manage user accounts, roles, and permissions</p>
              </div>
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-600 rounded-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-600 rounded-lg flex items-center">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span>Loading users...</span>
              </div>
            ) : (
              <>
                {/* User Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Total Users</p>
                        <p className="text-2xl font-bold text-white">{users.length}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Super Admins</p>
                        <p className="text-2xl font-bold text-purple-400">
                          {users.filter(u => u.role === 'super_admin').length}
                        </p>
                      </div>
                      <Crown className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Admins</p>
                        <p className="text-2xl font-bold text-blue-400">
                          {users.filter(u => u.role === 'admin').length}
                        </p>
                      </div>
                      <Shield className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">Active Users</p>
                        <p className="text-2xl font-bold text-green-400">
                          {users.filter(u => u.status === 'active').length}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Users Table */}
            {!loading && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700">
                      <tr>
                        <th className="text-left p-4 font-medium">User</th>
                        <th className="text-left p-4 font-medium">Role</th>
                        <th className="text-left p-4 font-medium">Status</th>
                        <th className="text-left p-4 font-medium">Last Login</th>
                        <th className="text-left p-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="border-t border-gray-700 hover:bg-gray-750 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                {getRoleIcon(u.role)}
                              </div>
                              <div>
                                <div className="font-medium text-white">{u.email}</div>
                                {(u.first_name || u.last_name) && (
                                  <div className="text-sm text-gray-400">
                                    {[u.first_name, u.last_name].filter(Boolean).join(' ')}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadge(u.role)}`}>
                              {u.role.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(u.status)}
                              <span className="capitalize">{u.status}</span>
                            </div>
                          </td>
                          <td className="p-4 text-gray-300">
                            {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              {updatingUserId === u.id ? (
                                <div className="flex items-center space-x-2 text-blue-400">
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span className="text-sm">Updating...</span>
                                </div>
                              ) : (
                                <>
                                  <button
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                      u.role === 'user'
                                        ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                                    }`}
                                    onClick={() => updateRole(u.id, 'user')}
                                    disabled={u.role === 'user'}
                                  >
                                    <User className="w-3 h-3 inline mr-1" />
                                    User
                                  </button>
                                  <button
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                      u.role === 'admin'
                                        ? 'bg-blue-600 text-blue-100 cursor-not-allowed'
                                        : 'bg-blue-700 hover:bg-blue-600 text-white'
                                    }`}
                                    onClick={() => updateRole(u.id, 'admin')}
                                    disabled={u.role === 'admin'}
                                  >
                                    <Shield className="w-3 h-3 inline mr-1" />
                                    Admin
                                  </button>
                                  <button
                                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                      u.role === 'super_admin'
                                        ? 'bg-purple-600 text-purple-100 cursor-not-allowed'
                                        : 'bg-purple-700 hover:bg-purple-600 text-white'
                                    }`}
                                    onClick={() => updateRole(u.id, 'super_admin')}
                                    disabled={u.role === 'super_admin'}
                                  >
                                    <Crown className="w-3 h-3 inline mr-1" />
                                    Super Admin
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </RequireSuperAdmin>
  )
}

