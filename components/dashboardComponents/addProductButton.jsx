

import React, { useCallback } from "react";
import { openProductModal } from "./productModal";
import {Button} from  "@/components/ui/button";
import { Plus } from "lucide-react";
export default function AddProductButton({ onCreated, supabase, bucket = "product-images" }) {
  // onCreated(product) will be called if provided
  const handleClick = useCallback(async () => {
    try {
      const product = await openProductModal({ supabase, bucket, onCreateProduct: null });
      if (!product) {
        // cancelled
        return;
      }
      // product.images contains uploaded { path, url } objects
      // product.previewUrls has original preview urls
      if (typeof onCreated === "function") onCreated(product);
      else {
        // default: simply log it
        console.log("Product created:", product);
      }
    } catch (err) {
      console.error("openProductModal error:", err);
    }
  }, [onCreated, supabase, bucket]);

  return (
    <Button className="gap-2" onClick={handleClick} >
        <Plus className="h-4 w-4" /> Add product
    </Button>
  );
}
