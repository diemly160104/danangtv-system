import type { PartyView } from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

function isUuid(value?: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value || ""
  );
}

export async function getPartiesApi() {
  return apiRequest<PartyView[]>(danangTvApiEndpoints.parties, {
    method: "GET",
  });
}

export async function createPartyApi(payload: Omit<PartyView, "party_id">) {
  return apiRequest<PartyView>(danangTvApiEndpoints.parties, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePartyApi(partyId: string, payload: PartyView) {
  return apiRequest<PartyView>(danangTvApiEndpoints.partyById(partyId), {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function savePartyApi(payload: PartyView) {
  if (isUuid(payload.party_id)) {
    return updatePartyApi(payload.party_id, payload);
  }

  const { party_id, ...createPayload } = payload;
  return createPartyApi(createPayload);
}

export async function deletePartyApi(partyId: string) {
  return apiRequest<{ party_id: string }>(
    danangTvApiEndpoints.partyById(partyId),
    {
      method: "DELETE",
    }
  );
}