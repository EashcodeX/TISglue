'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function DebugAuthSimple() {
  const [clientUser, setClientUser] = useState<any>(null)
  const [serverResult, setServerResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    checkClientAuth()
  }, [])

  const checkClientAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      console.log('Client auth check:', { user: user?.email, error: error?.message })
      setClientUser(user)
    } catch (error) {
      console.error('Client auth error:', error)
    }
  }

  const testServerAuth = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug-auth')
      const result = await response.json()
      console.log('Server auth result:', result)
      setServerResult(result)
    } catch (error) {
      console.error('Server auth test error:', error)
      setServerResult({ success: false, error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const testDocumentsAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/documents?organization_id=ad4959ce-7541-4e0e-8d5d-8e034764501e')
      const result = await response.json()
      console.log('Documents API result:', result)
      setServerResult({ ...serverResult, documents_test: result })
    } catch (error) {
      console.error('Documents API test error:', error)
      setServerResult({ ...serverResult, documents_test: { success: false, error: error.message } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Simple Auth Debug</h1>
            <p className="text-gray-400">Debug authentication issues step by step</p>
          </div>
        </div>

        {/* Client-side Auth Status */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Client-side Authentication</h2>
          {clientUser ? (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span>Logged in as: {clientUser.email}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>Not logged in</span>
            </div>
          )}
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Server-side Tests</h2>
          <div className="flex space-x-4">
            <button
              onClick={testServerAuth}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Test Server Auth</span>
            </button>
            
            <button
              onClick={testDocumentsAPI}
              disabled={loading || !clientUser}
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

        {/* Server Test Results */}
        {serverResult && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              {serverResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <h2 className="text-lg font-semibold">Server Test Results</h2>
            </div>
            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(serverResult, null, 2)}
            </pre>
          </div>
        )}

        {!clientUser && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mt-6">
            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Not Logged In</h3>
            <p className="text-yellow-200 text-sm">
              You need to be logged in to test the server-side authentication. 
              Please go to <a href="/auth/login" className="underline">login page</a> first.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
