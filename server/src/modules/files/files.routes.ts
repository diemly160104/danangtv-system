import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../../lib/asyncHandler";
import {
  listFilesController,
  uploadFilesController,
  updateFileController,
  deleteFileController,
  openFileController,
} from "./files.controller";

export const filesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

filesRouter.get("/", asyncHandler(listFilesController));
filesRouter.post("/upload", upload.array("files"), asyncHandler(uploadFilesController));
filesRouter.get("/open", asyncHandler(openFileController));

filesRouter.put("/:fileId", updateFileController);
filesRouter.delete("/:fileId", deleteFileController);
