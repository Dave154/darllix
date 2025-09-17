

import React, { useCallback } from "react";
import { openProductModal } from "./productModal";
import {Button} from  "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUser } from "../../hooks/useUser";


export default function AddProductButton({ onCreated, supabase, bucket = "product-images" }) {
  const {user}= useUser()
  const options ={
    user,
    bucket
  }
  async function handleClick() {
    try {
      const created = await openProductModal({options});
      if (!created) return;
      if (created?.id) {
       onCreated()
      
      } else {
        
              onCreated()

      }
    } catch (err) {
      console.error("Add product error:", err);
      alert("Failed to add product: " + (err?.message || err));
    }
  }

  return (
    <Button className="gap-2" onClick={handleClick} >
        <Plus className="h-4 w-4" /> Add product
    </Button>
  );
}
