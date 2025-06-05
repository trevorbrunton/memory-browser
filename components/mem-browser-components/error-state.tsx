"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

interface ErrorStateProps {
  title?: string
  message: string
  onRetry: () => void
}

export function ErrorState({ title = "Error Loading Data", message, onRetry }: ErrorStateProps) {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Card className="p-6 text-center">
        <h2 className="text-xl font-semibold text-red-600 mb-2">{title}</h2>
        <p className="text-gray-600 mb-4">{message}</p>
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </Card>
    </div>
  )
}
