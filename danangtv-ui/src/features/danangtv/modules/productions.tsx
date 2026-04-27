import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type {
  ProductionType,
  EmployeeDepartment,
  SessionUser,
  EmployeeView,
  FileRow,
  ContractRow,
  ServiceItemRow,
  ProductionTaskRow,
  DraftProductionTask,
  ProductionRow,
  ProductionForm,
  ProductionFormDialogProps,
  DraftLinkedFile,
  LinkedFileSeedRow,
  ProductionSavePayload,
  ServiceItemProductionRow,
  DraftProductionServiceLink
} from "@/features/danangtv/types";

import {buildDraftProductionFiles} from "@/features/danangtv/selectors";

import {
  productionTypeOptions,
  productionStatusOptions,
  employeeDepartmentOptions
} from "@/features/danangtv/options";

import {
  StatusBadge,
  PrimaryButton,
  TruncatedHoverText,
  LinkedFilesViewer,
  SuggestionList,
  FormSection,
  SectionHeader,
  DetailSectionTitle,
  DetailDrawer,
  FieldBlock,
  EnumSelect,
  normalizeMin1,
  ActionDropdown,
} from "@/features/danangtv/shared/commonComponents"

import {
  canCreateOperationalRecord,
  canDeleteOwnOperationalRecord,
  canEditOwnOperationalRecord,
  departmentLabel,
  statusLabel,
  formatDisplayDate,
  isBlank,
  searchWithMinChars,
  serviceTypeLabel,
  toDateInputValue,
  validateLinkedFilesBySchema,
  createId,
} from "@/features/danangtv/utils/Helpers";

import { LinkedFilesEditor } from "@/features/danangtv/shared/LinkedFilesEditor";
import { ImportEntityPanel } from "@/features/danangtv/shared/ImportEntityPanel";
import {searchEmployees} from "@/features/danangtv/employee-search";



// HÀM TẠO FORM TRỐNG CHO PHÂN CÔNG NHÂN SỰ 
function createEmptyProductionTask(): DraftProductionTask { 
  return { 
    id: createId("TASK"), 
    employee_search: "", 
    employee_id: "", 
    department_filter: "all", 
    role_label: "", 
  }; 
}

// HÀM TẠO FORM TRỐNG CHO LIÊN KẾT DỊCH VỤ (DỰ ÁN SẢN XUẤT LOẠI DỊCH VỤ)
function createEmptyProductionServiceLink(): DraftProductionServiceLink {
  return {
    id: createId("PSL"),
    contract_search: "",
    selected_contract_id: "",
    selected_service_item_id: "",
  };
}

// HÀM TẠO FORM TRỐNG CHO DỰ ÁN SẢN XUẤT
function createEmptyProductionForm(): ProductionForm {
  return {
    name: "",
    type: "internal",
    genre: "",
    duration_minutes: "",
    start_date: "",
    end_date: "",
    status: "planned",
    notes: "",
    producer_search: "",
    selected_producer_id: "",
    producer_department_filter: "all",
    service_links: [createEmptyProductionServiceLink()],
  };
}

// HÀM XÂY DỰNG FORM KHI CHỈNH SỬA DỰ ÁN SẢN XUẤT
function buildProductionForm(
  production: ProductionRow,
  employees: EmployeeView[],
  contracts: ContractRow[],
  serviceItems: ServiceItemRow[],
  serviceItemProductions: ServiceItemProductionRow[]
): ProductionForm {
  const producer = employees.find((emp) => emp.name === production.producer_name);

  const linkedRows = serviceItemProductions
    .filter((row) => row.production_id === production.production_id)
    .map((row, index) => {
      const linkedService =
        serviceItems.find((item) => item.service_item_id === row.service_item_id) || null;

      const linkedContract = linkedService
        ? contracts.find((item) => item.contract_id === linkedService.contract_id)
        : null;

      return {
        id: `${production.production_id}-${index}`,
        contract_search: linkedContract
          ? `${linkedContract.contract_number} • ${linkedContract.title}`
          : "",
        selected_contract_id: linkedContract?.contract_id || "",
        selected_service_item_id: linkedService?.service_item_id || "",
      };
    });

  return {
    name: production.name || "",
    type: production.type || "internal",
    genre: production.genre || "",
    duration_minutes:
      production.duration_minutes !== null &&
      production.duration_minutes !== undefined
        ? String(production.duration_minutes)
        : "",
    start_date: production.start_date || "",
    end_date: production.end_date || "",
    status: production.status || "planned",
    notes: (production as any).notes || "",
    producer_search: producer
      ? `${producer.employee_code} • ${producer.name}`
      : production.producer_name || "",
    selected_producer_id: producer?.employee_id || "",
    producer_department_filter: "all",
    service_links:
      linkedRows.length > 0 ? linkedRows : [createEmptyProductionServiceLink()],
  };
}

