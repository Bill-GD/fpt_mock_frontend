"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listAttempts, listViolations, type DemoAttempt, type DemoViolation, type ViolationType } from "@/lib/demo-store";

const VIOLATION_LABEL: Record<ViolationType, string> = {
  tab_switch: "Tab switch",
  keyboard_copy: "Copy",
  keyboard_paste: "Paste",
  camera_multiple_faces: "Multiple faces",
  camera_gaze_away: "Gaze away",
  camera_missing: "Camera missing",
};

export default function TeacherResultsPage() {
  const [selectedExamCode, setSelectedExamCode] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<ViolationType | "all">("all");
  const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);

  const attempts = listAttempts();
  const violations = listViolations();

  const examCodes = useMemo(() => {
    const set = new Set(attempts.map((a) => a.examCode).filter(Boolean));
    return Array.from(set).sort();
  }, [attempts]);

  const filteredAttempts = useMemo(() => {
    return attempts.filter((a) => (selectedExamCode === "all" ? true : a.examCode === selectedExamCode));
  }, [attempts, selectedExamCode]);

  const filteredViolations = useMemo(() => {
    const byAttempt = selectedAttemptId ? violations.filter((v) => v.attemptId === selectedAttemptId) : [];
    return byAttempt.filter((v) => (selectedType === "all" ? true : v.type === selectedType));
  }, [violations, selectedAttemptId, selectedType]);

  const selectedAttempt: DemoAttempt | undefined = useMemo(() => {
    if (!selectedAttemptId) return undefined;
    return attempts.find((a) => a.id === selectedAttemptId);
  }, [attempts, selectedAttemptId]);

  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Kết quả & Vi phạm"
      nav={[
        { href: "/teacher", label: "Tổng quan" },
        { href: "/teacher/exams", label: "Danh sách đề" },
        { href: "/teacher/exams/new", label: "Tạo đề mới", badge: "Excel/Manual/AI" },
        { href: "/teacher/results", label: "Kết quả & Vi phạm" },
      ]}
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Kết quả & Vi phạm</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Demo data lấy từ localStorage khi student nộp bài. Chọn attempt để xem drill-down violation logs.
            </p>
          </div>
          <Badge variant="success">drill-down</Badge>
        </div>

        <Card title="Bộ lọc">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Exam code</span>
              <select
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                value={selectedExamCode}
                onChange={(e) => {
                  setSelectedExamCode(e.target.value);
                  setSelectedAttemptId(null);
                }}
              >
                <option value="all">Tất cả</option>
                {examCodes.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Violation type</span>
              <select
                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as ViolationType | "all")}
                disabled={!selectedAttemptId}
              >
                <option value="all">Tất cả</option>
                {Object.entries(VIOLATION_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
          <Card title="Attempts" description="Click 1 attempt để xem chi tiết">
            {filteredAttempts.length === 0 ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Chưa có attempt nào. Hãy vào <span className="font-medium">/student/join</span> làm bài và nộp để tạo demo data.
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="text-left text-zinc-500 dark:text-zinc-400">
                    <tr>
                      <th className="py-2">Exam</th>
                      <th className="py-2">Student</th>
                      <th className="py-2">Score</th>
                      <th className="py-2">Violations</th>
                      <th className="py-2">Submitted</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-700 dark:text-zinc-300">
                    {filteredAttempts.map((a) => {
                      const active = a.id === selectedAttemptId;
                      return (
                        <tr
                          key={a.id}
                          className={[
                            "border-t border-zinc-100 dark:border-zinc-900",
                            active ? "bg-zinc-50 dark:bg-zinc-900/30" : "",
                          ].join(" ")}
                        >
                          <td className="py-3 font-medium">
                            {a.examTitle} <span className="text-xs text-zinc-500">({a.examCode})</span>
                          </td>
                          <td className="py-3">{a.studentEmail}</td>
                          <td className="py-3">
                            <Badge variant={a.score >= 8 ? "success" : a.score >= 5 ? "warning" : "danger"}>
                              {a.score.toFixed(1)}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant={a.violationCount ? "warning" : "default"}>{a.violationCount}</Badge>
                          </td>
                          <td className="py-3 text-zinc-500 dark:text-zinc-400">
                            {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : "—"}
                          </td>
                          <td className="py-3">
                            <Button type="button" variant="secondary" onClick={() => setSelectedAttemptId(a.id)}>
                              Xem
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card
            title="Drill-down"
            description={selectedAttempt ? `Attempt: ${selectedAttempt.id}` : "Chọn 1 attempt ở bảng bên trái"}
            right={selectedAttempt ? <Badge variant="success">selected</Badge> : <Badge>idle</Badge>}
          >
            {!selectedAttempt ? (
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Tip: vào trang student exam, dùng “Demo controls” để tạo vi phạm rồi nộp bài để thấy log ở đây.
              </div>
            ) : (
              <div className="grid gap-4">
                <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span>Student</span>
                    <span className="font-medium">{selectedAttempt.studentEmail}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Score</span>
                    <span className="font-medium">{selectedAttempt.score.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Started</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {new Date(selectedAttempt.startedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Submitted</span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {selectedAttempt.submittedAt ? new Date(selectedAttempt.submittedAt).toLocaleString() : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Violation count</span>
                    <Badge variant={selectedAttempt.violationCount ? "warning" : "default"}>{selectedAttempt.violationCount}</Badge>
                  </div>
                </div>

                <div>
                  <div className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">Violation logs</div>
                  {filteredViolations.length === 0 ? (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">Không có violation log (hoặc filter đang rỗng).</div>
                  ) : (
                    <div className="overflow-auto">
                      <table className="w-full min-w-[520px] text-sm">
                        <thead className="text-left text-zinc-500 dark:text-zinc-400">
                          <tr>
                            <th className="py-2">Time</th>
                            <th className="py-2">Type</th>
                            <th className="py-2">Description</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-700 dark:text-zinc-300">
                          {filteredViolations.map((v: DemoViolation) => (
                            <tr key={v.id} className="border-t border-zinc-100 dark:border-zinc-900">
                              <td className="py-3 text-zinc-500 dark:text-zinc-400">
                                {new Date(v.createdAt).toLocaleTimeString()}
                              </td>
                              <td className="py-3">
                                <Badge variant="warning">{VIOLATION_LABEL[v.type]}</Badge>
                              </td>
                              <td className="py-3">{v.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

