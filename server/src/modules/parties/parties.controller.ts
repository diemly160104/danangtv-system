import type { NextFunction, Request, Response } from "express";
import {
  listPartiesService,
  createPartyService,
  updatePartyService,
  deletePartyService,
} from "./parties.service";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listPartiesController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listPartiesService();
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createPartyController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createPartyService(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updatePartyController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const partyId = getSingleParam(req.params.partyId);

    if (!partyId) {
      return res.status(400).json({
        message: "Thiếu partyId",
      });
    }

    const result = await updatePartyService(partyId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deletePartyController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const partyId = getSingleParam(req.params.partyId);

    if (!partyId) {
      return res.status(400).json({
        message: "Thiếu partyId",
      });
    }

    const result = await deletePartyService(partyId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}