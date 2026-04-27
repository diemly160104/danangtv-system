import React, { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import type {
  ContractType,
  ContractStatus,
  ServiceType,
  PaymentMethod,
  InvoiceStatus,
  SessionUser,
  PartyView,
  ChannelView,
  FileRow,
  StudioView,
  ContractRow,
  ServiceItemRow,
  BookingRow,
  PaymentScheduleRow,
  PaymentRow,
  InvoiceRow,
  ProductionTaskRow,
  ProductionRow,
  ContentRow,
  DraftServiceItem,
  DraftPaymentSchedule,
  ContractFormDialogProps,
  DraftLinkedFile,
  LinkedFileSeedRow,
  ContractSavePayload,
  InvoiceSavePayload,
  PaymentSavePayload,
  ServiceItemContentRow,
  ServiceItemProductionRow,
} from "@/features/danangtv/types";

import {
  buildDraftContractFiles,
  buildDraftContentFiles,
  buildDraftServiceItems,
  buildDraftPaymentSchedules,
  createDefaultBookingByServiceType,
  getChannelsByServiceType,
  createEmptyServiceItem,
  createEmptyPaymentSchedule,
  getStudioName,
  getChannelCode,
} from "@/features/danangtv/selectors";

import {
  contractTypeOptions,
  contractStatusOptions,
  serviceTypeOptions,
  serviceStatusOptions,
  paymentScheduleStatusOptions,
  paymentMethodOptions,
  contentTypeOptions,
  printedContentTypeOptions,
  printedAreaOptions,
  printedColorOptions,
  electronicSubtypeOptions,
  electronicContentTypeOptions,
  electronicFormOptions,
  bannerPositionOptions,
  tvBroadcastTypeOptions,
  insertTypeOptions,
  tvProgramOptions,
  timePointOptions,
  radioContentTypeOptions,
  radioProgramOptions,
  digitalContentTypeOptions,
  rentalTypeOptions,
} from "@/features/danangtv/options";

import {
  StatusBadge,
  PrimaryButton,
  TruncatedHoverText,
  FilesPanel,
  LinkedFilesViewer,
  SuggestionList,
  FormSection,
  SectionHeader,
  DetailSectionTitle,
  DetailDrawer,
  FieldBlock,
  EnumSelect,
  normalizeMin1,
  normalizeMin0,
  ActionDropdown,
} from "@/features/danangtv/shared/commonComponents";
import {
  canCreateOperationalRecord,
  canDeleteOwnOperationalRecord,
  canEditOwnOperationalRecord,
  statusLabel,
  formatCurrency,
  formatDisplayDate,
  formatScheduleDateTime,
  getChannelDisplayName,
  isBlank,
  optionLabel,
  serviceTypeLabel,
  toDateInputValue,
  validateLinkedFilesBySchema,
} from "@/features/danangtv/utils/Helpers";

import { LinkedFilesEditor } from "@/features/danangtv/shared/LinkedFilesEditor";
import { ImportEntityPanel } from "@/features/danangtv/shared/ImportEntityPanel";
import { ProductionFullView } from "@/features/danangtv/modules/productions";


// HÀM LẤY GIÁ TRỊ NGÀY THÁNG CHO BOOKING THEO LOẠI DỊCH VỤ
export function getBookingDateValues(serviceType: ServiceType, booking: any) {
  if (serviceType === "studio_rental") {
    return {
      start_date: toDateInputValue(booking.rental_start),
      end_date: toDateInputValue(booking.rental_end),
      time_slot: "",
    };
  }

  if (serviceType === "tv_ad" || serviceType === "radio_ad") {
    return {
      start_date: toDateInputValue(booking.start_date),
      end_date: toDateInputValue(booking.end_date),
      time_slot:
        booking.start_time && booking.end_time
          ? `${booking.start_time} - ${booking.end_time}`
          : "",
    };
  }

  if (serviceType === "content_production") {
    return {
      start_date: "",
      end_date: toDateInputValue(booking.delivery_deadline),
      time_slot: "",
    };
  }

  return {
    start_date: toDateInputValue(booking.start_date || booking.post_date),
    end_date: toDateInputValue(booking.end_date),
    time_slot: "",
  };
}

// HÀM XÂY DỰNG DỮ LIỆU CHI TIẾT CHO BOOKING THEO LOẠI DỊCH VỤ
export function buildBookingDetailData(
  serviceType: ServiceType,
  booking: any,
  channels: ChannelView[],
  studios: StudioView[]
) {
  if (serviceType === "printed_ad") {
    return {
      channel_code: getChannelCode(channels, booking.channel_id),
      content_type: booking.content_type,
      area: booking.area,
      color: booking.color,
      start_date: booking.start_date || "",
      end_date: booking.end_date || "",
      num_issues: booking.num_issues || "",
      notes: booking.notes || "",
    };
  }

  if (serviceType === "electronic_ad") {
    return {
      channel_code: getChannelCode(channels, booking.channel_id),
      subtype: booking.subtype,
      content_type: booking.content_type,
      form: booking.form,
      position: booking.position,
      quantity: booking.quantity || "",
      has_video: !!booking.has_video,
      has_link: !!booking.has_link,
      start_date: booking.start_date || "",
      end_date: booking.end_date || "",
      notes: booking.notes || "",
    };
  }

  if (serviceType === "tv_ad") {
    return {
      channel_code: getChannelCode(channels, booking.channel_id),
      broadcast_type: booking.broadcast_type,
      insert_type: booking.insert_type,
      program: booking.program,
      time_point: booking.time_point,
      start_time: booking.start_time || "",
      end_time: booking.end_time || "",
      start_date: booking.start_date || "",
      end_date: booking.end_date || "",
      num_broadcasts: booking.num_broadcasts || "",
      notes: booking.notes || "",
    };
  }

  if (serviceType === "radio_ad") {
    return {
      channel_code: getChannelCode(channels, booking.channel_id),
      content_type: booking.content_type,
      program: booking.program,
      time_point: booking.time_point,
      start_time: booking.start_time || "",
      end_time: booking.end_time || "",
      start_date: booking.start_date || "",
      end_date: booking.end_date || "",
      num_broadcasts: booking.num_broadcasts || "",
      notes: booking.notes || "",
    };
  }

  if (serviceType === "digital_ad") {
    return {
      channel_code: getChannelCode(channels, booking.channel_id),
      content_type: booking.content_type,
      post_date: booking.post_date || "",
      start_date: booking.start_date || "",
      end_date: booking.end_date || "",
      quantity: booking.quantity || "",
      has_experiencer: !!booking.has_experiencer,
      notes: booking.notes || "",
    };
  }

  if (serviceType === "studio_rental") {
    return {
      studio_name: getStudioName(studios, booking.studio_id),
      rental_type: booking.rental_type,
      rental_start: booking.rental_start || "",
      rental_end: booking.rental_end || "",
      notes: booking.notes || "",
    };
  }

  if (serviceType === "content_production") {
    return {
      content_type: booking.content_type,
      requirement_description: booking.requirement_description || "",
      delivery_deadline: booking.delivery_deadline || "",
      notes: booking.notes || "",
    };
  }

  return {
    description: booking.description || "",
    start_date: booking.start_date || "",
    end_date: booking.end_date || "",
    notes: booking.notes || "",
  };
}

// HÀM HIỂN THỊ CHI TIẾT BOOKING THEO LOẠI DỊCH VỤ
function renderContractBookingDetail(
  booking: BookingRow,
  channels: ChannelView[]
) {
  const detail = booking.detail_data || {};
  const channelName = getChannelDisplayName(channels, {
    channelCode: detail.channel_code || booking.channel_code,
  });

  if (booking.service_type === "printed_ad") {
    return (
      <div className="space-y-1 text-sm text-slate-700">
        <div><span className="font-medium">Kênh:</span> {channelName}</div>
        <div><span className="font-medium">Loại nội dung:</span> {optionLabel(printedContentTypeOptions, detail.content_type)}</div>
        <div><span className="font-medium">Diện tích:</span> {optionLabel(printedAreaOptions, detail.area)}</div>
        <div><span className="font-medium">Màu:</span> {optionLabel(printedColorOptions, detail.color)}</div>
        <div><span className="font-medium">Thời gian:</span>{" "}{formatDisplayDate(detail.start_date || booking.start_date)} → {formatDisplayDate(detail.end_date || booking.end_date)}</div>
        <div><span className="font-medium">Số kỳ:</span> {detail.num_issues || "—"}</div>
        <div><span className="font-medium">Ghi chú:</span> {detail.notes || booking.notes || "—"}</div>
      </div>
    );
  }

  if (booking.service_type === "electronic_ad") {
    return (
      <div className="space-y-1 text-sm text-slate-700">
        <div><span className="font-medium">Kênh:</span> {channelName}</div>
        <div><span className="font-medium">Loại hình:</span> {optionLabel(electronicSubtypeOptions, detail.subtype)}</div>
        <div><span className="font-medium">Loại nội dung:</span> {detail.subtype === "banner" ? "Banner" : optionLabel(electronicContentTypeOptions, detail.content_type)}</div>
        <div><span className="font-medium">Hình thức:</span> {detail.form ? optionLabel(electronicFormOptions, detail.form) : "—"}</div>
        <div><span className="font-medium">Vị trí:</span> {detail.position ? optionLabel(bannerPositionOptions, detail.position) : "—"}</div>
        <div><span className="font-medium">Số lượng:</span> {detail.quantity || "—"}</div>
        <div><span className="font-medium">Video / Link:</span> {detail.has_video ? "Có video" : "Không video"} • {detail.has_link ? "Có link" : "Không link"}</div>
        <div><span className="font-medium">Thời gian:</span>{" "}{formatDisplayDate(detail.start_date || booking.start_date)} → {formatDisplayDate(detail.end_date || booking.end_date)}</div>
        <div><span className="font-medium">Ghi chú:</span> {detail.notes || booking.notes || "—"}</div>
      </div>
    );
  }

  if (booking.service_type === "tv_ad") {
    return (
      <div className="space-y-1 text-sm text-slate-700">
        <div><span className="font-medium">Kênh:</span> {channelName}</div>
        <div><span className="font-medium">Hình thức:</span> {optionLabel(tvBroadcastTypeOptions, detail.broadcast_type)}</div>
        <div><span className="font-medium">Insert:</span> {detail.insert_type ? optionLabel(insertTypeOptions, detail.insert_type) : "—"}</div>
        <div><span className="font-medium">Chương trình:</span> {optionLabel(tvProgramOptions, detail.program)}</div>
        <div><span className="font-medium">Thời điểm:</span> {optionLabel(timePointOptions, detail.time_point)}</div>
        <div><span className="font-medium">Giờ:</span> {(detail.start_time || "").trim() || "—"} → {(detail.end_time || "").trim() || "—"}</div>
        <div><span className="font-medium">Ngày:</span>{" "}{formatDisplayDate(detail.start_date || booking.start_date)} → {formatDisplayDate(detail.end_date || booking.end_date)}</div>
        <div><span className="font-medium">Số lần phát:</span> {detail.num_broadcasts || "—"}</div>
        <div><span className="font-medium">Ghi chú:</span> {detail.notes || booking.notes || "—"}</div>
      </div>
    );
  }

  if (booking.service_type === "radio_ad") {
    return (
      <div className="space-y-1 text-sm text-slate-700">
        <div><span className="font-medium">Kênh:</span> {channelName}</div>
        <div><span className="font-medium">Loại nội dung:</span> {optionLabel(radioContentTypeOptions, detail.content_type)}</div>
        <div><span className="font-medium">Chương trình:</span> {optionLabel(radioProgramOptions, detail.program)}</div>
        <div><span className="font-medium">Thời điểm:</span> {optionLabel(timePointOptions, detail.time_point)}</div>
        <div><span className="font-medium">Giờ:</span> {(detail.start_time || "").trim() || "—"} → {(detail.end_time || "").trim() || "—"}</div>
        <div><span className="font-medium">Ngày:</span>{" "}{formatDisplayDate(detail.start_date || booking.start_date)} → {formatDisplayDate(detail.end_date || booking.end_date)}</div>
        <div><span className="font-medium">Số lần phát:</span> {detail.num_broadcasts || "—"}</div>
        <div><span className="font-medium">Ghi chú:</span> {detail.notes || booking.notes || "—"}</div>
      </div>
    );
  }

  if (booking.service_type === "digital_ad") {
    return (
      <div className="space-y-1 text-sm text-slate-700">
        <div><span className="font-medium">Kênh:</span> {channelName}</div>
        <div><span className="font-medium">Loại nội dung:</span> {optionLabel(digitalContentTypeOptions, detail.content_type)}</div>
        <div><span className="font-medium">Ngày đăng:</span> {formatDisplayDate(detail.post_date)}</div>
        <div><span className="font-medium">Thời gian:</span>{" "}{formatDisplayDate(detail.start_date || booking.start_date)} → {formatDisplayDate(detail.end_date || booking.end_date)}</div>
        <div><span className="font-medium">Số lượng:</span> {detail.quantity || "—"}</div>
        <div><span className="font-medium">KOL / experiencer:</span> {detail.has_experiencer ? "Có" : "Không"}</div>
        <div><span className="font-medium">Ghi chú:</span> {detail.notes || booking.notes || "—"}</div>
      </div>
    );
  }

  if (booking.service_type === "studio_rental") {
    return (
      <div className="space-y-1 text-sm text-slate-700">
        <div><span className="font-medium">Studio:</span> {detail.studio_name || "—"}</div>
        <div><span className="font-medium">Hình thức thuê:</span> {optionLabel(rentalTypeOptions, detail.rental_type)}</div>
        <div><span className="font-medium">Thời gian thuê:</span>{" "}{formatScheduleDateTime(detail.rental_start)} → {formatScheduleDateTime(detail.rental_end)}</div>
        <div><span className="font-medium">Ghi chú:</span> {detail.notes || booking.notes || "—"}</div>
      </div>
    );
  }

  if (booking.service_type === "content_production") {
    return (
      <div className="space-y-1 text-sm text-slate-700">
        <div><span className="font-medium">Loại nội dung:</span> {optionLabel(contentTypeOptions, detail.content_type)}</div>
        <div><span className="font-medium">Yêu cầu:</span> {detail.requirement_description || "—"}</div>
        <div><span className="font-medium">Hạn bàn giao:</span>{" "}{formatDisplayDate(detail.delivery_deadline || booking.end_date)}</div>
        <div><span className="font-medium">Ghi chú:</span> {detail.notes || booking.notes || "—"}</div>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-sm text-slate-700">
      <div><span className="font-medium">Mô tả:</span> {booking.description || "—"}</div>
      <div><span className="font-medium">Thời gian:</span>{" "}{formatDisplayDate(booking.start_date)} → {formatDisplayDate(booking.end_date)}</div>
      <div><span className="font-medium">Khung giờ:</span> {booking.time_slot || "—"}</div>
      <div><span className="font-medium">Ghi chú:</span> {booking.notes || "—"}</div>
    </div>
  );
}

// HÀM HIỂN THỊ TÓM TẮT BOOKING THEO LOẠI DỊCH VỤ
export function renderBookingSummary(
  serviceType: ServiceType,
  booking: any,
  channels: ChannelView[],
  studios: StudioView[]
) {
  const channelName = getChannelDisplayName(channels, {
    channelId: booking.channel_id,
    channelCode: booking.channel_code,
  });

  if (serviceType === "printed_ad") {
    return `${channelName} • ${optionLabel(printedContentTypeOptions, booking.content_type)} • ${optionLabel(printedAreaOptions, booking.area)} • ${booking.num_issues || 0} kỳ`;
  }
  if (serviceType === "electronic_ad") {
    return `${channelName} • ${optionLabel(electronicSubtypeOptions, booking.subtype)} • ${optionLabel(electronicContentTypeOptions, booking.content_type)}`;
  }
  if (serviceType === "tv_ad") {
    return `${channelName} • ${optionLabel(tvBroadcastTypeOptions, booking.broadcast_type)} • ${optionLabel(tvProgramOptions, booking.program)}`;
  }
  if (serviceType === "radio_ad") {
    return `${channelName} • ${optionLabel(radioContentTypeOptions, booking.content_type)} • ${optionLabel(radioProgramOptions, booking.program)}`;
  }
  if (serviceType === "digital_ad") {
    return `${channelName} • ${optionLabel(digitalContentTypeOptions, booking.content_type)} • ${booking.quantity || 0} lần`;
  }
  if (serviceType === "studio_rental") {
    return `${getStudioName(studios, booking.studio_id)} • ${optionLabel(rentalTypeOptions, booking.rental_type)} • ${booking.rental_start || ""}`;
  }
  if (serviceType === "content_production") {
    return `${optionLabel(contentTypeOptions, booking.content_type)} • deadline ${booking.delivery_deadline || "—"}`;
  }
  return booking.description || "Booking khác";
}

// HÀM KIỂM TRA THÔNG TIN BẮT BUỘC CỦA BOOKING THEO LOẠI DỊCH VỤ
function validateBookingByServiceType(
  serviceType: ServiceType,
  booking: any,
  serviceIndex: number,
  bookingIndex: number
) {
  const prefix = `Mục dịch vụ ${serviceIndex + 1}, booking ${bookingIndex + 1}`;

  if (serviceType === "printed_ad") {
    if (isBlank(booking.channel_id)) return `${prefix}: chưa chọn kênh báo in.`;
    if (isBlank(booking.content_type)) return `${prefix}: chưa chọn loại nội dung báo in.`;
    if (isBlank(booking.area)) return `${prefix}: chưa chọn diện tích.`;
    if (isBlank(booking.color)) return `${prefix}: chưa chọn màu sắc.`;
    if (isBlank(booking.num_issues)) return `${prefix}: chưa nhập số kỳ.`;
    return null;
  }

  if (serviceType === "electronic_ad") {
    if (isBlank(booking.channel_id)) return `${prefix}: chưa chọn kênh báo điện tử.`;
    if (isBlank(booking.subtype)) return `${prefix}: chưa chọn loại hình báo điện tử.`;
    return null;
  }

  if (serviceType === "tv_ad") {
    if (isBlank(booking.channel_id)) return `${prefix}: chưa chọn kênh truyền hình.`;
    if (isBlank(booking.broadcast_type)) return `${prefix}: chưa chọn hình thức phát sóng.`;
    return null;
  }

  if (serviceType === "radio_ad") {
    if (isBlank(booking.channel_id)) return `${prefix}: chưa chọn kênh phát thanh.`;
    if (isBlank(booking.content_type)) return `${prefix}: chưa chọn loại nội dung phát thanh.`;
    return null;
  }

  if (serviceType === "digital_ad") {
    if (isBlank(booking.channel_id)) return `${prefix}: chưa chọn kênh digital.`;
    if (isBlank(booking.content_type)) return `${prefix}: chưa chọn loại nội dung digital.`;
    return null;
  }

  if (serviceType === "studio_rental") {
    if (isBlank(booking.studio_id)) return `${prefix}: chưa chọn studio.`;
    if (isBlank(booking.rental_type)) return `${prefix}: chưa chọn hình thức thuê.`;
    if (isBlank(booking.rental_start)) return `${prefix}: chưa nhập thời gian bắt đầu thuê.`;
    if (isBlank(booking.rental_end)) return `${prefix}: chưa nhập thời gian kết thúc thuê.`;
    return null;
  }

  if (serviceType === "content_production") {
    return null;
  }

  return null;
}

// HÀM KIỂM TRA TRƯỚC KHI LƯU HỢP ĐỒNG
function validateContractBeforeSave(args: {
  contractNumber: string;
  partyId: string;
  contractType: ContractType;
  signedDate: string;
  startDate: string;
  contractValue: string;
  totalValue: string;
  status: ContractStatus;
  serviceItems: DraftServiceItem[];
  paymentSchedules: DraftPaymentSchedule[];
  linkedFiles: DraftLinkedFile[];
}) {
  if (isBlank(args.partyId)) return "Vui lòng chọn đối tác / khách hàng.";
  if (isBlank(args.contractNumber)) return "Vui lòng nhập số hợp đồng.";
  if (isBlank(args.contractType)) return "Vui lòng chọn loại hợp đồng.";
  if (isBlank(args.signedDate)) return "Vui lòng nhập ngày ký.";
  if (isBlank(args.startDate)) return "Vui lòng nhập ngày bắt đầu.";
  if (isBlank(args.contractValue)) return "Vui lòng nhập giá trị hợp đồng.";
  if (Number(args.contractValue || 0) < 1) return "Giá trị hợp đồng phải lớn hơn hoặc bằng 1.";
  if (isBlank(args.totalValue)) return "Vui lòng nhập tổng giá trị.";
  if (Number(args.totalValue || 0) < 1) return "Tổng giá trị phải lớn hơn hoặc bằng 1.";
  if (isBlank(args.status)) return "Vui lòng chọn trạng thái hợp đồng.";

  const contractFileError = validateLinkedFilesBySchema(args.linkedFiles, {
    entityLabel: "Hợp đồng",
    requireRole: true,
  });
  if (contractFileError) return contractFileError;

  if (args.contractType === "service") {
    if (args.serviceItems.length === 0) {
      return "Hợp đồng dịch vụ phải có ít nhất 1 mục dịch vụ.";
    }

    for (let i = 0; i < args.serviceItems.length; i++) {
      const item = args.serviceItems[i];

      if (isBlank(item.title)) return `Mục dịch vụ ${i + 1}: chưa nhập tiêu đề.`;
      if (isBlank(item.service_type)) return `Mục dịch vụ ${i + 1}: chưa chọn loại dịch vụ.`;
      if (isBlank(item.cost)) return `Mục dịch vụ ${i + 1}: chưa nhập giá trị.`;
      if (Number(item.cost || 0) < 1) return `Mục dịch vụ ${i + 1}: giá trị phải lớn hơn hoặc bằng 1.`;
      if (isBlank(item.status)) return `Mục dịch vụ ${i + 1}: chưa chọn trạng thái.`;

      if (!item.bookings || item.bookings.length === 0) {
        return `Mục dịch vụ ${i + 1} phải có ít nhất 1 booking.`;
      }

      for (let j = 0; j < item.bookings.length; j++) {
        const bookingError = validateBookingByServiceType(
          item.service_type,
          item.bookings[j],
          i,
          j
        );
        if (bookingError) return bookingError;
      }
    }
  }

  for (let i = 0; i < args.paymentSchedules.length; i++) {
    const row = args.paymentSchedules[i];

    if (isBlank(row.installment_no)) return `Lịch thanh toán ${i + 1}: thiếu số đợt.`;
    if (isBlank(row.due_date)) return `Lịch thanh toán ${i + 1}: thiếu hạn thanh toán.`;
    if (isBlank(row.planned_amount)) return `Lịch thanh toán ${i + 1}: thiếu số tiền kế hoạch.`;
    if (Number(row.planned_amount || 0) < 1) {
      return `Lịch thanh toán ${i + 1}: số tiền kế hoạch phải lớn hơn hoặc bằng 1.`;
    }
    if (isBlank(row.status)) return `Lịch thanh toán ${i + 1}: thiếu trạng thái.`;
  }

  return null;
}


function fieldValue<T extends Record<string, any>>(obj: T, key: keyof T) {
  return String(obj[key] ?? "");
}

// FORM NHẬP LIỆU BOOKING THEO LOẠI DỊCH VỤ
function BookingEditor({
  serviceType,
  booking,
  onChange,
  onRemove,
  channels,
  studios,
}: {
  serviceType: ServiceType;
  booking: any;
  onChange: (key: string, value: any) => void;
  onRemove: () => void;
  channels: ChannelView[];
  studios: StudioView[];
}) {
  const channelOptions = getChannelsByServiceType(channels, serviceType);

  if (serviceType === "printed_ad") {
    return (
      <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Booking báo in</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldBlock label="Kênh"><EnumSelect value={booking.channel_id} onChange={(v) => onChange("channel_id", v)} options={channelOptions.map((item) => ({ value: item.channel_id, label: `${item.code} • ${item.name}` }))} /></FieldBlock>
          <FieldBlock label="Loại nội dung"><EnumSelect value={booking.content_type} onChange={(v) => onChange("content_type", v)} options={printedContentTypeOptions} /></FieldBlock>
          <FieldBlock label="Diện tích"><EnumSelect value={booking.area} onChange={(v) => onChange("area", v)} options={printedAreaOptions} /></FieldBlock>
          <FieldBlock label="Màu sắc"><EnumSelect value={booking.color} onChange={(v) => onChange("color", v)} options={printedColorOptions} /></FieldBlock>
          <FieldBlock label="Ngày bắt đầu"><Input type="date" value={fieldValue(booking, "start_date")} onChange={(e) => onChange("start_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày kết thúc"><Input type="date" value={fieldValue(booking, "end_date")} onChange={(e) => onChange("end_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Số kỳ"><Input type="number" min={1} value={fieldValue(booking, "num_issues")} onChange={(e) => onChange("num_issues", e.target.value)} onBlur={(e) => onChange("num_issues", normalizeMin1(e.target.value))} /></FieldBlock>
          <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
        </div>
      </div>
    );
  }

  if (serviceType === "electronic_ad") {
    const isBanner = booking.subtype === "banner";
    const isArticle = booking.subtype === "article";
    return (
      <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Booking báo điện tử</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldBlock label="Kênh"><EnumSelect value={booking.channel_id} onChange={(v) => onChange("channel_id", v)} options={channelOptions.map((item) => ({ value: item.channel_id, label: `${item.code} • ${item.name}` }))} /></FieldBlock>
          <FieldBlock label="Loại hình"><EnumSelect value={booking.subtype} onChange={(v) => onChange("subtype", v)} options={electronicSubtypeOptions} /></FieldBlock>
          {!isBanner && (<FieldBlock label="Loại nội dung"><EnumSelect value={booking.content_type} onChange={(v) => onChange("content_type", v)} options={electronicContentTypeOptions} /></FieldBlock>)}
          {isArticle && <FieldBlock label="Hình thức"><EnumSelect value={booking.form} onChange={(v) => onChange("form", v)} options={electronicFormOptions} /></FieldBlock>}
          {isBanner && <FieldBlock label="Vị trí banner"><EnumSelect value={booking.position} onChange={(v) => onChange("position", v)} options={bannerPositionOptions} /></FieldBlock>}
          <FieldBlock label="Số lượng"><Input type="number" min={1} value={fieldValue(booking, "quantity")} onChange={(e) => onChange("quantity", e.target.value)} onBlur={(e) => onChange("quantity", normalizeMin1(e.target.value))} /></FieldBlock>
          {isBanner && <FieldBlock label="Có video"><Select value={String(booking.has_video)} onValueChange={(v) => onChange("has_video", v === "true")}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Có</SelectItem><SelectItem value="false">Không</SelectItem></SelectContent></Select></FieldBlock>}
          {isBanner && <FieldBlock label="Có link"><Select value={String(booking.has_link)} onValueChange={(v) => onChange("has_link", v === "true")}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Có</SelectItem><SelectItem value="false">Không</SelectItem></SelectContent></Select></FieldBlock>}
          <FieldBlock label="Ngày bắt đầu"><Input type="date" value={fieldValue(booking, "start_date")} onChange={(e) => onChange("start_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày kết thúc"><Input type="date" value={fieldValue(booking, "end_date")} onChange={(e) => onChange("end_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
        </div>
      </div>
    );
  }

  if (serviceType === "tv_ad") {
    const isInsert = booking.broadcast_type === "insert";
    return (
      <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Booking truyền hình</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldBlock label="Kênh"><EnumSelect value={booking.channel_id} onChange={(v) => onChange("channel_id", v)} options={channelOptions.map((item) => ({ value: item.channel_id, label: `${item.code} • ${item.name}` }))} /></FieldBlock>
          <FieldBlock label="Hình thức phát sóng"><EnumSelect value={booking.broadcast_type} onChange={(v) => onChange("broadcast_type", v)} options={tvBroadcastTypeOptions} /></FieldBlock>
          {isInsert && <FieldBlock label="Insert type"><EnumSelect value={booking.insert_type} onChange={(v) => onChange("insert_type", v)} options={insertTypeOptions} /></FieldBlock>}
          <FieldBlock label="Chương trình"><EnumSelect value={booking.program} onChange={(v) => onChange("program", v)} options={tvProgramOptions} /></FieldBlock>
          <FieldBlock label="Thời điểm"><EnumSelect value={booking.time_point} onChange={(v) => onChange("time_point", v)} options={timePointOptions} /></FieldBlock>
          <FieldBlock label="Giờ bắt đầu"><Input type="time" value={fieldValue(booking, "start_time")} onChange={(e) => onChange("start_time", e.target.value)} /></FieldBlock>
          <FieldBlock label="Giờ kết thúc"><Input type="time" value={fieldValue(booking, "end_time")} onChange={(e) => onChange("end_time", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày bắt đầu"><Input type="date" value={fieldValue(booking, "start_date")} onChange={(e) => onChange("start_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày kết thúc"><Input type="date" value={fieldValue(booking, "end_date")} onChange={(e) => onChange("end_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Số lần phát"><Input type="number" min={1} value={fieldValue(booking, "num_broadcasts")} onChange={(e) => onChange("num_broadcasts", e.target.value)} onBlur={(e) => onChange("num_broadcasts", normalizeMin1(e.target.value))} /></FieldBlock>
          <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
        </div>
      </div>
    );
  }

  if (serviceType === "radio_ad") {
    return (
      <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Booking phát thanh</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldBlock label="Kênh"><EnumSelect value={booking.channel_id} onChange={(v) => onChange("channel_id", v)} options={channelOptions.map((item) => ({ value: item.channel_id, label: `${item.code} • ${item.name}` }))} /></FieldBlock>
          <FieldBlock label="Loại nội dung"><EnumSelect value={booking.content_type} onChange={(v) => onChange("content_type", v)} options={radioContentTypeOptions} /></FieldBlock>
          <FieldBlock label="Chương trình"><EnumSelect value={booking.program} onChange={(v) => onChange("program", v)} options={radioProgramOptions} /></FieldBlock>
          <FieldBlock label="Thời điểm"><EnumSelect value={booking.time_point} onChange={(v) => onChange("time_point", v)} options={timePointOptions} /></FieldBlock>
          <FieldBlock label="Giờ bắt đầu"><Input type="time" value={fieldValue(booking, "start_time")} onChange={(e) => onChange("start_time", e.target.value)} /></FieldBlock>
          <FieldBlock label="Giờ kết thúc"><Input type="time" value={fieldValue(booking, "end_time")} onChange={(e) => onChange("end_time", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày bắt đầu"><Input type="date" value={fieldValue(booking, "start_date")} onChange={(e) => onChange("start_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày kết thúc"><Input type="date" value={fieldValue(booking, "end_date")} onChange={(e) => onChange("end_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Số lần phát"><Input type="number" min={1} value={fieldValue(booking, "num_broadcasts")} onChange={(e) => onChange("num_broadcasts", e.target.value)} onBlur={(e) => onChange("num_broadcasts", normalizeMin1(e.target.value))} /></FieldBlock>
          <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
        </div>
      </div>
    );
  }

  if (serviceType === "digital_ad") {
    return (
      <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Booking digital</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldBlock label="Kênh"><EnumSelect value={booking.channel_id} onChange={(v) => onChange("channel_id", v)} options={channelOptions.map((item) => ({ value: item.channel_id, label: `${item.code} • ${item.name}` }))} /></FieldBlock>
          <FieldBlock label="Loại nội dung"><EnumSelect value={booking.content_type} onChange={(v) => onChange("content_type", v)} options={digitalContentTypeOptions} /></FieldBlock>
          <FieldBlock label="Ngày đăng"><Input type="date" value={fieldValue(booking, "post_date")} onChange={(e) => onChange("post_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày bắt đầu"><Input type="date" value={fieldValue(booking, "start_date")} onChange={(e) => onChange("start_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ngày kết thúc"><Input type="date" value={fieldValue(booking, "end_date")} onChange={(e) => onChange("end_date", e.target.value)} /></FieldBlock>
          <FieldBlock label="Số lượng"><Input type="number" min={1} value={fieldValue(booking, "quantity")} onChange={(e) => onChange("quantity", e.target.value)} onBlur={(e) => onChange("quantity", normalizeMin1(e.target.value))} /></FieldBlock>
          <FieldBlock label="Có KOL/experiencer"><Select value={String(booking.has_experiencer)} onValueChange={(v) => onChange("has_experiencer", v === "true")}><SelectTrigger className="rounded-2xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="true">Có</SelectItem><SelectItem value="false">Không</SelectItem></SelectContent></Select></FieldBlock>
          <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
        </div>
      </div>
    );
  }

  if (serviceType === "studio_rental") {
    return (
      <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Booking thuê studio</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldBlock label="Studio"><EnumSelect value={booking.studio_id} onChange={(v) => onChange("studio_id", v)} options={studios.map((item) => ({ value: item.studio_id, label: item.name }))} /></FieldBlock>
          <FieldBlock label="Hình thức thuê"><EnumSelect value={booking.rental_type} onChange={(v) => onChange("rental_type", v)} options={rentalTypeOptions} /></FieldBlock>
          <FieldBlock label="Bắt đầu thuê"><Input type="datetime-local" value={fieldValue(booking, "rental_start")} onChange={(e) => onChange("rental_start", e.target.value)} /></FieldBlock>
          <FieldBlock label="Kết thúc thuê"><Input type="datetime-local" value={fieldValue(booking, "rental_end")} onChange={(e) => onChange("rental_end", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
        </div>
      </div>
    );
  }

  if (serviceType === "content_production") {
    return (
      <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
        <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Chi tiết dịch vụ sản xuất nội dung</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
        <div className="grid gap-4 md:grid-cols-3">
          <FieldBlock label="Loại nội dung"><EnumSelect value={booking.content_type} onChange={(v) => onChange("content_type", v)} options={contentTypeOptions} /></FieldBlock>
          <FieldBlock label="Hạn bàn giao"><Input type="date" value={fieldValue(booking, "delivery_deadline")} onChange={(e) => onChange("delivery_deadline", e.target.value)} /></FieldBlock>
          <FieldBlock label="Mô tả yêu cầu"><Input value={fieldValue(booking, "requirement_description")} onChange={(e) => onChange("requirement_description", e.target.value)} /></FieldBlock>
          <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border bg-slate-50/60 p-4">
      <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-700">Booking khác</div><Button size="sm" variant="outline" className="rounded-xl" onClick={onRemove}>Xóa</Button></div>
      <div className="grid gap-4 md:grid-cols-3">
        <FieldBlock label="Mô tả"><Input value={fieldValue(booking, "description")} onChange={(e) => onChange("description", e.target.value)} /></FieldBlock>
        <FieldBlock label="Ngày bắt đầu"><Input type="date" value={fieldValue(booking, "start_date")} onChange={(e) => onChange("start_date", e.target.value)} /></FieldBlock>
        <FieldBlock label="Ngày kết thúc"><Input type="date" value={fieldValue(booking, "end_date")} onChange={(e) => onChange("end_date", e.target.value)} /></FieldBlock>
        <FieldBlock label="Ghi chú"><Input value={fieldValue(booking, "notes")} onChange={(e) => onChange("notes", e.target.value)} /></FieldBlock>
      </div>
    </div>
  );
}

// COMPONENT CHÍNH CHO FORM NHẬP LIỆU MỤC DỊCH VỤ TRONG HỢP ĐỒNG DỊCH VỤ
function ContractServiceEditor({
  serviceItems,
  setServiceItems,
  channels,
  studios,
}: {
  serviceItems: DraftServiceItem[];
  setServiceItems: React.Dispatch<React.SetStateAction<DraftServiceItem[]>>;
  channels: ChannelView[];
  studios: StudioView[];
}) {
  const addServiceItem = () =>
    setServiceItems((prev) => [...prev, createEmptyServiceItem(studios)]);

  const updateServiceItem = (itemId: string, key: keyof DraftServiceItem, value: any) => {
    setServiceItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      if (key === "service_type") {
        return {
          ...item,
          service_type: value,
          bookings: [createDefaultBookingByServiceType(value, studios)],
        };
      }
      return { ...item, [key]: value };
    }));
  };

  const removeServiceItem = (itemId: string) => setServiceItems((prev) => prev.filter((item) => item.id !== itemId));

  const addBooking = (itemId: string) => {
    setServiceItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      if (item.service_type === "content_production" && item.bookings.length >= 1) return item;
      return {
        ...item,
        bookings: [
          ...item.bookings,
          createDefaultBookingByServiceType(item.service_type, studios),
        ],
      };
    }));
  };

  const updateBooking = (itemId: string, bookingId: string, key: string, value: any) => {
    setServiceItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return {
        ...item,
        bookings: item.bookings.map((booking) => booking.id === bookingId ? { ...booking, [key]: value } : booking),
      };
    }));
  };

  const removeBooking = (itemId: string, bookingId: string) => {
    setServiceItems((prev) => prev.map((item) => {
      if (item.id !== itemId) return item;
      return { ...item, bookings: item.bookings.filter((booking) => booking.id !== bookingId) };
    }));
  };

  return (
    <div className="space-y-4">
      {serviceItems.map((item, index) => (
        <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">Mục dịch vụ {index + 1}</div>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={() => removeServiceItem(item.id)}>Xóa mục dịch vụ</Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <FieldBlock label="Tiêu đề"><Input value={item.title} onChange={(e) => updateServiceItem(item.id, "title", e.target.value)} /></FieldBlock>
            <FieldBlock label="Loại dịch vụ"><EnumSelect value={item.service_type} onChange={(v) => updateServiceItem(item.id, "service_type", v)} options={serviceTypeOptions} /></FieldBlock>
            <FieldBlock label="Giá trị"><Input type="number" min={1} value={item.cost} onChange={(e) => updateServiceItem(item.id, "cost", e.target.value)} onBlur={(e) => updateServiceItem(item.id, "cost", normalizeMin1(e.target.value))} /></FieldBlock>
            <FieldBlock label="Trạng thái"><EnumSelect value={item.status} onChange={(v) => updateServiceItem(item.id, "status", v)} options={serviceStatusOptions} /></FieldBlock>
            <div className="md:col-span-4"><FieldBlock label="Ghi chú"><Input value={item.notes} onChange={(e) => updateServiceItem(item.id, "notes", e.target.value)} /></FieldBlock></div>
          </div>

          <div className="mt-5 border-t pt-5">
            <div className="mb-3 flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-700">Booking chi tiết</div>
            </div>

            <div className="space-y-4">
              {item.bookings.length === 0 ? (
                <div className="rounded-xl border border-dashed p-3 text-sm text-slate-500">Chưa có booking.</div>
              ) : item.bookings.map((booking: any) => (
                <BookingEditor
                  key={booking.id}
                  serviceType={item.service_type}
                  booking={booking}
                  onChange={(key, value) => updateBooking(item.id, booking.id, key, value)}
                  onRemove={() => removeBooking(item.id, booking.id)}
                  channels={channels}
                  studios={studios}
                />
              ))}
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="rounded-xl"
                onClick={() => addBooking(item.id)}
                disabled={item.service_type === "content_production" && item.bookings.length >= 1}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm booking
              </Button>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-orange-200 bg-white hover:bg-orange-50"
          onClick={addServiceItem}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm mục dịch vụ
        </Button>
      </div>
    </div>
  );
}

// COMPONENT CHÍNH CHO FORM NHẬP LIỆU LỊCH THANH TOÁN
function PaymentScheduleEditor({
  schedules,
  setSchedules,
}: {
  schedules: DraftPaymentSchedule[];
  setSchedules: React.Dispatch<React.SetStateAction<DraftPaymentSchedule[]>>;
}) {
  const addRow = () =>
  setSchedules((prev) => {
    const nextNo =
      prev.length > 0
        ? Math.max(...prev.map((item) => Number(item.installment_no || 0))) + 1
        : 1;

    return [...prev, createEmptyPaymentSchedule(nextNo)];
  });
  const removeRow = (id: string) => setSchedules((prev) => prev.filter((item) => item.id !== id));
  const updateRow = (id: string, key: keyof DraftPaymentSchedule, value: any) => setSchedules((prev) => prev.map((item) => item.id === id ? { ...item, [key]: value } : item));

  return (
    <div className="space-y-4">
      {schedules.map((row, index) => (
        <div key={row.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between"><div className="font-medium">Đợt thanh toán {index + 1}</div><Button size="sm" variant="outline" className="rounded-xl" onClick={() => removeRow(row.id)}>Xóa</Button></div>
          <div className="grid gap-4 md:grid-cols-4">
            <FieldBlock label="Đợt thanh toán"><Input type="number" min={1} value={row.installment_no} readOnly /></FieldBlock>
            <FieldBlock label="Hạn thanh toán"><Input type="date" value={row.due_date} onChange={(e) => updateRow(row.id, "due_date", e.target.value)} /></FieldBlock>
            <FieldBlock label="Số tiền kế hoạch"><Input type="number" min={1} value={row.planned_amount} onChange={(e) => updateRow(row.id, "planned_amount", e.target.value)} onBlur={(e) => updateRow(row.id, "planned_amount", normalizeMin1(e.target.value))} /></FieldBlock>
            <FieldBlock label="Trạng thái"><EnumSelect value={row.status} onChange={(v) => updateRow(row.id, "status", v)} options={paymentScheduleStatusOptions} /></FieldBlock>
            <div className="md:col-span-4"><FieldBlock label="Ghi chú"><Input value={row.notes} onChange={(e) => updateRow(row.id, "notes", e.target.value)} /></FieldBlock></div>
          </div>
        </div>
      ))}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="outline"
          className="rounded-xl border-orange-200 bg-white hover:bg-orange-50"
          onClick={addRow}
        >
          <Plus className="mr-2 h-4 w-4" />
          Thêm lịch thanh toán
        </Button>
      </div>
    </div>
  );
}

// MÀN HÌNH CHÍNH CHO XEM TOÀN BỘ THÔNG TIN HỢP ĐỒNG
export function ContractFullView({
  contract,
  serviceItems,
  bookings,
  paymentSchedules,
  payments,
  invoices,
  files,
  contractFileLinks,
  contents,
  productions,
  productionTasks,
  contentFileLinks,
  serviceItemContents,
  productionFileLinks,
  serviceItemProductions,
  channels,
  onEditPayment,
  onDeletePayment,
  onEditInvoice,
  onDeleteInvoice,
}: {
  contract: ContractRow;
  serviceItems: ServiceItemRow[];
  bookings: BookingRow[];
  paymentSchedules: PaymentScheduleRow[];
  payments: PaymentRow[];
  invoices: InvoiceRow[];
  files: FileRow[];
  contractFileLinks: LinkedFileSeedRow[];
  contents: ContentRow[];
  productions: ProductionRow[];
  productionTasks: ProductionTaskRow[];
  contentFileLinks: LinkedFileSeedRow[];
  serviceItemContents: ServiceItemContentRow[];
  productionFileLinks: LinkedFileSeedRow[];
  serviceItemProductions: ServiceItemProductionRow[];
  channels: ChannelView[];
  onEditPayment?: (payment: PaymentRow) => void;
  onDeletePayment?: (paymentId: string) => Promise<boolean>;
  onEditInvoice?: (invoice: InvoiceRow) => void;
  onDeleteInvoice?: (invoiceId: string) => Promise<boolean>;
}) {
  const [productionDetailId, setProductionDetailId] = useState<string | null>(null);

  const contractServiceItems = serviceItems.filter(
    (item) => item.contract_id === contract.contract_id
  );

  const serviceIds = contractServiceItems.map((item) => item.service_item_id);

  const contractBookings = bookings.filter((item) =>
    serviceIds.includes(item.service_item_id)
  );

  const contractPaymentSchedules = paymentSchedules.filter(
    (item) => item.contract_id === contract.contract_id
  );

  const scheduleIds = contractPaymentSchedules.map((item) => item.payment_schedule_id);

  const contractPayments = payments.filter((item) =>
    scheduleIds.includes(item.payment_schedule_id)
  );

  const contractInvoices = invoices.filter(
    (item) => item.contract_id === contract.contract_id
  );

  const selectedProduction =
    productions.find((item) => item.production_id === productionDetailId) || null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>Thông tin chung</DetailSectionTitle>
        <div className="mt-3 grid gap-3 text-sm md:grid-cols-2">
          <div><span className="font-medium">Số hợp đồng:</span> {contract.contract_number}</div>
          <div><span className="font-medium">Tên hợp đồng:</span> {contract.title}</div>
          <div><span className="font-medium">Đối tác:</span> {contract.party_name}</div>
          <div><span className="font-medium">Loại:</span> {contract.contract_type}</div>
          <div><span className="font-medium">Ngày ký:</span> {formatDisplayDate(contract.signed_date)}</div>
          <div><span className="font-medium">Hiệu lực:</span> {formatDisplayDate(contract.start_date)} → {formatDisplayDate(contract.end_date)}</div>
          <div><span className="font-medium">Tổng giá trị:</span> {formatCurrency(contract.total_value)}</div>
          <div><span className="font-medium">Trạng thái:</span> {statusLabel(contract.status)}</div>
          <div><span className="font-medium">Người phụ trách:</span> {contract.created_by_name || "—"}</div>
          <div className="md:col-span-2"><span className="font-medium">Ghi chú:</span> {(contract as any).notes || "—"}</div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>File hợp đồng</DetailSectionTitle>
        <LinkedFilesViewer
          rows={buildDraftContractFiles(
            files,
            contractFileLinks,
            contract.contract_id,
            contract.file_ids
          )}
        />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <DetailSectionTitle>Mục dịch vụ và booking</DetailSectionTitle>

        {contractServiceItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
            Chưa có mục dịch vụ.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th rowSpan={2} className="border px-3 py-3 text-left font-semibold text-slate-700">Mục dịch vụ</th>
                  <th rowSpan={2} className="border px-3 py-3 text-left font-semibold text-slate-700">Booking</th>
                  <th colSpan={2} className="border px-3 py-3 text-center font-semibold text-slate-700">Nguồn nội dung</th>
                  <th rowSpan={2} className="border px-3 py-3 text-left font-semibold text-slate-700">Nội dung</th>
                </tr>
                <tr className="bg-slate-50">
                  <th className="border px-3 py-2 text-center font-semibold text-slate-700">Khách hàng cung cấp</th>
                  <th className="border px-3 py-2 text-center font-semibold text-slate-700">Sản xuất</th>
                </tr>
              </thead>

              <tbody>
                {contractServiceItems.map((service) => {
                  const itemBookings = contractBookings.filter(
                    (booking) => booking.service_item_id === service.service_item_id
                  );

                  const bookingRows = itemBookings.length > 0 ? itemBookings : [null];

                  const linkedContentIds = serviceItemContents
                    .filter((row) => row.service_item_id === service.service_item_id)
                    .map((row) => row.content_id);

                  const linkedContents = contents.filter((content) =>
                    linkedContentIds.includes(content.content_id)
                  );

                  const linkedProductionIds = serviceItemProductions
                    .filter((row) => row.service_item_id === service.service_item_id)
                    .map((row) => row.production_id);

                  const linkedProductions = productions.filter((production) =>
                    linkedProductionIds.includes(production.production_id)
                  );

                  const hasCustomerProvided = linkedContents.some(
                    (content) => content.source === "customer_provided"
                  );

                  const hasProduced = linkedProductions.length > 0;

                  return bookingRows.map((booking, bookingIndex) => (
                    <tr key={`${service.service_item_id}-${booking?.booking_id || "empty"} `} className="align-top">
                      {bookingIndex === 0 && (
                        <td rowSpan={bookingRows.length} className="border px-3 py-3">
                          <div className="space-y-1">
                            <div className="font-semibold text-slate-900">{service.title}</div>
                            <div className="text-slate-600">{serviceTypeLabel(service.service_type)}</div>
                            <div className="text-slate-600">{formatCurrency(service.cost)}</div>
                            <div className="text-slate-600">Trạng thái: {statusLabel(service.status)}</div>
                            <div className="text-slate-500">Ghi chú: {service.notes || "—"}</div>
                          </div>
                        </td>
                      )}

                      <td className="border px-3 py-3">
                        {booking ? (
                          <div className="space-y-2">
                            <div className="rounded-xl bg-slate-50 p-3">
                              {renderContractBookingDetail(booking, channels)}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-500">Chưa có booking</div>
                        )}
                      </td>

                      {bookingIndex === 0 && (
                        <td
                          rowSpan={bookingRows.length}
                          className="border px-3 py-3 text-center align-middle"
                        >
                          <span className="text-lg font-medium text-slate-700">
                            {hasCustomerProvided ? "✓" : "—"}
                          </span>
                        </td>
                      )}

                      {bookingIndex === 0 && (
                        <td
                          rowSpan={bookingRows.length}
                          className="border px-3 py-3 align-middle"
                        >
                          {hasProduced ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="text-lg font-medium text-slate-700">✓</div>

                              {linkedProductions.map((production) => (
                                <div
                                  key={production.production_id}
                                  className="flex flex-col items-center gap-2"
                                >
                                  <Badge className="rounded-full border-0 bg-sky-100 text-sky-700">
                                    {statusLabel(production.status)}
                                  </Badge>

                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="rounded-xl"
                                    onClick={() => setProductionDetailId(production.production_id)}
                                  >
                                    Xem dự án
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </td>
                      )}

                      {bookingIndex === 0 && (
                        <td rowSpan={bookingRows.length} className="border px-3 py-3">
                          {linkedContents.length > 0 ? (
                            <div className="space-y-3">
                              {linkedContents.map((content) => {
                                const linkedFileRows = buildDraftContentFiles(
                                  files,
                                  contentFileLinks,
                                  content.content_id,
                                  content.file_ids
                                );

                                return (
                                  <div key={content.content_id} className="rounded-xl bg-slate-50 p-3">
                                    <div className="font-medium text-slate-900">{content.title}</div>
                                    <div className="mt-1 text-xs text-slate-500">
                                      {optionLabel(contentTypeOptions, content.type)} • {statusLabel(content.status)}
                                    </div>

                                    <div className="mt-2 space-y-1 text-xs text-slate-600">
                                      {linkedFileRows.length > 0 ? (
                                        linkedFileRows.map((fileRow) => (
                                          <div key={fileRow.id} className="text-slate-500">
                                            {fileRow.storage_path || "Chưa có đường dẫn"}
                                          </div>
                                        ))
                                      ) : (
                                        <div>Chưa có đường dẫn file.</div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="text-slate-500">Chưa có content liên kết</div>
                          )}
                        </td>
                      )}
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>


      <Tabs defaultValue="payment_schedules">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payment_schedules">Lịch thanh toán</TabsTrigger>
          <TabsTrigger value="payments">Thanh toán</TabsTrigger>
          <TabsTrigger value="invoices">Hóa đơn</TabsTrigger>
        </TabsList>

        <TabsContent value="payment_schedules" className="space-y-3 pt-4">
          {contractPaymentSchedules.length > 0 ? contractPaymentSchedules.map((item) => (
            <div key={item.payment_schedule_id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">Đợt {item.installment_no}</div>
                  <div className="mt-2 text-sm font-medium">
                    {formatCurrency(item.planned_amount)}
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Hạn thanh toán:</span>{" "}
                    {formatDisplayDate(item.due_date)}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">Ghi chú:</span>{" "}
                    {item.notes || "—"}
                  </div>
                </div>
                <StatusBadge value={item.status} />
              </div>
            </div>
          )) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
              Chưa có lịch thanh toán.
            </div>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-3 pt-4">
          {contractPayments.length > 0 ? (
            contractPayments.map((item) => (
              <div
                key={item.payment_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="font-medium">
                  Thanh toán ngày {formatDisplayDate(item.paid_date)}
                </div>

                <div className="mt-1 text-sm text-slate-500">
                  Số tiền: {formatCurrency(item.amount)} • Phương thức:{" "}
                  {optionLabel(paymentMethodOptions, item.method)}
                </div>

                {(onEditPayment || onDeletePayment) && (
                  <div className="mt-3 flex gap-2">
                    {onEditPayment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditPayment(item)}
                      >
                        Chỉnh sửa
                      </Button>
                    )}

                    {onDeletePayment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const ok = window.confirm(
                            "Bạn có chắc muốn xóa khoản thanh toán này?"
                          );
                          if (!ok) return;
                          await onDeletePayment(item.payment_id);
                        }}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
              Chưa có payment nào.
            </div>
          )}
        </TabsContent>

        <TabsContent value="invoices" className="space-y-3 pt-4">
          {contractInvoices.length > 0 ? (
            contractInvoices.map((item) => (
              <div
                key={item.invoice_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">Hóa đơn số {item.invoice_number}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      Ngày phát hành: {formatDisplayDate(item.issue_date)}
                    </div>
                    <div className="mt-1 text-sm text-slate-500">
                      Tổng tiền: {formatCurrency(item.total_amount)}
                    </div>
                  </div>
                  <StatusBadge value={item.status} />
                </div>

                <div className="mt-4">
                  <FilesPanel files={files} fileIds={item.file_ids} />
                </div>

                {(onEditInvoice || onDeleteInvoice) && (
                  <div className="mt-3 flex gap-2">
                    {onEditInvoice && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEditInvoice(item)}
                      >
                        Chỉnh sửa
                      </Button>
                    )}

                    {onDeleteInvoice && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const ok = window.confirm(
                            "Bạn có chắc muốn xóa hóa đơn này?"
                          );
                          if (!ok) return;
                          await onDeleteInvoice(item.invoice_id);
                        }}
                      >
                        Xóa
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
              Chưa có hóa đơn nào.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <DetailDrawer
        title={
          selectedProduction
            ? `Chi tiết dự án sản xuất • ${selectedProduction.name}`
            : "Chi tiết dự án sản xuất"
        }
        open={!!selectedProduction}
        onClose={() => setProductionDetailId(null)}
      >
        {selectedProduction && (
          <ProductionFullView
            production={selectedProduction}
            contracts={[contract]}
            serviceItems={serviceItems}
            productionTasks={productionTasks}
            files={files}
            productionFileLinks={productionFileLinks}
            serviceItemProductions={serviceItemProductions}
          />
        )}
      </DetailDrawer>  
    </div>
  );
}

// FORM CHÍNH CHO TẠO/CHỈNH SỬA HỢP ĐỒNG
export function ContractFormDialog({
  open,
  onOpenChange,
  mode,
  initialContract,
  parties,
  serviceItemRows,
  bookingRows,
  paymentScheduleRows,
  files,
  contractFileLinks,
  channels,
  studios,
  onSaveContract,
  onImportContract,
}: ContractFormDialogProps & {
  onSaveContract: (payload: ContractSavePayload) => Promise<boolean>;
  onImportContract: (params: {
    contract_type: ContractType;
    files: File[];
  }) => Promise<boolean>;
}) {
  const isEdit = mode === "edit";

  const [activeTab, setActiveTab] = useState<"manual" | "import">("manual");

  const [contractNumber, setContractNumber] = useState("");
  const [contractTitle, setContractTitle] = useState("");
  const [partyId, setPartyId] = useState("");
  const [contractType, setContractType] = useState<ContractType>("service");
  const [signedDate, setSignedDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [contractValue, setContractValue] = useState("");
  const [discount, setDiscount] = useState("");
  const [totalValue, setTotalValue] = useState("");
  const [status, setStatus] = useState<ContractStatus>("draft");
  const [notes, setNotes] = useState("");
  const [serviceItems, setServiceItems] = useState<DraftServiceItem[]>([
    createEmptyServiceItem(studios),
  ]);
  const [paymentSchedules, setPaymentSchedules] = useState<DraftPaymentSchedule[]>([
    createEmptyPaymentSchedule(1),
  ]);
  const [partySearch, setPartySearch] = useState("");
  const [linkedFiles, setLinkedFiles] = useState<DraftLinkedFile[]>([]);

  const [importContractType, setImportContractType] = useState<ContractType>("service");
  const [importFiles, setImportFiles] = useState<File[]>([]);

  const filteredParties = useMemo(() => {
    const q = partySearch.trim().toLowerCase();
    if (q.length < 2) return [];

    return parties
      .filter((item) =>
        [item.name, item.company || ""].join(" ").toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [parties, partySearch]);

  const resetCreateForm = () => {
    setContractNumber("");
    setContractTitle("");
    setPartyId("");
    setPartySearch("");
    setContractType("service");
    setSignedDate("");
    setStartDate("");
    setEndDate("");
    setContractValue("");
    setDiscount("");
    setTotalValue("");
    setStatus("draft");
    setNotes("");
    setServiceItems([createEmptyServiceItem(studios)]);
    setPaymentSchedules([createEmptyPaymentSchedule(1)]);
    setLinkedFiles([]);
  };

  useEffect(() => {
    if (!open) return;

    setActiveTab("manual");
    setImportContractType("service");
    setImportFiles([]);

    if (!isEdit || !initialContract) {
      resetCreateForm();
      return;
    }

    setContractNumber(initialContract.contract_number || "");
    setContractTitle(initialContract.title || "");
    setPartyId(initialContract.party_id || "");

    const selectedParty = parties.find(
      (p) => p.party_id === initialContract.party_id
    );

    setPartySearch(
      selectedParty
        ? `${selectedParty.name}${selectedParty.company ? ` • ${selectedParty.company}` : ""}`
        : ""
    );

    setContractType(initialContract.contract_type || "service");
    setSignedDate(toDateInputValue(initialContract.signed_date));
    setStartDate(toDateInputValue(initialContract.start_date));
    setEndDate(toDateInputValue(initialContract.end_date));

    const contractValueSeed = String(
      (initialContract as any).contract_value ?? initialContract.total_value ?? ""
    );
    const discountSeed = String((initialContract as any).discount ?? 0);
    const totalValueSeed = String(initialContract.total_value ?? "");
    const notesSeed = String((initialContract as any).notes ?? "");

    setContractValue(contractValueSeed);
    setDiscount(discountSeed);
    setTotalValue(totalValueSeed);
    setStatus(initialContract.status || "draft");
    setNotes(notesSeed);

    if (initialContract.contract_type === "service") {
      setServiceItems(
        buildDraftServiceItems(
          serviceItemRows,
          bookingRows,
          channels,
          studios,
          initialContract.contract_id
        )
      );
    } else {
      setServiceItems([]);
    }

    setPaymentSchedules(
      buildDraftPaymentSchedules(
        paymentScheduleRows,
        initialContract.contract_id
      ).map((row) => ({
        ...row,
        due_date: toDateInputValue(row.due_date),
      }))
    );

    setLinkedFiles(
      buildDraftContractFiles(
        files,
        contractFileLinks,
        initialContract.contract_id,
        initialContract.file_ids
      )
    );
  }, [
    open,
    isEdit,
    initialContract,
    parties,
    serviceItemRows,
    bookingRows,
    paymentScheduleRows,
    files,
    contractFileLinks,
    channels,
    studios,
  ]);

  useEffect(() => {
    const contractVal = Math.max(1, Number(contractValue || 1));
    const discountVal = Math.max(0, Number(discount || 0));

    if (contractValue !== "" || discount !== "") {
      setTotalValue(String(Math.max(contractVal - discountVal, 1)));
    }
  }, [contractValue, discount]);

  const handleSave = async () => {
    const validationError = validateContractBeforeSave({
      contractNumber,
      partyId,
      contractType,
      signedDate,
      startDate,
      contractValue,
      totalValue,
      status,
      serviceItems,
      paymentSchedules,
      linkedFiles,
    });

    if (validationError) {
      alert(validationError);
      return;
    }

    const payload: ContractSavePayload = {
      contract: {
        contract_id: isEdit ? initialContract?.contract_id : undefined,
        contract_number: contractNumber,
        title: contractTitle,
        party_id: partyId,
        contract_type: contractType,
        signed_date: signedDate,
        start_date: startDate,
        end_date: endDate || null,
        contract_value: Number(contractValue || 0),
        discount: Number(discount || 0),
        total_value: Number(totalValue || 0),
        status,
        notes,
      },
      contract_files: linkedFiles.map((row) => ({
        file_id: row.file_id || null,
        local_file_name: row.source === "local" ? row.file_name : null,
        local_file: row.source === "local" ? row.local_file || null : null,
        file_role: row.file_role,
        is_main: row.is_main,
        notes: row.notes,
      })),
      service_items: contractType === "service" ? serviceItems : [],
      payment_schedules: paymentSchedules,
    };

    const saved = await onSaveContract(payload);
    if (!saved) return;

    onOpenChange(false);
  };

  const handleImportContract = async () => {
    if (importFiles.length === 0) {
      alert("Vui lòng chọn ít nhất 1 file dữ liệu để import hợp đồng.");
      return;
    }

    const saved = await onImportContract({
      contract_type: importContractType,
      files: importFiles,
    });

    if (!saved) return;

    onOpenChange(false);
  };

  const manualForm = (
    <>
      <div className="space-y-6 py-2">
        <FormSection title="Thông tin hợp đồng">
          <div className="grid gap-4 md:grid-cols-3">
            <FieldBlock label="Số hợp đồng">
              <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} />
            </FieldBlock>

            <FieldBlock label="Tên hợp đồng">
              <Input value={contractTitle} onChange={(e) => setContractTitle(e.target.value)} />
            </FieldBlock>

            <FieldBlock label="Đối tác / khách hàng">
              <Input
                value={partySearch}
                onChange={(e) => {
                  setPartySearch(e.target.value);
                  setPartyId("");
                }}
                placeholder="Nhập tên hoặc công ty để tìm..."
              />

              {partySearch.trim().length >= 2 && !partyId && (
                <SuggestionList
                  items={filteredParties.map(
                    (item) => `${item.name}${item.company ? ` • ${item.company}` : ""}`
                  )}
                  onPick={(value) => {
                    const picked = filteredParties.find(
                      (item) => `${item.name}${item.company ? ` • ${item.company}` : ""}` === value
                    );

                    if (picked) {
                      setPartyId(picked.party_id);
                      setPartySearch(
                        `${picked.name}${picked.company ? ` • ${picked.company}` : ""}`
                      );
                    }
                  }}
                />
              )}

              {partyId && (
                <div className="text-xs text-emerald-600">
                  Đã chọn: {parties.find((p) => p.party_id === partyId)?.name || partyId}
                </div>
              )}
            </FieldBlock>

            <FieldBlock label="Loại hợp đồng">
              <EnumSelect
                value={contractType}
                onChange={(v) => {
                  setContractType(v);
                  if (v === "service") {
                    setServiceItems((prev) =>
                      prev.length > 0 ? prev : [createEmptyServiceItem(studios)]
                    );
                  } else {
                    setServiceItems([]);
                  }
                }}
                options={contractTypeOptions}
              />
            </FieldBlock>

            <FieldBlock label="Ngày ký">
              <Input type="date" value={signedDate} onChange={(e) => setSignedDate(e.target.value)} />
            </FieldBlock>

            <FieldBlock label="Ngày bắt đầu">
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </FieldBlock>

            <FieldBlock label="Ngày kết thúc">
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </FieldBlock>

            <FieldBlock label="Giá trị hợp đồng">
              <Input
                type="number"
                min={1}
                value={contractValue}
                onChange={(e) => setContractValue(e.target.value)}
                onBlur={(e) => setContractValue(normalizeMin1(e.target.value))}
              />
            </FieldBlock>

            <FieldBlock label="Chiết khấu">
              <Input
                type="number"
                min={0}
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                onBlur={(e) => setDiscount(normalizeMin0(e.target.value))}
              />
            </FieldBlock>

            <FieldBlock label="Tổng giá trị">
              <Input
                type="number"
                min={1}
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                onBlur={(e) => setTotalValue(normalizeMin1(e.target.value))}
              />
            </FieldBlock>

            <FieldBlock label="Trạng thái">
              <EnumSelect value={status} onChange={(v) => setStatus(v)} options={contractStatusOptions} />
            </FieldBlock>

            <div className="md:col-span-3">
              <FieldBlock label="Ghi chú">
                <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
              </FieldBlock>
            </div>
          </div>
        </FormSection>

        <FormSection title="File hợp đồng / phụ lục / tài liệu liên quan">
          <LinkedFilesEditor
            mode="local"
            rows={linkedFiles}
            setRows={setLinkedFiles}
            defaultUploadFolder="contracts"
            files={files}
          />
        </FormSection>

        {contractType === "service" && (
          <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
            <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]" />
              Mục dịch vụ
            </div>
            <ContractServiceEditor
              serviceItems={serviceItems}
              setServiceItems={setServiceItems}
              channels={channels}
              studios={studios}
            />
          </div>
        )}

        <div className="rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="mb-4 flex items-center gap-2 text-base font-bold text-slate-900">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_0_4px_rgba(249,115,22,0.12)]" />
            Lịch thanh toán
          </div>
          <PaymentScheduleEditor
            schedules={paymentSchedules}
            setSchedules={setPaymentSchedules}
          />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
        <PrimaryButton onClick={handleSave}>
          {isEdit ? "Lưu thay đổi" : "Lưu hợp đồng"}
        </PrimaryButton>
      </DialogFooter>
    </>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-auto rounded-2xl sm:max-w-6xl">

        {isEdit ? (
          manualForm
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "manual" | "import")}
            className="mt-2"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">Tạo hợp đồng mới</TabsTrigger>
              <TabsTrigger value="import">Import hợp đồng</TabsTrigger>
            </TabsList>

            <TabsContent value="manual">{manualForm}</TabsContent>

            <TabsContent value="import">
              <ImportEntityPanel
                entityLabel="hợp đồng"
                typeLabel="Loại hợp đồng"
                typeValue={importContractType}
                onTypeChange={setImportContractType}
                typeOptions={contractTypeOptions}
                pickedFiles={importFiles}
                setPickedFiles={setImportFiles}
                onSubmit={handleImportContract}
                submittingLabel="Gửi file import hợp đồng"
              />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}

// TRANG DANH SÁCH HỢP ĐỒNG
export function ContractsPage({
  currentUser,
  contracts,
  serviceItems,
  parties,
  bookings,
  paymentSchedules,
  payments,
  invoices,
  files,
  contractFileLinks,
  channels,
  studios,
  onSaveContract,
  onImportContract,
  onSavePayment,
  onUpdatePayment,
  onDeletePayment,
  onSaveInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onDeleteContract,
  contents,
  productions,
  productionTasks,
  contentFileLinks,
  serviceItemContents,
  productionFileLinks,
  serviceItemProductions,
}: {
  currentUser: SessionUser;
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  parties: PartyView[];
  bookings: BookingRow[];
  paymentSchedules: PaymentScheduleRow[];
  payments: PaymentRow[];
  invoices: InvoiceRow[];
  files: FileRow[];
  contractFileLinks: LinkedFileSeedRow[];
  channels: ChannelView[];
  studios: StudioView[];
  onSaveContract: (payload: ContractSavePayload) => Promise<boolean>;
  onImportContract: (params: {
    contract_type: ContractType;
    files: File[];
  }) => Promise<boolean>;

  onSavePayment: (payload: PaymentSavePayload) => Promise<boolean>;
  onUpdatePayment: (paymentId: string, payload: PaymentSavePayload) => Promise<boolean>;
  onDeletePayment: (paymentId: string) => Promise<boolean>;

  onSaveInvoice: (payload: InvoiceSavePayload) => Promise<boolean>;
  onUpdateInvoice: (invoiceId: string, payload: InvoiceSavePayload) => Promise<boolean>;
  onDeleteInvoice: (invoiceId: string) => Promise<boolean>;

  onDeleteContract: (contractId: string) => void;
  contents: ContentRow[];
  productions: ProductionRow[];
  productionTasks: ProductionTaskRow[];
  contentFileLinks: LinkedFileSeedRow[];
  serviceItemContents: ServiceItemContentRow[];
  productionFileLinks: LinkedFileSeedRow[];
  serviceItemProductions: ServiceItemProductionRow[];
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [contractTypeFilter, setContractTypeFilter] = useState<"all" | ContractType>("all");
  const [signedMonthFilter, setSignedMonthFilter] = useState("");
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    payment_schedule_id: "",
    paid_date: "",
    amount: "",
    method: "bank_transfer" as PaymentMethod,
  });

  const resetPaymentForm = () => {
    setPaymentForm({
      payment_schedule_id: "",
      paid_date: "",
      amount: "",
      method: "bank_transfer",
    });
    setPaymentMode("create");
    setEditingPaymentId(null);
  };

  const [paymentMode, setPaymentMode] = useState<"create" | "edit">("create");
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);

  const [invoiceForm, setInvoiceForm] = useState({
    invoice_number: "",
    issue_date: "",
    total_amount: "",
    status: "draft" as InvoiceStatus,
  });

  const [invoiceMode, setInvoiceMode] = useState<"create" | "edit">("create");
  const [editingInvoiceId, setEditingInvoiceId] = useState<string | null>(null);

  const [invoiceLocalFiles, setInvoiceLocalFiles] = useState<File[]>([]);

  const resetInvoiceForm = () => {
    setInvoiceForm({
      invoice_number: "",
      issue_date: "",
      total_amount: "",
      status: "draft",
    });
    setInvoiceLocalFiles([]);
    setInvoiceMode("create");
    setEditingInvoiceId(null);
  };

  const handleInvoiceIssueDateChange = (value: string) => {
    setInvoiceForm((prev) => ({
      ...prev,
      issue_date: value,
      status: value ? "issued" : "draft",
    }));
  };

  function openEditPayment(payment: PaymentRow) {
    const contract = contracts.find((item) => item.contract_number === payment.contract_number)
      || contracts.find((item) =>
        paymentSchedules.some(
          (ps) =>
            ps.payment_schedule_id === payment.payment_schedule_id &&
            ps.contract_id === item.contract_id
        )
      );

    if (!contract) {
      alert("Không tìm thấy hợp đồng của khoản thanh toán này.");
      return;
    }

    setSelectedContractId(contract.contract_id);
    setPaymentMode("edit");
    setEditingPaymentId(payment.payment_id);
    setPaymentForm({
      payment_schedule_id: payment.payment_schedule_id,
      paid_date: toDateInputValue(payment.paid_date),
      amount: String(payment.amount),
      method: payment.method as PaymentMethod,
    });
    setPaymentOpen(true);
  }

  function openEditInvoice(invoice: InvoiceRow) {
    const contract = contracts.find((item) => item.contract_id === invoice.contract_id);

    if (!contract) {
      alert("Không tìm thấy hợp đồng của hóa đơn này.");
      return;
    }

    setSelectedContractId(contract.contract_id);
    setInvoiceMode("edit");
    setEditingInvoiceId(invoice.invoice_id);
    setInvoiceForm({
      invoice_number: invoice.invoice_number,
      issue_date: toDateInputValue(invoice.issue_date),
      total_amount: String(invoice.total_amount),
      status: invoice.status as InvoiceStatus,
    });
    setInvoiceLocalFiles([]);
    setInvoiceOpen(true);
  }

  const handleSaveInvoice = async () => {
    if (!selectedContract) {
      alert("Chưa chọn hợp đồng.");
      return;
    }

    if (!invoiceForm.invoice_number.trim()) {
      alert("Vui lòng nhập số hóa đơn.");
      return;
    }

    if (invoiceForm.status === "issued" && !invoiceForm.issue_date) {
      alert("Hóa đơn ở trạng thái đã phát hành thì phải có ngày phát hành.");
      return;
    }

    if (Number(invoiceForm.total_amount || 0) < 1) {
      alert("Tổng tiền hóa đơn phải lớn hơn hoặc bằng 1.");
      return;
    }

    const payload: InvoiceSavePayload = {
      contract_id: selectedContract.contract_id,
      invoice_number: invoiceForm.invoice_number,
      issue_date: invoiceForm.issue_date,
      total_amount: Number(invoiceForm.total_amount || 0),
      status: invoiceForm.status,
      invoice_files: invoiceLocalFiles.map((file, index) => ({
        file_id: null,
        local_file_name: file.name,
        local_file: file,
        file_role: "invoice",
        is_main: index === 0,
        notes: "",
      })),
    };

    const saved =
      invoiceMode === "edit" && editingInvoiceId
        ? await onUpdateInvoice(editingInvoiceId, payload)
        : await onSaveInvoice(payload);

    if (!saved) return;

    setInvoiceOpen(false);
    resetInvoiceForm();
  };

  const handleSavePayment = async () => {
    if (!selectedContract) {
      alert("Chưa chọn hợp đồng.");
      return;
    }

    if (!paymentForm.payment_schedule_id) {
      alert("Vui lòng chọn đợt thanh toán.");
      return;
    }

    if (!paymentForm.paid_date) {
      alert("Vui lòng nhập ngày thanh toán.");
      return;
    }

    if (Number(paymentForm.amount || 0) < 1) {
      alert("Số tiền thanh toán phải lớn hơn hoặc bằng 1.");
      return;
    }

    const payload: PaymentSavePayload = {
      contract_id: selectedContract.contract_id,
      payment_schedule_id: paymentForm.payment_schedule_id,
      paid_date: paymentForm.paid_date,
      amount: Number(paymentForm.amount),
      method: paymentForm.method,
    };

    const saved =
      paymentMode === "edit" && editingPaymentId
        ? await onUpdatePayment(editingPaymentId, payload)
        : await onSavePayment(payload);

    if (!saved) return;

    setPaymentOpen(false);
    resetPaymentForm();
  };

  const rows = useMemo(() => {
    return contracts.filter((item) => {
      const party = parties.find((p) => p.party_id === item.party_id);
      const joined = [
        item.contract_number,
        item.title,
        party?.name || "",
        party?.company || "",
      ]
        .join(" ")
        .toLowerCase();

      const matchSearch = joined.includes(search.toLowerCase());
      const matchStatus = statusFilter === "all" ? true : item.status === statusFilter;
      const matchType =
        contractTypeFilter === "all" ? true : item.contract_type === contractTypeFilter;
      const matchSignedMonth =
        !signedMonthFilter ? true : toDateInputValue(item.signed_date).startsWith(signedMonthFilter);

      return matchSearch && matchStatus && matchType && matchSignedMonth;
    });
  }, [contracts, parties, search, statusFilter, contractTypeFilter, signedMonthFilter]);

  const selectedContract = useMemo(
    () => contracts.find((item) => item.contract_id === selectedContractId) || null,
    [contracts, selectedContractId]
  );

  return (
    <div>
      <SectionHeader
        title="Hợp đồng"
        actions={
          canCreateOperationalRecord(currentUser) ? (
            <PrimaryButton
              onClick={() => {
                setSelectedContractId(null);
                setFormMode("create");
                setFormOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Thêm hợp đồng
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
                  placeholder="Tìm theo số hợp đồng, tên hợp đồng, đối tác..."
                  className="pl-9 rounded-2xl"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {contractStatusOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={contractTypeFilter}
                onValueChange={(value) => setContractTypeFilter(value as "all" | ContractType)}
              >
                <SelectTrigger className="w-full rounded-2xl">
                  <SelectValue placeholder="Loại hợp đồng" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả loại</SelectItem>
                  {contractTypeOptions.map((item) => (
                    <SelectItem key={item.value} value={item.value}>
                      {item.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="month"
                value={signedMonthFilter}
                onChange={(e) => setSignedMonthFilter(e.target.value)}
                className="w-full rounded-2xl"
              />
            </div>
          </div>

          <Table className="table-fixed">
            <TableHeader>
              <TableRow>
                <TableHead>Số hợp đồng</TableHead>
                <TableHead className="w-[260px]">Tên hợp đồng</TableHead>
                <TableHead className="w-[240px]">Đối tác</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Tổng giá trị</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {rows.map((item) => {
                const party = parties.find((p) => p.party_id === item.party_id);

                const canEditItem = canEditOwnOperationalRecord({
                  user: currentUser,
                  createdByName: item.created_by_name,
                  status: item.status,
                });

                const canDeleteItem = canDeleteOwnOperationalRecord({
                  user: currentUser,
                  createdByName: item.created_by_name,
                  status: item.status,
                });

                return (
                  <TableRow key={item.contract_id}>
                    <TableCell className="font-medium">{item.contract_number}</TableCell>
                    <TableCell className="max-w-0">
                      <TruncatedHoverText text={item.title} widthClass="max-w-[240px]" />
                    </TableCell>
                    <TableCell className="max-w-0">
                      <TruncatedHoverText text={party?.name || "—"} widthClass="max-w-[220px]" />
                    </TableCell>
                    <TableCell>{optionLabel(contractTypeOptions, item.contract_type)}</TableCell>
                    <TableCell>{formatCurrency(item.total_value)}</TableCell>
                    <TableCell>
                      <StatusBadge value={item.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <ActionDropdown
                        items={[
                          { value: "detail", label: "Xem chi tiết" },
                          ...(canEditItem ? [{ value: "edit", label: "Chỉnh sửa" }] : []),
                          ...(canEditItem ? [{ value: "payment", label: "Tạo thanh toán" }] : []),
                          ...(canEditItem ? [{ value: "invoice", label: "Tạo hóa đơn" }] : []),
                          ...(canDeleteItem ? [{ value: "delete", label: "Xóa" }] : []),
                        ]}
                        onAction={(action) => {
                          setSelectedContractId(item.contract_id);

                          if (action === "detail") {
                            setDetailOpen(true);
                            return;
                          }

                          if (action === "edit") {
                            setFormMode("edit");
                            setFormOpen(true);
                            return;
                          }

                          if (action === "payment") {
                            setPaymentOpen(true);
                            return;
                          }

                          if (action === "invoice") {
                            setInvoiceOpen(true);
                            return;
                          }

                          if (action === "delete") {
                            const confirmed = window.confirm(
                              `Bạn có chắc muốn xóa hợp đồng "${item.contract_number} • ${item.title}" không?\n\nThao tác này sẽ xóa luôn mục dịch vụ, booking, lịch thanh toán, payment, invoice và liên kết file của hợp đồng này trong dữ liệu giao diện hiện tại.`
                            );

                            if (!confirmed) return;

                            setDetailOpen(false);
                            setFormOpen(false);
                            setPaymentOpen(false);
                            setInvoiceOpen(false);
                            setSelectedContractId(null);
                            resetPaymentForm();
                            resetInvoiceForm();

                            onDeleteContract(item.contract_id);
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
        title={selectedContract ? `Chi tiết hợp đồng • ${selectedContract.contract_number}` : "Chi tiết hợp đồng"}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      >
        {selectedContract && (
          <ContractFullView
            contract={selectedContract}
            serviceItems={serviceItems}
            bookings={bookings}
            paymentSchedules={paymentSchedules}
            payments={payments}
            invoices={invoices}
            files={files}
            contractFileLinks={contractFileLinks}
            contents={contents}
            productions={productions}
            productionTasks={productionTasks}
            contentFileLinks={contentFileLinks}
            serviceItemContents={serviceItemContents}
            productionFileLinks={productionFileLinks}
            serviceItemProductions={serviceItemProductions}
            channels={channels}
            onEditPayment={openEditPayment}
            onDeletePayment={onDeletePayment}
            onEditInvoice={openEditInvoice}
            onDeleteInvoice={onDeleteInvoice}
          />
        )}
      </DetailDrawer>

      <ContractFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        initialContract={selectedContract}
        parties={parties}
        serviceItemRows={serviceItems}
        bookingRows={bookings}
        paymentScheduleRows={paymentSchedules}
        files={files}
        contractFileLinks={contractFileLinks}
        channels={channels}
        studios={studios}
        onSaveContract={onSaveContract}
        onImportContract={onImportContract}
      />

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{paymentMode === "edit" ? "Chỉnh sửa thanh toán" : "Tạo thanh toán"}</DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-slate-600">
                Hợp đồng:{" "}
                <span className="font-medium text-slate-900">
                  {selectedContract.contract_number} • {selectedContract.title}
                </span>
              </div>

              <FieldBlock label="Chọn đợt thanh toán">
                <EnumSelect
                  value={paymentForm.payment_schedule_id}
                  onChange={(v) => setPaymentForm((prev) => ({ ...prev, payment_schedule_id: v }))}
                  options={paymentSchedules
                    .filter((item) => item.contract_id === selectedContract.contract_id)
                    .map((item) => ({
                      value: item.payment_schedule_id,
                      label: `Đợt ${item.installment_no} • ${item.due_date}`,
                    }))}
                />
              </FieldBlock>

              <div className="grid items-start gap-4 md:grid-cols-2">
                <FieldBlock label="Ngày thanh toán">
                  <Input
                    type="date"
                    value={paymentForm.paid_date}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, paid_date: e.target.value }))}
                  />
                </FieldBlock>

                <FieldBlock label="Số tiền thanh toán">
                  <Input
                    type="number"
                    min={1}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                    onBlur={(e) => setPaymentForm((prev) => ({ ...prev, amount: normalizeMin1(e.target.value) }))}
                  />
                </FieldBlock>
              </div>

              <FieldBlock label="Phương thức thanh toán">
                <EnumSelect
                  value={paymentForm.method}
                  onChange={(v) => setPaymentForm((prev) => ({ ...prev, method: v }))}
                  options={paymentMethodOptions}
                />
              </FieldBlock>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                setPaymentOpen(false);
                resetPaymentForm();
              }}
            >
              Hủy
            </Button>
            <PrimaryButton onClick={handleSavePayment}>Lưu payment</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="rounded-2xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{invoiceMode === "edit" ? "Chỉnh sửa hóa đơn" : "Tạo hóa đơn"}</DialogTitle>
          </DialogHeader>

          {selectedContract && (
            <div className="space-y-4 py-2">
              <div className="text-sm text-slate-600">
                Hợp đồng:{" "}
                <span className="font-medium text-slate-900">
                  {selectedContract.contract_number} • {selectedContract.title}
                </span>
              </div>

              <div className="grid items-start gap-4 md:grid-cols-2">
                <FieldBlock label="Số hóa đơn">
                  <Input
                    value={invoiceForm.invoice_number}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, invoice_number: e.target.value }))}
                  />
                </FieldBlock>

                <FieldBlock label="Ngày phát hành">
                  <Input
                    type="date"
                    value={invoiceForm.issue_date}
                    onChange={(e) => handleInvoiceIssueDateChange(e.target.value)}
                  />
                </FieldBlock>

                <FieldBlock label="Tổng tiền hóa đơn">
                  <Input
                    type="number"
                    value={invoiceForm.total_amount}
                    onChange={(e) => setInvoiceForm((prev) => ({ ...prev, total_amount: e.target.value }))}
                  />
                </FieldBlock>

                <FieldBlock label="Trạng thái hóa đơn">
                  <Input value={invoiceForm.issue_date ? "Đã phát hành" : "Nháp"} readOnly />
                </FieldBlock>
              </div>

              <div className="space-y-3">
                <div className="mb-1 text-sm font-semibold text-slate-700">File hóa đơn</div>

                <div>
                  <Input
                    type="file"
                    multiple
                    onChange={(e) =>
                      setInvoiceLocalFiles(Array.from(e.target.files ?? []))
                    }
                  />
                </div>

                <div className="rounded-2xl border border-dashed p-4 text-sm text-slate-500">
                  {invoiceLocalFiles.length > 0
                    ? `Đã chọn ${invoiceLocalFiles.length} file hóa đơn.`
                    : "Chưa chọn file hóa đơn nào."}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              className="rounded-2xl"
              onClick={() => {
                setInvoiceOpen(false);
                resetInvoiceForm();
              }}
            >
              Hủy
            </Button>
            <PrimaryButton onClick={handleSaveInvoice}>Lưu hóa đơn</PrimaryButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}