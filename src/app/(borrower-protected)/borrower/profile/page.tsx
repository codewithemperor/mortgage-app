"use client";

import { useEffect, useState } from "react";
import { Card, Button, Separator, TextField, Input, Label } from "@heroui/react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ApiResponse } from "@/types";

interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  nin: string | null;
  occupation: string | null;
  employer: string | null;
  monthlyIncome: number;
  createdAt: Date;
}

export default function BorrowerProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ phone: "", address: "", occupation: "", employer: "" });
  const [editMsg, setEditMsg] = useState("");

  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/borrower/profile");
        const json: ApiResponse<Profile> = await res.json();
        if (json.success && json.data) {
          setProfile(json.data);
          setEditForm({
            phone: json.data.phone,
            address: json.data.address,
            occupation: json.data.occupation || "",
            employer: json.data.employer || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditMsg("");
    try {
      const res = await fetch("/api/borrower/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (json.success) {
        setEditing(false);
        const profileRes = await fetch("/api/borrower/profile");
        const profileJson = await profileRes.json();
        if (profileJson.success) {
          setProfile(profileJson.data);
          setEditForm({
            phone: profileJson.data.phone,
            address: profileJson.data.address,
            occupation: profileJson.data.occupation || "",
            employer: profileJson.data.employer || "",
          });
        }
        setEditMsg("Profile updated successfully!");
      } else {
        setEditMsg(json.error || "Failed to update profile");
      }
    } catch {
      setEditMsg("An error occurred. Please try again.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg("");

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMsg("New passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordMsg("New password must be at least 6 characters");
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/borrower/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPasswordMsg("Password changed successfully!");
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPasswordMsg(json.error || "Failed to change password");
      }
    } catch {
      setPasswordMsg("An error occurred. Please try again.");
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <Card><Card.Content className="h-40" /></Card>
      </div>
    );
  }

  if (!profile) {
    return <p className="text-slate-500">Profile not found.</p>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">My Profile</h2>
        <p className="text-sm text-slate-500">View and update your personal information</p>
      </div>

      {/* Personal Information */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header className="flex flex-row items-center justify-between">
          <p className="font-semibold text-slate-800">Personal Information</p>
          <Button size="sm" variant="outline" onPress={() => setEditing(!editing)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
        </Card.Header>
        <Card.Content>
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {editMsg && (
                <div className={`text-sm p-3 rounded-lg ${editMsg.includes("successfully") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                  {editMsg}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">First Name</p>
                  <p className="text-sm font-medium text-slate-800">{profile.firstName}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Last Name</p>
                  <p className="text-sm font-medium text-slate-800">{profile.lastName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-sm text-slate-800">{profile.email}</p>
              </div>
              <TextField value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} isRequired>
                <Label>Phone Number</Label>
                <Input placeholder="Enter phone number" />
              </TextField>
              <TextField value={editForm.address} onChange={(v) => setEditForm((p) => ({ ...p, address: v }))} isRequired>
                <Label>Address</Label>
                <Input placeholder="Enter address" />
              </TextField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextField value={editForm.occupation} onChange={(v) => setEditForm((p) => ({ ...p, occupation: v }))}>
                  <Label>Occupation</Label>
                  <Input placeholder="Enter occupation" />
                </TextField>
                <TextField value={editForm.employer} onChange={(v) => setEditForm((p) => ({ ...p, employer: v }))}>
                  <Label>Employer</Label>
                  <Input placeholder="Enter employer" />
                </TextField>
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="primary">Save Changes</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">First Name</span>
                  <span className="text-sm font-medium text-slate-800">{profile.firstName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-500">Last Name</span>
                  <span className="text-sm font-medium text-slate-800">{profile.lastName}</span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Email</span>
                <span className="text-sm text-slate-800">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Phone</span>
                <span className="text-sm text-slate-800">{profile.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Address</span>
                <span className="text-sm text-slate-800 text-right max-w-[200px]">{profile.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">NIN</span>
                <span className="text-sm text-slate-800">{profile.nin || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Occupation</span>
                <span className="text-sm text-slate-800">{profile.occupation || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Employer</span>
                <span className="text-sm text-slate-800">{profile.employer || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Monthly Income</span>
                <span className="text-sm font-medium text-slate-800">{formatCurrency(profile.monthlyIncome)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-500">Registered</span>
                <span className="text-sm text-slate-800">{formatDate(profile.createdAt)}</span>
              </div>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Change Password */}
      <Card className="border border-slate-200 shadow-sm">
        <Card.Header><p className="font-semibold text-slate-800">Change Password</p></Card.Header>
        <Card.Content>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            {passwordMsg && (
              <div className={`text-sm p-3 rounded-lg ${passwordMsg.includes("successfully") ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                {passwordMsg}
              </div>
            )}
            <TextField value={passwordForm.currentPassword} onChange={(v) => setPasswordForm((p) => ({ ...p, currentPassword: v }))} isRequired>
              <Label>Current Password</Label>
              <Input type="password" placeholder="Enter current password" />
            </TextField>
            <TextField value={passwordForm.newPassword} onChange={(v) => setPasswordForm((p) => ({ ...p, newPassword: v }))} isRequired>
              <Label>New Password</Label>
              <Input type="password" placeholder="Enter new password" />
            </TextField>
            <TextField value={passwordForm.confirmPassword} onChange={(v) => setPasswordForm((p) => ({ ...p, confirmPassword: v }))} isRequired>
              <Label>Confirm New Password</Label>
              <Input type="password" placeholder="Confirm new password" />
            </TextField>
            <div className="flex justify-end">
              <Button type="submit" variant="primary" isDisabled={passwordLoading}>
                {passwordLoading ? "Changing..." : "Change Password"}
              </Button>
            </div>
          </form>
        </Card.Content>
      </Card>
    </div>
  );
}
