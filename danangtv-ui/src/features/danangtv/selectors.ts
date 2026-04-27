import type {
  BookingRow,
  BroadcastScheduleRow,
  ChannelView,
  ContentRow,
  DraftLinkedFile,
  DraftPaymentSchedule,
  DraftServiceItem,
  FileRow,
  Folder,
  LinkedFileSeedRow,
  PaymentScheduleRow,
  ServiceItemRow,
  ServiceType,
  StudioRentalRow,
  StudioUsageRow,
  StudioView,
  ContractRow,
  ProductionRow,
  ContentType,
  RentalType,
  PrintedContentType,
  PrintedArea,
  PrintedColor,
  ElectronicSubtype,
  ElectronicContentType,
  ElectronicForm,
  TVBroadcastType,
  InsertType,
  TVProgram,
  RadioContentType,
  RadioProgram,
  DigitalContentType,
  TimePoint,
  BannerPosition,
  StudioUsageForm,
  BroadcastScheduleForm,
  ServiceItemContentRow,
  ContentForm
} from "./types";

import { createId } from "@/features/danangtv/utils/Helpers";


// Tạo một dòng file liên kết từ file đã có trong kho file
export function createDraftLinkedFileFromRepository(
  file: FileRow,
  overrides?: Partial<DraftLinkedFile>
): DraftLinkedFile {
  return {
    id: createId("LFILE"),
    file_id: file.file_id,
    file_name: file.file_name,
    storage_path: file.storage_path,
    folder: file.folder,
    file_role: "",
    is_main: false,
    notes: "",
    source: "repository",
    ...overrides,
  };
}

// Tạo một dòng file liên kết mới từ file local trước khi upload
export function createDraftLinkedFileFromLocal(
  file: File,
  folder: Folder
): DraftLinkedFile {
  return {
    id: createId("LFILE"),
    file_id: "",
    file_name: file.name,
    storage_path: "",
    folder,
    file_role: "",
    is_main: false,
    notes: "",
    source: "local",
    local_file: file,
  };
}

// Nếu chọn một file làm file chính thì các file còn lại sẽ tự bỏ chọn
export function normalizeMainFile(
  rows: DraftLinkedFile[],
  rowId: string,
  checked: boolean
) {
  if (!checked) {
    return rows.map((row) =>
      row.id === rowId ? { ...row, is_main: false } : row
    );
  }

  return rows.map((row) => ({
    ...row,
    is_main: row.id === rowId,
  }));
}

// Lấy danh sách file theo danh sách file_id
export function getFilesByIds(files: FileRow[], fileIds?: string[]) {
  if (!fileIds || fileIds.length === 0) return [];
  return files.filter((file) => fileIds.includes(file.file_id));
}

// Tạo danh sách draft file từ bảng liên kết file và bảng file, nếu không có liên kết nào thì sẽ tạo từ fallbackFileIds
export function buildDraftLinkedFilesFromLinks(
  files: FileRow[],
  links: LinkedFileSeedRow[],
  parentId: string,
  fallbackFileIds?: string[]
): DraftLinkedFile[] {
  const matchedLinks = links.filter((item) => item.parent_id === parentId);

  if (matchedLinks.length > 0) {
    return matchedLinks
      .map((link) => {
        const file = files.find((f) => f.file_id === link.file_id);
        if (!file) return null;

        return createDraftLinkedFileFromRepository(file, {
          id: link.id,
          file_role: link.file_role,
          is_main: link.is_main,
          notes: link.notes || "",
        });
      })
      .filter(Boolean) as DraftLinkedFile[];
  }

  return getFilesByIds(files, fallbackFileIds).map((file) =>
    createDraftLinkedFileFromRepository(file)
  );
}

// Tạo danh sách file đính kèm cho hợp đồng
export function buildDraftContractFiles(
  files: FileRow[],
  contractFileLinks: LinkedFileSeedRow[],
  contractId: string,
  fallbackFileIds?: string[]
) {
  return buildDraftLinkedFilesFromLinks(files, contractFileLinks, contractId, fallbackFileIds);
}

// Tạo danh sách file đính kèm cho sản xuất
export function buildDraftProductionFiles(
  files: FileRow[],
  productionFileLinks: LinkedFileSeedRow[],
  productionId: string,
  fallbackFileIds?: string[]
) {
  return buildDraftLinkedFilesFromLinks(files, productionFileLinks, productionId, fallbackFileIds);
}

