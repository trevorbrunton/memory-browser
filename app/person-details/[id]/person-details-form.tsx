"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Save, User, Calendar, Heart, Users, Plus, X, Settings } from "lucide-react"

import { PeopleMultipleSelector } from "@/components/people-multiple-selector"
import { AttributeSelector } from "@/components/attribute-selector"
import type { Person, PersonAttribute } from "@/types/people"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"




interface PersonDetailsFormProps {
  person: Person
}

export function PersonDetailsForm({ person }: PersonDetailsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { data: allPeople = [] } = usePeople()
  const updatePersonMutation = useUpdatePersonDetails()

  // Form state
  const [formData, setFormData] = useState({
    name: person.name || "",
    email: person.email || "",
    role: person.role || "",
    dateOfBirth: person.dateOfBirth || "",
    placeOfBirth: person.placeOfBirth || "",
    maritalStatus: person.maritalStatus || "single",
    spouseId: person.spouseId || "",
    childrenIds: person.childrenIds || [],
    attributes: person.attributes || [],
  })

  const [hasChanges, setHasChanges] = useState(false)

  // Update form data when person changes
  useEffect(() => {
    setFormData({
      name: person.name || "",
      email: person.email || "",
      role: person.role || "",
      dateOfBirth: person.dateOfBirth || "",
      placeOfBirth: person.placeOfBirth || "",
      maritalStatus: person.maritalStatus || "single",
      spouseId: person.spouseId || "",
      childrenIds: person.childrenIds || [],
      attributes: person.attributes || [],
    })
    setHasChanges(false)
  }, [person])

  // Check for changes
  useEffect(() => {
    const hasFormChanges =
      formData.name !== (person.name || "") ||
      formData.email !== (person.email || "") ||
      formData.role !== (person.role || "") ||
      formData.dateOfBirth !== (person.dateOfBirth || "") ||
      formData.placeOfBirth !== (person.placeOfBirth || "") ||
      formData.maritalStatus !== (person.maritalStatus || "single") ||
      formData.spouseId !== (person.spouseId || "") ||
      JSON.stringify(formData.childrenIds) !== JSON.stringify(person.childrenIds || []) ||
      JSON.stringify(formData.attributes) !== JSON.stringify(person.attributes || [])

    setHasChanges(hasFormChanges)
  }, [formData, person])

  const handleInputChange = (field: string, value: string | string[] | PersonAttribute[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      const updates = {
        ...formData,
        // Clear spouse if not married
        spouseId: formData.maritalStatus === "married" ? formData.spouseId : undefined,
      }

      await updatePersonMutation.mutateAsync({
        id: person.id,
        updates,
      })

      toast({
        title: "Success",
        description: "Person details updated successfully",
      })

      // Navigate back to main page after successful save
      router.push("/")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update person details",
        variant: "destructive",
      })
    }
  }

  // Attribute management functions
  const addAttribute = () => {
    const newAttribute: PersonAttribute = { attribute: "", value: "" }
    handleInputChange("attributes", [...formData.attributes, newAttribute])
  }

  const updateAttribute = (index: number, field: "attribute" | "value", value: string) => {
    const updatedAttributes = [...formData.attributes]
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value }
    handleInputChange("attributes", updatedAttributes)
  }

  const removeAttribute = (index: number) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index)
    handleInputChange("attributes", updatedAttributes)
  }

  // Get spouse options (exclude current person and children)
  const spouseOptions = allPeople
    .filter((p) => p.id !== person.id && !formData.childrenIds.includes(p.id))
    .map((p) => ({ label: p.name, value: p.id }))

  // Get children options (exclude current person and spouse)
  const childrenOptions = allPeople
    .filter((p) => p.id !== person.id && p.id !== formData.spouseId)
    .map((p) => ({ label: p.name, value: p.id }))

  const spouse = allPeople.find((p) => p.id === formData.spouseId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Photo Panel */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="font-semibold flex items-center">
            <User className="h-4 w-4 mr-2" />
            Profile Photo
          </h3>
          <div className="flex justify-center">
            <div className="w-48 h-48 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
              {person.photoUrl ? (
                <img
                  src={person.photoUrl || "/placeholder.svg"}
                  alt={person.name}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-4xl font-bold">
                  {person.name
                    .split(" ")
                    .map((part) => part.charAt(0))
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
              )}
            </div>
          </div>
          <div className="text-center space-y-2">
            <h4 className="font-medium text-lg">{person.name}</h4>
            {person.role && (
              <Badge variant="outline" className="text-sm">
                {person.role}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Details Form */}
      <div className="lg:col-span-2 space-y-6">
        {/* Basic Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter full name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value)}
                placeholder="Enter role or job title"
              />
            </div>
          </div>
        </Card>

        {/* Personal Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Personal Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="placeOfBirth">Place of Birth</Label>
              <Input
                id="placeOfBirth"
                value={formData.placeOfBirth}
                onChange={(e) => handleInputChange("placeOfBirth", e.target.value)}
                placeholder="Enter place of birth"
              />
            </div>
          </div>
        </Card>

        {/* Family Information */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center">
            <Heart className="h-4 w-4 mr-2" />
            Family Information
          </h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maritalStatus">Marital Status</Label>
              <Select
                value={formData.maritalStatus}
                onValueChange={(value) => handleInputChange("maritalStatus", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select marital status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Single</SelectItem>
                  <SelectItem value="married">Married</SelectItem>
                  <SelectItem value="divorced">Divorced</SelectItem>
                  <SelectItem value="widowed">Widowed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.maritalStatus === "married" && (
              <div className="space-y-2">
                <Label htmlFor="spouse">Spouse</Label>
                <Select value={formData.spouseId} onValueChange={(value) => handleInputChange("spouseId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select spouse" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-spouse">No spouse selected</SelectItem>
                    {spouseOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {spouse && (
                  <p className="text-sm text-gray-600">
                    Currently married to: <span className="font-medium">{spouse.name}</span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Children
              </Label>
              <PeopleMultipleSelector
                options={childrenOptions}
                value={formData.childrenIds}
                onChange={(value) => handleInputChange("childrenIds", value)}
              />
              {formData.childrenIds.length > 0 && (
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Children:</p>
                  <ul className="list-disc list-inside ml-2">
                    {formData.childrenIds.map((childId) => {
                      const child = allPeople.find((p) => p.id === childId)
                      return <li key={childId}>{child?.name || "Unknown"}</li>
                    })}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Other Details */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Other Details
            </h3>
            <Button onClick={addAttribute} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Attribute
            </Button>
          </div>

          <div className="space-y-4">
            {formData.attributes.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">
                No additional attributes. Click "Add Attribute" to add demographic or personal details.
              </p>
            ) : (
              formData.attributes.map((attr, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Label>Attribute</Label>
                    <AttributeSelector
                      value={attr.attribute}
                      onChange={(value) => updateAttribute(index, "attribute", value)}
                      placeholder="Select or add attribute..."
                      entityType="person"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Value</Label>
                      <Button
                        onClick={() => removeAttribute(index)}
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <Input
                      value={attr.value}
                      onChange={(e) => updateAttribute(index, "value", e.target.value)}
                      placeholder="Enter value..."
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {formData.attributes.length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm mb-2">Current Attributes:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.attributes
                  .filter((attr) => attr.attribute && attr.value)
                  .map((attr, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {attr.attribute}: {attr.value}
                    </Badge>
                  ))}
              </div>
            </div>
          )}
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updatePersonMutation.isPending}
            className="min-w-[120px]"
          >
            {updatePersonMutation.isPending ? (
              <>
                <Save className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="text-sm text-yellow-700">
              You have unsaved changes. Click "Save Changes" to update the person details.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
function usePeople(): { data?: Person[] } {
  const [data, setData] = useState<Person[] | undefined>(undefined)

  useEffect(() => {
    async function fetchPeople() {
      try {
        const res = await fetch("/api/people")
        if (!res.ok) throw new Error("Failed to fetch people")
        const people = await res.json()
        setData(people)
      } catch {
        setData([])
      }
    }
    fetchPeople()
  }, [])

  return { data }
}
type UpdatePersonArgs = {
  id: string
  updates: Partial<Person>
}

function useUpdatePersonDetails() {
  const [isPending, setIsPending] = useState(false)

  async function mutateAsync({ id, updates }: UpdatePersonArgs) {
    setIsPending(true)
    try {
      const res = await fetch(`/api/people/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error("Failed to update person")
      return await res.json()
    } finally {
      setIsPending(false)
    }
  }

  return { mutateAsync, isPending }
}

