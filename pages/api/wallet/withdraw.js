// pages/api/wallet/withdraw.js
import { getSupabaseServer } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabase = getSupabaseServer({ req, res });

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { amount, storeId } = req.body || {};
  if (!amount || amount <= 0 || !storeId) {
    return res.status(400).json({ message: "Invalid request" });
  }

  // 1. Fetch the store and its sell_save_balance
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id, owner_id, sell_save_balance")
    .eq("id", storeId)
    .single();

  if (storeError || !store) {
    return res.status(404).json({ message: "Store not found" });
  }

  if (store.owner_id !== user.id) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (store.sell_save_balance < amount) {
    console.log(store.sell_save_balance,amount)
    return res.status(400).json({ message: "Insufficient Sell & Save balance" });
  }

  // 2. Deduct from Sell & Save balance
  const newSellSaveBalance = store.sell_save_balance - amount;
  const { error: updateStoreError } = await supabase
    .from("stores")
    .update({
      sell_save_balance: newSellSaveBalance,
    //   updated_at: new Date().toISOString(),
    })
    .eq("id", storeId);

  if (updateStoreError) {
    return res.status(400).json({ message: updateStoreError.message });
  }

  // 3. Fetch the user's profile available balance
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("available_balance")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return res.status(404).json({ message: "Profile not found" });
  }

  // 4. Add withdrawn amount to profile available balance
  const newProfileBalance = (profile.available_balance || 0) + amount;
  const { data: updatedProfile, error: updateProfileError } = await supabase
    .from("profiles")
    .update({
      available_balance: newProfileBalance,
    //   updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)
    .select("available_balance")
    .single();

  if (updateProfileError) {
    return res.status(400).json({ message: updateProfileError.message });
  }

  return res.status(200).json({
    message: "Withdrawal successful",
    sellSaveBalance: newSellSaveBalance,
    availableBalance: updatedProfile.available_balance,
  });
}

