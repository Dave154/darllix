import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { ShoppingBag, Package, CreditCard } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MdKeyboardArrowDown } from "react-icons/md";
import { BsPeople } from "react-icons/bs";

const data = [
  { time: "12:00 AM", sales: 0 },
  { time: "2:00 AM", sales: 0 },
  { time: "6:00 AM", sales: 0 },
  { time: "10:00 AM", sales: 0 },
  { time: "2:00 PM", sales: 0 },
  { time: "6:00 PM", sales: 0 },
  { time: "8:00 PM", sales: 0 },
  { time: "10:00 PM", sales: 0 },
];

function daysBetween(a, b) {
  return (b - a) / (1000 * 60 * 60 * 24);
}

function formatNumber(n) {
  return n?.toLocaleString?.() ?? String(n);
}

export default function SalesDashboard({ dashboardInfo = {}, store = {} }) {
  // delivered-statuses to consider (adjust if your app uses different status names)
  const deliveredStatuses = new Set(["delivered", "completed", "fulfilled"]);

 console.log(dashboardInfo)
  const ordersRaw = Array.isArray(dashboardInfo?.order?.orders)
    ? dashboardInfo?.order?.orders
    : Array.isArray(dashboardInfo?.order?.orders)
    ? dashboardInfo?.order?.orders
    : [];

  // Filter delivered orders and ensure we only use those with created_at
  const deliveredOrders = ordersRaw
    .filter((o) => {
      const s = String(o.status || o.payment_status || "").toLowerCase();
      return deliveredStatuses.has(s) && o.created_at;
    })
    .map((o) => ({ ...o })); // clone to avoid surprises

  // sort delivered orders chronologically (oldest first)
  const deliveredSorted = deliveredOrders.slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  const deliveredCount = deliveredSorted.length;

  // milestones for orders (highest first)
  const orderMilestones = [
    { count: 1000, label: "🚀 1,000 orders delivered!" },
    { count: 100, label: "🔥 100 orders delivered!" },
    { count: 1, label: "🎉 First order delivered!" },
  ];

  const now = new Date();
  const RECENT_DAYS = 7;

  // find the highest-priority order milestone that occurred within the last 7 days
  let recentOrderMilestone = null;
  for (const m of orderMilestones) {
    if (deliveredCount >= m.count) {
      const milestoneOrder = deliveredSorted[m.count - 1]; // nth delivered order (1-indexed)
      if (milestoneOrder && milestoneOrder.created_at) {
        const milestoneDate = new Date(milestoneOrder.created_at);
        const diffDays = daysBetween(milestoneDate, now);
        if (diffDays <= RECENT_DAYS) {
          recentOrderMilestone = {
            ...m,
            date: milestoneDate,
            diffDays,
            count: m.count,
          };
          break; // highest priority reached, stop
        }
      }
    }
  }

  // store creation milestone (if store created_at exists and within RECENT_DAYS)
  let storeCreationMilestone = null;
  if (store?.created_at) {
    const createdAt = new Date(store.created_at);
    const diffDays = daysBetween(createdAt, now);
    if (diffDays <= RECENT_DAYS) {
      storeCreationMilestone = {
        label: "🎉 Congratulations on creating your store!",
        date: createdAt,
        diffDays,
      };
    }
  }

  // Decide which milestone to show:
  // Order milestones win over store creation (per your requirement)
  const milestoneToShow = recentOrderMilestone || storeCreationMilestone || null;

  // Compose friendly message text for order milestones
  function milestoneMessage(m) {
    if (!m) return null;
    if (m.count === 1) {
      return `🎉 You delivered your very first order ${m.diffDays <= 0 ? "today" : `${Math.round(m.diffDays)} day(s) ago`} — nice work!`;
    }
    // For numeric milestones (100, 1000)
    return `${m.label} (${formatNumber(m.count)}) — reached ${m.diffDays <= 0 ? "today" : `${Math.round(m.diffDays)} day(s) ago`}.`;
  }

  return (
    <div className="bg-white rounded-md shadow-sm p-4 space-y-4">
      {/* Header row with dropdown */}
      <div className="flex justify-between items-center">
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant=""
              size="sm"
              className="text-sm font-medium bg-color4 outline-none text-color3 hover:bg-gray-100"
            >
              Today <MdKeyboardArrowDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Today</DropdownMenuItem>
            <DropdownMenuItem>Yesterday</DropdownMenuItem>
            <DropdownMenuItem>This Week</DropdownMenuItem>
            <DropdownMenuItem>This Month</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
        <span className="text-xl">Dashboard</span>
      </div>

      {/* Top row stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-100 p-3 rounded-md">
          <p className="text-gray-500 text-xs">Total sales</p>
          <p className="text-xl font-semibold flex justify-center items-center gap-1">₦{dashboardInfo?.order?.totalSales.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Orders</p>
          <p className="text-xl font-semibold flex justify-center items-center gap-1">
            <ShoppingBag className="w-4 h-4 text-blue-600" /> {dashboardInfo?.order?.total}
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Customers</p>
          <p className="text-xl font-semibold flex justify-center items-center gap-1">
            <BsPeople className="w-5 h-5 text-blue-600" /> {Array.isArray(dashboardInfo.customer) ? dashboardInfo.customer.length : (dashboardInfo.customers?.length ?? 0)}
          </p>
        </div>
      </div>

      {/* Graph */}
      {/* <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -30, bottom: 0 }}>
            <CartesianGrid stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis stroke="#9ca3af" tick={{ fontSize: 10 }} tickMargin={4} />
            <Tooltip />
            <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
          </LineChart>
        </ResponsiveContainer>
      </div> */}

      {/* Milestone message */}
      {dashboardInfo && (
        <div className="p-4 bg-gray-50 rounded-md shadow-sm">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            {milestoneToShow ? (
              <>
                {/* show the milestone label/message */}
                <span>{recentOrderMilestone ? milestoneMessage(recentOrderMilestone) : storeCreationMilestone?.label}</span>
              </>
            ) : (
              <>You're doing great — no new milestones this week.</>
            )}
          </h3>
          <p className="text-gray-600 text-xs mt-1">
            You’re building something really special. Take a moment to reflect on your progress and the hours of hard work that got you here.
          </p>
        </div>
      )}
    </div>
  );
}
