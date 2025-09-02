import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowLeft, Check } from "lucide-react";
import DashboardLayout from "../../components/dashboardComponents/dashboardLayout";
import { useRouter } from "next/navigation";

const plans = [
  {
    name: "Free",
    price: "₦0.00",
    description:
      "Everything you need to sell online, ship products, process payments, and the basics to sell in person.",
    features: ["Valid for 7 days", "Up to 10 products"],
  },
  {
    name: "Enterpreneur",
    highlight: "Most Popular",
    price: "₦6000.00",
    oldPrice: "₦10000.00",
    description:
      "Everything you need to sell online, ship products, process payments, and the basics to sell in person.",
    features: ["Up to 50 products"],
  },
  {
    name: "CEO",
    price: "₦0.00",
    description:
      "Everything you need to sell online, ship products, process payments, and the basics to sell in person.",
    features: ["Unlimited products products"],
  },
];

export default function PricingPlans() {
    const router = useRouter()
  return (
    <DashboardLayout>
      <div className="min-h-screen flex flex-col items-center">
        <div className="flex gap-2 items-center mt-8 mb-4 justify-self-start self-start">
            <ArrowLeft className="w-5 h-5 cursor-pointer hover:w-6 transition-all " onClick={()=>router.push('/dashboard')} />
        <h1 className="text-2xl mb-2">Select a plan</h1>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: idx * 0.15,
                duration: 0.6,
                ease: "easeOut",
              }}
            >
              <Card className="h-full min-h-[400px] relative border rounded-2xl shadow-sm hover:shadow-lg transition">
                  {plan.highlight && (
                    <span className="text-xs absolute -top-2 left-2 bg-blue-100 text-blue-600 px-2 py-1 rounded-full w-fit mb-2">
                      {plan.highlight}
                    </span>
                  )}
                <CardHeader>
                  <CardTitle className="text-2xl font-semibold">
                    {plan.name}
                  </CardTitle>
                  <p className="text-gray-500 text-sm">{plan.description}</p>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 flex-grow">
                  <div>
                    {plan.oldPrice && (
                      <p className="text-gray-400 line-through">
                        Starting at {plan.oldPrice}
                      </p>
                    )}
                    <p className="text-3xl font-bold">
                      {plan.price}
                      <span className="text-base font-normal">
                        {" "}
                        /month for first 3 months
                      </span>
                    </p>
                  </div>
                  <Button className="w-full">Choose {plan.name}</Button>

                  <div className="mt-auto">
                    <h3 className="font-semibold mb-1">Features</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
