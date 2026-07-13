"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";

interface PortalHeaderProps {
  title?: string;
}

export default function PortalHeader({ title }: PortalHeaderProps) {
  const router = useRouter();
  const [borrower, setBorrower] = useState<{ firstName: string; lastName: string; email: string } | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/borrower/auth");
        const json = await res.json();
        if (json.success && json.data) {
          setBorrower({
            firstName: json.data.firstName,
            lastName: json.data.lastName,
            email: json.data.email,
          });
        }
      } catch {
        // ignore
      }
    }
    fetchSession();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/borrower/auth", { method: "DELETE" });
    router.push("/borrower/login");
    router.refresh();
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">
          {title || "Borrower Portal"}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {borrower && (
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">
                {borrower.firstName} {borrower.lastName}
              </p>
              <p className="text-xs text-slate-500">{borrower.email}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {borrower.firstName.charAt(0).toUpperCase()}
              </span>
            </div>
            <Button
              variant="danger-soft"
              size="sm"
              onPress={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
