import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Image as ImageIcon, 
  ArrowRight, 
  Activity, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  ThumbsUp, 
  ThumbsDown,
  Search 
} from 'lucide-react';
import KnowledgeGraph from '../components/KnowledgeGraph';
import MediaSearcher from '../components/MediaSearcher';

const TRUTH_DAO_ADDRESS = "0x02C79dB0e3701FB13Dec2A29EE9c93aEfFAf5F6D";

const ConfidenceHeatmap = ({ text, result }) => {
  // Prioritize the exact text the backend analyzed
  const heatmapText = result?.text || text;

  if (!heatmapText || heatmapText === 'No text available' || heatmapText === '...') {
    return (
      <div className="flex flex-col items-center justify-center py-10 opacity-40">
        <Activity size={32} className="mb-4 text-gray-700" />
        <div className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Source content not detected.</div>
        <div className="text-[8px] text-gray-600 mt-2 italic">Try Manual Mode if automatic capture fails.</div>
      </div>
    );
  }

  // Split by double newline or regex sentence split
  const sentences = heatmapText
    .split(/\n\n|(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 10);
  
  const flaggedKeywords = new Set();
  const approvedKeywords = new Set();
  
  if (Array.isArray(result?.reasons)) {
    result.reasons.forEach(r => {
      const words = r.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      words.forEach(w => flaggedKeywords.add(w));
    });
  }
  
  const citations = result?.raw?.CitationFinder?.citation_report || [];
  citations.forEach(report => {
    if (Array.isArray(report.evidence)) {
      report.evidence.forEach(ev => {
        const words = (ev.excerpt || '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
        if (ev.stance === 'DISAPPROVE') words.forEach(w => flaggedKeywords.add(w));
        if (ev.stance === 'APPROVE') words.forEach(w => approvedKeywords.add(w));
      });
    }
  });

  const manipScore = result?.raw?.RhetoricAnalyzer?.manipulation_score || 0;
  const overallBias = manipScore > 0.6 ? 'suspicious' : manipScore > 0.3 ? 'mixed' : 'clean';

  const classifySentence = (sentence) => {
    const lower = sentence.toLowerCase();
    const words = lower.split(/\s+/).filter(w => w.length > 3);
    let flagHits = 0, approveHits = 0;
    words.forEach(w => {
      if (flaggedKeywords.has(w)) flagHits++;
      if (approvedKeywords.has(w)) approveHits++;
    });
    if (flagHits > approveHits && flagHits > 0) return 'flagged';
    if (approveHits > flagHits && approveHits > 0) return 'verified';
    if (overallBias === 'suspicious') return 'neutral-warn';
    return 'neutral';
  };

  const styleMap = {
    flagged: { color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
    verified: { color: 'text-lime-400', bg: 'bg-lime-400/20', border: 'border-lime-400/30' },
    'neutral-warn': { color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
    neutral: { color: 'text-gray-400', bg: 'transparent', border: 'border-transparent' },
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 mb-3 text-[8px] font-bold uppercase tracking-widest text-gray-500 border-b border-white/5 pb-4">
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-lime-400"/> Verified</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500"/> Flagged</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500"/> Uncertain</span>
        <span className="flex items-center gap-1"><span className="h-2 w-1 rounded-full bg-gray-700"/> Analysis Depth</span>
      </div>
      <div className="text-[11px] leading-relaxed font-bold font-mono tracking-tight whitespace-pre-wrap max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {sentences.map((s, i) => {
          const cls = classifySentence(s);
          const st = styleMap[cls];
          return (
            <motion.span 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.02 }}
              className={`${st.color} ${st.bg} px-1.5 py-0.5 rounded-sm border-b-2 ${st.border} hover:bg-white/5 transition-all cursor-crosshair inline-block mb-2 mr-1`}
              title={cls === 'flagged' ? 'Flagged Claim' : cls === 'verified' ? 'Verified Fact' : 'Neutral Context'}
            >
              {s}
            </motion.span>
          );
        })}
      </div>
    </div>
  );
};

const ForensicOverlay = ({ regions }) => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
    {regions.map((r, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ left: `${r.x}%`, top: `${r.y}%`, width: `${r.w}%`, height: `${r.h}%` }}
        className="absolute border-2 border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.5)] flex items-end justify-start p-1"
      >
        <span className="text-[6px] font-black text-white bg-red-500 px-1 uppercase whitespace-nowrap">{r.label}</span>
      </motion.div>
    ))}
  </div>
);

