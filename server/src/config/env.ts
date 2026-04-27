import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

export const env = {
  PORT: Number(process.env.PORT || 3001),

  DB_HOST: requireEnv("DB_HOST"),
  DB_PORT: Number(process.env.DB_PORT || 5432),
  DB_NAME: requireEnv("DB_NAME"),
  DB_USER: requireEnv("DB_USER"),
  DB_PASSWORD: requireEnv("DB_PASSWORD"),
  DB_SSL: String(process.env.DB_SSL || "true") === "true",

  GCS_BUCKET_NAME: requireEnv("GCS_BUCKET_NAME"),


  SYSTEM_USER_ID: optionalEnv("SYSTEM_USER_ID"),

  PYTHON_COMMAND: process.env.PYTHON_COMMAND || "python",
  PYTHON_CONTRACT_IMPORT_SCRIPT:
    process.env.PYTHON_CONTRACT_IMPORT_SCRIPT || "ETL/contracts/run_import.py",
  PYTHON_PRODUCTION_IMPORT_SCRIPT:
    process.env.PYTHON_PRODUCTION_IMPORT_SCRIPT || "ETL/productions/run_import.py",
  PYTHON_IMPORT_TIMEOUT_MS: Number(
    process.env.PYTHON_IMPORT_TIMEOUT_MS || 120000
  ),
};