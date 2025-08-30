'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function FixOnsiteError() {
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
      const { error } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(10)

      if (error) throw error
      // Organizations loaded successfully
    } catch (error) {
      console.error('Error loading organizations:', error)
    }
  }

  const fixOnsiteError = async () => {
    setLoading(true)
    setResults([])

    try {
      addResult('🔍 Searching for problematic sidebar items...')

      // Find all sidebar items with problematic slugs
      const problematicSlugs = ['onsite-information', 'emergency-contacts']
      let allProblematicItems = []

      for (const slug of problematicSlugs) {
        const { data: items, error: searchError } = await supabase
          .from('organization_sidebar_items')
          .select('*')
          .eq('item_slug', slug)

        if (searchError) {
          addResult(`❌ Error searching for ${slug}: ${searchError.message}`)
          continue
        }

        if (items && items.length > 0) {
          allProblematicItems.push(...items)
          addResult(`📋 Found ${items.length} items with slug "${slug}"`)
        }
      }

      addResult(`📋 Total problematic items found: ${allProblematicItems.length}`)

      if (allProblematicItems.length > 0) {
        for (const item of allProblematicItems) {
          addResult(`🗑️ Deleting: "${item.item_name}" from organization ${item.organization_id}`)
          
          // Delete associated page content first
          const { error: contentError } = await supabase
            .from('page_contents')
            .delete()
            .eq('sidebar_item_id', item.id)
          
          if (contentError) {
            addResult(`⚠️ Warning deleting content for ${item.item_name}: ${contentError.message}`)
          }

          // Delete sidebar item
          const { error: deleteError } = await supabase
            .from('organization_sidebar_items')
            .delete()
            .eq('id', item.id)
          
          if (deleteError) {
            addResult(`❌ Error deleting ${item.item_name}: ${deleteError.message}`)
          } else {
            addResult(`✅ Successfully deleted "${item.item_name}"`)
          }
        }
      } else {
        addResult('✅ No problematic sidebar items found')
      }

      // Also check for any other common problematic slugs
      const commonProblematicSlugs = [
        'onsite-information',
        'after-hours-access',
        'emergency-contacts',
        'site-access'
      ]

      for (const slug of commonProblematicSlugs) {
        const { data: items } = await supabase
          .from('organization_sidebar_items')
          .select('id, item_name, item_slug, organization_id')
          .eq('item_slug', slug)

        if (items && items.length > 0) {
          addResult(`⚠️ Found ${items.length} items with potentially problematic slug: "${slug}"`)
          for (const item of items) {
            addResult(`   - "${item.item_name}" in org ${item.organization_id}`)
          }
        }
      }

      addResult('🎉 Fix completed! Refresh your browser and try navigating again.')

    } catch (error) {
      addResult(`❌ Fix failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  const deleteAllCustomSidebarItems = async () => {
    if (!confirm('⚠️ This will delete ALL custom sidebar items from ALL organizations. Are you sure?')) {
      return
    }

    setLoading(true)
    setResults([])
    
    try {
      addResult('🧹 Deleting all custom sidebar items...')

      // Get all custom sidebar items (not system items)
      const { data: customItems, error: searchError } = await supabase
        .from('organization_sidebar_items')
        .select('*')
        .eq('is_system', false)

      if (searchError) {
        addResult(`❌ Error searching: ${searchError.message}`)
        return
      }

      addResult(`📋 Found ${customItems?.length || 0} custom sidebar items`)

      if (customItems && customItems.length > 0) {
        // Delete all page contents for custom items
        for (const item of customItems) {
          const { error: contentError } = await supabase
            .from('page_contents')
            .delete()
            .eq('sidebar_item_id', item.id)
          
          if (contentError) {
            addResult(`⚠️ Warning deleting content for ${item.item_name}: ${contentError.message}`)
          }
        }

        // Delete all custom sidebar items
        const { error: deleteError } = await supabase
          .from('organization_sidebar_items')
          .delete()
          .eq('is_system', false)
        
        if (deleteError) {
          addResult(`❌ Error deleting custom items: ${deleteError.message}`)
        } else {
          addResult(`✅ Successfully deleted ${customItems.length} custom sidebar items`)
        }
      }

      addResult('🎉 All custom sidebar items removed! Organizations now have clean sidebars.')

    } catch (error) {
      addResult(`❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">🔧 Fix "Page not found: onsite-information" Error</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Fix */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-red-400">🚨 Quick Fix</h2>
          <p className="text-gray-300 mb-4">
            This will find and delete any sidebar items with the slug "onsite-information" 
            that are causing the "Page not found" error.
          </p>
          
          <button
            onClick={fixOnsiteError}
            disabled={loading}
            className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {loading ? 'Fixing...' : 'Fix "onsite-information" Error'}
          </button>
        </div>

        {/* Nuclear Option */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4 text-yellow-400">⚠️ Nuclear Option</h2>
          <p className="text-gray-300 mb-4">
            This will delete ALL custom sidebar items from ALL organizations, 
            leaving only the default system items. Use this if you want a completely clean slate.
          </p>
          
          <button
            onClick={deleteAllCustomSidebarItems}
            disabled={loading}
            className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {loading ? 'Cleaning...' : 'Delete All Custom Sidebar Items'}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Results:</h3>
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
        <h3 className="text-blue-400 font-semibold mb-4">📋 What This Does:</h3>
        <ul className="text-blue-200 text-sm space-y-2">
          <li>• <strong>Quick Fix:</strong> Finds and deletes only the problematic "onsite-information" sidebar items</li>
          <li>• <strong>Nuclear Option:</strong> Removes ALL custom sidebar items, leaving only system defaults</li>
          <li>• <strong>Safe:</strong> Only deletes custom items, never touches system sidebar items</li>
          <li>• <strong>Clean:</strong> Also removes associated page content to prevent orphaned data</li>
        </ul>
        
        <div className="mt-4 p-3 bg-blue-800/30 rounded">
          <p className="text-blue-200 text-sm">
            <strong>After running the fix:</strong> Refresh your browser and navigate to your organization. 
            The "Page not found" error should be gone, and you'll have a clean sidebar to work with.
          </p>
        </div>
      </div>
    </div>
  )
}
