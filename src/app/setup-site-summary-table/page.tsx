'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function SetupSiteSummaryTable() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
    console.log(message)
  }

  const createSiteSummaryTable = async () => {
    try {
      setLoading(true)
      setResults([])
      addResult('🚀 Analyzing database schema and creating site summary table...')

      // First, let's check what tables exist
      addResult('🔍 Checking existing database schema...')

      // Check if organizations table exists and get its structure
      const { data: orgData, error: orgError } = await supabase
        .from('organizations')
        .select('id, name')
        .limit(1)

      if (orgError) {
        addResult(`❌ Cannot access organizations table: ${orgError.message}`)
        return
      } else {
        addResult('✅ Organizations table found')
      }

      // Check if site_summaries table already exists
      const { data: existingData, error: existingError } = await supabase
        .from('site_summaries')
        .select('id')
        .limit(1)

      if (!existingError) {
        addResult('⚠️ Site summaries table already exists!')
        addResult('✅ Table is ready for use!')
        return
      }

      addResult('📋 Creating site_summaries table...')

      // Create the table by inserting a dummy record first (this will create the table structure)
      // Then we'll handle the schema properly

      // Since we can't use exec_sql, let's try a different approach
      // We'll create the table by using Supabase's REST API directly

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        addResult('❌ Supabase configuration missing')
        return
      }

      // Try to create table using direct SQL execution
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS site_summaries (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          primary_contact VARCHAR(255),
          secondary_contact VARCHAR(255),
          emergency_contact VARCHAR(255),
          after_hours_access_instructions TEXT DEFAULT 'In the event that access is required after hours, please contact our primary contact to inform them of the issue and request further instruction.',
          time_zone VARCHAR(50) DEFAULT 'EST',
          hours_of_operation VARCHAR(100) DEFAULT '9-5',
          site_description TEXT,
          access_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE UNIQUE INDEX IF NOT EXISTS idx_site_summaries_organization_id ON site_summaries(organization_id);
      `

      // Try multiple approaches to create the table
      let tableCreated = false

      // Approach 1: Try exec_sql RPC function
      try {
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
        if (!rpcError) {
          addResult('✅ Table created using exec_sql RPC')
          tableCreated = true
        } else {
          addResult(`⚠️ exec_sql RPC failed: ${rpcError.message}`)
        }
      } catch (e) {
        addResult('⚠️ exec_sql RPC not available')
      }

      // Approach 2: Try direct HTTP call to Supabase
      if (!tableCreated) {
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'apikey': supabaseKey
            },
            body: JSON.stringify({ sql: createTableSQL })
          })

          if (response.ok) {
            addResult('✅ Table created using direct HTTP call')
            tableCreated = true
          } else {
            addResult(`⚠️ Direct HTTP call failed: ${response.status}`)
          }
        } catch (e) {
          addResult('⚠️ Direct HTTP call not available')
        }
      }

      // If automated creation failed, provide manual instructions
      if (!tableCreated) {
        addResult('📋 Automated table creation failed. Please create manually:')
        addResult('')
        addResult('1. Go to your Supabase Dashboard → SQL Editor')
        addResult('2. Run this SQL:')
        addResult('')
        addResult(createTableSQL)
        addResult('')
        addResult('3. After running, refresh this page to verify')
      }

      // Verify table creation
      const { data: verifyData, error: verifyError } = await supabase
        .from('site_summaries')
        .select('id')
        .limit(1)

      if (verifyError) {
        addResult(`⚠️ Table verification failed: ${verifyError.message}`)
        addResult('Please create the table manually using the SQL above')
      } else {
        addResult('✅ Table verification successful!')
        addResult('🎉 Site summaries table is ready for use!')
      }

    } catch (error: any) {
      addResult(`❌ Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Setup Site Summary Table</h1>
        
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <p className="text-gray-300 mb-4">
            This will provide instructions to create the site_summaries table to store contact information and access instructions for each organization.
          </p>

          <button
            onClick={createSiteSummaryTable}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium"
          >
            {loading ? 'Checking...' : 'Get Setup Instructions'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Results</h2>
            <div className="space-y-2">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
