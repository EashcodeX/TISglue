'use client'

import { useState } from 'react'
import { PageContentService } from '@/lib/page-content-service'

export default function FixContent() {
  const [sidebarItemId, setSidebarItemId] = useState('1e2fd6f8-8acb-4492-964c-c1d04871070a')
  const [contentType, setContentType] = useState('form-data')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string>('')

  const createContent = async () => {
    setLoading(true)
    setResult('')
    
    try {
      console.log('🔧 Creating content for sidebar item:', sidebarItemId, 'with type:', contentType)
      
      const newContent = await PageContentService.createDefaultPageContent(sidebarItemId, contentType)
      
      console.log('✅ Successfully created content:', newContent)
      setResult(`✅ Success! Created ${contentType} content for sidebar item ${sidebarItemId}`)
      
    } catch (error) {
      console.error('❌ Error creating content:', error)
      setResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Fix Missing Content</h1>
      
      <div className="bg-gray-800 p-6 rounded-lg max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sidebar Item ID
            </label>
            <input
              type="text"
              value={sidebarItemId}
              onChange={(e) => setSidebarItemId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              placeholder="Enter sidebar item ID"
            />
            <p className="text-xs text-gray-400 mt-1">
              From console logs: 1e2fd6f8-8acb-4492-964c-c1d04871070a
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
            >
              {PageContentService.getContentTypes().map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={createContent}
            disabled={loading || !sidebarItemId}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-4 py-2 rounded text-white"
          >
            {loading ? 'Creating Content...' : 'Create Missing Content'}
          </button>

          {result && (
            <div className={`p-3 rounded ${
              result.startsWith('✅') ? 'bg-green-900/20 border border-green-600' : 'bg-red-900/20 border border-red-600'
            }`}>
              <pre className="text-sm">{result}</pre>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 bg-blue-900/20 border border-blue-600 rounded-lg p-4 max-w-2xl">
        <h3 className="text-blue-400 font-semibold mb-2">Instructions:</h3>
        <ol className="text-blue-200 text-sm space-y-1">
          <li>1. The sidebar item ID is pre-filled from your console logs</li>
          <li>2. Select "Custom Form" as the content type</li>
          <li>3. Click "Create Missing Content"</li>
          <li>4. Navigate back to your sidebar item and click Edit</li>
          <li>5. You should now see the Google Forms-style FormBuilder!</li>
        </ol>
      </div>
    </div>
  )
}
