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

export default function SalesDashboard() {
  return (
    <div className="bg-white rounded-md shadow-sm p-4 space-y-4">
      {/* Header row with dropdown */}
      <div className="flex justify-between items-center">
        <DropdownMenu>
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
        </DropdownMenu>
      </div>

      {/* Top row stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-gray-100 p-3 rounded-md"> 
          <p className="text-gray-500 text-xs">Total sales</p>
          <p className="text-xl font-semibold flex justify-center items-center gap-1">
            ₦0.00
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Orders</p>
          <p className="text-xl font-semibold flex justify-center items-center gap-1">
            <ShoppingBag className="w-4 h-4 text-blue-600" /> 0
          </p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">........</p>
          <p className="text-xl font-semibold flex justify-center items-center gap-1">
            0
          </p>
        </div>
      </div>

      {/* Graph */}
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 10, right: 20, left: -30, bottom: 0 }} 
          >
            <CartesianGrid stroke="#f3f4f6" vertical={false} />
            <XAxis dataKey="time" stroke="#9ca3af" tick={{ fontSize: 10 }} />
            <YAxis
              stroke="#9ca3af"
              tick={{ fontSize: 10 }}
              tickMargin={4} // keeps numbers readable without padding
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="sales"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 bg-gray-50 rounded-md shadow-sm flex items-center gap-2">
          <Package className="w-5 h-5 text-yellow-600" />
          <div>
            <p className="text-gray-500 text-xs">Orders to fulfill</p>
            <p className="font-bold text-sm">48</p>
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded-md shadow-sm flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-indigo-600" />
          <div>
            <p className="text-gray-500 text-xs">Payments to capture</p>
            <p className="font-bold text-sm">48</p>
          </div>
        </div>
      </div>

      {/* Milestone message */}
      <div className="p-4 bg-gray-50 rounded-md shadow-sm">
        <h3 className="font-semibold text-sm flex items-center gap-2">
          🎉 Congratulations on reaching 100 orders!
        </h3>
        <p className="text-gray-600 text-xs mt-1">
          You’re building something really special. Take a moment to reflect on
          your progress and the countless hours of hard work that got you here.
        </p>
      </div>
    </div>
  );
}
