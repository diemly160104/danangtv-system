import { z } from "zod";
import { env } from "../../config/env";
import { withTransaction } from "../../db/tx";
import {
  stageImportFiles,
  type UploadedImportFile,
} from "../../lib/etlImportStaging";

import { resolveOrCreateImportEmployee } from "../../lib/etl/importEmployeeResolver";

import { runPythonJson } from "../../lib/runPythonJson";
import {
  findContractByNumberRepo,
  findMatchingPartyRepo,
  insertPartyForImportRepo,
  type ImportPartyInput,
} from "./contracts.import.repo";
import {
  insertContractRepo,
  insertPaymentScheduleRepo,
  insertServiceItemRepo,
} from "./contracts.repo";

const contractImportRequestSchema = z.object({
  contract_type: z.enum(["service", "license_purchase", "other"]),
  files: z.array(z.any()).min(1, "Phải có ít nhất 1 file import."),
});

const etlPartySchema = z.object({
  party_type: z.string(),
  customer_type: z.string().nullable().optional(),
  name: z.string(),
  company: z.string(),
  phone_number: z.string(),
  email: z.string(),
  address: z.string(),
  account_number: z.string(),
  bank: z.string(),
  tax_code: z.string(),
  notes: z.string(),
});

const etlContractSchema = z.object({
  contract_number: z.string(),
  title: z.string(),
  contract_type: z.string(),
  signed_date: z.string(),
  start_date: z.string(),
  end_date: z.string().nullable(),
  contract_value: z.number(),
  discount: z.number(),
  total_value: z.number(),
  status: z.string(),
  notes: z.string(),
});

const etlServiceItemSchema = z.object({
  title: z.string(),
  service_type: z.string(),
  cost: z.number(),
  status: z.string(),
  notes: z.string(),
  bookings: z.array(z.any()).default([]),
});

const etlPaymentScheduleSchema = z.object({
  installment_no: z.number(),
  due_date: z.string(),
  planned_amount: z.number(),
  status: z.string(),
  notes: z.string(),
});

const etlPersonInChargeCandidateSchema = z
  .object({
    name: z.string(),
    department: z.string().optional(),
  })
  .nullable()
  .optional();

const etlRecordSchema = z.object({
  source: z.object({
    file_name: z.string(),
    sheet_name: z.string().nullable().optional(),
    row_number: z.number(),
  }),
  errors: z.array(z.string()).default([]),
  party: etlPartySchema,
  person_in_charge_candidate: etlPersonInChargeCandidateSchema,
  contract: etlContractSchema,
  service_items: z.array(etlServiceItemSchema).default([]),
  payment_schedule: etlPaymentScheduleSchema,
});

const etlOutputSchema = z.object({
  metadata: z.any(),
  data: z.array(etlRecordSchema),
});

function buildImportedContractTitle(contractType: string, partyName: string) {
  const prefixMap: Record<string, string> = {
    service: "Hợp đồng dịch vụ",
    license_purchase: "Hợp đồng mua bản quyền",
    other: "Hợp đồng khác",
  };

  const prefix = prefixMap[contractType] || "Hợp đồng";
  return partyName ? `${prefix} - ${partyName}` : prefix;
}

