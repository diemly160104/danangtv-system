import { z } from "zod";
import { withTransaction } from "../../db/tx";
import {
  deleteContractFilesRepo,
  deletePaymentSchedulesByIdsRepo,
  deleteServiceItemBookingDetailsRepo,
  deleteServiceItemsByIdsRepo,
  findPaymentSchedulesWithPaymentsRepo,
  findReferencedServiceItemsRepo,
  listPaymentSchedulesOfContractRepo,
  listServiceItemsOfContractRepo,
  updatePaymentScheduleRepo,
  updateServiceItemRepo,
  getPaymentScheduleOfContractRepo,
  getPaymentScheduleSummaryRepo,
  insertContractFileRepo,
  insertContractRepo,
  insertDigitalAdRepo,
  insertElectronicAdRepo,
  insertInvoiceFileRepo,
  insertInvoiceRepo,
  insertPaymentRepo,
  insertPaymentScheduleRepo,
  insertPrintedAdRepo,
  insertProductionServiceRepo,
  insertRadioAdRepo,
  insertServiceItemRepo,
  insertStudioRentalRepo,
  insertTelevisionAdRepo,
  listContractsRepo,
  updateContractRepo,
  updatePaymentScheduleStatusRepo,
  deleteContractRepo,
  findContractByNumberRepo,
  findInvoiceByNumberRepo,
  updatePaymentRepo,
  getPaymentByIdRepo,
  deletePaymentRepo,
  deleteInvoiceFilesRepo,
  updateInvoiceRepo,
  findInvoiceByNumberExceptRepo,
  getInvoiceByIdRepo,
  deleteInvoiceRepo,
} from "./contracts.repo";

const contractSaveSchema = z.object({
  contract: z.object({
    contract_id: z.string().optional(),
    contract_number: z.string(),
    title: z.string(),
    party_id: z.string(),
    contract_type: z.string(),
    signed_date: z.string(),
    start_date: z.string(),
    end_date: z.string().nullable(),
    contract_value: z.number(),
    discount: z.number(),
    total_value: z.number(),
    status: z.string(),
    notes: z.string(),
  }),
  contract_files: z.array(
    z.object({
      file_id: z.string().nullable(),
      local_file_name: z.string().nullable().optional(),
      local_file: z.any().optional(),
      file_role: z.string(),
      is_main: z.boolean(),
      notes: z.string(),
    })
  ),
  service_items: z.array(
    z.object({
      id: z.string().optional(),
      title: z.string(),
      service_type: z.string(),
      cost: z.string(),
      status: z.string(),
      notes: z.string(),
      bookings: z.array(z.any()),
    })
  ),
  payment_schedules: z.array(
    z.object({
      id: z.string().optional(),
      installment_no: z.string(),
      due_date: z.string(),
      planned_amount: z.string(),
      status: z.string(),
      notes: z.string(),
    })
  ),
});

const paymentSaveSchema = z.object({
  contract_id: z.string(),
  payment_schedule_id: z.string(),
  paid_date: z.string(),
  amount: z.number(),
  method: z.string(),
});

const invoiceSaveSchema = z.object({
  contract_id: z.string(),
  invoice_number: z.string(),
  issue_date: z.string(),
  total_amount: z.number(),
  status: z.string(),
  invoice_files: z.array(
    z.object({
      file_id: z.string().nullable(),
      local_file_name: z.string().nullable().optional(),
      local_file: z.any().optional(),
      file_role: z.string(),
      is_main: z.boolean(),
      notes: z.string(),
    })
  ),
});

function isUuidLike(value?: string | null) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeBookingValue(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "boolean") return value ? "1" : "0";
  return String(value).trim();
}

