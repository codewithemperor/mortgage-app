"use client";

import { useEffect, useState } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip, Button, Modal } from "@heroui/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApiResponse } from "@/types";

interface Repayment {
  id: string;
  amountPaid: number;
  principalAmount: number;
  interestAmount: number;
  paymentMethod: string;
  paymentDate: Date;
  receiptNumber: string | null;
  loan: {
    id: string;
    loanAmount: number;
    property: { title: string } | null;
  };
}

interface ScheduleEntry {
  id: string;
  installmentNo: number;
  dueDate: Date;
  paymentAmount: number;
  principalAmount: number;
  interestAmount: number;
  balanceAfter: number;
  status: string;
  paidDate: Date | null;
  loan: {
    id: string;
    loanAmount: number;
  };
}

interface BorrowerLoan {
  id: string;
  loanAmount: number;
  status: string;
  property: { title: string } | null;
}

interface PaymentRequest {
  id: string;
  amount: number;
  reference: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewComments: string | null;
  loan: {
    id: string;
    loanAmount: number;
    property: { title: string } | null;
  };
  reviewer: { name: string } | null;
}

export default function BorrowerPaymentsPage() {
  const [repayments, setRepayments] = useState<Repayment[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [disbursedLoans, setDisbursedLoans] = useState<BorrowerLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    loanId: "",
    amount: "",
    reference: "",
  });
  const [nextDue, setNextDue] = useState<ScheduleEntry | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [payRes, reqRes, loansRes] = await Promise.all([
          fetch("/api/borrower/payments"),
          fetch("/api/borrower/payments/requests"),
          fetch("/api/borrower/loans"),
        ]);

        const payJson: ApiResponse<{ repayments: Repayment[]; schedule: ScheduleEntry[] }> = await payRes.json();
        if (payJson.success && payJson.data) {
          setRepayments(payJson.data.repayments);
          setSchedule(payJson.data.schedule);
        }

        const reqJson: ApiResponse<PaymentRequest[]> = await reqRes.json();
        if (reqJson.success && reqJson.data) {
          setPaymentRequests(reqJson.data);
        }

        const loansJson = await loansRes.json();
        if (loansJson.success && loansJson.data) {
          const active = loansJson.data.filter((l: BorrowerLoan) => l.status === "DISBURSED");
          setDisbursedLoans(active);
          if (active.length > 0) {
            setForm((f) => ({ ...f, loanId: active[0].id }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch payments:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Update next due when selected loan changes
  useEffect(() => {
    if (form.loanId) {
      const unpaid = schedule
        .filter((e) => e.loan.id === form.loanId && e.status === "UNPAID")
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      setNextDue(unpaid[0] || null);
      if (unpaid[0]) {
        setForm((f) => ({ ...f, amount: unpaid[0].paymentAmount.toString() }));
      }
    }
  }, [form.loanId, schedule]);

  const handleSubmitPayment = async () => {
    if (!form.loanId || !form.amount || !form.reference) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/borrower/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loanId: form.loanId,
          amount: parseFloat(form.amount),
          reference: form.reference,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowPaymentForm(false);
        setForm({ loanId: disbursedLoans[0]?.id || "", amount: "", reference: "" });
        // Refresh payment requests
        const reqRes = await fetch("/api/borrower/payments/requests");
        const reqJson = await reqRes.json();
        if (reqJson.success) setPaymentRequests(reqJson.data);
        alert("Payment request submitted successfully! The admin will review and approve it.");
      } else {
        alert(json.error || "Failed to submit payment request");
      }
    } catch (error) {
      alert("Failed to submit payment request");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColorMap: Record<string, "warning" | "success" | "danger"> = {
    PENDING: "warning",
    APPROVED: "success",
    REJECTED: "danger",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Payments</h2>
          <p className="text-sm text-slate-500">Payment history and amortization schedule</p>
        </div>
        {disbursedLoans.length > 0 && (
          <Button variant="primary" onPress={() => setShowPaymentForm(true)}>
            Make a Payment
          </Button>
        )}
      </div>

      {/* Payment Request Form Modal */}
      <Modal isOpen={showPaymentForm} onOpenChange={setShowPaymentForm}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Submit Payment Request</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <p className="text-sm text-slate-500">
                  Enter your payment details. The admin will verify and approve your payment.
                </p>

                {disbursedLoans.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Mortgage</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                      value={form.loanId}
                      onChange={(e) => setForm({ ...form, loanId: e.target.value })}
                    >
                      {disbursedLoans.map((loan) => (
                        <option key={loan.id} value={loan.id}>
                          {loan.property?.title || `Mortgage - ${formatCurrency(loan.loanAmount)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {nextDue && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-sm text-emerald-700">
                      <strong>Next Payment Due:</strong> {formatCurrency(nextDue.paymentAmount)} 
                      (Installment #{nextDue.installmentNo}, Due: {formatDate(nextDue.dueDate)})
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Amount (₦) *</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="Enter payment amount"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Reference *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    value={form.reference}
                    onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    placeholder="Enter your transaction reference number"
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    This is the reference number from your bank transfer or deposit receipt.
                  </p>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setShowPaymentForm(false)}>Cancel</Button>
                <Button variant="primary" onPress={handleSubmitPayment} isDisabled={submitting}>
                  Submit Payment Request
                </Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Payment Requests History */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header>
          <p className="font-semibold text-slate-800">Payment Requests</p>
        </Card.Header>
        <Card.Content className="p-0">
          {paymentRequests.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Payment requests">
                  <TableHeader>
                    <TableColumn isRowHeader>DATE</TableColumn>
                    <TableColumn>MORTGAGE</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>REFERENCE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody items={paymentRequests}>
                    {(req) => (
                      <TableRow key={req.id}>
	                        <TableCell className="text-slate-500">{formatDate(req.createdAt)}</TableCell>
	                        <TableCell className="text-sm text-slate-800">
                          {req.loan.property?.title || formatCurrency(req.loan.loanAmount)}
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{formatCurrency(req.amount)}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded">{req.reference}</span>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" color={statusColorMap[req.status] || "default"} variant="soft">
                            {req.status}
                          </Chip>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          ) : (
            <div className="text-center py-8 text-slate-400">No payment requests submitted yet</div>
          )}
        </Card.Content>
      </Card>

      {/* Payment History */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Payment History</p></Card.Header>
        <Card.Content className="p-0">
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : repayments.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Payment history">
                  <TableHeader>
                    <TableColumn isRowHeader>DATE</TableColumn>
                    <TableColumn>MORTGAGE</TableColumn>
                    <TableColumn>AMOUNT</TableColumn>
                    <TableColumn>PRINCIPAL</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>METHOD</TableColumn>
                    <TableColumn>RECEIPT</TableColumn>
                  </TableHeader>
                  <TableBody items={repayments}>
                    {(rep) => (
                      <TableRow key={rep.id}>
	                        <TableCell className="text-slate-500">{formatDate(rep.paymentDate)}</TableCell>
	                        <TableCell>
                          <span className="text-sm text-slate-800">{rep.loan.property?.title || formatCurrency(rep.loan.loanAmount)}</span>
                        </TableCell>
	                        <TableCell className="font-medium text-slate-800">{formatCurrency(rep.amountPaid)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(rep.principalAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(rep.interestAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{rep.paymentMethod.replace(/_/g, " ")}</TableCell>
                        <TableCell>
                          <span className="text-xs font-mono text-slate-500">{rep.receiptNumber || "—"}</span>
                        </TableCell>
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

      {/* Amortization Schedule */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Full Amortization Schedule</p></Card.Header>
        <Card.Content className="p-0">
          {schedule.length > 0 ? (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Full amortization schedule">
                  <TableHeader>
                    <TableColumn isRowHeader>MORTGAGE</TableColumn>
                    <TableColumn>INSTALLMENT</TableColumn>
                    <TableColumn>DUE DATE</TableColumn>
                    <TableColumn>PAYMENT</TableColumn>
                    <TableColumn>PRINCIPAL</TableColumn>
                    <TableColumn>INTEREST</TableColumn>
                    <TableColumn>BALANCE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                  </TableHeader>
                  <TableBody items={schedule}>
                    {(entry) => (
                      <TableRow key={entry.id}>
	                        <TableCell>
                          <span className="text-xs text-slate-800">{formatCurrency(entry.loan.loanAmount)}</span>
                        </TableCell>
	                        <TableCell><span className="font-medium text-slate-800">#{entry.installmentNo}</span></TableCell>
	                        <TableCell className="text-slate-500">{formatDate(entry.dueDate)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.paymentAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.principalAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.interestAmount)}</TableCell>
	                        <TableCell className="text-slate-800">{formatCurrency(entry.balanceAfter)}</TableCell>
                        <TableCell>
                          <Chip
                            size="sm"
                            color={
                              entry.status === "PAID" ? "success" :
                              new Date(entry.dueDate) < new Date() ? "danger" : "default"
                            }
                            variant="soft"
                          >
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
            <div className="text-center py-8 text-slate-400">No schedule available</div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}
