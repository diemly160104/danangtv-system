import { Router } from "express";
import {
  approveContentController,
  createContentController,
  deleteContentController,
  updateContentController,
} from "./contents.controller";

export const contentsRouter = Router();

contentsRouter.post("/", createContentController);
contentsRouter.put("/:contentId", updateContentController);
contentsRouter.post("/:contentId/approve", approveContentController);
contentsRouter.delete("/:contentId", deleteContentController);