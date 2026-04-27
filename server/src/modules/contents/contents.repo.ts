import type { PoolClient } from "pg";

type ContentRepoInput = {
  content_id?: string;
  title: string;
  type: string;
  source: string;
  status: string;
  notes: string;
  created_by?: string;
  updated_by?: string;
};

type ContentFileRepoInput = {
  content_id: string;
  file_id: string;
  file_role: string;
  is_main: boolean;
  notes: string;
};

type ServiceItemContentRepoInput = {
  service_item_id: string;
  content_id: string;
  notes: string;
};

export async function insertContentRepo(
  client: PoolClient,
  input: ContentRepoInput
) {
  const result = await client.query(
    `
    insert into "Contents" (
      title,
      type,
      source,
      status,
      notes,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6)
    returning *
    `,
    [
      input.title,
      input.type,
      input.source,
      input.status,
      input.notes,
      input.created_by,
    ]
  );

  return result.rows[0];
}

export async function updateContentRepo(
  client: PoolClient,
  input: ContentRepoInput
) {
  const result = await client.query(
    `
    update "Contents"
    set
      title = $2,
      type = $3,
      source = $4,
      status = $5,
      notes = $6,
      updated_by = $7,
      updated_at = current_timestamp
    where content_id = $1
    returning *
    `,
    [
      input.content_id,
      input.title,
      input.type,
      input.source,
      input.status,
      input.notes,
      input.updated_by,
    ]
  );

  return result.rows[0];
}

export async function deleteContentFilesRepo(
  client: PoolClient,
  contentId: string
) {
  await client.query(`delete from "ContentFiles" where content_id = $1`, [
    contentId,
  ]);
}

export async function deleteServiceItemContentsRepo(
  client: PoolClient,
  contentId: string
) {
  await client.query(`delete from "ServiceItemContents" where content_id = $1`, [
    contentId,
  ]);
}

export async function insertContentFileRepo(
  client: PoolClient,
  input: ContentFileRepoInput
) {
  await client.query(
    `
    insert into "ContentFiles" (
      content_id,
      file_id,
      file_role,
      is_main,
      notes
    )
    values ($1,$2,$3,$4,$5)
    `,
    [
      input.content_id,
      input.file_id,
      input.file_role,
      input.is_main,
      input.notes,
    ]
  );
}

export async function insertServiceItemContentRepo(
  client: PoolClient,
  input: ServiceItemContentRepoInput
) {
  await client.query(
    `
    insert into "ServiceItemContents" (
      service_item_id,
      content_id,
      notes
    )
    values ($1,$2,$3)
    `,
    [input.service_item_id, input.content_id, input.notes]
  );
}

export async function approveContentRepo(
  client: PoolClient,
  contentId: string,
  approvedBy: string
) {
  const result = await client.query(
    `
    update "Contents"
    set
      status = 'approved',
      approved_by = $2,
      approved_at = current_timestamp,
      updated_by = $2,
      updated_at = current_timestamp
    where content_id = $1
    returning *
    `,
    [contentId, approvedBy]
  );

  return result.rows[0];
}

export async function deleteContentRepo(client: PoolClient, contentId: string) {
  await client.query(`delete from "BroadcastSchedules" where content_id = $1`, [
    contentId,
  ]);
  await client.query(`delete from "ContentFiles" where content_id = $1`, [contentId]);
  await client.query(`delete from "ServiceItemContents" where content_id = $1`, [
    contentId,
  ]);
  await client.query(`delete from "Contents" where content_id = $1`, [contentId]);
}

export async function findDuplicateContentRepo(
  client: PoolClient,
  input: {
    title: string;
    type: string;
    source: string;
    file_ids?: string[];
    excludeContentId?: string | null;
  }
) {
  const normalizedFileIds = [...new Set((input.file_ids || []).filter(Boolean))];

  if (normalizedFileIds.length > 0) {
    const resultByFiles = await client.query(
      `
      select c.content_id, c.title, c.type, c.source
      from "Contents" c
      join "ContentFiles" cf on cf.content_id = c.content_id
      where c.type = $1
        and c.source = $2
        and ($3::uuid is null or c.content_id <> $3)
      group by c.content_id, c.title, c.type, c.source
      having
        count(distinct cf.file_id) = $4
        and count(distinct case when cf.file_id = any($5::uuid[]) then cf.file_id end) = $4
      limit 1
      `,
      [
        input.type,
        input.source,
        input.excludeContentId || null,
        normalizedFileIds.length,
        normalizedFileIds,
      ]
    );

    if (resultByFiles.rows[0]) {
      return resultByFiles.rows[0];
    }
  }

  const resultByTitle = await client.query(
    `
    select content_id, title, type, source
    from "Contents"
    where upper(trim(title)) = upper(trim($1))
      and type = $2
      and source = $3
      and ($4::uuid is null or content_id <> $4)
    limit 1
    `,
    [
      input.title,
      input.type,
      input.source,
      input.excludeContentId || null,
    ]
  );

  return resultByTitle.rows[0] || null;
}