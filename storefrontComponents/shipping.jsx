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
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Store, Truck, Timer } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";

export default function ShippingPage({store}) {
  const { cart, checkoutData, setCheckoutData } = useStore();
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = checkoutData.shipping
  const total = subtotal + shipping;
  const router = useRouter();

  const handleNext = (e) => {
    e.preventDefault();
    if (!checkoutData.shippingMethod) {
      alert("Please select a shipping method.");
      return;
    }
    router.push("/checkout/payment");
  };
  useEffect(() => {
        if(cart.length === 0) {
            router.push("/");
        }
  },[])
  return (
    <Background>
        <div className="p-8 pb-0 flex items-center  justify-center md:justify-start">
              <a href="/" className="font-extrabold text-xl md:text-2xl text-color3">{store.name}</a>
          </div>
      <div className="max-w-7xl mx-auto p-4 md:p-8 grid md:grid-cols-3 gap-8 min-h-screen">
        <div className="md:col-span-2 space-y-6">
          <CheckoutStepper step={2} />

          {/* Summary Card */}
          <Card>
            <CardContent className="p-4 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <div className="max-w-56 md:max-w-none  whitespace-nowrap overflow-hidden">
                  <span className="font-semibold ">Contact</span>: {checkoutData.email}
                </div> ...
                <Button variant="link" onClick={() => router.push("/checkout")}>
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Method</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNext} className="space-y-6">
                <RadioGroup
                  value={checkoutData.shippingMethod}
                  onValueChange={(v) => setCheckoutData({ shippingMethod: v, shipping: v === "pickup" ? 0 : v === "nextday" ? 3500 : v === "priority" ? 5000 : 0 })}
                  className="space-y-3"
                >
                  {/* Pickup Option */}
                  <label
                    htmlFor="pickup"
                    className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${
                      checkoutData.shippingMethod === "pickup" ? "border-primary bg-accent" : ""
                    }`}
                  >
                    <RadioGroupItem value="pickup" id="pickup" className="mr-3" />
                    <Store className="w-5 h-5 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium">Click & Collect</div>
                      <div className="text-xs text-muted-foreground">Collect from our store</div>
                    </div>
                    <span>₦0.00</span>
                  </label>

                  {/* Next Day Option */}
                  <label
                    htmlFor="nextday"
                    className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${
                      checkoutData.shippingMethod === "nextday" ? "border-primary bg-accent" : ""
                    }`}
                  >
                    <RadioGroupItem value="nextday" id="nextday" className="mr-2" />
                    {/* <Timer className="w-5 h-5 mr-2" /> */}
                    <Image
                      src={"/delivery_truck.svg"}
                      alt="d "
                      width={1200}
                      height={1200} 
                      className="w-6 h-6 mr-2"
                      unoptimized
                    />
                    <div className="flex-1">
                      <div className="font-medium">Darllix Express</div>
                      <div className="text-xs text-muted-foreground">
                        For orders placed before 1pm Mon–Thu
                      </div>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <span>₦3,500</span>
                        </TooltipTrigger>
                        <TooltipContent>Fastest delivery available</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </label>

                  {/* Priority Option */}
                  <label
                    htmlFor="priority"
                    className={`flex items-center p-4 border rounded-lg cursor-pointer hover:border-primary transition-colors ${
                      checkoutData.shippingMethod === "priority" ? "border-primary bg-accent" : ""
                    }`}
                  >
                    <RadioGroupItem value="priority" id="priority" className="mr-3" />
                    <Truck className="w-5 h-5 mr-2" />
                    <div className="flex-1">
                      <div className="font-medium">DHL Priority</div>
                      <div className="text-xs text-muted-foreground">24–36 hour delivery</div>
                    </div>
                    <span>₦5,000</span>
                  </label>
                </RadioGroup>

                {/* Buttons */}
                <div className="flex justify-between gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/checkout")}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="w-full">
                    Proceed to Payment
                  </Button>
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
              <span>{shipping > 0 ? `₦${shipping.toLocaleString()}` : "—"}</span>
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
