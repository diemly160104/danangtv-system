// 1. Các kiểu giá trị lựa chọn
export type UserRole = "manager" | "staff" | "technical_admin";
export type UserStatus = "active" | "inactive" | "locked";
export type Folder = "contracts" | "invoices" | "productions" | "general";
export type ContractType = "service" | "license_purchase" | "other";
export type ContractStatus = "draft" | "active" | "completed" | "cancelled";
export type ServiceType = "printed_ad" | "electronic_ad" | "tv_ad" | "radio_ad" | "digital_ad" | "studio_rental" | "content_production" | "other";
export type ServiceStatus = "planned" | "in_progress" | "done" | "cancelled";
export type PaymentScheduleStatus = "planned" | "partial" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "bank_transfer" | "cash" | "other";
export type InvoiceStatus = "draft" | "issued";
export type ProductionType = "service" | "internal";
export type ProductionStatus = "planned" | "in_progress" | "done" | "cancelled";
export type ContentType = "image" | "video" | "audio" | "text" | "other";
export type ContentSource = "customer_provided" | "licensed" | "produced" | "other";
export type ContentStatus = "draft" | "editing" | "approved" | "rejected";
export type ScheduleStatus = "planned" | "approved" | "completed" | "cancelled";
export type ScheduleType = "broadcast" | "publication";
export type ScheduleMode =
  | "live_broadcast"
  | "recorded_broadcast"
  | "rerun_broadcast"
  | "article_publication"
  | "program_publication"
  | "banner_publication"
  | "social_post"
  | "issue_release"
  | "other";
export type Platform = "television" | "radio" | "digital" | "print" | "electronic";
export type PartyType = "customer" | "partner" | "other";
export type CustomerType = "individual" | "corporate";
export type EmployeeDepartment = "administration" | "finance_services" | "engineering_tech" | "print_media" | "digital_media" | "news" | "television" | "radio" | "ethnic_affairs";
export type EmployeeStatus = "active" | "inactive" | "terminated";
export type Gender = "male" | "female";
export type PrintedContentType = "news" | "pr_article" | "special_page" | "section";
export type PrintedArea = "full_page" | "half_page" | "quarter_page" | "eighth_page" | "sixteenth_page" | "footer_logo";
export type PrintedColor = "black_white" | "color";
export type ElectronicSubtype = "article" | "program" | "banner";
export type ElectronicContentType = "news" | "article" | "talkshow" | "photo_video" | "reportage" | "infographic" | "e_magazine" | "long_form";
export type ElectronicForm = "retail" | "package";
export type TVBroadcastType = "advertisement" | "home_shopping" | "announcement" | "self_promotion" | "insert";
export type InsertType = "logo" | "ticker" | "popup" | "panel" | "corner_logo" | "transition";
export type TVProgram = "entertainment" | "entertainment_movie" | "good_morning" | "specialized_program" | "sports_news" | "news" | "360_motion" | "focus_24h" | "THVN_news" | "other";
export type RadioContentType = "advertisement" | "self_promotion";
export type RadioProgram = "news" | "health_talk" | "traffic_fm" | "specialized_program" | "da_nang_section" | "entertainment" | "other";
export type DigitalContentType = "image_post" | "video" | "livestream" | "video_shopping" | "link_share" | "banner";
export type RentalType = "standard" | "rehearsal";
export type TimePoint = "before" | "during" | "mid_break" | "after";
export type BannerPosition = "1" | "2" | "3" | "4" | "5" | "6" | "7";
export type NavKey = "dashboard" | "contracts" | "productions" | "contents" | "schedules" | "catalog";
export type DashboardDetailKey =  | "activeContracts"  | "upcomingPayments"  | "overduePayments"  | "pendingContents"  | "waitingSchedules"  | "activeProductions" | null;
export type CatalogSection =
  | "employees"
  | "parties"
  | "channels"
  | "studios"
  | "files"
  | null;
export type ScheduleTab = "broadcast" | "studio_usage";
export type StudioUsageSourceMode = "production" | "rental";


