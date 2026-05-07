"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ANSWER_OPTIONS,
  createTeacherExamId,
  createTeacherQuestion,
  generateTeacherExamCode,
  isAnswerOption,
  type AnswerOption,
  type TeacherExamQuestion,
  upsertTeacherExam,
} from "@/lib/teacher-exam-store";

type EditorTab = "excel" | "manual" | "ai";

type CsvImportResult = {
  questions: TeacherExamQuestion[];
  errors: string[];
};

function parseCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (inQuotes) {
      if (char === '"') {
        const next = raw[i + 1];
        if (next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }
    if (char === "\n") {
      row.push(current.trim());
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    if (char === "\r") continue;
    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.length > 0));
}

function parseCsvImport(raw: string): CsvImportResult {
  const rows = parseCsvRows(raw);
  if (rows.length === 0) {
    return { questions: [], errors: ["File CSV trống."] };
  }

  const expectedHeader = ["content", "a", "b", "c", "d", "answer"];
  const header = rows[0].map((value) => value.trim().toLowerCase());
  const headerValid =
    header.length === expectedHeader.length &&
    expectedHeader.every((expected, index) => header[index] === expected);

  if (!headerValid) {
    return {
      questions: [],
      errors: ["Header không hợp lệ. Cần đúng thứ tự: content,A,B,C,D,answer."],
    };
  }

  const questions: TeacherExamQuestion[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const displayRow = i + 1;

    if (row.length !== 6) {
      errors.push(`Dòng ${displayRow}: cần đúng 6 cột, nhận ${row.length} cột.`);
      continue;
    }

    const [content, optionA, optionB, optionC, optionD, answerRaw] = row;
    const normalizedAnswer = answerRaw.toUpperCase();

    if (!content || !optionA || !optionB || !optionC || !optionD) {
      errors.push(`Dòng ${displayRow}: content và các đáp án A-D không được để trống.`);
      continue;
    }
    if (!isAnswerOption(normalizedAnswer)) {
      errors.push(`Dòng ${displayRow}: answer phải là một trong A/B/C/D.`);
      continue;
    }

    questions.push(
      createTeacherQuestion({
        content,
        options: { A: optionA, B: optionB, C: optionC, D: optionD },
        answer: normalizedAnswer,
      }),
    );
  }

  return { questions, errors };
}

function buildMockAiQuestions(topic: string, count: number, difficulty: string): TeacherExamQuestion[] {
  const safeTopic = topic.trim() || "Kiến thức tổng hợp";
  const safeDifficulty = difficulty.trim() || "medium";
  return Array.from({ length: count }).map((_, index) => {
    const number = index + 1;
    const answer = ANSWER_OPTIONS[index % ANSWER_OPTIONS.length];
    const stem = `Câu ${number} (${safeDifficulty}) về chủ đề "${safeTopic}"`;
    return createTeacherQuestion({
      content: `${stem}: chọn phát biểu đúng nhất.`,
      options: {
        A: `${safeTopic} - phương án A #${number}`,
        B: `${safeTopic} - phương án B #${number}`,
        C: `${safeTopic} - phương án C #${number}`,
        D: `${safeTopic} - phương án D #${number}`,
      },
      answer,
    });
  });
}

