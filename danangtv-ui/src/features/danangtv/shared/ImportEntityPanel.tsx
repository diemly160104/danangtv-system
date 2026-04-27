import React from "react";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import type {Option} from "@/features/danangtv/types";

import {
  PrimaryButton,
  FormSection,
  FieldBlock,
  EnumSelect,
} from "@/features/danangtv/shared/commonComponents";

// Hàm dùng để tải file dữ liệu lên hệ thống để import các dữ liệu hợp đồng, sản xuất

export function ImportEntityPanel<T extends string>({
  entityLabel,
  typeLabel,
  typeValue,
  onTypeChange,
  typeOptions,
  pickedFiles,
  setPickedFiles,
  onSubmit,
  submittingLabel,
}: {
  entityLabel: string;
  typeLabel?: string;
  typeValue?: T;
  onTypeChange?: (value: T) => void;
  typeOptions?: Option<T>[];
  pickedFiles: File[];
  setPickedFiles: React.Dispatch<React.SetStateAction<File[]>>;
  onSubmit: () => void;
  submittingLabel: string;
}) {
  return (
    <div className="space-y-6 py-2">
      <FormSection
        title={`Import ${entityLabel}`}
      >
        <div className="grid gap-4 md:grid-cols-2">
          {typeLabel && typeValue !== undefined && onTypeChange && typeOptions ? (
            <FieldBlock label={typeLabel}>
              <EnumSelect
                value={typeValue}
                onChange={onTypeChange}
                options={typeOptions}
              />
            </FieldBlock>
          ) : null}

          <FieldBlock label="File dữ liệu">
            <Input
              type="file"
              accept=".xlsx,.xls,.csv"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                setPickedFiles(files);
              }}
            />
          </FieldBlock>

          <div className="md:col-span-2 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-4 text-sm text-slate-600">
            {pickedFiles.length > 0
              ? `Đã chọn ${pickedFiles.length} file để import ${entityLabel.toLowerCase()}.`
              : `Chưa chọn file nào để import ${entityLabel.toLowerCase()}.`}
          </div>

          {pickedFiles.length > 0 && (
            <div className="md:col-span-2 space-y-2">
              {pickedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                >
                  {file.name}
                </div>
              ))}
            </div>
          )}
        </div>
      </FormSection>

      <DialogFooter>
        <PrimaryButton onClick={onSubmit}>{submittingLabel}</PrimaryButton>
      </DialogFooter>
    </div>
  );
}