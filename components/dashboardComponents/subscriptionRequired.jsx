import { motion } from 'framer-motion';
import { Lock, Zap, Calendar } from 'lucide-react';
import { useRouter } from 'next/router';

export default function SubscriptionRequired({ feature = 'This feature' }) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[999] pointer-events-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl p-8 max-w-md shadow-2xl pointer-events-auto"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 bg-color1/20 blur-2xl rounded-full" />
            <Lock className="w-16 h-16 text-color1 relative" />
          </div>
        </div>

        {/* Content */}
        <h2 className="text-2xl font-black text-color3 text-center mb-2">
          Subscription Required
        </h2>
        <p className="text-gray-600 text-center mb-6">
          {feature} is only available for active subscribers.
        </p>

        {/* Features */}
        <div className="space-y-3 mb-8 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-color1 shrink-0" />
            <span className="text-sm text-gray-700">Unlimited product uploads</span>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-color1 shrink-0" />
            <span className="text-sm text-gray-700">1 month, 3 months, or 1 year plans</span>
          </div>
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-color1 shrink-0" />
            <span className="text-sm text-gray-700">Full dashboard & marketplace access</span>
          </div>
        </div>

        {/* CTA */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push('/dashboard/pricing')}
          className="w-full py-3 bg-gradient-to-r from-color1 to-color2 text-white rounded-lg font-bold hover:shadow-lg transition-all"
        >
          View Pricing Plans
        </motion.button>

        {/* Secondary CTA */}
        <button
          onClick={() => router.back()}
          className="w-full mt-3 py-2 bg-gray-100 text-gray-700 rounded-lg font-bold hover:bg-gray-200 transition-colors"
        >
          Go Back
        </button>
      </motion.div>
    </div>
  );
}
