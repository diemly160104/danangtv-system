import type { NextFunction, Request, Response } from "express";
import { requireActorUserId } from "../../lib/actor";
import {
  approveBroadcastScheduleService,
  approveStudioUsageService,
  deleteBroadcastScheduleService,
  deleteStudioUsageService,
  saveBroadcastScheduleService,
  saveStudioUsageService,
} from "./schedules.service";

export async function createBroadcastScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);
    const result = await saveBroadcastScheduleService(req.body, actorUserId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateBroadcastScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = {
      ...req.body,
      broadcast_id: req.params.broadcastId,
    };

    const actorUserId = requireActorUserId(req);
    const result = await saveBroadcastScheduleService(payload, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function approveBroadcastScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const broadcastId = Array.isArray(req.params.broadcastId)
      ? req.params.broadcastId[0]
      : req.params.broadcastId;

    const actorUserId = requireActorUserId(req);
    const result = await approveBroadcastScheduleService(broadcastId, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteBroadcastScheduleController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const broadcastId = Array.isArray(req.params.broadcastId)
      ? req.params.broadcastId[0]
      : req.params.broadcastId;

    const result = await deleteBroadcastScheduleService(broadcastId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createStudioUsageController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);
    const result = await saveStudioUsageService(req.body, actorUserId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateStudioUsageController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);

    const payload = {
      ...req.body,
      usage_schedule_id: req.params.usageScheduleId,
    };

    const result = await saveStudioUsageService(payload, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function approveStudioUsageController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const usageScheduleId = Array.isArray(req.params.usageScheduleId)
      ? req.params.usageScheduleId[0]
      : req.params.usageScheduleId;

    const actorUserId = requireActorUserId(req);
    const result = await approveStudioUsageService(usageScheduleId, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteStudioUsageController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const usageScheduleId = Array.isArray(req.params.usageScheduleId)
      ? req.params.usageScheduleId[0]
      : req.params.usageScheduleId;

    const result = await deleteStudioUsageService(usageScheduleId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}