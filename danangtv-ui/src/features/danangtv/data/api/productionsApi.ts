import type { ProductionSavePayload } from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

export async function createProduction(payload: ProductionSavePayload) {
  return apiRequest<{ ok: true; production_id: string }>(
    danangTvApiEndpoints.productions,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateProduction(
  productionId: string,
  payload: ProductionSavePayload
) {
  return apiRequest<{ ok: true; production_id: string }>(
    danangTvApiEndpoints.productionById(productionId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function deleteProduction(productionId: string) {
  return apiRequest<{ ok: true }>(
    danangTvApiEndpoints.productionById(productionId),
    {
      method: "DELETE",
    }
  );
}