import React from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  ArrowRight, 
  Zap, 
  Layers, 
  Globe, 
  Cpu, 
  LineChart, 
  Lock,
  MessageSquare,
  Code,
  Terminal,
  Server,
  Database,
  Search,
  Activity,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const NavLink = ({ children, to = "#" }) => (
  <a 
    href={to} 
    className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white px-4 py-2 transition-all"
  >
    {children}
  </a>
);

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.6 }}
    viewport={{ once: true }}
    className="group p-10 rounded-[32px] bg-white/[0.01] border border-white/[0.05] hover:border-lime-400/20 hover:bg-white/[0.02] transition-all"
  >
    <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:text-lime-400 transition-colors">
      <Icon size={24} />
    </div>
    <h3 className="text-xl font-black mb-4 tracking-tighter text-white uppercase">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed font-bold uppercase tracking-tight">{description}</p>
  </motion.div>
);

const AgentTrace = ({ name, delay = 0, status = "SYNC" }) => (
  <motion.div 
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.8 }}
    className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl mb-3"
  >
    <div className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{name}</span>
    <div className="flex-1 h-[1px] bg-white/5 mx-4" />
    <span className="text-[8px] font-bold text-gray-700 uppercase tracking-widest">{status}</span>
  </motion.div>
);

const Landing = () => {
  return (
    <div className="min-h-screen bg-black selection:bg-lime-400 selection:text-black font-sans">
      
      {/* 🧭 SURGICAL NAVIGATION */}
      <nav className="fixed top-0 left-0 w-full h-16 z-50 border-b border-white/[0.05] bg-black/60 backdrop-blur-xl px-12 flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link to="/" className="flex items-center gap-2.5 group">
            <ShieldCheck className="text-lime-400 transition-transform group-hover:scale-110" size={24} strokeWidth={2.5} />
            <span className="text-lg font-black tracking-tighter uppercase text-white">TruthLens</span>
          </Link>
          <div className="hidden lg:flex items-center gap-4">
            <NavLink to="#platform">Platform</NavLink>
            <NavLink to="#api">Ensemble API</NavLink>
            <NavLink to="#trace">Live Trace</NavLink>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link to="/dashboard" className="h-10 px-6 bg-lime-400 text-black rounded-lg font-black text-xs uppercase tracking-tighter flex items-center gap-2 hover:bg-lime-500 transition-all">
            Dashboard <ArrowRight size={14} strokeWidth={3} />
          </Link>
        </div>
      </nav>

      <main className="pt-40">
        
        {/* 🌪️ HERO SECTION (Refined Scale) */}
        <section id="platform" className="px-6 max-w-7xl mx-auto flex flex-col items-center text-center mb-60">
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.8 }}
             className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-lime-400/20 bg-lime-400/5 text-lime-400 text-[9px] font-black uppercase tracking-[0.3em] mb-12">
              <Zap size={12} fill="currentColor" />
              Consensus v2.5 Architecture
            </div>
            
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.85] mb-12 text-white uppercase">
              DECENTRALIZED <br /> 
              <span className="text-lime-400 italic">FACTUAL</span>
              <br /> CONSENSUS.
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-16 leading-tight font-bold uppercase tracking-tight">
              Architecting real-time fact verification through a decentralized <br className="hidden md:block" /> 
              ensemble of parallelized LLM consensus agents.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link to="/dashboard" className="h-16 px-12 bg-lime-400 text-black rounded-2xl font-black text-sm uppercase flex items-center gap-3 hover:bg-lime-500 transition-all hover:scale-[1.02] ">
                Initiate Local Index <ArrowRight size={16} strokeWidth={3} />
              </Link>
              <button className="h-16 px-12 bg-white/5 border border-white/5 text-white rounded-2xl font-black text-sm uppercase flex items-center hover:bg-white/10 transition-all">
                Read Whitepaper
              </button>
            </div>
          </motion.div>
        </section>

        {/* ⚙️ PROTOCOL FEATURES */}
        <section className="px-12 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-60">
          <FeatureCard 
            icon={Zap} 
            title="Extraction" 
            description="Sub-100ms claim parsing using multi-threaded GenAI orchestration." 
            delay={0.1} 
          />
          <FeatureCard 
            icon={Layers} 
            title="Ensemble" 
            description="Mistral-Large and Gemini-3.1 ensembling for triple-pass verification." 
            delay={0.2} 
          />
          <FeatureCard 
            icon={Globe} 
            title="Global Index" 
            description="Parallel search across 12+ global indices including Reuters and WHOIS." 
            delay={0.3} 
          />
          <FeatureCard 
            icon={Cpu} 
            title="Agentic Logic" 
            description="Dynamic agent selection based on claim category—optimizing for speed." 
            delay={0.4} 
          />
        </section>

        {/* 🧬 LIVE TRACE VISUALIZATION */}
        <section id="trace" className="px-12 max-w-7xl mx-auto mb-60 grid lg:grid-cols-12 gap-16 items-center">
           <div className="lg:col-span-5">
              <span className="text-[10px] font-black text-lime-400 uppercase tracking-[0.4em] mb-8 block">Agentic Consensus Trace</span>
              <h2 className="text-5xl font-black text-white tracking-tighter mb-8 leading-none uppercase">
                Observing the <br /> Ensemble Mind.
              </h2>
              <p className="text-gray-500 font-bold uppercase text-xs leading-relaxed mb-12 border-l border-white/10 pl-6 py-2">
                Every claim triggers a multi-surface search protocol. Watch how specialized agents verify metadata, cross-reference indices, and calculate consensus in real-time.
              </p>
              <div className="flex flex-col gap-2">
                 <AgentTrace name="Model-A: Mistral-Large" delay={0.1} />
                 <AgentTrace name="Model-B: Gemini-3.1-Flash" delay={0.2} />
                 <AgentTrace name="Model-C: Llama-3-70B" delay={0.3} />
                 <AgentTrace name="Logic: Sentiment-Heuristic" status="ACTIVE" delay={0.4} />
              </div>
           </div>
           <div className="lg:col-span-7 bg-white/[0.01] border border-white/5 rounded-[48px] p-12 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 text-lime-400/5 rotate-12 transition-transform group-hover:rotate-0 duration-1000">
                 <Cpu size={300} />
              </div>
              <div className="relative z-10">
                 <div className="flex justify-between items-center mb-10">
                    <span className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Latency Triage / Live Request</span>
                    <span className="text-[10px] font-black text-lime-400 uppercase tracking-widest">2.84s Inbound</span>
                 </div>
                 <div className="bg-black/40 border border-white/5 rounded-2xl p-8 mb-8 font-mono text-xs text-gray-400 leading-loose">
                    <span className="text-lime-400">$ </span> truthlens ingest --url "https://news.org/deepfake" <br />
                    <span className="text-gray-600">[SYST]</span> Extraction: 3 primary claims identified <br />
                    <span className="text-gray-600">[AGNT]</span> Dispatching Mistral-Large (Sentiment) <br />
                    <span className="text-gray-600">[AGNT]</span> Dispatching Gemini-Flash (Metadata) <br />
                    <span className="text-lime-400 uppercase font-black">[VERD]</span> VERDICT_LOCKED :: DISPROVED (0.942)
                 </div>
                 <div className="flex gap-4">
                    <div className="h-2 flex-1 bg-white/5 rounded-full overflow-hidden">
                       <motion.div initial={{ width: 0 }} whileInView={{ width: '82%' }} className="h-full bg-lime-400" />
                    </div>
                    <span className="text-[10px] font-black text-white leading-none">82% Bias Density</span>
                 </div>
              </div>
           </div>
        </section>

        {/* 💻 DEVELOPER API PREVIEW */}
        <section id="api" className="px-12 max-w-7xl mx-auto mb-60">
           <div className="bg-white/[0.01] border border-white/5 rounded-[48px] p-12 md:p-20 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-lime-400/20 to-transparent" />
              
              <div className="grid lg:grid-cols-2 gap-20 items-center">
                 <div>
                    <h2 className="text-5xl font-black text-white tracking-tighter mb-8 leading-none uppercase">Architected for <br /> Integration.</h2>
                    <p className="text-gray-500 font-bold uppercase text-xs leading-relaxed mb-12">
                      TruthLens is a headless-first platform. Integrate world-class fact verification into your CMS, Browser Extensions, or Social Pipeline with 4 lines of code.
                    </p>
                    <div className="space-y-6">
                       <div className="flex items-center gap-4 text-white font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle className="text-lime-400" size={16} /> RESTful Ingestion Node
                       </div>
                       <div className="flex items-center gap-4 text-white font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle className="text-lime-400" size={16} /> WebSocket Live Streaming
                       </div>
                       <div className="flex items-center gap-4 text-white font-black text-[10px] uppercase tracking-widest">
                          <CheckCircle className="text-lime-400" size={16} /> Python / Node SDK Ready
                       </div>
                    </div>
                 </div>
                 
                 <div className="bg-black border border-white/10 rounded-3xl p-8 font-mono text-[13px] leading-relaxed relative group">
                    <div className="absolute top-4 right-6 text-gray-800 uppercase font-black text-[9px] tracking-widest">PYTHON_SDK_V2.0</div>
                    <div className="text-gray-500"># Initialize the TruthLens Consensus</div>
                    <div><span className="text-lime-400">from</span> truthlens <span className="text-lime-400">import</span> Orchestrator</div>
                    <br />
                    <div>client = Orchestrator(api_key=<span className="text-yellow-400">"tl_live_4k92"</span>)</div>
                    <div>result = client.verify(<span className="text-yellow-400">"https://viral-news.com/claim"</span>)</div>
                    <br />
                    <div><span className="text-lime-400">print</span>(f<span className="text-yellow-400">"Verdict: {"{result.verdict}"}"</span>)</div>
                    <div><span className="text-lime-400">print</span>(f<span className="text-yellow-400">"Consensus: {"{result.confidence}"}%"</span>)</div>
                    
                    <button className="absolute bottom-6 right-6 h-8 px-4 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-gray-400 hover:text-white uppercase tracking-widest transition-all rounded-md">
                       Copy SNIPPET
                    </button>
                 </div>
              </div>
           </div>
        </section>

        {/* 🏆 ARCHITECTURAL TIERS (Waitlist) */}
        <section className="px-6 max-w-7xl mx-auto mb-60 text-center">
           <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] mb-8 block">Global Availability</span>
           <h2 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-12 uppercase leading-none">
             Join the <br /> Architectural <br /> <span className="text-lime-400 underline decoration-4 underline-offset-8 decoration-lime-400/20">Consensus.</span>
           </h2>
           <div className="max-w-md mx-auto relative mb-12">
              <input 
                type="email" 
                placeholder="ENTER RESEARCH_ID@EMAIL.COM" 
                className="w-full h-16 bg-white/[0.02] border border-white/10 rounded-2xl px-8 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-lime-400/40 transition-all text-white"
              />
              <button className="absolute right-2 top-2 h-12 px-6 bg-lime-400 text-black rounded-xl font-black text-[10px] uppercase tracking-tighter hover:bg-lime-500 transition-all">
                Join Network
              </button>
           </div>
           <p className="text-[9px] font-black text-gray-700 uppercase tracking-[0.2em]">Verified by 24,000+ consensus nodes worldwide.</p>
        </section>

      </main>

      {/* 🏁 ARCHITECTURAL FOOTER */}
      <footer className="px-12 py-12 border-t border-white/[0.05] bg-black flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-2.5 opacity-60">
          <ShieldCheck size={20} className="text-lime-400" />
          <span className="text-xs font-extrabold uppercase tracking-widest text-white">TruthLens Platform</span>
        </div>
        <div className="text-[10px] font-bold text-gray-800 uppercase tracking-widest text-center">
          &copy; 2026 TRUTHLENS LABS. ARCHITECTED FOR CONSENSUS AND CLARITY.
        </div>
        <div className="flex gap-8 text-[10px] font-black text-gray-700 uppercase tracking-[0.2em]">
          <a href="#" className="hover:text-white transition-colors">Documentation</a>
          <a href="#" className="hover:text-white transition-colors">API Status</a>
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
        </div>
      </footer>

    </div>
  );
};

const CheckCircle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

export default Landing;