const ExifInspector = ({ metadata }) => {
  if (!metadata || metadata.length === 0) return null;
  const report = metadata[0];

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-[7px] font-black text-gray-700 uppercase tracking-widest">Device</span>
        <span className="text-[10px] font-bold text-gray-400">{report.make || 'Unknown'} {report.model || ''}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[7px] font-black text-gray-700 uppercase tracking-widest">Date</span>
        <span className="text-[10px] font-bold text-gray-400">{report.datetime || 'Unknown'}</span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[7px] font-black text-gray-700 uppercase tracking-widest">Software</span>
        <span className="text-[10px] font-bold text-lime-400 italic">{report.software || 'Original'}</span>
      </div>
    </div>
  );
};

const AccordionSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-white/5 py-4 first:border-t-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full group py-2"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isOpen ? 'bg-lime-400/10 text-lime-400' : 'bg-white/5 text-gray-500'} transition-colors`}>
            <Icon size={14} />
          </div>
          <span className={`text-[10px] font-black uppercase tracking-widest ${isOpen ? 'text-white' : 'text-gray-500'} group-hover:text-white transition-colors`}>
            {title}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="text-gray-600"
        >
          <ArrowRight size={12} className="rotate-90" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-4"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const AnalyzerView = ({ 
  pageData, 
  analyzed, 
  loading, 
  trace, 
  finalResult, 
  voted, 
  handleVerify, 
  handleVote, 
  handleDispute,
  handleShare,
  resetAnalysis,
  onRefreshData
}) => {
  const [manualMode, setManualMode] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [manualImage, setManualImage] = useState(null);
  const [shieldActive, setShieldActive] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const onVoteInternal = (type) => {
    if (!finalResult || voted) return;
    const action = type === 'up' ? 'vote_up' : 'vote_down';
    window.open(`http://localhost:8000/transact?action=${action}&verdict_id=0`, '_blank');
    handleVote(type); 
  };

  const onDisputeInternal = () => {
    if (!finalResult) return;
    window.open(`http://localhost:8000/transact?action=dispute`, '_blank');
  };

  const onVerifyInternal = () => {
    if (manualMode) {
      handleVerify({
        url: manualUrl || 'Manual Input',
        headline: manualUrl ? 'URL Analysis' : 'Text Analysis',
        text: manualText || manualUrl,
        image: manualImage
      });
    } else {
      handleVerify();
    }
  };

  const toggleShield = async () => {
    const newState = !shieldActive;
    setShieldActive(newState);
    if (newState && !analyzed && pageData) onVerifyInternal();
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id && tab.url?.startsWith('http')) {
      chrome.tabs.sendMessage(tab.id, { action: "TOGGLE_SHIELD", active: newState }).catch((err) => {
        console.debug("TruthLens: Content script not reachable on this tab.", err);
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between glass py-3 px-6 rounded-3xl border-b border-lime-400/20">
         <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${shieldActive ? 'bg-lime-400 animate-pulse' : 'bg-gray-800'}`} />
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Global Shield</span>
         </div>
         <button onClick={toggleShield} className={`h-6 w-12 rounded-full p-1 transition-all flex items-center ${shieldActive ? 'bg-lime-400' : 'bg-white/10'}`}>
            <motion.div animate={{ x: shieldActive ? 24 : 0 }} className="h-4 w-4 bg-black rounded-full shadow-lg" />
         </button>
      </div>

      <AnimatePresence mode="wait">
        {!analyzed ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6">
            <div className="glass p-6 rounded-[40px] neon-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Truth <br /> <span className="text-lime-400 italic">Scanner.</span></h2>
                <div className="flex bg-white/5 rounded-full p-1 border border-white/5">
                   <button onClick={() => setManualMode(false)} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase transition-all ${!manualMode ? 'bg-lime-400 text-black shadow-[0_0_10px_rgba(163,230,53,0.5)]' : 'text-gray-500'}`}>Auto</button>
                   <button onClick={() => setManualMode(true)} className={`px-4 py-2 rounded-full text-[8px] font-black uppercase transition-all ${manualMode ? 'bg-lime-400 text-black shadow-[0_0_10px_rgba(163,230,53,0.5)]' : 'text-gray-500'}`}>Manual</button>
                </div>
              </div>
              
              {!manualMode ? (
                pageData && (
                  <div className="space-y-4 mb-8">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 glass rounded-2xl flex items-center justify-center flex-shrink-0 text-gray-500"><FileText size={18} /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-[10px] font-black text-gray-700 uppercase tracking-widest">Detected Headline</p>
                            <button 
                                onClick={onRefreshData}
                                className="p-1 hover:bg-white/5 rounded-md text-gray-700 hover:text-lime-400 transition-all"
                                title="Re-scan page"
                            >
                                <RefreshCw size={10} className={!pageData ? 'animate-spin' : ''} />
                            </button>
                        </div>
                        {pageData?.headline ? (
                            <p className="text-xs font-bold leading-tight text-gray-300">{pageData.headline}</p>
                        ) : (
                            <div className="flex items-center gap-2 text-gray-600">
                                <Activity size={10} className="animate-pulse" />
                                <p className="text-[10px] font-bold uppercase italic animate-pulse">Detecting headline...</p>
                            </div>
                        )}
                    </div>
                    </div>
                    {pageData.image && <div className="rounded-[24px] overflow-hidden aspect-video border border-white/5 bg-black/20"><img src={pageData.image} className="w-full h-full object-cover grayscale opacity-40 hover:grayscale-0 hover:opacity-100 transition-all duration-700" /></div>}
                  </div>
                )
              ) : (
                <div className="space-y-4 mb-8">
                   <input type="text" placeholder="PASTE URL..." className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-5 text-[10px] font-black uppercase" value={manualUrl} onChange={(e) => setManualUrl(e.target.value)} />
                   <textarea placeholder="ENTER CLAIM..." className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-5 text-[10px] font-black uppercase resize-none" value={manualText} onChange={(e) => setManualText(e.target.value)} />
                   <MediaSearcher onImageSelect={setManualImage} />
                </div>
              )}
              <button id="verify-trigger" onClick={onVerifyInternal} className="w-full h-16 bg-lime-400 text-black rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-lime-500 transition-all shadow-[0_20px_40px_-10px_rgba(163,230,53,0.3)]">Execute Analysis <ArrowRight size={16} strokeWidth={3} /></button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="glass p-6 rounded-[32px] border-l-2 border-lime-400 bg-lime-400/5">
              <div className="flex items-center gap-2 mb-4"><Activity size={14} className="text-lime-400" /><span className="text-[9px] font-black uppercase tracking-widest text-lime-400">Consensus Trace</span></div>
              <div className="space-y-2">
                {trace.map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-[10px] font-black uppercase text-gray-500">
                    <span className="flex items-center gap-2"><div className={`h-1 w-1 rounded-full ${t.status === 'failed' ? 'bg-red-500' : 'bg-lime-400'}`} />{t.agent}</span>
                    {t.status === 'resolved' ? <CheckCircle size={12} className="text-lime-400" /> : t.status === 'failed' ? <XCircle size={12} className="text-red-500" /> : <RefreshCw size={10} className="animate-spin text-gray-800" />}
                  </div>
                ))}
                {loading && <div className="flex items-center gap-3 text-gray-800 mt-4"><RefreshCw size={12} className="animate-spin text-lime-400" /><span className="text-[8px] font-black uppercase animate-pulse">{trace.some(t => t.agent === 'Aggregator' && t.status === 'processing') ? 'Synthesizing Verdict...' : 'Resolving Swarm...'}</span></div>}
              </div>
            </div>

            {finalResult && (
              <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`glass p-8 rounded-[48px] border ${finalResult.verdict === 'VERIFIED' ? 'border-lime-500/20' : 'border-red-500/20'} relative overflow-hidden bg-black/40`}>
                <div className={`text-[8px] font-black uppercase tracking-widest mb-4 ${finalResult.verdict === 'VERIFIED' ? 'text-lime-500' : 'text-red-500'}`}>VERDICT :: {finalResult.verdict}</div>
                <h3 className={`text-5xl font-black mb-8 tracking-tighter leading-none ${finalResult.verdict === 'VERIFIED' ? 'text-lime-500' : 'text-red-500'}`}>{finalResult.verdict}</h3>

                <AccordionSection title="Visual Forensics" icon={ImageIcon}>
                   <div className="relative rounded-2xl overflow-hidden border border-white/5 bg-black/20 mb-4 aspect-video">
                      <img src={pageData?.image || 'https://via.placeholder.com/400x225/111/444'} className="w-full grayscale opacity-40" />
                      {Array.isArray(finalResult.raw?.MediaForensics?.manipulated_regions) && <ForensicOverlay regions={finalResult.raw.MediaForensics.manipulated_regions} />}
                   </div>
                   <div className="glass p-5 rounded-2xl border border-white/5 bg-white/5"><ExifInspector metadata={finalResult.raw?.MediaForensics?.exif_metadata} /></div>
                </AccordionSection>

                <AccordionSection title="Verified Sources" icon={FileText} defaultOpen={true}>
                    <div className="flex flex-wrap gap-2 mb-4">
                       {Array.isArray(finalResult.raw?.CitationFinder?.citation_report) && 
                        finalResult.raw.CitationFinder.citation_report.some(r => (r.evidence || []).length > 0) ? (
                         finalResult.raw.CitationFinder.citation_report.map((report, i) => (
                           (report.evidence || []).map((ev, j) => (
                             <a key={`${i}-${j}`} href={ev.url ? `${ev.url}#:~:text=${encodeURIComponent((ev.excerpt || '').split(' ').slice(0, 5).join(' '))}` : '#'} target="_blank" rel="noreferrer" className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase border transition-all flex items-center gap-2 ${ev.stance === 'APPROVE' ? 'bg-lime-400/10 border-lime-400/20 text-lime-400 hover:bg-lime-400/20' : 'bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20'}`}>Source {i+1}.{j+1} <ArrowRight size={10} className="-rotate-45" /></a>
                           ))
                         ))
                       ) : (
                         <div className="flex flex-col items-center justify-center py-6 w-full opacity-30">
                            <Search size={24} className="mb-2" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-center">No corroborating sources <br/> found in real-time swarm.</span>
                         </div>
                       )}
                    </div>
                    <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Click to view on-page evidence hl</span>
                </AccordionSection>

                <AccordionSection title="Swarm Intelligence" icon={Activity}>
                   <div className="flex gap-10 mb-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Verdict Certainty</span>
                        <span className="text-xl font-black text-white">
                          {(finalResult.confidence * 100).toFixed(0)}% 
                          <span className={`ml-2 text-[10px] uppercase ${finalResult.verdict === 'VERIFIED' ? 'text-lime-400' : 'text-red-500'}`}>
                            Certain {finalResult.verdict === 'VERIFIED' ? 'Truth' : 'Fake'}
                          </span>
                        </span>
                      </div>
                      <div className="flex flex-col border-l border-white/10 pl-10"><span className="text-[8px] font-black text-gray-700 uppercase tracking-widest">Latency</span><span className="text-xl font-black text-white">{finalResult.latency}s</span></div>
                   </div>
                   <button onClick={() => setShowHeatmap(!showHeatmap)} className="flex items-center justify-between w-full p-5 glass rounded-2xl border border-white/5 hover:bg-white/5 transition-all text-gray-400 hover:text-white"><span className="text-[9px] font-black uppercase">Reveal Confidence Heatmap</span><span className="text-[8px] font-bold text-lime-400 px-3 py-1 bg-lime-400/10 rounded-full">{showHeatmap ? 'Hide' : 'Show'}</span></button>
                   {showHeatmap && <div className="mt-4 p-5 glass rounded-3xl bg-black/40"><ConfidenceHeatmap text={pageData?.text || "..."} result={finalResult} /></div>}
                </AccordionSection>

                <div className="mt-12 pt-8 border-t border-white/10 space-y-4">
                  <div className="flex gap-4">
                    <button onClick={() => onVoteInternal('up')} className={`flex-1 h-16 rounded-2xl flex items-center justify-center border transition-all ${voted === 'up' ? 'bg-lime-400 text-black border-lime-400 shadow-[0_20px_40px_-5px_rgba(163,230,53,0.3)]' : 'bg-white/5 border-white/10 hover:border-lime-400/50 text-gray-500 hover:text-white'}`}><ThumbsUp size={18}/></button>
                    <button onClick={() => onVoteInternal('down')} className={`flex-1 h-16 rounded-2xl flex items-center justify-center border transition-all ${voted === 'down' ? 'bg-red-500 text-black border-red-500 shadow-[0_20px_40px_-5px_rgba(239,68,68,0.3)]' : 'bg-white/5 border-white/10 hover:border-red-500/50 text-gray-500 hover:text-white'}`}><ThumbsDown size={18}/></button>
                  </div>
                  <button onClick={handleShare} className="w-full h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-400 hover:text-white">Share to Community Feed</button>
                  {finalResult.verdict !== 'VERIFIED' && <button onClick={onDisputeInternal} className="w-full h-16 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Dispute Verdict on DAO</button>}
                  <button onClick={resetAnalysis} className="mt-8 text-[8px] font-black text-gray-800 hover:text-gray-500 uppercase tracking-[0.5em] w-full text-center py-6">Flush Swarm Memory</button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnalyzerView;
