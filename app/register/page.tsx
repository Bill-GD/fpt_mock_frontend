import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-12 dark:bg-black">
      <div className="container-app max-w-md">
        <div className="mb-6 text-center">
          <Badge className="mb-3" variant="success">
            Teacher / Student
          </Badge>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Tạo tài khoản</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Sau khi đăng ký, bạn sẽ nhận email xác thực.
          </p>
        </div>

        <Card>
          <form className="grid gap-4">
            <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" required />
            <Input label="Mật khẩu" type="password" placeholder="••••••••" autoComplete="new-password" required />
            <Input
              label="Nhập lại mật khẩu"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
            />

            <div className="grid gap-2">
              <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Role</div>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900">
                  <input type="radio" name="role" defaultChecked />
                  Student
                </label>
                <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-3 text-sm text-zinc-700 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900">
                  <input type="radio" name="role" />
                  Teacher
                </label>
              </div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400">
                Bạn có thể demo UI nhanh: Teacher ở <span className="font-medium">/teacher</span>, Student ở{" "}
                <span className="font-medium">/student</span>.
              </div>
            </div>

            <div className="grid gap-3">
              <Button type="button">Đăng ký</Button>
              <ButtonLink href="/" variant="ghost">
                Quay lại trang chủ
              </ButtonLink>
            </div>

            <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Đã có tài khoản?{" "}
              <ButtonLink href="/login" variant="ghost" className="inline-flex h-auto px-1 py-0">
                Đăng nhập
              </ButtonLink>
            </div>
          </form>
        </Card>

        <div className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Placeholder UI: sẽ nối API `/auth/register` + `/auth/verify/:token` khi backend sẵn sàng.
        </div>
      </div>
    </div>
  );
}

