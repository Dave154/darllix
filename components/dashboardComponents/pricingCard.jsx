import { motion } from 'framer-motion';
import { Check, Zap, Loader2 } from 'lucide-react';

export default function PricingCard({ plan, isPopular = false, onSubscribe, isLoading, isAnyLoading }) {
  return (
      <motion.div
          whileHover={{ y: isPopular ? -8 : -4 }}
          className={`relative flex flex-col h-full rounded-2xl overflow-hidden border transition-all ${
              isPopular
                  ? 'border-color1 shadow-2xl ring-2 ring-color1/30 bg-gradient-to-br from-color1/5 to-color2/5'
                  : 'border-gray-200 shadow-lg hover:shadow-xl bg-white'
          }`}
      >
        {/* Popular Badge */}
        {isPopular && (
            <div className="absolute top-4 right-4 bg-gradient-to-r from-color1 to-color2 text-white px-3 py-1 rounded-full text-xs font-bold">
              Popular
            </div>
        )}

        {/* Header */}
        <div className={`px-4 py-8 ${isPopular ? 'bg-gradient-to-r from-color1/10 to-color2/10' : 'bg-gray-50'}`}>
          <h3 className="text-lg font-bold text-color3 mb-2">{plan.name}</h3>
          <p className="text-gray-500 text-xs mb-6">{plan.description}</p>

          {/* Price */}
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-black text-color1">₦{plan.price_naira.toLocaleString()}</span>
          </div>

          {/* Duration */}
          <p className="text-xs text-gray-500 mt-2">
            {plan.duration_days} days of access
          </p>
        </div>

        {/* Subscribe Button */}
        <div className="px-4 py-4">
          <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => onSubscribe(plan)}
              disabled={isAnyLoading}
              className={`w-full py-3 rounded-lg font-bold text-md transition-all flex items-center justify-center gap-2 ${
                  isPopular
                      ? 'bg-gradient-to-r from-color1 to-color2 text-white hover:shadow-lg'
                      : 'bg-color3 text-white hover:bg-black'
              } ${isAnyLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
            ) : (
                'Get Started'
            )}
          </motion.button>
        </div>

        {/* Divider */}
        <div className="px-4">
          <div className="h-px bg-gray-100" />
        </div>

        {/* Features */}
        <div className="flex-1 px-4 py-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
            What's included
          </p>

          <ul className="space-y-3">
            {plan.features && plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-color1 shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-xs leading-relaxed">{feature}</span>
                </li>
            ))}
          </ul>
        </div>

        {/* Footer Badge */}
        {isPopular && (
            <div className="px-4 py-4 bg-gradient-to-r from-color1/5 to-color2/5 border-t border-gray-100">
              <div className="flex items-center gap-2 text-color1 font-semibold text-xs">
                <Zap className="w-4 h-4" />
                Best Value
              </div>
            </div>
        )}
      </motion.div>
  );
}