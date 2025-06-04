"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, MessageSquare, Save, X } from "lucide-react"
import type { Reflection } from "@/types/reflection"

interface ReflectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reflection?: Reflection
  onSave: (title: string, content: string) => Promise<void>
  isLoading?: boolean
}

export function ReflectionDialog({ open, onOpenChange, reflection, onSave, isLoading = false }: ReflectionDialogProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const isEditing = !!reflection

  // Reset form when dialog opens/closes or reflection changes
  useEffect(() => {
    if (open) {
      setTitle(reflection?.title || "")
      setContent(reflection?.content || "")
      setHasChanges(false)
    } else {
      // Clear form when dialog closes
      setTitle("")
      setContent("")
      setHasChanges(false)
    }
  }, [open, reflection])

  // Track changes
  useEffect(() => {
    const titleChanged = title !== (reflection?.title || "")
    const contentChanged = content !== (reflection?.content || "")
    setHasChanges(titleChanged || contentChanged)
  }, [title, content, reflection])

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return
    }

    try {
      await onSave(title.trim(), content.trim())
      onOpenChange(false)
    } catch (error) {
      // Error handling is done in the parent component
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const canSave = title.trim() && content.trim() && hasChanges && !isLoading

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            {isEditing ? "Edit Reflection" : "Add New Reflection"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-700">
              {isEditing
                ? "Update your reflection with new insights or thoughts about this memory."
                : "Capture your thoughts, feelings, and insights about this memory. You can add multiple reflections over time to see how your perspective evolves."}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reflection-title">Reflection Title *</Label>
            <Input
              id="reflection-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., 'First Impressions', 'Looking Back', 'What I Learned'"
              maxLength={100}
            />
            <p className="text-xs text-gray-500">Give your reflection a descriptive title (max 100 characters)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reflection-content">Reflection Content *</Label>
            <Textarea
              id="reflection-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, feelings, insights, or what this memory means to you..."
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-gray-500">
              You can use simple formatting: **bold**, *italic*, `code`, &gt; quotes, and bullet points with *
            </p>
          </div>

          {/* Character counts */}
          <div className="flex justify-between text-xs text-gray-500">
            <span>Title: {title.length}/100</span>
            <span>Content: {content.length} characters</span>
          </div>

          {/* Preview section for editing */}
          {isEditing && reflection && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Original Reflection:</h4>
              <div className="bg-gray-50 rounded p-3 text-sm">
                <div className="font-medium mb-1">{reflection.title}</div>
                <div className="text-gray-600 text-xs mb-2">
                  Created: {reflection.createdAt.toLocaleDateString()} at {reflection.createdAt.toLocaleTimeString()}
                  {reflection.updatedAt.getTime() !== reflection.createdAt.getTime() && (
                    <span className="ml-2">(Last edited: {reflection.updatedAt.toLocaleDateString()})</span>
                  )}
                </div>
                <div className="whitespace-pre-wrap">{reflection.content}</div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500">{hasChanges && <span>• Unsaved changes</span>}</div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleCancel} variant="outline" disabled={isLoading}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!canSave} className="min-w-[100px]">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update" : "Add"} Reflection
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
