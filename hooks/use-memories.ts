// hooks/use-memories.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memory, MediaType } from "../types/memories";
import type { Reflection } from "../types/reflection";
import * as memoriesActions from "../app/actions/memories";

// --- Context Types for Mutations ---
interface MemoryMutationContext {
  previousMemories?: Memory[];
  previousMemory?: Memory | null;
}

interface ReflectionMutationContext {
  // Though not used in onError for reflections in prev. example, good practice if it were
  previousMemory?: Memory | null;
}

// --- Query Hooks ---
export function useMemories() {
  return useQuery<Memory[], Error>({
    queryKey: ["memories"],
    queryFn: () => memoriesActions.getAllMemories(),
  });
}

export function useMemoryDetails(id: string) {
  return useQuery<Memory | null, Error>({
    queryKey: ["memory", id],
    queryFn: () => memoriesActions.getMemoryDetails(id),
    enabled: !!id,
  });
}

// --- DTOs for Mutations ---
interface AddMemoryDTO {
  title: string;
  description?: string;
  mediaType: MediaType;
  mediaUrl: string;
  mediaName: string;
  mediaSize: number;
  date: Date;
  peopleIds: string[];
  placeId?: string;
  eventId?: string;
}

interface AddMemoryWithFileDTO {
  file: File;
  memoryData: Omit<
    AddMemoryDTO,
    "mediaType" | "mediaUrl" | "mediaName" | "mediaSize"
  >;
}

interface UpdateMemoryDetailsDTO {
  id: string;
  updates: Pick<Memory, "title" | "description" | "date">;
}

interface UpdateMemoryPeopleDTO {
  memoryId: string;
  peopleIds: string[];
}

interface UpdateMemoryEventAssociationDTO {
  memoryId: string;
  eventId: string | null;
}

interface UpdateMemoryPlaceDTO {
  memoryId: string;
  placeId: string | null;
}

interface AddReflectionDTO {
  memoryId: string;
  title: string;
  content: string;
}

interface UpdateReflectionDTO {
  memoryId: string;
  reflectionId: string;
  title: string;
  content: string;
}

interface DeleteReflectionDTO {
  memoryId: string;
  reflectionId: string;
}

// --- Mutation Hooks ---