export default function TeacherCreateExamPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditorTab>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [questions, setQuestions] = useState<TeacherExamQuestion[]>([createTeacherQuestion()]);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelPreview, setExcelPreview] = useState<TeacherExamQuestion[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [saveError, setSaveError] = useState<string>();
  const [saveInfo, setSaveInfo] = useState<string>();

  const answeredCount = useMemo(
    () => questions.filter((question) => question.content.trim().length > 0).length,
    [questions],
  );

  const updateQuestion = (
    questionId: string,
    updater: (question: TeacherExamQuestion) => TeacherExamQuestion,
  ) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === questionId ? updater(question) : question)),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createTeacherQuestion()]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setQuestions((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const onCsvSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelErrors([]);
    setExcelPreview([]);

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseCsvImport(text);
      setExcelPreview(result.questions);
      setExcelErrors(result.errors);
    };
    reader.onerror = () => {
      setExcelErrors(["Không thể đọc file CSV, vui lòng thử lại."]);
    };
    reader.readAsText(file);
  };

  const importCsvToEditor = () => {
    if (excelPreview.length === 0) return;
    setQuestions((prev) => [
      ...prev,
      ...excelPreview.map((question) =>
        createTeacherQuestion({
          content: question.content,
          options: question.options,
          answer: question.answer,
        }),
      ),
    ]);
    setSaveInfo(`Đã import ${excelPreview.length} câu từ CSV vào manual editor.`);
    setSaveError(undefined);
    setActiveTab("manual");
  };

  const generateAiQuestions = () => {
    const parsedCount = Number.parseInt(aiCount, 10);
    if (Number.isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      setSaveError("Số câu AI phải từ 1 đến 50.");
      return;
    }
    setSaveError(undefined);
    setQuestions(buildMockAiQuestions(aiTopic, parsedCount, aiDifficulty));
    setSaveInfo(`Đã mock-generate ${parsedCount} câu hỏi. Có thể chỉnh sửa trực tiếp trước khi lưu.`);
    setActiveTab("ai");
  };

  const saveExam = () => {
    setSaveError(undefined);
    setSaveInfo(undefined);

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const parsedDuration = Number.parseInt(durationMinutes, 10);

    if (!normalizedTitle) {
      setSaveError("Vui lòng nhập tiêu đề đề thi.");
      return;
    }
    if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
      setSaveError("Duration phải là số nguyên >= 0.");
      return;
    }
    if (startTime && endTime && startTime > endTime) {
      setSaveError("End time phải sau Start time.");
      return;
    }
    if (questions.length === 0) {
      setSaveError("Đề thi cần ít nhất 1 câu hỏi.");
      return;
    }

    const normalizedQuestions = questions.map((question) => ({
      ...question,
      content: question.content.trim(),
      options: {
        A: question.options.A.trim(),
        B: question.options.B.trim(),
        C: question.options.C.trim(),
        D: question.options.D.trim(),
      },
    }));

    const invalidIndex = normalizedQuestions.findIndex(
      (question) =>
        !question.content ||
        !question.options.A ||
        !question.options.B ||
        !question.options.C ||
        !question.options.D,
    );

    if (invalidIndex >= 0) {
      setSaveError(`Câu ${invalidIndex + 1} đang thiếu content hoặc đáp án.`);
      return;
    }

    const now = new Date().toISOString();
    upsertTeacherExam({
      id: createTeacherExamId(),
      code: generateTeacherExamCode(),
      title: normalizedTitle,
      description: normalizedDescription || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMinutes: parsedDuration,
      questions: normalizedQuestions,
      createdAt: now,
      updatedAt: now,
    });
    router.push("/teacher/exams");
  };

  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Tạo đề mới"
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
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tạo đề thi</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Editor demo gồm 3 tab Excel Import, Manual, AI Generate và preview trước khi lưu.
            </p>
          </div>
          <ButtonLink href="/teacher/exams" variant="secondary">
            Về danh sách
          </ButtonLink>
        </div>

        <Card title="Thông tin đề thi" description="Tiêu đề, mô tả, thời gian mở/đóng và duration">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              placeholder="VD: Toán 12 - Kiểm tra 15 phút"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Mô tả</span>
              <textarea
                rows={2}
                placeholder="(tuỳ chọn)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={[
                  "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition",
                  "border-zinc-200 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                  "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100/10",
                ].join(" ")}
              />
            </label>
            <Input
              label="Start time"
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <Input
              label="End time"
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
            <Input
              label="Duration (phút)"
              type="number"
              min={0}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              hint="0 = không giới hạn"
            />
            <div className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Mã phòng thi</span>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                <span className="font-mono">generate on save</span>
                <Badge>6-8 chars</Badge>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Giữ nhãn Excel Import, nhưng demo sử dụng CSV để parse.
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Question editor"
          description="Chọn cách tạo câu hỏi"
          right={
            <Badge variant="success">
              {questions.length} câu • {answeredCount} đã nhập
            </Badge>
          }
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeTab === "excel" ? "primary" : "secondary"}
                onClick={() => setActiveTab("excel")}
              >
                Excel Import
              </Button>
              <Button
                type="button"
                variant={activeTab === "manual" ? "primary" : "secondary"}
                onClick={() => setActiveTab("manual")}
              >
                Manual
              </Button>
              <Button
                type="button"
                variant={activeTab === "ai" ? "primary" : "secondary"}
                onClick={() => setActiveTab("ai")}
              >
                AI Generate
              </Button>
            </div>

            {activeTab === "excel" ? (
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Upload file (Excel label - CSV for demo)
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onCsvSelected}
                    className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:file:bg-zinc-900 dark:file:text-zinc-300"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Header bắt buộc: content,A,B,C,D,answer
                  </span>
                </label>

                {excelFileName ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                    File đã chọn: <span className="font-medium">{excelFileName}</span>
                  </div>
                ) : null}

                {excelErrors.length > 0 ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    <div className="font-medium">Lỗi parse CSV:</div>
                    <ul className="mt-1 grid gap-1">
                      {excelErrors.map((error) => (
                        <li key={error}>- {error}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {excelPreview.length > 0 ? (
                  <div className="grid gap-3">
                    <div className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full min-w-[860px] text-sm">
                        <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Content</th>
                            <th className="px-3 py-2">A</th>
                            <th className="px-3 py-2">B</th>
                            <th className="px-3 py-2">C</th>
                            <th className="px-3 py-2">D</th>
                            <th className="px-3 py-2">Answer</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-700 dark:text-zinc-300">
                          {excelPreview.map((question, index) => (
                            <tr key={question.id} className="border-t border-zinc-100 align-top dark:border-zinc-900">
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="px-3 py-2">{question.content}</td>
                              <td className="px-3 py-2">{question.options.A}</td>
                              <td className="px-3 py-2">{question.options.B}</td>
                              <td className="px-3 py-2">{question.options.C}</td>
                              <td className="px-3 py-2">{question.options.D}</td>
                              <td className="px-3 py-2 font-semibold">{question.answer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button type="button" onClick={importCsvToEditor} className="sm:w-fit">
                      Import {excelPreview.length} câu vào editor
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "ai" ? (
              <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <Input
                  label="Chủ đề"
                  placeholder="VD: Lịch sử Việt Nam 1945-1975"
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Số câu"
                    type="number"
                    min={1}
                    max={50}
                    value={aiCount}
                    onChange={(event) => setAiCount(event.target.value)}
                  />
                  <Input
                    label="Độ khó"
                    placeholder="easy / medium / hard"
                    value={aiDifficulty}
                    onChange={(event) => setAiDifficulty(event.target.value)}
                  />
                </div>
                <Button type="button" onClick={generateAiQuestions} className="sm:w-fit">
                  Mock-generate và nạp vào editor
                </Button>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Không gọi API. Danh sách câu bên dưới là preview có thể chỉnh sửa trước khi lưu.
                </div>
              </div>
            ) : null}

            {activeTab === "manual" || activeTab === "ai" ? (
              <div className="grid gap-3">
                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    Chưa có câu hỏi. Hãy thêm mới bằng Manual hoặc import/generate từ tab khác.
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div key={question.id} className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Câu hỏi #{index + 1}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveQuestion(index, index - 1)}
                            disabled={index === 0}
                          >
                            Lên
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveQuestion(index, index + 1)}
                            disabled={index === questions.length - 1}
                          >
                            Xuống
                          </Button>
                          <Button type="button" size="sm" variant="danger" onClick={() => removeQuestion(question.id)}>
                            Xoá
                          </Button>
                        </div>
                      </div>

                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Nội dung câu hỏi</span>
                        <textarea
                          rows={3}
                          value={question.content}
                          onChange={(event) =>
                            updateQuestion(question.id, (previous) => ({ ...previous, content: event.target.value }))
                          }
                          className={[
                            "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition",
                            "border-zinc-200 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                            "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100/10",
                          ].join(" ")}
                          placeholder="Nhập nội dung câu hỏi"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {ANSWER_OPTIONS.map((option) => (
                          <Input
                            key={`${question.id}-${option}`}
                            label={`Đáp án ${option}`}
                            value={question.options[option]}
                            onChange={(event) =>
                              updateQuestion(question.id, (previous) => ({
                                ...previous,
                                options: { ...previous.options, [option]: event.target.value },
                              }))
                            }
                          />
                        ))}
                      </div>

                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Đáp án đúng</span>
                        <select
                          value={question.answer}
                          onChange={(event) => {
                            const selected = event.target.value.toUpperCase();
                            if (!isAnswerOption(selected)) return;
                            updateQuestion(question.id, (previous) => ({
                              ...previous,
                              answer: selected as AnswerOption,
                            }));
                          }}
                          className={[
                            "h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition",
                            "border-zinc-200 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                            "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:focus:ring-zinc-100/10",
                          ].join(" ")}
                        >
                          {ANSWER_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))
                )}

                <Button type="button" variant="secondary" onClick={addQuestion} className="sm:w-fit">
                  + Thêm câu hỏi
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        {saveError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {saveError}
          </div>
        ) : null}
        {saveInfo ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            {saveInfo}
          </div>
        ) : null}

        <Card title="Hành động" description="Lưu đề vào localStorage để hiển thị tại danh sách đề thi">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={saveExam} className="justify-center">
              Lưu đề
            </Button>
            <ButtonLink href="/teacher/exams" variant="ghost" className="justify-center">
              Huỷ
            </ButtonLink>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
/*
"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ANSWER_OPTIONS,
  createTeacherExamId,
  createTeacherQuestion,
  generateTeacherExamCode,
  isAnswerOption,
  type AnswerOption,
  type TeacherExamQuestion,
  upsertTeacherExam,
} from "@/lib/teacher-exam-store";

type EditorTab = "excel" | "manual" | "ai";

type CsvImportResult = {
  questions: TeacherExamQuestion[];
  errors: string[];
};

function parseCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (inQuotes) {
      if (char === '"') {
        const next = raw[i + 1];
        if (next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }
    if (char === "\n") {
      row.push(current.trim());
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    if (char === "\r") continue;

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.length > 0));
}
function parseCsvImport(raw: string): CsvImportResult {
  const rows = parseCsvRows(raw);
  if (rows.length === 0) {
    return { questions: [], errors: ["File CSV trống."] };
  }

  const expectedHeader = ["content", "a", "b", "c", "d", "answer"];
  const header = rows[0].map((value) => value.trim().toLowerCase());
  const headerValid =
    header.length === expectedHeader.length &&
    expectedHeader.every((expected, index) => header[index] === expected);

  if (!headerValid) {
    return {
      questions: [],
      errors: ["Header không hợp lệ. Cần đúng thứ tự: content,A,B,C,D,answer."],
    };
  }

  const questions: TeacherExamQuestion[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const displayRow = i + 1;

    if (row.length !== 6) {
      errors.push(`Dòng ${displayRow}: cần đúng 6 cột, nhận ${row.length} cột.`);
      continue;
    }

    const [content, optionA, optionB, optionC, optionD, answerRaw] = row;
    const normalizedAnswer = answerRaw.toUpperCase();

    if (!content || !optionA || !optionB || !optionC || !optionD) {
      errors.push(`Dòng ${displayRow}: content và các đáp án A-D không được để trống.`);
      continue;
    }
    if (!isAnswerOption(normalizedAnswer)) {
      errors.push(`Dòng ${displayRow}: answer phải là một trong A/B/C/D.`);
      continue;
    }

    questions.push(
      createTeacherQuestion({
        content,
        options: {
          A: optionA,
          B: optionB,
          C: optionC,
          D: optionD,
        },
        answer: normalizedAnswer,
      }),
    );
  }

  return { questions, errors };
}

function buildMockAiQuestions(topic: string, count: number, difficulty: string): TeacherExamQuestion[] {
  const safeTopic = topic.trim() || "Kiến thức tổng hợp";
  const safeDifficulty = difficulty.trim() || "medium";

  return Array.from({ length: count }).map((_, index) => {
    const number = index + 1;
    const answer = ANSWER_OPTIONS[index % ANSWER_OPTIONS.length];
    const stem = `Câu ${number} (${safeDifficulty}) về chủ đề "${safeTopic}"`;

    return createTeacherQuestion({
      content: `${stem}: chọn phát biểu đúng nhất.`,
      options: {
        A: `${safeTopic} - phương án A #${number}`,
        B: `${safeTopic} - phương án B #${number}`,
        C: `${safeTopic} - phương án C #${number}`,
        D: `${safeTopic} - phương án D #${number}`,
      },
      answer,
    });
  });
}

export default function TeacherCreateExamPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditorTab>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [questions, setQuestions] = useState<TeacherExamQuestion[]>([createTeacherQuestion()]);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelPreview, setExcelPreview] = useState<TeacherExamQuestion[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [saveInfo, setSaveInfo] = useState<string | undefined>(undefined);

  const answeredCount = useMemo(
    () => questions.filter((question) => question.content.trim().length > 0).length,
    [questions],
  );

  const updateQuestion = (
    questionId: string,
    updater: (question: TeacherExamQuestion) => TeacherExamQuestion,
  ) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === questionId ? updater(question) : question)),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createTeacherQuestion()]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setQuestions((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const onCsvSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelErrors([]);
    setExcelPreview([]);

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseCsvImport(text);
      setExcelPreview(result.questions);
      setExcelErrors(result.errors);
    };
    reader.onerror = () => {
      setExcelErrors(["Không thể đọc file CSV, vui lòng thử lại."]);
    };
    reader.readAsText(file);
  };

  const importCsvToEditor = () => {
    if (excelPreview.length === 0) return;

    setQuestions((prev) => [
      ...prev,
      ...excelPreview.map((question) =>
        createTeacherQuestion({
          content: question.content,
          options: question.options,
          answer: question.answer,
        }),
      ),
    ]);
    setSaveInfo(`Đã import ${excelPreview.length} câu từ CSV vào manual editor.`);
    setSaveError(undefined);
    setActiveTab("manual");
  };

  const generateAiQuestions = () => {
    const parsedCount = Number.parseInt(aiCount, 10);
    if (Number.isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      setSaveError("Số câu AI phải từ 1 đến 50.");
      return;
    }

    setSaveError(undefined);
    setQuestions(buildMockAiQuestions(aiTopic, parsedCount, aiDifficulty));
    setSaveInfo(`Đã mock-generate ${parsedCount} câu hỏi. Có thể chỉnh sửa trực tiếp trước khi lưu.`);
    setActiveTab("ai");
  };

  const saveExam = () => {
    setSaveError(undefined);
    setSaveInfo(undefined);

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const parsedDuration = Number.parseInt(durationMinutes, 10);

    if (!normalizedTitle) {
      setSaveError("Vui lòng nhập tiêu đề đề thi.");
      return;
    }
    if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
      setSaveError("Duration phải là số nguyên >= 0.");
      return;
    }
    if (startTime && endTime && startTime > endTime) {
      setSaveError("End time phải sau Start time.");
      return;
    }
    if (questions.length === 0) {
      setSaveError("Đề thi cần ít nhất 1 câu hỏi.");
      return;
    }

    const normalizedQuestions = questions.map((question) => ({
      ...question,
      content: question.content.trim(),
      options: {
        A: question.options.A.trim(),
        B: question.options.B.trim(),
        C: question.options.C.trim(),
        D: question.options.D.trim(),
      },
    }));

    const invalidIndex = normalizedQuestions.findIndex(
      (question) =>
        !question.content ||
        !question.options.A ||
        !question.options.B ||
        !question.options.C ||
        !question.options.D,
    );

    if (invalidIndex >= 0) {
      setSaveError(`Câu ${invalidIndex + 1} đang thiếu content hoặc đáp án.`);
      return;
    }

    const now = new Date().toISOString();
    upsertTeacherExam({
      id: createTeacherExamId(),
      code: generateTeacherExamCode(),
      title: normalizedTitle,
      description: normalizedDescription || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMinutes: parsedDuration,
      questions: normalizedQuestions,
      createdAt: now,
      updatedAt: now,
    });
    router.push("/teacher/exams");
  };

  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Tạo đề mới"
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
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tạo đề thi</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Editor demo gồm 3 tab Excel Import, Manual, AI Generate và preview trước khi lưu.
            </p>
          </div>
          <ButtonLink href="/teacher/exams" variant="secondary">
            Về danh sách
          </ButtonLink>
        </div>

        <Card title="Thông tin đề thi" description="Tiêu đề, mô tả, thời gian mở/đóng và duration">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              placeholder="VD: Toán 12 - Kiểm tra 15 phút"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Mô tả</span>
              <textarea
                rows={2}
                placeholder="(tuỳ chọn)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={[
                  "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition",
                  "border-zinc-200 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                  "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100/10",
                ].join(" ")}
              />
            </label>
            <Input
              label="Start time"
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <Input
              label="End time"
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
            <Input
              label="Duration (phút)"
              type="number"
              min={0}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              hint="0 = không giới hạn"
            />
            <div className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Mã phòng thi</span>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                <span className="font-mono">generate on save</span>
                <Badge>6-8 chars</Badge>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Giữ nhãn Excel Import, nhưng demo sử dụng CSV để parse.
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Question editor"
          description="Chọn cách tạo câu hỏi"
          right={
            <Badge variant="success">
              {questions.length} câu • {answeredCount} đã nhập
            </Badge>
          }
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeTab === "excel" ? "primary" : "secondary"}
                onClick={() => setActiveTab("excel")}
              >
                Excel Import
              </Button>
              <Button
                type="button"
                variant={activeTab === "manual" ? "primary" : "secondary"}
                onClick={() => setActiveTab("manual")}
              >
                Manual
              </Button>
              <Button
                type="button"
                variant={activeTab === "ai" ? "primary" : "secondary"}
                onClick={() => setActiveTab("ai")}
              >
                AI Generate
              </Button>
            </div>

            {activeTab === "excel" ? (
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Upload file (Excel label - CSV for demo)
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onCsvSelected}
                    className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:file:bg-zinc-900 dark:file:text-zinc-300"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Header bắt buộc: content,A,B,C,D,answer
                  </span>
                </label>

                {excelFileName ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                    File đã chọn: <span className="font-medium">{excelFileName}</span>
                  </div>
                ) : null}

                {excelErrors.length > 0 ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    <div className="font-medium">Lỗi parse CSV:</div>
                    <ul className="mt-1 grid gap-1">
                      {excelErrors.map((error) => (
                        <li key={error}>- {error}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {excelPreview.length > 0 ? (
                  <div className="grid gap-3">
                    <div className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full min-w-[860px] text-sm">
                        <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Content</th>
                            <th className="px-3 py-2">A</th>
                            <th className="px-3 py-2">B</th>
                            <th className="px-3 py-2">C</th>
                            <th className="px-3 py-2">D</th>
                            <th className="px-3 py-2">Answer</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-700 dark:text-zinc-300">
                          {excelPreview.map((question, index) => (
                            <tr
                              key={question.id}
                              className="border-t border-zinc-100 align-top dark:border-zinc-900"
                            >
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="px-3 py-2">{question.content}</td>
                              <td className="px-3 py-2">{question.options.A}</td>
                              <td className="px-3 py-2">{question.options.B}</td>
                              <td className="px-3 py-2">{question.options.C}</td>
                              <td className="px-3 py-2">{question.options.D}</td>
                              <td className="px-3 py-2 font-semibold">{question.answer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button type="button" onClick={importCsvToEditor} className="sm:w-fit">
                      Import {excelPreview.length} câu vào editor
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "ai" ? (
              <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <Input
                  label="Chủ đề"
                  placeholder="VD: Lịch sử Việt Nam 1945-1975"
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Số câu"
                    type="number"
                    min={1}
                    max={50}
                    value={aiCount}
                    onChange={(event) => setAiCount(event.target.value)}
                  />
                  <Input
                    label="Độ khó"
                    placeholder="easy / medium / hard"
                    value={aiDifficulty}
                    onChange={(event) => setAiDifficulty(event.target.value)}
                  />
                </div>
                <Button type="button" onClick={generateAiQuestions} className="sm:w-fit">
                  Mock-generate và nạp vào editor
                </Button>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Không gọi API. Danh sách câu bên dưới là preview có thể chỉnh sửa trước khi lưu.
                </div>
              </div>
            ) : null}

            {activeTab === "manual" || activeTab === "ai" ? (
              <div className="grid gap-3">
                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    Chưa có câu hỏi. Hãy thêm mới bằng Manual hoặc import/generate từ tab khác.
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Câu hỏi #{index + 1}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveQuestion(index, index - 1)}
                            disabled={index === 0}
                          >
                            Lên
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveQuestion(index, index + 1)}
                            disabled={index === questions.length - 1}
                          >
                            Xuống
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => removeQuestion(question.id)}
                          >
                            Xoá
                          </Button>
                        </div>
                      </div>

                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Nội dung câu hỏi</span>
                        <textarea
                          rows={3}
                          value={question.content}
                          onChange={(event) =>
                            updateQuestion(question.id, (previous) => ({
                              ...previous,
                              content: event.target.value,
                            }))
                          }
                          className={[
                            "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition",
                            "border-zinc-200 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                            "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100/10",
                          ].join(" ")}
                          placeholder="Nhập nội dung câu hỏi"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {ANSWER_OPTIONS.map((option) => (
                          <Input
                            key={`${question.id}-${option}`}
                            label={`Đáp án ${option}`}
                            value={question.options[option]}
                            onChange={(event) =>
                              updateQuestion(question.id, (previous) => ({
                                ...previous,
                                options: {
                                  ...previous.options,
                                  [option]: event.target.value,
                                },
                              }))
                            }
                          />
                        ))}
                      </div>

                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Đáp án đúng</span>
                        <select
                          value={question.answer}
                          onChange={(event) => {
                            const selected = event.target.value.toUpperCase();
                            if (!isAnswerOption(selected)) return;
                            updateQuestion(question.id, (previous) => ({
                              ...previous,
                              answer: selected as AnswerOption,
                            }));
                          }}
                          className={[
                            "h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition",
                            "border-zinc-200 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                            "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:focus:ring-zinc-100/10",
                          ].join(" ")}
                        >
                          {ANSWER_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))
                )}

                <Button type="button" variant="secondary" onClick={addQuestion} className="sm:w-fit">
                  + Thêm câu hỏi
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        {saveError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {saveError}
          </div>
        ) : null}
        {saveInfo ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            {saveInfo}
          </div>
        ) : null}

        <Card title="Hành động" description="Lưu đề vào localStorage để hiển thị tại danh sách đề thi">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={saveExam} className="justify-center">
              Lưu đề
            </Button>
            <ButtonLink href="/teacher/exams" variant="ghost" className="justify-center">
              Huỷ
            </ButtonLink>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ANSWER_OPTIONS,
  createTeacherExamId,
  createTeacherQuestion,
  generateTeacherExamCode,
  isAnswerOption,
  type AnswerOption,
  type TeacherExamQuestion,
  upsertTeacherExam,
} from "@/lib/teacher-exam-store";

type EditorTab = "excel" | "manual" | "ai";

type CsvImportResult = {
  questions: TeacherExamQuestion[];
  errors: string[];
};

function parseCsvRows(raw: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < raw.length; i += 1) {
    const char = raw[i];

    if (inQuotes) {
      if (char === '"') {
        const next = raw[i + 1];
        if (next === '"') {
          current += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }
    if (char === "\n") {
      row.push(current.trim());
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    if (char === "\r") {
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current.trim());
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.length > 0));
}

function parseCsvImport(raw: string): CsvImportResult {
  const rows = parseCsvRows(raw);
  if (rows.length === 0) {
    return { questions: [], errors: ["File CSV trống."] };
  }

  const expectedHeader = ["content", "a", "b", "c", "d", "answer"];
  const header = rows[0].map((value) => value.trim().toLowerCase());
  const headerValid =
    header.length === expectedHeader.length &&
    expectedHeader.every((expected, index) => header[index] === expected);

  if (!headerValid) {
    return {
      questions: [],
      errors: ["Header không hợp lệ. Cần đúng thứ tự: content,A,B,C,D,answer."],
    };
  }

  const questions: TeacherExamQuestion[] = [];
  const errors: string[] = [];

  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i];
    const displayRow = i + 1;

    if (row.length !== 6) {
      errors.push(`Dòng ${displayRow}: cần đúng 6 cột, nhận ${row.length} cột.`);
      continue;
    }

    const [content, optionA, optionB, optionC, optionD, answerRaw] = row;
    const normalizedAnswer = answerRaw.toUpperCase();

    if (!content || !optionA || !optionB || !optionC || !optionD) {
      errors.push(`Dòng ${displayRow}: content và các đáp án A-D không được để trống.`);
      continue;
    }
    if (!isAnswerOption(normalizedAnswer)) {
      errors.push(`Dòng ${displayRow}: answer phải là một trong A/B/C/D.`);
      continue;
    }

    questions.push(
      createTeacherQuestion({
        content,
        options: {
          A: optionA,
          B: optionB,
          C: optionC,
          D: optionD,
        },
        answer: normalizedAnswer,
      }),
    );
  }

  return { questions, errors };
}

function buildMockAiQuestions(topic: string, count: number, difficulty: string): TeacherExamQuestion[] {
  const safeTopic = topic.trim() || "Kiến thức tổng hợp";
  const safeDifficulty = difficulty.trim() || "medium";

  return Array.from({ length: count }).map((_, index) => {
    const number = index + 1;
    const answer = ANSWER_OPTIONS[index % ANSWER_OPTIONS.length];
    const stem = `Câu ${number} (${safeDifficulty}) về chủ đề "${safeTopic}"`;

    return createTeacherQuestion({
      content: `${stem}: chọn phát biểu đúng nhất.`,
      options: {
        A: `${safeTopic} - phương án A #${number}`,
        B: `${safeTopic} - phương án B #${number}`,
        C: `${safeTopic} - phương án C #${number}`,
        D: `${safeTopic} - phương án D #${number}`,
      },
      answer,
    });
  });
}

export default function TeacherCreateExamPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<EditorTab>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("15");
  const [questions, setQuestions] = useState<TeacherExamQuestion[]>([createTeacherQuestion()]);
  const [excelFileName, setExcelFileName] = useState("");
  const [excelPreview, setExcelPreview] = useState<TeacherExamQuestion[]>([]);
  const [excelErrors, setExcelErrors] = useState<string[]>([]);
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState("5");
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [saveInfo, setSaveInfo] = useState<string | undefined>(undefined);

  const answeredCount = useMemo(() => {
    return questions.filter((question) => question.content.trim().length > 0).length;
  }, [questions]);

  const updateQuestion = (
    questionId: string,
    updater: (question: TeacherExamQuestion) => TeacherExamQuestion,
  ) => {
    setQuestions((prev) =>
      prev.map((question) => (question.id === questionId ? updater(question) : question)),
    );
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, createTeacherQuestion()]);
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((prev) => prev.filter((question) => question.id !== questionId));
  };

  const moveQuestion = (fromIndex: number, toIndex: number) => {
    setQuestions((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  };

  const onCsvSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setExcelFileName(file.name);
    setExcelErrors([]);
    setExcelPreview([]);

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const result = parseCsvImport(text);
      setExcelPreview(result.questions);
      setExcelErrors(result.errors);
    };
    reader.onerror = () => {
      setExcelErrors(["Không thể đọc file CSV, vui lòng thử lại."]);
    };
    reader.readAsText(file);
  };

  const importCsvToEditor = () => {
    if (excelPreview.length === 0) return;

    setQuestions((prev) => [
      ...prev,
      ...excelPreview.map((question) =>
        createTeacherQuestion({
          content: question.content,
          options: question.options,
          answer: question.answer,
        }),
      ),
    ]);
    setSaveInfo(`Đã import ${excelPreview.length} câu từ CSV vào manual editor.`);
    setSaveError(undefined);
    setActiveTab("manual");
  };

  const generateAiQuestions = () => {
    const parsedCount = Number.parseInt(aiCount, 10);
    if (Number.isNaN(parsedCount) || parsedCount < 1 || parsedCount > 50) {
      setSaveError("Số câu AI phải từ 1 đến 50.");
      return;
    }

    setSaveError(undefined);
    setQuestions(buildMockAiQuestions(aiTopic, parsedCount, aiDifficulty));
    setSaveInfo(`Đã mock-generate ${parsedCount} câu hỏi. Có thể chỉnh sửa trực tiếp trước khi lưu.`);
    setActiveTab("ai");
  };

  const saveExam = () => {
    setSaveError(undefined);
    setSaveInfo(undefined);

    const normalizedTitle = title.trim();
    const normalizedDescription = description.trim();
    const parsedDuration = Number.parseInt(durationMinutes, 10);

    if (!normalizedTitle) {
      setSaveError("Vui lòng nhập tiêu đề đề thi.");
      return;
    }
    if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
      setSaveError("Duration phải là số nguyên >= 0.");
      return;
    }
    if (startTime && endTime && startTime > endTime) {
      setSaveError("End time phải sau Start time.");
      return;
    }
    if (questions.length === 0) {
      setSaveError("Đề thi cần ít nhất 1 câu hỏi.");
      return;
    }

    const normalizedQuestions = questions.map((question) => ({
      ...question,
      content: question.content.trim(),
      options: {
        A: question.options.A.trim(),
        B: question.options.B.trim(),
        C: question.options.C.trim(),
        D: question.options.D.trim(),
      },
    }));

    const invalidIndex = normalizedQuestions.findIndex(
      (question) =>
        !question.content ||
        !question.options.A ||
        !question.options.B ||
        !question.options.C ||
        !question.options.D,
    );

    if (invalidIndex >= 0) {
      setSaveError(`Câu ${invalidIndex + 1} đang thiếu content hoặc đáp án.`);
      return;
    }

    const now = new Date().toISOString();
    const exam = {
      id: createTeacherExamId(),
      code: generateTeacherExamCode(),
      title: normalizedTitle,
      description: normalizedDescription || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMinutes: parsedDuration,
      questions: normalizedQuestions,
      createdAt: now,
      updatedAt: now,
    };

    upsertTeacherExam(exam);
    router.push("/teacher/exams");
  };

  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Tạo đề mới"
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
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tạo đề thi</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Editor demo gồm 3 tab Excel Import, Manual, AI Generate và preview trước khi lưu.
            </p>
          </div>
          <ButtonLink href="/teacher/exams" variant="secondary">
            Về danh sách
          </ButtonLink>
        </div>

        <Card title="Thông tin đề thi" description="Tiêu đề, mô tả, thời gian mở/đóng và duration">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              placeholder="VD: Toán 12 - Kiểm tra 15 phút"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <label className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Mô tả</span>
              <textarea
                rows={2}
                placeholder="(tuỳ chọn)"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className={[
                  "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition",
                  "border-zinc-200 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                  "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100/10",
                ].join(" ")}
              />
            </label>
            <Input
              label="Start time"
              type="datetime-local"
              value={startTime}
              onChange={(event) => setStartTime(event.target.value)}
            />
            <Input
              label="End time"
              type="datetime-local"
              value={endTime}
              onChange={(event) => setEndTime(event.target.value)}
            />
            <Input
              label="Duration (phút)"
              type="number"
              min={0}
              value={durationMinutes}
              onChange={(event) => setDurationMinutes(event.target.value)}
              hint="0 = không giới hạn"
            />
            <div className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Mã phòng thi</span>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                <span className="font-mono">generate on save</span>
                <Badge>6-8 chars</Badge>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Giữ nhãn Excel Import, nhưng demo sử dụng CSV để parse.
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Question editor"
          description="Chọn cách tạo câu hỏi"
          right={
            <Badge variant="success">
              {questions.length} câu • {answeredCount} đã nhập
            </Badge>
          }
        >
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={activeTab === "excel" ? "primary" : "secondary"}
                onClick={() => setActiveTab("excel")}
              >
                Excel Import
              </Button>
              <Button
                type="button"
                variant={activeTab === "manual" ? "primary" : "secondary"}
                onClick={() => setActiveTab("manual")}
              >
                Manual
              </Button>
              <Button
                type="button"
                variant={activeTab === "ai" ? "primary" : "secondary"}
                onClick={() => setActiveTab("ai")}
              >
                AI Generate
              </Button>
            </div>

            {activeTab === "excel" ? (
              <div className="grid gap-4">
                <label className="grid gap-1.5 text-sm">
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    Upload file (Excel label - CSV for demo)
                  </span>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={onCsvSelected}
                    className="block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-1.5 file:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:file:bg-zinc-900 dark:file:text-zinc-300"
                  />
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Header bắt buộc: content,A,B,C,D,answer
                  </span>
                </label>

                {excelFileName ? (
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-300">
                    File đã chọn: <span className="font-medium">{excelFileName}</span>
                  </div>
                ) : null}

                {excelErrors.length > 0 ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
                    <div className="font-medium">Lỗi parse CSV:</div>
                    <ul className="mt-1 grid gap-1">
                      {excelErrors.map((error) => (
                        <li key={error}>- {error}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {excelPreview.length > 0 ? (
                  <div className="grid gap-3">
                    <div className="overflow-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <table className="w-full min-w-[860px] text-sm">
                        <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900/60 dark:text-zinc-400">
                          <tr>
                            <th className="px-3 py-2">#</th>
                            <th className="px-3 py-2">Content</th>
                            <th className="px-3 py-2">A</th>
                            <th className="px-3 py-2">B</th>
                            <th className="px-3 py-2">C</th>
                            <th className="px-3 py-2">D</th>
                            <th className="px-3 py-2">Answer</th>
                          </tr>
                        </thead>
                        <tbody className="text-zinc-700 dark:text-zinc-300">
                          {excelPreview.map((question, index) => (
                            <tr
                              key={question.id}
                              className="border-t border-zinc-100 align-top dark:border-zinc-900"
                            >
                              <td className="px-3 py-2">{index + 1}</td>
                              <td className="px-3 py-2">{question.content}</td>
                              <td className="px-3 py-2">{question.options.A}</td>
                              <td className="px-3 py-2">{question.options.B}</td>
                              <td className="px-3 py-2">{question.options.C}</td>
                              <td className="px-3 py-2">{question.options.D}</td>
                              <td className="px-3 py-2 font-semibold">{question.answer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <Button type="button" onClick={importCsvToEditor} className="sm:w-fit">
                      Import {excelPreview.length} câu vào editor
                    </Button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "ai" ? (
              <div className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40">
                <Input
                  label="Chủ đề"
                  placeholder="VD: Lịch sử Việt Nam 1945-1975"
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Số câu"
                    type="number"
                    min={1}
                    max={50}
                    value={aiCount}
                    onChange={(event) => setAiCount(event.target.value)}
                  />
                  <Input
                    label="Độ khó"
                    placeholder="easy / medium / hard"
                    value={aiDifficulty}
                    onChange={(event) => setAiDifficulty(event.target.value)}
                  />
                </div>
                <Button type="button" onClick={generateAiQuestions} className="sm:w-fit">
                  Mock-generate và nạp vào editor
                </Button>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  Không gọi API. Danh sách câu bên dưới là preview có thể chỉnh sửa trước khi lưu.
                </div>
              </div>
            ) : null}

            {activeTab === "manual" || activeTab === "ai" ? (
              <div className="grid gap-3">
                {questions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    Chưa có câu hỏi. Hãy thêm mới bằng Manual hoặc import/generate từ tab khác.
                  </div>
                ) : (
                  questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          Câu hỏi #{index + 1}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveQuestion(index, index - 1)}
                            disabled={index === 0}
                          >
                            Lên
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => moveQuestion(index, index + 1)}
                            disabled={index === questions.length - 1}
                          >
                            Xuống
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="danger"
                            onClick={() => removeQuestion(question.id)}
                          >
                            Xoá
                          </Button>
                        </div>
                      </div>

                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Nội dung câu hỏi</span>
                        <textarea
                          rows={3}
                          value={question.content}
                          onChange={(event) =>
                            updateQuestion(question.id, (previous) => ({
                              ...previous,
                              content: event.target.value,
                            }))
                          }
                          className={[
                            "w-full rounded-xl border bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none transition",
                            "border-zinc-200 placeholder:text-zinc-400 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                            "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:placeholder:text-zinc-600 dark:focus:ring-zinc-100/10",
                          ].join(" ")}
                          placeholder="Nhập nội dung câu hỏi"
                        />
                      </label>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {ANSWER_OPTIONS.map((option) => (
                          <Input
                            key={`${question.id}-${option}`}
                            label={`Đáp án ${option}`}
                            value={question.options[option]}
                            onChange={(event) =>
                              updateQuestion(question.id, (previous) => ({
                                ...previous,
                                options: {
                                  ...previous.options,
                                  [option]: event.target.value,
                                },
                              }))
                            }
                          />
                        ))}
                      </div>

                      <label className="grid gap-1.5 text-sm">
                        <span className="font-medium text-zinc-900 dark:text-zinc-100">Đáp án đúng</span>
                        <select
                          value={question.answer}
                          onChange={(event) => {
                            const selected = event.target.value.toUpperCase();
                            if (!isAnswerOption(selected)) return;
                            updateQuestion(question.id, (previous) => ({
                              ...previous,
                              answer: selected as AnswerOption,
                            }));
                          }}
                          className={[
                            "h-11 w-full rounded-xl border bg-white px-3 text-sm text-zinc-900 shadow-sm outline-none transition",
                            "border-zinc-200 focus:border-zinc-300 focus:ring-2 focus:ring-zinc-900/10",
                            "dark:bg-zinc-950 dark:text-zinc-100 dark:border-zinc-800 dark:focus:ring-zinc-100/10",
                          ].join(" ")}
                        >
                          {ANSWER_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))
                )}

                <Button type="button" variant="secondary" onClick={addQuestion} className="sm:w-fit">
                  + Thêm câu hỏi
                </Button>
              </div>
            ) : null}
          </div>
        </Card>

        {saveError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {saveError}
          </div>
        ) : null}
        {saveInfo ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300">
            {saveInfo}
          </div>
        ) : null}

        <Card title="Hành động" description="Lưu đề vào localStorage để hiển thị tại danh sách đề thi">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={saveExam} className="justify-center">
              Lưu đề
            </Button>
            <ButtonLink href="/teacher/exams" variant="ghost" className="justify-center">
              Huỷ
            </ButtonLink>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import {
  generateExamCode,
  randomId,
  setExamQuestions,
  upsertExam,
  type DemoQuestion,
} from "@/lib/demo-store";

type TabKey = "manual" | "excel" | "ai";

const DEFAULT_QUESTION = (): DemoQuestion => ({
  id: randomId("q"),
  content: "",
  options: { A: "", B: "", C: "", D: "" },
  correct: "A",
});

function normalizeCorrect(raw: string): "A" | "B" | "C" | "D" | null {
  const v = raw.trim().toUpperCase();
  return v === "A" || v === "B" || v === "C" || v === "D" ? v : null;
}

type CsvParseResult =
  | { ok: false; error: string }
  | { ok: true; questions: DemoQuestion[]; rowErrors: string[] };

function parseCsv(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { ok: false, error: "File CSV phải có header và ít nhất 1 dòng dữ liệu." };
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const required = ["content", "a", "b", "c", "d", "answer"];
  const missing = required.filter((k) => !header.includes(k));
  if (missing.length) {
    return {
      ok: false,
      error: `Thiếu cột: ${missing.join(", ")}. Header chuẩn: content,A,B,C,D,answer`,
    };
  }

  const idx = (key: string) => header.indexOf(key);
  const questions: DemoQuestion[] = [];
  const rowErrors: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const content = cols[idx("content")] ?? "";
    const a = cols[idx("a")] ?? "";
    const b = cols[idx("b")] ?? "";
    const c = cols[idx("c")] ?? "";
    const d = cols[idx("d")] ?? "";
    const correctRaw = cols[idx("answer")] ?? "";
    const correct = normalizeCorrect(correctRaw);

    if (!content) rowErrors.push(`Dòng ${i + 1}: thiếu content`);
    if (!a || !b || !c || !d) rowErrors.push(`Dòng ${i + 1}: cần đủ 4 options A-D`);
    if (!correct) rowErrors.push(`Dòng ${i + 1}: answer phải là A/B/C/D`);

    if (content && a && b && c && d && correct) {
      questions.push({
        id: randomId("q"),
        content,
        options: { A: a, B: b, C: c, D: d },
        correct,
      });
    }
  }

  return { ok: true, questions, rowErrors };
}

export default function TeacherCreateExamPage() {
  const router = useRouter();
  const toast = useToast();

  const [tab, setTab] = useState<TabKey>("manual");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  const [questions, setQuestions] = useState<DemoQuestion[]>(() => [DEFAULT_QUESTION()]);

  // Excel (CSV for demo)
  const [csvPreview, setCsvPreview] = useState<DemoQuestion[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvRowErrors, setCsvRowErrors] = useState<string[]>([]);

  // AI mock
  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState<number>(10);
  const [aiDifficulty, setAiDifficulty] = useState("medium");
  const [aiPreview, setAiPreview] = useState<DemoQuestion[]>([]);

  const questionCount = questions.length;

  const canSave = useMemo(() => {
    if (!title.trim()) return false;
    if (questions.length === 0) return false;
    return questions.every(
      (q) =>
        q.content.trim() &&
        q.options.A.trim() &&
        q.options.B.trim() &&
        q.options.C.trim() &&
        q.options.D.trim(),
    );
  }, [questions, title]);

  const updateQuestion = (id: string, partial: Partial<DemoQuestion>) => {
    setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, ...partial } : q)));
  };

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setQuestions((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const onCsvPicked = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvRowErrors([]);
    setCsvPreview([]);

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setCsvError("Demo hiện hỗ trợ CSV để preview (format: content,A,B,C,D,answer).");
      return;
    }

    const text = await file.text();
    const parsed = parseCsv(text);
    if (!parsed.ok) {
      setCsvError(parsed.error);
      return;
    }
    setCsvPreview(parsed.questions);
    setCsvRowErrors(parsed.rowErrors);
  };

  const importCsvToEditor = () => {
    if (csvPreview.length === 0) return;
    setQuestions(csvPreview);
    setTab("manual");
    toast.push({ title: "Đã import câu hỏi", message: `Đã nạp ${csvPreview.length} câu vào editor.`, variant: "success" });
  };

  const generateAiPreview = () => {
    const count = Math.max(1, Math.min(50, aiCount));
    const seed = `${aiTopic.trim() || "Chủ đề"} • ${aiDifficulty}`.trim();
    const out: DemoQuestion[] = Array.from({ length: count }, (_, i) => {
      const correct = (["A", "B", "C", "D"] as const)[i % 4];
      return {
        id: randomId("q"),
        content: `[AI] (${seed}) Câu ${i + 1}: Nội dung mẫu`,
        options: {
          A: "Option A",
          B: "Option B",
          C: "Option C",
          D: "Option D",
        },
        correct,
      };
    });
    setAiPreview(out);
    toast.push({ title: "AI preview sẵn sàng", message: `Đã generate ${out.length} câu (mock).`, variant: "success" });
  };

  const applyAiToEditor = () => {
    if (aiPreview.length === 0) return;
    setQuestions(aiPreview);
    setTab("manual");
  };

  const saveExam = () => {
    if (!canSave) {
      toast.push({ title: "Chưa thể lưu", message: "Vui lòng nhập tiêu đề và hoàn thiện nội dung câu hỏi.", variant: "warning" });
      return;
    }

    const id = randomId("exam");
    const code = generateExamCode(6);
    const createdAt = new Date().toISOString();

    upsertExam({
      id,
      code,
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      durationMinutes: Number.isFinite(durationMinutes) ? Math.max(0, durationMinutes) : 0,
      questionCount: questions.length,
      createdAt,
    });

    setExamQuestions(id, questions);

    toast.push({ title: "Đã lưu đề thi", message: `CODE: ${code}`, variant: "success" });
    router.push("/teacher/exams");
  };

  return (
    <AppShell
      title="Teacher Dashboard"
      subtitle="Tạo đề mới"
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
            <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Tạo đề thi</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Excel (CSV preview), Manual editor, hoặc AI (mock) → preview → lưu vào localStorage để demo.
            </p>
          </div>
          <ButtonLink href="/teacher/exams" variant="secondary">
            Về danh sách
          </ButtonLink>
        </div>

        <Card title="Thông tin đề thi" description="Tiêu đề, mô tả, thời gian mở/đóng, duration">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Tiêu đề"
              placeholder="VD: Toán 12 - Kiểm tra 15 phút"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Input
              label="Mô tả"
              placeholder="(tuỳ chọn)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input label="Start time" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            <Input label="End time" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            <Input
              label="Duration (phút)"
              type="number"
              min={0}
              placeholder="0 = không giới hạn"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
            />
            <div className="grid gap-1.5 text-sm">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Mã phòng thi</span>
              <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                <span className="font-mono">auto-generate khi lưu</span>
                <Badge>6–8 chars</Badge>
              </div>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                Demo FE: code sinh ngẫu nhiên khi bấm Lưu.
              </span>
            </div>
          </div>
        </Card>

        <Card
          title="Tạo câu hỏi"
          description="Chọn phương thức tạo, preview và chỉnh sửa trước khi lưu"
          right={<Badge>{questionCount} câu</Badge>}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant={tab === "manual" ? "primary" : "secondary"} onClick={() => setTab("manual")}>
                Manual editor
              </Button>
              <Button type="button" variant={tab === "excel" ? "primary" : "secondary"} onClick={() => setTab("excel")}>
                Excel import (CSV demo)
              </Button>
              <Button type="button" variant={tab === "ai" ? "primary" : "secondary"} onClick={() => setTab("ai")}>
                AI generate (mock)
              </Button>
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Tip: bạn có thể import CSV → chuyển sang manual để edit.
            </div>
          </div>

          {tab === "excel" ? (
            <div className="mt-4 grid gap-3">
              <div className="grid gap-1 text-sm text-zinc-600 dark:text-zinc-400">
                <div className="font-medium text-zinc-900 dark:text-zinc-100">Upload file</div>
                <div className="text-xs">
                  Header chuẩn: <span className="font-mono">content,A,B,C,D,answer</span>
                </div>
              </div>
              <input type="file" accept=".csv" onChange={onCsvPicked} />
              {csvError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  {csvError}
                </div>
              ) : null}
              {csvRowErrors.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                  <div className="font-medium">Có lỗi một số dòng:</div>
                  <ul className="mt-1 list-disc pl-5">
                    {csvRowErrors.slice(0, 6).map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {csvPreview.length ? (
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success">Preview: {csvPreview.length} câu hợp lệ</Badge>
                    <Button type="button" onClick={importCsvToEditor}>
                      Import vào editor
                    </Button>
                  </div>
                  <div className="overflow-auto rounded-2xl border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full min-w-[720px] text-sm">
                      <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900/30 dark:text-zinc-400">
                        <tr>
                          <th className="px-3 py-2">#</th>
                          <th className="px-3 py-2">Content</th>
                          <th className="px-3 py-2">Answer</th>
                        </tr>
                      </thead>
                      <tbody className="text-zinc-700 dark:text-zinc-300">
                        {csvPreview.slice(0, 10).map((q, idx) => (
                          <tr key={q.id} className="border-t border-zinc-100 dark:border-zinc-900">
                            <td className="px-3 py-2">{idx + 1}</td>
                            <td className="px-3 py-2">{q.content}</td>
                            <td className="px-3 py-2">
                              <Badge>{q.correct}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">
                    Hiển thị tối đa 10 dòng preview.
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "ai" ? (
            <div className="mt-4 grid gap-3">
              <Input label="Chủ đề" placeholder="VD: Lịch sử Việt Nam 1945–1975" value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Số câu"
                  type="number"
                  min={1}
                  max={50}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                />
                <Input label="Độ khó" placeholder="easy / medium / hard" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" variant="secondary" onClick={generateAiPreview}>
                  Generate preview
                </Button>
                <Button type="button" onClick={applyAiToEditor} disabled={aiPreview.length === 0}>
                  Apply vào editor
                </Button>
              </div>
              {aiPreview.length ? (
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300">
                  Preview đã generate: <span className="font-medium">{aiPreview.length}</span> câu (mock). Bấm “Apply vào editor” để chỉnh sửa.
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "manual" ? (
            <div className="mt-4 grid gap-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Badge variant="success">Editor</Badge>
                <Button type="button" variant="secondary" onClick={() => setQuestions((prev) => [...prev, DEFAULT_QUESTION()])}>
                  + Thêm câu hỏi
                </Button>
              </div>

              <div className="grid gap-4">
                {questions.map((q, idx) => (
                  <Card
                    key={q.id}
                    title={`Câu ${idx + 1}`}
                    description={q.content ? q.content.slice(0, 80) : "Nhập nội dung câu hỏi"}
                    right={<Badge>Đáp án: {q.correct}</Badge>}
                  >
                    <div className="grid gap-3">
                      <Input
                        label="Nội dung"
                        value={q.content}
                        onChange={(e) => updateQuestion(q.id, { content: e.target.value })}
                        placeholder="Nhập câu hỏi..."
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        {(["A", "B", "C", "D"] as const).map((opt) => (
                          <Input
                            key={opt}
                            label={`Option ${opt}`}
                            value={q.options[opt]}
                            onChange={(e) =>
                              updateQuestion(q.id, { options: { ...q.options, [opt]: e.target.value } })
                            }
                            placeholder={`Nội dung đáp án ${opt}`}
                          />
                        ))}
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <label className="grid gap-1.5 text-sm">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">Đáp án đúng</span>
                          <select
                            className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                            value={q.correct}
                            onChange={(e) => updateQuestion(q.id, { correct: e.target.value as DemoQuestion["correct"] })}
                          >
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                            <option value="D">D</option>
                          </select>
                        </label>

                        <div className="flex flex-wrap gap-2">
                          <Button type="button" variant="secondary" onClick={() => moveQuestion(idx, -1)} disabled={idx === 0}>
                            ↑
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => moveQuestion(idx, 1)}
                            disabled={idx === questions.length - 1}
                          >
                            ↓
                          </Button>
                          <Button
                            type="button"
                            variant="danger"
                            onClick={() => removeQuestion(q.id)}
                            disabled={questions.length === 1}
                          >
                            Xoá
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <Card title="Hành động" description="Lưu đề sau khi preview và confirm">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" className="justify-center" onClick={saveExam} disabled={!canSave}>
              Lưu đề
            </Button>
            <ButtonLink href="/teacher/exams" variant="ghost" className="justify-center">
              Huỷ
            </ButtonLink>
          </div>
          {!canSave ? (
            <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              Điều kiện lưu: có tiêu đề, và mọi câu hỏi phải có content + đủ options A-D.
            </div>
          ) : null}
        </Card>
      </div>
    </AppShell>
  );
}
*/

