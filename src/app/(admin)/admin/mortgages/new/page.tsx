"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Select, ListBox, TextField, Label, TextArea, Separator } from "@heroui/react";
import { formatCurrency } from "@/lib/utils";
import { calculateMonthlyPayment } from "@/lib/amortization";

interface Borrower {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Property {
  id: string;
  title: string;
  type: string;
  currentValue: number;
}

interface MortgagePackage {
  id: string;
  name: string;
  interestRate: number;
  maxAmount: number;
  minDownPayment: number;
  defaultTermMonths: number;
  isActive: boolean;
}

export default function NewLoanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [packages, setPackages] = useState<MortgagePackage[]>([]);

  const [form, setForm] = useState({
    borrowerId: "",
    propertyId: "",
    packageId: "",
    loanAmount: "",
    interestRate: "",
    loanTermMonths: "",
    purpose: "",
    downPaymentPercent: "",
    propertyValue: "",
  });

  const [preview, setPreview] = useState<{
    monthlyPayment: number;
    totalPayable: number;
  } | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [borrowersRes, propertiesRes, packagesRes] = await Promise.all([
          fetch("/api/borrowers?pageSize=100"),
          fetch("/api/properties"),
          fetch("/api/mortgage-packages"),
        ]);
        const borrowersJson = await borrowersRes.json();
        const propertiesJson = await propertiesRes.json();
        const packagesJson = await packagesRes.json();
        if (borrowersJson.success) setBorrowers(borrowersJson.data.data || []);
        if (propertiesJson.success) setProperties(propertiesJson.data || []);
        if (packagesJson.success) setPackages(packagesJson.data || []);
      } catch (err) {
        console.error("Failed to load data:", err);
      }
    }
    fetchData();
  }, []);

  // Live preview of monthly payment
  useEffect(() => {
    const amount = parseFloat(form.loanAmount);
    const rate = parseFloat(form.interestRate);
    const term = parseInt(form.loanTermMonths);

    if (amount > 0 && rate > 0 && term > 0) {
      const monthly = calculateMonthlyPayment({ principal: amount, annualRate: rate, termMonths: term });
      setPreview({ monthlyPayment: monthly, totalPayable: monthly * term });
    } else {
      setPreview(null);
    }
  }, [form.loanAmount, form.interestRate, form.loanTermMonths]);

  // Autofill from package and/or property selection
  // When both are selected: loan amount = property value - (down payment % of property value)
  useEffect(() => {
    const pkg = form.packageId ? packages.find((p) => p.id === form.packageId) : null;
    const prop = form.propertyId ? properties.find((p) => p.id === form.propertyId) : null;

    if (pkg && prop) {
      // Both selected: calculate property value minus down payment
      const downPaymentAmount = prop.currentValue * (pkg.minDownPayment / 100);
      const loanAmount = prop.currentValue - downPaymentAmount;
      setForm((prev) => ({
        ...prev,
        interestRate: String(pkg.interestRate),
        loanTermMonths: String(pkg.defaultTermMonths),
        loanAmount: String(Math.round(loanAmount * 100) / 100),
        downPaymentPercent: String(pkg.minDownPayment),
        propertyValue: String(prop.currentValue),
      }));
    } else if (pkg && !prop) {
      // Only package: use max amount as reference
      setForm((prev) => ({
        ...prev,
        interestRate: String(pkg.interestRate),
        loanTermMonths: String(pkg.defaultTermMonths),
      }));
    } else if (prop && !pkg) {
      // Only property: use property value
      setForm((prev) => ({
        ...prev,
        loanAmount: prev.loanAmount || String(prop.currentValue),
      }));
    }
  }, [form.packageId, form.propertyId, packages, properties]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        router.push("/admin/mortgages");
      } else {
        setError(json.error || "Failed to create mortgage application");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">New Mortgage Application</h2>
        <p className="text-sm text-slate-500">Create a new mortgage application</p>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div className="space-y-1">
              <Label className="text-sm font-medium text-slate-700">Borrower *</Label>
              <Select
                placeholder="Select a borrower"
                selectedKey={form.borrowerId || null}
                onSelectionChange={(key) => {
                  handleChange("borrowerId", (key as string) || "");
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {borrowers.map((b) => (
                      <ListBox.Item key={b.id} id={b.id} textValue={`${b.firstName} ${b.lastName}`}>
                        <Label>{b.firstName} {b.lastName}</Label>
                        <p className="text-xs text-slate-500">{b.email}</p>
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-slate-700">Property *</Label>
              <Select
                placeholder="Select a property"
                selectedKey={form.propertyId || null}
                onSelectionChange={(key) => {
                  handleChange("propertyId", (key as string) || "");
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {properties.map((p) => (
                      <ListBox.Item key={p.id} id={p.id} textValue={p.title}>
                        <Label>{p.title}</Label>
                        <p className="text-xs text-slate-500">{p.type} — {formatCurrency(p.currentValue)}</p>
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-slate-700">Mortgage Package *</Label>
              <Select
                placeholder="Select a mortgage package"
                selectedKey={form.packageId || null}
                onSelectionChange={(key) => {
                  handleChange("packageId", (key as string) || "");
                }}
              >
                <Select.Trigger>
                  <Select.Value />
                  <Select.Indicator />
                </Select.Trigger>
                <Select.Popover>
                  <ListBox>
                    {packages.filter((p) => p.isActive).map((pkg) => (
                      <ListBox.Item key={pkg.id} id={pkg.id} textValue={pkg.name}>
                        <Label>{pkg.name}</Label>
                        <p className="text-xs text-slate-500">
                          {pkg.interestRate}% — Max {formatCurrency(pkg.maxAmount)} — {pkg.minDownPayment}% down — {pkg.defaultTermMonths} months
                        </p>
                      </ListBox.Item>
                    ))}
                  </ListBox>
                </Select.Popover>
              </Select>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <TextField value={form.loanAmount} onChange={(v) => handleChange("loanAmount", v)} isRequired isDisabled>
                <Label>Mortgage Amount (₦) {form.downPaymentPercent && <span className="text-xs text-slate-400 font-normal">(after down payment)</span>}</Label>
                <Input placeholder="Enter amount" type="number" />
              </TextField>
              <TextField value={form.interestRate} onChange={(v) => handleChange("interestRate", v)} isRequired isDisabled>
                  <Label>Annual Interest Rate (%)</Label>
                <Input placeholder="Annual rate" type="number" step="0.1" />
              </TextField>
              <TextField value={form.loanTermMonths} onChange={(v) => handleChange("loanTermMonths", v)} isRequired isDisabled>
                <Label>Mortgage Term (Months)</Label>
                <Input placeholder="Enter term" type="number" />
              </TextField>
            </div>

            {form.propertyValue && form.downPaymentPercent && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-amber-600">Property Value</p>
                  <p className="text-lg font-bold text-amber-800">{formatCurrency(parseFloat(form.propertyValue))}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600">Down Payment ({form.downPaymentPercent}%)</p>
                  <p className="text-lg font-bold text-amber-800">{formatCurrency(parseFloat(form.propertyValue) * parseFloat(form.downPaymentPercent) / 100)}</p>
                </div>
                <div>
                  <p className="text-xs text-amber-600">Mortgage Balance</p>
                  <p className="text-lg font-bold text-amber-800">{formatCurrency(parseFloat(form.loanAmount))}</p>
                </div>
              </div>
            )}

            {preview && (
              <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-blue-600">Estimated Monthly Payment</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(preview.monthlyPayment)}</p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Total Payable</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(preview.totalPayable)}</p>
                </div>
              </div>
            )}

            <TextField value={form.purpose} onChange={(v) => handleChange("purpose", v)}>
              <Label>Purpose</Label>
                  <TextArea placeholder="Enter mortgage purpose (optional)" />
            </TextField>

            <Separator />

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onPress={() => router.back()}>Cancel</Button>
              <Button type="submit" variant="primary" isDisabled={loading}>{loading ? "Submitting..." : "Submit Application"}</Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
