'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { SidebarService } from '@/lib/sidebar-service'
import { PageContentService } from '@/lib/page-content-service'

export default function DebugContent() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [sidebarItems, setSidebarItems] = useState<any[]>([])
  const [pageContents, setPageContents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOrganizations()
  }, [])

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

  const loadOrgData = async (orgId: string) => {
    setLoading(true)
    setSelectedOrg(orgId)
    
    try {
      // Load sidebar items
      const items = await SidebarService.getOrganizationSidebarItems(orgId)
      setSidebarItems(items)

      // Load page contents for all sidebar items
      const contents = []
      for (const item of items) {
        try {
          const content = await PageContentService.getPageContent(item.id)
          contents.push({ sidebarItem: item, content })
        } catch (error) {
          console.log(`No content found for ${item.item_name}:`, error instanceof Error ? error.message : 'Unknown error')
          contents.push({ sidebarItem: item, content: null, error: error instanceof Error ? error.message : 'Unknown error' })
        }
      }
      setPageContents(contents)
      
    } catch (error) {
      console.error('Error loading org data:', error)
    }
    
    setLoading(false)
  }

  const recreateContent = async (sidebarItemId: string, contentType: string) => {
    try {
      console.log('🔧 Recreating content for item:', sidebarItemId, 'with type:', contentType)
      
      // Delete existing content if any
      try {
        await supabase
          .from('page_content')
          .delete()
          .eq('sidebar_item_id', sidebarItemId)
      } catch (error) {
        console.log('No existing content to delete')
      }
      
      // Create new content
      const newContent = await PageContentService.createDefaultPageContent(sidebarItemId, contentType)
      console.log('✅ Created new content:', newContent)
      
      // Reload data
      await loadOrgData(selectedOrg)
      
    } catch (error) {
      console.error('❌ Error recreating content:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Content Debug Tool</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Organizations */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Organizations</h2>
          <div className="space-y-2">
            {organizations.map((org) => (
              <button
                key={org.id}
                onClick={() => loadOrgData(org.id)}
                className={`w-full text-left p-2 rounded ${
                  selectedOrg === org.id ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                <div className="font-medium">{org.name}</div>
                <div className="text-xs text-gray-400">{org.id}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar Items */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Sidebar Items</h2>
          {loading ? (
            <div className="text-yellow-400">Loading...</div>
          ) : (
            <div className="space-y-2">
              {sidebarItems.map((item) => (
                <div key={item.id} className="p-2 bg-gray-700 rounded">
                  <div className="font-medium">{item.item_name}</div>
                  <div className="text-xs text-gray-400">Slug: {item.item_slug}</div>
                  <div className="text-xs text-gray-400">ID: {item.id}</div>
                  <div className="text-xs text-gray-400">System: {item.is_system ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Page Contents */}
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="text-lg font-semibold mb-4">Page Contents</h2>
          <div className="space-y-4">
            {pageContents.map((item, index) => (
              <div key={index} className="p-3 bg-gray-700 rounded">
                <div className="font-medium text-blue-400">{item.sidebarItem.item_name}</div>
                
                {item.content ? (
                  <div className="mt-2 space-y-1">
                    <div className="text-sm">
                      <span className="text-green-400">✅ Content Type:</span> {item.content.content_type}
                    </div>
                    <div className="text-xs text-gray-400">
                      Content ID: {item.content.id}
                    </div>
                    <div className="text-xs text-gray-400">
                      Updated: {new Date(item.content.updated_at).toLocaleString()}
                    </div>
                    
                    {/* Show content data preview */}
                    <div className="text-xs bg-gray-800 p-2 rounded mt-2">
                      <div className="text-gray-300">Content Data:</div>
                      <pre className="text-gray-400 text-xs overflow-auto max-h-20">
                        {JSON.stringify(item.content.content_data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2">
                    <div className="text-red-400">❌ No Content</div>
                    {item.error && (
                      <div className="text-xs text-red-300 mt-1">{item.error}</div>
                    )}
                    
                    {/* Recreate content buttons */}
                    <div className="mt-2 space-y-1">
                      <div className="text-xs text-gray-400">Recreate as:</div>
                      <div className="flex flex-wrap gap-1">
                        {PageContentService.getContentTypes().map(contentType => (
                          <button
                            key={contentType.id}
                            onClick={() => recreateContent(item.sidebarItem.id, contentType.id)}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                          >
                            {contentType.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2">Debug Instructions:</h3>
        <ol className="text-blue-200 text-sm space-y-1">
          <li>1. Select an organization to load its sidebar items and content</li>
          <li>2. Check if your "hiii" item has content and what type it is</li>
          <li>3. If it shows "No Content" or wrong type, use the "Recreate as" buttons</li>
          <li>4. Click "Custom Form" to recreate it with the correct form-data content type</li>
          <li>5. Then navigate to the item to see if the FormBuilder appears</li>
        </ol>
      </div>
    </div>
  )
}
