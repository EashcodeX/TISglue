'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SetupSidebarTables() {
  const [creating, setCreating] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
    console.log(message)
  }

  const createTables = async () => {
    setCreating(true)
    setResults([])
    
    try {
      addResult('🔧 Creating sidebar count tables...')

      // Create documents table
      const documentsSQL = `
        CREATE TABLE IF NOT EXISTS documents (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          file_url TEXT,
          file_type VARCHAR(50),
          file_size INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_documents_organization_id ON documents(organization_id);
      `

      const { error: documentsError } = await supabase.rpc('exec_sql', { sql: documentsSQL })
      if (documentsError) {
        addResult(`⚠️ Documents table: ${documentsError.message}`)
      } else {
        addResult('✅ Documents table created')
      }

      // Create passwords table
      const passwordsSQL = `
        CREATE TABLE IF NOT EXISTS passwords (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          username VARCHAR(255),
          password_encrypted TEXT,
          url TEXT,
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_passwords_organization_id ON passwords(organization_id);
      `

      const { error: passwordsError } = await supabase.rpc('exec_sql', { sql: passwordsSQL })
      if (passwordsError) {
        addResult(`⚠️ Passwords table: ${passwordsError.message}`)
      } else {
        addResult('✅ Passwords table created')
      }

      // Create configurations table
      const configurationsSQL = `
        CREATE TABLE IF NOT EXISTS configurations (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          config_type VARCHAR(100),
          config_data JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_configurations_organization_id ON configurations(organization_id);
      `

      const { error: configurationsError } = await supabase.rpc('exec_sql', { sql: configurationsSQL })
      if (configurationsError) {
        addResult(`⚠️ Configurations table: ${configurationsError.message}`)
      } else {
        addResult('✅ Configurations table created')
      }

      // Create networks table
      const networksSQL = `
        CREATE TABLE IF NOT EXISTS networks (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          network_address VARCHAR(50),
          subnet_mask VARCHAR(50),
          gateway VARCHAR(50),
          dns_servers TEXT[],
          description TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_networks_organization_id ON networks(organization_id);
      `

      const { error: networksError } = await supabase.rpc('exec_sql', { sql: networksSQL })
      if (networksError) {
        addResult(`⚠️ Networks table: ${networksError.message}`)
      } else {
        addResult('✅ Networks table created')
      }

      // Create ssl_certificates table
      const sslSQL = `
        CREATE TABLE IF NOT EXISTS ssl_certificates (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          domain VARCHAR(255) NOT NULL,
          issuer VARCHAR(255),
          expiry_date DATE,
          certificate_type VARCHAR(100),
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_ssl_certificates_organization_id ON ssl_certificates(organization_id);
      `

      const { error: sslError } = await supabase.rpc('exec_sql', { sql: sslSQL })
      if (sslError) {
        addResult(`⚠️ SSL Certificates table: ${sslError.message}`)
      } else {
        addResult('✅ SSL Certificates table created')
      }

      // Create domains table
      const domainsSQL = `
        CREATE TABLE IF NOT EXISTS domains (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          domain_name VARCHAR(255) NOT NULL,
          registrar VARCHAR(255),
          expiry_date DATE,
          auto_renew BOOLEAN DEFAULT false,
          status VARCHAR(50) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_domains_organization_id ON domains(organization_id);
      `

      const { error: domainsError } = await supabase.rpc('exec_sql', { sql: domainsSQL })
      if (domainsError) {
        addResult(`⚠️ Domains table: ${domainsError.message}`)
      } else {
        addResult('✅ Domains table created')
      }

      addResult('🎉 Table creation completed!')
      addResult('🔄 Sidebar counts will now show real data from these tables')

    } catch (error) {
      addResult(`❌ Setup failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setCreating(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">🔧 Setup Sidebar Count Tables</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Create Database Tables</h2>
        <p className="text-gray-300 mb-6">
          This will create the necessary database tables for sidebar counts:
        </p>
        
        <ul className="text-gray-300 text-sm space-y-2 mb-6">
          <li>• <strong>documents</strong> - For document counts</li>
          <li>• <strong>passwords</strong> - For password counts</li>
          <li>• <strong>configurations</strong> - For configuration counts</li>
          <li>• <strong>networks</strong> - For network counts</li>
          <li>• <strong>ssl_certificates</strong> - For SSL certificate counts</li>
          <li>• <strong>domains</strong> - For domain counts</li>
        </ul>

        <button
          onClick={createTables}
          disabled={creating}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-medium"
        >
          {creating ? 'Creating Tables...' : '🔧 Create Tables'}
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="font-medium mb-4">Setup Results:</h3>
          <div className="space-y-1 text-sm font-mono max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={
                result.includes('✅') ? 'text-green-400' :
                result.includes('❌') ? 'text-red-400' :
                result.includes('⚠️') ? 'text-yellow-400' :
                result.includes('🎉') ? 'text-blue-400' :
                'text-gray-300'
              }>
                {result}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-blue-900/20 border border-blue-600 rounded-lg p-4">
        <h3 className="text-blue-400 font-semibold mb-2">📊 After Setup:</h3>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• Sidebar will show real counts (0 for new organizations)</li>
          <li>• Counts update automatically when you add/remove items</li>
          <li>• Each organization has separate counts</li>
          <li>• Counts are cached for 30 seconds for performance</li>
          <li>• Tables are properly indexed for fast queries</li>
        </ul>
      </div>
    </div>
  )
}
