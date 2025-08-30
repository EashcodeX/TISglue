'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function CleanupSampleData() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
    console.log(message)
  }

  const cleanupSampleData = async () => {
    setLoading(true)
    setResults([])
    
    try {
      addResult('🧹 Starting sample data cleanup...')

      // Check for sample contacts
      const { data: contacts, error: contactsError } = await supabase
        .from('contacts')
        .select('*')
        .or('name.ilike.%Namby%,name.ilike.%Nick Melati%,name.ilike.%John Smith%,name.ilike.%Sarah Johnson%')

      if (contactsError) {
        addResult(`⚠️ Error checking contacts: ${contactsError.message}`)
      } else {
        addResult(`📋 Found ${contacts?.length || 0} sample contacts`)
        
        if (contacts && contacts.length > 0) {
          const { error: deleteContactsError } = await supabase
            .from('contacts')
            .delete()
            .or('name.ilike.%Namby%,name.ilike.%Nick Melati%,name.ilike.%John Smith%,name.ilike.%Sarah Johnson%')
          
          if (deleteContactsError) {
            addResult(`❌ Error deleting sample contacts: ${deleteContactsError.message}`)
          } else {
            addResult(`✅ Deleted ${contacts.length} sample contacts`)
          }
        }
      }

      // Check for sample locations
      const { data: locations, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .ilike('name', '%Con Elco%')

      if (locationsError) {
        addResult(`⚠️ Error checking locations: ${locationsError.message}`)
      } else {
        addResult(`📍 Found ${locations?.length || 0} sample locations`)
        
        if (locations && locations.length > 0) {
          const { error: deleteLocationsError } = await supabase
            .from('locations')
            .delete()
            .ilike('name', '%Con Elco%')
          
          if (deleteLocationsError) {
            addResult(`❌ Error deleting sample locations: ${deleteLocationsError.message}`)
          } else {
            addResult(`✅ Deleted ${locations.length} sample locations`)
          }
        }
      }

      // Check for sample sidebar items
      const { data: sidebarItems, error: sidebarError } = await supabase
        .from('organization_sidebar_items')
        .select('*')
        .or('item_name.ilike.%Welcome Guide%,item_name.ilike.%IT Support Request%,item_name.ilike.%Employee Onboarding%,item_name.ilike.%Equipment Request%')

      if (sidebarError) {
        addResult(`⚠️ Error checking sidebar items: ${sidebarError.message}`)
      } else {
        addResult(`📋 Found ${sidebarItems?.length || 0} sample sidebar items`)
        
        if (sidebarItems && sidebarItems.length > 0) {
          // Delete associated page contents first
          for (const item of sidebarItems) {
            const { error: deleteContentError } = await supabase
              .from('page_contents')
              .delete()
              .eq('sidebar_item_id', item.id)
            
            if (deleteContentError) {
              addResult(`⚠️ Error deleting content for ${item.item_name}: ${deleteContentError.message}`)
            }
          }

          // Delete sidebar items
          const { error: deleteSidebarError } = await supabase
            .from('organization_sidebar_items')
            .delete()
            .or('item_name.ilike.%Welcome Guide%,item_name.ilike.%IT Support Request%,item_name.ilike.%Employee Onboarding%,item_name.ilike.%Equipment Request%')
          
          if (deleteSidebarError) {
            addResult(`❌ Error deleting sample sidebar items: ${deleteSidebarError.message}`)
          } else {
            addResult(`✅ Deleted ${sidebarItems.length} sample sidebar items`)
          }
        }
      }

      addResult('🎉 Sample data cleanup completed!')

    } catch (error) {
      addResult(`❌ Cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Sample Data Cleanup</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg max-w-4xl">
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4">Remove All Sample/Mock Data</h2>
          <p className="text-gray-300 mb-4">
            This tool will remove all hardcoded sample data from the database including:
          </p>
          <ul className="text-gray-300 text-sm space-y-1 mb-6">
            <li>• Sample contacts (Namby Vithanarachchi, Nick Melati, John Smith, Sarah Johnson)</li>
            <li>• Sample locations (Con-Elco Ltd locations)</li>
            <li>• Sample sidebar items (Welcome Guide, IT Support Request, etc.)</li>
            <li>• Associated page contents</li>
          </ul>
          
          <button
            onClick={cleanupSampleData}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 rounded text-white font-medium"
          >
            {loading ? 'Cleaning Up...' : 'Clean Up Sample Data'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-gray-700 p-4 rounded">
            <h3 className="font-medium mb-3">Cleanup Results:</h3>
            <div className="space-y-1 text-sm font-mono">
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
      </div>

      <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-4 max-w-4xl">
        <h3 className="text-blue-400 font-semibold mb-2">After Cleanup:</h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• New organizations will start completely empty</li>
          <li>• No pre-populated contacts or locations</li>
          <li>• No sample sidebar items or forms</li>
          <li>• Clean slate for manual testing</li>
          <li>• Refresh your browser after cleanup to see changes</li>
        </ul>
      </div>
    </div>
  )
}
