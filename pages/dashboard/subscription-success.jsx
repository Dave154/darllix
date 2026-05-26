import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../hooks/useUser';
import DashboardLayout from '../../components/dashboardComponents/dashboardLayout';
import { CheckCircle, Loader2, Calendar, DollarSign, Store } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubscriptionSuccessPage() {
  const router = useRouter();
  const { user, store } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const { ref } = router.query;

  // Fetch subscription details
  useEffect(() => {
    if (!user?.id || !store?.id) return;

    const fetchSubscription = async () => {
      try {
        const res = await fetch(`/api/subscriptions/status?storeId=${store.id}`);
        const data = await res.json();
        if (data.success && data.subscription) {
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id, store?.id]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-color1" />
        </div>
      </DashboardLayout>
    );
  }

  const planName = subscription?.plan || 'Subscription Plan';
  const endDate = subscription?.endDate
    ? new Date(subscription.endDate).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Success State */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring' }}
          className="text-center mb-12"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="relative"
            >
              <div className="absolute inset-0 bg-color1/20 blur-2xl rounded-full" />
              <CheckCircle className="w-24 h-24 text-color1 relative" />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-4xl font-black text-color3 mb-3"
          >
            Subscription Activated! 🎉
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-lg text-gray-600 max-w-md mx-auto"
          >
            Your subscription is now active. You have full access to all dashboard features and
            marketplace tools.
          </motion.p>
        </motion.div>

        {/* Subscription Details Card */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-gradient-to-br from-color1/5 to-color2/5 border border-gray-200 rounded-2xl p-8 mb-8"
          >
            <h2 className="text-2xl font-bold text-color3 mb-6">Your Subscription Details</h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Plan Name */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-color1/20 rounded-lg flex items-center justify-center">
                  <Store className="w-6 h-6 text-color1" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Plan</p>
                  <p className="text-xl font-bold text-color3">{planName}</p>
                </div>
              </div>

              {/* Amount Paid */}
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-color1/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-color1" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Amount Paid</p>
                  <p className="text-xl font-bold text-color3">
                    ₦{subscription.amountPaid?.toLocaleString() || 0}
                  </p>
                </div>
              </div>

              {/* Valid Until */}
              <div className="md:col-span-2 flex gap-4">
                <div className="w-12 h-12 bg-color1/20 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-color1" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 font-medium">Valid Until</p>
                  <p className="text-xl font-bold text-color3">{endDate}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {subscription.daysRemaining} days remaining
                  </p>
                </div>
              </div>
            </div>

            {/* Reference */}
            {ref && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 font-medium mb-1">Payment Reference</p>
                <p className="text-sm font-mono text-gray-700 break-all">{ref}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-color3 text-white rounded-lg font-bold hover:bg-black transition-colors"
          >
            Go to Dashboard
          </button>
          <button
            onClick={() => router.push('/dashboard/marketplace')}
            className="px-8 py-4 bg-white border-2 border-color1 text-color1 rounded-lg font-bold hover:bg-color1/5 transition-colors"
          >
            View Marketplace
          </button>
        </motion.div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-12 bg-white border border-gray-200 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-color3 mb-6">What's Next?</h3>
          <div className="space-y-4">
            {[
              {
                num: '1',
                title: 'Upload Products',
                desc: 'Start adding your products to the marketplace and reach thousands of buyers.',
              },
              {
                num: '2',
                title: 'Build Your Store',
                desc: 'Create a customized customer store with your branding and unique offerings.',
              },
              {
                num: '3',
                title: 'Manage Orders',
                desc: 'Track orders, manage customers, and handle payments all from one dashboard.',
              },
              {
                num: '4',
                title: 'Grow Your Business',
                desc: 'Use analytics to understand your customers and promote featured products.',
              },
            ].map((step, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="w-10 h-10 bg-color1 text-white rounded-full flex items-center justify-center font-bold shrink-0">
                  {step.num}
                </div>
                <div>
                  <p className="font-bold text-color3">{step.title}</p>
                  <p className="text-sm text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Support CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 bg-gradient-to-r from-color1/10 to-color2/10 border border-color1/20 rounded-2xl p-6 text-center"
        >
          <p className="text-gray-600 text-sm mb-3">Need help getting started?</p>
          <button className="text-color1 font-bold hover:underline">
            Contact our support team
          </button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
