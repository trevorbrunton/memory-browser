"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react"

interface FileUploadProps {
  onFileSelected: (file: File) => void
  accept?: string
  maxSize?: number // in bytes
  className?: string
}

export function FileUpload({
  onFileSelected,
  accept = "image/*,application/pdf",
  maxSize = 10485760,
  className = "",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize) {
      setError(`File size exceeds ${maxSize / 1048576}MB limit`)
      return false
    }

    // Check file type
    const acceptedTypes = accept.split(",").map((type) => type.trim())
    const fileType = file.type

    // Handle wildcards like "image/*"
    const isAccepted = acceptedTypes.some((type) => {
      if (type.endsWith("/*")) {
        const category = type.split("/")[0]
        return fileType.startsWith(`${category}/`)
      }
      return type === fileType
    })

    if (!isAccepted) {
      setError("File type not supported")
      return false
    }

    return true
  }

  const processFile = (file: File) => {
    if (validateFile(file)) {
      setFile(file)
      setError(null)

      // Simulate upload progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setUploadProgress(progress)

        if (progress >= 100) {
          clearInterval(interval)
          onFileSelected(file)
        }
      }, 100)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      processFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      processFile(selectedFile)
    }
  }

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setUploadProgress(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " bytes"
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
    else return (bytes / 1048576).toFixed(1) + " MB"
  }

  const getFileIcon = () => {
    if (!file) return <UploadIcon className="h-8 w-8 text-slate-400" />

    if (file.type.startsWith("image/")) {
      return <ImageIcon className="h-8 w-8 text-slate-600" />
    } else {
      return <FileIcon className="h-8 w-8 text-slate-600" />
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {!file ? (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragging ? "border-slate-400 bg-slate-100" : "border-slate-200 hover:border-slate-300"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          <input ref={fileInputRef} type="file" className="hidden" accept={accept} onChange={handleFileChange} />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-2 bg-slate-100 rounded-full">
              <UploadIcon className="h-8 w-8 text-slate-500" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">
                {isDragging ? "Drop your file here" : "Drag and drop your file here"}
              </p>
              <p className="text-xs text-slate-500">or click to browse your files</p>
              <p className="text-xs text-slate-400 bg-slate-50 rounded-full px-2 py-0.5 inline-block mt-1">
                Supports {accept.replace(/,/g, ", ")} up to {maxSize / 1048576}MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-slate-200 rounded-md p-3 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-slate-100 rounded-md">{getFileIcon()}</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">{file.name}</p>
              <p className="text-xs text-slate-500 mb-1">{formatFileSize(file.size)}</p>
              <div className="space-y-1">
                <Progress value={uploadProgress} className="h-1.5 bg-slate-200" />
                <p className="text-xs text-slate-500">{uploadProgress}% uploaded</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-full hover:bg-slate-200 hover:text-slate-700"
              onClick={handleRemoveFile}
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Remove file</span>
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-md">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  )
}
