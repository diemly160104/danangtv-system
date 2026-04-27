import { useEffect, useMemo, useState } from "react";
import { FolderOpen, Plus, Search, Tv, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type {
  Folder,
  PartyType,
  EmployeeDepartment,
  SessionUser,
  PartyView,
  EmployeeView,
  ChannelView,
  FileRow,
  StudioView,
  CatalogSection,
  EmployeeForm,
  PartyForm,
  FileCatalogForm,
  PartySavePayload,
  FileCatalogSavePayload,
} from "@/features/danangtv/types";

import {
  partyTypeOptions,
  customerTypeOptions,
  platformOptions,
  employeeDepartmentOptions,
  genderOptions,
  employeeStatusOptions,
  folderOptions,
} from "@/features/danangtv/options";

import {
  StatusBadge,
  PrimaryButton,
  TruncatedHoverText,
  StoragePathLink,
  SectionHeader,
  DetailDrawer,
  FieldBlock,
  EnumSelect,
  ActionDropdown,
} from "@/features/danangtv/shared/commonComponents";
import {
  canCreateEditFileCatalog,
  canCreateEditPartyCatalog,
  canDeleteEmployeeCatalog,
  canDeleteFileCatalog,
  canDeletePartyCatalog,
  canEditEmployeeRecord,
  customerTypeLabel,
  departmentLabel,
  folderLabel,
  statusLabel,
  formatFileSize,
  genderLabel,
  isBlank,
  optionLabel,
  partyTypeLabel,
  createId,
} from "@/features/danangtv/utils/Helpers";


// HÀM TẠO FORM TRỐNG CHO NHÂN VIÊN, ĐỐI TÁC, FILE CATALOG
function createEmptyEmployeeForm(): EmployeeForm {
  return {
    employee_code: "",
    name: "",
    gender: "male",
    department: "administration",
    position: "",
    phone_number: "",
    email: "",
    address: "",
    status: "active",
  };
}

function createEmptyPartyForm(): PartyForm {
  return {
    party_type: "customer",
    name: "",
    customer_type: "",
    company: "",
    phone_number: "",
    email: "",
    address: "",
    account_number: "",
    bank: "",
    tax_code: "",
    notes: "",
  };
}

function createEmptyFileCatalogForm(): FileCatalogForm {
  return {
    local_files: [],
    notes: "",
  };
}

// HÀM KIỂM TRA FORM TRƯỚC KHI LƯU
function validateEmployeeBeforeSave(form: EmployeeForm) {
  if (isBlank(form.employee_code)) return "Vui lòng nhập mã nhân viên.";
  if (isBlank(form.name)) return "Vui lòng nhập tên nhân viên.";
  if (isBlank(form.gender)) return "Vui lòng chọn giới tính.";
  if (isBlank(form.department)) return "Vui lòng chọn phòng ban.";
  if (isBlank(form.status)) return "Vui lòng chọn trạng thái.";
  return null;
}

function validatePartyBeforeSave(form: PartyForm) {
  if (isBlank(form.party_type)) return "Vui lòng chọn loại đối tác / khách hàng.";
  if (isBlank(form.name)) return "Vui lòng nhập tên khách hàng / người đại diện.";

  if (form.party_type === "customer" && isBlank(form.customer_type)) {
    return "Khách hàng phải chọn loại khách hàng.";
  }

  return null;
}

// FORM THÊM / CHỈNH SỬA NHÂN VIÊN, ĐỐI TÁC, FILE CATALOG
function EmployeeFormDialog({
  open,
  onOpenChange,
  mode,
  initialEmployee,
  onSaveEmployee,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialEmployee?: EmployeeView | null;
  onSaveEmployee: (payload: EmployeeView) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<EmployeeForm>(createEmptyEmployeeForm());

  useEffect(() => {
    if (!open) return;

    if (!isEdit || !initialEmployee) {
      setForm(createEmptyEmployeeForm());
      return;
    }

    setForm({
      employee_code: initialEmployee?.employee_code || "",
      name: initialEmployee?.name || "",
      gender: initialEmployee?.gender || "male",
      department: initialEmployee?.department || "administration",
      position: initialEmployee?.position || "",
      phone_number: initialEmployee?.phone_number || "",
      email: initialEmployee?.email || "",
      address: initialEmployee?.address || "",
      status: initialEmployee?.status || "active",
    });
  }, [open, isEdit, initialEmployee]);

  const handleSave = async () => {
    const error = validateEmployeeBeforeSave(form);
    if (error) {
      alert(error);
      return;
    }

    const payload: EmployeeView = {
      employee_id: isEdit ? initialEmployee?.employee_id || createId("EMP") : createId("EMP"),
      employee_code: form.employee_code.trim(),
      name: form.name,
      gender: form.gender,
      department: form.department,
      position: form.position || undefined,
      phone_number: form.phone_number || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      status: form.status,
    };

    const saved = await onSaveEmployee(payload);
    if (!saved) return;

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa nhân viên" : "Thêm nhân viên"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <FieldBlock label="Mã nhân viên">
            <Input
              value={form.employee_code}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, employee_code: e.target.value.toUpperCase() }))
              }
              placeholder="Ví dụ: NV111001"
            />
          </FieldBlock>

          <FieldBlock label="Họ tên">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Giới tính">
            <EnumSelect value={form.gender} onChange={(v) => setForm((p) => ({ ...p, gender: v }))} options={genderOptions} />
          </FieldBlock>

          <FieldBlock label="Phòng ban">
            <EnumSelect value={form.department} onChange={(v) => setForm((p) => ({ ...p, department: v }))} options={employeeDepartmentOptions} />
          </FieldBlock>

          <FieldBlock label="Trạng thái">
            <EnumSelect value={form.status} onChange={(v) => setForm((p) => ({ ...p, status: v }))} options={employeeStatusOptions} />
          </FieldBlock>

          <FieldBlock label="Chức vụ">
            <Input value={form.position} onChange={(e) => setForm((p) => ({ ...p, position: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Số điện thoại">
            <Input value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Email">
            <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </FieldBlock>

          <div className="md:col-span-2">
            <FieldBlock label="Địa chỉ">
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </FieldBlock>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <PrimaryButton onClick={handleSave}>
            {isEdit ? "Lưu thay đổi" : "Lưu nhân viên"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartyFormDialog({
  open,
  onOpenChange,
  mode,
  initialParty,
  onSaveParty,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialParty?: PartyView | null;
  onSaveParty: (payload: PartySavePayload) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<PartyForm>(createEmptyPartyForm());

  useEffect(() => {
    if (!open) return;

    if (!isEdit || !initialParty) {
      setForm(createEmptyPartyForm());
      return;
    }

    setForm({
      party_type: initialParty.party_type || "customer",
      name: initialParty.name || "",
      customer_type: initialParty.customer_type || "",
      company: initialParty.company || "",
      phone_number: initialParty.phone_number || "",
      email: initialParty.email || "",
      address: initialParty.address || "",
      account_number: initialParty.account_number || "",
      bank: initialParty.bank || "",
      tax_code: initialParty.tax_code || "",
      notes: initialParty.notes || "",
    });
  }, [open, isEdit, initialParty]);

  const handleSave = async () => {
    const error = validatePartyBeforeSave(form);
    if (error) {
      alert(error);
      return;
    }

    const payload: PartyView = {
      party_id: isEdit ? initialParty?.party_id || createId("PTY") : createId("PTY"),
      party_type: form.party_type,
      name: form.name,
      customer_type: form.party_type === "customer" ? (form.customer_type || undefined) : undefined,
      company: form.company || undefined,
      phone_number: form.phone_number || undefined,
      email: form.email || undefined,
      address: form.address || undefined,
      account_number: form.account_number || undefined,
      bank: form.bank || undefined,
      tax_code: form.tax_code || undefined,
      notes: form.notes || undefined,
    };

    const saved = await onSaveParty(payload);
    if (!saved) return;

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa đối tác / khách hàng" : "Thêm đối tác / khách hàng"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2 md:grid-cols-2">
          <FieldBlock label="Loại">
            <EnumSelect
              value={form.party_type}
              onChange={(v) => setForm((p) => ({ ...p, party_type: v, customer_type: v === "customer" ? p.customer_type : "" }))}
              options={partyTypeOptions}
            />
          </FieldBlock>

          {form.party_type === "customer" && (
            <FieldBlock label="Loại khách hàng">
              <EnumSelect
                value={form.customer_type || ""}
                onChange={(v) => setForm((p) => ({ ...p, customer_type: v }))}
                options={customerTypeOptions}
              />
            </FieldBlock>
          )}

          <FieldBlock label="Tên khách hàng / người đại diện">
            <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Tên công ty">
            <Input value={form.company} onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Số điện thoại">
            <Input value={form.phone_number} onChange={(e) => setForm((p) => ({ ...p, phone_number: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Email">
            <Input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
          </FieldBlock>

          <div className="md:col-span-2">
            <FieldBlock label="Địa chỉ">
              <Input value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} />
            </FieldBlock>
          </div>

          <FieldBlock label="Số tài khoản">
            <Input value={form.account_number} onChange={(e) => setForm((p) => ({ ...p, account_number: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Ngân hàng">
            <Input value={form.bank} onChange={(e) => setForm((p) => ({ ...p, bank: e.target.value }))} />
          </FieldBlock>

          <FieldBlock label="Mã số thuế">
            <Input value={form.tax_code} onChange={(e) => setForm((p) => ({ ...p, tax_code: e.target.value }))} />
          </FieldBlock>

          <div className="md:col-span-2">
            <FieldBlock label="Ghi chú">
              <Input value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            </FieldBlock>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <PrimaryButton onClick={handleSave}>
            {isEdit ? "Lưu thay đổi" : "Lưu đối tác / khách hàng"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileCatalogFormDialog({
  open,
  onOpenChange,
  mode,
  initialFile,
  currentUser,
  onSaveFileCatalog,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialFile?: FileRow | null;
  currentUser: SessionUser;
  onSaveFileCatalog: (payload: FileCatalogSavePayload) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<FileCatalogForm>(createEmptyFileCatalogForm());

  useEffect(() => {
    if (!open) return;

    if (isEdit && initialFile) {
      setForm({
        local_files: [],
        notes: initialFile.notes || "",
      });
      return;
    }

    setForm(createEmptyFileCatalogForm());
  }, [open, isEdit, initialFile]);

  const handleSave = async () => {
    if (isEdit && initialFile) {
      await onSaveFileCatalog({
        mode: "edit",
        file_id: initialFile.file_id,
        notes: form.notes || null,
      });
      onOpenChange(false);
      return;
    }

    if (!form.local_files.length) {
      alert("Vui lòng chọn ít nhất 1 file.");
      return;
    }

    const saved = await onSaveFileCatalog({
      mode: "create",
      files: form.local_files.map((file) => ({
        local_file: file,
        notes: form.notes || null,
      })),
    });

    if (!saved) return;

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa file" : "Thêm file vào kho"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {isEdit && initialFile ? (
            <div className="rounded-2xl border p-4 text-sm">
              <div><span className="font-medium">Tên file:</span> {initialFile.file_name}</div>
              <div><span className="font-medium">Định dạng:</span> {initialFile.file_extension || "—"}</div>
              <div><span className="font-medium">Dung lượng:</span> {formatFileSize(initialFile.file_size)}</div>
              <div><span className="font-medium">Storage path:</span> {initialFile.storage_path}</div>
            </div>
          ) : (
            <div>
              <Input
                type="file"
                multiple
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    local_files: Array.from(e.target.files ?? []),
                  }))
                }
              />
            </div>
          )}

          <FieldBlock label="Ghi chú">
            <Input
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
          </FieldBlock>

          {!isEdit && (
            <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">
              {form.local_files.length
                ? `Đã chọn ${form.local_files.length} file.`
                : "Chưa chọn file nào."}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <PrimaryButton onClick={handleSave}>
            {isEdit ? "Lưu thay đổi" : "Lưu file"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// VIEW CHI TIẾT NHÂN VIÊN, ĐỐI TÁC, FILE CATALOG
export function EmployeeFullView({ employee }: { employee: EmployeeView }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div><span className="font-medium">Mã nhân viên:</span> {employee.employee_code}</div>
        <div><span className="font-medium">Họ tên:</span> {employee.name}</div>
        <div><span className="font-medium">Giới tính:</span> {genderLabel(employee.gender)}</div>
        <div><span className="font-medium">Phòng ban:</span> {departmentLabel(employee.department)}</div>
        <div><span className="font-medium">Chức vụ:</span> {employee.position || "—"}</div>
        <div><span className="font-medium">Số điện thoại:</span> {employee.phone_number || "—"}</div>
        <div><span className="font-medium">Email:</span> {employee.email || "—"}</div>
        <div className="md:col-span-2"><span className="font-medium">Địa chỉ:</span> {employee.address || "—"}</div>
        <div><span className="font-medium">Trạng thái:</span> {statusLabel(employee.status)}</div>
      </div>
    </div>
  );
}

export function PartyFullView({ party }: { party: PartyView }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div><span className="font-medium">Tên khách hàng / người đại diện:</span> {party.name}</div>
        <div><span className="font-medium">Loại:</span> {partyTypeLabel(party.party_type)}</div>
        <div><span className="font-medium">Loại khách hàng:</span> {party.customer_type ? customerTypeLabel(party.customer_type) : "—"}</div>
        <div><span className="font-medium">Tên công ty:</span> {party.company || "—"}</div>
        <div><span className="font-medium">Số điện thoại:</span> {party.phone_number || "—"}</div>
        <div><span className="font-medium">Email:</span> {party.email || "—"}</div>
        <div className="md:col-span-2"><span className="font-medium">Địa chỉ:</span> {party.address || "—"}</div>
        <div><span className="font-medium">Số tài khoản:</span> {party.account_number || "—"}</div>
        <div><span className="font-medium">Ngân hàng:</span> {party.bank || "—"}</div>
        <div><span className="font-medium">Mã số thuế:</span> {party.tax_code || "—"}</div>
        <div className="md:col-span-2"><span className="font-medium">Ghi chú:</span> {party.notes || "—"}</div>
      </div>
    </div>
  );
}

export function FileCatalogFullView({ file }: { file: FileRow }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-3 text-sm md:grid-cols-2">
        <div><span className="font-medium">Tên file:</span> {file.file_name}</div>
        <div><span className="font-medium">Định dạng:</span> {file.file_extension || "—"}</div>
        <div><span className="font-medium">Dung lượng:</span> {formatFileSize(file.file_size)}</div>
        <div><span className="font-medium">Người upload:</span> {file.uploaded_by_name}</div>
        <div><span className="font-medium">Thời gian upload:</span> {file.uploaded_at}</div>
        <div><span className="font-medium">Thư mục:</span> {folderLabel(file.folder)}</div>
        <div className="md:col-span-2">
          <span className="font-medium">Storage path:</span>{" "}
          <StoragePathLink storagePath={file.storage_path} />
        </div>
        <div className="md:col-span-2"><span className="font-medium">Ghi chú:</span> {file.notes || "—"}</div>
      </div>
    </div>
  );
}

// VIEW DANH SÁCH NHÂN VIÊN, ĐỐI TÁC, FILE CATALOG + CÁC CHỨC NĂNG LIÊN QUAN
export function CatalogPage({
  currentUser,
  employees,
  parties,
  channels,
  studios,
  files,
  onSaveEmployee,
  onSaveParty,
  onSaveFileCatalog,
  onDeleteEmployee,
  onDeleteParty,
  onDeleteFileCatalog,
}: {
  currentUser: SessionUser;
  employees: EmployeeView[];
  parties: PartyView[];
  channels: ChannelView[];
  studios: StudioView[];
  files: FileRow[];
  onSaveEmployee: (payload: EmployeeView) => Promise<boolean>;
  onSaveParty: (payload: PartySavePayload) => Promise<boolean>;
  onSaveFileCatalog: (payload: FileCatalogSavePayload) => Promise<boolean>;
  onDeleteEmployee: (employeeId: string) => void;
  onDeleteParty: (partyId: string) => void;
  onDeleteFileCatalog: (fileId: string) => void;
}) {
  const [activeCatalog, setActiveCatalog] = useState<CatalogSection>(null);

  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeDepartmentFilter, setEmployeeDepartmentFilter] = useState<"all" | EmployeeDepartment>("all");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeDetailOpen, setEmployeeDetailOpen] = useState(false);
  const [employeeFormOpen, setEmployeeFormOpen] = useState(false);
  const [employeeFormMode, setEmployeeFormMode] = useState<"create" | "edit">("create");

  const [partySearch, setPartySearch] = useState("");
  const [partyTypeFilter, setPartyTypeFilter] = useState<"all" | PartyType>("all");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [partyDetailOpen, setPartyDetailOpen] = useState(false);
  const [partyFormOpen, setPartyFormOpen] = useState(false);
  const [partyFormMode, setPartyFormMode] = useState<"create" | "edit">("create");

  const [fileSearch, setFileSearch] = useState("");
  const [fileFolderFilter, setFileFolderFilter] = useState<"all" | Folder>("all");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [fileDetailOpen, setFileDetailOpen] = useState(false);
  const [fileFormOpen, setFileFormOpen] = useState(false);
  const [fileFormMode, setFileFormMode] = useState<"create" | "edit">("create");

  const filteredEmployees = useMemo(() => {
    return employees.filter((item) => {
      const searchText = [item.employee_code, item.name].join(" ").toLowerCase();
      const matchesSearch = searchText.includes(employeeSearch.toLowerCase());
      const matchesDepartment =
        employeeDepartmentFilter === "all" ? true : item.department === employeeDepartmentFilter;
      return matchesSearch && matchesDepartment;
    });
  }, [employees, employeeSearch, employeeDepartmentFilter]);

  const filteredParties = useMemo(() => {
    return parties.filter((item) => {
      const searchText = [item.name, item.company || ""].join(" ").toLowerCase();
      const matchesSearch = searchText.includes(partySearch.toLowerCase());
      const matchesType =
        partyTypeFilter === "all" ? true : item.party_type === partyTypeFilter;

      return matchesSearch && matchesType;
    });
  }, [parties, partySearch, partyTypeFilter]);

  const filteredFiles = useMemo(() => {
    return files.filter(
      (item) =>
        item.file_name.toLowerCase().includes(fileSearch.toLowerCase()) &&
        (fileFolderFilter === "all" ? true : item.folder === fileFolderFilter)
    );
  }, [files, fileSearch, fileFolderFilter]);

  const selectedEmployee = employees.find((item) => item.employee_id === selectedEmployeeId) || null;
  const selectedParty = parties.find((item) => item.party_id === selectedPartyId) || null;
  const selectedFile = files.find((item) => item.file_id === selectedFileId) || null;

  return (
    <div>
      <SectionHeader
        title="Danh mục"
      />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Nhân viên
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setActiveCatalog("employees")}>
              Mở danh mục
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4" />
              Đối tác / khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setActiveCatalog("parties")}>
              Mở danh mục
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tv className="h-4 w-4" />
              Kênh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setActiveCatalog("channels")}>
              Mở danh mục
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Tv className="h-4 w-4" />
              Studio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setActiveCatalog("studios")}>
              Mở danh mục
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="h-4 w-4" />
              Kho file
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full rounded-2xl" onClick={() => setActiveCatalog("files")}>
              Mở danh mục
            </Button>
          </CardContent>
        </Card>
      </div>

      {activeCatalog === "employees" && (
        <Card className="mt-6 rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-orange-100 bg-orange-50/40">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Danh sách nhân viên
              </CardTitle>
            </div>
            <PrimaryButton
              onClick={() => {
                setSelectedEmployeeId(null);
                setEmployeeFormMode("create");
                setEmployeeFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm nhân viên
            </PrimaryButton>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={employeeSearch}
                  onChange={(e) => setEmployeeSearch(e.target.value)}
                  placeholder="Tìm theo mã hoặc tên nhân viên..."
                  className="pl-9"
                />
              </div>

              <Select
                value={employeeDepartmentFilter}
                onValueChange={(value) => setEmployeeDepartmentFilter(value as "all" | EmployeeDepartment)}
              >
                <SelectTrigger className="w-full rounded-2xl md:w-64">
                  <SelectValue placeholder="Phòng ban" />
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
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã NV</TableHead>
                  <TableHead>Họ tên</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Chức vụ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-[190px] text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((item) => {
                  const canEditItem = canEditEmployeeRecord(currentUser, item);
                  const canDeleteItem = canDeleteEmployeeCatalog(currentUser);

                  return (
                    <TableRow key={item.employee_id}>
                      <TableCell className="font-medium">{item.employee_code}</TableCell>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{departmentLabel(item.department)}</TableCell>
                      <TableCell>{item.position || "—"}</TableCell>
                      <TableCell><StatusBadge value={item.status} /></TableCell>
                      <TableCell className="w-[190px]">
                        <div className="flex justify-end">
                          <ActionDropdown
                            items={[
                              { value: "detail", label: "Xem chi tiết" },
                              ...(canEditItem ? [{ value: "edit", label: "Chỉnh sửa" }] : []),
                              ...(canDeleteItem ? [{ value: "delete", label: "Xóa" }] : []),
                            ]}
                            onAction={(action) => {
                              setSelectedEmployeeId(item.employee_id);

                              if (action === "detail") {
                                setEmployeeDetailOpen(true);
                                return;
                              }

                              if (action === "edit") {
                                if (!canEditItem) return;
                                setEmployeeFormMode("edit");
                                setEmployeeFormOpen(true);
                                return;
                              }

                              if (action === "delete") {
                                if (!canDeleteItem) return;

                                const confirmed = window.confirm(
                                  `Bạn có chắc muốn xóa nhân viên "${item.name}" không?`
                                );
                                if (!confirmed) return;

                                setEmployeeDetailOpen(false);
                                setEmployeeFormOpen(false);
                                setSelectedEmployeeId(null);

                                onDeleteEmployee(item.employee_id);
                                return;
                              }
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeCatalog === "parties" && (
        <Card className="mt-6 rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-orange-100 bg-orange-50/40">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Danh sách đối tác / khách hàng
              </CardTitle>
            </div>
            <PrimaryButton
              onClick={() => {
                setSelectedPartyId(null);
                setPartyFormMode("create");
                setPartyFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm đối tác / khách hàng
            </PrimaryButton>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={partySearch}
                  onChange={(e) => setPartySearch(e.target.value)}
                  placeholder="Tìm theo tên hoặc công ty..."
                  className="pl-9"
                />
              </div>

              <Select
                value={partyTypeFilter}
                onValueChange={(value) => setPartyTypeFilter(value as "all" | PartyType)}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Loại" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {partyTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[240px]">Tên khách hàng / người đại diện</TableHead>
                  <TableHead className="w-[240px]">Tên công ty</TableHead>
                  <TableHead>Loại</TableHead>
                  <TableHead className="w-[190px] text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParties.map((item) => (
                  <TableRow key={item.party_id}>
                    <TableCell className="max-w-0 font-medium">
                      <TruncatedHoverText text={item.name} widthClass="max-w-[240px]" />
                    </TableCell>
                    <TableCell className="max-w-0 font-medium">
                      <TruncatedHoverText text={item.company || "—"} widthClass="max-w-[240px]" />
                    </TableCell>
                    <TableCell>{partyTypeLabel(item.party_type)}</TableCell>
                    <TableCell className="w-[190px]">
                      <div className="flex justify-end">
                        <ActionDropdown
                          items={[
                            { value: "detail", label: "Xem chi tiết" },
                            ...(canCreateEditPartyCatalog(currentUser)
                              ? [{ value: "edit", label: "Chỉnh sửa" }]
                              : []),
                            ...(canDeletePartyCatalog(currentUser)
                              ? [{ value: "delete", label: "Xóa" }]
                              : []),
                          ]}
                          onAction={(action) => {
                            setSelectedPartyId(item.party_id);

                            if (action === "detail") setPartyDetailOpen(true);
                            if (action === "edit") {
                              setPartyFormMode("edit");
                              setPartyFormOpen(true);
                            }
                            if (action === "delete") {
                              const confirmed = window.confirm(
                                `Bạn có chắc muốn xóa đối tác / khách hàng "${item.name}" không?`
                              );
                              if (!confirmed) return;

                              setPartyDetailOpen(false);
                              setPartyFormOpen(false);
                              setSelectedPartyId(null);

                              onDeleteParty(item.party_id);
                              return;
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeCatalog === "channels" && (
        <Card className="mt-6 rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-orange-100 bg-orange-50/40">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Danh sách kênh
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead>Mã kênh</TableHead>
                  <TableHead className="w-[240px]">Tên kênh</TableHead>
                  <TableHead>Nền tảng</TableHead>
                  <TableHead>Địa chỉ kênh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {channels.map((item) => (
                  <TableRow key={item.channel_id}>
                    <TableCell className="font-medium">{item.code}</TableCell>
                    <TableCell className="max-w-0">
                      <TruncatedHoverText text={item.name}widthClass="max-w-[240px]" />
                    </TableCell>
                    <TableCell>{optionLabel(platformOptions, item.platform)}</TableCell>
                    <TableCell>{item.metadata || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeCatalog === "studios" && (
        <Card className="mt-6 rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-orange-100 bg-orange-50/40">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Danh sách studio
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên studio</TableHead>
                  <TableHead>Vị trí</TableHead>
                  <TableHead>Diện tích</TableHead>
                  <TableHead>Sức chứa</TableHead>
                  <TableHead>Ghi chú</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studios.map((item) => (
                  <TableRow key={item.studio_id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.location || "—"}</TableCell>
                    <TableCell>{item.size || "—"}</TableCell>
                    <TableCell>{item.capacity || "—"}</TableCell>
                    <TableCell>{item.notes || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeCatalog === "files" && (
        <Card className="mt-6 rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-orange-100 bg-orange-50/40">
            <div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Kho file
              </CardTitle>
            </div>
            <PrimaryButton
              onClick={() => {
                setSelectedFileId(null);
                setFileFormMode("create");
                setFileFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm file
            </PrimaryButton>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_240px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  placeholder="Tìm theo tên file..."
                  className="pl-9"
                />
              </div>

              <Select
                value={fileFolderFilter}
                onValueChange={(value) => setFileFolderFilter(value as "all" | Folder)}
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Lọc theo thư mục" />
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
            </div>

            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[260px]">Tên file</TableHead>
                  <TableHead>Thư mục</TableHead>
                  <TableHead>Định dạng</TableHead>
                  <TableHead>Dung lượng</TableHead>
                  <TableHead className="w-[190px] text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((item) => (
                  <TableRow key={item.file_id}>
                    <TableCell className="max-w-0 font-medium">
                      <TruncatedHoverText text={item.file_name} widthClass="max-w-[240px]" />
                    </TableCell>
                    <TableCell>{folderLabel(item.folder)}</TableCell>
                    <TableCell>{item.file_extension || "—"}</TableCell>
                    <TableCell>{formatFileSize(item.file_size)}</TableCell>
                    <TableCell className="w-[190px]">
                      <div className="flex justify-end">
                        <ActionDropdown
                          items={[
                            { value: "detail", label: "Xem chi tiết" },
                            ...(canCreateEditFileCatalog(currentUser)
                              ? [{ value: "edit", label: "Chỉnh sửa" }]
                              : []),
                            ...(canDeleteFileCatalog(currentUser)
                              ? [{ value: "delete", label: "Xóa" }]
                              : []),
                          ]}
                          onAction={(action) => {
                            setSelectedFileId(item.file_id);

                            if (action === "detail") setFileDetailOpen(true);
                            if (action === "edit") {
                              setFileFormMode("edit");
                              setFileFormOpen(true);
                            }
                            if (action === "delete") {
                              const confirmed = window.confirm(
                                `Bạn có chắc muốn xóa file "${item.file_name}" không?`
                              );
                              if (!confirmed) return;

                              setFileDetailOpen(false);
                              setFileFormOpen(false);
                              setSelectedFileId(null);

                              onDeleteFileCatalog(item.file_id);
                              return;
                            }
                          }}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <DetailDrawer
        title={selectedEmployee ? `Chi tiết nhân viên • ${selectedEmployee.name}` : "Chi tiết nhân viên"}
        open={employeeDetailOpen}
        onClose={() => setEmployeeDetailOpen(false)}
      >
        {selectedEmployee && <EmployeeFullView employee={selectedEmployee} />}
      </DetailDrawer>

      <DetailDrawer
        title={selectedParty ? `Chi tiết đối tác / khách hàng • ${selectedParty.name}` : "Chi tiết đối tác / khách hàng"}
        open={partyDetailOpen}
        onClose={() => setPartyDetailOpen(false)}
      >
        {selectedParty && <PartyFullView party={selectedParty} />}
      </DetailDrawer>

      <DetailDrawer
        title={selectedFile ? `Chi tiết file • ${selectedFile.file_name}` : "Chi tiết file"}
        open={fileDetailOpen}
        onClose={() => setFileDetailOpen(false)}
      >
        {selectedFile && <FileCatalogFullView file={selectedFile} />}
      </DetailDrawer>

      <EmployeeFormDialog
        open={employeeFormOpen}
        onOpenChange={setEmployeeFormOpen}
        mode={employeeFormMode}
        initialEmployee={selectedEmployee}
        onSaveEmployee={onSaveEmployee}
      />

      <PartyFormDialog
        open={partyFormOpen}
        onOpenChange={setPartyFormOpen}
        mode={partyFormMode}
        initialParty={selectedParty}
        onSaveParty={onSaveParty}
      />

      <FileCatalogFormDialog
        open={fileFormOpen}
        onOpenChange={setFileFormOpen}
        mode={fileFormMode}
        initialFile={selectedFile}
        currentUser={currentUser}
        onSaveFileCatalog={onSaveFileCatalog}
      />
    </div>
  );
}