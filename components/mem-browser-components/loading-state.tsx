"use client"

import { Loader2 } from "lucide-react"

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = "Loading..." }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin mr-3" />
      <span className="text-lg">{message}</span>
    </div>
  )
}