// 2. Kiểu dữ liệu cho option hiển thị, danh sách lựa chọn 

export type Option<T extends string> = { value: T; label: string };



// 3. Các kiểu dữ liệu chính của hệ thống (cấu trúc dữ liệu)

export type SessionUser = {
  user_id: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  employee_id?: string;
  employee_code?: string;
  employee_name?: string;
};

export type LoginForm = { username: string; password: string };

export type PartyView = {
  party_id: string;
  party_type: PartyType;
  name: string;
  customer_type?: CustomerType;
  company?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  account_number?: string;
  bank?: string;
  tax_code?: string;
  notes?: string;
};

export type EmployeeView = {
  employee_id: string;
  employee_code: string;
  name: string;
  gender: Gender;
  department: EmployeeDepartment;
  position?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  status: EmployeeStatus;
};

export type ChannelView = {
  channel_id: string;
  code: string;
  name: string;
  platform: Platform;
  metadata?: string;
};

export type FileRow = {
  file_id: string;
  file_name: string;
  storage_path: string;
  file_extension?: string;
  file_size?: number;
  folder: Folder;
  uploaded_by_name: string;
  uploaded_at: string;
  notes?: string;
};

export type StudioView = {
  studio_id: string;
  name: string;
  location?: string;
  size?: number;
  capacity?: number;
  notes?: string;
};

export type ContractRow = {
  contract_id: string;
  contract_number: string;
  title: string;
  party_id: string;
  party_name: string;
  contract_type: ContractType;
  signed_date: string;
  start_date: string;
  end_date?: string;
  total_value: number;
  status: ContractStatus;
  created_by_name: string;
  file_ids?: string[];
};

export type ServiceItemRow = {
  service_item_id: string;
  contract_id: string;
  contract_number: string;
  title: string;
  service_type: ServiceType;
  cost: number;
  status: ServiceStatus;
  notes?: string;
};

export type ServiceItemContentRow = {
  service_item_content_id: string;
  service_item_id: string;
  content_id: string;
  notes?: string;
};

export type BookingRow = {
  booking_id: string;
  service_item_id: string;
  contract_number: string;
  service_item_title: string;
  service_type: ServiceType;
  description: string;
  channel_code?: string;
  start_date?: string;
  end_date?: string;
  time_slot?: string;
  notes?: string;
  detail_data?: Record<string, any>;
};

export type PaymentScheduleRow = {
  payment_schedule_id: string;
  contract_id: string;
  contract_number: string;
  installment_no: number;
  due_date: string;
  planned_amount: number;
  status: PaymentScheduleStatus;
  notes?: string;
};

export type PaymentRow = {
  payment_id: string;
  payment_schedule_id: string;
  contract_number: string;
  paid_date: string;
  amount: number;
  method: PaymentMethod;
  created_by_name: string;
};

export type InvoiceRow = {
  invoice_id: string;
  invoice_number: string;
  contract_id: string;
  contract_number: string;
  issue_date: string;
  total_amount: number;
  status: InvoiceStatus;
  created_by_name: string;
  file_ids?: string[];
};

export type ProductionTaskRow = {
  task_id: string;
  production_id: string;
  employee_id: string;
  employee_code?: string;
  employee_name: string;
  department: EmployeeDepartment;
  role_label: string;
};

export type ProductionRow = {
  production_id: string;
  service_item_id?: string;
  contract_id?: string;
  name: string;
  type: ProductionType;
  genre?: string;
  duration_minutes?: number | null;
  start_date: string;
  end_date?: string;
  producer_name: string;
  status: ProductionStatus;
  created_by_name: string;
  file_ids?: string[];
  notes?: string;
};

export type ContentRow = {
  content_id: string;
  title: string;
  type: ContentType;
  source: ContentSource;
  status: ContentStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  created_by_name: string;
  linked_service_label?: string;
  file_ids?: string[];
  notes?: string;
};