// HÀM XÂY DỰNG CÁC PHÂN CÔNG NHÂN SỰ CHO FORM CHỈNH SỬA DỰ ÁN SẢN XUẤT
function buildDraftProductionTasks(
  productionId: string,
  productionTasks: ProductionTaskRow[],
  employees: EmployeeView[]
): DraftProductionTask[] {
  const rows = productionTasks.filter(
    (item) => item.production_id === productionId
  );

  if (rows.length === 0) return [createEmptyProductionTask()];

  return rows.map((item) => {
    const employee = employees.find(
      (emp) => emp.employee_id === item.employee_id
    );

    return {
      id: item.task_id,
      employee_search: employee
        ? `${employee.employee_code} • ${employee.name} • ${departmentLabel(employee.department)}`
        : item.employee_name,
      employee_id: item.employee_id,
      department_filter: employee?.department || "all",
      role_label: item.role_label || "",
    };
  });
}

// HÀM KIỂM TRA FORM TRƯỚC KHI LƯU DỰ ÁN SẢN XUẤT
function validateProductionBeforeSave(args: {
  form: ProductionForm;
  taskRows: DraftProductionTask[];
  linkedFiles: DraftLinkedFile[];
}) {
  const { form, taskRows, linkedFiles } = args;

  if (isBlank(form.name)) return "Vui lòng nhập tên dự án sản xuất.";
  if (isBlank(form.type)) return "Vui lòng chọn loại sản xuất.";
  if (isBlank(form.start_date)) return "Vui lòng nhập ngày bắt đầu sản xuất.";
  if (isBlank(form.selected_producer_id)) return "Vui lòng chọn producer phụ trách.";

  const productionFileError = validateLinkedFilesBySchema(linkedFiles, {
    entityLabel: "Sản xuất",
    requireRole: false,
  });
  if (productionFileError) return productionFileError;

  if (form.type === "service") {
    const validLinks = form.service_links.filter(
      (row) => !isBlank(row.selected_contract_id) || !isBlank(row.selected_service_item_id) || !isBlank(row.contract_search)
    );

    if (validLinks.length === 0) {
      return "Dự án sản xuất dịch vụ phải có ít nhất 1 mục dịch vụ.";
    }

    for (let i = 0; i < validLinks.length; i++) {
      const row = validLinks[i];

      if (isBlank(row.selected_contract_id)) {
        return `Liên kết dịch vụ ${i + 1}: chưa chọn hợp đồng.`;
      }

      if (isBlank(row.selected_service_item_id)) {
        return `Liên kết dịch vụ ${i + 1}: chưa chọn mục dịch vụ.`;
      }
    }
  }

  for (let i = 0; i < taskRows.length; i++) {
    const row = taskRows[i];

    const hasAnyValue =
      !isBlank(row.employee_search) ||
      !isBlank(row.employee_id) ||
      !isBlank(row.role_label);

    if (!hasAnyValue) continue;

    if (isBlank(row.employee_id)) {
      return `Phân công ${i + 1}: vui lòng chọn nhân viên từ danh sách gợi ý.`;
    }
  }

  return null;
}

