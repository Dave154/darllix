// pages/dashboard/products/index.jsx
"use client";

import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {Skeleton } from "@/components/ui/skeleton";

import {
  Plus,
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  PlusIcon,
  Edit,
  Trash,
  RefreshCcw,
  MoreVertical,
  Trash2,
  Pencil,
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
import { useStore } from "@/store";
import { withAuth } from "../../../lib/withAuth";
import { openProductModal } from "../../../components/dashboardComponents/productModal";
import AreYouSureModal from "../../../components/dashboardComponents/areYouSure";
import { toast } from "sonner";
import { useUser } from "../../../hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";


export default function ProductsPage({ store, hasStore }) {
  const setStore = useStore((s) => s.setStore);
  const router = useRouter();
  const [addingCat, setAddingCat] = useState(false)
  const {user} = useUser()

  // UI state
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");

  // Data state
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);

  // loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // pagination & sorting
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc");
  const [categories, setCategories] = useState([]);
const [selectedCategory, setSelectedCategory] = useState("all");
  const supabase = useSupabaseClient();

  // search debounce
  const [debouncedQuery, setDebouncedQuery] = useState(query);
// are you sure modal
  const [confirmOpen, setConfirmOpen] = useState(false);
const [pendingDelete, setPendingDelete] = useState(null);
const [deleting,setDeleting] = useState(false)

// selection
 const [selectedIds, setSelectedIds] = useState([]); 
  const headerCheckboxRef = useRef(null);

  useEffect(() => {
    if (store) setStore(store);
  }, [store, setStore]);

  // debounce query (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

// --- update fetchProducts ---
const fetchProducts = useCallback(
  async (opts = {}) => {
    if (!hasStore) {
      setProducts([]);
      setCategories([]);
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
      if ((opts.status ?? tab) && (opts.status ?? tab) !== "All") params.set("status", opts.status ?? tab);
      if (store?.id) params.set("storeId", store.id); 
      if (opts.sortBy ?? sortBy) params.set("sort_by", opts.sortBy ?? sortBy);
      if (opts.sortDir ?? sortDir) params.set("sort_dir", opts.sortDir ?? sortDir);

      const res = await fetch(`/api/products?${params.toString()}`, {
        credentials: "same-origin",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Fetch failed: ${res.status}`);
      }

      const json = await res.json();
      setProducts(json.products || []);
      setCategories(json.categories || []); 
      setTotal(json.total || 0);
    } catch (err) {
      toast.error('Something went wrong. Try again')
      console.error("fetchProducts", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  },
  [hasStore, page, limit, debouncedQuery, tab, store?.id, sortBy, sortDir]
);

// --- category actions ---
async function handleAddCategory(e) {
 e.preventDefault()
 const name =e.target[0].value
  if (!name) return;
  const res = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, storeId: store.id }),
  });
  toast.success('Category added succesfully')
  setAddingCat(false)
  if (res.ok) fetchProducts();
}

async function handleEditCategory(cat) {
  const name = prompt("Edit category name:", cat.name);
  if (!name || name === cat.name) return;
  const res = await fetch(`/api/categories?id=${cat.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  toast.success('Category edited succesfully')

  if (res.ok) fetchProducts();
}

async function handleDeleteCategory(cat) {
   setLoading(true)
  const res = await fetch(`/api/categories?id=${cat.id}`, { method: "DELETE" });
  if (res.ok) fetchProducts();
  toast.success('Category deleted succesfully')

}

  // refetch when page/limit/debouncedQuery/tab/sort change
  useEffect(() => {
    // reset to page 1 when searching or changing filters
    setPage(1);
  }, [debouncedQuery, tab, sortBy, sortDir, limit]);

  useEffect(() => {
    fetchProducts({ page, limit, q: debouncedQuery, status: tab, sortBy, sortDir });
  }, [fetchProducts, page, limit, debouncedQuery, tab, sortBy, sortDir]);

  // Add product flow
  async function handleAddProduct() {
    const options = {
      user,
      supabase
    }
    try {
      const created = await openProductModal(options);
      // If created is falsy -> cancelled
      if (!created) return;
      if (created?.id) {
        // refresh current page to show latest list (safer)
        fetchProducts({ page: 1, limit, q: debouncedQuery, status: tab, sortBy, sortDir });
        setPage(1);
      } else {
        // fallback refresh
        fetchProducts();
      }
    } catch (err) {
      
      console.error("Add product error:", err);
      toast.error('Failed to add product')
    }
  }

   async function handleDeleteSelected() {
    if (selectedIds.length === 0) return;
    setDeleting(true)
    try {
      for (const id of selectedIds) {
        const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
  toast.success('Selected deleted succesfully')

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Delete failed for ${id}`);
        }
      }
      // refresh once after deleting
      await fetchProducts({ page: 1, limit, q: debouncedQuery, status: tab, sortBy, sortDir });
      setPage(1);
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk delete error", err);
      toast.error('Failed to delete selected')
    }finally{
      setDeleting(false)
    }
  }

  // Selection helpers
  const selectedCount = selectedIds.length;
  const isAllSelected = products.length > 0 && selectedCount === products.length;

  // Keep header checkbox indeterminate state synced via ref
  useEffect(() => {
    const ref = headerCheckboxRef.current;
    if (!ref) return;
    try {
      ref.indeterminate = selectedCount > 0 && selectedCount < products.length;
    } catch (err) {
      // some Checkbox implementations don't expose DOM checkbox directly; ignore gracefully
    }
  }, [selectedCount, products.length]);

  function toggleSelectAll() {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  }

  function toggleSelectOne(id) {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      return [...prev, id];
    });
  }

  // Status badge helper
  const StatusBadge = ({ status }) => {
    const color =
      status === "Active"
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : status === "Draft"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-gray-100 text-gray-700 border-gray-200";
    return <Badge className={`border ${color} hover:bg-transparent`}>{status}</Badge>;
  };

  const NoStore = () => (
    <div className="py-16 text-center border rounded-xl bg-white">
      <h3 className="text-xl font-medium">You don’t have a store yet</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        Create your store to start adding products and managing inventory.
      </p>
      <Button onClick={() => router.push("/dashboard/store")}>Create Store</Button>
    </div>
  );

  const EmptyProducts = () => (
    <div className="py-14 text-center border rounded-xl bg-white">
      <h3 className="text-xl font-medium">No products yet</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        Add your first product to start selling.
      </p>
      <Button onClick={handleAddProduct} className="inline-flex items-center gap-2">
        <Plus className="h-4 w-4" /> Add first product
      </Button>
    </div>
  );


  const sortOptions = [
    { value: "created_at", label: "Newest" },
    { value: "updated_at", label: "Recently updated" },
    { value: "price", label: "Price" },
    { value: "name", label: "Name" },
  ];
  const handleEditProduct =async(p)=>{
       try {
      const edited = await openProductModal({initialProduct: p, user, supabase});
      // If created is falsy -> cancelled
      if (!edited) return;
      if (edited?.id) {
        fetchProducts({ page: 1, limit, q: debouncedQuery, status: tab, sortBy, sortDir });
        setPage(1);
      } else {
        fetchProducts();
      }
    } catch (err) {
      toast.error('Error editing product')
      console.error("Error editing product:", err);
    }
      
  }
const handleDeleteProduct = async (id) => {
  setDeleting(true)
try{
  const res = await fetch(`/api/products?id=${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" }, 
  });
  toast.success('Product deleted succesfully')
  fetchProducts({ page: 1, limit, q: debouncedQuery, status: tab, sortBy, sortDir });

} catch(error){
  toast.error('Failed to delete product')
    console.log(error)
  }
  finally{
  setDeleting(false)

  }
}

function handleDeleteClick(id) {
  if(id){
    setPendingDelete(id);
  }
  setConfirmOpen(true);
}
async function confirmDelete() {
  if (!pendingDelete){
    await handleDeleteSelected()
  }else{
    await handleDeleteProduct(pendingDelete); 
  }
  setConfirmOpen(false);
  setPendingDelete(null);
}


  return (
    <DashboardLayout>
      <AreYouSureModal
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={confirmDelete}
  title="Delete this product?"
  description="This action cannot be undone and the product will be permanently removed."
  confirmLabel="Delete"
  cancelLabel="Cancel"
  loading= {deleting}
/>
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        {/* Header row + actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">Products</h1>
          {hasStore && (
            <div className="flex items-center gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    More actions <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {/* <DropdownMenuItem>Archive selected</DropdownMenuItem> */}
                  <DropdownMenuItem onClick={()=>handleDeleteClick()} >Delete selected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={handleAddProduct} className="inline-flex items-center gap-2">
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </div>
          )}
        </div>

        {hasStore && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Card className="border-dashed">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Products available</p>
                <p className="text-[11px] text-muted-foreground text-xl mt-1">{products.filter(p=> p.available > 0 ).length} </p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground"> Total Products </p>
                <p className="text-[11px] text-xl text-muted-foreground mt-1">{total}</p>
              </CardContent>
            </Card>
           
          </div>
        )}

        {/* Main card: Tabs + Table / Empty states */}
        <Card>
          <CardHeader className="overflow-auto scrollbar-thin">
            <div className="flex items-center justify-between gap-3">
              <Tabs value={tab} onValueChange={(v) => setTab(v)}>
                <TabsList>
                  <TabsTrigger value="All">All</TabsTrigger>
                  <TabsTrigger value="Active">Active</TabsTrigger>
                  <TabsTrigger value="Draft">Draft</TabsTrigger>
                  {/* <TabsTrigger value="Archived">Archived</TabsTrigger> */}
                </TabsList>
              </Tabs>
              {hasStore && (
                <div className="flex items-center gap-2">
                   <Button variant="ghost" onClick={() => fetchProducts({ page: 1, limit, q: debouncedQuery, status: tab, sortBy, sortDir })}>
                    <RefreshCcw className={`${loading && 'animate-rotate'}`}/>
                  </Button>
                  <div className="relative hidden md:block">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="pl-8 w-64" />
                  </div>

                  {/* sort dropdown */}
                  {/* <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {sortOptions.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>

                    <Button variant="outline" size="icon" onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}>
                      {sortDir === "asc" ? "▲" : "▼"}
                    </Button>

                    <Button variant="outline" size="icon" className="shrink-0">
                      <SlidersHorizontal className="h-4 w-4" />
                    </Button>
                  </div> */}
                            
              
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="gap-1">
                         Categories <ChevronDown className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className='w-80'>
                      <div onClick={()=>setAddingCat(true)} className="bg-white shadow-sm flex gap-2 p-2 cursor-pointer"> <PlusIcon/> Add Category</div>
                      <div className="grid gap-3 mt-4">  
                        {
                          addingCat &&
                          <form action="" className="" onSubmit={handleAddCategory} >
                            <input type="text" placeholder="Enter Category name" className="px-2 outline-none text-xs my-4 " />                    
                          </form>

                        }
                      {categories.map((cat) => (
                        <div key={cat.id} className="flex justify-between items-center px-2 py-1 border-b bg-blue-100/20">
                          <span>{cat.name}</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant="ghost" onClick={() => handleEditCategory(cat)}><Edit/> </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDeleteCategory(cat)}><Trash/> </Button>
                          </div>
                        </div>
                      ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              
              )}
            </div>

          </CardHeader>

          <CardContent>
            {!hasStore && <NoStore />}

            {loading && (
                <div className="rounded-md border overflow-hidden">
                  <div className="w-full">

                    { Array(6).fill('').map((i) => (
                      <div key={i} className="flex px-2 w-full items-center justify-between border-b py-2 gap-5">
                       <Skeleton className='h-5 w-1/4'  />
                       <Skeleton className='h-6  w-full'  />
                       <Skeleton className='h-6  w-full'  />
                       <Skeleton className='h-6  w-full'  />
                       <Skeleton className='h-6  w-full'  />
                       <Skeleton className='h-6  w-full'  />
                      </div>
                   ))}
                   </div>
              </div>
             
            )}
            {hasStore && !loading && products.length === 0 && <EmptyProducts />}

            {hasStore && !loading && products.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox 
                           ref={headerCheckboxRef}
                          checked={isAllSelected}
                          onCheckedChange={toggleSelectAll}
                          aria-label="Select all"
                        />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Inventory</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((p) =>{

                      console.log(p)
                      return(
                      
                      <TableRow key={p.id} className="hover:bg-muted/40">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(p.id)}
                            onCheckedChange={() => toggleSelectOne(p.id)}
                            aria-label={`Select ${p.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-muted shrink-0 overflow-hidden">
                              {
                                p.images[0] &&
                              <img src={p.images[0]?.url } alt={p.name} className="w-full h-full object-cover" />
                              }
                            </div>
                            <span className="font-medium truncate max-w-[320px]">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status || "Draft"} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">₦{Number(p.price).toFixed(2)}</TableCell>
                       <TableCell className="text-sm text-muted-foreground line-clamp-1  overflow-hidden">

                         {
                         p.categories.map(i=>{
                          return `${i.name} , `
                         })
                         
                         }
                        </TableCell>
                       <TableCell className="text-sm text-muted-foreground">{p.available ?? 0}</TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-2 rounded-md hover:bg-gray-100">
                                <MoreVertical className="h-5 w-5 text-gray-700" />
                              </button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-32">
                              <DropdownMenuItem
                                onClick={() => handleEditProduct(p)}
                                className="flex items-center gap-2 cursor-pointer"
                              >
                                <Pencil className="h-4 w-4 text-sky-600" />
                                <span>Edit</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteClick(p.id)}
                                className="flex items-center gap-2 cursor-pointer text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  }
                  )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Pagination controls */}
            {hasStore && total > 0 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-500">
                  Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
                </p>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="text-sm px-2">{page} / {totalPages}</div>

                  <Button variant="outline" size="icon" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
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

export const getServerSideProps = withAuth();






