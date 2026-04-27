import { z } from "zod";
import { env } from "../../config/env";
import { withTransaction } from "../../db/tx";
import {
  stageImportFiles,
  type UploadedImportFile,
} from "../../lib/etlImportStaging";
import { runPythonJson } from "../../lib/runPythonJson";
import { resolveOrCreateImportEmployee } from "../../lib/etl/importEmployeeResolver";
import { findProductionByNameAndStartDateRepo } from "./productions.import.repo";
import {
  insertProductionRepo,
  insertProductionTaskRepo,
} from "./productions.repo";

const productionImportRequestSchema = z.object({
  files: z.array(z.any()).min(1, "Phải có ít nhất 1 file import."),
});

const etlProductionSchema = z.object({
  name: z.string(),
  type: z.enum(["service", "internal"]),
  genre: z.string().nullable().optional().default(""),
  duration_minutes: z.number().nullable().optional().default(null),
  start_date: z.string(),
  end_date: z.string().nullable().optional().default(null),
  status: z.string(),
  notes: z.string().default(""),
});

const etlProducerCandidateSchema = z.object({
  name: z.string(),
  department: z.string().optional(),
});

const etlTaskPersonSchema = z.object({
  name: z.string(),
  department: z.string().optional(),
  role_label: z.string(),
  notes: z.string().optional().default(""),
});

const etlRecordSchema = z.object({
  source: z.object({
    file_name: z.string(),
    sheet_name: z.string().nullable().optional(),
    row_number: z.number(),
    row_numbers: z.array(z.number()).optional(),
    group_row_numbers: z.array(z.number()).optional(),
    issue_index: z.number().optional(),
    total_issues: z.number().optional(),
  }),
  errors: z.array(z.string()).default([]),
  production: etlProductionSchema,
  producer_candidate: etlProducerCandidateSchema
    .nullable()
    .optional(),
  task_people: z.array(etlTaskPersonSchema).default([]),
});

const etlOutputSchema = z.object({
  metadata: z.any(),
  data: z.array(etlRecordSchema),
  records_error: z.array(z.any()).optional().default([]),
  skipped_rows_detail: z.array(z.any()).optional().default([]),
  duplicate_rows_detail: z.array(z.any()).optional().default([]),
});

export async function importProductionsFromEtlService(
  rawPayload: unknown,
  actorUserId: string
) {
  const payload = productionImportRequestSchema.parse(rawPayload);

  const staged = await stageImportFiles(
    "productions",
    payload.files as UploadedImportFile[]
  );

  const etlOutputRaw = await runPythonJson<unknown>({
    pythonCommand: env.PYTHON_COMMAND,
    scriptPath: env.PYTHON_PRODUCTION_IMPORT_SCRIPT,
    timeoutMs: env.PYTHON_IMPORT_TIMEOUT_MS,
    payload: {
      file_paths: staged.files.map((item) => item.absolute_path),
      read_all_sheets: true,
    },
  });

  const etlOutput = etlOutputSchema.parse(etlOutputRaw);
  const records = etlOutput.data;

  console.log(
    "[IMPORT PRODUCTION][ETL METADATA]",
    JSON.stringify(etlOutput.metadata, null, 2)
  );

  console.log("[IMPORT PRODUCTION][ETL VALID RECORD COUNT]", records.length);

  console.log(
    "[IMPORT PRODUCTION][ETL FIRST VALID RECORD]",
    records.length > 0 ? JSON.stringify(records[0], null, 2) : "NO VALID RECORD"
  );

  const result = await withTransaction(async (client) => {
    const summary = {
      created_productions: 0,
      skipped_existing_productions: 0,
      created_tasks: 0,
      created_employees: 0,
      reused_employees: 0,
      warnings: [] as string[],
    };

    for (const record of records) {
      if (record.errors.length > 0) {
        summary.warnings.push(
          `Bỏ qua production ${record.production.name || "[không có tên]"} do ETL báo lỗi.`
        );
        continue;
      }

      const existingProduction = await findProductionByNameAndStartDateRepo(
        client,
        record.production.name,
        record.production.start_date
      );

      if (existingProduction) {
        summary.skipped_existing_productions += 1;
        summary.warnings.push(
          `Production "${record.production.name}" (${record.production.start_date}) đã tồn tại, bỏ qua.`
        );
        continue;
      }

      const resolvedProducer =
        record.producer_candidate?.name
          ? await resolveOrCreateImportEmployee(client, record.producer_candidate.name, {
              defaultDepartment: "television",
            })
          : null;

      if (resolvedProducer) {
        if (resolvedProducer.was_created) {
          summary.created_employees += 1;
        } else {
          summary.reused_employees += 1;
        }
      }

      const insertedProduction = await insertProductionRepo(client, {
        name: record.production.name,
        type: record.production.type,
        genre: record.production.genre || "",
        duration_minutes: record.production.duration_minutes ?? null,
        start_date: record.production.start_date,
        end_date: record.production.end_date ?? null,
        producer: resolvedProducer?.employee_id || null,
        status: record.production.status,
        notes: record.production.notes || "",
        created_by: actorUserId,
      });

      summary.created_productions += 1;

      const insertedTaskEmployeeIds = new Set<string>();

      for (const person of record.task_people) {
        const resolvedEmployee = await resolveOrCreateImportEmployee(
          client,
          person.name,
          {
            defaultDepartment: "television",
          }
        );

        if (!resolvedEmployee) continue;

        if (resolvedEmployee.was_created) {
          summary.created_employees += 1;
        } else {
          summary.reused_employees += 1;
        }

        if (insertedTaskEmployeeIds.has(resolvedEmployee.employee_id)) {
          continue;
        }

        insertedTaskEmployeeIds.add(resolvedEmployee.employee_id);

        await insertProductionTaskRepo(client, {
          production_id: insertedProduction.production_id,
          employee_id: resolvedEmployee.employee_id,
          role: person.role_label || "Thực hiện chương trình",
          notes: person.notes || "",
        });

        summary.created_tasks += 1;
      }
    }

    return summary;
  });

  return {
    ok: true,
    module: "productions",
    batch_id: staged.batch_id,
    staged_dir: staged.staged_dir,
    file_names: staged.files.map((item) => item.original_name),
    imported_count: result.created_productions,
    warnings: result.warnings,
    summary: result,
    etl_metadata: etlOutput.metadata,
    message: `Đã import ${result.created_productions} dự án sản xuất từ dữ liệu ETL.`,
  };
}