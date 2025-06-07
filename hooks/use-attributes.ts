import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Attribute } from "../types/attributes";
import * as attributesActions from "../app/actions/attributes";

export function useAttributes() {
  return useQuery({
    queryKey: ["attributes"],
    queryFn: () => attributesActions.getAllAttributes(),
  });
}

export function useAttributesByEntityType(
  entityType: "person" | "event" | "place"
) {
  return useQuery({
    queryKey: ["attributes", entityType],
    queryFn: () => attributesActions.getAttributesByEntityType(entityType),
  });
}

export function useAddAttribute() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      name,
      category,
      entityType,
    }: {
      name: string;
      category?: string;
      entityType?: "person" | "event" | "place" | "all";
    }) => attributesActions.addAttribute(name, category, entityType),
    onMutate: async ({ name, category, entityType = "all" }) => {
      await queryClient.cancelQueries({ queryKey: ["attributes"] });
      await queryClient.cancelQueries({ queryKey: ["attributes", entityType] });

      const previousAttributes = queryClient.getQueryData<Attribute[]>([
        "attributes",
      ]);
      const previousEntityAttributes = queryClient.getQueryData<Attribute[]>([
        "attributes",
        entityType,
      ]);

      const optimisticAttribute: Attribute = {
        id: `temp-${Date.now()}-${Math.random()}`,
        name: name.trim(),
        category: category || "Custom",
        description: `Custom attribute: ${name}`,
        entityType,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Update all attributes
      queryClient.setQueryData<Attribute[]>(["attributes"], (old) =>
        old ? [optimisticAttribute, ...old] : [optimisticAttribute]
      );

      // Update entity-specific attributes if applicable
      if (entityType !== "all") {
        queryClient.setQueryData<Attribute[]>(
          ["attributes", entityType],
          (old) => (old ? [optimisticAttribute, ...old] : [optimisticAttribute])
        );
      }

      return { previousAttributes, previousEntityAttributes };
    },
    onSuccess: (newAttribute) => {
      queryClient.setQueryData<Attribute[]>(["attributes"], (old = []) => {
        const optimisticIds = old
          .filter((a) => a.id.startsWith("temp-"))
          .map((a) => a.id);
        const remainingOld = old.filter((a) => !optimisticIds.includes(a.id));
        return [...remainingOld, newAttribute].sort((a, b) =>
          a.name.localeCompare(b.name)
        );
      });
      if (newAttribute.entityType !== "all") {
        queryClient.setQueryData<Attribute[]>(
          ["attributes", newAttribute.entityType],
          (old = []) => {
            const optimisticIds = old
              .filter((a) => a.id.startsWith("temp-"))
              .map((a) => a.id);
            const remainingOld = old.filter(
              (a) => !optimisticIds.includes(a.id)
            );
            return [...remainingOld, newAttribute].sort((a, b) =>
              a.name.localeCompare(b.name)
            );
          }
        );
      }
    },
    onError: (err, { entityType }, context) => {
      if (context?.previousAttributes) {
        queryClient.setQueryData(["attributes"], context.previousAttributes);
      }
      if (context?.previousEntityAttributes && entityType !== "all") {
        queryClient.setQueryData(
          ["attributes", entityType],
          context.previousEntityAttributes
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes"] });
    },
  });
}

export function useSearchAttributes() {
  return useMutation({
    mutationFn: ({
      query,
      entityType,
    }: {
      query: string;
      entityType?: "person" | "event" | "place";
    }) => attributesActions.searchAttributes(query, entityType),
  });
}
