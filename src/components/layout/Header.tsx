"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@heroui/react";

interface HeaderProps {
  title?: string;
}

export default function Header({ title }: HeaderProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          {title || "MortgagePro"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{user.name}</p>
              <p className="text-xs text-slate-500">{user.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {user.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <Button
              variant="danger-soft"
              size="sm"
              onPress={() => signOut({ callbackUrl: "/admin/login" })}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
