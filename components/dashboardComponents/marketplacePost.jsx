import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Store, MoreHorizontal, Play, Volume2, VolumeX } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketplacePost({ post }) {
  const [isLiked, setIsLiked] = useState(post?.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    setIsLiked(post?.user_has_liked || false);
    setLikesCount(post?.likesCount || 0);
  }, [post?.user_has_liked, post?.likesCount]);

  useEffect(() => {
    if (!post?.isVideo || !containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return; 

        if (entry.isIntersecting) {
          videoRef.current.play().catch(() => setIsPlaying(false));
          setIsPlaying(true);
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [post?.isVideo]);

  const handleLike = async (e) => {
    if (e) e.stopPropagation();
    if (isLikeLoading) return;

    setIsLikeLoading(true);
    const previousLikedState = isLiked;
    const previousCount = likesCount;

    setIsLiked(!isLiked);
    setLikesCount(prev => !isLiked ? prev + 1 : prev - 1);

    if (!isLiked && !e) {
      setShowBigHeart(true);
      setTimeout(() => setShowBigHeart(false), 800);
    }

    try {
      const res = await fetch('/api/marketplace/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      });

      if (!res.ok) throw new Error("Failed to toggle like");
      
      const data = await res.json();
      setIsLiked(data.isLiked);
    } catch (error) {
      setIsLiked(previousLikedState);
      setLikesCount(previousCount);
      toast.error("Could not update like status.");
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleDoubleTap = () => {
    if (!isLiked) {
      handleLike();
    } else {
      setShowBigHeart(true);
      setTimeout(() => setShowBigHeart(false), 800);
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!post?.isVideo || !videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full snap-start bg-black overflow-hidden flex justify-center items-center group"
      onDoubleClick={handleDoubleTap}
      onClick={post?.isVideo ? togglePlay : undefined}
    >
      {post?.isVideo ? (
        <div className="absolute inset-0 w-full h-full">
          <video 
            ref={videoRef}
            src={post?.mediaUrl} 
            loop 
            muted={isMuted}
            playsInline
            className="w-full h-full object-cover"
          />
          {!isPlaying && (
            <div className="absolute inset-0 bg-black/20 flex items-center justify-center pointer-events-none transition-opacity duration-300">
              <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Play className="w-8 h-8 text-white fill-white ml-1" />
              </div>
            </div>
          )}
          
          <button 
            onClick={toggleMute}
            className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 text-white transition-opacity duration-300 opacity-0 group-hover:opacity-100"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      ) : (
        <img 
          src={post?.mediaUrl || "/placeholder.jpg"} 
          alt={post?.title || "Product Media"}
          className="absolute inset-0 w-full h-full object-cover bg-gray-100"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

      <AnimatePresence>
        {showBigHeart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: '-50%', x: '-50%' }}
            animate={{ opacity: 1, scale: 1.2, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 12, stiffness: 200 }}
            className="absolute top-1/2 left-1/2 z-50 pointer-events-none"
          >
            <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-24 left-4 right-20 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-color1 border border-white/20 flex items-center justify-center text-white font-bold shadow-lg">
            {post?.vendorName?.charAt(0) || "V"}
          </div>
          <p className="text-white font-semibold text-sm drop-shadow-md">
            {post?.vendorName || "Vendor Name"}
          </p>
          {post?.isPromoted && (
            <span className="text-white/90 text-xs px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
              Sponsored
            </span>
          )}
        </div>

        <h2 className="text-white text-xl font-bold leading-tight drop-shadow-lg">
          {post?.title || "Premium Product Title"}
        </h2>
        
        <p className="text-color2 text-lg font-black drop-shadow-md">
          ₦{post?.price || "0"}
        </p>

        <p className="text-white/90 text-sm line-clamp-2 mt-1 drop-shadow-md">
          {post?.description || "Product description"}
        </p>
      </div>

      <div className="absolute bottom-28 right-4 z-10 flex flex-col items-center gap-6 pointer-events-auto">
        <div className="flex flex-col items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.8 }}
            onClick={handleLike}
            disabled={isLikeLoading}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl transition-colors disabled:opacity-70"
          >
            <Heart className={`w-6 h-6 transition-colors ${isLiked ? 'text-red-500 fill-red-500' : 'text-white'}`} />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">{likesCount}</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={(e) => e.stopPropagation()}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl"
          >
            <Share2 className="w-6 h-6 text-white" />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={(e) => e.stopPropagation()}
            className="w-12 h-12 rounded-full bg-color1/90 backdrop-blur-md border border-color1/50 flex items-center justify-center shadow-[0_0_15px_rgba(74,33,239,0.5)]"
          >
            <Store className="w-5 h-5 text-white" />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">Store</span>
        </div>

        <motion.button 
          whileTap={{ scale: 0.8 }} 
          onClick={(e) => e.stopPropagation()}
          className="mt-2 p-2"
        >
          <MoreHorizontal className="w-6 h-6 text-white/90 drop-shadow-md" />
        </motion.button>
      </div>
    </div>
  );
}