function buildBookingDuplicateKey(
  serviceType: string,
  booking: Record<string, any>
) {
  if (serviceType === "printed_ad") {
    return [
      normalizeBookingValue(booking.channel_id),
      normalizeBookingValue(booking.content_type),
      normalizeBookingValue(booking.area),
      normalizeBookingValue(booking.color),
      normalizeBookingValue(booking.start_date),
      normalizeBookingValue(booking.end_date),
      normalizeBookingValue(booking.num_issues || 1),
    ].join("|");
  }

  if (serviceType === "electronic_ad") {
    return [
      normalizeBookingValue(booking.channel_id),
      normalizeBookingValue(booking.subtype),
      normalizeBookingValue(booking.subtype === "banner" ? "" : booking.content_type),
      normalizeBookingValue(booking.subtype === "article" ? booking.form : ""),
      normalizeBookingValue(booking.quantity),
      normalizeBookingValue(booking.subtype === "banner" ? booking.position : ""),
      normalizeBookingValue(booking.has_video),
      normalizeBookingValue(booking.has_link),
      normalizeBookingValue(booking.start_date),
      normalizeBookingValue(booking.end_date),
    ].join("|");
  }

  if (serviceType === "tv_ad") {
    return [
      normalizeBookingValue(booking.channel_id),
      normalizeBookingValue(booking.broadcast_type),
      normalizeBookingValue(booking.broadcast_type === "insert" ? booking.insert_type : ""),
      normalizeBookingValue(booking.program),
      normalizeBookingValue(booking.time_point),
      normalizeBookingValue(booking.start_time),
      normalizeBookingValue(booking.end_time),
      normalizeBookingValue(booking.start_date),
      normalizeBookingValue(booking.end_date),
      normalizeBookingValue(booking.num_broadcasts),
    ].join("|");
  }

  if (serviceType === "radio_ad") {
    return [
      normalizeBookingValue(booking.channel_id),
      normalizeBookingValue(booking.content_type),
      normalizeBookingValue(booking.program),
      normalizeBookingValue(booking.time_point),
      normalizeBookingValue(booking.start_time),
      normalizeBookingValue(booking.end_time),
      normalizeBookingValue(booking.start_date),
      normalizeBookingValue(booking.end_date),
      normalizeBookingValue(booking.num_broadcasts),
    ].join("|");
  }

  if (serviceType === "digital_ad") {
    return [
      normalizeBookingValue(booking.channel_id),
      normalizeBookingValue(booking.content_type),
      normalizeBookingValue(booking.post_date),
      normalizeBookingValue(booking.start_date),
      normalizeBookingValue(booking.end_date),
      normalizeBookingValue(booking.quantity),
      normalizeBookingValue(booking.has_experiencer),
    ].join("|");
  }

  if (serviceType === "studio_rental") {
    return [
      normalizeBookingValue(booking.studio_id),
      normalizeBookingValue(booking.rental_type),
      normalizeBookingValue(booking.rental_start),
      normalizeBookingValue(booking.rental_end),
    ].join("|");
  }

  if (serviceType === "content_production") {
    return [
      normalizeBookingValue(booking.content_type),
      normalizeBookingValue(booking.requirement_description),
      normalizeBookingValue(booking.delivery_deadline),
    ].join("|");
  }

  return JSON.stringify(
    Object.keys(booking)
      .filter((key) => key !== "id" && key !== "notes")
      .sort()
      .reduce<Record<string, string>>((acc, key) => {
        acc[key] = normalizeBookingValue(booking[key]);
        return acc;
      }, {})
  );
}

function assertNoDuplicateBookingsInServiceItem(item: {
  title: string;
  service_type: string;
  bookings?: any[];
}) {
  const seen = new Set<string>();

  for (const booking of item.bookings ?? []) {
    const key = buildBookingDuplicateKey(item.service_type, booking);

    if (seen.has(key)) {
      throw new Error(
        `Mục dịch vụ "${item.title}" đang có booking bị trùng lặp.`
      );
    }

    seen.add(key);
  }
}

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

async function refreshPaymentScheduleStatus(
  client: any,
  paymentScheduleId: string
) {
  const summary = await getPaymentScheduleSummaryRepo(client, paymentScheduleId);

  if (!summary) return;

  const plannedAmount = Number(summary.planned_amount || 0);
  const totalPaid = Number(summary.total_paid || 0);

  const nextStatus =
    totalPaid <= 0 ? "planned" : totalPaid >= plannedAmount ? "paid" : "partial";

  await updatePaymentScheduleStatusRepo(client, paymentScheduleId, nextStatus);
}

