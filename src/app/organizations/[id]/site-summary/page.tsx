'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization, type SiteSummary } from '@/lib/supabase'
import { useClient } from '@/contexts/ClientContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { 
  Building2, 
  ArrowLeft,
  Edit,
  Clock,
  MapPin
} from 'lucide-react'

export default function SiteSummaryPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedClient } = useClient()
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [siteSummary, setSiteSummary] = useState<SiteSummary | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchOrganization(params.id as string)
    }
  }, [params.id])

  const fetchOrganization = async (id: string) => {
    try {
      setLoading(true)

      // Fetch organization data
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (orgError) throw orgError
      setOrganization(orgData)

      // Fetch site summary data
      const { data: siteSummaryData, error: siteSummaryError } = await supabase
        .from('site_summaries')
        .select('*')
        .eq('organization_id', id)
        .single()

      if (siteSummaryError && siteSummaryError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is okay for new organizations
        console.error('Error fetching site summary:', siteSummaryError)
      } else if (siteSummaryData) {
        setSiteSummary(siteSummaryData)
      }
    } catch (err) {
      console.error('Error fetching organization:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSidebarItemClick = (item: any) => {
    console.log('Sidebar item clicked:', item)
    if (item.href) {
      if (item.href === '/') {
        router.push('/')
      } else {
        router.push(`/organizations/${params.id}${item.href}`)
      }
    }
  }

  const handleBackToOrganization = () => {
    router.push(`/organizations/${params.id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Organizations" />
        <div className="flex">
          <Sidebar onItemClick={handleSidebarItemClick} />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Header currentPage="Organizations" />
      <div className="flex">
        <Sidebar onItemClick={handleSidebarItemClick} />
        
        {/* Main Content */}
        <div className="flex-1">
          <div className="p-6">
            {/* Back Button */}
            <button
              onClick={handleBackToOrganization}
              className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Organization</span>
            </button>

            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">Site Summary</h1>
                  <div className="text-sm text-gray-400">
                    {organization?.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => router.push(`/organizations/${params.id}/edit`)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
              </div>
            </div>

            {/* Site Summary Content */}
            <div className="grid grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="col-span-2 space-y-6">

                {/* Navigation Tabs */}
                <div className="flex space-x-1 mb-6">
                  <button
                    onClick={() => router.push(`/organizations/${params.id}/site-summary`)}
                    className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                  >
                    Site Summary
                  </button>
                  <button
                    onClick={() => router.push(`/organizations/${params.id}/site-summary-legacy`)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-sm"
                  >
                    Site Summary (Legacy)
                  </button>
                </div>
                
                {/* Basic Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">Basic Information</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Title</label>
                      <div className="text-white">{organization?.name || 'N/A'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Time Zone</label>
                      <div className="text-white">{siteSummary?.time_zone || 'EST'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Hours of Operation</label>
                      <div className="text-white">{siteSummary?.hours_of_operation || '9-5'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Location</label>
                      <div className="text-white">{organization?.address || 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">Contact Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Primary Contact</label>
                      <div className="text-white">{siteSummary?.primary_contact || 'Not specified'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Secondary Contact</label>
                      <div className="text-white">{siteSummary?.secondary_contact || 'Not specified'}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Emergency Contact</label>
                      <div className="text-white">{siteSummary?.emergency_contact || 'Not specified'}</div>
                    </div>
                  </div>
                </div>

                {/* Access Information */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">Access Information</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">After Hours Access</label>
                      <div className="text-white">
                        {siteSummary?.after_hours_access_instructions || 'In the event that access is required after hours, please contact our primary contact to inform them of the issue and request further instruction.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button 
                      onClick={() => router.push(`/organizations/${params.id}/edit`)}
                      className="w-full text-left text-sm text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded"
                    >
                      Edit Site Summary
                    </button>
                    <button 
                      onClick={() => router.push(`/organizations/${params.id}/contacts`)}
                      className="w-full text-left text-sm text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded"
                    >
                      Manage Contacts
                    </button>
                    <button 
                      onClick={() => router.push(`/organizations/${params.id}/locations`)}
                      className="w-full text-left text-sm text-blue-400 hover:text-blue-300 p-2 hover:bg-gray-700 rounded"
                    >
                      View Locations
                    </button>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Recent Activity</h3>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div>Site summary updated</div>
                    <div>Contact information modified</div>
                    <div>Access instructions reviewed</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
