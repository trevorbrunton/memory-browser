"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, X, Loader2, Save } from "lucide-react";
import { usePeople } from "@/hooks/use-people"; // Adjusted path
import { useUpdateMemoryPeople } from "@/hooks/use-memories"; // New hook we'll define
import type { Memory } from "@/types/memories";
import type { Person } from "@/types/people";
import { useToast } from "@/hooks/use-toast";
import { PeopleSelector } from "@/components/people-selector"; // Adjusted path

interface PeopleTabProps {
  memory: Memory;
  allPeople: Person[];
  peopleLoading: boolean;
}

export function PeopleTab({
  memory,
  allPeople,
  peopleLoading,
}: PeopleTabProps) {
  const { toast } = useToast();
  const [selectedPeopleIds, setSelectedPeopleIds] = useState<string[]>(
    memory.peopleIds || []
  );
  const [hasChanges, setHasChanges] = useState(false);

  const updateMemoryPeopleMutation = useUpdateMemoryPeople();

  useEffect(() => {
    setSelectedPeopleIds(memory.peopleIds || []);
    setHasChanges(false);
  }, [memory.peopleIds]);

  useEffect(() => {
    setHasChanges(
      JSON.stringify(selectedPeopleIds.sort()) !==
        JSON.stringify((memory.peopleIds || []).sort())
    );
  }, [selectedPeopleIds, memory.peopleIds]);

  const handleSelectionChange = (newPeopleIds: string[]) => {
    setSelectedPeopleIds(newPeopleIds);
  };

  const handleSaveChanges = async () => {
    try {
      await updateMemoryPeopleMutation.mutateAsync({
        memoryId: memory.id,
        peopleIds: selectedPeopleIds,
      });
      toast({
        title: "Success",
        description: "People associated with the memory updated.",
      });
      setHasChanges(false); // Reset changes after successful save
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update people for the memory.",
        variant: "destructive",
      });
    }
  };

  const currentSelectedPeople = allPeople.filter((person) =>
    selectedPeopleIds.includes(person.id)
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <User className="h-4 w-4 mr-2" />
          Associated People
        </h3>
        {hasChanges && (
          <Button
            onClick={handleSaveChanges}
            disabled={updateMemoryPeopleMutation.isPending}
            size="sm"
          >
            {updateMemoryPeopleMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save People
              </>
            )}
          </Button>
        )}
      </div>

      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-700">
            Select the people who are in this photo/document or are related to
            this memory. Changes to this tab are saved independently.
          </p>
        </div>

        <PeopleSelector
          allPeople={allPeople}
          selectedPeople={selectedPeopleIds}
          onSelectionChange={handleSelectionChange}
          isLoading={peopleLoading}
        />

        {currentSelectedPeople.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-sm mb-2">Currently Associated:</h4>
            <div className="space-y-2">
              {currentSelectedPeople.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center justify-between p-2 bg-blue-50 rounded"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {person.photoUrl ? (
                        <img
                          src={person.photoUrl || "/placeholder.svg"}
                          alt={person.name}
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-medium">
                          {person.name
                            .split(" ")
                            .map((part) => part.charAt(0))
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{person.name}</div>
                      {person.role && (
                        <div className="text-xs text-gray-600">
                          {person.role}
                        </div>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const updatedPeopleIds = selectedPeopleIds.filter(
                        (id) => id !== person.id
                      );
                      handleSelectionChange(updatedPeopleIds);
                    }}
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700">
            You have unsaved changes in this tab.
          </div>
        )}
      </div>
    </Card>
  );
}
