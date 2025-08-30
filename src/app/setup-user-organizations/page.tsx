'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users, Database, CheckCircle, AlertCircle, Play } from 'lucide-react'

export default function SetupUserOrganizations() {
  const [results, setResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
  }

  const setupUserOrganizations = async () => {
    setIsRunning(true)
    setResults([])
    
    try {
      addResult('👥 Setting up user-organization relationships...')

      // Create users table if it doesn't exist
      const usersTableSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT auth.uid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255),
          avatar_url TEXT,
          role VARCHAR(50) DEFAULT 'user',
          is_active BOOLEAN DEFAULT true,
          last_login_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
        CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

        -- Enable RLS on users table
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;

        -- Users can view and update their own profile
        DROP POLICY IF EXISTS "Users can view their own profile" ON users;
        CREATE POLICY "Users can view their own profile" ON users
          FOR SELECT USING (auth.uid() = id);

        DROP POLICY IF EXISTS "Users can update their own profile" ON users;
        CREATE POLICY "Users can update their own profile" ON users
          FOR UPDATE USING (auth.uid() = id);

        -- Allow users to be inserted (for registration)
        DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
        CREATE POLICY "Users can insert their own profile" ON users
          FOR INSERT WITH CHECK (auth.uid() = id);
      `

      const { error: usersError } = await supabase.rpc('exec_sql', { sql: usersTableSQL })
      if (usersError) {
        addResult(`⚠️ Users table: ${usersError.message}`)
      } else {
        addResult('✅ Users table created with RLS policies')
      }

      // Create user_organizations junction table
      const userOrganizationsSQL = `
        CREATE TABLE IF NOT EXISTS user_organizations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL,
          organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
          role VARCHAR(50) DEFAULT 'member',
          permissions JSONB DEFAULT '{}',
          is_active BOOLEAN DEFAULT true,
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, organization_id)
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);
        CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);
        CREATE INDEX IF NOT EXISTS idx_user_organizations_is_active ON user_organizations(is_active);

        -- Enable RLS on user_organizations table
        ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

        -- Users can view their own organization memberships
        DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;
        CREATE POLICY "Users can view their own organization memberships" ON user_organizations
          FOR SELECT USING (user_id = auth.uid()::text);

        -- Users can insert their own organization memberships (for joining organizations)
        DROP POLICY IF EXISTS "Users can insert their own organization memberships" ON user_organizations;
        CREATE POLICY "Users can insert their own organization memberships" ON user_organizations
          FOR INSERT WITH CHECK (user_id = auth.uid()::text);

        -- Users can update their own organization memberships
        DROP POLICY IF EXISTS "Users can update their own organization memberships" ON user_organizations;
        CREATE POLICY "Users can update their own organization memberships" ON user_organizations
          FOR UPDATE USING (user_id = auth.uid()::text);
      `

      const { error: userOrgsError } = await supabase.rpc('exec_sql', { sql: userOrganizationsSQL })
      if (userOrgsError) {
        addResult(`⚠️ User Organizations table: ${userOrgsError.message}`)
      } else {
        addResult('✅ User Organizations table created with RLS policies')
      }

      // Create a function to automatically create user profile on signup
      const createUserProfileFunctionSQL = `
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger AS $$
        BEGIN
          INSERT INTO public.users (id, email, full_name, avatar_url)
          VALUES (
            new.id,
            new.email,
            COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
            new.raw_user_meta_data->>'avatar_url'
          );
          RETURN new;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create trigger to automatically create user profile
        DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
      `

      const { error: functionError } = await supabase.rpc('exec_sql', { sql: createUserProfileFunctionSQL })
      if (functionError) {
        addResult(`⚠️ User profile function: ${functionError.message}`)
      } else {
        addResult('✅ User profile creation function and trigger created')
      }

      // Create helper functions for user management
      const helperFunctionsSQL = `
        -- Function to add user to organization
        CREATE OR REPLACE FUNCTION add_user_to_organization(
          p_user_id UUID,
          p_organization_id UUID,
          p_role VARCHAR(50) DEFAULT 'member'
        )
        RETURNS BOOLEAN AS $$
        BEGIN
          INSERT INTO user_organizations (user_id, organization_id, role)
          VALUES (p_user_id, p_organization_id, p_role)
          ON CONFLICT (user_id, organization_id) 
          DO UPDATE SET 
            role = p_role,
            is_active = true,
            updated_at = NOW();
          
          RETURN TRUE;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN FALSE;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to remove user from organization
        CREATE OR REPLACE FUNCTION remove_user_from_organization(
          p_user_id UUID,
          p_organization_id UUID
        )
        RETURNS BOOLEAN AS $$
        BEGIN
          UPDATE user_organizations 
          SET is_active = false, updated_at = NOW()
          WHERE user_id = p_user_id AND organization_id = p_organization_id;
          
          RETURN FOUND;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Function to check if user has access to organization
        CREATE OR REPLACE FUNCTION user_has_organization_access(
          p_user_id UUID,
          p_organization_id UUID
        )
        RETURNS BOOLEAN AS $$
        BEGIN
          RETURN EXISTS (
            SELECT 1 FROM user_organizations 
            WHERE user_id = p_user_id 
            AND organization_id = p_organization_id 
            AND is_active = true
          );
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `

      const { error: helpersError } = await supabase.rpc('exec_sql', { sql: helperFunctionsSQL })
      if (helpersError) {
        addResult(`⚠️ Helper functions: ${helpersError.message}`)
      } else {
        addResult('✅ User management helper functions created')
      }

      // Migrate existing users if any
      const migrateExistingUsersSQL = `
        -- Insert existing auth users into users table if they don't exist
        INSERT INTO users (id, email, full_name, created_at)
        SELECT 
          au.id,
          au.email,
          COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
          au.created_at
        FROM auth.users au
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = au.id)
        ON CONFLICT (id) DO NOTHING;
      `

      const { error: migrateError } = await supabase.rpc('exec_sql', { sql: migrateExistingUsersSQL })
      if (migrateError) {
        addResult(`⚠️ User migration: ${migrateError.message}`)
      } else {
        addResult('✅ Existing users migrated to users table')
      }

      addResult('🎉 User-Organization setup completed!')
      addResult('💡 Next step: Run the RLS policies setup to secure your data')

    } catch (error: any) {
      addResult(`❌ Setup failed: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Setup User Organizations</h1>
            <p className="text-gray-400">Configure user-organization relationships and permissions</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Setup Panel */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">User Management Setup</h2>
            <p className="text-gray-300 mb-6">
              This will create the necessary tables and functions to manage user-organization relationships.
            </p>
            
            <ul className="text-gray-300 text-sm space-y-2 mb-6">
              <li>• <strong>Users Table</strong> - Store user profiles and roles</li>
              <li>• <strong>User Organizations</strong> - Junction table for user-org relationships</li>
              <li>• <strong>RLS Policies</strong> - Secure access to user data</li>
              <li>• <strong>Helper Functions</strong> - Add/remove users from organizations</li>
              <li>• <strong>Auto Profile Creation</strong> - Trigger for new user signup</li>
            </ul>

            <button
              onClick={setupUserOrganizations}
              disabled={isRunning}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Setup User Organizations</span>
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Setup Results</h2>
            <div className="bg-gray-900 p-4 rounded-lg h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-center">Click "Setup User Organizations" to begin</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      {result.includes('✅') ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      ) : result.includes('❌') || result.includes('⚠️') ? (
                        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Database className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-sm font-mono">{result}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <h3 className="text-blue-400 font-semibold mb-2">📋 Next Steps</h3>
          <ol className="text-blue-200 text-sm space-y-1 list-decimal list-inside">
            <li>Run this setup to create user management tables</li>
            <li>Go to <code>/setup-rls-policies</code> to set up Row Level Security</li>
            <li>Test user authentication and organization access</li>
            <li>Add users to organizations using the helper functions</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
