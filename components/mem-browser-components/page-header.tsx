"use client"

import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"

interface PageHeaderProps {
  onRefresh: () => void
  isRefreshing: boolean
}

export function PageHeader({ onRefresh, isRefreshing }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h1 className="text-3xl font-bold">Cronicle Memory Browser</h1>
      <div className="flex items-center gap-2">
        <Button onClick={onRefresh} variant="outline" size="sm" disabled={isRefreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        {isRefreshing && (
          <span className="text-sm text-gray-500 flex items-center">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Syncing...
          </span>
        )}
      </div>
    </div>
  )
}
