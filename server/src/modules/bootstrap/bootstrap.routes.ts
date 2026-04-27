import { Router } from "express";
import { asyncHandler } from "../../lib/asyncHandler";
import { getBootstrapController } from "./bootstrap.controller";

export const bootstrapRouter = Router();

bootstrapRouter.get("/", asyncHandler(getBootstrapController));