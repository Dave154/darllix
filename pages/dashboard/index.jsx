"use client";

import DashboardLayout from "../../components/dashboardComponents/dashboardLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import TrialBanner from "../../components/dashboardComponents/trialBanner";

export default function DashboardPage(){
  const [hasStore, setHasStore] = useState(true); 
  const steps = [
    { key: "bank", title: "Add bank details", description: "Add your bank details to receive payments." },
    { key: "products", title: "Add products", description: "Write a description, add photos, and set pricing." },
    { key: "store", title: "Set up your online store", description: "Customize your store theme and homepage." },
    { key: "settings", title: "Store settings", description: "Configure payments, shipping, and taxes." },
  ];

  const [openSection, setOpenSection] = useState(null);
  const [completed, setCompleted] = useState([]);

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key);
  };

  const markComplete = (key) => {
    if (!completed.includes(key)) {
      setCompleted([...completed, key]);
    }
  };

  const progress = Math.round((completed.length / steps.length) * 100);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-1 md:p-6">
        <TrialBanner />
        {hasStore && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-blue-600 text-white">
                <CardHeader><CardTitle>Total Sales</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">₦0.00</p>
                  <p className="text-sm opacity-80">+0% this week</p>
                </CardContent>
              </Card>
              <Card className="bg-indigo-600 text-white">
                <CardHeader><CardTitle>Total Settled</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">₦0.00</p>
                  <p className="text-sm opacity-80">0% change</p>
                </CardContent>
              </Card>
              <Card className="bg-purple-600 text-white">
                <CardHeader><CardTitle>Total Orders</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">0</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Total Products</CardTitle></CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">0</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            {/* <DashboardCharts /> */}
          </>
        )}

        {/* Onboarding Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Get ready to sell</CardTitle>
            <p className="text-sm text-gray-500">Use this guide to finish setting up your store.</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {completed.length} / {steps.length} completed
            </p>
          </CardHeader>

          <CardContent className="divide-y">
            {steps.map((step) => (
              <div key={step.key}>
                <button
                  onClick={() => toggleSection(step.key)}
                  className="w-full flex justify-between items-center py-3"
                >
                  <span className={`font-medium flex items-center gap-2 ${completed.includes(step.key) ? "text-green-600" : ""}`}>
                    {completed.includes(step.key) && <CheckCircle2 className="h-4 w-4" />}
                    {step.title}
                  </span>
                  {openSection === step.key ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>

                {openSection === step.key && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="pl-4 pb-4 space-y-3"
                  >
                    <p className="text-sm text-gray-600">{step.description}</p>
                    <Button onClick={() => markComplete(step.key)}>Mark as Done</Button>
                  </motion.div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Feature Cards (always visible) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader><CardTitle>Promote Store</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Make extra sales when you promote your business to our shoppers.
              </p>
              <Button>Join Now</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Sell & Save</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Save up to 10% of every sale you make.
              </p>
              <Button variant="outline">Coming Soon</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">
                Track your income and profit margin across all products.
              </p>
              <Button variant="outline">Coming Soon</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
