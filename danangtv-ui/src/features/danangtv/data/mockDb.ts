import type {
  SessionUser,
  PartyView,
  EmployeeView,
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
  BroadcastScheduleRow,
  StudioRentalRow,
  StudioUsageRow,
  LinkedFileSeedRow,
  ServiceItemContentRow,
  ServiceItemProductionRow,
} from "@/features/danangtv/types";


const sessionUserSeed: SessionUser = {
  user_id: "USR001",
  username: "nguyen.minh",
  employee_code: "NV112001",
  role: "manager",
  status: "active",
  employee_id: "EMP001",
  employee_name: "Nguyễn Minh",
};

const employeesSeed: EmployeeView[] = [
  {
    employee_id: "EMP001",
    employee_code: "NV112001",
    name: "Nguyễn Minh",
    gender: "male",
    department: "administration",
    position: "Quản lý",
    phone_number: "0905000001",
    email: "nguyen.minh@danangtv.vn",
    address: "Đà Nẵng",
    status: "active",
  },
  {
    employee_id: "EMP002",
    employee_code: "NV112002",
    name: "Lê Thảo",
    gender: "female",
    department: "finance_services",
    position: "Chuyên viên",
    phone_number: "0905000002",
    email: "le.thao@danangtv.vn",
    address: "Đà Nẵng",
    status: "active",
  },
  {
    employee_id: "EMP003",
    employee_code: "NV112003",
    name: "Trần An",
    gender: "male",
    department: "finance_services",
    position: "Chuyên viên",
    phone_number: "0905000003",
    email: "tran.an@danangtv.vn",
    address: "Đà Nẵng",
    status: "active",
  },
  {
    employee_id: "EMP004",
    employee_code: "NV113001",
    name: "Hà Phương",
    gender: "female",
    department: "television",
    position: "Producer",
    phone_number: "0905000004",
    email: "ha.phuong@danangtv.vn",
    address: "Đà Nẵng",
    status: "active",
  },
  {
    employee_id: "EMP005",
    employee_code: "NV114001",
    name: "Ngọc Anh",
    gender: "female",
    department: "digital_media",
    position: "Biên tập viên",
    phone_number: "0905000005",
    email: "ngoc.anh@danangtv.vn",
    address: "Đà Nẵng",
    status: "active",
  },
];

const partiesSeed: PartyView[] = [
  {
    party_id: "PAR001",
    party_type: "customer",
    name: "Công ty Viettel Construction",
    customer_type: "corporate",
    company: "Viettel Construction",
    phone_number: "0905000001",
    email: "contact@viettelconstruction.vn",
    address: "Đà Nẵng",
    account_number: "0123456789",
    bank: "Vietcombank",
    tax_code: "0100109106",
    notes: "",
  },
  {
    party_id: "PAR002",
    party_type: "customer",
    customer_type: "corporate",
    name: "Sở Du lịch Đà Nẵng",
    company: "Sở Du lịch Đà Nẵng",
    phone_number: "0905000002",
    email: "dulich@danang.gov.vn",
    address: "Đà Nẵng",
    notes: "",
  },
  {
    party_id: "PAR003",
    party_type: "partner",
    name: "Công ty Truyền thông A+",
    company: "A+ Media",
    phone_number: "0905000003",
    email: "partner@aplus.vn",
    address: "TP. Hồ Chí Minh",
    notes: "",
  },
];

const channelsSeed: ChannelView[] = [
  {
    channel_id: "CH001",
    code: "DNRT1",
    name: "Kênh truyền hình DNRT1",
    platform: "television",
    metadata: "Kênh truyền hình chính",
  },
  {
    channel_id: "CH002",
    code: "DNRT2",
    name: "Kênh truyền hình DNRT2",
    platform: "television",
    metadata: "Kênh truyền hình thứ 2",
  },
  {
    channel_id: "CH003",
    code: "FM98.5",
    name: "Kênh phát thanh FM 98.5",
    platform: "radio",
    metadata: "Kênh phát thanh FM",
  },
  {
    channel_id: "CH004",
    code: "DANANGTV-WEB",
    name: "Báo điện tử / Website",
    platform: "electronic",
    metadata: "Trang báo điện tử",
  },
  {
    channel_id: "CH005",
    code: "DANANGTV-FB",
    name: "Facebook DanangTV",
    platform: "digital",
    metadata: "Kênh mạng xã hội Facebook",
  },
];

