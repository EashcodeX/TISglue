'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type DashboardStats, type Favorite } from '@/lib/supabase'
import { DashboardService, type DashboardData, type RecentActivity, type Alert } from '@/lib/dashboard-service'
import ResponsiveLayout from '@/components/ResponsiveLayout'
import SyncAll from '@/components/SyncAll'
import { type SyncResult } from '@/lib/sync-service'
import {
  Star,
  StarOff,
  TrendingUp,
  Building2,
  Users,
  User,
  FileText,
  HardDrive,
  Settings,
  Globe,
  Key,
  Shield,
  MapPin,
  Link,
  Network,
  Bug,
  Wrench,
  Calendar,
  Lock,
  Wifi,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Bell,
  Plus
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Handle sync completion
  const handleSyncComplete = async (result: SyncResult) => {
    console.log('🔄 Sync completed, refreshing dashboard data...', result)

    if (result.success) {
      // Refresh dashboard data after successful sync
      try {
        const data = await DashboardService.getDashboardData()
        setDashboardData(data)
        console.log('✅ Dashboard data refreshed after sync')
      } catch (error) {
        console.error('❌ Failed to refresh dashboard after sync:', error)
      }
    }
  }

  const [popularItems] = useState([
    { name: 'Creative BC', description: '101 Assets updated', time: '6 Passwords updated', timeAgo: 'In the last 7 days' },
    { name: 'Roman Catholic Archdiocese of Vancouver', description: '102 Assets updated', time: '6 Passwords updated', timeAgo: 'In the last 7 days' },
    { name: 'Good Leaf Community Farms Ltd.', description: '202 Passwords updated', time: '40 Documents updated', timeAgo: '20 Folders created', additional: '27 Documents updated' }
  ])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await DashboardService.getDashboardData()
      setDashboardData(data)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleFavorite = async (
    itemType: string,
    itemId: string,
    itemName: string,
    organizationId: string,
    itemDescription?: string,
    color?: string
  ) => {
    try {
      await DashboardService.toggleFavorite(
        itemType,
        itemId,
        itemName,
        organizationId,
        itemDescription,
        color
      )
      // Refresh dashboard data to update favorites
      await fetchDashboardData()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const getStatItems = () => {
    if (!dashboardData) return []

    return [
      { label: 'Organizations', value: dashboardData.stats.organizations, icon: Building2, color: 'text-blue-500' },
      { label: 'Configurations', value: dashboardData.stats.configurations, icon: Settings, color: 'text-green-500' },
      { label: 'Documents', value: dashboardData.stats.documents, icon: FileText, color: 'text-purple-500' },
      { label: 'Passwords', value: dashboardData.stats.passwords, icon: Key, color: 'text-yellow-500' },
      { label: 'Domains', value: dashboardData.stats.domains, icon: Globe, color: 'text-indigo-500' },
      { label: 'SSL Certificates', value: dashboardData.stats.ssl_certificates, icon: Lock, color: 'text-green-500' },
      { label: 'Networks', value: dashboardData.stats.networks, icon: Network, color: 'text-blue-500' },
      { label: 'Known Issues', value: dashboardData.stats.known_issues, icon: Bug, color: 'text-red-500' },
      { label: 'RFCs', value: dashboardData.stats.rfcs, icon: FileText, color: 'text-orange-500' },
      { label: 'Warranties', value: dashboardData.stats.warranties, icon: Shield, color: 'text-purple-500' },
      { label: 'Contacts', value: dashboardData.stats.contacts, icon: Users, color: 'text-cyan-500' },
      { label: 'Assets', value: dashboardData.stats.assets, icon: HardDrive, color: 'text-gray-500' }
    ]
  }

  const getAlertItems = () => {
    if (!dashboardData) return []

    return [
      { label: 'Expiring Certificates', value: dashboardData.stats.expiring_certificates, icon: AlertTriangle, color: 'text-yellow-500' },
      { label: 'Expired Warranties', value: dashboardData.stats.expired_warranties, icon: AlertTriangle, color: 'text-red-500' },
      { label: 'Open Issues', value: dashboardData.stats.open_issues, icon: Bug, color: 'text-red-500' },
      { label: 'Pending RFCs', value: dashboardData.stats.pending_rfcs, icon: Clock, color: 'text-orange-500' }
    ]
  }

  if (loading) {
    return (
      <ResponsiveLayout currentPage="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-400">Loading dashboard...</div>
        </div>
      </ResponsiveLayout>
    )
  }

  if (error) {
    return (
      <ResponsiveLayout currentPage="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">{error}</div>
        </div>
      </ResponsiveLayout>
    )
  }

  return (
    <ResponsiveLayout currentPage="Dashboard">
      <div>
        <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Favorites Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Star className="w-5 h-5 text-yellow-500 mr-2" />
                  <h2 className="text-lg font-medium">Favorites</h2>
                </div>
                <span className="text-sm text-gray-400">
                  {dashboardData?.favorites.length || 0} items
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                {dashboardData?.favorites.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No favorites yet</p>
                    <p className="text-sm">Click the star icon on any item to add it to favorites</p>
                  </div>
                ) : (
                  dashboardData?.favorites.map((item) => (
                    <div
                      key={item.id}
                      className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => {
                        // Navigate to the item based on type
                        const basePath = `/organizations/${item.organization_id}`
                        let path = basePath

                        switch (item.item_type) {
                          case 'configuration':
                            path = `${basePath}/configurations`
                            break
                          case 'document':
                            path = `${basePath}/documents`
                            break
                          case 'password':
                            path = `${basePath}/passwords`
                            break
                          case 'domain':
                            path = `${basePath}/domain-tracker`
                            break
                          case 'ssl_certificate':
                            path = `${basePath}/ssl-tracker`
                            break
                          case 'network':
                            path = `${basePath}/networks`
                            break
                          case 'known_issue':
                            path = `${basePath}/known-issues`
                            break
                          default:
                            path = basePath
                        }

                        router.push(path)
                      }}
                    >
                      <div className={`w-16 h-16 ${item.color} rounded-full flex items-center justify-center mx-auto mb-2 relative group`}>
                        <span className="text-white font-semibold text-sm">
                          {item.item_name.substring(0, 3).toUpperCase()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleToggleFavorite(
                              item.item_type,
                              item.item_id,
                              item.item_name,
                              item.organization_id
                            )
                          }}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <StarOff className="w-3 h-3 text-white" />
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 truncate">{item.item_name}</p>
                      <p className="text-xs text-gray-500 truncate">{item.item_type}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* System Usage Stats */}
            <div className="bg-gray-800 rounded-lg p-6 mt-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="w-5 h-5 text-blue-500 mr-2" />
                <h2 className="text-lg font-medium">System Overview</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
                {getStatItems().map((item, index) => (
                  <div key={index} className="text-center p-3 bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-center mb-2">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <div className="text-xl font-bold text-white mb-1">
                      {item.value.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Alerts Section */}
              <div className="border-t border-gray-700 pt-4">
                <h3 className="text-sm font-medium text-gray-300 mb-3">System Alerts</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {getAlertItems().map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-2 bg-gray-700 rounded">
                      <item.icon className={`w-4 h-4 ${item.color}`} />
                      <div>
                        <div className="text-sm font-medium text-white">{item.value}</div>
                        <div className="text-xs text-gray-400">{item.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sync All Section */}
          <SyncAll
            onSyncComplete={handleSyncComplete}
            className="mb-6"
          />

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-6 mb-6">
            <div className="flex items-center mb-4">
              <Activity className="w-5 h-5 text-green-500 mr-2" />
              <h2 className="text-lg font-medium">Recent Activity</h2>
            </div>
            <div className="space-y-4">
              {dashboardData?.recentActivity.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No recent activity</p>
                </div>
              ) : (
                dashboardData?.recentActivity.map((activity) => (
                  <div key={activity.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                        {activity.type === 'created' && <Plus className="w-4 h-4 text-green-400" />}
                        {activity.type === 'updated' && <Settings className="w-4 h-4 text-blue-400" />}
                        {activity.type === 'deleted' && <AlertTriangle className="w-4 h-4 text-red-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{activity.item_name}</h3>
                        <p className="text-xs text-gray-400 mt-1">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleDateString()} • {activity.user_name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* System Alerts */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <Bell className="w-5 h-5 text-red-500 mr-2" />
              <h2 className="text-lg font-medium">System Alerts</h2>
            </div>
            <div className="space-y-4">
              {dashboardData?.alerts.length === 0 ? (
                <div className="text-center py-4 text-gray-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  <p>All systems operational</p>
                </div>
              ) : (
                dashboardData?.alerts.map((alert) => (
                  <div key={alert.id} className="border-b border-gray-700 pb-4 last:border-b-0">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                        {alert.type === 'error' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                        {alert.type === 'warning' && <AlertTriangle className="w-5 h-5 text-yellow-500" />}
                        {alert.type === 'info' && <Bell className="w-5 h-5 text-blue-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate">{alert.title}</h3>
                        <p className="text-xs text-gray-400 mt-1">{alert.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(alert.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  )
}
