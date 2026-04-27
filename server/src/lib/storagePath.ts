import path from "path";

export type StorageFolder = "contracts" | "invoices" | "productions" | "general";

export type UploadPathContext = {
  contract_number?: string;
  signed_date?: string;
  production_name?: string;
  production_id?: string;
  start_date?: string;
};

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function safeSegment(value: string, fallback: string) {
  const normalized = slugify(value);
  return normalized || fallback;
}

function extractYearMonth(dateText?: string) {
  if (!dateText || !/^\d{4}-\d{2}-\d{2}/.test(dateText)) {
    return { year: "unknown-year", month: "unknown-month" };
  }

  return {
    year: dateText.slice(0, 4),
    month: dateText.slice(5, 7),
  };
}

function buildStoredFileName(originalName: string) {
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext);
  const safeBase = safeSegment(base, "file");
  const stamp = Date.now();
  return `${stamp}-${safeBase}${ext.toLowerCase()}`;
}

export function buildStorageObjectPath(params: {
  folder: StorageFolder;
  originalFileName: string;
  context?: UploadPathContext;
}) {
  const { folder, originalFileName, context } = params;
  const storedFileName = buildStoredFileName(originalFileName);

  if (folder === "general") {
    return `general/${storedFileName}`;
  }

  if (folder === "contracts") {
    const { year, month } = extractYearMonth(context?.signed_date);
    const contractFolder = safeSegment(context?.contract_number || "", "unknown-contract");
    return `contracts/${year}/${month}/${contractFolder}/${storedFileName}`;
  }

  if (folder === "invoices") {
    const { year, month } = extractYearMonth(context?.signed_date);
    const contractFolder = safeSegment(context?.contract_number || "", "unknown-contract");
    return `invoices/${year}/${month}/${contractFolder}/${storedFileName}`;
  }

  if (folder === "productions") {
    const { year, month } = extractYearMonth(context?.start_date);
    const baseName = safeSegment(context?.production_name || "", "unknown-production");
    const suffix = context?.production_id ? `-${context.production_id.slice(0, 8)}` : "";
    return `productions/${year}/${month}/${baseName}${suffix}/${storedFileName}`;
  }

  return `${folder}/${storedFileName}`;
}