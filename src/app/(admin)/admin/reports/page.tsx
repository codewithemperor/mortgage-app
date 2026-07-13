"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, Button, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip } from "@heroui/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { formatDate, formatCurrency, formatPercentage } from "@/lib/utils";
import { ApiResponse } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  UNDER_REVIEW: "#8b5cf6",
  APPROVED: "#3b82f6",
  DISBURSED: "#10b981",
  COMPLETED: "#06b6d4",
  DEFAULTED: "#ef4444",
};

const statusColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning", UNDER_REVIEW: "default", APPROVED: "accent", DISBURSED: "success", COMPLETED: "default", DEFAULTED: "danger",
};

interface ReportData {
  summary: {
    totalLoans: number;
    totalDisbursed: number;
    totalCollected: number;
    totalOutstanding: number;
    collectionRate: number;
  };
  loansByStatus: Array<{
    status: string;
    _count: number;
    _sum: { loanAmount: number | null };
  }>;
  recentRepayments: Array<{
    id: string;
    amountPaid: number;
    paymentMethod: string;
    paymentDate: string;
    loan: { borrower: { firstName: string; lastName: string } };
  }>;
  borrowerOccupations: Array<{
    occupation: string;
    _count: number;
  }>;
  loanPurposeDistribution: Array<{
    purpose: string;
    _count: number;
  }>;
}

