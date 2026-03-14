import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createPagesServerClient({ req, res });
  const { postId, title, price, description } = req.body;

  if (!postId || !title || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { error } = await supabase
      .from('marketplace_posts')
      .update({
        title,
        price,
        description
      })
      .eq('id', postId)
      .eq('vendor_id', session.user.id); 

    if (error) throw error;

    return res.status(200).json({ success: true, message: 'Post updated successfully' });
  } catch (error) {
    console.error('Edit error:', error);
    return res.status(500).json({ error: error.message });
  }
}