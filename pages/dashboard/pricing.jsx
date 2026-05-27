import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '../../hooks/useUser';
import DashboardLayout from '../../components/dashboardComponents/dashboardLayout';
import PricingCard from '../../components/dashboardComponents/pricingCard';
import SubscriptionBanner from '../../components/dashboardComponents/subscriptionBanner';
import { getAllPlans } from '../../lib/subscriptionConfig';
import { Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function PricingPage() {
  const router = useRouter();
  const { user, store, loading: userLoading } = useUser();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);

  useEffect(() => {
    if (!userLoading && user && !store) {
      toast('Please set up your store first', {
        icon: '📦',
      });
      router.push('/dashboard/store');
    }
  }, [user, store, userLoading, router]);

  useEffect(() => {
    if (!user?.id || !store?.id) return;

    const fetchSubscription = async () => {
      try {
        setSubscriptionLoading(true);
        const res = await fetch(`/api/subscriptions/status?storeId=${store.id}`);
        const data = await res.json();
        if (data.success) {
          setSubscription(data.subscription);
        }
      } catch (error) {
        console.error('Failed to fetch subscription:', error);
      } finally {
        setSubscriptionLoading(false);
      }
    };

    fetchSubscription();
  }, [user?.id, store?.id]);

  const handleSubscribeClick = async (plan) => {
    if (!user?.id) {
      toast.error('Please log in first');
      return;
    }

    if (!store?.id) {
      toast.error('Please set up your store first');
      router.push('/dashboard/store');
      return;
    }

    setLoading(true);
    setSelectedPlan(plan);

    try {
      const response = await fetch('/api/subscriptions/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType: plan.plan_type,
          storeId: store.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || 'Failed to create payment');
        setLoading(false);
        return;
      }

      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        toast.error('Payment URL not received');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast.error('Failed to initiate payment');
      setLoading(false);
    }
  };

  if (userLoading || subscriptionLoading) {
    return (
        <DashboardLayout>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="w-8 h-8 animate-spin text-color1" />
          </div>
        </DashboardLayout>
    );
  }

  if (!user) {
    return (
        <DashboardLayout>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-color3 mb-2">Please sign in</h2>
            <p className="text-gray-500 mb-6">You need to be logged in to view pricing plans</p>
            <button
                onClick={() => router.push('/auth/login')}
                className="bg-color1 text-white px-6 py-3 rounded-lg font-bold hover:bg-color1/90"
            >
              Sign In
            </button>
          </div>
        </DashboardLayout>
    );
  }

  const plans = getAllPlans();
  const hasActiveSubscription = subscription?.isActive;

  return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto px-4 py-8 w-full">
          <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
          >
            <h1 className="text-3xl font-black text-color3 mb-3">
              Simple, Transparent Pricing
            </h1>
            <p className="text-gray-500 text-md max-w-2xl mx-auto">
              Choose the plan that fits your business needs. All plans include full access to
              dashboard features and marketplace tools.
            </p>
          </motion.div>

          {hasActiveSubscription && (
              <motion.div className="mb-8">
                <SubscriptionBanner subscription={subscription} />
              </motion.div>
          )}

          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12"
          >
            {plans.map((plan, index) => (
                <motion.div
                    key={plan.plan_type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                  <PricingCard
                      plan={plan}
                      isPopular={plan.plan_type === 'one_year'}
                      onSubscribe={handleSubscribeClick}
                      isLoading={loading && selectedPlan?.plan_type === plan.plan_type}
                      isAnyLoading={loading}
                  />
                </motion.div>
            ))}
          </motion.div>

          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-color1/5 to-color2/5 rounded-2xl p-8 border border-gray-100"
          >
            <h3 className="text-2xl font-bold text-color3 mb-6">Frequently Asked Questions</h3>
            <div className="space-y-4">
              {[
                {
                  q: 'Is it a one-time payment or recurring?',
                  a: "All subscriptions are one-time payments. No recurring charges. You'll be notified before your subscription expires.",
                },
                {
                  q: 'What happens after my subscription expires?',
                  a: "Your store will become inactive and you won't be able to manage products, customers, or orders. You can resubscribe anytime.",
                },
                {
                  q: 'Can I upgrade to a longer plan?',
                  a: 'Yes! You can renew with a different plan duration anytime. Your new subscription will start immediately after purchase.',
                },
                {
                  q: 'Is there a money-back guarantee?',
                  a: "Contact support within 7 days if you're not satisfied. We offer a full refund for first-time subscribers.",
                },
              ].map((item, index) => (
                  <details
                      key={index}
                      className="group cursor-pointer"
                  >
                    <summary className="flex items-center justify-between py-3 px-4 bg-white rounded-lg font-bold text-color3 hover:bg-gray-50 transition-colors">
                      {item.q}
                      <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                    </summary>
                    <p className="mt-2 px-4 py-2 text-gray-600 text-sm leading-relaxed">
                      {item.a}
                    </p>
                  </details>
              ))}
            </div>
          </motion.div>
        </div>
      </DashboardLayout>
  );
}