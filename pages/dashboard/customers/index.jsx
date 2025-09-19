// pages/dashboard/customers/index.jsx
"use client";

import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";
import { motion } from "framer-motion";
import { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
  MoreVertical,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/router";
import { useStore } from "@/store";
import { withAuth } from "../../../lib/withAuth";
import CustomerDetailsModal from "../../../components/dashboardComponents/customerDetailsModal";

export default function CustomersPage({ store, hasStore }) {
  const setStore = useStore((s) => s.setStore);
  const router = useRouter();
  const { id } = router.query;

  // UI
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // data
  const [customers, setCustomers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // sorting
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");

  // modal state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalOpen, setModalOpen] = useState(true);

  useEffect(() => {
    if (store) setStore(store);
  }, [store, setStore]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const fetchCustomers = useCallback(async (opts = {}) => {
    if (!hasStore) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(opts.page ?? page));
      params.set("limit", String(opts.limit ?? limit));
      if ((opts.q ?? debouncedQuery).trim()) params.set("q", opts.q ?? debouncedQuery);
      if (store?.id) params.set("store_id", store.id);
      params.set("sort_by", opts.sortBy ?? sortBy);
      params.set("sort_dir", opts.sortDir ?? sortDir);

      const res = await fetch(`/api/customers?${params.toString()}`, { credentials: "same-origin" });
      const json = await res.json();
      setCustomers(json.customers || []);
      setTotal(json.total || 0);
    } catch (err) {
      console.error("fetchCustomers", err);
    } finally {
      setLoading(false);
    }
  }, [hasStore, page, limit, debouncedQuery, store?.id, sortBy, sortDir]);

  useEffect(() => {
    fetchCustomers({ page, limit, q: debouncedQuery, sortBy, sortDir });
  }, [fetchCustomers, page, limit, debouncedQuery, sortBy, sortDir]);

  // watch id param → open modal
  useEffect(() => {
    if (id) {
      setModalOpen(true);
      setSelectedCustomer(customers.find(c=> c.id));
      
    } else {
      setModalOpen(false);
      setSelectedCustomer(null);
    }
  }, [id]);

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCustomer(null);
    router.push("/dashboard/customers", undefined, { shallow: true });
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">Customers</h1>
          {hasStore && (
            <Button variant="ghost" onClick={() => fetchCustomers({ page: 1 })}>
              <RefreshCcw className={`${loading && "animate-rotate"}`} />
            </Button>
          )}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center gap-3">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search customers" className="pl-8 w-64" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    Sort by <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => setSortBy("created_at")}>Newest</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("name")}>Name</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("email")}>Email</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            {loading && (
              <div className="rounded-md border overflow-hidden">
                {Array(6).fill("").map((_, i) => (
                  <div key={i} className="flex px-2 py-2 gap-5 border-b">
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/4" />
                    <Skeleton className="h-6 w-1/4" />
                  </div>
                ))}
              </div>
            )}

            {!loading && customers.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                 <TableHeader>
  <TableRow>
    <TableHead>Name</TableHead>
    <TableHead>Email</TableHead>
    <TableHead>Phone</TableHead>
    {/* <TableHead>Orders</TableHead> */}
    <TableHead>Actions</TableHead>
  </TableRow>
</TableHeader>
<TableBody>
      {customers.map((c) => (
            <TableRow
              key={c.id}
              className="hover:bg-muted/40"
            >
              <TableCell onClick={() => router.push(`/dashboard/customers?id=${c.id}`, undefined, { shallow: true })} className="cursor-pointer">
                {c.name}
              </TableCell>
              <TableCell onClick={() => router.push(`/dashboard/customers?id=${c.id}`, undefined, { shallow: true })} className="cursor-pointer">
                {c.email}
              </TableCell>
              <TableCell onClick={() => router.push(`/dashboard/customers?id=${c.id}`, undefined, { shallow: true })} className="cursor-pointer">
                {c.phone}
              </TableCell>
              {/* <TableCell onClick={() => router.push(`/dashboard/customers?id=${c.id}`, undefined, { shallow: true })} className="cursor-pointer">
                {c.orders_count ?? 0}
              </TableCell> */}
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push(`/dashboard/customers?id=${c.id}`, undefined, { shallow: true })}>
                      View Details
                    </DropdownMenuItem>
                    {/* Add more actions if needed */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>

                </Table>
              </div>
            )}

            {total > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm">{page} / {totalPages}</div>
                  <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {modalOpen && (
        <>
        
        <CustomerDetailsModal customer={selectedCustomer || customers.find(c=> c.id)} onClose={closeModal} />
        </>
      )}
    </DashboardLayout>
  );
}

export const getServerSideProps = withAuth();
