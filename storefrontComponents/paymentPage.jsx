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
import { useEffect, useRef, useState } from "react";
import Loader from "./loader";
import { toast } from "sonner"
export default function PaymentPage({ store }) {
  const { cart, checkoutData, setCheckoutData, cartTotal, clearCart } = useStore();
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = checkoutData.shipping;
  const total = subtotal + shipping;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const resetCheckout = useStore((state) => state.resetCheckout);

  // dynamic import of react-paystack button (ssr: false)
  const PaystackButton = dynamic(
    () => import("react-paystack").then((mod) => mod.PaystackButton),
    { ssr: false }
  );

  // ref to hidden wrapper so we can find the actual button element to click
  const paystackRef = useRef(null);
  // config to pass to PaystackButton (set when order created)
  const [paystackConfig, setPaystackConfig] = useState(null);

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

  // Payment success handler called by react-paystack hidden button
  async function handlePaystackSuccess(response) {
    setLoading(true);
    console.log("Payment successful (client):", response);
    
    try {
      // call server verify endpoint
      const verifyRes = await fetch("/api/orders?action=verify", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ reference: response.reference, orderId: response.metadata?.orderId || null }),
        credentials: "same-origin",
      });

      const verifyText = await verifyRes.text();
      let verifyJson;
      try {
        verifyJson = JSON.parse(verifyText);
      } catch (parseErr) {
        console.error("Non-JSON verify response from server:", verifyText);
        throw new Error("Payment verification returned non-JSON. Check server logs.");
      }

      if (!verifyRes.ok) {
        console.error("Verify failed:", verifyJson);
        throw new Error(verifyJson?.error || "Payment verification failed");
      }
      
      const orderId = verifyJson.order?.id || response.metadata?.orderId || response.reference;
      toast.success("Payment successful")
      router.push(`/payment-success?order_id=${orderId}&ref=${response.reference}`);
    } catch (err) {
      console.error("Error verifying payment:", err);
      alert("Payment succeeded but verification failed. Please contact support.");
    } finally {
      setLoading(false);
    }
  }

  function handlePaystackClose() {
 
    setLoading(false);
  }

  // Create order on server then initialize Paystack (by clicking the hidden PaystackButton)
  async function createOrderAndInitPaystack() {
    try {
      setLoading(true);
      const reference = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      // Build order payload expected by /api/orders
      const orderPayload = {
        store_id: checkoutData.storefrontId || checkoutData.storeId || store?.id,
        buyer_id: null,
        currency: "NGN",
        payment_method: "paystack",
        payment_provider: "paystack",
        payment_reference: reference,
        status: "pending",
        shipping_address: checkoutData.address || null,
        billing_address: checkoutData.address || null,
        meta: { createdFromClient: true },
        items: cart.map((it) => ({
          product_id: it.id || null,
          name: it.name,
          unit_price: Number(it.price),
          quantity: Number(it.quantity),
          meta: {},
        })),
      };

      const createRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ order: orderPayload }),
        credentials: "same-origin",
      });

      // read text so HTML error pages don't crash parse step; helpful for debugging
      const createText = await createRes.text();
      let createJson;
      try {
        createJson = JSON.parse(createText);
      } catch (parseErr) {
        console.error("Non-JSON response creating order:", createText);
        throw new Error("Server returned non-JSON when creating order — check server logs/terminal.");
      }

      if (!createRes.ok) {
        console.error("Create order failed:", createJson);
        throw new Error(createJson?.error || `Create order failed: ${createRes.status}`);
      }

      const createdOrder = createJson.order;
      if (!createdOrder || !createdOrder.id) {
        console.warn("Order created but no id returned", createJson);
        throw new Error("Order created but server didn't return an id.");
      }

      // Build paystack config
      const amountKobo = Math.round((subtotal + shipping) * 100);

      const cfg = {
        reference,
        email: checkoutData.email,
        amount: amountKobo,
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
        metadata: { orderId: createdOrder.id, storeId: createdOrder.store_id },
      };

      setPaystackConfig(cfg);

      // wait a tick to allow hidden PaystackButton to render with the new config
      await new Promise((r) => setTimeout(r, 70));

      const wrapper = paystackRef.current;
      const btn = wrapper?.querySelector("button");
      if (!btn) {
        console.error("Hidden Paystack button not found - ensure PaystackButton rendered.");
        throw new Error("PaystackButton not available. Ensure react-paystack is loaded.");
      }

      // programmatically click the hidden button to open Paystack modal
      btn.click();

      // do not setLoading(false) here — wait until onSuccess/onClose
    } catch (err) {
      console.error("createOrderAndInitPaystack error:", err);
      alert("Failed to start payment: " + (err?.message || "Unknown error"));
      setLoading(false);
    }
  }

  // createOrder (non-paystack fallback) - kept minimal (UI unchanged)
  const createOrder = async (method) => {
    try {
      setLoading(true);
      // you can implement a non-paystack order creation & redirect flow here if needed
      // For now, we simply create order with payment_method = method and show success
      const orderPayload = {
        store_id: checkoutData.storefrontId || checkoutData.storeId || store?.id,
        buyer_id: null,
        currency: "NGN",
        payment_method: method || "other",
        payment_provider: method === "darllix" ? "paystack" : null,
        status: "pending",
        shipping_address: checkoutData.address || null,
        billing_address: checkoutData.address || null,
        meta: { createdFromClient: true },
        items: cart.map((it) => ({
          product_id: it.id || null,
          name: it.name,
          unit_price: Number(it.price),
          quantity: Number(it.quantity),
          meta: {},
        })),
      };

      const createRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: orderPayload }),
        credentials: "same-origin",
      });
      const createJson = await createRes.json().catch(() => ({}));
      if (!createRes.ok) {
        throw new Error(createJson?.error || "Failed to create order");
      }
      // order created: redirect to success page (we don't have payment ref)
      router.push(`/payment-success?order_id=${createJson.order?.id || ""}`);
    } catch (err) {
      console.error("createOrder error:", err);
      alert("Failed to create order: " + (err?.message || "Unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Background>
      {loading && <Loader />}

      {/* Header */}
      <div className="p-8 pb-0 flex items-center justify-center md:justify-start">
        <a href="/" className="font-extrabold text-xl md:text-2xl text-color3">{store.name}</a>
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

                  {/* Darllix pay (Paystack) */}
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
                    <RadioGroupItem value="cod" id="cod" className="mr-3" disabled />
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

                  {/* DARLLIX / PAYSTACK flow: visible button preserved but hooked to createOrderAndInitPaystack */}
                  {checkoutData.paymentMethod === "darllix" ? (
                    <button
                      type="button"
                      onClick={() => createOrderAndInitPaystack()}
                      disabled={checkoutData.agreedTerms !== true || loading}
                      className="w-full disabled:bg-gray-400 bg-color1 text-white text-sm px-3 rounded-lg font-semibold hover:bg-primary/90 transition"
                    >
                      Complete Order
                    </button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      disabled={checkoutData.agreedTerms !== true || loading}
                      onClick={() => createOrder()}
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

      {/* Hidden PaystackButton wrapper: invisible but clickable */}
      <div
        ref={paystackRef}
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          pointerEvents: "none",
          left: -9999,
        }}
        aria-hidden
      >
        {paystackConfig && (
          <PaystackButton
            text="PaystackHiddenButton"
            onSuccess={handlePaystackSuccess}
            onClose={handlePaystackClose}
            {...paystackConfig}
          />
        )}
      </div>
    </Background>
  );
}
