"use client";

import { useState, useEffect } from "react";
import { Pencil, Save, X } from "lucide-react";
import DashboardLayout from "@/components/dashboardComponents/dashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    const fetchProfile = async () => {
      const res = await fetch("/api/profile");
      const data = await res.json();
      setProfile(data);
      setForm(data);
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (
      (parts[0][0] || "").toUpperCase() +
      (parts[parts.length - 1][0] || "").toUpperCase()
    );
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      const updated = await res.json();
      setProfile(updated);
      setForm(updated);
      setEditing(false);
    } else {
      console.error("Failed to save profile");
    }
  };

  if (false) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-black">My Profile</h1>
          {!editing ? (
            <Button
              onClick={() => setEditing(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                size="sm"
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
              <Button
                onClick={() => {
                  setForm(profile);
                  setEditing(false);
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="mb-6">
          <Avatar className="w-24 h-24 text-2xl font-bold bg-blue-600 text-white shadow-md">
            <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
          </Avatar>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-black">
          <div>
            <label className="text-sm font-medium text-black">Full Name</label>
            <Input
              name="full_name"
              value={form.full_name || ""}
              onChange={handleChange}
              disabled={!editing}
              className="h-14 text-base"

            />
          </div>
          <div>
            <label className="text-sm font-medium text-black">Email</label>
            <Input
              name="email"
              value={form.email || ""}
              onChange={handleChange}
              disabled
              className="h-14 text-base"

            />
          </div>
          <div>
            <label className="text-sm font-medium text-black">Phone</label>
            <Input
              name="phone"
              value={form.phone || ""}
              onChange={handleChange}
              disabled={!editing}
              className="h-14 text-base"

            />
          </div>
          <div>
            <label className="text-sm font-medium text-black">Bank Name</label>
            <Input
              name="bank_name"
              value={form.bank_name || ""}
              onChange={handleChange}
              disabled={!editing}
              className="h-14 text-base"

            />
          </div>
          <div>
            <label className="text-sm font-medium text-black">Account Number</label>
            <Input
              name="account_number"
              value={form.account_number || ""}
              onChange={handleChange}
              disabled={!editing}
              className="h-14 text-base"

            />
          </div>
          <div>
            <label className="text-sm font-medium text-black">Address</label>
            <Input
              name="address"
              value={form.address || ""}
              onChange={handleChange}
              disabled={!editing}
              className="h-14 text-base"

            />
          </div>
        </div>

        {/* Meta */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Last updated: {new Date(profile?.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </DashboardLayout>
  );
}
