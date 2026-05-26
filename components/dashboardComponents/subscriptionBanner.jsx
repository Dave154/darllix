import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useState } from 'react';

export default function SubscriptionBanner({ subscription, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !subscription || !subscription.isActive) {
    return null;
  }

  const daysRemaining = subscription.daysRemaining;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`relative overflow-hidden rounded-lg border px-4 py-3.5 flex items-start gap-3 ${
          isExpiringSoon
            ? 'border-orange-200 bg-gradient-to-r from-orange-50 to-orange-100/50'
            : 'border-green-200 bg-gradient-to-r from-green-50 to-emerald-100/50'
        }`}
      >
        {/* Gradient background */}
        <div
          className={`absolute inset-0 opacity-30 ${
            isExpiringSoon ? 'bg-orange-100' : 'bg-green-100'
          }`}
          style={{
            backgroundImage: `radial-gradient(circle at top right, currentColor, transparent 70%)`,
          }}
        />

        {/* Icon */}
        <div className="relative pt-1 shrink-0">
          {isExpiringSoon ? (
            <AlertCircle className="w-5 h-5 text-orange-600" />
          ) : (
            <CheckCircle className="w-5 h-5 text-green-600" />
          )}
        </div>

        {/* Content */}
        <div className="relative flex-1 min-w-0">
          {isExpiringSoon ? (
            <>
              <p className="font-bold text-orange-900 text-sm">
                Your subscription expires soon
              </p>
              <p className="text-orange-800/80 text-xs mt-0.5">
                You have <span className="font-bold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span> left. Renew to maintain access to all features.
              </p>
            </>
          ) : (
            <>
              <p className="font-bold text-green-900 text-sm">
                Subscription Active
              </p>
              <p className="text-green-800/80 text-xs mt-0.5">
                <span className="font-bold">{daysRemaining} day{daysRemaining !== 1 ? 's' : ''}</span> remaining • Expires{' '}
                {new Date(subscription.endDate).toLocaleDateString('en-NG', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </>
          )}
        </div>

        {/* Action Button (optional) */}
        {isExpiringSoon && (
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="/dashboard/pricing"
            className="relative shrink-0 px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded transition-colors"
          >
            Renew
          </motion.a>
        )}

        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleDismiss}
          className="relative shrink-0 p-1 hover:bg-black/5 rounded transition-colors"
        >
          <X className="w-4 h-4 text-gray-500" />
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