// Tạo danh sách file đính kèm cho nội dung
export function buildDraftContentFiles(
  files: FileRow[],
  contentFileLinks: LinkedFileSeedRow[],
  contentId: string,
  fallbackFileIds?: string[]
) {
  return buildDraftLinkedFilesFromLinks(files, contentFileLinks, contentId, fallbackFileIds);
}


// ======================================================
//  Các hàm tìm kiếm, lọc và lấy dữ liệu liên quan
// ======================================================

// Tìm mục dịch vụ đang được liên kết với một nội dung
export function findLinkedServiceItemFromContent(
  serviceItems: ServiceItemRow[],
  content: ContentRow
) {
  return serviceItems.find(
    (item) =>
      content.linked_service_label === `${item.contract_number} / ${item.title}` ||
      content.linked_service_label === `${item.contract_number} • ${item.title}`
  );
}

// Lọc danh sách kênh phù hợp với từng loại dịch vụ.
export function getChannelsByServiceType(
  channels: ChannelView[],
  serviceType: ServiceType
) {
  if (serviceType === "tv_ad") return channels.filter((c) => c.platform === "television");
  if (serviceType === "radio_ad") return channels.filter((c) => c.platform === "radio");
  if (serviceType === "digital_ad") return channels.filter((c) => c.platform === "digital");
  if (serviceType === "electronic_ad") return channels.filter((c) => c.platform === "electronic");
  if (serviceType === "printed_ad") return channels.filter((c) => c.platform === "print");
  return channels;
}

// Lấy mã kênh từ channel_id hoặc từ code.
export function getChannelCode(channels: ChannelView[], channelIdOrCode?: string) {
  if (!channelIdOrCode) return "—";

  const byId = channels.find((item) => item.channel_id === channelIdOrCode);
  if (byId) return byId.code;

  const byCode = channels.find((item) => item.code === channelIdOrCode);
  if (byCode) return byCode.code;

  return channelIdOrCode;
}

// Lấy tên studio theo studio_id.
export function getStudioName(studios: StudioView[], studioId?: string) {
  return studios.find((item) => item.studio_id === studioId)?.name || "—";
}

// Lấy các mục dịch vụ của một hợp đồng có booking để lên lịch phát sóng
export function getScheduleableServiceItems(
  serviceItems: ServiceItemRow[],
  bookings: BookingRow[],
  contractId: string
) {
  return serviceItems.filter(
    (item) =>
      item.contract_id === contractId &&
      bookings.some((booking) => booking.service_item_id === item.service_item_id)
  );
}

// Lấy các mục dịch vụ thuê studio của một hợp đồng
export function getStudioRentalServiceItems(
  serviceItems: ServiceItemRow[],
  contractId: string
) {
  return serviceItems.filter(
    (item) => item.contract_id === contractId && item.service_type === "studio_rental"
  );
}



function parseTimeSlot(timeSlot?: string) {
  if (!timeSlot) return { startTime: "", endTime: "" };
  const parts = timeSlot.split("-").map((item) => item.trim());
  return {
    startTime: parts[0] || "",
    endTime: parts[1] || "",
  };
}

