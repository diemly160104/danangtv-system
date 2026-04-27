import type { PoolClient } from "pg";

export type ImportPartyInput = {
  party_type: string;
  customer_type: string | null;
  name: string;
  company: string;
  phone_number: string;
  email: string;
  address: string;
  account_number: string;
  bank: string;
  tax_code: string;
  notes: string;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

export async function findMatchingPartyRepo(
  client: PoolClient,
  input: ImportPartyInput
) {
  const taxCode = normalizeText(input.tax_code);
  const company = normalizeText(input.company);
  const name = normalizeText(input.name);

  if (taxCode) {
    const byTax = await client.query(
      `
      select *
      from "Parties"
      where party_type = $1
        and lower(trim(coalesce(tax_code, ''))) = $2
      limit 1
      `,
      [input.party_type, taxCode]
    );

    if (byTax.rows[0]) return byTax.rows[0];
  }

  const byCompanyOrName = await client.query(
    `
    select *
    from "Parties"
    where party_type = $1
      and (
        lower(trim(coalesce(company, ''))) = $2
        or lower(trim(coalesce(name, ''))) = $3
      )
    order by created_at asc
    limit 1
    `,
    [input.party_type, company, name]
  );

  return byCompanyOrName.rows[0] || null;
}

export async function insertPartyForImportRepo(
  client: PoolClient,
  input: ImportPartyInput
) {
  const result = await client.query(
    `
    insert into "Parties" (
      party_type,
      customer_type,
      name,
      company,
      phone_number,
      email,
      address,
      account_number,
      bank,
      tax_code,
      notes
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    returning *
    `,
    [
      input.party_type,
      input.customer_type,
      input.name,
      input.company,
      input.phone_number,
      input.email,
      input.address,
      input.account_number,
      input.bank,
      input.tax_code,
      input.notes,
    ]
  );

  return result.rows[0];
}

export async function findContractByNumberRepo(
  client: PoolClient,
  contractNumber: string
) {
  const result = await client.query(
    `
    select *
    from "Contracts"
    where contract_number = $1
    limit 1
    `,
    [contractNumber]
  );

  return result.rows[0] || null;
}