export type BroadcastScheduleRow = {
  broadcast_id: string;
  program_name?: string;
  schedule_type: ScheduleType;
  schedule_mode: ScheduleMode;
  service_item_id?: string;
  booking_id?: string;
  channel_id?: string;
  channel_code: string;
  content_id?: string;
  content_title?: string;
  scheduled_start: string;
  scheduled_end?: string;
  status: ScheduleStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  created_by_name: string;
  contract_number?: string;
  notes?: string;
};

export type StudioRentalRow = {
  rental_id: string;
  service_item_id: string;
  contract_id: string;
  studio_id: string;
  rental_type: RentalType;
  rental_start: string;
  rental_end: string;
  notes?: string;
};

export type StudioUsageRow = {
  usage_schedule_id: string;
  studio_id: string;
  production_id?: string;
  rental_id?: string; 
  usage_start: string;
  usage_end: string;
  status: ScheduleStatus;
  approved_by?: string;
  approved_by_name?: string;
  approved_at?: string;
  notes?: string;
  created_by_name: string;
};

export type ServiceItemProductionRow = {
  service_production_id: string;
  service_item_id: string;
  production_id: string;
  notes?: string;
};



// 4. Các kiểu dữ liệu form, dữ liệu nháp và payload gửi API

export type ContractForm = {
  contract_number: string;
  title: string;
  party_id: string;
  contract_type: ContractType;
  signed_date: string;
  start_date: string;
  end_date: string;
  total_value: string;
  status: ContractStatus;
  service_title: string;
  service_type: ServiceType;
  service_cost: string;
  payment_installment_no: string;
  payment_due_date: string;
  payment_amount: string;
};

export type DraftServiceItem = {
  id: string;
  title: string;
  service_type: ServiceType;
  cost: string;
  status: ServiceStatus;
  notes: string;
  bookings: any[];
};

export type DraftPaymentSchedule = {
  id: string;
  installment_no: string;
  due_date: string;
  planned_amount: string;
  status: PaymentScheduleStatus;
  notes: string;
};

export type ProductionForm = {
  name: string;
  type: ProductionType;
  genre: string;
  duration_minutes: string;
  start_date: string;
  end_date: string;
  status: ProductionStatus;
  notes: string;
  producer_search: string;
  selected_producer_id: string;
  producer_department_filter: "all" | EmployeeDepartment;
  service_links: DraftProductionServiceLink[];
};

export type DraftProductionTask = {
  id: string;
  employee_search: string;
  employee_id: string;
  department_filter: EmployeeDepartment | "all";
  role_label: string;
};

export type DraftProductionServiceLink = {
  id: string;
  contract_search: string;
  selected_contract_id: string;
  selected_service_item_id: string;
};

export type ContentForm = {
  title: string;
  type: ContentType;
  source: ContentSource;
  status: ContentStatus;
  service_links: DraftContentServiceLink[];
  selected_file_ids: string[];
  notes: string;
  file_search: string;
  folder_filter: "all" | Folder;
};

export type DraftContentServiceLink = {
  id: string;
  contract_search: string;
  selected_contract_id: string;
  selected_service_item_id: string;
};

export type EmployeeForm = {
  employee_code: string;
  name: string;
  gender: Gender;
  department: EmployeeDepartment;
  position: string;
  phone_number: string;
  email: string;
  address: string;
  status: EmployeeStatus;
};

export type PartyForm = {
  party_type: PartyType;
  name: string;
  customer_type: CustomerType | "";
  company: string;
  phone_number: string;
  email: string;
  address: string;
  account_number: string;
  bank: string;
  tax_code: string;
  notes: string;
};

export type BroadcastScheduleForm = {
  schedule_source: "service" | "general";
  program_name: string;
  schedule_type: ScheduleType;
  schedule_mode: ScheduleMode;
  contract_search: string;
  selected_contract_id: string;
  channel_id: string;
  service_item_id: string;
  booking_id: string;
  content_id: string;
  content_search: string;
  scheduled_start: string;
  scheduled_end: string;
  status: ScheduleStatus;
  notes: string;
};

