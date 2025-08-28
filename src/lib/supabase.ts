import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for TypeScript
export interface Organization {
  id: string
  name: string
  description?: string
  logo_url?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  timezone: string
  status: 'active' | 'inactive' | 'suspended'
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
  quick_notes?: string
  passed_count?: number
  not_viewed_count?: number
  failed_count?: number
}

export interface User {
  id: string
  organization_id: string
  email: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  role: 'admin' | 'manager' | 'user' | 'readonly'
  phone?: string
  title?: string
  department?: string
  status: 'active' | 'inactive' | 'suspended'
  last_login_at?: string
  created_at: string
  updated_at: string
}

export interface Asset {
  id: string
  organization_id: string
  location_id?: string
  category_id?: string
  name: string
  description?: string
  asset_type: 'hardware' | 'software' | 'network' | 'mobile' | 'peripheral'
  manufacturer?: string
  model?: string
  serial_number?: string
  asset_tag?: string
  purchase_date?: string
  purchase_cost?: number
  warranty_expiry?: string
  status: 'active' | 'inactive' | 'maintenance' | 'retired' | 'lost' | 'stolen'
  assigned_to?: string
  notes?: string
  specifications?: any
  created_at: string
  updated_at: string
}

export interface Configuration {
  id: string
  organization_id: string
  asset_id?: string
  location_id?: string
  category_id?: string
  name: string
  description?: string
  config_type: 'network' | 'server' | 'application' | 'security' | 'backup' | 'monitoring'
  hostname?: string
  ip_address?: string
  mac_address?: string
  operating_system?: string
  version?: string
  configuration_data?: any
  status: 'active' | 'inactive' | 'maintenance' | 'deprecated'
  last_backup_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  organization_id: string
  name: string
  category?: string
  file_path?: string
  file_size?: number
  file_type?: string
  version?: string
  description?: string
  tags?: string[]
  is_public: boolean
  archived: boolean
  expires_at?: string
  updated_by?: string
  // OneDrive integration fields
  onedrive_file_id?: string
  onedrive_share_url?: string
  onedrive_download_url?: string
  onedrive_folder_path?: string
  upload_status: 'pending' | 'uploading' | 'completed' | 'failed'
  last_sync_at?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  organization_id: string
  first_name?: string
  last_name?: string
  company?: string
  title?: string
  email?: string
  phone?: string
  mobile?: string
  fax?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  contact_type?: string
  notes?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Password {
  id: string
  organization_id: string
  name: string
  username?: string
  password_value: string
  password_type?: string
  category?: string
  shared_safe?: string
  url?: string
  notes?: string
  otp_enabled: boolean
  otp_secret?: string
  last_rotation_date?: string
  next_rotation_date?: string
  archived: boolean
  created_at: string
  updated_at: string
}

export interface Domain {
  id: string
  organization_id: string
  domain_name: string
  registrar?: string
  registration_date?: string
  expiry_date?: string
  auto_renew: boolean
  dns_provider?: string
  nameservers?: string[]
  website_url?: string
  status: string
  notes?: string
  registrar_login_url?: string
  registrar_username?: string
  registrar_password_id?: string
  created_at: string
  updated_at: string
}

export interface Certificate {
  id: string
  organization_id: string
  domain_id?: string
  certificate_name: string
  certificate_type: string
  issuer?: string
  subject?: string
  serial_number?: string
  issued_date?: string
  expiry_date?: string
  status: string
  created_at: string
  updated_at: string
}

export interface Location {
  id: string
  organization_id: string
  name: string
  description?: string
  location_type?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postal_code?: string
  latitude?: number
  longitude?: number
  contact_person?: string
  contact_phone?: string
  contact_email?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SiteSummary {
  id: string
  organization_id: string
  primary_contact?: string
  secondary_contact?: string
  emergency_contact?: string
  after_hours_access_instructions?: string
  time_zone?: string
  hours_of_operation?: string
  site_description?: string
  access_notes?: string
  created_at: string
  updated_at: string
}

export interface SiteSummaryLegacy {
  id: string
  organization_id: string
  title?: string
  locations?: string[]
  primary_contacts?: string[]
  emergency_contacts?: string[]
  onboarding_details?: string
  notes?: string
  access_permissions?: string[]
  created_at: string
  updated_at: string
}

export interface SidebarCategory {
  id: string
  organization_id: string
  category_key: string
  category_name: string
  display_order: number
  is_collapsible: boolean
  is_expanded: boolean
  is_visible: boolean
  is_system: boolean
  created_at: string
  updated_at: string
}

export interface SidebarItem {
  id: string
  organization_id: string
  category_id?: string
  item_key: string
  item_label: string
  item_name: string  // Alias for item_label
  item_href?: string
  item_slug?: string  // Alias for item_href
  icon_name: string
  icon?: string  // Alias for icon_name
  display_order: number
  sort_order?: number  // Alias for display_order
  is_visible: boolean
  is_active?: boolean  // Alias for is_visible
  is_system: boolean
  count_source?: string
  count_query?: string
  description?: string
  parent_category?: string
  created_at: string
  updated_at: string
}

export interface SidebarUserPreference {
  id: string
  user_id: string
  organization_id: string
  category_id?: string
  item_id?: string
  is_expanded?: boolean
  is_visible?: boolean
  custom_order?: number
  created_at: string
  updated_at: string
}

export interface SidebarConfig {
  categories: SidebarCategory[]
  items: SidebarItem[]
  userPreferences?: SidebarUserPreference[]
  counts?: Record<string, number>
}

export interface Favorite {
  id: string
  user_id?: string
  organization_id: string
  item_type: string
  item_id: string
  item_name: string
  item_description?: string
  color: string
  created_at: string
  updated_at: string
}

// Dashboard statistics interface
export interface DashboardStats {
  assets: number
  configurations: number
  contacts: number
  documents: number
  domains: number
  locations: number
  organizations: number
  passwords: number
  related_items: number
  certificates: number
  users: number
  known_issues: number
  rfcs: number
  maintenance_windows: number
  warranties: number
  mfa_configurations: number
  networks: number
  ssl_certificates: number
  expiring_certificates: number
  expired_warranties: number
  open_issues: number
  pending_rfcs: number
}
