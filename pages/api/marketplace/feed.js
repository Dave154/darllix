import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { searchQuery, page = 0, limit = 5 } = req.query;

  try {
    let dbQuery = supabase
      .from('marketplace_posts')
     .select('*, profiles(full_name)');

    if (searchQuery) {
      const formattedQuery = searchQuery.trim().split(/\s+/).join(' | ');
      dbQuery = dbQuery.textSearch('fts', formattedQuery);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.from('search_history').insert([
          { user_id: session.user.id, search_query: searchQuery.trim() }
        ]);
      }
    }

    const from = parseInt(page) * parseInt(limit);
    const to = from + parseInt(limit) - 1;

    const { data: posts, error } = await dbQuery
      .order('is_promoted', { ascending: false })
      .order('created_at', { ascending: false })
      .order('likes_count', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const formattedPosts = posts.map(post => ({
      id: post.id,
      vendorName: post.profiles?.full_name || 'Vendor',
      title: post.title,
      price: post.price,
      description: post.description,
      likesCount: post.likes_count,
      mediaUrl: post.media_url,
      isVideo: post.media_type === 'video',
      isPromoted: post.is_promoted
    }));

    return res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    console.log(error)
    return res.status(500).json({ error: error.message });
  }
}