const studiosSeed: StudioView[] = [
  {
    studio_id: "STD001",
    name: "Studio A",
    location: "Tầng 2",
    size: 120,
    capacity: 40,
    notes: "Studio chính",
  },
  {
    studio_id: "STD002",
    name: "Studio B",
    location: "Tầng 3",
    size: 80,
    capacity: 20,
    notes: "Studio phụ",
  },
];

const studioRentalsSeed: StudioRentalRow[] = [
  {
    rental_id: "RTL001",
    service_item_id: "SI004",
    contract_id: "CT001",
    studio_id: "STD001",
    rental_type: "standard",
    rental_start: "2026-04-05T08:00",
    rental_end: "2026-04-05T12:00",
    notes: "Thuê studio quay talkshow",
  },
];

const studioUsageSchedulesSeed: StudioUsageRow[] = [
  {
    usage_schedule_id: "USG001",
    studio_id: "STD001",
    production_id: "PR001",
    rental_id: undefined,
    usage_start: "2026-03-27T08:00",
    usage_end: "2026-03-27T11:30",
    status: "approved",
    approved_by: "USR001",
    approved_by_name: "Nguyễn Minh",
    approved_at: "2026-03-26T17:30",
    notes: "Ghi hình phóng sự",
    created_by_name: "Nguyễn Minh",
  },
  {
    usage_schedule_id: "USG002",
    studio_id: "STD001",
    production_id: undefined,
    rental_id: "RTL001",
    usage_start: "2026-04-05T08:00",
    usage_end: "2026-04-05T12:00",
    status: "planned",
    approved_by: undefined,
    approved_by_name: undefined,
    approved_at: undefined,
    notes: "Sử dụng studio theo lịch thuê",
    created_by_name: "Lê Thảo",
  },
];

const filesSeed: FileRow[] = [
  {
    file_id: "FL001",
    file_name: "hop_dong_viettel_2026.pdf",
    storage_path: "/contracts/2026/hop_dong_viettel_2026.pdf",
    file_extension: "pdf",
    file_size: 245760,
    folder: "contracts",
    uploaded_by_name: "Nguyễn Minh",
    uploaded_at: "2026-03-01 09:10",
    notes: "Hợp đồng chính",
  },
  {
    file_id: "FL002",
    file_name: "phu_luc_viettel_2026.pdf",
    storage_path: "/contracts/2026/phu_luc_viettel_2026.pdf",
    file_extension: "pdf",
    file_size: 102400,
    folder: "contracts",
    uploaded_by_name: "Nguyễn Minh",
    uploaded_at: "2026-03-01 09:20",
  },
  {
    file_id: "FL003",
    file_name: "hoa_don_hop_dong_001.pdf",
    storage_path: "/invoices/2026/hoa_don_hop_dong_001.pdf",
    file_extension: "pdf",
    file_size: 128000,
    folder: "invoices",
    uploaded_by_name: "Nguyễn Minh",
    uploaded_at: "2026-03-28 14:00",
  },
  {
    file_id: "FL004",
    file_name: "tvc_viettel_master.mp4",
    storage_path: "/general/2026/tvc_viettel_master.mp4",
    file_extension: "mp4",
    file_size: 15728640,
    folder: "general",
    uploaded_by_name: "Lê Thảo",
    uploaded_at: "2026-03-10 10:45",
  },
  {
    file_id: "FL005",
    file_name: "spot_radio_sukien_v1.wav",
    storage_path: "/productions/2026/spot_radio_sukien_v1.wav",
    file_extension: "wav",
    file_size: 5242880,
    folder: "productions",
    uploaded_by_name: "Ngọc Anh",
    uploaded_at: "2026-03-22 14:00",
  },
  {
    file_id: "FL006",
    file_name: "storyboard_phong_su.pdf",
    storage_path: "/productions/2026/storyboard_phong_su.pdf",
    file_extension: "pdf",
    file_size: 307200,
    folder: "productions",
    uploaded_by_name: "Hà Phương",
    uploaded_at: "2026-03-20 08:30",
  },
];

