import type { FileRow, Folder } from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

export type UploadPathContext = {
  contract_number?: string;
  signed_date?: string;
  production_name?: string;
  production_id?: string;
  start_date?: string;
};

export async function uploadFiles(args: {
  files: File[];
  folder: Folder;
  notes?: string;
  pathContext?: UploadPathContext;
}) {
  const formData = new FormData();

  args.files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("folder", args.folder);

  if (args.notes) {
    formData.append("notes", args.notes);
  }

  if (args.pathContext) {
    formData.append("path_context", JSON.stringify(args.pathContext));
  }

  return apiRequest<FileRow[]>(danangTvApiEndpoints.uploadFiles, {
    method: "POST",
    body: formData,
  });
}

export async function uploadCatalogFilesApi(files: File[]) {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append("files", file);
  });

  formData.append("folder", "general");

  return apiRequest<FileRow[]>(danangTvApiEndpoints.uploadFiles, {
    method: "POST",
    body: formData,
  });
}

export async function updateFileCatalogApi(
  fileId: string,
  payload: { notes?: string | null }
) {
  return apiRequest<FileRow>(danangTvApiEndpoints.fileById(fileId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteFileCatalogApi(fileId: string) {
  return apiRequest<{ file_id: string }>(danangTvApiEndpoints.fileById(fileId), {
    method: "DELETE",
  });
}



const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:3001").replace(/\/$/, "");

export function buildOpenFileUrl(storagePath: string) {
  const url = new URL(`${API_BASE_URL}/api/danangtv/files/open`);
  url.searchParams.set("path", storagePath);
  return url.toString();
}