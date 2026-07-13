"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Separator, TextField, Input, Label } from "@heroui/react";

export default function NewBorrowerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    nin: "",
    occupation: "",
    employer: "",
    monthlyIncome: "",
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/borrowers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();

      if (json.success) {
        router.push("/admin/borrowers");
      } else {
        setError(json.error || "Failed to create borrower");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Register New Borrower</h2>
        <p className="text-sm text-slate-500">Fill in the borrower details below</p>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                value={form.firstName}
                onChange={(v) => handleChange("firstName", v)}
                isRequired
              >
                <Label>First Name</Label>
                <Input placeholder="Enter first name" />
              </TextField>
              <TextField
                value={form.lastName}
                onChange={(v) => handleChange("lastName", v)}
                isRequired
              >
                <Label>Last Name</Label>
                <Input placeholder="Enter last name" />
              </TextField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                value={form.email}
                onChange={(v) => handleChange("email", v)}
                isRequired
              >
                <Label>Email</Label>
                <Input type="email" placeholder="Enter email address" />
              </TextField>
              <TextField
                value={form.phone}
                onChange={(v) => handleChange("phone", v)}
                isRequired
              >
                <Label>Phone Number</Label>
                <Input placeholder="Enter phone number" />
              </TextField>
            </div>

            <TextField
              value={form.address}
              onChange={(v) => handleChange("address", v)}
              isRequired
            >
              <Label>Address</Label>
              <Input placeholder="Enter residential address" />
            </TextField>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField value={form.nin} onChange={(v) => handleChange("nin", v)}>
                <Label>National ID (NIN)</Label>
                <Input placeholder="Enter NIN number" />
              </TextField>
              <TextField
                value={form.monthlyIncome}
                onChange={(v) => handleChange("monthlyIncome", v)}
                isRequired
              >
                <Label>Monthly Income (₦)</Label>
                <Input type="number" placeholder="Enter monthly income" />
              </TextField>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                value={form.occupation}
                onChange={(v) => handleChange("occupation", v)}
              >
                <Label>Occupation</Label>
                <Input placeholder="Enter occupation" />
              </TextField>
              <TextField
                value={form.employer}
                onChange={(v) => handleChange("employer", v)}
              >
                <Label>Employer</Label>
                <Input placeholder="Enter employer name" />
              </TextField>
            </div>

            <Separator />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> The borrower&apos;s default password will be set to their phone number. 
                They can change it after logging into the borrower portal.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="ghost" onPress={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isDisabled={loading}>
                {loading ? "Saving..." : "Register Borrower"}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
