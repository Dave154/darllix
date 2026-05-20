import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Megaphone, Info, Loader2, Store, ExternalLink, X, Zap, CheckCircle2 } from 'lucide-react';
import { useStore } from '@/store';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';

const PaystackButton = dynamic(
  () => import("react-paystack").then((mod) => mod.PaystackButton),
  { ssr: false }
);

const PROMO_PLANS = [
  { id: '1_day', days: 1, price: 1000, label: '24 Hours', desc: 'Quick spike in traffic' },
  { id: '3_days', days: 3, price: 2500, label: '3 Days', desc: 'Best for weekend sales', popular: true },
  { id: '7_days', days: 7, price: 5000, label: '1 Week', desc: 'Maximum sustained reach' },
];

export default function PromoteTab() {
  const store = useStore((s) => s.store);
  const supabase = createClientComponentClient();
  
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('eligible');
  
  const [boostingPost, setBoostingPost] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(PROMO_PLANS[1]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paystackConfig, setPaystackConfig] = useState(null);
  const paystackRef = useRef(null);

  const [stats, setStats] = useState({
    reach: 0,
    interactions: 0,
    linkClicks: 0
  });

  const fetchMyPosts = useCallback(async () => {
    if (!store?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('marketplace_posts')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMyPosts(data || []);

      const totalReach = (data || []).reduce((sum, post) => sum + (post.view_count || post.views_count || 0), 0);
      const totalLikes = (data || []).reduce((sum, post) => sum + (post.likes_count || 0), 0);
      const totalShares = (data || []).reduce((sum, post) => sum + (post.share_count || post.shares_count || 0), 0);
      const totalClicks = (data || []).reduce((sum, post) => sum + (post.store_clicks || 0), 0);
      
      setStats({
        reach: totalReach,
        interactions: totalLikes + totalShares,
        linkClicks: totalClicks,
      });

    } catch (error) {
      console.error("Error fetching promote data:", error);
      toast.error("Failed to load your posts.");
    } finally {
      setLoading(false);
    }
  }, [store?.id, supabase]);

  useEffect(() => {
    fetchMyPosts();
  }, [fetchMyPosts]);

  const handleBoost = (post) => {
    setBoostingPost(post);
  };

  async function waitForPaystackButton(maxRetries = 10, interval = 500) {
    let attempt = 0;
    while (attempt < maxRetries) {
      const btn = paystackRef.current?.querySelector("button");
      if (btn) return btn;
      await new Promise((r) => setTimeout(r, interval));
      attempt++;
    }
    return null;
  }

  const handleInitializePayment = async () => {
    if (!boostingPost || !store?.store_email) {
      toast.error("Missing store email. Please update your store settings.");
      return;
    }

    setIsProcessing(true);
    const reference = `promo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    const cfg = {
      reference,
      email: store.store_email,
      amount: selectedPlan.price * 100,
      publicKey: process.env.NEXT_PUBLIC_PAYSTACK_KEY,
      metadata: { 
        postId: boostingPost.id, 
        storeId: store.id, 
        planDays: selectedPlan.days,
        type: 'post_promotion'
      },
    };
    
    setPaystackConfig(cfg);

    const btn = await waitForPaystackButton(10, 500);
    if (!btn) {
      toast.error("Paystack failed to initialize.");
      setIsProcessing(false);
      return;
    }
    btn.click();
  };

  const handlePaystackSuccess = async (response) => {
    try {
      toast.loading("Verifying promotion...");
      
      const res = await fetch("/api/marketplace/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          reference: response.reference, 
          postId: boostingPost.id,
          days: selectedPlan.days
        }),
      });

      if (!res.ok) throw new Error("Failed to verify promotion");

      toast.dismiss();
      toast.success("Post Boosted Successfully! 🚀");
      setBoostingPost(null);
      setIsProcessing(false);
      setActiveTab('past');
      fetchMyPosts();
      
    } catch (err) {
      toast.dismiss();
      toast.error("Verification failed, but don't worry, contact support with your reference.");
      console.error(err);
      setIsProcessing(false);
    }
  };

  const handlePaystackClose = () => {
    setIsProcessing(false);
    toast.info("Promotion cancelled.");
  };

  const now = new Date().getTime();
  
  const displayedPosts = activeTab === 'eligible' 
    ? myPosts.filter(post => !post.is_promoted || !post.promoted_until || new Date(post.promoted_until).getTime() <= now)
    : myPosts.filter(post => post.promoted_until !== null);

  if (!store?.id) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="w-20 h-20 rounded-full border-2 border-color3 flex items-center justify-center mb-6">
          <Store className="w-8 h-8 text-color3" />
        </div>
        <h2 className="text-xl font-bold text-color3 mb-2">Switch to a Store Account</h2>
        <p className="text-gray-500 text-sm max-w-xs mb-8">
          Get access to ad tools, insights, and reach more buyers by creating a free Darllix store.
        </p>
        <button className="w-full max-w-[250px] py-3.5 bg-color1 text-white font-bold rounded-lg transition-all hover:bg-color1/90">
          Set Up Store
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full h-[calc(100dvh-100px)] flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50/50 pb-24 md:pb-8 relative">
      
      <div className="bg-white px-4 py-3 flex items-center justify-center border-b border-gray-100 shrink-0 sticky top-0 z-10 pt-safe">
        <h1 className="text-base font-bold text-color3">Promote</h1>
      </div>

      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white p-4 mb-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-bold text-color3">Overview</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <span className="text-xs text-gray-500 font-medium mb-1 block">Accounts Reached</span>
              <span className="text-lg font-bold text-color3">{stats.reach.toLocaleString()}</span>
            </div>
            <div className="flex-1 bg-gray-50 rounded-xl p-3 border border-gray-100">
              <span className="text-xs text-gray-500 font-medium mb-1 block">Content Interactions</span>
              <span className="text-lg font-bold text-color3">{stats.interactions.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white min-h-[500px]">
          <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
            <h2 className="text-[15px] font-bold text-color3">Choose a post</h2>
          </div>

          <div className="flex items-center px-4 pt-2 border-b border-gray-100">
            <button 
              onClick={() => setActiveTab('eligible')}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'eligible' ? 'border-color3 text-color3' : 'border-transparent text-gray-400'}`}
            >
              Eligible
            </button>
            <button 
              onClick={() => setActiveTab('past')}
              className={`flex-1 pb-3 text-sm font-semibold transition-colors border-b-2 ${activeTab === 'past' ? 'border-color3 text-color3' : 'border-transparent text-gray-400'}`}
            >
              Active & Past Ads
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {displayedPosts.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full border-2 border-gray-200 flex items-center justify-center mb-4">
                  <Megaphone className="w-6 h-6 text-gray-300" />
                </div>
                <h3 className="text-[15px] font-bold text-color3 mb-1">
                  {activeTab === 'eligible' ? "No eligible posts" : "No active or past ads"}
                </h3>
                <p className="text-sm text-gray-500">
                  {activeTab === 'eligible' ? "Upload a product to start reaching more people." : "Boost a post to see it here."}
                </p>
              </div>
            ) : (
              displayedPosts.map((post) => {
                const isActiveAd = post.is_promoted && post.promoted_until && new Date(post.promoted_until).getTime() > now;

                return (
                  <div key={post.id} className="flex gap-4 p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="w-24 h-24 rounded-md bg-gray-100 overflow-hidden shrink-0 relative">
                      {post.media_type === 'video' || post.media_url?.includes('.mp4') ? (
                        <video src={post.media_url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={post.media_url} alt={post.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    
                    <div className="flex-1 flex flex-col justify-between py-0.5">
                      <div>
                        {activeTab === 'past' && (
                          <div className="mb-1">
                            {isActiveAd ? (
                              <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Active Ad</span>
                            ) : (
                              <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Ended</span>
                            )}
                          </div>
                        )}
                        <h3 className="text-[15px] font-semibold text-color3 leading-tight mb-1 line-clamp-2">{post.title}</h3>
                        <div className="flex items-center gap-3 text-[13px] text-gray-500">
                          <span>{new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                          <span>•</span>
                          <span>{post.likes_count || 0} likes</span>
                        </div>
                      </div>

                      {!isActiveAd ? (
                        <button 
                          onClick={() => handleBoost(post)}
                          className="w-full mt-2 py-1.5 bg-color1 text-white text-[13px] font-bold rounded-md hover:bg-color1/90 transition-colors"
                        >
                          {activeTab === 'past' ? 'Boost Again' : 'Boost Post'}
                        </button>
                      ) : (
                        <div className="w-full mt-2 py-1.5 bg-green-50 border border-green-100 text-green-600 text-[13px] font-bold rounded-md text-center">
                          Ends {new Date(post.promoted_until).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {boostingPost && (
          <div className="fixed inset-0 z-[99999] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-color3 text-lg">Select Budget & Duration</h3>
                <button onClick={() => setBoostingPost(null)} className="p-2 -mr-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                <div className="flex gap-4 mb-6">
                  <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                    {boostingPost.media_type === 'video' || boostingPost.media_url?.includes('.mp4') ? (
                      <video src={boostingPost.media_url} className="w-full h-full object-cover" />
                    ) : (
                      <img src={boostingPost.media_url} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-color3 line-clamp-2 mb-1">{boostingPost.title}</h4>
                    <span className="text-xs font-semibold text-color1 bg-color1/10 px-2 py-1 rounded-md">Target: Discover Feed</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {PROMO_PLANS.map((plan) => (
                    <div 
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedPlan.id === plan.id ? 'border-color1 bg-color1/5' : 'border-gray-100 hover:border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {selectedPlan.id === plan.id ? (
                            <CheckCircle2 className="w-5 h-5 text-color1" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-200" />
                          )}
                          <span className="font-bold text-color3">{plan.label}</span>
                          {plan.popular && <span className="text-[10px] font-bold bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full uppercase tracking-wider">Popular</span>}
                        </div>
                        <span className="font-black text-color3">₦{plan.price.toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-500 pl-7">{plan.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <button 
                  onClick={handleInitializePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-color1 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-color1/90 transition-colors disabled:opacity-50"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Zap className="w-5 h-5 fill-white" /> Pay ₦{selectedPlan.price.toLocaleString()}</>}
                </button>
                <p className="text-center text-xs text-gray-400 mt-3">Secured by Paystack</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div ref={paystackRef} style={{ position: "absolute", width: 0, height: 0, overflow: "hidden", pointerEvents: "none" }} aria-hidden>
        {paystackConfig && (
          <PaystackButton text="hidden" onSuccess={handlePaystackSuccess} onClose={handlePaystackClose} {...paystackConfig} />
        )}
      </div>
    </div>
  );
}