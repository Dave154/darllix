// components/dashboardComponents/customerDetailsModal.jsx
"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ClipboardCopy } from "lucide-react";

export default function CustomerDetailsModal({ customer, onClose }) {
  if (!customer) {
    console.log(customer)
    return;

  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <Dialog open={!!customer} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <span className="font-semibold">Name: </span>
              <span>{customer.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Email: </span>
              <span>{customer.email}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(customer.email)}
                className="p-1"
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-semibold">Phone: </span>
              <span>{customer.phone}</span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => copyToClipboard(customer.phone)}
                className="p-1"
              >
                <ClipboardCopy className="h-4 w-4" />
              </Button>
            </div>

            <div>
              <span className="font-semibold">Orders: </span>
              <span>{customer.orders_count ?? 0}</span>
            </div>

            <div>
              <span className="font-semibold">Created At: </span>
              <span>{new Date(customer.created_at).toLocaleString()}</span>
            </div>

            {customer.address && (
              <div>
                <span className="font-semibold">Address: </span>
                <span>{customer.address}</span>
              </div>
            )}

            {customer.notes && (
              <div>
                <span className="font-semibold">Notes: </span>
                <span>{customer.notes}</span>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}
