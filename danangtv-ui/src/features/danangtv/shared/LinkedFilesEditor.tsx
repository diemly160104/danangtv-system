import React, { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import type {
  Folder,
  FileRow,
  DraftLinkedFile,
} from "@/features/danangtv/types";

import {
  createDraftLinkedFileFromRepository,
  createDraftLinkedFileFromLocal,
  normalizeMainFile,
} from "@/features/danangtv/selectors";

import {folderOptions} from "@/features/danangtv/options";

import {FieldBlock} from "@/features/danangtv/shared/commonComponents";
import {folderLabel} from "@/features/danangtv/utils/Helpers";


// Hàm dùng để thêm, sửa, xóa và hiển thị danh sách các file liên kết với một nghiệp vụ nào đó (hợp đồng, sản xuất, content...)

export function LinkedFilesEditor({
  mode,
  rows,
  setRows,
  defaultUploadFolder,
  files,
}: {
  mode: "local" | "repository";
  rows: DraftLinkedFile[];
  setRows: React.Dispatch<React.SetStateAction<DraftLinkedFile[]>>;
  defaultUploadFolder?: Folder;
  files: FileRow[];
}) {
  const [fileSearch, setFileSearch] = useState("");
  const [folderFilter, setFolderFilter] = useState<"all" | Folder>("all");

  const filteredFiles = useMemo(() => {
    return files.filter(
      (file) =>
        file.file_name.toLowerCase().includes(fileSearch.toLowerCase()) &&
        (folderFilter === "all" ? true : file.folder === folderFilter)
    );
  }, [files, fileSearch, folderFilter]);

  const updateRow = (rowId: string, key: keyof DraftLinkedFile, value: any) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
    );
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const handleLocalFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pickedFiles = Array.from(e.target.files ?? []);
    if (pickedFiles.length === 0) return;

    const targetFolder = defaultUploadFolder || "general";

    setRows((prev) => [
      ...prev,
      ...pickedFiles.map((file) => createDraftLinkedFileFromLocal(file, targetFolder)),
    ]);

    e.target.value = "";
  };

  const addRepositoryFile = (file: FileRow) => {
    setRows((prev) => {
      const exists = prev.some((row) => row.file_id === file.file_id);
      if (exists) return prev;
      return [...prev, createDraftLinkedFileFromRepository(file)];
    });
  };

  return (
    <div className="space-y-4">
      {mode === "local" ? (
        <div>
          <Input type="file" multiple onChange={handleLocalFiles} />
        </div>
      ) : (
        <div className="space-y-4 rounded-2xl border p-4">
          <div className="grid gap-4 md:grid-cols-2">
            <FieldBlock label="Tìm file theo tên">
              <Input
                value={fileSearch}
                onChange={(e) => setFileSearch(e.target.value)}
                placeholder="Nhập tên file để tìm..."
              />
            </FieldBlock>

            <FieldBlock label="Bộ lọc thư mục">
              <Select
                value={folderFilter}
                onValueChange={(value) =>
                  setFolderFilter(value as "all" | FileRow["folder"])
                }
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Chọn thư mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả thư mục</SelectItem>
                  {folderOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldBlock>
          </div>

          <div className="max-h-56 space-y-2 overflow-auto rounded-2xl border p-3">
            {filteredFiles.map((file) => {
              const exists = rows.some((row) => row.file_id === file.file_id);

              return (
                <button
                  key={file.file_id}
                  type="button"
                  disabled={exists}
                  onClick={() => addRepositoryFile(file)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-sm ${
                    exists
                      ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span>{file.file_name}</span>
                  <span className="text-xs">
                    {exists ? "Đã thêm" : folderLabel(file.folder)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-800">{row.file_name}</div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => removeRow(row.id)}
                >
                  Xóa
                </Button>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <FieldBlock label="Vai trò file">
                  <Input
                    value={row.file_role}
                    onChange={(e) => updateRow(row.id, "file_role", e.target.value)}
                    placeholder="Ví dụ: Hợp đồng chính, file master, storyboard..."
                  />
                </FieldBlock>

                <FieldBlock label="File chính">
                  <Select
                    value={String(row.is_main)}
                    onValueChange={(value) =>
                      setRows((prev) => normalizeMainFile(prev, row.id, value === "true"))
                    }
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Có</SelectItem>
                      <SelectItem value="false">Không</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldBlock>

                <FieldBlock label="Ghi chú">
                  <Input
                    value={row.notes}
                    onChange={(e) => updateRow(row.id, "notes", e.target.value)}
                  />
                </FieldBlock>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
            Chưa có file nào.
          </div>
        )}
      </div>
    </div>
  );
}