// Tạo booking mặc định theo từng loại dịch vụ.
function createDefaultBooking(serviceType: ServiceType, studios: StudioView[]) {
  if (serviceType === "printed_ad") {
    return {
      id: createId("PRT"),
      channel_id: "",
      content_type: "news" as PrintedContentType,
      area: "full_page" as PrintedArea,
      color: "color" as PrintedColor,
      start_date: "",
      end_date: "",
      num_issues: "1",
      notes: "",
    };
  }

  if (serviceType === "electronic_ad") {
    return {
      id: createId("ELE"),
      channel_id: "",
      subtype: "article" as ElectronicSubtype,
      content_type: "news" as ElectronicContentType,
      form: "retail" as ElectronicForm,
      quantity: "1",
      position: "1" as BannerPosition,
      has_video: false,
      has_link: false,
      start_date: "",
      end_date: "",
      notes: "",
    };
  }

  if (serviceType === "tv_ad") {
    return {
      id: createId("TV"),
      channel_id: "",
      broadcast_type: "advertisement" as TVBroadcastType,
      insert_type: "logo" as InsertType,
      program: "news" as TVProgram,
      time_point: "before" as TimePoint,
      start_time: "",
      end_time: "",
      start_date: "",
      end_date: "",
      num_broadcasts: "1",
      notes: "",
    };
  }

  if (serviceType === "radio_ad") {
    return {
      id: createId("RAD"),
      channel_id: "",
      content_type: "advertisement" as RadioContentType,
      program: "news" as RadioProgram,
      time_point: "before" as TimePoint,
      start_time: "",
      end_time: "",
      start_date: "",
      end_date: "",
      num_broadcasts: "1",
      notes: "",
    };
  }

  if (serviceType === "digital_ad") {
    return {
      id: createId("DIG"),
      channel_id: "",
      content_type: "banner" as DigitalContentType,
      post_date: "",
      start_date: "",
      end_date: "",
      quantity: "1",
      has_experiencer: false,
      notes: "",
    };
  }

  if (serviceType === "studio_rental") {
    return {
      id: createId("RTL"),
      studio_id: studios[0]?.studio_id || "",
      rental_type: "standard" as RentalType,
      rental_start: "",
      rental_end: "",
      notes: "",
    };
  }

  if (serviceType === "content_production") {
    return {
      id: createId("PROD"),
      content_type: "video" as ContentType,
      requirement_description: "",
      delivery_deadline: "",
      notes: "",
    };
  }

  return {
    id: createId("OTH"),
    description: "",
    start_date: "",
    end_date: "",
    notes: "",
  };
}

// Tạo một mục dịch vụ rỗng khi thêm mới hợp đồng
export function createEmptyServiceItem(studios: StudioView[]): DraftServiceItem {
  return {
    id: createId("SI"),
    title: "",
    service_type: "tv_ad",
    cost: "",
    status: "planned",
    notes: "",
    bookings: [createDefaultBooking("tv_ad", studios)],
  };
}

// Tạo một dòng lịch thanh toán rỗng
export function createEmptyPaymentSchedule(installmentNo = 1): DraftPaymentSchedule {
  return {
    id: createId("PS"),
    installment_no: String(installmentNo),
    due_date: "",
    planned_amount: "",
    status: "planned",
    notes: "",
  };
}

