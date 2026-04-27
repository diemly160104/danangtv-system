import type { PoolClient } from "pg";

type ProductionRepoInput = {
  production_id?: string;
  name: string;
  type: string;
  genre: string;
  duration_minutes: number | null;
  start_date: string;
  end_date: string | null;
  producer: string | null;
  status: string;
  notes: string;
  created_by?: string;
  updated_by?: string;
};

type ProductionTaskRepoInput = {
  production_id: string;
  employee_id: string;
  role: string;
  notes: string;
};

type ProductionFileRepoInput = {
  production_id: string;
  file_id: string;
  file_role: string;
  is_main: boolean;
  notes: string;
};

type ServiceItemProductionRepoInput = {
  service_item_id: string;
  production_id: string;
  notes: string;
};

export async function insertProductionRepo(
  client: PoolClient,
  input: ProductionRepoInput
) {
  const result = await client.query(
    `
    insert into "Productions" (
      name,
      type,
      genre,
      duration_minutes,
      start_date,
      end_date,
      producer,
      status,
      notes,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
    returning *
    `,
    [
      input.name,
      input.type,
      input.genre,
      input.duration_minutes,
      input.start_date,
      input.end_date,
      input.producer,
      input.status,
      input.notes,
      input.created_by,
    ]
  );

  return result.rows[0];
}

export async function updateProductionRepo(
  client: PoolClient,
  input: ProductionRepoInput
) {
  const result = await client.query(
    `
    update "Productions"
    set
      name = $2,
      type = $3,
      genre = $4,
      duration_minutes = $5,
      start_date = $6,
      end_date = $7,
      producer = $8,
      status = $9,
      notes = $10,
      updated_by = $11,
      updated_at = current_timestamp
    where production_id = $1
    returning *
    `,
    [
      input.production_id,
      input.name,
      input.type,
      input.genre,
      input.duration_minutes,
      input.start_date,
      input.end_date,
      input.producer,
      input.status,
      input.notes,
      input.updated_by,
    ]
  );

  return result.rows[0];
}

export async function findDuplicateProductionRepo(
  client: PoolClient,
  input: {
    name: string;
    type: string;
    start_date: string;
    excludeProductionId?: string | null;
  }
) {
  const result = await client.query(
    `
    select production_id, name, type, start_date
    from "Productions"
    where upper(trim(name)) = upper(trim($1))
      and type = $2
      and start_date = $3
      and ($4::uuid is null or production_id <> $4)
    limit 1
    `,
    [
      input.name,
      input.type,
      input.start_date,
      input.excludeProductionId || null,
    ]
  );

  return result.rows[0] || null;
}

export async function deleteProductionTasksRepo(
  client: PoolClient,
  productionId: string
) {
  await client.query(`delete from "ProductionTasks" where production_id = $1`, [
    productionId,
  ]);
}

export async function deleteProductionFilesRepo(
  client: PoolClient,
  productionId: string
) {
  await client.query(`delete from "ProductionFiles" where production_id = $1`, [
    productionId,
  ]);
}

export async function deleteServiceItemProductionsRepo(
  client: PoolClient,
  productionId: string
) {
  await client.query(
    `delete from "ServiceItemProductions" where production_id = $1`,
    [productionId]
  );
}

export async function insertProductionTaskRepo(
  client: PoolClient,
  input: ProductionTaskRepoInput
) {
  await client.query(
    `
    insert into "ProductionTasks" (
      production_id,
      employee_id,
      role,
      notes
    )
    values ($1,$2,$3,$4)
    `,
    [input.production_id, input.employee_id, input.role, input.notes]
  );
}

export async function insertProductionFileRepo(
  client: PoolClient,
  input: ProductionFileRepoInput
) {
  await client.query(
    `
    insert into "ProductionFiles" (
      production_id,
      file_id,
      file_role,
      is_main,
      notes
    )
    values ($1,$2,$3,$4,$5)
    `,
    [
      input.production_id,
      input.file_id,
      input.file_role,
      input.is_main,
      input.notes,
    ]
  );
}

export async function insertServiceItemProductionRepo(
  client: PoolClient,
  input: ServiceItemProductionRepoInput
) {
  await client.query(
    `
    insert into "ServiceItemProductions" (
      service_item_id,
      production_id,
      notes
    )
    values ($1,$2,$3)
    `,
    [input.service_item_id, input.production_id, input.notes]
  );
}

export async function deleteProductionRepo(
  client: PoolClient,
  productionId: string
) {
  await client.query(
    `delete from "StudioUsageSchedules" where production_id = $1`,
    [productionId]
  );

  await client.query(
    `delete from "ProductionTasks" where production_id = $1`,
    [productionId]
  );

  await client.query(
    `delete from "ProductionFiles" where production_id = $1`,
    [productionId]
  );

  await client.query(
    `delete from "ServiceItemProductions" where production_id = $1`,
    [productionId]
  );

  await client.query(
    `delete from "Productions" where production_id = $1`,
    [productionId]
  );
}