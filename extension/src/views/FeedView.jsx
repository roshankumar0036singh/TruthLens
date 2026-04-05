import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  ArrowUpRight, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Link as LinkIcon,
  Globe
} from 'lucide-react';

const FeedCard = ({ item }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass p-5 rounded-[32px] border border-white/5 relative overflow-hidden group hover:border-lime-400/20 transition-all"
  >
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-2">
         <div className={`h-6 w-6 rounded-lg flex items-center justify-center ${item.assertion === 'TRUE' ? 'bg-lime-400/10 text-lime-400' : 'bg-red-500/10 text-red-500'}`}>
            {item.assertion === 'TRUE' ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
         </div>
         <span className={`text-[8px] font-black uppercase tracking-widest ${item.assertion === 'TRUE' ? 'text-lime-400' : 'text-red-500'}`}>
            ASSERTION :: {item.assertion}
         </span>
      </div>
      {item.tx_hash && (
         <a href={`#`} className="h-6 w-6 glass rounded-lg flex items-center justify-center text-gray-700 hover:text-lime-400 transition-colors">
            <LinkIcon size={12} />
         </a>
      )}
    </div>

    <h3 className="text-sm font-black text-white tracking-tight leading-tight mb-3 line-clamp-2 uppercase">
      {item.text}
    </h3>

    <div className="flex items-center gap-3 mb-4">
      <div className="flex -space-x-2">
         <div className="h-5 w-5 rounded-full border-2 border-black bg-gray-800" />
         <div className="h-5 w-5 rounded-full border-2 border-black bg-gray-700" />
      </div>
      <span className="text-[7px] font-black uppercase tracking-widest text-gray-600">
         Verified by 12 Nodes
      </span>
    </div>

    <div className="flex gap-2">
       <button className="flex-1 h-9 glass rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-lime-400 border border-white/5 hover:border-lime-400/20 transition-all">
          <ThumbsUp size={12} />
          <span className="text-[8px] font-black uppercase">{item.upvotes || 0}</span>
       </button>
       <button className="flex-1 h-9 glass rounded-xl flex items-center justify-center gap-2 text-gray-500 hover:text-red-500 border border-white/5 hover:border-red-500/20 transition-all">
          <ThumbsDown size={12} />
          <span className="text-[8px] font-black uppercase">{item.downvotes || 0}</span>
       </button>
       <a href={item.url} target="_blank" rel="noreferrer" className="w-9 h-9 glass rounded-xl flex items-center justify-center text-gray-500 hover:text-white border border-white/5 transition-all">
          <Globe size={12} />
       </a>
    </div>
  </motion.div>
);

const FeedView = () => {
  const [feed, setFeed] = useState([
    {
      id: 1,
      text: "Market Manipulation detected in decentralized exchange clusters.",
      assertion: "TRUE",
      url: "https://example.com/news1",
      upvotes: 42,
      downvotes: 2
    },
    {
      id: 2,
      text: "Breaking: AI-generated deepfake of political summit circulating globally.",
      assertion: "FAKE",
      url: "https://example.com/news2",
      upvotes: 120,
      downvotes: 5
    }
  ]);

  useEffect(() => {
    // 1. Initial Feed Fetch
    fetch('http://localhost:8000/api/v1/community/feed')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) setFeed(data);
      })
      .catch(err => console.error("Feed error", err));

    // 2. Real-time WebSocket Feed
    const ws = new WebSocket('ws://localhost:8000/api/v1/community/ws-feed');
    ws.onmessage = (event) => {
       const data = JSON.parse(event.data);
       if (data.type === 'NEW_SHARE') {
          setFeed(prev => [data.item, ...prev]);
       }
    };

    return () => ws.close();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black tracking-tighter uppercase">Community <span className="text-lime-400 italic">Feed.</span></h2>
        <Users size={16} className="text-gray-700" />
      </div>

      <div className="flex flex-col gap-5 mb-24">
         {Array.isArray(feed) && feed.map((item, i) => (
            <FeedCard key={i} item={item} />
         ))}
      </div>

      {/* Sharing FAB (logic will be in common component or App) */}
      <div className="fixed bottom-24 right-8 z-50">
         <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="h-14 w-14 bg-lime-400 text-black rounded-full shadow-[0_0_30px_rgba(163,230,53,0.3)] flex items-center justify-center border-4 border-black"
         >
            <ArrowUpRight size={24} strokeWidth={3} />
         </motion.button>
      </div>
    </div>
  );
};

export default FeedView;
