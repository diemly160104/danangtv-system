import type { Request } from "express";
import { HttpError } from "./httpError";

export function getActorUserId(req: Request) {
  const headerUserId = req.header("x-user-id")?.trim();

  if (headerUserId) {
    return headerUserId;
  }

  return null;
}

export function requireActorUserId(req: Request) {
  const userId = getActorUserId(req);

  if (!userId) {
    throw new HttpError(401, "Không xác định được người dùng thực hiện.");
  }

  return userId;
}