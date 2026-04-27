import type { Request, Response } from "express";
import { getBootstrapData } from "./bootstrap.service";

export async function getBootstrapController(_req: Request, res: Response) {
  const data = await getBootstrapData();
  res.json(data);
}