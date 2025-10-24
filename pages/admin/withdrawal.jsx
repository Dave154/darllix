import { useState, useMemo, useEffect } from "react";
import { useSupabaseClient } from "@supabase/auth-helpers-react";

function formatCurrency(n) {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(n);
}

function copy(text) {
  if (!navigator?.clipboard) return;
  navigator.clipboard.writeText(text);
}

export default function WithdrawalsList({ initialWithdrawals = null, onChange = null }) {




  const [withdrawals, setWithdrawals] = useState([]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all"); // all, pending, completed
  const [selected, setSelected] = useState(null); // item for details modal
  const [page, setPage] = useState(1);
  const supabase = useSupabaseClient()
  const PER_PAGE = 6;


    const fetchWithdrawals =async()=>{
    try {
    const { data, error } = await supabase
      .from("withdrawalRequest")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    setWithdrawals(data)
    console.log(data)
    return data;
  } catch (error) {
    console.error("Error fetching withdrawal requests:", error.message);
    return [];
  }
  }

  useEffect(()=>{
      fetchWithdrawals()
  },[])


  
  const handleUpdate = (next) => {
    setWithdrawals(next);
    if (typeof onChange === "function") onChange(next);
  };

  const markComplete = async (id) => {
  try {
    // update Supabase first
    const { data, error } = await supabase
      .from("withdrawalRequest")
      .update({ status: "completed" })
      .eq("id", id)
      .select();

    if (error) throw error;

    // update local state
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: "completed" } : w))
    );

    console.log("Withdrawal marked as completed:", data);
  } catch (err) {
    console.error("Failed to mark as complete:", err.message);
    alert("Something went wrong while updating status");
  }
};



  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return withdrawals
      .filter((w) => (filter === "all" ? true : w.status === filter))
      .filter(
        (w) =>
          !q ||
          String(w.accountnumber).includes(q) ||
          (w.accountname || "").toLowerCase().includes(q) ||
          (w.bankname || "").toLowerCase().includes(q) ||
          (w.paymentreference || "").toLowerCase().includes(q) ||
          String(w.amount).includes(q)
      )
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [withdrawals, query, filter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const pageItems = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-7xl">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-2xl font-semibold text-gray-800">Withdrawal requests</h2>
            <p className="text-sm text-gray-500 mt-1">Review payouts, verify details, and mark as complete.</p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-2 items-center">
                <input
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  placeholder="Search by name, account, bank, reference or amount"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                />
                <select
                  className="px-3 py-2 rounded-lg border border-gray-200"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                  }}
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => {
                    // copy visible list as CSV for quick export
                    const rows = [["Account name", "Account number", "Bank", "Amount", "Reference", "Date", "Status"]];
                    filtered.forEach((w) =>
                      rows.push([
                        `"${w.accountname}"`,
                        w.accountnumber,
                        w.bankname,
                        w.amount,
                        w.paymentreference,
                        w.date,
                        w.status,
                      ])
                    );
                    const csv = rows.map((r) => r.join(",")).join("\n");
                    copy(csv);
                    alert("Visible rows copied to clipboard as CSV");
                  }}
                  className="px-3 py-2 bg-gray-100 rounded-lg text-sm"
                >
                  Export CSV
                </button>

                <div className="text-sm text-gray-500">Showing {filtered.length} requests</div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full table-auto text-left">
                <thead>
                  <tr className="text-sm text-gray-600">
                    <th className="p-3">Account name</th>
                    <th className="p-3">Account number</th>
                    <th className="p-3">Bank</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Reference</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Status</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 && (
                    <tr>
                      <td colSpan="8" className="p-6 text-center text-gray-500">
                        No requests found
                      </td>
                    </tr>
                  )}

                  {pageItems.map((w) => (
                    <tr key={w.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 align-top">
                        <div className="font-medium">{w.accountname}</div>
                        {/* <div className="text-xs text-gray-500 mt-1">{w.notes}</div> */}
                      </td>

                      <td className="p-3 align-top">
                        <div>{w.accountnumber}</div>
                        <button
                          onClick={() => {
                            copy(w.accountnumber);
                            alert("Account number copied");
                          }}
                          className="text-xs text-blue-600 mt-1"
                        >
                          Copy
                        </button>
                      </td>

                      <td className="p-3 align-top">{w.bankname}</td>

                      <td className="p-3 align-top font-semibold">{formatCurrency(w.amount)}</td>

                      <td className="p-3 align-top">
                        <div>{w.paymentneference}</div>
                        <button
                          onClick={() => {
                            copy(w.paymentreference);
                            alert("Reference copied");
                          }}
                          className="text-xs text-blue-600 mt-1"
                        >
                          Copy
                        </button>
                      </td>

                      <td className="p-3 align-top">{w.date.split('T')[0]}</td>

                      <td className="p-3 align-top">
                        <span
                          className={`px-3 py-1 text-xs rounded-full font-medium ${
                            w.status === "completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>

                      <td className="p-3 align-top text-right">
                        <div className="flex items-center justify-end gap-2">
                          {w.status !== "completed" && (
                            <button
                              onClick={() => markComplete(w.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                            >
                              Mark complete
                            </button>
                          )}

                          <button
                            onClick={() => setSelected(w)}
                            className="px-3 py-1 bg-white border text-sm rounded-md hover:bg-gray-50"
                          >
                            Details
                          </button>

                          
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 bg-white border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* details modal */}
        {selected && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative">
              <button
                onClick={() => setSelected(null)}
                className="absolute top-4 right-4 text-gray-500"
              >
                Close
              </button>

              <h3 className="text-xl font-semibold mb-4">Withdrawal details</h3>

              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Account name</div>
                  <div className="font-medium">{selected.accountname}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Account number</div>
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{selected.accountnumber}</div>
                    <button
                      onClick={() => {
                        copy(selected.accountnumber);
                        alert("Account number copied");
                      }}
                      className="text-sm text-blue-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Bank</div>
                  <div className="font-medium">{selected.bankname}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="font-medium">{formatCurrency(selected.amount)}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Payment reference</div>
                  <div className="flex items-center gap-3">
                    <div className="font-medium">{selected.paymentreference}</div>
                    <button
                      onClick={() => {
                        copy(selected.paymentreference);
                        alert("Reference copied");
                      }}
                      className="text-sm text-blue-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Date</div>
                  <div className="font-medium">{selected.date.split('T')[0]}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="font-medium">{selected.status}</div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Notes</div>
                  <div className="font-medium whitespace-pre-wrap">{selected.notes}</div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                {selected.status !== "completed" && (
                  <button
                    onClick={() => {
                      markComplete(selected.id);
                      setSelected(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded"
                  >
                    Mark complete
                  </button>
                )}

                

                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-gray-100 rounded">
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