export async function listContractsService() {
  return listContractsRepo();
}

export async function saveContractService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = contractSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const normalizedContractNumber = String(
      payload.contract.contract_number || ""
    ).trim();

    if (!normalizedContractNumber) {
      throw new Error("Số hợp đồng không được để trống.");
    }

    const duplicateContract = await findContractByNumberRepo(
      client,
      normalizedContractNumber,
      payload.contract.contract_id || null
    );

    if (duplicateContract) {
      throw new Error(
        `Số hợp đồng "${normalizedContractNumber}" đã tồn tại.`
      );
    }

    let contractRow: any;

    if (payload.contract.contract_id) {
      contractRow = await updateContractRepo(client, {
        contract_id: payload.contract.contract_id,
        contract_number: normalizedContractNumber,
        title: payload.contract.title,
        party_id: payload.contract.party_id,
        contract_type: payload.contract.contract_type,
        signed_date: payload.contract.signed_date,
        start_date: payload.contract.start_date,
        end_date: payload.contract.end_date,
        contract_value: payload.contract.contract_value,
        discount: payload.contract.discount,
        total_value: payload.contract.total_value,
        status: payload.contract.status,
        notes: payload.contract.notes,
        updated_by: actorUserId,
      });

      await deleteContractFilesRepo(client, contractRow.contract_id);

      const existingPaymentSchedules = await listPaymentSchedulesOfContractRepo(
        client,
        contractRow.contract_id
      );
      const existingPaymentScheduleIds = existingPaymentSchedules.map(
        (item) => item.payment_schedule_id
      );
      const incomingPaymentScheduleIds = payload.payment_schedules
        .map((item) => (item.id && isUuidLike(item.id) ? item.id : null))
        .filter(Boolean) as string[];

      const removedPaymentScheduleIds = existingPaymentScheduleIds.filter(
        (id) => !incomingPaymentScheduleIds.includes(id)
      );

      const referencedPaymentSchedules = await findPaymentSchedulesWithPaymentsRepo(
        client,
        removedPaymentScheduleIds
      );

      if (referencedPaymentSchedules.length > 0) {
        throw new Error(
          `Không thể xóa lịch thanh toán đã có thanh toán thực tế: ${referencedPaymentSchedules
            .map((item) => `đợt ${item.installment_no}`)
            .join(", ")}.`
        );
      }

      await deletePaymentSchedulesByIdsRepo(client, removedPaymentScheduleIds);

      const existingServiceItems = await listServiceItemsOfContractRepo(
        client,
        contractRow.contract_id
      );
      const existingServiceItemIds = existingServiceItems.map(
        (item) => item.service_item_id
      );
      const incomingServiceItemIds = payload.service_items
        .map((item) => (item.id && isUuidLike(item.id) ? item.id : null))
        .filter(Boolean) as string[];

      const removedServiceItemIds = existingServiceItemIds.filter(
        (id) => !incomingServiceItemIds.includes(id)
      );

      const referencedServiceItems = await findReferencedServiceItemsRepo(
        client,
        removedServiceItemIds
      );

      if (referencedServiceItems.length > 0) {
        throw new Error(
          `Không thể xóa mục dịch vụ đang được sử dụng: ${referencedServiceItems
            .map((item) => item.title)
            .join(", ")}.`
        );
      }

      await deleteServiceItemsByIdsRepo(client, removedServiceItemIds);
    } else {
      contractRow = await insertContractRepo(client, {
        contract_number: normalizedContractNumber,
        title: payload.contract.title,
        party_id: payload.contract.party_id,
        contract_type: payload.contract.contract_type,
        signed_date: payload.contract.signed_date,
        start_date: payload.contract.start_date,
        end_date: payload.contract.end_date,
        contract_value: payload.contract.contract_value,
        discount: payload.contract.discount,
        total_value: payload.contract.total_value,
        status: payload.contract.status,
        notes: payload.contract.notes,
        created_by: actorUserId,
      });
    }

    for (const fileRow of payload.contract_files) {
      if (!fileRow.file_id) continue;

      await insertContractFileRepo(client, {
        contract_id: contractRow.contract_id,
        file_id: fileRow.file_id,
        file_role: fileRow.file_role,
        is_main: fileRow.is_main,
        notes: fileRow.notes,
      });
    }

    for (const paymentRow of payload.payment_schedules) {
      const hasExistingId = !!(paymentRow.id && isUuidLike(paymentRow.id));

      if (hasExistingId) {
        await updatePaymentScheduleRepo(client, {
          payment_schedule_id: paymentRow.id!,
          installment_no: Number(paymentRow.installment_no),
          due_date: paymentRow.due_date,
          planned_amount: Number(paymentRow.planned_amount),
          status: paymentRow.status,
          notes: paymentRow.notes,
        });
      } else {
        await insertPaymentScheduleRepo(client, {
          payment_schedule_id: undefined,
          contract_id: contractRow.contract_id,
          installment_no: Number(paymentRow.installment_no),
          due_date: paymentRow.due_date,
          planned_amount: Number(paymentRow.planned_amount),
          status: paymentRow.status,
          notes: paymentRow.notes,
        });
      }
    }

    for (const item of payload.service_items) {
      assertNoDuplicateBookingsInServiceItem(item);

      const hasExistingServiceItemId = !!(item.id && isUuidLike(item.id));

      const serviceItemRow = hasExistingServiceItemId
        ? await updateServiceItemRepo(client, {
            service_item_id: item.id!,
            title: item.title,
            service_type: item.service_type,
            cost: Number(item.cost),
            status: item.status,
            notes: item.notes,
          })
        : await insertServiceItemRepo(client, {
            service_item_id: undefined,
            contract_id: contractRow.contract_id,
            title: item.title,
            service_type: item.service_type,
            cost: Number(item.cost),
            status: item.status,
            notes: item.notes,
          });

      await deleteServiceItemBookingDetailsRepo(client, [
        serviceItemRow.service_item_id,
      ]);

      for (const booking of item.bookings ?? []) {
        if (item.service_type === "printed_ad") {
          await insertPrintedAdRepo(client, {
            printed_ads_id: booking.id && isUuidLike(booking.id) ? booking.id : undefined,
            service_item_id: serviceItemRow.service_item_id,
            channel_id: booking.channel_id,
            content_type: booking.content_type,
            area: booking.area,
            color: booking.color,
            start_date: booking.start_date || null,
            end_date: booking.end_date || null,
            num_issues: Number(booking.num_issues || 1),
            notes: booking.notes || "",
          });
          continue;
        }

        if (item.service_type === "electronic_ad") {
          await insertElectronicAdRepo(client, {
            electronic_ads_id: booking.id && isUuidLike(booking.id) ? booking.id : undefined,
            service_item_id: serviceItemRow.service_item_id,
            channel_id: booking.channel_id,
            subtype: booking.subtype,
            content_type:
              booking.subtype === "banner"
                ? null
                : booking.content_type || null,
            form: booking.subtype === "article" ? booking.form || null : null,
            quantity: booking.quantity ? Number(booking.quantity) : null,
            position:
              booking.subtype === "banner" ? booking.position || null : null,
            has_video: !!booking.has_video,
            has_link: !!booking.has_link,
            start_date: booking.start_date || null,
            end_date: booking.end_date || null,
            notes: booking.notes || "",
          });
          continue;
        }

        if (item.service_type === "tv_ad") {
          await insertTelevisionAdRepo(client, {
            tv_ads_id: booking.id && isUuidLike(booking.id) ? booking.id : undefined,
            service_item_id: serviceItemRow.service_item_id,
            channel_id: booking.channel_id,
            broadcast_type: booking.broadcast_type,
            insert_type:
              booking.broadcast_type === "insert"
                ? booking.insert_type || null
                : null,
            program: booking.program || null,
            time_point: booking.time_point || null,
            start_time: booking.start_time || null,
            end_time: booking.end_time || null,
            start_date: booking.start_date || null,
            end_date: booking.end_date || null,
            num_broadcasts: booking.num_broadcasts
              ? Number(booking.num_broadcasts)
              : null,
            notes: booking.notes || "",
          });
          continue;
        }

        if (item.service_type === "radio_ad") {
          await insertRadioAdRepo(client, {
            radio_ads_id: booking.id && isUuidLike(booking.id) ? booking.id : undefined,
            service_item_id: serviceItemRow.service_item_id,
            channel_id: booking.channel_id,
            content_type: booking.content_type,
            program: booking.program || null,
            time_point: booking.time_point || null,
            start_time: booking.start_time || null,
            end_time: booking.end_time || null,
            start_date: booking.start_date || null,
            end_date: booking.end_date || null,
            num_broadcasts: booking.num_broadcasts
              ? Number(booking.num_broadcasts)
              : null,
            notes: booking.notes || "",
          });
          continue;
        }

        if (item.service_type === "digital_ad") {
          await insertDigitalAdRepo(client, {
            digital_ads_id: booking.id && isUuidLike(booking.id) ? booking.id : undefined,
            service_item_id: serviceItemRow.service_item_id,
            channel_id: booking.channel_id,
            content_type: booking.content_type,
            post_date: booking.post_date || null,
            start_date: booking.start_date || null,
            end_date: booking.end_date || null,
            quantity: booking.quantity ? Number(booking.quantity) : null,
            has_experiencer: !!booking.has_experiencer,
            notes: booking.notes || "",
          });
          continue;
        }

        if (item.service_type === "studio_rental") {
          await insertStudioRentalRepo(client, {
            rental_id: booking.id && isUuidLike(booking.id) ? booking.id : undefined,
            service_item_id: serviceItemRow.service_item_id,
            studio_id: booking.studio_id,
            rental_type: booking.rental_type,
            rental_start: booking.rental_start,
            rental_end: booking.rental_end,
            notes: booking.notes || "",
          });
          continue;
        }

        if (item.service_type === "content_production") {
          await insertProductionServiceRepo(client, {
            production_service_id:
              booking.id && isUuidLike(booking.id) ? booking.id : undefined,
            service_item_id: serviceItemRow.service_item_id,
            content_type: booking.content_type || null,
            requirement_description: booking.requirement_description || "",
            delivery_deadline: booking.delivery_deadline || null,
            notes: booking.notes || "",
          });
        }
      }
    }

    return {
      ok: true,
      contract_id: contractRow.contract_id,
    };
  });
}

