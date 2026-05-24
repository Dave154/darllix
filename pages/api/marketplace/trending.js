import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });

  try {
    const { data: trendingStories, error } = await supabase.rpc('get_trending_stories', {
      limit_count: 10
    });

    if (error) throw error;

    return res.status(200).json({ stories: trendingStories || [] });
  } catch (error) {
    console.error("Trending Stories Error:", error);
    return res.status(500).json({ error: error.message });
  }
}