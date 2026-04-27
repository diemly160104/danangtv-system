import type {
  SessionUser,
  EmployeeView,
  PartyView,
  ChannelView,
  StudioView,
  StudioRentalRow,
  StudioUsageRow,
  FileRow,
  ContractRow,
  ServiceItemRow,
  BookingRow,
  PaymentScheduleRow,
  PaymentRow,
  InvoiceRow,
  ProductionTaskRow,
  ProductionRow,
  ContentRow,
  BroadcastScheduleRow,
  LinkedFileSeedRow,
  ServiceItemContentRow,
  ServiceItemProductionRow,
} from "../types";

export type DanangTvDb = {
  sessionUser: SessionUser | null;
  employees: EmployeeView[];
  parties: PartyView[];
  channels: ChannelView[];
  studios: StudioView[];
  studioRentals: StudioRentalRow[];
  studioUsageSchedules: StudioUsageRow[];
  files: FileRow[];

  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  bookings: BookingRow[];
  paymentSchedules: PaymentScheduleRow[];
  payments: PaymentRow[];
  invoices: InvoiceRow[];

  productionTasks: ProductionTaskRow[];
  productions: ProductionRow[];

  contents: ContentRow[];
  schedules: BroadcastScheduleRow[];

  contractFileLinks: LinkedFileSeedRow[];
  productionFileLinks: LinkedFileSeedRow[];
  contentFileLinks: LinkedFileSeedRow[];

  serviceItemContents: ServiceItemContentRow[];
  serviceItemProductions: ServiceItemProductionRow[];
};

/**
 * Giai đoạn chuyển tiếp:
 * - loadDb(): dùng cho bootstrap dữ liệu ban đầu
 * - saveDb(): tạm vẫn giữ cho mock mode/localStorage
 *
 * Khi backend hoàn chỉnh, ta sẽ chuyển dần sang các method nghiệp vụ
 * như saveContract, saveContent, uploadFiles... thay vì saveDb nguyên khối.
 */
export type DanangTvDataSource = {
  loadDb(): Promise<DanangTvDb>;
  saveDb(nextDb: DanangTvDb): Promise<void>;
};