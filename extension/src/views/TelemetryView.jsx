import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
  Activity, 
  Globe, 
  Cpu, 
  Layers, 
  TrendingUp,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

const MetricCard = ({ title, value, icon: Icon, color = "lime" }) => (
  <div className="glass p-5 rounded-[28px] border border-white/[0.03] flex flex-col gap-3 relative overflow-hidden">
    <div className="flex justify-between items-center text-gray-700">
      <span className="text-[9px] font-black uppercase tracking-widest">{title}</span>
      <Icon size={14} className={color === 'lime' ? 'text-lime-400' : 'text-white'} />
    </div>
    <div className="text-3xl font-black tracking-tighter leading-none mb-1">
      {value}
    </div>
    <div className={`h-[1px] w-full ${color === 'lime' ? 'bg-lime-400/20 shadow-[0_0_8px_rgba(163,230,53,0.3)]' : 'bg-white/10'}`} />
  </div>
);

const TelemetryView = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/stats');
        const data = await response.json();
        setStats(data);
      } catch (e) {
        console.error("Failed to fetch telemetry", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-black tracking-tighter uppercase">Swarm <span className="text-lime-400 italic">Telemetry.</span></h2>
        <Zap size={16} className="text-lime-400 animate-pulse" />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="h-24 w-full animate-pulse bg-white/5 rounded-[28px]" />
        ) : (
          <MetricCard 
            title="Global Verification Load" 
            value={stats?.total_claims_verified || "4.1k"} 
            icon={TrendingUp} 
          />
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <MetricCard 
            title="Active Voters" 
            value={stats?.active_voters_count || "0"} 
            icon={Globe}
            color="white"
          />
          <MetricCard 
            title="Registry Nodes" 
            value={stats?.registry_nodes || "0"} 
            icon={Layers}
            color="white"
          />
        </div>

        <div className="glass p-6 rounded-[32px] border-l-2 border-lime-400 mt-2">
           <div className="flex items-center gap-2 mb-4">
              <ShieldCheck size={14} className="text-lime-400" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">Node Trust Status</span>
           </div>
           
           <div className="space-y-4">
              <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Average confidence</span>
                    <span className="text-white">{((stats?.average_confidence || 0) * 1).toFixed(1)}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats?.average_confidence || 0)}%` }}
                      className="h-full bg-lime-400" 
                    />
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>Consensus Ratio</span>
                    <span className="text-white">{stats?.consensus_ratio || 0}%</span>
                 </div>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stats?.consensus_ratio || 0}%` }}
                      className="h-full bg-lime-400/50" 
                    />
                 </div>
              </div>
           </div>
        </div>

        <div className="glass p-5 rounded-[28px] border border-red-500/10 flex items-center gap-4 group">
           <div className="h-10 w-10 glass rounded-full flex items-center justify-center text-red-500 group-hover:bg-red-500/10 transition-colors">
              <AlertCircle size={20} />
           </div>
           <div>
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-700">Top Misleading Source</span>
              <p className="text-xs font-bold text-gray-300 tracking-tight line-clamp-1">{stats?.top_misleading_domain || "disinfo-express.io"}</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryView;
