"use client";

import { useEffect, useState } from "react";
import StatsCard from "@/components/dashboard/StatsCard";
import LoanStatusChart from "@/components/dashboard/LoanStatusChart";
import RecentLoans from "@/components/dashboard/RecentLoans";
import { Card, Chip } from "@heroui/react";
import { formatCurrency } from "@/lib/utils";
import { ApiResponse, DashboardStats } from "@/types";

// SVG icons as simple inline functions
function UsersIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>;
}
function BriefcaseIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
}
function NairaIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3L17 21" /><path d="M7 21L17 3" /><path d="M3 8h18" /><path d="M3 16h18" /></svg>;
}
function TrendUpIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23,6 13.5,15.5 8.5,10.5 1,18" /><polyline points="17,6 23,6 23,12" /></svg>;
}
function ClockIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>;
}
function AlertIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const json: ApiResponse<DashboardStats> = await res.json();
        if (json.success && json.data) {
          setStats(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <Card.Content className="h-24 animate-pulse bg-slate-100" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-slate-500">Failed to load dashboard data.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard
          title="Total Borrowers"
          value={stats.totalBorrowers}
          icon={<UsersIcon />}
          color="blue"
        />
        <StatsCard
          title="Active Mortgages"
          value={stats.activeLoans}
          icon={<BriefcaseIcon />}
          color="green"
        />
        <StatsCard
          title="Total Disbursed"
          value={formatCurrency(Number(stats.totalDisbursed))}
          icon={<NairaIcon />}
          color="purple"
        />
        <StatsCard
          title="Monthly Collections"
          value={formatCurrency(Number(stats.monthlyCollections))}
          icon={<TrendUpIcon />}
          color="indigo"
        />
        <StatsCard
          title="Pending Applications"
          value={stats.pendingApplications}
          icon={<ClockIcon />}
          color="orange"
        />
        <StatsCard
          title="Overdue Payments"
          value={stats.overduePayments}
          icon={<AlertIcon />}
          color={stats.overduePayments > 0 ? "red" : "green"}
        />
      </div>

      {/* Chart and Recent Loans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoanStatusChart data={stats.loanStatusDistribution} />
        <RecentLoans loans={stats.recentLoans} />
      </div>
    </div>
  );
}
