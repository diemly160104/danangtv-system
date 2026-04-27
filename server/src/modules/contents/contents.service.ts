import { z } from "zod";
import { withTransaction } from "../../db/tx";
import {
  approveContentRepo,
  deleteContentFilesRepo,
  deleteContentRepo,
  deleteServiceItemContentsRepo,
  findDuplicateContentRepo,
  insertContentFileRepo,
  insertContentRepo,
  insertServiceItemContentRepo,
  updateContentRepo,
} from "./contents.repo";

const contentSaveSchema = z.object({
  content: z.object({
    content_id: z.string().optional(),
    title: z.string(),
    type: z.string(),
    source: z.string(),
    status: z.string(),
    notes: z.string(),
  }),
  service_item_ids: z.array(z.string()),
  content_files: z.array(
    z.object({
      file_id: z.string().nullable(),
      file_role: z.string(),
      is_main: z.boolean(),
      notes: z.string(),
    })
  ),
});

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

export async function saveContentService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = contentSaveSchema.parse(rawPayload);

  return withTransaction(async (client) => {
    const normalizedTitle = normalizeText(payload.content.title);

    if (!normalizedTitle) {
      throw new Error("Tên content không được để trống.");
    }

    const uniqueServiceItemIds = [...new Set(payload.service_item_ids.filter(Boolean))];

    const uniqueContentFiles = payload.content_files.filter(
      (row, index, arr) =>
        !!row.file_id &&
        arr.findIndex(
          (item) =>
            item.file_id === row.file_id &&
            item.file_role === row.file_role
        ) === index
    );

    const uniqueContentFileIds = [
      ...new Set(
        uniqueContentFiles
          .map((row) => row.file_id)
          .filter(Boolean)
      ),
    ] as string[];

    const duplicateContent = await findDuplicateContentRepo(client, {
      title: normalizedTitle,
      type: payload.content.type,
      source: payload.content.source,
      file_ids: uniqueContentFileIds,
      excludeContentId: payload.content.content_id || null,
    });

    if (duplicateContent) {
      throw new Error(
        uniqueContentFileIds.length > 0
          ? `Content trùng với dữ liệu đã có: cùng loại, cùng nguồn và cùng bộ file đính kèm.`
          : `Content "${normalizedTitle}" với loại "${payload.content.type}" và nguồn "${payload.content.source}" đã tồn tại.`
      );
    }

    let contentRow: any;

    if (payload.content.content_id) {
      contentRow = await updateContentRepo(client, {
        content_id: payload.content.content_id,
        title: normalizedTitle,
        type: payload.content.type,
        source: payload.content.source,
        status: payload.content.status,
        notes: payload.content.notes,
        updated_by: actorUserId,
      });

      await deleteContentFilesRepo(client, contentRow.content_id);
      await deleteServiceItemContentsRepo(client, contentRow.content_id);
    } else {
      contentRow = await insertContentRepo(client, {
        title: normalizedTitle,
        type: payload.content.type,
        source: payload.content.source,
        status: payload.content.status,
        notes: payload.content.notes,
        created_by: actorUserId,
      });
    }

    for (const row of uniqueContentFiles) {
      if (!row.file_id) continue;

      await insertContentFileRepo(client, {
        content_id: contentRow.content_id,
        file_id: row.file_id,
        file_role: row.file_role,
        is_main: row.is_main,
        notes: row.notes,
      });
    }

    for (const serviceItemId of uniqueServiceItemIds) {
      await insertServiceItemContentRepo(client, {
        service_item_id: serviceItemId,
        content_id: contentRow.content_id,
        notes: "",
      });
    }

    return {
      ok: true,
      content_id: contentRow.content_id,
    };
  });
}

export async function approveContentService(
  contentId: string,
  actorUserId: string
) {
  return withTransaction(async (client) => {
    const row = await approveContentRepo(client, contentId, actorUserId);
    return {
      ok: true,
      content_id: row.content_id,
    };
  });
}

export async function deleteContentService(contentId: string) {
  return withTransaction(async (client) => {
    await deleteContentRepo(client, contentId);
    return { ok: true };
  });
}