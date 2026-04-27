import { spawn } from "child_process";
import path from "path";

export type PythonImportBridgeInput = {
  module: "contracts" | "productions";
  import_type: string;
  batch_id: string;
  staged_dir: string;
  file_names: string[];
};

export type PythonImportBridgeOutput = {
  ok: boolean;
  imported_count: number;
  warnings: string[];
  message: string;
  raw?: unknown;
};

function normalizeBridgeOutput(raw: any): PythonImportBridgeOutput {
  return {
    ok: raw?.ok !== false,
    imported_count: Number(raw?.imported_count ?? 0),
    warnings: Array.isArray(raw?.warnings)
      ? raw.warnings.map((item: unknown) => String(item))
      : [],
    message:
      typeof raw?.message === "string"
        ? raw.message
        : "Python ETL completed.",
    raw,
  };
}

export async function runPythonImportBridge(args: {
  pythonCommand: string;
  scriptPath: string;
  timeoutMs: number;
  payload: PythonImportBridgeInput;
}) {
  const resolvedScriptPath = path.isAbsolute(args.scriptPath)
    ? args.scriptPath
    : path.resolve(process.cwd(), args.scriptPath);

  return new Promise<PythonImportBridgeOutput>((resolve, reject) => {
    const child = spawn(args.pythonCommand, [resolvedScriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const finish = (fn: () => void) => {
      if (finished) return;
      finished = true;
      fn();
    };

    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      finish(() => {
        reject(
          new Error(
            `Python import bridge timeout sau ${args.timeoutMs}ms.`
          )
        );
      });
    }, args.timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      finish(() => reject(error));
    });

    child.on("close", (code) => {
      clearTimeout(timeout);

      finish(() => {
        if (code !== 0) {
          reject(
            new Error(
              `Python ETL exited với code ${code}. ${stderr || "Không có stderr."}`
            )
          );
          return;
        }

        try {
          const parsed = JSON.parse(stdout || "{}");
          resolve(normalizeBridgeOutput(parsed));
        } catch {
          reject(
            new Error(
              `Không parse được JSON stdout từ Python. stdout="${stdout}" stderr="${stderr}"`
            )
          );
        }
      });
    });

    child.stdin.write(JSON.stringify(args.payload));
    child.stdin.end();
  });
}