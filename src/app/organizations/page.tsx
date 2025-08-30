'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Organization } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useClient, useClientInitials, useClientColor } from '@/contexts/ClientContext'
import ResponsiveLayout from '@/components/ResponsiveLayout'
import {
  Star,
  Plus,
  Search,
  Grid3X3,
  List,
  Filter,
  MoreHorizontal,
  Building2,
  Users,
  FileText,
  Settings,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

export default function OrganizationsPage() {
  const router = useRouter()
  const { setSelectedClient } = useClient()
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const { session } = useAuth()

  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    // Wait for a session before fetching so PostgREST has a JWT
    if (!session) return
    fetchOrganizations()
  }, [session])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name')

      if (error) {
        console.error('Supabase organizations error:', { message: error.message, details: (error as any).details, hint: (error as any).hint })
        throw error
      }
      setOrganizations(data || [])
    } catch (err) {
      console.error('Error fetching organizations:', err)
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  const handleOrganizationSelect = (orgId: string) => {
    // Find the selected organization and set it in context
    const selectedOrg = organizations.find(org => org.id === orgId)
    if (selectedOrg) {
      setSelectedClient(selectedOrg)
    }
    // Navigate to the specific organization page
    router.push(`/organizations/${orgId}`)
  }

  const toggleFavorite = (orgId: string) => {
    setFavorites(prev =>
      prev.includes(orgId)
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    )
  }

  // Use the context hooks for consistent styling
  const getInitials = useClientInitials
  const getRandomColor = useClientColor

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const favoriteOrgs = filteredOrganizations.filter(org => favorites.includes(org.id))
  const recentOrgs = filteredOrganizations.slice(0, 8) // Mock recent organizations

  if (loading) {
    return (
      <ResponsiveLayout currentPage="Organizations">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading organizations...</div>
        </div>
      </ResponsiveLayout>
    )
  }

  if (error) {
    return (
      <ResponsiveLayout currentPage="Organizations">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">{error}</div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout currentPage="Organizations">
      <div>
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Organizations</h1>
          <button
            onClick={() => router.push('/organizations/new')}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>New</span>
          </button>
        </div>

        {/* Recents Section */}
        {recentOrgs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-4 h-4 bg-gray-600 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              </div>
              <h2 className="text-lg font-medium text-gray-300">RECENTS</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 mb-6">
              {recentOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleOrganizationSelect(org.id)}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`} style={{ backgroundColor: getRandomColor(org.name) }}>
                    <span className="text-white font-bold text-lg">
                      {getInitials(org.name)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 text-center truncate w-full">
                    {org.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Favorites Section */}
        {favoriteOrgs.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center space-x-2 mb-4">
              <Star className="w-4 h-4 text-yellow-500" />
              <h2 className="text-lg font-medium text-gray-300">FAVORITES</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4 mb-6">
              {favoriteOrgs.map((org) => (
                <div
                  key={org.id}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleOrganizationSelect(org.id)}
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform`} style={{ backgroundColor: getRandomColor(org.name) }}>
                    <span className="text-white font-bold text-lg">
                      {getInitials(org.name)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 text-center truncate w-full">
                    {org.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and View Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter columns or Search keywords"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-10 py-2 text-sm text-white placeholder-gray-400 w-80"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">
              {filteredOrganizations.length} of {organizations.length} Results
            </span>
            <div className="flex border border-gray-700 rounded">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-700' : 'bg-gray-800'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-gray-700' : 'bg-gray-800'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
            {filteredOrganizations.map((org) => (
              <div
                key={org.id}
                className="flex flex-col items-center cursor-pointer group"
                onClick={() => handleOrganizationSelect(org.id)}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 group-hover:scale-105 transition-transform relative`} style={{ backgroundColor: getRandomColor(org.name) }}>
                  <span className="text-white font-bold text-lg">
                    {getInitials(org.name)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(org.id)
                    }}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-gray-800 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Star className={`w-3 h-3 ${favorites.includes(org.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                  </button>
                </div>
                <span className="text-xs text-gray-400 text-center truncate w-full">
                  {org.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Type</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Status</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">MyGlue</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Sync State</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizations.map((org, index) => (
                  <tr
                    key={org.id}
                    className={`border-t border-gray-700 hover:bg-gray-750 cursor-pointer ${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-850'}`}
                    onClick={() => handleOrganizationSelect(org.id)}
                  >
                    <td className="p-3">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(org.id)
                          }}
                        >
                          <Star className={`w-4 h-4 ${favorites.includes(org.id) ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
                        </button>
                        <span className="text-sm text-white">{org.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-300">Client</td>
                    <td className="p-3">
                      <span className="text-sm text-green-400">Active</span>
                    </td>
                    <td className="p-3 text-sm text-gray-300">-</td>
                    <td className="p-3 text-sm text-gray-300">-</td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-white">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-white">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-white">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  )
}
