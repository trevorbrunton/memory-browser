"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { FileIcon, ExternalLinkIcon, DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MediaPreviewProps {
  mediaType: "photo" | "document"
  mediaUrl: string
  mediaName: string
  className?: string
  aspectRatio?: "auto" | "square" | "video" | "wide"
}

export function MediaPreview({
  mediaType,
  mediaUrl,
  mediaName,
  className = "",
  aspectRatio = "auto",
}: MediaPreviewProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "video":
        return "aspect-video"
      case "wide":
        return "aspect-[16/9]"
      default:
        return "aspect-auto"
    }
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = mediaUrl
    link.download = mediaName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleOpenFullscreen = () => {
    setIsFullscreen(true)
  }

  const handleCloseFullscreen = () => {
    setIsFullscreen(false)
  }

  return (
    <>
      <Card className={`overflow-hidden ${className}`}>
        <div className="relative">
          {mediaType === "photo" ? (
            <div className={`${getAspectRatioClass()} overflow-hidden bg-gray-100`}>
              <img
                src={mediaUrl || "/placeholder.svg"}
                alt={mediaName}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
              />
            </div>
          ) : (
            <div className="p-8 flex flex-col items-center justify-center bg-gray-50">
              <FileIcon className="h-16 w-16 text-orange-500 mb-2" />
              <p className="text-sm font-medium text-center truncate max-w-full">{mediaName}</p>
            </div>
          )}

          <div className="absolute bottom-2 right-2 flex space-x-1">
            {mediaType === "photo" && (
              <Button
                variant="secondary"
                size="sm"
                className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white"
                onClick={handleOpenFullscreen}
              >
                <ExternalLinkIcon className="h-4 w-4" />
                <span className="sr-only">View fullscreen</span>
              </Button>
            )}
            <Button
              variant="secondary"
              size="sm"
              className="h-8 w-8 p-0 rounded-full bg-white/80 hover:bg-white"
              onClick={handleDownload}
            >
              <DownloadIcon className="h-4 w-4" />
              <span className="sr-only">Download</span>
            </Button>
          </div>
        </div>
      </Card>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={handleCloseFullscreen}
        >
          <div className="max-w-full max-h-full overflow-auto">
            <img
              src={mediaUrl || "/placeholder.svg"}
              alt={mediaName}
              className="max-w-full max-h-[90vh] object-contain"
              crossOrigin="anonymous"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 h-8 w-8 p-0 rounded-full bg-white/20 hover:bg-white/40"
            onClick={handleCloseFullscreen}
          >
            <span className="sr-only">Close</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </Button>
        </div>
      )}
    </>
  )
}
