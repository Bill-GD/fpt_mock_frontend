"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { calculateExamResult, mockExam, normalizeExamCode, parseSerializedAnswers, type OptionId } from "../mock-exam";

export default function StudentResultPage() {
  const searchParams = useSearchParams();

  const examCode = normalizeExamCode(searchParams.get("code") ?? "");
  const serializedAnswers = searchParams.get("answers") ?? "";
  const hasSubmission = Boolean(serializedAnswers);

  const answers = useMemo(
    () => parseSerializedAnswers(serializedAnswers, mockExam.questions.length),
    [serializedAnswers],
  );
  const result = useMemo(() => calculateExamResult(mockExam, answers), [answers]);

  return (
    <AppShell
      title="Student Dashboard"
      subtitle="Kết quả bài thi"
      nav={[
        { href: "/student", label: "Tổng quan" },
        { href: "/student/join", label: "Nhập mã phòng thi", badge: "code" },
        { href: "/student/history", label: "Lịch sử bài thi" },
      ]}
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Kết quả</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              {hasSubmission ? (
                <>
                  Bài thi <span className="font-medium">{mockExam.title}</span>{" "}
                  {examCode ? (
                    <>
                      • Mã phòng: <span className="font-medium">{examCode}</span>
                    </>
                  ) : null}
                </>
              ) : (
                "Chưa có dữ liệu nộp bài. Hãy vào trang thi để làm và nộp bài trước."
              )}
            </p>
          </div>
          <ButtonLink href="/student" variant="secondary">
            Về dashboard
          </ButtonLink>
        </div>

        {!hasSubmission ? (
          <Card title="Chưa có kết quả">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Không tìm thấy dữ liệu câu trả lời từ trang thi.
              </p>
              <ButtonLink href="/student/join">Vào làm bài</ButtonLink>
            </div>
          </Card>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card title="Điểm" description="Thang điểm 10">
            <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">{result.score.toFixed(1)}</div>
          </Card>
          <Card title="Đúng" description="Số câu trả lời đúng">
            <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {result.correctCount}/{result.totalQuestions}
            </div>
          </Card>
          <Card title="Đã trả lời" description="Số câu đã chọn đáp án">
            <div className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100">
              {result.answeredCount}/{result.totalQuestions}
            </div>
          </Card>
        </div>

        <Card title="Xem lại câu trả lời" description="Đối chiếu với đáp án chuẩn của mock exam">
          <div className="grid gap-3">
            {mockExam.questions.map((question, index) => {
              const selected = answers[index];
              const isCorrect = selected === question.answer;
              const optionEntries = Object.entries(question.options) as Array<[OptionId, string]>;

              return (
                <div
                  key={question.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        Câu {index + 1}: {question.content}
                      </div>
                      <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                        Bạn chọn: <span className="font-medium">{selected ?? "Chưa trả lời"}</span> • Đáp án đúng:{" "}
                        <span className="font-medium">{question.answer}</span>
                      </div>
                    </div>
                    <Badge variant={selected ? (isCorrect ? "success" : "danger") : "warning"}>
                      {selected ? (isCorrect ? "Đúng" : "Sai") : "Bỏ trống"}
                    </Badge>
                  </div>

                  <div className="grid gap-2">
                    {optionEntries.map(([option, content]) => {
                      const isAnswer = option === question.answer;
                      const isSelected = option === selected;

                      return (
                        <div
                          key={option}
                          className={[
                            "rounded-xl border px-3 py-2 text-sm",
                            isAnswer
                              ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200"
                              : isSelected
                                ? "border-red-300 bg-red-50 text-red-800 dark:border-red-900/70 dark:bg-red-950/40 dark:text-red-200"
                                : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <span className="font-medium">{option}.</span> {content}
                          {isAnswer ? " • Đáp án đúng" : ""}
                          {!isAnswer && isSelected ? " • Bạn đã chọn" : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

