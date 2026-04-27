import { pool } from "../../db/pool";

type EmployeePayload = {
  employee_code: string;
  name: string;
  gender: "male" | "female";
  department:
    | "administration"
    | "finance_services"
    | "engineering_tech"
    | "print_media"
    | "digital_media"
    | "news"
    | "television"
    | "radio"
    | "ethnic_affairs";
  position?: string;
  phone_number?: string;
  email?: string;
  address?: string;
  status: "active" | "inactive" | "terminated";
};

function normalizeText(value?: string | null) {
  return String(value || "").trim();
}

function normalizeEmail(value?: string | null) {
  return normalizeText(value).toLowerCase();
}

function normalizePhone(value?: string | null) {
  return normalizeText(value).replace(/\s+/g, "");
}

async function findDuplicateEmployee(input: {
  employee_code: string;
  email?: string | null;
  phone_number?: string | null;
  excludeEmployeeId?: string | null;
}) {
  const normalizedCode = normalizeText(input.employee_code);
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone_number);

  if (!normalizedCode) {
    throw new Error("Mã nhân viên không được để trống.");
  }

  const codeResult = await pool.query(
    `
    select employee_id, employee_code
    from "Employees"
    where upper(trim(employee_code)) = upper(trim($1))
      and ($2::uuid is null or employee_id <> $2)
    limit 1
    `,
    [normalizedCode, input.excludeEmployeeId || null]
  );

  if (codeResult.rowCount) {
    throw new Error(`Mã nhân viên "${normalizedCode}" đã tồn tại.`);
  }

  if (normalizedEmail) {
    const emailResult = await pool.query(
      `
      select employee_id, email
      from "Employees"
      where lower(trim(email)) = lower(trim($1))
        and ($2::uuid is null or employee_id <> $2)
      limit 1
      `,
      [normalizedEmail, input.excludeEmployeeId || null]
    );

    if (emailResult.rowCount) {
      throw new Error(`Email "${normalizedEmail}" đã tồn tại.`);
    }
  }

  if (normalizedPhone) {
    const phoneResult = await pool.query(
      `
      select employee_id, phone_number
      from "Employees"
      where regexp_replace(coalesce(phone_number, ''), '\s+', '', 'g') = $1
        and ($2::uuid is null or employee_id <> $2)
      limit 1
      `,
      [normalizedPhone, input.excludeEmployeeId || null]
    );

    if (phoneResult.rowCount) {
      throw new Error(`Số điện thoại "${normalizedPhone}" đã tồn tại.`);
    }
  }
}

export async function listEmployeesService() {
  const result = await pool.query(`
    select
      employee_id,
      employee_code,
      employee_name as name,
      gender,
      department,
      position,
      phone_number,
      email,
      address,
      status
    from "Employees"
    order by employee_name asc
  `);

  return result.rows;
}

export async function createEmployeeService(payload: EmployeePayload) {
  const normalizedCode = normalizeText(payload.employee_code);
  const normalizedName = normalizeText(payload.name);
  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedPhone = normalizePhone(payload.phone_number);

  if (!normalizedName) {
    throw new Error("Tên nhân viên không được để trống.");
  }

  await findDuplicateEmployee({
    employee_code: normalizedCode,
    email: normalizedEmail || null,
    phone_number: normalizedPhone || null,
  });

  const result = await pool.query(
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
      employee_name as name,
      gender,
      department,
      position,
      phone_number,
      email,
      address,
      status
    `,
    [
      normalizedCode,
      normalizedName,
      payload.gender,
      payload.department,
      normalizeText(payload.position) || null,
      normalizedPhone || null,
      normalizedEmail || null,
      normalizeText(payload.address) || null,
      payload.status,
    ]
  );

  return result.rows[0];
}

export async function updateEmployeeService(
  employeeId: string,
  payload: EmployeePayload
) {
  const normalizedCode = normalizeText(payload.employee_code);
  const normalizedName = normalizeText(payload.name);
  const normalizedEmail = normalizeEmail(payload.email);
  const normalizedPhone = normalizePhone(payload.phone_number);

  if (!normalizedName) {
    throw new Error("Tên nhân viên không được để trống.");
  }

  await findDuplicateEmployee({
    employee_code: normalizedCode,
    email: normalizedEmail || null,
    phone_number: normalizedPhone || null,
    excludeEmployeeId: employeeId,
  });

  const result = await pool.query(
    `
    update "Employees"
    set
      employee_code = $2,
      employee_name = $3,
      gender = $4,
      department = $5,
      position = $6,
      phone_number = $7,
      email = $8,
      address = $9,
      status = $10
    where employee_id = $1
    returning
      employee_id,
      employee_code,
      employee_name as name,
      gender,
      department,
      position,
      phone_number,
      email,
      address,
      status
    `,
    [
      employeeId,
      normalizedCode,
      normalizedName,
      payload.gender,
      payload.department,
      normalizeText(payload.position) || null,
      normalizedPhone || null,
      normalizedEmail || null,
      normalizeText(payload.address) || null,
      payload.status,
    ]
  );

  if (!result.rowCount) {
    throw new Error("Không tìm thấy nhân viên.");
  }

  return result.rows[0];
}

export async function deleteEmployeeService(employeeId: string) {
  const usedInTasks = await pool.query(
    `select 1 from "ProductionTasks" where employee_id = $1 limit 1`,
    [employeeId]
  );

  const usedAsProducer = await pool.query(
    `select 1 from "Productions" where producer = $1 limit 1`,
    [employeeId]
  );

  if (usedInTasks.rowCount || usedAsProducer.rowCount) {
    throw new Error("Không thể xóa nhân viên vì đang được sử dụng ở dữ liệu khác.");
  }

  const result = await pool.query(
    `delete from "Employees" where employee_id = $1 returning employee_id`,
    [employeeId]
  );

  if (!result.rowCount) {
    throw new Error("Không tìm thấy nhân viên.");
  }

  return result.rows[0];
}