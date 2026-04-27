
import { useEffect, useState } from "react";

import { loginUser } from "@/features/danangtv/data/api/authApi";
import { useDanangTvData } from "@/features/danangtv/hooks/useDanangTvData";
import {
  getChannelCode,
  createDraftLinkedFileFromRepository
} from "@/features/danangtv/selectors";

import type {
  ContractType,
  NavKey,
  SessionUser,
  PartyView,
  EmployeeView,
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
  StudioUsageRow,
  DraftLinkedFile,
  LinkedFileSeedRow,
  ContractSavePayload,
  InvoiceSavePayload,
  PaymentSavePayload,
  ProductionSavePayload,
  ContentSavePayload,
  FileCatalogSavePayload,
  ServiceItemContentRow,
  ServiceItemProductionRow,
} from "@/features/danangtv/types";

import {
  createContract,
  updateContract,
  createPayment,
  updatePayment,
  deletePayment,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  deleteContract as deleteContractApi,
} from "@/features/danangtv/data/api/contractsApi";
import {
  createProduction,
  updateProduction,
  deleteProduction as deleteProductionApi,
} from "@/features/danangtv/data/api/productionsApi";

import {
  createContent,
  updateContent,
  approveContent as approveContentApi,
  deleteContent as deleteContentApi,
} from "@/features/danangtv/data/api/contentsApi";

import {
  createBroadcastSchedule,
  updateBroadcastSchedule,
  approveBroadcastSchedule as approveBroadcastScheduleApi,
  deleteBroadcastSchedule as deleteBroadcastScheduleApi,
  createStudioUsage,
  updateStudioUsage,
  approveStudioUsage as approveStudioUsageApi,
  deleteStudioUsage as deleteStudioUsageApi,
} from "@/features/danangtv/data/api/schedulesApi";

import { saveEmployeeApi, deleteEmployeeApi } from "@/features/danangtv/data/api/employeesApi";
import { savePartyApi, deletePartyApi } from "@/features/danangtv/data/api/partiesApi";
import {
  uploadCatalogFilesApi,
  updateFileCatalogApi,
  deleteFileCatalogApi,
  uploadFiles,
} from "@/features/danangtv/data/api/filesApi";

import { importContractsApi } from "@/features/danangtv/data/api/contractsImportApi";
import { importProductionsApi } from "@/features/danangtv/data/api/productionsImportApi";

import {
  saveStoredSessionUser,
  clearStoredSessionUser,
} from "@/features/danangtv/data/api/sessionUser";

import {
  createId,
  getCurrentDateTimeString,
  materializeDraftLinkedFiles,
  mergeById,
  getFileExtension,
  buildFileRowsFromLocalNames
} from "@/features/danangtv/utils/Helpers";


import { Shell } from "@/features/danangtv/shared/Shell";

import {
  buildBookingDetailData,
  ContractsPage,
  getBookingDateValues,
  renderBookingSummary
} from "@/features/danangtv/modules/contracts";

import {
  ProductionsPage
} from "@/features/danangtv/modules/productions";

import {
  ContentsPage
} from "@/features/danangtv/modules/contents";

import {
  SchedulesPage
} from "@/features/danangtv/modules/schedules";

import {CatalogPage} from "@/features/danangtv/modules/catalog";

import { LoginPage } from "@/pages/loginPage";
import { DashboardPage } from "@/pages/dashboardPage";





