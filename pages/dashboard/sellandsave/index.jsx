// pages/dashboard/sell-save.jsx
"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, RefreshCcw } from "lucide-react";
import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";
import { toast } from "sonner";
import { withAuth } from "../../../lib/withAuth";

function TopBalanceCard({ balance, setBalance, onWithdraw, withdrawing, onRefresh }) {
  return (
    <div className="rounded-2xl bg-gradient-to-b from-white/60 to-white/30 backdrop-blur-md border border-white/10 p-6 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-slate-600">Spend & Save</div>
        {/* <div>
          <button
            onClick={onRefresh}
            title="Refresh"
            className="p-2 rounded-md hover:bg-slate-50"
            aria-label="Refresh"
          >
            <RefreshCcw className="w-4 h-4 text-slate-600" />
          </button>
        </div> */}
      </div>
      <div className="mt-6 rounded-xl bg-gradient-to-b from-indigo-50 to-white p-6 border border-indigo-100 shadow-sm flex flex-col items-center gap-4">
        <div className="text-sm text-slate-500">Balance</div>
         <div className="flex gap-1 justify-center items-center">
            <span className="text-3xl md:text-4xl bg-transparent outline-none font-extrabold text-indigo-700"> ₦</span>
          <input type="number"
                value={Number(balance || 0).toFixed(2)}
                className='text-3xl md:text-4xl bg-transparent w-full text-center outline-none font-extrabold text-indigo-700 '
                onChange={(e)=>setBalance(Number(e.target.value || 0).toFixed(2))}
            />


            </div> 
        <div className="text-sm text-slate-500 text-center">A percentage is tucked away every time an order is released.</div>
        <div className="w-full">
          <Button
            onClick={onWithdraw}
            className="w-full h-12 bg-indigo-700 hover:bg-indigo-800 text-white font-semibold shadow-md"
            aria-label="Withdraw balance"
            disabled={withdrawing || (Number(balance || 0) <= 0)}
          >
            {withdrawing ? "Processing…" : "Withdraw"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PercentagePicker({ value, onChange }) {
  const setPct = (v) => onChange(Math.max(0, Math.min(100, Math.round(v * 10) / 10)));
  const presets = [5, 10, 16, 20, 50, 70, 100];

  return (
    <div className="rounded-2xl bg-white/70 border border-slate-100 p-6 shadow-[0_6px_20px_rgba(2,6,23,0.04)]">
      <div className="text-sm font-semibold text-slate-700 mb-3">Percentage to save</div>

      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setPct(value - 1)}
          className="w-12 h-12 rounded-lg border bg-white flex items-center justify-center text-xl font-bold shadow-sm hover:scale-105 transition"
          aria-label="Decrease percent"
        >
          −
        </button>

        <div className="min-w-[140px] text-center">
          <div className="text-2xl md:text-3xl font-extrabold text-indigo-700">{value.toFixed(1)}%</div>
          <div className="text-xs text-slate-400 mt-1">of each transaction</div>
        </div>

        <button
          onClick={() => setPct(value + 1)}
          className="w-12 h-12 rounded-lg border bg-white flex items-center justify-center text-xl font-bold shadow-sm hover:scale-105 transition"
          aria-label="Increase percent"
        >
          +
        </button>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setPct(p)}
            className={`py-2 rounded-lg text-sm font-medium transition ${
              Math.abs(value - p) < 0.01 ? "bg-indigo-600 text-white shadow-md" : "bg-white border hover:bg-slate-50 text-slate-700"
            }`}
            aria-pressed={Math.abs(value - p) < 0.01}
          >
            {p}%
          </button>
        ))}
      </div>
    </div>
  );
}

