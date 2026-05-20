import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/router';
import MarketplacePost from './marketplacePost';
import MarketplaceSearch from './marketPlaceSearch';
import UploadModal from './UploadModal';
import VendorProfile from './VendorProfile';
import AuthModal from './AuthModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Heart, Search, Loader2, WifiOff, RefreshCw, Store, ChevronLeft, ChevronRight, PlusSquare, User2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../hooks/useUser';
import { useStore } from '@/store';
import { useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function MarketplaceFeed({upload, isPublic = false, currentPath = '/dashboard/marketplace', layout = 'grid'}) {
  const router = useRouter();
  const { user } = useUser();
  const store = useStore((s) => s.store);
  
  const searchParams = useSearchParams();
  const sharedPostId = searchParams?.get('post');
  const supabase = createClientComponentClient();

  const [activeModalPost, setActiveModalPost] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [activeVendorProfile, setActiveVendorProfile] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalAction, setAuthModalAction] = useState('');
  const [authReturnUrl, setAuthReturnUrl] = useState('/marketplace');
  
  const [posts, setPosts] = useState([]);
  const [trendingStories, setTrendingStories] = useState([]);
  const [activeStoryIndex, setActiveStoryIndex] = useState(null);
  
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentSearch, setCurrentSearch] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  
  const [showTopBar, setShowTopBar] = useState(true);
  const lastScrollY = useRef(0);

  const mobileObserverRef = useRef(null);
  const desktopObserverRef = useRef(null);
  const scrollRef = useRef(null);
  const desktopScrollRef = useRef(null);
  const touchStart = useRef(0);
  const swipeStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleNewPost = (e) => {
      const newPost = e.detail;
      setPosts(prevPosts => [newPost, ...prevPosts]);
    };
  
    window.addEventListener('new-post-uploaded', handleNewPost);
    return () => window.removeEventListener('new-post-uploaded', handleNewPost);
  }, []);

  const handleFeedScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    if (currentScrollY > lastScrollY.current + 15) {
      setShowTopBar(false); 
    } else if (currentScrollY < lastScrollY.current - 15 || currentScrollY <= 0) {
      setShowTopBar(true);  
    }
    lastScrollY.current = currentScrollY;
  };

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("Back online!");
    };
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("You are offline.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchTrendingStories = async () => {
    try {
      const res = await fetch('/api/marketplace/trending');
      if (res.ok) {
        const data = await res.json();
        setTrendingStories(data.stories || []);
      }
    } catch (error) {
      console.error("Failed to fetch trending stories", error);
    }
  };

  const fetchPosts = async (pageNum, query, reset = false) => {
    if (loading || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      if (!navigator.onLine) setIsOffline(true);
      return;
    }
    
    setLoading(true);

    try {
      const res = await fetch(`/api/marketplace/feed?page=${pageNum}&limit=5${query ? `&searchQuery=${query}` : ''}`);
      
      if (!res.ok) throw new Error("Network response was not ok");
      
      const data = await res.json();
      let newPosts = data.posts || [];

      if (reset && sharedPostId) {
        let targetPost = null;
        const existingIndex = newPosts.findIndex(p => p.id === sharedPostId);
        
        if (existingIndex > -1) {
          const [sharedPost] = newPosts.splice(existingIndex, 1);
          newPosts.unshift(sharedPost);
          targetPost = sharedPost;
        } else {
          const { data: spData } = await supabase
            .from('marketplace_posts')
            .select('*, stores(name, subdomain), profiles(full_name)')
            .eq('id', sharedPostId)
            .single();

          if (spData) {
            let userLiked = false;
            if (user?.id) {
              const { data: likeData } = await supabase
                .from('post_likes')
                .select('post_id')
                .match({ post_id: sharedPostId, user_id: user.id })
                .single();
              if (likeData) userLiked = true;
            }

            const formattedSharedPost = {
              id: spData.id,
              title: spData.title,
              description: spData.description,
              price: spData.price,
              mediaUrl: spData.media_url,
              mediaType: spData.media_type,
              isVideo: spData.media_type === 'video' || spData.media_url?.includes('.mp4'),
              likesCount: spData.likes_count || 0,
              vendorName: spData.stores?.name || spData.profiles?.full_name || "Vendor",
              vendorSlug: spData.stores?.subdomain,
              vendorId: spData.vendor_id,
              storeId: spData.store_id,
              user_has_liked: userLiked
            };

            newPosts.unshift(formattedSharedPost);
            targetPost = formattedSharedPost;
          }
        }

        if (targetPost && typeof window !== 'undefined' && window.innerWidth >= 768) {
          setActiveModalPost(targetPost);
        }
      }

      if (newPosts.length === 0) {
        setHasMore(false);
        if (reset) setPosts([]);
      } else {
        if (reset) {
          if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          if (desktopScrollRef.current) desktopScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setPosts(prev => reset ? newPosts : [...prev, ...newPosts]);
      }
    } catch (error) {
      if (error.message === "Failed to fetch" || (typeof navigator !== 'undefined' && !navigator.onLine)) {
        setIsOffline(true);
      } else {
        toast.error("Something went wrong, try again.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPullProgress(0);
    }
  };

  useEffect(() => {
    fetchTrendingStories();
  }, []);

  useEffect(() => {
    fetchPosts(0, currentSearch, true);
  }, [currentSearch, sharedPostId]);

  useEffect(() => {
    if (!isOffline && posts.length === 0 && !loading && hasMore) {
      fetchPosts(0, currentSearch, true);
      if (trendingStories.length === 0) fetchTrendingStories();
    }
  }, [isOffline]);

  useEffect(() => {
    if (activeStoryIndex === null) return;
    const currentStory = trendingStories[activeStoryIndex];
    
    if (currentStory?.media_type !== 'video') {
      const timer = setTimeout(() => {
        handleNextStory();
      }, 5000); 
      return () => clearTimeout(timer);
    }
  }, [activeStoryIndex, trendingStories]);

  const handleObserver = useCallback((entries) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading && !isOffline) {
      setPage((prev) => {
        const nextPage = prev + 1;
        fetchPosts(nextPage, currentSearch);
        return nextPage;
      });
    }
  }, [hasMore, loading, currentSearch, isOffline]);

  useEffect(() => {
    const option = { threshold: 0.1 };
    const observer = new IntersectionObserver(handleObserver, option);
    
    if (mobileObserverRef.current) observer.observe(mobileObserverRef.current);
    if (desktopObserverRef.current) observer.observe(desktopObserverRef.current);
    
    return () => observer.disconnect();
  }, [handleObserver, posts]);

  const handleExecuteSearch = (searchTerm) => {
    setIsSearchOpen(false);
    setPage(0);
    setHasMore(true);
    setCurrentSearch(searchTerm);
  };

  const clearSearch = () => {
    setPage(0);
    setHasMore(true);
    setCurrentSearch('');
    if (sharedPostId) {
      window.history.replaceState(null, '', '/dashboard/marketplace?tab=discover');
    }
  };

  const handleVendorSearch = (slug) => {
    if (activeModalPost) setActiveModalPost(null);
    setCurrentSearch(`@${slug}`)
  };

  const handleManualRetry = () => {
    if (navigator.onLine) {
      setIsOffline(false);
      setPage(0);
      setHasMore(true);
      fetchPosts(0, currentSearch, true);
      fetchTrendingStories();
    } else {
      toast.error("Still no connection detected.");
    }
  };

  const handleProtectedAction = (actionName, fallbackCallback) => {
    if (!user) {
      const queryString = Object.entries(router.query)
        .filter(([key]) => key !== 'returnUrl')
        .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
        .join('&');
      const returnUrl = `/marketplace${queryString ? `?${queryString}` : ''}`;
      setAuthModalAction(actionName);
      setAuthReturnUrl(returnUrl || '/marketplace');
      setShowAuthModal(true);
      return false;
    }
    if (fallbackCallback) fallbackCallback();
    return true;
  };

  const handleCreatePost = () => {
    if (handleProtectedAction('create posts')) {
      setIsUploadOpen(true);
    }
  };

  const handleTouchStart = (e) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStart.current = e.touches[0].clientY;
    } else {
      touchStart.current = 0;
    }
  };

  const handleTouchMove = (e) => {
    if (touchStart.current > 0) {
      const distance = e.touches[0].clientY - touchStart.current;
      if (distance > 0) {
        setPullProgress(Math.min(distance, 80));
      }
    }
  };

  const handleTouchEnd = () => {
    if (pullProgress > 60 && !loading) {
      setRefreshing(true);
      setPage(0);
      setHasMore(true);
      fetchPosts(0, currentSearch, true);
      fetchTrendingStories();
    } else {
      setPullProgress(0);
    }
    touchStart.current = 0;
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
  };

  const handleNextStory = () => {
    if (activeStoryIndex < trendingStories.length - 1) {
      setActiveStoryIndex(prev => prev + 1);
    } else {
      setActiveStoryIndex(null);
    }
  };

  const handlePrevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex(prev => prev - 1);
    }
  };

  const handleStoryStoreClick = (slug) => {
    if (!slug) return;
    const currentHost = window.location.host;
    const protocol = window.location.protocol;
    const isLocalhost = currentHost.includes('localhost');
    const baseDomain = isLocalhost ? 'localhost:3000' : currentHost.replace(/^[^.]+\./g, '');
    window.open(`${protocol}//${slug}.${baseDomain}`, '_blank');
  };

  const closePostModal = () => {
    setActiveModalPost(null);
    if (sharedPostId) {
      const url = new URL(window.location.href);
      url.searchParams.delete('post');
      window.history.replaceState(null, '', url.toString());
    }
  };

  if (isOffline && posts.length === 0) {
    return (
      <div className="w-full h-[calc(100dvh)] md:h-full flex flex-col items-center justify-center bg-color4 px-6 relative z-50">
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-6"
        >
          <div className="absolute inset-0 bg-red-100 blur-xl rounded-full opacity-50" />
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl border border-red-50 relative z-10">
            <WifiOff className="w-10 h-10 text-red-500" />
          </div>
        </motion.div>
        <h2 className="text-2xl font-bold text-color3 mb-2 text-center tracking-tight">You're offline</h2>
        <p className="text-gray-500 text-center mb-8 text-sm max-w-xs leading-relaxed">Check your Wi-Fi or mobile data and try again to keep discovering products.</p>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleManualRetry} 
          className="px-8 py-3.5 bg-color3 text-white font-bold rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          Try Again
        </motion.button>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black md:bg-white">
      <AnimatePresence>
        {activeVendorProfile && (
          <VendorProfile 
            slug={activeVendorProfile} 
            onClose={() => setActiveVendorProfile(null)} 
            currentUserId={user?.id}
          />
        )}
      </AnimatePresence>
      <div className="md:hidden relative flex flex-col w-full h-[calc(100dvh)] overflow-hidden bg-black">
        
        {currentSearch ? (
          <div className="w-full shrink-0 z-30 px-4 py-3 bg-white/10 backdrop-blur-md shadow-sm flex items-center pt-safe border-b border-white/10">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 flex items-center bg-white/20 border border-white/20 rounded-full px-4 py-2.5 cursor-pointer"
            >
              <Search className="w-4 h-4 text-white/70 mr-2 shrink-0" />
              <span className="flex-1 text-sm text-white truncate font-medium">
                {currentSearch.startsWith('@') ? `${currentSearch.substring(1)}'s posts` : currentSearch}
              </span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch();
                }} 
                className="p-1 rounded-full hover:bg-white/20 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>
       ) : (
        <motion.div 
          initial={false}
          animate={{ height: showTopBar ? 'auto' : 0, opacity: showTopBar ? 1 : 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="w-full shrink-0 z-30 overflow-hidden bg-black pt-safe"
        >
          <div className="flex items-start w-full pl-4 pr-3 pt-2 pb-4 gap-2">
            
            {trendingStories.length > 0 && (
              <div className="relative flex-1 min-w-0">
                <div className="flex gap-4 overflow-x-auto snap-x [&::-webkit-scrollbar]:hidden pr-6">
                  {trendingStories.map((story, index) => (
                    <motion.div 
                      key={story.id} 
                      whileTap={{ scale: 0.95 }} 
                      onClick={() => setActiveStoryIndex(index)}
                      className="flex flex-col items-center gap-1.5 snap-start cursor-pointer shrink-0"
                    >
                      <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-color1 to-color2 shadow-sm">
                        <div className="w-full h-full rounded-full overflow-hidden border-2 border-black/50 bg-gray-100 flex items-center justify-center">
                          {story.vendor_avatar ? (
                            <img src={story.vendor_avatar} alt={story.vendor_name} className="w-full h-full object-cover" />
                          ) : story.media_type === 'video' ? (
                            <video src={story.media_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={story.media_url} alt={story.vendor_name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                      <span className="text-white text-[10px] font-semibold truncate w-14 text-center drop-shadow-md">{story.vendor_name}</span>
                    </motion.div>
                  ))}
                </div>
                {/* Smooth fade out to prevent hard cut-off next to icons */}
                <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black to-transparent pointer-events-none" />
              </div>
            )}

            <div className="flex items-center self-start gap-2 shrink-0 ml-1 mt-2">
              <button onClick={() => setIsSearchOpen(true)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md shadow-sm border border-white/20 flex items-center justify-center text-white transition-transform active:scale-95">
                <Search className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveVendorProfile(store?.subdomain)} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md shadow-sm border border-white/20 flex items-center justify-center text-white transition-transform active:scale-95">
                <User2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

        {/* The feed now takes up the remaining space (flex-1) */}
        <div className="relative w-full flex-1 overflow-hidden z-10 bg-black">
          {pullProgress > 0 && (
            <div 
              className="absolute top-0 left-0 w-full flex justify-center items-end z-40 overflow-hidden transition-all duration-200"
              style={{ height: `${pullProgress}px` }}
            >
              <div className="pb-4">
                <Loader2 className={`w-6 h-6 text-white ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 3}deg)` }} />
              </div>
            </div>
          )}

          <div 
            ref={scrollRef}
            onScroll={handleFeedScroll}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full flex flex-col overflow-y-scroll snap-y snap-mandatory scrollbar-none overscroll-y-contain"
          >
            {posts.length === 0 && !loading && currentSearch ? (
               <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center shrink-0">
                  <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">No results found</h3>
                  <p className="text-gray-400 text-sm max-w-xs">We couldn't find anything for "{currentSearch}". Try a different keyword.</p>
               </div>
            ) : (
              posts.map((post, index) => (
                <div 
                  key={post.id} 
                  ref={index === posts.length - 1 ? mobileObserverRef : null}
                  className="w-full h-full shrink-0 snap-start relative"
                  onTouchStart={(e) => {
                    swipeStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                  }}
                  onTouchEnd={(e) => {
                    const deltaX = e.changedTouches[0].clientX - swipeStart.current.x;
                    const deltaY = e.changedTouches[0].clientY - swipeStart.current.y;
                    if (deltaX < -80 && Math.abs(deltaY) < 60) {
                      setActiveVendorProfile(post.vendorSlug);
                    }
                  }}
                >
                  <MarketplacePost 
                    post={post} 
                    currentUserId={user?.id}
                    onDeleteCallback={handlePostDeleted}
                    onVendorSearch={handleVendorSearch}
                    isPublic={isPublic}
                    onAuthRequired={(action) => handleProtectedAction(action)}
                  />
                </div>
              ))
            )}
            
            {hasMore && posts.length > 0 && (
              <div className="w-full h-20 shrink-0 flex flex-col items-center justify-center bg-transparent pb-safe snap-start">
                {isOffline ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                     <WifiOff className="w-4 h-4 text-white/50" />
                     <span className="text-white/50 text-xs font-medium">Waiting for connection...</span>
                  </motion.div>
                ) : (
                  <Loader2 className="w-6 h-6 animate-spin text-white/70" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      

      <div ref={desktopScrollRef} className="hidden md:block w-full h-full relative overflow-y-auto scrollbar-thin">
        {layout === 'instagram' ? (
          // Instagram-like layout for /marketplace
          <div className="w-full max-w-2xl mx-auto">
            {/* Stories Section */}
            {!currentSearch && trendingStories.length > 0 && (
              <div className="sticky top-0 z-20 bg-white border-b border-gray-200 py-4">
                <div className="px-4">
                  <div className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {trendingStories.map((story, index) => (
                      <motion.div
                        key={story.id}
                        whileHover={{ scale: 1.05 }}
                        onClick={() => setActiveStoryIndex(index)}
                        className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                      >
                        <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-color1 to-color2">
                          <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-gray-100 flex items-center justify-center">
                            {story.vendor_avatar ? (
                              <img src={story.vendor_avatar} alt={story.vendor_name} className="w-full h-full object-cover" />
                            ) : story.media_type === 'video' ? (
                              <video src={story.media_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                            ) : (
                              <img src={story.media_url} alt={story.vendor_name} className="w-full h-full object-cover" />
                            )}
                          </div>
                        </div>
                        <span className="text-gray-900 text-xs font-semibold truncate w-16 text-center">{story.vendor_name}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Feed Section */}
            <div className="py-6">
              {posts.length === 0 && !loading && currentSearch ? (
                <div className="w-full flex flex-col items-center justify-center p-16 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Search className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-color3 mb-3">No results found</h3>
                  <p className="text-gray-500 max-w-md">We couldn't find any products matching "{currentSearch}". Try a different keyword or category.</p>
                </div>
              ) : (
                <div className="space-y-6 px-4">
                  {posts.map((post, index) => (
                    <motion.div
                      key={post.id}
                      ref={index === posts.length - 1 ? desktopObserverRef : null}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                    >
                      <MarketplacePost
                        post={post}
                        currentUserId={user?.id}
                        onDeleteCallback={handlePostDeleted}
                        onVendorSearch={handleVendorSearch}
                        isPublic={isPublic}
                        onAuthRequired={(action) => handleProtectedAction(action)}
                      />
                    </motion.div>
                  ))}
                </div>
              )}

              {hasMore && posts.length > 0 && (
                <div className="w-full flex items-center justify-center mt-8 gap-3 pb-8">
                  {isOffline ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                      <WifiOff className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-500 text-sm font-medium">Network lost. Paused.</span>
                    </motion.div>
                  ) : (
                    <Loader2 className="w-8 h-8 animate-spin text-color1" />
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Grid layout for /dashboard/marketplace
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-2xl font-bold text-color3">
                {currentSearch
                  ? currentSearch.startsWith('@') ? `${currentSearch.substring(1)}'s Profile` : `Results for "${currentSearch}"`
                  : 'Discover'
                }
              </h1>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCreatePost}
                  className="flex items-center gap-2 bg-color3 text-white px-4 py-2 rounded-full shadow-sm hover:bg-black transition-colors"
                >
                  <PlusSquare className="w-4 h-4" />
                  <span className="text-sm font-medium">Create Post</span>
                </button>

                <button onClick={handleManualRetry} className="w-10 h-10 bg-white rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 flex items-center justify-center transition-colors">
                  <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
                </button>

                {currentSearch ? (
                  <div
                    onClick={() => setIsSearchOpen(true)}
                    className="flex items-center gap-2 bg-white pl-4 pr-2 py-1.5 rounded-full shadow-sm border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <Search className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-color3 max-w-[150px] truncate">{currentSearch}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSearch();
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setIsSearchOpen(true)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                    <Search className="w-4 h-4 text-gray-500" />
                  </button>
                )}

                <button onClick={() => setActiveVendorProfile(store?.subdomain)} className="w-8 h-8 flex items-center justify-center text-color3">
                  <User2 className="w-6 h-6" />
                </button>
              </div>
            </div>

            {!currentSearch && trendingStories.length > 0 && (
              <div className="mb-10 w-full relative">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Trending Stories</h2>
                <div className="flex gap-6 overflow-x-auto pt-4 pb-6 px-2 -mx-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
                  {trendingStories.map((story, index) => (
                    <motion.div
                      key={story.id}
                      whileHover={{ scale: 1.05 }}
                      onClick={() => setActiveStoryIndex(index)}
                      className="flex flex-col items-center gap-2 cursor-pointer shrink-0"
                    >
                      <div className="w-20 h-20 rounded-full p-[2px] bg-gradient-to-tr from-color1 to-color2 shadow-md">
                        <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-gray-100 flex items-center justify-center">
                          {story.vendor_avatar ? (
                            <img src={story.vendor_avatar} alt={story.vendor_name} className="w-full h-full object-cover" />
                          ) : story.media_type === 'video' ? (
                            <video src={story.media_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
                          ) : (
                            <img src={story.media_url} alt={story.vendor_name} className="w-full h-full object-cover" />
                          )}
                        </div>
                      </div>
                      <span className="text-color3 text-sm font-semibold truncate w-20 text-center">{story.vendor_name}</span>
                    </motion.div>
                  ))}
                  <div className="w-12 shrink-0" />
                </div>

                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-color4 to-transparent pointer-events-none" />
              </div>
            )}

            {posts.length === 0 && !loading && currentSearch ? (
              <div className="w-full flex flex-col items-center justify-center p-16 text-center">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-color3 mb-3">No results found</h3>
                <p className="text-gray-500 max-w-md">We couldn't find any products matching "{currentSearch}". Try a different keyword or category.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {posts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    ref={index === posts.length - 1 ? desktopObserverRef : null}
                    whileHover={{ y: -5 }}
                    onClick={() => setActiveModalPost(post)}
                    className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all"
                  >
                    <div className="relative aspect-[4/5] w-full bg-gray-100 overflow-hidden">
                      {post.isVideo ? (
                        <video src={post.mediaUrl} autoPlay muted loop playsInline className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <img src={post.mediaUrl} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      )}
                      {post.isVideo && (
                        <div className="absolute top-3 right-3 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center">
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-sm">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        <span className="text-color3 text-xs font-bold">{post.likesCount}</span>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">{post.vendorName}</p>
                      <h3 className="text-color3 font-bold text-base truncate">{post.title}</h3>
                      <p className="text-color2 font-black mt-1">₦{post.price}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {hasMore && posts.length > 0 && (
              <div className="w-full flex items-center justify-center mt-6 gap-3 pb-8">
                {isOffline ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <WifiOff className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-500 text-sm font-medium">Network lost. Paused.</span>
                  </motion.div>
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-color1" />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {activeStoryIndex !== null && trendingStories[activeStoryIndex] && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] bg-black flex flex-col"
          >
            <div className="absolute top-0 left-0 w-full p-4 z-50 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pt-safe">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-gray-800">
                  {trendingStories[activeStoryIndex].media_type === 'video' ? 
                   <video 
                  src={trendingStories[activeStoryIndex].media_url} 
                  playsInline 
                  onEnded={handleNextStory}
                  className="w-full h-full object-contain"
                />
                :
                <img src={trendingStories[activeStoryIndex].media_url} alt="Vendor" className="w-full h-full object-cover" />
                  }  
                </div>
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm shadow-black drop-shadow-md">{trendingStories[activeStoryIndex].vendor_name}</span>
                  <span className="text-white/80 text-xs font-medium shadow-black drop-shadow-md">Trending Today</span>
                </div>
              </div>
              <button 
                onClick={() => setActiveStoryIndex(null)}
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 relative bg-black flex items-center justify-center">
              {trendingStories[activeStoryIndex].media_type === 'video' ? (
                <video 
                  src={trendingStories[activeStoryIndex].media_url} 
                  playsInline 
                  onEnded={handleNextStory}
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={trendingStories[activeStoryIndex].media_url} 
                  alt="Story" 
                  className="w-full h-full object-contain"
                />
              )}

              <div className="absolute inset-0 flex">
                <div className="w-1/2 h-full" onClick={handlePrevStory} />
                <div className="w-1/2 h-full" onClick={handleNextStory} />
              </div>
            </div>

            <div className="absolute bottom-0 left-0 w-full p-6 z-50 bg-gradient-to-t from-black/90 via-black/50 to-transparent pb-safe">
              <h2 className="text-white text-xl font-bold mb-4 drop-shadow-lg truncate">
                {trendingStories[activeStoryIndex].title}
              </h2>
              <button 
                onClick={() => handleStoryStoreClick(trendingStories[activeStoryIndex].vendor_slug)}
                className="w-full py-4 bg-color1 text-white rounded-2xl font-bold text-lg hover:bg-color1/90 transition-colors shadow-xl flex items-center justify-center gap-2"
              >
                <Store className="w-5 h-5" /> Visit Store
              </button>
            </div>

            <button onClick={handlePrevStory} className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-colors z-50">
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={handleNextStory} className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full items-center justify-center text-white transition-colors z-50">
              <ChevronRight className="w-8 h-8" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeModalPost && (
          <div className="fixed inset-0 z-[100] hidden md:flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closePostModal}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-[500px] h-[90vh] max-h-[900px] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-800 z-10"
            >
              <MarketplacePost 
                post={activeModalPost} 
                currentUserId={user?.id} 
                onDeleteCallback={handlePostDeleted}
                onVendorSearch={handleVendorSearch}
                isPublic={isPublic}
                onAuthRequired={(action) => handleProtectedAction(action)}
              />
              <button 
                onClick={closePostModal}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        action={authModalAction}
        returnUrl={authReturnUrl}
      />

      <MarketplaceSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearch={handleExecuteSearch} />
    </div>
  );
}