// FORM PHÂN CÔNG NHÂN SỰ CHO DỰ ÁN SẢN XUẤT
function ProductionAssigneeEditor({
  rows,
  setRows,
  employees,
}: {
  rows: DraftProductionTask[];
  setRows: React.Dispatch<React.SetStateAction<DraftProductionTask[]>>;
  employees: EmployeeView[];
}) {
  const updateRow = (
    rowId: string,
    key: keyof DraftProductionTask,
    value: DraftProductionTask[keyof DraftProductionTask]
  ) => {
    setRows((prev) =>
      prev.map((row) => (row.id === rowId ? { ...row, [key]: value } : row))
    );
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.id !== rowId));
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyProductionTask()]);
  };

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const selectedEmployee = employees.find(
          (emp) => emp.employee_id === row.employee_id
        );

        const filteredEmployees = employees.filter(
          (emp) =>
            emp.status === "active" &&
            (row.department_filter === "all"
              ? true
              : emp.department === row.department_filter)
        );

        const employeeSuggestions = searchWithMinChars(
          filteredEmployees,
          row.employee_search,
          (emp) => `${emp.employee_code} ${emp.name} ${departmentLabel(emp.department)}`
        );

        const suggestionLabels = employeeSuggestions.map(
          (emp) => `${emp.employee_code} • ${emp.name} • ${departmentLabel(emp.department)}`
        );

        return (
          <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="font-medium text-slate-800">Phân công {index + 1}</div>
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

            <div className="grid gap-4 md:grid-cols-3">
              <FieldBlock label="Phòng ban">
                <Select
                  value={row.department_filter}
                  onValueChange={(value) => {
                    updateRow(row.id, "department_filter", value as EmployeeDepartment | "all");
                    updateRow(row.id, "employee_id", "");
                    updateRow(row.id, "employee_search", "");
                  }}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Chọn phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phòng ban</SelectItem>
                    {employeeDepartmentOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>

              <FieldBlock label="Tìm nhân viên">
                <Input
                  value={row.employee_search}
                  onChange={(e) => {
                    updateRow(row.id, "employee_search", e.target.value);
                    updateRow(row.id, "employee_id", "");
                  }}
                  placeholder="Nhập tên nhân viên để tìm..."
                />

                {row.employee_search.trim().length >= 2 && !row.employee_id && (
                  <SuggestionList
                    items={suggestionLabels}
                    onPick={(value) => {
                      const picked = employeeSuggestions.find(
                        (emp) => `${emp.employee_code} • ${emp.name} • ${departmentLabel(emp.department)}` === value
                      );

                      if (picked) {
                        updateRow(row.id, "employee_id", picked.employee_id);
                        updateRow(
                          row.id,
                          "employee_search",
                          `${picked.employee_code} • ${picked.name}`
                        );
                      }
                    }}
                  />
                )}

                {selectedEmployee && (
                  <div className="text-xs text-emerald-600">
                    Đã chọn: {selectedEmployee.name} • {departmentLabel(selectedEmployee.department)}
                  </div>
                )}
              </FieldBlock>

              <FieldBlock label="Vai trò">
                <Input
                  value={row.role_label}
                  onChange={(e) => updateRow(row.id, "role_label", e.target.value)}
                  placeholder="Ví dụ: Producer, Biên tập, Quay phim..."
                />
              </FieldBlock>
            </div>
          </div>
        );
      })}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-orange-200 bg-white hover:bg-orange-50"
          onClick={addRow}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm phân công
        </Button>
      </div>
    </div>
  );
}

