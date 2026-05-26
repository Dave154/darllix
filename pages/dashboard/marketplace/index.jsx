import React, { useEffect }  from 'react';
import { useRouter } from 'next/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Compass, PlusSquare, Zap } from 'lucide-react';
import MarketplaceFeed from '../../../components/dashboardComponents/marketPlaceFeed';
import PromoteTab from '../../../components/dashboardComponents/promoteTab';
import DashboardLayout from '../../../components/dashboardComponents/dashboardLayout';
import UploadModal from '../../../components/dashboardComponents/UploadModal'; 
import { withAuth } from '../../../lib/withAuth';
import { withAuthAndSubscriptionData } from '../../../lib/withSubscription';
import SubscriptionRequired from '../../../components/dashboardComponents/subscriptionRequired';
import { useStore } from '@/store';
import { AnimatePresence } from 'framer-motion';

export default function Marketplace({user,store,hasStore,hasActiveSubscription}) {
  const router = useRouter();
  
  // If subscription is not active, show overlay
  if (!hasActiveSubscription) {
    return (
      <DashboardLayout>
        <SubscriptionRequired feature="Marketplace access" />
      </DashboardLayout>
    );
  }
  
  const currentTab = ["discover", "promote"].includes(router.query.tab) ? router.query.tab : "discover";
  
  const setStore = useStore((s) => s.setStore);
  const isUploadModalOpen = useStore((s) => s.isUploadModalOpen);
  const setUploadModalOpen = useStore((s) => s.setUploadModalOpen);
  
  useEffect(() => {
    if (hasStore) {
      setStore(store);
    } 
  }, [hasStore, store, setStore]); 

  const handleTabChange = (value) => {
    router.push({
      pathname: router.pathname,
      query: { tab: value }
    }, undefined, { shallow: true });
  };

  return (
    <DashboardLayout>
      <AnimatePresence>
        {isUploadModalOpen && (
          <UploadModal 
            isOpen={isUploadModalOpen} 
            onClose={() => setUploadModalOpen(false)}
            onSuccess={(newPost) => {
              setUploadModalOpen(false);
              window.dispatchEvent(new CustomEvent('new-post-uploaded', { detail: newPost }));
            }}
          />
        )}
      </AnimatePresence>
      
      <div className="w-full h-[calc(100dvh-56px)] md:h-full bg-color4 relative overflow-hidden md:overflow-visible">
        <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full h-full">

          <TabsContent value="discover" className="h-full w-full m-0 border-none outline-none data-[state=inactive]:hidden">
            <MarketplaceFeed upload={false}/>
          </TabsContent>
          
          <TabsContent value="promote" className="h-full w-full m-0 border-none outline-none data-[state=inactive]:hidden">
            <PromoteTab />
          </TabsContent>

          <TabsList className="fixed md:hidden bottom-2 left-1/2 -translate-x-1/2 z-50 h-12 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-full p-1.5 flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
            <TabsTrigger 
              value="discover" 
              className="rounded-full w-12 h-12 flex items-center justify-center data-[state=active]:bg-gray-200 data-[state=active]:text-color3 text-gray-400 transition-all data-[state=active]:shadow-sm"
            >
              <Compass className="w-6 h-6" />
            </TabsTrigger>
            
            <button 
              onClick={() => setUploadModalOpen(true)}
              className="rounded-full w-10 h-10 flex items-center justify-center bg-color3 text-white transition-all shadow-[0_0_15px_rgba(74,33,239,0.3)] hover:scale-105 active:scale-95"
            >
              <PlusSquare className="w-5 h-5" />
            </button>
            
            <TabsTrigger 
              value="promote" 
              className="rounded-full w-12 h-12 flex items-center justify-center data-[state=active]:bg-gray-200 data-[state=active]:text-color3 text-gray-400 transition-all data-[state=active]:shadow-sm"
            >
              <Zap className="w-6 h-6" />
            </TabsTrigger>
          </TabsList>

        </Tabs>
      </div>
    </DashboardLayout>
  );
}

export const getServerSideProps = withAuthAndSubscriptionData();