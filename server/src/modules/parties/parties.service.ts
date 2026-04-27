import { pool } from "../../db/pool";

type PartyPayload = {
  party_type: "customer" | "partner" | "other";
  name: string;
  customer_type?: "individual" | "corporate" | "";
  company?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  account_number?: string;
  bank?: string;
  tax_code?: string;
  notes?: string;
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeUpper(value?: string | null) {
  return normalizeText(value).toUpperCase();
}

function normalizeLower(value?: string | null) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value?: string | null) {
  return normalizeText(value).replace(/\s+/g, "");
}

async function findDuplicateParty(input: {
  party_type: "customer" | "partner" | "other";
  name: string;
  company?: string | null;
  email?: string | null;
  phone_number?: string | null;
  account_number?: string | null;
  bank?: string | null;
  tax_code?: string | null;
  excludePartyId?: string | null;
}) {
  const normalizedName = normalizeText(input.name);
  const normalizedCompany = normalizeText(input.company);
  const normalizedEmail = normalizeLower(input.email);
  const normalizedPhone = normalizePhone(input.phone_number);
  const normalizedAccountNumber = normalizeText(input.account_number);
  const normalizedBank = normalizeText(input.bank);
  const normalizedTaxCode = normalizeUpper(input.tax_code);

  if (!normalizedName) {
    throw new Error("Tên đối tác / khách hàng không được để trống.");
  }

  if (normalizedTaxCode) {
    const taxCodeResult = await pool.query(
      `
      select party_id, tax_code
      from "Parties"
      where upper(trim(tax_code)) = upper(trim($1))
        and ($2::uuid is null or party_id <> $2)
      limit 1
      `,
      [normalizedTaxCode, input.excludePartyId || null]
    );

    if (taxCodeResult.rowCount) {
      throw new Error(`Mã số thuế "${normalizedTaxCode}" đã tồn tại.`);
    }
  }

  if (normalizedAccountNumber && normalizedBank) {
    const bankAccountResult = await pool.query(
      `
      select party_id, account_number, bank
      from "Parties"
      where trim(account_number) = trim($1)
        and upper(trim(bank)) = upper(trim($2))
        and ($3::uuid is null or party_id <> $3)
      limit 1
      `,
      [normalizedAccountNumber, normalizedBank, input.excludePartyId || null]
    );

    if (bankAccountResult.rowCount) {
      throw new Error(
        `Tài khoản "${normalizedAccountNumber}" tại ngân hàng "${normalizedBank}" đã tồn tại.`
      );
    }
  }

  if (normalizedEmail) {
    const emailResult = await pool.query(
      `
      select party_id, email
      from "Parties"
      where lower(trim(email)) = lower(trim($1))
        and ($2::uuid is null or party_id <> $2)
      limit 1
      `,
      [normalizedEmail, input.excludePartyId || null]
    );

    if (emailResult.rowCount) {
      throw new Error(`Email "${normalizedEmail}" đã tồn tại.`);
    }
  }

  if (normalizedPhone) {
    const phoneResult = await pool.query(
      `
      select party_id, phone_number
      from "Parties"
      where regexp_replace(coalesce(phone_number, ''), '\s+', '', 'g') = $1
        and ($2::uuid is null or party_id <> $2)
      limit 1
      `,
      [normalizedPhone, input.excludePartyId || null]
    );

    if (phoneResult.rowCount) {
      throw new Error(`Số điện thoại "${normalizedPhone}" đã tồn tại.`);
    }
  }

  if (normalizedCompany) {
    const companyResult = await pool.query(
      `
      select party_id, company, party_type
      from "Parties"
      where upper(trim(company)) = upper(trim($1))
        and party_type = $2
        and ($3::uuid is null or party_id <> $3)
      limit 1
      `,
      [normalizedCompany, input.party_type, input.excludePartyId || null]
    );

    if (companyResult.rowCount) {
      throw new Error(
        `Đơn vị / công ty "${normalizedCompany}" đã tồn tại trong nhóm ${input.party_type}.`
      );
    }
  } else {
    const nameResult = await pool.query(
      `
      select party_id, name, party_type
      from "Parties"
      where upper(trim(name)) = upper(trim($1))
        and party_type = $2
        and ($3::uuid is null or party_id <> $3)
      limit 1
      `,
      [normalizedName, input.party_type, input.excludePartyId || null]
    );

    if (nameResult.rowCount) {
      throw new Error(
        `Tên "${normalizedName}" đã tồn tại trong nhóm ${input.party_type}.`
      );
    }
  }
}

