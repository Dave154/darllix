import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import Image from "next/image";

export default function ProductImageModal({ imageUrl, alt }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Product Image (click to open modal) */}
      <div
        className="cursor-pointer overflow-hidden rounded-xl group h-full"
        onClick={() => setIsOpen(true)}
      >
        <Image
          src={ '/placeholder.jpg'}
          alt={alt || ''}
          width={1000}
          height={1000}
          className="w-full  object-cover rounded  h-full transition-transform duration-300 group-hover:scale-105"
          unoptimized
        />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <X size={32} />
            </button>

            {/* Image container */}
            <motion.img
              src={imageUrl}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-xl"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
