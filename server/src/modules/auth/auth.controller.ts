import type { Request, Response } from "express";
import { ZodError } from "zod";
import { loginService } from "./auth.service";

export async function loginController(req: Request, res: Response) {
  try {
    const user = await loginService(req.body);

    return res.json({
      ok: true,
      user,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Dữ liệu đăng nhập không hợp lệ",
        errors: error.flatten(),
      });
    }

    if (error instanceof Error) {
      if (error.message === "INVALID_CREDENTIALS") {
        return res.status(401).json({
          message: "Sai tên đăng nhập hoặc mật khẩu",
        });
      }

      if (error.message === "USER_NOT_ACTIVE") {
        return res.status(403).json({
          message: "Tài khoản không hoạt động",
        });
      }
    }

    console.error("[loginController]", error);

    return res.status(500).json({
      message: "Đăng nhập thất bại",
    });
  }
}