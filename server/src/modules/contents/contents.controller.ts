import type { NextFunction, Request, Response } from "express";
import { requireActorUserId } from "../../lib/actor";
import {
  approveContentService,
  deleteContentService,
  saveContentService,
} from "./contents.service";

export async function createContentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);
    const result = await saveContentService(req.body, actorUserId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateContentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);
    const payload = {
      ...req.body,
      content: {
        ...req.body.content,
        content_id: req.params.contentId,
      },
    };

    const result = await saveContentService(payload, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function approveContentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);
    const contentId = Array.isArray(req.params.contentId)
      ? req.params.contentId[0]
      : req.params.contentId;

    const result = await approveContentService(contentId, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteContentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const contentId = Array.isArray(req.params.contentId)
      ? req.params.contentId[0]
      : req.params.contentId;

    const result = await deleteContentService(contentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}