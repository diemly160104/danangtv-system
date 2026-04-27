import { danangTvApiEndpoints } from "./endpoints";
import { getStoredSessionUser } from "./sessionUser";

export type ProductionImportApiResult = {
  ok: true;
  module: "productions";
  batch_id: string;
  staged_dir: string;
  file_names: string[];
  imported_count: number;
  warnings: string[];
  message: string;
  summary?: {
    created_productions: number;
    skipped_existing_productions: number;
    created_tasks: number;
    created_employees: number;
    reused_employees: number;
  };
};

function buildApiUrl(path: string) {
  const baseUrl = (import.meta.env.VITE_API_BASE_URL || "")
    .trim()
    .replace(/\/$/, "");
  return baseUrl ? `${baseUrl}${path}` : path;
}

export async function importProductionsApi(params: {
  files: File[];
}) {
  const formData = new FormData();

  for (const file of params.files) {
    formData.append("files", file);
  }

  const url = buildApiUrl(danangTvApiEndpoints.productionImport);
  const sessionUser = getStoredSessionUser();

  console.log("[IMPORT PRODUCTION] POST", url, sessionUser?.user_id || "(no user)");

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: sessionUser?.user_id
      ? {
          "x-user-id": sessionUser.user_id,
        }
      : undefined,
  });

  const rawText = await response.text();

  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    console.error("[IMPORT PRODUCTION FAILED]", {
      url,
      status: response.status,
      statusText: response.statusText,
      rawText,
      data,
    });

    throw new Error(
      data?.message ||
        `Import dự án sản xuất thất bại. HTTP ${response.status} ${response.statusText}. Response: ${rawText.slice(0, 300)}`
    );
  }

  console.log("[IMPORT PRODUCTION SUCCESS]", data);

  return data as ProductionImportApiResult;
}