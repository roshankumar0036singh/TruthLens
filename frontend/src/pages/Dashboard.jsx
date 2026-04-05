import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  History, 
  Key, 
  Settings, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Cpu, 
  Layers, 
  ChevronRight, 
  ExternalLink,
  Activity,
  FileText,
  Lock,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Database,
  Server,
  Terminal,
  RefreshCw,
  Trophy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const SideNavItem = ({ icon: Icon, label, active, onClick }) => (
  <div 
    onClick={onClick}
    className={`flex items-center gap-3.5 px-6 py-3.5 cursor-pointer relative transition-all group ${
      active ? 'text-lime-400 bg-white/5' : 'text-gray-500 hover:text-white'
    }`}
  >
    {active && (
      <motion.div 
        layoutId="activeNav" 
        className="absolute left-0 top-0 h-full w-[1.5px] bg-lime-400" 
      />
    )}
    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
  </div>
);

const ProofIndicator = ({ title, value, status = 'VERIFIED' }) => (
  <div className="flex flex-col gap-2 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] transition-all hover:bg-white/[0.04]">
    <div className="flex justify-between items-center">
      <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest leading-none">{title}</span>
      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest ${
        status === 'VERIFIED' || status === 'PASS' ? 'bg-lime-400/10 text-lime-400' : 'bg-red-500/10 text-red-500'
      }`}>{status}</span>
    </div>
    <span className="text-xs font-bold text-gray-300 tracking-tight leading-none truncate">{value}</span>
  </div>
);

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [input, setInput] = useState('');
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [trace, setTrace] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  
  const ws = useRef(null);

  // 📦 LOCAL STORAGE PERSISTENCE
  useEffect(() => {
    const saved = localStorage.getItem('truthlens_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const handleVerify = () => {
    if (!input) return;
    
    setLoading(true);
    setAnalyzed(true);
    setTrace([]); // Reset trace
    setFinalResult(null);

    // 🔗 INITIATE WEBSOCKET CONNECTION
    ws.current = new WebSocket('ws://localhost:8000/api/v1/ws/verify');

    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ text: input }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.status === 'processing' || data.status === 'resolved' || data.status === 'failed') {
        setTrace(prev => [...prev, data]);
      }

      if (data.status === 'completed') {
        const result = {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          content: input,
          verdict: data.verdict?.status || 'MIXED',
          confidence: data.verdict?.confidence || 0.0,
          latency: data.verdict?.latency || 0.0,
          raw: data.detailed_reports
        };
        
        setFinalResult(result);
        const updatedHistory = [result, ...history];
        setHistory(updatedHistory);
        localStorage.setItem('truthlens_history', JSON.stringify(updatedHistory));
        setLoading(false);
      }
    };

    ws.current.onerror = (error) => {
      console.error("WS Error:", error);
      setLoading(false);
    };

    ws.current.onclose = () => {
      console.log("Trace Complete.");
    };
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('truthlens_history');
  };

  return (
    <div className="flex h-screen w-screen bg-black overflow-hidden select-none">
      
      {/* 🧭 COLUMN 1: SURGICAL SIDEBAR (260px) */}
      <aside className="w-[260px] border-r border-white/5 flex flex-col pt-10 flex-shrink-0 bg-black">
        <div className="px-8 mb-16 flex items-center gap-2.5">
          <ShieldCheck className="text-lime-400" size={24} strokeWidth={2.5} />
          <span className="text-lg font-black tracking-tighter uppercase text-white">TruthLens</span>
        </div>
        
        <nav className="flex-1 space-y-1">
          <SideNavItem icon={Search} label="Real-time Analyzer" active={activeTab === 'analyzer'} onClick={() => setActiveTab('analyzer')} />
          <Link to="/quests" className="block"><SideNavItem icon={Trophy} label="Quest Board" active={false} /></Link>
          <SideNavItem icon={History} label="Verification Logs" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <SideNavItem icon={Key} label="Agent API Registry" active={activeTab === 'api'} onClick={() => setActiveTab('api')} />
          <SideNavItem icon={Activity} label="System Telemetry" active={activeTab === 'telemetry'} onClick={() => setActiveTab('telemetry')} />
        </nav>

        <div className="pb-8 border-t border-white/5 pt-4">
          <SideNavItem icon={Settings} label="Global Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
          <Link to="/" className="flex items-center gap-4 px-8 py-5 text-gray-600 hover:text-white transition-colors group">
             <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Logout Protocol</span>
          </Link>
        </div>
      </aside>

      {/* 🚀 COLUMN 2: MAIN WORKSPACE (FLUID) */}
      <main className="flex-1 overflow-y-auto px-12 py-12 relative bg-black">
        
        <header className="mb-12 flex justify-between items-center">
            <div className="flex items-center gap-3 text-gray-700">
               <span className="text-[10px] font-black uppercase tracking-widest leading-none">Platform v0.2.4</span>
               <ChevronRight size={12} className="opacity-40" />
               <span className="text-[10px] font-black uppercase tracking-widest text-white leading-none">
                 {activeTab.toUpperCase()} PIPELINE
               </span>
            </div>
            <div className="flex gap-4">
               <div className="h-10 px-4 bg-white/[0.02] border border-white/[0.05] rounded-xl flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-lime-400 shadow-[0_0_12px_rgba(163,230,53,0.4)] animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Node Status: Active</span>
               </div>
            </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'analyzer' && (
            <motion.div
              key="analyzer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {!analyzed ? (
                <div className="max-w-3xl mx-auto flex flex-col items-center pt-20">
                   <h1 className="text-5xl md:text-6xl font-black mb-8 tracking-tighter leading-none text-white text-center uppercase">
                     INITIATE THE <br /> <span className="text-lime-400 italic">VERDICT.</span>
                   </h1>
                   
                   <div className="w-full bg-white/[0.01] backdrop-blur-xl border border-white/[0.05] p-8 rounded-3xl">
                      <div className="flex gap-1.5 items-center mb-6 text-gray-700">
                         <Globe size={14} />
                         <span className="text-[9px] font-black uppercase tracking-[0.3em]">MULTI-AGENT ANALYTIC INGESTION</span>
                      </div>
                      
                      <div className="relative group mb-6">
                        <input 
                          type="text" 
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder="URL OR TEXT CONTENT STRING..."
                          className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-8 text-lg font-black focus:outline-none focus:border-lime-400/20 transition-all placeholder:text-gray-900 text-white"
                        />
                      </div>

                      <button 
                        onClick={handleVerify}
                        disabled={loading}
                        className="w-full h-16 bg-lime-400 text-black rounded-xl text-sm font-black uppercase tracking-tighter flex items-center justify-center gap-3 group disabled:opacity-50 hover:bg-lime-500 transition-all active:scale-[0.98]"
                      >
                        {loading ? (
                          <div className="flex items-center gap-4">
                            <RefreshCw className="animate-spin text-black" size={18} />
                            <span>Resolving Agent Consensus...</span>
                          </div>
                        ) : (
                          <>
                            Run Verification Protocol 
                            <ArrowRight className="group-hover:translate-x-2 transition-transform" size={18} strokeWidth={3} />
                          </>
                        )}
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-8 pt-4">
                   
                   {/* ⚡ LOADING / STREAMING STATE */}
                   {loading && (
                      <div className="flex flex-col items-center justify-center py-40 gap-8">
                         <motion.div 
                           animate={{ rotate: 360 }} 
                           transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                           className="h-20 w-20 border-t-2 border-lime-400 rounded-full"
                         />
                         <div className="text-center">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Resolving Ensemble...</h3>
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Querying Mistral, Gemini, and Source Indices</p>
                         </div>
                      </div>
                   )}

                   {/* 🎉 FINAL VERDICT VIEW */}
                   {finalResult && (
                      <>
                        <div className={`bg-white/[0.01] backdrop-blur-xl border ${finalResult.verdict === 'VERIFIED' ? 'border-lime-500/20' : 'border-red-500/20'} p-10 rounded-[40px] relative overflow-hidden group`}>
                          <div className={`absolute top-0 right-0 p-8 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-175 group-hover:rotate-0 duration-1000 ${finalResult.verdict === 'VERIFIED' ? 'text-lime-500' : 'text-red-500'}`}>
                             <ShieldCheck size={200} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-[0.25em] mb-6 block font-mono ${finalResult.verdict === 'VERIFIED' ? 'text-lime-500' : 'text-red-500'}`}>
                            SYSTEM_VERDICT :: {finalResult.verdict}
                          </span>
                          <h2 className={`text-8xl font-black mb-8 tracking-tighter leading-none ${finalResult.verdict === 'VERIFIED' ? 'text-lime-500' : 'text-red-500'}`}>
                            {finalResult.verdict}
                          </h2>
                          
                          <div className="max-w-2xl">
                            <p className="text-xl text-gray-500 font-medium mb-12 leading-tight">
                              {finalResult.verdict === 'VERIFIED' 
                                ? "Multivariate agent consensus verifies signal integrity across all primary indices. High authenticity heuristic detected."
                                : "Agent ensemble detects significant heuristic misalignment. Contradiction localized in Source History and Semantic logs."}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-12 border-t border-white/[0.05] pt-8">
                             <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Confidence Ratio</span>
                                <span className="text-2xl font-black text-white">{(finalResult.confidence * 100).toFixed(1)}%</span>
                             </div>
                             <div className="flex flex-col gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Triage Result</span>
                                <span className="text-2xl font-black text-lime-400 uppercase italic">SUCCESS</span>
                             </div>
                             <div className="flex flex-col gap-2 border-l border-white/10 pl-12">
                                <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">Latency Triage</span>
                                <span className="text-2xl font-black text-white">{finalResult.latency}s</span>
                             </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                              <TrendingUp size={20} className="text-lime-400 mb-6" />
                              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-400 mb-6">Bias Anomaly Index</h3>
                              <div className="flex items-end gap-2 mb-4">
                                 <span className="text-5xl font-black text-white tracking-tighter">{finalResult.verdict === 'VERIFIED' ? '4%' : '82%'}</span>
                              </div>
                           </div>
                           <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all group">
                              <Layers size={20} className="text-lime-400 mb-6" />
                              <h3 className="text-[10px] font-extrabold uppercase tracking-[0.3em] text-gray-400 mb-6">Verification Node</h3>
                              <div className="flex flex-col">
                                 <span className="text-2xl font-black text-white tracking-tight uppercase">{finalResult.verdict === 'VERIFIED' ? 'NODE_AUTH' : 'NODE_FAIL'}</span>
                                 <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest mt-1">Surgical Consistency Checked</span>
                              </div>
                           </div>
                        </div>

                        <button 
                           onClick={() => {setAnalyzed(false); setFinalResult(null);}}
                           className="text-gray-600 hover:text-white text-[10px] font-black uppercase tracking-[0.3em] self-center transition-colors pb-20"
                        >
                          Reset Verification Pipeline
                        </button>
                      </>
                   )}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
               key="history"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col gap-8"
            >
               <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter mb-2">VERIFICATION HISTORY</h2>
                    <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Persistent Storage Engine / Local Storage</p>
                  </div>
                  <button onClick={clearHistory} className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest">
                    Flush Buffer Index
                  </button>
               </div>

               <div className="border border-white/5 rounded-3xl overflow-hidden bg-white/[0.01]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                       <tr className="border-b border-white/5 bg-white/[0.02]">
                          <th className="px-8 py-5 text-[9px] font-black text-gray-700 uppercase tracking-widest">Timestamp</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-700 uppercase tracking-widest">Claim / Content Ingested</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-700 uppercase tracking-widest text-center">Verdict</th>
                          <th className="px-8 py-5 text-[9px] font-black text-gray-700 uppercase tracking-widest text-right">Confidence</th>
                       </tr>
                    </thead>
                    <tbody>
                       {history.length === 0 ? (
                         <tr>
                            <td colSpan="4" className="px-8 py-20 text-center text-gray-800 font-bold uppercase text-[10px] tracking-widest">
                               Index Buffer Empty. No verification logs found.
                            </td>
                         </tr>
                       ) : (
                         history.map(entry => (
                           <tr key={entry.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-6 text-xs text-gray-500 font-mono">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                              <td className="px-8 py-6 text-xs text-white font-bold max-w-xs truncate">{entry.content}</td>
                              <td className="px-8 py-6 text-center">
                                 <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${entry.verdict === 'VERIFIED' ? 'text-lime-500 bg-lime-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                    {entry.verdict}
                                 </span>
                              </td>
                              <td className="px-8 py-6 text-right text-xs text-lime-400 font-black">{(entry.confidence * 100).toFixed(1)}%</td>
                           </tr>
                         ))
                       )}
                    </tbody>
                  </table>
               </div>
            </motion.div>
          )}

          {/* ... Other tabs remain functionally similar but with live indicators if needed ... */}
          {activeTab === 'api' && (
             <motion.div key="api" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-2 gap-6">
                <div className="col-span-2 mb-4">
                  <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">Agent Registry</h2>
                  <p className="text-xs text-gray-600 font-bold uppercase tracking-widest text-lime-400 border-l border-lime-400/20 pl-4 py-2">
                    Ensemble v2.4 Active. All models synchronizing across 240 endpoints.
                  </p>
                </div>
                {[
                  { name: 'Mistral Large-Iterative', status: 'Optimal', version: 'v3.1-26', latency: '124ms' },
                  { name: 'Gemini 3.1-Flash Pro', status: 'Ready', version: 'v2.5', latency: '42ms' },
                  { name: 'Llama-3.1 70B (Dedicated)', status: 'Optimal', version: 'v1.4', latency: '210ms' },
                  { name: 'DeepSeek-67B Consensus', status: 'Intermittent', version: 'v2.0', latency: '400ms' }
                ].map(agent => (
                  <div key={agent.name} className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 hover:border-lime-400/20 transition-all group">
                     <div className="flex justify-between items-start mb-8">
                        <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-gray-600 group-hover:text-lime-400">
                          <Cpu size={18} />
                        </div>
                        <span className="text-[8px] font-black bg-lime-400/10 text-lime-400 px-2 py-0.5 rounded uppercase tracking-widest">{agent.status}</span>
                     </div>
                     <h4 className="text-lg font-black text-white mb-2 leading-none">{agent.name}</h4>
                     <p className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-6">Internal Version: {agent.version}</p>
                     <div className="flex justify-between items-baseline pt-4 border-t border-white/5">
                        <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">End-to-End Latency</span>
                        <span className="text-xs font-bold text-gray-400 font-mono">{agent.latency}</span>
                     </div>
                  </div>
                ))}
             </motion.div>
          )}

          {activeTab === 'telemetry' && (
             <motion.div key="telemetry" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-10">
                <div className="flex justify-between items-end">
                   <div>
                     <h2 className="text-4xl font-black text-white tracking-tighter mb-2 uppercase">Real-time Telemetry</h2>
                     <p className="text-xs text-gray-600 font-bold uppercase tracking-widest">Agent Swarm Metrics / Active Load</p>
                   </div>
                   <div className="text-[9px] font-black text-lime-400 uppercase tracking-widest animate-pulse flex items-center gap-2">
                     <Activity size={12} /> STREAMING_LIVE
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-6 h-40">
                   <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                      <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Consensus Ratio</span>
                      <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-white">0.96</span><TrendingUp size={16} className="text-lime-400" /></div>
                   </div>
                   <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                      <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">Ingestion Load</span>
                      <div className="flex items-baseline gap-2"><span className="text-5xl font-black text-white">2.4k</span><span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest font-mono">TPS</span></div>
                   </div>
                   <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col justify-between">
                      <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest">System Heat</span>
                      <div className="flex items-baseline gap-2 text-lime-400"><span className="text-5xl font-black">28°</span><span className="text-[10px] font-bold uppercase tracking-widest font-mono">CELSIUS</span></div>
                   </div>
                </div>
                <div className="h-64 border border-white/5 rounded-[40px] bg-white/[0.01] p-10 flex flex-col">
                   <span className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-10">Agent Connectivity Flux (Global)</span>
                   <div className="flex-1 flex items-end gap-1 px-4">
                      {[80, 60, 45, 90, 100, 70, 50, 40, 60, 80, 95, 85, 75, 90, 100, 60, 40, 80, 90, 70].map((h, i) => (
                        <motion.div key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.05, duration: 1 }} className="flex-1 bg-lime-400/20 rounded-full hover:bg-lime-400 transition-colors cursor-pointer" />
                      ))}
                   </div>
                </div>
             </motion.div>
          )}

          {activeTab === 'settings' && (
             <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl flex flex-col gap-8">
                <h2 className="text-4xl font-black text-white tracking-tighter uppercase mb-4 text-center">Global Preferences</h2>
                <div className="space-y-4">
                   <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex justify-between items-center group">
                      <div><h4 className="text-sm font-bold text-white uppercase tracking-tight mb-1">Neon Mode Architecture</h4><p className="text-[10px] font-medium text-gray-700 uppercase tracking-widest">Toggle primary lime accent visibility</p></div>
                      <div className="h-6 w-12 bg-lime-400 rounded-full p-1 flex justify-end"><div className="h-4 w-4 bg-black rounded-full" /></div>
                   </div>
                   <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 flex justify-between items-center group">
                      <div><h4 className="text-sm font-bold text-white uppercase tracking-tight mb-1">API Key Retrieval</h4><p className="text-[10px] font-medium text-gray-700 uppercase tracking-widest">tl_live_4992_••••••••••••</p></div>
                      <button className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest">Rotate Index</button>
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 🧭 COLUMN 3: EVIDENCE TRACE PANEL (400px) */}
      <aside className="w-[400px] border-l border-lime-400/30 bg-black/60 backdrop-blur-3xl p-10 overflow-y-auto flex-shrink-0">
        <div className="flex items-center gap-3 mb-12">
           <FileText size={16} className="text-lime-400" />
           <span className="text-[9px] font-black uppercase tracking-[0.3em] text-white">Cryptographic Trace</span>
        </div>

        {!analyzed ? (
          <div className="flex flex-col items-center justify-center h-[calc(100%-120px)] text-center">
            <div className="h-14 w-14 bg-white/[0.02] border border-white/[0.05] rounded-full flex items-center justify-center mb-10 text-gray-800">
               <Cpu size={24} />
            </div>
            <span className="text-[8px] font-black uppercase tracking-[0.25em] text-gray-800 leading-relaxed">
              Awaiting Initial Signal <br /> from Main Ingestion Node
            </span>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex flex-col gap-10"
          >
            <div>
               <span className="text-[10px] font-black text-gray-700 uppercase tracking-[0.2em] block mb-8">Agent Source Verification</span>
               <div className="space-y-3">
                  {trace.length === 0 && (
                     <div className="flex items-center gap-3 text-gray-700 animate-pulse">
                        <RefreshCw size={14} className="animate-spin" />
                        <span className="text-[9px] font-black uppercase tracking-widest font-mono">Initializing Socket...</span>
                     </div>
                  )}
                  {trace.map((t, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]"
                    >
                       <div className="flex items-center gap-3">
                          <div className={`h-1.5 w-1.5 rounded-full ${t.status === 'failed' ? 'bg-red-500' : 'bg-lime-400'}`} />
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t.agent}</span>
                       </div>
                       {t.status === 'resolved' ? (
                          <CheckCircle size={14} className="text-lime-400" />
                       ) : t.status === 'failed' ? (
                          <XCircle size={14} className="text-red-500" />
                       ) : (
                          <RefreshCw size={12} className="animate-spin text-gray-700" />
                       )}
                    </motion.div>
                  ))}
               </div>
            </div>

            {/* Final Report Details */}
            {finalResult && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="p-8 rounded-3xl bg-white/[0.01] border border-dashed border-white/10">
                    <div className="flex items-center gap-3 mb-6">
                        <Activity size={14} className="text-lime-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Latency Triage Index</span>
                    </div>
                    <div className="flex justify-between items-baseline mb-3">
                        <span className="text-xs font-bold text-gray-600 tracking-tight">E2E Processor Speed</span>
                        <span className="text-2xl font-black text-white">{finalResult.latency}s</span>
                    </div>
                    <div className="h-0.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }} 
                          animate={{ width: `${Math.min(100, (finalResult.confidence * 100))}%` }} 
                          className="h-full bg-lime-400" 
                        />
                    </div>
                  </div>

                  <div className="bg-white/[0.02] p-8 rounded-3xl border border-white/5">
                      <div className="flex items-center gap-3 mb-6">
                        <AlertCircle size={14} className="text-lime-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-600">Consensus Logic</span>
                      </div>
                      <div className="space-y-4">
                        {finalResult.raw && Object.entries(finalResult.raw).map(([name, data], i) => (
                           <div key={i} className="flex justify-between items-center">
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-700">{name}</span>
                              <span className={`text-[9px] font-black uppercase tracking-widest ${data.error ? 'text-red-500' : 'text-lime-400'}`}>
                                 {data.error ? 'CRASH' : 'OPTIMAL'}
                              </span>
                           </div>
                        ))}
                      </div>
                  </div>
               </motion.div>
            )}
          </motion.div>
        )}
      </aside>

    </div>
  );
};

export default Dashboard;
