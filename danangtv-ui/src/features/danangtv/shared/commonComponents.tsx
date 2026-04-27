import * as React from "react";
import { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type {
  DraftLinkedFile,
  FileRow,
  Folder,
  Option,
} from "@/features/danangtv/types";

import {
  folderLabel,
  statusLabel,
} from "@/features/danangtv/utils/Helpers";

import { getFilesByIds } from "@/features/danangtv/selectors";
import { buildOpenFileUrl } from "@/features/danangtv/data/api/filesApi";

// ======================================================
// THÀNH PHẦN HIỂN THỊ TRẠNG THÁI VÀ NÚT DÙNG CHUNG
// ======================================================

export function StatusBadge({ value }: { value: string }) {
  const map: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-700",
    completed: "bg-slate-100 text-slate-700",
    draft: "bg-amber-100 text-amber-700",
    cancelled: "bg-rose-100 text-rose-700",
    planned: "bg-blue-100 text-blue-700",
    approved: "bg-emerald-100 text-emerald-700",
    broadcasted: "bg-slate-100 text-slate-700",
    editing: "bg-sky-100 text-sky-700",
    rejected: "bg-rose-100 text-rose-700",
    overdue: "bg-rose-100 text-rose-700",
    paid: "bg-emerald-100 text-emerald-700",
    issued: "bg-emerald-100 text-emerald-700",
    void: "bg-slate-100 text-slate-700",
    partial: "bg-violet-100 text-violet-700",
    in_progress: "bg-sky-100 text-sky-700",
    done: "bg-slate-100 text-slate-700",
    inactive: "bg-slate-100 text-slate-700",
    terminated: "bg-slate-100 text-slate-700",
    locked: "bg-rose-100 text-rose-700",
  };
  return <Badge className={`rounded-full border-0 ${map[value] || "bg-slate-100 text-slate-700"}`}>{statusLabel(value)}</Badge>;
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={`rounded-2xl bg-orange-500 hover:bg-orange-600 ${className}`.trim()}
      {...props}
    >
      {children}
    </Button>
  );
}


// ======================================================
// THÀNH PHẦN HIỂN THỊ VĂN BẢN VÀ ĐƯỜNG DẪN
// ======================================================

export function TruncatedHoverText({
  text,
  widthClass = "max-w-[240px]",
  className = "",
}: {
  text?: string | null;
  widthClass?: string;
  className?: string;
}) {
  const value = String(text || "—");

  return (
    <div className={`group relative min-w-0 ${className}`}>
      <div className={`truncate ${widthClass}`} title={value}>
        {value}
      </div>

      <div className="pointer-events-none absolute left-0 top-full z-50 mt-1 hidden max-w-[420px] min-w-[220px] whitespace-normal break-words rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-xl group-hover:block">
        {value}
      </div>
    </div>
  );
}

export function StoragePathLink({
  storagePath,
  fallbackText = "—",
}: {
  storagePath?: string | null;
  fallbackText?: string;
}) {
  const value = String(storagePath || "").trim();

  if (!value) {
    return <span className="text-slate-500">{fallbackText}</span>;
  }

  return (
    <a
      href={buildOpenFileUrl(value)}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
      title={value}
    >
      {value}
    </a>
  );
}

export function SuggestionList({
  items,
  onPick,
  emptyText = "Không có kết quả phù hợp.",
}: {
  items: string[];
  onPick?: (value: string) => void;
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="mt-2 rounded-2xl border bg-white p-3 text-sm text-slate-500 shadow-sm">
        {emptyText}
      </div>
    );
  }

  return (
    <div className="mt-2 max-h-56 overflow-auto rounded-2xl border bg-white p-2 shadow-sm">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            onPick?.(item);
          }}
          className="block w-full rounded-xl px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
        >
          {item}
        </button>
      ))}
    </div>
  );
}


// ======================================================
// THÀNH PHẦN HIỂN THỊ VÀ QUẢN LÝ FILE
// ======================================================

export function UploadLocalFilesPanel({ defaultFolder = "general" }: { defaultFolder?: Folder }) {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  return (
    <div className="space-y-3">
      <div>
        <Input
          type="file"
          multiple
          onChange={(e) =>
            setSelectedFiles(Array.from(e.target.files ?? []).map((file) => file.name))
          }
        />
      </div>
      <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
        {selectedFiles.length > 0
          ? `Đã chọn ${selectedFiles.length} file. Thư mục đích: ${folderLabel(defaultFolder)}.`
          : "Chưa chọn file nào."}
      </div>
    </div>
  );
}

