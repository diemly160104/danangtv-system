const API_PREFIX = "/api/danangtv";

export const danangTvApiEndpoints = {
  bootstrap: `${API_PREFIX}/bootstrap`,
  authLogin: `${API_PREFIX}/auth/login`,

  contracts: `${API_PREFIX}/contracts`,
  contractImport: `${API_PREFIX}/contracts/import`,
  contractById: (contractId: string) => `${API_PREFIX}/contracts/${contractId}`,
  contractPayments: (contractId: string) => `${API_PREFIX}/contracts/${contractId}/payments`,
  paymentById: (paymentId: string) => `${API_PREFIX}/contracts/payments/${paymentId}`,
  contractInvoices: (contractId: string) => `${API_PREFIX}/contracts/${contractId}/invoices`,
  invoiceById: (invoiceId: string) => `${API_PREFIX}/contracts/invoices/${invoiceId}`,

  files: `${API_PREFIX}/files`,
  uploadFiles: `${API_PREFIX}/files/upload`,
  fileById: (fileId: string) => `${API_PREFIX}/files/${fileId}`,

  productions: `${API_PREFIX}/productions`,
  productionImport: `${API_PREFIX}/productions/import`,
  productionById: (productionId: string) =>
    `${API_PREFIX}/productions/${productionId}`,

  contents: `${API_PREFIX}/contents`,
  contentById: (contentId: string) => `${API_PREFIX}/contents/${contentId}`,
  contentApprove: (contentId: string) => `${API_PREFIX}/contents/${contentId}/approve`,

  schedules: `${API_PREFIX}/schedules`,
  scheduleById: (broadcastId: string) => `${API_PREFIX}/schedules/${broadcastId}`,
  scheduleApprove: (broadcastId: string) => `${API_PREFIX}/schedules/${broadcastId}/approve`,

  studioUsageSchedules: `${API_PREFIX}/studio-usage-schedules`,
  studioUsageById: (usageScheduleId: string) =>
    `${API_PREFIX}/studio-usage-schedules/${usageScheduleId}`,
  studioUsageApprove: (usageScheduleId: string) =>
    `${API_PREFIX}/studio-usage-schedules/${usageScheduleId}/approve`,

  employees: `${API_PREFIX}/employees`,
  employeeById: (employeeId: string) => `${API_PREFIX}/employees/${employeeId}`,

  parties: `${API_PREFIX}/parties`,
  partyById: (partyId: string) => `${API_PREFIX}/parties/${partyId}`,
};