// VIEW CHI TIẾT DỰ ÁN SẢN XUẤT
export function ProductionFullView({
  production,
  contracts,
  serviceItems,
  productionTasks,
  files,
  productionFileLinks,
  serviceItemProductions,
}: {
  production: ProductionRow;
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  productionTasks: ProductionTaskRow[];
  files: FileRow[];
  productionFileLinks: LinkedFileSeedRow[];
  serviceItemProductions: ServiceItemProductionRow[];
}) {
  const linkedServiceRows = serviceItemProductions.filter(
    (row) => row.production_id === production.production_id
  );

  const linkedServices = linkedServiceRows
    .map((row) => serviceItems.find((item) => item.service_item_id === row.service_item_id))
    .filter(Boolean) as ServiceItemRow[];

  const linkedContractGroups = contracts
    .map((contract) => {
      const servicesOfContract = linkedServices.filter(
        (service) => service.contract_id === contract.contract_id
      );

      return {
        contract,
        services: servicesOfContract,
      };
    })
    .filter((group) => group.services.length > 0);

  const tasks = productionTasks.filter(
    (item) => item.production_id === production.production_id
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>Thông tin chung</DetailSectionTitle>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div><span className="font-medium">Tên dự án:</span> {production.name}</div>
          <div><span className="font-medium">Loại:</span> {production.type === "service" ? "Dịch vụ" : "Nội bộ"}</div>
          <div><span className="font-medium">Producer:</span> {production.producer_name}</div>
          <div><span className="font-medium">Trạng thái:</span> {statusLabel(production.status)}</div>
          <div><span className="font-medium">Bắt đầu:</span> {formatDisplayDate(production.start_date)}</div>
          <div><span className="font-medium">Kết thúc:</span> {formatDisplayDate(production.end_date)}</div>
          <div className="md:col-span-2">
            <span className="font-medium">Hợp đồng / mục dịch vụ:</span>
            {linkedContractGroups.length > 0 ? (
              <div className="mt-2 space-y-2">
                {linkedContractGroups.map((group) => (
                  <div
                    key={group.contract.contract_id}
                    className="rounded-xl border bg-slate-50 px-3 py-2"
                  >
                    <div className="font-medium text-slate-800">
                      {group.contract.contract_number} • {group.contract.title}
                    </div>
                    <div className="mt-1 text-slate-600">
                      {group.services.map((service) => service.title).join(", ")}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span> —</span>
            )}
          </div>
          <div className="md:col-span-2">
            <span className="font-medium">Ghi chú:</span> {(production as any).notes || "—"}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>Phân công nhân sự</DetailSectionTitle>
        <div className="space-y-2">
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <div key={task.task_id} className="rounded-xl border bg-slate-50 px-3 py-2 text-sm">
                <div className="font-medium text-slate-800">{task.employee_name}</div>
                <div className="text-slate-500">
                  {departmentLabel(task.department)} • {task.role_label}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
              Chưa có phân công.
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>File dự án sản xuất</DetailSectionTitle>
        <LinkedFilesViewer
          rows={buildDraftProductionFiles(
            files,
            productionFileLinks,
            production.production_id,
            production.file_ids
          )}
        />
      </div>
    </div>
  );
}

// VIEW THÊM/CHỈNH SỬA DỰ ÁN SẢN XUẤT
export function ProductionFormDialog({
  open,
  onOpenChange,
  mode,
  initialProduction,
  employees,
  contracts,
  serviceItems,
  productionTasks,
  serviceItemProductions,
  files,
  productionFileLinks,
  onSaveProduction,
  onImportProduction,
}: ProductionFormDialogProps & {
  employees: EmployeeView[];
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  productionTasks: ProductionTaskRow[];
  serviceItemProductions: ServiceItemProductionRow[];
  files: FileRow[];
  productionFileLinks: LinkedFileSeedRow[];
  onSaveProduction: (payload: ProductionSavePayload) => Promise<boolean>;
  onImportProduction: (params: {
    files: File[];
  }) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";

  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");

  const [form, setForm] = useState<ProductionForm>(createEmptyProductionForm());
  const [taskRows, setTaskRows] = useState<DraftProductionTask[]>([
    createEmptyProductionTask(),
  ]);
  const [linkedFiles, setLinkedFiles] = useState<DraftLinkedFile[]>([]);

  const [importFiles, setImportFiles] = useState<File[]>([]);

  const producerSuggestions = useMemo(() => {
    const filteredEmployees = employees.filter(
      (emp) =>
        emp.status === "active" &&
        (form.producer_department_filter === "all"
          ? true
          : emp.department === form.producer_department_filter)
    );

    return searchEmployees(
      filteredEmployees,
      form.producer_search,
      form.producer_department_filter
    );
  }, [employees, form.producer_search, form.producer_department_filter]);

  useEffect(() => {
    if (!open) return;

    setActiveTab("manual");
    setImportFiles([]);

    if (!isEdit || !initialProduction) {
      setForm(createEmptyProductionForm());
      setTaskRows([createEmptyProductionTask()]);
      setLinkedFiles([]);
      return;
    }

    setForm(
      buildProductionForm(
        initialProduction,
        employees,
        contracts,
        serviceItems,
        serviceItemProductions
      )
    );

    setTaskRows(
      buildDraftProductionTasks(
        initialProduction.production_id,
        productionTasks,
        employees
      )
    );

    setLinkedFiles(
      buildDraftProductionFiles(
        files,
        productionFileLinks,
        initialProduction.production_id,
        initialProduction.file_ids
      )
    );
  }, [
    open,
    isEdit,
    initialProduction,
    employees,
    contracts,
    serviceItems,
    serviceItemProductions,
    productionTasks,
    files,
    productionFileLinks,
  ]);

  const selectedProducer = employees.find(
    (emp) => emp.employee_id === form.selected_producer_id
  );

  const addServiceLink = () => {
    setForm((prev) => ({
      ...prev,
      service_links: [...prev.service_links, createEmptyProductionServiceLink()],
    }));
  };

  const removeServiceLink = (linkId: string) => {
    setForm((prev) => ({
      ...prev,
      service_links:
        prev.service_links.length > 1
          ? prev.service_links.filter((item) => item.id !== linkId)
          : [createEmptyProductionServiceLink()],
    }));
  };

  const updateServiceLink = (
    linkId: string,
    key: keyof DraftProductionServiceLink,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      service_links: prev.service_links.map((item) =>
        item.id === linkId
          ? {
              ...item,
              [key]: value,
              ...(key === "contract_search"
                ? {
                    selected_contract_id: "",
                    selected_service_item_id: "",
                  }
                : key === "selected_contract_id"
                ? {
                    selected_service_item_id: "",
                  }
                : {}),
            }
          : item
      ),
    }));
  };

  const handleSave = async () => {
    const validationError = validateProductionBeforeSave({
      form,
      taskRows,
      linkedFiles,
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    const payload: ProductionSavePayload = {
      production: {
        production_id: isEdit ? initialProduction?.production_id : undefined,
        name: form.name,
        type: form.type,
        genre: form.genre.trim(),
        duration_minutes: form.duration_minutes
          ? Number(form.duration_minutes)
          : null,
        start_date: form.start_date,
        end_date: form.end_date || null,
        producer: form.selected_producer_id || null,
        status: form.status,
        notes: form.notes,
      },
      service_item_ids:
        form.type === "service"
          ? Array.from(
              new Set(
                form.service_links
                  .map((item) => item.selected_service_item_id)
                  .filter(Boolean)
              )
            )
          : [],
      production_files: linkedFiles.map((row) => ({
        file_id: row.file_id || null,
        local_file_name: row.source === "local" ? row.file_name : null,
        local_file: row.source === "local" ? row.local_file || null : null,
        file_role: row.file_role,
        is_main: row.is_main,
        notes: row.notes,
      })),
      tasks: taskRows
        .filter((row) => row.employee_id && row.employee_id.trim() !== "")
        .map((row) => ({
          employee_id: row.employee_id,
          role_label: row.role_label,
        })),
    };

    const saved = await onSaveProduction(payload);
    if (!saved) return;

    onOpenChange(false);
  };

  const handleImportProduction = async () => {
    if (importFiles.length === 0) {
      alert("Vui lòng chọn ít nhất 1 file dữ liệu để import dự án sản xuất.");
      return;
    }

    const saved = await onImportProduction({
      files: importFiles,
    });

    if (!saved) return;

    onOpenChange(false);
  };

  const manualForm = (
    <>
      <div className="space-y-6 py-2">
        <FormSection title="Thông tin dự án sản xuất">
          <div className="grid gap-4 md:grid-cols-3">
            <FieldBlock label="Tên dự án">
              <Input
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </FieldBlock>

            <FieldBlock label="Loại sản xuất">
              <EnumSelect
                value={form.type}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    type: value,
                    service_links: [createEmptyProductionServiceLink()],
                  }))
                }
                options={productionTypeOptions}
              />
            </FieldBlock>

            <FieldBlock label="Thể loại">
              <Input
                value={form.genre}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, genre: e.target.value }))
                }
                placeholder="Ví dụ: Chuyên đề, Phóng sự, Tạp chí..."
              />
            </FieldBlock>

            <FieldBlock label="Thời lượng (phút)">
              <Input
                type="number"
                min={1}
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, duration_minutes: e.target.value }))
                }
                onBlur={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    duration_minutes: e.target.value === "" ? "" : normalizeMin1(e.target.value),
                  }))
                }
                placeholder="Ví dụ: 15, 30, 45"
              />
            </FieldBlock>

            <FieldBlock label="Producer phụ trách">
              <div className="space-y-2">
                <Select
                  value={form.producer_department_filter}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      producer_department_filter: value as EmployeeDepartment | "all",
                      producer_search: "",
                      selected_producer_id: "",
                    }))
                  }
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Lọc theo phòng ban" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả phòng ban</SelectItem>
                    {employeeDepartmentOptions.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  value={form.producer_search}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      producer_search: e.target.value,
                      selected_producer_id: "",
                    }))
                  }
                  placeholder="Nhập tên producer để tìm..."
                />

                {form.producer_search.trim().length >= 2 && !form.selected_producer_id && (
                  <SuggestionList
                    items={producerSuggestions.map(
                      (emp) => `${emp.name} • ${departmentLabel(emp.department)}`
                    )}
                    onPick={(value) => {
                      const picked = producerSuggestions.find(
                        (emp) => `${emp.name} • ${departmentLabel(emp.department)}` === value
                      );

                      if (picked) {
                        setForm((prev) => ({
                          ...prev,
                          selected_producer_id: picked.employee_id,
                          producer_search: `${picked.name} • ${departmentLabel(picked.department)}`,
                        }));
                      }
                    }}
                  />
                )}

                {selectedProducer && (
                  <div className="text-xs text-emerald-600">
                    Đã chọn: {selectedProducer.name} • {departmentLabel(selectedProducer.department)}
                  </div>
                )}
              </div>
            </FieldBlock>

            <FieldBlock label="Ngày bắt đầu">
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm((prev) => ({ ...prev, start_date: e.target.value }))}
              />
            </FieldBlock>

            <FieldBlock label="Ngày kết thúc">
              <Input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm((prev) => ({ ...prev, end_date: e.target.value }))}
              />
            </FieldBlock>

            <FieldBlock label="Trạng thái">
              <EnumSelect
                value={form.status}
                onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                options={productionStatusOptions}
              />
            </FieldBlock>

            <FieldBlock label="Ghi chú">
              <Input
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              />
            </FieldBlock>
          </div>
        </FormSection>

        {form.type === "service" && (
          <FormSection title="Thông tin hợp đồng dịch vụ">
            <div className="space-y-4">
              {form.service_links.map((link, index) => {
                const contractSuggestions = searchWithMinChars(
                  contracts.filter((item) => item.contract_type === "service"),
                  link.contract_search,
                  (item) => `${item.contract_number} ${item.title} ${item.party_name}`
                );

                const selectedContract =
                  contracts.find((item) => item.contract_id === link.selected_contract_id) || null;

                const serviceOptions = serviceItems.filter(
                  (item) => item.contract_id === link.selected_contract_id
                );

                const selectedService =
                  serviceItems.find((item) => item.service_item_id === link.selected_service_item_id) || null;

                return (
                  <div
                    key={link.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="font-medium text-slate-800">Mục dịch vụ {index + 1}</div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => removeServiceLink(link.id)}
                      >
                        Xóa
                      </Button>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <FieldBlock label="Tìm hợp đồng">
                        <div className="space-y-2">
                          <Input
                            value={link.contract_search}
                            onChange={(e) =>
                              updateServiceLink(link.id, "contract_search", e.target.value)
                            }
                            placeholder="Nhập số hợp đồng hoặc tên hợp đồng..."
                          />

                          {link.contract_search.trim().length >= 2 && !link.selected_contract_id && (
                            <SuggestionList
                              items={contractSuggestions.map(
                                (item) => `${item.contract_number} • ${item.title}`
                              )}
                              onPick={(value) => {
                                const picked = contractSuggestions.find(
                                  (item) => `${item.contract_number} • ${item.title}` === value
                                );

                                if (picked) {
                                  setForm((prev) => ({
                                    ...prev,
                                    service_links: prev.service_links.map((item) =>
                                      item.id === link.id
                                        ? {
                                            ...item,
                                            selected_contract_id: picked.contract_id,
                                            selected_service_item_id: "",
                                            contract_search: `${picked.contract_number} • ${picked.title}`,
                                          }
                                        : item
                                    ),
                                  }));
                                }
                              }}
                            />
                          )}

                          {selectedContract && (
                            <div className="text-xs text-emerald-600">
                              Đã chọn: {selectedContract.contract_number} • {selectedContract.title}
                            </div>
                          )}
                        </div>
                      </FieldBlock>

                      <FieldBlock label="Mục dịch vụ của hợp đồng">
                        <div className="space-y-2">
                          <Select
                            value={link.selected_service_item_id}
                            onValueChange={(value) =>
                              updateServiceLink(link.id, "selected_service_item_id", value)
                            }
                          >
                            <SelectTrigger className="rounded-2xl">
                              <SelectValue placeholder="Chọn mục dịch vụ" />
                            </SelectTrigger>
                            <SelectContent>
                              {serviceOptions.map((item) => (
                                <SelectItem key={item.service_item_id} value={item.service_item_id}>
                                  {item.title} • {serviceTypeLabel(item.service_type)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {selectedService && (
                            <div className="text-xs text-emerald-600">
                              Đã chọn mục dịch vụ: {selectedService.title}
                            </div>
                          )}
                        </div>
                      </FieldBlock>
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl border-orange-200 bg-white hover:bg-orange-50"
                  onClick={addServiceLink}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm mục dịch vụ
                </Button>
              </div>
            </div>
          </FormSection>
        )}

        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]" />
            Phân công nhân sự
          </div>

          <ProductionAssigneeEditor
            rows={taskRows}
            setRows={setTaskRows}
            employees={employees}
          />
        </div>

        <FormSection title="File dự án">
          <LinkedFilesEditor
            mode="local"
            rows={linkedFiles}
            setRows={setLinkedFiles}
            defaultUploadFolder="productions"
            files={files}
          />
        </FormSection>
      </div>

      <DialogFooter>
        <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
        <PrimaryButton onClick={handleSave}>
          {isEdit ? "Lưu thay đổi" : "Lưu dự án"}
        </PrimaryButton>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-auto rounded-2xl sm:max-w-5xl">

        {isEdit ? (
          manualForm
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "manual" | "import")}
            className="mt-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Tạo dự án mới</TabsTrigger>
              <TabsTrigger value="import">Import sản xuất</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">{manualForm}</TabsContent>

            <TabsContent value="import">
              <ImportEntityPanel
                entityLabel="dự án sản xuất"
                pickedFiles={importFiles}
                setPickedFiles={setImportFiles}
                onSubmit={handleImportProduction}
                submittingLabel="Gửi file import sản xuất"
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// PAGE DỰ ÁN SẢN XUẤT
export function ProductionsPage({
  currentUser,
  productions,
  employees,
  contracts,
  serviceItems,
  productionTasks,
  files,
  productionFileLinks,
  serviceItemProductions,
  onSaveProduction,
  onDeleteProduction,
  onImportProduction,
}: {
  currentUser: SessionUser;
  productions: ProductionRow[];
  employees: EmployeeView[];
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  productionTasks: ProductionTaskRow[];
  files: FileRow[];
  productionFileLinks: LinkedFileSeedRow[];
  serviceItemProductions: ServiceItemProductionRow[];
  onSaveProduction: (payload: ProductionSavePayload) => Promise<boolean>;
  onDeleteProduction: (productionId: string) => void;
  onImportProduction: (params: { files: File[] }) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [productionTypeFilter, setProductionTypeFilter] = useState<"all" | ProductionType>("all");
  const [startMonthFilter, setStartMonthFilter] = useState("");
  const [selectedProductionId, setSelectedProductionId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const filteredProductions = useMemo(() => {
    return productions.filter((item) => {
      const joined = [
        item.name,
        item.producer_name,
        item.created_by_name,
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = joined.includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "all" ? true : item.status === statusFilter;
      const matchType =
        productionTypeFilter === "all"
          ? true
          : item.type === productionTypeFilter;
      const matchStartMonth =
        !startMonthFilter
          ? true
          : toDateInputValue(item.start_date).startsWith(startMonthFilter);

      return matchSearch && matchStatus && matchType && matchStartMonth;
    });
  }, [productions, search, statusFilter, productionTypeFilter, startMonthFilter]);

  const selectedProduction =
    productions.find((item) => item.production_id === selectedProductionId) || null;

  return (
    <div>
      <SectionHeader
        title="Sản xuất"
        actions={
          canCreateOperationalRecord(currentUser) ? (
            <PrimaryButton
              onClick={() => {
                setSelectedProductionId(null);
                setFormMode("create");
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm dự án sản xuất
            </PrimaryButton>
          ) : null
        }
      />

      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-4">
          <div className="mb-4">
            <div className="grid w-full grid-cols-[minmax(0,1fr)_180px_180px_180px] gap-3">
              <div className="relative min-w-0">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm theo tên dự án, producer..."
                  className="pl-9 rounded-2xl"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {productionStatusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={productionTypeFilter}
                onValueChange={(value) =>
                  setProductionTypeFilter(value as "all" | ProductionType)
                }
              >
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder="Loại sản xuất" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {productionTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="month"
                value={startMonthFilter}
                onChange={(e) => setStartMonthFilter(e.target.value)}
                className="w-full rounded-2xl"
              />
            </div>
          </div>

          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Tên dự án</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Producer</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {filteredProductions.map((item) => {
                const canEditItem = canEditOwnOperationalRecord({
                  user: currentUser,
                  createdByName: item.created_by_name,
                  status: null,
                });

                const canDeleteItem = canDeleteOwnOperationalRecord({
                  user: currentUser,
                  createdByName: item.created_by_name,
                  status: null,
                });
                return (
                  <TableRow key={item.production_id}>
                    <TableCell className="max-w-0 font-medium">
                      <TruncatedHoverText text={item.name} widthClass="max-w-[220px]" />
                    </TableCell>
                    <TableCell>{item.type === "service" ? "Dịch vụ" : "Nội bộ"}</TableCell>
                    <TableCell>{item.producer_name}</TableCell>
                    <TableCell>
                      {formatDisplayDate(item.start_date)} → {formatDisplayDate(item.end_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge value={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionDropdown
                        items={[
                          { value: "detail", label: "Xem chi tiết" },
                          ...(canEditItem ? [{ value: "edit", label: "Chỉnh sửa" }] : []),
                          ...(canDeleteItem ? [{ value: "delete", label: "Xóa" }] : []),
                        ]}
                        onAction={(action) => {
                          setSelectedProductionId(item.production_id);

                          if (action === "detail") {
                            setDetailOpen(true);
                            return;
                          }

                          if (action === "edit") {
                            setFormMode("edit");
                            setFormOpen(true);
                            return;
                          }

                          if (action === "delete") {
                            const confirmed = window.confirm(
                              `Bạn có chắc muốn xóa dự án "${item.name}" không?\n\nThao tác này sẽ xóa luôn phân công nhân sự và liên kết file của dự án trong dữ liệu giao diện hiện tại.`
                            );

                            if (!confirmed) return;

                            setDetailOpen(false);
                            setFormOpen(false);
                            setSelectedProductionId(null);

                            onDeleteProduction(item.production_id);
                          }
                        }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <DetailDrawer
        title={selectedProduction ? `Chi tiết dự án • ${selectedProduction.name}` : "Chi tiết dự án"}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selectedProduction && (
          <ProductionFullView
            production={selectedProduction}
            contracts={contracts}
            serviceItems={serviceItems}
            productionTasks={productionTasks}
            files={files}
            productionFileLinks={productionFileLinks}
            serviceItemProductions={serviceItemProductions}
          />
        )}
      </DetailDrawer>

      <ProductionFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialProduction={selectedProduction}
        employees={employees}
        contracts={contracts}
        serviceItems={serviceItems}
        productionTasks={productionTasks}
        serviceItemProductions={serviceItemProductions}
        files={files}
        productionFileLinks={productionFileLinks}
        onSaveProduction={onSaveProduction}
        onImportProduction={onImportProduction}
      />
    </div>
  );
}