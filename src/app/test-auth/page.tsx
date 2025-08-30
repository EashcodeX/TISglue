'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function TestAuth() {
  const [authResult, setAuthResult] = useState<any>(null)
  const [documentsResult, setDocumentsResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const testAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/test')
      const result = await response.json()
      setAuthResult(result)
    } catch (error) {
      setAuthResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testDocuments = async () => {
    setLoading(true)
    try {
      // Test with a sample organization ID
      const response = await fetch('/api/documents?organization_id=ad4959ce-7541-4e0e-8d5d-8e034764501e')
      const result = await response.json()
      setDocumentsResult(result)
    } catch (error) {
      setDocumentsResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Authentication Test</h1>
            <p className="text-gray-400">Test server-side authentication and API access</p>
          </div>
        </div>

        {/* Current User */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Current User (Client-side)</h2>
          {currentUser ? (
            <div className="text-sm">
              <p><strong>ID:</strong> {currentUser.id}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Created:</strong> {new Date(currentUser.created_at).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-red-400">Not authenticated</p>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">API Tests</h2>
          <div className="flex space-x-4">
            <button
              onClick={testAuth}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Test Auth API</span>
            </button>
            
            <button
              onClick={testDocuments}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Test Documents API</span>
            </button>
          </div>
        </div>

        {/* Auth Test Results */}
        {authResult && (
          <div className="bg-gray-800 p-6 rounded-lg mb-6">
            <div className="flex items-center space-x-2 mb-4">
              {authResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <h2 className="text-lg font-semibold">Auth API Test Results</h2>
            </div>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(authResult, null, 2)}
            </pre>
          </div>
        )}

        {/* Documents Test Results */}
        {documentsResult && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              {documentsResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <h2 className="text-lg font-semibold">Documents API Test Results</h2>
            </div>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(documentsResult, null, 2)}
            </pre>
          </div>
        )}

        {!currentUser && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mt-6">
            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Authentication Required</h3>
            <p className="text-yellow-200 text-sm">
              You need to be logged in to test the APIs. Please sign in first.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
