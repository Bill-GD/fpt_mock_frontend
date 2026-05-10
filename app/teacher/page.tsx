import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function TeacherDashboardPage() {
  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Quản lý đề thi • Kết quả • Vi phạm"
      nav={[
        { href: "/teacher", label: "Tổng quan" },
        { href: "/teacher/exams", label: "Danh sách đề" },
        { href: "/teacher/exams/new", label: "Tạo đề mới", badge: "Excel/Manual/AI" },
        { href: "/teacher/results", label: "Kết quả & Vi phạm" },
      ]}
    >
      <div className="page-stack">
        <div className="section-head flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Tổng quan</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Skeleton UI để team backend gắn API dần theo Sprint 2–3.
            </p>
          </div>
          <div className="flex gap-2">
            <ButtonLink href="/teacher/exams/new">Tạo đề</ButtonLink>
            <ButtonLink href="/teacher/exams" variant="secondary">
              Xem danh sách
            </ButtonLink>
          </div>
        </div>

        <div className="bento-grid">
          <Card title="Đề thi" description="Số lượng đề đã tạo" shadow="green">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-black text-zinc-900">—</div>
              <Badge>placeholder</Badge>
            </div>
          </Card>
          <Card title="Lượt thi" description="Tổng số attempt" shadow="orange">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-black text-zinc-900">—</div>
              <Badge variant="success">realtime</Badge>
            </div>
          </Card>
          <Card title="Vi phạm" description="Tổng số vi phạm" shadow="red">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-black text-zinc-900">—</div>
              <Badge variant="warning">anti-cheat</Badge>
            </div>
          </Card>
        </div>

        <Card
          title="Việc cần làm"
          description="Những màn hình chính cần cho demo"
          right={<Badge variant="warning">UI only</Badge>}
          shadow="dark"
        >
          <ul className="grid gap-2 text-sm text-zinc-600">
            <li className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[color:var(--border)] bg-[color:var(--primary-surface)]"></span> Tạo đề: Excel / Manual / AI + preview</li>
            <li className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[color:var(--border)] bg-[color:var(--accent-surface)]"></span> Cấu hình thời gian start/end/duration</li>
            <li className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[color:var(--border)] bg-[color:var(--danger-surface)]"></span> Sinh mã code phòng thi 6–8 ký tự</li>
            <li className="flex items-center gap-2"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[color:var(--border)] bg-white"></span> Trang kết quả + thống kê vi phạm theo attempt</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
