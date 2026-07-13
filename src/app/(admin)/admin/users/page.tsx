"use client";

import { useEffect, useState } from "react";
import { Card, Table, TableHeader, TableBody, TableColumn, TableRow, TableCell, Chip, Button, Modal } from "@heroui/react";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "MANAGER" | "LOAN_OFFICER";
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { reviewedLoans: number; auditLogs: number };
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [addModal, setAddModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addRole, setAddRole] = useState("LOAN_OFFICER");
  const [addPassword, setAddPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    const json = await res.json();
    if (json.success) setUsers(json.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: UserItem) => {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditActive(user.isActive);
    setEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedUser) return;
    await fetch("/api/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: selectedUser.id,
        name: editName,
        role: editRole,
        isActive: editActive,
      }),
    });
    setEditModal(false);
    fetchUsers();
  };

  const handleAdd = async () => {
    if (!addName || !addEmail) return;
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: addName,
        email: addEmail,
        role: addRole,
        password: addPassword,
      }),
    });
    const json = await res.json();
    setSaving(false);
    if (json.success) {
      setAddModal(false);
      setAddName("");
      setAddEmail("");
      setAddRole("LOAN_OFFICER");
      setAddPassword("");
      fetchUsers();
    } else {
      alert(json.message || "Failed to create user");
    }
  };

  const roleColorMap: Record<string, "default" | "accent" | "success" | "warning" | "danger"> = {
    ADMIN: "danger",
    MANAGER: "warning",
    LOAN_OFFICER: "default",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">User Management</h2>
          <p className="text-slate-500">Manage staff accounts and permissions</p>
        </div>
        <Button variant="primary" onPress={() => setAddModal(true)}>+ Add User</Button>
      </div>

      <Card className="border border-slate-200 shadow-sm">
        <Card.Content className="p-0">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : (
            <Table>
              <Table.ScrollContainer>
                <Table.Content aria-label="Staff users">
                  <TableHeader>
                    <TableColumn isRowHeader>NAME</TableColumn>
                    <TableColumn>EMAIL</TableColumn>
                    <TableColumn>ROLE</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>REVIEWED LOANS</TableColumn>
                    <TableColumn>CREATED</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody items={users}>
                    {(user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-slate-800">{user.name}</TableCell>
                        <TableCell className="text-slate-500">{user.email}</TableCell>
                        <TableCell>
                          <Chip size="sm" color={roleColorMap[user.role] || "default"} variant="soft">
                            {user.role.replace(/_/g, " ")}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <Chip size="sm" color={user.isActive ? "success" : "danger"} variant="soft">
                            {user.isActive ? "Active" : "Disabled"}
                          </Chip>
                        </TableCell>
                        <TableCell className="text-slate-800">{user._count?.reviewedLoans || 0}</TableCell>
                        <TableCell className="text-slate-500">{formatDate(user.createdAt)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onPress={() => handleEdit(user)}>Edit</Button>
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

      <Modal isOpen={editModal} onOpenChange={setEditModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Edit User: {selectedUser?.name}</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="LOAN_OFFICER">Loan Officer</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editActive}
                      onChange={(e) => setEditActive(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Account is Active</label>
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setEditModal(false)}>Cancel</Button>
                <Button variant="primary" onPress={handleSave}>Save Changes</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>

      {/* Add User Modal */}
      <Modal isOpen={addModal} onOpenChange={setAddModal}>
        <Modal.Backdrop>
          <Modal.Container>
            <Modal.Dialog>
              <Modal.Header>
                <Modal.Heading>Add New User</Modal.Heading>
              </Modal.Header>
              <Modal.Body>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      placeholder="Enter email address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                    <select
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                    >
                      <option value="LOAN_OFFICER">Loan Officer</option>
                      <option value="MANAGER">Manager</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      value={addPassword}
                      onChange={(e) => setAddPassword(e.target.value)}
                      placeholder="Set initial password (default: password123)"
                    />
                  </div>
                </div>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="ghost" onPress={() => setAddModal(false)}>Cancel</Button>
                <Button variant="primary" onPress={handleAdd} isDisabled={saving}>{saving ? "Creating..." : "Create User"}</Button>
              </Modal.Footer>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
