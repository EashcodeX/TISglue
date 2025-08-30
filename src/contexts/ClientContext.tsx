'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { type Organization } from '@/lib/supabase'

interface ClientContextType {
  selectedClient: Organization | null
  setSelectedClient: (client: Organization | null) => void
  isClientSelected: boolean
  clearSelectedClient: () => void
}

const ClientContext = createContext<ClientContextType | undefined>(undefined)

export function ClientProvider({ children }: { children: React.ReactNode }) {
  const [selectedClient, setSelectedClient] = useState<Organization | null>(null)

  // Load selected client from localStorage on mount
  useEffect(() => {
    const savedClient = localStorage.getItem('selectedClient')
    if (savedClient) {
      try {
        setSelectedClient(JSON.parse(savedClient))
      } catch (error) {
        console.error('Error parsing saved client:', error)
        localStorage.removeItem('selectedClient')
      }
    }
  }, [])

  // Save selected client to localStorage when it changes
  useEffect(() => {
    if (selectedClient) {
      localStorage.setItem('selectedClient', JSON.stringify(selectedClient))
    } else {
      localStorage.removeItem('selectedClient')
    }
  }, [selectedClient])

  const clearSelectedClient = () => {
    setSelectedClient(null)
  }

  const value: ClientContextType = {
    selectedClient,
    setSelectedClient,
    isClientSelected: !!selectedClient,
    clearSelectedClient
  }

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (context === undefined) {
    throw new Error('useClient must be used within a ClientProvider')
  }
  return context
}

// Hook to get client initials for display
export function useClientInitials(name: string) {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

// Hook to get client color
export function useClientColor(name: string) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-red-500',
    'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500', 'bg-teal-500',
    'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500',
    'bg-violet-500', 'bg-amber-500', 'bg-emerald-500', 'bg-sky-500'
  ]

  // Create a simple hash from the name for better color distribution
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    const char = name.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % colors.length
  return colors[index]
}