function ExportIcon() {
  return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7,10 12,15 17,10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const json: ApiResponse<ReportData> = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportToPDF = async () => {
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text("MortgagePro - Financial Report", 20, 20);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 28);

      if (data) {
        doc.setFontSize(14);
        doc.text("Financial Summary", 20, 40);
        doc.setFontSize(10);
        doc.text(`Total Mortgages: ${data.summary.totalLoans}`, 20, 50);
        doc.text(`Total Disbursed: ${formatCurrency(data.summary.totalDisbursed)}`, 20, 56);
        doc.text(`Total Collected: ${formatCurrency(data.summary.totalCollected)}`, 20, 62);
        doc.text(`Outstanding Balance: ${formatCurrency(data.summary.totalOutstanding)}`, 20, 68);
        doc.text(`Collection Rate: ${data.summary.collectionRate.toFixed(1)}%`, 20, 74);

        let y = 90;
        doc.setFontSize(14);
        doc.text("Mortgages by Status", 20, y);
        y += 10;
        doc.setFontSize(10);
        data.loansByStatus.forEach((item) => {
          doc.text(`${item.status}: ${item._count} (${formatCurrency(item._sum.loanAmount || 0)})`, 20, y);
          y += 7;
        });
      }

      doc.save("mortgage-report.pdf");
    } catch (error) {
      console.error("PDF export error:", error);
    }
  };

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");

      if (!data) return;

      const wb = XLSX.utils.book_new();

      // Summary sheet
      const summaryData = [
        ["Metric", "Value"],
        ["Total Mortgages", data.summary.totalLoans],
        ["Total Disbursed", data.summary.totalDisbursed],
        ["Total Collected", data.summary.totalCollected],
        ["Outstanding Balance", data.summary.totalOutstanding],
        ["Collection Rate (%)", data.summary.collectionRate.toFixed(1)],
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryData), "Summary");

      // Loans by Status sheet
      const statusData = [
        ["Status", "Count", "Total Amount"],
        ...data.loansByStatus.map((item) => [
          item.status,
          item._count,
          item._sum.loanAmount || 0,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusData), "Mortgages by Status");

      // Recent Repayments sheet
      const repaymentData = [
        ["Date", "Borrower", "Amount", "Method"],
        ...data.recentRepayments.map((rep) => [
          rep.paymentDate,
          `${rep.loan.borrower.firstName} ${rep.loan.borrower.lastName}`,
          rep.amountPaid,
          rep.paymentMethod,
        ]),
      ];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(repaymentData), "Recent Repayments");

      XLSX.writeFile(wb, "mortgage-report.xlsx");
    } catch (error) {
      console.error("Excel export error:", error);
    }
  };

  if (loading) {
    return <div className="animate-pulse space-y-4"><Card><Card.Content className="h-40" /></Card></div>;
  }

  if (!data) {
    return <p className="text-slate-500">Failed to load report data.</p>;
  }

  const statusChartData = data.loansByStatus.map((item) => ({
    name: item.status.replace(/_/g, " "),
    value: item._count,
    amount: item._sum.loanAmount || 0,
  }));

  const occupationChartData = data.borrowerOccupations
    .sort((a, b) => b._count - a._count)
    .slice(0, 8)
    .map((item) => ({ name: item.occupation, count: item._count }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
          <p className="text-sm text-slate-500">Financial overview and analytics</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onPress={exportToPDF}>
            <ExportIcon /> Export PDF
          </Button>
          <Button variant="outline" onPress={exportToExcel}>
            <ExportIcon /> Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-slate-200 shadow-sm">
          <Card.Content>
            <p className="text-sm text-slate-500">Total Disbursed</p>
            <p className="text-2xl font-bold text-slate-800">{formatCurrency(data.summary.totalDisbursed)}</p>
          </Card.Content>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <Card.Content>
            <p className="text-sm text-slate-500">Total Collected</p>
            <p className="text-2xl font-bold text-green-600">{formatCurrency(data.summary.totalCollected)}</p>
          </Card.Content>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <Card.Content>
            <p className="text-sm text-slate-500">Outstanding Balance</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(data.summary.totalOutstanding)}</p>
          </Card.Content>
        </Card>
        <Card className="border border-slate-200 shadow-sm">
          <Card.Content>
            <p className="text-sm text-slate-500">Collection Rate</p>
            <p className="text-2xl font-bold text-blue-600">{data.summary.collectionRate.toFixed(1)}%</p>
          </Card.Content>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Mortgage Portfolio by Status</p></Card.Header>
          <Card.Content>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={statusChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value"
                  label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                >
                  {statusChartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name.replace(/ /g, "_")] || "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Borrower Occupations</p></Card.Header>
          <Card.Content>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={occupationChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card.Content>
        </Card>
      </div>

      {/* Loans by Status Table */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Mortgages by Status</p></Card.Header>
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Mortgages by status">
                <TableHeader>
                  <TableColumn isRowHeader>STATUS</TableColumn>
                  <TableColumn>COUNT</TableColumn>
                  <TableColumn>TOTAL AMOUNT</TableColumn>
                </TableHeader>
                <TableBody items={data.loansByStatus}>
                  {(item) => (
                    <TableRow key={item.status}>
                      <TableCell>
                        <Chip size="sm" color={statusColorMap[item.status] || "default"} variant="soft">
                          {item.status.replace(/_/g, " ")}
                        </Chip>
                      </TableCell>
                      <TableCell className="font-medium text-slate-800">{item._count}</TableCell>
                      <TableCell className="text-slate-800">{formatCurrency(item._sum.loanAmount || 0)}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>

      {/* Recent Repayments Table */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Recent Repayments</p></Card.Header>
        <Card.Content className="p-0">
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Recent repayments">
                <TableHeader>
                  <TableColumn isRowHeader>DATE</TableColumn>
                  <TableColumn>BORROWER</TableColumn>
                  <TableColumn>AMOUNT</TableColumn>
                  <TableColumn>METHOD</TableColumn>
                </TableHeader>
                <TableBody items={data.recentRepayments}>
                  {(rep) => (
                    <TableRow key={rep.id}>
                      <TableCell className="text-slate-500">{formatDate(rep.paymentDate)}</TableCell>
                      <TableCell className="font-medium text-slate-800">
                        {rep.loan.borrower.firstName} {rep.loan.borrower.lastName}
                      </TableCell>
                      <TableCell className="text-slate-800">{formatCurrency(rep.amountPaid)}</TableCell>
                      <TableCell className="text-slate-800">{rep.paymentMethod.replace(/_/g, " ")}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        </Card.Content>
      </Card>
    </div>
  );
}
