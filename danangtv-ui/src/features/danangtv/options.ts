import type {
  UserRole,
  Folder,
  ContractType,
  ContractStatus,
  ServiceType,
  ServiceStatus,
  PaymentScheduleStatus,
  PaymentMethod,
  InvoiceStatus,
  ProductionType,
  ProductionStatus,
  ContentType,
  ContentSource,
  ContentStatus,
  ScheduleStatus,
  Platform,
  PartyType,
  CustomerType,
  EmployeeDepartment,
  EmployeeStatus,
  Gender,
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
  RentalType,
  TimePoint,
  BannerPosition,
  ScheduleType,
  ScheduleMode,
  Option,
} from "@/features/danangtv/types";

export const userRoleOptions: Option<UserRole>[] = [
  { value: "manager", label: "Quản lý" },
  { value: "staff", label: "Nhân sự" },
  { value: "technical_admin", label: "Kỹ thuật / Quản trị hệ thống" },
];

export const contractTypeOptions: Option<ContractType>[] = [
  { value: "service", label: "Cung cấp dịch vụ" },
  { value: "license_purchase", label: "Mua bản quyền" },
  { value: "other", label: "Khác" },
];

export const contractStatusOptions: Option<ContractStatus>[] = [
  { value: "draft", label: "Nháp" },
  { value: "active", label: "Đang hiệu lực" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

export const partyTypeOptions: Option<PartyType>[] = [
  { value: "customer", label: "Khách hàng" },
  { value: "partner", label: "Đối tác" },
  { value: "other", label: "Khác" },
];

export const customerTypeOptions: Option<CustomerType>[] = [
  { value: "individual", label: "Cá nhân" },
  { value: "corporate", label: "Tổ chức" },
];

export const serviceTypeOptions: Option<ServiceType>[] = [
  { value: "printed_ad", label: "Báo in" },
  { value: "electronic_ad", label: "Báo điện tử" },
  { value: "tv_ad", label: "Truyền hình" },
  { value: "radio_ad", label: "Phát thanh" },
  { value: "digital_ad", label: "Digital" },
  { value: "studio_rental", label: "Thuê studio" },
  { value: "content_production", label: "Sản xuất nội dung" },
  { value: "other", label: "Khác" },
];

export const serviceStatusOptions: Option<ServiceStatus>[] = [
  { value: "planned", label: "Kế hoạch" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "done", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];

export const paymentScheduleStatusOptions: Option<PaymentScheduleStatus>[] = [
  { value: "planned", label: "Kế hoạch" },
  { value: "partial", label: "Thanh toán một phần" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "overdue", label: "Quá hạn" },
  { value: "cancelled", label: "Đã hủy" },
];

export const paymentMethodOptions: Option<PaymentMethod>[] = [
  { value: "bank_transfer", label: "Chuyển khoản" },
  { value: "cash", label: "Tiền mặt" },
  { value: "other", label: "Khác" },
];

export const invoiceStatusOptions: Option<InvoiceStatus>[] = [
  { value: "draft", label: "Nháp" },
  { value: "issued", label: "Đã phát hành" },
];

export const contentTypeOptions: Option<ContentType>[] = [
  { value: "image", label: "Hình ảnh" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "text", label: "Văn bản" },
  { value: "other", label: "Khác" },
];

export const contentSourceOptions: Option<ContentSource>[] = [
  { value: "customer_provided", label: "Khách hàng cung cấp" },
  { value: "licensed", label: "Bản quyền" },
  { value: "produced", label: "Sản xuất" },
  { value: "other", label: "Khác" },
];

export const contentStatusOptions: Option<ContentStatus>[] = [
  { value: "draft", label: "Nháp" },
  { value: "editing", label: "Đang biên tập" },
  { value: "approved", label: "Đã duyệt" },
  { value: "rejected", label: "Từ chối" },
];

export const productionTypeOptions: Option<ProductionType>[] = [
  { value: "service", label: "Dịch vụ" },
  { value: "internal", label: "Nội bộ" },
];

export const productionStatusOptions: Option<ProductionStatus>[] = [
  { value: "planned", label: "Kế hoạch" },
  { value: "in_progress", label: "Đang thực hiện" },
  { value: "done", label: "Hoàn tất" },
  { value: "cancelled", label: "Đã hủy" },
];

export const scheduleStatusOptions: Option<ScheduleStatus>[] = [
  { value: "planned", label: "Kế hoạch" },
  { value: "approved", label: "Đã duyệt" },
  { value: "completed", label: "Hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

export const scheduleTypeOptions: Option<ScheduleType>[] = [
  { value: "broadcast", label: "Phát sóng" },
  { value: "publication", label: "Phát hành" },
];

export const scheduleModeOptions: Option<ScheduleMode>[] = [
  { value: "live_broadcast", label: "Phát trực tiếp" },
  { value: "recorded_broadcast", label: "Phát ghi hình / dựng sẵn" },
  { value: "rerun_broadcast", label: "Phát lại" },
  { value: "article_publication", label: "Đăng tin / bài" },
  { value: "program_publication", label: "Đăng chương trình" },
  { value: "banner_publication", label: "Banner / hiển thị" },
  { value: "social_post", label: "Bài post mạng xã hội" },
  { value: "issue_release", label: "Phát hành số / kỳ" },
  { value: "other", label: "Khác" },
];

export const printedContentTypeOptions: Option<PrintedContentType>[] = [
  { value: "news", label: "Tin" },
  { value: "pr_article", label: "Bài PR" },
  { value: "special_page", label: "Chuyên trang" },
  { value: "section", label: "Chuyên mục" },
];

export const printedAreaOptions: Option<PrintedArea>[] = [
  { value: "full_page", label: "Nguyên trang" },
  { value: "half_page", label: "Nửa trang" },
  { value: "quarter_page", label: "1/4 trang" },
  { value: "eighth_page", label: "1/8 trang" },
  { value: "sixteenth_page", label: "1/16 trang" },
  { value: "footer_logo", label: "Logo chân trang" },
];

export const printedColorOptions: Option<PrintedColor>[] = [
  { value: "black_white", label: "Đen trắng" },
  { value: "color", label: "Màu" },
];

export const electronicSubtypeOptions: Option<ElectronicSubtype>[] = [
  { value: "article", label: "Tin / bài" },
  { value: "program", label: "Chương trình" },
  { value: "banner", label: "Banner" },
];

export const electronicContentTypeOptions: Option<ElectronicContentType>[] = [
  { value: "news", label: "Tin" },
  { value: "article", label: "Bài" },
  { value: "talkshow", label: "Tọa đàm" },
  { value: "photo_video", label: "Ảnh / Video" },
  { value: "reportage", label: "Phóng sự" },
  { value: "infographic", label: "Infographic" },
  { value: "e_magazine", label: "E-magazine" },
  { value: "long_form", label: "Long-form" },
];

export const electronicFormOptions: Option<ElectronicForm>[] = [
  { value: "retail", label: "Lẻ" },
  { value: "package", label: "Gói" },
];

export const bannerPositionOptions: Option<BannerPosition>[] = [
  { value: "1", label: "Vị trí 1" },
  { value: "2", label: "Vị trí 2" },
  { value: "3", label: "Vị trí 3" },
  { value: "4", label: "Vị trí 4" },
  { value: "5", label: "Vị trí 5" },
  { value: "6", label: "Vị trí 6" },
  { value: "7", label: "Vị trí 7" },
];

export const tvBroadcastTypeOptions: Option<TVBroadcastType>[] = [
  { value: "advertisement", label: "Quảng cáo" },
  { value: "home_shopping", label: "Bán hàng" },
  { value: "announcement", label: "Thông báo" },
  { value: "self_promotion", label: "Tự giới thiệu" },
  { value: "insert", label: "Chèn thông tin / logo" },
];

export const insertTypeOptions: Option<InsertType>[] = [
  { value: "logo", label: "Logo" },
  { value: "ticker", label: "Chạy chữ" },
  { value: "popup", label: "Popup" },
  { value: "panel", label: "Panel" },
  { value: "corner_logo", label: "Bật góc logo" },
  { value: "transition", label: "Hình gạt" },
];

export const tvProgramOptions: Option<TVProgram>[] = [
  { value: "entertainment", label: "Giải trí" },
  { value: "entertainment_movie", label: "Phim giải trí" },
  { value: "good_morning", label: "Chào ngày mới" },
  { value: "specialized_program", label: "Chuyên mục" },
  { value: "sports_news", label: "Bản tin thể thao" },
  { value: "news", label: "Thời sự" },
  { value: "360_motion", label: "Chuyển động 360" },
  { value: "focus_24h", label: "Tiêu điểm 24h" },
  { value: "THVN_news", label: "Thời sự THVN" },
  { value: "other", label: "Khác" },
];

export const timePointOptions: Option<TimePoint>[] = [
  { value: "before", label: "Trước chương trình" },
  { value: "during", label: "Trong chương trình" },
  { value: "mid_break", label: "Giữa chương trình" },
  { value: "after", label: "Sau chương trình" },
];

export const radioContentTypeOptions: Option<RadioContentType>[] = [
  { value: "advertisement", label: "Quảng cáo" },
  { value: "self_promotion", label: "Tự giới thiệu" },
];

export const radioProgramOptions: Option<RadioProgram>[] = [
  { value: "news", label: "Thời sự" },
  { value: "health_talk", label: "Sức khỏe của bạn" },
  { value: "traffic_fm", label: "Giao thông FM" },
  { value: "specialized_program", label: "Chuyên mục" },
  { value: "da_nang_section", label: "Chuyên mục Đà Nẵng" },
  { value: "entertainment", label: "Giải trí" },
  { value: "other", label: "Khác" },
];

export const digitalContentTypeOptions: Option<DigitalContentType>[] = [
  { value: "image_post", label: "Tin bài + ảnh" },
  { value: "video", label: "Video" },
  { value: "livestream", label: "Livestream" },
  { value: "video_shopping", label: "Video shopping" },
  { value: "link_share", label: "Chia sẻ link" },
  { value: "banner", label: "Banner" },
];

export const rentalTypeOptions: Option<RentalType>[] = [
  { value: "standard", label: "Tiêu chuẩn" },
  { value: "rehearsal", label: "Tập dợt" },
];

export const platformOptions: Option<Platform>[] = [
  { value: "television", label: "Truyền hình" },
  { value: "radio", label: "Phát thanh" },
  { value: "digital", label: "Digital" },
  { value: "print", label: "Báo in" },
  { value: "electronic", label: "Báo điện tử" },
];

export const employeeDepartmentOptions: Option<EmployeeDepartment>[] = [
  { value: "administration", label: "Tổ chức & Hành chính" },
  { value: "finance_services", label: "Tài chính & Dịch vụ" },
  { value: "engineering_tech", label: "Kỹ thuật & Công nghệ" },
  { value: "print_media", label: "Báo in" },
  { value: "digital_media", label: "Báo điện tử & Nội dung số" },
  { value: "news", label: "Tin tức" },
  { value: "television", label: "Truyền hình" },
  { value: "radio", label: "Phát thanh" },
  { value: "ethnic_affairs", label: "Dân tộc & Miền núi" },
];

export const genderOptions: Option<Gender>[] = [
  { value: "male", label: "Nam" },
  { value: "female", label: "Nữ" },
];

export const employeeStatusOptions: Option<EmployeeStatus>[] = [
  { value: "active", label: "Đang làm" },
  { value: "inactive", label: "Tạm nghỉ" },
  { value: "terminated", label: "Đã nghỉ" },
];

export const folderOptions: Option<Folder>[] = [
  { value: "contracts", label: "Hợp đồng" },
  { value: "invoices", label: "Hóa đơn" },
  { value: "productions", label: "Sản xuất" },
  { value: "general", label: "General" },
];

export const BRAND_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/8/8a/Logo_DaNangtv_2018.png";