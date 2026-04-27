import type { PoolClient } from "pg";
import { pool } from "../../db/pool";

export async function listFilesRepo(filters?: {
  folder?: string;
  search?: string;
}) {
  const values: any[] = [];
  const where: string[] = [];

  if (filters?.folder && filters.folder !== "all") {
    values.push(filters.folder);
    where.push(`f.folder = $${values.length}`);
  }

  if (filters?.search) {
    values.push(`%${filters.search}%`);
    where.push(`f.file_name ilike $${values.length}`);
  }

  const sql = `
    select
      f.file_id,
      f.file_name,
      f.storage_path,
      f.file_extension,
      f.file_size,
      f.folder,
      coalesce(e.employee_name, u.username, 'Hệ thống') as uploaded_by_name,
      f.uploaded_at,
      f.notes
    from "Files" f
    left join "Users" u on u.user_id = f.uploaded_by
    left join "Employees" e on e.user_id = u.user_id
    ${where.length ? `where ${where.join(" and ")}` : ""}
    order by f.uploaded_at desc
  `;

  const result = await pool.query(sql, values);
  return result.rows;
}

export async function insertFileRepo(
  client: PoolClient,
  input: {
    file_name: string;
    folder: string;
    storage_path: string;
    file_extension: string | null;
    file_size: number | null;
    uploaded_by: string;
    notes?: string | null;
  }
) {
  const result = await client.query(
    `
      insert into "Files" (
        file_name,
        folder,
        storage_path,
        file_extension,
        file_size,
        uploaded_by,
        notes
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      returning
        file_id,
        file_name,
        storage_path,
        file_extension,
        file_size,
        folder,
        uploaded_at,
        notes
    `,
    [
      input.file_name,
      input.folder,
      input.storage_path,
      input.file_extension,
      input.file_size,
      input.uploaded_by,
      input.notes || null,
    ]
  );

  return {
    ...result.rows[0],
    uploaded_by_name: "Hệ thống",
  };
}

export async function findExistingFileRepo(
  client: PoolClient,
  input: {
    folder: string;
    file_name: string;
    file_size: number | null;
    parent_storage_dir: string;
  }
) {
  const result = await client.query(
    `
    select
      f.file_id,
      f.file_name,
      f.storage_path,
      f.file_extension,
      f.file_size,
      f.folder,
      coalesce(e.employee_name, u.username, 'Hệ thống') as uploaded_by_name,
      f.uploaded_at,
      f.notes
    from "Files" f
    left join "Users" u on u.user_id = f.uploaded_by
    left join "Employees" e on e.user_id = u.user_id
    where f.folder = $1
      and lower(trim(f.file_name)) = lower(trim($2))
      and (
        ($3::bigint is null and f.file_size is null)
        or f.file_size = $3
      )
      and f.storage_path like $4
    order by f.uploaded_at desc
    limit 1
    `,
    [
      input.folder,
      input.file_name,
      input.file_size,
      `${input.parent_storage_dir}/%`,
    ]
  );

  return result.rows[0] || null;
}