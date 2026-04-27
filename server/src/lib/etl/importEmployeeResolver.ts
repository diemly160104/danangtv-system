import type { PoolClient } from "pg";

export type ImportEmployeeDepartment =
  | "television"
  | "finance_services"
  | "news"
  | "radio"
  | "digital_media"
  | "print_media"
  | "engineering_tech"
  | "administration"
  | "ethnic_affairs";

export type ResolvedImportEmployee = {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  department: string;
  was_created: boolean;
};

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function normalizeEmployeeName(rawValue: string) {
  const text = normalizeWhitespace(rawValue);
  if (!text) return "";

  return text
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function buildDepartmentPrefix(department: ImportEmployeeDepartment) {
  switch (department) {
    case "television":
      return "TV";
    case "finance_services":
      return "FS";
    case "news":
      return "NW";
    case "radio":
      return "RD";
    case "digital_media":
      return "DM";
    case "print_media":
      return "PM";
    case "engineering_tech":
      return "ET";
    case "administration":
      return "AD";
    case "ethnic_affairs":
      return "EA";
    default:
      return "EM";
  }
}

async function findEmployeeByNameRepo(
  client: PoolClient,
  employeeName: string
) {
  const normalizedName = normalizeEmployeeName(employeeName);
  if (!normalizedName) return null;

  const result = await client.query(
    `
    select
      employee_id,
      employee_code,
      employee_name,
      department
    from "Employees"
    where lower(regexp_replace(trim(employee_name), '\\s+', ' ', 'g'))
        = lower(regexp_replace(trim($1), '\\s+', ' ', 'g'))
    order by employee_id asc
    limit 1
    `,
    [normalizedName]
  );

  return result.rows[0] || null;
}

async function generateNextEmployeeCode(
  client: PoolClient,
  department: ImportEmployeeDepartment
) {
  const prefix = buildDepartmentPrefix(department);
  const pattern = `^${prefix}[0-9]{6}$`;

  const result = await client.query(
    `
    select employee_code
    from "Employees"
    where employee_code ~ $1
    order by employee_code desc
    limit 1
    `,
    [pattern]
  );

  const currentCode = result.rows[0]?.employee_code as string | undefined;

  if (!currentCode) {
    return `${prefix}000001`;
  }

  const currentNumber = Number(currentCode.slice(2));
  const nextNumber = Number.isFinite(currentNumber) ? currentNumber + 1 : 1;

  return `${prefix}${String(nextNumber).padStart(6, "0")}`;
}

async function insertImportEmployeeRepo(
  client: PoolClient,
  input: {
    employee_name: string;
    department: ImportEmployeeDepartment;
  }
) {
  const employee_code = await generateNextEmployeeCode(client, input.department);

  const result = await client.query(
    `
    insert into "Employees" (
      employee_code,
      employee_name,
      gender,
      department,
      position,
      phone_number,
      email,
      address,
      status
    )
    values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    returning
      employee_id,
      employee_code,
      employee_name,
      department
    `,
    [
      employee_code,
      normalizeEmployeeName(input.employee_name),
      "male", // đổi nếu schema của bạn cần giá trị khác
      input.department,
      "Nhân viên",
      "",
      "",
      "",
      "active",
    ]
  );

  return result.rows[0];
}

export async function resolveOrCreateImportEmployee(
  client: PoolClient,
  rawEmployeeName: string,
  options?: {
    defaultDepartment?: ImportEmployeeDepartment;
  }
): Promise<ResolvedImportEmployee | null> {
  const normalizedName = normalizeEmployeeName(rawEmployeeName);
  if (!normalizedName) return null;

  const existing = await findEmployeeByNameRepo(client, normalizedName);
  if (existing) {
    return {
      employee_id: existing.employee_id,
      employee_code: existing.employee_code,
      employee_name: existing.employee_name,
      department: existing.department,
      was_created: false,
    };
  }

  const created = await insertImportEmployeeRepo(client, {
    employee_name: normalizedName,
    department: options?.defaultDepartment || "television",
  });

  return {
    employee_id: created.employee_id,
    employee_code: created.employee_code,
    employee_name: created.employee_name,
    department: created.department,
    was_created: true,
  };
}