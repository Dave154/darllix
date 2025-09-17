// pages/dashboard/capital.jsx
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createClient } from "@supabase/supabase-js";
import { useUser } from "../../../hooks/useUser";
import { withAuth } from "../../../lib/withAuth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function CapitalPage() {
  const {user, profile}= useUser()
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        if (!user) {
          setReason("You must be logged in.");
          setLoading(false);
          return;
        }
        // check store
        const { data: store } = await supabase
          .from("stores")
          .select("id, sell_save_percentage")
          .eq("owner_id", user.id)
          .single();

        if (!store) {
          setReason("Set up your store first.");
          setLoading(false);
          return;
        }

        if (!store.sell_save_percentage || store.sell_save_percentage <= 0) {
          setReason("Activate Sell & Save before requesting capital.");
          setLoading(false);
          return;
        }

        // check orders
        const { count } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("store_id", store.id)
          .eq("status", "completed");

        if ((count ?? 0) < 100) {
          setReason("You need at least 100 completed sales.");
          setLoading(false);
          return;
        }
        console.log(store,profile)

        setEligible(true);
      } catch (err) {
        console.error("eligibility error", err);
        setReason("Error checking eligibility.");
      } finally {
        setLoading(false);
      }
    };

    checkEligibility();
  }, [user,profile]);

  async function handleRequest() {
    setSending(true);
    try {
      const res = await fetch("/api/capital/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Request failed");
      toast.success("Capital request sent successfully!");
    } catch (err) {
      console.error("request error", err);
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-center min-h-[80vh] px-6">
        {loading ? (
          <p className="text-slate-500">Checking eligibility…</p>
        ) : !eligible ? (
          <div className="flex flex-col items-center text-center">
            <Image
              src="/darllix_logo.png"
              alt="Darllix"
              width={120}
              height={120}
              className="mb-6"
            />
            <span className="text-semibold text-3xl"> Darllix Capital </span>
            <p className="text-lg text-slate-700 font-medium">{reason}</p>
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              Darlix Capital
            </h2>
            <p className="text-slate-600 mb-8 text-center">
              Access extra capital to scale your store. Requests are reviewed by
              our team.
            </p>
            <Button
              onClick={handleRequest}
              className="w-full h-12 font-semibold text-lg"
              disabled={sending}
            >
              {sending ? "Sending…" : "Request Capital"}
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export const getServerSideProps = withAuth();