'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Shield, Database, CheckCircle, AlertCircle, Play } from 'lucide-react'

export default function SetupRLSPolicies() {
  const [results, setResults] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
  }

  const setupRLSPolicies = async () => {
    setIsRunning(true)
    setResults([])
    
    try {
      addResult('🔒 Setting up Row Level Security (RLS) policies...')

      // Enable RLS on all tables
      const enableRLSSQL = `
        -- Enable RLS on all main tables
        ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
        ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
        ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
        ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
        ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;
        ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
        ALTER TABLE microsoft_tokens ENABLE ROW LEVEL SECURITY;
        ALTER TABLE onedrive_sync_log ENABLE ROW LEVEL SECURITY;
        
        -- Enable RLS on user-related tables if they exist
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
            ALTER TABLE users ENABLE ROW LEVEL SECURITY;
          END IF;
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_organizations') THEN
            ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
          END IF;
        END $$;
      `

      const { error: enableRLSError } = await supabase.rpc('exec_sql', { sql: enableRLSSQL })
      if (enableRLSError) {
        addResult(`⚠️ Enable RLS: ${enableRLSError.message}`)
      } else {
        addResult('✅ RLS enabled on all tables')
      }

      // Create RLS policies for documents table
      const documentsRLSSQL = `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view documents in their organizations" ON documents;
        DROP POLICY IF EXISTS "Users can insert documents in their organizations" ON documents;
        DROP POLICY IF EXISTS "Users can update documents in their organizations" ON documents;
        DROP POLICY IF EXISTS "Users can delete documents in their organizations" ON documents;
        
        -- Documents table policies
        CREATE POLICY "Users can view documents in their organizations" ON documents
          FOR SELECT USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
            OR is_public = true
          );

        CREATE POLICY "Users can insert documents in their organizations" ON documents
          FOR INSERT WITH CHECK (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        CREATE POLICY "Users can update documents in their organizations" ON documents
          FOR UPDATE USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        CREATE POLICY "Users can delete documents in their organizations" ON documents
          FOR DELETE USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );
      `

      const { error: documentsRLSError } = await supabase.rpc('exec_sql', { sql: documentsRLSSQL })
      if (documentsRLSError) {
        addResult(`⚠️ Documents RLS policies: ${documentsRLSError.message}`)
      } else {
        addResult('✅ Documents RLS policies created')
      }

      // Create RLS policies for organizations table
      const organizationsRLSSQL = `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
        DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
        DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
        DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;
        
        -- Organizations table policies
        CREATE POLICY "Users can view their organizations" ON organizations
          FOR SELECT USING (
            id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        CREATE POLICY "Users can insert organizations" ON organizations
          FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

        CREATE POLICY "Users can update their organizations" ON organizations
          FOR UPDATE USING (
            id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        CREATE POLICY "Users can delete their organizations" ON organizations
          FOR DELETE USING (
            id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );
      `

      const { error: organizationsRLSError } = await supabase.rpc('exec_sql', { sql: organizationsRLSSQL })
      if (organizationsRLSError) {
        addResult(`⚠️ Organizations RLS policies: ${organizationsRLSError.message}`)
      } else {
        addResult('✅ Organizations RLS policies created')
      }

      // Create RLS policies for passwords table
      const passwordsRLSSQL = `
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Users can view passwords in their organizations" ON passwords;
        DROP POLICY IF EXISTS "Users can insert passwords in their organizations" ON passwords;
        DROP POLICY IF EXISTS "Users can update passwords in their organizations" ON passwords;
        DROP POLICY IF EXISTS "Users can delete passwords in their organizations" ON passwords;
        
        -- Passwords table policies
        CREATE POLICY "Users can view passwords in their organizations" ON passwords
          FOR SELECT USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        CREATE POLICY "Users can insert passwords in their organizations" ON passwords
          FOR INSERT WITH CHECK (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        CREATE POLICY "Users can update passwords in their organizations" ON passwords
          FOR UPDATE USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        CREATE POLICY "Users can delete passwords in their organizations" ON passwords
          FOR DELETE USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );
      `

      const { error: passwordsRLSError } = await supabase.rpc('exec_sql', { sql: passwordsRLSSQL })
      if (passwordsRLSError) {
        addResult(`⚠️ Passwords RLS policies: ${passwordsRLSError.message}`)
      } else {
        addResult('✅ Passwords RLS policies created')
      }

      // Create RLS policies for other tables
      const otherTablesRLSSQL = `
        -- Configurations table policies
        DROP POLICY IF EXISTS "Users can manage configurations in their organizations" ON configurations;
        CREATE POLICY "Users can manage configurations in their organizations" ON configurations
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        -- Contacts table policies
        DROP POLICY IF EXISTS "Users can manage contacts in their organizations" ON contacts;
        CREATE POLICY "Users can manage contacts in their organizations" ON contacts
          FOR ALL USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );

        -- Assets table policies (if exists)
        DO $$
        BEGIN
          IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets') THEN
            DROP POLICY IF EXISTS "Users can manage assets in their organizations" ON assets;
            CREATE POLICY "Users can manage assets in their organizations" ON assets
              FOR ALL USING (
                organization_id IN (
                  SELECT organization_id FROM user_organizations 
                  WHERE user_id = auth.uid()::text
                )
              );
          END IF;
        END $$;

        -- Microsoft tokens table policies
        DROP POLICY IF EXISTS "Users can manage their own tokens" ON microsoft_tokens;
        CREATE POLICY "Users can manage their own tokens" ON microsoft_tokens
          FOR ALL USING (user_id = auth.uid()::text);

        -- OneDrive sync log policies
        DROP POLICY IF EXISTS "Users can view sync logs for their organizations" ON onedrive_sync_log;
        CREATE POLICY "Users can view sync logs for their organizations" ON onedrive_sync_log
          FOR SELECT USING (
            organization_id IN (
              SELECT organization_id FROM user_organizations 
              WHERE user_id = auth.uid()::text
            )
          );
      `

      const { error: otherTablesRLSError } = await supabase.rpc('exec_sql', { sql: otherTablesRLSSQL })
      if (otherTablesRLSError) {
        addResult(`⚠️ Other tables RLS policies: ${otherTablesRLSError.message}`)
      } else {
        addResult('✅ Other tables RLS policies created')
      }

      addResult('🎉 RLS policies setup completed!')

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
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Setup RLS Policies</h1>
            <p className="text-gray-400">Configure Row Level Security for database tables</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Setup Panel */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Security Setup</h2>
            <p className="text-gray-300 mb-6">
              This will set up Row Level Security (RLS) policies to ensure users can only access data from their authorized organizations.
            </p>
            
            <ul className="text-gray-300 text-sm space-y-2 mb-6">
              <li>• <strong>Enable RLS</strong> - Turn on row-level security for all tables</li>
              <li>• <strong>Documents</strong> - Users can only access documents in their organizations</li>
              <li>• <strong>Organizations</strong> - Users can only see their assigned organizations</li>
              <li>• <strong>Passwords</strong> - Secure access to password entries</li>
              <li>• <strong>Other Tables</strong> - Apply consistent security across all tables</li>
            </ul>

            <button
              onClick={setupRLSPolicies}
              disabled={isRunning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Setting up RLS...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Setup RLS Policies</span>
                </>
              )}
            </button>
          </div>

          {/* Results Panel */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">Setup Results</h2>
            <div className="bg-gray-900 p-4 rounded-lg h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-gray-500 text-center">Click "Setup RLS Policies" to begin</p>
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

        <div className="mt-8 bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <h3 className="text-yellow-400 font-semibold mb-2">⚠️ Important Notes</h3>
          <ul className="text-yellow-200 text-sm space-y-1">
            <li>• This setup requires a <code>user_organizations</code> table to work properly</li>
            <li>• Make sure users are authenticated before accessing protected resources</li>
            <li>• Test the policies thoroughly before deploying to production</li>
            <li>• Some policies may need adjustment based on your specific requirements</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
