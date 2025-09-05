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
  { time: "2:00 AM", sales: 1 },
  { time: "6:00 AM", sales: 20 },
  { time: "10:00 AM", sales: 0 },
  { time: "2:00 PM", sales: 16 },
  { time: "6:00 PM", sales: 1 },
  { time: "8:00 PM", sales: 0 },
  { time: "10:00 PM", sales: 0 },
];

export default function CustomerGraph() {
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
          </div>
  );
}
