import * as React from "react";
import { CalendarDays, Clapperboard, FileText, FolderOpen, LayoutDashboard, LogOut, Settings } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { NavKey, SessionUser } from "@/features/danangtv/types";
import { roleLabel } from "@/features/danangtv/utils/Helpers";
import { BRAND_LOGO_URL } from "@/features/danangtv/options";


// Hàm dựng khung giao diện chính của ứng dụng, bao gồm sidebar điều hướngheader thông tin người dùng và vùng hiển thị nội dung các trang

export function Shell({ active, onChange, currentUser, onLogout, children }: { active: NavKey; onChange: (v: NavKey) => void; currentUser: SessionUser; onLogout: () => void; children: React.ReactNode }) {
  const items = [
    { key: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
    { key: "contracts", label: "Hợp đồng", icon: FileText },
    { key: "productions", label: "Sản xuất", icon: Clapperboard },
    { key: "contents", label: "Content", icon: FolderOpen },
    { key: "schedules", label: "Lên lịch", icon: CalendarDays },
    { key: "catalog", label: "Danh mục", icon: Settings },
  ] as const;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-orange-50 via-white to-slate-100 text-slate-900">
      <div className="grid h-full grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="sticky top-0 h-screen overflow-y-auto border-r bg-white p-4">
          <div className="flex items-center gap-3 px-2 py-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-orange-200">
              <img src={BRAND_LOGO_URL} alt="Logo DaNangTV" className="h-full w-full object-contain" />
            </div>
            <div className="text-2xl font-extrabold tracking-wide text-orange-600">DaNangTV</div>
          </div>

          <nav className="mt-6 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = active === item.key;

              return (
                <button
                  key={item.key}
                  onClick={() => onChange(item.key)}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${
                    isActive
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-600 hover:bg-orange-50 hover:text-orange-700"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="flex h-screen min-w-0 flex-col overflow-hidden">
          <header className="border-b bg-white px-4 py-3 md:px-6">
            <div className="flex justify-end">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full border-orange-200 bg-orange-50 px-3 py-1 text-orange-700">
                  {roleLabel(currentUser.role)}
                </Badge>
                <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-3 py-2 text-sm">
                  Xin chào, <span className="font-semibold">{currentUser.employee_name || currentUser.username}</span>
                </div>
                <Button variant="outline" size="sm" className="rounded-2xl" onClick={onLogout}>
                  <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}