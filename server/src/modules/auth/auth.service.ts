import { z } from "zod";
import { pool } from "../../db/pool";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export async function loginService(rawPayload: unknown) {
  const payload = loginSchema.parse(rawPayload);

  const result = await pool.query(
    `
    SELECT
      u.user_id,
      u.username,
      u.role,
      u.status,
      e.employee_id,
      e.employee_code,
      e.employee_name
    FROM "Users" u
    LEFT JOIN "Employees" e
      ON e.user_id = u.user_id
    WHERE u.username = $1
      AND u.password_hash = crypt($2, u.password_hash)
    LIMIT 1
    `,
    [payload.username, payload.password]
  );

  if (result.rows.length === 0) {
    throw new Error("INVALID_CREDENTIALS");
  }

  const user = result.rows[0];

  if (user.status !== "active") {
    throw new Error("USER_NOT_ACTIVE");
  }

  return {
    user_id: user.user_id,
    username: user.username,
    role: user.role,
    status: user.status,
    employee_id: user.employee_id ?? undefined,
    employee_code: user.employee_code ?? undefined,
    employee_name: user.employee_name ?? undefined,
  };
}