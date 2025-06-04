import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Event } from "../types/events"
import * as eventsActions from "../app/actions/events"

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: () => eventsActions.getAllEvents(),
  })
}

export function useAddEvents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (
      eventData: { title: string; description?: string; date: Date; placeId?: string; type: Event["type"] }[],
    ) => eventsActions.addEvents(eventData),
    onMutate: async (eventData) => {
      await queryClient.cancelQueries({ queryKey: ["events"] })
      const previousEvents = queryClient.getQueryData<Event[]>(["events"])

      const optimisticEvents: Event[] = eventData.map((data) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        title: data.title.trim(),
        description: data.description || `New ${data.type} event`,
        date: data.date,
        placeId: data.placeId,
        type: data.type,
        capacity: 25,
        attributes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      queryClient.setQueryData<Event[]>(["events"], (old) => (old ? [...optimisticEvents, ...old] : optimisticEvents))

      return { previousEvents }
    },
    onError: (err, variables, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
    },
  })
}

export function useUpdateEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Event, "id" | "createdAt">> }) =>
      eventsActions.updateEvent(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["events"] })
      await queryClient.cancelQueries({ queryKey: ["event", id] })

      const previousEvents = queryClient.getQueryData<Event[]>(["events"])
      const previousEvent = queryClient.getQueryData<Event>(["event", id])

      // Optimistically update events list
      queryClient.setQueryData<Event[]>(
        ["events"],
        (old) => old?.map((event) => (event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event)) || [],
      )

      // Optimistically update individual event
      if (previousEvent) {
        queryClient.setQueryData(["event", id], { ...previousEvent, ...updates, updatedAt: new Date() })
      }

      return { previousEvents, previousEvent }
    },
    onError: (err, { id }, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents)
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(["event", id], context.previousEvent)
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["event", id] })
    },
  })
}

export function useUpdateEventDetails() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Event, "id" | "createdAt">> }) =>
      eventsActions.updateEvent(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["events"] })
      await queryClient.cancelQueries({ queryKey: ["event", id] })

      const previousEvents = queryClient.getQueryData<Event[]>(["events"])
      const previousEvent = queryClient.getQueryData<Event>(["event", id])

      // Optimistically update events list
      queryClient.setQueryData<Event[]>(
        ["events"],
        (old) => old?.map((event) => (event.id === id ? { ...event, ...updates, updatedAt: new Date() } : event)) || [],
      )

      // Optimistically update individual event
      if (previousEvent) {
        queryClient.setQueryData(["event", id], { ...previousEvent, ...updates, updatedAt: new Date() })
      }

      return { previousEvents, previousEvent }
    },
    onError: (err, { id }, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents)
      }
      if (context?.previousEvent) {
        queryClient.setQueryData(["event", id], context.previousEvent)
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["event", id] })
    },
  })
}

export function useDeleteEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => eventsActions.deleteEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["events"] })
      const previousEvents = queryClient.getQueryData<Event[]>(["events"])

      // Optimistically remove event from list
      queryClient.setQueryData<Event[]>(["events"], (old) => old?.filter((event) => event.id !== id) || [])

      return { previousEvents }
    },
    onError: (err, id, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] })
      queryClient.invalidateQueries({ queryKey: ["memories"] })
    },
  })
}

export function useSearchEvents() {
  return useMutation({
    mutationFn: (query: string) => eventsActions.searchEvents(query),
  })
}

export function useEventDetails(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: () => eventsActions.getEventDetails(id),
    enabled: !!id,
  })
}
