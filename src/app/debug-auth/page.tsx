'use client'

import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'
import { User, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

export default function DebugAuthPage() {
  const { user, session, loading, role, isAdmin, isSuperAdmin } = useAuth()

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header currentPage="Debug Auth" />
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-blue-600 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Authentication Debug</h1>
              <p className="text-gray-400">Check your current authentication status</p>
            </div>
          </div>

          {loading ? (
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                <span>Loading authentication status...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Authentication Status */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Authentication Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Authenticated:</span>
                      <div className="flex items-center">
                        {user ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-green-500">Yes</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-red-500">No</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Has Session:</span>
                      <div className="flex items-center">
                        {session ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-green-500">Yes</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-red-500">No</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Role:</span>
                      <span className="font-mono text-blue-400">{role || 'None'}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Is Admin:</span>
                      <div className="flex items-center">
                        {isAdmin ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-green-500">Yes</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-red-500">No</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Is Super Admin:</span>
                      <div className="flex items-center">
                        {isSuperAdmin ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                            <span className="text-green-500">Yes</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                            <span className="text-red-500">No</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Loading:</span>
                      <span className="font-mono text-blue-400">{loading ? 'Yes' : 'No'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Details */}
              {user && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">User Details</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>User ID:</span>
                      <span className="font-mono text-sm text-blue-400">{user.id}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Email:</span>
                      <span className="text-blue-400">{user.email}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Email Confirmed:</span>
                      <span className="text-blue-400">{user.email_confirmed_at ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Created At:</span>
                      <span className="text-blue-400">{new Date(user.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Session Details */}
              {session && (
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4">Session Details</h2>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Access Token:</span>
                      <span className="font-mono text-xs text-blue-400">
                        {session.access_token.substring(0, 20)}...
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span>Expires At:</span>
                      <span className="text-blue-400">
                        {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Never'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Actions</h2>
                <div className="space-y-3">
                  {!user && (
                    <a
                      href="/auth/login"
                      className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Go to Login
                    </a>
                  )}
                  {user && !isSuperAdmin && (
                    <div className="p-4 bg-yellow-600/20 border border-yellow-600 rounded">
                      <p className="text-yellow-400">
                        You are logged in but don't have super admin privileges. 
                        Contact an administrator to upgrade your role.
                      </p>
                    </div>
                  )}
                  {isSuperAdmin && (
                    <div className="space-x-3">
                      <a
                        href="/admin"
                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
                      >
                        Go to Admin Dashboard
                      </a>
                      <a
                        href="/admin/users"
                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                      >
                        Go to User Management
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
