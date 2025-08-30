'use client'

import { useState } from 'react'
import { Database, CheckCircle, AlertCircle, Play, Copy } from 'lucide-react'

export default function SetupDatabaseDirect() {
  const [results, setResults] = useState<string[]>([])
  const [showSQL, setShowSQL] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, message])
  }

  const sqlCommands = `
-- 1. Create users table
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

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- 2. Create user_organizations junction table
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

-- Create indexes for user_organizations table
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_role ON user_organizations(role);
CREATE INDEX IF NOT EXISTS idx_user_organizations_is_active ON user_organizations(is_active);

-- 3. Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE passwords ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;

-- Enable RLS on other tables if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assets') THEN
    ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'locations') THEN
    ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ssl_certificates') THEN
    ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'domains') THEN
    ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'microsoft_tokens') THEN
    ALTER TABLE microsoft_tokens ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'onedrive_sync_log') THEN
    ALTER TABLE onedrive_sync_log ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 4. Create RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 5. Create RLS policies for user_organizations table
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON user_organizations;
CREATE POLICY "Users can view their own organization memberships" ON user_organizations
  FOR SELECT USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own organization memberships" ON user_organizations;
CREATE POLICY "Users can insert their own organization memberships" ON user_organizations
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own organization memberships" ON user_organizations;
CREATE POLICY "Users can update their own organization memberships" ON user_organizations
  FOR UPDATE USING (user_id = auth.uid()::text);

-- 6. Create RLS policies for organizations table
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can insert organizations" ON organizations;
CREATE POLICY "Users can insert organizations" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Users can update their organizations" ON organizations;
CREATE POLICY "Users can update their organizations" ON organizations
  FOR UPDATE USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can delete their organizations" ON organizations;
CREATE POLICY "Users can delete their organizations" ON organizations
  FOR DELETE USING (
    id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

-- 7. Create RLS policies for documents table
DROP POLICY IF EXISTS "Users can view documents in their organizations" ON documents;
CREATE POLICY "Users can view documents in their organizations" ON documents
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
    OR is_public = true
  );

DROP POLICY IF EXISTS "Users can insert documents in their organizations" ON documents;
CREATE POLICY "Users can insert documents in their organizations" ON documents
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can update documents in their organizations" ON documents;
CREATE POLICY "Users can update documents in their organizations" ON documents
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can delete documents in their organizations" ON documents;
CREATE POLICY "Users can delete documents in their organizations" ON documents
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

-- 8. Create RLS policies for passwords table
DROP POLICY IF EXISTS "Users can manage passwords in their organizations" ON passwords;
CREATE POLICY "Users can manage passwords in their organizations" ON passwords
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

-- 9. Create RLS policies for other tables
DROP POLICY IF EXISTS "Users can manage configurations in their organizations" ON configurations;
CREATE POLICY "Users can manage configurations in their organizations" ON configurations
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can manage contacts in their organizations" ON contacts;
CREATE POLICY "Users can manage contacts in their organizations" ON contacts
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations 
      WHERE user_id = auth.uid()::text AND is_active = true
    )
  );

-- 10. Create function to automatically create user profile on signup
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

-- 11. Insert existing auth users into users table if they don't exist
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCommands)
    addResult('📋 SQL commands copied to clipboard!')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center space-x-4 mb-8">
          <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Database Setup - Manual SQL</h1>
            <p className="text-gray-400">Run these SQL commands directly in your Supabase SQL editor</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Instructions */}
          <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-6">
            <h2 className="text-blue-400 font-semibold mb-4">📋 Setup Instructions</h2>
            <ol className="text-blue-200 space-y-2 list-decimal list-inside">
              <li>Go to your Supabase project dashboard</li>
              <li>Navigate to the SQL Editor</li>
              <li>Copy the SQL commands below</li>
              <li>Paste and run them in the SQL editor</li>
              <li>Verify the setup completed successfully</li>
            </ol>
          </div>

          {/* SQL Commands */}
          <div className="bg-gray-800 rounded-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold">SQL Commands</h2>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy All</span>
                </button>
                <button
                  onClick={() => setShowSQL(!showSQL)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
                >
                  {showSQL ? 'Hide' : 'Show'} SQL
                </button>
              </div>
            </div>
            
            {showSQL && (
              <div className="p-4">
                <pre className="bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm">
                  <code className="text-green-400">{sqlCommands}</code>
                </pre>
              </div>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-lg">
              <h2 className="text-lg font-semibold mb-4">Results</h2>
              <div className="space-y-2">
                {results.map((result, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm font-mono">{result}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What This Does */}
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-4">What This Setup Does</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h3 className="font-semibold text-green-400 mb-2">Tables Created:</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• <code>users</code> - User profiles and roles</li>
                  <li>• <code>user_organizations</code> - User-org relationships</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-blue-400 mb-2">Security Features:</h3>
                <ul className="space-y-1 text-gray-300">
                  <li>• Row Level Security (RLS) enabled</li>
                  <li>• User-based access control</li>
                  <li>• Organization-scoped data access</li>
                  <li>• Automatic user profile creation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
