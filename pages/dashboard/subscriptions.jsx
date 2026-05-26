import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../hooks/useUser';
import DashboardLayout from '../../components/dashboardComponents/dashboardLayout';
import { Calendar, DollarSign, RefreshCw, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function SubscriptionsPage() {
  const router = useRouter();
  const { user, store } = useUser();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id || !store?.id) return;

    const fetchSubscriptions = async () => {
      try {
        const res = await fetch(`/api/subscriptions/list?storeId=${store.id}&limit=100`);
        const data = await res.json();
        if (data.success) {
          setSubscriptions(data.subscriptions);
        }
      } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
        toast.error('Failed to load subscriptions');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
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

  const currentSubscription = subscriptions.find((sub) => sub.isActive);
  const pastSubscriptions = subscriptions.filter((sub) => !sub.isActive);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black text-color3 mb-2">Subscriptions</h1>
          <p className="text-gray-500">Manage your subscription plans and view history</p>
        </motion.div>

        {/* Current Active Subscription */}
        {currentSubscription ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-green-900">Active Subscription</h2>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-6 mb-6">
              {/* Plan */}
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">
                  Plan
                </p>
                <p className="text-2xl font-bold text-green-900">{currentSubscription.plan}</p>
              </div>

              {/* Amount */}
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">
                  Amount Paid
                </p>
                <p className="text-2xl font-bold text-green-900">
                  ₦{currentSubscription.amountPaid?.toLocaleString() || 0}
                </p>
              </div>

              {/* Days Remaining */}
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">
                  Days Remaining
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {currentSubscription.daysRemaining}
                </p>
              </div>

              {/* Expires */}
              <div>
                <p className="text-xs text-green-600 font-bold uppercase tracking-wide mb-1">
                  Expires On
                </p>
                <p className="text-xl font-bold text-green-900">
                  {new Date(currentSubscription.endDate).toLocaleDateString('en-NG', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard/pricing')}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Renew Subscription
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard/pricing')}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-green-600 text-green-600 rounded-lg font-bold hover:bg-green-50 transition-colors"
              >
                Upgrade Plan
              </motion.button>
            </div>

            {/* Reference */}
            <div className="mt-6 pt-6 border-t border-green-200">
              <p className="text-xs text-green-600 font-bold mb-1">Payment Reference</p>
              <p className="font-mono text-sm text-green-900 break-all">
                {currentSubscription.paymentReference}
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-orange-50 border border-orange-200 rounded-2xl p-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <h2 className="text-2xl font-bold text-orange-900">No Active Subscription</h2>
            </div>
            <p className="text-orange-800 mb-4">
              Your subscription has expired. Features are limited until you renew.
            </p>
            <button
              onClick={() => router.push('/dashboard/pricing')}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition-colors"
            >
              View Pricing Plans
            </button>
          </motion.div>
        )}

        {/* Past Subscriptions */}
        {pastSubscriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-color3 mb-4">Subscription History</h2>

            <div className="space-y-3">
              <AnimatePresence>
                {pastSubscriptions.map((sub, index) => (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-bold text-color3">{sub.plan}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ₦{sub.amountPaid?.toLocaleString() || 0}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(sub.endDate).toLocaleDateString('en-NG', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-400 uppercase">Status</p>
                        <p className="text-sm font-bold text-gray-600">Expired</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {subscriptions.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200"
          >
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-color3 mb-2">No Subscriptions Yet</h3>
            <p className="text-gray-500 mb-6">
              Get started by subscribing to a plan to unlock all features
            </p>
            <button
              onClick={() => router.push('/dashboard/pricing')}
              className="px-6 py-3 bg-color1 text-white rounded-lg font-bold hover:bg-color1/90 transition-colors"
            >
              View Pricing Plans
            </button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
