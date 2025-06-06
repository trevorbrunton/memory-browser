// File: src/app/actions/upload-helper.ts

"use server";

// import { db } from "@/lib/db";

import { nanoid } from "@/lib/utils";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const maxFileSize = 1048576 * 10000; // How big should this be???

const generateFileName = (name: string): string => `${nanoid()}_${name}`;

type SignedURLResponse = Promise<
  | {
      failure?: undefined;
      success: { url: string; id: string; uploadedFileName: string };
    }
  | { failure: string; success?: undefined }
>;

type GetSignedURLParams = {
  fileType: string;
  fileSize: number;
  checksum: string;
  fileName: string;
  documentTitle: string;
  documentDate: string;
};
export const getSignedURL = async ({
  fileSize,
  fileType,
  checksum,
  fileName,
}: GetSignedURLParams): Promise<SignedURLResponse> => {
  try {
    if (fileSize > maxFileSize) {
      return { failure: "File size exceeds the maximum limit of 10GB" };
    }

    const fileId = nanoid();
    const obscuredFileName = generateFileName(fileName);
    const putObjectCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: obscuredFileName,
      ContentType: fileType,
      ContentLength: fileSize,
      ChecksumSHA256: checksum,
    });

    const url = await getSignedUrl(s3Client, putObjectCommand, {
      expiresIn: 60,
    });
    return { success: { url, id: fileId, uploadedFileName: obscuredFileName } };
  } catch (error) {
    console.error("S3 presigned URL generation failed:", error);
    return { failure: `S3 error: ${(error as Error).message}` };
  }
};

