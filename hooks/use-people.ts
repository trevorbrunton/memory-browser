import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { Person } from "../types/people"
import * as peopleActions from "../app/actions/people"

export function usePeople() {
  return useQuery({
    queryKey: ["people"],
    queryFn: () => peopleActions.getAllPeople(),
  })
}

export function useAddPeople() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (names: string[]) => peopleActions.addPeople(names),
    onMutate: async (names) => {
      await queryClient.cancelQueries({ queryKey: ["people"] })
      const previousPeople = queryClient.getQueryData<Person[]>(["people"])

      const optimisticPeople: Person[] = names.map((name) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        name: name.trim(),
        email: `${name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
        role: "New User",
        attributes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }))

      queryClient.setQueryData<Person[]>(["people"], (old) => (old ? [...optimisticPeople, ...old] : optimisticPeople))

      return { previousPeople }
    },
    onError: (err, variables, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(["people"], context.previousPeople)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] })
    },
  })
}

export function useUpdatePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Omit<Person, "id" | "createdAt">> }) =>
      peopleActions.updatePerson(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["people"] })
      await queryClient.cancelQueries({ queryKey: ["person", id] })

      const previousPeople = queryClient.getQueryData<Person[]>(["people"])
      const previousPerson = queryClient.getQueryData<Person>(["person", id])

      // Optimistically update people list
      queryClient.setQueryData<Person[]>(
        ["people"],
        (old) =>
          old?.map((person) => (person.id === id ? { ...person, ...updates, updatedAt: new Date() } : person)) || [],
      )

      // Optimistically update individual person
      if (previousPerson) {
        queryClient.setQueryData(["person", id], { ...previousPerson, ...updates, updatedAt: new Date() })
      }

      return { previousPeople, previousPerson }
    },
    onError: (err, { id }, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(["people"], context.previousPeople)
      }
      if (context?.previousPerson) {
        queryClient.setQueryData(["person", id], context.previousPerson)
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["people"] })
      queryClient.invalidateQueries({ queryKey: ["person", id] })
    },
  })
}

export function useDeletePerson() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => peopleActions.deletePerson(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["people"] })
      const previousPeople = queryClient.getQueryData<Person[]>(["people"])

      // Optimistically remove person from list
      queryClient.setQueryData<Person[]>(["people"], (old) => old?.filter((person) => person.id !== id) || [])

      return { previousPeople }
    },
    onError: (err, id, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(["people"], context.previousPeople)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] })
    },
  })
}

export function useSearchPeople() {
  return useMutation({
    mutationFn: (query: string) => peopleActions.searchPeople(query),
  })
}

export function usePersonDetails(id: string) {
  return useQuery({
    queryKey: ["person", id],
    queryFn: () => peopleActions.getPersonDetails(id),
    enabled: !!id,
  })
}
