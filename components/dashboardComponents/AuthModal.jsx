import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn } from 'lucide-react';
import { useRouter } from 'next/router';

export default function AuthModal({ isOpen, onClose, action = 'action', returnUrl = '/marketplace' }) {
  const router = useRouter();

  const handleLogin = () => {
    // Redirect to login with returnUrl parameter
    router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  const handleSignup = () => {
    // Redirect to signup with returnUrl parameter
    router.push(`/auth/signup?returnUrl=${encodeURIComponent(returnUrl)}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 z-[101]"
        >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-color3">Sign in required</h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              You need to be signed in to {action}. Create an account or log in to continue.
            </p>

            <div className="space-y-3">
              <button
                onClick={handleLogin}
                className="w-full py-3 bg-color1 text-white font-semibold rounded-lg hover:bg-color1/90 transition-colors flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" />
                Log In
              </button>

              <button
                onClick={handleSignup}
                className="w-full py-3 bg-color2 text-white font-semibold rounded-lg hover:bg-color2/90 transition-colors"
              >
                Create Account
              </button>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              We'll redirect you back after you sign in.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