const contractsSeed: ContractRow[] = [
  { contract_id: "CT001", contract_number: "HD-2026-001", title: "Phát sóng TVC Viettel Construction", party_id: "PAR001", party_name: "Công ty Viettel Construction", contract_type: "service", signed_date: "2026-03-01", start_date: "2026-03-05", end_date: "2026-04-30", total_value: 250000000, status: "active", created_by_name: "Nguyễn Minh", file_ids: ["FL001", "FL002"] },
  { contract_id: "CT002", contract_number: "HD-2026-002", title: "Phát thanh radio giới thiệu sự kiện", party_id: "PAR002", party_name: "Sở Du lịch Đà Nẵng", contract_type: "service", signed_date: "2026-02-20", start_date: "2026-02-25", end_date: "2026-03-30", total_value: 85000000, status: "active", created_by_name: "Lê Thảo" },
  { contract_id: "CT003", contract_number: "HD-2026-003", title: "Mua bản quyền phóng sự chuyên đề", party_id: "PAR003", party_name: "Công ty Truyền thông A+", contract_type: "license_purchase", signed_date: "2026-01-12", start_date: "2026-01-15", end_date: "2026-03-15", total_value: 120000000, status: "completed", created_by_name: "Trần An" },
];

const serviceItemsSeed: ServiceItemRow[] = [
  { service_item_id: "SI001", contract_id: "CT001", contract_number: "HD-2026-001", title: "TVC Viettel DNRT1", service_type: "tv_ad", cost: 180000000, status: "planned" },
  { service_item_id: "SI002", contract_id: "CT001", contract_number: "HD-2026-001", title: "Banner digital bổ trợ", service_type: "digital_ad", cost: 70000000, status: "planned" },
  { service_item_id: "SI003", contract_id: "CT002", contract_number: "HD-2026-002", title: "Radio sự kiện du lịch", service_type: "radio_ad", cost: 85000000, status: "planned" },
  { service_item_id: "SI004", contract_id: "CT001", contract_number: "HD-2026-001", title: "Thuê Studio A quay talkshow", service_type: "studio_rental", cost: 20000000, status: "planned" },
];

const bookingsSeed: BookingRow[] = [
  { booking_id: "BK001", service_item_id: "SI001", contract_number: "HD-2026-001", service_item_title: "TVC Viettel DNRT1", service_type: "tv_ad", description: "Phát TVC 30s khung thời sự tối", channel_code: "DNRT1", start_date: "2026-03-28", end_date: "2026-04-15", time_slot: "19:00 - 19:30" },
  { booking_id: "BK002", service_item_id: "SI001", contract_number: "HD-2026-001", service_item_title: "TVC Viettel DNRT1", service_type: "tv_ad", description: "Phát TVC 30s khung sáng", channel_code: "DNRT2", start_date: "2026-03-29", end_date: "2026-04-20", time_slot: "07:00 - 07:30" },
  { booking_id: "BK003", service_item_id: "SI003", contract_number: "HD-2026-002", service_item_title: "Radio sự kiện du lịch", service_type: "radio_ad", description: "Spot radio 45s buổi sáng", channel_code: "FM98.5", start_date: "2026-03-30", end_date: "2026-04-10", time_slot: "07:15 - 07:30" },
];

const paymentSchedulesSeed: PaymentScheduleRow[] = [
  { payment_schedule_id: "PS001", contract_id: "CT001", contract_number: "HD-2026-001", installment_no: 1, due_date: "2026-03-30", planned_amount: 125000000, status: "planned" },
  { payment_schedule_id: "PS002", contract_id: "CT002", contract_number: "HD-2026-002", installment_no: 2, due_date: "2026-03-24", planned_amount: 30000000, status: "overdue" },
  { payment_schedule_id: "PS003", contract_id: "CT003", contract_number: "HD-2026-003", installment_no: 1, due_date: "2026-02-10", planned_amount: 120000000, status: "paid" },
];

