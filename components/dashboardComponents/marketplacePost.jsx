import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, Store, MoreHorizontal, Play, Volume2, VolumeX, Edit, Trash2, TrendingUp, Info, X, Flag, AlertTriangle, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function MarketplacePost({ post, currentUserId, onDeleteCallback }) {
  const [isLiked, setIsLiked] = useState(post?.user_has_liked || false);
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [showBigHeart, setShowBigHeart] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  
  const [displayData, setDisplayData] = useState({
    title: post?.title || '',
    price: post?.price || '0',
    description: post?.description || ''
  });

  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showVendorInfo, setShowVendorInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  const [editForm, setEditForm] = useState({ ...displayData });

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  const viewTimerRef = useRef(null);
  const entryTime = useRef(0);
  const hasTrackedView = useRef(false);
  const hasTrackedSkip = useRef(false);

  const isOwner = currentUserId && post?.vendorId && currentUserId === post.vendorId;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsLiked(post?.user_has_liked || false);
    setLikesCount(post?.likesCount || 0);
  }, [post?.user_has_liked, post?.likesCount]);

  const trackAction = async (actionType) => {
    try {
      await fetch('/api/marketplace/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          postId: post.id, 
          action: actionType,
          categoryId: post.category_id 
        })
      });
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (post?.isVideo && videoRef.current) {
            videoRef.current.play().catch(() => setIsPlaying(false));
            setIsPlaying(true);
          }
          
          entryTime.current = Date.now();
          
          if (!hasTrackedView.current && !isOwner) {
            viewTimerRef.current = setTimeout(() => {
              trackAction('view');
              hasTrackedView.current = true;
            }, 3000);
          }
        } else {
          if (post?.isVideo && videoRef.current) {
            videoRef.current.pause();
            setIsPlaying(false);
          }

          if (viewTimerRef.current) clearTimeout(viewTimerRef.current);

          const timeSpent = Date.now() - entryTime.current;
          if (
            timeSpent > 0 && 
            timeSpent < 2000 && 
            !hasTrackedSkip.current && 
            !hasTrackedView.current &&
            !isOwner
          ) {
            trackAction('skip');
            hasTrackedSkip.current = true;
          }
        }
      },
      { threshold: 0.6 }
    );

    observer.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
      if (viewTimerRef.current) clearTimeout(viewTimerRef.current);
    };
  }, [post?.isVideo, isOwner]);

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

  const handleShare = async (e) => {
    e.stopPropagation();
    
    if (!isOwner) trackAction('share');

    const shareUrl = `${window.location.origin}/post/${post.id}`;
    const shareData = {
      title: displayData.title,
      text: `Check out ${displayData.title} by ${post.vendorName} on Darllix.shop!`,
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        toast.error("Couldn't share this post. Try again.");
      }
    }
  };

  const handleStoreClick = (e) => {
    if (e) e.stopPropagation();
    
    if (!isOwner) trackAction('store_click');
    
    if (!post?.vendorSlug) {
      toast.error("Store link unavailable");
      return;
    }

    const currentHost = window.location.host;
    const protocol = window.location.protocol;
    const isLocalhost = currentHost.includes('localhost');
    const baseDomain = isLocalhost ? 'localhost:3000' : currentHost.replace(/^[^.]+\./g, '');
    
    const storeUrl = `${protocol}//${post.vendorSlug}.${baseDomain}`;
    
    window.open(storeUrl, '_blank');
  };

  const handleMenuAction = (e, action) => {
    e.stopPropagation();
    setShowMoreMenu(false);
    
    setTimeout(() => {
      switch(action) {
        case 'edit':
          setEditForm({ ...displayData });
          setShowEditModal(true);
          break;
        case 'delete':
          setShowDeleteConfirm(true);
          break;
        case 'promote':
          toast.success("Opening promotion settings!");
          break;
        case 'info':
          setShowVendorInfo(true);
          break;
        case 'report':
          toast.success("Post reported to admin.");
          break;
        default:
          break;
      }
    }, 200); 
  };

  const handleDeletePost = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);

    try {
      const res = await fetch('/api/marketplace/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id })
      });

      if (!res.ok) throw new Error("Failed to delete post");

      toast.success("Post deleted successfully");
      setShowDeleteConfirm(false);
      
      if (onDeleteCallback) {
        onDeleteCallback(post.id);
      }
    } catch (error) {
      toast.error("Failed to delete post. Try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsEditing(true);

    try {
      const res = await fetch('/api/marketplace/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: post.id,
          title: editForm.title,
          price: editForm.price,
          description: editForm.description
        })
      });

      if (!res.ok) throw new Error("Failed to edit post");

      setDisplayData({ ...editForm });
      setShowEditModal(false);
      toast.success("Post updated successfully!");
    } catch (error) {
      toast.error("Failed to update post. Try again.");
    } finally {
      setIsEditing(false);
    }
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
          alt={displayData.title || "Product Media"}
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

      <div className="absolute bottom-24 left-4 right-16 z-10 flex flex-col gap-2 pointer-events-auto pr-2">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-full bg-color1 border border-white/20 flex items-center justify-center text-white font-bold shadow-lg flex-shrink-0">
            {post?.vendorName?.charAt(0) || "V"}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-[15px] drop-shadow-md leading-none">
                {post?.vendorName || "Vendor Name"}
              </p>
              {post?.isPromoted && (
                <span className="text-white/90 text-[10px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 leading-none">
                  Sponsored
                </span>
              )}
            </div>
            {post?.vendorSlug && (
              <p className="text-white/80 text-xs font-medium drop-shadow-md mt-1 leading-none">
                @{post.vendorSlug}
              </p>
            )}
          </div>
        </div>

        <h2 className="text-white text-xl font-bold leading-tight drop-shadow-lg mt-1">
          {displayData.title || "Premium Product Title"}
        </h2>
        
        <p className="text-color2 text-lg font-black drop-shadow-md">
          ₦{displayData.price?.toLocaleString() || "0"}
        </p>

        <div className="mt-1">
          <p 
            className={`text-white/90 text-sm drop-shadow-md ${!isExpanded ? 'line-clamp-2' : 'whitespace-pre-wrap pb-2'} cursor-pointer`}
            onClick={(e) => {
              if (displayData.description?.length > 80) {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }
            }}
          >
            {displayData.description || "Product description"}
          </p>
          {displayData.description?.length > 80 && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
              className="text-white font-bold text-xs underline drop-shadow-md mt-0.5"
            >
              {isExpanded ? "Show less" : "Read more"}
            </button>
          )}
        </div>
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
            onClick={handleShare}
            className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-xl"
          >
            <Share2 className="w-6 h-6 text-white" />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </div>

        <div className="flex flex-col items-center gap-1">
          <motion.button 
            whileTap={{ scale: 0.8 }} 
            onClick={handleStoreClick}
            className="w-12 h-12 rounded-full bg-color1/90 backdrop-blur-md border border-color1/50 flex items-center justify-center shadow-[0_0_15px_rgba(74,33,239,0.5)]"
          >
            <Store className="w-5 h-5 text-white" />
          </motion.button>
          <span className="text-white text-xs font-semibold drop-shadow-md">Store</span>
        </div>

        <motion.button 
          whileTap={{ scale: 0.8 }} 
          onClick={(e) => {
            e.stopPropagation();
            setShowMoreMenu(true);
          }}
          className="mt-2 p-2"
        >
          <MoreHorizontal className="w-6 h-6 text-white/90 drop-shadow-md" />
        </motion.button>
      </div>

      {mounted && createPortal(
        <AnimatePresence>
          {showMoreMenu && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(false); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999998]"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[999999] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom)+2rem)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex items-center justify-between p-4 border-b border-gray-100 mt-2">
                  <span className="font-bold text-color3 text-xl ml-2 tracking-tight">Options</span>
                  <button onClick={() => setShowMoreMenu(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="p-6 flex gap-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  {isOwner ? (
                    <>
                      <button onClick={(e) => handleMenuAction(e, 'edit')} className="flex flex-col items-center gap-3 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <Edit className="w-6 h-6 text-color3" />
                        </div>
                        <span className="text-xs font-semibold text-color3">Edit</span>
                      </button>

                      <button onClick={(e) => handleMenuAction(e, 'promote')} className="flex flex-col items-center gap-3 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                          <TrendingUp className="w-6 h-6 text-color3" />
                        </div>
                        <span className="text-xs font-semibold text-color3">Promote</span>
                      </button>

                      <button onClick={(e) => handleMenuAction(e, 'delete')} className="flex flex-col items-center gap-3 min-w-[70px]">
                        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                          <Trash2 className="w-6 h-6 text-red-500" />
                        </div>
                        <span className="text-xs font-semibold text-red-500">Delete</span>
                      </button>
                    </>
                  ) : (
                    <button onClick={(e) => handleMenuAction(e, 'report')} className="flex flex-col items-center gap-3 min-w-[70px]">
                      <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors">
                        <Flag className="w-6 h-6 text-red-500" />
                      </div>
                      <span className="text-xs font-semibold text-red-500">Report</span>
                    </button>
                  )}

                  <button onClick={(e) => handleMenuAction(e, 'info')} className="flex flex-col items-center gap-3 min-w-[70px]">
                    <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors">
                      <Info className="w-6 h-6 text-color3" />
                    </div>
                    <span className="text-xs font-semibold text-color3">Vendor Info</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {showVendorInfo && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); setShowVendorInfo(false); }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[999998]"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[999999] flex flex-col overflow-hidden pb-[calc(env(safe-area-inset-bottom)+2rem)] px-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex justify-end pt-4">
                  <button onClick={() => setShowVendorInfo(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="flex flex-col items-center -mt-2 pb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-color1 to-color2 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white mb-4">
                    {post?.vendorName?.charAt(0) || "V"}
                  </div>
                  <h3 className="text-2xl font-bold text-color3">{post?.vendorName || "Vendor Name"}</h3>
                  <p className="text-gray-500 font-medium mb-4">@{post?.vendorSlug || "vendor"}</p>
                  
                  <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 text-center border border-gray-100">
                    <p className="text-sm text-gray-600">
                      Welcome to our store! We sell premium products with fast delivery. Check out our catalog to see more.
                    </p>
                  </div>

                  <button 
                    onClick={handleStoreClick}
                    className="w-full py-4 bg-color1 text-white rounded-2xl font-bold text-lg hover:bg-color1/90 transition-colors shadow-lg flex items-center justify-center gap-2"
                  >
                    <Store className="w-5 h-5" /> Visit Full Store
                  </button>
                </div>
              </motion.div>
            </>
          )}

          {showEditModal && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={(e) => { e.stopPropagation(); if (!isEditing) setShowEditModal(false); }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999998]"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[999999] flex flex-col overflow-hidden max-h-[90vh] pb-[calc(env(safe-area-inset-bottom)+1rem)]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="w-full flex items-center justify-between p-4 border-b border-gray-100">
                  <span className="font-bold text-color3 text-xl ml-2">Edit Product</span>
                  <button onClick={() => setShowEditModal(false)} className="p-2 bg-gray-50 rounded-full hover:bg-gray-200 transition-colors">
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                
                <div className="p-6 overflow-y-auto">
                  <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Product Title</label>
                      <input 
                        type="text" 
                        value={editForm.title}
                        onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-color1/50 transition-all text-color3 font-medium"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Price (₦)</label>
                      <input 
                        type="number" 
                        value={editForm.price}
                        onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-color1/50 transition-all text-color3 font-medium"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
                      <textarea 
                        value={editForm.description}
                        onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                        rows="4"
                        className="w-full p-3 rounded-xl bg-gray-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-color1/50 transition-all text-color3 font-medium resize-none"
                      />
                    </div>

                    <button 
                      type="submit"
                      disabled={isEditing}
                      className="w-full py-4 mt-2 bg-color1 text-white rounded-xl font-bold text-lg hover:bg-color1/90 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:opacity-80"
                    >
                      {isEditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> Save Changes</>}
                    </button>
                  </form>
                </div>
              </motion.div>
            </>
          )}

          {showDeleteConfirm && (
            <>
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[999998] flex items-center justify-center px-4"
                onClick={(e) => { e.stopPropagation(); if (!isDeleting) setShowDeleteConfirm(false); }}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-3xl p-6 w-full max-w-[340px] shadow-2xl flex flex-col items-center text-center relative overflow-hidden z-[999999]"
                >
                  <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-color3 mb-2">Delete Product?</h3>
                  <p className="text-gray-500 text-sm mb-6">
                    Are you sure you want to permanently delete "{displayData.title}"? This action cannot be undone.
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleDeletePost}
                      disabled={isDeleting}
                      className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center disabled:opacity-80"
                    >
                      {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Delete"}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}