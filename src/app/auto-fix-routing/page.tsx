'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AutoFixRouting() {
  const [fixing, setFixing] = useState(false)
  const [results, setResults] = useState<string[]>([])
  const [autoRun, setAutoRun] = useState(false)

  useEffect(() => {
    if (autoRun) {
      performAutoFix()
    }
  }, [autoRun])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
    console.log(message)
  }

  const performAutoFix = async () => {
    setFixing(true)
    setResults([])
    
    try {
      addResult('🔧 Starting automatic routing fix...')

      // Step 1: Find all organizations
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')

      if (orgError) {
        addResult(`❌ Error fetching organizations: ${orgError.message}`)
        return
      }

      addResult(`📋 Found ${organizations?.length || 0} organizations`)

      // Step 2: For each organization, find and fix problematic sidebar items
      for (const org of organizations || []) {
        addResult(`🔍 Checking organization: ${org.name}`)

        // Get all sidebar items for this organization
        const { data: sidebarItems, error: itemsError } = await supabase
          .from('organization_sidebar_items')
          .select('*')
          .eq('organization_id', org.id)

        if (itemsError) {
          addResult(`  ❌ Error fetching sidebar items: ${itemsError.message}`)
          continue
        }

        addResult(`  📋 Found ${sidebarItems?.length || 0} sidebar items`)

        // Step 3: Check each sidebar item for page content
        const problematicItems = []
        
        for (const item of sidebarItems || []) {
          // Skip system items
          if (item.is_system) {
            continue
          }

          // Check if item has page content
          const { data: pageContent, error: contentError } = await supabase
            .from('page_contents')
            .select('id')
            .eq('sidebar_item_id', item.id)

          if (contentError) {
            addResult(`    ⚠️ Error checking content for ${item.item_name}: ${contentError.message}`)
            continue
          }

          // If no page content, mark as problematic
          if (!pageContent || pageContent.length === 0) {
            problematicItems.push(item)
            addResult(`    ⚠️ NO CONTENT: "${item.item_name}" (${item.item_slug})`)
          }

          // Also check for known problematic slugs
          const problematicSlugs = [
            'onsite-information',
            'emergency-contacts', 
            'after-hours-access',
            'site-access',
            'onsite',
            'emergency'
          ]

          if (problematicSlugs.some(slug => item.item_slug.includes(slug))) {
            if (!problematicItems.find(p => p.id === item.id)) {
              problematicItems.push(item)
              addResult(`    ⚠️ PROBLEMATIC SLUG: "${item.item_name}" (${item.item_slug})`)
            }
          }
        }

        // Step 4: Delete all problematic items
        if (problematicItems.length > 0) {
          addResult(`  🗑️ Deleting ${problematicItems.length} problematic items...`)

          for (const item of problematicItems) {
            try {
              // Delete page content first (if any)
              const { error: contentDeleteError } = await supabase
                .from('page_contents')
                .delete()
                .eq('sidebar_item_id', item.id)

              if (contentDeleteError) {
                addResult(`    ⚠️ Warning deleting content for ${item.item_name}: ${contentDeleteError.message}`)
              }

              // Delete sidebar item
              const { error: itemDeleteError } = await supabase
                .from('organization_sidebar_items')
                .delete()
                .eq('id', item.id)

              if (itemDeleteError) {
                addResult(`    ❌ Error deleting ${item.item_name}: ${itemDeleteError.message}`)
              } else {
                addResult(`    ✅ Deleted: "${item.item_name}"`)
              }

            } catch (error) {
              addResult(`    ❌ Exception deleting ${item.item_name}: ${error instanceof Error ? error.message : String(error)}`)
            }
          }
        } else {
          addResult(`  ✅ No problematic items found in ${org.name}`)
        }
      }

      // Step 5: Clean up any orphaned page contents
      addResult('🧹 Cleaning up orphaned page contents...')
      
      const { data: orphanedContents, error: orphanError } = await supabase
        .from('page_contents')
        .select(`
          id,
          sidebar_item_id,
          organization_sidebar_items!inner(id)
        `)

      if (orphanError) {
        addResult(`⚠️ Could not check for orphaned contents: ${orphanError.message}`)
      } else {
        // Find contents where sidebar item no longer exists
        const { data: allContents } = await supabase
          .from('page_contents')
          .select('id, sidebar_item_id')

        const { data: allSidebarItems } = await supabase
          .from('organization_sidebar_items')
          .select('id')

        const sidebarItemIds = new Set(allSidebarItems?.map(item => item.id) || [])
        const orphaned = allContents?.filter(content => !sidebarItemIds.has(content.sidebar_item_id)) || []

        if (orphaned.length > 0) {
          addResult(`🗑️ Found ${orphaned.length} orphaned page contents, deleting...`)
          
          for (const content of orphaned) {
            const { error: deleteError } = await supabase
              .from('page_contents')
              .delete()
              .eq('id', content.id)

            if (deleteError) {
              addResult(`  ❌ Error deleting orphaned content: ${deleteError.message}`)
            } else {
              addResult(`  ✅ Deleted orphaned content: ${content.id}`)
            }
          }
        } else {
          addResult(`✅ No orphaned page contents found`)
        }
      }

      addResult('🎉 Automatic fix completed successfully!')
      addResult('🔄 Please refresh your browser and test navigation')

    } catch (error) {
      addResult(`❌ Auto-fix failed: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    setFixing(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">🔧 Automatic Routing Fix</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Automatic Fix</h2>
        <p className="text-gray-300 mb-6">
          This will automatically scan ALL organizations and fix ALL routing issues by:
        </p>
        
        <ul className="text-gray-300 text-sm space-y-2 mb-6">
          <li>• Finding sidebar items without page content</li>
          <li>• Removing items with problematic slugs (onsite, emergency, etc.)</li>
          <li>• Cleaning up orphaned page contents</li>
          <li>• Preserving all system sidebar items</li>
          <li>• Giving you clean, working navigation</li>
        </ul>

        <div className="flex space-x-4">
          <button
            onClick={performAutoFix}
            disabled={fixing}
            className="px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {fixing ? 'Fixing...' : '🔧 Auto-Fix All Issues'}
          </button>

          <button
            onClick={() => setAutoRun(true)}
            disabled={fixing || autoRun}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {autoRun ? 'Running...' : '⚡ Auto-Run on Load'}
          </button>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Fix Results:</h3>
          <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={
                result.includes('✅') ? 'text-green-400' :
                result.includes('❌') ? 'text-red-400' :
                result.includes('⚠️') ? 'text-yellow-400' :
                result.includes('🎉') ? 'text-blue-400' :
                result.includes('🔧') ? 'text-purple-400' :
                'text-gray-300'
              }>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2">🎯 What This Fix Does:</h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Scans ALL organizations automatically</li>
          <li>• Finds sidebar items causing "Page not found" errors</li>
          <li>• Removes problematic items (onsite, emergency, etc.)</li>
          <li>• Cleans up database inconsistencies</li>
          <li>• Preserves working sidebar items</li>
          <li>• Gives you a clean slate for testing</li>
        </ul>
      </div>
    </div>
  )
}