export async function listPartiesService() {
  const result = await pool.query(`
    select
      party_id,
      party_type,
      name,
      customer_type,
      company,
      phone_number,
      email,
      address,
      account_number,
      bank,
      tax_code,
      notes
    from "Parties"
    order by name asc
  `);

  return result.rows;
}

export async function createPartyService(payload: PartyPayload) {
  const normalizedName = normalizeText(payload.name);

  await findDuplicateParty({
    party_type: payload.party_type,
    name: normalizedName,
    company: payload.company || null,
    email: payload.email || null,
    phone_number: payload.phone_number || null,
    account_number: payload.account_number || null,
    bank: payload.bank || null,
    tax_code: payload.tax_code || null,
  });

  const result = await pool.query(
    `
    insert into "Parties" (
      party_type,
      name,
      customer_type,
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
    returning
      party_id,
      party_type,
      name,
      customer_type,
      company,
      phone_number,
      email,
      address,
      account_number,
      bank,
      tax_code,
      notes
    `,
    [
      payload.party_type,
      normalizedName,
      payload.customer_type || null,
      normalizeText(payload.company) || null,
      normalizePhone(payload.phone_number) || null,
      normalizeLower(payload.email) || null,
      normalizeText(payload.address) || null,
      normalizeText(payload.account_number) || null,
      normalizeText(payload.bank) || null,
      normalizeUpper(payload.tax_code) || null,
      normalizeText(payload.notes) || null,
    ]
  );

  return result.rows[0];
}

export async function updatePartyService(partyId: string, payload: PartyPayload) {
  const normalizedName = normalizeText(payload.name);

  await findDuplicateParty({
    party_type: payload.party_type,
    name: normalizedName,
    company: payload.company || null,
    email: payload.email || null,
    phone_number: payload.phone_number || null,
    account_number: payload.account_number || null,
    bank: payload.bank || null,
    tax_code: payload.tax_code || null,
    excludePartyId: partyId,
  });

  const result = await pool.query(
    `
    update "Parties"
    set
      party_type = $2,
      name = $3,
      customer_type = $4,
      company = $5,
      phone_number = $6,
      email = $7,
      address = $8,
      account_number = $9,
      bank = $10,
      tax_code = $11,
      notes = $12
    where party_id = $1
    returning
      party_id,
      party_type,
      name,
      customer_type,
      company,
      phone_number,
      email,
      address,
      account_number,
      bank,
      tax_code,
      notes
    `,
    [
      partyId,
      payload.party_type,
      normalizedName,
      payload.customer_type || null,
      normalizeText(payload.company) || null,
      normalizePhone(payload.phone_number) || null,
      normalizeLower(payload.email) || null,
      normalizeText(payload.address) || null,
      normalizeText(payload.account_number) || null,
      normalizeText(payload.bank) || null,
      normalizeUpper(payload.tax_code) || null,
      normalizeText(payload.notes) || null,
    ]
  );

  if (!result.rowCount) {
    throw new Error("Không tìm thấy đối tác / khách hàng.");
  }

  return result.rows[0];
}

export async function deletePartyService(partyId: string) {
  const usedInContracts = await pool.query(
    `select 1 from "Contracts" where party_id = $1 limit 1`,
    [partyId]
  );

  if (usedInContracts.rowCount) {
    throw new Error("Không thể xóa đối tác / khách hàng vì đang được dùng trong hợp đồng.");
  }

  const result = await pool.query(
    `delete from "Parties" where party_id = $1 returning party_id`,
    [partyId]
  );

  if (!result.rowCount) {
    throw new Error("Không tìm thấy đối tác / khách hàng.");
  }

  return result.rows[0];
}