"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAttempts, listExams, type DemoExam } from "@/lib/demo-store";

function formatDateTime(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

export default function TeacherExamsPage() {
  const [exams, setExams] = useState<DemoExam[]>([]);
  const [attempts, setAttempts] = useState<ReturnType<typeof listAttempts>>([]);

  useEffect(() => {
    const load = () => {
      setExams(listExams());
      setAttempts(listAttempts());
    };

    load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => {
      window.removeEventListener("storage", load);
      window.removeEventListener("focus", load);
    };
  }, []);

  const statsByCode = useMemo(() => {
    const map = new Map<string, { attempts: number; violations: number }>();
    for (const a of attempts) {
      const current = map.get(a.examCode) ?? { attempts: 0, violations: 0 };
      current.attempts += 1;
      current.violations += a.violationCount;
      map.set(a.examCode, current);
    }
    return map;
  }, [attempts]);

  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Danh sách đề thi"
      nav={[
        { href: "/teacher", label: "Tổng quan" },
        { href: "/teacher/exams", label: "Danh sách đề" },
        { href: "/teacher/exams/new", label: "Tạo đề mới", badge: "Excel/Manual/AI" },
        { href: "/teacher/results", label: "Kết quả & Vi phạm" },
      ]}
    >
      <div className="grid gap-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black text-zinc-900">Danh sách đề thi</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Demo data lấy từ localStorage khi teacher bấm "Lưu đề".
            </p>
          </div>
          <ButtonLink href="/teacher/exams/new">Tạo đề mới</ButtonLink>
        </div>

        <div className="grid gap-3">
          {exams.length === 0 ? (
            <Card title="Chưa có đề thi" description="Tạo đề đầu tiên để bắt đầu demo">
              <ButtonLink href="/teacher/exams/new">Tạo đề mới</ButtonLink>
            </Card>
          ) : (
            exams.map((exam) => {
              const stats = statsByCode.get(exam.code) ?? { attempts: 0, violations: 0 };
              return (
                <Card
                  key={exam.id}
                  title={exam.title}
                  description={`Start ${formatDateTime(exam.startTime)} • End ${formatDateTime(exam.endTime)} • Duration ${exam.durationMinutes} phút`}
                  right={<Badge variant="success">CODE: {exam.code}</Badge>}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-zinc-600">
                      {exam.questionCount} câu hỏi • {stats.attempts} attempt • {stats.violations} vi phạm
                    </div>
                    <div className="flex gap-2">
                      <ButtonLink href="/teacher/exams/new" variant="secondary">
                        Tạo bản mới
                      </ButtonLink>
                      <ButtonLink href="/teacher/results" variant="ghost">
                        Xem kết quả
                      </ButtonLink>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </AppShell>
  );
}
