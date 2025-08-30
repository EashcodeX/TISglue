'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, CheckCircle, AlertCircle, User, Building, FileText } from 'lucide-react'

interface TestResult {
  test: string
  status: 'pass' | 'fail' | 'pending'
  message: string
  details?: any
}

export default function TestRLS() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    getCurrentUser()
  }, [])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result])
  }

  const runTests = async () => {
    setIsRunning(true)
    setResults([])

    // Test 1: Check if user is authenticated
    addResult({
      test: 'User Authentication',
      status: currentUser ? 'pass' : 'fail',
      message: currentUser ? `Authenticated as: ${currentUser.email}` : 'Not authenticated'
    })

    if (!currentUser) {
      setIsRunning(false)
      return
    }

    // Test 2: Check if users table exists and is accessible
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single()

      addResult({
        test: 'Users Table Access',
        status: userError ? 'fail' : 'pass',
        message: userError ? `Error: ${userError.message}` : 'Can access own user profile',
        details: userData
      })
    } catch (error) {
      addResult({
        test: 'Users Table Access',
        status: 'fail',
        message: `Exception: ${error}`
      })
    }

    // Test 3: Check user_organizations table
    try {
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select('*')
        .eq('user_id', currentUser.id)

      addResult({
        test: 'User Organizations Access',
        status: userOrgsError ? 'fail' : 'pass',
        message: userOrgsError ? `Error: ${userOrgsError.message}` : `Found ${userOrgs?.length || 0} organization memberships`,
        details: userOrgs
      })
    } catch (error) {
      addResult({
        test: 'User Organizations Access',
        status: 'fail',
        message: `Exception: ${error}`
      })
    }

    // Test 4: Check organizations table access
    try {
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('*')

      addResult({
        test: 'Organizations Table Access',
        status: orgsError ? 'fail' : 'pass',
        message: orgsError ? `Error: ${orgsError.message}` : `Can access ${orgs?.length || 0} organizations`,
        details: orgs?.map(org => ({ id: org.id, name: org.name }))
      })
    } catch (error) {
      addResult({
        test: 'Organizations Table Access',
        status: 'fail',
        message: `Exception: ${error}`
      })
    }

    // Test 5: Check documents table access
    try {
      const { data: docs, error: docsError } = await supabase
        .from('documents')
        .select('*')

      addResult({
        test: 'Documents Table Access',
        status: docsError ? 'fail' : 'pass',
        message: docsError ? `Error: ${docsError.message}` : `Can access ${docs?.length || 0} documents`,
        details: docs?.map(doc => ({ id: doc.id, name: doc.name, organization_id: doc.organization_id }))
      })
    } catch (error) {
      addResult({
        test: 'Documents Table Access',
        status: 'fail',
        message: `Exception: ${error}`
      })
    }

    // Test 6: Try to access another user's data (should fail)
    try {
      const { data: otherUsers, error: otherUsersError } = await supabase
        .from('users')
        .select('*')
        .neq('id', currentUser.id)
        .limit(1)

      addResult({
        test: 'RLS Protection Test',
        status: otherUsers && otherUsers.length > 0 ? 'fail' : 'pass',
        message: otherUsers && otherUsers.length > 0 
          ? 'SECURITY ISSUE: Can access other users data!' 
          : 'RLS working: Cannot access other users data',
        details: otherUsers
      })
    } catch (error) {
      addResult({
        test: 'RLS Protection Test',
        status: 'pass',
        message: 'RLS working: Access denied to other users data'
      })
    }

    // Test 7: Test API endpoints
    try {
      const response = await fetch('/api/documents?organization_id=test')
      const apiResult = await response.json()

      addResult({
        test: 'Documents API Access',
        status: response.ok ? 'pass' : 'fail',
        message: response.ok 
          ? `API working: ${apiResult.data?.length || 0} documents returned`
          : `API error: ${apiResult.error}`,
        details: apiResult
      })
    } catch (error) {
      addResult({
        test: 'Documents API Access',
        status: 'fail',
        message: `API exception: ${error}`
      })
    }

    setIsRunning(false)
  }

  const createTestUserOrganization = async () => {
    if (!currentUser) return

    try {
      // First, get or create a test organization
      let { data: testOrg, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('name', 'Test Organization')
        .single()

      if (orgError && orgError.code === 'PGRST116') {
        // Create test organization
        const { data: newOrg, error: createOrgError } = await supabase
          .from('organizations')
          .insert({
            name: 'Test Organization',
            description: 'Test organization for RLS testing',
            status: 'active',
            timezone: 'UTC'
          })
          .select()
          .single()

        if (createOrgError) {
          addResult({
            test: 'Create Test Organization',
            status: 'fail',
            message: `Failed to create test organization: ${createOrgError.message}`
          })
          return
        }
        testOrg = newOrg
      }

      if (!testOrg) {
        addResult({
          test: 'Create Test Organization',
          status: 'fail',
          message: 'Could not get or create test organization'
        })
        return
      }

      // Add user to organization
      const { data: userOrg, error: userOrgError } = await supabase
        .from('user_organizations')
        .insert({
          user_id: currentUser.id,
          organization_id: testOrg.id,
          role: 'admin',
          is_active: true
        })
        .select()
        .single()

      addResult({
        test: 'Create Test User-Organization',
        status: userOrgError ? 'fail' : 'pass',
        message: userOrgError 
          ? `Failed: ${userOrgError.message}`
          : `Success: Added user to ${testOrg.name}`,
        details: userOrg
      })

    } catch (error) {
      addResult({
        test: 'Create Test User-Organization',
        status: 'fail',
        message: `Exception: ${error}`
      })
    }
  }

  const passedTests = results.filter(r => r.status === 'pass').length
  const failedTests = results.filter(r => r.status === 'fail').length

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">RLS Testing Dashboard</h1>
            <p className="text-gray-400">Test Row Level Security and database access</p>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="flex items-center space-x-4">
            <User className="w-8 h-8 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold">Current User</h2>
              <p className="text-gray-400">
                {currentUser ? currentUser.email : 'Not authenticated'}
              </p>
            </div>
          </div>
        </div>

        {/* Test Controls */}
        <div className="bg-gray-800 p-6 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-2">Test Controls</h2>
              <p className="text-gray-400">Run tests to verify RLS is working correctly</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={createTestUserOrganization}
                disabled={isRunning || !currentUser}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Create Test Data
              </button>
              <button
                onClick={runTests}
                disabled={isRunning || !currentUser}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                {isRunning ? 'Running Tests...' : 'Run RLS Tests'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {results.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Test Results</h2>
              <div className="flex space-x-4 text-sm">
                <span className="text-green-400">✓ Passed: {passedTests}</span>
                <span className="text-red-400">✗ Failed: {failedTests}</span>
              </div>
            </div>
            
            <div className="space-y-4">
              {results.map((result, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    {result.status === 'pass' ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold">{result.test}</h3>
                      <p className="text-gray-400 text-sm mt-1">{result.message}</p>
                      {result.details && (
                        <details className="mt-2">
                          <summary className="text-blue-400 cursor-pointer text-sm">Show Details</summary>
                          <pre className="bg-gray-900 p-2 rounded mt-2 text-xs overflow-x-auto">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!currentUser && (
          <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mt-6">
            <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Authentication Required</h3>
            <p className="text-yellow-200 text-sm">
              You need to be logged in to test RLS policies. Please sign in first.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
