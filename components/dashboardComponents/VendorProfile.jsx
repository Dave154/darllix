import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Grid, Play, Store, Loader2, Link as LinkIcon, X } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import MarketplacePost from './marketplacePost';

export default function VendorProfile({ slug, onClose, currentUserId }) {
  const [vendor, setVendor] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (!slug) return;

    const fetchVendorData = async () => {
      setLoading(true);
      try {
        const { data: storeData, error: storeError } = await supabase
          .from('stores')
          .select('*')
          .eq('subdomain', slug)
          .single();

        if (storeError) throw storeError;

        const ownerId = storeData.vendor_id || storeData.user_id;
        let profileData = null;
        
        if (ownerId) {
          const { data: pData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', ownerId)
            .single();
            
          profileData = pData;
        }

        setVendor({ ...storeData, profiles: profileData });

        const { data: postsData, error: postsError } = await supabase
          .from('marketplace_posts')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // NEW: Fetch which posts the current user has actually liked!
        let likedPostIds = [];
        if (currentUserId && postsData?.length > 0) {
          const postIds = postsData.map(p => p.id);
          const { data: likesData } = await supabase
            .from('post_likes')
            .select('post_id')
            .eq('user_id', currentUserId)
            .in('post_id', postIds);
            
          if (likesData) {
            likedPostIds = likesData.map(l => l.post_id);
          }
        }

        const mappedPosts = (postsData || []).map(post => ({
          id: post.id,
          title: post.title,
          description: post.description,
          price: post.price,
          mediaUrl: post.media_url,
          mediaType: post.media_type,
          isVideo: post.media_type === 'video' || post.media_url?.includes('.mp4'),
          likesCount: post.likes_count || 0,
          vendorName: storeData.name || profileData?.full_name,
          vendorSlug: storeData.subdomain,
          vendorId: post.vendor_id,
          storeId: post.store_id,
          user_has_liked: likedPostIds.includes(post.id) 
        }));

        setPosts(mappedPosts);

      } catch (error) {
        console.error("Error fetching vendor profile:", error);
        toast.error("Could not load store profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchVendorData();
  }, [slug, supabase, currentUserId]);

  const handleVisitStore = () => {
    if (!slug) return;
    const currentHost = window.location.host;
    const protocol = window.location.protocol;
    const isLocalhost = currentHost.includes('localhost');
    const baseDomain = isLocalhost ? 'localhost:3000' : currentHost.replace(/^[^.]+\./g, '');
    window.open(`${protocol}//${slug}.${baseDomain}`, '_blank');
  };

  const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0);

  return (
    <motion.div 
      initial={{ x: '100%' }} 
      animate={{ x: 0 }} 
      exit={{ x: '100%' }}
      transition={{ type: "spring", damping: 25, stiffness: 250 }}
      className="absolute inset-0 w-full h-full bg-white z-[99999] flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white shrink-0 pt-safe">
        <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
          <ChevronLeft className="w-7 h-7 text-color3" />
        </button>
        <span className="font-bold text-color3 text-lg">{slug}</span>
        <div className="w-10" /> 
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-color1" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-20 custom-scrollbar">
          <div className="bg-white px-4 pt-6 pb-4">
            <div className="flex items-center gap-6 mb-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-color1 to-color2 p-[3px] shrink-0">
                <div className="w-full h-full bg-white rounded-full flex items-center justify-center overflow-hidden border-2 border-white">
                  {vendor?.profiles?.avatar_url ? (
                    <img src={vendor.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-color1">{vendor?.name?.charAt(0) || "V"}</span>
                  )}
                </div>
              </div>
              
              <div className="flex-1 flex justify-center gap-12 text-center">
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-color3">{posts.length}</span>
                  <span className="text-xs text-gray-500">Posts</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-lg text-color3">{totalLikes}</span>
                  <span className="text-xs text-gray-500">Likes</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-4">
              <h2 className="font-bold text-color3 text-sm">{vendor?.name || "Store Name"}</h2>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                {vendor?.description || "Welcome to our official Darllix store! We provide the best quality products with fast shipping."}
              </p>
              <button 
                onClick={handleVisitStore}
                className="flex items-center gap-1 text-color1 text-sm font-semibold mt-1 hover:underline"
              >
                <LinkIcon className="w-4 h-4" /> {slug}.darllix.shop
              </button>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={handleVisitStore}
                className="flex-1 py-2 bg-color3 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors flex items-center justify-center gap-2"
              >
                <Store className="w-4 h-4" /> Visit Store
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center border-t border-gray-100 bg-white">
            <div className="w-full py-3 flex justify-center border-b-2 border-color3 text-color3">
              <Grid className="w-6 h-6" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-[2px] bg-gray-200 mt-[2px]">
            {posts.map((post) => (
              <div 
                key={post.id} 
                onClick={() => setSelectedPost(post)}
                className="aspect-square bg-gray-100 relative cursor-pointer group"
              >
                {post.isVideo ? (
                  <>
                    <video src={post.mediaUrl} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2">
                      <Play className="w-4 h-4 text-white fill-white drop-shadow-md" />
                    </div>
                  </>
                ) : (
                  <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors hidden md:block" />
              </div>
            ))}
          </div>

          {posts.length === 0 && !loading && (
            <div className="py-20 flex flex-col items-center justify-center text-gray-500">
              <Grid className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm font-medium">No posts yet</p>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100000] flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full md:w-[500px] h-[100dvh] md:h-[90vh] md:max-h-[900px] bg-black md:rounded-[2.5rem] overflow-hidden shadow-2xl md:border-4 border-gray-800 z-10 flex flex-col"
            >
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-[100001]"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex-1 w-full h-full relative">
                <MarketplacePost 
                  post={selectedPost} 
                  currentUserId={currentUserId} 
                  onDeleteCallback={(deletedId) => {
                    setPosts(posts.filter(p => p.id !== deletedId));
                    setSelectedPost(null);
                  }}
                  profileview={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}