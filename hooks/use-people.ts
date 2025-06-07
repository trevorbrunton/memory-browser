import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Person } from "../types/people";
import * as peopleActions from "../app/actions/people";
import { useAuth } from "@clerk/nextjs";

export function usePeople() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["people", userId],
    queryFn: () => peopleActions.getAllPeople(),
    enabled: !!userId,
  });
}

export function usePersonDetails(id: string) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["person", id, userId],
    queryFn: () => peopleActions.getPersonDetails(id),
    enabled: !!id && !!userId,
  });
}

export function useAddPeople() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (
      peopleData: Omit<Person, "id" | "createdAt" | "updatedAt" | "ownerId">[]
    ) => peopleActions.addPeople(peopleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["people", userId] });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<
        Omit<Person, "id" | "createdAt" | "updatedAt" | "ownerId">
      >;
    }) => peopleActions.updatePerson(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: ["person", data.id, userId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["people", userId] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation({
    mutationFn: (id: string) => peopleActions.deletePerson(id),
    onSuccess: (deleted, personId) => {
      if (deleted) {
        queryClient.removeQueries({ queryKey: ["person", personId, userId] });
      }
      queryClient.invalidateQueries({ queryKey: ["people", userId] });
    },
  });
}

export function useSearchPeople() {
  return useMutation({
    mutationFn: (query: string) => peopleActions.searchPeople(query),
  });
}
