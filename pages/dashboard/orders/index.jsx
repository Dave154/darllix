// pages/dashboard/orders/index.jsx
"use client";

import DashboardLayout from "@/components/dashboardComponents/dashboardLayout";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Trash2,
  RefreshCcw,
  Search,
  ListOrderedIcon,
  Box,
  Check,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/router";
import { withAuth } from "@/lib/withAuth";
import { withAuthAndSubscriptionData } from "@/lib/withSubscription";
import AreYouSureModal from "@/components/dashboardComponents/areYouSure";
import SubscriptionRequired from "@/components/dashboardComponents/subscriptionRequired";
import { BsPeople } from "react-icons/bs";
import OrderPage from "../../../components/dashboardComponents/orderPage";
import { toast } from "sonner";

export default function OrdersPage({ store, hasStore, hasActiveSubscription }) {
  const router = useRouter();

  // If subscription is not active, show overlay
  if (!hasActiveSubscription) {
    return (
      <DashboardLayout>
        <SubscriptionRequired feature="Order management" />
      </DashboardLayout>
    );
  }

  // UI + state
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // selection + confirm modal
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const headerCheckboxRef = useRef(null);
  const [viewing,setViewing] = useState(false)
 
    const { id } = router.query;

    useEffect(()=>{
      if(id){
        console.log(id)
        setViewing(true)
      }else{
        setViewing(false)
      }
    },[id])


  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const fetchOrders = useCallback(
    async (opts = {}) => {
      if (!hasStore) {
        setOrders([]);
        setTotal(0);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(opts.page ?? page));
        params.set("limit", String(opts.limit ?? limit));
        if ((opts.q ?? debouncedQuery).trim()) params.set("q", opts.q ?? debouncedQuery);
        if (store?.id) params.set("storeId", store.id);

        const res = await fetch(`/api/orders?${params.toString()}`);
        if (!res.ok) throw new Error(`Failed: ${res.status}`);
        const json = await res.json();

        setOrders(json.orders || []);
        setTotal(json.total || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [hasStore, page, limit, debouncedQuery, store?.id]
  );

  useEffect(() => {
    fetchOrders({ page, limit, q: debouncedQuery });
  }, [fetchOrders, page, limit, debouncedQuery]);

  // selection
  const selectedCount = selectedIds.length;
  const isAllSelected = orders.length > 0 && selectedCount === orders.length;
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate =
        selectedCount > 0 && selectedCount < orders.length;
    }
  }, [selectedCount, orders.length]);

  function toggleSelectAll() {
    setSelectedIds(isAllSelected ? [] : orders.map((o) => o.id));
  }
  function toggleSelectOne(id) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // delete
  function handleDeleteClick(id) {
    setPendingDelete(id || null);
    setConfirmOpen(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      if (pendingDelete) {
        await fetch(`/api/orders?id=${pendingDelete}`, { method: "DELETE" });
      } else {
        for (const id of selectedIds) {
          await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
        }
      }
      fetchOrders({ page: 1, limit, q: debouncedQuery });
      setPage(1);
      setSelectedIds([]);
    } catch (err) {
      console.error("Delete error", err);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
      setPendingDelete(null);
    }
  }

  const StatusBadge = ({ status, payment }) => {
    const color =
     ( payment === "paid" && status !== 'delivered' )
        ? "bg-yellow-100 text-yellow-700 border-yellow-200"
        : (payment === "pending"  )
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : status === "delivered" ?
        "bg-emerald-100 text-emerald-700 border-emerald-200"

        : "bg-gray-100 text-gray-700 border-gray-200";
    return <Badge className={`border whitespace-nowrap capitalize hover:bg-transparent ${color}`}>
        {
            payment === "paid" && status !== 'delivered' ?
            'paid': 
            payment === 'pending'?
                'pending payment' :
            status=== 'delivered' ?
            'Delivered' :
            ''
            
        }
       
        </Badge>;
  };

  const handleCompleted = async (orderId) => {
  setLoading(true);
  try {
    const res = await fetch(`/api/orders`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        order: {
          id: orderId,       
          status: "delivered" 
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to mark order as delivered");
    }

    const data = await res.json();
    console.log(data)
    setLoading(false);
   router.push('/dashboard/orders')
  } catch (error) {
    console.error("Error marking order delivered:", error);
    toast.error("Error marking order delivered");
    
  } finally {
    setLoading(false);
  }
};

 
  if(viewing){
    return <OrderPage />
  }

  return (
    <DashboardLayout>
      <AreYouSureModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete this order?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loading={deleting}
      />

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl md:text-2xl font-semibold">Orders</h1>
{/* 
          {hasStore && (
              <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  Bulk actions <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDeleteClick()}>
                  Delete selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )} */}
        </div>
          {hasStore && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <Card className="border-dashed">
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground">Total Orders</p>
                          <p className="text-[11px] text-muted-foreground text-xl mt-1">{total
                            } </p>
                        </CardContent>
                      </Card>
                      <Card className="border-dashed">
                        <CardContent className="py-3">
                          <p className="text-xs text-muted-foreground"> Active Orders </p>
                          <p className="text-[11px] text-xl text-muted-foreground mt-1">{orders.filter(order=>order.status === "pending").length}</p>
                        </CardContent>
                      </Card>
                     
                    </div>
                  )}

        <Card>
          <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            {hasStore && (
              <>
                <Button
                  variant="ghost"
                  onClick={() => fetchOrders({ page: 1, limit, q: debouncedQuery })}
                >
                  <RefreshCcw className={`${loading && "animate-rotate"}`} />
                </Button>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search orders"
                    className="pl-8 w-64"
                  />
                </div>
              </>
            )}
          </CardHeader>

          <CardContent>
            {loading && (
              <div className="space-y-2 border rounded-md p-3">
                {Array(6)
                  .fill("")
                  .map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
              </div>
            )}

            {hasStore && !loading && orders.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-8">
                No orders yet.
              </p>
            )}

            {hasStore && !loading && orders.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          ref={headerCheckboxRef}
                          checked={isAllSelected}
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((o) => (
                      <TableRow key={o.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(o.id)}
                            onCheckedChange={() => toggleSelectOne(o.id)}
                          />
                        </TableCell>
                        <TableCell className='line-clamp-1 h-8' >{o.id}</TableCell>
                        <TableCell>{o.buyer_name}</TableCell>
                        <TableCell>
                          <StatusBadge status={o.status} payment={o.payment_status} />
                        </TableCell>
                        <TableCell>₦{Number(o.total).toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(o.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-md hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5 text-gray-700" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {
                               ( o.payment_status === 'paid' && o.status !== 'delivered' ) &&
                              <DropdownMenuItem
                                onClick={() => handleCompleted(o.id)}
                                className="flex items-center gap-2 text-green-600"
                              >
                                <Check className="h-4 w-4" /> Mark as completed

                              </DropdownMenuItem>
                              }
                              <DropdownMenuItem
                                onClick={() =>  router.push(`/dashboard/customers?id=${o.buyer_id}`) }
                                className="flex items-center gap-2"
                              >
                                <BsPeople /> View Customer
                              </DropdownMenuItem>
                               <DropdownMenuItem
                                onClick={() =>  router.push(`/dashboard/orders?id=${o.id}`) }
                                className="flex items-center gap-2"
                              >
                                <Box className="h-4 w-4" /> View Order
                              </DropdownMenuItem>
                               {/* <DropdownMenuItem
                                onClick={() => handleDeleteClick(o.id)}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="h-4 w-4" /> Delete
                              </DropdownMenuItem> */}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {hasStore && total > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1}–
                  {Math.min(page * limit, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm px-2">
                    {page} / {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withAuthAndSubscriptionData();
