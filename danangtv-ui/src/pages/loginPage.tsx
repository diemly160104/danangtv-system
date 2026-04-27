import { useState } from "react";
import { Input } from "@/components/ui/input";
import { BRAND_LOGO_URL } from "@/features/danangtv/options";
import { FieldBlock, PrimaryButton } from "@/features/danangtv/shared/commonComponents";
import { LoginForm } from "@/features/danangtv/types";




export function LoginPage({
  onLogin,
}: {
  onLogin: (username: string, password: string) => Promise<void>;
}) {
  const [form, setForm] = useState<LoginForm>({ username: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.username || !form.password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await onLogin(form.username.trim(), form.password);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Đăng nhập thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-100 p-4">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border bg-white shadow-xl lg:grid-cols-[1.05fr_0.95fr]">
          <div className="hidden border-r bg-gradient-to-br from-slate-950 via-slate-900 to-orange-600 p-10 text-white lg:block">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
                <img
                  src={BRAND_LOGO_URL}
                  alt="Logo DaNangTV"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="text-3xl font-extrabold tracking-wide text-white">
                DaNangTV
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-orange-200">
                  <img
                    src={BRAND_LOGO_URL}
                    alt="Logo DaNangTV"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="text-2xl font-extrabold tracking-wide text-orange-600">
                  DaNangTV
                </div>
              </div>
            </div>

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Đăng nhập DaNangTV
              </h1>
            </div>

            <div className="mt-8 space-y-4">
              <FieldBlock label="Tên đăng nhập">
                <Input
                  value={form.username}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, username: e.target.value }))
                  }
                  placeholder="Nhập tên đăng nhập"
                  disabled={submitting}
                />
              </FieldBlock>

              <FieldBlock label="Mật khẩu">
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Nhập mật khẩu"
                  disabled={submitting}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      void handleSubmit();
                    }
                  }}
                />
              </FieldBlock>

              {error && (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <PrimaryButton
                className="w-full"
                onClick={() => void handleSubmit()}
                disabled={submitting}
              >
                {submitting ? "Đang đăng nhập..." : "Đăng nhập"}
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}