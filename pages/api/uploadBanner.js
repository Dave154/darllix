// pages/api/uploadBanner.js
import { getSupabaseServer } from "@/lib/supabaseClient";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false, // required for formidable
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const supabase = getSupabaseServer({ req, res });

  // Verify user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Parse file
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ message: "File parse failed" });

    const file = files.file?.[0];
    if (!file) return res.status(400).json({ message: "No file uploaded" });

    const fileData = fs.readFileSync(file.filepath);
    const ext = file.originalFilename.split(".").pop();
    const path = `${user.id}/banner-${Date.now()}.${ext}`;

    // Upload to supabase storage
    const { data, error } = await supabase.storage
      .from("store-banners")
      .upload(path, fileData, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("store-banners").getPublicUrl(path);

    res.status(200).json({ url: publicUrl });
  });
}
