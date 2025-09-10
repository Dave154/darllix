// components/preview/PreviewPanel.jsx
"use client";

import React, { useEffect, useState } from "react";
import Header from "../../storefrontComponents/header";
import Image from "next/image";
import Breadcrumb from "../../storefrontComponents/breadcrumb";
import Products from "../../storefrontComponents/products";
import { PaginationComponent } from "../../storefrontComponents/pagination";
import { useWatch } from "react-hook-form";
import { motion } from 'framer-motion'
import { BsFire } from "react-icons/bs";
import { ArrowBigUpDash, ShoppingCart } from "lucide-react";
import ProductCard from "../../storefrontComponents/productCard";


const BASE_DEFAULTS = {
  name: "",
  subdomain: "",
  description: "",
  banner_url: "",
  theme: { primary: "#0f172a", accent: "#2563eb", background: "#ffffff" },
};

function LivePreview({ store }) {
  
  const theme = store?.theme || BASE_DEFAULTS.theme
    const [tab] = useState('Active');
    const [categories, setCategories] = useState(store.categories || []);
    const [products, setProducts] = useState(store.products  || [])
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(24);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const totalPages = Math.max(1, Math.ceil((total || 0) / limit));
    
  

  const priceFmt = (val) =>
    typeof val === "number" ? val.toLocaleString(undefined, { minimumFractionDigits: 0 }) : val;

    useEffect(()=>{
      setProducts(store.products)
      setCategories(store.categories)
    },[store])

      const themeVars = {
     "--color2": store.theme?.accent ,
    "--color3": store.theme?.primary,
    "--color4": store.theme?.background,
  };

  return (
     <div style={themeVars} className="min-h-screen flex flex-col border-4  bg-color4 rounded-lg border-black">
            <div className="p-2 bg-color2">
                <div className="max-w-7xl mx-auto px-4">
                  <p className="text-xs text-color4 text-center py-1">
                    Welcome to { store?.name || store.mystore?.name  || '[Store Name]'}! Enjoy your shopping experience.
                  </p>
                </div>
              </div>
              <header className="border-b border-gray-400">
               <nav className="py-4 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8  flex justify-between gap-4 items-center">
                  <div className="">
                      <span className="font-extrabold whitespace-nowrap text-sm md:text-2xl text-color3 capitalize">{store?.name || store.mystore?.name}</span>
                  </div>
        
                  <div  className="border border-gray-300 rounded-full px-4 py-2 flex items-center w-full max-w-md">
                    <input  placeholder="Search products ..." className="bg-transparent w-full text-xs border-none h-full outline-none" />
                  </div>
        
                  <div className="hidden sm:flex gap-3 items-center">
                
                   <div className="flex items-end space-x-1 cursor-pointer hover:animate-bounce ">
                    
                    <i className="text-xl">
                      <ShoppingCart className='h-4 w-4 md:h-6 md:w-6'/>
                    </i>                  
                  </div>
                 
                  </div>
                 
                  
               </nav>
              
              </header>

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
                  src={store?.banner_url || store.mystore?.banner_url ||'/placeholder.jpg'}
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
                    className="text-4xl text-color4 font-bold text-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.45 }}
                  >
                    {store?.name || store.mystore?.name ||'[Store Name]'}
                  </motion.h1>
                  <motion.p
                    className="text-center text-gray-100 mt-2 px-2 max-w-2xl"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.45 }}
                  >
                    {store?.description || store.mystore?.description }
                  </motion.p>
                </motion.div>
              </div>

            </div>
          </motion.section>

          {/* Products */}
          <section>
              <div className=" border-t">
                <div className="max-w-7xl  pt-2 px-4 relative mx-auto">
                  <div className="flex justify-center justify-self-center
                  ">
                    <div
                      // ref={catRowRef}
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

                      {categories?.map((c) => {
                        const active = selectedCategory === c.name || selectedCategory === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            className={`flex flex-col justify-center items-center gap-2  px-3 py-1.5 text-sm  ${
                              active
                                ? 'border-b-2 border-black'
                                : 'text-gray-700 '
                            }`}
                          >
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
                          <div>
                <motion.h2
                  className="text-2xl font-semibold"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {/* Products */}
                </motion.h2>

                <div
                  className="grid grid-cols-2 gap-4 xl:grid-cols-3 mt-4"
                  initial="hidden"
                  animate="show"
                >
                  {products.map((product, i) => (
                    <motion.div key={product.id + i}  >
                      <ProductCard productData={product} preview={true} />
                    </motion.div>
                  ))}
                </div>
              </div>
                
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
              <p className="text-sm">© {new Date().getFullYear()} {store?.name || store.mystore?.name || 'Your Store'}. All rights reserved.</p>
              <p className="">Powered by Darllix.</p>
            </div>
          </div>
        </motion.footer>

        <motion.button
          className="fixed bottom-4 grid place-content-center w-10 h-10 right-4 bg-color3 text-white rounded-full shadow-lg hover:bg-color2 transition-colors duration-200"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Back to top"
        >
         <ShoppingCart size={20} />
        </motion.button>
          
      </div>
  );
}

const MemoLivePreview = React.memo(LivePreview);

export default function PreviewPanel({ mystore, control, products, categories }) {
  // If using RHF control, use watch via useWatch; otherwise fall back to defaults
  const name = useWatch({ control, name: "name" }) ?? "";
  const subdomain = useWatch({ control, name: "subdomain" }) ?? "";
  const description = useWatch({ control, name: "description" }) ?? "";
  const banner_url = useWatch({ control, name: "banner_url" }) ?? "";
  const theme = useWatch({ control, name: "theme" }) ?? BASE_DEFAULTS.theme;

  const store = React.useMemo(
    () => ({ name, subdomain, description, banner_url, theme, products, categories, mystore }),
    [name, subdomain, description, banner_url, theme, products, mystore]
  );

  return <MemoLivePreview store={store} />;
}