const paymentsSeed: PaymentRow[] = [
  { payment_id: "PAY001", payment_schedule_id: "PS003", contract_number: "HD-2026-003", paid_date: "2026-02-10", amount: 120000000, method: "bank_transfer", created_by_name: "Trần An" },
  { payment_id: "PAY002", payment_schedule_id: "PS001", contract_number: "HD-2026-001", paid_date: "2026-03-26", amount: 50000000, method: "bank_transfer", created_by_name: "Nguyễn Minh" },
];

const invoicesSeed: InvoiceRow[] = [
  { invoice_id: "INV001", invoice_number: "0000001", contract_id: "CT003", contract_number: "HD-2026-003", issue_date: "2026-02-11", total_amount: 120000000, status: "issued", created_by_name: "Trần An" },
  { invoice_id: "INV002", invoice_number: "0000002", contract_id: "CT001", contract_number: "HD-2026-001", issue_date: "2026-03-28", total_amount: 250000000, status: "draft", created_by_name: "Nguyễn Minh", file_ids: ["FL003"] },
];

const productionTasksSeed: ProductionTaskRow[] = [ 
  { task_id: "PT001", production_id: "PR001", employee_id: "EMP004", employee_name: "Hà Phương", department: "television", role_label: "Producer" }, 
  { task_id: "PT002", production_id: "PR001", employee_id: "EMP005", employee_name: "Ngọc Anh", department: "digital_media", role_label: "Biên tập" }, 
  { task_id: "PT003", production_id: "PR002", employee_id: "EMP005", employee_name: "Ngọc Anh", department: "digital_media", role_label: "Dựng hậu kỳ" }, 
];

const productionsSeed: ProductionRow[] = [
  { production_id: "PR001", service_item_id: "SI001", contract_id: "CT001", name: "Sản xuất phóng sự xây dựng đô thị", type: "service", start_date: "2026-03-20", end_date: "2026-03-28", producer_name: "Hà Phương", status: "in_progress", created_by_name: "Nguyễn Minh", file_ids: ["FL005", "FL006"] },
  { production_id: "PR002", name: "Dựng clip giới thiệu lễ hội biển", type: "internal", start_date: "2026-03-18", end_date: "2026-03-26", producer_name: "Ngọc Anh", status: "done", created_by_name: "Nguyễn Minh", file_ids: ["FL005"] },
];

const contentsSeed: ContentRow[] = [
  { content_id: "CO001", title: "TVC Viettel 30s bản duyệt", type: "video", source: "customer_provided", status: "approved", approved_by_name: "Nguyễn Minh", created_by_name: "Lê Thảo", linked_service_label: "HD-2026-001 / TVC Viettel DNRT1", file_ids: ["FL004"] },
  { content_id: "CO002", title: "Spot radio giới thiệu sự kiện", type: "audio", source: "produced", status: "editing", created_by_name: "Ngọc Anh", linked_service_label: "HD-2026-002 / Radio sự kiện du lịch", file_ids: ["FL005"] },
  { content_id: "CO003", title: "Phóng sự chuyên đề đã mua bản quyền", type: "video", source: "licensed", status: "approved", approved_by_name: "Nguyễn Minh", created_by_name: "Trần An", file_ids: ["FL004"] },
  { content_id: "CO004", title: "Bản nháp infographic", type: "image", source: "produced", status: "draft", created_by_name: "Ngọc Anh", file_ids: ["FL006"] },
];