export async function createPaymentService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = paymentSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const schedule = await getPaymentScheduleOfContractRepo(
      client,
      payload.contract_id,
      payload.payment_schedule_id
    );

    if (!schedule) {
      throw new Error("Không tìm thấy đợt thanh toán thuộc hợp đồng này.");
    }

    const paymentRow = await insertPaymentRepo(client, {
      payment_schedule_id: payload.payment_schedule_id,
      paid_date: payload.paid_date,
      amount: payload.amount,
      method: payload.method,
      notes: "",
      created_by: actorUserId,
    });

    await refreshPaymentScheduleStatus(client, payload.payment_schedule_id);

    return {
      ok: true,
      payment_id: paymentRow.payment_id,
    };
  });
}

export async function updatePaymentService(
  paymentId: string,
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = paymentSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const existingPayment = await getPaymentByIdRepo(client, paymentId);

    if (!existingPayment) {
      throw new Error("Không tìm thấy khoản thanh toán.");
    }

    const schedule = await getPaymentScheduleOfContractRepo(
      client,
      payload.contract_id,
      payload.payment_schedule_id
    );

    if (!schedule) {
      throw new Error("Không tìm thấy đợt thanh toán thuộc hợp đồng này.");
    }

    const oldPaymentScheduleId = existingPayment.payment_schedule_id;

    const paymentRow = await updatePaymentRepo(client, paymentId, {
      payment_schedule_id: payload.payment_schedule_id,
      paid_date: payload.paid_date,
      amount: payload.amount,
      method: payload.method,
      notes: "",
      updated_by: actorUserId,
    });

    if (oldPaymentScheduleId !== payload.payment_schedule_id) {
      await refreshPaymentScheduleStatus(client, oldPaymentScheduleId);
    }

    await refreshPaymentScheduleStatus(client, payload.payment_schedule_id);

    return {
      ok: true,
      payment_id: paymentRow.payment_id,
    };
  });
}

