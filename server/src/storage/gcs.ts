import { Storage } from "@google-cloud/storage";
import path from "path";
import { env } from "../config/env";

const storage = new Storage();
const bucket = storage.bucket(env.GCS_BUCKET_NAME);

export async function uploadBufferToGcs(args: {
  buffer: Buffer;
  mimeType?: string;
  objectPath: string;
}) {
  const file = bucket.file(args.objectPath);

  await file.save(args.buffer, {
    contentType: args.mimeType || "application/octet-stream",
    resumable: false,
  });

  return {
    storagePath: `/${args.objectPath}`,
    fileName: path.basename(args.objectPath),
    objectPath: args.objectPath,
  };
}