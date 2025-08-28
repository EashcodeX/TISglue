'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization, type SiteSummary } from '@/lib/supabase'
import { useClient } from '@/contexts/ClientContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import OrganizationForm from '@/components/OrganizationForm'
import { 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Building2, 
  Users, 
  FileText, 
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe,
  User,
  Shield,
  Key,
  Calendar,
  ChevronDown,
  Upload,
  Paperclip
} from 'lucide-react'

export default function EditOrganizationPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedClient } = useClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const handleSave = async (formData: any) => {
    try {
      setSaving(true)

      // Prepare organization data for database update
      const organizationData = {
        name: formData.title || formData.name,
        description: formData.siteSummaryLegacy?.description || '',
        website: formData.website || formData.generalInfo?.website || '',
        phone: formData.phone || formData.generalInfo?.mainPhone || '',
        email: formData.email || formData.generalInfo?.mainEmail || '',
        address: formData.address || formData.generalInfo?.address || '',
        city: formData.city || formData.generalInfo?.city || '',
        state: formData.state || formData.generalInfo?.state || '',
        country: formData.country || formData.generalInfo?.country || '',
        postal_code: formData.postalCode || formData.generalInfo?.zipCode || '',
        timezone: formData.timeZone || 'EST',
        quick_notes: formData.quickNotes || '',
        passed_count: Number(formData.passedCount ?? 0),
        not_viewed_count: Number(formData.notViewedCount ?? 0),
        failed_count: Number(formData.failedCount ?? 0),
        updated_at: new Date().toISOString()
      }

      // Update organization in Supabase
      const { error: orgError } = await supabase
        .from('organizations')
        .update(organizationData)
        .eq('id', params.id)

      if (orgError) {
        throw new Error(`Failed to update organization: ${orgError.message}`)
      }

      // Prepare site summary data
      const siteSummaryData = {
        organization_id: params.id as string,
        primary_contact: formData.primaryContact || null,
        secondary_contact: formData.secondaryContact || null,
        emergency_contact: formData.emergencyContactSummary || null,
        after_hours_access_instructions: formData.afterHoursAccessInstructions || 'In the event that access is required after hours, please contact our primary contact to inform them of the issue and request further instruction.',
        time_zone: formData.timeZone || 'EST',
        hours_of_operation: formData.hoursOfOperation || '9-5',
        site_description: formData.siteSummaryLegacy?.description || null,
        access_notes: formData.siteSummaryLegacy?.notes || null,
        updated_at: new Date().toISOString()
      }

      // Upsert site summary data (insert or update)
      const { error: siteSummaryError } = await supabase
        .from('site_summaries')
        .upsert(siteSummaryData, {
          onConflict: 'organization_id',
          ignoreDuplicates: false
        })

      if (siteSummaryError) {
        throw new Error(`Failed to save site summary: ${siteSummaryError.message}`)
      }

      // Navigate back to view mode
      router.push(`/organizations/${params.id}`)
    } catch (err: any) {
      console.error('Error saving organization:', err)
      alert(err.message || 'Failed to save organization')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/organizations/${params.id}`)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Organizations" />
        <div className="flex">
          <Sidebar onItemClick={handleSidebarItemClick} />
          <div className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading organization...</div>
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
            {/* Header with Save/Cancel */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold">Edit Organization</h1>
                  <div className="text-sm text-gray-400">
                    {organization?.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded text-sm"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Main Content Area */}
              <div className="col-span-2">
                <OrganizationForm
                  initialData={{
                    title: organization?.name || '',
                    timeZone: siteSummary?.time_zone || 'EST',
                    hoursOfOperation: siteSummary?.hours_of_operation || '9-5',
                    primaryContact: siteSummary?.primary_contact || '',
                    secondaryContact: siteSummary?.secondary_contact || '',
                    emergencyContactSummary: siteSummary?.emergency_contact || '',
                    afterHoursAccessInstructions: siteSummary?.after_hours_access_instructions || 'In the event that access is required after hours, please contact our primary contact to inform them of the issue and request further instruction.',
                    siteSummaryLegacy: {
                      description: siteSummary?.site_description || '',
                      notes: siteSummary?.access_notes || '',
                      accessInstructions: ''
                    },
                    contacts: [],
                    afterHourAccess: {
                      site: '',
                      primaryContact: '',
                      notes: '',
                      accessInstructions: ''
                    },
                    clientAuthorization: {
                      securityAuthorization: 'Namby Vithanarachchi',
                      purchasingAuthority: 'Nick Melati',
                      onsiteAssistance: ''
                    }
                  }}
                  onSave={handleSave}
                  onCancel={handleCancel}
                  saving={saving}
                  isNewOrganization={false}
                />
              </div>

              {/* Right Sidebar */}
              <div className="space-y-6">
                {/* Attachments */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                    <Paperclip className="w-4 h-4" />
                    <span>Attachments</span>
                  </h3>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Browse or drop files to attach</p>
                    <p className="text-xs text-gray-500">Max file size 100MB each</p>
                  </div>
                </div>

                {/* Embedded Passwords */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Embedded Passwords</span>
                  </h3>
                  <p className="text-sm text-gray-500 mb-3">No Embedded Passwords to show</p>
                  <button className="text-sm text-blue-400 hover:text-blue-300">
                    Add Password
                  </button>
                </div>

                {/* Related Items */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3">Related Items</h3>
                  <p className="text-sm text-gray-500 mb-3">No Related Items to show</p>
                  <button className="text-sm text-blue-400 hover:text-blue-300">
                    Add Related Item
                  </button>
                </div>

                {/* Revisions */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Revisions</span>
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-400">
                      <span>Jul 19, 2022 - 10:25 pm</span>
                      <span>John Doe</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>Mar 21, 2022 - 8:19 pm</span>
                      <span>Jane Smith</span>
                    </div>
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
