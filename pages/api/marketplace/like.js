import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { sendEmail } from '../../../lib/sendEmail';

// Define the exact milestones you want to celebrate
const MILESTONES = [1,5, 50, 100, 500, 1000];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) return res.status(401).json({ error: 'Unauthorized' });

  const { postId } = req.body;
console.log('0')
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

      // Fetch the updated post data
      const { data: postData , error:postError} = await supabase
        .from('marketplace_posts')
        .select('title, likes_count, vendor_id, stores(owner_id)')
        .eq('id', postId)
        .single();

        if(postError){
          console.log(postError)
        }
console.log('postData',postData)
      // THE DYNAMIC MILESTONE CHECK
      if (postData && MILESTONES.includes(postData.likes_count)) {
        console.log('1')
        const ownerId = postData.vendor_id || postData.stores?.user_id;
        
        if (ownerId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', ownerId)
            .single();

          if (profile?.email) {
            console.log('2')
            // Customize the subject line based on the size of the milestone
            let subjectLine = `👀 People are eyeing "${postData.title}"...`;
            if (postData.likes_count >= 100) subjectLine = `🔥 "${postData.title}" is officially hot on Darllix!`;
            if (postData.likes_count >= 500) subjectLine = `🚀 VIRAL: "${postData.title}" just hit ${postData.likes_count} likes!`;

            await sendEmail({
              to: profile.email,
              subject: `Update: Your post "${postData.title}" reached ${postData.likes_count} likes`,
              html: `
                <div style="font-family: Arial, sans-serif; font-size: 15px; color: #333333; max-width: 600px; line-height: 1.5;">
                  <p>Hi ${profile.full_name?.split(' ')[0] || 'there'},</p>
                  
                  <p>Just a quick update from Darllix: your product <strong>"${postData.title}"</strong> has reached <strong>${postData.likes_count} likes</strong>.</p>
                  
                  <p>Users are currently saving this item to their profiles. You may want to check your store to ensure your inventory is updated or to reply to any pending inquiries.</p>
                  
                  <p><a href="https://darllix.shop/dashboard/marketplace?tab=discover&post=${postId}" style="color: #4A21EF; font-weight: bold;">View your post activity here</a></p>
                  
                  <br>
                  <p>Best,<br>The Darllix Team</p>
                  
                  <hr style="border: none; border-top: 1px solid #eeeeee; margin-top: 40px; margin-bottom: 20px;" />
                  <p style="font-size: 12px; color: #888888;">
                    You are receiving this system notification because you are a registered vendor on Darllix.
                  </p>
                </div>
              `
            });
          }
        }
      }
    }

    return res.status(200).json({ isLiked });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}