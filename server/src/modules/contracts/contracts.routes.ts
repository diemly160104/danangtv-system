import { Router } from "express";
import multer from "multer";
import {
  createContractController,
  createInvoiceController,
  createPaymentController,
  updatePaymentController,
  deletePaymentController,
  updateInvoiceController,
  deleteInvoiceController,
  listContractsController,
  updateContractController,
  deleteContractController,
  importContractsController,
} from "./contracts.controller";

export const contractsRouter = Router();

const importUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024,
  },
});

contractsRouter.get("/", listContractsController);
contractsRouter.post("/", createContractController);
contractsRouter.post("/import", importUpload.array("files"), importContractsController);
contractsRouter.put("/:contractId", updateContractController);

contractsRouter.post("/:contractId/payments", createPaymentController);
contractsRouter.put("/payments/:paymentId", updatePaymentController);
contractsRouter.delete("/payments/:paymentId", deletePaymentController);

contractsRouter.post("/:contractId/invoices", createInvoiceController);
contractsRouter.put("/invoices/:invoiceId", updateInvoiceController);
contractsRouter.delete("/invoices/:invoiceId", deleteInvoiceController);
contractsRouter.delete("/:contractId", deleteContractController);