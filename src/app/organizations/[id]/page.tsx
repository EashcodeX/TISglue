'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization } from '@/lib/supabase'
import { useClient } from '@/contexts/ClientContext'
import OrganizationLayout from '@/components/OrganizationLayout'
import {
  Star,
  Edit,
  Plus,
  Building2,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  Trash2,
  Settings
} from 'lucide-react'

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedClient, setSelectedClient } = useClient()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (params.id) {
      fetchOrganization(params.id as string)
    }
  }, [params.id])

  const fetchOrganization = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setOrganization(data)
      // Update the selected client in context if it's different
      if (data && (!selectedClient || selectedClient.id !== data.id)) {
        setSelectedClient(data)
      }
    } catch (err) {
      console.error('Error fetching organization:', err)
      setError('Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  const handleSidebarItemClick = (item: any) => {
    console.log('Sidebar item clicked:', item)
    // Handle navigation based on item.href
    if (item.href) {
      // Navigate using Next.js router
      if (item.href === '/') {
        router.push('/')
      } else {
        // For organization-specific routes, append the organization ID
        router.push(`/organizations/${params.id}${item.href}`)
      }
    }
  }

  const handleBackToOrganizations = () => {
    router.push('/organizations')
  }

  if (loading) {
    return (
      <OrganizationLayout currentPage="Organizations" organizationId={params.id as string}>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading organization...</div>
        </div>
      </OrganizationLayout>
    )
  }

  if (error || !organization) {
    return (
      <OrganizationLayout currentPage="Organizations" organizationId={params.id as string}>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">{error || 'Organization not found'}</div>
        </div>
      </OrganizationLayout>
    )
  }

  return (
    <OrganizationLayout currentPage="Organizations" organizationId={params.id as string}>
            {/* Back Button */}
            <button
              onClick={handleBackToOrganizations}
              className="flex items-center space-x-2 text-gray-400 hover:text-white mb-4 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Organizations</span>
            </button>

            {/* Organization Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold">{organization.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 text-sm text-gray-400">
                    <span>Active Client</span>
                    <span className="hidden sm:inline">•</span>
                    <span>IT Support Only</span>
                    <span className="hidden sm:inline">•</span>
                    <span>Contact View</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="p-2 text-gray-400 hover:text-white">
                  <Star className="w-5 h-5" />
                </button>
                <button
                  onClick={() => router.push(`/organizations/${params.id}/sidebar-management`)}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm"
                  title="Manage Sidebar"
                >
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Sidebar</span>
                </button>
                <button
                  onClick={() => router.push(`/organizations/${params.id}/edit`)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
                >
                  <Edit className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
                <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
                <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded text-sm">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Copy</span>
                </button>
                <button className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm">
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Delete</span>
                </button>
                <button
                  onClick={() => router.push('/organizations/new')}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-3 py-2 rounded text-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">New</span>
                </button>
              </div>
            </div>

            {/* Warning Banner */}
            {organization.name.toLowerCase().includes('con-elco') && (
              <div className="bg-yellow-900/50 border border-yellow-700 rounded-lg p-4 mb-6 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-yellow-200">
                    Do not turn on ADSigner on Con-Elco PC - Client uses TISConnect in "Support Only" mode and turning ADSigner on will break their TISConnect functionality.
                  </p>
                </div>
              </div>
            )}

            {/* Quick Notes Section */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium">Quick Notes</h2>
                <span className="text-sm text-gray-400">No items can't see from Quick Notes</span>
              </div>
              
              <div className="space-y-4">
                {organization.quick_notes && organization.quick_notes.trim().length > 0 ? (
                  <div className="bg-gray-700 rounded-lg p-4 whitespace-pre-wrap text-gray-200">
                    {organization.quick_notes}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No quick notes available for this organization.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Organization Details */}
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-medium mb-4">Organization Details</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Contact Information</h3>
                  <div className="space-y-2 text-sm">
                    {organization.email && (
                      <div>
                        <span className="text-gray-400">Email: </span>
                        <span className="text-white">{organization.email}</span>
                      </div>
                    )}
                    {organization.phone && (
                      <div>
                        <span className="text-gray-400">Phone: </span>
                        <span className="text-white">{organization.phone}</span>
                      </div>
                    )}
                    {organization.website && (
                      <div>
                        <span className="text-gray-400">Website: </span>
                        <a href={organization.website} className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">
                          {organization.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Address</h3>
                  <div className="text-sm text-white">
                    {organization.address && <div>{organization.address}</div>}
                    {(organization.city || organization.state) && (
                      <div>
                        {organization.city}{organization.city && organization.state && ', '}{organization.state}
                      </div>
                    )}
                    {organization.country && <div>{organization.country}</div>}
                  </div>
                </div>
              </div>
            </div>

            {/* File Shares Section */}
            {organization.name.toLowerCase().includes('con-elco') && (
              <div className="bg-gray-800 rounded-lg p-6 mb-6">
                <h2 className="text-lg font-medium mb-4">File Shares:</h2>
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    As of 2024-06-11 all shares were disabled ( except P drive and QuickBooks) and all Network Drives were migrated to SharePoint. The SharePoint portal is accessible via the following link:
                  </p>
                  <a href="#" className="text-blue-400 hover:text-blue-300 text-sm underline">
                    https://conelco365.sharepoint.com/sites/SPPortal/SitePages/CollabHome.aspx
                  </a>
                  <p className="text-sm">
                    <span className="text-gray-300">Each user will have access to similar libraries as they had on </span>
                    <span className="text-yellow-400">Network Drives</span>
                    <span className="text-gray-300">. Any additional access needs to get approved by Namby</span>
                  </p>
                </div>
              </div>
            )}

            {/* Documentation Health Summary */}
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <h2 className="text-lg font-medium">Documentation Health Summary</h2>
                <span className="text-sm text-gray-400">Powered by Cooper Capital</span>
              </div>

              <div className="grid grid-cols-3 gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{organization.passed_count ?? 0}</span>
                  </div>
                  <p className="text-sm text-gray-400">Passed</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{organization.not_viewed_count ?? 0}</span>
                  </div>
                  <p className="text-sm text-gray-400">Not Viewed</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-2xl font-bold text-white">{organization.failed_count ?? 0}</span>
                  </div>
                  <p className="text-sm text-gray-400">Failed</p>
                </div>
              </div>
            </div>
    </OrganizationLayout>
  )
}
