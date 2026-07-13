"use client";

import { useEffect, useState } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip, Button, Modal } from "@heroui/react";
import { formatCurrency, formatPercentage } from "@/lib/utils";

interface MortgagePackage {
  id: string;
  name: string;
  description: string | null;
  interestRate: number;
  maxAmount: number;
  minDownPayment: number;
  defaultTermMonths: number;
  isActive: boolean;
  createdAt: string;
  _count: { loans: number };
}

export default function MortgagePlansPage() {
  const [packages, setPackages] = useState<MortgagePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState<MortgagePackage | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    interestRate: "",
    maxAmount: "",
    minDownPayment: "20",
    defaultTermMonths: "240",
  });

  const fetchPackages = async () => {
    setLoading(true);
    const res = await fetch("/api/mortgage-packages?all=true");
    const json = await res.json();
    if (json.success) setPackages(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleEdit = (pkg: MortgagePackage) => {
    setEditingPkg(pkg);
    setForm({
      name: pkg.name,
      description: pkg.description || "",
      interestRate: pkg.interestRate.toString(),
      maxAmount: pkg.maxAmount.toString(),
      minDownPayment: pkg.minDownPayment.toString(),
      defaultTermMonths: pkg.defaultTermMonths.toString(),
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingPkg(null);
    setForm({ name: "", description: "", interestRate: "", maxAmount: "", minDownPayment: "20", defaultTermMonths: "240" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.interestRate || !form.maxAmount) return;

    if (editingPkg) {
      await fetch(`/api/mortgage-packages/${editingPkg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/mortgage-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setShowModal(false);
    fetchPackages();
  };

  const handleToggleActive = async (pkg: MortgagePackage) => {
    await fetch(`/api/mortgage-packages/${pkg.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !pkg.isActive }),
    });
    fetchPackages();
  };

  const handleDelete = async (pkg: MortgagePackage) => {
    if (!confirm(`Delete "${pkg.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/mortgage-packages/${pkg.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) alert(json.error);
    else fetchPackages();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mortgage Plans</h2>
          <p className="text-slate-500">Manage mortgage packages available to borrowers</p>
        </div>
        <Button onPress={handleNew} variant="primary">
          + New Plan
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : packages.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No mortgage plans yet. Create one to get started.</div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Mortgage plans">
                  <TableHeader>
                    <TableColumn isRowHeader>PLAN NAME</TableColumn>
                    <TableColumn>INTEREST RATE</TableColumn>
                    <TableColumn>MAX AMOUNT</TableColumn>
                    <TableColumn>DOWN PAYMENT</TableColumn>
                    <TableColumn>TERM</TableColumn>
                    <TableColumn>LOANS</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={packages}>
                    {(pkg) => (
                      <TableRow key={pkg.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-slate-800">{pkg.name}</p>
                            {pkg.description && <p className="text-xs text-slate-500">{pkg.description}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-800">{formatPercentage(pkg.interestRate)}</TableCell>
                        <TableCell className="text-slate-800">{formatCurrency(pkg.maxAmount)}</TableCell>
                        <TableCell className="text-slate-800">{pkg.minDownPayment}%</TableCell>
                        <TableCell className="text-slate-800">{(pkg.defaultTermMonths / 12).toFixed(0)} years</TableCell>
                        <TableCell className="text-slate-800">{pkg._count?.loans || 0}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={pkg.isActive ? "success" : "danger"} variant="soft">
                            {pkg.isActive ? "Active" : "Inactive"}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onPress={() => handleEdit(pkg)}>
                              Edit
                            </Button>
                            <Button size="sm" variant="outline" onPress={() => handleToggleActive(pkg)}>
                              {pkg.isActive ? "Disable" : "Enable"}
                            </Button>
                            <Button size="sm" variant="danger" onPress={() => handleDelete(pkg)}>
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table.Content>
              </Table.ScrollContainer>
            </Table>
          )}
        </Card.Content>
      </Card>

      <Modal isOpen={showModal} onOpenChange={setShowModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>{editingPkg ? "Edit Mortgage Plan" : "New Mortgage Plan"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Plan Name *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g., Home Starter Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      placeholder="Brief description"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Interest Rate (%)*</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={form.interestRate}
                        onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                        placeholder="15.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Max Amount (₦)*</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={form.maxAmount}
                        onChange={(e) => setForm({ ...form, maxAmount: e.target.value })}
                        placeholder="50000000"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Min Down Payment (%)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={form.minDownPayment}
                        onChange={(e) => setForm({ ...form, minDownPayment: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Default Term (months)</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={form.defaultTermMonths}
                        onChange={(e) => setForm({ ...form, defaultTermMonths: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setShowModal(false)}>Cancel</Button>
                <Button variant="primary" onPress={handleSave}>{editingPkg ? "Update" : "Create"}</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
