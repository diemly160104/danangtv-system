import type {
  ChannelView,
  CustomerType,
  DraftLinkedFile,
  EmployeeDepartment,
  EmployeeView,
  FileRow,
  Folder,
  Gender,
  LinkedFileSeedRow,
  Option,
  PartyType,
  ServiceType,
  SessionUser,
  UserRole,
} from "@/features/danangtv/types";

import {
  customerTypeOptions,
  employeeDepartmentOptions,
  folderOptions,
  genderOptions,
  partyTypeOptions,
} from "@/features/danangtv/options";


const APP_TIME_ZONE = "Asia/Ho_Chi_Minh";

// ======================================================
// HÀM ĐỊNH DẠNG
// ======================================================


export function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", { 
    style: "currency", 
    currency: "VND", 
    maximumFractionDigits: 0 
}).format(value);
}

export function formatFileSize(value?: number) {
  if (!value || value <= 0) return "—";

  const units = ["B", "KB", "MB", "GB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(size >= 10 || unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}


// ======================================================
// HÀM XỬ LÝ NGÀY GIỜ
// ======================================================

export function getDateParts(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const plainDateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (plainDateMatch) {
    return {
      yyyy: plainDateMatch[1],
      mm: plainDateMatch[2],
      dd: plainDateMatch[3],
    };
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    const fallbackMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!fallbackMatch) return null;

    return {
      yyyy: fallbackMatch[1],
      mm: fallbackMatch[2],
      dd: fallbackMatch[3],
    };
  }

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(parsed);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    yyyy: map.year || "",
    mm: map.month || "",
    dd: map.day || "",
  };
}

export function getCurrentDateTimeString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export function toDateInputValue(value?: string | null) {
  const parts = getDateParts(value);
  if (!parts) return "";

  return `${parts.yyyy}-${parts.mm}-${parts.dd}`;
}

export function formatDisplayDate(value?: string | null) {
  const parts = getDateParts(value);
  if (!parts) return "—";

  return `${parts.dd}-${parts.mm}-${parts.yyyy}`;
}

export function parseScheduleDisplayDate(value?: string | null) {
  if (!value) return null;

  const normalized = value.includes("T")
    ? value
    : value.replace(" ", "T");

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return null;

  return date;
}

export function formatScheduleDateTime(value?: string | null) {
  const date = parseScheduleDisplayDate(value);
  if (!date) return "—";

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.day}-${map.month}-${map.year} ${map.hour}:${map.minute}`;
}

export function isSameScheduleDate(value?: string | null, targetDate?: Date) {
  const parsed = parseScheduleDisplayDate(value);
  if (!parsed || !targetDate) return false;

  return (
    parsed.getFullYear() === targetDate.getFullYear() &&
    parsed.getMonth() === targetDate.getMonth() &&
    parsed.getDate() === targetDate.getDate()
  );
}

export function formatScheduleTime(value?: string | null) {
  const date = parseScheduleDisplayDate(value);
  if (!date) return "—";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.hour}:${map.minute}`;
}

export function formatScheduleTimeRange(start?: string | null, end?: string | null) {
  return `${formatScheduleTime(start)} - ${formatScheduleTime(end)}`;
}

