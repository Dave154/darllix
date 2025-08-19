"use client";
import { useStore } from "@/store";
import Background from "./storeBg";
import CheckoutStepper from "@/components/checkoutStepper";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { CreditCard, Truck } from "lucide-react";
import Image from "next/image";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Loader from "./loader";

export default function PaymentPage() {
  const { cart, checkoutData, setCheckoutData, cartTotal, clearCart } = useStore();
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = checkoutData.shipping;
  const total = subtotal + shipping;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const resetCheckout = useStore((state) => state.resetCheckout);

const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);
  const publicKey = process.env.NEXT_PUBLIC_PAYSTACK_KEY;

const paystackConfig = {
  reference: new Date().getTime().toString(),
  email: checkoutData.email,
  amount: total * 100, // kobo
  publicKey,
};

  useEffect(() => {
    if (cart.length === 0) {
      router.push("/");
    }
  }, [cart.length, router]);

   
  const handleNext = (e) => {
    e.preventDefault();
    if (!checkoutData.paymentMethod) {
      alert("Please select a payment method.");
      return;
    }
  };


const handlePaystackSuccess = async (response) => {
  setLoading(true);
  console.log("Payment successful:", response);
try{
  await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buyerEmail: checkoutData.email,
      storefrontId: checkoutData.storefrontId,
      orderDetails: { cart, total: total, shipping},
      paymentRef: response.reference,
    }),
  });

  router.push(`/payment-success?order_id=${response.reference}`);
  

} catch (error) {
  console.error("Error processing payment:", error);
  alert("An error occurred while processing your payment. Please try again.");
}
};
const handlePaystackClose = () => {
  console.log("Payment cancelled");
};

  return (
    <Background>
      {
        loading && 
        <Loader/>
      }
      {/* Header */}
      <div className="p-8 pb-0 flex items-center justify-center md:justify-start">
        <a href="/" className="font-extrabold text-xl md:text-2xl text-color3">DENIM</a>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-3 gap-8 min-h-screen">
        <div className="md:col-span-2 space-y-6">
          <CheckoutStepper step={3} />

          {/* Summary Card */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold">Contact</span>: {checkoutData.email}
                </div>
                <Button variant="link" onClick={() => router.push("/checkout")}>
                  Change
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold">Deliver to</span>: {checkoutData.address}
                </div>
                <Button variant="link" onClick={() => router.push("/checkout/shipping")}>
                  Change
                </Button>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-semibold">Method</span>: Standard Shipping (₦{shipping.toLocaleString()})
                </div>
                <Button variant="link" onClick={() => router.push("/checkout/shipping")}>
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNext} className="space-y-6">
                <RadioGroup
                  
                  value={checkoutData.paymentMethod}
                  onValueChange={(v) => setCheckoutData({ paymentMethod: v })}
                  className="space-y-3"
                  
                >
                  {/* Card Option */}
                  <label
                    htmlFor="card"
                    className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${checkoutData.paymentMethod === "card" ? "border-primary bg-accent" : ""}`}
                  >
                    <RadioGroupItem value="card" id="card" className="mr-3" disabled />
                    <CreditCard className="w-5 h-5 mr-2" />
                    <span className="text-gray-400">Credit / Debit Card </span>
                  </label>

                  {/* Darllix pay */}
                  <label
                    htmlFor="darllix"
                    className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${checkoutData.paymentMethod === "darllix" ? "border-primary bg-accent" : ""}`}
                  >
                    <RadioGroupItem value="darllix" id="darllix" className="mr-3" />
                    <Image
                      src="/darllix_logo.png"
                      alt="Darllix Pay"
                      width={24}
                      height={24}
                      className="mr-2 w-5 h-5"
                      unoptimized
                    />
                    <span>Pay</span>
                  </label>

                  {/* Cash on Delivery Option */}
                  <label
                    htmlFor="cod"
                    className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${checkoutData.paymentMethod === "cod" ? "border-primary bg-accent" : ""}`}
                  >
                    <RadioGroupItem value="cod" id="cod" className="mr-3" disabled/>
                    <Truck className="w-5 h-5 mr-2" />
                    <span className="text-gray-400">Cash on Delivery</span>
                  </label>
                </RadioGroup>

                {/* Terms */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    required
                    checked={checkoutData.agreedTerms || false}
                    onCheckedChange={(v) => setCheckoutData({ agreedTerms: v })}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Label className="cursor-pointer">
                          I agree to the <span className="underline">terms & conditions</span>
                        </Label>
                      </TooltipTrigger>
                      <TooltipContent>
                        Please review our policies before placing your order.
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Buttons */}
                <div className="flex justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/checkout/shipping")}
                    className="w-full"
                  >
                    Back
                  </Button>
                  {checkoutData.paymentMethod === "darllix" ? (
                    <PaystackButton
                    
                      {...paystackConfig}
                      text="Complete Order"
                      onSuccess={handlePaystackSuccess}
                      onClose={handlePaystackClose}
                      disabled={checkoutData.agreedTerms !== true || loading}
                      className="w-full disabled:bg-gray-400 bg-color1  text-white text-sm px-3 rounded-lg font-semibold hover:bg-primary/90 transition"
                    />
                  ) : (
                    <Button type="submit" className="w-full"
                    
                      disabled={checkoutData.agreedTerms !== true || loading}
                      onClick={() => setLoading(true)}
                    >
                      Complete Order
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <Card className="h-fit md:sticky md:top-8">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-60 pr-2">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between py-2 text-sm">
                  <span>{item.name} × {item.quantity}</span>
                  <span>₦{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </ScrollArea>
            <Separator className="my-3" />
            <div className="flex justify-between text-sm mb-2">
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Shipping</span>
              <span>₦{shipping.toLocaleString()}</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between font-bold text-lg">
              <span>Grand Total</span>
              <span>₦{total.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </Background>
  );
}
