import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, TrendingUp, ArrowLeft, Loader2, User } from 'lucide-react';

export default function MarketplaceSearch({ isOpen, onClose, onSearch }) {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState(['leather bag', 'wireless earbuds', 'sneakers']);
  
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    if (query.startsWith('@') && query.length > 1) {
      setIsLoadingSuggestions(true);
      
      const debounceTimer = setTimeout(async () => {
        try {
          const res = await fetch(`/api/marketplace/suggestions?query=${encodeURIComponent(query)}`);
          if (res.ok) {
            const data = await res.json();
            setSuggestions(data.suggestions || []);
          }
        } catch (error) {
          console.error("Failed to fetch suggestions", error);
        } finally {
          setIsLoadingSuggestions(false);
        }
      }, 300); // Waits 300ms after they stop typing before fetching

      return () => clearTimeout(debounceTimer);
    } else {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
    }
  }, [query]);

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;
    
    if (!recentSearches.includes(searchTerm.toLowerCase())) {
      setRecentSearches([searchTerm.toLowerCase(), ...recentSearches].slice(0, 5));
    }
    
    onSearch(searchTerm);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query);
    }
  };

  const removeRecentSearch = (e, termToRemove) => {
    e.stopPropagation();
    setRecentSearches(recentSearches.filter(term => term !== termToRemove));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: "100%" }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: "100%" }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col md:items-center md:justify-center"
        >
          <div className="w-full h-full md:h-[80vh] md:max-h-[800px] md:max-w-[450px] bg-white md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden">
            
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 bg-white">
              <button onClick={onClose} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors">
                <ArrowLeft className="w-6 h-6 text-color3" />
              </button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search products or @vendors..."
                  className="w-full bg-gray-100 text-color3 rounded-full py-2.5 pl-10 pr-10 focus:outline-none focus:ring-2 focus:ring-color1/20 transition-all font-medium text-sm"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 bg-gray-300 rounded-full hover:bg-gray-400 transition-colors">
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-white">
              
              {query.startsWith('@') ? (
                <div>
                  <h3 className="text-sm font-bold text-color3 mb-3 flex items-center gap-2">
                    <User className="w-4 h-4 text-color1" /> Vendor Suggestions
                  </h3>
                  
                  {isLoadingSuggestions ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-color1" />
                    </div>
                  ) : suggestions.length > 0 ? (
                    <div className="space-y-1">
                      {suggestions.map((vendor) => (
                        <motion.button
                          key={vendor.id}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const fullSlug = `@${vendor.slug}`;
                            setQuery(fullSlug);
                            handleSearch(fullSlug);
                          }}
                          className="w-full flex items-center p-3 hover:bg-gray-50 rounded-xl transition-colors group text-left"
                        >
                          
                          <div>
                            <p className="text-sm font-bold text-color3 group-hover:text-color1 transition-colors">
                              {vendor.full_name}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">@{vendor.slug}</p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  ) : query.length > 1 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      No vendors found matching "{query}"
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 py-2">
                      Keep typing to search for a specific vendor...
                    </p>
                  )}
                </div>
              ) : (
                <>
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-color3">Recent</h3>
                        <button onClick={() => setRecentSearches([])} className="text-xs font-semibold text-color1 hover:underline">
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((term, i) => (
                          <motion.button
                            key={i}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => { setQuery(term); handleSearch(term); }}
                            className="w-full flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors group"
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-600 group-hover:text-color3 transition-colors">{term}</span>
                            </div>
                            <button onClick={(e) => removeRecentSearch(e, term)} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                              <X className="w-4 h-4 text-gray-300 hover:text-gray-500" />
                            </button>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-bold text-color3 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-color1" /> Trending Now
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {['perfume oils', 'macbook pro', 'nike dunks', 'skincare', 'office wear'].map((trend, i) => (
                        <motion.button
                          key={i}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => { setQuery(trend); handleSearch(trend); }}
                          className="px-4 py-2 bg-gray-50 border border-gray-100 rounded-full text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-color3 transition-colors shadow-sm"
                        >
                          {trend}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </>
              )}

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}