function OverviewCard({ percentage, activated, source }) {
  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardHeader className="flex items-center justify-between">
        <div className="text-sm font-semibold">Overview</div>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-slate-500">Current percentage</div>
        <div className="text-2xl md:text-3xl font-bold text-indigo-700 mt-2">{percentage.toFixed(1)}%</div>

        <div className="mt-4 flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${activated ? "bg-emerald-100 text-emerald-700" : "bg-yellow-100 text-yellow-700"}`}>
            {activated ? "Active" : "Inactive"}
          </div>
          <div className="text-sm text-slate-500">Funding: <span className="font-medium text-slate-700 ml-1">{source}</span></div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentActivities({ activities = [] }) {
  return (
    <Card className="rounded-2xl overflow-hidden">
      <CardHeader >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Recent activities</div>
          <div className="text-sm text-indigo-600 cursor-pointer">View all</div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 && <div className="text-sm text-slate-500">No recent activity</div>}
          {activities.map((a) => (
            <div key={a.id} className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-700 font-semibold">
                  {a.title.split(" ").slice(0,2).map(s => (s?.[0] || "")).join("").toUpperCase()}
                </div>
              </div>
              <div className="flex-1">
                <div className="font-medium text-slate-800">{a.title}</div>
                <div className="text-xs text-slate-500 mt-1">{new Date(a.when).toLocaleString()}</div>
              </div>
              <div className="text-sm text-slate-500">{a.meta}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function SellSavePage({store}) {
  const [balance, setBalance] = useState(0.0);
  const [percentage, setPercentage] = useState(16.0);
  const [source, setSource] = useState("Darllix Wallet");
  const [activated, setActivated] = useState(false);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingActivate, setLoadingActivate] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  
  const fetchData = useCallback(async () => {
      setLoading(true);
      try {
      console.log(store)
    if (store) {
      setPercentage(Number(store.sell_save_percentage ?? 0));
      setBalance(Number(store.sell_save_balance ?? 0));
      setActivated(Number(store.sell_save_percentage ?? 0) > 0);
      setSource("Store revenue");
    }
  } catch (err) {
    console.error("fetchData error", err);
    toast.error("Failed to load spend & save data");
  } finally {
    setLoading(false);
  }
}, [store]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Activate / save percentage
  async function handleActivate() {
    setLoadingActivate(true);
    
    try {
        const storeId= store?.id
      // call backend to set sell_save percentage
      const res = await fetch("/api/stores/sell-save", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ storeId , percentage }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || json?.message || "Failed to update percentage");
      }
      setActivated(Number(json?.store?.sell_save_percentage ?? percentage) > 0);
      toast.success("Spend & Save updated");
      setActivities((prev) => [
        { id: String(Date.now()), title: `Spend & Save set to ${percentage}%`, when: Date.now(), meta: "" },
        ...prev,
      ]);
    } catch (err) {
      console.error(err);
      toast.error(err?.message || "Activation failed");
    } finally {
      setLoadingActivate(false);
    }
  }

  async function handleWithdraw() {
    if (Number(balance || 0) <= 0) {
      toast.error("No balance to withdraw");
      return;
    }
    if (!confirm(`Request withdrawal of ₦${Number(balance).toFixed(2)} to your saved account?`)) return;
    setWithdrawing(true);
    try {
      const res = await fetch("/api/wallet/withdraw", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ storeId:store?.id, amount: Number(balance) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || json?.message || "Withdraw request failed");
      toast.success("Withdrawal requested");
      // optimistic update
      setActivities((prev) => [
        { id: String(Date.now()), title: `Withdrawal requested`, when: Date.now(), meta: `₦${Number(balance).toFixed(2)}` },
        ...prev,
      ]);
      setBalance(0);
    } catch (err) {
      console.error("withdraw error", err);
      toast.error(err?.message || "Withdraw failed");
    } finally {
      setWithdrawing(false);
    }
  }

  const handleRefresh = () => fetchData();

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left column: main controls */}
          <div className="flex-1 space-y-6">
            {/* {store.sell_save_balance} */}
            <TopBalanceCard balance={balance} setBalance={setBalance} onWithdraw={handleWithdraw} withdrawing={withdrawing} onRefresh={handleRefresh} />

            <PercentagePicker value={percentage} onChange={setPercentage} />

            <div>
              <Button
                onClick={handleActivate}
                className={`w-full h-14 text-white font-semibold ${activated ? "bg-emerald-600 hover:bg-emerald-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                disabled={loadingActivate}
              >
                {loadingActivate ? "Saving…" : activated ? "Activated" : "Activate Spend & Save"}
              </Button>
            </div>
          </div>

          {/* Right column: overview + activities (fixed width on md) */}
          <div className="lg:w-[420px] w-full flex flex-col gap-4">
            <div className="sticky top-6 space-y-4">
              <OverviewCard percentage={percentage} activated={activated} source={source} />

              {/* <RecentActivities activities={activities} /> */}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withAuth();