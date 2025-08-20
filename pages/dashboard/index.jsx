"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "../../components/dashboardComponents/dashboardLayout";

export default function DashboardPage() {
  const [openSection, setOpenSection] = useState("add-products");

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Top Trial Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black text-white p-4 rounded-md flex justify-between items-center"
        >
          <span>
            Extend your trial for $1/month for 3 months on select plans.
          </span>
          <Button className="bg-white text-black hover:bg-gray-200">
            Select a plan
          </Button>
        </motion.div>

        {/* Setup Guide */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Get ready to sell</CardTitle>
            <p className="text-sm text-gray-500">
              Use this personalized guide to get your store up and running.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div className="bg-yellow-500 h-2 rounded-full w-[0%]" />
            </div>
            <p className="text-xs text-gray-500 mt-1">0 / 11 completed</p>
          </CardHeader>

          <CardContent className="divide-y">
            {/* Add Products */}
            <div>
              <button
                onClick={() => toggleSection("add-products")}
                className="w-full flex justify-between items-center py-3"
              >
                <span className="font-medium">Add products</span>
                {openSection === "add-products" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "add-products" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 pb-4 space-y-3"
                >
                  <p className="text-sm text-gray-600">
                    Write a description, add photos, and set pricing for the
                    products you plan to sell.
                  </p>
                  <div className="flex gap-2">
                    <Button>Add product</Button>
                    <Button variant="outline">Import products</Button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Online Store */}
            <div>
              <button
                onClick={() => toggleSection("online-store")}
                className="w-full flex justify-between items-center py-3"
              >
                <span className="font-medium">Set up your online store</span>
                {openSection === "online-store" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "online-store" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 pb-4 space-y-3"
                >
                  <p className="text-sm text-gray-600">
                    Customize your online store theme, navigation, and homepage.
                  </p>
                  <Button>Customize theme</Button>
                </motion.div>
              )}
            </div>

            {/* Store Settings */}
            <div>
              <button
                onClick={() => toggleSection("settings")}
                className="w-full flex justify-between items-center py-3"
              >
                <span className="font-medium">Store settings</span>
                {openSection === "settings" ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              {openSection === "settings" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="pl-4 pb-4 space-y-3"
                >
                  <p className="text-sm text-gray-600">
                    Configure payments, shipping, and taxes for your store.
                  </p>
                  <Button>Open settings</Button>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Discover More */}
        <Card>
          <CardHeader>
            <CardTitle>Discover more of Darllix</CardTitle>
            <p className="text-sm text-gray-500">
              Browse features, apps, and sales channels to grow your business.
            </p>
          </CardHeader>
          <CardContent>
            <Button variant="outline">Explore now</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
