'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SetupOneDriveIntegration() {
  const [setting, setSetting] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
    console.log(message)
  }

  const setupDatabase = async () => {
    setSetting(true)
    setResults([])
    
    try {
      addResult('🔧 Setting up OneDrive integration database schema...')

      // Update documents table for OneDrive integration
      const documentsUpdateSQL = `
        -- Add OneDrive-specific columns to documents table
        ALTER TABLE documents 
        ADD COLUMN IF NOT EXISTS onedrive_file_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS onedrive_share_url TEXT,
        ADD COLUMN IF NOT EXISTS onedrive_download_url TEXT,
        ADD COLUMN IF NOT EXISTS onedrive_folder_path VARCHAR(500),
        ADD COLUMN IF NOT EXISTS upload_status VARCHAR(50) DEFAULT 'pending',
        ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE;

        -- Create index for OneDrive file ID
        CREATE INDEX IF NOT EXISTS idx_documents_onedrive_file_id ON documents(onedrive_file_id);
        CREATE INDEX IF NOT EXISTS idx_documents_upload_status ON documents(upload_status);
        CREATE INDEX IF NOT EXISTS idx_documents_last_sync ON documents(last_sync_at);
      `

      const { error: documentsError } = await supabase.rpc('exec_sql', { sql: documentsUpdateSQL })
      if (documentsError) {
        addResult(`⚠️ Documents table update: ${documentsError.message}`)
      } else {
        addResult('✅ Documents table updated for OneDrive integration')
      }

      // Create microsoft_tokens table for storing user authentication tokens
      const tokensTableSQL = `
        CREATE TABLE IF NOT EXISTS microsoft_tokens (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          access_token TEXT NOT NULL,
          refresh_token TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          token_type VARCHAR(50) DEFAULT 'Bearer',
          scope TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, organization_id)
        );

        CREATE INDEX IF NOT EXISTS idx_microsoft_tokens_user_id ON microsoft_tokens(user_id);
        CREATE INDEX IF NOT EXISTS idx_microsoft_tokens_org_id ON microsoft_tokens(organization_id);
        CREATE INDEX IF NOT EXISTS idx_microsoft_tokens_expires_at ON microsoft_tokens(expires_at);
      `

      const { error: tokensError } = await supabase.rpc('exec_sql', { sql: tokensTableSQL })
      if (tokensError) {
        addResult(`⚠️ Microsoft tokens table: ${tokensError.message}`)
      } else {
        addResult('✅ Microsoft tokens table created')
      }

      // Create onedrive_sync_log table for tracking sync operations
      const syncLogSQL = `
        CREATE TABLE IF NOT EXISTS onedrive_sync_log (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          sync_type VARCHAR(50) NOT NULL, -- 'upload', 'download', 'delete', 'sync'
          file_name VARCHAR(255),
          onedrive_file_id VARCHAR(255),
          status VARCHAR(50) NOT NULL, -- 'success', 'failed', 'pending'
          error_message TEXT,
          sync_duration_ms INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_sync_log_org_id ON onedrive_sync_log(organization_id);
        CREATE INDEX IF NOT EXISTS idx_sync_log_status ON onedrive_sync_log(status);
        CREATE INDEX IF NOT EXISTS idx_sync_log_created_at ON onedrive_sync_log(created_at);
      `

      const { error: syncLogError } = await supabase.rpc('exec_sql', { sql: syncLogSQL })
      if (syncLogError) {
        addResult(`⚠️ OneDrive sync log table: ${syncLogError.message}`)
      } else {
        addResult('✅ OneDrive sync log table created')
      }

      // Update existing documents to have default upload status
      const updateExistingSQL = `
        UPDATE documents 
        SET upload_status = 'completed' 
        WHERE upload_status IS NULL OR upload_status = '';
      `

      const { error: updateError } = await supabase.rpc('exec_sql', { sql: updateExistingSQL })
      if (updateError) {
        addResult(`⚠️ Updating existing documents: ${updateError.message}`)
      } else {
        addResult('✅ Updated existing documents with default status')
      }

      addResult('🎉 OneDrive integration database setup completed!')
      addResult('📋 Next steps:')
      addResult('  1. Configure Azure App Registration')
      addResult('  2. Set environment variables')
      addResult('  3. Test authentication flow')

    } catch (error) {
      addResult(`❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setSetting(false)
  }

  const testConnection = async () => {
    setSetting(true)
    setResults([])
    
    try {
      addResult('🧪 Testing database connection and schema...')

      // Test documents table structure
      const { data: documentsTest, error: documentsError } = await supabase
        .from('documents')
        .select('id, onedrive_file_id, upload_status')
        .limit(1)

      if (documentsError) {
        addResult(`❌ Documents table test failed: ${documentsError.message}`)
      } else {
        addResult('✅ Documents table structure is correct')
      }

      // Test microsoft_tokens table
      const { data: tokensTest, error: tokensError } = await supabase
        .from('microsoft_tokens')
        .select('id')
        .limit(1)

      if (tokensError) {
        addResult(`❌ Microsoft tokens table test failed: ${tokensError.message}`)
      } else {
        addResult('✅ Microsoft tokens table is accessible')
      }

      // Test onedrive_sync_log table
      const { data: syncLogTest, error: syncLogError } = await supabase
        .from('onedrive_sync_log')
        .select('id')
        .limit(1)

      if (syncLogError) {
        addResult(`❌ OneDrive sync log table test failed: ${syncLogError.message}`)
      } else {
        addResult('✅ OneDrive sync log table is accessible')
      }

      addResult('🎉 Database schema test completed!')

    } catch (error) {
      addResult(`❌ Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setSetting(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">🔧 OneDrive Integration Setup</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Setup */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Database Schema Setup</h2>
          <p className="text-gray-300 mb-6">
            This will update your database schema to support OneDrive integration:
          </p>
          
          <ul className="text-gray-300 text-sm space-y-2 mb-6">
            <li>• <strong>documents table</strong> - Add OneDrive metadata columns</li>
            <li>• <strong>microsoft_tokens table</strong> - Store authentication tokens</li>
            <li>• <strong>onedrive_sync_log table</strong> - Track sync operations</li>
            <li>• <strong>indexes</strong> - Optimize query performance</li>
          </ul>

          <button
            onClick={setupDatabase}
            disabled={setting}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-medium mb-3"
          >
            {setting ? 'Setting Up...' : '🔧 Setup Database Schema'}
          </button>

          <button
            onClick={testConnection}
            disabled={setting}
            className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-white"
          >
            {setting ? 'Testing...' : '🧪 Test Database Schema'}
          </button>
        </div>

        {/* Configuration Guide */}
        <div className="bg-gray-800 p-6 rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Configuration Guide</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-blue-400 font-medium mb-2">1. Azure App Registration</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• Go to Azure Portal → App Registrations</li>
                <li>• Create new registration: "ITGlue OneDrive Integration"</li>
                <li>• Set redirect URI: http://localhost:3002/api/auth/callback/microsoft</li>
                <li>• Add API permissions: Files.ReadWrite, Files.ReadWrite.All, User.Read</li>
                <li>• Create client secret</li>
              </ul>
            </div>

            <div>
              <h3 className="text-green-400 font-medium mb-2">2. Environment Variables</h3>
              <div className="bg-gray-700 p-3 rounded text-xs font-mono">
                <div>MICROSOFT_CLIENT_ID=your_client_id</div>
                <div>MICROSOFT_CLIENT_SECRET=your_secret</div>
                <div>MICROSOFT_TENANT_ID=your_tenant_id</div>
                <div>MICROSOFT_REDIRECT_URI=http://localhost:3002/api/auth/callback/microsoft</div>
                <div>ONEDRIVE_ROOT_FOLDER=ITGlue_Documents</div>
              </div>
            </div>

            <div>
              <h3 className="text-purple-400 font-medium mb-2">3. Install Dependencies</h3>
              <div className="bg-gray-700 p-3 rounded text-xs font-mono">
                npm install @microsoft/microsoft-graph-client
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="mt-8 bg-gray-800 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Setup Results:</h3>
          <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={
                result.includes('✅') ? 'text-green-400' :
                result.includes('❌') ? 'text-red-400' :
                result.includes('⚠️') ? 'text-yellow-400' :
                result.includes('🎉') ? 'text-blue-400' :
                result.includes('📋') ? 'text-purple-400' :
                'text-gray-300'
              }>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-6">
        <h3 className="text-blue-400 font-semibold mb-4">🎯 Integration Benefits:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-blue-300 font-medium mb-2">Cost Savings</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• No Supabase storage costs</li>
              <li>• Use existing OneDrive Pro subscription</li>
              <li>• 1TB+ storage vs 1GB free tier</li>
            </ul>
          </div>
          <div>
            <h4 className="text-blue-300 font-medium mb-2">Features</h4>
            <ul className="text-blue-200 text-sm space-y-1">
              <li>• Large file support (250GB per file)</li>
              <li>• Built-in versioning and backup</li>
              <li>• Enterprise security and compliance</li>
              <li>• Office integration for editing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
