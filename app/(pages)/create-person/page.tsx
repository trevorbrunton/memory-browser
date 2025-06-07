"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Save,
  ArrowLeft,
  User,
  Mail,
  Phone,
  Briefcase,
  Plus,
  X,
  Settings,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAddPeople } from "@/hooks/use-people";
import { AttributeSelector } from "@/components/attribute-selector";
import type { PersonAttribute } from "@/types/people";
import { Badge } from "@/components/ui/badge";

export default function CreatePersonPage() {
  const router = useRouter();
  const { toast } = useToast();
  const addPeopleMutation = useAddPeople();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    company: "",
    notes: "",
    attributes: [] as PersonAttribute[],
  });

  const handleInputChange = (
    field: string,
    value: string | PersonAttribute[]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Person name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      const personData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        role: formData.role.trim() || undefined,
        attributes: formData.attributes,
      };

      const newPeople = await addPeopleMutation.mutateAsync([personData]);

      toast({
        title: "Success",
        description: "Person created successfully",
      });

      // Navigate to the new person's details page
      if (newPeople.length > 0) {
        router.push(`/person-details/${newPeople[0].id}`);
      } else {
        router.push("/");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create person",
        variant: "destructive",
      });
    }
  };

  // Attribute management functions
  const addAttribute = () => {
    const newAttribute: PersonAttribute = { attribute: "", value: "" };
    handleInputChange("attributes", [...formData.attributes, newAttribute]);
  };

  const updateAttribute = (
    index: number,
    field: "attribute" | "value",
    value: string
  ) => {
    const updatedAttributes = [...formData.attributes];
    updatedAttributes[index] = { ...updatedAttributes[index], [field]: value };
    handleInputChange("attributes", updatedAttributes);
  };

  const removeAttribute = (index: number) => {
    const updatedAttributes = formData.attributes.filter((_, i) => i !== index);
    handleInputChange("attributes", updatedAttributes);
  };

  const canSave = formData.name.trim() && !addPeopleMutation.isPending;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button onClick={() => router.push("/")} variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold flex items-center">
            <User className="h-6 w-6 mr-2" />
            Create New Person
          </h1>
        </div>
        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="min-w-[120px]"
        >
          {addPeopleMutation.isPending ? (
            <>
              <Save className="h-4 w-4 mr-2 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Create Person
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Person Preview Panel */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center">
              <User className="h-4 w-4 mr-2" />
              Person Preview
            </h3>
            <div className="space-y-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : "?"}
                </div>
                <h4 className="font-medium text-lg">
                  {formData.name || "New Person"}
                </h4>
              </div>

              <div className="space-y-2 text-sm">
                {formData.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span>{formData.email}</span>
                  </div>
                )}
                {formData.phone && (
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{formData.phone}</span>
                  </div>
                )}
                {(formData.role || formData.company) && (
                  <div className="flex items-center text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span>
                      {formData.role && formData.company
                        ? `${formData.role} at ${formData.company}`
                        : formData.role || formData.company}
                    </span>
                  </div>
                )}
              </div>

              {formData.attributes.length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <h5 className="font-medium text-sm mb-2">Attributes:</h5>
                  <div className="flex flex-wrap gap-1">
                    {formData.attributes
                      .filter((attr) => attr.attribute && attr.value)
                      .map((attr, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {attr.attribute}: {attr.value}
                        </Badge>
                      ))}
                  </div>
                </div>
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
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
            </div>
          </Card>

          {/* Contact Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </Card>

          {/* Professional Information */}
          <Card className="p-6">
            <h3 className="font-semibold mb-4 flex items-center">
              <Briefcase className="h-4 w-4 mr-2" />
              Professional Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  placeholder="Enter job title or role"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => handleInputChange("company", e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Add any additional notes about this person..."
                rows={3}
              />
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
                  No additional attributes. Click "Add Attribute" to add
                  interests, social media, or other details.
                </p>
              ) : (
                formData.attributes.map((attr, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 border rounded-lg"
                  >
                    <div className="space-y-2">
                      <Label>Attribute</Label>
                      <AttributeSelector
                        value={attr.attribute}
                        onChange={(value) =>
                          updateAttribute(index, "attribute", value)
                        }
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
                        onChange={(e) =>
                          updateAttribute(index, "value", e.target.value)
                        }
                        placeholder="Enter value..."
                      />
                    </div>
                  </div>
                ))
              )}
            </div>

            {formData.attributes.length > 0 && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">
                  Current Attributes:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {formData.attributes
                    .filter((attr) => attr.attribute && attr.value)
                    .map((attr, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="text-xs"
                      >
                        {attr.attribute}: {attr.value}
                      </Badge>
                    ))}
                </div>
              </div>
            )}
          </Card>

          {/* Help Text */}
          <Card className="p-4 bg-purple-50 border-purple-200">
            <h4 className="font-medium text-sm mb-2 text-purple-800">
              💡 Tips for Creating People
            </h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Use full names to avoid confusion with similar names</li>
              <li>• Add contact information to easily reach out later</li>
              <li>
                • Use attributes to store birthdays, social media handles, or
                interests
              </li>
              <li>
                • Notes are great for remembering how you met or important
                details
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
