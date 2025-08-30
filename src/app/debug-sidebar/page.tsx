'use client'

import { useState, useEffect } from 'react'
import { SidebarService } from '@/lib/sidebar-service'
import { supabase } from '@/lib/supabase'

export default function DebugSidebarPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [selectedOrg, setSelectedOrg] = useState<string>('')
  const [sidebarData, setSidebarData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
      setLoading(false)
    } catch (error) {
      console.error('Error loading organizations:', error)
      setError('Failed to load organizations')
      setLoading(false)
    }
  }

  const loadSidebarData = async (organizationId: string) => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Loading sidebar data for organization:', organizationId)

      // First, get raw sidebar items
      const rawItems = await SidebarService.getOrganizationSidebarItems(organizationId)
      console.log('📋 Raw sidebar items:', rawItems)

      // Then get categorized data
      const categorizedData = await SidebarService.getOrganizationSidebarByCategory(organizationId)
      console.log('📊 Categorized sidebar data:', categorizedData)
      
      setSidebarData({
        rawItems,
        categorizedData
      })
    } catch (err) {
      console.error('❌ Error loading sidebar data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const deleteSidebarItem = async (itemId: string, itemName: string) => {
    if (!confirm(`Are you sure you want to delete "${itemName}"?`)) return

    try {
      // Delete associated page content first
      const { error: contentError } = await supabase
        .from('page_contents')
        .delete()
        .eq('sidebar_item_id', itemId)

      if (contentError) {
        console.warn('Error deleting page content:', contentError)
      }

      // Delete sidebar item
      const { error } = await supabase
        .from('organization_sidebar_items')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      // Reload sidebar data
      if (selectedOrg) {
        loadSidebarData(selectedOrg)
      }

      alert('Sidebar item deleted successfully!')
    } catch (error) {
      console.error('Error deleting sidebar item:', error)
      alert('Failed to delete sidebar item')
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Sidebar Data</h1>
        <p>Loading sidebar data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Debug Sidebar Data</h1>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <strong>Error:</strong> {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Sidebar Data</h1>
      <p className="mb-4">Organization ID: <code className="bg-gray-100 px-2 py-1 rounded">{selectedOrg}</code></p>
      
      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-semibold mb-2">Raw Sidebar Items ({sidebarData?.rawItems?.length || 0})</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(sidebarData?.rawItems, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Categorized Sidebar Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(sidebarData?.categorizedData, null, 2)}
          </pre>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">CLIENT CONTACT Category Items</h2>
          {sidebarData?.categorizedData?.['CLIENT CONTACT'] ? (
            <div>
              <p><strong>System Items:</strong> {sidebarData.categorizedData['CLIENT CONTACT'].systemItems.length}</p>
              <p><strong>Custom Items:</strong> {sidebarData.categorizedData['CLIENT CONTACT'].items.length}</p>
              
              <h3 className="font-medium mt-4 mb-2">Custom Items:</h3>
              <ul className="list-disc list-inside">
                {sidebarData.categorizedData['CLIENT CONTACT'].items.map((item: any) => (
                  <li key={item.id}>
                    {item.item_name} (slug: {item.item_slug}, active: {item.is_active ? 'Yes' : 'No'})
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p>No CLIENT CONTACT category found</p>
          )}
        </div>
      </div>

      <div className="mt-8">
        <button
          onClick={() => loadSidebarData(selectedOrg)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={!selectedOrg}
        >
          Reload Data
        </button>
      </div>
    </div>
  )
}
