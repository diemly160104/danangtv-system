import type { PoolClient } from "pg";

export async function findProductionByNameAndStartDateRepo(
  client: PoolClient,
  name: string,
  startDate: string
) {
  const result = await client.query(
    `
    select
      production_id,
      name,
      start_date
    from "Productions"
    where lower(trim(name)) = lower(trim($1))
      and start_date = $2::date
    limit 1
    `,
    [name, startDate]
  );

  return result.rows[0] || null;
}