import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { searchQuery, page = 0, limit = 5 } = req.query;
  const { data: { session } } = await supabase.auth.getSession();

  const from = parseInt(page) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  try {
    if (searchQuery) {
      let dbQuery = supabase
        .from('marketplace_posts')
        .select('*, profiles(full_name), stores(subdomain)');

      const cleanQuery = searchQuery.trim();
      const safeQuery = cleanQuery.replace(/"/g, ''); 

      if (cleanQuery.startsWith('@')) {
        const targetSubdomain = safeQuery.substring(1); 
        const { data: targetStore } = await supabase
          .from('stores')
          .select('id')
          .eq('subdomain', targetSubdomain)
          .single();

        if (targetStore) {
          dbQuery = dbQuery.eq('store_id', targetStore.id);
        } else {
          dbQuery = dbQuery.eq('id', '00000000-0000-0000-0000-000000000000');
        }
      } else {
        const { data: vendorProfiles } = await supabase
          .from('profiles')
          .select('id')
          .ilike('full_name', `%${safeQuery}%`);
          
        const vendorIds = vendorProfiles?.map(v => v.id) || [];
        let orCondition = `fts.wfts."${safeQuery}"`; 
        
        if (vendorIds.length > 0) {
          orCondition += `,vendor_id.in.(${vendorIds.join(',')})`;
        }
        dbQuery = dbQuery.or(orCondition);
      }

      if (session) {
        await supabase.from('search_history').insert([
          { user_id: session.user.id, search_query: cleanQuery }
        ]);
      }

      const { data: posts, error } = await dbQuery
        .order('is_promoted', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      let userLikedPostIds = new Set();
      if (session && posts.length > 0) {
        const postIds = posts.map(p => p.id);
        const { data: likes } = await supabase
          .from('post_likes')
          .select('post_id')
          .in('post_id', postIds)
          .eq('user_id', session.user.id);
          
        if (likes) {
          userLikedPostIds = new Set(likes.map(l => l.post_id));
        }
      }

      const now = new Date().getTime();

      const formattedPosts = posts.map(post => {
        const isCurrentlyPromoted = post.is_promoted && post.promoted_until && new Date(post.promoted_until).getTime() > now;
        
        return {
          id: post.id,
          vendorId: post.vendor_id,
          vendorName: post.profiles?.full_name || 'Vendor',
          vendorSlug: post.stores?.subdomain || '', 
          title: post.title,
          price: post.price,
          description: post.description,
          likesCount: post.likes_count,
          mediaUrl: post.media_url,
          isVideo: post.media_type === 'video',
          isPromoted: isCurrentlyPromoted,
          user_has_liked: userLikedPostIds.has(post.id)
        };
      });

      return res.status(200).json({ posts: formattedPosts });
    }

    let organicPosts = [];
    
    if (session) {
      const { data, error } = await supabase.rpc('get_personalized_feed', {
        buyer_id: session.user.id,
        page_limit: limit,
        page_offset: from
      });
      
      if (error) throw error;
      
      organicPosts = (data || []).map(post => ({
        id: post.id,
        vendorId: post.vendor_id,
        vendorName: post.vendor_name || 'Vendor',
        vendorSlug: post.vendor_slug || '',
        title: post.title,
        price: post.price,
        description: post.description,
        likesCount: post.likes_count,
        mediaUrl: post.media_url,
        isVideo: post.media_type === 'video',
        isPromoted: false, 
        user_has_liked: post.user_has_liked
      }));
    } else {
      const { data, error } = await supabase
        .from('marketplace_posts')
        .select('*, profiles(full_name), stores(subdomain)')
        .eq('is_promoted', false)
        .order('likes_count', { ascending: false })
        .range(from, to);
        
      if (error) throw error;
      
      organicPosts = (data || []).map(post => ({
        id: post.id,
        vendorId: post.vendor_id,
        vendorName: post.profiles?.full_name || 'Vendor',
        vendorSlug: post.stores?.subdomain || '',
        title: post.title,
        price: post.price,
        description: post.description,
        likesCount: post.likes_count,
        mediaUrl: post.media_url,
        isVideo: post.media_type === 'video',
        isPromoted: false,
        user_has_liked: false
      }));
    }

    let finalFeed = [...organicPosts];
    
    if (organicPosts.length > 0) {
      const currentPage = parseInt(page);
      
      const { data: promotedData } = await supabase
        .from('marketplace_posts')
        .select('*, profiles(full_name), stores(subdomain)')
        .eq('is_promoted', true)
        .gt('promoted_until', new Date().toISOString())
        .order('created_at', { ascending: false })
        .range(currentPage, currentPage); 
        
      if (promotedData && promotedData.length > 0) {
        const ad = promotedData[0];
        
        let adLiked = false;
        if (session) {
          const { data: adLike } = await supabase
            .from('post_likes')
            .select('id')
            .eq('post_id', ad.id)
            .eq('user_id', session.user.id)
            .single();
          if (adLike) adLiked = true;
        }

        const formattedAd = {
          id: ad.id,
          vendorId: ad.vendor_id,
          vendorName: ad.profiles?.full_name || 'Vendor',
          vendorSlug: ad.stores?.subdomain || '',
          title: ad.title,
          price: ad.price,
          description: ad.description,
          likesCount: ad.likes_count,
          mediaUrl: ad.media_url,
          isVideo: ad.media_type === 'video',
          isPromoted: true,
          user_has_liked: adLiked
        };
        
        finalFeed = finalFeed.filter(p => p.id !== formattedAd.id);
        
        const insertIndex = finalFeed.length >= 2 ? 2 : finalFeed.length;
        finalFeed.splice(insertIndex, 0, formattedAd);
      }
    }

    return res.status(200).json({ posts: finalFeed });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: error.message });
  }
}