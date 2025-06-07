import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Place } from "../types/places";
import * as placesActions from "../app/actions/places";
import { useAuth } from "@clerk/nextjs";

export function usePlaces() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["places", userId],
    queryFn: () => placesActions.getAllPlaces(),
    enabled: !!userId,
  });
}

export function usePlaceDetails(id: string) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["place", id, userId],
    queryFn: () => placesActions.getPlaceDetails(id),
    enabled: !!id && !!userId,
  });
}

export function useAddPlaces() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (
      placeData: {
        name: string;
        address?: string;
        city: string;
        country: string;
        type: Place["type"];
      }[]
    ) => placesActions.addPlaces(placeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["places", userId] });
    },
  });
}

export function useUpdatePlace() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Omit<Place, "id" | "createdAt" | "updatedAt" | "ownerId">
      >;
    }) => placesActions.updatePlace(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({ queryKey: ["place", data.id, userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["places", userId] });
    },
  });
}

export function useDeletePlace() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (id: string) => placesActions.deletePlace(id),
    onSuccess: (deleted, placeId) => {
      if (deleted) {
        queryClient.removeQueries({ queryKey: ["place", placeId, userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["places", userId] });
    },
  });
}

export function useSearchPlaces() {
  return useMutation({
    mutationFn: (query: string) => placesActions.searchPlaces(query),
  });
}
