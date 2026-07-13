"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, Chip, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApiResponse } from "@/types";

interface AmortizationEntry {
  id: string;
  installmentNo: number;
  dueDate: Date;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  balanceAfter: number;
  status: string;
  paidDate: Date | null;
}

interface LoanDetail {
  id: string;
  loanAmount: number;
  interestRate: number;
  loanTermMonths: number;
  monthlyPayment: number;
  totalPayable: number;
  downPaymentPercent: number | null;
  propertyValue: number | null;
  purpose: string | null;
  status: string;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  reviewComments: string | null;
  approvedAt: Date | null;
  disbursedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  property: {
    id: string;
    title: string;
    address: string;
    type: string;
    currentValue: number;
  } | null;
  amortizationSchedule: AmortizationEntry[];
  repayments: Array<{
    id: string;
    amountPaid: number;
    principalAmount: number;
    interestAmount: number;
    paymentMethod: string;
    paymentDate: Date;
    receiptNumber: string | null;
  }>;
}

const statusColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "default",
  APPROVED: "accent",
  DISBURSED: "success",
  COMPLETED: "default",
  DEFAULTED: "danger",
};

const scheduleStatusColor: Record<string, "success" | "warning" | "danger" | "default"> = {
  PAID: "success",
  UNPAID: "default",
  OVERDUE: "danger",
};

export default function BorrowerLoanDetailPage() {
  const params = useParams();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLoan() {
      try {
        const res = await fetch(`/api/borrower/loans/${params.id}`);
        const json = await res.json();
        if (json.success) {
          setLoan(json.data);
        }
      } catch (error) {
        console.error("Failed to fetch loan:", error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchLoan();
  }, [params.id]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <Card><Card.Content className="h-40" /></Card>
      </div>
    );
  }

  if (!loan) {
    return <p className="text-slate-500">Mortgage not found.</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
	          <Link href="/borrower/mortgages" className="text-sm text-blue-500 hover:text-blue-600">
	            &larr; Back to My Mortgages
	          </Link>
	          <h2 className="text-2xl font-bold text-slate-800 mt-1">Mortgage Details</h2>
        </div>
        <Chip color={statusColorMap[loan.status] || "default"} variant="soft" size="lg">
          {loan.status.replace(/_/g, " ")}
        </Chip>
      </div>

      {/* Loan Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-slate-200 shadow-sm">
	          <Card.Header><p className="font-semibold text-slate-800">Mortgage Information</p></Card.Header>
	          <Card.Content className="space-y-3">
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Amount</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.loanAmount)}</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Interest Rate</span><span className="text-sm text-slate-800">{loan.interestRate}% p.a.</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Term</span><span className="text-sm text-slate-800">{loan.loanTermMonths} months</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Monthly Payment</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.monthlyPayment)}</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Total Payable</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.totalPayable)}</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Purpose</span><span className="text-sm text-slate-800">{loan.purpose || "—"}</span></div>
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Property Details</p></Card.Header>
	          <Card.Content className="space-y-3">
	            {loan.property ? (
	              <>
	                <div className="flex justify-between"><span className="text-sm text-slate-500">Title</span><span className="text-sm text-slate-800">{loan.property.title}</span></div>
	                <div className="flex justify-between"><span className="text-sm text-slate-500">Type</span><span className="text-sm text-slate-800">{loan.property.type}</span></div>
	                <div className="flex justify-between"><span className="text-sm text-slate-500">Value</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.property.currentValue)}</span></div>
                <p className="text-xs text-slate-500 mt-2">{loan.property.address}</p>
              </>
            ) : (
              <p className="text-slate-400 text-sm">No property linked</p>
            )}
          </Card.Content>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Timeline</p></Card.Header>
	          <Card.Content className="space-y-3">
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Applied</span><span className="text-sm text-slate-800">{formatDate(loan.createdAt)}</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Reviewed</span><span className="text-sm text-slate-800">{loan.reviewedAt ? formatDate(loan.reviewedAt) : "—"}</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Approved</span><span className="text-sm text-slate-800">{loan.approvedAt ? formatDate(loan.approvedAt) : "—"}</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Disbursed</span><span className="text-sm text-slate-800">{loan.disbursedAt ? formatDate(loan.disbursedAt) : "—"}</span></div>
	            <div className="flex justify-between"><span className="text-sm text-slate-500">Completed</span><span className="text-sm text-slate-800">{loan.completedAt ? formatDate(loan.completedAt) : "—"}</span></div>
          </Card.Content>
        </Card>
      </div>

      {/* Down Payment Summary */}
      {loan.downPaymentPercent != null && loan.propertyValue != null && (
        <Card className="border border-amber-200 bg-amber-50/50 shadow-sm">
          <Card.Header><p className="font-semibold text-amber-800">Down Payment Summary</p></Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-amber-600">Property Value</p>
                <p className="text-lg font-bold text-amber-900">{formatCurrency(loan.propertyValue)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Your Down Payment ({loan.downPaymentPercent}%)</p>
                <p className="text-lg font-bold text-amber-900">{formatCurrency(loan.propertyValue * loan.downPaymentPercent / 100)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Mortgage Balance</p>
                <p className="text-lg font-bold text-amber-900">{formatCurrency(loan.loanAmount)}</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Review Comments */}
      {loan.reviewComments && (
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Review Comments</p></Card.Header>
          <Card.Content>
            <p className="text-sm text-slate-600">{loan.reviewComments}</p>
          </Card.Content>
        </Card>
      )}

      {/* Amortization Schedule */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Amortization Schedule</p></Card.Header>
        <Card.Content className="p-0">
          {loan.amortizationSchedule.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Amortization schedule">
                  <TableHeader>
                    <TableColumn isRowHeader>#</TableColumn>
                    <TableColumn>DUE DATE</TableColumn>
                    <TableColumn>PAYMENT</TableColumn>
                    <TableColumn>PRINCIPAL</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>BALANCE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody items={loan.amortizationSchedule}>
                    {(entry) => (
                      <TableRow key={entry.id}>
	                        <TableCell><span className="font-medium text-slate-800">{entry.installmentNo}</span></TableCell>
	                        <TableCell className="text-slate-500">{formatDate(entry.dueDate)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.paymentAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.principalAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.interestAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.balanceAfter)}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={scheduleStatusColor[entry.status] || "default"} variant="soft">
                            {entry.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">No amortization schedule available</div>
          )}
        </Card.Content>
      </Card>

      {/* Repayment History */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Payment History</p></Card.Header>
        <Card.Content className="p-0">
          {loan.repayments.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Payment history">
                  <TableHeader>
                    <TableColumn isRowHeader>DATE</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>PRINCIPAL</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>METHOD</TableColumn>
                    <TableColumn>RECEIPT</TableColumn>
                  </TableHeader>
                  <TableBody items={loan.repayments}>
                    {(rep) => (
                      <TableRow key={rep.id}>
	                        <TableCell className="text-slate-500">{formatDate(rep.paymentDate)}</TableCell>
	                        <TableCell className="font-medium text-slate-800">{formatCurrency(rep.amountPaid)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(rep.principalAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(rep.interestAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{rep.paymentMethod.replace(/_/g, " ")}</TableCell>
                        <TableCell><span className="text-xs font-mono text-slate-500">{rep.receiptNumber || "—"}</span></TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">No payments recorded yet</div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
