"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Check, ChevronDown, X, Plus, Database, Loader2 } from "lucide-react"
import type { Person } from "@/types/people"
import { useAddPeople } from "../hooks/use-people"

interface PeopleSelectorProps {
  allPeople: Person[]
  selectedPeople: string[]
  onSelectionChange: (people: string[]) => void
  isLoading?: boolean
}

export function PeopleSelector({
  allPeople,
  selectedPeople,
  onSelectionChange,
  isLoading = false,
}: PeopleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([])

  const addPeopleMutation = useAddPeople()

  const filteredPeople = allPeople.filter((person) => person.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const canAddNew =
    searchTerm.trim() && !allPeople.some((person) => person.name.toLowerCase() === searchTerm.trim().toLowerCase())

  const addNewPerson = () => {
    if (canAddNew) {
      const newPersonName = searchTerm.trim()
      setPendingUpdates((prev) => [...prev, newPersonName])
      setSearchTerm("")
    }
  }

  const togglePerson = (personId: string) => {
    if (selectedPeople.includes(personId)) {
      onSelectionChange(selectedPeople.filter((id) => id !== personId))
    } else {
      onSelectionChange([...selectedPeople, personId])
    }
  }

  const removePerson = (personId: string) => {
    onSelectionChange(selectedPeople.filter((id) => id !== personId))
  }

  const handleClose = async () => {
    if (pendingUpdates.length > 0) {
      try {
        // Use TanStack Query mutation to add people
        const newPeople = await addPeopleMutation.mutateAsync(pendingUpdates)

        // Auto-select the newly added people
        const newPersonIds = newPeople.map((p) => p.id)
        onSelectionChange([...selectedPeople, ...newPersonIds])

        setPendingUpdates([]) // Clear pending updates after successful save
      } catch (error) {
        console.error("Failed to save people:", error)
        // Keep pending updates on error so user can retry
        return // Don't close the dialog on error
      }
    }
    setIsOpen(false)
  }

  const isSaving = addPeopleMutation.isPending

  return (
    <div className="w-full space-y-3">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between"
        disabled={isLoading}
      >
        <span>
          {isLoading
            ? "Loading..."
            : selectedPeople.length > 0
              ? `${selectedPeople.length} people selected`
              : "Select people..."}
        </span>
        <ChevronDown className="h-4 w-4" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="p-3 space-y-3">
          {/* Search Input */}
          <Input
            placeholder="Search or add new person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAddNew) {
                addNewPerson()
              }
            }}
          />

          {/* Add New Person Button */}
          {canAddNew && (
            <Button onClick={addNewPerson} variant="outline" size="sm" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add "{searchTerm.trim()}"
            </Button>
          )}

          {/* Pending Updates Indicator */}
          {pendingUpdates.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-2">
              <p className="text-sm text-blue-700">
                <Database className="h-4 w-4 inline mr-1" />
                {pendingUpdates.length} new {pendingUpdates.length === 1 ? "person" : "people"} will be saved to
                database when you close this dialog
              </p>
              <p className="text-xs text-blue-600 mt-1">New: {pendingUpdates.join(", ")}</p>
            </div>
          )}

          {/* Error Message */}
          {addPeopleMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded p-2">
              <p className="text-sm text-red-700">
                ❌ Failed to save people: {addPeopleMutation.error?.message || "Unknown error"}
              </p>
            </div>
          )}

          {/* People List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredPeople.length === 0 && !canAddNew && (
              <p className="text-sm text-gray-500 text-center py-2">No people found</p>
            )}

            {filteredPeople.map((person) => (
              <div
                key={person.id}
                onClick={() => togglePerson(person.id)}
                className="flex items-center space-x-2 p-2 rounded hover:bg-gray-100 cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {selectedPeople.includes(person.id) && <Check className="h-4 w-4 text-blue-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{person.name}</div>
                  <div className="text-xs text-gray-500">{person.email}</div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {person.role}
                </Badge>
              </div>
            ))}

            {/* Show pending people in the list */}
            {pendingUpdates.map((name) => (
              <div
                key={`pending-${name}`}
                className="flex items-center space-x-2 p-2 rounded bg-blue-50 border-blue-200"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <Check className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{name}</div>
                  <div className="text-xs text-blue-600">Will be added to database</div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  Pending
                </Badge>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <Button onClick={handleClose} variant="outline" size="sm" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving to Database...
              </>
            ) : (
              "Done"
            )}
          </Button>
        </Card>
      )}

      {/* Selected People Badges */}
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPeople.map((personId) => {
            const person = allPeople.find((p) => p.id === personId)
            return (
              <Badge key={personId} variant="secondary" className="pr-1">
                {person?.name || "Unknown"}
                <button onClick={() => removePerson(personId)} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}
