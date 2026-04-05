import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Zap, Shield, Star, Lock, Wallet, ExternalLink, ArrowLeft, Link, RefreshCw, Unplug, Keyboard, CheckCircle2, Globe } from 'lucide-react';
import { ethers } from 'ethers';

const getIcon = (id) => {
    if (typeof id === 'string' && id.startsWith('q_')) return <Zap className="text-yellow-400" size={20} />;
    switch (id) {
        case 1: return <Target className="text-lime-400" size={20} />;
        case 2: return <Shield className="text-blue-400" size={20} />;
        default: return <Lock className="text-gray-600" size={20} />;
    }
};

const QuestsView = ({ onStartQuest }) => {
    const [quests, setQuests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [walletAddress, setWalletAddress] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [selectedQuest, setSelectedQuest] = useState(null);
    const [proofUrl, setProofUrl] = useState("");
    const [manualMode, setManualMode] = useState(false);
    const [manualInput, setManualInput] = useState("");

    useEffect(() => {
        const fetchQuests = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/quests');
                const data = await response.json();
                if (Array.isArray(data)) setQuests(data);
            } catch (e) {
                console.error("Failed to fetch quests", e);
            } finally {
                setLoading(false);
            }
        };
        fetchQuests();

        // 1. Initial storage check
        chrome.storage?.local.get(['truthlens_wallet'], (result) => {
            if (result.truthlens_wallet) setWalletAddress(result.truthlens_wallet);
        });

        // 2. Listen for Bridge success (Storage Change)
        const handleStorageChange = (changes) => {
            if (changes.truthlens_wallet?.newValue) {
                 setWalletAddress(changes.truthlens_wallet.newValue);
                 setIsConnecting(false);
                 setManualMode(false);
            }
        };

        // 3. Listen for Direct Broadcast (Faster)
        const handleDirectMessage = (message) => {
            if (message.type === 'TRUTHLENS_WALLET_SYNCED' && message.address) {
                 setWalletAddress(message.address);
                 setIsConnecting(false);
                 setManualMode(false);
            }
        };

        chrome.storage?.onChanged.addListener(handleStorageChange);
        chrome.runtime?.onMessage.addListener(handleDirectMessage);
        
        return () => {
            chrome.storage?.onChanged.removeListener(handleStorageChange);
            chrome.runtime?.onMessage.removeListener(handleDirectMessage);
        };
    }, []);

    // NEW: Force Connect Bridge (Bypasses sidepanel isolation via Localhost)
    const openConnectionBridge = () => {
        setIsConnecting(true);
        const extId = chrome.runtime.id;
        const bridgeUrl = `http://localhost:8000/sync-wallet?id=${extId}`;
        chrome.tabs.create({ url: bridgeUrl });
    };

    const handleManualSubmit = () => {
        if (manualInput.startsWith('0x') && manualInput.length === 42) {
            setWalletAddress(manualInput);
            chrome.storage?.local.set({ truthlens_wallet: manualInput });
            setManualMode(false);
        } else {
            alert("Invalid Ethereum address format.");
        }
    };

    const shortenAddress = (address) => `${address.slice(0, 6)}...${address.slice(-4)}`;

    if (selectedQuest) {
        return (
            <div className="flex flex-col min-h-screen px-6 pt-4 pb-32">
                <button 
                    onClick={() => setSelectedQuest(null)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500 hover:text-white transition-colors mb-6"
                >
                    <ArrowLeft size={12} /> Back to Hub
                </button>

                <header className="glass p-6 rounded-[32px] border border-lime-400/20 mb-6">
                    <div className="h-12 w-12 glass rounded-2xl flex items-center justify-center mb-4 border border-lime-400/10">
                        {getIcon(selectedQuest.id)}
                    </div>
                    <h2 className="text-xl font-black uppercase tracking-tighter mb-2">{selectedQuest.title}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{selectedQuest.reward} Bounty</p>
                </header>

                <div className="flex-1 space-y-6">
                    <section>
                        <h4 className="text-[10px] font-black uppercase text-lime-400 mb-2">Objective</h4>
                        <p className="text-xs font-bold text-gray-300 leading-relaxed">{selectedQuest.description}</p>
                    </section>

                    <section className="glass p-6 rounded-[28px] border border-white/5">
                        <h4 className="text-[10px] font-black uppercase text-white mb-4 flex items-center gap-2">
                             Submission Proof <div className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse" />
                        </h4>
                        <div className="relative group">
                            <input 
                                type="url"
                                value={proofUrl}
                                onChange={(e) => setProofUrl(e.target.value)}
                                placeholder="Paste Evidence Article URL..."
                                className="w-full h-12 bg-black border border-white/10 rounded-2xl px-4 text-[11px] font-bold text-white focus:outline-none focus:border-lime-400/50 transition-all placeholder:text-gray-700"
                            />
                             <Link size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-lime-400" />
                        </div>
                    </section>
                </div>

                <div className="mt-8">
                     <button 
                        onClick={() => onStartQuest?.(selectedQuest.title, proofUrl)}
                        disabled={!proofUrl}
                        className="w-full h-14 rounded-2xl bg-lime-400 text-black font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(163,230,53,0.3)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:scale-100"
                    >
                         <Zap size={16} /> Analyze Evidence & Earn
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            {/* Identity Node (The Universal Bridge) */}
            <div className="px-6 mb-4 mt-4">
                <div className="flex flex-col glass p-5 rounded-[32px] border border-white/5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`h-2 w-2 rounded-full ${walletAddress ? 'bg-lime-400 animate-pulse shadow-[0_0_10px_rgba(163,230,53,0.5)]' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Node Bridge</span>
                        </div>
                        {walletAddress && (
                            <button 
                                onClick={() => {
                                    setWalletAddress(null);
                                    chrome.storage?.local.remove(['truthlens_wallet']);
                                }}
                                className="text-gray-600 hover:text-red-500 transition-colors flex items-center gap-1 text-[9px] font-black uppercase"
                            >
                                Disconnect <Unplug size={12} />
                            </button>
                        )}
                    </div>

                    {walletAddress ? (
                         <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
                            <div>
                                <span className="text-[8px] font-black text-gray-500 uppercase block mb-1">Authenticated Wallet</span>
                                <span className="text-[11px] font-black tracking-wider text-lime-400">{shortenAddress(walletAddress)}</span>
                            </div>
                            <a href={`https://explorer-sphinx.shardeum.org/account/${walletAddress}`} target="_blank" rel="noreferrer" className="h-10 w-10 glass rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all">
                                <ExternalLink size={16} />
                            </a>
                         </div>
                    ) : manualMode ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <input 
                                    type="text"
                                    value={manualInput}
                                    onChange={(e) => setManualInput(e.target.value)}
                                    placeholder="Paste 0x Wallet Address..."
                                    className="w-full h-12 bg-black border border-white/10 rounded-xl px-4 text-[10px] font-bold text-white focus:outline-none focus:border-lime-400/50"
                                />
                                <button 
                                    onClick={handleManualSubmit}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 bg-lime-400 text-black rounded-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
                                >
                                    <CheckCircle2 size={16} />
                                </button>
                            </div>
                            <button 
                                onClick={() => setManualMode(false)}
                                className="text-[8px] font-black uppercase text-gray-600 hover:text-white tracking-widest"
                            >
                                ← Return to Force Sync
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={openConnectionBridge}
                                disabled={isConnecting}
                                className="w-full h-14 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border bg-lime-400 text-black border-lime-400 shadow-[0_10px_30px_rgba(163,230,53,0.2)] hover:scale-[1.02] active:scale-95"
                            >
                                {isConnecting ? <RefreshCw size={18} className="animate-spin" /> : <Globe size={18} />}
                                {isConnecting ? 'Linking Hub...' : 'Connect & Transact'}
                            </button>
                            <div className="text-center">
                                <button 
                                    onClick={() => setManualMode(true)}
                                    className="text-[9px] font-black uppercase text-gray-600 hover:text-white tracking-widest flex items-center justify-center gap-2 w-full"
                                >
                                    <Keyboard size={12} /> Link Address Manually
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrollable Quest Area */}
            <div className="flex-1 px-6 pb-32">
                <header className="glass p-6 rounded-[32px] border-b border-white/5 mb-6">
                    <div className="flex items-center gap-3 mb-2">
                        <Trophy className="text-lime-400" size={20} />
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Quest <span className="text-lime-400 italic">Hub.</span></h2>
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Earn Shardeum Reputation.</p>
                </header>

                <div className="grid gap-4">
                    {loading ? (
                        <div className="h-32 w-full animate-pulse bg-white/5 rounded-[24px]" />
                    ) : quests.map((q, i) => (
                        <motion.div
                            key={q.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`glass p-5 rounded-[24px] border ${q.status === 'locked' ? 'border-white/5 opacity-50' : 'border-white/10 hover:border-lime-400/30'} transition-all group`}
                        >
                            <div className="flex items-start gap-4">
                                <div className={`h-10 w-10 glass rounded-xl flex items-center justify-center shrink-0`}>
                                    {getIcon(q.id)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-xs font-black uppercase tracking-wider line-clamp-1">{q.title}</h3>
                                        {q.status === 'active' && (
                                            <span className="text-[8px] font-black text-lime-400 uppercase tracking-widest px-2 py-0.5 bg-lime-400/10 rounded-full">Active</span>
                                        )}
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-500 leading-relaxed mb-4">{q.description}</p>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Star size={10} className="text-lime-400" />
                                            <span className="text-[10px] font-black uppercase text-lime-400">{q.reward}</span>
                                        </div>
                                        {q.status === 'active' && typeof q.id === 'string' && q.id.startsWith('q_') && (
                                            <button 
                                                onClick={() => setSelectedQuest(q)}
                                                className="h-8 px-4 border border-lime-400/30 rounded-xl text-[9px] font-black uppercase tracking-tighter hover:bg-lime-400 hover:text-black transition-all active:scale-95"
                                            >
                                                Verify Claim
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuestsView;
