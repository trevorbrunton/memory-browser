// hooks/use-memories.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memory, MediaType } from "../types/memories";
import type { Reflection } from "../types/reflection";
import * as memoriesActions from "../app/actions/memories";
import { getSignedURL } from "../app/actions/upload-helper";
import { useAuth } from "@clerk/nextjs";

// --- Helper Functions ---
const computeSHA256 = async (file: File) => {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
};

const createImageThumbnail = (
  file: File,
  maxWidth: number,
  maxHeight: number
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;
      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Could not get canvas context"));
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob)
            return reject(new Error("Canvas to Blob conversion failed"));
          const thumbnailFile = new File([blob], `thumbnail_${file.name}`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(thumbnailFile);
        },
        "image/jpeg",
        0.8
      );
    };
    img.onerror = (error) => reject(error);
  });
};

// --- DTOs ---
interface AddMemoryDTO {
  title: string;
  description?: string;
  mediaType: MediaType;
  mediaUrl: string;
  thumbnailUrl?: string;
  mediaName: string;
  date: Date;
  peopleIds: string[];
  placeId?: string;
  eventId?: string;
}

interface AddMemoryWithFileDTO {
  file: File;
  memoryData: Omit<
    AddMemoryDTO,
    "mediaType" | "mediaUrl" | "thumbnailUrl" | "mediaName"
  >;
}

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

// --- Mutation Hooks ---
export function useAddMemoryWithFile() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<Memory, Error, AddMemoryWithFileDTO>({
    mutationFn: async ({ file, memoryData }) => {
      // 1. Get signed URL for the main file
      const mainSignedURLResult = await getSignedURL({
        fileSize: file.size,
        fileType: file.type,
        checksum: await computeSHA256(file),
        fileName: file.name,
        documentTitle: memoryData.title,
        documentDate: memoryData.date.toISOString(),
      });
      if (mainSignedURLResult.failure)
        throw new Error(`S3 Main File Error: ${mainSignedURLResult.failure}`);
      const { url: mainUploadUrl, uploadedFileName: mainUploadedFileName } =
        mainSignedURLResult.success;

      // 2. Upload the main file
      const mainUploadResult = await fetch(mainUploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!mainUploadResult.ok)
        throw new Error("Failed to upload main file to S3.");
      const mediaUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_BUCKET_REGION}.amazonaws.com/${mainUploadedFileName}`;

      // 3. Handle thumbnail
      let thumbnailUrl: string | undefined = undefined;
      if (file.type.startsWith("image/")) {
        try {
          const thumbnailFile = await createImageThumbnail(file, 400, 400);
          const thumbSignedURLResult = await getSignedURL({
            fileSize: thumbnailFile.size,
            fileType: thumbnailFile.type,
            checksum: await computeSHA256(thumbnailFile),
            fileName: thumbnailFile.name,
            documentTitle: `thumb_${memoryData.title}`,
            documentDate: memoryData.date.toISOString(),
          });
          if (thumbSignedURLResult.success) {
            const {
              url: thumbUploadUrl,
              uploadedFileName: thumbUploadedFileName,
            } = thumbSignedURLResult.success;
            const thumbUploadResult = await fetch(thumbUploadUrl, {
              method: "PUT",
              headers: { "Content-Type": thumbnailFile.type },
              body: thumbnailFile,
            });
            if (thumbUploadResult.ok) {
              thumbnailUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_BUCKET_REGION}.amazonaws.com/${thumbUploadedFileName}`;
            }
          }
        } catch (thumbError) {
          console.warn("Thumbnail generation or upload failed:", thumbError);
        }
      }

      // 4. Save memory metadata
      const fullMemoryData: AddMemoryDTO = {
        ...memoryData,
        mediaType: file.type.startsWith("image/") ? "photo" : "document",
        mediaUrl,
        thumbnailUrl,
        mediaName: file.name,
      };
      return memoriesActions.addMemory(fullMemoryData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}

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

export function useUpdateMemoryPeople() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    Memory | null,
    Error,
    { memoryId: string; peopleIds: string[] }
  >({
    mutationFn: ({ memoryId, peopleIds }) =>
      memoriesActions.updateMemoryPeople(memoryId, peopleIds),
    onSuccess: (updatedMemory) => {
      if (updatedMemory) {
        queryClient.invalidateQueries({ queryKey: ["memories", userId] });
        queryClient.invalidateQueries({
          queryKey: ["memory", updatedMemory.id, userId],
        });
      }
    },
  });
}

export function useUpdateMemoryEventAssociation() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    Memory | null,
    Error,
    { memoryId: string; eventId: string | null }
  >({
    mutationFn: ({ memoryId, eventId }) =>
      memoriesActions.updateMemoryEventAssociation(memoryId, eventId),
    onSuccess: (updatedMemory) => {
      if (updatedMemory) {
        queryClient.invalidateQueries({ queryKey: ["memories", userId] });
        queryClient.invalidateQueries({
          queryKey: ["memory", updatedMemory.id, userId],
        });
      }
    },
  });
}

export function useUpdateMemoryPlace() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    Memory | null,
    Error,
    { memoryId: string; placeId: string | null }
  >({
    mutationFn: ({ memoryId, placeId }) =>
      memoriesActions.updateMemoryPlace(memoryId, placeId),
    onSuccess: (updatedMemory) => {
      if (updatedMemory) {
        queryClient.invalidateQueries({ queryKey: ["memories", userId] });
        queryClient.invalidateQueries({
          queryKey: ["memory", updatedMemory.id, userId],
        });
      }
    },
  });
}

export function useAddReflection() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    Reflection,
    Error,
    { memoryId: string; title: string; content: string }
  >({
    mutationFn: ({ memoryId, title, content }) =>
      memoriesActions.addReflection(memoryId, title, content),
    onSuccess: (newReflection, { memoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", memoryId, userId] });
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}

export function useUpdateReflection() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    Reflection | null,
    Error,
    { reflectionId: string; memoryId: string; title: string; content: string }
  >({
    mutationFn: ({ reflectionId, title, content }) =>
      memoriesActions.updateReflection(reflectionId, title, content),
    onSuccess: (data, { memoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", memoryId, userId] });
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}

export function useDeleteReflection() {
  const queryClient = useQueryClient();
  const { userId } = useAuth();
  return useMutation<
    boolean,
    Error,
    { reflectionId: string; memoryId: string }
  >({
    mutationFn: ({ reflectionId }) =>
      memoriesActions.deleteReflection(reflectionId),
    onSuccess: (data, { memoryId }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", memoryId, userId] });
      queryClient.invalidateQueries({ queryKey: ["memories", userId] });
    },
  });
}
