import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function StudentDashboardPage() {
  return (
    <AppShell
      title="Student Dashboard"
      subtitle="Vào phòng thi • Làm bài • Xem kết quả"
      nav={[
        { href: "/student", label: "Tổng quan" },
        { href: "/student/join", label: "Nhập mã phòng thi", badge: "code" },
        { href: "/student/history", label: "Lịch sử bài thi" },
      ]}
    >
      <div className="page-stack">
        <div className="section-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Tổng quan</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Grid bài thi đã làm/sắp làm + truy cập nhanh "Join by code".
            </p>
          </div>
          <ButtonLink href="/student/join">Vào phòng thi</ButtonLink>
        </div>

        <Card
          title="Vào phòng thi"
          description="Nhập mã code do teacher cung cấp"
          right={<Badge variant="success">Sprint 2</Badge>}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input label="Mã phòng thi" placeholder="VD: A1B2C3" />
            <ButtonLink href="/student/join" className="w-full sm:w-auto">
              Tiếp tục
            </ButtonLink>
          </div>
        </Card>

        <Card title="Bài thi của bạn" description="Hiển thị dạng bento cards (placeholder)">
          <div className="bento-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border-2 border-[color:var(--border)] bg-white p-4 shadow-[4px_4px_0_#1a1a1a] transition hover:shadow-[6px_6px_0_#1a1a1a]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-zinc-900">
                      Bài thi #{i + 1}
                    </div>
                    <div className="mt-0.5 text-xs text-zinc-500">—/—/— • — phút</div>
                  </div>
                  <Badge>—</Badge>
                </div>
                <div className="mt-3 text-sm text-zinc-600">
                  Trạng thái: <span className="font-bold">placeholder</span>
                </div>
                <div className="mt-4 flex gap-2">
                  <ButtonLink href="/student/join" variant="secondary" className="flex-1 justify-center">
                    Mở
                  </ButtonLink>
                  <ButtonLink href="/student/history" variant="ghost" className="flex-1 justify-center">
                    KQ
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