const schedulesSeed: BroadcastScheduleRow[] = [
  {
    broadcast_id: "SC001",
    program_name: "TVC Viettel 30s",
    schedule_type: "broadcast",
    schedule_mode: "recorded_broadcast",
    service_item_id: "SI001",
    booking_id: "BK001",
    channel_code: "DNRT1",
    content_id: "CO001",
    content_title: "TVC Viettel 30s bản duyệt",
    scheduled_start: "2026-03-29T08:00",
    scheduled_end: "2026-03-29T08:30",
    status: "approved",
    approved_by: "USR001",
    approved_by_name: "Nguyễn Minh",
    approved_at: "2026-03-28T16:00",
    created_by_name: "Lê Thảo",
    contract_number: "HD-2026-001",
    notes: "Phát trong khung quảng cáo buổi sáng",
  },
  {
    broadcast_id: "SC002",
    program_name: "Phóng sự chuyên đề",
    schedule_type: "broadcast",
    schedule_mode: "recorded_broadcast",
    service_item_id: undefined,
    booking_id: undefined,
    channel_code: "DNRT1",
    content_id: "CO003",
    content_title: "Phóng sự chuyên đề đã mua bản quyền",
    scheduled_start: "2026-03-29T18:30",
    scheduled_end: "2026-03-29T19:00",
    status: "planned",
    approved_by: undefined,
    approved_by_name: undefined,
    approved_at: undefined,
    created_by_name: "Trần An",
    contract_number: undefined,
    notes: "Phát trong khung chuyên đề buổi tối",
  },
  {
    broadcast_id: "SC003",
    program_name: "TVC Viettel 30s",
    schedule_type: "broadcast",
    schedule_mode: "recorded_broadcast",
    service_item_id: "SI001",
    booking_id: "BK002",
    channel_code: "DNRT2",
    content_id: "CO001",
    content_title: "TVC Viettel 30s bản duyệt",
    scheduled_start: "2026-03-29T19:15",
    scheduled_end: "2026-03-29T19:45",
    status: "planned",
    approved_by: undefined,
    approved_by_name: undefined,
    approved_at: undefined,
    created_by_name: "Lê Thảo",
    contract_number: "HD-2026-001",
    notes: "Phát theo booking tối trên DNRT2",
  },
];

const contractFileLinksSeed: LinkedFileSeedRow[] = [
  { id: "CFL001", parent_id: "CT001", file_id: "FL001", file_role: "Hợp đồng chính", is_main: true, notes: "", },
  { id: "CFL002", parent_id: "CT001", file_id: "FL002", file_role: "Phụ lục hợp đồng", is_main: false, notes: "", },
];

const productionFileLinksSeed: LinkedFileSeedRow[] = [
  { id: "PFL001", parent_id: "PR001", file_id: "FL005", file_role: "File audio dựng", is_main: true, notes: "", },
  { id: "PFL002", parent_id: "PR001", file_id: "FL006", file_role: "Storyboard", is_main: false, notes: "", },
];

const contentFileLinksSeed: LinkedFileSeedRow[] = [
  { id: "COFL001", parent_id: "CO001", file_id: "FL004", file_role: "File master", is_main: true, notes: "", },
  { id: "COFL002", parent_id: "CO004", file_id: "FL006", file_role: "File thiết kế nháp", is_main: true, notes: "", },
];

const serviceItemContentsSeed: ServiceItemContentRow[] = [];

const serviceItemProductionsSeed: ServiceItemProductionRow[] = [];

export const initialMockDb = {
  sessionUser: sessionUserSeed,
  employees: employeesSeed,
  parties: partiesSeed,
  channels: channelsSeed,
  studios: studiosSeed,
  studioRentals: studioRentalsSeed,
  studioUsageSchedules: studioUsageSchedulesSeed,
  files: filesSeed,

  contracts: contractsSeed,
  serviceItems: serviceItemsSeed,
  bookings: bookingsSeed,
  paymentSchedules: paymentSchedulesSeed,
  payments: paymentsSeed,
  invoices: invoicesSeed,

  productionTasks: productionTasksSeed,
  productions: productionsSeed,

  contents: contentsSeed,
  schedules: schedulesSeed,

  contractFileLinks: contractFileLinksSeed,
  productionFileLinks: productionFileLinksSeed,
  contentFileLinks: contentFileLinksSeed,
  
  serviceItemContents: serviceItemContentsSeed,
  serviceItemProductions: serviceItemProductionsSeed,
};
