import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function StudentHistoryPage() {
  return (
    <AppShell
      title="Student Dashboard"
      subtitle="Lịch sử bài thi"
      nav={[
        { href: "/student", label: "Tổng quan" },
        { href: "/student/join", label: "Nhập mã phòng thi", badge: "code" },
        { href: "/student/history", label: "Lịch sử bài thi" },
      ]}
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Lịch sử bài thi</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Placeholder: map từ <span className="font-medium">GET /attempts/my</span>.
            </p>
          </div>
          <ButtonLink href="/student" variant="secondary">
            Về dashboard
          </ButtonLink>
        </div>

        <Card title="Danh sách attempt">
          <div className="grid gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    Đề thi #{i + 1}
                  </div>
                  <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Started — • Submitted — • Status —
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Score —</Badge>
                  <ButtonLink href="/student/result" variant="ghost">
                    Xem kết quả
                  </ButtonLink>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

