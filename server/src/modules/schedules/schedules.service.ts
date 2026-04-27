import { z } from "zod";
import { withTransaction } from "../../db/tx";
import {
  approveBroadcastScheduleRepo,
  approveStudioUsageRepo,
  deleteBroadcastScheduleRepo,
  deleteStudioUsageRepo,
  findConflictingBroadcastScheduleRepo,
  findConflictingStudioUsageRepo,
  getBookingOfServiceItemRepo,
  getContentStatusRepo,
  getStudioRentalRepo,
  insertBroadcastScheduleRepo,
  insertStudioUsageRepo,
  updateBroadcastScheduleRepo,
  updateStudioUsageRepo,
} from "./schedules.repo";

const broadcastScheduleSaveSchema = z.object({
  broadcast_id: z.string().optional(),
  program_name: z.string().min(1),
  schedule_type: z.string(),
  schedule_mode: z.string(),
  service_item_id: z.string().optional().nullable(),
  booking_id: z.string().optional().nullable(),
  channel_id: z.string().min(1),
  content_id: z.string().min(1),
  scheduled_start: z.string().min(1),
  scheduled_end: z.string().optional().nullable(),
  status: z.string(),
  notes: z.string().optional().default(""),
});

const studioUsageSaveSchema = z.object({
  usage_schedule_id: z.string().optional(),
  studio_id: z.string().min(1),
  production_id: z.string().optional().nullable(),
  rental_id: z.string().optional().nullable(),
  usage_start: z.string().min(1),
  usage_end: z.string().min(1),
  status: z.string(),
  notes: z.string().optional().default(""),
});

function isUuidLike(value?: string | null) {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

function normalizeDateTimeText(value?: string | null) {
  return String(value || "").trim().replace("T", " ");
}

function assertValidTimeRange(
  startValue: string,
  endValue?: string | null,
  rangeLabel = "Khoảng thời gian"
) {
  const start = normalizeDateTimeText(startValue);
  const end = endValue ? normalizeDateTimeText(endValue) : null;

  if (!start) {
    throw new Error(`${rangeLabel} bắt đầu không hợp lệ.`);
  }

  if (end && start >= end) {
    throw new Error(`${rangeLabel} kết thúc phải lớn hơn thời gian bắt đầu.`);
  }

  return {
    start,
    end,
  };
}

export async function saveBroadcastScheduleService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = broadcastScheduleSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const content = await getContentStatusRepo(client, payload.content_id);
    if (!content) {
      throw new Error("Không tìm thấy content.");
    }

    const serviceItemId = payload.service_item_id || null;
    const bookingId = payload.booking_id || null;

    if (serviceItemId && !bookingId) {
      throw new Error("Lịch gắn với dịch vụ phải chọn booking chi tiết.");
    }

    if (!serviceItemId && bookingId) {
      throw new Error("Không thể chọn booking nếu chưa chọn mục dịch vụ.");
    }

    if (serviceItemId && bookingId) {
      const booking = await getBookingOfServiceItemRepo(
        client,
        bookingId,
        serviceItemId
      );

      if (!booking) {
        throw new Error("Booking không thuộc mục dịch vụ đã chọn.");
      }
    }

    const normalizedProgramName = String(payload.program_name || "").trim();
    if (!normalizedProgramName) {
      throw new Error("Tên chương trình không được để trống.");
    }

    const normalizedRange = assertValidTimeRange(
      payload.scheduled_start,
      payload.scheduled_end || null,
      "Thời gian phát"
    );

    const conflictingSchedule = await findConflictingBroadcastScheduleRepo(
      client,
      {
        channel_id: payload.channel_id,
        scheduled_start: normalizedRange.start,
        scheduled_end: normalizedRange.end,
        excludeBroadcastId: isUuidLike(payload.broadcast_id)
          ? payload.broadcast_id
          : null,
      }
    );

    if (conflictingSchedule) {
      throw new Error(
        `Kênh này đã có lịch khác trong khoảng thời gian đã chọn (${conflictingSchedule.scheduled_start} → ${conflictingSchedule.scheduled_end || conflictingSchedule.scheduled_start}).`
      );
    }

    const approvedBy = payload.status === "approved" ? actorUserId : null;
    const approvedAt =
      payload.status === "approved" ? new Date().toISOString() : null;

    if (isUuidLike(payload.broadcast_id)) {
      const row = await updateBroadcastScheduleRepo(client, {
        broadcast_id: payload.broadcast_id,
        program_name: normalizedProgramName,
        schedule_type: payload.schedule_type,
        schedule_mode: payload.schedule_mode,
        service_item_id: serviceItemId,
        booking_id: bookingId,
        channel_id: payload.channel_id,
        content_id: payload.content_id,
        scheduled_start: normalizedRange.start,
        scheduled_end: normalizedRange.end,
        status: payload.status,
        notes: payload.notes || "",
        approved_by: approvedBy,
        approved_at: approvedAt,
        updated_by: actorUserId,
      });

      return {
        ok: true,
        broadcast_id: row.broadcast_id,
      };
    }

    const row = await insertBroadcastScheduleRepo(client, {
      program_name: normalizedProgramName,
      schedule_type: payload.schedule_type,
      schedule_mode: payload.schedule_mode,
      service_item_id: serviceItemId,
      booking_id: bookingId,
      channel_id: payload.channel_id,
      content_id: payload.content_id,
      scheduled_start: normalizedRange.start,
      scheduled_end: normalizedRange.end,
      status: payload.status,
      notes: payload.notes || "",
      approved_by: approvedBy,
      approved_at: approvedAt,
      created_by: actorUserId,
    });

    return {
      ok: true,
      broadcast_id: row.broadcast_id,
    };
  });
}

