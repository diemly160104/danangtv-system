import type { PoolClient } from "pg";

type BroadcastScheduleRepoInput = {
  broadcast_id?: string;
  program_name: string;
  schedule_type: string;
  schedule_mode: string;
  service_item_id: string | null;
  booking_id: string | null;
  channel_id: string;
  content_id: string;
  scheduled_start: string;
  scheduled_end: string | null;
  status: string;
  notes: string;
  created_by?: string;
  updated_by?: string;
  approved_by?: string | null;
  approved_at?: string | null;
};

type StudioUsageRepoInput = {
  usage_schedule_id?: string;
  studio_id: string;
  production_id: string | null;
  rental_id: string | null;
  usage_start: string;
  usage_end: string;
  status: string;
  notes: string;
  created_by?: string;
  updated_by?: string;
  approved_by?: string | null;
  approved_at?: string | null;
};

export async function getContentStatusRepo(
  client: PoolClient,
  contentId: string
) {
  const result = await client.query(
    `
    select content_id, status
    from "Contents"
    where content_id = $1
    `,
    [contentId]
  );

  return result.rows[0] || null;
}

export async function getBookingOfServiceItemRepo(
  client: PoolClient,
  bookingId: string,
  serviceItemId: string
) {
  const result = await client.query(
    `
    select booking_id, service_item_id
    from (
      select printed_ads_id as booking_id, service_item_id from "PrintedAds"
      union all
      select electronic_ads_id as booking_id, service_item_id from "ElectronicAds"
      union all
      select tv_ads_id as booking_id, service_item_id from "TelevisionAds"
      union all
      select radio_ads_id as booking_id, service_item_id from "RadioAds"
      union all
      select digital_ads_id as booking_id, service_item_id from "DigitalAds"
      union all
      select production_service_id as booking_id, service_item_id from "ProductionServices"
      union all
      select rental_id as booking_id, service_item_id from "StudioRentals"
    ) booking_union
    where booking_id = $1
      and service_item_id = $2
    `,
    [bookingId, serviceItemId]
  );

  return result.rows[0] || null;
}

export async function getStudioRentalRepo(
  client: PoolClient,
  rentalId: string
) {
  const result = await client.query(
    `
    select rental_id, service_item_id, studio_id
    from "StudioRentals"
    where rental_id = $1
    `,
    [rentalId]
  );

  return result.rows[0] || null;
}

export async function insertBroadcastScheduleRepo(
  client: PoolClient,
  input: BroadcastScheduleRepoInput
) {
  const result = await client.query(
    `
    insert into "BroadcastSchedules" (
      program_name,
      schedule_type,
      schedule_mode,
      service_item_id,
      booking_id,
      channel_id,
      content_id,
      scheduled_start,
      scheduled_end,
      status,
      approved_by,
      approved_at,
      notes,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    returning *
    `,
    [
      input.program_name,
      input.schedule_type,
      input.schedule_mode,
      input.service_item_id,
      input.booking_id,
      input.channel_id,
      input.content_id,
      input.scheduled_start,
      input.scheduled_end,
      input.status,
      input.approved_by,
      input.approved_at,
      input.notes,
      input.created_by,
    ]
  );

  return result.rows[0];
}

export async function updateBroadcastScheduleRepo(
  client: PoolClient,
  input: BroadcastScheduleRepoInput
) {
  const result = await client.query(
    `
    update "BroadcastSchedules"
    set
      program_name = $2,
      schedule_type = $3,
      schedule_mode = $4,
      service_item_id = $5,
      booking_id = $6,
      channel_id = $7,
      content_id = $8,
      scheduled_start = $9,
      scheduled_end = $10,
      status = $11,
      approved_by = $12,
      approved_at = $13,
      notes = $14,
      updated_by = $15,
      updated_at = current_timestamp
    where broadcast_id = $1
    returning *
    `,
    [
      input.broadcast_id,
      input.program_name,
      input.schedule_type,
      input.schedule_mode,
      input.service_item_id,
      input.booking_id,
      input.channel_id,
      input.content_id,
      input.scheduled_start,
      input.scheduled_end,
      input.status,
      input.approved_by,
      input.approved_at,
      input.notes,
      input.updated_by,
    ]
  );

  return result.rows[0];
}