export async function importContractsFromEtlService(
  rawPayload: unknown, 
  actorUserId: string,
) {
  const payload = contractImportRequestSchema.parse(rawPayload);

  const staged = await stageImportFiles(
    "contracts",
    payload.files as UploadedImportFile[]
    );

  const etlOutputRaw = await runPythonJson<unknown>({
    pythonCommand: env.PYTHON_COMMAND,
    scriptPath: env.PYTHON_CONTRACT_IMPORT_SCRIPT,
    timeoutMs: env.PYTHON_IMPORT_TIMEOUT_MS,
    payload: {
      file_paths: staged.files.map((item) => item.absolute_path),
      read_all_sheets: true,
      contract_type: payload.contract_type,
    },
  });

  const etlOutput = etlOutputSchema.parse(etlOutputRaw);
    const records = etlOutput.data;

    console.log(
    "[IMPORT CONTRACT][ETL METADATA]",
    JSON.stringify(etlOutput.metadata, null, 2)
  );

  console.log("[IMPORT CONTRACT][ETL VALID RECORD COUNT]", records.length);

  console.log(
    "[IMPORT CONTRACT][ETL FIRST VALID RECORD]",
    records.length > 0 ? JSON.stringify(records[0], null, 2) : "NO VALID RECORD"
  );

  const result = await withTransaction(async (client) => {
    const summary = {
      created_parties: 0,
      reused_parties: 0,
      created_contracts: 0,
      skipped_existing_contracts: 0,
      created_service_items: 0,
      created_payment_schedules: 0,
      created_employees: 0,
      reused_employees: 0,
      warnings: [] as string[],
    };

    for (const record of records) {
      if (record.errors.length > 0) {
        summary.warnings.push(
          `Bỏ qua ${record.contract.contract_number || "[không có mã]"} do ETL báo lỗi.`
        );
        continue;
      }

      const resolvedPersonInCharge =
        record.person_in_charge_candidate?.name
          ? await resolveOrCreateImportEmployee(
              client,
              record.person_in_charge_candidate.name,
              {
                defaultDepartment: "finance_services",
              }
            )
          : null;

      if (resolvedPersonInCharge) {
        if (resolvedPersonInCharge.was_created) {
          summary.created_employees += 1;
        } else {
          summary.reused_employees += 1;
        }
      }

      let partyId = "";
      const matchedParty = await findMatchingPartyRepo(
        client,
        record.party as ImportPartyInput
      );

      if (matchedParty) {
        partyId = matchedParty.party_id;
        summary.reused_parties += 1;
      } else {
        const insertedParty = await insertPartyForImportRepo(
          client,
          record.party as ImportPartyInput
        );
        partyId = insertedParty.party_id;
        summary.created_parties += 1;
      }

      const existingContract = await findContractByNumberRepo(
        client,
        record.contract.contract_number
      );

      if (existingContract) {
        summary.skipped_existing_contracts += 1;
        summary.warnings.push(
          `Hợp đồng ${record.contract.contract_number} đã tồn tại, bỏ qua import contract này.`
        );
        continue;
      }

      const insertedContract = await insertContractRepo(client, {
        contract_number: record.contract.contract_number,
        title: buildImportedContractTitle(payload.contract_type, record.party.name),
        party_id: partyId,
        contract_type: payload.contract_type,
        signed_date: record.contract.signed_date,
        start_date: record.contract.start_date,
        end_date: record.contract.end_date,
        contract_value: record.contract.contract_value,
        discount: record.contract.discount,
        total_value: record.contract.total_value,
        status: record.contract.status,
        notes: record.contract.notes,
        created_by: actorUserId,
      });

      summary.created_contracts += 1;

      for (const item of record.service_items) {
        await insertServiceItemRepo(client, {
          contract_id: insertedContract.contract_id,
          title: item.title,
          service_type: item.service_type,
          cost: item.cost,
          status: item.status,
          notes: item.notes,
        });

        summary.created_service_items += 1;
      }

      await insertPaymentScheduleRepo(client, {
        contract_id: insertedContract.contract_id,
        installment_no: record.payment_schedule.installment_no,
        due_date: record.payment_schedule.due_date,
        planned_amount: record.payment_schedule.planned_amount,
        status: record.payment_schedule.status,
        notes: record.payment_schedule.notes,
      });

      summary.created_payment_schedules += 1;
    }

    return summary;
  });

  return {
    ok: true,
    module: "contracts",
    import_type: payload.contract_type,
    batch_id: staged.batch_id,
    staged_dir: staged.staged_dir,
    file_names: staged.files.map((item) => item.original_name),
    imported_count: result.created_contracts,
    warnings: result.warnings,
    summary: result,
    etl_metadata: etlOutput.metadata,
    message: `Đã import ${result.created_contracts} hợp đồng từ dữ liệu ETL.`,
  };
}