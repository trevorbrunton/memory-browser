// hooks/use-events.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event as CustomEventType } from "@/types/events";
import * as eventsActions from "@/app/actions/events";
import { useAuth } from "@clerk/nextjs";

// --- DTOs for Mutations ---
interface AddEventsDTO {
  title: string;
  description?: string;
  date: Date;
  placeId?: string;
  dateType?: CustomEventType["dateType"];
}

// --- Query Hooks ---
export function useEvents() {
  const { userId } = useAuth();
  return useQuery<CustomEventType[], Error>({
    queryKey: ["events", userId],
    queryFn: eventsActions.getAllEvents,
    enabled: !!userId,
  });
}

export function useEventDetails(id: string) {
  const { userId } = useAuth();
  return useQuery<CustomEventType | null, Error>({
    queryKey: ["event", id, userId],
    queryFn: () => eventsActions.getEventDetails(id),
    enabled: !!id && !!userId,
  });
}

// --- Mutation Hooks ---
export function useAddEvents() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<CustomEventType[], Error, AddEventsDTO[]>({
    mutationFn: (eventDataArray: AddEventsDTO[]) =>
      eventsActions.addEvents(eventDataArray),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", userId] });
    },
  });
}
export function useUpdateEventDetails() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    CustomEventType | null,
    Error,
    {
      id: string;
      updates: Partial<Omit<CustomEventType, "id" | "createdAt" | "updatedAt">>;
    }
  >({
    mutationFn: ({ id, updates }) => eventsActions.updateEvent(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["event", data.id, userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["events", userId] });
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<boolean, Error, string>({
    mutationFn: (id: string) => eventsActions.deleteEvent(id),
    onSuccess: (data, eventId) => {
      if (data) {
        queryClient.removeQueries({ queryKey: ["event", eventId, userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["events", userId] });
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}

export function useSearchEvents() {
  return useMutation<CustomEventType[], Error, string>({
    mutationFn: (query: string) => eventsActions.searchEvents(query),
  });
}
