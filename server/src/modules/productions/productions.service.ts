import { z } from "zod";
import { withTransaction } from "../../db/tx";
import {
  deleteProductionFilesRepo,
  deleteProductionTasksRepo,
  deleteServiceItemProductionsRepo,
  deleteProductionRepo,
  findDuplicateProductionRepo,
  insertProductionFileRepo,
  insertProductionRepo,
  insertProductionTaskRepo,
  insertServiceItemProductionRepo,
  updateProductionRepo,
} from "./productions.repo";

const productionSaveSchema = z.object({
  production: z.object({
    production_id: z.string().optional(),
    name: z.string(),
    type: z.string(),
    genre: z.string().default(""),
    duration_minutes: z.preprocess(
      (value) => {
        if (value === "" || value === undefined || value === null) {
          return null;
        }

        const parsed =
          typeof value === "number" ? value : Number(String(value).trim());

        return Number.isFinite(parsed) ? parsed : null;
      },
      z.number().int().positive().nullable()
    ),
    start_date: z.string(),
    end_date: z.string().nullable(),
    producer: z.string().nullable(),
    status: z.string(),
    notes: z.string(),
  }),
  service_item_ids: z.array(z.string()),
  production_files: z.array(
    z.object({
      file_id: z.string().nullable(),
      local_file_name: z.string().nullable().optional(),
      local_file: z.any().optional(),
      file_role: z.string(),
      is_main: z.boolean(),
      notes: z.string(),
    })
  ),
  tasks: z.array(
    z.object({
      employee_id: z.string(),
      role_label: z.string(),
    })
  ),
});

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

export async function saveProductionService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = productionSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const normalizedName = normalizeText(payload.production.name);

    if (!normalizedName) {
      throw new Error("Tên dự án sản xuất không được để trống.");
    }

    const duplicateProduction = await findDuplicateProductionRepo(client, {
      name: normalizedName,
      type: payload.production.type,
      start_date: payload.production.start_date,
      excludeProductionId: payload.production.production_id || null,
    });

    if (duplicateProduction) {
      throw new Error(
        `Dự án "${normalizedName}" với ngày bắt đầu ${payload.production.start_date} đã tồn tại.`
      );
    }

    const uniqueServiceItemIds = [...new Set(payload.service_item_ids.filter(Boolean))];

    const uniqueTasks = payload.tasks.filter(
      (row, index, arr) =>
        !!row.employee_id?.trim() &&
        arr.findIndex(
          (item) => item.employee_id.trim() === row.employee_id.trim()
        ) === index
    );

    let productionRow: any;

    if (payload.production.production_id) {
      productionRow = await updateProductionRepo(client, {
        production_id: payload.production.production_id,
        name: normalizedName,
        type: payload.production.type,
        genre: payload.production.genre,
        duration_minutes: payload.production.duration_minutes,
        start_date: payload.production.start_date,
        end_date: payload.production.end_date,
        producer: payload.production.producer,
        status: payload.production.status,
        notes: payload.production.notes,
        updated_by: actorUserId,
      });

      await deleteProductionTasksRepo(client, productionRow.production_id);
      await deleteProductionFilesRepo(client, productionRow.production_id);
      await deleteServiceItemProductionsRepo(client, productionRow.production_id);
    } else {
      productionRow = await insertProductionRepo(client, {
        name: normalizedName,
        type: payload.production.type,
        genre: payload.production.genre,
        duration_minutes: payload.production.duration_minutes,
        start_date: payload.production.start_date,
        end_date: payload.production.end_date,
        producer: payload.production.producer,
        status: payload.production.status,
        notes: payload.production.notes,
        created_by: actorUserId,
      });
    }

    for (const row of uniqueTasks) {
      await insertProductionTaskRepo(client, {
        production_id: productionRow.production_id,
        employee_id: row.employee_id,
        role: row.role_label,
        notes: "",
      });
    }

    for (const row of payload.production_files) {
      if (!row.file_id) continue;

      await insertProductionFileRepo(client, {
        production_id: productionRow.production_id,
        file_id: row.file_id,
        file_role: row.file_role,
        is_main: row.is_main,
        notes: row.notes,
      });
    }

    for (const serviceItemId of uniqueServiceItemIds) {
      await insertServiceItemProductionRepo(client, {
        service_item_id: serviceItemId,
        production_id: productionRow.production_id,
        notes: "",
      });
    }

    return {
      ok: true,
      production_id: productionRow.production_id,
    };
  });
}

export async function deleteProductionService(productionId: string) {
  return withTransaction(async (client) => {
    await deleteProductionRepo(client, productionId);
    return { ok: true };
  });
}