export async function approveBroadcastScheduleService(
  broadcastId: string,
  actorUserId: string
) {
  return withTransaction(async (client) => {
    const row = await approveBroadcastScheduleRepo(
      client,
      broadcastId,
      actorUserId
    );

    return {
      ok: true,
      broadcast_id: row.broadcast_id,
    };
  });
}

export async function deleteBroadcastScheduleService(broadcastId: string) {
  return withTransaction(async (client) => {
    await deleteBroadcastScheduleRepo(client, broadcastId);
    return { ok: true };
  });
}

export async function saveStudioUsageService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = studioUsageSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const productionId = payload.production_id || null;
    const rentalId = payload.rental_id || null;

    if ((productionId ? 1 : 0) + (rentalId ? 1 : 0) !== 1) {
      throw new Error(
        "Lịch studio phải chọn đúng một nguồn: hoặc sản xuất, hoặc cho thuê."
      );
    }

    const normalizedRange = assertValidTimeRange(
      payload.usage_start,
      payload.usage_end,
      "Thời gian sử dụng studio"
    );

    if (rentalId) {
      const rental = await getStudioRentalRepo(client, rentalId);
      if (!rental) {
        throw new Error("Không tìm thấy lịch thuê studio.");
      }

      if (rental.studio_id !== payload.studio_id) {
        throw new Error("Studio đã chọn không khớp với lịch thuê.");
      }
    }

    const conflictingUsage = await findConflictingStudioUsageRepo(client, {
      studio_id: payload.studio_id,
      usage_start: normalizedRange.start,
      usage_end: normalizedRange.end!,
      excludeUsageScheduleId: isUuidLike(payload.usage_schedule_id)
        ? payload.usage_schedule_id
        : null,
    });

    if (conflictingUsage) {
      throw new Error(
        `Studio đã có lịch sử dụng khác trong khoảng thời gian đã chọn (${conflictingUsage.usage_start} → ${conflictingUsage.usage_end}).`
      );
    }

    const approvedBy = payload.status === "approved" ? actorUserId : null;
    const approvedAt =
      payload.status === "approved" ? new Date().toISOString() : null;

    if (isUuidLike(payload.usage_schedule_id)) {
      const row = await updateStudioUsageRepo(client, {
        usage_schedule_id: payload.usage_schedule_id,
        studio_id: payload.studio_id,
        production_id: productionId,
        rental_id: rentalId,
        usage_start: normalizedRange.start,
        usage_end: normalizedRange.end!,
        status: payload.status,
        notes: payload.notes || "",
        approved_by: approvedBy,
        approved_at: approvedAt,
        updated_by: actorUserId,
      });

      return {
        ok: true,
        usage_schedule_id: row.usage_schedule_id,
      };
    }

    const row = await insertStudioUsageRepo(client, {
      studio_id: payload.studio_id,
      production_id: productionId,
      rental_id: rentalId,
      usage_start: normalizedRange.start,
      usage_end: normalizedRange.end!,
      status: payload.status,
      notes: payload.notes || "",
      approved_by: approvedBy,
      approved_at: approvedAt,
      created_by: actorUserId,
    });

    return {
      ok: true,
      usage_schedule_id: row.usage_schedule_id,
    };
  });
}

export async function approveStudioUsageService(
  usageScheduleId: string,
  actorUserId: string
) {
  return withTransaction(async (client) => {
    const row = await approveStudioUsageRepo(
      client,
      usageScheduleId,
      actorUserId
    );

    return {
      ok: true,
      usage_schedule_id: row.usage_schedule_id,
    };
  });
}

export async function deleteStudioUsageService(usageScheduleId: string) {
  return withTransaction(async (client) => {
    await deleteStudioUsageRepo(client, usageScheduleId);
    return { ok: true };
  });
}