'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization, type SiteSummaryLegacy } from '@/lib/supabase'
import { useClient } from '@/contexts/ClientContext'
import Sidebar, { SidebarItem } from '@/components/Sidebar'
import Header from '@/components/Header'

import { 
  Building2, 
  ArrowLeft,
  Save,
  X,
  Archive,
  MapPin,
  User,
  AlertTriangle,
  Plus,
  Trash2
} from 'lucide-react'

export default function EditSiteSummaryLegacyPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedClient } = useClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    locations: [''],
    primary_contacts: [''],
    emergency_contacts: [''],
    onboarding_details: '',
    notes: '',
    access_permissions: ['']
  })

  useEffect(() => {
    if (params.id) {
      fetchData(params.id as string)
    }
  }, [params.id])

  const fetchData = async (id: string) => {
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

      // Fetch legacy site summary data
      const { data: legacyData, error: legacyError } = await supabase
        .from('site_summaries_legacy')
        .select('*')
        .eq('organization_id', id)
        .single()

      if (legacyError && legacyError.code !== 'PGRST116') {
        console.error('Error fetching legacy site summary:', legacyError)
      } else if (legacyData) {
        setFormData({
          title: legacyData.title || '',
          locations: legacyData.locations || [''],
          primary_contacts: legacyData.primary_contacts || [''],
          emergency_contacts: legacyData.emergency_contacts || [''],
          onboarding_details: legacyData.onboarding_details || '',
          notes: legacyData.notes || '',
          access_permissions: legacyData.access_permissions || ['']
        })
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSidebarItemClick = (item: SidebarItem) => {
    if (item.href && item.href.startsWith('/')) {
      router.push(`/organizations/${params.id}${item.href}`)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleArrayInputChange = (field: string, index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev])
        ? (prev[field as keyof typeof prev] as string[]).map((item: string, i: number) => i === index ? value : item)
        : prev[field as keyof typeof prev]
    }))
  }

  const addArrayItem = (field: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field as keyof typeof prev], '']
    }))
  }

  const removeArrayItem = (field: string, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Array.isArray(prev[field as keyof typeof prev])
        ? (prev[field as keyof typeof prev] as string[]).filter((_: string, i: number) => i !== index)
        : prev[field as keyof typeof prev]
    }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setSaveError(null)
      setSaveSuccess(false)

      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error('Title is required')
      }

      // Filter out empty strings from arrays
      const cleanedData = {
        organization_id: params.id as string,
        title: formData.title.trim(),
        locations: formData.locations.filter(item => item.trim() !== ''),
        primary_contacts: formData.primary_contacts.filter(item => item.trim() !== ''),
        emergency_contacts: formData.emergency_contacts.filter(item => item.trim() !== ''),
        onboarding_details: formData.onboarding_details.trim() || null,
        notes: formData.notes.trim() || null,
        access_permissions: formData.access_permissions.filter(item => item.trim() !== '')
      }

      // Upsert the data
      const { error } = await supabase
        .from('site_summaries_legacy')
        .upsert(cleanedData, {
          onConflict: 'organization_id'
        })

      if (error) throw error

      // Show success message briefly
      setSaveSuccess(true)

      // Redirect back to site summary legacy page after a short delay
      setTimeout(() => {
        router.push(`/organizations/${params.id}/site-summary-legacy`)
      }, 1500)

    } catch (error: any) {
      console.error('Error saving site summary legacy:', error)
      setSaveError(error.message || 'Failed to save site summary legacy')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading...</p>
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
            {/* Breadcrumb */}
            <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4">
              <span>{organization?.name || 'Organization'}</span>
              <span>/</span>
              <span>Site Summary (Legacy)</span>
              <span>/</span>
              <span className="text-white">Edit</span>
            </div>

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push(`/organizations/${params.id}/site-summary-legacy`)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Site Summary (Legacy)</span>
                </button>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-600 rounded-lg">
                    <Archive className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">Edit Site Summary (Legacy)</h1>
                    <p className="text-gray-400">Modify legacy format site summary information</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Success Message */}
            {saveSuccess && (
              <div className="mb-6 p-4 bg-green-600 rounded-lg">
                <p className="text-white">✅ Site Summary (Legacy) saved successfully! Redirecting...</p>
              </div>
            )}

            {/* Save Error Message */}
            {saveError && (
              <div className="mb-6 p-4 bg-red-600 rounded-lg">
                <p className="text-white">❌ Error: {saveError}</p>
              </div>
            )}

            {/* Form */}
            <div className="grid grid-cols-4 gap-6">
              {/* Left Column - Main Form */}
              <div className="col-span-3 space-y-6">
                
                {/* Title Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">Title</h2>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter site summary title..."
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Locations Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Locations</h2>
                    <button
                      onClick={() => addArrayItem('locations')}
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Location</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.locations.map((location, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => handleArrayInputChange('locations', index, e.target.value)}
                          placeholder="Enter location name..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        {formData.locations.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('locations', index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Primary Contacts Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Primary Contacts</h2>
                    <button
                      onClick={() => addArrayItem('primary_contacts')}
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Contact</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.primary_contacts.map((contact, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={contact}
                          onChange={(e) => handleArrayInputChange('primary_contacts', index, e.target.value)}
                          placeholder="Enter contact name..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        {formData.primary_contacts.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('primary_contacts', index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency Contacts Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium">Emergency Contacts</h2>
                    <button
                      onClick={() => addArrayItem('emergency_contacts')}
                      className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Contact</span>
                    </button>
                  </div>
                  <div className="space-y-3">
                    {formData.emergency_contacts.map((contact, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                        <input
                          type="text"
                          value={contact}
                          onChange={(e) => handleArrayInputChange('emergency_contacts', index, e.target.value)}
                          placeholder="Enter emergency contact..."
                          className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                        />
                        {formData.emergency_contacts.length > 1 && (
                          <button
                            onClick={() => removeArrayItem('emergency_contacts', index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Onboarding Details Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">Initial Onboarding Details</h2>
                  <textarea
                    value={formData.onboarding_details}
                    onChange={(e) => handleInputChange('onboarding_details', e.target.value)}
                    placeholder="Enter onboarding details..."
                    rows={4}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Notes Section */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-lg font-medium mb-4">Additional Notes</h2>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Enter additional notes..."
                    rows={3}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Right Column - Actions */}
              <div className="space-y-6">
                {/* Save Actions */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <div className="space-y-3">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded transition-colors"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => router.push(`/organizations/${params.id}/site-summary-legacy`)}
                      className="w-full flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
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
