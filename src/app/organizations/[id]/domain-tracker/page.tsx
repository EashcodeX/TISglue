'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase, type Organization, type Domain } from '@/lib/supabase'
import { useClient } from '@/contexts/ClientContext'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import {
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Globe,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react'

export default function DomainTrackerPage() {
  const params = useParams()
  const router = useRouter()
  const { selectedClient } = useClient()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [filteredDomains, setFilteredDomains] = useState<Domain[]>([])

  useEffect(() => {
    fetchOrganization()
    fetchDomains()
  }, [params.id])

  useEffect(() => {
    filterDomains()
  }, [domains, searchTerm, includeArchived])

  const fetchOrganization = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setOrganization(data)
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const fetchDomains = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('domains')
        .select('*')
        .eq('organization_id', params.id)
        .order('domain_name')

      if (error) throw error
      setDomains(data || [])
    } catch (error) {
      console.error('Error fetching domains:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterDomains = () => {
    let filtered = domains

    if (searchTerm) {
      filtered = filtered.filter(domain =>
        domain.domain_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.registrar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        domain.status?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (!includeArchived) {
      filtered = filtered.filter(domain => domain.status !== 'expired')
    }

    setFilteredDomains(filtered)
  }

  const handleSidebarItemClick = (item: any) => {
    if (item.href) {
      if (item.href === '/') {
        router.push('/')
      } else {
        router.push(`/organizations/${params.id}${item.href}`)
      }
    }
  }

  const getStatusIcon = (status: string, expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    if (status === 'expired') {
      return <XCircle className="w-4 h-4 text-red-400" />
    } else if (daysUntilExpiry <= 30) {
      return <AlertTriangle className="w-4 h-4 text-yellow-400" />
    } else if (status === 'active') {
      return <CheckCircle className="w-4 h-4 text-green-400" />
    } else {
      return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'text-green-400'
      case 'expired':
        return 'text-red-400'
      case 'pending':
        return 'text-yellow-400'
      case 'suspended':
        return 'text-orange-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const today = new Date()
    const expiry = new Date(expiryDate)
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilExpiry < 0) {
      return `Expired ${Math.abs(daysUntilExpiry)} days ago`
    } else if (daysUntilExpiry === 0) {
      return 'Expires today'
    } else if (daysUntilExpiry <= 30) {
      return `${daysUntilExpiry} days`
    } else {
      return `${daysUntilExpiry} days`
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
              <div className="text-gray-400">Loading domains...</div>
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
        
        <div className="flex-1 p-6">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Domain Tracker</h1>
                <div className="text-sm text-gray-400">
                  {organization?.name} • {filteredDomains.length} domains
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button 
                onClick={() => router.push(`/organizations/${params.id}/domain-tracker/new`)}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New</span>
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-gray-800 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Filter columns or Search keywords..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded pl-10 pr-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <label className="flex items-center space-x-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={includeArchived}
                    onChange={(e) => setIncludeArchived(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Include expired</span>
                </label>
              </div>
              <div className="text-sm text-gray-400">
                {filteredDomains.length} Results
              </div>
            </div>
          </div>

          {/* Domains Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700">
                  <tr>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">
                      <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                    </th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Domain Name</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Registrar</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Registration Date</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Expiry Date</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Days Until Expiry</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Auto Renew</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">DNS Provider</th>
                    <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredDomains.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="text-center p-8 text-gray-400">
                        No domains found
                      </td>
                    </tr>
                  ) : (
                    filteredDomains.map((domain) => (
                      <tr key={domain.id} className="hover:bg-gray-700/50">
                        <td className="p-4">
                          <input type="checkbox" className="rounded border-gray-600 bg-gray-700" />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <Globe className="w-4 h-4 text-indigo-400" />
                            <div>
                              <div className="text-white">{domain.domain_name}</div>
                              {domain.website_url && (
                                <a 
                                  href={domain.website_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                                >
                                  <span>Visit site</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(domain.status, domain.expiry_date || '')}
                            <span className={`capitalize ${getStatusColor(domain.status)}`}>
                              {domain.status}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{domain.registrar || '-'}</td>
                        <td className="p-4 text-gray-300">
                          {domain.registration_date ? formatDate(domain.registration_date) : '-'}
                        </td>
                        <td className="p-4 text-gray-300">
                          {domain.expiry_date ? formatDate(domain.expiry_date) : '-'}
                        </td>
                        <td className="p-4">
                          {domain.expiry_date && (
                            <span className={`text-sm ${
                              getDaysUntilExpiry(domain.expiry_date).includes('Expired') ? 'text-red-400' :
                              getDaysUntilExpiry(domain.expiry_date).includes('today') ? 'text-red-400' :
                              parseInt(getDaysUntilExpiry(domain.expiry_date)) <= 30 ? 'text-yellow-400' :
                              'text-gray-300'
                            }`}>
                              {getDaysUntilExpiry(domain.expiry_date)}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          {domain.auto_renew ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400" />
                          )}
                        </td>
                        <td className="p-4 text-gray-300">{domain.dns_provider || '-'}</td>
                        <td className="p-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 text-gray-400 hover:text-white">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-white">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-white">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button className="p-1 text-gray-400 hover:text-white">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
