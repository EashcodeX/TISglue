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
    '#3B82F6', // blue-500
    '#10B981', // green-500
    '#8B5CF6', // purple-500
    '#EF4444', // red-500
    '#F59E0B', // yellow-500
    '#6366F1', // indigo-500
    '#EC4899', // pink-500
    '#14B8A6', // teal-500
    '#F97316', // orange-500
    '#06B6D4', // cyan-500
    '#84CC16', // lime-500
    '#F43F5E', // rose-500
    '#8B5CF6', // violet-500
    '#F59E0B', // amber-500
    '#10B981', // emerald-500
    '#0EA5E9'  // sky-500
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
