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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function InformationPage({store}) {
  const { cart, checkoutData, setCheckoutData } = useStore();
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal > 0 ? checkoutData.shipping : 0;
  const total = subtotal + shipping;
  const router = useRouter();

  const handleChange = (field, value) =>
    setCheckoutData({ [field]: value });

  const handleNext = (e) => {
    e.preventDefault();
    router.push("/checkout/shipping");
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
       
        <div className="md:col-span-2">
          <CheckoutStepper step={1} />
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleNext} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      placeholder="Enter first name"
                      value={checkoutData.firstName}
                      onChange={(e) => handleChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      placeholder="Enter last name"
                      value={checkoutData.lastName}
                      onChange={(e) => handleChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    value={checkoutData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                      placeholder="08012345678"

                    type="tel"
                    value={checkoutData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                      placeholder="Enter your address"

                    value={checkoutData.address}
                    onChange={(e) => handleChange("address", e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={checkoutData.billingSame}
                    onCheckedChange={(v) =>
                      handleChange("billingSame", v)
                    }
                  />
                  <Label>Use for billing address</Label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label>State</Label>
                    <Input
                      value={checkoutData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Country</Label>
                    <Input
                      value={checkoutData.country}
                      onChange={(e) => handleChange("country", e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label>Zip / Post Code</Label>
                  <Input
                      placeholder="Enter Zipcode eg. 100001"

                    value={checkoutData.zip}
                    onChange={(e) => handleChange("zip", e.target.value)}
                  />
                </div>
                <div className="flex justify-between gap-4">
                    <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full"
                    >
                    Back home
                    </Button>
                    <Button type="submit" className="w-full">
                    Continue to shipping
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
            
              <span>
                {shipping > 0 ? `₦${shipping.toLocaleString()}` : "—"}
              </span>
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
