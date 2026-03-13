import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { postId } = req.body;

  try {
    const { data: existingLike } = await supabase
      .from('post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', session.user.id)
      .single();

    let isLiked = false;

    if (existingLike) {
      const { error } = await supabase.from('post_likes').delete().eq('id', existingLike.id);
      if (error) throw error;
      isLiked = false;
    } else {
      const { error } = await supabase.from('post_likes').insert([{ post_id: postId, user_id: session.user.id }]);
      if (error) throw error;
      isLiked = true;
    }

    return res.status(200).json({ isLiked });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}