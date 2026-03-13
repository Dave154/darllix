import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, Wallet, X, ArrowRight } from 'lucide-react';

const mockPastPosts = [
  { id: 1, title: 'Premium Leather Bag', views: '2.4k', date: '2 days ago', image: '/placeholder.jpg', isPromoted: false },
  { id: 2, title: 'Wireless Earbuds', views: '12.8k', date: '1 week ago', image: '/vendor1.jpg', isPromoted: true },
  { id: 3, title: 'Designer Sneakers', views: '856', date: '3 weeks ago', image: '/vendor6.jpg', isPromoted: false },
];

export default function PromoteTab() {
  const [selectedPost, setSelectedPost] = useState(null);

  return (
    <div className="w-full h-full bg-color4 flex flex-col pt-8 pb-32 px-4 overflow-y-auto scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-md w-full mx-auto">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-color3 tracking-tight">Promote</h1>
            <p className="text-gray-500 text-sm mt-1">Boost visibility and get more sales.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col items-end shadow-sm">
            <span className="flex items-center gap-1 text-gray-500 text-xs font-medium mb-1">
              <Wallet className="w-3 h-3" /> Wallet
            </span>
            <span className="text-color3 font-black">₦145,000</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <h2 className="text-gray-500 font-semibold text-xs uppercase tracking-wider mb-1">Your Posts</h2>
          
          {mockPastPosts.map((post) => (
            <motion.div key={post.id} whileTap={{ scale: 0.98 }} className="bg-white border border-gray-200 rounded-2xl p-3 flex items-center gap-4 relative overflow-hidden shadow-sm">
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              </div>
              
              <div className="flex-1">
                <h3 className="text-color3 font-bold text-sm line-clamp-1">{post.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 font-medium">
                  <span className="flex items-center gap-1 text-color1"><TrendingUp className="w-3 h-3" /> {post.views}</span>
                  <span>{post.date}</span>
                </div>
              </div>

              {post.isPromoted ? (
                <div className="px-3 py-1.5 rounded-full bg-color1/10 border border-color1/30 text-color1 text-xs font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-color1" /> Active
                </div>
              ) : (
                <motion.button onClick={() => setSelectedPost(post.id)} className="w-10 h-10 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors border border-gray-200">
                  <ArrowRight className="w-5 h-5 text-gray-600" />
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0, y: "100%" }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-[60] bg-white border-t border-gray-200 p-6 rounded-t-3xl pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] max-w-md mx-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-color3 font-bold text-xl flex items-center gap-2">
                <Zap className="w-5 h-5 text-color1 fill-color1" /> Boost Post
              </h3>
              <button onClick={() => setSelectedPost(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-5 h-5 text-color3" />
              </button>
            </div>

            <div className="flex flex-col gap-3 mb-6">
              {[
                { price: '5,000', days: '3', views: '~1,500' },
                { price: '10,000', days: '7', views: '~4,000', recommended: true },
                { price: '25,000', days: '14', views: '~12,000' }
              ].map((tier, idx) => (
                <motion.button key={idx} whileTap={{ scale: 0.98 }} className={`w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all ${tier.recommended ? 'bg-color1/5 border-color1 shadow-sm' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-color3 font-bold text-lg">₦{tier.price}</span>
                      {tier.recommended && <span className="text-[10px] font-bold uppercase bg-color1 px-2 py-0.5 rounded-full text-white">Best Value</span>}
                    </div>
                    <span className="text-gray-500 text-sm">Run for {tier.days} days</span>
                  </div>
                  <div className="text-right">
                    <span className="text-color1 font-bold block">{tier.views}</span>
                    <span className="text-gray-400 text-xs">Est. Views</span>
                  </div>
                </motion.button>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.95 }} className="w-full bg-color1 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(74,33,239,0.3)] transition-all">
              Pay & Boost Now
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}