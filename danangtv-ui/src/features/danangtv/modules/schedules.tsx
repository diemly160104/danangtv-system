import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import type {
  Platform,
  SessionUser,
  ChannelView,
  FileRow,
  StudioView,
  ContractRow,
  ServiceItemRow,
  BookingRow,
  ProductionTaskRow,
  ProductionRow,
  ContentRow,
  BroadcastScheduleRow,
  ScheduleTab,
  ScheduleMode,
  StudioUsageSourceMode,
  BroadcastScheduleForm,
  StudioRentalRow,
  StudioUsageRow,
  StudioUsageForm,
  Option,
  LinkedFileSeedRow,
  ServiceItemContentRow,
  ServiceItemProductionRow
} from "@/features/danangtv/types";

import {
  buildBroadcastScheduleFormData,
  buildStudioUsageFormData,
  getChannelsByServiceType,
  getStudioName,
  getScheduleableServiceItems,
  getStudioRentalServiceItems
} from "@/features/danangtv/selectors";

import {
  scheduleStatusOptions,
  scheduleTypeOptions,
  scheduleModeOptions,
  rentalTypeOptions
} from "@/features/danangtv/options";

import {
  StatusBadge,
  PrimaryButton,
  SuggestionList,
  FormSection,
  SectionHeader,
  DetailSectionTitle,
  DetailDrawer,
  FieldBlock,
  EnumSelect
} from "@/features/danangtv/shared/commonComponents";

import {
  canApprove,
  canCreateOperationalRecord,
  canDeleteOwnOperationalRecord,
  canEditOwnOperationalRecord,
  statusLabel,
  formatScheduleDateTime,
  getChannelDisplayName,
  isBlank,
  optionLabel,
  searchWithMinChars,
  serviceTypeLabel,
  createId,
  getCurrentDateTimeString,
  formatScheduleTimeRange,
  isSameScheduleDate,
  getRangeLabel,
  buildWeekDays,
  isSameDay,
  getISODate,
  buildMonthDays,
} from "@/features/danangtv/utils/Helpers";

import { ContentFullView} from "@/features/danangtv/modules/contents";
import { ProductionFullView} from "@/features/danangtv/modules/productions";


// COMPONENT HIỂN THỊ CHI TIẾT LỊCH TRÊN CALENDAR
function CalendarEventChip({
  title,
  subtitle,
  status,
  onClick,
}: {
  title: string;
  subtitle?: string;
  status: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-left text-xs hover:bg-orange-100"
    >
      <div className="font-semibold text-slate-800">{title}</div>
      {subtitle && <div className="mt-1 text-slate-500">{subtitle}</div>}
      <div className="mt-2">
        <StatusBadge value={status} />
      </div>
    </button>
  );
}

// HÀM LẤY CÁC LỰA CHỌN HÌNH THỨC LỊCH THEO NỀN TẢNG PHÁT
function getScheduleModeOptionsByPlatform(platform?: Platform): Option<ScheduleMode>[] {
  if (platform === "television" || platform === "radio") {
    return [
      { value: "live_broadcast", label: "Phát trực tiếp" },
      { value: "recorded_broadcast", label: "Phát ghi hình / dựng sẵn" },
      { value: "rerun_broadcast", label: "Phát lại" },
      { value: "other", label: "Khác" },
    ];
  }

  if (platform === "electronic") {
    return [
      { value: "article_publication", label: "Đăng tin / bài" },
      { value: "program_publication", label: "Đăng chương trình" },
      { value: "banner_publication", label: "Banner / hiển thị" },
      { value: "other", label: "Khác" },
    ];
  }

  if (platform === "print") {
    return [
      { value: "issue_release", label: "Phát hành số / kỳ" },
      { value: "article_publication", label: "Đăng tin / bài" },
      { value: "other", label: "Khác" },
    ];
  }

  if (platform === "digital") {
    return [
      { value: "social_post", label: "Bài post mạng xã hội" },
      { value: "program_publication", label: "Đăng chương trình" },
      { value: "banner_publication", label: "Banner / hiển thị" },
      { value: "live_broadcast", label: "Livestream / phát trực tiếp" },
      { value: "recorded_broadcast", label: "Video dựng sẵn" },
      { value: "other", label: "Khác" },
    ];
  }

  return scheduleModeOptions;
}

// HÀM LẤY TÊN NHÂN VIÊN PHÊ DUYỆT CHO LỊCH
function getApproverEmployeeName(user: SessionUser | null) {
  return user?.employee_name || user?.username || "—";
}

// HÀM TẠO FORM TRỐNG CHO LỊCH PHÁT SÓNG / PHÁT HÀNH
function createEmptyBroadcastScheduleForm(): BroadcastScheduleForm {
  return {
    schedule_source: "service",
    program_name: "",
    schedule_type: "broadcast",
    schedule_mode: "live_broadcast",
    contract_search: "",
    selected_contract_id: "",
    channel_id: "",
    service_item_id: "",
    booking_id: "",
    content_id: "",
    content_search: "",
    scheduled_start: "",
    scheduled_end: "",
    status: "planned",
    notes: "",
  };
}

// HÀM TẠO FORM TRỐNG CHO LỊCH SỬ DỤNG STUDIO
function createEmptyStudioUsageForm(): StudioUsageForm {
  return {
    source_mode: "production",
    production_search: "",
    selected_production_id: "",
    contract_search: "",
    selected_contract_id: "",
    selected_service_item_id: "",
    selected_rental_id: "",
    studio_id: "",
    usage_start: "",
    usage_end: "",
    status: "planned",
    notes: "",
  };
}

// HÀM KIỂM TRA FORM TRƯỚC KHI LƯU LỊCH PHÁT SÓNG / PHÁT HÀNH
function validateBroadcastScheduleBeforeSave(form: BroadcastScheduleForm) {
  if (isBlank(form.program_name)) return "Vui lòng nhập tên chương trình / chuyên mục.";
  if (isBlank(form.schedule_type)) return "Vui lòng chọn loại lịch.";
  if (isBlank(form.schedule_mode)) return "Vui lòng chọn hình thức lịch.";
  if (isBlank(form.channel_id)) return "Vui lòng chọn kênh phát / phát hành.";
  if (isBlank(form.scheduled_start)) return "Vui lòng nhập thời gian bắt đầu.";
  if (isBlank(form.status)) return "Vui lòng chọn trạng thái lịch.";

  if (form.schedule_source === "service") {
    if (isBlank(form.selected_contract_id)) return "Lịch dịch vụ phải chọn hợp đồng.";
    if (isBlank(form.service_item_id)) return "Lịch dịch vụ phải chọn mục dịch vụ.";
    if (isBlank(form.booking_id)) return "Lịch dịch vụ phải chọn booking tương ứng.";
  }

  return null;
}

