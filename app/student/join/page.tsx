"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { normalizeExamCode, validateExamCode } from "../mock-exam";

export default function StudentJoinPage() {
  const router = useRouter();
  const [examCode, setExamCode] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationError = validateExamCode(examCode);
    if (validationError) {
      setError(validationError);
      return;
    }

    const normalizedCode = normalizeExamCode(examCode);
    router.push(`/student/exam?code=${encodeURIComponent(normalizedCode)}`);
  };

  return (
    <AppShell
      title="Student Dashboard"
      subtitle="Nhập mã phòng thi"
      nav={[
        { href: "/student", label: "Tổng quan" },
        { href: "/student/join", label: "Nhập mã phòng thi", badge: "code" },
        { href: "/student/history", label: "Lịch sử bài thi" },
      ]}
    >
      <div className="grid gap-5">
        <div>
          <h1 className="text-2xl font-black text-zinc-900">Vào phòng thi</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Nhập mã phòng thi để bắt đầu bài test demo ngay trên UI.
          </p>
        </div>

        <Card title="Nhập mã code" right={<Badge variant="success">Sprint 2</Badge>}>
          <form className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start" onSubmit={handleSubmit}>
            <Input
              label="Mã phòng thi"
              placeholder="VD: A1B2C3"
              value={examCode}
              onChange={(event) => {
                setExamCode(event.target.value.toUpperCase());
                if (error) {
                  setError(undefined);
                }
              }}
              error={error}
              hint={!error ? "Dùng 4-10 ký tự chữ hoặc số." : undefined}
            />
            <Button type="submit" className="w-full sm:w-auto mt-7 sm:mt-6">
              Vào thi
            </Button>
          </form>
        </Card>

        <Card title="Lưu ý anti-cheat" description="Hệ thống sẽ ghi nhận vi phạm trong khi thi">
          <ul className="grid gap-2 text-sm text-zinc-600">
            <li className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full border-2 border-[color:var(--border)] bg-[#FFD6DD]"></span> Không chuyển tab (tab-switch detection)</li>
            <li className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full border-2 border-[color:var(--border)] bg-[#FFD6DD]"></span> Không dùng Ctrl+C / Ctrl+V (keyboard logger)</li>
            <li className="flex items-center gap-2"><span className="inline-block h-2 w-2 rounded-full border-2 border-[color:var(--border)] bg-[#FFD6DD]"></span> Bật camera khi được yêu cầu (fallback nếu từ chối)</li>
          </ul>
        </Card>
      </div>
    </AppShell>
  );
}
