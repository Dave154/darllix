import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import MarketplaceFeed from '../../components/dashboardComponents/marketPlaceFeed';
import { useUser } from '../../hooks/useUser';
import { AnimatePresence } from 'framer-motion';
import UploadModal from '../../components/dashboardComponents/UploadModal';
import { useStore } from '@/store';

export default function PublicMarketplace() {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const isUploadModalOpen = useStore((s) => s.isUploadModalOpen);
  const setUploadModalOpen = useStore((s) => s.setUploadModalOpen);

  useEffect(() => {
    if (user && !userLoading) {
      router.replace('/dashboard/marketplace?tab=discover');
    }
  }, [user, userLoading, router]);

  if (userLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-white">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full" />
        </div>
      </div>
    );
  }

  // If user is authenticated, don't render anything (redirect in progress)
  if (user) {
    return null;
  }

  return (
    <>
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
      
      <div className="w-full h-[calc(100dvh)] md:h-full bg-color4 relative overflow-hidden md:overflow-visible">
        <MarketplaceFeed 
          upload={false} 
          isPublic={true}
          user={user}
          currentPath="/marketplace"
        />
      </div>
    </>
  );
}
