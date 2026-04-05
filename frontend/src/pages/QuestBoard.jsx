import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Search, 
  ExternalLink, 
  MessageSquare, 
  Hexagon, 
  Plus, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  Zap,
  Clock,
  Coins,
  Cpu
} from 'lucide-react';
import { Link } from 'react-router-dom';

const QuestCard = ({ quest, onSelect }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-[32px] p-8 flex flex-col gap-6 cursor-pointer hover:border-lime-400/20 transition-all group"
    onClick={() => onSelect(quest)}
  >
    <div className="flex justify-between items-start">
      <div className="h-12 w-12 rounded-2xl bg-lime-400/10 flex items-center justify-center text-lime-400">
        <Trophy size={20} strokeWidth={2.5} />
      </div>
      <div className="text-right">
        <span className="text-[9px] font-black uppercase tracking-widest text-gray-700 block mb-1">Quest Bounty</span>
        <span className="text-xl font-black text-white">{quest.bounty} SHM</span>
      </div>
    </div>

    <div>
      <h3 className="text-xl font-black text-white mb-2 leading-tight tracking-tight uppercase group-hover:text-lime-400 transition-colors">
        {quest.claim.length > 60 ? quest.claim.substring(0, 60) + '...' : quest.claim}
      </h3>
      <p className="text-[10px] font-medium text-gray-500 uppercase tracking-widest leading-loose">
        {quest.context}
      </p>
    </div>

    <div className="flex items-center gap-6 pt-6 border-t border-white/5">
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">Evidence Units</span>
        <span className="text-xs font-bold text-white">{quest.evidenceCount} Submissions</span>
      </div>
      <div className="flex flex-col gap-1 border-l border-white/10 pl-6">
        <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">Trust Threshold</span>
        <span className="text-xs font-bold text-lime-400">DAO_REQUIRED</span>
      </div>
    </div>
  </motion.div>
);

