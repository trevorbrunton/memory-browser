"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Check, ChevronsUpDown, X, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

interface Person {
  label: string
  value: string
}

interface MultipleSelectorProps {
  options: Person[]
  value: string[]
  onChange: (value: string[]) => void
}

export function PeopleMultipleSelector({ options, value, onChange }: MultipleSelectorProps) {
  const [localOptions, setLocalOptions] = useState(options || [])
  const [open, setOpen] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalOptions(options || [])
  }, [options])

  const handleAddPerson = async (person: string) => {
    const trimmedPerson = person.trim()
    if (trimmedPerson && !localOptions.some((option) => option.value.toLowerCase() === trimmedPerson.toLowerCase())) {
      const newOption = { label: trimmedPerson, value: trimmedPerson }
      const updatedOptions = [...localOptions, newOption]
      setLocalOptions(updatedOptions)
      onChange([...value, trimmedPerson])
      setSearchValue("")

      // TODO: Implement actual person creation logic here
      console.log("Creating person:", trimmedPerson)
    }
  }

  const handleSetValue = (selectedValue: string) => {
    if (value.includes(selectedValue)) {
      onChange(value.filter((v) => v !== selectedValue))
    } else {
      onChange([...value, selectedValue])
    }
  }

  const removeValue = (valueToRemove: string) => {
    onChange(value.filter((v) => v !== valueToRemove))
  }

  const filteredOptions = localOptions.filter((option) =>
    option.label.toLowerCase().includes(searchValue.toLowerCase()),
  )

  const showAddButton =
    searchValue.trim() &&
    !localOptions.some((option) => option.value.toLowerCase() === searchValue.trim().toLowerCase())

  return (
    <div className="w-full space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            <span className="truncate">{value.length > 0 ? `${value.length} selected` : "Select people..."}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 sm:w-[480px]">
          <div className="max-h-[300px] overflow-y-auto">
            {/* Search Input */}
            <div className="p-2 border-b">
              <Input
                ref={inputRef}
                placeholder="Search people or type to add new..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchValue.trim()) {
                    e.preventDefault()
                    handleAddPerson(searchValue.trim())
                  }
                }}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Add Button */}
            {showAddButton && (
              <div className="flex items-center justify-between p-2 border-b bg-muted/50">
                <span className="text-sm text-muted-foreground">Add "{searchValue.trim()}"</span>
                <Button size="sm" onClick={() => handleAddPerson(searchValue.trim())}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>
            )}

            {/* Options List */}
            <div className="p-1">
              {filteredOptions.length === 0 && !showAddButton && (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {searchValue ? "No people found" : "Type to search existing people or add new ones"}
                </div>
              )}
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="flex items-center space-x-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    handleSetValue(option.value)
                    setSearchValue("")
                  }}
                >
                  <Check className={cn("h-4 w-4", value.includes(option.value) ? "opacity-100" : "opacity-0")} />
                  <span className="flex-1">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <div className="flex flex-wrap gap-2">
        {value.map((val) => (
          <Badge key={val} variant="secondary" className="animate-fadeIn">
            {val}
            <button
              className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  removeValue(val)
                }
              }}
              onMouseDown={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
              onClick={() => removeValue(val)}
            >
              <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}
