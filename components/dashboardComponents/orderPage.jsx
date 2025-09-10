// pages/dashboard/orders/[id].jsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import DashboardLayout from "./dashboardLayout";
import { withAuth } from "../../lib/withAuth";
import { ArrowLeftCircle, Check, CheckCircle2 } from "lucide-react";
import AreYouSureModal from "./areYouSure";

export default function OrderPage({ store }) {
    const router = useRouter();
    const { id } = router.query;
    const [order, setOrder] = useState(null);
    const [markascompleted,setMarkascompleted] =useState(false)
    const [marking,setMarking] = useState(false)
  const [loading, setLoading] = useState(true);
  const [customer, setCustomer] = useState({});

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders?id=${id}`);
        const json = await res.json();
        if (json.order) {
          setOrder(json.order);
          const customerRes = await fetch(`/api/customers?id=${json.order.buyer_id}`);
          const customerData = await customerRes.json();
          setCustomer(customerData.customer || {});
        }
      } catch (err) {
        console.error("fetchOrder error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-1/3 rounded-lg" />
          <Skeleton className="h-6 w-full rounded-md" />
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-6 w-2/3 rounded-md" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <p className="text-center text-gray-500 mt-10 text-lg">❌ Order not found</p>
      </DashboardLayout>
    );
  }
const handleCompleted = async () => {
  setMarking(true);
  try {
    const res = await fetch(`/api/orders`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: {
          id: order.id,       
          status: "delivered" 
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to mark order as delivered");
    }

    const data = await res.json();
    console.log(data)
        setMarking(false);
   router.push('/dashboard/orders')
  } catch (error) {
    console.error("Error marking order delivered:", error);
  } finally {
    setMarking(false);
  }
};

  return (
    <DashboardLayout>
        <AreYouSureModal
            open= {markascompleted}
            onClose={()=>setMarkascompleted(false)}
            onConfirm={handleCompleted}
            title = "Mark as Completed"
            description = "Do this only when the buyers as recieved product"
            loading = {marking}
            safe
        />
        <div className="flex justify-between">
            <ArrowLeftCircle className="cursor-pointer" onClick={()=>{
                router.push('/dashboard/orders')
            }} />
            <div className="">
                <Button onClick={()=>setMarkascompleted(true)} >
                    <CheckCircle2 className="text-emerald-300" />
                    Mark as Completed
                </Button>
            </div>
        </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       
        {/* Order Details */}
        <Card className="shadow-sm border">
          <CardHeader className="font-semibold text-lg">🛒 Order Details</CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Order ID:</span> {order.id}</p>
            <p><span className="font-medium">Status:</span> <span className="capitalize">{order.status}</span></p>
            <p><span className="font-medium">Placed At:</span> {new Date(order.created_at).toLocaleString()}</p>
            <p><span className="font-medium">Total:</span> <span className="font-semibold text-green-600">${order.total}</span></p>
          </CardContent>
        </Card>

        {/* Customer Details */}
        <Card className="shadow-sm border">
          <CardHeader className="font-semibold text-lg">👤 Customer Details</CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Name:</span> {customer.name || "—"}</p>
            <p><span className="font-medium">Email:</span> {customer.email || "—"}</p>
            <p><span className="font-medium">Phone:</span> {customer.phone || "—"}</p>
            <p><span className="font-medium">Address:</span> {customer.address || "—"}</p>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="shadow-sm border lg:col-span-2">
          <CardHeader className="font-semibold text-lg">📦 Order Items</CardHeader>
          <CardContent className="divide-y text-sm">
            {order.order_items?.length ? (
              order.order_items.map((item) => (
                <div key={item.id} className="flex justify-between py-3">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <span className="font-semibold">${item.unit_price}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No items in this order</p>
            )}
          </CardContent>
        </Card>

        {/* Summary */}
        <Card className="shadow-sm border lg:col-span-2">
          <CardHeader className="font-semibold text-lg">📊 Summary</CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p><span className="font-medium">Subtotal:</span> ${order.subtotal}</p>
            <p><span className="font-medium">Discount:</span> ${order.discount ?? 0}</p>
            <p><span className="font-medium">Payment Method:</span> {order.payment_method}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withAuth();
