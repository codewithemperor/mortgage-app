"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Select, Separator, TextArea, Label, TextField, ListBox } from "@heroui/react";
import { formatCurrency } from "@/lib/utils";

interface LoanOption {
  id: string;
  loanAmount: number;
  monthlyPayment: number;
  status: string;
  borrower: { firstName: string; lastName: string };
  amortizationSchedule: Array<{ status: string; installmentNo: number; paymentAmount: number; dueDate: string }>;
}

const PAYMENT_METHODS = [
  { key: "BANK_TRANSFER", label: "Bank Transfer" },
  { key: "CASH", label: "Cash" },
  { key: "CHEQUE", label: "Cheque" },
  { key: "ONLINE", label: "Online Payment" },
];

export default function RecordPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loans, setLoans] = useState<LoanOption[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<LoanOption | null>(null);

  const [form, setForm] = useState({
    loanId: "",
    amountPaid: "",
    paymentMethod: "",
    receiptNumber: "",
    notes: "",
  });

  useEffect(() => {
    async function fetchDisbursedLoans() {
      try {
        const res = await fetch("/api/loans?status=DISBURSED&pageSize=100");
        const json = await res.json();
        if (json.success) {
          setLoans(json.data.data || []);
        }
      } catch (err) {
        console.error("Failed to fetch loans:", err);
      }
    }
    fetchDisbursedLoans();
  }, []);

  const handleLoanSelect = (loanId: string) => {
    setForm((prev) => ({ ...prev, loanId }));
    const loan = loans.find((l) => l.id === loanId);
    if (loan) {
      setSelectedLoan(loan);
      setForm((prev) => ({ ...prev, amountPaid: loan.monthlyPayment.toString() }));
    }
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/repayments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        router.push("/admin/repayments");
      } else {
        setError(json.error || "Failed to record payment");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const unpaidCount = selectedLoan
    ? selectedLoan.amortizationSchedule.filter((s) => s.status === "UNPAID" || s.status === "OVERDUE").length
    : 0;

  const nextDue = selectedLoan
    ? selectedLoan.amortizationSchedule.find((s) => s.status === "UNPAID" || s.status === "OVERDUE")
    : null;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Record Payment</h2>
        <p className="text-sm text-slate-500">Record a new mortgage repayment</p>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div>
              <p className="text-sm text-slate-600 mb-1">Select Mortgage</p>
              <Select
                placeholder="Select a mortgage"
                selectedKey={form.loanId || null}
                onSelectionChange={(key) => handleLoanSelect((key as string) || "")}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {loans.map((loan) => (
                      <ListBox.Item key={loan.id} id={loan.id} textValue={`${loan.borrower.firstName} ${loan.borrower.lastName} — ${formatCurrency(loan.loanAmount)}`}>
                        <Label>{loan.borrower.firstName} {loan.borrower.lastName}</Label>
                        <p className="text-xs text-slate-500">
                          Mortgage: {formatCurrency(loan.loanAmount)} | Monthly: {formatCurrency(loan.monthlyPayment)}
                        </p>
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            {selectedLoan && nextDue && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-blue-700 font-medium">Next Payment Due</p>
                <p className="text-xs text-blue-600">
                  Installment #{nextDue.installmentNo} — Due: {new Date(nextDue.dueDate).toLocaleDateString()}
                </p>
                <p className="text-xs text-blue-600">
                  Amount: {formatCurrency(nextDue.paymentAmount)} | {unpaidCount} installments remaining
                </p>
              </div>
            )}

            <Separator />

            <TextField value={form.amountPaid} onChange={(v) => handleChange("amountPaid", v)} isRequired>
              <Label>Payment Amount (₦)</Label>
              <Input placeholder="Enter payment amount" type="number" />
            </TextField>

            <div>
              <p className="text-sm text-slate-600 mb-1">Payment Method</p>
              <Select
                placeholder="Select payment method"
                selectedKey={form.paymentMethod || null}
                onSelectionChange={(key) => handleChange("paymentMethod", (key as string) || "")}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {PAYMENT_METHODS.map((m) => (
                      <ListBox.Item key={m.key} id={m.key}>{m.label}</ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <TextField value={form.receiptNumber} onChange={(v) => handleChange("receiptNumber", v)}>
              <Label>Receipt Number</Label>
              <Input placeholder="Enter receipt number (optional)" />
            </TextField>

            <TextField value={form.notes} onChange={(v) => handleChange("notes", v)}>
              <Label>Notes</Label>
              <TextArea placeholder="Additional notes (optional)" />
            </TextField>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onPress={() => router.back()}>Cancel</Button>
              <Button type="submit" variant="primary" isDisabled={loading}>{loading ? "Recording..." : "Record Payment"}</Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
