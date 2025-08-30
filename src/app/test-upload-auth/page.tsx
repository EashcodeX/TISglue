'use client'

import { useState } from 'react'
import { Upload, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function TestUploadAuth() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testUploadAuth = async () => {
    setLoading(true)
    try {
      // Create a simple test file
      const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' })
      
      const formData = new FormData()
      formData.append('file', testFile)
      formData.append('organization_id', 'ad4959ce-7541-4e0e-8d5d-8e034764501e')
      formData.append('organization_name', 'Test Organization')
      formData.append('name', 'Test Upload')
      formData.append('description', 'Testing upload authentication')
      formData.append('category', 'General')

      console.log('🚀 Starting upload test...')
      
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()
      console.log('📤 Upload result:', result)
      
      setResult({
        status: response.status,
        success: result.success,
        data: result,
        timestamp: new Date().toISOString()
      })

    } catch (error: any) {
      console.error('❌ Upload test error:', error)
      setResult({
        status: 'error',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Upload className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Upload Authentication Test</h1>
            <p className="text-gray-400">Test if upload endpoint authentication is working</p>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Upload Test</h2>
          <button
            onClick={testUploadAuth}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg flex items-center space-x-2"
          >
            {loading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Upload className="w-5 h-5" />
            )}
            <span>Test Upload Authentication</span>
          </button>
        </div>

        {/* Test Results */}
        {result && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              <h2 className="text-lg font-semibold">
                Upload Test Results - Status: {result.status}
              </h2>
            </div>
            
            <div className="mb-4">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                result.success 
                  ? 'bg-green-900/20 text-green-400 border border-green-600' 
                  : 'bg-red-900/20 text-red-400 border border-red-600'
              }`}>
                {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </div>
            </div>

            <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>

            {!result.success && result.status === 401 && (
              <div className="mt-4 bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
                <h3 className="text-yellow-400 font-semibold mb-2">🔒 Authentication Issue</h3>
                <p className="text-yellow-200 text-sm">
                  The upload failed with 401 Unauthorized. This means:
                </p>
                <ul className="text-yellow-200 text-sm mt-2 list-disc list-inside space-y-1">
                  <li>You might not be logged in</li>
                  <li>Your session might have expired</li>
                  <li>There might be a cookie issue</li>
                  <li>The authentication utility might not be working correctly</li>
                </ul>
                <p className="text-yellow-200 text-sm mt-2">
                  Try going to <a href="/auth/login" className="underline">login page</a> first, 
                  then test the <a href="/debug-auth-simple" className="underline">debug auth page</a>.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-800 p-4 rounded-lg mt-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-2">💡 Debugging Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• Check browser console (F12) for errors</li>
            <li>• Check server terminal for authentication logs</li>
            <li>• Try the <a href="/debug-auth-simple" className="text-blue-400 underline">debug auth page</a> first</li>
            <li>• Make sure you're logged in at <a href="/auth/login" className="text-blue-400 underline">/auth/login</a></li>
          </ul>
        </div>
      </div>
    </div>
  )
}
