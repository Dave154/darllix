import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function DashboardMetrics() {


  const supabase = useSupabaseClient();
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    storeOwners: 0,
  });
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: "New Users",
        data: [],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  });
  const [loading, setLoading] = useState(false);

const router = useRouter()
useEffect(()=>{

  const logged =sessionStorage.getItem('admin')
  if(logged)return;
    router.push('/admin/login')
},[])
  async function fetchTableCounts() {
    setLoading(true)
    try {
      const [{ count: profilesCount }, { count: storesCount }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("stores").select("*", { count: "exact", head: true }),
      ]);

      setMetrics({
        totalUsers: profilesCount || 0,
        storeOwners: storesCount || 0,
      });
    } catch (err) {
      console.error("fetchTableCounts error", err);
      setMetrics((m) => ({ ...m }));
    }finally{
      setLoading(false)
    }
  }

  // fetch user created_at timestamps and prepare dataset grouped by month
  async function fetchUserGrowthData() {
    setLoading(true)
    try {
      const { data, error } = await supabase.from("profiles").select("created_at");
      if (error) throw error;
      if (!data || data.length === 0) {
        setChartData((c) => ({
          ...c,
          labels: [],
          datasets: [{ ...c.datasets[0], data: [] }],
        }));
        return;
      }

      // group by year-month key for correct chronological order
      const groups = data.reduce((acc, row) => {
        const dt = new Date(row.created_at);
        if (isNaN(dt)) return acc;
        const year = dt.getFullYear();
        const month = dt.getMonth() + 1; // 1-12
        const key = `${year}-${String(month).padStart(2, "0")}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      // sort keys chronologically
      const sortedKeys = Object.keys(groups).sort((a, b) => (a > b ? 1 : -1));

      // format labels like "Sep 2025" and map counts
      const labels = sortedKeys.map((key) => {
        const [year, month] = key.split("-");
        const dt = new Date(Number(year), Number(month) - 1, 1);
        return dt.toLocaleString("default", { month: "short", year: "numeric" }); // e.g. "Sep 2025"
      });

      const counts = sortedKeys.map((k) => groups[k]);

      setChartData((c) => ({
        ...c,
        labels,
        datasets: [{ ...c.datasets[0], data: counts }],
      }));
    } catch (err) {
      console.error("fetchUserGrowthData error", err);
      // keep previous chart state on error
    }finally{
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTableCounts()
    fetchUserGrowthData()
  }, [supabase]);

  const displayData =
    chartData.labels.length > 0
      ? chartData
      : {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
          datasets: [
            {
              ...chartData.datasets[0],
              data: [0, 0, 0, 0, 0, 0],
            },
          ],
        };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white w-full max-w-4xl p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">Platform Metrics</h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-100 text-center py-6 rounded-xl">
            <h3 className="text-3xl font-bold text-blue-700">{metrics.totalUsers}</h3>
            <p className="text-gray-600 mt-1">Total Users</p>
          </div>

          <div className="bg-green-100 text-center py-6 rounded-xl">
            <h3 className="text-3xl font-bold text-green-700">{metrics.storeOwners}</h3>
            <p className="text-gray-600 mt-1">Users with Store</p>
          </div>
        </div>
        <div className="w-full flex justify-between">
        <button className="px-2 py-1 capitalize shadow-sm bg-color1 rounded-md text-color4 font-semibold" onClick={()=> {
          fetchTableCounts()
          fetchUserGrowthData()
        }}>reload</button>
          <Link className="underline text-color1 text-xs" href={'/admin/withdrawal'}>Withdrawal List</Link>
        </div>
        <div className="bg-gray-50 p-4 rounded-xl">
          <Line data={displayData} />
          {loading && <p className="text-sm text-center mt-3">Loading metrics...</p>}
        </div>
      </div>
    </div>
  );
}