// Chuyển booking từ DB sang danh sách booking dùng trong form dịch vụ.
export function buildDraftBookingsForServiceItem(
  item: ServiceItemRow,
  bookings: BookingRow[],
  channels: ChannelView[],
  studios: StudioView[]
) {
  const rows = bookings.filter((booking) => booking.service_item_id === item.service_item_id);

  if (rows.length === 0) {
    return [createDefaultBooking(item.service_type, studios)];
  }

  return rows.map((booking) => {
    const detail = booking.detail_data || {};
    const channelId =
      channels.find((c) => c.code === (detail.channel_code || booking.channel_code))?.channel_id || "";

    const { startTime, endTime } = parseTimeSlot(
      detail.start_time && detail.end_time
        ? `${detail.start_time} - ${detail.end_time}`
        : booking.time_slot
    );

    if (item.service_type === "tv_ad") {
      return {
        id: booking.booking_id,
        channel_id: channelId,
        broadcast_type: detail.broadcast_type || "advertisement",
        insert_type: detail.insert_type || "logo",
        program: detail.program || "news",
        time_point: detail.time_point || "before",
        start_time: detail.start_time || startTime,
        end_time: detail.end_time || endTime,
        start_date: detail.start_date || booking.start_date || "",
        end_date: detail.end_date || booking.end_date || "",
        num_broadcasts: String(detail.num_broadcasts || "1"),
        notes: detail.notes || booking.notes || "",
      };
    }

    if (item.service_type === "radio_ad") {
      return {
        id: booking.booking_id,
        channel_id: channelId,
        content_type: detail.content_type || "advertisement",
        program: detail.program || "news",
        time_point: detail.time_point || "before",
        start_time: detail.start_time || startTime,
        end_time: detail.end_time || endTime,
        start_date: detail.start_date || booking.start_date || "",
        end_date: detail.end_date || booking.end_date || "",
        num_broadcasts: String(detail.num_broadcasts || "1"),
        notes: detail.notes || booking.notes || "",
      };
    }

    if (item.service_type === "digital_ad") {
      return {
        id: booking.booking_id,
        channel_id: channelId,
        content_type: detail.content_type || "banner",
        post_date: detail.post_date || "",
        start_date: detail.start_date || booking.start_date || "",
        end_date: detail.end_date || booking.end_date || "",
        quantity: String(detail.quantity || "1"),
        has_experiencer: !!detail.has_experiencer,
        notes: detail.notes || booking.notes || "",
      };
    }

    if (item.service_type === "electronic_ad") {
      return {
        id: booking.booking_id,
        channel_id: channelId,
        subtype: detail.subtype || "article",
        content_type: detail.content_type || "news",
        form: detail.form || "retail",
        quantity: String(detail.quantity || "1"),
        position: detail.position || "1",
        has_video: !!detail.has_video,
        has_link: !!detail.has_link,
        start_date: detail.start_date || booking.start_date || "",
        end_date: detail.end_date || booking.end_date || "",
        notes: detail.notes || booking.notes || "",
      };
    }

    if (item.service_type === "printed_ad") {
      return {
        id: booking.booking_id,
        channel_id: channelId,
        content_type: detail.content_type || "news",
        area: detail.area || "full_page",
        color: detail.color || "color",
        start_date: detail.start_date || booking.start_date || "",
        end_date: detail.end_date || booking.end_date || "",
        num_issues: String(detail.num_issues || "1"),
        notes: detail.notes || booking.notes || "",
      };
    }

    if (item.service_type === "studio_rental") {
      const studioId =
        studios.find((studio) => studio.name === detail.studio_name)?.studio_id || "";

      return {
        id: booking.booking_id,
        studio_id: studioId,
        rental_type: detail.rental_type || "standard",
        rental_start: detail.rental_start || "",
        rental_end: detail.rental_end || "",
        notes: detail.notes || booking.notes || "",
      };
    }

    if (item.service_type === "content_production") {
      return {
        id: booking.booking_id,
        content_type: detail.content_type || "video",
        requirement_description: detail.requirement_description || "",
        delivery_deadline: detail.delivery_deadline || booking.end_date || "",
        notes: detail.notes || booking.notes || "",
      };
    }

    return {
      id: booking.booking_id,
      description: detail.description || booking.description || "",
      start_date: detail.start_date || booking.start_date || "",
      end_date: detail.end_date || booking.end_date || "",
      notes: detail.notes || booking.notes || "",
    };
  });
}

// Chuyển danh sách mục dịch vụ của hợp đồng sang dữ liệu form
export function buildDraftServiceItems(
  serviceItems: ServiceItemRow[],
  bookings: BookingRow[],
  channels: ChannelView[],
  studios: StudioView[],
  contractId: string
): DraftServiceItem[] {
  const rows = serviceItems.filter((item) => item.contract_id === contractId);

  if (rows.length === 0) return [createEmptyServiceItem(studios)];

  return rows.map((item) => ({
    id: item.service_item_id,
    title: item.title,
    service_type: item.service_type,
    cost: String(item.cost ?? ""),
    status: item.status,
    notes: item.notes || "",
    bookings: buildDraftBookingsForServiceItem(item, bookings, channels, studios),
  }));
}

// Chuyển lịch thanh toán của hợp đồng sang dữ liệu form 
export function buildDraftPaymentSchedules(
  paymentSchedules: PaymentScheduleRow[],
  contractId: string
): DraftPaymentSchedule[] {
  const rows = paymentSchedules.filter((item) => item.contract_id === contractId);

  if (rows.length === 0) return [createEmptyPaymentSchedule(1)];

  return rows.map((item) => ({
    id: item.payment_schedule_id,
    installment_no: String(item.installment_no ?? 1),
    due_date: item.due_date || "",
    planned_amount: String(item.planned_amount ?? ""),
    status: item.status,
    notes: item.notes || "",
  }));
}

