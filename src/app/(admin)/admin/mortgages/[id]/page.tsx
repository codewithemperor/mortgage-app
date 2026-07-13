"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, Button, Chip, Separator, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, TextArea, Modal, TextField, Label } from "@heroui/react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatDate, formatCurrency, formatPercentage } from "@/lib/utils";
import { ApiResponse } from "@/types";

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
  reviewedAt: string | null;
  reviewComments: string | null;
  approvedAt: string | null;
  disbursedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  borrower: { id: string; firstName: string; lastName: string; email: string; phone: string; address: string };
  property: { id: string; title: string; address: string; type: string; currentValue: number } | null;
  reviewer: { name: string; email: string; role: string } | null;
  repayments: Array<{ id: string; amountPaid: number; principalAmount: number; interestAmount: number; paymentMethod: string; paymentDate: string }>;
  amortizationSchedule: Array<{ id: string; installmentNo: number; dueDate: string; paymentAmount: number; principalAmount: number; interestAmount: number; balanceAfter: number; status: string; paidDate: string | null }>;
}

const statusColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
  PENDING: "warning",
  UNDER_REVIEW: "default",
  APPROVED: "accent",
  DISBURSED: "success",
  COMPLETED: "default",
  DEFAULTED: "danger",
};

const schedStatusColorMap: Record<string, "default" | "success" | "danger"> = {
  PAID: "success",
  UNPAID: "default",
  OVERDUE: "danger",
};

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [action, setAction] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [comments, setComments] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchLoan() {
      try {
        const res = await fetch(`/api/loans/${params.id}`);
        const json: ApiResponse<LoanDetail> = await res.json();
        if (json.success && json.data) setLoan(json.data);
      } catch (error) {
        console.error("Failed to fetch loan:", error);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchLoan();
  }, [params.id]);

  const handleAction = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/loans/${params.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          comments: comments || undefined,
          reviewerId: session?.user?.id,
        }),
      });
      const json = await res.json();
      if (json.success) {
        router.refresh();
        window.location.reload();
      }
    } catch (error) {
      console.error("Action failed:", error);
    } finally {
      setActionLoading(false);
      setShowModal(false);
    }
  };

  const handleDisburse = async () => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/loans/${params.id}/disburse`, { method: "POST" });
      const json = await res.json();
      if (json.success) {
        window.location.reload();
      }
    } catch (error) {
      console.error("Disburse failed:", error);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse space-y-4"><Card><Card.Content className="h-40" /></Card></div>;
  if (!loan) return <p className="text-slate-500">Mortgage not found.</p>;

  const userRole = session?.user?.role;
  const canApprove = userRole === "ADMIN" || userRole === "MANAGER";
  const canDisburse = canApprove && loan.status === "APPROVED";
  const canReview = (loan.status === "PENDING" || loan.status === "UNDER_REVIEW") && canApprove;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/mortgages" className="text-sm text-blue-500 hover:text-blue-600">← Back to Mortgages</Link>
          <h2 className="text-2xl font-bold text-slate-800 mt-1">Mortgage Details</h2>
        </div>
        <Chip size="lg" color={statusColorMap[loan.status] || "default"} variant="soft">
          {loan.status.replace(/_/g, " ")}
        </Chip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Loan Info */}
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Mortgage Information</p></Card.Header>
          <Card.Content className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-slate-500">Amount</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.loanAmount)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Interest Rate</span><span className="text-sm text-slate-800">{formatPercentage(loan.interestRate)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Term</span><span className="text-sm text-slate-800">{loan.loanTermMonths} months</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Monthly Payment</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.monthlyPayment)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Total Payable</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.totalPayable)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Purpose</span><span className="text-sm text-slate-800">{loan.purpose || "—"}</span></div>
          </Card.Content>
        </Card>

        {/* Borrower Info */}
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header>
            <p className="font-semibold text-slate-800">Borrower</p>
            <Link href={`/admin/borrowers/${loan.borrower.id}`}><Button size="sm" variant="outline">View Profile</Button></Link>
          </Card.Header>
          <Card.Content className="space-y-3">
            <div className="flex justify-between"><span className="text-sm text-slate-500">Name</span><span className="text-sm font-medium text-slate-800">{loan.borrower.firstName} {loan.borrower.lastName}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Email</span><span className="text-sm text-slate-800">{loan.borrower.email}</span></div>
            <div className="flex justify-between"><span className="text-sm text-slate-500">Phone</span><span className="text-sm text-slate-800">{loan.borrower.phone}</span></div>
          </Card.Content>
        </Card>

        {/* Property Info */}
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Property / Collateral</p></Card.Header>
          <Card.Content className="space-y-3">
            {loan.property ? (
              <>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Title</span><span className="text-sm font-medium text-slate-800">{loan.property.title}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Type</span><span className="text-sm text-slate-800">{loan.property.type}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Value</span><span className="text-sm font-medium text-slate-800">{formatCurrency(loan.property.currentValue)}</span></div>
              </>
            ) : (
              <p className="text-sm text-slate-400">No property linked</p>
            )}
            {loan.reviewer && (
              <>
                <Separator />
                <div className="flex justify-between"><span className="text-sm text-slate-500">Reviewed By</span><span className="text-sm text-slate-800">{loan.reviewer.name}</span></div>
                <div className="flex justify-between"><span className="text-sm text-slate-500">Reviewed At</span><span className="text-sm text-slate-800">{formatDate(loan.reviewedAt!)}</span></div>
                {loan.reviewComments && <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded">{loan.reviewComments}</p>}
              </>
            )}
          </Card.Content>
        </Card>
      </div>

      {/* Down Payment Information */}
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
                <p className="text-xs text-amber-600">Down Payment ({loan.downPaymentPercent}%)</p>
                <p className="text-lg font-bold text-amber-900">{formatCurrency(loan.propertyValue * loan.downPaymentPercent / 100)}</p>
              </div>
              <div>
                <p className="text-xs text-amber-600">Mortgage Balance (Disbursed)</p>
                <p className="text-lg font-bold text-amber-900">{formatCurrency(loan.loanAmount)}</p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      {(canReview || canDisburse) && (
        <Card className="border border-slate-200 shadow-sm">
          <Card.Content className="flex gap-3">
            {canReview && (
              <>
                <Button variant="primary" onPress={() => { setAction("APPROVE"); setShowModal(true); }}>Approve Mortgage</Button>
                <Button variant="danger-soft" onPress={() => { setAction("REJECT"); setShowModal(true); }}>Reject Mortgage</Button>
              </>
            )}
            {canDisburse && (
              <Button variant="primary" isDisabled={actionLoading} onPress={handleDisburse}>{actionLoading ? "Processing..." : "Mark as Disbursed"}</Button>
            )}
          </Card.Content>
        </Card>
      )}

      {/* Amortization Schedule */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Amortization Schedule</p></Card.Header>
        <Card.Content className="p-0">
          <div className="overflow-x-auto">
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
                        <TableCell className="text-slate-800">{entry.installmentNo}</TableCell>
                        <TableCell className="text-slate-500">{formatDate(entry.dueDate)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(entry.paymentAmount)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(entry.principalAmount)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(entry.interestAmount)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(entry.balanceAfter)}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={schedStatusColorMap[entry.status] || "default"} variant="soft">
                            {entry.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </div>
        </Card.Content>
      </Card>

      {/* Repayment History */}
      {loan.repayments.length > 0 && (
        <Card className="border border-slate-200 shadow-sm">
          <Card.Header><p className="font-semibold text-slate-800">Repayment History</p></Card.Header>
          <Card.Content className="p-0">
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Repayment history">
                  <TableHeader>
                    <TableColumn isRowHeader>DATE</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>PRINCIPAL</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>METHOD</TableColumn>
                  </TableHeader>
                  <TableBody items={loan.repayments}>
                    {(rep) => (
                      <TableRow key={rep.id}>
                        <TableCell className="text-slate-500">{formatDate(rep.paymentDate)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(rep.amountPaid)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(rep.principalAmount)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(rep.interestAmount)}</TableCell>
                        <TableCell className="text-slate-800">{rep.paymentMethod.replace(/_/g, " ")}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          </Card.Content>
        </Card>
      )}

      {/* Approve/Reject Modal */}
      <Modal isOpen={showModal} onOpenChange={setShowModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{action === "APPROVE" ? "Approve" : "Reject"} Mortgage Application</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <TextField value={comments} onChange={setComments}>
                  <Label>Comments</Label>
                  <TextArea placeholder="Add your review comments..." />
                </TextField>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setShowModal(false)}>Cancel</Button>
                <Button variant={action === "APPROVE" ? "primary" : "danger"} isDisabled={actionLoading} onPress={handleAction}>
                  {actionLoading ? "Processing..." : action === "APPROVE" ? "Approve" : "Reject"}
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
