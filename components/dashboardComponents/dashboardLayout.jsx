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
  HelpCircle,
  Settings,
  ChevronDown,
  Menu,
  X,
  LogOut,
  Eye,
} from "lucide-react";
import { FaTruck } from "react-icons/fa";
import { BsCreditCard2FrontFill, BsPersonFillExclamation} from "react-icons/bs";
import { PiPiggyBankThin } from "react-icons/pi";
import { RxLightningBolt } from "react-icons/rx";
import { useRouter } from "next/router";
import { useState } from "react";
import { useEffect } from "react";
import Loader from "./loader";
import TrialBanner from "./trialBanner";
import Image from "next/image";
import { toast, Toaster } from "sonner";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { useUser } from "../../hooks/useUser";
import { withAuth } from "../../lib/withAuth";
import AreYouSureModal from "./areYouSure";
import Notification from "./bannerNotification";

const menuItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  { title: "Products", icon: ShoppingBag, href: "/dashboard/products" },
  { title: "Customers", icon: Users, href: "/dashboard/customers" },
  { title: "Orders", icon: Package, href: "/dashboard/orders" },
  { title: "Finance", icon: BsCreditCard2FrontFill, href: "/dashboard/finance" },
  // { title: "Fufilment", icon: FaTruck , href: "/dashboard/fufilment" },
  { title: "Sell & Save", icon: PiPiggyBankThin, href: "/dashboard/sellandsave" },

];



export default function DashboardLayout({ children }) {
  const [openStore, setOpenStore] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [storeDropdown, setStoreDropdown] = React.useState(false);
  const router = useRouter();
const [loading, setLoading] = useState(false);
const [withdrawing,setWithdrawing]= useState(false)
const [requesting, setRequesting]= useState(false)
   const { user, profile } = useUser();
 const supabase = useSupabaseClient();


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
    return (
      (parts[0][0] || "").toUpperCase() +
      (parts[parts.length - 1][0] || "").toUpperCase()
    );
  };


async function handleWithdraw() {
  if (Number(profile?.available_balance || 0) <= 0) {
    toast.error("No balance to withdraw");
    return;
  }
  const withdrawal = {
      owner_id: user.id,
      accountname: profile.account_name,
      accountnumber: profile?.account_number,
      bankname: profile?.bank_name,
      amount: profile?.available_balance * 95/100,
      paymentreference: `PAY_REF_11223${new Date()}`,
      date: new Date(),
      status: "pending",
    };
    setWithdrawing(true);
 try {
    const { data, error } = await supabase
      .from("withdrawalRequest")
      .insert([withdrawal]);

      const {updateBal}= await supabase 
      .from("profiles").update({ available_balance: 0 }).eq("id", user.id);
    if (error) throw error;
   toast.success("Withdrawal requested successfully!");
    router.reload();
  } catch (error) {
    toast.error(error.message || "Something went wrong");
  }


  // try {
  //   const res = await fetch("/api/wallet", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ amount: Number(profile.available_balance) }),
  //   });

  //   const json = await res.json();
  //   if (!res.ok) throw new Error(json?.error || json?.message || "Withdrawal failed");

  //   toast.success("Withdrawal requested successfully!");
  //   router.reload();
  // } catch (err) {
  //   console.error("Withdraw error", err);
  //   toast.error(err.message || "Something went wrong");
  // }
   finally {
    setWithdrawing(false);
  }
}

  return (
   
    <>

    <Toaster
      position="top-right"
    />
    <AreYouSureModal
        open={requesting}
        onClose ={()=>setRequesting(false)}
        onConfirm={handleWithdraw }
        title = "Are you sure?"
        description = {`You are about to withdraw ₦${profile?.available_balance.toLocaleString()
          
        }  to ${profile?.account_number} ${profile?.bank_name}. 
         You will be charged 5% for each withdrawal`}
        confirmLabel = "Yes, continue"
        cancelLabel = "Cancel"
        loading = {withdrawing}
        safe
    />
    <div className="flex flex-col h-screen bg-color4 text-color3">
      {  loading &&  <Loader /> }
    
      {/* Top Navbar spanning full width */}
      <header className="h-14 bg-black text-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Hamburger only on mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded hover:bg-gray-800"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="text-lg flex gap-2 items-center font-bold"
          >
            <Image
              src={'/darllix_logo.png'}
              alt='logo'
              width={1000}
              height={1000}
              className='w-8 h-8'
            /> 
            <span className="">Darllix</span>
          </div>
        </div>

        {/* Center: Search */}
        {/* <div className="flex-1 max-w-md mx-4 hidden sm:flex">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-md bg-gray-800 text-sm text-white px-3 py-1 pl-8 focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 1116.65 16.65z"
              />
            </svg>
          </div>
        </div> */}

        {/* Right: Store Dropdown + Profile */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setStoreDropdown(!storeDropdown)}
            className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-700"
          >
            {/* <Eye className="w-5 mr-2"/> */}
            ₦{profile?.available_balance?.toLocaleString()}
            
          </button>

          {/* Dropdown menu */}
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
        <div className="text-sm text-slate-500">Wallet Balance</div>
        <div className="text-2xl font-bold text-indigo-700">₦{Number(profile?.available_balance || 0).toFixed(2).toLocaleString()}</div>
      </div>

      <div className="px-4 py-3">
        <button
          onClick={()=> setRequesting(true)}
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
           { getInitials(profile?.full_name)}
          </div>
        </div>
      </header>

      {/* Main section: Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-60 border-r border-gray-300 bg-color4 flex-col">
          <SidebarContent
            openStore={openStore}
            setOpenStore={setOpenStore}
            setMobileOpen={setMobileOpen}
          />
        </aside>

        {/* Sidebar (Mobile Drawer) */}
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
               <div className="text-lg flex gap-2 items-center font-bold"
          >
            <Image
              src={'/darllix_logo.png'}
              alt='logo'
              width={1000}
              height={1000}
              className='w-8 h-8'
            /> 
            <span className="">Darllix</span>
          </div>
                <button onClick={() => setMobileOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <SidebarContent
                openStore={openStore}
                setOpenStore={setOpenStore}
                setMobileOpen={setMobileOpen}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Overlay for mobile */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Page content */}
        <main className="flex-1 p-1 md:p-6 space-y-6 overflow-y-auto">
          <Notification message="Your request of 7,000 is pending and will be disbursed shortly" />
          <TrialBanner />
          {children}
        </main>
      </div>
    </div>
        </>
  );
}

