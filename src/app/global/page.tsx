'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ResponsiveLayout from '@/components/ResponsiveLayout'
import {
  Globe,
  Building2,
  Users,
  FileText,
  Settings,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'

interface GlobalItem {
  id: string
  type: 'template' | 'policy' | 'standard' | 'procedure'
  title: string
  description: string
  category: string
  status: 'active' | 'draft' | 'archived'
  organizations_count: number
  last_updated: string
  created_by: string
}

interface GlobalStats {
  total_organizations: number
  total_templates: number
  total_policies: number
  active_users: number
}

export default function GlobalPage() {
  const router = useRouter()
  const [items, setItems] = useState<GlobalItem[]>([])
  const [stats, setStats] = useState<GlobalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    fetchGlobalItems()
    fetchGlobalStats()
  }, [])

  const fetchGlobalItems = async () => {
    // Simulate API call - replace with actual global items API
    setTimeout(() => {
      setItems([
        {
          id: '1',
          type: 'template',
          title: 'Standard Network Configuration Template',
          description: 'Default network configuration template for new organizations',
          category: 'Network',
          status: 'active',
          organizations_count: 15,
          last_updated: '2024-01-15T10:30:00Z',
          created_by: 'System Admin'
        },
        {
          id: '2',
          type: 'policy',
          title: 'Password Security Policy',
          description: 'Global password requirements and security standards',
          category: 'Security',
          status: 'active',
          organizations_count: 23,
          last_updated: '2024-01-14T14:20:00Z',
          created_by: 'Security Team'
        },
        {
          id: '3',
          type: 'standard',
          title: 'Backup and Recovery Standard',
          description: 'Standard procedures for data backup and disaster recovery',
          category: 'Operations',
          status: 'active',
          organizations_count: 18,
          last_updated: '2024-01-13T09:15:00Z',
          created_by: 'Operations Team'
        },
        {
          id: '4',
          type: 'procedure',
          title: 'Incident Response Procedure',
          description: 'Step-by-step incident response and escalation procedures',
          category: 'Security',
          status: 'draft',
          organizations_count: 0,
          last_updated: '2024-01-12T16:45:00Z',
          created_by: 'Security Team'
        }
      ])
      setLoading(false)
    }, 1000)
  }

  const fetchGlobalStats = async () => {
    // Simulate API call
    setTimeout(() => {
      setStats({
        total_organizations: 47,
        total_templates: 23,
        total_policies: 15,
        active_users: 156
      })
    }, 500)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'template':
        return <FileText className="w-4 h-4 text-blue-400" />
      case 'policy':
        return <Settings className="w-4 h-4 text-purple-400" />
      case 'standard':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'procedure':
        return <BarChart3 className="w-4 h-4 text-orange-400" />
      default:
        return <FileText className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-600/20 text-green-300 ring-green-500/30'
      case 'draft':
        return 'bg-yellow-600/20 text-yellow-300 ring-yellow-500/30'
      case 'archived':
        return 'bg-gray-600/20 text-gray-300 ring-gray-500/30'
      default:
        return 'bg-gray-600/20 text-gray-300 ring-gray-500/30'
    }
  }

  const handleSidebarItemClick = (item: any) => {
    if (item.href) {
      if (item.href === '/') {
        router.push('/')
      } else {
        router.push(item.href)
      }
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || item.category.toLowerCase() === selectedCategory.toLowerCase()
    const matchesType = selectedType === 'all' || item.type === selectedType

    return matchesSearch && matchesCategory && matchesType
  })

  return (
    <ResponsiveLayout currentPage="Global">
      <div>
        {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Global Management</h1>
                <div className="text-sm text-gray-400">
                  Manage global templates, policies, and standards
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded text-sm">
                <Plus className="w-4 h-4" />
                <span>New Item</span>
              </button>
              <button className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded text-sm">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6">
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Organizations</p>
                    <p className="text-2xl font-semibold text-white">{stats.total_organizations}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Templates</p>
                    <p className="text-2xl font-semibold text-white">{stats.total_templates}</p>
                  </div>
                  <FileText className="w-8 h-8 text-green-400" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Policies</p>
                    <p className="text-2xl font-semibold text-white">{stats.total_policies}</p>
                  </div>
                  <Settings className="w-8 h-8 text-purple-400" />
                </div>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Users</p>
                    <p className="text-2xl font-semibold text-white">{stats.active_users}</p>
                  </div>
                  <Users className="w-8 h-8 text-orange-400" />
                </div>
              </div>
            </div>
          )}

          {/* Search and Filters */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search global items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="template">Templates</option>
              <option value="policy">Policies</option>
              <option value="standard">Standards</option>
              <option value="procedure">Procedures</option>
            </select>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="network">Network</option>
              <option value="security">Security</option>
              <option value="operations">Operations</option>
            </select>
          </div>

          {/* Global Items Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">Global Items</h2>
              <p className="text-sm text-gray-400">Templates, policies, and standards available across all organizations</p>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <Clock className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading global items...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Item</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Type</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Category</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Status</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Organizations</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Last Updated</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Created By</th>
                      <th className="text-left p-4 text-sm font-medium text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center p-8 text-gray-400">
                          No global items found
                        </td>
                      </tr>
                    ) : (
                      filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-700/50">
                          <td className="p-4">
                            <div className="flex items-start space-x-3">
                              {getTypeIcon(item.type)}
                              <div>
                                <span className="text-white font-medium">{item.title}</span>
                                <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-1 bg-blue-600/20 text-blue-300 rounded-full text-xs capitalize">
                              {item.type}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">{item.category}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ring-1 capitalize ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">{item.organizations_count}</td>
                          <td className="p-4 text-gray-300">{formatDate(item.last_updated)}</td>
                          <td className="p-4 text-gray-300">{item.created_by}</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <button className="p-1 text-blue-400 hover:text-blue-300">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-green-400 hover:text-green-300">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="p-1 text-red-400 hover:text-red-300">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
