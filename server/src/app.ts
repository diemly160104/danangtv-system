import cors from "cors";
import express from "express";
import { HttpError } from "./lib/httpError";
import { bootstrapRouter } from "./modules/bootstrap/bootstrap.routes";
import authRouter from "./modules/auth/auth.route";
import { filesRouter } from "./modules/files/files.routes";
import { contractsRouter } from "./modules/contracts/contracts.routes";
import { productionsRouter } from "./modules/productions/productions.routes";
import { contentsRouter } from "./modules/contents/contents.routes";
import {
  schedulesRouter,
  studioUsageSchedulesRouter,
} from "./modules/schedules/schedules.routes";
import { employeesRouter } from "./modules/employees/employees.route";
import { partiesRouter } from "./modules/parties/parties.route";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/danangtv/bootstrap", bootstrapRouter);
app.use("/api/danangtv/auth", authRouter);
app.use("/api/danangtv/files", filesRouter);
app.use("/api/danangtv/contracts", contractsRouter);
app.use("/api/danangtv/productions", productionsRouter);
app.use("/api/danangtv/contents", contentsRouter);
app.use("/api/danangtv/schedules", schedulesRouter);
app.use("/api/danangtv/studio-usage-schedules", studioUsageSchedulesRouter);
app.use("/api/danangtv/employees", employeesRouter);
app.use("/api/danangtv/parties", partiesRouter);

app.use((req, _res, next) => {
  console.error(`[404] Route not found: ${req.method} ${req.originalUrl}`);
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(
  (
    error: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    const message =
      error instanceof Error ? error.message : "Internal server error";

    const lower = message.toLowerCase();

    const isBusinessError =
      error instanceof HttpError ||
      lower.includes("đã tồn tại") ||
      lower.includes("không được để trống") ||
      lower.includes("không hợp lệ") ||
      lower.includes("không tìm thấy") ||
      lower.includes("phải chọn") ||
      lower.includes("phải có") ||
      lower.includes("bị trùng") ||
      lower.includes("không khớp");

    const status =
      error instanceof HttpError ? error.status : isBusinessError ? 400 : 500;

    console.error("[ERROR]", {
      status,
      message,
      error,
    });

    res.status(status).json({
      ok: false,
      message,
    });
  }
);