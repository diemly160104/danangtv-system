import { Router } from "express";
import {
  listPartiesController,
  createPartyController,
  updatePartyController,
  deletePartyController,
} from "./parties.controller";

export const partiesRouter = Router();

partiesRouter.get("/", listPartiesController);
partiesRouter.post("/", createPartyController);
partiesRouter.put("/:partyId", updatePartyController);
partiesRouter.delete("/:partyId", deletePartyController);