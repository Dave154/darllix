import { getSupabaseServer } from "@/lib/supabaseClient";

export default async function handler(req, res) {
  const supabase = getSupabaseServer({ req, res });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.query;

  // confirm ownership
  const { data: store } = await supabase
    .from("stores")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!store) return res.status(403).json({ error: "Not allowed" });

  if (req.method === "PUT") {
    const { product } = req.body;

    const payload = {
      name: product.name,
      price: product.price,
      discount_price: product.discountPrice ?? null,
      description: product.description ?? null,
      images: product.images ?? [],
      updated_at: new Date().toISOString(),
       available: Number.isFinite(Number(product.available)) ? Number(product.available) : 0,
    };

    const { data, error } = await supabase
      .from("products")
      .update(payload)
      .eq("id", id)
      .eq("store_id", store.id)
      .select("*")
      .single();

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ product: data });
  }

  if (req.method === "DELETE") {
    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", id)
      .eq("store_id", store.id);

    if (error) return res.status(400).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  res.setHeader("Allow", ["PUT", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
