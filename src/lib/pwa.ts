// PWA Service Worker Registration and Management

export interface PWAConfig {
  swUrl?: string
  onSuccess?: (registration: ServiceWorkerRegistration) => void
  onUpdate?: (registration: ServiceWorkerRegistration) => void
  onOffline?: () => void
  onOnline?: () => void
}

class PWAManager {
  private registration: ServiceWorkerRegistration | null = null
  private config: PWAConfig = {}

  constructor(config: PWAConfig = {}) {
    this.config = {
      swUrl: '/sw.js',
      ...config
    }
  }

  // Register service worker
  async register(): Promise<ServiceWorkerRegistration | null> {
    if (!this.isSupported()) {
      console.log('Service workers are not supported')
      return null
    }

    try {
      const registration = await navigator.serviceWorker.register(this.config.swUrl!)
      this.registration = registration

      console.log('Service Worker registered successfully:', registration)

      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker available')
              this.config.onUpdate?.(registration)
            }
          })
        }
      })

      // Check for existing service worker
      if (registration.active) {
        this.config.onSuccess?.(registration)
      }

      return registration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }

  // Unregister service worker
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false
    }

    try {
      const result = await this.registration.unregister()
      console.log('Service Worker unregistered:', result)
      this.registration = null
      return result
    } catch (error) {
      console.error('Service Worker unregistration failed:', error)
      return false
    }
  }

  // Update service worker
  async update(): Promise<void> {
    if (!this.registration) {
      return
    }

    try {
      await this.registration.update()
      console.log('Service Worker update check completed')
    } catch (error) {
      console.error('Service Worker update failed:', error)
    }
  }

  // Skip waiting and activate new service worker
  skipWaiting(): void {
    if (!this.registration?.waiting) {
      return
    }

    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  // Get service worker version
  async getVersion(): Promise<string | null> {
    if (!navigator.serviceWorker.controller) {
      return null
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data.version || null)
      }

      navigator.serviceWorker.controller?.postMessage(
        { type: 'GET_VERSION' },
        [messageChannel.port2]
      )
    })
  }

  // Check if service workers are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator
  }

  // Check if app is running in standalone mode (PWA)
  isStandalone(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true
  }

  // Setup online/offline event listeners
  setupNetworkListeners(): void {
    const handleOnline = () => {
      console.log('App is online')
      this.config.onOnline?.()
    }

    const handleOffline = () => {
      console.log('App is offline')
      this.config.onOffline?.()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial check
    if (navigator.onLine) {
      handleOnline()
    } else {
      handleOffline()
    }
  }

  // Get registration
  getRegistration(): ServiceWorkerRegistration | null {
    return this.registration
  }
}

// Offline storage management using IndexedDB
export class OfflineStorage {
  private dbName = 'itglue-offline'
  private version = 1
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Create object stores
        if (!db.objectStoreNames.contains('organizations')) {
          db.createObjectStore('organizations', { keyPath: 'id' })
        }

        if (!db.objectStoreNames.contains('pendingActions')) {
          const store = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }

        if (!db.objectStoreNames.contains('cache')) {
          const store = db.createObjectStore('cache', { keyPath: 'key' })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async store(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async get(storeName: string, key: any): Promise<any> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.get(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async delete(storeName: string, key: any): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(key)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  // Add pending action for background sync
  async addPendingAction(action: {
    url: string
    method: string
    headers?: Record<string, string>
    body?: string
    timestamp: number
  }): Promise<void> {
    await this.store('pendingActions', action)
  }

  // Get pending actions
  async getPendingActions(): Promise<any[]> {
    return this.getAll('pendingActions')
  }

  // Remove pending action
  async removePendingAction(id: number): Promise<void> {
    await this.delete('pendingActions', id)
  }
}

// Create singleton instances
export const pwaManager = new PWAManager()
export const offlineStorage = new OfflineStorage()

// Initialize PWA
export async function initializePWA(config: PWAConfig = {}): Promise<void> {
  const manager = new PWAManager(config)
  
  try {
    await manager.register()
    manager.setupNetworkListeners()
    await offlineStorage.init()
    
    console.log('PWA initialized successfully')
  } catch (error) {
    console.error('PWA initialization failed:', error)
  }
}

// Check if app should show update prompt
export function shouldShowUpdatePrompt(): boolean {
  const lastPrompt = localStorage.getItem('last-update-prompt')
  if (!lastPrompt) return true
  
  const daysSinceLastPrompt = (Date.now() - parseInt(lastPrompt)) / (1000 * 60 * 60 * 24)
  return daysSinceLastPrompt > 7 // Show every 7 days
}

// Mark update prompt as shown
export function markUpdatePromptShown(): void {
  localStorage.setItem('last-update-prompt', Date.now().toString())
}