const QuestBoard = () => {
  const [quests, setQuests] = useState([]);
  const [selectedQuest, setSelectedQuest] = useState(null);
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceDesc, setEvidenceDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // MOCK DATA: In production, fetch from TruthQuests smart contract via backend agent
  useEffect(() => {
    setQuests([
      {
        id: '0x1...',
        claim: "Deepfake video of global leader discussing secret treaty.",
        context: "AI ensemble confidence: 52%. Forensics detected inconsistent spatial lighting but semantic RAG index is empty.",
        bounty: 0.5,
        evidenceCount: 12
      },
      {
        id: '0x2...',
        claim: "Viral news about major bank collapse in 24 hours.",
        context: "SentimentBias detected aggressive manipulation. CitationFinder found no primary sources. Reputational risk high.",
        bounty: 1.2,
        evidenceCount: 3
      },
      {
        id: '0x3...',
        claim: "Leaked audio of multi-national corporation whistleblower.",
        context: "Audio spectral analysis shows possible synthetic stitching (68% risk). Human ear confirmation required.",
        bounty: 0.8,
        evidenceCount: 0
      }
    ]);
  }, []);

  const handleSubmitEvidence = async () => {
    setSubmitting(true);
    // Simulate smart contract submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSubmitting(false);
    setSelectedQuest(null);
    setEvidenceUrl('');
    setEvidenceDesc('');
    alert("Evidence submitted to Shardeum! Awaiting DAO verification.");
  };

  return (
    <div className="min-h-screen w-screen bg-black text-white relative overflow-x-hidden">
      
      {/* 🔮 BACKGROUND GRADIENTS */}
      <div className="fixed top-0 right-0 w-[800px] h-[800px] bg-lime-400/5 blur-[150px] rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="fixed bottom-0 left-0 w-[600px] h-[600px] bg-lime-400/3 blur-[120px] rounded-full translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      {/* 🧭 NAVIGATION HEADER */}
      <nav className="h-28 border-b border-white/5 flex items-center justify-between px-12 relative z-10 backdrop-blur-md bg-black/40">
        <div className="flex items-center gap-12">
          <Link to="/dashboard" className="flex items-center gap-3 text-gray-500 hover:text-white transition-colors group">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return to Nexus</span>
          </Link>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="text-lime-400" size={24} strokeWidth={2.5} />
            <span className="text-lg font-black tracking-tighter uppercase">Quest Board</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="h-10 px-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center gap-3">
             <Coins className="text-lime-400" size={14} />
             <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Wallet: 142.5 SHM</span>
          </div>
        </div>
      </nav>

      {/* 🚀 MAIN CONTENT */}
      <main className="max-w-[1440px] mx-auto py-20 px-12 relative z-10">
        
        <header className="mb-20">
          <div className="flex items-center gap-3 text-lime-400 mb-6">
            <Hexagon size={16} fill="currentColor" fillOpacity={0.2} />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Truth-to-Earn Protocol v1.0</span>
          </div>
          <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none mb-4">
            Verify. <span className="text-lime-400">Anchor.</span> Earn.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl font-medium tracking-tight">
            The AI ensemble is uncertain on these claims. Provide verified evidence, links, or forensics to resolve the quest and claim the native SHM bounty.
          </p>
        </header>

        {/* 📊 STATS OVERVIEW */}
        <div className="grid grid-cols-4 gap-6 mb-20">
          {[
            { label: 'Active Quests', value: quests.length, icon: Zap },
            { label: 'Total Bounties', value: '4.2 SHM', icon: Coins },
            { label: 'Verified Humans', value: '1.4k', icon: Hexagon },
            { label: 'System Triage', value: 'OPTIMAL', icon: Cpu }
          ].map((stat, i) => (
            <div key={i} className="p-8 rounded-[32px] bg-white/[0.01] border border-white/5 flex flex-col gap-4">
               <div className="flex justify-between items-center">
                  <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">{stat.label}</span>
                  <stat.icon size={14} className="text-gray-800" />
               </div>
               <span className="text-3xl font-black text-white uppercase tracking-tighter">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* 📋 QUEST GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {quests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} onSelect={setSelectedQuest} />
          ))}
        </div>
      </main>

      {/* 📂 SUBMISSION MODAL */}
      <AnimatePresence>
        {selectedQuest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedQuest(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-2xl bg-zinc-950 border border-white/10 rounded-[48px] p-12 relative z-10 shadow-2xl overflow-hidden"
            >
              {/* Decorative light flare */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-[1.5px] bg-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.5)]" />

              <div className="flex justify-between items-start mb-10">
                <div>
                  <span className="text-[10px] font-black text-lime-400 uppercase tracking-[0.2em] mb-3 block">Submit Verification Evidence</span>
                  <h2 className="text-3xl font-black text-white tracking-tighter uppercase leading-none truncate max-w-md">
                    {selectedQuest.claim}
                  </h2>
                </div>
                <div className="text-right">
                  <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest block mb-1">Quest Reward</span>
                  <span className="text-xl font-black text-white">{selectedQuest.bounty} SHM</span>
                </div>
              </div>

              <div className="space-y-8">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Evidence Source URL</label>
                  <input 
                    type="text" 
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="https://ipfs.io/ipfs/Qm..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold focus:outline-none focus:border-lime-400/30 transition-all placeholder:text-gray-800"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Empirical Description</label>
                  <textarea 
                    rows="4"
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                    placeholder="Explain how this evidence debunks or verifies the claim..."
                    className="w-full bg-white/[0.03] border border-white/5 rounded-2xl py-5 px-8 text-sm font-bold focus:outline-none focus:border-lime-400/30 transition-all placeholder:text-gray-800 resize-none"
                  />
                </div>

                <div className="pt-6">
                  <button 
                    onClick={handleSubmitEvidence}
                    disabled={submitting || !evidenceUrl}
                    className="w-full h-16 bg-white text-black hover:bg-lime-400 transition-all rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-white"
                  >
                    {submitting ? (
                      <RefreshCw className="animate-spin" size={16} />
                    ) : (
                      <>Anchor Evidence to Blockchain <Plus size={16} strokeWidth={3} /></>
                    )}
                  </button>
                  <p className="text-center mt-6 text-[8px] font-black text-gray-700 uppercase tracking-widest">
                    Verification Protocol: Your evidence will be analyzed by the TruthDAO.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default QuestBoard;
