import { promises as fs } from "fs";
import path from "path";

export type StagedImportFile = {
  original_name: string;
  stored_name: string;
  absolute_path: string;
  mimetype: string;
  size: number;
};

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function stageImportFiles(
  moduleName: "contracts" | "productions",
  files: Express.Multer.File[]
) {
  const batchId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const targetDir = path.join(
    process.cwd(),
    "tmp",
    "imports",
    moduleName,
    batchId
  );

  await fs.mkdir(targetDir, { recursive: true });

  const stagedFiles: StagedImportFile[] = [];

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];
    const safeName = `${String(i + 1).padStart(2, "0")}-${sanitizeFileName(file.originalname)}`;
    const absolutePath = path.join(targetDir, safeName);

    await fs.writeFile(absolutePath, file.buffer);

    stagedFiles.push({
      original_name: file.originalname,
      stored_name: safeName,
      absolute_path: absolutePath,
      mimetype: file.mimetype,
      size: file.size,
    });
  }

  return {
    batch_id: batchId,
    staged_dir: targetDir,
    files: stagedFiles,
  };
}