"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Check,
  ChevronDown,
  X,
  Plus,
  Database,
  Loader2,
  Users,
} from "lucide-react";
import type { Person } from "@/types/people";
import { useAddPeople } from "../hooks/use-people";

interface PeopleSelectorProps {
  allPeople: Person[];
  selectedPeople: string[];
  onSelectionChange: (people: string[]) => void;
  isLoading?: boolean;
}

export function PeopleSelector({
  allPeople,
  selectedPeople,
  onSelectionChange,
  isLoading = false,
}: PeopleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [pendingUpdates, setPendingUpdates] = useState<string[]>([]);

  const addPeopleMutation = useAddPeople();

  const filteredPeople = allPeople.filter((person) =>
    person.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const canAddNew =
    searchTerm.trim() &&
    !allPeople.some(
      (person) => person.name.toLowerCase() === searchTerm.trim().toLowerCase()
    );

  const addNewPerson = () => {
    if (canAddNew) {
      const newPersonName = searchTerm.trim();
      setPendingUpdates((prev) => [...prev, newPersonName]);
      setSearchTerm("");
    }
  };

  const togglePerson = (personId: string) => {
    if (selectedPeople.includes(personId)) {
      onSelectionChange(selectedPeople.filter((id) => id !== personId));
    } else {
      onSelectionChange([...selectedPeople, personId]);
    }
  };

  const removePerson = (personId: string) => {
    onSelectionChange(selectedPeople.filter((id) => id !== personId));
  };

  const handleClose = async () => {
    if (pendingUpdates.length > 0) {
      try {
        // Use TanStack Query mutation to add people
        const newPeople = await addPeopleMutation.mutateAsync(
          pendingUpdates.map((name) => ({ name }))
        );

        // Auto-select the newly added people
        const newPersonIds = newPeople.map((p) => p.id);
        onSelectionChange([...selectedPeople, ...newPersonIds]);

        setPendingUpdates([]); // Clear pending updates after successful save
      } catch (error) {
        console.error("Failed to save people:", error);
        // Keep pending updates on error so user can retry
        return; // Don't close the dialog on error
      }
    }
    setIsOpen(false);
  };

  const isSaving = addPeopleMutation.isPending;

  return (
    <div className="w-full space-y-2">
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between h-8 text-xs border-slate-200"
        disabled={isLoading}
      >
        <div className="flex items-center space-x-1">
          <Users className="h-3 w-3 text-slate-500" />
          <span>
            {isLoading
              ? "Loading..."
              : selectedPeople.length > 0
              ? `${selectedPeople.length} people selected`
              : "Select people..."}
          </span>
        </div>
        <ChevronDown className="h-3 w-3 text-slate-400" />
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="p-3 space-y-3 shadow-sm border-slate-200">
          {/* Search Input */}
          <Input
            placeholder="Search or add new person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canAddNew) {
                addNewPerson();
              }
            }}
            className="h-8 text-xs border-slate-200"
          />

          {/* Add New Person Button */}
          {canAddNew && (
            <Button
              onClick={addNewPerson}
              variant="outline"
              size="sm"
              className="w-full h-7 text-xs border-dashed border-slate-300 text-slate-600"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add "{searchTerm.trim()}"
            </Button>
          )}

          {/* Pending Updates Indicator */}
          {pendingUpdates.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded p-2 text-xs">
              <p className="text-slate-700 flex items-center">
                <Database className="h-3 w-3 mr-1" />
                {pendingUpdates.length} new{" "}
                {pendingUpdates.length === 1 ? "person" : "people"} will be
                saved
              </p>
              <p className="text-slate-600 mt-1 bg-white rounded px-1.5 py-0.5 text-xs">
                New: {pendingUpdates.join(", ")}
              </p>
            </div>
          )}

          {/* Error Message */}
          {addPeopleMutation.isError && (
            <div className="bg-red-50 border border-red-100 rounded p-2">
              <p className="text-xs text-red-600">
                Failed to save people:{" "}
                {addPeopleMutation.error?.message || "Unknown error"}
              </p>
            </div>
          )}

          {/* People List */}
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredPeople.length === 0 && !canAddNew && (
              <p className="text-xs text-slate-500 text-center py-3">
                No people found
              </p>
            )}

            {filteredPeople.map((person) => (
              <div
                key={person.id}
                onClick={() => togglePerson(person.id)}
                className="flex items-center space-x-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  {selectedPeople.includes(person.id) && (
                    <div className="w-3 h-3 bg-slate-700 rounded-sm flex items-center justify-center">
                      <Check className="h-2 w-2 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-700">
                    {person.name}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {person.email}
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className="text-[10px] bg-slate-50 text-slate-600 border-slate-200 px-1 py-0"
                >
                  {person.role}
                </Badge>
              </div>
            ))}

            {/* Show pending people in the list */}
            {pendingUpdates.map((name) => (
              <div
                key={`pending-${name}`}
                className="flex items-center space-x-2 p-1.5 rounded bg-slate-50 border border-slate-200"
              >
                <div className="w-4 h-4 flex items-center justify-center">
                  <div className="w-3 h-3 bg-slate-700 rounded-sm flex items-center justify-center">
                    <Check className="h-2 w-2 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-slate-700">
                    {name}
                  </div>
                  <div className="text-[10px] text-slate-600">
                    Will be added to database
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="text-[10px] bg-slate-100 text-slate-600 px-1 py-0"
                >
                  Pending
                </Badge>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <Button
            onClick={handleClose}
            variant="outline"
            size="sm"
            className="w-full h-7 text-xs bg-slate-50 border-slate-200"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              "Done"
            )}
          </Button>
        </Card>
      )}

      {/* Selected People Badges */}
      {selectedPeople.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedPeople.map((personId) => {
            const person = allPeople.find((p) => p.id === personId);
            return (
              <Badge
                key={personId}
                variant="secondary"
                className="pr-0.5 text-xs bg-slate-100 text-slate-700 border-0"
              >
                {person?.name || "Unknown"}
                <button
                  onClick={() => removePerson(personId)}
                  className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                >
                  <X className="h-2 w-2" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
