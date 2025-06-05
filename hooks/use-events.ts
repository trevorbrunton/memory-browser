// hooks/use-events.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event as CustomEventType } from "@/types/events"; // Adjusted path
import * as eventsActions from "@/app/actions/events"; // Adjusted path

// --- Context Types for Mutations ---
interface EventMutationContext {
  previousEvents?: CustomEventType[];
  previousEvent?: CustomEventType | null;
}

// --- DTOs for Mutations ---
interface AddEventsDTO {
  // Matches the input for the addEvents server action
  title: string;
  description?: string;
  date: Date;
  placeId?: string;
  type?: CustomEventType["dateType"]; // Based on your CustomEventType
}

interface UpdateEventDTO {
  id: string;
  updates: Partial<Omit<CustomEventType, "id" | "createdAt" | "updatedAt">>;
}

// --- Query Hooks ---
export function useEvents() {
  return useQuery<CustomEventType[], Error>({
    queryKey: ["events"],
    queryFn: eventsActions.getAllEvents,
  });
}

export function useEventDetails(id: string) {
  return useQuery<CustomEventType | null, Error>({
    queryKey: ["event", id],
    queryFn: () => eventsActions.getEventDetails(id),
    enabled: !!id, // Only run query if id is truthy
  });
}

// --- Mutation Hooks ---
export function useAddEvents() {
  const queryClient = useQueryClient();
  return useMutation<
    CustomEventType[],
    Error,
    AddEventsDTO[],
    EventMutationContext
  >({
    mutationFn: (eventDataArray: AddEventsDTO[]) =>
      eventsActions.addEvents(eventDataArray),
    onMutate: async (newEventDataArray) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      const previousEvents = queryClient.getQueryData<CustomEventType[]>([
        "events",
      ]);

      // Optimistic update: Add new events to the list
      const optimisticEvents: CustomEventType[] = newEventDataArray.map(
        (data) => ({
          id: `temp-${Date.now()}-${Math.random()
            .toString(36)
            .substring(2, 9)}`,
          title: data.title,
          description: data.description,
          date: data.date,
          dateType: data.type || "exact", // Default if not provided
          placeId: data.placeId,
          attributes: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      );

      queryClient.setQueryData<CustomEventType[]>(["events"], (old = []) => [
        ...old,
        ...optimisticEvents,
      ]);
      return { previousEvents };
    },
    onError: (err, newEventData, context) => {
      if (context?.previousEvents) {
        queryClient.setQueryData(["events"], context.previousEvents);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useUpdateEventDetails() {
  const queryClient = useQueryClient();
  return useMutation<
    CustomEventType | null,
    Error,
    UpdateEventDTO,
    EventMutationContext
  >({
    mutationFn: ({ id, updates }) => eventsActions.updateEvent(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["event", id] });
      await queryClient.cancelQueries({ queryKey: ["events"] });

      const previousEvent = queryClient.getQueryData<CustomEventType>([
        "event",
        id,
      ]);
      const previousEvents = queryClient.getQueryData<CustomEventType[]>([
        "events",
      ]);

      const optimisticUpdate = { ...updates, updatedAt: new Date() };

      if (previousEvent) {
        queryClient.setQueryData<CustomEventType>(["event", id], {
          ...previousEvent,
          ...optimisticUpdate,
        });
      }
      queryClient.setQueryData<CustomEventType[]>(["events"], (old = []) =>
        old.map((event) =>
          event.id === id ? { ...event, ...optimisticUpdate } : event
        )
      );
      return { previousEvent, previousEvents };
    },
    onError: (err, { id }, context) => {
      if (context?.previousEvent)
        queryClient.setQueryData(["event", id], context.previousEvent);
      if (context?.previousEvents)
        queryClient.setQueryData(["events"], context.previousEvents);
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["event", id] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      // If updating an event affects memories (e.g., place change), invalidate memories too
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation<boolean, Error, string, EventMutationContext>({
    mutationFn: (id: string) => eventsActions.deleteEvent(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["events"] });
      await queryClient.cancelQueries({ queryKey: ["event", id] });

      const previousEvents = queryClient.getQueryData<CustomEventType[]>([
        "events",
      ]);
      const previousEvent = queryClient.getQueryData<CustomEventType>([
        "event",
        id,
      ]);

      queryClient.setQueryData<CustomEventType[]>(["events"], (old = []) =>
        old.filter((event) => event.id !== id)
      );
      queryClient.removeQueries({ queryKey: ["event", id] });

      return { previousEvents, previousEvent };
    },
    onError: (err, id, context) => {
      if (context?.previousEvents)
        queryClient.setQueryData(["events"], context.previousEvents);
      // Optionally restore individual event query too if needed
      // if (context?.previousEvent) queryClient.setQueryData(["event", id], context.previousEvent);
    },
    onSettled: (data, error, eventId) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["event", eventId] }); // Invalidate the specific event query
      // If deleting an event affects memories, invalidate memories too
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

export function useSearchEvents() {
  // This is likely a query, not a mutation, unless search itself changes state.
  // If it's a function that triggers a query with parameters:
  // return (query: string) => useQuery(['events', 'search', query], () => eventsActions.searchEvents(query), { enabled: !!query });
  // If it's a mutation that POSTs a search query (less common for GET-like searches):
  return useMutation<CustomEventType[], Error, string>({
    mutationFn: (query: string) => eventsActions.searchEvents(query),
  });
}
