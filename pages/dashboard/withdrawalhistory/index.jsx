"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "../../../hooks/useUser";
import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";

export default function WithdrawalsPage() {
//   const [user, setUser] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
    const supabase = useSupabaseClient()
    const {user, profile } = useUser()

  const fetchWithdrawalsForUser = useCallback(async () => {
    const uid = user?.id;
    if (!uid) return [];

    try {
      const { data, error } = await supabase
        .from("withdrawalRequest")
        .select("id, owner_id, accountname, accountnumber, bankname, amount, paymentreference, date, status, created_at")
        .eq("owner_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setWithdrawals(data || [])
    } catch (err) {
      console.error("fetchWithdrawalsForUser error", err);
      throw err;
    }
  }, [supabase, user?.id]);

  useEffect(()=>{
    fetchWithdrawalsForUser()
  },[])

  if (loading) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-4">My Withdrawals</h1>
        <p>Loading withdrawals...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="p-6">
        <h1 className="text-2xl font-semibold mb-4">My Withdrawals</h1>
        <p>Please sign in to view your withdrawal requests.</p>
      </main>
    );
  }

  return (
    <DashboardLayout>

    <main className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">My Withdrawals</h1>
        <div>
          <button
            onClick={fetchWithdrawalsForUser}
            className="px-3 py-1 rounded-md border text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded border bg-red-50">
          <p className="text-sm text-red-700">Error: {error}</p>
        </div>
      )}

      {withdrawals.length === 0 ? (
        <div className="text-center p-6 border rounded">
          <p>No withdrawal requests found.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {withdrawals.map((w) => (
            <li key={w.id} className="border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-medium">{w.accountname || "Unknown account"}</p>
                  <p className="text-sm">{w.bankname} • {w.accountnumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₦{Number(w.amount).toLocaleString()}</p>
                  <p className="text-sm">{w.status}</p>
                </div>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                <p>Reference: {w.paymentreference}</p>
                <p>Date: {new Date(w.date || w.created_at).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
    </DashboardLayout>
  );
}