// Tạo dữ liệu form cho nội dung từ dữ liệu DB và các bảng liên quan
export function buildContentFormData(
  contracts: ContractRow[],
  serviceItems: ServiceItemRow[],
  serviceItemContents: ServiceItemContentRow[],
  content: ContentRow
): ContentForm {
  const linkedRows = serviceItemContents
    .filter((row) => row.content_id === content.content_id)
    .map((row, index) => {
      const linkedService =
        serviceItems.find((item) => item.service_item_id === row.service_item_id) || null;

      const linkedContract = linkedService
        ? contracts.find((item) => item.contract_id === linkedService.contract_id)
        : null;

      return {
        id: `${content.content_id}-${index}`,
        contract_search: linkedContract
          ? `${linkedContract.contract_number} • ${linkedContract.title}`
          : "",
        selected_contract_id: linkedContract?.contract_id || "",
        selected_service_item_id: linkedService?.service_item_id || "",
      };
    });

  return {
    title: content.title || "",
    type: content.type || "video",
    source: content.source || "customer_provided",
    status: content.status || "draft",
    service_links:
      linkedRows.length > 0
        ? linkedRows
        : [
            {
              id: "new-link",
              contract_search: "",
              selected_contract_id: "",
              selected_service_item_id: "",
            },
          ],
    selected_file_ids: content.file_ids || [],
    notes: (content as any).notes || "",
    file_search: "",
    folder_filter: "all",
  };
}

// Tạo dữ liệu form cho lịch phát sóng từ dữ liệu DB và các bảng liên quan
export function buildBroadcastScheduleFormData(
  contracts: ContractRow[],
  channels: ChannelView[],
  schedule: BroadcastScheduleRow
): BroadcastScheduleForm {
  const linkedContract = contracts.find(
    (item) => item.contract_number === schedule.contract_number
  );

  const linkedChannel = channels.find((item) => item.code === schedule.channel_code);

  return {
    schedule_source: schedule.service_item_id ? "service" : "general",

    program_name: schedule.program_name || "",

    schedule_type: schedule.schedule_type || "broadcast",
    schedule_mode: schedule.schedule_mode || "other",

    contract_search: linkedContract
      ? `${linkedContract.contract_number} • ${linkedContract.title}`
      : "",
    selected_contract_id: linkedContract?.contract_id || "",

    channel_id: linkedChannel?.channel_id || "",
    service_item_id: schedule.service_item_id || "",
    booking_id: schedule.booking_id || "",

    content_id: schedule.content_id || "",
    content_search: schedule.content_title || "",

    scheduled_start: schedule.scheduled_start
      ? schedule.scheduled_start.replace(" ", "T")
      : "",
    scheduled_end: schedule.scheduled_end
      ? schedule.scheduled_end.replace(" ", "T")
      : "",

    status: schedule.status || "planned",
    notes: schedule.notes || "",
  };
}

// Tạo dữ liệu form cho lịch sử sử dụng studio từ dữ liệu DB và các bảng liên quan
export function buildStudioUsageFormData(
  productions: ProductionRow[],
  studioRentals: StudioRentalRow[],
  contracts: ContractRow[],
  usage: StudioUsageRow
): StudioUsageForm {
  const linkedRental = usage.rental_id
    ? studioRentals.find((item) => item.rental_id === usage.rental_id)
    : null;

  const linkedProduction = usage.production_id
    ? productions.find((item) => item.production_id === usage.production_id)
    : null;

  const linkedContract = linkedRental
    ? contracts.find((item) => item.contract_id === linkedRental.contract_id)
    : null;

  return {
    source_mode: usage.rental_id ? "rental" : "production",
    production_search: linkedProduction ? linkedProduction.name : "",
    selected_production_id: linkedProduction?.production_id || "",
    contract_search: linkedContract
      ? `${linkedContract.contract_number} • ${linkedContract.title}`
      : "",
    selected_contract_id: linkedContract?.contract_id || "",
    selected_service_item_id: linkedRental?.service_item_id || "",
    selected_rental_id: linkedRental?.rental_id || "",
    studio_id: usage.studio_id || "",
    usage_start: usage.usage_start || "",
    usage_end: usage.usage_end || "",
    status: usage.status || "planned",
    notes: usage.notes || "",
  };
}

// Tạo mục dịch vụ theo loại dịch vụ  
export function createDefaultBookingByServiceType(
  serviceType: ServiceType,
  studios: StudioView[]
) {
  return createDefaultBooking(serviceType, studios);
}