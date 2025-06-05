import { useMutation, useQueryClient } from "@tanstack/react-query"
import * as memoriesActions from "../app/actions/memories"

export function useUpdateMemoryEvent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ memoryId, eventId }: { memoryId: string; eventId: string | null }) =>
      memoriesActions.updateMemoryEventAssociation(memoryId, eventId),
    onSuccess: (data, { memoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["memories"] })
      queryClient.invalidateQueries({ queryKey: ["memory", memoryId] })
    },
  })
}
