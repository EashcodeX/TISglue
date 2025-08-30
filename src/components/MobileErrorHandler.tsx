'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'

interface MobileErrorHandlerProps {
  children: React.ReactNode
}

export default function MobileErrorHandler({ children }: MobileErrorHandlerProps) {
  const [isOnline, setIsOnline] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    // Monitor network status
    const handleOnline = () => {
      setIsOnline(true)
      setHasError(false)
      setRetryCount(0)
    }
    
    const handleOffline = () => {
      setIsOnline(false)
    }

    // Listen for network changes
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check initial network status
    setIsOnline(navigator.onLine)

    // Global fetch error handler
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // Reset error state on successful fetch
        if (response.ok) {
          setHasError(false)
          setRetryCount(0)
        }
        
        return response
      } catch (error) {
        console.error('Fetch error caught by mobile handler:', error)
        setHasError(true)
        throw error
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.fetch = originalFetch
    }
  }, [])

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    setHasError(false)
    // Trigger a page refresh to retry failed requests
    window.location.reload()
  }

  // Show offline indicator
  if (!isOnline) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <WifiOff className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">You're Offline</h2>
          <p className="text-gray-400 mb-6">
            Check your internet connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg mx-auto transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      </div>
    )
  }

  // Show error state with retry option
  if (hasError && retryCount < 3) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-400 mb-6">
            Something went wrong. This might be a temporary network issue.
          </p>
          <div className="space-y-3">
            <button
              onClick={handleRetry}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg mx-auto transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry ({retryCount + 1}/3)</span>
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="block text-gray-400 hover:text-white transition-colors mx-auto"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Network status indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-red-600 text-white text-center py-2 text-sm z-50">
          <div className="flex items-center justify-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <span>No internet connection</span>
          </div>
        </div>
      )}
      
      {/* Connection restored indicator */}
      {isOnline && hasError && (
        <div className="fixed top-0 left-0 right-0 bg-green-600 text-white text-center py-2 text-sm z-50">
          <div className="flex items-center justify-center space-x-2">
            <Wifi className="w-4 h-4" />
            <span>Connection restored</span>
          </div>
        </div>
      )}
      
      {children}
    </>
  )
}