// HÀM KIỂM TRA FORM TRƯỚC KHI LƯU LỊCH SỬ DỤNG STUDIO
function validateStudioUsageBeforeSave(form: StudioUsageForm) {
  if (isBlank(form.studio_id)) return "Vui lòng chọn studio.";
  if (isBlank(form.usage_start)) return "Vui lòng nhập thời gian bắt đầu sử dụng studio.";
  if (isBlank(form.usage_end)) return "Vui lòng nhập thời gian kết thúc sử dụng studio.";
  if (isBlank(form.status)) return "Vui lòng chọn trạng thái lịch studio.";

  if (form.source_mode === "production") {
    if (isBlank(form.selected_production_id)) {
      return "Lịch sử dụng studio cho sản xuất phải chọn dự án.";
    }
  }

  if (form.source_mode === "rental") {
    if (isBlank(form.selected_contract_id)) return "Lịch sử dụng studio cho thuê phải chọn hợp đồng.";
    if (isBlank(form.selected_service_item_id)) return "Vui lòng chọn mục dịch vụ thuê studio.";
    if (isBlank(form.selected_rental_id)) return "Vui lòng chọn chi tiết lịch thuê studio.";
  }

  return null;
}

// VIEW THÊM/CHỈNH SỬA LỊCH PHÁT SÓNG / PHÁT HÀNH
function BroadcastScheduleFormDialog({
  open,
  onOpenChange,
  mode,
  initialSchedule,
  contracts,
  serviceItems,
  bookings,
  contents,
  channels,
  currentUser,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialSchedule?: BroadcastScheduleRow | null;
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  bookings: BookingRow[];
  contents: ContentRow[];
  channels: ChannelView[];
  currentUser: SessionUser;
  onSave: (row: BroadcastScheduleRow) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<BroadcastScheduleForm>(createEmptyBroadcastScheduleForm());
  const [contentSuggestOpen, setContentSuggestOpen] = useState(false);
  const [contractSuggestOpen, setContractSuggestOpen] = useState(false);

  const contractSuggestions = useMemo(() => {
    return searchWithMinChars(
      contracts.filter((item) => item.contract_type === "service"),
      form.contract_search,
      (item) => `${item.contract_number} ${item.title} ${item.party_name}`
    );
  }, [contracts, form.contract_search]);

  const selectedContract = useMemo(
    () => contracts.find((item) => item.contract_id === form.selected_contract_id) || null,
    [contracts, form.selected_contract_id]
  );

  const serviceOptions = useMemo(
    () => getScheduleableServiceItems(serviceItems, bookings, form.selected_contract_id),
    [serviceItems, bookings, form.selected_contract_id]
  );

  const filteredBookings = useMemo(
    () => bookings.filter((b) => b.service_item_id === form.service_item_id),
    [bookings, form.service_item_id]
  );

  const selectedService = serviceItems.find((item) => item.service_item_id === form.service_item_id);

  const filteredChannels = useMemo(() => {
    if (!selectedService) return channels;
    return getChannelsByServiceType(channels, selectedService.service_type);
  }, [channels, selectedService]);

  const selectedChannel = useMemo(
    () => channels.find((item) => item.channel_id === form.channel_id) || null,
    [channels, form.channel_id]
  );

  const availableScheduleModeOptions = useMemo(
    () => getScheduleModeOptionsByPlatform(selectedChannel?.platform),
    [selectedChannel]
  );

  const contentSuggestions = useMemo(() => {
    const q = form.content_search.trim().toLowerCase();

    return contents
      .filter((item) => item.title.toLowerCase().includes(q))
      .slice(0, 20);
  }, [contents, form.content_search]);

  useEffect(() => {
    if (!open) return;

    if (!isEdit || !initialSchedule) {
      setForm(createEmptyBroadcastScheduleForm());
      return;
    }

    setForm(buildBroadcastScheduleFormData(contracts, channels, initialSchedule));
  }, [open, isEdit, initialSchedule, contracts, channels]);

  const handleSave = async () => {
    const validationError = validateBroadcastScheduleBeforeSave(form);
    if (validationError) {
      alert(validationError);
      return;
    }

    const selectedChannelRow =
      channels.find((item) => item.channel_id === form.channel_id) || null;
    const selectedContentRow =
      contents.find((item) => item.content_id === form.content_id) || null;
    const selectedContractRow =
      contracts.find((item) => item.contract_id === form.selected_contract_id) || null;

    const nextApprovedByName =
      form.status === "approved"
        ? initialSchedule?.approved_by_name || getApproverEmployeeName(currentUser)
        : undefined;

    const nextApprovedAt =
      form.status === "approved"
        ? initialSchedule?.approved_at || getCurrentDateTimeString()
        : undefined;

    const row: BroadcastScheduleRow = {
      broadcast_id:
        isEdit && initialSchedule
          ? initialSchedule.broadcast_id
          : createId("SC"),
      program_name: form.program_name || undefined,
      schedule_type: form.schedule_type,
      schedule_mode: form.schedule_mode,
      service_item_id:
        form.schedule_source === "service"
          ? form.service_item_id || undefined
          : undefined,
      booking_id:
        form.schedule_source === "service"
          ? form.booking_id || undefined
          : undefined,
      channel_id: form.channel_id || undefined,
      channel_code: selectedChannelRow?.code || "",
      content_id: form.content_id || undefined,
      content_title: selectedContentRow?.title || "",
      scheduled_start: form.scheduled_start,
      scheduled_end: form.scheduled_end || undefined,
      status: form.status,
      approved_by_name: nextApprovedByName,
      approved_at: nextApprovedAt,
      created_by_name:
        isEdit && initialSchedule
          ? initialSchedule.created_by_name
          : currentUser.employee_name || currentUser.username,
      contract_number: selectedContractRow?.contract_number || undefined,
      notes: form.notes || undefined,
    };

    const saved = await onSave(row);
    if (!saved) return;

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-auto rounded-2xl sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa lịch phát sóng / phát hành" : "Thêm lịch phát sóng / phát hành"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <FormSection title="Thông tin booking">

            <FieldBlock label="Nguồn lịch">
              <Select
                value={form.schedule_source}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    schedule_source: value as "service" | "general",
                    contract_search: "",
                    selected_contract_id: "",
                    service_item_id: "",
                    booking_id: "",
                    channel_id: "",
                  }))
                }
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Chọn nguồn lịch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="service">Theo dịch vụ</SelectItem>
                  <SelectItem value="general">Không gắn hợp đồng</SelectItem>
                </SelectContent>
              </Select>
            </FieldBlock>

            {form.schedule_source === "service" && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FieldBlock label="Tìm hợp đồng">
                  <div className="space-y-2">
                    <Input
                      value={form.contract_search}
                      onFocus={() => setContractSuggestOpen(true)}
                      onBlur={() => setTimeout(() => setContractSuggestOpen(false), 120)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contract_search: e.target.value,
                          selected_contract_id: "",
                          service_item_id: "",
                          booking_id: "",
                          channel_id: "",
                        }))
                      }
                      placeholder="Nhập số hoặc tên hợp đồng..."
                    />

                    {contractSuggestOpen && !form.selected_contract_id && (
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
                              selected_contract_id: picked.contract_id,
                              contract_search: `${picked.contract_number} • ${picked.title}`,
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

                <FieldBlock label="Mục dịch vụ">
                  <Select
                    value={form.service_item_id}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        service_item_id: value,
                        booking_id: "",
                        channel_id: "",
                      }))
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
                </FieldBlock>

                <FieldBlock label="Booking">
                  <Select
                    value={form.booking_id}
                    onValueChange={(value) => {
                      const booking = filteredBookings.find((b) => b.booking_id === value);
                      const channel = channels.find((c) => c.code === booking?.channel_code);
                      const nextModeOptions = getScheduleModeOptionsByPlatform(channel?.platform);

                      setForm((prev) => ({
                        ...prev,
                        booking_id: value,
                        channel_id: channel?.channel_id || prev.channel_id,
                        schedule_mode: nextModeOptions[0]?.value || prev.schedule_mode,
                      }));
                    }}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Chọn booking" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredBookings.map((item) => (
                        <SelectItem key={item.booking_id} value={item.booking_id}>
                          {item.description} • {getChannelDisplayName(channels, {
                            channelCode: item.channel_code,
                          })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
              </div>
            )}
          </FormSection>

          <FormSection title="Thông tin phát sóng / phát hành">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldBlock label="Tên chương trình / chuyên mục">
                <Input
                  value={form.program_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, program_name: e.target.value }))}
                />
              </FieldBlock>

              <FieldBlock label="Loại lịch">
                <EnumSelect
                  value={form.schedule_type}
                  onChange={(value) => setForm((prev) => ({ ...prev, schedule_type: value }))}
                  options={scheduleTypeOptions}
                />
              </FieldBlock>

              <FieldBlock label="Kênh phát / phát hành">
                <Select
                  value={form.channel_id}
                  onValueChange={(value) => {
                    const pickedChannel = channels.find((item) => item.channel_id === value);
                    const nextModeOptions = getScheduleModeOptionsByPlatform(pickedChannel?.platform);

                    setForm((prev) => ({
                      ...prev,
                      channel_id: value,
                      schedule_mode: nextModeOptions[0]?.value || "other",
                    }));
                  }}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Chọn kênh" />
                  </SelectTrigger>
                  <SelectContent>
                    {(form.schedule_source === "service" ? filteredChannels : channels).map((item) => (
                      <SelectItem key={item.channel_id} value={item.channel_id}>
                        {item.code} • {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>

              <FieldBlock label="Hình thức">
                <EnumSelect
                  value={form.schedule_mode}
                  onChange={(value) => setForm((prev) => ({ ...prev, schedule_mode: value }))}
                  options={availableScheduleModeOptions}
                />
              </FieldBlock>

              <FieldBlock label="Content">
                <div className="space-y-2">
                  <Input
                    value={form.content_search}
                    onFocus={() => setContentSuggestOpen(true)}
                    onBlur={() => setTimeout(() => setContentSuggestOpen(false), 120)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        content_search: e.target.value,
                        content_id: "",
                      }))
                    }
                    placeholder="Nhập tên content..."
                  />

                  {contentSuggestOpen && !form.content_id && (
                    <SuggestionList
                      items={contentSuggestions.map(
                        (item) => `${item.title} • ${statusLabel(item.status)}`
                      )}
                      onPick={(value) => {
                        const picked = contentSuggestions.find(
                          (item) => `${item.title} • ${statusLabel(item.status)}` === value
                        );

                        if (picked) {
                          setForm((prev) => ({
                            ...prev,
                            content_id: picked.content_id,
                            content_search: picked.title,
                          }));
                          setContentSuggestOpen(false);
                        }
                      }}
                    />
                  )}

                  {form.content_id && (
                    <div className="text-xs text-emerald-600">
                      Đã chọn: {
                        contents.find((item) => item.content_id === form.content_id)?.title || form.content_search
                      }
                    </div>
                  )}
                </div>
              </FieldBlock>

              <FieldBlock label="Bắt đầu theo lịch">
                <Input
                  type="datetime-local"
                  value={form.scheduled_start}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduled_start: e.target.value }))}
                />
              </FieldBlock>

              <FieldBlock label="Kết thúc theo lịch">
                <Input
                  type="datetime-local"
                  value={form.scheduled_end}
                  onChange={(e) => setForm((prev) => ({ ...prev, scheduled_end: e.target.value }))}
                />
              </FieldBlock>

              <FieldBlock label="Trạng thái">
                <EnumSelect
                  value={form.status}
                  onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                  options={scheduleStatusOptions}
                />
              </FieldBlock>

              <div className="md:col-span-2">
                <FieldBlock label="Ghi chú">
                  <Input
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                  />
                </FieldBlock>
              </div>
            </div>
          </FormSection>
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <PrimaryButton onClick={handleSave}>
            {isEdit ? "Lưu thay đổi" : "Lưu lịch"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// VIEW THÊM/CHỈNH SỬA LỊCH SỬ DỤNG STUDIO
function StudioUsageFormDialog({
  open,
  onOpenChange,
  mode,
  initialUsage,
  productions,
  studioRentals,
  contracts,
  serviceItems,
  studios,
  currentUser,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialUsage?: StudioUsageRow | null;
  productions: ProductionRow[];
  studioRentals: StudioRentalRow[];
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  studios: StudioView[];
  currentUser: SessionUser;
  onSave: (row: StudioUsageRow) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";
  const [form, setForm] = useState<StudioUsageForm>(createEmptyStudioUsageForm());
  const [productionSuggestOpen, setProductionSuggestOpen] = useState(false);
  const [studioContractSuggestOpen, setStudioContractSuggestOpen] = useState(false);

  const productionSuggestions = useMemo(() => {
    const q = form.production_search.trim().toLowerCase();

    return productions
      .filter((item) => item.name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [productions, form.production_search]);

  const contractSuggestions = useMemo(() => {
    return searchWithMinChars(
      contracts.filter((item) => item.contract_type === "service"),
      form.contract_search,
      (item) => `${item.contract_number} ${item.title} ${item.party_name}`
    );
  }, [contracts, form.contract_search]);

  const selectedContract = contracts.find((item) => item.contract_id === form.selected_contract_id) || null;
  const rentalServiceOptions = getStudioRentalServiceItems(
    serviceItems,
    form.selected_contract_id
  );

  const rentalOptions = useMemo(() => {
    return studioRentals.filter((item) => item.service_item_id === form.selected_service_item_id);
  }, [studioRentals, form.selected_service_item_id]);

  useEffect(() => {
    if (!open) return;

    if (!isEdit || !initialUsage) {
      setForm(createEmptyStudioUsageForm());
      return;
    }

    setForm(
      buildStudioUsageFormData(
        productions,
        studioRentals,
        contracts,
        initialUsage
      )
    );
  }, [open, isEdit, initialUsage, productions, studioRentals, contracts]);

  const handleSave = async () => {
    const validationError = validateStudioUsageBeforeSave(form);
    if (validationError) {
      alert(validationError);
      return;
    }

    const nextApprovedByName =
      form.status === "approved"
        ? initialUsage?.approved_by_name || getApproverEmployeeName(currentUser)
        : undefined;

    const nextApprovedAt =
      form.status === "approved"
        ? initialUsage?.approved_at || getCurrentDateTimeString()
        : undefined;

    const row: StudioUsageRow = {
      usage_schedule_id:
        isEdit && initialUsage
          ? initialUsage.usage_schedule_id
          : createId("USG"),
      studio_id: form.studio_id,
      production_id:
        form.source_mode === "production" ? form.selected_production_id || undefined : undefined,
      rental_id:
        form.source_mode === "rental" ? form.selected_rental_id || undefined : undefined,
      usage_start: form.usage_start,
      usage_end: form.usage_end,
      status: form.status,
      approved_by_name: nextApprovedByName,
      approved_at: nextApprovedAt,
      notes: form.notes || undefined,
      created_by_name:
        isEdit && initialUsage
          ? initialUsage.created_by_name
          : currentUser.employee_name || currentUser.username,
    };

    const saved = await onSave(row);
    if (!saved) return;
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-auto rounded-2xl sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Chỉnh sửa lịch sử dụng studio" : "Thêm lịch sử dụng studio"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <FormSection title="Mục đích sử dụng">
            <FieldBlock label="Nguồn sử dụng">
              <Select
                value={form.source_mode}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    source_mode: value as StudioUsageSourceMode,
                    production_search: "",
                    selected_production_id: "",
                    contract_search: "",
                    selected_contract_id: "",
                    selected_service_item_id: "",
                    selected_rental_id: "",
                  }))
                }
              >
                <SelectTrigger className="rounded-2xl">
                  <SelectValue placeholder="Chọn nguồn" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="production">Cho sản xuất</SelectItem>
                  <SelectItem value="rental">Cho thuê</SelectItem>
                </SelectContent>
              </Select>
            </FieldBlock>

            {form.source_mode === "production" && (
              <div className="mt-4">
                <FieldBlock label="Dự án sản xuất">
                  <div className="space-y-2">
                    <Input
                      value={form.production_search}
                      onFocus={() => setProductionSuggestOpen(true)}
                      onBlur={() => setTimeout(() => setProductionSuggestOpen(false), 120)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          production_search: e.target.value,
                          selected_production_id: "",
                        }))
                      }
                      placeholder="Nhập tên dự án..."
                    />

                    {productionSuggestOpen && !form.selected_production_id && (
                      <SuggestionList
                        items={productionSuggestions.map((item) => item.name)}
                        onPick={(value) => {
                          const picked = productionSuggestions.find((item) => item.name === value);
                          if (picked) {
                            setForm((prev) => ({
                              ...prev,
                              production_search: picked.name,
                              selected_production_id: picked.production_id,
                            }));
                          }
                        }}
                      />
                    )}
                  </div>
                </FieldBlock>
              </div>
            )}

            {form.source_mode === "rental" && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FieldBlock label="Hợp đồng">
                  <div className="space-y-2">
                    <Input
                      value={form.contract_search}
                      onFocus={() => setStudioContractSuggestOpen(true)}
                      onBlur={() => setTimeout(() => setStudioContractSuggestOpen(false), 120)}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          contract_search: e.target.value,
                          selected_contract_id: "",
                          selected_service_item_id: "",
                          selected_rental_id: "",
                        }))
                      }
                      placeholder="Nhập số hoặc tên hợp đồng..."
                    />

                    {studioContractSuggestOpen && !form.selected_contract_id && (
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
                              selected_contract_id: picked.contract_id,
                              contract_search: `${picked.contract_number} • ${picked.title}`,
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

                <FieldBlock label="Mục dịch vụ thuê studio">
                  <Select
                    value={form.selected_service_item_id}
                    onValueChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        selected_service_item_id: value,
                        selected_rental_id: "",
                      }))
                    }
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Chọn mục dịch vụ thuê studio" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentalServiceOptions.map((item) => (
                        <SelectItem key={item.service_item_id} value={item.service_item_id}>
                          {item.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>

                <FieldBlock label="Chi tiết lịch thuê">
                  <Select
                    value={form.selected_rental_id}
                    onValueChange={(value) => {
                      const rental = rentalOptions.find((item) => item.rental_id === value);

                      setForm((prev) => ({
                        ...prev,
                        selected_rental_id: value,
                        studio_id: rental?.studio_id || prev.studio_id,
                        usage_start: rental?.rental_start || prev.usage_start,
                        usage_end: rental?.rental_end || prev.usage_end,
                      }));
                    }}
                  >
                    <SelectTrigger className="rounded-2xl">
                      <SelectValue placeholder="Chọn lịch thuê" />
                    </SelectTrigger>
                    <SelectContent>
                      {rentalOptions.map((item) => (
                        <SelectItem key={item.rental_id} value={item.rental_id}>
                          {getStudioName(studios, item.studio_id)} • {item.rental_start} → {item.rental_end}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldBlock>
              </div>
            )}
          </FormSection>

          <FormSection title="Thông tin lịch sử dụng">
            <div className="grid gap-4 md:grid-cols-2">
              <FieldBlock label="Studio">
                <Select
                  value={form.studio_id}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, studio_id: value }))}
                >
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder="Chọn studio" />
                  </SelectTrigger>
                  <SelectContent>
                    {studios.map((item) => (
                      <SelectItem key={item.studio_id} value={item.studio_id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldBlock>

              <FieldBlock label="Bắt đầu sử dụng">
                <Input
                  type="datetime-local"
                  value={form.usage_start}
                  onChange={(e) => setForm((prev) => ({ ...prev, usage_start: e.target.value }))}
                />
              </FieldBlock>

              <FieldBlock label="Kết thúc sử dụng">
                <Input
                  type="datetime-local"
                  value={form.usage_end}
                  onChange={(e) => setForm((prev) => ({ ...prev, usage_end: e.target.value }))}
                />
              </FieldBlock>

              <FieldBlock label="Trạng thái">
                <EnumSelect
                  value={form.status}
                  onChange={(value) => setForm((prev) => ({ ...prev, status: value }))}
                  options={scheduleStatusOptions}
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
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <PrimaryButton onClick={handleSave}>
            {isEdit ? "Lưu thay đổi" : "Lưu lịch sử dụng studio"}
          </PrimaryButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// VIEW LỊCH PHÁT SÓNG / PHÁT HÀNH
function BroadcastCalendarPanel({
  rows,
  currentDate,
  calendarView,
  onPick,
}: {
  rows: BroadcastScheduleRow[];
  currentDate: Date;
  calendarView: "day" | "week" | "month";
  onPick: (id: string) => void;
}) {
  const renderEvent = (item: BroadcastScheduleRow) => (
    <CalendarEventChip
      key={item.broadcast_id}
      title={item.program_name || item.content_title || "—"}
      subtitle={`${item.channel_code} • ${formatScheduleTimeRange(item.scheduled_start, item.scheduled_end)}`}
      status={item.status}
      onClick={() => onPick(item.broadcast_id)}
    />
  );

  if (calendarView === "day") {
    const dayRows = rows.filter((item) =>
      isSameScheduleDate(item.scheduled_start, currentDate)
    );

    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-600">
          {getRangeLabel(currentDate, "day")}
        </div>
        {dayRows.length > 0 ? (
          <div className="space-y-3">{dayRows.map(renderEvent)}</div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
            Không có lịch trong ngày này.
          </div>
        )}
      </div>
    );
  }

  if (calendarView === "week") {
    const weekDays = buildWeekDays(currentDate);

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {weekDays.map((day) => {
          const dayRows = rows.filter((item) =>
            item.scheduled_start.startsWith(getISODate(day))
          );

          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`rounded-2xl border bg-white p-3 ${
                isToday
                  ? "border-orange-400 ring-2 ring-orange-100"
                  : "border-slate-200"
              }`}
            >
              <div
                className={`mb-3 text-sm font-semibold ${
                  isToday ? "text-orange-600" : "text-slate-700"
                }`}
              >
                {day.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </div>

              <div className="space-y-2">
                {dayRows.length > 0 ? (
                  dayRows.map(renderEvent)
                ) : (
                  <div className="rounded-xl border border-dashed p-3 text-xs text-slate-400">
                    Không có lịch
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const monthDays = buildMonthDays(currentDate);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-3 text-center text-xs font-semibold text-slate-500">
        <div>T2</div>
        <div>T3</div>
        <div>T4</div>
        <div>T5</div>
        <div>T6</div>
        <div>T7</div>
        <div>CN</div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {monthDays.map((day) => {
          const dayRows = rows.filter((item) =>
            item.scheduled_start.startsWith(getISODate(day))
          );

          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] rounded-2xl border p-2 ${
                isToday
                  ? "border-orange-400 bg-orange-50/40 ring-2 ring-orange-100"
                  : isCurrentMonth
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50 text-slate-400"
              }`}
            >
              <div
                className={`mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                  isToday
                    ? "bg-orange-500 text-white"
                    : isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-2">
                {dayRows.slice(0, 3).map(renderEvent)}
                {dayRows.length > 3 && (
                  <div className="text-xs text-slate-500">+{dayRows.length - 3} lịch khác</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// VIEW LỊCH SỬ DỤNG STUDIO
function StudioUsageCalendarPanel({
  rows,
  studios,
  currentDate,
  calendarView,
  onPick,
}: {
  rows: StudioUsageRow[];
  studios: StudioView[];
  currentDate: Date;
  calendarView: "day" | "week" | "month";
  onPick: (id: string) => void;
}) {
  const renderEvent = (item: StudioUsageRow) => (
    <CalendarEventChip
      key={item.usage_schedule_id}
      title={getStudioName(studios, item.studio_id)}
      subtitle={formatScheduleTimeRange(item.usage_start, item.usage_end)}
      status={item.status}
      onClick={() => onPick(item.usage_schedule_id)}
    />
  );

  if (calendarView === "day") {
    const dayRows = rows.filter((item) =>
      isSameScheduleDate(item.usage_start, currentDate)
    );

    return (
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-600">
          {getRangeLabel(currentDate, "day")}
        </div>
        {dayRows.length > 0 ? (
          <div className="space-y-3">{dayRows.map(renderEvent)}</div>
        ) : (
          <div className="rounded-xl border border-dashed p-4 text-sm text-slate-500">
            Không có lịch studio trong ngày này.
          </div>
        )}
      </div>
    );
  }

  if (calendarView === "week") {
    const weekDays = buildWeekDays(currentDate);

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        {weekDays.map((day) => {
          const dayRows = rows.filter((item) =>
            isSameScheduleDate(item.usage_start, day)
          );

          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`rounded-2xl border bg-white p-3 ${
                isToday
                  ? "border-orange-400 ring-2 ring-orange-100"
                  : "border-slate-200"
              }`}
            >
              <div
                className={`mb-3 text-sm font-semibold ${
                  isToday ? "text-orange-600" : "text-slate-700"
                }`}
              >
                {day.toLocaleDateString("vi-VN", {
                  weekday: "short",
                  day: "2-digit",
                  month: "2-digit",
                })}
              </div>

              <div className="space-y-2">
                {dayRows.length > 0 ? (
                  dayRows.map(renderEvent)
                ) : (
                  <div className="rounded-xl border border-dashed p-3 text-xs text-slate-400">
                    Không có lịch
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const monthDays = buildMonthDays(currentDate);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-3 text-center text-xs font-semibold text-slate-500">
        <div>T2</div>
        <div>T3</div>
        <div>T4</div>
        <div>T5</div>
        <div>T6</div>
        <div>T7</div>
        <div>CN</div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {monthDays.map((day) => {
          const dayRows = rows.filter((item) =>
            isSameScheduleDate(item.usage_start, day)
          );

          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[140px] rounded-2xl border p-2 ${
                isToday
                  ? "border-orange-400 bg-orange-50/40 ring-2 ring-orange-100"
                  : isCurrentMonth
                    ? "border-slate-200 bg-white"
                    : "border-slate-100 bg-slate-50 text-slate-400"
              }`}
            >
              <div
                className={`mb-2 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-sm font-semibold ${
                  isToday
                    ? "bg-orange-500 text-white"
                    : isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-400"
                }`}
              >
                {day.getDate()}
              </div>

              <div className="space-y-2">
                {dayRows.slice(0, 3).map(renderEvent)}
                {dayRows.length > 3 && (
                  <div className="text-xs text-slate-500">
                    +{dayRows.length - 3} lịch khác
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// VIEW CHI TIẾT LỊCH PHÁT SÓNG / PHÁT HÀNH
export function ScheduleFullView({
  currentUser,
  schedule,
  bookings,
  contents,
  serviceItems,
  serviceItemContents,
  contracts,
  channels,
  files,
  contentFileLinks,
  onEdit,
  onDelete,
  onApprove,
}: {
  currentUser: SessionUser;
  schedule: BroadcastScheduleRow;
  bookings: BookingRow[];
  contents: ContentRow[];
  serviceItems: ServiceItemRow[];
  serviceItemContents: ServiceItemContentRow[];
  contracts: ContractRow[];
  channels: ChannelView[];
  files: FileRow[];
  contentFileLinks: LinkedFileSeedRow[];
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
}) {
  const booking = bookings.find((item) => item.booking_id === schedule.booking_id);
  const content = contents.find((item) => item.content_id === schedule.content_id);
  const service = schedule.service_item_id
    ? serviceItems.find((item) => item.service_item_id === schedule.service_item_id)
    : null;

  const linkedContract = service
    ? contracts.find((item) => item.contract_id === service.contract_id)
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>Thông tin chung</DetailSectionTitle>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div><span className="font-medium">Chương trình / chuyên mục:</span> {schedule.program_name || "—"}</div>
          <div><span className="font-medium">Loại lịch:</span> {optionLabel(scheduleTypeOptions, schedule.schedule_type)}</div>
          <div><span className="font-medium">Hình thức:</span> {optionLabel(scheduleModeOptions, schedule.schedule_mode)}</div>
          <div><span className="font-medium">Kênh:</span>{" "}
            {getChannelDisplayName(channels, {
              channelId: schedule.channel_id,
              channelCode: schedule.channel_code,
            })}
          </div>
          <div><span className="font-medium">Bắt đầu:</span> {formatScheduleDateTime(schedule.scheduled_start)}</div>
          <div><span className="font-medium">Kết thúc:</span> {formatScheduleDateTime(schedule.scheduled_end)}</div>
          <div><span className="font-medium">Trạng thái:</span> {statusLabel(schedule.status)}</div>
          <div>
            <span className="font-medium">Hợp đồng:</span>{" "}
            {linkedContract
              ? `${linkedContract.contract_number} • ${linkedContract.title}`
              : schedule.contract_number || "—"}
          </div>
          <div><span className="font-medium">Mục dịch vụ:</span> {service?.title || "—"}</div>
          <div><span className="font-medium">Booking:</span> {booking?.description || "—"}</div>
          <div><span className="font-medium">Người duyệt:</span> {schedule.approved_by_name || "—"}</div>
          <div>
            <span className="font-medium">Thời gian duyệt:</span>{" "}
            {schedule.approved_at ? formatScheduleDateTime(schedule.approved_at) : "—"}
          </div>
          <div className="md:col-span-2"><span className="font-medium">Ghi chú:</span> {(schedule as any).notes || "—"}</div>
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          {onEdit && (
            <Button variant="outline" className="rounded-xl" onClick={onEdit}>
              Chỉnh sửa
            </Button>
          )}

          {onDelete && (
            <Button variant="outline" className="rounded-xl" onClick={onDelete}>
              Xóa
            </Button>
          )}

          {canApprove(currentUser) && schedule.status !== "approved" && onApprove && (
            <Button variant="outline" className="rounded-xl" onClick={onApprove}>
              Duyệt
            </Button>
          )}
        </div>
      </div>

      {content && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <DetailSectionTitle>Thông tin content</DetailSectionTitle>
          <ContentFullView
            content={content}
            contracts={contracts}
            serviceItems={serviceItems}
            serviceItemContents={serviceItemContents}
            files={files}
            contentFileLinks={contentFileLinks}
          />
        </div>
      )}
    </div>
  );
}

// VIEW CHI TIẾT LỊCH THUÊ STUDIO
export function StudioRentalFullView({
  rental,
  studios,
  serviceItems,
  contracts,
}: {
  rental: StudioRentalRow;
  studios: StudioView[];
  serviceItems: ServiceItemRow[];
  contracts: ContractRow[];
}) {
  const studio = studios.find((item) => item.studio_id === rental.studio_id);
  const service = serviceItems.find((item) => item.service_item_id === rental.service_item_id);
  const contract = contracts.find((item) => item.contract_id === rental.contract_id);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <span className="font-medium">Hợp đồng:</span>{" "}
            {contract ? `${contract.contract_number} • ${contract.title}` : "—"}
          </div>
          <div><span className="font-medium">Mục dịch vụ:</span> {service?.title || "—"}</div>
          <div><span className="font-medium">Studio:</span> {studio?.name || "—"}</div>
          <div><span className="font-medium">Hình thức thuê:</span> {optionLabel(rentalTypeOptions, rental.rental_type)}</div>
          <div><span className="font-medium">Bắt đầu thuê:</span> {formatScheduleDateTime(rental.rental_start)}</div>
          <div><span className="font-medium">Kết thúc thuê:</span> {formatScheduleDateTime(rental.rental_end)}</div>
          <div className="md:col-span-2"><span className="font-medium">Ghi chú:</span> {rental.notes || "—"}</div>
        </div>
      </div>
    </div>
  );
}

// VIEW CHI TIẾT LỊCH SỬ DỤNG STUDIO
export function StudioUsageFullView({
  currentUser,
  usage,
  studios,
  productions,
  studioRentals,
  serviceItems,
  contracts,
  productionTasks,
  files,
  productionFileLinks,
  serviceItemProductions,
  onEdit,
  onDelete,
  onApprove,
}: {
  currentUser: SessionUser;
  usage: StudioUsageRow;
  studios: StudioView[];
  productions: ProductionRow[];
  studioRentals: StudioRentalRow[];
  serviceItems: ServiceItemRow[];
  contracts: ContractRow[];
  productionTasks: ProductionTaskRow[];
  files: FileRow[];
  productionFileLinks: LinkedFileSeedRow[];
  serviceItemProductions: ServiceItemProductionRow[];
  onEdit?: () => void;
  onDelete?: () => void;
  onApprove?: () => void;
}) {
  const studio = studios.find((item) => item.studio_id === usage.studio_id);

  const production = usage.production_id
    ? productions.find((item) => item.production_id === usage.production_id)
    : null;

  const rental = usage.rental_id
    ? studioRentals.find((item) => item.rental_id === usage.rental_id)
    : null;

  const service = rental
    ? serviceItems.find((item) => item.service_item_id === rental.service_item_id)
    : null;

  const contract = rental
    ? contracts.find((item) => item.contract_id === rental.contract_id)
    : null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>Thông tin chung</DetailSectionTitle>
        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div><span className="font-medium">Studio:</span> {studio?.name || "—"}</div>
          <div><span className="font-medium">Nguồn sử dụng:</span> {usage.production_id ? "Sản xuất" : "Cho thuê"}</div>
          <div><span className="font-medium">Bắt đầu:</span> {formatScheduleDateTime(usage.usage_start)}</div>
          <div><span className="font-medium">Kết thúc:</span> {formatScheduleDateTime(usage.usage_end)}</div>
          <div><span className="font-medium">Người duyệt:</span> {usage.approved_by_name || "—"}</div>
          <div>
            <span className="font-medium">Thời gian duyệt:</span>{" "}
            {usage.approved_at ? formatScheduleDateTime(usage.approved_at) : "—"}
          </div>
          <div><span className="font-medium">Trạng thái:</span> {statusLabel(usage.status)}</div>
          <div><span className="font-medium">Dự án:</span> {production?.name || "—"}</div>
          <div>
            <span className="font-medium">Hợp đồng thuê:</span>{" "}
            {contract ? `${contract.contract_number} • ${contract.title}` : "—"}
          </div>
          <div><span className="font-medium">Mục dịch vụ:</span> {service?.title || "—"}</div>
          <div>
            <span className="font-medium">Chi tiết thuê:</span>{" "}
            {rental
              ? `${getStudioName(studios, rental.studio_id)} • ${rental.rental_start} → ${rental.rental_end}`
              : "—"}
          </div>
          <div className="md:col-span-2"><span className="font-medium">Ghi chú:</span> {usage.notes || "—"}</div>
        </div>
        <div className="flex flex-wrap gap-2 pt-3">
          {onEdit && (
            <Button variant="outline" className="rounded-xl" onClick={onEdit}>
              Chỉnh sửa
            </Button>
          )}

          {onDelete && (
            <Button variant="outline" className="rounded-xl" onClick={onDelete}>
              Xóa
            </Button>
          )}

          {canApprove(currentUser) && usage.status !== "approved" && onApprove && (
            <Button variant="outline" className="rounded-xl" onClick={onApprove}>
              Duyệt
            </Button>
          )}
        </div>
      </div>

      {production && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <DetailSectionTitle>Chi tiết dự án sản xuất</DetailSectionTitle>
          <ProductionFullView
            production={production}
            contracts={contracts}
            serviceItems={serviceItems}
            productionTasks={productionTasks}
            files={files}
            productionFileLinks={productionFileLinks}
            serviceItemProductions={serviceItemProductions}
          />
        </div>
      )}

      {rental && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <DetailSectionTitle>Chi tiết lịch thuê studio</DetailSectionTitle>
          <StudioRentalFullView
            rental={rental}
            studios={studios}
            serviceItems={serviceItems}
            contracts={contracts}
          />
        </div>
      )}
    </div>
  );
}

// VIEW TRANG LỊCH PHÁT SÓNG / LỊCH SỬ DỤNG STUDIO
export function SchedulesPage({
  currentUser,
  schedules,
  studioUsageSchedules,
  contracts,
  serviceItems,
  serviceItemContents,
  contents,
  bookings,
  productions,
  studios,
  studioRentals,
  channels,
  productionTasks,
  files,
  contentFileLinks,
  productionFileLinks,
  serviceItemProductions,
  onSaveBroadcastSchedule,
  onDeleteBroadcastSchedule,
  onApproveBroadcastSchedule,
  onSaveStudioUsage,
  onDeleteStudioUsage,
  onApproveStudioUsage,
}: {
  currentUser: SessionUser;
  schedules: BroadcastScheduleRow[];
  studioUsageSchedules: StudioUsageRow[];
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  serviceItemContents: ServiceItemContentRow[];
  contents: ContentRow[];
  bookings: BookingRow[];
  productions: ProductionRow[];
  studios: StudioView[];
  studioRentals: StudioRentalRow[];
  channels: ChannelView[];
  productionTasks: ProductionTaskRow[];
  files: FileRow[];
  contentFileLinks: LinkedFileSeedRow[];
  productionFileLinks: LinkedFileSeedRow[];
  serviceItemProductions: ServiceItemProductionRow[];
  onSaveBroadcastSchedule: (row: BroadcastScheduleRow) => Promise<boolean>;
  onDeleteBroadcastSchedule: (broadcastId: string) => void;
  onApproveBroadcastSchedule: (broadcastId: string, currentUser: SessionUser) => void;
  onSaveStudioUsage: (row: StudioUsageRow) => Promise<boolean>;
  onDeleteStudioUsage: (usageScheduleId: string) => void;
  onApproveStudioUsage: (usageScheduleId: string, currentUser: SessionUser) => void;
}) {
  const [tab, setTab] = useState<ScheduleTab>("broadcast");
  const [calendarView, setCalendarView] = useState<"day" | "week" | "month">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [search, setSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("all");
  const [studioFilter, setStudioFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedBroadcastId, setSelectedBroadcastId] = useState<string | null>(null);
  const [selectedStudioUsageId, setSelectedStudioUsageId] = useState<string | null>(null);

  const [broadcastFormOpen, setBroadcastFormOpen] = useState(false);
  const [broadcastFormMode, setBroadcastFormMode] = useState<"create" | "edit">("create");

  const [studioFormOpen, setStudioFormOpen] = useState(false);
  const [studioFormMode, setStudioFormMode] = useState<"create" | "edit">("create");

  const [detailOpen, setDetailOpen] = useState(false);

 
  const filteredBroadcastRows = useMemo(() => {
    return schedules
      .filter((item) => {
        const joined = [
          item.program_name || "",
          item.content_title || "",
          item.contract_number || "",
          item.channel_code || "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          joined.includes(search.toLowerCase()) &&
          (channelFilter === "all" ? true : item.channel_code === channelFilter) &&
          (statusFilter === "all" ? true : item.status === statusFilter)
        );
      })
      .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
  }, [schedules, search, channelFilter, statusFilter]);


  const filteredStudioRows = useMemo(() => {
    return studioUsageSchedules
      .filter((item) => {
        const studioName =
          studios.find((s) => s.studio_id === item.studio_id)?.name || "";

        const joined = [
          studioName,
          item.notes || "",
        ]
          .join(" ")
          .toLowerCase();

        return (
          joined.includes(search.toLowerCase()) &&
          (studioFilter === "all" ? true : item.studio_id === studioFilter) &&
          (statusFilter === "all" ? true : item.status === statusFilter)
        );
      })
      .sort((a, b) => a.usage_start.localeCompare(b.usage_start));
  }, [studioUsageSchedules, studios, search, studioFilter, statusFilter]);

  const handleNavigate = (direction: -1 | 1) => {
    const next = new Date(currentDate);

    if (calendarView === "day") {
      next.setDate(next.getDate() + direction);
    } else if (calendarView === "week") {
      next.setDate(next.getDate() + direction * 7);
    } else {
      next.setMonth(next.getMonth() + direction);
    }

    setCurrentDate(next);
  };

  const selectedBroadcast =
    schedules.find((item) => item.broadcast_id === selectedBroadcastId) || null;

  const selectedStudioUsage =
    studioUsageSchedules.find((item) => item.usage_schedule_id === selectedStudioUsageId) || null;

  const handleEditBroadcast = () => {
    if (!selectedBroadcast) return;
    setDetailOpen(false);
    setBroadcastFormMode("edit");
    setBroadcastFormOpen(true);
  };

  const handleEditStudioUsage = () => {
    if (!selectedStudioUsage) return;
    setDetailOpen(false);
    setStudioFormMode("edit");
    setStudioFormOpen(true);
  };

  const handleDeleteBroadcast = () => {
    if (!selectedBroadcast) return;
    const ok = window.confirm(
      `Xóa lịch "${selectedBroadcast.program_name || selectedBroadcast.content_title || "này"}"?`
    );
    if (!ok) return;

    onDeleteBroadcastSchedule(selectedBroadcast.broadcast_id);
    setDetailOpen(false);
    setSelectedBroadcastId(null);
  };

  const handleDeleteStudioUsage = () => {
    if (!selectedStudioUsage) return;
    const ok = window.confirm(
      `Xóa lịch studio "${getStudioName(studios, selectedStudioUsage.studio_id)}"?`
    );
    if (!ok) return;

    onDeleteStudioUsage(selectedStudioUsage.usage_schedule_id);
    setDetailOpen(false);
    setSelectedStudioUsageId(null);
  };

  const handleApproveBroadcast = () => {
    if (!selectedBroadcast) return;

    onApproveBroadcastSchedule(selectedBroadcast.broadcast_id, currentUser);
    setDetailOpen(false);
  };

  const handleApproveStudioUsage = () => {
    if (!selectedStudioUsage) return;

    onApproveStudioUsage(selectedStudioUsage.usage_schedule_id, currentUser);
    setDetailOpen(false);
  };

  const canEditSelectedBroadcast =
    selectedBroadcast
      ? canEditOwnOperationalRecord({
          user: currentUser,
          createdByName: selectedBroadcast.created_by_name,
          status: selectedBroadcast.status,
        })
      : false;

  const canDeleteSelectedBroadcast =
    selectedBroadcast
      ? canDeleteOwnOperationalRecord({
          user: currentUser,
          createdByName: selectedBroadcast.created_by_name,
          status: selectedBroadcast.status,
        })
      : false;

  const canApproveSelectedBroadcast =
    !!selectedBroadcast &&
    canApprove(currentUser) &&
    selectedBroadcast.status !== "approved";

  const canEditSelectedStudioUsage =
    selectedStudioUsage
      ? canEditOwnOperationalRecord({
          user: currentUser,
          createdByName: selectedStudioUsage.created_by_name,
          status: selectedStudioUsage.status,
        })
      : false;

  const canDeleteSelectedStudioUsage =
    selectedStudioUsage
      ? canDeleteOwnOperationalRecord({
          user: currentUser,
          createdByName: selectedStudioUsage.created_by_name,
          status: selectedStudioUsage.status,
        })
      : false;

  const canApproveSelectedStudioUsage =
    !!selectedStudioUsage &&
    canApprove(currentUser) &&
    selectedStudioUsage.status !== "approved";


  return (
    <div>
      <SectionHeader
        title="Lên lịch"
        actions={
          canCreateOperationalRecord(currentUser) ? (
            tab === "broadcast" ? (
              <PrimaryButton
                onClick={() => {
                  setSelectedBroadcastId(null);
                  setBroadcastFormMode("create");
                  setBroadcastFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm lịch phát sóng / phát hành
              </PrimaryButton>
            ) : (
              <PrimaryButton
                onClick={() => {
                  setSelectedStudioUsageId(null);
                  setStudioFormMode("create");
                  setStudioFormOpen(true);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm lịch sử dụng studio
              </PrimaryButton>
            )
          ) : null
        }
      />

      <Tabs value={tab} onValueChange={(value) => setTab(value as ScheduleTab)}>
        <TabsList className="mb-4 grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="broadcast">Phát sóng / phát hành</TabsTrigger>
          <TabsTrigger value="studio_usage">Sử dụng studio</TabsTrigger>
        </TabsList>

        <Card className="rounded-[24px] border border-orange-100 bg-white shadow-sm">
          <CardContent className="p-5">
              <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex flex-1 flex-col gap-3 md:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Tìm theo chương trình, content..."
                      className="pl-9"
                    />
                  </div>

                  {tab === "broadcast" && (
                    <Select value={channelFilter} onValueChange={setChannelFilter}>
                      <SelectTrigger className="w-full rounded-2xl md:w-56">
                        <SelectValue placeholder="Kênh" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả kênh</SelectItem>
                        {channels.map((item) => (
                          <SelectItem key={item.channel_id} value={item.code}>
                            {item.code} • {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {tab === "studio_usage" && (
                    <Select value={studioFilter} onValueChange={setStudioFilter}>
                      <SelectTrigger className="w-full rounded-2xl md:w-56">
                        <SelectValue placeholder="Studio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tất cả studio</SelectItem>
                        {studios.map((item) => (
                          <SelectItem key={item.studio_id} value={item.studio_id}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full rounded-2xl md:w-52">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả trạng thái</SelectItem>
                      {scheduleStatusOptions.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="rounded-2xl" onClick={() => handleNavigate(-1)}>
                      ◀ Trước
                    </Button>
                    <Button variant="outline" className="rounded-2xl" onClick={() => setCurrentDate(new Date())}>
                      Hôm nay
                    </Button>
                    <Button variant="outline" className="rounded-2xl" onClick={() => handleNavigate(1)}>
                      Sau ▶
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={calendarView === "day" ? "default" : "outline"}
                      className="rounded-xl"
                      onClick={() => setCalendarView("day")}
                    >
                      Ngày
                    </Button>
                    <Button
                      variant={calendarView === "week" ? "default" : "outline"}
                      className="rounded-xl"
                      onClick={() => setCalendarView("week")}
                    >
                      Tuần
                    </Button>
                    <Button
                      variant={calendarView === "month" ? "default" : "outline"}
                      className="rounded-xl"
                      onClick={() => setCalendarView("month")}
                    >
                      Tháng
                    </Button>
                  </div>
                </div>
              </div>

              {tab === "broadcast" ? (
                <BroadcastCalendarPanel
                  rows={filteredBroadcastRows}
                  currentDate={currentDate}
                  calendarView={calendarView}
                  onPick={(id) => {
                    setSelectedBroadcastId(id);
                    setDetailOpen(true);
                  }}
                />
              ) : (
                <StudioUsageCalendarPanel
                  rows={filteredStudioRows}
                  studios={studios}
                  currentDate={currentDate}
                  calendarView={calendarView}
                  onPick={(id) => {
                    setSelectedStudioUsageId(id);
                    setDetailOpen(true);
                  }}
                />
              )}
          </CardContent>
        </Card>
      </Tabs>

      <DetailDrawer
        title={
          tab === "broadcast"
            ? selectedBroadcast
              ? `Chi tiết lịch phát / phát hành • ${selectedBroadcast.program_name || selectedBroadcast.content_title || "—"}`
              : "Chi tiết lịch phát / phát hành"
            : selectedStudioUsage
            ? `Chi tiết lịch studio • ${getStudioName(studios, selectedStudioUsage.studio_id)}`
            : "Chi tiết lịch studio"
        }
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {tab === "broadcast" && selectedBroadcast ? (
          <ScheduleFullView
            currentUser={currentUser}
            schedule={selectedBroadcast}
            bookings={bookings}
            contents={contents}
            serviceItems={serviceItems}
            serviceItemContents={serviceItemContents}
            contracts={contracts}
            channels={channels}
            files={files}
            contentFileLinks={contentFileLinks}
            onEdit={canEditSelectedBroadcast ? handleEditBroadcast : undefined}
            onDelete={canDeleteSelectedBroadcast ? handleDeleteBroadcast : undefined}
            onApprove={canApproveSelectedBroadcast ? handleApproveBroadcast : undefined}
          />
        ) : null}

        {tab === "studio_usage" && selectedStudioUsage ? (
          <StudioUsageFullView
            currentUser={currentUser}
            usage={selectedStudioUsage}
            studios={studios}
            productions={productions}
            studioRentals={studioRentals}
            serviceItems={serviceItems}
            contracts={contracts}
            productionTasks={productionTasks}
            serviceItemProductions={serviceItemProductions}
            files={files}
            productionFileLinks={productionFileLinks}
            onEdit={canEditSelectedStudioUsage ? handleEditStudioUsage : undefined}
            onDelete={canDeleteSelectedStudioUsage ? handleDeleteStudioUsage : undefined}
            onApprove={canApproveSelectedStudioUsage ? handleApproveStudioUsage : undefined}
          />
        ) : null}
      </DetailDrawer>

      <BroadcastScheduleFormDialog
        open={broadcastFormOpen}
        onOpenChange={setBroadcastFormOpen}
        mode={broadcastFormMode}
        initialSchedule={selectedBroadcast}
        contracts={contracts}
        serviceItems={serviceItems}
        bookings={bookings}
        contents={contents}
        channels={channels}
        currentUser={currentUser}
        onSave={onSaveBroadcastSchedule}
      />

      <StudioUsageFormDialog
        open={studioFormOpen}
        onOpenChange={setStudioFormOpen}
        mode={studioFormMode}
        initialUsage={selectedStudioUsage}
        productions={productions}
        studioRentals={studioRentals}
        contracts={contracts}
        serviceItems={serviceItems}
        studios={studios}
        currentUser={currentUser}
        onSave={onSaveStudioUsage}
      />
    </div>
  );
}
