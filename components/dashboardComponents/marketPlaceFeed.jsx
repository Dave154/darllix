import React, { useState, useEffect, useRef, useCallback } from 'react';
import MarketplacePost from './marketplacePost';
import MarketplaceSearch from './marketPlaceSearch';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, X, Heart, Search, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '../../hooks/useUser';

const mockStories = [
  { id: 1, vendor: 'Zenath', image: '/darllix_logo.png', trending: true },
  { id: 2, vendor: 'Kicks NG', image: '/darllix_logo.png', trending: true },
];

const loopedStories = Array(10).fill(mockStories).flat().map((story, index) => ({
  ...story,
  uniqueId: `${story.id}-${index}`
}));

export default function MarketplaceFeed() {
    const {user}= useUser()
  const [activeModalPost, setActiveModalPost] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentSearch, setCurrentSearch] = useState('');
  const [isOffline, setIsOffline] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  
  const mobileObserverRef = useRef(null);
  const desktopObserverRef = useRef(null);
  const scrollRef = useRef(null);
  const desktopScrollRef = useRef(null);
  const touchStart = useRef(0);

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

      if (data.posts.length === 0) {
        setHasMore(false);
        if (reset) setPosts([]);
      } else {
        if (reset) {
          if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          if (desktopScrollRef.current) desktopScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setPosts(prev => reset ? data.posts : [...prev, ...data.posts]);
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
    fetchPosts(0, currentSearch, true);
  }, [currentSearch]);

  useEffect(() => {
    if (!isOffline && posts.length === 0 && !loading && hasMore) {
      fetchPosts(0, currentSearch, true);
    }
  }, [isOffline]);

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
  };

  const handleManualRetry = () => {
    if (navigator.onLine) {
      setIsOffline(false);
      setPage(0);
      setHasMore(true);
      fetchPosts(0, currentSearch, true);
    } else {
      toast.error("Still no connection detected.");
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
    } else {
      setPullProgress(0);
    }
    touchStart.current = 0;
  };

  const handlePostDeleted = (deletedPostId) => {
  setPosts(prevPosts => prevPosts.filter(post => post.id !== deletedPostId));
};

  if (isOffline && posts.length === 0) {
    return (
      <div className="w-full h-[calc(100dvh-56px)] md:h-full flex flex-col items-center justify-center bg-color4 px-6 relative z-50">
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
    <div className="relative w-full h-full bg-color4">
      
      <div className="md:hidden flex flex-col w-full h-[calc(100dvh-56px)] overflow-hidden bg-color4">
        
        {currentSearch ? (
          <div className="relative w-full shrink-0 bg-white z-30 px-4 py-3 border-b border-gray-100 shadow-sm flex items-center">
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="flex-1 flex items-center bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 cursor-pointer"
            >
              <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
              <span className="flex-1 text-sm text-color3 truncate font-medium">{currentSearch}</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  clearSearch();
                }} 
                className="p-1 rounded-full hover:bg-gray-200 transition-colors shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full shrink-0 bg-white z-30 pt-3 pb-3 border-b border-gray-100 shadow-sm">
            <div className="flex gap-4 overflow-x-auto snap-x px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {loopedStories.map((story) => (
                <motion.div key={story.uniqueId} whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-1 snap-start cursor-pointer shrink-0">
                  <div className={`w-14 h-14 rounded-full p-[2px] ${story.trending ? 'bg-gradient-to-tr from-color1 to-color2' : 'bg-gray-300'}`}>
                    <div className="w-full h-full rounded-full overflow-hidden border-2 border-white bg-white">
                      <img src={story.image} alt={story.vendor} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className="text-color3 text-[10px] font-semibold">{story.vendor}</span>
                </motion.div>
              ))}
              <div className="w-12 shrink-0" />
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white via-white/90 to-transparent flex items-center justify-end pr-4 pointer-events-none">
              <button onClick={() => setIsSearchOpen(true)} className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center shadow-sm border border-gray-200 pointer-events-auto transition-active active:scale-95">
                <Search className="w-5 h-5 text-color3" />
              </button>
            </div>
          </div>
        )}

        <div className="relative w-full flex-1 overflow-hidden">
          {pullProgress > 0 && (
            <div 
              className="absolute top-0 left-0 w-full flex justify-center items-end z-40 overflow-hidden transition-all duration-200"
              style={{ height: `${pullProgress}px` }}
            >
              <div className="pb-4">
                <Loader2 className={`w-6 h-6 text-color1 ${refreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 3}deg)` }} />
              </div>
            </div>
          )}

          <div 
            ref={scrollRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className="w-full h-full flex flex-col overflow-y-scroll snap-y snap-mandatory scrollbar-none overscroll-y-contain relative z-10"
          >
            {posts.length === 0 && !loading && currentSearch ? (
               <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center shrink-0">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-bold text-color3 mb-2">No results found</h3>
                  <p className="text-gray-500 text-sm max-w-xs">We couldn't find anything for "{currentSearch}". Try a different keyword.</p>
               </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="w-full h-full shrink-0 snap-start relative">
                  <MarketplacePost post={post} 
                  currentUserId={user?.id}
                   onDeleteCallback={handlePostDeleted}
                  />
                </div>
              ))
            )}
            
            {hasMore && (
              <div ref={mobileObserverRef} className="w-full h-full shrink-0 snap-start flex flex-col items-center justify-center gap-3">
                {isOffline ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-2">
                     <WifiOff className="w-6 h-6 text-gray-400" />
                     <span className="text-gray-400 text-sm font-medium">Waiting for connection...</span>
                  </motion.div>
                ) : (
                  <Loader2 className="w-8 h-8 animate-spin text-color1" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={desktopScrollRef} className="hidden md:block w-full h-full p-8 relative overflow-y-auto scrollbar-thin">
        
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-color3">
            {currentSearch ? `Results for "${currentSearch}"` : 'Discover'}
          </h1>
          <div className="flex items-center gap-3">
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
                <span className="text-sm font-medium text-gray-500">Search products...</span>
              </button>
            )}
          </div>
        </div>

        {!currentSearch && (
          <div className="mb-10 w-full relative">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Trending Stories</h2>
            <div className="flex gap-6 overflow-x-auto pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] w-full">
              {loopedStories.map((story) => (
                <motion.div key={story.uniqueId} whileHover={{ scale: 1.05 }} className="flex flex-col items-center gap-2 cursor-pointer shrink-0">
                  <div className={`w-20 h-20 rounded-full p-[2px] ${story.trending ? 'bg-gradient-to-tr from-color1 to-color2 shadow-md' : 'bg-gray-300'}`}>
                    <div className="w-full h-full rounded-full overflow-hidden border-4 border-white bg-white">
                      <img src={story.image} alt={story.vendor} className="w-full h-full object-cover" />
                    </div>
                  </div>
                  <span className="text-color3 text-sm font-semibold">{story.vendor}</span>
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
            {posts.map((post) => (
              <motion.div 
                key={post.id} 
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

        {hasMore && (
          <div ref={desktopObserverRef} className="w-full flex items-center justify-center mt-6 gap-3 pb-8">
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

      <AnimatePresence>
        {activeModalPost && (
          <div className="fixed inset-0 z-[100] hidden md:flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveModalPost(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-[500px] h-[90vh] max-h-[900px] bg-black rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-gray-800 z-10"
            >
              <MarketplacePost post={activeModalPost} currentUserId={user?.id} onDeleteCallback={handlePostDeleted} />
              <button 
                onClick={() => setActiveModalPost(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-50"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MarketplaceSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} onSearch={handleExecuteSearch} />
    </div>
  );
}