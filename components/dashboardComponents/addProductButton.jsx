

import React, { useCallback } from "react";
import { openProductModal } from "./productModal";
import {Button} from  "@/components/ui/button";
import { Plus } from "lucide-react";
import { useUser } from "../../hooks/useUser";
import { useSupabaseClient } from "@supabase/auth-helpers-react";


export default function AddProductButton({ onCreated, bucket = "product-images" }) {
  const {user}= useUser()
  const supabase = useSupabaseClient();

  async function handleClick() {
    try {

      const created = await openProductModal({user,supabase});
      if (!created) return;
      
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
