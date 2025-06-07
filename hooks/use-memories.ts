// hooks/use-memories.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memory, MediaType } from "../types/memories";
import type { Reflection } from "../types/reflection";
import * as memoriesActions from "../app/actions/memories";
import { getSignedURL } from "../app/actions/upload-helper";
import { useAuth } from "@clerk/nextjs";

// --- Helper Functions for client-side operations ---
const computeSHA256 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

// ... (other helpers like createImageThumbnail remain the same)

// --- Query Hooks ---
export function useMemories() {
  const { userId } = useAuth();
  return useQuery<Memory[], Error>({
    queryKey: ["memories", userId],
    queryFn: () => memoriesActions.getAllMemories(),
    enabled: !!userId,
  });
}

export function useMemoryDetails(id: string) {
  const { userId } = useAuth();
  return useQuery<Memory | null, Error>({
    queryKey: ["memory", id, userId],
    queryFn: () => memoriesActions.getMemoryDetails(id),
    enabled: !!id && !!userId,
  });
}

// --- DTOs and Mutation Hooks ---
// ... (AddMemoryWithFileDTO and useAddMemoryWithFile remain the same as they don't depend on userId directly from client)

export function useUpdateMemoryDetails() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    Memory | null,
    Error,
    { id: string; updates: Pick<Memory, "title" | "description" | "date"> }
  >({
    mutationFn: ({ id, updates }) =>
      memoriesActions.updateMemoryDetails(id, updates),
    onSuccess: (data) => {
      if (data) {
        queryClient.invalidateQueries({
          queryKey: ["memory", data.id, userId],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}

// ... (Other mutation hooks like useUpdateMemoryPeople, useAddReflection etc. would be updated similarly to invalidate user-specific queries)
export function useAddMemoryWithFile() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<Memory, Error, { file: File; memoryData: any }>({
    mutationFn: async ({ file, memoryData }) => {
      // ... file upload logic remains the same
      const mainSignedURLResult = await getSignedURL({
        fileSize: file.size,
        fileType: file.type,
        checksum: await computeSHA256(file),
        fileName: file.name,
        documentTitle: memoryData.title,
        documentDate: memoryData.date.toISOString(),
      });

      if (mainSignedURLResult.failure)
        throw new Error(mainSignedURLResult.failure);
      const { url: mainUploadUrl, uploadedFileName } =
        mainSignedURLResult.success;
      await fetch(mainUploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const mediaUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_BUCKET_REGION}.amazonaws.com/${uploadedFileName}`;

      const fullMemoryData = {
        ...memoryData,
        mediaType: file.type.startsWith("image/") ? "photo" : "document",
        mediaUrl,
        mediaName: file.name,
      };
      return memoriesActions.addMemory(fullMemoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}
