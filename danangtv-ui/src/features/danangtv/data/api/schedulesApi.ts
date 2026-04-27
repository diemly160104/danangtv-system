import type { BroadcastScheduleRow, StudioUsageRow } from "../../types";
import { apiRequest } from "./http";
import { danangTvApiEndpoints } from "./endpoints";

export async function createBroadcastSchedule(payload: BroadcastScheduleRow) {
  return apiRequest<{ ok: true; broadcast_id: string }>(
    danangTvApiEndpoints.schedules,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateBroadcastSchedule(
  broadcastId: string,
  payload: BroadcastScheduleRow
) {
  return apiRequest<{ ok: true; broadcast_id: string }>(
    danangTvApiEndpoints.scheduleById(broadcastId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function approveBroadcastSchedule(broadcastId: string) {
  return apiRequest<{ ok: true; broadcast_id: string }>(
    danangTvApiEndpoints.scheduleApprove(broadcastId),
    {
      method: "POST",
    }
  );
}

export async function deleteBroadcastSchedule(broadcastId: string) {
  return apiRequest<{ ok: true }>(
    danangTvApiEndpoints.scheduleById(broadcastId),
    {
      method: "DELETE",
    }
  );
}

export async function createStudioUsage(payload: StudioUsageRow) {
  return apiRequest<{ ok: true; usage_schedule_id: string }>(
    danangTvApiEndpoints.studioUsageSchedules,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  );
}

export async function updateStudioUsage(
  usageScheduleId: string,
  payload: StudioUsageRow
) {
  return apiRequest<{ ok: true; usage_schedule_id: string }>(
    danangTvApiEndpoints.studioUsageById(usageScheduleId),
    {
      method: "PUT",
      body: JSON.stringify(payload),
    }
  );
}

export async function approveStudioUsage(usageScheduleId: string) {
  return apiRequest<{ ok: true; usage_schedule_id: string }>(
    danangTvApiEndpoints.studioUsageApprove(usageScheduleId),
    {
      method: "POST",
    }
  );
}

export async function deleteStudioUsage(usageScheduleId: string) {
  return apiRequest<{ ok: true }>(
    danangTvApiEndpoints.studioUsageById(usageScheduleId),
    {
      method: "DELETE",
    }
  );
}