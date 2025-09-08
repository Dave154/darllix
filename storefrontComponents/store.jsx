// pages/.../Storefront.jsx  (replace your existing file with this)
import Background from './storeBg';
import { toast } from "sonner"
import Image from 'next/image';
import Breadcrumb from './breadcrumb';
import Products from './products';
import { useStore } from '@/store';
import Header from './header';
import { motion } from 'framer-motion';
import { ArrowBigUpDash, ShoppingCart } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BsFire } from 'react-icons/bs';
import { CartDrawer } from './cartModal';
import { PaginationComponent } from './pagination';

export default function Storefront({ store }) {
  const count = useStore((state) => state.cartCount());
  const [query, setQuery] = useState("");
  // search and advanced filters removed per request
  const [tab] = useState('Active');

  // Data state
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);

  // loading / error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // paging + sort kept for later (not shown in UI now)
  const [page, setPage] = useState(1);
  const [limit] = useState(24);
  const [sortBy] = useState('created_at');
  const [sortDir] = useState('desc');

  // category selection (single select). null => All
  const [selectedCategory, setSelectedCategory] = useState(null);

  // fetch params helpers
  const totalPages = Math.max(1, Math.ceil((total || 0) / limit));

  const [debouncedQuery, setDebouncedQuery] = useState(query);
    // debounce query (500ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 500);
    return () => clearTimeout(t);
  }, [query]);
  const fetchProducts = useCallback(
  async (opts = {}) => {
    setLoading(true);
    setError(null);
    try {
         toast("Event has been created.")
      const params = new URLSearchParams();
      params.set('page', String(opts.page ?? page));
      params.set('limit', String(opts.limit ?? limit));

      const statusVal = opts.status ?? tab;
      if (statusVal && statusVal !== 'All') params.set('status', statusVal);

      if (store?.id) params.set('storeId', store.id);
       if ((opts.q ?? debouncedQuery).trim()) params.set("q", opts.q ?? debouncedQuery);
      if (opts.sortBy ?? sortBy) params.set('sort_by', opts.sortBy ?? sortBy);
      if (opts.sortDir ?? sortDir) params.set('sort_dir', opts.sortDir ?? sortDir);

      const catId = (opts.category ?? undefined);
      if (catId) params.set('category', String(catId));

      const res = await fetch(`/api/products?${params.toString()}`, { credentials: 'same-origin' });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Fetch failed: ${res.status}`);
      }

      const json = await res.json();
      setProducts(json.products || []);
      if (Array.isArray(json.categories)) setCategories(json.categories);
      setTotal(json.total || 0);
    } catch (err) {
      console.error('fetchProducts', err);
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  },
  [page, limit, tab, store?.id, sortBy, sortDir,debouncedQuery]
);


  useEffect(() => {
    fetchProducts({ page, limit, status: tab,q: debouncedQuery, sortBy, sortDir,category: selectedCategory ?? undefined, });
  }, [fetchProducts, page, limit, tab, sortBy, sortDir,selectedCategory,debouncedQuery]);


 const catRowRef = useRef(null);
  function scrollCategories(by = 300) {
    if (!catRowRef.current) return;
    catRowRef.current.scrollBy({ left: by, behavior: "smooth" });
  }
  useEffect(() => {
    if (!catRowRef.current) return;
    // ensure the row is visually centered (no heavy scroll logic)
    catRowRef.current.scrollLeft = 0;
  }, [categories]);

  return (
    <Background store={store}>
      <div className="min-h-screen flex flex-col">
        <Header store={store} query={query} setQuery={setQuery} />

        <main className="mt-4 flex-grow">
          {/* Banner */}
          <motion.section
            className="hero"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          >
            <div className="max-w-7xl mx-auto border rounded-md overflow-hidden">
              <div className="h-96 relative">
                <Image
                  src={store?.banner_url || '/placeholder.jpg'}
                  alt="Store Banner"
                  width={2000}
                  height={2000}
                  className="w-full h-full object-cover"
                  unoptimized
                />
                <motion.div
                  className="absolute inset-0 bg-black bg-opacity-55 flex flex-col items-center justify-center text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.h1
                    className="text-4xl font-bold text-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.45 }}
                  >
                    {store?.name || 'Store Name'}
                  </motion.h1>
                  <motion.p
                    className="text-center text-gray-100 mt-2 max-w-2xl"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.45 }}
                  >
                    {store?.description}
                  </motion.p>
                </motion.div>
              </div>

            </div>
          </motion.section>

          {/* Products */}
          <section>
            
              {/* --- Categories centered, compact --- */}
              <div className=" border-t">
                <div className="max-w-7xl  pt-2 px-4 relative mx-auto">
                  <div className="flex justify-center justify-self-center
                  ">
                    <div
                      ref={catRowRef}
                      className="flex gap-2 overflow-x-auto no-scrollbar"
                      style={{ justifyContent: 'center' }}
                    >
                      {/* All pill */}
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(null)}
                        className={`flex justify-center items-center gap-2 px-3 py-1.5 text-sm ${
                          selectedCategory === null
                           ? 'border-b-2 border-black'
                                : 'text-gray-700 '
                        }`}
                      >
                        <span className="text-color1">
                          <BsFire />
                        </span>
                        <span className="">
                          All
                        </span>  
                      </button>

                      {categories.map((c) => {
                        const active = selectedCategory === c.name || selectedCategory === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setSelectedCategory(active ? null : c.id)}
                            className={`flex flex-col justify-center items-center gap-2  px-3 py-1.5 text-sm  ${
                              active
                                ? 'border-b-2 border-black'
                                : 'text-gray-700 '
                            }`}
                          >
                             {/* <span>{c.name.slice(0,1)}</span> */}
                            <span className="truncate max-w-[12rem] capitalize">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                    <div className="ml-2 absolute right-3 top-1">
                         <button
                           type="button"
                           onClick={() => scrollCategories(300)}
                           className="w-8 h-8 rounded-full bg-white shadow flex items-center justify-center"
                           aria-label="Scroll categories"
                         >
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                             <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                           </svg>
                         </button>
                       </div>
                </div>
              </div>
            <div className="max-w-7xl mx-auto px-4 py-6">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
              >
                <Breadcrumb category={selectedCategory} categories={categories} action={setSelectedCategory} />
              </motion.div>

              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
                }}
                className="mt-4"
              >
                <Products store={store} products={products} loading={loading} />
              </motion.div>

               <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
                }}
                className="mt-4"
              >
                <PaginationComponent totalPages={totalPages} page={page} setPage={setPage} />
              </motion.div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <motion.footer
          className="mt-8 border-t border-gray-200"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="text-center text-gray-600">
              <p className="text-sm">© {new Date().getFullYear()} {store?.name || 'Your Store'}. All rights reserved.</p>
              <p className="">Powered by Darllix.</p>
            </div>
          </div>
        </motion.footer>

        <motion.button
          onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className="fixed bottom-4 grid place-content-center w-10 h-10 right-4 bg-color3 text-white rounded-full shadow-lg hover:bg-color2 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Back to top"
        >
          <ArrowBigUpDash size={20} />
        </motion.button>
            <CartDrawer>

         <motion.button
          className="fixed  bottom-4 grid sm:hidden place-content-center w-10 h-10 right-4 bg-color3 text-white rounded-full shadow-lg hover:bg-color2 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Cart"
          >
          <ShoppingCart size={20} />
           {
             count > 0 &&
             <div className="rounded-full absolute right-0 h-4 w-4 bg-white text-color3 grid place-items-center text-xs font-bold">
              {count}
             </div>
            }
        </motion.button>
            </CartDrawer>
      </div>
    </Background>
  );
}

export async function getServerSideProps(context) {
  let host = context.req.headers.host || '';
  let subdomain = null;

  if (host.endsWith('.darllix.shop') || host.endsWith('.darllix.vercel.app')) {
    subdomain = host.split('.')[0];
  }
  if (host.endsWith('.localhost:3000')) {
    subdomain = host.split('.')[0];
  }
  if (!subdomain || subdomain === 'www' || subdomain === 'darllix') {
    return { notFound: true };
  }

  const { createServerSupabaseClient } = await import('../lib/supabaseClient');
  const supabase = createServerSupabaseClient();

  const { data: store } = await supabase
    .from('stores')
    .select('id, name, subdomain, banner_url, description')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (!store) {
    return { props: { store: null, products: [] } };
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, images, categories')
    .eq('store_id', store.id)
    .order('name', { ascending: true });

  return { props: { store, products: products || [] } };
}


