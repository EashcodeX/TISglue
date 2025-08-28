'use client'

import { useParams } from 'next/navigation'
import NewItemForm from '@/components/NewItemForm'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import RequireAdmin from '@/components/RequireAdmin'


export default function NewPasswordPage() {
  const params = useParams()

  const fields = [
    {
      name: 'name',
      label: 'Password Name',
      type: 'text' as const,
      required: true,
      placeholder: 'e.g., Admin Account, Database Login'
    },
    {
      name: 'username',
      label: 'Username',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter username'
    },
    {
      name: 'password_value',
      label: 'Password',
      type: 'text' as const,
      required: true,
      placeholder: 'Enter password'
    },
    {
      name: 'category',
      label: 'Category',
      type: 'select' as const,
      required: true,
      options: [
        { value: 'admin', label: 'Administrator' },
        { value: 'service', label: 'Service Account' },
        { value: 'database', label: 'Database' },
        { value: 'application', label: 'Application' },
        { value: 'network', label: 'Network Device' },
        { value: 'email', label: 'Email Account' },
        { value: 'other', label: 'Other' }
      ]
    },
    {
      name: 'url',
      label: 'URL/Location',
      type: 'text' as const,
      placeholder: 'https://example.com/login'
    },
    {
      name: 'resource_name',
      label: 'Resource Name',
      type: 'text' as const,
      placeholder: 'Server name, application name, etc.'
    },
    {
      name: 'shared',
      label: 'Shared Password',
      type: 'checkbox' as const
    },
    {
      name: 'expires_at',
      label: 'Expiry Date',
      type: 'date' as const
    },
    {
      name: 'last_rotated',
      label: 'Last Rotated',
      type: 'date' as const
    },
    {
      name: 'notes',
      label: 'Notes',
      type: 'textarea' as const,
      placeholder: 'Additional notes about this password...',
      rows: 3
    }
  ]

  const handleSidebarItemClick = (item: any) => {
    // Handle sidebar navigation if needed
  }

  return (
    <RequireAdmin>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Organizations" />
        <div className="flex">
          <Sidebar onItemClick={handleSidebarItemClick} />
          <div className="flex-1">
            <NewItemForm
              title="New Password"
              tableName="passwords"
              organizationId={params.id as string}
              fields={fields}
              redirectPath={`/organizations/${params.id}/passwords`}
            />
          </div>
        </div>
      </div>
    </RequireAdmin>
  )
}
