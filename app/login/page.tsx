import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 py-12 dark:bg-black">
      <div className="container-app max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950">
            SQ
          </div>
          <h1 className="mt-4 text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Đăng nhập</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Chọn role sau khi đăng nhập để vào dashboard phù hợp.
          </p>
        </div>

        <Card>
          <form className="grid gap-4">
            <Input label="Email" type="email" placeholder="you@example.com" autoComplete="email" required />
            <Input label="Mật khẩu" type="password" placeholder="••••••••" autoComplete="current-password" required />

            <div className="grid gap-3">
              <Button type="button">Đăng nhập</Button>
              <ButtonLink href="/" variant="ghost">
                Quay lại trang chủ
              </ButtonLink>
            </div>

            <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
              Chưa có tài khoản?{" "}
              <ButtonLink href="/register" variant="ghost" className="inline-flex h-auto px-1 py-0">
                Đăng ký
              </ButtonLink>
            </div>
          </form>
        </Card>

        <div className="mt-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Placeholder UI: sẽ nối API `/auth/login` khi backend sẵn sàng.
        </div>
      </div>
    </div>
  );
}

