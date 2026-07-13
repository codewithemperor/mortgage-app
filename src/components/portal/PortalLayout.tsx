"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalHeader from "@/components/portal/PortalHeader";

interface PortalLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function PortalLayout({ children, title }: PortalLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [borrower, setBorrower] = useState<{ firstName: string; lastName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch("/api/borrower/auth");
        const json = await res.json();
        if (json.success && json.data) {
          setBorrower({
            firstName: json.data.firstName,
            lastName: json.data.lastName,
          });
        } else {
          router.push("/borrower/login");
          return;
        }
      } catch {
        router.push("/portal/login");
        return;
      } finally {
        setLoading(false);
      }
    }
    fetchSession();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PortalSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        firstName={borrower?.firstName || "Borrower"}
        lastName={borrower?.lastName || ""}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <PortalHeader title={title} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
