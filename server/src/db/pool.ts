import { Pool } from "pg";
import { env } from "../config/env";

const isCloudSqlSocket = env.DB_HOST.startsWith("/cloudsql/");

export const pool = new Pool({
  host: env.DB_HOST,
  port: isCloudSqlSocket ? undefined : env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  ssl: isCloudSqlSocket ? false : env.DB_SSL ? { rejectUnauthorized: false } : false,
});