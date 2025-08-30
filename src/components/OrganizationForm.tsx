'use client'

import { useState } from 'react'
import {
  Building2,
  Users,
  Clock,
  Shield,
  Plus,
  Trash2,
  MapPin,
  Phone,
  Mail,
  User,
  Key,
  Calendar,
  FileText,
  AlertTriangle
} from 'lucide-react'

interface ContactInfo {
  id: string
  name: string
  email: string
  phone: string
  role: string
  isPrimary: boolean
  department?: string
  title?: string
}

interface LocationInfo {
  id: string
  name: string
  address: string
  type: string
  phone?: string
  contact?: string
}

interface OrganizationFormProps {
  initialData?: any
  onSave: (data: any) => void
  onCancel: () => void
  saving?: boolean
  isNewOrganization?: boolean
}

export default function OrganizationForm({ initialData, onSave, onCancel, saving = false, isNewOrganization = false }: OrganizationFormProps) {
  // Form state
  const [formData, setFormData] = useState({
    // Site Summary
    title: initialData?.title || '',
    timeZone: initialData?.timeZone || 'EST',
    hoursOfOperation: initialData?.hoursOfOperation || '9-5',
    primaryContact: initialData?.primaryContact || '',
    secondaryContact: initialData?.secondaryContact || '',
    emergencyContactSummary: initialData?.emergencyContactSummary || '',
    afterHoursAccessInstructions: initialData?.afterHoursAccessInstructions || 'In the event that access is required after hours, please contact our primary contact to inform them of the issue and request further instruction.',

    // Site Summary (Legacy)
    siteSummaryLegacy: {
      description: initialData?.siteSummaryLegacy?.description || '',
      notes: initialData?.siteSummaryLegacy?.notes || '',
      accessInstructions: initialData?.siteSummaryLegacy?.accessInstructions || ''
    },

    // General Information
    generalInfo: {
      organizationType: initialData?.generalInfo?.organizationType || 'Client',
      industry: initialData?.generalInfo?.industry || '',
      website: initialData?.generalInfo?.website || '',
      mainPhone: initialData?.generalInfo?.mainPhone || '',
      mainEmail: initialData?.generalInfo?.mainEmail || '',
      address: initialData?.generalInfo?.address || '',
      city: initialData?.generalInfo?.city || '',
      state: initialData?.generalInfo?.state || '',
      zipCode: initialData?.generalInfo?.zipCode || '',
      country: initialData?.generalInfo?.country || 'Canada',
      taxId: initialData?.generalInfo?.taxId || '',
      accountManager: initialData?.generalInfo?.accountManager || '',
      serviceLevel: initialData?.generalInfo?.serviceLevel || 'Standard'
    },

    // Additional database fields
    name: initialData?.name || initialData?.title || '',
    description: initialData?.description || '',
    website: initialData?.website || initialData?.generalInfo?.website || '',
    phone: initialData?.phone || initialData?.generalInfo?.mainPhone || '',
    email: initialData?.email || initialData?.generalInfo?.mainEmail || '',
    address: initialData?.address || initialData?.generalInfo?.address || '',
    city: initialData?.city || initialData?.generalInfo?.city || '',
    state: initialData?.state || initialData?.generalInfo?.state || '',
    country: initialData?.country || initialData?.generalInfo?.country || '',
    postalCode: initialData?.postal_code || initialData?.generalInfo?.zipCode || '',

    // Client Contacts - No hardcoded sample data
    contacts: initialData?.contacts || [],

    // Locations - No hardcoded sample data
    locations: initialData?.locations || [],

    // Emergency Contact
    emergencyContact: initialData?.emergencyContact || '',

    // After Hour Access
    afterHourAccess: {
      site: initialData?.afterHourAccess?.site || '',
      primaryContact: initialData?.afterHourAccess?.primaryContact || '',
      notes: initialData?.afterHourAccess?.notes || '',
      accessInstructions: initialData?.afterHourAccess?.accessInstructions || ''
    },

    // Client Authorization
    clientAuthorization: {
      securityAuthorization: initialData?.clientAuthorization?.securityAuthorization || '',
      purchasingAuthority: initialData?.clientAuthorization?.purchasingAuthority || '',
      onsiteAssistance: initialData?.clientAuthorization?.onsiteAssistance || ''
    },

    // Initial Onboarding Details
    onboardingDetails: initialData?.onboardingDetails || '',
    // Organization DB-backed extras
    quickNotes: initialData?.quick_notes || '',
    passedCount: initialData?.passed_count ?? 0,
    notViewedCount: initialData?.not_viewed_count ?? 0,
    failedCount: initialData?.failed_count ?? 0,

  })

  const updateFormData = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }))
  }

  const addContact = () => {
    const newContact: ContactInfo = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      role: 'Contact',
      isPrimary: false,
      department: '',
      title: ''
    }
    setFormData(prev => ({
      ...prev,
      contacts: [...prev.contacts, newContact]
    }))
  }

  const updateContact = (id: string, field: keyof ContactInfo, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.map((contact: any) =>
        contact.id === id ? { ...contact, [field]: value } : contact
      )
    }))
  }

  const removeContact = (id: string) => {
    setFormData(prev => ({
      ...prev,
      contacts: prev.contacts.filter((contact: any) => contact.id !== id)
    }))
  }

  const addLocation = () => {
    const newLocation: LocationInfo = {
      id: Date.now().toString(),
      name: '',
      address: '',
      type: 'Branch',
      phone: '',
      contact: ''
    }
    setFormData(prev => ({
      ...prev,
      locations: [...prev.locations, newLocation]
    }))
  }

  const updateLocation = (id: string, field: keyof LocationInfo, value: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location: any) =>
        location.id === id ? { ...location, [field]: value } : location
      )
    }))
  }

  const removeLocation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((location: any) => location.id !== id)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* General Information Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>General Information</span>
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Organization Type</label>
            <select
              value={formData.generalInfo.organizationType}
              onChange={(e) => updateFormData('generalInfo', 'organizationType', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="Client">Client</option>
              <option value="Vendor">Vendor</option>
              <option value="Partner">Partner</option>
              <option value="Internal">Internal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Industry</label>
            <input
              type="text"
              value={formData.generalInfo.industry}
              onChange={(e) => updateFormData('generalInfo', 'industry', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="e.g., Construction, Technology"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Website</label>
            <input
              type="url"
              value={formData.generalInfo.website}
              onChange={(e) => updateFormData('generalInfo', 'website', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Main Phone</label>
            <input
              type="tel"
              value={formData.generalInfo.mainPhone}
              onChange={(e) => updateFormData('generalInfo', 'mainPhone', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Main Email</label>
            <input
              type="email"
              value={formData.generalInfo.mainEmail}
              onChange={(e) => updateFormData('generalInfo', 'mainEmail', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="info@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Account Manager</label>
            <input
              type="text"
              value={formData.generalInfo.accountManager}
              onChange={(e) => updateFormData('generalInfo', 'accountManager', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Account manager name"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
            <input
              type="text"
              value={formData.generalInfo.address}
              onChange={(e) => updateFormData('generalInfo', 'address', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Street address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
            <input
              type="text"
              value={formData.generalInfo.city}
              onChange={(e) => updateFormData('generalInfo', 'city', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="City"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">State/Province</label>
            <input
              type="text"
              value={formData.generalInfo.state}
              onChange={(e) => updateFormData('generalInfo', 'state', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="State/Province"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Zip/Postal Code</label>
            <input
              type="text"
              value={formData.generalInfo.zipCode}
              onChange={(e) => updateFormData('generalInfo', 'zipCode', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Zip/Postal Code"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
            <select
              value={formData.generalInfo.country}
              onChange={(e) => updateFormData('generalInfo', 'country', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="Canada">Canada</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Australia">Australia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Site Summary Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center space-x-2">
          <Building2 className="w-5 h-5" />
          <span>Site Summary</span>
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Enter site title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Time Zone</label>
            <select
              value={formData.timeZone}
              onChange={(e) => setFormData({...formData, timeZone: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              <option value="EST">EST</option>
              <option value="PST">PST</option>
              <option value="MST">MST</option>
              <option value="CST">CST</option>
              <option value="UTC">UTC</option>
            </select>
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Hours of Operation</label>
            <input
              type="text"
              value={formData.hoursOfOperation}
              onChange={(e) => setFormData({...formData, hoursOfOperation: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="e.g., 9-5, Monday-Friday 8:00 AM - 6:00 PM"
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="mt-6">
          <h3 className="text-md font-medium text-gray-300 mb-4">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Primary Contact</label>
              <input
                type="text"
                value={formData.primaryContact}
                onChange={(e) => setFormData({...formData, primaryContact: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                placeholder="Enter primary contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Secondary Contact</label>
              <input
                type="text"
                value={formData.secondaryContact}
                onChange={(e) => setFormData({...formData, secondaryContact: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                placeholder="Enter secondary contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Emergency Contact</label>
              <input
                type="text"
                value={formData.emergencyContactSummary}
                onChange={(e) => setFormData({...formData, emergencyContactSummary: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                placeholder="Enter emergency contact name"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">After Hours Access Instructions</label>
              <textarea
                value={formData.afterHoursAccessInstructions}
                onChange={(e) => setFormData({...formData, afterHoursAccessInstructions: e.target.value})}
                rows={3}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
                placeholder="Enter instructions for after hours access"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Site Summary (Legacy) Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Site Summary (Legacy)</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.siteSummaryLegacy.description}
              onChange={(e) => updateFormData('siteSummaryLegacy', 'description', e.target.value)}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Legacy site description and details"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.siteSummaryLegacy.notes}
              onChange={(e) => updateFormData('siteSummaryLegacy', 'notes', e.target.value)}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Additional notes and comments"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Access Instructions</label>
            <textarea
              value={formData.siteSummaryLegacy.accessInstructions}
              onChange={(e) => updateFormData('siteSummaryLegacy', 'accessInstructions', e.target.value)}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Legacy access instructions"
            />
          </div>
        </div>
      </div>

      {/* Client Contacts Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Client Contacts</span>
          </h2>
          <button
            type="button"
            onClick={addContact}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Contact</span>
          </button>
        </div>

        <div className="space-y-4">
          {formData.contacts.map((contact: any) => (
            <div key={contact.id} className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400"
                    placeholder="Contact name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Role</label>
                  <select
                    value={contact.role}
                    onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white"
                  >
                    <option value="Primary Contact">Primary Contact</option>
                    <option value="Secondary Contact">Secondary Contact</option>
                    <option value="Emergency Contact">Emergency Contact</option>
                    <option value="Technical Contact">Technical Contact</option>
                    <option value="Billing Contact">Billing Contact</option>
                    <option value="Manager">Manager</option>
                    <option value="IT Contact">IT Contact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={contact.email}
                    onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400"
                    placeholder="email@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={contact.department || ''}
                    onChange={(e) => updateContact(contact.id, 'department', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400"
                    placeholder="Department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Title</label>
                  <input
                    type="text"
                    value={contact.title || ''}
                    onChange={(e) => updateContact(contact.id, 'title', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400"
                    placeholder="Job title"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={contact.isPrimary}
                    onChange={(e) => updateContact(contact.id, 'isPrimary', e.target.checked)}
                    className="rounded bg-gray-600 border-gray-500 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-300">Primary Contact</span>
                </label>

                <button
                  type="button"
                  onClick={() => removeContact(contact.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Locations Section */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Locations</span>
          </h2>
          <button
            type="button"
            onClick={addLocation}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Location</span>
          </button>
        </div>

        <div className="space-y-3">
          {formData.locations.map((location: any) => (
            <div key={location.id} className="bg-gray-700 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location Name</label>
                  <input
                    type="text"
                    value={location.name}
                    onChange={(e) => updateLocation(location.id, 'name', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm"
                    placeholder="Location name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Type</label>
                  <select
                    value={location.type}
                    onChange={(e) => updateLocation(location.id, 'type', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="Main Office">Main Office</option>
                    <option value="Branch">Branch</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Remote Site">Remote Site</option>
                    <option value="Service Center">Service Center</option>
                    <option value="Training Facility">Training Facility</option>
                    <option value="Storage">Storage</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                  <input
                    type="text"
                    value={location.address}
                    onChange={(e) => updateLocation(location.id, 'address', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm"
                    placeholder="Full address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={location.phone || ''}
                    onChange={(e) => updateLocation(location.id, 'phone', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Primary Contact</label>
                  <select
                    value={location.contact || ''}
                    onChange={(e) => updateLocation(location.id, 'contact', e.target.value)}
                    className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm"
                  >
                    <option value="">Select contact</option>
                    {formData.contacts.map((contact: any) => (
                      <option key={contact.id} value={contact.name}>{contact.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeLocation(location.id)}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* After Hour and Building/Site/Location Access */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center space-x-2">
          <Clock className="w-5 h-5" />
          <span>After Hour and Building/Site/Location Access</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Site</label>
            <input
              type="text"
              value={formData.afterHourAccess.site}
              onChange={(e) => updateFormData('afterHourAccess', 'site', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Site name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Primary Contact</label>
            <select
              value={formData.afterHourAccess.primaryContact}
              onChange={(e) => updateFormData('afterHourAccess', 'primaryContact', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {formData.contacts.map((contact: any) => (
                <option key={contact.id} value={contact.name}>{contact.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
            <textarea
              value={formData.afterHourAccess.notes}
              onChange={(e) => updateFormData('afterHourAccess', 'notes', e.target.value)}
              rows={3}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Enter access notes and instructions"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Access Instructions</label>
            <textarea
              value={formData.afterHourAccess.accessInstructions}
              onChange={(e) => updateFormData('afterHourAccess', 'accessInstructions', e.target.value)}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Detailed access instructions for after hours"
            />
          </div>
        </div>
      </div>

      {/* Client Authorization (Primaries) */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Client Authorization (Primaries)</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Security Authorization</label>
            <select
              value={formData.clientAuthorization.securityAuthorization}
              onChange={(e) => updateFormData('clientAuthorization', 'securityAuthorization', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {formData.contacts.map((contact: any) => (
                <option key={contact.id} value={contact.name}>{contact.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Purchasing Authority</label>
            <select
              value={formData.clientAuthorization.purchasingAuthority}
              onChange={(e) => updateFormData('clientAuthorization', 'purchasingAuthority', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {formData.contacts.map((contact: any) => (
                <option key={contact.id} value={contact.name}>{contact.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Onsite Assistance</label>
            <input
              type="text"
              value={formData.clientAuthorization.onsiteAssistance}
              onChange={(e) => updateFormData('clientAuthorization', 'onsiteAssistance', e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Onsite assistance contact"
            />
          </div>
        </div>
      </div>

      {/* Initial Onboarding Details */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4 flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>Initial Onboarding Details</span>
        </h2>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Onboarding Notes</label>
          <textarea
            value={formData.onboardingDetails}
            onChange={(e) => setFormData({...formData, onboardingDetails: e.target.value})}

            rows={6}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
            placeholder="Enter initial onboarding details, setup notes, and important information..."
          />
        </div>
      </div>
      {/* Quick Notes and Health Summary */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Organization Extras</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">Quick Notes</label>
            <textarea
              value={formData.quickNotes}
              onChange={(e) => setFormData({ ...formData, quickNotes: e.target.value })}
              rows={4}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
              placeholder="Enter organization quick notes"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Passed Count</label>
            <input
              type="number"
              min={0}
              value={formData.passedCount}
              onChange={(e) => setFormData({ ...formData, passedCount: Number(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Not Viewed Count</label>
            <input
              type="number"
              min={0}
              value={formData.notViewedCount}
              onChange={(e) => setFormData({ ...formData, notViewedCount: Number(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Failed Count</label>
            <input
              type="number"
              min={0}
              value={formData.failedCount}
              onChange={(e) => setFormData({ ...formData, failedCount: Number(e.target.value) })}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
            />
          </div>
        </div>
      </div>


      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-700">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Saving...</span>
            </>
          ) : (
            <span>Save Changes</span>
          )}
        </button>
      </div>
    </form>
  )
}