export default function App() {
  const [active, setActive] = useState<NavKey>("dashboard");
  const { db, loading, actions } = useDanangTvData();

  const [broadcastSchedulesData, setBroadcastSchedulesData] = useState<BroadcastScheduleRow[]>([]);
  const [studioUsageSchedulesData, setStudioUsageSchedulesData] = useState<StudioUsageRow[]>([]);

  const [contractsData, setContractsData] = useState<ContractRow[]>([]);
  const [serviceItemsData, setServiceItemsData] = useState<ServiceItemRow[]>([]);
  const [bookingsData, setBookingsData] = useState<BookingRow[]>([]);
  const [paymentSchedulesData, setPaymentSchedulesData] = useState<PaymentScheduleRow[]>([]);
  const [paymentsData, setPaymentsData] = useState<PaymentRow[]>([]);
  const [invoicesData, setInvoicesData] = useState<InvoiceRow[]>([]);
  const [filesData, setFilesData] = useState<FileRow[]>([]);
  const [contractFileLinksData, setContractFileLinksData] = useState<LinkedFileSeedRow[]>([]);

  const [productionsData, setProductionsData] = useState<ProductionRow[]>([]);
  const [productionTasksData, setProductionTasksData] = useState<ProductionTaskRow[]>([]);
  const [productionFileLinksData, setProductionFileLinksData] = useState<LinkedFileSeedRow[]>([]);
  const [serviceItemProductionsData, setServiceItemProductionsData] = useState<ServiceItemProductionRow[]>([]);

  const [contentsData, setContentsData] = useState<ContentRow[]>([]);
  const [contentFileLinksData, setContentFileLinksData] = useState<LinkedFileSeedRow[]>([]);
  const [serviceItemContentsData, setServiceItemContentsData] = useState<ServiceItemContentRow[]>([]);

  const [employeesData, setEmployeesData] = useState<EmployeeView[]>([]);
  const [partiesData, setPartiesData] = useState<PartyView[]>([]);

  useEffect(() => {
    if (!db) return;

    setBroadcastSchedulesData(db.schedules);
    setStudioUsageSchedulesData(db.studioUsageSchedules);

    setContractsData(db.contracts);
    setServiceItemsData(db.serviceItems);
    setBookingsData(db.bookings);
    setPaymentSchedulesData(db.paymentSchedules);
    setPaymentsData(db.payments);
    setInvoicesData(db.invoices);
    setFilesData(db.files);
    setContractFileLinksData(db.contractFileLinks);

    setProductionsData(db.productions);
    setProductionTasksData(db.productionTasks);
    setProductionFileLinksData(db.productionFileLinks);
    setServiceItemProductionsData(db.serviceItemProductions);

    setContentsData(db.contents);
    setContentFileLinksData(db.contentFileLinks);
    setServiceItemContentsData(db.serviceItemContents);

    setEmployeesData(db.employees);
    setPartiesData(db.parties);
  }, [db]);

  if (loading || !db) {
    return <div className="p-6">Đang tải dữ liệu...</div>;
  }

  const dbData = db;
  const currentUser = dbData.sessionUser;

  function savePaymentLocal(payload: PaymentSavePayload) {
    const contract = contractsData.find((item) => item.contract_id === payload.contract_id);

    const row: PaymentRow = {
      payment_id: createId("PAY"),
      payment_schedule_id: payload.payment_schedule_id,
      contract_number: contract?.contract_number || "",
      paid_date: payload.paid_date,
      amount: payload.amount,
      method: payload.method,
      created_by_name: currentUser?.employee_name || currentUser?.username || "Hệ thống",
    };

    setPaymentsData((prev) => [row, ...prev]);
  }

  async function savePayment(payload: PaymentSavePayload): Promise<boolean> {
    if (!isApiMode) {
      savePaymentLocal(payload);
      return true;
    }

    try {
      await createPayment(payload);
      await actions.reload();
      alert("Lưu payment thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Lưu payment thất bại.");
      return false;
    }
  }

  async function updatePaymentAction(
    paymentId: string,
    payload: PaymentSavePayload
  ): Promise<boolean> {
    try {
      if (!isApiMode) {
        setPaymentsData((prev) =>
          prev.map((item) =>
            item.payment_id === paymentId
              ? {
                  ...item,
                  payment_schedule_id: payload.payment_schedule_id,
                  paid_date: payload.paid_date,
                  amount: payload.amount,
                  method: payload.method,
                }
              : item
          )
        );
        return true;
      }

      await updatePayment(paymentId, payload);
      await actions.reload();
      alert("Cập nhật thanh toán thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Cập nhật thanh toán thất bại.");
      return false;
    }
  }

  async function deletePaymentAction(paymentId: string): Promise<boolean> {
    try {
      if (!isApiMode) {
        setPaymentsData((prev) => prev.filter((item) => item.payment_id !== paymentId));
        return true;
      }

      await deletePayment(paymentId);
      await actions.reload();
      alert("Xóa thanh toán thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Xóa thanh toán thất bại.");
      return false;
    }
  }

  function saveInvoiceLocal(payload: InvoiceSavePayload) {
    const contract = contractsData.find((item) => item.contract_id === payload.contract_id);

    const localFileNames = payload.invoice_files
      .map((item) => item.local_file_name)
      .filter(Boolean) as string[];

    const newFiles = buildFileRowsFromLocalNames(
      localFileNames,
      "invoices",
      currentUser
    );

    const row: InvoiceRow = {
      invoice_id: createId("INV"),
      invoice_number: payload.invoice_number,
      contract_id: payload.contract_id,
      contract_number: contract?.contract_number || "",
      issue_date: payload.issue_date,
      total_amount: payload.total_amount,
      status: payload.status,
      created_by_name: currentUser?.employee_name || currentUser?.username || "Hệ thống",
      file_ids: newFiles.map((item) => item.file_id),
    };

    setFilesData((prev) => mergeById(prev, newFiles, "file_id"));
    setInvoicesData((prev) => [row, ...prev]);
  }

  async function saveInvoice(payload: InvoiceSavePayload): Promise<boolean> {
    if (!isApiMode) {
      saveInvoiceLocal(payload);
      return true;
    }

    try {
      const contract = db?.contracts.find(
        (item) => item.contract_id === payload.contract_id
      );

      const localFileRows = payload.invoice_files.filter(
        (row) => !row.file_id && row.local_file
      );

      let uploadedRows: Awaited<ReturnType<typeof uploadFiles>> = [];
      if (localFileRows.length > 0) {
        uploadedRows = await uploadFiles({
          files: localFileRows.map((row) => row.local_file!).filter(Boolean),
          folder: "invoices",
          pathContext: {
            contract_number: contract?.contract_number,
            signed_date: contract?.signed_date,
          },
        });
      }

      let uploadIndex = 0;
      const nextInvoiceFiles = payload.invoice_files.map((row) => {
        if (row.file_id) {
          return {
            file_id: row.file_id,
            local_file_name: null,
            file_role: row.file_role,
            is_main: row.is_main,
            notes: row.notes,
          };
        }

        const uploaded = uploadedRows[uploadIndex++];
        if (!uploaded) {
          throw new Error(`Không upload được file hóa đơn: ${row.local_file_name || row.local_file?.name}`);
        }

        return {
          file_id: uploaded.file_id,
          local_file_name: null,
          file_role: row.file_role,
          is_main: row.is_main,
          notes: row.notes,
        };
      });

      await createInvoice({
        ...payload,
        invoice_files: nextInvoiceFiles,
      });

      await actions.reload();
      alert("Lưu hóa đơn thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Lưu hóa đơn thất bại.");
      return false;
    }
  }

  async function updateInvoiceAction(
    invoiceId: string,
    payload: InvoiceSavePayload
  ): Promise<boolean> {
    try {
      if (!isApiMode) {
        setInvoicesData((prev) =>
          prev.map((item) =>
            item.invoice_id === invoiceId
              ? {
                  ...item,
                  invoice_number: payload.invoice_number,
                  issue_date: payload.issue_date,
                  total_amount: payload.total_amount,
                  status: payload.status,
                }
              : item
          )
        );
        return true;
      }

      await updateInvoice(invoiceId, payload);
      await actions.reload();
      alert("Cập nhật hóa đơn thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Cập nhật hóa đơn thất bại.");
      return false;
    }
  }

  async function deleteInvoiceAction(invoiceId: string): Promise<boolean> {
    try {
      if (!isApiMode) {
        setInvoicesData((prev) => prev.filter((item) => item.invoice_id !== invoiceId));
        return true;
      }

      await deleteInvoice(invoiceId);
      await actions.reload();
      alert("Xóa hóa đơn thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Xóa hóa đơn thất bại.");
      return false;
    }
  }

  function saveContractLocal(payload: ContractSavePayload) {
    const contractId = payload.contract.contract_id || createId("CT");
    const selectedParty =
      dbData.parties.find((item) => item.party_id === payload.contract.party_id) || null;

    const oldServiceIds = serviceItemsData
      .filter((item) => item.contract_id === contractId)
      .map((item) => item.service_item_id);

    const contractFilesResult = materializeDraftLinkedFiles(
      payload.contract_files.map((item, index) => ({
        id: createId(`LFILE${index}`),
        file_id: item.file_id || "",
        file_name: item.local_file_name || "",
        storage_path: "",
        folder: "contracts",
        file_role: item.file_role,
        is_main: item.is_main,
        notes: item.notes,
        source: item.file_id ? "repository" : "local",
      })),
      contractId,
      "contracts",
      currentUser
    );

    const contractRow: ContractRow = {
      contract_id: contractId,
      contract_number: payload.contract.contract_number,
      title: payload.contract.title,
      party_id: payload.contract.party_id,
      party_name: selectedParty?.name || "—",
      contract_type: payload.contract.contract_type,
      signed_date: payload.contract.signed_date,
      start_date: payload.contract.start_date,
      end_date: payload.contract.end_date || undefined,
      total_value: payload.contract.total_value,
      status: payload.contract.status,
      created_by_name:
        contractsData.find((item) => item.contract_id === contractId)?.created_by_name ||
        currentUser?.employee_name ||
        currentUser?.username ||
        "Hệ thống",
      file_ids: contractFilesResult.fileIds,
    };

    const builtServiceItems = payload.service_items.map((item) => {
      const serviceItemId = item.id.startsWith("SI-") ? createId("SVI") : item.id;

      return {
        row: {
          service_item_id: serviceItemId,
          contract_id: contractId,
          contract_number: payload.contract.contract_number,
          title: item.title,
          service_type: item.service_type,
          cost: Number(item.cost || 0),
          status: item.status,
          notes: item.notes,
        } as ServiceItemRow,
        bookings: item.bookings.map((booking: any) => {
          const bookingId =
            booking.id && !String(booking.id).includes("-")
              ? booking.id
              : createId("BKG");

          const { start_date, end_date, time_slot } = getBookingDateValues(
            item.service_type,
            booking
          );

          return {
            booking_id: bookingId,
            service_item_id: serviceItemId,
            contract_number: payload.contract.contract_number,
            service_item_title: item.title,
            service_type: item.service_type,
            description: renderBookingSummary(
              item.service_type,
              booking,
              dbData.channels,
              dbData.studios
            ),
            channel_code: getChannelCode(dbData.channels, booking.channel_id),
            start_date,
            end_date,
            time_slot,
            notes: booking.notes || "",
            detail_data: buildBookingDetailData(
              item.service_type,
              booking,
              dbData.channels,
              dbData.studios
            ),
          } as BookingRow;
        }),
      };
    });

    const nextServiceItems = builtServiceItems.map((item) => item.row);
    const nextBookings = builtServiceItems.flatMap((item) => item.bookings);

    const nextPaymentSchedules: PaymentScheduleRow[] = payload.payment_schedules.map((item) => ({
      payment_schedule_id:
        item.id && !String(item.id).includes("-") ? item.id : createId("PSC"),
      contract_id: contractId,
      contract_number: payload.contract.contract_number,
      installment_no: Number(item.installment_no || 1),
      due_date: item.due_date,
      planned_amount: Number(item.planned_amount || 0),
      status: item.status,
      notes: item.notes,
    }));

    setFilesData((prev) => mergeById(prev, contractFilesResult.newFiles, "file_id"));

    setContractFileLinksData((prev) => [
      ...prev.filter((item) => item.parent_id !== contractId),
      ...contractFilesResult.links,
    ]);

    setContractsData((prev) => {
      const exists = prev.some((item) => item.contract_id === contractId);
      return exists
        ? prev.map((item) => (item.contract_id === contractId ? contractRow : item))
        : [contractRow, ...prev];
    });

    setServiceItemsData((prev) => [
      ...prev.filter((item) => item.contract_id !== contractId),
      ...nextServiceItems,
    ]);

    setBookingsData((prev) => [
      ...prev.filter((item) => !oldServiceIds.includes(item.service_item_id)),
      ...nextBookings,
    ]);

    setPaymentSchedulesData((prev) => [
      ...prev.filter((item) => item.contract_id !== contractId),
      ...nextPaymentSchedules,
    ]);
  }

  const isApiMode = import.meta.env.VITE_DANANGTV_DATA_MODE === "api";

  console.log("[App] VITE_DANANGTV_DATA_MODE =", import.meta.env.VITE_DANANGTV_DATA_MODE);
  console.log("[App] isApiMode =", isApiMode);

  async function saveContract(payload: ContractSavePayload): Promise<boolean> {
    console.log("[saveContract] called");
    console.log("[saveContract] mode =", import.meta.env.VITE_DANANGTV_DATA_MODE);
    console.log("[saveContract] isApiMode =", isApiMode);

    if (!isApiMode) {
      console.log("[saveContract] going LOCAL");
      saveContractLocal(payload);
      return true;
    }

    try {
      const localFileRows = payload.contract_files.filter(
        (row) => !row.file_id && row.local_file
      );

      let uploadedRows: Awaited<ReturnType<typeof uploadFiles>> = [];
      if (localFileRows.length > 0) {
        uploadedRows = await uploadFiles({
          files: localFileRows.map((row) => row.local_file!).filter(Boolean),
          folder: "contracts",
          pathContext: {
            contract_number: payload.contract.contract_number,
            signed_date: payload.contract.signed_date,
          },
        });
      }

      let uploadIndex = 0;
      const nextContractFiles = payload.contract_files.map((row) => {
        if (row.file_id) {
          return {
            file_id: row.file_id,
            local_file_name: null,
            file_role: row.file_role,
            is_main: row.is_main,
            notes: row.notes,
          };
        }

        const uploaded = uploadedRows[uploadIndex++];
        if (!uploaded) {
          throw new Error(`Không upload được file local: ${row.local_file_name || row.local_file?.name}`);
        }

        return {
          file_id: uploaded.file_id,
          local_file_name: null,
          file_role: row.file_role,
          is_main: row.is_main,
          notes: row.notes,
        };
      });

      const apiPayload: ContractSavePayload = {
        ...payload,
        contract_files: nextContractFiles,
      };

      if (payload.contract.contract_id) {
        await updateContract(payload.contract.contract_id, apiPayload);
      } else {
        await createContract(apiPayload);
      }

      await actions.reload();
      alert("Lưu hợp đồng thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Lưu hợp đồng thất bại.");
      return false;
    }
  }

  async function deleteContract(contractId: string) {
    if (!isApiMode) {
      setContractsData((prev) =>
        prev.filter((item) => item.contract_id !== contractId)
      );

      const serviceItemIds = serviceItemsData
        .filter((item) => item.contract_id === contractId)
        .map((item) => item.service_item_id);

      const paymentScheduleIds = paymentSchedulesData
        .filter((item) => item.contract_id === contractId)
        .map((item) => item.payment_schedule_id);

      const invoiceIds = invoicesData
        .filter((item) => item.contract_id === contractId)
        .map((item) => item.invoice_id);

      setServiceItemsData((prev) =>
        prev.filter((item) => item.contract_id !== contractId)
      );

      setBookingsData((prev) =>
        prev.filter((item) => !serviceItemIds.includes(item.service_item_id))
      );

      setPaymentSchedulesData((prev) =>
        prev.filter((item) => item.contract_id !== contractId)
      );

      setPaymentsData((prev) =>
        prev.filter((item) => !paymentScheduleIds.includes(item.payment_schedule_id))
      );

      setInvoicesData((prev) =>
        prev.filter((item) => item.contract_id !== contractId)
      );

      setContractFileLinksData((prev) =>
        prev.filter((item) => item.parent_id !== contractId)
      );

      setServiceItemContentsData((prev) =>
        prev.filter((item) => !serviceItemIds.includes(item.service_item_id))
      );

      setServiceItemProductionsData((prev) =>
        prev.filter((item) => !serviceItemIds.includes(item.service_item_id))
      );

      return;
    }

    try {
      await deleteContractApi(contractId);
      await actions.reload();
      alert("Xóa hợp đồng thành công.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Xóa hợp đồng thất bại.");
    }
  }

  async function handleImportContracts(params: {
    contract_type: ContractType;
    files: File[];
  }): Promise<boolean> {
    try {
      const result = await importContractsApi(params);

      alert(
        [
          result.message,
          `Batch ID: ${result.batch_id}`,
          `File nhận: ${result.file_names.length}`,
          `Hợp đồng import mới: ${result.imported_count}`,
          result.summary
            ? `Đối tác mới: ${result.summary.created_parties}, đối tác dùng lại: ${result.summary.reused_parties}`
            : "",
          result.summary
            ? `Service item mới: ${result.summary.created_service_items}, lịch thanh toán mới: ${result.summary.created_payment_schedules}`
            : "",
          ...(result.warnings.length ? ["", "Cảnh báo:", ...result.warnings] : []),
        ]
          .filter(Boolean)
          .join("\n")
      );

      await actions.reload();
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Import hợp đồng thất bại.");
      return false;
    }
  }

  function saveProductionLocal(payload: ProductionSavePayload) {
    const selectedProducer = employeesData.find(
      (item) => item.employee_id === payload.production.producer
    );

    const productionId =
      payload.production.production_id || createId("PR");

    const draftFileRows: DraftLinkedFile[] = payload.production_files.map((row) => {
      if (row.file_id) {
        const repositoryFile = filesData.find((file) => file.file_id === row.file_id);

        if (repositoryFile) {
          return {
            ...createDraftLinkedFileFromRepository(repositoryFile),
            id: createId("PFL"),
            file_role: row.file_role,
            is_main: row.is_main,
            notes: row.notes,
          };
        }

        return {
          id: createId("PFL"),
          source: "repository",
          file_id: row.file_id,
          file_name: row.local_file_name || "Tệp đã chọn",
          storage_path: "",
          folder: "productions",
          file_role: row.file_role,
          is_main: row.is_main,
          notes: row.notes,
        };
      }

      return {
        id: createId("PFL"),
        source: "local" as const,
        file_name: row.local_file_name || row.local_file?.name || "Tệp local",
        local_file: row.local_file || null,
        storage_path: "",
        folder: "productions",
        file_role: row.file_role,
        is_main: row.is_main,
        notes: row.notes,
      };
    });

    const materialized = materializeDraftLinkedFiles(
      draftFileRows,
      productionId,
      "productions",
      currentUser
    );

    const productionRow: ProductionRow = {
      production_id: productionId,
      service_item_id: null as any,
      contract_id: null as any,
      name: payload.production.name,
      type: payload.production.type as any,
      start_date: payload.production.start_date,
      end_date: payload.production.end_date || "",
      producer_name: selectedProducer?.name || "",
      status: payload.production.status as any,
      created_by_name:
        currentUser?.employee_name || currentUser?.username || "Hệ thống",
      file_ids: materialized.fileIds,
      notes: payload.production.notes,
    };

    const taskRows: ProductionTaskRow[] = payload.tasks.map((row) => {
      const employee = employeesData.find((item) => item.employee_id === row.employee_id);

      return {
        task_id: createId("TASK"),
        production_id: productionId,
        employee_id: row.employee_id,
        employee_code: employee?.employee_code || "",
        employee_name: employee?.name || "",
        department: employee?.department || "administration",
        role_label: row.role_label,
      };
    });

    const serviceLinkRows: ServiceItemProductionRow[] = payload.service_item_ids.map(
      (serviceItemId) => ({
        service_production_id: createId("SP"),
        service_item_id: serviceItemId,
        production_id: productionId,
        notes: "",
      })
    );

    setFilesData((prev) => mergeById(prev, materialized.newFiles, "file_id"));
    setProductionFileLinksData((prev) =>
      mergeById(prev, materialized.links, "id")
    );
    setProductionTasksData((prev) => [
      ...prev.filter((item) => item.production_id !== productionId),
      ...taskRows,
    ]);
    setServiceItemProductionsData((prev) => [
      ...prev.filter((item) => item.production_id !== productionId),
      ...serviceLinkRows,
    ]);
    setProductionsData((prev) => {
      const exists = prev.some((item) => item.production_id === productionId);
      return exists
        ? prev.map((item) =>
            item.production_id === productionId ? productionRow : item
          )
        : [productionRow, ...prev];
    });
  }

  async function saveProductionPayload(payload: ProductionSavePayload): Promise<boolean> {
    if (!isApiMode) {
      saveProductionLocal(payload);
      return true;
    }

    try {
      const localFileRows = payload.production_files.filter(
        (row) => !row.file_id && row.local_file
      );

      let uploadedRows: Awaited<ReturnType<typeof uploadFiles>> = [];
      if (localFileRows.length > 0) {
        uploadedRows = await uploadFiles({
          files: localFileRows.map((row) => row.local_file!).filter(Boolean),
          folder: "productions",
          pathContext: {
            production_name: payload.production.name,
            production_id: payload.production.production_id,
            start_date: payload.production.start_date,
          },
        });
      }

      let uploadIndex = 0;
      const nextProductionFiles = payload.production_files.map((row) => {
        if (row.file_id) {
          return {
            file_id: row.file_id,
            local_file_name: null,
            file_role: row.file_role,
            is_main: row.is_main,
            notes: row.notes,
          };
        }

        const uploaded = uploadedRows[uploadIndex++];
        if (!uploaded) {
          throw new Error(
            `Không upload được file sản xuất: ${
              row.local_file_name || row.local_file?.name
            }`
          );
        }

        return {
          file_id: uploaded.file_id,
          local_file_name: null,
          file_role: row.file_role,
          is_main: row.is_main,
          notes: row.notes,
        };
      });

      const apiPayload = {
        ...payload,
        production_files: nextProductionFiles,
      };

      if (payload.production.production_id) {
        await updateProduction(payload.production.production_id, apiPayload);
      } else {
        await createProduction(apiPayload);
      }

      await actions.reload();
      alert("Lưu dự án sản xuất thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Lưu dự án sản xuất thất bại."
      );
      return false;
    }
  }

  async function deleteProduction(productionId: string) {
    if (!isApiMode) {
      setProductionsData((prev) =>
        prev.filter((item) => item.production_id !== productionId)
      );

      setProductionTasksData((prev) =>
        prev.filter((item) => item.production_id !== productionId)
      );

      setProductionFileLinksData((prev) =>
        prev.filter((item) => item.parent_id !== productionId)
      );

      setServiceItemProductionsData((prev) =>
        prev.filter((item) => item.production_id !== productionId)
      );

      setStudioUsageSchedulesData((prev) =>
        prev.filter((item) => item.production_id !== productionId)
      );

      return;
    }

    try {
      await deleteProductionApi(productionId);
      await actions.reload();
      alert("Xóa dự án sản xuất thành công.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Xóa dự án sản xuất thất bại."
      );
    }
  }

  async function handleImportProductions(params: {
    files: File[];
  }): Promise<boolean> {
    try {
      const result = await importProductionsApi(params);

      alert(
        [
          result.message,
          `Batch ID: ${result.batch_id}`,
          `File nhận: ${result.file_names.length}`,
          `Dự án import mới: ${result.imported_count}`,
          result.summary
            ? `Task mới: ${result.summary.created_tasks}`
            : "",
          result.summary
            ? `Nhân viên mới: ${result.summary.created_employees}, nhân viên dùng lại: ${result.summary.reused_employees}`
            : "",
          ...(result.warnings.length ? ["", "Cảnh báo:", ...result.warnings] : []),
        ]
          .filter(Boolean)
          .join("\n")
      );

      await actions.reload();
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Import dự án sản xuất thất bại.");
      return false;
    }
  }  

  function saveContentLocal(payload: ContentSavePayload) {
    const contentId = payload.content.content_id || createId("CTN");

    const linkedServiceIds = payload.service_item_ids;

    const contentRow: ContentRow = {
      content_id: contentId,
      title: payload.content.title,
      type: payload.content.type,
      source: payload.content.source,
      status: payload.content.status,
      approved_by: undefined,
      approved_by_name: undefined,
      approved_at: undefined,
      created_by_name:
        currentUser?.employee_name || currentUser?.username || "Hệ thống",
      linked_service_label:
        linkedServiceIds.length > 0
          ? serviceItemsData.find(
              (item) => item.service_item_id === linkedServiceIds[0]
            )?.title ?? undefined
          : undefined,
      notes: payload.content.notes,
      file_ids: payload.content_files
        .map((item) => item.file_id)
        .filter(Boolean) as string[],
    };

    const contentFileLinks: LinkedFileSeedRow[] = payload.content_files
      .filter((item) => item.file_id)
      .map((item) => ({
        id: createId("CFL"),
        parent_id: contentId,
        file_id: item.file_id!,
        file_role: item.file_role,
        is_main: item.is_main,
        notes: item.notes,
      }));

    const serviceItemContentLinks: ServiceItemContentRow[] = linkedServiceIds.map(
      (serviceItemId) => ({
        service_item_content_id: createId("SIC"),
        service_item_id: serviceItemId,
        content_id: contentId,
        notes: "",
      })
    );

    setContentFileLinksData((prev) => [
      ...prev.filter((item) => item.parent_id !== contentId),
      ...contentFileLinks,
    ]);

    setServiceItemContentsData((prev) => [
      ...prev.filter((item) => item.content_id !== contentId),
      ...serviceItemContentLinks,
    ]);

    setContentsData((prev) => {
      const exists = prev.some((item) => item.content_id === contentId);
      return exists
        ? prev.map((item) => (item.content_id === contentId ? contentRow : item))
        : [contentRow, ...prev];
    });
  }

  async function saveContentPayload(payload: ContentSavePayload): Promise<boolean> {
    if (!isApiMode) {
      saveContentLocal(payload);
      return true;
    }

    try {
      if (payload.content.content_id) {
        await updateContent(payload.content.content_id, payload);
      } else {
        await createContent(payload);
      }

      await actions.reload();
      alert("Lưu content thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Lưu content thất bại.");
      return false;
    }
  }

  async function approveContent(contentId: string) {
    if (!isApiMode) {
      setContentsData((prev) =>
        prev.map((item) =>
          item.content_id === contentId
            ? {
                ...item,
                status: "approved",
                approved_by_name:
                  currentUser?.employee_name || currentUser?.username || "Hệ thống",
                approved_at: getCurrentDateTimeString(),
              }
            : item
        )
      );
      return;
    }

    try {
      await approveContentApi(contentId);
      await actions.reload();
      alert("Duyệt content thành công.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Duyệt content thất bại.");
    }
  }

  async function deleteContent(contentId: string) {
    if (!isApiMode) {
      setContentsData((prev) =>
        prev.filter((item) => item.content_id !== contentId)
      );
      setContentFileLinksData((prev) =>
        prev.filter((item) => item.parent_id !== contentId)
      );
      setServiceItemContentsData((prev) =>
        prev.filter((item) => item.content_id !== contentId)
      );
      setBroadcastSchedulesData((prev) =>
        prev.filter((item) => item.content_id !== contentId)
      );
      return;
    }

    try {
      await deleteContentApi(contentId);
      await actions.reload();
      alert("Xóa content thành công.");
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Xóa content thất bại.");
    }
  }

  function saveBroadcastScheduleLocal(row: BroadcastScheduleRow) {
    setBroadcastSchedulesData((prev) => {
      const exists = prev.some((item) => item.broadcast_id === row.broadcast_id);
      return exists
        ? prev.map((item) =>
            item.broadcast_id === row.broadcast_id ? row : item
          )
        : [row, ...prev];
    });
  }

  async function saveBroadcastSchedule(row: BroadcastScheduleRow): Promise<boolean> {
    if (!isApiMode) {
      saveBroadcastScheduleLocal(row);
      return true;
    }

    try {
      const exists = broadcastSchedulesData.some(
        (item) => item.broadcast_id === row.broadcast_id
      );

      if (exists) {
        await updateBroadcastSchedule(row.broadcast_id, row);
      } else {
        await createBroadcastSchedule(row);
      }

      await actions.reload();
      alert("Lưu lịch phát/phát hành thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Lưu lịch phát/phát hành thất bại."
      );
      return false;
    }
  }

  function deleteBroadcastScheduleLocal(broadcastId: string) {
    setBroadcastSchedulesData((prev) =>
      prev.filter((item) => item.broadcast_id !== broadcastId)
    );
  }

  async function deleteBroadcastSchedule(broadcastId: string) {
    if (!isApiMode) {
      deleteBroadcastScheduleLocal(broadcastId);
      return;
    }

    try {
      await deleteBroadcastScheduleApi(broadcastId);
      await actions.reload();
      alert("Xóa lịch phát/phát hành thành công.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Xóa lịch phát/phát hành thất bại."
      );
    }
  }

  function approveBroadcastScheduleLocal(
    broadcastId: string,
    user: SessionUser
  ) {
    setBroadcastSchedulesData((prev) =>
      prev.map((item) =>
        item.broadcast_id === broadcastId
          ? {
              ...item,
              status: "approved",
              approved_by_name: user.employee_name || user.username,
              approved_at: getCurrentDateTimeString(),
            }
          : item
      )
    );
  }

  async function approveBroadcastSchedule(
    broadcastId: string,
    user: SessionUser
  ) {
    if (!isApiMode) {
      approveBroadcastScheduleLocal(broadcastId, user);
      return;
    }

    try {
      await approveBroadcastScheduleApi(broadcastId);
      await actions.reload();
      alert("Duyệt lịch phát/phát hành thành công.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Duyệt lịch phát/phát hành thất bại."
      );
    }
  }

  function saveStudioUsageLocal(row: StudioUsageRow) {
    setStudioUsageSchedulesData((prev) => {
      const exists = prev.some(
        (item) => item.usage_schedule_id === row.usage_schedule_id
      );
      return exists
        ? prev.map((item) =>
            item.usage_schedule_id === row.usage_schedule_id ? row : item
          )
        : [row, ...prev];
    });
  }

  async function saveStudioUsagePayload(row: StudioUsageRow): Promise<boolean> {
    if (!isApiMode) {
      saveStudioUsageLocal(row);
      return true;
    }

    try {
      const exists = studioUsageSchedulesData.some(
        (item) => item.usage_schedule_id === row.usage_schedule_id
      );

      if (exists) {
        await updateStudioUsage(row.usage_schedule_id, row);
      } else {
        await createStudioUsage(row);
      }

      await actions.reload();
      alert("Lưu lịch sử dụng studio thành công.");
      return true;
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Lưu lịch sử dụng studio thất bại."
      );
      return false;
    }
  }

  function deleteStudioUsageLocal(usageScheduleId: string) {
    setStudioUsageSchedulesData((prev) =>
      prev.filter((item) => item.usage_schedule_id !== usageScheduleId)
    );
  }

  async function deleteStudioUsage(usageScheduleId: string) {
    if (!isApiMode) {
      deleteStudioUsageLocal(usageScheduleId);
      return;
    }

    try {
      await deleteStudioUsageApi(usageScheduleId);
      await actions.reload();
      alert("Xóa lịch sử dụng studio thành công.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Xóa lịch sử dụng studio thất bại."
      );
    }
  }

  function approveStudioUsageLocal(
    usageScheduleId: string,
    user: SessionUser
  ) {
    setStudioUsageSchedulesData((prev) =>
      prev.map((item) =>
        item.usage_schedule_id === usageScheduleId
          ? {
              ...item,
              status: "approved",
              approved_by_name: user.employee_name || user.username,
              approved_at: getCurrentDateTimeString(),
            }
          : item
      )
    );
  }

  async function approveStudioUsage(
    usageScheduleId: string,
    user: SessionUser
  ) {
    if (!isApiMode) {
      approveStudioUsageLocal(usageScheduleId, user);
      return;
    }

    try {
      await approveStudioUsageApi(usageScheduleId);
      await actions.reload();
      alert("Duyệt lịch sử dụng studio thành công.");
    } catch (error) {
      console.error(error);
      alert(
        error instanceof Error
          ? error.message
          : "Duyệt lịch sử dụng studio thất bại."
      );
    }
  }

  function saveEmployeeLocal(payload: EmployeeView) {
    setEmployeesData((prev) => {
      const exists = prev.some((item) => item.employee_id === payload.employee_id);
      return exists
        ? prev.map((item) =>
            item.employee_id === payload.employee_id ? payload : item
          )
        : [payload, ...prev];
    });
  }

  function deleteEmployeeLocal(employeeId: string) {
    setEmployeesData((prev) =>
      prev.filter((item) => item.employee_id !== employeeId)
    );
  }

  function savePartyLocal(payload: PartyView) {
    setPartiesData((prev) => {
      const exists = prev.some((item) => item.party_id === payload.party_id);
      return exists
        ? prev.map((item) =>
            item.party_id === payload.party_id ? payload : item
          )
        : [payload, ...prev];
    });
  }

  function deletePartyLocal(partyId: string) {
    setPartiesData((prev) =>
      prev.filter((item) => item.party_id !== partyId)
    );
  }

  function saveFileCatalogLocal(payload: FileCatalogSavePayload) {
    if (payload.mode === "edit") {
      setFilesData((prev) =>
        prev.map((item) =>
          item.file_id === payload.file_id
            ? {
                ...item,
                notes: payload.notes || undefined,
              }
            : item
        )
      );
      return;
    }

    const actorName =
      currentUser?.employee_name || currentUser?.username || "Hệ thống";

    const newRows: FileRow[] = payload.files.map((item) => ({
      file_id: createId("FL"),
      file_name: item.local_file.name,
      storage_path: "",
      file_extension: getFileExtension(item.local_file.name),
      file_size: item.local_file.size,
      folder: "general",
      uploaded_by_name: actorName,
      uploaded_at: getCurrentDateTimeString(),
      notes: item.notes || undefined,
    }));

    setFilesData((prev) => [...newRows, ...prev]);
  }

  function deleteFileCatalogLocal(fileId: string) {
    setFilesData((prev) => prev.filter((item) => item.file_id !== fileId));
  }

  async function handleSaveEmployee(payload: EmployeeView): Promise<boolean> {
    if (!isApiMode) {
      saveEmployeeLocal(payload);
      return true;
    }

    try {
      const saved = await saveEmployeeApi(payload);

      setEmployeesData((prev) => {
        const exists = prev.some((item) => item.employee_id === saved.employee_id);
        return exists
          ? prev.map((item) =>
              item.employee_id === saved.employee_id ? saved : item
            )
          : [saved, ...prev];
      });
      return true;
    } catch (error: any) {
      alert(error?.message || "Không lưu được nhân viên.");
      return false;
    }
  }

  async function handleDeleteEmployee(employeeId: string) {
    if (!isApiMode) {
      deleteEmployeeLocal(employeeId);
      return;
    }

    try {
      await deleteEmployeeApi(employeeId);
      setEmployeesData((prev) =>
        prev.filter((item) => item.employee_id !== employeeId)
      );
    } catch (error: any) {
      alert(error?.message || "Không xóa được nhân viên.");
    }
  }

  async function handleSaveParty(payload: PartyView): Promise<boolean> {
    if (!isApiMode) {
      savePartyLocal(payload);
      return true;
    }

    try {
      const saved = await savePartyApi(payload);

      setPartiesData((prev) => {
        const exists = prev.some((item) => item.party_id === saved.party_id);
        return exists
          ? prev.map((item) => (item.party_id === saved.party_id ? saved : item))
          : [saved, ...prev];
      });
      return true;
    } catch (error: any) {
      alert(error?.message || "Không lưu được đối tác / khách hàng.");
      return false;
    }
  }

  async function handleDeleteParty(partyId: string) {
    if (!isApiMode) {
      deletePartyLocal(partyId);
      return;
    }

    try {
      await deletePartyApi(partyId);
      setPartiesData((prev) =>
        prev.filter((item) => item.party_id !== partyId)
      );
    } catch (error: any) {
      alert(error?.message || "Không xóa được đối tác / khách hàng.");
    }
  }

  async function handleSaveFileCatalog(payload: FileCatalogSavePayload): Promise<boolean> {
    if (!isApiMode) {
      saveFileCatalogLocal(payload);
      return true;
    }

    try {
      if (payload.mode === "edit") {
        const saved = await updateFileCatalogApi(payload.file_id, {
          notes: payload.notes || null,
        });

        setFilesData((prev) =>
          prev.map((item) => (item.file_id === saved.file_id ? saved : item))
        );
        return true;
      }

      const uploadedRows = await uploadCatalogFilesApi(
        payload.files.map((item) => item.local_file)
      );

      const sharedNotes = payload.files[0]?.notes || null;

      let finalRows = uploadedRows;

      if (sharedNotes) {
        finalRows = await Promise.all(
          uploadedRows.map((row) =>
            updateFileCatalogApi(row.file_id, {
              notes: sharedNotes,
            })
          )
        );
      }

      setFilesData((prev) => mergeById(prev, finalRows, "file_id"));
      return true;
    } catch (error: any) {
      alert(error?.message || "Không lưu được file.");
      return false;
    }
  }

  async function handleDeleteFileCatalog(fileId: string) {
    if (!isApiMode) {
      deleteFileCatalogLocal(fileId);
      return;
    }

    try {
      await deleteFileCatalogApi(fileId);
      setFilesData((prev) => prev.filter((item) => item.file_id !== fileId));
    } catch (error: any) {
      alert(error?.message || "Không xóa được file.");
    }
  }

  if (!currentUser) {
    return (
      <LoginPage
        onLogin={async (username, password) => {
          const result = await loginUser({ username, password });
          saveStoredSessionUser(result.user);
          await actions.setSessionUser(result.user);
        }}
      />
    );
  }

  return (
    <Shell
      active={active}
      onChange={setActive}
      currentUser={currentUser}
      onLogout={() => {
        clearStoredSessionUser();
        void actions.setSessionUser(null);
      }}
    >
      {active === "dashboard" && (
        <DashboardPage
          currentUser={currentUser}
          contracts={contractsData}
          contents={contentsData}
          schedules={broadcastSchedulesData}
          studioUsageSchedules={studioUsageSchedulesData}
          paymentSchedules={paymentSchedulesData}
          serviceItems={serviceItemsData}
          bookings={bookingsData}
          payments={paymentsData}
          invoices={invoicesData}
          productions={productionsData}
          studioRentals={dbData.studioRentals}
          studios={dbData.studios}
          channels={dbData.channels}
          productionTasks={productionTasksData}
          files={filesData}
          contractFileLinks={contractFileLinksData}
          contentFileLinks={contentFileLinksData}
          serviceItemContents={serviceItemContentsData}
          productionFileLinks={productionFileLinksData}
          serviceItemProductions={serviceItemProductionsData}
        />
      )}

       {active === "contracts" && (
        <ContractsPage
          currentUser={currentUser}
          contracts={contractsData}
          serviceItems={serviceItemsData}
          parties={partiesData}
          bookings={bookingsData}
          paymentSchedules={paymentSchedulesData}
          payments={paymentsData}
          invoices={invoicesData}
          files={filesData}
          contractFileLinks={contractFileLinksData}
          channels={dbData.channels}
          studios={dbData.studios}
          contents={contentsData}
          productions={productionsData}
          productionTasks={productionTasksData}
          contentFileLinks={contentFileLinksData}
          serviceItemContents={serviceItemContentsData}
          productionFileLinks={productionFileLinksData}
          serviceItemProductions={serviceItemProductionsData}
          onSaveContract={saveContract}
          onSavePayment={savePayment}
          onSaveInvoice={saveInvoice}
          onDeleteContract={deleteContract}
          onImportContract={handleImportContracts}
          onUpdatePayment={updatePaymentAction}
          onDeletePayment={deletePaymentAction}
          onUpdateInvoice={updateInvoiceAction}
          onDeleteInvoice={deleteInvoiceAction}
        />
      )}

      {active === "productions" && (
        <ProductionsPage
          currentUser={currentUser}
          productions={productionsData}
          contracts={contractsData}
          serviceItems={serviceItemsData}
          employees={dbData.employees}
          productionTasks={productionTasksData}
          serviceItemProductions={serviceItemProductionsData}
          files={filesData}
          productionFileLinks={productionFileLinksData}
          onSaveProduction={saveProductionPayload}
          onDeleteProduction={deleteProduction}
          onImportProduction={handleImportProductions}
        />
      )}

      {active === "contents" && (
        <ContentsPage
          currentUser={currentUser}
          contents={contentsData}
          contracts={contractsData}
          serviceItems={serviceItemsData}
          serviceItemContents={serviceItemContentsData}
          files={filesData}
          contentFileLinks={contentFileLinksData}
          onSaveContent={saveContentPayload}
          onApproveContent={approveContent}
          onDeleteContent={deleteContent}
        />
      )}

      {active === "schedules" && (
        <SchedulesPage
          currentUser={currentUser}
          schedules={broadcastSchedulesData}
          studioUsageSchedules={studioUsageSchedulesData}
          contracts={contractsData}
          serviceItems={serviceItemsData}
          serviceItemContents={serviceItemContentsData}
          contents={contentsData}
          bookings={bookingsData}
          productions={productionsData}
          studios={dbData.studios}
          studioRentals={dbData.studioRentals}
          channels={dbData.channels}
          productionTasks={productionTasksData}
          files={filesData}
          contentFileLinks={contentFileLinksData}
          productionFileLinks={productionFileLinksData}
          serviceItemProductions={serviceItemProductionsData}
          onSaveBroadcastSchedule={saveBroadcastSchedule}
          onDeleteBroadcastSchedule={deleteBroadcastSchedule}
          onApproveBroadcastSchedule={approveBroadcastSchedule}
          onSaveStudioUsage={saveStudioUsagePayload}
          onDeleteStudioUsage={deleteStudioUsage}
          onApproveStudioUsage={approveStudioUsage}
        />
      )}

      {active === "catalog" && (
        <CatalogPage
          currentUser={currentUser}
          employees={employeesData}
          parties={partiesData}
          channels={dbData.channels}
          studios={dbData.studios}
          files={filesData}
          onSaveEmployee={handleSaveEmployee}
          onSaveParty={handleSaveParty}
          onSaveFileCatalog={handleSaveFileCatalog}
          onDeleteEmployee={handleDeleteEmployee}
          onDeleteParty={handleDeleteParty}
          onDeleteFileCatalog={handleDeleteFileCatalog}
        />
      )}
    </Shell>
  );
}

