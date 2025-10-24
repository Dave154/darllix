import { useState } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";

export default function DashboardMetrics() {
  const [metrics] = useState({
    totalUsers: 124,
    storeOwners: 47,
  });

  const data = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "New Users",
        data: [5, 9, 3, 7, 4, 6],
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white w-full max-w-4xl p-8 rounded-2xl shadow-lg">
        <h2 className="text-2xl font-semibold mb-6 text-center">
          Platform Metrics
        </h2>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-100 text-center py-6 rounded-xl">
            <h3 className="text-3xl font-bold text-blue-700">
              {metrics.totalUsers}
            </h3>
            <p className="text-gray-600 mt-1">Total Users</p>
          </div>

          <div className="bg-green-100 text-center py-6 rounded-xl">
            <h3 className="text-3xl font-bold text-green-700">
              {metrics.storeOwners}
            </h3>
            <p className="text-gray-600 mt-1">Users with Store</p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-xl">
          <Line data={data} />
        </div>
      </div>
    </div>
  );
}
