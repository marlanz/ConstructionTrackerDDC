"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Factory, LogOut } from "lucide-react";
import { authClient } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import { USER_ROLE_VN_LABELS, type UserRoleType } from "@/app/constants/role";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/projects"
          className="flex items-center gap-2 font-semibold text-lg tracking-tight"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white dark:bg-zinc-50 dark:text-zinc-900">
            <Factory className="h-5 w-5" />
          </div>
          <span className="text-brand">Quản lý lắp đặt công trình DDC</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {user.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {user.email}
                </span>
              </div>
              <Badge
                variant={user.role === "MANAGER" ? "default" : "secondary"}
                className="font-mono text-[10px] tracking-wider uppercase"
              >
                {USER_ROLE_VN_LABELS[user.role as UserRoleType] || user.role}
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
                <span className="sr-only">Đăng xuất</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">Đăng nhập</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
