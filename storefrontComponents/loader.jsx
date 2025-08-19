"use client";

import { motion } from "framer-motion";

export default function Loader() {
  const bounceTransition = {
    y: {
      duration: 1,
      repeat: Infinity,
      ease: "easeInOut",
    },
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center z-50">
      <div className="flex space-x-4 mb-6">
        {/* Ball 1 */}
        <motion.div
          className="w-5 h-5 rounded-full bg-color1"
          animate={{ y: ["0%", "-80%", "0%"] }}
          transition={{ ...bounceTransition, delay: 0 }}
        />
        {/* Ball 2 */}
        <motion.div
          className="w-8 h-8 rounded-full bg-color2"
          animate={{ y: ["0%", "-80%", "0%"] }}
          transition={{ ...bounceTransition, delay: 0.4 }}
        />
        {/* Ball 3 */}
        <motion.div
          className="w-5 h-5 rounded-full bg-color3"
          animate={{ y: ["0%", "-80%", "0%"] }}
          transition={{ ...bounceTransition, delay: 0.8}}
        />
      </div>

      {/* Loading Text */}
      <div className="flex items-center space-x-1 text-white text-lg font-semibold tracking-wide">
        <span>Processing your payment</span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0 }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
        >
          .
        </motion.span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1, delay: 0.6 }}
        >
          .
        </motion.span>
      </div>
    </div>
  );
}