export function FilesPanel({
  files,
  fileIds,
  canEdit = false,
  localOnly = false,
}: {
  files: FileRow[];
  fileIds?: string[];
  canEdit?: boolean;
  localOnly?: boolean;
}) {
  const linkedFiles = getFilesByIds(files, fileIds);

  return (
    <div className="space-y-3">
      {linkedFiles.length > 0 ? (
        <div className="space-y-2">
          {linkedFiles.map((file) => (
            <div key={file.file_id} className="flex items-center justify-between rounded-xl border bg-slate-50 px-3 py-2 text-sm">
              <div>
                <div className="font-medium text-slate-800">{file.file_name}</div>
                <div className="text-slate-500">
                  <StoragePathLink storagePath={file.storage_path} />
                </div>
              </div>
              {canEdit && <Button size="sm" variant="outline" className="rounded-xl">Xóa</Button>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
          Chưa có file nào.
        </div>
      )}

      {canEdit && (
        <div>
          {localOnly ? <UploadLocalFilesPanel /> : <UploadLocalFilesPanel />}
        </div>
      )}
    </div>
  );
}

export function LinkedFilesViewer({ rows }: { rows: DraftLinkedFile[] }) {
  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        rows.map((row) => (
          <div key={row.id} className="rounded-xl border bg-slate-50 px-3 py-3 text-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-slate-800">{row.file_name}</div>
                <div className="text-slate-500">
                  <StoragePathLink
                    storagePath={row.storage_path}
                    fallbackText="File local chưa có storage path"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {row.file_role && (
                  <Badge className="rounded-full border-0 bg-blue-100 text-blue-700">
                    {row.file_role}
                  </Badge>
                )}
                {row.is_main && (
                  <Badge className="rounded-full border-0 bg-emerald-100 text-emerald-700">
                    File chính
                  </Badge>
                )}
              </div>
            </div>

            {row.notes && <div className="mt-2 text-slate-500">Ghi chú: {row.notes}</div>}
          </div>
        ))
      ) : (
        <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
          Chưa có file nào.
        </div>
      )}
    </div>
  );
}

// ======================================================
// THÀNH PHẦN BỐ CỤC VÀ FORM DÙNG CHUNG
// ======================================================

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DetailSectionTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex items-center gap-2 text-base font-bold text-slate-900 ${className}`}>
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]" />
      {children}
    </div>
  );
}

export function DetailDrawer({ title, open, onClose, children }: { title: string; open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl border-l bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-5 py-4">
          <div className="text-lg font-semibold">{title}</div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="h-[calc(100%-72px)] overflow-auto p-5">{children}</div>
      </div>
    </div>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
      <DetailSectionTitle className="mb-2">{title}</DetailSectionTitle>
      {description && (
        <p className="mb-4 text-sm text-slate-500">{description}</p>
      )}
      {children}
    </div>
  );
}


// ======================================================
// THÀNH PHẦN DÙNG CHUNG CHO CÁC FORM NHẬP LIỆU VÀ IMPORT FILE
// ======================================================

export function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-slate-700">{label}</div>
      {children}
    </div>
  );
}

export function EnumSelect<T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value?: T | string;
  onChange: (value: T) => void;
  options: Option<T>[];
  placeholder?: string;
}) {
  return (
    <Select value={String(value ?? "")} onValueChange={(v) => onChange(v as T)}>
      <SelectTrigger className="rounded-2xl">
        <SelectValue placeholder={placeholder || "Chọn"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ======================================================
// HÀM XỬ LÝ DỮ LIỆU
// ======================================================

export function normalizeMin1(value: string) {
  if (value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "1";
  return String(Math.max(1, n));
}

export function normalizeMin0(value: string) {
  if (value === "") return "";
  const n = Number(value);
  if (Number.isNaN(n)) return "0";
  return String(Math.max(0, n));
}


// ======================================================
// THÀNH PHẦN HIỂN THỊ DANH SÁCH HÀNH ĐỘNG DÙNG CHUNG
// ======================================================

export function ActionDropdown({ items, onAction }: { items: { value: string; label: string }[]; onAction: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <Select value={value} onValueChange={(next) => { setValue(""); onAction(next); }}>
      <SelectTrigger className="w-[170px] rounded-xl"><SelectValue placeholder="Hành động" /></SelectTrigger>
      <SelectContent>
        {items.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}