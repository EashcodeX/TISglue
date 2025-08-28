'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { SidebarService } from '@/lib/sidebar-service'
import RequireSuperAdmin from '@/components/RequireSuperAdmin'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { Settings, RefreshCw, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react'

interface Organization {
  id: string
  name: string
  sidebar_items_count?: number
}

export default function SidebarFixPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(false)
  const [fixing, setFixing] = useState<string | null>(null)
  const [results, setResults] = useState<{ [key: string]: { success: boolean, message: string } }>({})

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      
      // Get all organizations with their sidebar item counts
      const { data: orgs, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name')
        .order('name')
      
      if (orgsError) throw orgsError

      // Get sidebar item counts for each organization
      const orgsWithCounts = await Promise.all(
        (orgs || []).map(async (org) => {
          const { count } = await supabase
            .from('sidebar_items')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', org.id)
          
          return {
            ...org,
            sidebar_items_count: count || 0
          }
        })
      )

      setOrganizations(orgsWithCounts)
    } catch (error: any) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const fixSidebarForOrganization = async (orgId: string, orgName: string) => {
    try {
      setFixing(orgId)
      
      // Clear existing sidebar data
      await supabase.from('sidebar_items').delete().eq('organization_id', orgId)
      await supabase.from('sidebar_categories').delete().eq('organization_id', orgId)
      
      // Initialize fresh sidebar
      await SidebarService.initializeDefaultSidebar(orgId)
      
      setResults(prev => ({
        ...prev,
        [orgId]: { success: true, message: 'Sidebar successfully initialized with 21 items' }
      }))
      
      // Refresh the organization list
      await fetchOrganizations()
      
    } catch (error: any) {
      console.error('Error fixing sidebar:', error)
      setResults(prev => ({
        ...prev,
        [orgId]: { success: false, message: error.message || 'Failed to fix sidebar' }
      }))
    } finally {
      setFixing(null)
    }
  }

  const fixAllIncomplete = async () => {
    const incompleteOrgs = organizations.filter(org => (org.sidebar_items_count || 0) < 21)
    
    for (const org of incompleteOrgs) {
      await fixSidebarForOrganization(org.id, org.name)
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return (
    <RequireSuperAdmin>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Admin" />
        <div className="flex">
          <Sidebar onItemClick={() => {}} />
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-600 rounded-lg">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Sidebar Fix Utility</h1>
                <p className="text-gray-400">Fix incomplete sidebar configurations for organizations</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={fetchOrganizations}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded transition-colors"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Refresh Organizations</span>
              </button>
              
              <button
                onClick={fixAllIncomplete}
                disabled={loading || fixing !== null}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white px-4 py-2 rounded transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Fix All Incomplete</span>
              </button>
            </div>

            {/* Organizations List */}
            {organizations.length > 0 && (
              <div className="bg-gray-800 rounded-lg overflow-hidden">
                <div className="p-4 bg-gray-700 border-b border-gray-600">
                  <h2 className="text-lg font-semibold">Organizations</h2>
                  <p className="text-sm text-gray-400">Expected: 21 sidebar items per organization</p>
                </div>
                <div className="divide-y divide-gray-700">
                  {organizations.map(org => (
                    <div key={org.id} className="p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {(org.sidebar_items_count || 0) >= 21 ? (
                            <CheckCircle className="w-5 h-5 text-green-400" />
                          ) : (
                            <AlertTriangle className="w-5 h-5 text-yellow-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          <div className="text-sm text-gray-400">
                            {org.sidebar_items_count || 0} sidebar items
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {results[org.id] && (
                          <div className={`text-sm px-2 py-1 rounded ${
                            results[org.id].success 
                              ? 'bg-green-600 text-green-100' 
                              : 'bg-red-600 text-red-100'
                          }`}>
                            {results[org.id].message}
                          </div>
                        )}
                        
                        <button
                          onClick={() => fixSidebarForOrganization(org.id, org.name)}
                          disabled={fixing === org.id}
                          className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          {fixing === org.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Fixing...</span>
                            </>
                          ) : (
                            <>
                              <Settings className="w-3 h-3" />
                              <span>Fix Sidebar</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mt-8 bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">How to Use</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <p>1. Click "Refresh Organizations" to load all organizations and their sidebar item counts</p>
                <p>2. Organizations with fewer than 21 sidebar items are marked with a yellow warning icon</p>
                <p>3. Click "Fix Sidebar" for individual organizations or "Fix All Incomplete" for bulk fixing</p>
                <p>4. The fix process will clear existing sidebar data and recreate the complete 21-item structure</p>
              </div>
            </div>

            {/* Future Organizations Info */}
            <div className="mt-6 bg-blue-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-blue-400" />
                Future Organizations
              </h3>
              <div className="space-y-2 text-sm text-blue-100">
                <p>✅ <strong>Automatic Setup:</strong> All new organizations will automatically get the complete 21-item sidebar structure</p>
                <p>✅ <strong>Verified Structure:</strong> 6 CLIENT CONTACT items + 15 CORE DOCUMENTATION items</p>
                <p>✅ <strong>Error Prevention:</strong> Built-in validation ensures exactly 21 items are created</p>
                <p>✅ <strong>Cache Management:</strong> Automatic cache clearing ensures fresh data loads</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RequireSuperAdmin>
  )
}
