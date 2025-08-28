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
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", icon: Home, href: "/dashboard" },
  { title: "Products", icon: ShoppingBag, href: "/dashboard/products" },
  { title: "Customers", icon: Users, href: "/dashboard/customers" },
  { title: "Orders", icon: Package, href: "/dashboard/orders" },
];

const storeSubItems = [
  { title: "Analytics", href: "/dashboard/store/analytics" },
  { title: "Inventory", href: "/dashboard/store/inventory" },
  { title: "Marketing", href: "/dashboard/store/marketing" },
  { title: "Settings", href: "/dashboard/store/settings" },
];

export default function DashboardLayout({ children }) {
  const [openStore, setOpenStore] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [storeDropdown, setStoreDropdown] = React.useState(false);

  return (
    <div className="flex flex-col h-screen bg-color4 text-color3">
      {/* Top Navbar spanning full width */}
      <header className="h-14 bg-black text-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-3">
          {/* Hamburger only on mobile */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 rounded hover:bg-gray-800"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-bold">Darllix</span>
        </div>

        {/* Center: Search */}
        <div className="flex-1 max-w-md mx-4 hidden sm:flex">
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
        </div>

        {/* Right: Store Dropdown + Profile */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setStoreDropdown(!storeDropdown)}
            className="hidden sm:flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-md text-sm hover:bg-gray-700"
          >
            My Store
            <ChevronDown
              className={`h-3 w-3 transition-transform ${
                storeDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {storeDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute right-12 top-12 bg-white text-black rounded-md shadow-lg py-2 w-48 z-50"
              >
                {storeSubItems.map((sub, i) => (
                  <Link
                    key={i}
                    href={sub.href}
                    className="block px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {sub.title}
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-green-500 text-black font-semibold cursor-pointer">
            MS
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
                <span className="text-xl font-bold">Darllix</span>
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
          {children}
        </main>
      </div>
    </div>
  );
}

/* Sidebar Content */
function SidebarContent({ openStore, setOpenStore, setMobileOpen }) {
  return (
    <nav className="flex-1 px-2 py-4 space-y-1">
      {menuItems.map((item, i) => (
        <motion.div
          key={i}
          whileHover={{ x: 5 }}
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300"
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
          onClick={() => setOpenStore(!openStore)}
          className="flex w-full items-center justify-between px-3 py-2 rounded-md hover:bg-gray-300"
        >
          <div className="flex items-center gap-3">
            <Store className="h-5 w-5 text-gray-500" />
            <span>My Store</span>
          </div>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              openStore ? "rotate-180" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {openStore && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="pl-10 flex flex-col space-y-1"
            >
              {storeSubItems.map((sub, i) => (
                <Link
                  key={i}
                  href={sub.href}
                  onClick={() => setMobileOpen(false)}
                  className="block py-1 text-sm text-gray-400 hover:text-color3 transition-all"
                >
                  {sub.title}
                </Link>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-300 my-3"></div>

      {/* Help */}
      <motion.div
        whileHover={{ x: 5 }}
        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300"
      >
        <HelpCircle className="h-5 w-5 text-gray-500" />
        <Link href="/dashboard/help" onClick={() => setMobileOpen(false)}>
          Help
        </Link>
      </motion.div>

      {/* Settings */}
      <motion.div
        whileHover={{ x: 5 }}
        className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-gray-300"
      >
        <Settings className="h-5 w-5 text-gray-500" />
        <Link href="/dashboard/settings" onClick={() => setMobileOpen(false)}>
          Settings
        </Link>
      </motion.div>
    </nav>
  );
}