export async function deletePaymentService(paymentId: string) {
  return withTransaction(async (client) => {
    const existingPayment = await getPaymentByIdRepo(client, paymentId);

    if (!existingPayment) {
      throw new Error("Không tìm thấy khoản thanh toán.");
    }

    const paymentScheduleId = existingPayment.payment_schedule_id;

    await deletePaymentRepo(client, paymentId);
    await refreshPaymentScheduleStatus(client, paymentScheduleId);

    return { ok: true };
  });
}

export async function createInvoiceService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = invoiceSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const normalizedInvoiceNumber = normalizeText(payload.invoice_number);

    if (!normalizedInvoiceNumber) {
      throw new Error("Số hóa đơn không được để trống.");
    }

    const duplicateInvoice = await findInvoiceByNumberRepo(
      client,
      normalizedInvoiceNumber
    );

    if (duplicateInvoice) {
      throw new Error(
        `Số hóa đơn "${normalizedInvoiceNumber}" đã tồn tại.`
      );
    }

    const invoiceRow = await insertInvoiceRepo(client, {
      invoice_number: normalizedInvoiceNumber,
      contract_id: payload.contract_id,
      issue_date: payload.issue_date || null,
      total_amount: payload.total_amount,
      status: payload.status,
      notes: "",
      created_by: actorUserId,
    });

    for (const fileRow of payload.invoice_files) {
      if (!fileRow.file_id) continue;

      await insertInvoiceFileRepo(client, {
        invoice_id: invoiceRow.invoice_id,
        file_id: fileRow.file_id,
        file_role: fileRow.file_role,
        is_main: fileRow.is_main,
        notes: fileRow.notes,
      });
    }

    return {
      ok: true,
      invoice_id: invoiceRow.invoice_id,
    };
  });
}

