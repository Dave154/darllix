import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Image as ImageIcon, Film, X, Loader2 } from 'lucide-react';
import { useStore } from '@/store';
import { toast } from 'sonner';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SellTab() {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const store = useStore((s) => s.store);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('marketplace_categories')
        .select('id, name')
        .order('name');
        
      if (data) setCategories(data);
    };
    
    fetchCategories();
  }, [supabase]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) handleFile(e.target.files[0]);
  };

  const handleFile = (file) => {
    const url = URL.createObjectURL(file);
    setPreview({ url, type: file.type.includes('video') ? 'video' : 'image' });
  };

  const clearFile = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePublish = async () => {
    if (!preview || !title || !price || !categoryId) {
      toast.error("Please add media, a title, a price, and select a category.");
      return;
    }
    if (!store?.id) {
      toast.error("Store not found. Please set up your store first.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    
    const file = fileInputRef.current.files[0];
    formData.append('file', file);
    formData.append('title', title);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('storeId', store.id);
    formData.append('categoryId', categoryId);

    try {
      const res = await fetch('/api/marketplace/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      toast.success("Post published successfully!");
      
      clearFile();
      setTitle('');
      setPrice('');
      setDescription('');
      setCategoryId('');
      
      router.push({
        pathname: router.pathname,
        query: { tab: 'discover' }
      }, undefined, { shallow: true });
      
    } catch (error) {
      toast.error(error.message || "Failed to upload post.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full h-full bg-color4 flex flex-col pt-8 pb-32 px-4 overflow-y-auto scrollbar-thin">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 max-w-md w-full mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-color3 tracking-tight">New Post</h1>
          <p className="text-gray-500 text-sm mt-1">Get discovered in under 30 seconds.</p>
        </div>

        <div 
          className={`relative w-full aspect-[4/5] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer bg-white ${dragActive ? 'border-color1 bg-color1/5' : 'border-gray-300 hover:border-gray-400'}`}
          onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} onClick={() => !preview && fileInputRef.current?.click()}
        >
          <input 
            ref={fileInputRef} 
            type="file" 
            accept="image/jpeg,image/png,image/webp,video/mp4" 
            onChange={handleChange} 
            className="hidden" 
          />

          <AnimatePresence>
            {preview ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 w-full h-full group">
                {preview.type === 'video' ? (
                  <video src={preview.url} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <img src={preview.url} alt="Preview" className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => { e.stopPropagation(); clearFile(); }} className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg">
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-4 pointer-events-none p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center shadow-inner border border-gray-100">
                  <UploadCloud className="w-8 h-8 text-color1" />
                </div>
                <div>
                  <p className="text-color3 font-semibold">Tap or drop media</p>
                  <div className="flex items-center justify-center gap-3 mt-2 text-gray-400 text-xs font-medium">
                    <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> 5MB Max</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300" />
                    <span className="flex items-center gap-1"><Film className="w-3 h-3" /> 30s / 20MB</span>
                  </div>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-col gap-4">
          <input 
            type="text" 
            placeholder="Product Title" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-color3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-color1/50 transition-all font-medium shadow-sm" 
          />
          
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-lg">₦</span>
            <input 
              type="number" 
              placeholder="0.00" 
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-4 text-color3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-color1/50 transition-all font-bold text-lg shadow-sm" 
            />
          </div>

          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-color3 focus:outline-none focus:ring-2 focus:ring-color1/50 transition-all font-medium shadow-sm appearance-none"
            required
          >
            <option value="" disabled>Select a category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <textarea 
            placeholder="Short description..." 
            rows="3" 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-4 text-color3 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-color1/50 transition-all resize-none text-sm shadow-sm" 
          />
        </div>

        <motion.button 
          whileTap={{ scale: 0.98 }} 
          onClick={handlePublish}
          disabled={isUploading}
          className="w-full bg-color1 hover:bg-color1/90 disabled:bg-color1/50 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(74,33,239,0.3)] disabled:shadow-none transition-all flex items-center justify-center gap-2 mt-2"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Publishing...
            </>
          ) : (
            <>
              <UploadCloud className="w-5 h-5" /> Publish Post
            </>
          )}
        </motion.button>
      </motion.div>
    </div>
  );
}