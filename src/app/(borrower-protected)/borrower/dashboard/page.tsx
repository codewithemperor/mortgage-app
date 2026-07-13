"use client";

import { useEffect, useState } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip } from "@heroui/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApiResponse } from "@/types";

function BriefcaseIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>;
}
function NairaIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3L17 21" /><path d="M7 21L17 3" /><path d="M3 8h18" /><path d="M3 16h18" /></svg>;
}
function FileTextIcon() {
  return <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /></svg>;
}

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  totalBorrowed: number;
  totalPaid: number;
  nextPayments: Array<{
    id: string;
    installmentNo: number;
    dueDate: Date;
    paymentAmount: number;
    principalAmount: number;
    interestAmount: number;
    loan: { id: string; loanAmount: number };
  }>;
}

export default function BorrowerDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/borrower/dashboard");
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
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

  const outstandingBalance = Number(stats.totalBorrowed) - Number(stats.totalPaid);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-sm text-slate-500">Overview of your mortgages and payments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <Card.Content className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Mortgages</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.totalLoans}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <FileTextIcon />
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Content className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Active Mortgages</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{stats.activeLoans}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <BriefcaseIcon />
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Content className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Outstanding Balance</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(outstandingBalance)}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <NairaIcon />
              </div>
            </div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Content className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total Repaid</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{formatCurrency(Number(stats.totalPaid))}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <NairaIcon />
              </div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Upcoming Payments */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header>
          <p className="font-semibold text-slate-800">Upcoming Payments</p>
        </Card.Header>
        <Card.Content className="p-0">
          {stats.nextPayments.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Upcoming payments">
                  <TableHeader>
                    <TableColumn isRowHeader>INSTALLMENT</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>PRINCIPAL</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>DUE DATE</TableColumn>
                  </TableHeader>
                  <TableBody items={stats.nextPayments}>
                    {(payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <span className="font-medium text-slate-800">#{payment.installmentNo}</span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{formatCurrency(Number(payment.paymentAmount))}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(Number(payment.principalAmount))}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(Number(payment.interestAmount))}</TableCell>
                        <TableCell>
                          <Chip size="sm" variant="soft" color="warning">
                            {formatDate(payment.dueDate)}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">No upcoming payments</div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
