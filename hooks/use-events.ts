// hooks/use-events.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Event as CustomEventType, EventAttribute } from "@/types/events";
import * as eventsActions from "@/app/actions/events";
import { useAuth } from "@clerk/nextjs";

interface AddEventsDTO {
  title: string;
  description?: string;
  date: Date;
  placeId?: string;
  dateType: CustomEventType["dateType"];
  attributes?: EventAttribute[];
}

interface UpdateEventDTO {
  id: string;
  updates: Partial<
    Omit<CustomEventType, "id" | "createdAt" | "updatedAt" | "ownerId">
  >;
}

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

export function useAddEvents() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<CustomEventType[], Error, AddEventsDTO[]>({
    mutationFn: (eventDataArray: AddEventsDTO[]) =>
      eventsActions.addEvents(
        eventDataArray.map((event) => ({
          ...event,
          dateType: event.dateType ?? "exact",
        }))
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events", userId] });
    },
  });
}

export function useUpdateEventDetails() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<CustomEventType | null, Error, UpdateEventDTO>({
    mutationFn: ({ id, updates }) => eventsActions.updateEvent(id, updates),
    onSuccess: (updatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["events", userId] });
      if (updatedEvent) {
        queryClient.invalidateQueries({
          queryKey: ["event", updatedEvent.id, userId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<boolean, Error, string>({
    mutationFn: (id: string) => eventsActions.deleteEvent(id),
    onSuccess: (deleted, eventId) => {
      if (deleted) {
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