export function useAddMemory() {
  const queryClient = useQueryClient();
  return useMutation<Memory, Error, AddMemoryDTO, MemoryMutationContext>({
    mutationFn: (memoryData) => memoriesActions.addMemory(memoryData),
    onMutate: async (memoryData) => {
      await queryClient.cancelQueries({ queryKey: ["memories"] });
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"]);
      // Optimistic update logic...
      const optimisticMemory: Memory = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title: memoryData.title.trim(),
        description: memoryData.description?.trim(),
        mediaType: memoryData.mediaType,
        mediaUrl: memoryData.mediaUrl,
        mediaName: memoryData.mediaName,
        date: memoryData.date,
        dateType: "exact",
        peopleIds: memoryData.peopleIds,
        placeId: memoryData.placeId,
        eventId: memoryData.eventId,
        reflectionIds: [],
        reflections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      
      };
      queryClient.setQueryData<Memory[]>(["memories"], (old = []) => [
        ...old,
        optimisticMemory,
      ]);
      return { previousMemories };
    },
    onError: (err, variables, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(["memories"], context.previousMemories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useAddMemoryWithFile() {
  const queryClient = useQueryClient();
  return useMutation<
    Memory,
    Error,
    AddMemoryWithFileDTO,
    MemoryMutationContext
  >({
    mutationFn: async ({ file, memoryData }) => {
      const uploadResult = await memoriesActions.uploadMemoryFile(file);
      const fullMemoryData: AddMemoryDTO = {
        ...memoryData,
        mediaType: file.type.startsWith("image/") ? "photo" : "document",
        mediaUrl: uploadResult.url,
        mediaName: uploadResult.name,
        mediaSize: uploadResult.size,
      };
      return memoriesActions.addMemory(fullMemoryData);
    },
    onMutate: async ({ file, memoryData }) => {
      await queryClient.cancelQueries({ queryKey: ["memories"] });
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"]);
      const optimisticMemory: Memory = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title: memoryData.title.trim(),
        description: memoryData.description?.trim(),
        mediaType: file.type.startsWith("image/") ? "photo" : "document",
        mediaUrl: URL.createObjectURL(file),
        mediaName: file.name,
        date: memoryData.date,
        dateType: "exact",
        peopleIds: memoryData.peopleIds,
        placeId: memoryData.placeId,
        eventId: memoryData.eventId,
        reflectionIds: [],
        reflections: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      queryClient.setQueryData<Memory[]>(["memories"], (old = []) => [
        ...old,
        optimisticMemory,
      ]);
      return { previousMemories };
    },
    onError: (err, variables, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(["memories"], context.previousMemories);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useUpdateMemoryDetails() {
  const queryClient = useQueryClient();
  return useMutation<
    Memory | null,
    Error,
    UpdateMemoryDetailsDTO,
    MemoryMutationContext
  >({
    mutationFn: ({ id, updates }) =>
      memoriesActions.updateMemoryDetails(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["memory", id] });
      await queryClient.cancelQueries({ queryKey: ["memories"] });
      const previousMemory = queryClient.getQueryData<Memory>(["memory", id]);
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"]);
      const optimisticUpdate = { ...updates, updatedAt: new Date() };

      if (previousMemory) {
        queryClient.setQueryData<Memory>(["memory", id], {
          ...previousMemory,
          ...optimisticUpdate,
        });
      }
      queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
        old.map((mem) =>
          mem.id === id ? { ...mem, ...optimisticUpdate } : mem
        )
      );
      return { previousMemory, previousMemories };
    },
    onError: (err, { id }, context) => {
      if (context?.previousMemory)
        queryClient.setQueryData(["memory", id], context.previousMemory);
      if (context?.previousMemories)
        queryClient.setQueryData(["memories"], context.previousMemories);
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", id] });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useUpdateMemoryPeople() {
  const queryClient = useQueryClient();
  return useMutation<
    Memory | null,
    Error,
    UpdateMemoryPeopleDTO,
    MemoryMutationContext
  >({
    mutationFn: ({ memoryId, peopleIds }) =>
      memoriesActions.updateMemoryPeople(memoryId, peopleIds),
    onMutate: async ({ memoryId, peopleIds }) => {
      await queryClient.cancelQueries({ queryKey: ["memory", memoryId] });
      await queryClient.cancelQueries({ queryKey: ["memories"] });
      const previousMemory = queryClient.getQueryData<Memory>([
        "memory",
        memoryId,
      ]);
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"]);
      const optimisticUpdate = { peopleIds, updatedAt: new Date() };

      if (previousMemory) {
        queryClient.setQueryData<Memory>(["memory", memoryId], {
          ...previousMemory,
          ...optimisticUpdate,
        });
      }
      queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
        old.map((mem) =>
          mem.id === memoryId ? { ...mem, ...optimisticUpdate } : mem
        )
      );
      return { previousMemory, previousMemories };
    },
    onError: (err, { memoryId }, context) => {
      if (context?.previousMemory)
        queryClient.setQueryData(["memory", memoryId], context.previousMemory);
      if (context?.previousMemories)
        queryClient.setQueryData(["memories"], context.previousMemories);
    },
    onSuccess: (updatedMemory, { memoryId }) => {
      if (updatedMemory) {
        queryClient.setQueryData<Memory>(["memory", memoryId], updatedMemory);
        queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
          old.map((mem) => (mem.id === memoryId ? updatedMemory : mem))
        );
      }
    },
    onSettled: (data, error, { memoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", memoryId] });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useUpdateMemoryEventAssociation() {
  const queryClient = useQueryClient();
  return useMutation<
    Memory | null,
    Error,
    UpdateMemoryEventAssociationDTO,
    MemoryMutationContext
  >({
    mutationFn: ({ memoryId, eventId }) =>
      memoriesActions.updateMemoryEventAssociation(memoryId, eventId),
    onMutate: async ({ memoryId, eventId }) => {
      await queryClient.cancelQueries({ queryKey: ["memory", memoryId] });
      await queryClient.cancelQueries({ queryKey: ["memories"] });
      const previousMemory = queryClient.getQueryData<Memory>([
        "memory",
        memoryId,
      ]);
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"]);
      const optimisticUpdate: Partial<Memory> = {
        eventId: eventId || undefined,
        updatedAt: new Date(),
      };
      if (!eventId && previousMemory?.eventId) {
        optimisticUpdate.placeId = undefined;
      }
      if (previousMemory) {
        queryClient.setQueryData<Memory>(["memory", memoryId], {
          ...previousMemory,
          ...optimisticUpdate,
        });
      }
      queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
        old.map((mem) =>
          mem.id === memoryId ? { ...mem, ...optimisticUpdate } : mem
        )
      );
      return { previousMemory, previousMemories };
    },
    onError: (err, { memoryId }, context) => {
      if (context?.previousMemory)
        queryClient.setQueryData(["memory", memoryId], context.previousMemory);
      if (context?.previousMemories)
        queryClient.setQueryData(["memories"], context.previousMemories);
    },
    onSuccess: (updatedMemory, { memoryId }) => {
      if (updatedMemory) {
        queryClient.setQueryData<Memory>(["memory", memoryId], updatedMemory);
        queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
          old.map((mem) => (mem.id === memoryId ? updatedMemory : mem))
        );
      }
    },
    onSettled: (data, error, { memoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", memoryId] });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useUpdateMemoryPlace() {
  const queryClient = useQueryClient();
  return useMutation<
    Memory | null,
    Error,
    UpdateMemoryPlaceDTO,
    MemoryMutationContext
  >({
    mutationFn: ({ memoryId, placeId }) =>
      memoriesActions.updateMemoryPlace(memoryId, placeId),
    onMutate: async ({ memoryId, placeId }) => {
      await queryClient.cancelQueries({ queryKey: ["memory", memoryId] });
      await queryClient.cancelQueries({ queryKey: ["memories"] });
      const previousMemory = queryClient.getQueryData<Memory>([
        "memory",
        memoryId,
      ]);
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"]);
      const optimisticUpdate = {
        placeId: placeId || undefined,
        updatedAt: new Date(),
      };

      if (previousMemory) {
        queryClient.setQueryData<Memory>(["memory", memoryId], {
          ...previousMemory,
          ...optimisticUpdate,
        });
      }
      queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
        old.map((mem) =>
          mem.id === memoryId ? { ...mem, ...optimisticUpdate } : mem
        )
      );
      return { previousMemory, previousMemories };
    },
    onError: (err, { memoryId }, context) => {
      if (context?.previousMemory)
        queryClient.setQueryData(["memory", memoryId], context.previousMemory);
      if (context?.previousMemories)
        queryClient.setQueryData(["memories"], context.previousMemories);
    },
    onSuccess: (updatedMemory, { memoryId }) => {
      if (updatedMemory) {
        queryClient.setQueryData<Memory>(["memory", memoryId], updatedMemory);
        queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
          old.map((mem) => (mem.id === memoryId ? updatedMemory : mem))
        );
      }
    },
    onSettled: (data, error, { memoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", memoryId] });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useDeleteMemory() {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string, MemoryMutationContext>({
    // Added string for id
    mutationFn: (id: string) => memoriesActions.deleteMemory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["memories"] });
      await queryClient.cancelQueries({ queryKey: ["memory", id] });
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"]);
      queryClient.setQueryData<Memory[]>(["memories"], (old = []) =>
        old.filter((memory) => memory.id !== id)
      );
      queryClient.removeQueries({ queryKey: ["memory", id] });
      return { previousMemories };
    },
    onError: (err, id, context) => {
      if (context?.previousMemories)
        queryClient.setQueryData(["memories"], context.previousMemories);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useSearchMemories() {
  return useMutation<Memory[], Error, string>({
    mutationFn: (query: string) => memoriesActions.searchMemories(query),
  });
}

export function useUploadMemoryFile() {
  return useMutation<{ url: string; name: string; size: number }, Error, File>({
    mutationFn: (file: File) => memoriesActions.uploadMemoryFile(file),
  });
}

// --- Reflection Hooks ---
export function useAddReflection() {
  const queryClient = useQueryClient();
  return useMutation<
    Reflection,
    Error,
    AddReflectionDTO,
    ReflectionMutationContext
  >({
    mutationFn: ({ memoryId, title, content }) =>
      memoriesActions.addReflection(memoryId, title, content),
    onSuccess: (newReflection, { memoryId }) => {
      queryClient.setQueryData<Memory>(["memory", memoryId], (oldMemory) => {
        if (oldMemory) {
          const updatedReflections = [
            ...(oldMemory.reflections || []),
            newReflection,
          ];
          const updatedReflectionIds = [
            ...(oldMemory.reflectionIds || []),
            newReflection.id,
          ];
          return {
            ...oldMemory,
            reflections: updatedReflections,
            reflectionIds: updatedReflectionIds,
            updatedAt: new Date(),
          };
        }
        return oldMemory;
      });
      queryClient.setQueryData<Memory[]>(["memories"], (oldMemoriesList = []) =>
        oldMemoriesList.map((mem) =>
          mem.id === memoryId
            ? {
                ...mem,
                reflections: [...(mem.reflections || []), newReflection],
                reflectionIds: [...(mem.reflectionIds || []), newReflection.id],
                updatedAt: new Date(),
              }
            : mem
        )
      );
      queryClient.invalidateQueries({
        queryKey: ["memory", memoryId],
        exact: true,
      });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useUpdateReflection() {
  const queryClient = useQueryClient();
  return useMutation<
    Reflection | null,
    Error,
    UpdateReflectionDTO,
    ReflectionMutationContext
  >({
    mutationFn: ({ reflectionId, title, content }) =>
      memoriesActions.updateReflection(reflectionId, title, content),
    onSuccess: (updatedReflection, { memoryId, reflectionId }) => {
      if (!updatedReflection) return;
      queryClient.setQueryData<Memory>(["memory", memoryId], (oldMemory) => {
        if (oldMemory) {
          const updatedReflections = (oldMemory.reflections || []).map((r) =>
            r.id === reflectionId ? updatedReflection : r
          );
          return {
            ...oldMemory,
            reflections: updatedReflections,
            updatedAt: new Date(),
          };
        }
        return oldMemory;
      });
      queryClient.setQueryData<Memory[]>(["memories"], (oldMemoriesList = []) =>
        oldMemoriesList.map((mem) =>
          mem.id === memoryId
            ? {
                ...mem,
                reflections: (mem.reflections || []).map((r) =>
                  r.id === reflectionId ? updatedReflection : r
                ),
                updatedAt: new Date(),
              }
            : mem
        )
      );
      queryClient.invalidateQueries({
        queryKey: ["memory", memoryId],
        exact: true,
      });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useDeleteReflection() {
  const queryClient = useQueryClient();
  return useMutation<
    boolean,
    Error,
    DeleteReflectionDTO,
    ReflectionMutationContext
  >({
    mutationFn: ({ reflectionId }) =>
      memoriesActions.deleteReflection(reflectionId),
    onSuccess: (success, { memoryId, reflectionId }) => {
      if (success) {
        queryClient.setQueryData<Memory>(["memory", memoryId], (oldMemory) => {
          if (oldMemory) {
            return {
              ...oldMemory,
              reflections: (oldMemory.reflections || []).filter(
                (r) => r.id !== reflectionId
              ),
              reflectionIds: (oldMemory.reflectionIds || []).filter(
                (id) => id !== reflectionId
              ),
              updatedAt: new Date(),
            };
          }
          return oldMemory;
        });
        queryClient.setQueryData<Memory[]>(
          ["memories"],
          (oldMemoriesList = []) =>
            oldMemoriesList.map((mem) =>
              mem.id === memoryId
                ? {
                    ...mem,
                    reflections: (mem.reflections || []).filter(
                      (r) => r.id !== reflectionId
                    ),
                    reflectionIds: (mem.reflectionIds || []).filter(
                      (id) => id !== reflectionId
                    ),
                    updatedAt: new Date(),
                  }
                : mem
            )
        );
        queryClient.invalidateQueries({
          queryKey: ["memory", memoryId],
          exact: true,
        });
        queryClient.invalidateQueries({ queryKey: ["memories"] });
      }
    },
  });
}
