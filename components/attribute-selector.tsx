"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAttributesByEntityType, useAddAttribute } from "../hooks/use-attributes"

interface AttributeSelectorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  entityType: "person" | "event" | "place"
}

export function AttributeSelector({
  value,
  onChange,
  placeholder = "Select attribute...",
  entityType,
}: AttributeSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: allAttributes = [] } = useAttributesByEntityType(entityType)
  const addAttributeMutation = useAddAttribute()

  // Debug logging
  useEffect(() => {
    console.log(`AttributeSelector for ${entityType}:`, allAttributes.length, "attributes loaded")
    console.log(
      "Attributes:",
      allAttributes.map((attr) => ({ name: attr.name, entityType: attr.entityType })),
    )
  }, [allAttributes, entityType])

  const handleAddAttribute = async (attributeName: string) => {
    const trimmedName = attributeName.trim()
    if (trimmedName && !allAttributes.some((attr) => attr.name.toLowerCase() === trimmedName.toLowerCase())) {
      try {
        const newAttribute = await addAttributeMutation.mutateAsync({
          name: trimmedName,
          category: "Custom",
          entityType,
        })
        onChange(newAttribute.name)
        setSearchValue("")
        setOpen(false)
      } catch (error) {
        console.error("Failed to add attribute:", error)
      }
    }
  }

  const handleSetValue = (selectedValue: string) => {
    onChange(selectedValue)
    setOpen(false)
    setSearchValue("")
  }

  const filteredAttributes = allAttributes.filter((attr) => attr.name.toLowerCase().includes(searchValue.toLowerCase()))

  const showAddButton =
    searchValue.trim() && !allAttributes.some((attr) => attr.name.toLowerCase() === searchValue.trim().toLowerCase())

  const getEntityTypeLabel = (entityType: "person" | "event" | "place") => {
    const labels = {
      person: "people",
      event: "events",
      place: "places",
    }
    return labels[entityType]
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between text-left font-normal"
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 sm:w-[300px]">
        <div className="max-h-[200px] overflow-y-auto">
          {/* Search Input */}
          <div className="p-2 border-b">
            <Input
              ref={inputRef}
              placeholder={`Search ${getEntityTypeLabel(entityType)} attributes or type to add new...`}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchValue.trim()) {
                  e.preventDefault()
                  if (showAddButton) {
                    handleAddAttribute(searchValue.trim())
                  }
                }
              }}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>

          {/* Add Button */}
          {showAddButton && (
            <div className="flex items-center justify-between p-2 border-b bg-muted/50">
              <span className="text-sm text-muted-foreground">
                Add "{searchValue.trim()}" for {getEntityTypeLabel(entityType)}
              </span>
              <Button
                size="sm"
                onClick={() => handleAddAttribute(searchValue.trim())}
                disabled={addAttributeMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add
              </Button>
            </div>
          )}

          {/* Attributes List */}
          <div className="p-1">
            {filteredAttributes.length === 0 && !showAddButton && (
              <div className="p-2 text-sm text-muted-foreground text-center">
                {searchValue
                  ? `No ${getEntityTypeLabel(entityType)} attributes found`
                  : `Type to search existing ${getEntityTypeLabel(entityType)} attributes or add new ones`}
              </div>
            )}
            {filteredAttributes.map((attribute) => (
              <div
                key={attribute.id}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                onClick={() => handleSetValue(attribute.name)}
              >
                <Check className={cn("h-4 w-4", value === attribute.name ? "opacity-100" : "opacity-0")} />
                <div className="flex-1">
                  <span>{attribute.name}</span>
                  {attribute.category && (
                    <span className="ml-2 text-xs text-muted-foreground">({attribute.category})</span>
                  )}
                  {attribute.entityType === "all" && <span className="ml-1 text-xs text-blue-600">[Universal]</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