/* Sidebar Content */
function SidebarContent({ openStore, setOpenStore, setMobileOpen }) {
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
    <nav className="flex-1 flex flex-col px-2 py-4 space-y-1">
      <div className="flex-1">

      {menuItems.map((item, i) => (
        <motion.div
        key={i}
        whileHover={{ x: 5 }}
        className={`flex  items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${router.pathname === item.href && "bg-gray-200 "} hover:bg-gray-300`}
        >
          <item.icon className="h-5 w-5 text-gray-500" />
          <Link
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className="flex-1"
            >
            {item.title}
          </Link>
        </motion.div>
      ))}

      {/* My Store expandable */}
     
    
      <div>
        <button
          onClick={() => {
            setOpenStore(!openStore)
            router.push('/dashboard/store')
          }
          }
          className={`flex w-full flex-1 items-center justify-between px-3 py-2 rounded-md ${router.pathname === '/dashboard/store' && "bg-gray-200"} hover:bg-gray-300`}
          >
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-gray-500" />
            <span>My Store</span>
          </div>
          {/* <ChevronDown
            className={`h-4 w-4 transition-transform ${
              openStore ? "rotate-180" : ""
            }`}
            /> */}
        </button>

        <AnimatePresence>
          {openStore && (
            <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="pl-10 flex flex-col space-y-1"
            >
              {/* {storeSubItems.map((sub, i) => (
                <Link
                key={i}
                href={sub.href}
                onClick={() => setMobileOpen(false)}
                className="block py-1 text-sm text-gray-400 hover:text-color3 transition-all"
                >
                  {sub.title}
                </Link>
              ))} */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
          </div>

      {/* Divider */}
      <div className="border-t border-gray-300 my-3"></div>

      {/* Help */}

          <motion.div
        whileHover={{ x: 5 }}
        className="flex items-center gap-3 px-3 py-2  cursor-pointer bg-blue-300/50 backdrop-blur text-white shadow-md shadow-blue-200  rounded-xl hover:bg-gray-300"
      >
        <RxLightningBolt className="h-5 w-5 text-blue-300" />
        <Link href="/dashboard/pricing" onClick={() => setMobileOpen(false)}>
          Upgrade your plan
        </Link>
      </motion.div>

      <motion.div
        whileHover={{ x: 5 }}
        className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300  ${router.pathname === '/dashboard/profile' && 'bg-gray-200'}` }
      >
        <BsPersonFillExclamation className={`h-5 w-5 text-gray-500`}/>
        <Link href="/dashboard/profile" onClick={() => setMobileOpen(false)}>
          Profile
        </Link>
      </motion.div>
      {/* <motion.div
        whileHover={{ x: 5 }}
        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300"
      >
        <HelpCircle className="h-5 w-5 text-gray-500" />
        <Link href="/dashboard/help" onClick={() => setMobileOpen(false)}>
          Help
        </Link>
      </motion.div> */}


      {/* Settings */}
      {/* <motion.div
        whileHover={{ x: 5 }}
        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300"
      >
        <Settings className="h-5 w-5 text-gray-500" />
        <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}>
          Settings
        </Link>
      </motion.div> */}
       <motion.div
        whileHover={{ x: 5 }}
        className="flex items-center text-red-600 gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300"
      >
        <LogOut className="h-5 w-5 text-red-600" />
        <div onClick={handleLogout}>
          Logout
        </div>
      </motion.div>
    </nav>
  );
}

export const getServerSideProps = withAuth();
