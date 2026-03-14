import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { postId, action, categoryId } = req.body;

  if (!postId || !action) return res.status(400).json({ error: 'Missing data' });

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return res.status(401).json({ error: 'Unauthorized' });

    const userId = session.user.id;
    const { error: logError } = await supabase
      .from('user_interactions')
      .insert([{ user_id: userId, post_id: postId, interaction_type: action }]);

    if (logError && logError.code === '23505') {
      return res.status(200).json({ success: true, message: 'Interaction already tracked' });
    }

    const columnMap = {
      'view': 'view_count',
      'skip': 'skip_count',
      'share': 'share_count',
      'store_click': 'store_clicks'
    };
    
    const targetColumn = columnMap[action];
    
    if (targetColumn) {
      await supabase.rpc('increment_post_metric', { 
        target_post_id: postId, 
        metric_column: targetColumn 
      });
    }

    if (categoryId && action !== 'skip') {
      let points = 0;
      if (action === 'view') points = 1;
      if (action === 'share') points = 3;
      if (action === 'store_click') points = 5;

      if (points > 0) {
        await supabase.rpc('increment_category_affinity', {
          target_user_id: userId,
          target_category_id: categoryId,
          points_to_add: points
        });
      }
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Tracking Error:', error);
    return res.status(500).json({ error: error.message });
  }
}