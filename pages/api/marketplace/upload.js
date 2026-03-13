import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const form = formidable({
    keepExtensions: true,
    maxFileSize: 20 * 1024 * 1024,
  });

  try {
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({ error: 'Invalid file type' });
    }

    const isVideo = file.mimetype === 'video/mp4';
    const maxSize = isVideo ? 20 * 1024 * 1024 : 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return res.status(400).json({ error: 'File size limit exceeded' });
    }

    const fileExt = file.originalFilename.split('.').pop();
    const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
    const fileData = fs.readFileSync(file.filepath);

    const { error: uploadError } = await supabase.storage
      .from('marketplace_media')
      .upload(fileName, fileData, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from('marketplace_media')
      .getPublicUrl(fileName);

    const postData = {
      vendor_id: session.user.id,
      store_id: fields.storeId?.[0],
      title: fields.title?.[0],
      price: parseFloat(fields.price?.[0]) || 0,
      description: fields.description?.[0] || '',
      media_url: publicUrlData.publicUrl,
      media_type: isVideo ? 'video' : 'image',
    };

    const { data: post, error: dbError } = await supabase
      .from('marketplace_posts')
      .insert([postData])
      .select()
      .single();

    if (dbError) throw dbError;

    fs.unlinkSync(file.filepath);

    return res.status(200).json({ success: true, post });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: error.message });
  }
}