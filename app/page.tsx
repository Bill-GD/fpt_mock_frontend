import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-white dark:bg-black">
      <header className="border-b border-zinc-100 dark:border-zinc-900">
        <div className="container-app flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
              SQ
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                SmartQuiz AI
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">Online exam + Anti-cheat</div>
            </div>
          </div>
          <nav className="flex items-center gap-2">
            <ButtonLink href="/login" variant="ghost">
              Đăng nhập
            </ButtonLink>
            <ButtonLink href="/register">Đăng ký</ButtonLink>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-zinc-100 dark:border-zinc-900">
          <div className="container-app py-16 sm:py-20">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <Badge className="mb-4" variant="success">
                  AI Generate • Excel Import • Anti-cheat
                </Badge>
                <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">
                  Thi trắc nghiệm có giám sát chống gian lận, sẵn sàng demo trong 4 sprint.
                </h1>
                <p className="mt-4 text-base leading-7 text-zinc-600 dark:text-zinc-400 sm:text-lg">
                  Tạo đề bằng Excel / nhập tay / AI. Học viên vào phòng bằng mã code, làm bài có timer,
                  log vi phạm real-time (tab switch, keyboard, camera).
                </p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <ButtonLink href="/register" size="lg">
                    Bắt đầu ngay
                  </ButtonLink>
                  <ButtonLink href="/teacher" variant="secondary" size="lg">
                    Xem demo Teacher UI
                  </ButtonLink>
                </div>
                <div className="mt-5 text-xs text-zinc-500 dark:text-zinc-400">
                  Gợi ý: demo Student UI tại <span className="font-medium">/student</span>.
                </div>
              </div>

              <div className="w-full max-w-xl">
                <Card
                  title="Luồng chính"
                  description="Teacher tạo đề → Student vào thi → Chấm điểm → Thống kê vi phạm"
                >
                  <ol className="grid gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                    <li className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        1
                      </span>
                      <div>
                        <div className="font-medium">Teacher tạo đề</div>
                        <div className="text-zinc-500 dark:text-zinc-400">Excel / Manual / AI Generate</div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        2
                      </span>
                      <div>
                        <div className="font-medium">Student vào phòng</div>
                        <div className="text-zinc-500 dark:text-zinc-400">Nhập code, validate thời gian</div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        3
                      </span>
                      <div>
                        <div className="font-medium">Làm bài + Anti-cheat</div>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          Tab/keyboard/camera → cảnh báo vi phạm
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
                        4
                      </span>
                      <div>
                        <div className="font-medium">Nộp bài + Kết quả</div>
                        <div className="text-zinc-500 dark:text-zinc-400">
                          Điểm + đáp án đúng/sai + log vi phạm
                        </div>
                      </div>
                    </li>
                  </ol>
                </Card>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="container-app py-14">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tính năng nổi bật</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card title="Tạo đề nhanh" description="Excel import, nhập tay, hoặc AI generate.">
                <ul className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>- Preview trước khi lưu</li>
                  <li>- Chỉnh sửa câu hỏi trực tiếp</li>
                  <li>- Template Excel chuẩn</li>
                </ul>
              </Card>
              <Card title="Anti-cheat realtime" description="Giám sát tab/keyboard/camera.">
                <ul className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>- Tab-switch detection</li>
                  <li>- Chặn Ctrl+C/V, log phím</li>
                  <li>- Camera phát hiện bất thường</li>
                </ul>
              </Card>
              <Card title="Báo cáo kết quả" description="Điểm + thống kê vi phạm cho teacher.">
                <ul className="grid gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                  <li>- Tổng hợp theo đề thi</li>
                  <li>- Chi tiết theo từng attempt</li>
                  <li>- Export/đối soát dễ dàng</li>
                </ul>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-100 py-10 text-sm text-zinc-500 dark:border-zinc-900 dark:text-zinc-400">
        <div className="container-app flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>© {new Date().getFullYear()} SmartQuiz AI</div>
          <div className="flex gap-4">
            <span>Teacher UI: /teacher</span>
            <span>Student UI: /student</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
