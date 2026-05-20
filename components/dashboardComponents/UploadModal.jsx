import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, ArrowLeft, Loader2, Image as ImageIcon, Film } from 'lucide-react';
import { useStore } from '@/store';
import { toast } from 'sonner';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UploadModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState(1); 
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const store = useStore((s) => s.store);
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    if (isOpen) {
      const fetchCategories = async () => {
        const { data } = await supabase.from('marketplace_categories').select('id, name').order('name');
        if (data) setCategories(data);
      };
      fetchCategories();
    } else {
      setStep(1);
      setPreview(null);
      setFile(null);
      setTitle('');
      setPrice('');
      setDescription('');
      setCategoryId('');
    }
  }, [isOpen, supabase]);

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

  const handleFile = (selectedFile) => {
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreview({ url, type: selectedFile.type.includes('video') ? 'video' : 'image' });
    setStep(2); 
  };

  const handlePublish = async () => {
    if (!file || !title || !price || !categoryId) {
      toast.error("Please fill in all required fields (Title, Price, Category).");
      return;
    }
    if (!store?.id) {
      toast.error("Store not found. Please set up your store first.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('price', price);
    formData.append('description', description);
    formData.append('storeId', store.id);
    formData.append('categoryId', categoryId);

    try {
      const res = await fetch('/api/marketplace/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success("Post published successfully!");
      if (onSuccess) onSuccess(data.post);
      onClose();
    } catch (error) {
      toast.error(error.message || "Failed to upload post.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#262626] rounded-xl flex flex-col overflow-hidden text-white shadow-2xl w-full max-w-4xl max-h-[90vh]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 font-semibold shrink-0">
          {step === 2 ? (
            <button 
              onClick={() => setStep(1)} 
              disabled={isUploading}
              className="p-1 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
          ) : (
            <div className="w-8" /> 
          )}
          <span className="text-base">Create new post</span>
          {step === 2 ? (
            <button 
              onClick={handlePublish}
              disabled={isUploading}
              className="text-blue-500 hover:text-white transition-colors disabled:opacity-50 text-sm font-bold"
            >
              {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Share'}
            </button>
          ) : (
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-6 h-6" />
            </button>
          )}
        </div>

        <div className="flex flex-col flex-1 min-h-[500px] md:h-[600px] overflow-y-auto md:overflow-hidden relative">
          
          {/* OVERLAY WHEN UPLOADING */}
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center pointer-events-auto">
              <Loader2 className="w-10 h-10 text-white animate-spin mb-4" />
            </div>
          )}

          {step === 1 ? (
            <div 
              className={`flex-1 flex flex-col items-center justify-center p-8 transition-colors ${dragActive ? 'bg-white/5' : ''}`}
              onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            >
              <UploadCloud className={`w-24 h-24 mb-6 ${dragActive ? 'text-blue-500' : 'text-gray-400'}`} />
              <h2 className="text-xl font-light mb-6 text-center text-color4">Upload photos and videos here</h2>
              <input ref={fileInputRef} type="file" accept="image/*,video/mp4" onChange={handleChange} className="hidden" />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Select from files
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row w-full md:h-full pointer-events-auto">
              <div className="w-full md:w-[60%] bg-black flex items-center justify-center h-[300px] md:h-full border-b md:border-b-0 md:border-r border-gray-700 relative shrink-0">
                {preview?.type === 'video' ? (
                  <video src={preview.url} className="w-full h-full object-contain" autoPlay muted loop playsInline />
                ) : (
                  <img src={preview?.url} className="w-full h-full object-contain" alt="Preview" />
                )}
              </div>

              <div className="w-full md:w-[40%] flex flex-col bg-[#262626] md:overflow-y-auto custom-scrollbar">
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-color1 to-color2 flex items-center justify-center text-xs font-bold shrink-0">
                      {store?.name?.charAt(0) || "V"}
                    </div>
                    <span className="font-semibold text-sm truncate">{store?.subdomain || "your_store"}</span>
                  </div>

                  <input 
                    type="text" 
                    placeholder="Product Title..." 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    disabled={isUploading}
                    className="w-full bg-transparent border-b border-gray-700 px-2 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                  />
                  
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">₦</span>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      disabled={isUploading}
                      className="w-full bg-transparent border-b border-gray-700 pl-6 pr-2 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
                    />
                  </div>

                  <Select value={categoryId} onValueChange={setCategoryId} disabled={isUploading}>
                    <SelectTrigger className="w-full bg-transparent border-x-0 border-t-0 border-b border-gray-700 rounded-none px-2 py-3 h-auto text-white focus:ring-0 focus:ring-offset-0 focus:border-blue-500 transition-colors shadow-none text-base disabled:opacity-50">
                      <SelectValue placeholder="Select a category..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#262626] border-gray-700 text-white z-[1000000]">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="focus:bg-white/10 focus:text-white cursor-pointer">
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <textarea 
                    placeholder="Write a caption..." 
                    rows="6" 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={isUploading}
                    className="w-full bg-transparent border-none px-2 py-3 text-white placeholder:text-gray-500 focus:outline-none resize-none text-sm disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}


