'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function DebugRouting() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [sidebarItems, setSidebarItems] = useState<any[]>([])
  const [pageContents, setPageContents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const router = useRouter()

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

  const debugOrganization = async (orgId: string) => {
    setLoading(true)
    setResults([])
    
    try {
      addResult(`🔍 Debugging organization: ${orgId}`)

      // Get all sidebar items for this organization
      const { data: items, error: itemsError } = await supabase
        .from('organization_sidebar_items')
        .select('*')
        .eq('organization_id', orgId)
        .order('sort_order')

      if (itemsError) {
        addResult(`❌ Error fetching sidebar items: ${itemsError.message}`)
        return
      }

      setSidebarItems(items || [])
      addResult(`📋 Found ${items?.length || 0} sidebar items`)

      // Check each sidebar item for page content
      const allPageContents = []
      for (const item of items || []) {
        addResult(`🔍 Checking item: "${item.item_name}" (slug: ${item.item_slug})`)
        
        const { data: content, error: contentError } = await supabase
          .from('page_contents')
          .select('*')
          .eq('sidebar_item_id', item.id)

        if (contentError) {
          addResult(`  ❌ Error fetching content: ${contentError.message}`)
        } else if (!content || content.length === 0) {
          addResult(`  ⚠️ NO PAGE CONTENT FOUND - This will cause "Page not found" error`)
        } else {
          addResult(`  ✅ Has page content (${content.length} records)`)
          allPageContents.push(...content)
        }
      }

      setPageContents(allPageContents)

      // Check for specific problematic patterns
      const problematicItems = items?.filter(item => 
        item.item_slug.includes('onsite') || 
        item.item_slug.includes('emergency') ||
        item.item_slug.includes('after-hour')
      ) || []

      if (problematicItems.length > 0) {
        addResult(`⚠️ Found ${problematicItems.length} potentially problematic items:`)
        problematicItems.forEach(item => {
          addResult(`  - "${item.item_name}" (${item.item_slug})`)
        })
      }

      addResult('🎉 Debug completed!')

    } catch (error) {
      addResult(`❌ Debug failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  const deleteSidebarItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Delete "${itemName}"?`)) return
    
    try {
      // Delete page content first
      await supabase.from('page_contents').delete().eq('sidebar_item_id', itemId)
      
      // Delete sidebar item
      const { error } = await supabase
        .from('organization_sidebar_items')
        .delete()
        .eq('id', itemId)
      
      if (error) throw error
      
      alert('Deleted successfully!')
      if (selectedOrg) debugOrganization(selectedOrg)
      
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const testNavigation = (orgId: string, slug: string) => {
    const url = `/organizations/${orgId}/${slug}`
    addResult(`🧪 Testing navigation to: ${url}`)
    
    try {
      router.push(url)
    } catch (error) {
      addResult(`❌ Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug Routing Issues</h1>
      
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

          <button
            onClick={() => selectedOrg && debugOrganization(selectedOrg)}
            disabled={!selectedOrg || loading}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white"
          >
            {loading ? 'Debugging...' : 'Debug This Organization'}
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          
          <div className="space-y-3">
            <button
              onClick={() => router.push('/organizations')}
              className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
            >
              Go to Organizations List
            </button>
            
            <button
              onClick={() => selectedOrg && router.push(`/organizations/${selectedOrg}`)}
              disabled={!selectedOrg}
              className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-white"
            >
              Go to Organization Home
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Items */}
      {sidebarItems.length > 0 && (
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Sidebar Items ({sidebarItems.length})</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {sidebarItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded border ${
                  item.item_slug.includes('onsite') || 
                  item.item_slug.includes('emergency') ||
                  item.item_slug.includes('after-hour')
                    ? 'border-red-500 bg-red-900/20' 
                    : 'border-gray-600 bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{item.item_name}</div>
                    <div className="text-sm text-gray-400">
                      Slug: <code className="bg-gray-600 px-1 rounded">{item.item_slug}</code>
                    </div>
                    <div className="text-sm text-gray-400">
                      Category: {item.parent_category} | Active: {item.is_active ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => testNavigation(selectedOrg, item.item_slug)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                    >
                      Test
                    </button>
                    <button
                      onClick={() => deleteSidebarItem(item.id, item.item_name)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug Results */}
      {results.length > 0 && (
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Debug Results:</h3>
          <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={
                result.includes('✅') ? 'text-green-400' :
                result.includes('❌') ? 'text-red-400' :
                result.includes('⚠️') ? 'text-yellow-400' :
                result.includes('🎉') ? 'text-blue-400' :
                'text-gray-300'
              }>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-6">
        <h3 className="text-blue-400 font-semibold mb-4">🔧 How to Use This Tool:</h3>
        <ol className="text-blue-200 text-sm space-y-2">
          <li>1. <strong>Select your organization</strong> from the dropdown</li>
          <li>2. <strong>Click "Debug This Organization"</strong> to analyze all sidebar items</li>
          <li>3. <strong>Look for items with "⚠️ NO PAGE CONTENT FOUND"</strong> - these cause errors</li>
          <li>4. <strong>Use "Test" button</strong> to try navigating to specific items</li>
          <li>5. <strong>Use "Delete" button</strong> to remove problematic items</li>
          <li>6. <strong>Items highlighted in red</strong> are potentially problematic</li>
        </ol>
      </div>
    </div>
  )
}
