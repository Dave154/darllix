"use client";

import DashboardLayout from "../../../components/dashboardComponents/dashboardLayout";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Download as ExportIcon,
  Upload as ImportIcon,
  MoreHorizontal,
  Search,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";



export default function ProductsPage() {
  // ----------- Demo state & switches -----------
  const [hasStore, setHasStore] = useState(true);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("All");

  const [products, setProducts] = useState([
    // Clear this array to preview the empty-table state
    {
      id: "p1",
      name: "(Sample) Coconut Bar Soap",
      status: "Active",
      inventory: "0 in stock",
      salesChannels: 1,
      markets: 2,
      category: "—",
      vendor: "MyStore",
    },
    {
      id: "p2",
      name: "Copy of Custom Notebook",
      status: "Draft",
      inventory: "0 in stock for 24 variants",
      salesChannels: 3,
      markets: 2,
      category: "Notebooks & Notepads",
      vendor: "My Store",
    },
    {
      id: "p3",
      name: "Custom Handmade Mug",
      status: "Active",
      inventory: "Inventory not tracked",
      salesChannels: 3,
      markets: 2,
      category: "Mug",
      vendor: "JS Mob",
    },
    {
      id: "p4",
      name: "Custom Notebook",
      status: "Active",
      inventory: "5 in stock for 24 variants",
      salesChannels: 3,
      markets: 2,
      category: "Notebooks & Notepads",
      vendor: "My Store",
    },
  ]);

  // ----------- Derived list -----------
  const filtered = useMemo(() => {
    let list = products;
    if (tab !== "All") list = list.filter((p) => p.status === tab);
    if (query.trim())
      list = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    return list;
  }, [products, query, tab]);

  // ----------- Render helpers -----------
  const StatusBadge = ({ status }) => {
    const color =
      status === "Active"
        ? "bg-emerald-100 text-emerald-700 border-emerald-200"
        : status === "Draft"
        ? "bg-blue-100 text-blue-700 border-blue-200"
        : "bg-gray-100 text-gray-700 border-gray-200";
    return <Badge className={`border ${color}`}>{status}</Badge>;
  };

  // ---------- Empty States ----------
  const NoStore = () => (
    <div className="py-16 text-center border rounded-xl bg-white">
      <h3 className="text-xl font-medium">You don’t have a store yet</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        Create your store to start adding products and managing inventory.
      </p>
      <Button className="">Create Store</Button>
      <div className="mt-6 text-xs text-muted-foreground">
        (Toggle <code>hasStore</code> to preview other states)
      </div>
    </div>
  );

  const EmptyProducts = () => (
    <div className="py-14 text-center border rounded-xl bg-white">
      <h3 className="text-xl font-medium">No products yet</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        Add your first product to start selling.
      </p>
      <Button className="inline-flex items-center gap-2">
        <Plus className="h-4 w-4" /> Add first product
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-1 md:p-6 space-y-6"
      >
        {/* Header row + actions */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-semibold">Products</h1>
          {hasStore && (
            <div className="flex items-center gap-2">
              <Button variant="outline" className="hidden sm:inline-flex gap-2">
                <ExportIcon className="h-4 w-4" /> Export
              </Button>
              <Button variant="outline" className="hidden sm:inline-flex gap-2">
                <ImportIcon className="h-4 w-4" /> Import
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    More actions <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Bulk actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Edit products</DropdownMenuItem>
                  <DropdownMenuItem>Archive selected</DropdownMenuItem>
                  <DropdownMenuItem>Delete selected</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button className="gap-2">
                <Plus className="h-4 w-4" /> Add product
              </Button>
            </div>
          )}
        </div>

        {/* KPI mini-cards (mirroring Shopify’s row) */}
        {hasStore && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Card className="border-dashed">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Products by sell‑through rate</p>
                <p className="text-[11px] text-muted-foreground mt-1">0% —</p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">Products by days of inventory remaining</p>
                <p className="text-[11px] text-muted-foreground mt-1">There was no data found for this date range</p>
              </CardContent>
            </Card>
            <Card className="border-dashed">
              <CardContent className="py-3">
                <p className="text-xs text-muted-foreground">ABC product analysis</p>
                <p className="text-[11px] text-muted-foreground mt-1">There was no data found for this date range</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main card: Tabs + Table / Empty states */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <Tabs value={tab} onValueChange={(v) => setTab(v)}>
                <TabsList>
                  <TabsTrigger value="All">All</TabsTrigger>
                  <TabsTrigger value="Active">Active</TabsTrigger>
                  <TabsTrigger value="Draft">Draft</TabsTrigger>
                  <TabsTrigger value="Archived">Archived</TabsTrigger>
                </TabsList>
              </Tabs>

              {hasStore && (
                <div className="flex items-center gap-2">
                  <div className="relative hidden md:block">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search products"
                      className="pl-8 w-64"
                    />
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!hasStore && <NoStore />}

            {hasStore && products.length === 0 && <EmptyProducts />}

            {hasStore && products.length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox aria-label="Select all" />
                      </TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>Sales channels</TableHead>
                      <TableHead>Markets</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id} className="hover:bg-muted/40">
                        <TableCell>
                          <Checkbox aria-label={`Select ${p.name}`} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-md bg-muted shrink-0" />
                            <span className="font-medium truncate max-w-[320px]">{p.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.inventory}</TableCell>
                        <TableCell className="text-sm">{p.salesChannels}</TableCell>
                        <TableCell className="text-sm">{p.markets}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.category}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{p.vendor}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dev toggles for quick preview (remove in prod) */}
        <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle className="text-sm">Preview toggles</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <Button variant="outline" onClick={() => setHasStore((s) => !s)}>
              Toggle hasStore: <span className="ml-1 font-mono">{String(hasStore)}</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setProducts((p) => (p.length ? [] : products))}
            >
              Toggle empty products
            </Button>
            <Button variant="outline" onClick={() => setTab("All")}>Reset filters</Button>
          </CardContent>
        </Card>
      </motion.div>
    </DashboardLayout>
  );
}
