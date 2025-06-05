"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import {
  useAddReflection,
  useUpdateReflection,
  useDeleteReflection,
} from "@/hooks/use-memories"; // Adjusted path
import type { Memory } from "@/types/memories";
import type { Reflection } from "@/types/reflection";
import { useToast } from "@/hooks/use-toast";
import { ReflectionDialog } from "@/components/reflection-dialog"; // Adjusted path

interface ReflectionsTabProps {
  memory: Memory & { reflections?: Reflection[] }; // Assuming reflections are populated or fetched separately
}

export function ReflectionsTab({ memory }: ReflectionsTabProps) {
  const { toast } = useToast();
  const [reflectionDialog, setReflectionDialog] = useState<{
    open: boolean;
    reflection?: Reflection;
  }>({ open: false });

  // Note: Actual reflections data should be part of the `memory` prop
  // or fetched via a separate query if not already included.
  // For this example, we'll assume `memory.reflections` is an array of Reflection objects.
  const reflections = memory.reflections || [];

  const addReflectionMutation = useAddReflection();
  const updateReflectionMutation = useUpdateReflection();
  const deleteReflectionMutation = useDeleteReflection();

  const handleAddReflection = () => {
    setReflectionDialog({ open: true });
  };

  const handleEditReflection = (reflection: Reflection) => {
    setReflectionDialog({ open: true, reflection });
  };

  const handleSaveReflection = async (title: string, content: string) => {
    try {
      if (reflectionDialog.reflection) {
        await updateReflectionMutation.mutateAsync({
          reflectionId: reflectionDialog.reflection.id,
          memoryId: memory.id, // Pass memoryId for optimistic updates
          title,
          content,
        });
        toast({ title: "Success", description: "Reflection updated." });
      } else {
        await addReflectionMutation.mutateAsync({
          memoryId: memory.id,
          title,
          content,
        });
        toast({ title: "Success", description: "Reflection added." });
      }
      setReflectionDialog({ open: false });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save reflection.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteReflection = async (reflectionId: string) => {
    if (window.confirm("Are you sure you want to delete this reflection?")) {
      try {
        await deleteReflectionMutation.mutateAsync({
          memoryId: memory.id,
          reflectionId,
        });
        toast({
          title: "Success",
          description: "Reflection deleted.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete reflection.",
          variant: "destructive",
        });
      }
    }
  };

  const isMutationLoading =
    addReflectionMutation.isPending ||
    updateReflectionMutation.isPending ||
    deleteReflectionMutation.isPending;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Reflections ({reflections.length})
        </h3>
        <Button
          onClick={handleAddReflection}
          size="sm"
          disabled={isMutationLoading}
        >
          {isMutationLoading && addReflectionMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Add Reflection
        </Button>
      </div>
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm text-blue-700">
            Capture your thoughts, insights, and feelings about this memory. Add
            multiple reflections over time to see how your perspective evolves.
          </p>
        </div>

        {reflections.length > 0 ? (
          <div className="space-y-4">
            {reflections.map((reflection) => (
              <div
                key={reflection.id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-sm">{reflection.title}</h4>
                    <div className="text-xs text-gray-500">
                      {new Date(reflection.createdAt).toLocaleDateString()} at{" "}
                      {new Date(reflection.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {new Date(reflection.updatedAt).getTime() !==
                        new Date(reflection.createdAt).getTime() && (
                        <span className="ml-2 italic">
                          (edited{" "}
                          {new Date(reflection.updatedAt).toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleEditReflection(reflection)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      disabled={isMutationLoading}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteReflection(reflection.id)}
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      disabled={isMutationLoading}
                    >
                      {deleteReflectionMutation.isPending &&
                      deleteReflectionMutation.variables?.reflectionId ===
                        reflection.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
                {/* Basic Markdown-like rendering for content */}
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{
                    __html: reflection.content
                      .replace(
                        /^### (.*$)/gim,
                        '<h3 class="text-base font-semibold mt-3 mb-1">$1</h3>'
                      )
                      .replace(
                        /^## (.*$)/gim,
                        '<h2 class="text-lg font-semibold mt-3 mb-1">$1</h2>'
                      )
                      .replace(
                        /^# (.*$)/gim,
                        '<h1 class="text-xl font-bold mt-3 mb-1">$1</h1>'
                      )
                      .replace(
                        /\*\*(.*?)\*\*/g,
                        '<strong class="font-semibold">$1</strong>'
                      )
                      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
                      .replace(
                        /`(.*?)`/g,
                        '<code class="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">$1</code>'
                      )
                      .replace(
                        /^\* (.*$)/gim,
                        '<li class="ml-4 list-disc">$1</li>'
                      )
                      .replace(
                        /^\d+\. (.*$)/gim,
                        '<li class="ml-4 list-decimal"> $1</li>'
                      ) // Numbered lists
                      .replace(
                        /^> (.*$)/gim,
                        '<blockquote class="border-l-4 border-gray-300 pl-3 italic text-gray-600 my-1">$1</blockquote>'
                      )
                      .replace(/\n/g, "<br />"), // Ensure newlines are rendered
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No reflections yet for this memory.</p>
            <p className="text-xs mt-1">
              Click "Add Reflection" to share your thoughts.
            </p>
          </div>
        )}
      </div>
      <ReflectionDialog
        open={reflectionDialog.open}
        onOpenChange={(open) =>
          setReflectionDialog({ ...reflectionDialog, open })
        }
        reflection={reflectionDialog.reflection}
        onSave={handleSaveReflection}
        isLoading={
          addReflectionMutation.isPending || updateReflectionMutation.isPending
        }
      />
    </Card>
  );
}
