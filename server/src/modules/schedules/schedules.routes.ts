import { Router } from "express";
import {
  approveBroadcastScheduleController,
  approveStudioUsageController,
  createBroadcastScheduleController,
  createStudioUsageController,
  deleteBroadcastScheduleController,
  deleteStudioUsageController,
  updateBroadcastScheduleController,
  updateStudioUsageController,
} from "./schedules.controller";

export const schedulesRouter = Router();
export const studioUsageSchedulesRouter = Router();

schedulesRouter.post("/", createBroadcastScheduleController);
schedulesRouter.put("/:broadcastId", updateBroadcastScheduleController);
schedulesRouter.post("/:broadcastId/approve", approveBroadcastScheduleController);
schedulesRouter.delete("/:broadcastId", deleteBroadcastScheduleController);

studioUsageSchedulesRouter.post("/", createStudioUsageController);
studioUsageSchedulesRouter.put("/:usageScheduleId", updateStudioUsageController);
studioUsageSchedulesRouter.post(
  "/:usageScheduleId/approve",
  approveStudioUsageController
);
studioUsageSchedulesRouter.delete(
  "/:usageScheduleId",
  deleteStudioUsageController
);