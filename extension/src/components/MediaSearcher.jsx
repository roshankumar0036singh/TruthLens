import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, CheckCircle, XCircle, RefreshCw, UploadCloud } from 'lucide-react';

const MediaSearcher = ({ onImageSelect }) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFile = useCallback((file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result;
      setPreview(base64);
      onImageSelect(base64);
    };
    reader.readAsDataURL(file);
  }, [onImageSelect]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    onImageSelect(null);
  };

  return (
    <div className="space-y-4">
      {!preview ? (
        <motion.div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative h-40 glass rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 cursor-pointer group ${
            dragActive ? 'border-lime-400 bg-lime-400/5' : 'border-white/10 hover:border-lime-400/50'
          }`}
          onClick={() => document.getElementById('media-upload').click()}
        >
          <input 
            id="media-upload"
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={handleChange}
          />
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-lime-400 group-hover:text-black transition-all">
            <UploadCloud size={20} />
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Forensic Dropzone</p>
            <p className="text-[8px] font-bold text-gray-600 uppercase tracking-widest">Deepfake & Manipulation Scan</p>
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative rounded-3xl overflow-hidden glass border border-white/10 aspect-video group"
        >
          <img src={preview} alt="Forensic Preview" className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
          
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                   <div className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-lime-400">Media Loaded :: Awaiting Swarm Execution</span>
                </div>
                <button 
                  onClick={clearPreview}
                  className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                >
                  Remove
                </button>
             </div>
          </div>
          
          {/* Scanning Animation */}
          <motion.div 
            animate={{ top: ['0%', '100%', '0%'] }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="absolute left-0 right-0 h-px bg-lime-400 shadow-[0_0_10px_#a3e635] z-10"
          />
        </motion.div>
      )}
    </div>
  );
};

export default MediaSearcher;
