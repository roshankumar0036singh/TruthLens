import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History as HistoryIcon, 
  ChevronRight, 
  ThumbsUp, 
  ThumbsDown, 
  Calendar,
  AlertCircle
} from 'lucide-react';

const HistoryItem = ({ item }) => (
  <motion.div 
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    className="glass p-5 rounded-[24px] border border-white/[0.03] hover:border-lime-400/20 transition-all group"
  >
    <div className="flex justify-between items-start mb-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Calendar size={10} className="text-gray-600" />
          <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">{item.timestamp}</span>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest ${item.verdict === 'VERIFIED' ? 'text-lime-400' : 'text-red-500'}`}>
          {item.verdict}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
           <ThumbsUp size={12} className="text-lime-400/50" /> {item.upvotes}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-500">
           <ThumbsDown size={12} className="text-red-500/50" /> {item.downvotes}
        </div>
      </div>
    </div>
    
    <p className="text-xs font-bold text-gray-300 line-clamp-2 mb-4 leading-tight">
      {item.text}
    </p>

    <div className="flex items-center justify-between border-t border-white/5 pt-3">
       <div className="flex flex-col">
          <span className="text-[7px] font-black text-gray-800 uppercase tracking-widest">Confidence</span>
          <span className="text-xs font-black text-white">{(item.confidence * 100).toFixed(1)}%</span>
       </div>
       <button className="h-8 w-8 rounded-full glass flex items-center justify-center text-gray-500 hover:text-lime-400 transition-colors">
          <ChevronRight size={14} />
       </button>
    </div>
  </motion.div>
);

const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/verdicts');
        const data = await response.json();
        if (Array.isArray(data)) setHistory(data);
      } catch (e) {
        console.error("Failed to fetch history", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black tracking-tighter uppercase">Community <span className="text-lime-400 italic">Logs.</span></h2>
        <HistoryIcon size={16} className="text-gray-700" />
      </div>

      {loading ? (
        <div className="flex flex-col gap-4">
           {[1,2,3].map(i => <div key={i} className="h-32 w-full animate-pulse bg-white/5 rounded-[24px]" />)}
        </div>
      ) : history.length === 0 ? (
        <div className="glass p-10 rounded-[32px] flex flex-col items-center justify-center gap-4 text-center">
            <AlertCircle size={32} className="text-gray-800" />
            <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">No synchronization detected in the local node history.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 mb-20">
          {Array.isArray(history) && history.map(item => <HistoryItem key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
};

export default HistoryView;
