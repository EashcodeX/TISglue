'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SidebarService } from '@/lib/sidebar-service'

export default function TestSidebarCounts() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [counts, setCounts] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  useEffect(() => {
    loadOrganizations()
  }, [])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
    console.log(message)
  }

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(10)
      
      if (error) throw error
      setOrganizations(data || [])
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const testCounts = async (orgId: string) => {
    setLoading(true)
    setResults([])
    
    try {
      addResult(`🔍 Testing sidebar counts for organization: ${orgId}`)

      // Get counts using the SidebarService
      const realCounts = await SidebarService.getOrganizationCounts(orgId)
      setCounts(realCounts)
      
      addResult('📊 Real counts from SidebarService:')
      Object.entries(realCounts).forEach(([key, value]) => {
        addResult(`  • ${key}: ${value}`)
      })

      // Test the full sidebar data
      const sidebarData = await SidebarService.getOrganizationSidebarByCategory(orgId)
      
      addResult('🔍 Sidebar items with counts:')
      Object.entries(sidebarData).forEach(([categoryName, category]) => {
        addResult(`📁 ${categoryName}:`);
        (category as any).systemItems.forEach((item: any) => {
          if (item.count !== undefined) {
            addResult(`  • ${item.name}: ${item.count}`)
          }
        })
      })

    } catch (error) {
      addResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  const addSampleData = async (orgId: string) => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('➕ Adding sample data to test counts...')

      // Add sample contacts
      const { error: contactError } = await supabase
        .from('contacts')
        .insert([
          {
            organization_id: orgId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '555-0123',
            role: 'IT Manager',
            department: 'IT',
            title: 'Manager'
          },
          {
            organization_id: orgId,
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '555-0124',
            role: 'Admin',
            department: 'Administration',
            title: 'Administrator'
          }
        ])

      if (contactError) {
        addResult(`⚠️ Contact error: ${contactError.message}`)
      } else {
        addResult('✅ Added 2 sample contacts')
      }

      // Add sample locations
      const { error: locationError } = await supabase
        .from('locations')
        .insert([
          {
            organization_id: orgId,
            name: 'Main Office',
            address: '123 Business St, City, State 12345',
            type: 'Office',
            phone: '555-0100',
            contact: 'John Doe'
          },
          {
            organization_id: orgId,
            name: 'Warehouse',
            address: '456 Storage Ave, City, State 12345',
            type: 'Warehouse',
            phone: '555-0101',
            contact: 'Jane Smith'
          }
        ])

      if (locationError) {
        addResult(`⚠️ Location error: ${locationError.message}`)
      } else {
        addResult('✅ Added 2 sample locations')
      }

      // Add sample documents
      const { error: docError } = await supabase
        .from('documents')
        .insert([
          {
            organization_id: orgId,
            name: 'IT Policy Document',
            description: 'Company IT policies and procedures',
            file_type: 'PDF'
          },
          {
            organization_id: orgId,
            name: 'Network Diagram',
            description: 'Current network topology',
            file_type: 'PNG'
          },
          {
            organization_id: orgId,
            name: 'User Manual',
            description: 'Software user manual',
            file_type: 'DOCX'
          }
        ])

      if (docError) {
        addResult(`⚠️ Document error: ${docError.message}`)
      } else {
        addResult('✅ Added 3 sample documents')
      }

      // Clear cache to force refresh
      SidebarService.clearCache(orgId)
      
      addResult('🎉 Sample data added! Test counts again to see the changes.')

    } catch (error) {
      addResult(`❌ Error adding sample data: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">🧪 Test Sidebar Counts</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Selection */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Select Organization</h2>
          
          <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white mb-4"
          >
            <option value="">Select an organization...</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>

          <div className="space-y-3">
            <button
              onClick={() => selectedOrg && testCounts(selectedOrg)}
              disabled={!selectedOrg || loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white"
            >
              {loading ? 'Testing...' : '🔍 Test Real Counts'}
            </button>

            <button
              onClick={() => selectedOrg && addSampleData(selectedOrg)}
              disabled={!selectedOrg || loading}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white"
            >
              {loading ? 'Adding...' : '➕ Add Sample Data'}
            </button>
          </div>
        </div>

        {/* Current Counts */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Current Counts</h2>
          
          {Object.keys(counts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(counts).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                  <span className="capitalize">{key.replace('_', ' ')}</span>
                  <span className="font-mono text-blue-400">{value as number}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400">Select an organization and test counts</div>
          )}
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Test Results:</h3>
          <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={
                result.includes('✅') ? 'text-green-400' :
                result.includes('❌') ? 'text-red-400' :
                result.includes('⚠️') ? 'text-yellow-400' :
                result.includes('🎉') ? 'text-blue-400' :
                result.includes('📊') || result.includes('🔍') ? 'text-purple-400' :
                'text-gray-300'
              }>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-6">
        <h3 className="text-blue-400 font-semibold mb-4">🎯 How to Test:</h3>
        <ol className="text-blue-200 text-sm space-y-2">
          <li>1. <strong>Select an organization</strong> from the dropdown</li>
          <li>2. <strong>Click "Test Real Counts"</strong> to see current counts</li>
          <li>3. <strong>Click "Add Sample Data"</strong> to add test data</li>
          <li>4. <strong>Test counts again</strong> to see the numbers increase</li>
          <li>5. <strong>Check the sidebar</strong> in the main app to see real counts</li>
          <li>6. <strong>Switch organizations</strong> to see different counts</li>
        </ol>
      </div>
    </div>
  )
}
