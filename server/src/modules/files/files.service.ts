import path from "path";
import { withTransaction } from "../../db/tx";
import { uploadBufferToGcs } from "../../storage/gcs";
import {
  findExistingFileRepo,
  insertFileRepo,
  listFilesRepo,
} from "./files.repo";
import { pool } from "../../db/pool";
import {
  buildStorageObjectPath,
  type StorageFolder,
  type UploadPathContext,
} from "../../lib/storagePath";

export async function listFilesService(filters?: {
  folder?: string;
  search?: string;
}) {
  return listFilesRepo(filters);
}

function normalizeFileDuplicateKey(input: {
  folder: string;
  parentDir: string;
  fileName: string;
  fileSize: number | null;
}) {
  return [
    input.folder.trim().toLowerCase(),
    input.parentDir.trim().toLowerCase(),
    input.fileName.trim().toLowerCase(),
    input.fileSize ?? "null",
  ].join("|");
}

export async function uploadFilesService(args: {
  files: Express.Multer.File[];
  folder: string;
  uploadedBy: string;
  notes?: string;
  pathContext?: UploadPathContext;
}) {
  return withTransaction(async (client) => {
    const results = [];
    const requestSeen = new Map<string, any>();

    for (const file of args.files) {
      const objectPath = buildStorageObjectPath({
        folder: args.folder as StorageFolder,
        originalFileName: file.originalname,
        context: args.pathContext,
      });

      const parentDir = `/${path.posix.dirname(objectPath)}`;
      const duplicateKey = normalizeFileDuplicateKey({
        folder: args.folder,
        parentDir,
        fileName: file.originalname,
        fileSize: file.size || null,
      });

      const alreadySeenInRequest = requestSeen.get(duplicateKey);
      if (alreadySeenInRequest) {
        results.push(alreadySeenInRequest);
        continue;
      }

      const existing = await findExistingFileRepo(client, {
        folder: args.folder,
        file_name: file.originalname,
        file_size: file.size || null,
        parent_storage_dir: parentDir,
      });

      if (existing) {
        requestSeen.set(duplicateKey, existing);
        results.push(existing);
        continue;
      }

      const uploaded = await uploadBufferToGcs({
        buffer: file.buffer,
        mimeType: file.mimetype,
        objectPath,
      });

      const inserted = await insertFileRepo(client, {
        file_name: file.originalname,
        folder: args.folder,
        storage_path: uploaded.storagePath,
        file_extension:
          path.extname(file.originalname).replace(".", "") || null,
        file_size: file.size || null,
        uploaded_by: args.uploadedBy,
        notes: args.notes || null,
      });

      requestSeen.set(duplicateKey, inserted);
      results.push(inserted);
    }

    return results;
  });
}

export async function updateFileCatalogService(
  fileId: string,
  payload: { notes?: string | null }
) {
  const result = await pool.query(
    `
    update "Files"
    set notes = $2
    where file_id = $1
    returning
      file_id,
      file_name,
      storage_path,
      file_extension,
      file_size,
      folder,
      uploaded_at,
      notes,
      'Hệ thống'::text as uploaded_by_name
    `,
    [fileId, payload.notes || null]
  );

  if (!result.rowCount) {
    throw new Error("Không tìm thấy file.");
  }

  const row = result.rows[0];

  const uploaderResult = await pool.query(
    `
    select coalesce(e.employee_name, u.username, 'Hệ thống') as uploaded_by_name
    from "Files" f
    left join "Users" u on u.user_id = f.uploaded_by
    left join "Employees" e on e.user_id = u.user_id
    where f.file_id = $1
    `,
    [fileId]
  );

  return {
    ...row,
    uploaded_by_name: uploaderResult.rows[0]?.uploaded_by_name || "Hệ thống",
  };
}

export async function deleteFileCatalogService(fileId: string) {
  const refs = await pool.query(
    `
    select
      exists(select 1 from "ContractFiles" where file_id = $1) as in_contracts,
      exists(select 1 from "ProductionFiles" where file_id = $1) as in_productions,
      exists(select 1 from "ContentFiles" where file_id = $1) as in_contents,
      exists(select 1 from "InvoiceFiles" where file_id = $1) as in_invoices
    `,
    [fileId]
  );

  const row = refs.rows[0];

  if (row?.in_contracts || row?.in_productions || row?.in_contents || row?.in_invoices) {
    throw new Error("Không thể xóa file vì file đang được liên kết ở dữ liệu khác.");
  }

  const result = await pool.query(
    `delete from "Files" where file_id = $1 returning file_id`,
    [fileId]
  );

  if (!result.rowCount) {
    throw new Error("Không tìm thấy file.");
  }

  return result.rows[0];
}