import type { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { Storage } from "@google-cloud/storage";
import { env } from "../../config/env";
import { HttpError } from "../../lib/httpError";
import { requireActorUserId } from "../../lib/actor";
import {
  listFilesService,
  uploadFilesService,
  updateFileCatalogService,
  deleteFileCatalogService,
} from "./files.service";
import type { UploadPathContext } from "../../lib/storagePath";

const listFilesSchema = z.object({
  folder: z.string().optional(),
  search: z.string().optional(),
});

const storage = new Storage();

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parsePathContext(rawValue: unknown): UploadPathContext {
  if (!rawValue) return {};

  if (typeof rawValue === "string") {
    try {
      const parsed = JSON.parse(rawValue);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  if (typeof rawValue === "object" && rawValue !== null) {
    return rawValue as UploadPathContext;
  }

  return {};
}

export async function listFilesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = listFilesSchema.parse(req.query);

    const rows = await listFilesService({
      folder: parsed.folder,
      search: parsed.search,
    });

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function uploadFilesController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const folder = String(req.body.folder || "");
    const notes = String(req.body.notes || "");
    const pathContext = parsePathContext(req.body.path_context);
    const files = (req.files as Express.Multer.File[]) || [];

    if (!folder) {
      throw new HttpError(400, "Thiếu folder.");
    }

    if (!files.length) {
      throw new HttpError(400, "Chưa có file nào được gửi lên.");
    }

    const actorUserId = requireActorUserId(req);

    const rows = await uploadFilesService({
      files,
      folder,
      uploadedBy: actorUserId,
      notes,
      pathContext,
    });

    res.status(201).json(rows);
  } catch (error) {
    next(error);
  }
}

export async function updateFileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const fileId = getSingleParam(req.params.fileId);

    if (!fileId) {
      return res.status(400).json({
        message: "Thiếu fileId",
      });
    }

    const result = await updateFileCatalogService(fileId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteFileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const fileId = getSingleParam(req.params.fileId);

    if (!fileId) {
      return res.status(400).json({
        message: "Thiếu fileId",
      });
    }

    const result = await deleteFileCatalogService(fileId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}


export async function openFileController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const pathQuery =
      typeof req.query.path === "string" ? req.query.path.trim() : "";

    if (!pathQuery) {
      return res.status(400).json({
        message: "Thiếu storage path",
      });
    }

    const normalizedPath = pathQuery.replace(/^\/+/, "");
    const file = storage.bucket(env.GCS_BUCKET_NAME).file(normalizedPath);

    const [exists] = await file.exists();

    if (!exists) {
      return res.status(404).json({
        message: "File không tồn tại trên storage.",
      });
    }

    const [metadata] = await file.getMetadata();

    res.setHeader(
      "Content-Type",
      metadata.contentType || "application/octet-stream"
    );

    const safeFileName =
      normalizedPath.split("/").pop() || "download";

    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(safeFileName)}"`
    );

    file
      .createReadStream()
      .on("error", next)
      .pipe(res);
  } catch (error) {
    next(error);
  }
}