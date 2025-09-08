"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { CheckCircle2, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/store";


export default function PaymentSuccess() {
  const { clearCart, resetCheckout } = useStore();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const router = useRouter();

  useEffect(() => {
    clearCart();
  resetCheckout();
    if (!orderId) return;

  }, [orderId]);



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
        <p className="text-gray-600 mb-6 text-center">
          Thank you for your purchase! Your order has been confirmed.
        </p>
        <div className="text-gray-400 text-sm flex items-center gap-2 mb-3">
           <p className="">
           Order Id: {orderId} 

           </p>
           
            <Copy className="cursor-pointer hover:text-black " onClick={()=>navigator.clipboard.writeText(orderId) }/>
            </div>

       
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