export function getISODate(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function startOfWeek(date: Date) {
  const cloned = new Date(date);
  const day = cloned.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  cloned.setDate(cloned.getDate() + diff);
  cloned.setHours(0, 0, 0, 0);
  return cloned;
}

export function endOfWeek(date: Date) {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function isSameDay(dateA: Date, dateB: Date) {
  return getISODate(dateA) === getISODate(dateB);
}

export function getRangeLabel(currentDate: Date, calendarView: "day" | "week" | "month") {
  if (calendarView === "day") {
    return currentDate.toLocaleDateString("vi-VN");
  }

  if (calendarView === "week") {
    const start = startOfWeek(currentDate);
    const end = endOfWeek(currentDate);
    return `${start.toLocaleDateString("vi-VN")} - ${end.toLocaleDateString("vi-VN")}`;
  }

  return `Tháng ${currentDate.getMonth() + 1}/${currentDate.getFullYear()}`;
}

export function buildMonthDays(currentDate: Date) {
  const first = startOfMonth(currentDate);
  const firstDay = first.getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - offset);

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function buildWeekDays(currentDate: Date) {
  const start = startOfWeek(currentDate);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

// ======================================================
// HÀM GẮN NHÃN HIỂN THỊ
// ======================================================

export function optionLabel<T extends string>(options: Option<T>[], value?: string) {
  return options.find((item) => item.value === value)?.label || value || "—";
}

export function roleLabel(role: UserRole) {
  if (role === "manager") return "Quản lý";
  if (role === "technical_admin") return "Kỹ thuật / Quản trị hệ thống";
  return "Nhân sự";
}

export function serviceTypeLabel(value: ServiceType) {
  const map: Record<ServiceType, string> = {
    printed_ad: "Báo in",
    electronic_ad: "Báo điện tử",
    tv_ad: "Truyền hình",
    radio_ad: "Phát thanh",
    digital_ad: "Digital",
    studio_rental: "Thuê studio",
    content_production: "Sản xuất nội dung",
    other: "Khác",
  };
  return map[value];
}

export function departmentLabel(value?: EmployeeDepartment | string) { 
  return optionLabel(employeeDepartmentOptions, value); 
}

export function partyTypeLabel(value?: PartyType | string) {
  return optionLabel(partyTypeOptions, value);
}

export function genderLabel(value?: Gender | string) {
  return optionLabel(genderOptions, value);
}

export function customerTypeLabel(value?: CustomerType | string) {
  return optionLabel(customerTypeOptions, value);
}

export function folderLabel(value?: Folder | string) {
  return optionLabel(folderOptions, value);
}

export function statusLabel(value: string) {
  const map: Record<string, string> = {
    draft: "Nháp",
    active: "Đang hiệu lực",
    completed: "Hoàn thành",
    cancelled: "Đã hủy",
    planned: "Kế hoạch",
    in_progress: "Đang thực hiện",
    done: "Hoàn tất",
    approved: "Đã duyệt",
    broadcasted: "Đã phát",
    editing: "Đang biên tập",
    rejected: "Từ chối",
    overdue: "Quá hạn",
    partial: "Thanh toán một phần",
    paid: "Đã thanh toán",
    issued: "Đã phát hành",
    void: "Hủy hóa đơn",
    inactive: "Tạm ngừng",
    terminated: "Đã nghỉ",
    locked: "Bị khóa",
  };
  return map[value] || value;
}

// ======================================================
// HÀM TRA CỨU VÀ TÌM KIẾM
// ======================================================

export function getChannelNameById(channels: ChannelView[], channelId?: string | null) {
  if (!channelId) return "";
  return channels.find((item) => item.channel_id === channelId)?.name || "";
}

export function getChannelNameByCode(channels: ChannelView[], channelCode?: string | null) {
  if (!channelCode) return "";
  return channels.find((item) => item.code === channelCode)?.name || "";
}

export function getChannelDisplayName(
  channels: ChannelView[],
  args: {
    channelId?: string | null;
    channelCode?: string | null;
  }
) {
  return (
    getChannelNameById(channels, args.channelId) ||
    getChannelNameByCode(channels, args.channelCode) ||
    args.channelCode ||
    "—"
  );
}

export function searchWithMinChars<T>(
  items: T[],
  search: string,
  getSearchText: (item: T) => string,
  minChars = 2,
  limit = 5
) {
  const q = search.trim().toLowerCase();
  if (q.length < minChars) return [];

  return items
    .filter((item) => getSearchText(item).toLowerCase().includes(q))
    .slice(0, limit);
}


// ======================================================
// HÀM PHÂN QUYỀN
// ======================================================


export function normalizeOwnerName(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function getActorNames(user: SessionUser | null) {
  if (!user) return [];

  return [user.employee_name, user.username]
    .map((value) => normalizeOwnerName(value))
    .filter(Boolean);
}

export function isOwner(user: SessionUser | null, createdByName?: string | null) {
  const ownerName = normalizeOwnerName(createdByName);
  if (!ownerName) return false;

  return getActorNames(user).includes(ownerName);
}

export function isApprovedStatus(status?: string | null) {
  return String(status || "").trim().toLowerCase() === "approved";
}

export function canApprove(user: SessionUser | null) {
  return user?.role === "manager" && user.status === "active";
}

export function canCreateOperationalRecord(user: SessionUser | null) {
  return !!user && user.status === "active" && ["manager", "staff"].includes(user.role);
}

export function canEditOwnOperationalRecord(args: {
  user: SessionUser | null;
  createdByName?: string | null;
  status?: string | null;
}) {
  return (
    canCreateOperationalRecord(args.user) &&
    isOwner(args.user, args.createdByName) &&
    !isApprovedStatus(args.status)
  );
}

export function canDeleteOwnOperationalRecord(args: {
  user: SessionUser | null;
  createdByName?: string | null;
  status?: string | null;
}) {
  return (
    canCreateOperationalRecord(args.user) &&
    isOwner(args.user, args.createdByName) &&
    !isApprovedStatus(args.status)
  );
}

export function canCreateEditEmployeeCatalog(user: SessionUser | null) {
  return !!user && user.status === "active" && ["manager", "technical_admin"].includes(user.role);
}

export function canDeleteEmployeeCatalog(user: SessionUser | null) {
  return !!user && user.status === "active" && user.role === "manager";
}

export function canEditEmployeeRecord(
  user: SessionUser | null,
  employee: EmployeeView | null | undefined
) {
  if (!user || user.status !== "active" || !employee) return false;

  if (canCreateEditEmployeeCatalog(user)) return true;

  const employeeKeys = [
    normalizeOwnerName(employee.name),
    normalizeOwnerName(employee.employee_code),
  ].filter(Boolean);

  const actorKeys = getActorNames(user);

  return actorKeys.some((value) => employeeKeys.includes(value));
}

export function canCreateEditPartyCatalog(user: SessionUser | null) {
  return !!user && user.status === "active" && ["manager", "staff"].includes(user.role);
}

export function canDeletePartyCatalog(_user: SessionUser | null) {
  return false;
}

export function canCreateEditFileCatalog(user: SessionUser | null) {
  return !!user && user.status === "active" && ["manager", "staff", "technical_admin"].includes(user.role);
}

export function canDeleteFileCatalog(user: SessionUser | null) {
  return !!user && user.status === "active" && user.role === "manager";
}


// ======================================================
// HÀM KIỂM TRA DỮ LIỆU
// ======================================================

export function isBlank(value: unknown) {
  return String(value ?? "").trim() === "";
}

export function validateSingleMainFile(rows: DraftLinkedFile[], entityLabel: string) {
  const mainCount = rows.filter((row) => row.is_main).length;
  if (mainCount > 1) {
    return `${entityLabel} chỉ được có tối đa 1 file chính.`;
  }
  return null;
}

export function validateLinkedFilesBySchema(
  rows: DraftLinkedFile[],
  options: {
    entityLabel: string;
    requireRole: boolean;
  }
) {
  const mainFileError = validateSingleMainFile(rows, options.entityLabel);
  if (mainFileError) return mainFileError;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (isBlank(row.file_name)) {
      return `${options.entityLabel}: dòng file ${i + 1} chưa có tên file.`;
    }

    if (options.requireRole && isBlank(row.file_role)) {
      return `${options.entityLabel}: file "${row.file_name}" chưa nhập vai trò file.`;
    }
  }

  return null;
}

// ======================================================
// HÀM TẠO ID VÀ XỬ LÝ FILE
// ======================================================

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function mergeById<T extends Record<string, any>>(
  prev: T[],
  next: T[],
  idKey: keyof T
) {
  const map = new Map<string, T>();

  prev.forEach((item) => {
    map.set(String(item[idKey]), item);
  });

  next.forEach((item) => {
    map.set(String(item[idKey]), item);
  });

  return Array.from(map.values());
}

export function getFileExtension(fileName: string) {
  const parts = fileName.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

export function buildFileRowsFromLocalNames(
  fileNames: string[],
  folder: Folder,
  currentUser: SessionUser | null
): FileRow[] {
  const actorName = currentUser?.employee_name || currentUser?.username || "Hệ thống";

  return fileNames.map((fileName) => ({
    file_id: createId("FL"),
    file_name: fileName,
    storage_path: "",
    file_extension: getFileExtension(fileName),
    file_size: undefined,
    folder,
    uploaded_by_name: actorName,
    uploaded_at: getCurrentDateTimeString(),
    notes: "",
  }));
}

export function materializeDraftLinkedFiles(
  rows: DraftLinkedFile[],
  parentId: string,
  defaultFolder: Folder,
  currentUser: SessionUser | null
) {
  const actorName = currentUser?.employee_name || currentUser?.username || "Hệ thống";
  const newFiles: FileRow[] = [];

  const links: LinkedFileSeedRow[] = rows.map((row) => {
    let resolvedFileId = row.file_id;

    if (!resolvedFileId) {
      resolvedFileId = createId("FL");
      const folder = (row.folder || defaultFolder) as Folder;

      newFiles.push({
        file_id: resolvedFileId,
        file_name: row.file_name,
        storage_path: row.storage_path || "",
        file_extension: getFileExtension(row.file_name),
        file_size: undefined,
        folder,
        uploaded_by_name: actorName,
        uploaded_at: getCurrentDateTimeString(),
        notes: row.notes || "",
      });
    }

    return {
      id: row.id || createId("LFILE"),
      parent_id: parentId,
      file_id: resolvedFileId,
      file_role: row.file_role,
      is_main: row.is_main,
      notes: row.notes || "",
    };
  });

  return {
    newFiles,
    links,
    fileIds: links.map((item) => item.file_id),
  };
}

// export function buildStoragePath(folder: Folder, fileName: string) {
//   return `/${folder}/2026/${fileName}`;
// }