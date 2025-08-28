'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import {
  ArrowLeft,
  Save,
  X,
  Plus,
  Wrench,
  AlertTriangle
} from 'lucide-react'

interface FormField {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'date' | 'number' | 'email' | 'tel' | 'checkbox'
  required?: boolean
  options?: { value: string; label: string }[]
  placeholder?: string
  rows?: number
}

interface NewItemFormProps {
  title: string
  tableName: string
  organizationId: string
  fields: FormField[]
  redirectPath: string
  onCancel?: () => void
}

export default function NewItemForm({
  title,
  tableName,
  organizationId,
  fields,
  redirectPath,
  onCancel
}: NewItemFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<Record<string, any>>({
    organization_id: organizationId
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSchemaError, setIsSchemaError] = useState(false)
  const [fixing, setFixing] = useState(false)

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleFixSchema = async () => {
    setFixing(true)
    setError(null)

    try {
      console.log('🔧 Testing password save...')

      // Just try the alternative save method directly
      await handleAlternativeSubmit()

    } catch (error: any) {
      setError(`Test failed: ${error.message}`)
      console.error('Test error:', error)
    } finally {
      setFixing(false)
    }
  }

  const { isAdmin } = useAuth() as any

  const handleAlternativeSubmit = async () => {
    setSaving(true)
    setError(null)

    try {
      if (!isAdmin) {
        setError('You do not have permission to perform this action.')
        setSaving(false)
        return
      }

      console.log('🔐 Saving password via alternative method...')

      // Normalize payload to satisfy varying API/DB schemas
      const normalizedPayload = {
        ...formData,
        // Ensure both name and title are provided, map whichever user filled
        title: (formData as any).title ?? (formData as any).name ?? undefined,
        name: (formData as any).name ?? (formData as any).title ?? undefined,
        // Normalize password field names
        password_value:
          (formData as any).password_value ??
          (formData as any).password ??
          (formData as any).password_encrypted ?? undefined,
      }

      // Avoid sending conflicting raw password keys
      delete (normalizedPayload as any).password
      delete (normalizedPayload as any).password_encrypted

      // Masked log for debugging
      console.log('🧰 Payload to API:', {
        ...normalizedPayload,
        password_value: normalizedPayload.password_value ? '[REDACTED]' : undefined,
      })

      // Include Supabase access token so the API can authenticate even across hosts/ports
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token

      const response = await fetch('/api/passwords/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
        },
        credentials: 'include',
        body: JSON.stringify(normalizedPayload)
      })

      const data = await response.json()
      console.log('Save response:', data)

      if (response.ok && data.success) {
        alert('✅ Password saved successfully!')
        router.push(redirectPath)
      } else {
        setError(`Save failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      setError(`Save error: ${error.message}`)
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // For passwords, use the alternative method directly
    if (tableName === 'passwords') {
      await handleAlternativeSubmit()
      return
    }

    try {
      setSaving(true)
      setError(null)

      // Validate required fields
      const missingFields = fields
        .filter(field => field.required && !formData[field.name])
        .map(field => field.label)

      if (missingFields.length > 0) {
        setError(`Please fill in required fields: ${missingFields.join(', ')}`)
        return
      }

      console.log('Attempting to insert into table:', tableName, 'with data:', formData)

      const { data, error: insertError } = await supabase
        .from(tableName)
        .insert([formData])
        .select()

      if (insertError) {
        console.error('Supabase insert error details:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
          tableName,
          formData,
          fullError: insertError,
          errorString: JSON.stringify(insertError, null, 2),
          errorType: typeof insertError,
          errorKeys: Object.keys(insertError || {})
        })

        // Also log to console in a more readable format
        console.log('=== DETAILED ERROR BREAKDOWN ===')
        console.log('Table:', tableName)
        console.log('Form Data:', JSON.stringify(formData, null, 2))
        console.log('Error Message:', insertError.message || 'No message')
        console.log('Error Details:', insertError.details || 'No details')
        console.log('Error Hint:', insertError.hint || 'No hint')
        console.log('Error Code:', insertError.code || 'No code')
        console.log('Full Error Object:', insertError)
        console.log('================================')

        throw insertError
      }

      console.log('Successfully created item:', data)

      // Redirect back to the list page
      router.push(redirectPath)
    } catch (error: any) {
      console.error('Error creating item:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        tableName,
        formData
      })

      // Provide more specific error messages
      let errorMessage = 'Failed to create item. Please try again.'
      let isSchema = false

      if (error?.message) {
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          errorMessage = `Database table "${tableName}" does not exist. Please run the database setup first by visiting /fix-missing-tables`
          isSchema = true
        } else if (error.message.includes('duplicate key')) {
          errorMessage = 'An item with this information already exists.'
        } else if (error.message.includes('violates check constraint')) {
          errorMessage = 'Invalid data provided. Please check your input.'
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Invalid reference data. Please check your selections.'
        } else if (error.message.includes('column') && error.message.includes('does not exist')) {
          errorMessage = `Database column is missing. Please run the database setup at /fix-missing-tables`
          isSchema = true
        } else if (error.message.includes('schema cache') || error.message.includes('Could not find')) {
          errorMessage = `Database schema issue detected. Try "Alternative" method or visit /manual-db-setup for manual fix instructions.`
          isSchema = true
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }

      setIsSchemaError(isSchema)
      setError(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (onCancel) {
      onCancel()
    } else {
      router.push(redirectPath)
    }
  }

  const renderField = (field: FormField) => {
    const commonProps = {
      id: field.name,
      name: field.name,
      required: field.required,
      className: "w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
      placeholder: field.placeholder
    }

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            rows={field.rows || 4}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        )

      case 'select':
        return (
          <select
            {...commonProps}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              name={field.name}
              checked={formData[field.name] || false}
              onChange={(e) => handleInputChange(field.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
            />
            <label htmlFor={field.name} className="ml-2 text-sm text-gray-300">
              {field.label}
            </label>
          </div>
        )

      default:
        return (
          <input
            {...commonProps}
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
          />
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-semibold">{title}</h1>
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
              onClick={handleSubmit}
              disabled={saving}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 px-4 py-2 rounded text-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : (tableName === 'passwords' ? 'Save Password' : 'Save')}</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && tableName !== 'passwords' && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <p className="text-red-400">{error}</p>
              </div>
              {isSchemaError && (
                <div className="flex space-x-2 ml-4 flex-shrink-0">
                  <button
                    onClick={handleFixSchema}
                    disabled={fixing}
                    className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-xs text-white"
                  >
                    <Wrench className="w-3 h-3" />
                    <span>{fixing ? 'Saving...' : 'Save Password'}</span>
                  </button>

                  <button
                    onClick={handleAlternativeSubmit}
                    disabled={saving}
                    className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-3 py-1 rounded text-xs text-white"
                  >
                    <Save className="w-3 h-3" />
                    <span>{saving ? 'Saving...' : 'Save Now'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-gray-800 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {fields.map((field) => (
                <div key={field.name} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-300 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-400 ml-1">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
