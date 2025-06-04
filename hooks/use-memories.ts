import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Memory, MediaType } from "../types/memories"
import * as memoriesActions from "../app/actions/memories"

export function useMemories() {
  return useQuery({
    queryKey: ["memories"],
    queryFn: () => memoriesActions.getAllMemories(),
  })
}

export function useAddMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (memoryData: {
      title: string
      description?: string
      mediaType: MediaType
      mediaUrl: string
      mediaName: string
      mediaSize: number
      date: Date
      peopleIds: string[]
      placeId?: string
      eventId?: string
    }) => memoriesActions.addMemory(memoryData),
    onMutate: async (memoryData) => {
      await queryClient.cancelQueries({ queryKey: ["memories"] })
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"])

      const optimisticMemory: Memory = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title: memoryData.title.trim(),
        description: memoryData.description?.trim(),
        mediaType: memoryData.mediaType,
        mediaUrl: memoryData.mediaUrl,
        mediaName: memoryData.mediaName,
        date: memoryData.date,
        dateType: "exact", // or another appropriate default value
        peopleIds: memoryData.peopleIds,
        placeId: memoryData.placeId,
        eventId: memoryData.eventId,
        reflectionIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      queryClient.setQueryData<Memory[]>(["memories"], (old) => (old ? [optimisticMemory, ...old] : [optimisticMemory]))

      return { previousMemories }
    },
    onError: (err, variables, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(["memories"], context.previousMemories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] })
    },
  })
}

export function useAddMemoryWithFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      memoryData,
    }: {
      file: File
      memoryData: {
        title: string
        description?: string
        date: Date
        peopleIds: string[]
        placeId?: string
        eventId?: string
      }
    }) => {
      // First upload the file
      const uploadResult = await memoriesActions.uploadMemoryFile(file)

      // Then create the memory with the uploaded file info
      const fullMemoryData = {
        ...memoryData,
        mediaType: file.type.startsWith("image/") ? ("photo" as MediaType) : ("document" as MediaType),
        mediaUrl: uploadResult.url,
        mediaName: uploadResult.name,
        mediaSize: uploadResult.size,
      }

      return memoriesActions.addMemory(fullMemoryData)
    },
    onMutate: async ({ file, memoryData }) => {
      await queryClient.cancelQueries({ queryKey: ["memories"] })
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"])

      const optimisticMemory: Memory = {
        id: `temp-${Date.now()}-${Math.random()}`,
        title: memoryData.title.trim(),
        description: memoryData.description?.trim(),
        mediaType: file.type.startsWith("image/") ? "photo" : "document",
        mediaUrl: URL.createObjectURL(file), // Temporary URL for preview
        mediaName: file.name,
        date: memoryData.date,
        dateType: "exact", // or another appropriate default value
        peopleIds: memoryData.peopleIds,
        placeId: memoryData.placeId,
        eventId: memoryData.eventId,
        reflectionIds: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      queryClient.setQueryData<Memory[]>(["memories"], (old) => (old ? [optimisticMemory, ...old] : [optimisticMemory]))

      return { previousMemories }
    },
    onError: (err, variables, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(["memories"], context.previousMemories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] })
    },
  })
}

export function useUpdateMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Memory, "id" | "createdAt">> }) =>
      memoriesActions.updateMemory(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["memories"] })
      await queryClient.cancelQueries({ queryKey: ["memory", id] })

      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"])
      const previousMemory = queryClient.getQueryData<Memory>(["memory", id])

      // Optimistically update memories list
      queryClient.setQueryData<Memory[]>(
        ["memories"],
        (old) =>
          old?.map((memory) => (memory.id === id ? { ...memory, ...updates, updatedAt: new Date() } : memory)) || [],
      )

      // Optimistically update individual memory
      if (previousMemory) {
        queryClient.setQueryData(["memory", id], { ...previousMemory, ...updates, updatedAt: new Date() })
      }

      return { previousMemories, previousMemory }
    },
    onError: (err, { id }, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(["memories"], context.previousMemories)
      }
      if (context?.previousMemory) {
        queryClient.setQueryData(["memory", id], context.previousMemory)
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] })
      queryClient.invalidateQueries({ queryKey: ["memory", id] })
    },
  })
}

export function useDeleteMemory() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => memoriesActions.deleteMemory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["memories"] })
      const previousMemories = queryClient.getQueryData<Memory[]>(["memories"])

      // Optimistically remove memory from list
      queryClient.setQueryData<Memory[]>(["memories"], (old) => old?.filter((memory) => memory.id !== id) || [])

      return { previousMemories }
    },
    onError: (err, id, context) => {
      if (context?.previousMemories) {
        queryClient.setQueryData(["memories"], context.previousMemories)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["memories"] })
    },
  })
}

export function useSearchMemories() {
  return useMutation({
    mutationFn: (query: string) => memoriesActions.searchMemories(query),
  })
}

export function useMemoryDetails(id: string) {
  return useQuery({
    queryKey: ["memory", id],
    queryFn: () => memoriesActions.getMemoryDetails(id),
    enabled: !!id,
  })
}

export function useUploadMemoryFile() {
  return useMutation({
    mutationFn: (file: File) => memoriesActions.uploadMemoryFile(file),
  })
}

export function useAddReflection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memoryId, title, content }: { memoryId: string; title: string; content: string }) =>
      memoriesActions.addReflection(memoryId, title, content),
    onSuccess: (newReflection, { memoryId }) => {
      // Update the memory's reflections in the cache
      queryClient.setQueryData<Memory>(["memory", memoryId], (old) => {
        if (old) {
          return {
            ...old,
            reflectionIds: [...old.reflectionIds, newReflection.id],
          }
        }
        return old
      })

      // Also update the memories list
      queryClient.setQueryData<Memory[]>(["memories"], (old) => {
        if (old) {
          return old.map((memory) =>
            memory.id === memoryId ? { ...memory, reflectionIds: [...memory.reflectionIds, newReflection.id] } : memory,
          )
        }
        return old
      })
    },
  })
}

export function useUpdateReflection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ reflectionId, title, content }: { reflectionId: string; title: string; content: string }) =>
      memoriesActions.updateReflection(reflectionId, title, content),
    onSuccess: (updatedReflection, { reflectionId }) => {
      if (!updatedReflection) return

      // Update all relevant queries
      // No need to update 'reflectionIds' here, as they are just IDs and not objects.
      // If you have a separate cache for reflections, update that instead.
      // Otherwise, you can remove this block or leave it as a no-op.
      // For demonstration, we'll just return the old memory.
      queryClient.setQueriesData<Memory>({ queryKey: ["memory"] }, (old) => old)

      queryClient.setQueryData<Memory[]>(["memories"], (old) => old)
    },
  })
}

export function useDeleteReflection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reflectionId: string) => memoriesActions.deleteReflection(reflectionId),
    onSuccess: (success, reflectionId) => {
      if (success) {
        // Remove reflection from all relevant queries
        queryClient.setQueriesData<Memory>({ queryKey: ["memory"] }, (old) => {
          if (old) {
            return {
              ...old,
              reflectionIds: old.reflectionIds.filter((id) => id !== reflectionId),
            }
          }
          return old
        })

        queryClient.setQueryData<Memory[]>(["memories"], (old) => {
          if (old) {
            return old.map((memory) => ({
              ...memory,
              reflectionIds: memory.reflectionIds.filter((id) => id !== reflectionId),
            }))
          }
          return old
        })
      }
    },
  })
}
