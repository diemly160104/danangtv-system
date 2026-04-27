import type { NextFunction, Request, Response } from "express";
import {
  saveProductionService,
  deleteProductionService,
} from "./productions.service";
import { importProductionsFromEtlService } from "./productions.import.service";
import { requireActorUserId } from "../../lib/actor";

export async function createProductionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);
    const result = await saveProductionService(req.body, actorUserId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateProductionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = {
      ...req.body,
      production: {
        ...req.body.production,
        production_id: req.params.productionId,
      },
    };

    const actorUserId = requireActorUserId(req);
    const result = await saveProductionService(payload, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteProductionController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const productionId = Array.isArray(req.params.productionId)
      ? req.params.productionId[0]
      : req.params.productionId;

    if (!productionId) {
      return res.status(400).json({
        message: "Thiếu productionId",
      });
    }

    const result = await deleteProductionService(productionId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function importProductionsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const files = Array.isArray(req.files) ? req.files : [];

    const actorUserId = requireActorUserId(req);
    const result = await importProductionsFromEtlService(
      {
        files,
      },
      actorUserId
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}