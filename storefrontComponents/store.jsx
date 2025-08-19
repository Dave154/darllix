import Background from './storeBg';
import Image from 'next/image';
import demoBanner from '../public/test_store_banner.png';
import Breadcrumb from './breadcrumb';
import {Button} from '@/components/ui/button';
import Products from './products';
import { useStore } from '@/store';
import Header from './header';
import { motion } from 'framer-motion';
import { FaCaretUp } from 'react-icons/fa6';
import { ArrowBigUpDash, ArrowUp } from 'lucide-react';

export default function Storefront({ store, products }) {
  const count = useStore((state) => state.cartCount());

  return (
    <Background store={store} >
      <div className="min-h-screen flex flex-col">
        <Header store={store} />

        <main className="mt-4 flex-grow">
          {/* Hero Section */}
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
                  className="absolute inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center text-white"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                >
                  <motion.h1
                    className="text-5xl font-bold text-center mt-4 text-color4"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                  >
                    {store?.name || 'Store Name'}
                  </motion.h1>
                  <motion.p
                    className="text-center text-gray-100 mt-2 font-semibold"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 0.5 }}
                  >
                    Welcome to our store!
                  </motion.p>
                </motion.div>
              </div>
            </div>
          </motion.section>

          {/* Products Section */}
          <section>
            <div className="max-w-7xl mx-auto px-4 py-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
              >
                <Breadcrumb />
              </motion.div>

              {/* Products list with subtle stagger */}
              <motion.div
                initial="hidden"
                animate="show"
                variants={{
                  hidden: { opacity: 0 },
                  show: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                <Products />
              </motion.div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <motion.footer
          className="mt-8 border-t border-gray-400"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="text-center text-gray-600">
              <p className="text-sm">
                © {new Date().getFullYear()} {store?.name || 'Your Store'}. All rights reserved.
              </p>
              <p className="text-xs mt-2">Powered by Darlix</p>
            </div>
          </div>
        </motion.footer>
          <motion.button onClick={()=>{
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }} className="fixed bottom-4 grid place-content-center w-10 h-10 right-4 bg-color3 text-white rounded-full  shadow-lg hover:bg-color2 transition-colors duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}>
            <ArrowBigUpDash size={24} />
          </motion.button>
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
    .select('id, name, subdomain, banner_url')
    .eq('subdomain', subdomain)
    .maybeSingle();

  if (!store) {
    return { props: { store: null, products: [] } };
  }

  const { data: products } = await supabase
    .from('products')
    .select('id, name, price, image_url')
    .eq('store_id', store.id)
    .order('name', { ascending: true });

  return { props: { store, products: products || [] } };
}
