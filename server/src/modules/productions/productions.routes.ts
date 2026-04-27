import { Router } from "express";
import multer from "multer";
import {
  createProductionController,
  updateProductionController,
  deleteProductionController,
  importProductionsController,
} from "./productions.controller";

export const productionsRouter = Router();

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

productionsRouter.post("/", createProductionController);
productionsRouter.post("/import", importUpload.array("files"), importProductionsController);
productionsRouter.put("/:productionId", updateProductionController);
productionsRouter.delete("/:productionId", deleteProductionController);