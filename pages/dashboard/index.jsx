"use client";
import { createServerSupabaseClient } from "@/lib/supabaseClient";
import DashboardLayout from "../../components/dashboardComponents/dashboardLayout";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import SalesGraph from "../../components/salesGraph";
import { withAuth } from "../../lib/withAuth";
import { useStore } from "@/store";
import { useRouter } from "next/router";



export default function DashboardPage({user,store,hasStore}){
    const setStore = useStore((s) => s.setStore);
    const [dashboardInfo, setDashboardInfo] = useState({
     product: null,
     order: null,
     customer: null,
    });
    
  useEffect(() => {
    if (store) {
      setStore(store);
      if (!completed.includes('store')) {
        setCompleted([...completed, 'store']);
    }
    } 
  }, [store, setStore]);


  const fetchDashboardInfo = async () => {
    try {
      const [prodRes, orderRes, custRes] = await Promise.all([
        fetch(`api/products?page=1&limit=10&storeId=${store?.id}&sort_by=created_at&sort_dir=desc`),
        
        fetch(`api/orders?page=1&limit=10&storeId=${store?.id}`),
        fetch(`/api/customers?page=1&limit=1&storeId=${store?.id} `),
      ]);

      const [prodJson, orderJson, custJson] = await Promise.all([
        prodRes.json(),
        orderRes.json(),
        custRes.json(),
      ]);

      setDashboardInfo({
        product: prodJson.products || null,
        order: orderJson.orders || null,
        customer: custJson.customers || null,
      });

    } catch (err) {
      console.error("fetchDashboardInfo error:", err);
    }
  };

  useEffect(() => {
    fetchDashboardInfo();
  }, []);

  useEffect(()=>{
    if(dashboardInfo?.product?.length>0){
      if (!completed.includes('products')) {
        setCompleted([...completed, 'products']);
    }
  }
  },[dashboardInfo])

  const steps = [
    { key: "bank", title: "Add bank details", description: "Add your bank details to receive payments." },
    { key: "products", title: "Add products", description: "Write a description, add photos, and set pricing." },
    { key: "store", title: "Set up your online store", description: "Customize your store theme and homepage." },
  ];

  const [openSection, setOpenSection] = useState(null);
  const [completed, setCompleted] = useState([]);

  const toggleSection = (key) => {
    setOpenSection(openSection === key ? null : key);
  };



  const progress = Math.round((completed.length / steps.length) * 100);
 const router = useRouter()

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {
         !hasStore && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Welcome to Darllix!</h2>
                <p className="text-sm text-gray-700">
                  You don't have a store yet. Create your store to start selling products and managing your business.
                </p>
              </div>
              <Button onClick={() => router.push('/dashboard/store') }>Create Store</Button>
            </CardContent>
          </Card>
         )
        }
        {hasStore && (
          <>
       

            {/* Charts Section */}

            <SalesGraph dashboardInfo={dashboardInfo} store={store} />
          </>
        )}
        {/* Onboarding Section */}
        {
          completed.length < 3  &&
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
                    <Button onClick={() => router.push('/dashboard/products')}>
                      {
                        step.key ==='products' ?
                        'Add Product'
                        :' Continue'
                      }
                    </Button>
                  </motion.div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
        }

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

export const getServerSideProps = withAuth();