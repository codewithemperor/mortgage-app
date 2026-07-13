"use client";

import { useEffect, useState } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Button, Modal } from "@heroui/react";
import { formatCurrency } from "@/lib/utils";

interface Property {
  id: string;
  title: string;
  address: string;
  type: string;
  currentValue: number;
  createdAt: string;
}

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProp, setEditingProp] = useState<Property | null>(null);
  const [form, setForm] = useState({
    title: "",
    address: "",
    type: "Apartment",
    currentValue: "",
  });

  const fetchProperties = async () => {
    setLoading(true);
    const res = await fetch("/api/properties");
    const json = await res.json();
    if (json.success) setProperties(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleEdit = (prop: Property) => {
    setEditingProp(prop);
    setForm({
      title: prop.title,
      address: prop.address,
      type: prop.type,
      currentValue: prop.currentValue.toString(),
    });
    setShowModal(true);
  };

  const handleNew = () => {
    setEditingProp(null);
    setForm({ title: "", address: "", type: "Apartment", currentValue: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.address || !form.currentValue) return;

    if (editingProp) {
      await fetch(`/api/properties/${editingProp.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    setShowModal(false);
    fetchProperties();
  };

  const handleDelete = async (prop: Property) => {
    if (!confirm(`Delete "${prop.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/properties/${prop.id}`, { method: "DELETE" });
    const json = await res.json();
    if (json.error) alert(json.error);
    else fetchProperties();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Properties</h2>
          <p className="text-slate-500">Manage property listings available for mortgage applications</p>
        </div>
        <Button onPress={handleNew} variant="primary">
          + Add Property
        </Button>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : properties.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No properties listed yet.</div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Property listings">
                  <TableHeader>
                    <TableColumn isRowHeader>PROPERTY</TableColumn>
                    <TableColumn>ADDRESS</TableColumn>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>VALUE</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={properties}>
                    {(prop) => (
                      <TableRow key={prop.id}>
                        <TableCell>
                          <p className="font-medium text-slate-800">{prop.title}</p>
                        </TableCell>
                        <TableCell className="text-slate-500">{prop.address}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-slate-100 rounded-full text-xs font-medium text-slate-800">{prop.type}</span>
                        </TableCell>
                        <TableCell className="font-medium text-slate-800">{formatCurrency(prop.currentValue)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onPress={() => handleEdit(prop)}>Edit</Button>
                            <Button size="sm" variant="danger" onPress={() => handleDelete(prop)}>Delete</Button>
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
                <Modal.Heading>{editingProp ? "Edit Property" : "Add Property"}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="e.g., 3-Bedroom Apartment at Lekki Phase 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Full property address"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                      <select
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={form.type}
                        onChange={(e) => setForm({ ...form, type: e.target.value })}
                      >
                        <option>Apartment</option>
                        <option>Detached House</option>
                        <option>Semi-Detached House</option>
                        <option>Terrace</option>
                        <option>Duplex</option>
                        <option>Flat</option>
                        <option>Land</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Current Value (₦) *</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        value={form.currentValue}
                        onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
                        placeholder="45000000"
                      />
                    </div>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setShowModal(false)}>Cancel</Button>
                <Button variant="primary" onPress={handleSave}>{editingProp ? "Update" : "Create"}</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
