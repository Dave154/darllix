"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/store";
// import { useSupabaseClient } from "@supabase/auth-helpers-react";

export default function PaymentSuccess() {
  const { clearCart, resetCheckout } = useStore();
  // const supabase = useSupabaseClient();
  // Get the order ID from the URL query parameters
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [order, setOrder] = useState(null);
  const router = useRouter();

  useEffect(() => {
    clearCart();
  resetCheckout();
    if (!orderId) return;

    // const fetchOrder = async () => {
    //   const { data, error } = await supabase
    //     .from("orders")
    //     .select("*")
    //     .eq("id", orderId)
    //     .single();

    //   if (error) {
    //     console.error("Error fetching order:", error.message);
    //   } else {
    //     setOrder(data);
    //   }
    // };

    // fetchOrder();
  }, [orderId]);

  // if (!order) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <p>Loading your order...</p>
  //     </div>
  //   );
  // }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-color4 p-6">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="flex justify-center mb-6"
        >
          <CheckCircle2 className="w-20 h-20 text-green-500 drop-shadow-lg" />
        </motion.div>

        {/* Heading */}
        <h1 className="text-3xl font-extrabold text-gray-800 mb-2">
          Payment Successful 🎉
        </h1>
        <p className="text-gray-600 mb-6">
          Thank you for your purchase! Your order has been confirmed.
        </p>

        {/* Order Summary */}
        <Card className="bg-gray-50 rounded-xl w-full max-w-md p-4 space-y-2 mb-6 text-left">
          <div className="flex justify-between text-sm text-gray-700">
            <span className="font-medium">Order Number:</span>
            <span>{orderId}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700">
            <span className="font-medium">Amount Paid:</span>
            <span>₦{order?.total?.toLocaleString() || "______"}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-700">
            <span className="font-medium">Payment Method:</span>
            <span>{order?.paymentMethod || "Darllix Pay"}</span>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col items-center justify-center sm:flex-row gap-4 w-full max-w-md">
          <Button
            className="w-full sm:w-1/2 bg-color3 hover:bg-color3/90"
            onClick={() => router.push("/")}
          >
            Continue Shopping
          </Button>
          {/* <Button
            variant="outline"
            className="w-full sm:w-1/2"
            onClick={() => router.push("/orders")}
          >
            View Orders
          </Button> */}
        </div>
     
    </div>
  );
}
