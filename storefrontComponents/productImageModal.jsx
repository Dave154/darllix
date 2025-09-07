// components/ProductImageModal.jsx
"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/router";

export default function ProductImageModal({ images = [], alt = "", id='' }) {
  const imgs = Array.isArray(images) ? images : [];
  const count = imgs.length;
  const [previewIndex, setPreviewIndex] = useState(0); // index for the preview slideshow
  const [isOpen, setIsOpen] = useState(false);
  const [modalIndex, setModalIndex] = useState(0); // index for modal slideshow
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter()
  const autoplayRef = useRef(null);

  // autoplay for preview slideshow (only when preview visible i.e., not open)
  useEffect(() => {
    if (count <= 1) return;

    if (!isHovered && !isOpen) {
      autoplayRef.current = setInterval(() => {
        setPreviewIndex((p) => (p + 1) % count);
      }, 5500);
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [count, isHovered, isOpen]);

  // Sync modal start index with preview index when opening
  useEffect(() => {
    if (isOpen) setModalIndex(previewIndex);
  }, [isOpen, previewIndex]);

  // keyboard nav inside modal
  useEffect(() => {
    function onKey(e) {
      if (!isOpen) return;
      if (e.key === "Escape") setIsOpen(false);
      if (e.key === "ArrowLeft") setModalIndex((i) => (i === 0 ? count - 1 : i - 1));
      if (e.key === "ArrowRight") setModalIndex((i) => (i + 1) % count);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, count]);

  if (!imgs || imgs.length === 0) {
    // fallback single placeholder
    return (
      <div className="rounded-xl overflow-hidden bg-gray-100 w-full h-64 flex items-center justify-center">
        <div className="text-gray-400">No images</div>
      </div>
    );
  }

  const previewUrl = imgs[previewIndex]?.url || "/placeholder.jpg";

  return (
    <>
      <div
        className="relative rounded-xl overflow-hidden group h-full "
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div
          key={previewUrl}
          initial={{ opacity: 0, scale: 1.02 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full h-full"
          onClick={()=> router.push( `/product/${id}`) }
        >
       
          <Image
            src={previewUrl}
            alt={alt || `product image ${previewIndex + 1}`}
            width={1200}
            height={800}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105"
            unoptimized
          />
        </motion.div>

        {/* sleek next button (overlay, right) */}
        {count > 1 && (
          <button
            aria-label="Next image"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewIndex((p) => (p + 1) % count);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/50 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Open modal button (center-bottom) */}
        <button
          onClick={() => setIsOpen(true)}
          className="absolute left-1/2 -translate-x-1/2 bottom-3 z-20 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 text-sm font-medium shadow hover:bg-white"
        >
          <Maximize2 className="w-4 h-4" /> View
        </button>

        {/* pagination dots */}
        {count > 1 && (
          <div className="absolute left-1/2 -translate-x-1/2 top-3 flex gap-2 z-20">
            {imgs.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewIndex(idx);
                }}
                className={`w-2 h-2 rounded-full ${idx === previewIndex ? "bg-white" : "bg-white/40"}`}
                aria-label={`Go to image ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Close */}
            <button
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Prev */}
            {count > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalIndex((i) => (i === 0 ? count - 1 : i - 1));
                }}
                className="absolute left-6 z-30 flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/50 transition"
                aria-label="Previous image"
              > 
                <ChevronLeft size={40} />
              </button>
            )}

            {/* Next */}
            {count > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setModalIndex((i) => (i + 1) % count);
                }}
                className="absolute right-6 z-30 text-white flex items-center justify-center w-11 h-11 rounded-full bg-black/40 backdrop-blur-sm text-white hover:bg-black/50 transition"
                aria-label="Next image"
              >
                <ChevronRight size={40} />
              </button>
            )}

            {/* Main image */}
            <motion.img
              key={imgs[modalIndex]?.url}
              src={imgs[modalIndex]?.url}
              alt={alt || `product image ${modalIndex + 1}`}
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-xl"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28 }}
            />

            {/* thumbnails strip */}
            {count > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex gap-2 overflow-auto px-2">
                {imgs.map((it, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setModalIndex(idx);
                    }}
                    className={`relative rounded-md overflow-hidden border ${idx === modalIndex ? "ring-2 ring-sky-500" : "border-transparent"} `}
                    style={{ width: 72, height: 56 }}
                    aria-label={`Thumbnail ${idx + 1}`}
                  >
                    <img src={it.url} alt={`thumb-${idx}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
