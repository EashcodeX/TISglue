import { supabase, type SidebarCategory as DBSidebarCategory, type SidebarItem as DBSidebarItem, type SidebarConfig } from './supabase'

// SidebarService: ensures every org has exactly 21 default items (6 + 15) in 2 categories
export class SidebarService {
  private static initLocks = new Map<string, Promise<void>>()
  private static readonly LOCK_TIMEOUT_MS = 30_000

  // Public API used by Sidebar.tsx
  static async initializeDefaultSidebar(organizationId: string): Promise<void> {
    // Lock to prevent concurrent inits for the same org
    const existing = this.initLocks.get(organizationId)
    if (existing) {
      await existing
      return
    }
    const p = this._initialize(organizationId)
    this.initLocks.set(organizationId, p)

    const clear = () => this.initLocks.delete(organizationId)
    const timeout = setTimeout(clear, this.LOCK_TIMEOUT_MS)
    try {
      await p
    } finally {
      clearTimeout(timeout)
      clear()
    }
  }

  static async getDynamicSidebarConfig(organizationId: string): Promise<SidebarConfig> {
    const { data: categories = [] } = await supabase
      .from('sidebar_categories')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true })

    const { data: items = [] } = await supabase
      .from('sidebar_items')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true })

    return { categories: categories as DBSidebarCategory[], items: items as DBSidebarItem[] }
  }

  static clearCacheIfDifferentOrg(_organizationId: string): void {
    // no-op placeholder to match existing Sidebar.tsx usage; caching removed in this simplified service
  }

  static async getOrganizationSidebarByCategory(_organizationId: string): Promise<any> {
    // Fallback minimal structure (used only if DB calls fail)
    return {
      'CLIENT CONTACT': {
        name: 'CLIENT CONTACT',
        items: [],
        systemItems: [
          { name: 'Site Summary', href: '/site-summary', icon: 'FileText', count: 0 },
          { name: 'Locations', href: '/locations', icon: 'MapPin', count: 0 },
          { name: 'Contacts', href: '/contacts', icon: 'Users', count: 0 }
        ]
      },
      'CORE DOCUMENTATION': {
        name: 'CORE DOCUMENTATION',
        items: [],
        systemItems: [
          { name: 'Configurations', href: '/configurations', icon: 'Settings', count: 0 },
          { name: 'Documents', href: '/documents', icon: 'FileText', count: 0 },
          { name: 'Passwords', href: '/passwords', icon: 'Key', count: 0 }
        ]
      }
    }
  }

  // Core logic: make sidebar exactly 21 default items in 2 categories
  private static async _initialize(organizationId: string): Promise<void> {
    // If already complete, exit fast
    const { count: existingCount } = await supabase
      .from('sidebar_items')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
    if ((existingCount || 0) === 21) return

    // Ensure categories exist (upsert) and capture their IDs
    const defaultCategories = [
      { organization_id: organizationId, category_key: 'client-contact', category_name: 'CLIENT CONTACT', display_order: 1, is_collapsible: true, is_expanded: true, is_visible: true, is_system: true },
      { organization_id: organizationId, category_key: 'core-documentation', category_name: 'CORE DOCUMENTATION', display_order: 2, is_collapsible: true, is_expanded: true, is_visible: true, is_system: true }
    ]

    await supabase
      .from('sidebar_categories')
      .upsert(defaultCategories, { onConflict: 'organization_id,category_key' })

    // Fetch categories and delete any non-default categories for this org
    const { data: categories = [] } = await supabase
      .from('sidebar_categories')
      .select('id, category_key')
      .eq('organization_id', organizationId)
    const client = categories?.find(c => c.category_key === 'client-contact')
    const core = categories?.find(c => c.category_key === 'core-documentation')
    if (!client || !core) throw new Error('Required sidebar categories not found after upsert')

    const allowedCategoryIds = new Set([client.id, core.id])
    const extraCategoryIds = categories?.filter(c => !allowedCategoryIds.has(c.id)).map(c => c.id) || []
    if (extraCategoryIds.length > 0) {
      // Delete items under extra categories then delete categories
      await supabase.from('sidebar_items').delete().in('category_id', extraCategoryIds)
      await supabase.from('sidebar_categories').delete().in('id', extraCategoryIds)
    }

    // Build 21 default items
    const defaults = this._defaultItems(organizationId, client.id, core.id)
    const defaultKeys = new Set(defaults.map(d => d.item_key))

    // Delete any non-default items or items attached to unexpected categories
    await supabase
      .from('sidebar_items')
      .delete()
      .eq('organization_id', organizationId)
      .not('item_key', 'in', `(${Array.from(defaultKeys).map(k => `'${k}'`).join(',')})`)

    await supabase
      .from('sidebar_items')
      .delete()
      .eq('organization_id', organizationId)
      .not('category_id', 'in', `(${Array.from(allowedCategoryIds).map(id => `'${id}'`).join(',')})`)

    // Upsert the 21 items (idempotent, race-safe)
    await supabase
      .from('sidebar_items')
      .upsert(defaults, { onConflict: 'organization_id,item_key' })

    // Final verification
    const { count: finalCount } = await supabase
      .from('sidebar_items')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId)
    if ((finalCount || 0) !== 21) {
      throw new Error(`Sidebar initialization incomplete. Expected 21, got ${finalCount}`)
    }
  }

  private static _defaultItems(orgId: string, clientCatId: string, coreCatId: string) {
    return [
      // CLIENT CONTACT (6)
      { organization_id: orgId, category_id: clientCatId, item_key: 'site-summary', item_label: 'Site Summary', item_href: '/site-summary', icon_name: 'FileText', display_order: 1, is_visible: true, is_system: true, count_source: 'site_summaries' },
      { organization_id: orgId, category_id: clientCatId, item_key: 'site-summary-legacy', item_label: 'Site Summary (Legacy)', item_href: '/site-summary-legacy', icon_name: 'Archive', display_order: 2, is_visible: true, is_system: true, count_source: 'site_summaries' },
      { organization_id: orgId, category_id: clientCatId, item_key: 'after-hour-access', item_label: 'After Hour and Building/Site Access Instructions', item_href: '/after-hour-access', icon_name: 'Clock', display_order: 3, is_visible: true, is_system: true, count_source: 'site_summaries' },
      { organization_id: orgId, category_id: clientCatId, item_key: 'onsite-information', item_label: 'Onsite Information', item_href: '/onsite-information', icon_name: 'AlertTriangle', display_order: 4, is_visible: true, is_system: true },
      { organization_id: orgId, category_id: clientCatId, item_key: 'locations', item_label: 'Locations', item_href: '/locations', icon_name: 'MapPin', display_order: 5, is_visible: true, is_system: true, count_source: 'locations' },
      { organization_id: orgId, category_id: clientCatId, item_key: 'contacts', item_label: 'Contacts', item_href: '/contacts', icon_name: 'Users', display_order: 6, is_visible: true, is_system: true, count_source: 'contacts' },
      // CORE DOCUMENTATION (15)
      { organization_id: orgId, category_id: coreCatId, item_key: 'tis-standards-exception', item_label: 'TIS Standards Exception', item_href: '/tis-standards-exception', icon_name: 'AlertTriangle', display_order: 1, is_visible: true, is_system: true },
      { organization_id: orgId, category_id: coreCatId, item_key: 'tis-contract-exceptions', item_label: 'TIS Contract Exceptions', item_href: '/tis-contract-exceptions', icon_name: 'FileX', display_order: 2, is_visible: true, is_system: true },
      { organization_id: orgId, category_id: coreCatId, item_key: 'request-change-form', item_label: 'Request for Change Form (RFC)', item_href: '/rfc', icon_name: 'Clock', display_order: 3, is_visible: true, is_system: true },
      { organization_id: orgId, category_id: coreCatId, item_key: 'change-log', item_label: 'Change Log', item_href: '/change-log', icon_name: 'History', display_order: 4, is_visible: true, is_system: true },
      { organization_id: orgId, category_id: coreCatId, item_key: 'configurations', item_label: 'Configurations', item_href: '/configurations', icon_name: 'Settings', display_order: 5, is_visible: true, is_system: true, count_source: 'configurations' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'documents', item_label: 'Documents', item_href: '/documents', icon_name: 'FileText', display_order: 6, is_visible: true, is_system: true, count_source: 'documents' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'domains-liongard', item_label: 'Domains - Liongard', item_href: '/domain-tracker', icon_name: 'Globe', display_order: 7, is_visible: true, is_system: true, count_source: 'domains' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'domain-tracker', item_label: 'Domain Tracker', item_href: '/domain-tracker', icon_name: 'Network', display_order: 8, is_visible: true, is_system: true, count_source: 'domains' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'known-issues', item_label: 'Known Issues', item_href: '/known-issues', icon_name: 'Bug', display_order: 9, is_visible: true, is_system: true, count_source: 'known_issues' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'maintenance-windows', item_label: 'Maintenance Windows', item_href: '/maintenance-windows', icon_name: 'Calendar', display_order: 10, is_visible: true, is_system: true },
      { organization_id: orgId, category_id: coreCatId, item_key: 'multi-factor-authentication', item_label: 'Multi-Factor Authentication', item_href: '/multi-factor-authentication', icon_name: 'Shield', display_order: 11, is_visible: true, is_system: true, count_source: 'mfa_configs' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'networks', item_label: 'Networks', item_href: '/networks', icon_name: 'Wifi', display_order: 12, is_visible: true, is_system: true, count_source: 'networks' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'passwords', item_label: 'Passwords', item_href: '/passwords', icon_name: 'Key', display_order: 13, is_visible: true, is_system: true, count_source: 'passwords' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'ssl-tracker', item_label: 'SSL Tracker', item_href: '/ssl-tracker', icon_name: 'Lock', display_order: 14, is_visible: true, is_system: true, count_source: 'ssl_certificates' },
      { organization_id: orgId, category_id: coreCatId, item_key: 'tls-ssl-certificate', item_label: 'TLS/SSL Certificate', item_href: '/tls-ssl-certificate', icon_name: 'Shield', display_order: 15, is_visible: true, is_system: true, count_source: 'ssl_certificates' }
    ]
  }

  // Additional methods used by components
  static async getOrganizationSidebarItems(organizationId: string): Promise<DBSidebarItem[]> {
    const { data: items = [] } = await supabase
      .from('sidebar_items')
      .select('*')
      .eq('organization_id', organizationId)
      .order('display_order', { ascending: true })

    return items as DBSidebarItem[]
  }

  static async createSidebarItem(itemData: Partial<DBSidebarItem>): Promise<DBSidebarItem> {
    const { data, error } = await supabase
      .from('sidebar_items')
      .insert(itemData)
      .select()
      .single()

    if (error) throw error
    return data as DBSidebarItem
  }

  static async updateSidebarItem(itemId: string, updates: Partial<DBSidebarItem>): Promise<void> {
    const { error } = await supabase
      .from('sidebar_items')
      .update(updates)
      .eq('id', itemId)

    if (error) throw error
  }

  static async deleteSidebarItem(itemId: string): Promise<void> {
    const { error } = await supabase
      .from('sidebar_items')
      .delete()
      .eq('id', itemId)

    if (error) throw error
  }

  static async updateItemLabel(item: DBSidebarItem, newLabel: string): Promise<void> {
    await this.updateSidebarItem(item.id, { item_label: newLabel })
  }

  static async updateCategoryName(categoryId: string, newName: string): Promise<void> {
    const { error } = await supabase
      .from('sidebar_categories')
      .update({ category_name: newName })
      .eq('id', categoryId)

    if (error) throw error
  }

  static async toggleItemVisibility(itemId: string, isVisible: boolean): Promise<void> {
    await this.updateSidebarItem(itemId, { is_visible: isVisible })
  }

  static async getOrganizationCounts(organizationId: string): Promise<any> {
    // Return mock counts for now
    return {
      configurations: 0,
      documents: 0,
      domains: 0,
      known_issues: 0,
      passwords: 0,
      networks: 0,
      ssl_certificates: 0,
      mfa_configs: 0
    }
  }

  static clearCache(organizationId?: string): void {
    // No-op for now
  }

  static getAvailableCategories(): string[] {
    return ['Client Contact', 'Core Documentation']
  }

  static getAvailableIcons(): string[] {
    return ['FileText', 'Users', 'Settings', 'Globe', 'Key', 'Shield', 'Network', 'Bug', 'Calendar', 'Lock']
  }
}

// Export types for use in components
export type SidebarItem = DBSidebarItem
export type SidebarCategory = DBSidebarCategory

