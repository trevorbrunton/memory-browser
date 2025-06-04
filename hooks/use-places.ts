import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Place } from "../types/places"
import * as placesActions from "../app/actions/places"

export function usePlaces() {
  return useQuery({
    queryKey: ["places"],
    queryFn: () => placesActions.getAllPlaces(),
  })
}

export function useAddPlaces() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (placeData: { name: string; address?: string; city: string; country: string; type: Place["type"] }[]) =>
      placesActions.addPlaces(placeData),
    onMutate: async (placeData) => {
      await queryClient.cancelQueries({ queryKey: ["places"] })
      const previousPlaces = queryClient.getQueryData<Place[]>(["places"])

      const optimisticPlaces: Place[] = placeData.map((data) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        name: data.name.trim(),
        address: data.address || "Address TBD",
        city: data.city,
        country: data.country,
        type: data.type,
        capacity: 50,
        rating: 4.0,
        attributes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      queryClient.setQueryData<Place[]>(["places"], (old) => (old ? [...optimisticPlaces, ...old] : optimisticPlaces))

      return { previousPlaces }
    },
    onError: (err, variables, context) => {
      if (context?.previousPlaces) {
        queryClient.setQueryData(["places"], context.previousPlaces)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
    },
  })
}

export function useUpdatePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Place, "id" | "createdAt">> }) =>
      placesActions.updatePlace(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["places"] })
      await queryClient.cancelQueries({ queryKey: ["place", id] })

      const previousPlaces = queryClient.getQueryData<Place[]>(["places"])
      const previousPlace = queryClient.getQueryData<Place>(["place", id])

      // Optimistically update places list
      queryClient.setQueryData<Place[]>(
        ["places"],
        (old) => old?.map((place) => (place.id === id ? { ...place, ...updates, updatedAt: new Date() } : place)) || [],
      )

      // Optimistically update individual place
      if (previousPlace) {
        queryClient.setQueryData(["place", id], { ...previousPlace, ...updates, updatedAt: new Date() })
      }

      return { previousPlaces, previousPlace }
    },
    onError: (err, { id }, context) => {
      if (context?.previousPlaces) {
        queryClient.setQueryData(["places"], context.previousPlaces)
      }
      if (context?.previousPlace) {
        queryClient.setQueryData(["place", id], context.previousPlace)
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
      queryClient.invalidateQueries({ queryKey: ["place", id] })
    },
  })
}

export function useDeletePlace() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => placesActions.deletePlace(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["places"] })
      const previousPlaces = queryClient.getQueryData<Place[]>(["places"])

      // Optimistically remove place from list
      queryClient.setQueryData<Place[]>(["places"], (old) => old?.filter((place) => place.id !== id) || [])

      return { previousPlaces }
    },
    onError: (err, id, context) => {
      if (context?.previousPlaces) {
        queryClient.setQueryData(["places"], context.previousPlaces)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["places"] })
    },
  })
}

export function useSearchPlaces() {
  return useMutation({
    mutationFn: (query: string) => placesActions.searchPlaces(query),
  })
}

export function usePlaceDetails(id: string) {
  return useQuery({
    queryKey: ["place", id],
    queryFn: () => placesActions.getPlaceDetails(id),
    enabled: !!id,
  })
}
