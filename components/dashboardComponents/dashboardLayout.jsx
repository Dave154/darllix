"use client";

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  ShoppingBag,
  Users,
  Package,
  Store,
  Settings,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Compass,
} from "lucide-react";
import { BsCreditCard2FrontFill, BsPersonFillExclamation } from "react-icons/bs";
import { PiPiggyBankThin } from "react-icons/pi";
import { RxLightningBolt } from "react-icons/rx";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import Loader from "./loader";
import TrialBanner from "./trialBanner";
import Image from "next/image";
import { toast, Toaster } from "sonner";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "../../hooks/useUser";
import { withAuth } from "../../lib/withAuth";
import AreYouSureModal from "./areYouSure";
import Notification from "./bannerNotification";
import SupportButton from "./supportButton";

const menuItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  { title: "Products", icon: ShoppingBag, href: "/dashboard/products" },
  { title: "Customers", icon: Users, href: "/dashboard/customers" },
  { title: "Orders", icon: Package, href: "/dashboard/orders" },
  { title: "Finance", icon: BsCreditCard2FrontFill, href: "/dashboard/finance" },
  { title: "Sell & Save", icon: PiPiggyBankThin, href: "/dashboard/sellandsave" },
];

export default function DashboardLayout({ children }) {
  const [openStore, setOpenStore] = useState(false);
  const [openMarketplace, setOpenMarketplace] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeDropdown, setStoreDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [pendingWithdrawal, setPendingWithdrawal] = useState([]);
  const { user, profile } = useUser();
  const supabase = useSupabaseClient();
  const router = useRouter();

  const isMarketplace = router.pathname.startsWith('/dashboard/marketplace');

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleStop = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleStop);
    router.events.on("routeChangeError", handleStop);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleStop);
      router.events.off("routeChangeError", handleStop);
    };
  }, [router]);

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] || "").toUpperCase() + (parts[parts.length - 1][0] || "").toUpperCase();
  };

  async function fetchPendingWithdrawals() {
    const { data, error } = await supabase
      .from("withdrawalRequest")
      .select("*")
      .eq("owner_id", user?.id)
      .eq("status", "pending")
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching pending withdrawals:", error.message);
      return;
    }
    setPendingWithdrawal(data);
  }

  useEffect(() => {
    fetchPendingWithdrawals();
  }, [user]);

  async function handleWithdraw() {
    if (profile?.bank_code) {
      toast.error("Add bank details");
      return;
    }
    if (Number(profile?.available_balance || 0) <= 0) {
      toast.error("No balance to withdraw");
      return;
    }
    const withdrawal = {
      owner_id: user.id,
      accountname: profile.account_name,
      accountnumber: profile?.account_number,
      bankname: profile?.bank_name,
      amount: profile?.available_balance * 97.6 / 100,
      paymentreference: `PAY_REF_${crypto.randomUUID()}`,
      date: new Date(),
      status: "pending",
    };
    setWithdrawing(true);
    try {
      const { error } = await supabase.from("withdrawalRequest").insert([withdrawal]);
      await supabase.from("profiles").update({ available_balance: 0 }).eq("id", user.id);
      if (error) throw error;
      toast.success("Withdrawal requested successfully!");
      router.reload();
    } catch (error) {
      toast.error(error.message || "Something went wrong");
    } finally {
      setWithdrawing(false);
    }
  }

  return (
    <>
      <SupportButton />
      <Toaster 
        position="top-center"
        toastOptions={{
          unstyled: true,
          classNames: {
            toast: 'w-full max-w-sm mx-auto flex items-center gap-3 px-5 py-4 bg-color4/95 backdrop-blur-xl rounded-full shadow-[0_20px_40px_rgba(200,200,200,0.15)] border border-white/10 mt-2',
            title: 'text-white font-semibold text-sm tracking-wide',
            description: 'text-gray-300 text-xs',
            success: 'text-green-400',
            error: 'text-red-400',
            info: 'text-white',
            warning: 'text-yellow-400',
            icon: 'w-5 h-5 flex-shrink-0',
          },
        }}
      />
      <AreYouSureModal
        open={requesting}
        onClose={() => setRequesting(false)}
        onConfirm={handleWithdraw}
        title="Are you sure?"
        description={`You are about to withdraw ₦${profile?.available_balance?.toLocaleString()} to ${profile?.account_number} ${profile?.bank_name}. You will be charged 2.4% for each withdrawal`}
        confirmLabel="Yes, continue"
        cancelLabel="Cancel"
        loading={withdrawing}
        safe
      />
      <div className="flex flex-col h-screen bg-color4 text-color3">
        {loading && <Loader />}
        
        <header className="h-14 bg-black text-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden p-2 rounded hover:bg-gray-800">
              <Menu className="h-6 w-6" />
            </button>
            <div className="text-lg flex gap-2 items-center font-bold">
              <Image src={'/darllix_logo.png'} alt='logo' width={1000} height={1000} className='w-8 h-8' />
              <span>Darllix</span>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <button onClick={() => setStoreDropdown(!storeDropdown)} className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-700">
              ₦{profile?.available_balance?.toLocaleString()}
            </button>

            <AnimatePresence>
              {storeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-12 top-12 bg-white text-black rounded-xl shadow-lg py-4 w-64 z-50 border border-slate-100"
                >
                  <div className="px-4 pb-3 border-b border-slate-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-500">Wallet Balance</span>
                      <Link href={'/dashboard/withdrawalhistory'} className="text-color1 text-xs underline">History</Link>
                    </div>
                    <div className="text-2xl font-bold text-indigo-700">₦{Number(profile?.available_balance || 0).toFixed(2).toLocaleString()}</div>
                  </div>
                  <div className="px-4 py-3">
                    <button
                      onClick={() => setRequesting(true)}
                      disabled={withdrawing || Number(profile?.available_balance || 0) <= 0}
                      className="w-full h-10 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {withdrawing ? "Processing…" : "Request Withdrawal"}
                    </button>
                  </div>
                  <div className="px-4 py-2 text-xs text-slate-500 border-t border-slate-200">
                    Funds will be transferred to your saved bank account via Paystack.
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="h-8 w-8 flex items-center justify-center rounded-full bg-green-500 text-black font-semibold cursor-pointer">
              {getInitials(profile?.full_name)}
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <aside className="hidden md:flex w-60 border-r border-gray-300 bg-color4 flex-col">
            <SidebarContent
              openStore={openStore}
              setOpenStore={setOpenStore}
              openMarketplace={openMarketplace}
              setOpenMarketplace={setOpenMarketplace}
              setMobileOpen={setMobileOpen}
            />
          </aside>

          <AnimatePresence>
            {mobileOpen && (
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="fixed inset-y-0 left-0 z-50 w-60 border-r border-gray-300 bg-color4 flex flex-col md:hidden"
              >
                <div className="flex justify-between items-center px-4 py-4 border-b border-gray-300">
                  <div className="text-lg flex gap-2 items-center font-bold">
                    <Image src={'/darllix_logo.png'} alt='logo' width={1000} height={1000} className='w-8 h-8' />
                    <span>Darllix</span>
                  </div>
                  <button onClick={() => setMobileOpen(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <SidebarContent
                  openStore={openStore}
                  setOpenStore={setOpenStore}
                  openMarketplace={openMarketplace}
                  setOpenMarketplace={setOpenMarketplace}
                  setMobileOpen={setMobileOpen}
                />
              </motion.aside>
            )}
          </AnimatePresence>

          {mobileOpen && <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} />}

          <main className={`flex-1 overflow-y-auto ${isMarketplace ? 'p-0' : 'p-1 md:p-6 space-y-6'}`}>
            {pendingWithdrawal.length > 0 && <Notification message={`Your request of ₦${pendingWithdrawal[0].amount.toLocaleString()} is pending and will be disbursed shortly`} />}
            {!isMarketplace && <TrialBanner />}
            {children}
          </main>
        </div>
      </div>
    </>
  );
}

function SidebarContent({ openStore, setOpenStore, openMarketplace, setOpenMarketplace, setMobileOpen }) {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push("/auth/login");
    } catch (err) {
      console.error("Error during logout:", err.message);
    }
  };

  return (
    <nav className="flex-1 flex flex-col px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
      <div className="flex-1">
        {menuItems.map((item, i) => (
          <motion.div
            key={i}
            whileHover={{ x: 5 }}
            className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${router.pathname === item.href && "bg-gray-200 "} hover:bg-gray-300`}
          >
            <item.icon className="h-5 w-5 text-gray-500" />
            <Link href={item.href} onClick={() => setMobileOpen(false)} className="flex-1">
              {item.title}
            </Link>
          </motion.div>
        ))}

        <div className="mt-1">
          <button
            onClick={() => setOpenMarketplace(!openMarketplace)}
            className={`flex w-full flex-1 items-center justify-between px-3 py-2 rounded-md ${router.pathname.includes('/dashboard/marketplace') ? "bg-gray-200" : ""} hover:bg-gray-300`}
          >
            <div className="flex items-center gap-3">
              <Compass className="h-5 w-5 text-gray-500" />
              <span>Marketplace</span>
            </div>
            <ChevronDown className={`h-4 w-4 transition-transform ${openMarketplace ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {openMarketplace && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pl-11 flex flex-col space-y-1 overflow-hidden"
              >
                <Link href="/dashboard/marketplace?tab=discover" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-500 hover:text-color3 transition-all">
                  Discover
                </Link>
                <Link href="/dashboard/marketplace?tab=sell" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-500 hover:text-color3 transition-all">
                  Sell
                </Link>
                <Link href="/dashboard/marketplace?tab=promote" onClick={() => setMobileOpen(false)} className="block py-2 text-sm text-gray-500 hover:text-color3 transition-all">
                  Promote
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-1">
          <button
            onClick={() => {
              setOpenStore(!openStore);
              router.push('/dashboard/store');
            }}
            className={`flex w-full flex-1 items-center justify-between px-3 py-2 rounded-md ${router.pathname === '/dashboard/store' && "bg-gray-200"} hover:bg-gray-300`}
          >
            <div className="flex items-center gap-3">
              <Store className="h-5 w-5 text-gray-500" />
              <span>My Store</span>
            </div>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-300 my-3"></div>

      <motion.div whileHover={{ x: 5 }} className="flex items-center gap-3 px-3 py-2 cursor-pointer bg-blue-300/50 backdrop-blur text-white shadow-md shadow-blue-200 rounded-xl hover:bg-gray-300">
        <RxLightningBolt className="h-5 w-5 text-blue-300" />
        <Link href="/dashboard/pricing" onClick={() => setMobileOpen(false)}>Upgrade your plan</Link>
      </motion.div>

      <motion.div whileHover={{ x: 5 }} className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300 ${router.pathname === '/dashboard/profile' && 'bg-gray-200'}`}>
        <BsPersonFillExclamation className={`h-5 w-5 text-gray-500`} />
        <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)}>Profile</Link>
      </motion.div>

      <motion.div whileHover={{ x: 5 }} className="flex items-center text-red-600 gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300">
        <LogOut className="h-5 w-5 text-red-600" />
        <div onClick={handleLogout}>Logout</div>
      </motion.div>
    </nav>
  );
}

export const getServerSideProps = withAuth();