export async function approveBroadcastScheduleRepo(
  client: PoolClient,
  broadcastId: string,
  approvedBy: string
) {
  const result = await client.query(
    `
    update "BroadcastSchedules"
    set
      status = 'approved',
      approved_by = $2,
      approved_at = current_timestamp,
      updated_by = $2,
      updated_at = current_timestamp
    where broadcast_id = $1
    returning *
    `,
    [broadcastId, approvedBy]
  );

  return result.rows[0];
}

export async function deleteBroadcastScheduleRepo(
  client: PoolClient,
  broadcastId: string
) {
  await client.query(
    `delete from "BroadcastSchedules" where broadcast_id = $1`,
    [broadcastId]
  );
}

export async function insertStudioUsageRepo(
  client: PoolClient,
  input: StudioUsageRepoInput
) {
  const result = await client.query(
    `
    insert into "StudioUsageSchedules" (
      studio_id,
      production_id,
      rental_id,
      usage_start,
      usage_end,
      status,
      approved_by,
      approved_at,
      notes,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    returning *
    `,
    [
      input.studio_id,
      input.production_id,
      input.rental_id,
      input.usage_start,
      input.usage_end,
      input.status,
      input.approved_by,
      input.approved_at,
      input.notes,
      input.created_by,
    ]
  );

  return result.rows[0];
}

export async function updateStudioUsageRepo(
  client: PoolClient,
  input: StudioUsageRepoInput
) {
  const result = await client.query(
    `
    update "StudioUsageSchedules"
    set
      studio_id = $2,
      production_id = $3,
      rental_id = $4,
      usage_start = $5,
      usage_end = $6,
      status = $7,
      approved_by = $8,
      approved_at = $9,
      notes = $10,
      updated_by = $11,
      updated_at = current_timestamp
    where usage_schedule_id = $1
    returning *
    `,
    [
      input.usage_schedule_id,
      input.studio_id,
      input.production_id,
      input.rental_id,
      input.usage_start,
      input.usage_end,
      input.status,
      input.approved_by,
      input.approved_at,
      input.notes,
      input.updated_by,
    ]
  );

  return result.rows[0];
}

export async function approveStudioUsageRepo(
  client: PoolClient,
  usageScheduleId: string,
  approvedBy: string
) {
  const result = await client.query(
    `
    update "StudioUsageSchedules"
    set
      status = 'approved',
      approved_by = $2,
      approved_at = current_timestamp,
      updated_by = $2,
      updated_at = current_timestamp
    where usage_schedule_id = $1
    returning *
    `,
    [usageScheduleId, approvedBy]
  );

  return result.rows[0];
}

export async function deleteStudioUsageRepo(
  client: PoolClient,
  usageScheduleId: string
) {
  await client.query(
    `delete from "StudioUsageSchedules" where usage_schedule_id = $1`,
    [usageScheduleId]
  );
}

export async function findConflictingBroadcastScheduleRepo(
  client: PoolClient,
  input: {
    channel_id: string;
    scheduled_start: string;
    scheduled_end: string | null;
    excludeBroadcastId?: string | null;
  }
) {
  const result = await client.query(
    `
    select
      broadcast_id,
      program_name,
      scheduled_start,
      scheduled_end
    from "BroadcastSchedules"
    where channel_id = $1
      and ($4::uuid is null or broadcast_id <> $4)
      and tsrange(
            scheduled_start,
            coalesce(scheduled_end, scheduled_start + interval '1 second'),
            '[)'
          ) &&
          tsrange(
            $2::timestamp,
            coalesce($3::timestamp, $2::timestamp + interval '1 second'),
            '[)'
          )
    limit 1
    `,
    [
      input.channel_id,
      input.scheduled_start,
      input.scheduled_end,
      input.excludeBroadcastId || null,
    ]
  );

  return result.rows[0] || null;
}

export async function findConflictingStudioUsageRepo(
  client: PoolClient,
  input: {
    studio_id: string;
    usage_start: string;
    usage_end: string;
    excludeUsageScheduleId?: string | null;
  }
) {
  const result = await client.query(
    `
    select
      usage_schedule_id,
      studio_id,
      usage_start,
      usage_end
    from "StudioUsageSchedules"
    where studio_id = $1
      and ($4::uuid is null or usage_schedule_id <> $4)
      and tsrange(usage_start, usage_end, '[)') &&
          tsrange($2::timestamp, $3::timestamp, '[)')
    limit 1
    `,
    [
      input.studio_id,
      input.usage_start,
      input.usage_end,
      input.excludeUsageScheduleId || null,
    ]
  );

  return result.rows[0] || null;
}