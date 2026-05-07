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
      <div className="grid gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tổng quan</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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

        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Đề thi" description="Số lượng đề đã tạo">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">—</div>
              <Badge>placeholder</Badge>
            </div>
          </Card>
          <Card title="Lượt thi" description="Tổng số attempt">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">—</div>
              <Badge variant="success">realtime</Badge>
            </div>
          </Card>
          <Card title="Vi phạm" description="Tổng số vi phạm">
            <div className="flex items-end justify-between">
              <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">—</div>
              <Badge variant="warning">anti-cheat</Badge>
            </div>
          </Card>
        </div>

        <Card
          title="Việc cần làm"
          description="Những màn hình chính cần cho demo"
          right={<Badge variant="warning">UI only</Badge>}
        >
          <ul className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li>- Tạo đề: Excel / Manual / AI + preview</li>
            <li>- Cấu hình thời gian start/end/duration</li>
            <li>- Sinh mã code phòng thi 6–8 ký tự</li>
            <li>- Trang kết quả + thống kê vi phạm theo attempt</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}

