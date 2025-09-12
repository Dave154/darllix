"use client";

import { useState, useEffect } from "react";
import { Pencil, Save, X } from "lucide-react";
import DashboardLayout from "@/components/dashboardComponents/dashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "../../../hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { toast } from "sonner";
import Loader from "../../../components/dashboardComponents/loader";

export default function ProfilePage() {
  const supabase = useSupabaseClient();

 const user = useUser()
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});


  useEffect(()=>{
    // console.log(user.profile !== null)
    if(user.profile !== null){

        setProfile(user.profile)
        setForm(user.profile)
        console.log(user.profile)
    }
  },[user, user.profile])

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
    console.log(user)
  if (!user.user || !user.user.id) {
    console.error("User or user ID not available. Cannot update profile.");
    return;
  }

  try {
    setLoading(true);
    console.log("Updating profile for user ID:", user.user.id);

    const { error } = await supabase
      .from("profiles")
      .update(form) 
      .eq("id", user.user.id); 

    if (error) throw error;
    toast.success("Profile updated successfully");
    setEditing(false)
  } catch (err) {
    console.error("Error updating profile:", err);
    toast.error("Error updating profile.");
  } finally {
    setLoading(false);
  }
};


  if (!profile) {
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
    <>
        {
            loading && <Loader/>
        }

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
          <Avatar className="w-24 h-24 text-2xl font-bold bg-black text-white shadow-md">
            <AvatarFallback className='bg-black'>{getInitials(profile.full_name)}</AvatarFallback>
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
      </div>
    </DashboardLayout>
              </>
  );
}
