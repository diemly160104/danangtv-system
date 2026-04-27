import type { NextFunction, Request, Response } from "express";
import {
  listContractsService,
  saveContractService,
  createPaymentService,
  updatePaymentService,
  deletePaymentService,
  createInvoiceService,
  updateInvoiceService,
  deleteInvoiceService,
  deleteContractService,
} from "./contracts.service";
import { importContractsFromEtlService } from "./contracts.import.service";
import { requireActorUserId } from "../../lib/actor";

export async function listContractsController(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const rows = await listContractsService();
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createContractController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const actorUserId = requireActorUserId(req);
    const result = await saveContractService(req.body, actorUserId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateContractController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = {
      ...req.body,
      contract: {
        ...req.body.contract,
        contract_id: req.params.contractId,
      },
    };

    const actorUserId = requireActorUserId(req);
    const result = await saveContractService(payload, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createPaymentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = {
      ...req.body,
      contract_id: req.params.contractId,
    };

    const actorUserId = requireActorUserId(req);
    const result = await createPaymentService(payload, actorUserId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updatePaymentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;

    const actorUserId = requireActorUserId(req);
    const result = await updatePaymentService(paymentId, req.body, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deletePaymentController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const paymentId = Array.isArray(req.params.paymentId)
      ? req.params.paymentId[0]
      : req.params.paymentId;

    const result = await deletePaymentService(paymentId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function createInvoiceController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const payload = {
      ...req.body,
      contract_id: req.params.contractId,
    };

    const actorUserId = requireActorUserId(req);
    const result = await createInvoiceService(payload, actorUserId);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function updateInvoiceController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const invoiceId = Array.isArray(req.params.invoiceId)
      ? req.params.invoiceId[0]
      : req.params.invoiceId;

    const actorUserId = requireActorUserId(req);
    const result = await updateInvoiceService(invoiceId, req.body, actorUserId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteInvoiceController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const invoiceId = Array.isArray(req.params.invoiceId)
      ? req.params.invoiceId[0]
      : req.params.invoiceId;

    const result = await deleteInvoiceService(invoiceId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function deleteContractController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const contractId = Array.isArray(req.params.contractId)
      ? req.params.contractId[0]
      : req.params.contractId;

    const result = await deleteContractService(contractId);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

export async function importContractsController(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const files = Array.isArray(req.files) ? req.files : [];

    const actorUserId = requireActorUserId(req);
    const result = await importContractsFromEtlService(
      {
        contract_type: req.body.contract_type,
        files,
      },
      actorUserId
    );

    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}