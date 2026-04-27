import type { PoolClient } from "pg";
import { pool } from "../../db/pool";

type ContractRepoInput = {
  contract_id?: string;
  contract_number: string;
  title: string;
  party_id: string;
  contract_type: string;
  signed_date: string;
  start_date: string;
  end_date: string | null;
  contract_value: number;
  discount: number;
  total_value: number;
  status: string;
  notes: string;
  created_by?: string;
  updated_by?: string;
};

type ContractFileRepoInput = {
  contract_id: string;
  file_id: string;
  file_role: string;
  is_main: boolean;
  notes: string;
};

type ServiceItemRepoInput = {
  service_item_id?: string;
  contract_id: string;
  title: string;
  service_type: string;
  cost: number;
  status: string;
  notes: string;
};

type PaymentScheduleRepoInput = {
  payment_schedule_id?: string;
  contract_id: string;
  installment_no: number;
  due_date: string;
  planned_amount: number;
  status: string;
  notes: string;
};

type PrintedAdRepoInput = {
  printed_ads_id?: string;
  service_item_id: string;
  channel_id: string;
  content_type: string;
  area: string;
  color: string;
  start_date: string | null;
  end_date: string | null;
  num_issues: number;
  notes: string;
};

type ElectronicAdRepoInput = {
  electronic_ads_id?: string;
  service_item_id: string;
  channel_id: string;
  subtype: string;
  content_type: string | null;
  form: string | null;
  quantity: number | null;
  position: string | null;
  has_video: boolean;
  has_link: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string;
};

type TelevisionAdRepoInput = {
  tv_ads_id?: string;
  service_item_id: string;
  channel_id: string;
  broadcast_type: string;
  insert_type: string | null;
  program: string | null;
  time_point: string | null;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  end_date: string | null;
  num_broadcasts: number | null;
  notes: string;
};

type RadioAdRepoInput = {
  radio_ads_id?: string;
  service_item_id: string;
  channel_id: string;
  content_type: string;
  program: string | null;
  time_point: string | null;
  start_time: string | null;
  end_time: string | null;
  start_date: string | null;
  end_date: string | null;
  num_broadcasts: number | null;
  notes: string;
};

type DigitalAdRepoInput = {
  digital_ads_id?: string;
  service_item_id: string;
  channel_id: string;
  content_type: string;
  post_date: string | null;
  start_date: string | null;
  end_date: string | null;
  quantity: number | null;
  has_experiencer: boolean;
  notes: string;
};

type ProductionServiceRepoInput = {
  production_service_id?: string;
  service_item_id: string;
  content_type: string | null;
  requirement_description: string;
  delivery_deadline: string | null;
  notes: string;
};

type StudioRentalRepoInput = {
  rental_id?: string;
  service_item_id: string;
  studio_id: string;
  rental_type: string;
  rental_start: string;
  rental_end: string;
  notes: string;
};

type PaymentRepoInput = {
  payment_schedule_id: string;
  paid_date: string;
  amount: number;
  method: string;
  notes: string;
  created_by?: string;
  updated_by?: string;
};

type UpdatePaymentRepoInput = {
  payment_id: string;
  payment_schedule_id: string;
  paid_date: string;
  amount: number;
  method: string;
};

type InvoiceRepoInput = {
  invoice_number: string;
  contract_id: string;
  issue_date: string | null;
  total_amount: number;
  status: string;
  notes: string;
  created_by?: string;
  updated_by?: string;
};

type UpdateInvoiceRepoInput = {
  invoice_id: string;
  invoice_number: string;
  contract_id: string;
  issue_date: string | null;
  total_amount: number;
  status: string;
};

type InvoiceFileRepoInput = {
  invoice_id: string;
  file_id: string;
  file_role: string;
  is_main: boolean;
  notes: string;
};

export async function listContractsRepo() {
  const result = await pool.query(`
    select
      c.contract_id,
      c.contract_number,
      c.title,
      c.party_id,
      p.name as party_name,
      c.contract_type,
      c.signed_date,
      c.start_date,
      c.end_date,
      c.contract_value,
      c.discount,
      c.total_value,
      c.status,
      c.notes,
      coalesce(e.employee_name, u.username, 'Hệ thống') as created_by_name
    from "Contracts" c
    join "Parties" p on p.party_id = c.party_id
    left join "Users" u on u.user_id = c.created_by
    left join "Employees" e on e.user_id = u.user_id
    order by c.created_at desc
  `);

  return result.rows;
}

