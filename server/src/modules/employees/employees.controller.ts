import type { NextFunction, Request, Response } from "express";
import {
  listEmployeesService,
  createEmployeeService,
  updateEmployeeService,
  deleteEmployeeService,
} from "./employees.service";

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function listEmployeesController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listEmployeesService();
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await createEmployeeService(req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const employeeId = getSingleParam(req.params.employeeId);

    if (!employeeId) {
      return res.status(400).json({
        message: "Thiếu employeeId",
      });
    }

    const result = await updateEmployeeService(employeeId, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteEmployeeController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const employeeId = getSingleParam(req.params.employeeId);

    if (!employeeId) {
      return res.status(400).json({
        message: "Thiếu employeeId",
      });
    }

    const result = await deleteEmployeeService(employeeId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}