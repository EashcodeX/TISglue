'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import RequireSuperAdmin from '@/components/RequireSuperAdmin'
import Header from '@/components/Header'
import Sidebar from '@/components/Sidebar'
import { 
  Users, 
  Building2, 
  Settings, 
  Database, 
  Activity, 
  Shield,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react'

interface AdminStats {
  totalUsers: number
  totalOrganizations: number
  totalDocuments: number
  totalPasswords: number
  activeUsers: number
  superAdmins: number
  admins: number
  regularUsers: number
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrganizations: 0,
    totalDocuments: 0,
    totalPasswords: 0,
    activeUsers: 0,
    superAdmins: 0,
    admins: 0,
    regularUsers: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      
      // Fetch user statistics
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('role, status')
      
      if (usersError) throw usersError

      // Fetch organization count
      const { count: orgCount, error: orgError } = await supabase
        .from('organizations')
        .select('*', { count: 'exact', head: true })
      
      if (orgError) throw orgError

      // Fetch document count
      const { count: docCount, error: docError } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
      
      if (docError) throw docError

      // Fetch password count
      const { count: passCount, error: passError } = await supabase
        .from('passwords')
        .select('*', { count: 'exact', head: true })
      
      if (passError) throw passError

      // Calculate user statistics
      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(u => u.status === 'active').length || 0
      const superAdmins = users?.filter(u => u.role === 'super_admin').length || 0
      const admins = users?.filter(u => u.role === 'admin').length || 0
      const regularUsers = users?.filter(u => u.role === 'user').length || 0

      setStats({
        totalUsers,
        totalOrganizations: orgCount || 0,
        totalDocuments: docCount || 0,
        totalPasswords: passCount || 0,
        activeUsers,
        superAdmins,
        admins,
        regularUsers
      })
    } catch (err: any) {
      console.error('Error fetching admin stats:', err)
      setError(err.message || 'Failed to fetch statistics')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const adminActions = [
    {
      title: 'User Management',
      description: 'Manage user accounts, roles, and permissions',
      icon: Users,
      href: '/admin/users',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      icon: Settings,
      href: '/admin/settings',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      title: 'Database Management',
      description: 'Monitor database health and performance',
      icon: Database,
      href: '/admin/database',
      color: 'bg-purple-600 hover:bg-purple-700'
    },
    {
      title: 'Activity Logs',
      description: 'View system activity and audit logs',
      icon: Activity,
      href: '/admin/logs',
      color: 'bg-orange-600 hover:bg-orange-700'
    },
    {
      title: 'Security Center',
      description: 'Manage security policies and monitoring',
      icon: Shield,
      href: '/admin/security',
      color: 'bg-red-600 hover:bg-red-700'
    },
    {
      title: 'Reports',
      description: 'Generate system and usage reports',
      icon: BarChart3,
      href: '/admin/reports',
      color: 'bg-indigo-600 hover:bg-indigo-700'
    },
    {
      title: 'Sidebar Fix Utility',
      description: 'Fix incomplete sidebar configurations',
      icon: Settings,
      href: '/admin/sidebar-fix',
      color: 'bg-orange-600 hover:bg-orange-700'
    }
  ]

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Organizations',
      value: stats.totalOrganizations,
      icon: Building2,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Documents',
      value: stats.totalDocuments,
      icon: FileText,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      title: 'Super Admins',
      value: stats.superAdmins,
      icon: Shield,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      title: 'Passwords',
      value: stats.totalPasswords,
      icon: Shield,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10'
    }
  ]

  return (
    <RequireSuperAdmin>
      <div className="min-h-screen bg-gray-900 text-white">
        <Header currentPage="Admin" />
        <div className="flex">
          <Sidebar onItemClick={() => {}} />
          <div className="flex-1 p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-red-600 rounded-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                  <p className="text-gray-400">System administration and management</p>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3">Loading admin dashboard...</span>
              </div>
            ) : error ? (
              <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
                <div className="flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  <span>Error: {error}</span>
                </div>
              </div>
            ) : (
              <>
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
                  {statCards.map((card, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2 rounded-lg ${card.bgColor}`}>
                          <card.icon className={`w-5 h-5 ${card.color}`} />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-white mb-1">
                        {card.value.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-400">{card.title}</div>
                    </div>
                  ))}
                </div>

                {/* Admin Actions */}
                <div className="mb-8">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Admin Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {adminActions.map((action, index) => (
                      <button
                        key={index}
                        onClick={() => router.push(action.href)}
                        className={`${action.color} text-white p-6 rounded-lg transition-colors text-left`}
                      >
                        <div className="flex items-center mb-3">
                          <action.icon className="w-6 h-6 mr-3" />
                          <h3 className="text-lg font-semibold">{action.title}</h3>
                        </div>
                        <p className="text-sm opacity-90">{action.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2" />
                    System Status
                  </h2>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        <span>Database Connection</span>
                      </div>
                      <span className="text-green-500 text-sm">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center">
                        <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                        <span>Authentication Service</span>
                      </div>
                      <span className="text-green-500 text-sm">Online</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center">
                        <TrendingUp className="w-5 h-5 text-blue-500 mr-3" />
                        <span>System Performance</span>
                      </div>
                      <span className="text-blue-500 text-sm">Optimal</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </RequireSuperAdmin>
  )
}
