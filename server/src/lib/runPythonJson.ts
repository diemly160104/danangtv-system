import { spawn } from "child_process";
import path from "path";

export async function runPythonJson<TOutput>(args: {
  pythonCommand: string;
  scriptPath: string;
  payload: unknown;
  timeoutMs?: number;
}): Promise<TOutput> {
  const resolvedScriptPath = path.isAbsolute(args.scriptPath)
    ? args.scriptPath
    : path.resolve(process.cwd(), args.scriptPath);

  return new Promise<TOutput>((resolve, reject) => {
    const child = spawn(args.pythonCommand, [resolvedScriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let finished = false;

    const timeout = setTimeout(() => {
      if (finished) return;
      finished = true;
      child.kill("SIGKILL");
      reject(
        new Error(`Python ETL timeout sau ${args.timeoutMs ?? 120000}ms.`)
      );
    }, args.timeoutMs ?? 120000);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);
      reject(error);
    });

    child.on("close", (code) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeout);

      if (code !== 0) {
        reject(
          new Error(
            `Python exited với code ${code}. stderr: ${stderr || "Không có stderr."}`
          )
        );
        return;
      }

      try {
        const parsed = JSON.parse(stdout || "{}") as TOutput;
        resolve(parsed);
      } catch {
        reject(
          new Error(
            `Không parse được JSON stdout từ Python. stdout="${stdout}" stderr="${stderr}"`
          )
        );
      }
    });

    child.stdin.write(JSON.stringify(args.payload));
    child.stdin.end();
  });
}