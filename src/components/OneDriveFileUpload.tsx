'use client'

import React, { useState, useRef } from 'react'
import { Upload, X, File, CheckCircle, AlertCircle, Cloud } from 'lucide-react'

interface UploadFile {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

interface OneDriveFileUploadProps {
  organizationId: string
  organizationName: string
  category?: string
  onUploadComplete?: (document: any) => void
  onUploadError?: (error: string) => void
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  multiple?: boolean
}

export default function OneDriveFileUpload({
  organizationId,
  organizationName,
  category,
  onUploadComplete,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  allowedTypes = [],
  multiple = true
}: OneDriveFileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateId = () => Math.random().toString(36).substring(2, 15)

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`
    }

    // Check file type if restrictions are set
    if (allowedTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      const isAllowed = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return type.substring(1) === fileExtension
        }
        return file.type.startsWith(type)
      })

      if (!isAllowed) {
        return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    return null
  }

  const handleFileSelect = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles: UploadFile[] = []

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      const validationError = validateFile(file)

      newFiles.push({
        file,
        id: generateId(),
        progress: 0,
        status: validationError ? 'error' : 'pending',
        error: validationError || undefined
      })
    }

    if (multiple) {
      setFiles(prev => [...prev, ...newFiles])
    } else {
      setFiles(newFiles.slice(0, 1))
    }
  }

  const uploadFile = async (uploadFile: UploadFile) => {
    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ))

      const formData = new FormData()
      formData.append('file', uploadFile.file)
      formData.append('organizationId', organizationId)
      formData.append('organizationName', organizationName)
      formData.append('name', uploadFile.file.name)
      if (category) {
        formData.append('category', category)
      }

      const response = await fetch('/api/documents/simple-upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        // Handle authentication required
        if (errorData.authRequired && errorData.authUrl) {
          window.location.href = errorData.authUrl
          return
        }

        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()

      // Update status to completed
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'completed', progress: 100 }
          : f
      ))

      onUploadComplete?.(result.document)

    } catch (error) {
      console.error('❌ Upload error:', error)
      
      // Update status to error
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
          : f
      ))

      onUploadError?.(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const uploadAllFiles = async () => {
    setIsUploading(true)

    const pendingFiles = files.filter(f => f.status === 'pending')
    
    // Upload files sequentially to avoid overwhelming the API
    for (const file of pendingFiles) {
      await uploadFile(file)
    }

    setIsUploading(false)
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      case 'uploading':
        return <Upload className="w-5 h-5 text-blue-400 animate-pulse" />
      default:
        return <File className="w-5 h-5 text-gray-400" />
    }
  }

  const pendingCount = files.filter(f => f.status === 'pending').length
  const completedCount = files.filter(f => f.status === 'completed').length
  const errorCount = files.filter(f => f.status === 'error').length

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-blue-400 bg-blue-50/5'
            : 'border-gray-600 hover:border-gray-500'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2">
            <Cloud className="w-8 h-8 text-blue-400" />
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          
          <div>
            <h3 className="text-lg font-medium text-white mb-2">
              Upload to OneDrive Pro
            </h3>
            <p className="text-gray-400 mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Max file size: {formatFileSize(maxFileSize)}
              {allowedTypes.length > 0 && (
                <span className="block mt-1">
                  Allowed types: {allowedTypes.join(', ')}
                </span>
              )}
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Choose Files
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            accept={allowedTypes.length > 0 ? allowedTypes.join(',') : undefined}
          />
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-white">
              Files ({files.length})
            </h4>
            <div className="flex items-center space-x-2">
              {completedCount > 0 && (
                <button
                  onClick={clearCompleted}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Clear completed
                </button>
              )}
              {pendingCount > 0 && (
                <button
                  onClick={uploadAllFiles}
                  disabled={isUploading}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded text-sm"
                >
                  {isUploading ? 'Uploading...' : `Upload ${pendingCount} files`}
                </button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {files.map((uploadFile) => (
              <div
                key={uploadFile.id}
                className="flex items-center space-x-3 p-3 bg-gray-700 rounded"
              >
                {getStatusIcon(uploadFile.status)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white truncate">
                      {uploadFile.file.name}
                    </p>
                    <span className="text-xs text-gray-400">
                      {formatFileSize(uploadFile.file.size)}
                    </span>
                  </div>
                  
                  {uploadFile.status === 'uploading' && (
                    <div className="mt-1">
                      <div className="w-full bg-gray-600 rounded-full h-1">
                        <div
                          className="bg-blue-400 h-1 rounded-full transition-all"
                          style={{ width: `${uploadFile.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {uploadFile.error && (
                    <p className="text-xs text-red-400 mt-1">
                      {uploadFile.error}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => removeFile(uploadFile.id)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Summary */}
          {(completedCount > 0 || errorCount > 0) && (
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex items-center justify-between text-sm">
                {completedCount > 0 && (
                  <span className="text-green-400">
                    ✅ {completedCount} uploaded successfully
                  </span>
                )}
                {errorCount > 0 && (
                  <span className="text-red-400">
                    ❌ {errorCount} failed
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
