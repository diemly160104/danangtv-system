import type {
  ContractSavePayload,
  InvoiceSavePayload,
  PaymentSavePayload,
} from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

export async function createContract(payload: ContractSavePayload) {
  return apiRequest<{ ok: true; contract_id: string }>(danangTvApiEndpoints.contracts, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateContract(
  contractId: string,
  payload: ContractSavePayload
) {
  return apiRequest<{ ok: true; contract_id: string }>(
    danangTvApiEndpoints.contractById(contractId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function createPayment(payload: PaymentSavePayload) {
  return apiRequest<{ ok: true; payment_id: string }>(
    danangTvApiEndpoints.contractPayments(payload.contract_id),
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updatePayment(
  paymentId: string,
  payload: PaymentSavePayload
) {
  return apiRequest<{ ok: true; payment_id: string }>(
    danangTvApiEndpoints.paymentById(paymentId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function deletePayment(paymentId: string) {
  return apiRequest<{ ok: true }>(
    danangTvApiEndpoints.paymentById(paymentId),
    {
      method: "DELETE",
    }
  );
}

export async function createInvoice(payload: InvoiceSavePayload) {
  return apiRequest<{ ok: true; invoice_id: string }>(
    danangTvApiEndpoints.contractInvoices(payload.contract_id),
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateInvoice(
  invoiceId: string,
  payload: InvoiceSavePayload
) {
  return apiRequest<{ ok: true; invoice_id: string }>(
    danangTvApiEndpoints.invoiceById(invoiceId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteInvoice(invoiceId: string) {
  return apiRequest<{ ok: true }>(
    danangTvApiEndpoints.invoiceById(invoiceId),
    {
      method: "DELETE",
    }
  );
}

export async function deleteContract(contractId: string) {
  return apiRequest<{ ok: true }>(
    danangTvApiEndpoints.contractById(contractId),
    {
      method: "DELETE",
    }
  );
}