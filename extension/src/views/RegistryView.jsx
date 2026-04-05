import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  CheckCircle, 
  RefreshCw, 
  Activity, 
  Trophy, 
  Layers,
  Terminal,
  Zap
} from 'lucide-react';

const AgentCard = ({ name, type, lat, status = "ONLINE" }) => (
  <div className="glass p-5 rounded-[28px] border border-white/[0.03] flex items-center justify-between group hover:border-lime-400/20 transition-all">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 glass rounded-xl flex items-center justify-center text-gray-500 group-hover:text-lime-400 transition-colors relative">
        <Cpu size={18} />
        {status === "ONLINE" && (
           <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,1)]" />
        )}
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-lime-400 mb-0.5">{name}</h4>
        <div className="flex items-center gap-1.5">
           <Terminal size={8} className="text-gray-700" />
           <span className="text-[8px] font-black text-gray-600 uppercase tracking-widest">{type} Subsystem</span>
        </div>
      </div>
    </div>
    <div className="flex flex-col items-end">
       <span className="text-[8px] font-black text-gray-800 uppercase tracking-widest">Latency</span>
       <span className="text-xs font-black text-white">{lat}ms</span>
    </div>
  </div>
);

const RegistryView = () => {
  const agents = [
    { name: "Mistral-7B", type: "Logic", lat: 142 },
    { name: "Gemini-3-Pro", type: "Vision", lat: 2150 },
    { name: "Llama-3-Surgical", type: "Forensics", lat: 450 },
    { name: "TruthGraph-RAG", type: "Context", lat: 89 }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black tracking-tighter uppercase">Swarm <span className="text-lime-400 italic">Nodes.</span></h2>
        <Layers size={16} className="text-gray-700" />
      </div>

      <div className="glass p-6 rounded-[32px] border border-white/5 flex items-center justify-between mb-2">
         <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-full border border-lime-400/20 flex items-center justify-center text-lime-400 bg-lime-400/5">
                <Trophy size={20} strokeWidth={2.5} />
            </div>
            <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">Your Operator Rank</span>
                <p className="text-sm font-black text-white tracking-widest uppercase mb-0.5">Silver <span className="text-lime-400">Fact-Checker</span></p>
                <div className="flex items-center gap-2">
                   <Zap size={10} className="text-gray-700" />
                   <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">Reputation: 1,420</span>
                </div>
            </div>
         </div>
      </div>

      <div className="flex flex-col gap-4 mb-20">
        <div className="flex items-center gap-2 px-1">
           <Activity size={10} className="text-lime-400" />
           <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Live Agent Registry</span>
        </div>
        {agents.map((a, i) => <AgentCard key={i} {...a} />)}
      </div>
    </div>
  );
};

export default RegistryView;
