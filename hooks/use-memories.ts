// hooks/use-memories.ts

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Memory, MediaType } from "../types/memories";
import type { Reflection } from "../types/reflection";
import * as memoriesActions from "../app/actions/memories";
import { getSignedURL } from "../app/actions/upload-helper";

// --- Helper Functions for client-side operations ---

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
      if (!ctx) {
        return reject(new Error("Could not get canvas context"));
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            return reject(new Error("Canvas to Blob conversion failed"));
          }
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
    img.onerror = (error) => {
      reject(error);
    };
  });
};

// --- Context Types for Mutations ---
interface MemoryMutationContext {
  previousMemories?: Memory[];
}

interface ReflectionMutationContext {
  previousMemory?: Memory | null;
}

// --- Query Hooks ---
export function useMemories() {
  return useQuery<Memory[], Error>({
    queryKey: ["memories"],
    queryFn: () => memoriesActions.getAllMemories(),
  });
}

export function useMemoryDetails(id: string) {
  return useQuery<Memory | null, Error>({
    queryKey: ["memory", id],
    queryFn: () => memoriesActions.getMemoryDetails(id),
    enabled: !!id,
  });
}

// --- DTOs for Mutations ---
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

// --- REFACTORED MUTATION HOOK ---
export function useAddMemoryWithFile() {
  const queryClient = useQueryClient();
  return useMutation<
    Memory,
    Error,
    AddMemoryWithFileDTO,
    MemoryMutationContext
  >({
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

      if (mainSignedURLResult.failure) {
        throw new Error(`S3 Main File Error: ${mainSignedURLResult.failure}`);
      }

      const { url: mainUploadUrl, uploadedFileName: mainUploadedFileName } =
        mainSignedURLResult.success!;

      // 2. Upload the main file to S3 from the client
      const mainUploadResult = await fetch(mainUploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!mainUploadResult.ok) {
        throw new Error("Failed to upload main file to S3.");
      }

      const mediaUrl = `https://${process.env.NEXT_PUBLIC_AWS_BUCKET_NAME}.s3.${process.env.NEXT_PUBLIC_AWS_BUCKET_REGION}.amazonaws.com/${mainUploadedFileName}`;
      let thumbnailUrl: string | undefined = undefined;

      // 3. Generate and upload thumbnail if it's an image
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

      // 4. Save memory metadata to the database via server action
      const fullMemoryData: AddMemoryDTO = {
        ...memoryData,
        mediaType: file.type.startsWith("image/") ? "photo" : "document",
        mediaUrl,
        thumbnailUrl,
        mediaName: file.name,
      };

      return memoriesActions.addMemory(fullMemoryData);
    },
    onSuccess: (newMemory) => {
      queryClient.setQueryData<Memory[]>(["memories"], (oldMemories = []) => [
        newMemory,
        ...oldMemories,
      ]);
      queryClient.invalidateQueries({ queryKey: ["memories"], exact: true });
    },
  });
}

// --- Other hooks ---
export function useUpdateMemoryDetails() {
  const queryClient = useQueryClient();
  return useMutation<
    Memory | null,
    Error,
    { id: string; updates: Pick<Memory, "title" | "description" | "date"> },
    MemoryMutationContext
  >({
    mutationFn: ({ id, updates }) =>
      memoriesActions.updateMemoryDetails(id, updates),
    onSettled: (data, error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["memory", id] });
      queryClient.invalidateQueries({ queryKey: ["memories"] });
    },
  });
}

// ... (rest of the hooks remain the same) ...