export async function insertContractRepo(client: PoolClient, input: ContractRepoInput) {
  const result = await client.query(
    `
    insert into "Contracts" (
      contract_number,
      title,
      party_id,
      contract_type,
      signed_date,
      start_date,
      end_date,
      contract_value,
      discount,
      total_value,
      status,
      notes,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    returning *
    `,
    [
      input.contract_number,
      input.title,
      input.party_id,
      input.contract_type,
      input.signed_date,
      input.start_date,
      input.end_date,
      input.contract_value,
      input.discount,
      input.total_value,
      input.status,
      input.notes,
      input.created_by,
    ]
  );

  return result.rows[0];
}

export async function updateContractRepo(client: PoolClient, input: ContractRepoInput) {
  const result = await client.query(
    `
    update "Contracts"
    set
      contract_number = $2,
      title = $3,
      party_id = $4,
      contract_type = $5,
      signed_date = $6,
      start_date = $7,
      end_date = $8,
      contract_value = $9,
      discount = $10,
      total_value = $11,
      status = $12,
      notes = $13,
      updated_by = $14,
      updated_at = current_timestamp
    where contract_id = $1
    returning *
    `,
    [
      input.contract_id,
      input.contract_number,
      input.title,
      input.party_id,
      input.contract_type,
      input.signed_date,
      input.start_date,
      input.end_date,
      input.contract_value,
      input.discount,
      input.total_value,
      input.status,
      input.notes,
      input.updated_by,
    ]
  );

  return result.rows[0];
}

export async function deleteContractFilesRepo(client: PoolClient, contractId: string) {
  await client.query(`delete from "ContractFiles" where contract_id = $1`, [contractId]);
}

export async function insertContractFileRepo(client: PoolClient, input: ContractFileRepoInput) {
  await client.query(
    `
    insert into "ContractFiles" (contract_id, file_id, file_role, is_main, notes)
    values ($1,$2,$3,$4,$5)
    `,
    [input.contract_id, input.file_id, input.file_role, input.is_main, input.notes]
  );
}

export async function insertServiceItemRepo(client: PoolClient, input: ServiceItemRepoInput) {
  const hasFixedId = !!input.service_item_id;

  const result = await client.query(
    hasFixedId
      ? `
        insert into "ServiceItems" (
          service_item_id,
          contract_id,
          title,
          service_type,
          cost,
          status,
          notes
        )
        values ($1,$2,$3,$4,$5,$6,$7)
        returning *
      `
      : `
        insert into "ServiceItems" (
          contract_id,
          title,
          service_type,
          cost,
          status,
          notes
        )
        values ($1,$2,$3,$4,$5,$6)
        returning *
      `,
    hasFixedId
      ? [
          input.service_item_id,
          input.contract_id,
          input.title,
          input.service_type,
          input.cost,
          input.status,
          input.notes,
        ]
      : [
          input.contract_id,
          input.title,
          input.service_type,
          input.cost,
          input.status,
          input.notes,
        ]
  );

  return result.rows[0];
}

export async function insertPaymentScheduleRepo(client: PoolClient, input: PaymentScheduleRepoInput) {
  const hasFixedId = !!input.payment_schedule_id;

  const result = await client.query(
    hasFixedId
      ? `
        insert into "PaymentSchedules" (
          payment_schedule_id,
          contract_id,
          installment_no,
          due_date,
          planned_amount,
          status,
          notes
        )
        values ($1,$2,$3,$4,$5,$6,$7)
        returning *
      `
      : `
        insert into "PaymentSchedules" (
          contract_id,
          installment_no,
          due_date,
          planned_amount,
          status,
          notes
        )
        values ($1,$2,$3,$4,$5,$6)
        returning *
      `,
    hasFixedId
      ? [
          input.payment_schedule_id,
          input.contract_id,
          input.installment_no,
          input.due_date,
          input.planned_amount,
          input.status,
          input.notes,
        ]
      : [
          input.contract_id,
          input.installment_no,
          input.due_date,
          input.planned_amount,
          input.status,
          input.notes,
        ]
  );

  return result.rows[0];
}

