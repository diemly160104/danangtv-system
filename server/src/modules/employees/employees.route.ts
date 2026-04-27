import { Router } from "express";
import {
  listEmployeesController,
  createEmployeeController,
  updateEmployeeController,
  deleteEmployeeController,
} from "./employees.controller";

export const employeesRouter = Router();

employeesRouter.get("/", listEmployeesController);
employeesRouter.post("/", createEmployeeController);
employeesRouter.put("/:employeeId", updateEmployeeController);
employeesRouter.delete("/:employeeId", deleteEmployeeController);