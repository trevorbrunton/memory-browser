import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Person } from "../types/people";
import * as peopleActions from "../app/actions/people";

export function usePeople() {
  return useQuery({
    queryKey: ["people"],
    queryFn: () => peopleActions.getAllPeople(),
  });
}

export function useAddPeople() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      peopleData: Omit<Person, "id" | "createdAt" | "updatedAt">[]
    ) => peopleActions.addPeople(peopleData.map((p) => p.name)),
    onMutate: async (peopleData) => {
      await queryClient.cancelQueries({ queryKey: ["people"] });
      const previousPeople = queryClient.getQueryData<Person[]>(["people"]);

      const optimisticPeople: Person[] = peopleData.map((data) => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        name: data.name.trim(),
        email: data.email || undefined,
        role: data.role || undefined,
        photoUrl: data.photoUrl || undefined,
        dateOfBirth: data.dateOfBirth || undefined,
        placeOfBirth: data.placeOfBirth || undefined,
        maritalStatus: data.maritalStatus || undefined,
        spouseId: data.spouseId || undefined,
        childrenIds: data.childrenIds || [],
        attributes: data.attributes || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      queryClient.setQueryData<Person[]>(["people"], (old) =>
        old ? [...optimisticPeople, ...old] : optimisticPeople
      );

      return { previousPeople };
    },
    onSuccess: (newPeople) => {
      queryClient.setQueryData<Person[]>(["people"], (old = []) => {
        const optimisticIds = old
          .filter((p) => p.id.startsWith("temp-"))
          .map((p) => p.id);
        const remainingOld = old.filter((p) => !optimisticIds.includes(p.id));
        return [...newPeople, ...remainingOld];
      });
    },
    onError: (err, variables, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(["people"], context.previousPeople);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

// New hook for creating a single person with full details
export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personData: Omit<Person, "id" | "createdAt" | "updatedAt">) =>
      peopleActions.addPeople([personData.name]),
    onMutate: async (personData) => {
      await queryClient.cancelQueries({ queryKey: ["people"] });
      const previousPeople = queryClient.getQueryData<Person[]>(["people"]);

      const optimisticPerson: Person = {
        id: `temp-${Date.now()}-${Math.random()}`,
        ...personData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      queryClient.setQueryData<Person[]>(["people"], (old) =>
        old ? [optimisticPerson, ...old] : [optimisticPerson]
      );

      return { previousPeople, optimisticPerson };
    },
    onError: (err, variables, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(["people"], context.previousPeople);
      }
    },
    onSuccess: (newPerson, variables, context) => {
      // Replace optimistic update with real data
      queryClient.setQueryData<Person[]>(["people"], (old: Person[] = []) =>
        old.map((person) =>
          person.id === context?.optimisticPerson?.id
            ? { ...person, ...newPerson }
            : person
        )
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Omit<Person, "id" | "createdAt">>;
    }) => peopleActions.updatePerson(id, updates),
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ["people"] });
      await queryClient.cancelQueries({ queryKey: ["person", id] });

      const previousPeople = queryClient.getQueryData<Person[]>(["people"]);
      const previousPerson = queryClient.getQueryData<Person>(["person", id]);

      // Optimistically update people list
      queryClient.setQueryData<Person[]>(
        ["people"],
        (old) =>
          old?.map((person) =>
            person.id === id
              ? { ...person, ...updates, updatedAt: new Date() }
              : person
          ) || []
      );

      // Optimistically update individual person
      if (previousPerson) {
        queryClient.setQueryData(["person", id], {
          ...previousPerson,
          ...updates,
          updatedAt: new Date(),
        });
      }

      return { previousPeople, previousPerson };
    },
    onError: (err, { id }, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(["people"], context.previousPeople);
      }
      if (context?.previousPerson) {
        queryClient.setQueryData(["person", id], context.previousPerson);
      }
    },
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
      queryClient.invalidateQueries({ queryKey: ["person", id] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => peopleActions.deletePerson(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["people"] });
      const previousPeople = queryClient.getQueryData<Person[]>(["people"]);

      // Optimistically remove person from list
      queryClient.setQueryData<Person[]>(
        ["people"],
        (old) => old?.filter((person) => person.id !== id) || []
      );

      return { previousPeople };
    },
    onError: (err, id, context) => {
      if (context?.previousPeople) {
        queryClient.setQueryData(["people"], context.previousPeople);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["people"] });
    },
  });
}

export function useSearchPeople() {
  return useMutation({
    mutationFn: (query: string) => peopleActions.searchPeople(query),
  });
}

export function usePersonDetails(id: string) {
  return useQuery({
    queryKey: ["person", id],
    queryFn: () => peopleActions.getPersonDetails(id),
    enabled: !!id,
  });
}