export async function insertPrintedAdRepo(client: PoolClient, input: PrintedAdRepoInput) {
  await client.query(
    input.printed_ads_id
      ? `
        insert into "PrintedAds" (
          printed_ads_id, service_item_id, channel_id, content_type, area, color,
          start_date, end_date, num_issues, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `
      : `
        insert into "PrintedAds" (
          service_item_id, channel_id, content_type, area, color,
          start_date, end_date, num_issues, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
    input.printed_ads_id
      ? [
          input.printed_ads_id,
          input.service_item_id,
          input.channel_id,
          input.content_type,
          input.area,
          input.color,
          input.start_date,
          input.end_date,
          input.num_issues,
          input.notes,
        ]
      : [
          input.service_item_id,
          input.channel_id,
          input.content_type,
          input.area,
          input.color,
          input.start_date,
          input.end_date,
          input.num_issues,
          input.notes,
        ]
  );
}

export async function insertElectronicAdRepo(client: PoolClient, input: ElectronicAdRepoInput) {
  await client.query(
    input.electronic_ads_id
      ? `
        insert into "ElectronicAds" (
          electronic_ads_id, service_item_id, channel_id, subtype, content_type, form,
          quantity, position, has_video, has_link, start_date, end_date, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `
      : `
        insert into "ElectronicAds" (
          service_item_id, channel_id, subtype, content_type, form,
          quantity, position, has_video, has_link, start_date, end_date, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
    input.electronic_ads_id
      ? [
          input.electronic_ads_id,
          input.service_item_id,
          input.channel_id,
          input.subtype,
          input.content_type,
          input.form,
          input.quantity,
          input.position,
          input.has_video,
          input.has_link,
          input.start_date,
          input.end_date,
          input.notes,
        ]
      : [
          input.service_item_id,
          input.channel_id,
          input.subtype,
          input.content_type,
          input.form,
          input.quantity,
          input.position,
          input.has_video,
          input.has_link,
          input.start_date,
          input.end_date,
          input.notes,
        ]
  );
}

export async function insertTelevisionAdRepo(client: PoolClient, input: TelevisionAdRepoInput) {
  await client.query(
    input.tv_ads_id
      ? `
        insert into "TelevisionAds" (
          tv_ads_id, service_item_id, channel_id, broadcast_type, insert_type, program,
          time_point, start_time, end_time, start_date, end_date, num_broadcasts, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      `
      : `
        insert into "TelevisionAds" (
          service_item_id, channel_id, broadcast_type, insert_type, program,
          time_point, start_time, end_time, start_date, end_date, num_broadcasts, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
    input.tv_ads_id
      ? [
          input.tv_ads_id,
          input.service_item_id,
          input.channel_id,
          input.broadcast_type,
          input.insert_type,
          input.program,
          input.time_point,
          input.start_time,
          input.end_time,
          input.start_date,
          input.end_date,
          input.num_broadcasts,
          input.notes,
        ]
      : [
          input.service_item_id,
          input.channel_id,
          input.broadcast_type,
          input.insert_type,
          input.program,
          input.time_point,
          input.start_time,
          input.end_time,
          input.start_date,
          input.end_date,
          input.num_broadcasts,
          input.notes,
        ]
  );
}

export async function insertRadioAdRepo(client: PoolClient, input: RadioAdRepoInput) {
  await client.query(
    input.radio_ads_id
      ? `
        insert into "RadioAds" (
          radio_ads_id, service_item_id, channel_id, content_type, program,
          time_point, start_time, end_time, start_date, end_date, num_broadcasts, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `
      : `
        insert into "RadioAds" (
          service_item_id, channel_id, content_type, program,
          time_point, start_time, end_time, start_date, end_date, num_broadcasts, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      `,
    input.radio_ads_id
      ? [
          input.radio_ads_id,
          input.service_item_id,
          input.channel_id,
          input.content_type,
          input.program,
          input.time_point,
          input.start_time,
          input.end_time,
          input.start_date,
          input.end_date,
          input.num_broadcasts,
          input.notes,
        ]
      : [
          input.service_item_id,
          input.channel_id,
          input.content_type,
          input.program,
          input.time_point,
          input.start_time,
          input.end_time,
          input.start_date,
          input.end_date,
          input.num_broadcasts,
          input.notes,
        ]
  );
}

export async function insertDigitalAdRepo(client: PoolClient, input: DigitalAdRepoInput) {
  await client.query(
    input.digital_ads_id
      ? `
        insert into "DigitalAds" (
          digital_ads_id, service_item_id, channel_id, content_type, post_date,
          start_date, end_date, quantity, has_experiencer, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      `
      : `
        insert into "DigitalAds" (
          service_item_id, channel_id, content_type, post_date,
          start_date, end_date, quantity, has_experiencer, notes
        ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      `,
    input.digital_ads_id
      ? [
          input.digital_ads_id,
          input.service_item_id,
          input.channel_id,
          input.content_type,
          input.post_date,
          input.start_date,
          input.end_date,
          input.quantity,
          input.has_experiencer,
          input.notes,
        ]
      : [
          input.service_item_id,
          input.channel_id,
          input.content_type,
          input.post_date,
          input.start_date,
          input.end_date,
          input.quantity,
          input.has_experiencer,
          input.notes,
        ]
  );
}

export async function insertProductionServiceRepo(client: PoolClient, input: ProductionServiceRepoInput) {
  await client.query(
    input.production_service_id
      ? `
        insert into "ProductionServices" (
          production_service_id, service_item_id, content_type,
          requirement_description, delivery_deadline, notes
        ) values ($1,$2,$3,$4,$5,$6)
      `
      : `
        insert into "ProductionServices" (
          service_item_id, content_type,
          requirement_description, delivery_deadline, notes
        ) values ($1,$2,$3,$4,$5)
      `,
    input.production_service_id
      ? [
          input.production_service_id,
          input.service_item_id,
          input.content_type,
          input.requirement_description,
          input.delivery_deadline,
          input.notes,
        ]
      : [
          input.service_item_id,
          input.content_type,
          input.requirement_description,
          input.delivery_deadline,
          input.notes,
        ]
  );
}

export async function insertStudioRentalRepo(client: PoolClient, input: StudioRentalRepoInput) {
  await client.query(
    input.rental_id
      ? `
        insert into "StudioRentals" (
          rental_id, service_item_id, studio_id, rental_type,
          rental_start, rental_end, notes
        ) values ($1,$2,$3,$4,$5,$6,$7)
      `
      : `
        insert into "StudioRentals" (
          service_item_id, studio_id, rental_type,
          rental_start, rental_end, notes
        ) values ($1,$2,$3,$4,$5,$6)
      `,
    input.rental_id
      ? [
          input.rental_id,
          input.service_item_id,
          input.studio_id,
          input.rental_type,
          input.rental_start,
          input.rental_end,
          input.notes,
        ]
      : [
          input.service_item_id,
          input.studio_id,
          input.rental_type,
          input.rental_start,
          input.rental_end,
          input.notes,
        ]
  );
}

export async function insertPaymentRepo(client: PoolClient, input: PaymentRepoInput) {
  const result = await client.query(
    `
    insert into "Payments" (
      payment_schedule_id,
      paid_date,
      amount,
      method,
      notes,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6)
    returning *
    `,
    [
      input.payment_schedule_id,
      input.paid_date,
      input.amount,
      input.method,
      input.notes,
      input.created_by,
    ]
  );

  return result.rows[0];
}

export async function getPaymentByIdRepo(client: PoolClient, paymentId: string) {
  const result = await client.query(
    `select * from "Payments" where payment_id = $1`,
    [paymentId]
  );

  return result.rows[0] || null;
}

export async function updatePaymentRepo(
  client: PoolClient,
  paymentId: string,
  input: PaymentRepoInput
) {
  const result = await client.query(
    `
    update "Payments"
    set
      payment_schedule_id = $2,
      paid_date = $3,
      amount = $4,
      method = $5,
      notes = $6,
      updated_by = $7,
      updated_at = current_timestamp
    where payment_id = $1
    returning *
    `,
    [
      paymentId,
      input.payment_schedule_id,
      input.paid_date,
      input.amount,
      input.method,
      input.notes,
      input.updated_by,
    ]
  );

  return result.rows[0];
}

export async function deletePaymentRepo(client: PoolClient, paymentId: string) {
  await client.query(`delete from "Payments" where payment_id = $1`, [paymentId]);
}

export async function getPaymentScheduleSummaryRepo(client: PoolClient, paymentScheduleId: string) {
  const result = await client.query(
    `
    select
      ps.payment_schedule_id,
      ps.planned_amount,
      coalesce(sum(p.amount), 0) as total_paid
    from "PaymentSchedules" ps
    left join "Payments" p on p.payment_schedule_id = ps.payment_schedule_id
    where ps.payment_schedule_id = $1
    group by ps.payment_schedule_id, ps.planned_amount
    `,
    [paymentScheduleId]
  );

  return result.rows[0] || null;
}

export async function updatePaymentScheduleStatusRepo(
  client: PoolClient,
  paymentScheduleId: string,
  status: string
) {
  await client.query(
    `
    update "PaymentSchedules"
    set status = $2
    where payment_schedule_id = $1
    `,
    [paymentScheduleId, status]
  );
}

export async function getPaymentScheduleOfContractRepo(
  client: PoolClient,
  contractId: string,
  paymentScheduleId: string
) {
  const result = await client.query(
    `
    select ps.*
    from "PaymentSchedules" ps
    where ps.contract_id = $1
      and ps.payment_schedule_id = $2
    `,
    [contractId, paymentScheduleId]
  );

  return result.rows[0] || null;
}

export async function insertInvoiceRepo(client: PoolClient, input: InvoiceRepoInput) {
  const result = await client.query(
    `
    insert into "Invoices" (
      invoice_number,
      contract_id,
      issue_date,
      total_amount,
      status,
      notes,
      created_by
    )
    values ($1,$2,$3,$4,$5,$6,$7)
    returning *
    `,
    [
      input.invoice_number,
      input.contract_id,
      input.issue_date,
      input.total_amount,
      input.status,
      input.notes,
      input.created_by,
    ]
  );

  return result.rows[0];
}

export async function insertInvoiceFileRepo(client: PoolClient, input: InvoiceFileRepoInput) {
  await client.query(
    `
    insert into "InvoiceFiles" (invoice_id, file_id, file_role, is_main, notes)
    values ($1,$2,$3,$4,$5)
    `,
    [input.invoice_id, input.file_id, input.file_role, input.is_main, input.notes]
  );
}

export async function getInvoiceByIdRepo(client: PoolClient, invoiceId: string) {
  const result = await client.query(
    `select * from "Invoices" where invoice_id = $1`,
    [invoiceId]
  );

  return result.rows[0] || null;
}

export async function findInvoiceByNumberExceptRepo(
  client: PoolClient,
  invoiceNumber: string,
  excludeInvoiceId: string
) {
  const result = await client.query(
    `
    select invoice_id, invoice_number
    from "Invoices"
    where lower(trim(invoice_number)) = lower(trim($1))
      and invoice_id <> $2
    limit 1
    `,
    [invoiceNumber, excludeInvoiceId]
  );

  return result.rows[0] || null;
}

export async function updateInvoiceRepo(
  client: PoolClient,
  invoiceId: string,
  input: InvoiceRepoInput
) {
  const result = await client.query(
    `
    update "Invoices"
    set
      invoice_number = $2,
      contract_id = $3,
      issue_date = $4,
      total_amount = $5,
      status = $6,
      notes = $7,
      updated_by = $8,
      updated_at = current_timestamp
    where invoice_id = $1
    returning *
    `,
    [
      invoiceId,
      input.invoice_number,
      input.contract_id,
      input.issue_date,
      input.total_amount,
      input.status,
      input.notes,
      input.updated_by,
    ]
  );

  return result.rows[0];
}

export async function deleteInvoiceFilesRepo(client: PoolClient, invoiceId: string) {
  await client.query(`delete from "InvoiceFiles" where invoice_id = $1`, [invoiceId]);
}

export async function deleteInvoiceRepo(client: PoolClient, invoiceId: string) {
  await deleteInvoiceFilesRepo(client, invoiceId);
  await client.query(`delete from "Invoices" where invoice_id = $1`, [invoiceId]);
}

export async function deleteContractRepo(client: PoolClient, contractId: string) {
  const serviceItemIdsResult = await client.query(
    `select service_item_id from "ServiceItems" where contract_id = $1`,
    [contractId]
  );
  const serviceItemIds = serviceItemIdsResult.rows.map((row) => row.service_item_id);

  const paymentScheduleIdsResult = await client.query(
    `select payment_schedule_id from "PaymentSchedules" where contract_id = $1`,
    [contractId]
  );
  const paymentScheduleIds = paymentScheduleIdsResult.rows.map((row) => row.payment_schedule_id);

  const invoiceIdsResult = await client.query(
    `select invoice_id from "Invoices" where contract_id = $1`,
    [contractId]
  );
  const invoiceIds = invoiceIdsResult.rows.map((row) => row.invoice_id);

  if (invoiceIds.length > 0) {
    await client.query(
      `delete from "InvoiceFiles" where invoice_id = any($1::uuid[])`,
      [invoiceIds]
    );
  }

  await client.query(`delete from "Invoices" where contract_id = $1`, [contractId]);

  if (paymentScheduleIds.length > 0) {
    await client.query(
      `delete from "Payments" where payment_schedule_id = any($1::uuid[])`,
      [paymentScheduleIds]
    );
  }

  await client.query(`delete from "PaymentSchedules" where contract_id = $1`, [contractId]);

  if (serviceItemIds.length > 0) {
    await client.query(
      `delete from "BroadcastSchedules" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "ServiceItemContents" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "ServiceItemProductions" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "PrintedAds" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "ElectronicAds" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "TelevisionAds" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "RadioAds" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "DigitalAds" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    const rentalIdsResult = await client.query(
      `select rental_id from "StudioRentals" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );
    const rentalIds = rentalIdsResult.rows.map((row) => row.rental_id);

    if (rentalIds.length > 0) {
      await client.query(
        `delete from "StudioUsageSchedules" where rental_id = any($1::uuid[])`,
        [rentalIds]
      );
    }

    await client.query(
      `delete from "StudioRentals" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );

    await client.query(
      `delete from "ProductionServices" where service_item_id = any($1::uuid[])`,
      [serviceItemIds]
    );
  }

  await client.query(`delete from "ContractFiles" where contract_id = $1`, [contractId]);
  await client.query(`delete from "ServiceItems" where contract_id = $1`, [contractId]);
  await client.query(`delete from "Contracts" where contract_id = $1`, [contractId]);
}


export async function findContractByNumberRepo(
  client: any,
  contractNumber: string,
  excludeContractId?: string | null
) {
  const result = await client.query(
    `
      select contract_id, contract_number
      from "Contracts"
      where upper(trim(contract_number)) = upper(trim($1))
        and ($2::uuid is null or contract_id <> $2)
      limit 1
    `,
    [contractNumber, excludeContractId || null]
  );

  return result.rows[0] || null;
}

export async function findInvoiceByNumberRepo(
  client: any,
  invoiceNumber: string,
  excludeInvoiceId?: string | null
) {
  const result = await client.query(
    `
      select invoice_id, invoice_number
      from "Invoices"
      where upper(trim(invoice_number)) = upper(trim($1))
        and ($2::uuid is null or invoice_id <> $2)
      limit 1
    `,
    [invoiceNumber, excludeInvoiceId || null]
  );

  return result.rows[0] || null;
}

export async function listPaymentSchedulesOfContractRepo(
  client: PoolClient,
  contractId: string
) {
  const result = await client.query(
    `
    select payment_schedule_id
    from "PaymentSchedules"
    where contract_id = $1
    `,
    [contractId]
  );

  return result.rows as Array<{ payment_schedule_id: string }>;
}

export async function updatePaymentScheduleRepo(
  client: PoolClient,
  input: {
    payment_schedule_id: string;
    installment_no: number;
    due_date: string;
    planned_amount: number;
    status: string;
    notes: string;
  }
) {
  const result = await client.query(
    `
    update "PaymentSchedules"
    set
      installment_no = $2,
      due_date = $3,
      planned_amount = $4,
      status = $5,
      notes = $6
    where payment_schedule_id = $1
    returning *
    `,
    [
      input.payment_schedule_id,
      input.installment_no,
      input.due_date,
      input.planned_amount,
      input.status,
      input.notes,
    ]
  );

  return result.rows[0];
}

export async function findPaymentSchedulesWithPaymentsRepo(
  client: PoolClient,
  paymentScheduleIds: string[]
) {
  if (paymentScheduleIds.length === 0) return [];

  const result = await client.query(
    `
    select distinct
      ps.payment_schedule_id,
      ps.installment_no
    from "Payments" p
    join "PaymentSchedules" ps on ps.payment_schedule_id = p.payment_schedule_id
    where p.payment_schedule_id = any($1::uuid[])
    `,
    [paymentScheduleIds]
  );

  return result.rows as Array<{
    payment_schedule_id: string;
    installment_no: number;
  }>;
}

export async function deletePaymentSchedulesByIdsRepo(
  client: PoolClient,
  paymentScheduleIds: string[]
) {
  if (paymentScheduleIds.length === 0) return;

  await client.query(
    `delete from "PaymentSchedules" where payment_schedule_id = any($1::uuid[])`,
    [paymentScheduleIds]
  );
}

export async function listServiceItemsOfContractRepo(
  client: PoolClient,
  contractId: string
) {
  const result = await client.query(
    `
    select service_item_id, title
    from "ServiceItems"
    where contract_id = $1
    `,
    [contractId]
  );

  return result.rows as Array<{ service_item_id: string; title: string }>;
}

export async function updateServiceItemRepo(
  client: PoolClient,
  input: {
    service_item_id: string;
    title: string;
    service_type: string;
    cost: number;
    status: string;
    notes: string;
  }
) {
  const result = await client.query(
    `
    update "ServiceItems"
    set
      title = $2,
      service_type = $3,
      cost = $4,
      status = $5,
      notes = $6
    where service_item_id = $1
    returning *
    `,
    [
      input.service_item_id,
      input.title,
      input.service_type,
      input.cost,
      input.status,
      input.notes,
    ]
  );

  return result.rows[0];
}

export async function deleteServiceItemBookingDetailsRepo(
  client: PoolClient,
  serviceItemIds: string[]
) {
  if (serviceItemIds.length === 0) return;

  await client.query(`delete from "PrintedAds" where service_item_id = any($1::uuid[])`, [serviceItemIds]);
  await client.query(`delete from "ElectronicAds" where service_item_id = any($1::uuid[])`, [serviceItemIds]);
  await client.query(`delete from "TelevisionAds" where service_item_id = any($1::uuid[])`, [serviceItemIds]);
  await client.query(`delete from "RadioAds" where service_item_id = any($1::uuid[])`, [serviceItemIds]);
  await client.query(`delete from "DigitalAds" where service_item_id = any($1::uuid[])`, [serviceItemIds]);
  await client.query(`delete from "ProductionServices" where service_item_id = any($1::uuid[])`, [serviceItemIds]);
  await client.query(`delete from "StudioRentals" where service_item_id = any($1::uuid[])`, [serviceItemIds]);
}

export async function findReferencedServiceItemsRepo(
  client: PoolClient,
  serviceItemIds: string[]
) {
  if (serviceItemIds.length === 0) return [];

  const result = await client.query(
    `
    select distinct
      si.service_item_id,
      si.title
    from "ServiceItems" si
    where si.service_item_id = any($1::uuid[])
      and (
        exists (
          select 1 from "BroadcastSchedules" bs
          where bs.service_item_id = si.service_item_id
        )
        or exists (
          select 1 from "ServiceItemContents" sic
          where sic.service_item_id = si.service_item_id
        )
        or exists (
          select 1 from "ServiceItemProductions" sip
          where sip.service_item_id = si.service_item_id
        )
      )
    `,
    [serviceItemIds]
  );

  return result.rows as Array<{ service_item_id: string; title: string }>;
}

export async function deleteServiceItemsByIdsRepo(
  client: PoolClient,
  serviceItemIds: string[]
) {
  if (serviceItemIds.length === 0) return;

  await deleteServiceItemBookingDetailsRepo(client, serviceItemIds);
  await client.query(
    `delete from "ServiceItemContents" where service_item_id = any($1::uuid[])`,
    [serviceItemIds]
  );
  await client.query(
    `delete from "ServiceItemProductions" where service_item_id = any($1::uuid[])`,
    [serviceItemIds]
  );
  await client.query(
    `delete from "ServiceItems" where service_item_id = any($1::uuid[])`,
    [serviceItemIds]
  );
}


