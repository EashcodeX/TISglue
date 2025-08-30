import { supabase } from './supabase'

export interface UserOrganization {
  id: string
  user_id: string
  organization_id: string
  role: 'admin' | 'manager' | 'member' | 'viewer'
  permissions: Record<string, any>
  is_active: boolean
  joined_at: string
  created_at: string
  updated_at: string
}

export class UserOrganizationService {
  /**
   * Add a user to an organization
   */
  static async addUserToOrganization(
    userId: string,
    organizationId: string,
    role: 'admin' | 'manager' | 'member' | 'viewer' = 'member'
  ): Promise<UserOrganization> {
    try {
      console.log('👥 Adding user to organization:', { userId, organizationId, role })

      const { data, error } = await supabase
        .from('user_organizations')
        .insert({
          user_id: userId,
          organization_id: organizationId,
          role,
          is_active: true
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Error adding user to organization:', error)
        throw new Error(`Failed to add user to organization: ${error.message}`)
      }

      console.log('✅ User added to organization successfully')
      return data
    } catch (error) {
      console.error('❌ User organization service error:', error)
      throw error
    }
  }

  /**
   * Remove a user from an organization
   */
  static async removeUserFromOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    try {
      console.log('👥 Removing user from organization:', { userId, organizationId })

      const { error } = await supabase
        .from('user_organizations')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)

      if (error) {
        console.error('❌ Error removing user from organization:', error)
        throw new Error(`Failed to remove user from organization: ${error.message}`)
      }

      console.log('✅ User removed from organization successfully')
    } catch (error) {
      console.error('❌ User organization service error:', error)
      throw error
    }
  }

  /**
   * Get user's organizations
   */
  static async getUserOrganizations(userId: string): Promise<UserOrganization[]> {
    try {
      console.log('👥 Fetching user organizations:', userId)

      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          *,
          organizations:organization_id(id, name, description, status)
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching user organizations:', error)
        throw new Error(`Failed to fetch user organizations: ${error.message}`)
      }

      console.log(`✅ Found ${data?.length || 0} organizations for user`)
      return data || []
    } catch (error) {
      console.error('❌ User organization service error:', error)
      throw error
    }
  }

  /**
   * Get organization members
   */
  static async getOrganizationMembers(organizationId: string): Promise<UserOrganization[]> {
    try {
      console.log('👥 Fetching organization members:', organizationId)

      const { data, error } = await supabase
        .from('user_organizations')
        .select(`
          *,
          users:user_id(id, email, full_name, role)
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) {
        console.error('❌ Error fetching organization members:', error)
        throw new Error(`Failed to fetch organization members: ${error.message}`)
      }

      console.log(`✅ Found ${data?.length || 0} members for organization`)
      return data || []
    } catch (error) {
      console.error('❌ User organization service error:', error)
      throw error
    }
  }

  /**
   * Update user role in organization
   */
  static async updateUserRole(
    userId: string,
    organizationId: string,
    role: 'admin' | 'manager' | 'member' | 'viewer'
  ): Promise<UserOrganization> {
    try {
      console.log('👥 Updating user role:', { userId, organizationId, role })

      const { data, error } = await supabase
        .from('user_organizations')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .select()
        .single()

      if (error) {
        console.error('❌ Error updating user role:', error)
        throw new Error(`Failed to update user role: ${error.message}`)
      }

      console.log('✅ User role updated successfully')
      return data
    } catch (error) {
      console.error('❌ User organization service error:', error)
      throw error
    }
  }

  /**
   * Check if user has access to organization (includes super admin check)
   */
  static async hasOrganizationAccess(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    try {
      // First check if user is super admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (!userError && userData?.role === 'super_admin') {
        return true // Super admins have access to all organizations
      }

      // Check regular organization membership
      const { data, error } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error checking organization access:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('❌ User organization service error:', error)
      return false
    }
  }

  /**
   * Check if user is super admin
   */
  static async isSuperAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('❌ Error checking super admin status:', error)
        return false
      }

      return data?.role === 'super_admin'
    } catch (error) {
      console.error('❌ Super admin check error:', error)
      return false
    }
  }

  /**
   * Get all organizations (for super admins) or user's organizations
   */
  static async getAccessibleOrganizations(userId: string): Promise<any[]> {
    try {
      const isSuperAdmin = await this.isSuperAdmin(userId)

      if (isSuperAdmin) {
        // Super admin can see all organizations
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name')

        if (error) {
          console.error('❌ Error fetching all organizations:', error)
          throw new Error(`Failed to fetch organizations: ${error.message}`)
        }

        return data || []
      } else {
        // Regular user can only see their organizations
        const userOrgs = await this.getUserOrganizations(userId)
        return userOrgs.map((uo: any) => uo.organizations).filter(Boolean)
      }
    } catch (error) {
      console.error('❌ Error getting accessible organizations:', error)
      throw error
    }
  }

  /**
   * Get user's role in organization
   */
  static async getUserRole(
    userId: string,
    organizationId: string
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_organizations')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('❌ Error getting user role:', error)
        return null
      }

      return data?.role || null
    } catch (error) {
      console.error('❌ User organization service error:', error)
      return null
    }
  }

  /**
   * Create user profile if it doesn't exist
   */
  static async ensureUserProfile(userId: string, email: string, fullName?: string): Promise<void> {
    try {
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (checkError && checkError.code === 'PGRST116') {
        // User doesn't exist, create profile
        const { error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email,
            full_name: fullName || email.split('@')[0],
            role: 'user',
            is_active: true
          })

        if (createError) {
          console.error('❌ Error creating user profile:', createError)
          throw new Error(`Failed to create user profile: ${createError.message}`)
        }

        console.log('✅ User profile created successfully')
      }
    } catch (error) {
      console.error('❌ User profile service error:', error)
      throw error
    }
  }
}
