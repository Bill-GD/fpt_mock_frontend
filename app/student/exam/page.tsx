"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { mockExam, normalizeExamCode, serializeAnswers, type OptionId } from "../mock-exam";
import { addAttempt, addViolations, randomId, type DemoViolation, type ViolationType } from "@/lib/demo-store";
import { calculateExamResult } from "../mock-exam";

const TOTAL_QUESTIONS = mockExam.questions.length;
const TOTAL_SECONDS = mockExam.durationMinutes * 60;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export default function StudentExamRunnerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const queryCode = normalizeExamCode(searchParams.get("code") ?? "");
  const examCode = queryCode || "DEMO01";
  const hasProvidedCode = Boolean(queryCode);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(TOTAL_SECONDS);
  const [answers, setAnswers] = useState<Array<OptionId | null>>(() =>
    Array.from({ length: TOTAL_QUESTIONS }, () => null),
  );
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [violationCounts, setViolationCounts] = useState<Record<ViolationType, number>>({
    tab_switch: 0,
    keyboard_copy: 0,
    keyboard_paste: 0,
    camera_multiple_faces: 0,
    camera_gaze_away: 0,
    camera_missing: 0,
  });
  const [violationLog, setViolationLog] = useState<DemoViolation[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeftSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const pushViolation = (type: ViolationType, description: string) => {
    const createdAt = new Date().toISOString();
    const attemptId = "pending";
    const item: DemoViolation = {
      id: randomId("vio"),
      attemptId,
      studentEmail: "student.demo@example.com",
      createdAt,
      type,
      description,
    };

    setViolationCounts((prev) => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }));
    setViolationLog((prev) => [item, ...prev].slice(0, 50));

    const titleMap: Record<ViolationType, string> = {
      tab_switch: "Cảnh báo: Chuyển tab",
      keyboard_copy: "Cảnh báo: Copy",
      keyboard_paste: "Cảnh báo: Paste",
      camera_multiple_faces: "Cảnh báo: Nhiều khuôn mặt",
      camera_gaze_away: "Cảnh báo: Nhìn ra ngoài",
      camera_missing: "Cảnh báo: Thiếu camera",
    };

    setWarningMessage(description);
    toast.push({ title: titleMap[type], message: description, variant: "warning" });
    window.setTimeout(() => setWarningMessage(null), 4500);
  };

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        pushViolation("tab_switch", "Bạn vừa rời khỏi tab làm bài.");
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = mockExam.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestionIndex];
  const answeredCount = answers.filter(Boolean).length;
  const isTimeUp = timeLeftSeconds === 0;
  const timerLabel = useMemo(() => formatTime(timeLeftSeconds), [timeLeftSeconds]);

  const optionEntries = Object.entries(currentQuestion.options) as Array<[OptionId, string]>;

  const handleSelectOption = (option: OptionId) => {
    if (isTimeUp) {
      return;
    }

    setAnswers((previous) => {
      const next = [...previous];
      next[currentQuestionIndex] = option;
      return next;
    });
  };

  const handleSubmit = () => {
    const attemptId = randomId("att");
    const serializedAnswers = serializeAnswers(answers);
    const computed = calculateExamResult(mockExam, answers);

    const startedAt = new Date(Date.now() - Math.max(0, TOTAL_SECONDS - timeLeftSeconds) * 1000).toISOString();
    const submittedAt = new Date().toISOString();

    addAttempt({
      id: attemptId,
      examCode,
      examTitle: mockExam.title,
      studentEmail: "student.demo@example.com",
      startedAt,
      submittedAt,
      status: "completed",
      score: computed.score,
      totalCorrect: computed.correctCount,
      totalQuestions: computed.totalQuestions,
      violationCount: Object.values(violationCounts).reduce((a, b) => a + b, 0),
    });

    if (violationLog.length > 0) {
      addViolations(
        violationLog.map((v) => ({
          ...v,
          attemptId,
          studentEmail: "student.demo@example.com",
        })),
      );
    }

    router.push(`/student/result?code=${encodeURIComponent(examCode)}&answers=${serializedAnswers}`);
  };

  return (
    <AppShell
      title="Student Dashboard"
      subtitle="Đang làm bài"
      nav={[
        { href: "/student", label: "Tổng quan" },
        { href: "/student/join", label: "Nhập mã phòng thi", badge: "code" },
        { href: "/student/history", label: "Lịch sử bài thi" },
      ]}
    >
      <div className="grid gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{mockExam.title}</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Mã phòng thi: <span className="font-medium">{examCode}</span> • {TOTAL_QUESTIONS} câu hỏi
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isTimeUp ? "danger" : timeLeftSeconds <= 300 ? "warning" : "success"}>
              Còn lại {timerLabel}
            </Badge>
            <Badge variant="default">
              Đã trả lời {answeredCount}/{TOTAL_QUESTIONS}
            </Badge>
          </div>
        </div>

        {!hasProvidedCode ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
            Bạn vào trang thi mà chưa có mã từ trang Join. Hệ thống đang dùng mã demo <span className="font-medium">DEMO01</span>.
          </div>
        ) : null}

        {warningMessage ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
            {warningMessage}
          </div>
        ) : null}

        {isTimeUp ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            Đã hết thời gian làm bài. Bạn không thể đổi đáp án nữa, vui lòng nộp bài.
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
          <Card
            title={`Câu ${currentQuestionIndex + 1}/${TOTAL_QUESTIONS}`}
            description={currentAnswer ? `Đã chọn đáp án ${currentAnswer}` : "Chưa chọn đáp án"}
            right={<Badge variant={currentAnswer ? "success" : "warning"}>{currentAnswer ? "Đã trả lời" : "Chưa trả lời"}</Badge>}
          >
            <div className="grid gap-4">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{currentQuestion.content}</div>

              <div className="grid gap-2">
                {optionEntries.map(([option, content]) => {
                  const isSelected = currentAnswer === option;

                  return (
                    <label
                      key={option}
                      className={[
                        "flex items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm shadow-sm transition",
                        "dark:bg-zinc-950",
                        isTimeUp ? "cursor-not-allowed opacity-85" : "cursor-pointer",
                        isSelected
                          ? "border-zinc-900 dark:border-zinc-200"
                          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => handleSelectOption(option)}
                        disabled={isTimeUp}
                      />
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        {option}
                      </span>
                      <span className="text-zinc-700 dark:text-zinc-300">{content}</span>
                    </label>
                  );
                })}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  variant="secondary"
                  className="justify-center"
                  onClick={() => setCurrentQuestionIndex((previous) => Math.max(0, previous - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  Trước
                </Button>
                <Button
                  variant="secondary"
                  className="justify-center"
                  onClick={() =>
                    setCurrentQuestionIndex((previous) => Math.min(TOTAL_QUESTIONS - 1, previous + 1))
                  }
                  disabled={currentQuestionIndex === TOTAL_QUESTIONS - 1}
                >
                  Sau
                </Button>
                <Button className="justify-center sm:ml-auto" onClick={handleSubmit}>
                  Nộp bài
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Điều hướng câu hỏi" description="Chọn nhanh câu cần làm">
            <div className="grid gap-4">
              <div className="hidden grid-cols-5 gap-2 lg:grid">
                {mockExam.questions.map((question, index) => {
                  const answered = Boolean(answers[index]);
                  const active = index === currentQuestionIndex;

                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={[
                        "h-10 rounded-lg border text-sm font-medium transition",
                        active
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : answered
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/70 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950/70"
                            : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-400">
                Câu hiện tại: <span className="font-medium">{currentQuestionIndex + 1}</span> • Trạng thái:{" "}
                <span className="font-medium">{currentAnswer ? "Đã trả lời" : "Chưa trả lời"}</span>
              </div>

              <div className="grid gap-2">
                <div className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Anti-cheat panel</div>
                <div className="grid gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <div className="flex items-center justify-between">
                    <span>Tab switch</span>
                    <Badge variant={violationCounts.tab_switch ? "warning" : "default"}>{violationCounts.tab_switch}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Copy</span>
                    <Badge variant={violationCounts.keyboard_copy ? "warning" : "default"}>{violationCounts.keyboard_copy}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Paste</span>
                    <Badge variant={violationCounts.keyboard_paste ? "warning" : "default"}>{violationCounts.keyboard_paste}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Camera</span>
                    <Badge
                      variant={
                        violationCounts.camera_multiple_faces ||
                        violationCounts.camera_gaze_away ||
                        violationCounts.camera_missing
                          ? "warning"
                          : "default"
                      }
                    >
                      {violationCounts.camera_multiple_faces +
                        violationCounts.camera_gaze_away +
                        violationCounts.camera_missing}
                    </Badge>
                  </div>
                </div>
              </div>

              <Card title="Demo controls" description="Bấm để mô phỏng vi phạm">
                <div className="grid gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => pushViolation("tab_switch", "Bạn vừa rời khỏi tab làm bài.")}
                  >
                    Simulate tab switch
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => pushViolation("keyboard_copy", "Hành vi copy đã bị ghi nhận.")}
                    >
                      Simulate copy
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => pushViolation("keyboard_paste", "Hành vi paste đã bị ghi nhận.")}
                    >
                      Simulate paste
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => pushViolation("camera_multiple_faces", "Phát hiện nhiều khuôn mặt trong khung hình.")}
                  >
                    Simulate multiple faces
                  </Button>
                </div>
              </Card>

              <ButtonLink href="/student/join" variant="ghost" className="justify-center">
                Đổi mã phòng thi
              </ButtonLink>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