export type StudioUsageForm = {
  source_mode: StudioUsageSourceMode;
  production_search: string;
  selected_production_id: string;
  contract_search: string;
  selected_contract_id: string;
  selected_service_item_id: string;
  selected_rental_id: string;
  studio_id: string;
  usage_start: string;
  usage_end: string;
  status: ScheduleStatus;
  notes: string;
};

export type ContentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialContent?: ContentRow | null;
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  files: FileRow[];
  contentFileLinks: LinkedFileSeedRow[];
};

export type ContractFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialContract?: ContractRow | null;

  parties: PartyView[];
  serviceItemRows: ServiceItemRow[];
  bookingRows: BookingRow[];
  paymentScheduleRows: PaymentScheduleRow[];
  files: FileRow[];
  contractFileLinks: LinkedFileSeedRow[];
  channels: ChannelView[];
  studios: StudioView[];
};

export type ProductionFormDialogProps = { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  mode: "create" | "edit"; 
  initialProduction?: ProductionRow | null; 
  employees: EmployeeView[];
  contracts: ContractRow[];
  serviceItems: ServiceItemRow[];
  productionTasks: ProductionTaskRow[];
  files: FileRow[];
  productionFileLinks: LinkedFileSeedRow[];
};

export type DraftLinkedFile = {
  id: string;
  source: "repository" | "local";
  file_id?: string;
  file_name: string;
  local_file?: File | null;
  storage_path?: string;
  folder?: Folder;
  file_role: string;
  is_main: boolean;
  notes: string;
};

export type LinkedFileSeedRow = {
  id: string;
  parent_id: string;
  file_id: string;
  file_role: string;
  is_main: boolean;
  notes?: string;
};

export type ContractSavePayload = {
  contract: {
    contract_id?: string;
    contract_number: string;
    title: string;
    party_id: string;
    contract_type: ContractType;
    signed_date: string;
    start_date: string;
    end_date: string | null;
    contract_value: number;
    discount: number;
    total_value: number;
    status: ContractStatus;
    notes: string;
  };
  contract_files: {
    file_id: string | null;
    local_file_name: string | null;
    local_file?: File | null;
    file_role: string;
    is_main: boolean;
    notes: string;
  }[];
  service_items: DraftServiceItem[];
  payment_schedules: DraftPaymentSchedule[];
};

export type PaymentSavePayload = {
  contract_id: string;
  payment_schedule_id: string;
  paid_date: string;
  amount: number;
  method: PaymentMethod;
};

export type InvoiceSavePayload = {
  contract_id: string;
  invoice_number: string;
  issue_date: string;
  total_amount: number;
  status: InvoiceStatus;
  invoice_files: {
    file_id: string | null;
    local_file_name: string | null;
    local_file?: File | null;
    file_role: string;
    is_main: boolean;
    notes: string;
  }[];
};

export type ProductionSavePayload = {
  production: {
    production_id?: string;
    name: string;
    type: ProductionType;
    genre: string;
    duration_minutes: number | null;
    start_date: string;
    end_date: string | null;
    producer: string | null;
    status: ProductionStatus;
    notes: string;
  };
  service_item_ids: string[];
  production_files: {
    file_id: string | null;
    local_file_name: string | null;
    local_file?: File | null;
    file_role: string;
    is_main: boolean;
    notes: string;
  }[];
  tasks: {
    employee_id: string;
    role_label: string;
  }[];
};

export type ContentSavePayload = {
  content: {
    content_id?: string;
    title: string;
    type: ContentType;
    source: ContentSource;
    status: ContentStatus;
    notes: string;
  };
  service_item_ids: string[];
  content_files: {
    file_id: string | null;
    file_role: string;
    is_main: boolean;
    notes: string;
  }[];
};

export type PartySavePayload = PartyView;

export type FileCatalogForm = {
  local_files: File[];
  notes: string;
};

export type FileCatalogSavePayload =
  | {
      mode: "create";
      files: {
        local_file: File;
        notes?: string | null;
      }[];
    }
  | {
      mode: "edit";
      file_id: string;
      notes?: string | null;
    };


