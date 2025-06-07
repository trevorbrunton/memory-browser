import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Attribute } from "../types/attributes";
import * as attributesActions from "../app/actions/attributes";
import { useAuth } from "@clerk/nextjs";

export function useAttributes() {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["attributes", userId],
    queryFn: () => attributesActions.getAllAttributes(),
    enabled: !!userId,
  });
}

export function useAttributesByEntityType(
  entityType: "person" | "event" | "place"
) {
  const { userId } = useAuth();
  return useQuery({
    queryKey: ["attributes", entityType, userId],
    queryFn: () => attributesActions.getAttributesByEntityType(entityType),
    enabled: !!userId,
  });
}

export function useAddAttribute() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attributes", userId] });
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
