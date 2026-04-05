import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Network, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import KnowledgeGraph from '../components/KnowledgeGraph';

const GraphHistoryView = ({ graphHistory = [] }) => {
    const [expandedIdx, setExpandedIdx] = useState(0);

    if (graphHistory.length === 0) {
        return (
            <div className="flex flex-col gap-6">
                <header className="glass p-6 rounded-[32px] border-b border-lime-400/20">
                    <div className="flex items-center gap-3 mb-2">
                        <Network className="text-lime-400" size={20} />
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Graph <span className="text-lime-400 italic">Intel.</span></h2>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Knowledge Graph history per analysis.</p>
                </header>
                <div className="glass p-8 rounded-[32px] flex flex-col items-center justify-center gap-4 min-h-[200px]">
                    <Network size={40} className="text-gray-800" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">No analyses yet. Run a scan to generate graph data.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <header className="glass p-6 rounded-[32px] border-b border-lime-400/20">
                <div className="flex items-center gap-3 mb-2">
                    <Network className="text-lime-400" size={20} />
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Graph <span className="text-lime-400 italic">Intel.</span></h2>
                </div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{graphHistory.length} analysis graph{graphHistory.length > 1 ? 's' : ''} stored.</p>
            </header>

            <div className="space-y-4">
                {graphHistory.map((entry, idx) => {
                    const isExpanded = expandedIdx === idx;
                    const topology = entry.topology;
                    const verdict = entry.verdict;
                    const contradictions = entry.contradictions || [];

                    return (
                        <motion.div 
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className={`glass rounded-[24px] border transition-all overflow-hidden ${isExpanded ? 'border-lime-400/30' : 'border-white/5'}`}
                        >
                            {/* Header - always visible */}
                            <button 
                                onClick={() => setExpandedIdx(isExpanded ? -1 : idx)}
                                className="w-full flex items-center justify-between p-5 text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${verdict === 'VERIFIED' ? 'bg-lime-400/10' : 'bg-red-500/10'}`}>
                                        {verdict === 'VERIFIED' ? <CheckCircle size={14} className="text-lime-400" /> : <AlertTriangle size={14} className="text-red-500" />}
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-widest">{entry.headline || 'Analysis'}</div>
                                        <div className="text-[8px] font-bold text-gray-600 mt-0.5">
                                            {topology?.nodes?.length || 0} entities · {topology?.edges?.length || 0} relations · {contradictions.length} contradictions
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${verdict === 'VERIFIED' ? 'bg-lime-400/20 text-lime-400' : 'bg-red-500/20 text-red-500'}`}>
                                        {verdict}
                                    </span>
                                    {isExpanded ? <ChevronUp size={14} className="text-gray-500" /> : <ChevronDown size={14} className="text-gray-500" />}
                                </div>
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-5 pb-5 space-y-4">
                                            {/* How We Reached the Conclusion */}
                                            {entry.explanation && (
                                                <div className="p-4 glass rounded-2xl border border-white/5 bg-white/5">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-600 block mb-2">Reasoning Path</span>
                                                    <p className="text-[10px] font-medium leading-relaxed text-gray-300 italic">"{entry.explanation}"</p>
                                                </div>
                                            )}

                                            {/* Sources Used */}
                                            {entry.sources && entry.sources.length > 0 && (
                                                <div className="p-4 glass rounded-2xl border border-lime-400/10 bg-lime-400/5">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-lime-400 block mb-2">Sources Used</span>
                                                    <div className="space-y-1">
                                                        {entry.sources.map((src, si) => (
                                                            <div key={si} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400">
                                                                    <div className="h-1 w-1 rounded-full bg-lime-400" />
                                                                    {src.source || 'Unknown'}
                                                                </div>
                                                                {src.url && (
                                                                    <a href={src.url} target="_blank" rel="noreferrer" className="text-[8px] text-lime-400 hover:text-lime-300">
                                                                        <ExternalLink size={10} />
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Contradictions Found */}
                                            {contradictions.length > 0 && (
                                                <div className="p-4 glass rounded-2xl border border-red-500/10 bg-red-500/5">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-red-500 block mb-2">Topological Contradictions</span>
                                                    <div className="space-y-2">
                                                        {contradictions.map((c, ci) => (
                                                            <div key={ci} className="text-[9px] font-bold text-gray-400 space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-red-400">Claim:</span> {c.claim_relation}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-lime-400">Fact:</span> {c.factual_relation}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* The Graph Itself */}
                                            {topology && topology.nodes && topology.nodes.length > 0 && (
                                                <KnowledgeGraph topology={topology} />
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default GraphHistoryView;
