import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  Activity, 
  ToggleLeft, 
  ToggleRight,
  Database,
  Key,
  Layers
} from 'lucide-react';

const SettingItem = ({ icon: Icon, title, desc, enabled, onToggle }) => (
  <div className="glass p-5 rounded-[28px] border border-white/[0.03] flex items-center justify-between group hover:border-lime-400/20 transition-all">
    <div className="flex items-center gap-4">
      <div className="h-10 w-10 glass rounded-xl flex items-center justify-center text-gray-500 group-hover:text-lime-400 transition-colors">
        <Icon size={18} />
      </div>
      <div>
        <h4 className="text-[10px] font-black uppercase tracking-widest text-white mb-0.5">{title}</h4>
        <p className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">{desc}</p>
      </div>
    </div>
    <button onClick={onToggle} className="text-gray-500 hover:text-lime-400 transition-colors">
       {enabled ? <ToggleRight size={24} className="text-lime-400" /> : <ToggleLeft size={24} />}
    </button>
  </div>
);

const SettingsView = () => {
  const [autoPilot, setAutoPilot] = useState(false);
  const [neonMode, setNeonMode] = useState(true);
  const [highPerformance, setHighPerformance] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black tracking-tighter uppercase">Extension <span className="text-lime-400 italic">Config.</span></h2>
        <SettingsIcon size={16} className="text-gray-700" />
      </div>

      <div className="flex flex-col gap-4">
        {/* On-Chain Reputation Card */}
        <div className="glass p-6 rounded-[32px] border border-lime-400/30 bg-lime-400/5 relative overflow-hidden group">
           <div className="absolute -right-4 -top-4 text-lime-400/10 group-hover:rotate-12 transition-transform duration-700">
              <ShieldCheck size={100} />
           </div>
           <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                 <ShieldCheck size={14} className="text-lime-400" />
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-lime-400">On-Chain Identity Sync</span>
              </div>
              <p className="text-[8px] font-black text-gray-700 uppercase tracking-widest mb-1">Reputation Rank</p>
              <h3 className="text-3xl font-black italic tracking-tighter mb-4 uppercase">Senior <span className="text-lime-400">Guardian.</span></h3>
              
              <div className="flex items-center gap-6 border-t border-white/5 pt-4">
                 <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-800 uppercase tracking-widest">SBT ID</span>
                    <span className="text-[10px] font-black text-white font-mono">0xbc52...Df</span>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[7px] font-black text-gray-800 uppercase tracking-widest">Governance Power</span>
                    <span className="text-[10px] font-black text-lime-400">1,240 VT</span>
                 </div>
              </div>
           </div>
        </div>

        <SettingItem 
          icon={Zap} 
          title="Auto-Pilot Mode" 
          desc="Automatic background verification" 
          enabled={autoPilot}
          onToggle={() => setAutoPilot(!autoPilot)}
        />
        <SettingItem 
          icon={Activity} 
          title="Neon Surgical Theme" 
          desc="Enable premium visual effects" 
          enabled={neonMode}
          onToggle={() => setNeonMode(!neonMode)}
        />
        <SettingItem 
          icon={Layers} 
          title="High Performance" 
          desc="Execute parallel swarm waves" 
          enabled={highPerformance}
          onToggle={() => setHighPerformance(!highPerformance)}
        />
      </div>

      <div className="glass p-6 rounded-[32px] border border-white/5 mt-2">
         <div className="flex items-center gap-2 mb-6">
            <Key size={14} className="text-gray-700" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-700">Security & Storage</span>
         </div>
         
         <div className="space-y-6">
            <div className="flex justify-between items-center px-1">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Local Buffer Cache</span>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">4.2 MB Cached</span>
               </div>
               <button className="text-[8px] font-black bg-white/5 hover:bg-red-500/10 text-gray-500 hover:text-red-500 px-3 py-1.5 rounded-lg border border-white/5 transition-all">
                  Purge Logs
               </button>
            </div>

            <div className="flex justify-between items-center px-1">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Sync Protocol</span>
                  <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest flex items-center gap-2">
                     <Database size={8} /> Node Synced
                  </span>
               </div>
               <button className="text-[8px] font-black bg-lime-400 text-black px-3 py-1.5 rounded-lg transition-all">
                  Export
               </button>
            </div>
         </div>
      </div>

      <div className="mt-4 px-2">
         <p className="text-[7px] font-black text-gray-800 uppercase tracking-[0.4em] text-center leading-relaxed">
            TruthLens Browser Extension v1.0.4<br/>
            Neural Node Identity: 0x4f2..e91
         </p>
      </div>
    </div>
  );
};

export default SettingsView;
