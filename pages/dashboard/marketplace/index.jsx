import React from 'react';
import { useRouter } from 'next/router';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Compass, PlusSquare, Zap } from 'lucide-react';
import MarketplaceFeed from '../../../components/dashboardComponents/marketPlaceFeed';
import SellTab from '../../../components/dashboardComponents/sellTab';
import PromoteTab from '../../../components/dashboardComponents/promoteTab';
import DashboardLayout from '../../../components/dashboardComponents/dashboardLayout';


export default function Marketplace() {
  const router = useRouter();
  const currentTab = router.query.tab || "discover";

  const handleTabChange = (value) => {
    router.push({
      pathname: router.pathname,
      query: { tab: value }
    }, undefined, { shallow: true });
  };

  return (
    <DashboardLayout>
    <div className="w-full h-[calc(100dvh-56px)] md:h-full bg-color4 relative overflow-hidden md:overflow-visible">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full h-full">

        <TabsContent value="discover" className="h-full w-full m-0 border-none outline-none data-[state=inactive]:hidden">
          <MarketplaceFeed />
        </TabsContent>

        <TabsContent value="sell" className="h-full w-full m-0 border-none outline-none data-[state=inactive]:hidden">
          <SellTab />
        </TabsContent>

        <TabsContent value="promote" className="h-full w-full m-0 border-none outline-none data-[state=inactive]:hidden">
          <PromoteTab />
        </TabsContent>

        <TabsList className="fixed md:hidden bottom-6 left-1/2 -translate-x-1/2 z-50 h-16 bg-white/80 backdrop-blur-xl border border-gray-200 rounded-full p-1.5 flex items-center gap-2 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
          <TabsTrigger 
            value="discover" 
            className="rounded-full w-12 h-12 flex items-center justify-center data-[state=active]:bg-gray-100 data-[state=active]:text-color3 text-gray-400 transition-all data-[state=active]:shadow-sm"
          >
            <Compass className="w-6 h-6" />
          </TabsTrigger>
          
          <TabsTrigger 
            value="sell" 
            className="rounded-full w-12 h-12 flex items-center justify-center data-[state=active]:bg-color1 data-[state=active]:text-white text-gray-400 transition-all data-[state=active]:shadow-[0_0_15px_rgba(74,33,239,0.3)]"
          >
            <PlusSquare className="w-6 h-6" />
          </TabsTrigger>
          
          <TabsTrigger 
            value="promote" 
            className="rounded-full w-12 h-12 flex items-center justify-center data-[state=active]:bg-gray-100 data-[state=active]:text-color3 text-gray-400 transition-all data-[state=active]:shadow-sm"
          >
            <Zap className="w-6 h-6" />
          </TabsTrigger>
        </TabsList>

      </Tabs>
    </div>
    </DashboardLayout>
  );
}