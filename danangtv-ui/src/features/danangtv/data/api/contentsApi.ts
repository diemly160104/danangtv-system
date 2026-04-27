import type { ContentSavePayload } from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

export async function createContent(payload: ContentSavePayload) {
  return apiRequest<{ ok: true; content_id: string }>(
    danangTvApiEndpoints.contents,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateContent(
  contentId: string,
  payload: ContentSavePayload
) {
  return apiRequest<{ ok: true; content_id: string }>(
    danangTvApiEndpoints.contentById(contentId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function approveContent(contentId: string) {
  return apiRequest<{ ok: true; content_id: string }>(
    danangTvApiEndpoints.contentApprove(contentId),
    {
      method: "POST",
    }
  );
}

export async function deleteContent(contentId: string) {
  return apiRequest<{ ok: true }>(
    danangTvApiEndpoints.contentById(contentId),
    {
      method: "DELETE",
    }
  );
}