export async function updateInvoiceService(
  invoiceId: string,
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = invoiceSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const existingInvoice = await getInvoiceByIdRepo(client, invoiceId);

    if (!existingInvoice) {
      throw new Error("Không tìm thấy hóa đơn.");
    }

    const normalizedInvoiceNumber = normalizeText(payload.invoice_number);

    if (!normalizedInvoiceNumber) {
      throw new Error("Số hóa đơn không được để trống.");
    }

    const duplicateInvoice = await findInvoiceByNumberExceptRepo(
      client,
      normalizedInvoiceNumber,
      invoiceId
    );

    if (duplicateInvoice) {
      throw new Error(`Số hóa đơn "${normalizedInvoiceNumber}" đã tồn tại.`);
    }

    const invoiceRow = await updateInvoiceRepo(client, invoiceId, {
      invoice_number: normalizedInvoiceNumber,
      contract_id: payload.contract_id,
      issue_date: payload.issue_date || null,
      total_amount: payload.total_amount,
      status: payload.status,
      notes: "",
      updated_by: actorUserId,
    });

    await deleteInvoiceFilesRepo(client, invoiceId);

    for (const fileRow of payload.invoice_files) {
      if (!fileRow.file_id) continue;

      await insertInvoiceFileRepo(client, {
        invoice_id: invoiceRow.invoice_id,
        file_id: fileRow.file_id,
        file_role: fileRow.file_role,
        is_main: fileRow.is_main,
        notes: fileRow.notes,
      });
    }

    return {
      ok: true,
      invoice_id: invoiceRow.invoice_id,
    };
  });
}

export async function deleteInvoiceService(invoiceId: string) {
  return withTransaction(async (client) => {
    const existingInvoice = await getInvoiceByIdRepo(client, invoiceId);

    if (!existingInvoice) {
      throw new Error("Không tìm thấy hóa đơn.");
    }

    await deleteInvoiceRepo(client, invoiceId);
    return { ok: true };
  });
}

export async function deleteContractService(contractId: string) {
  return withTransaction(async (client) => {
    await deleteContractRepo(client, contractId);
    return { ok: true };
  });
}