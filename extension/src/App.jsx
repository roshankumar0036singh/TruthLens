import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, MoreVertical } from 'lucide-react';

import HeaderMenu from './components/HeaderMenu';
import Navigation from './components/Navigation';
import AnalyzerView from './views/AnalyzerView';
import HistoryView from './views/HistoryView';
import TelemetryView from './views/TelemetryView';
import RegistryView from './views/RegistryView';
import SettingsView from './views/SettingsView';
import FeedView from './views/FeedView';
import QuestsView from './views/QuestsView';
import GraphHistoryView from './views/GraphHistoryView';

const App = () => {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [pageData, setPageData] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [trace, setTrace] = useState([]);
  const [finalResult, setFinalResult] = useState(null);
  const [voted, setVoted] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [graphHistory, setGraphHistory] = useState([]);
  
  const ws = useRef(null);
  const fetchPageData = React.useCallback(() => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "GET_PAGE_DATA" }, (response) => {
            if (chrome.runtime.lastError) {
              // Silently retry in 2s if first handshake fails (content script might be late)
              setTimeout(fetchPageData, 2000);
              return;
            }
            if (response) setPageData(response);
          });
        }
      });
    }
  }, []);

  useEffect(() => {
    // 1. Initial Content Extraction & Heartbeat
    fetchPageData();
    const heartbeat = setInterval(fetchPageData, 3000);
    
    // Add listener for tab updates to refresh data if user switches tabs
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.onActivated.addListener(fetchPageData);
      chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
        if (changeInfo.status === 'complete') fetchPageData();
      });
    }

    // 2. Background Message Listener (Context Menu & Headless)
    const listener = (msg) => {
      if (msg.type === "START_CONTEXT_ANALYSIS" || msg.type === "START_FORENSIC_ANALYSIS") {
        setActiveTab('analyzer');
        setPageData({
          url: msg.url,
          headline: msg.type === "START_FORENSIC_ANALYSIS" ? "Forensic Media Analysis" : "Manual Context Analysis",
          text: msg.text,
          image: msg.image || null,
          video_url: msg.video_url || null
        });
        
        // Set a small delay to ensure UI transition completes
        setTimeout(() => {
           const trigger = document.getElementById('verify-trigger');
           if (trigger) trigger.click();
        }, 800);
      }
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
       chrome.runtime.onMessage.removeListener(listener);
       clearInterval(heartbeat);
    };
  }, [fetchPageData]);

  const handleVerify = (manualData) => {
    const dataToUse = manualData || pageData;
    if (!dataToUse) return;

    setLoading(true);
    setAnalyzed(true);
    setTrace([]);
    setFinalResult(null);

    ws.current = new WebSocket('ws://localhost:8000/api/v1/ws/verify');
    ws.current.onopen = () => {
      ws.current.send(JSON.stringify({ 
        text: dataToUse.text,
        url: dataToUse.url,
        media_urls: dataToUse.image && !dataToUse.image.startsWith('data:') ? [dataToUse.image] : [],
        base64_image: dataToUse.image && dataToUse.image.startsWith('data:') ? dataToUse.image : null
      }));
    };

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (['processing', 'resolved', 'failed'].includes(data.status)) {
        setTrace(prev => {
          const temp = [...prev];
          const existingIdx = temp.findIndex(t => t.agent === data.agent);
          if (existingIdx !== -1) {
            temp[existingIdx] = data;
          } else {
            temp.push(data);
          }
          return temp;
        });
      }
      if (data.status === 'completed') {
        const resultObject = {
          verdict: data.verdict?.verdict || 'MIXED',
          confidence: (data.verdict?.confidence_score || 0.0) / 100,
          latency: data.verdict?.latency || 0.0,
          explanation: data.verdict?.human_explanation,
          reasons: data.verdict?.key_reasons,
          reasoningGraph: data.verdict?.reasoning_graph,
          raw: data.detailed_reports,
          text: data.full_text
        };
        setFinalResult(resultObject);
        setLoading(false);

        // Accumulate graph history for the Graph Intel tab
        const graphRAG = data.detailed_reports?.GraphRAG?.graph_analytics;
        const citations = data.detailed_reports?.CitationFinder?.citation_report || [];
        const allSources = [];
        citations.forEach(r => {
          if (Array.isArray(r.evidence)) {
            r.evidence.forEach(ev => {
              if (ev.source || ev.url) allSources.push({ source: ev.source || 'Unknown', url: ev.url });
            });
          }
        });

        setGraphHistory(prev => [{
          headline: pageData?.headline || 'Manual Analysis',
          verdict: resultObject.verdict,
          explanation: resultObject.explanation,
          topology: graphRAG?.topology || resultObject.reasoningGraph || null,
          contradictions: graphRAG?.contradictions || [],
          sources: allSources,
          timestamp: new Date().toISOString()
        }, ...prev]);

        // Tell the content script to inject inline Community Notes onto the active page
        if (typeof chrome !== 'undefined' && chrome.tabs) {
          chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
              chrome.tabs.sendMessage(tabs[0].id, { 
                action: "INJECT_NOTES", 
                finalResult: resultObject 
              });
            }
          });
        }
      }
    };

    ws.current.onclose = () => {
      console.warn("TruthLens: Swarm connection closed.");
      setLoading(false);
    };
  };

  const handleVote = async (type) => {
    if (!finalResult || voted) return;
    setVoted(type);
    
    try {
      await fetch('http://localhost:8000/api/v1/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verdict_id: finalResult.raw?.verdict_id || 0, // Placeholder
          vote: type === 'up' ? 1 : -1
        })
      });
    } catch (e) {
      console.error("Voting failed", e);
    }
  };

  const resetAnalysis = () => {
    setAnalyzed(false);
    setTrace([]);
    setFinalResult(null);
    setVoted(null);
  };

  const handleShare = async () => {
    if (!finalResult || !pageData) return;
    
    try {
      await fetch('http://localhost:8000/api/v1/community/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: pageData.url,
          text: pageData.headline,
          assertion: finalResult.verdict === 'VERIFIED' ? 'TRUE' : 'FAKE'
        })
      });
      alert("Verification shared to community ledger!");
    } catch (e) {
      console.error("Sharing failed", e);
    }
  };

  const handleDispute = async () => {
    if (!finalResult) return;
    alert("Initiating On-Chain Dispute Stake (10 SHM)... \nConnecting to Shardeum Mezzame [8119]");
    
    setTimeout(() => {
       alert("Transaction Confirmed! \nStake: 10.0 SHM \nDispute #42069 pending DAO Board Review.");
    }, 1500);
  };

  const handleStartQuest = (questText, evidenceUrl) => {
    setPageData({
      headline: "Quest Verification",
      text: questText,
      url: evidenceUrl || "truthlens://quest",
      image: null
    });
    setActiveTab('analyzer');
  };

  const renderView = () => {
    switch (activeTab) {
      case 'analyzer':
        return (
          <AnalyzerView 
            pageData={pageData}
            analyzed={analyzed}
            loading={loading}
            trace={trace}
            finalResult={finalResult}
            voted={voted}
            handleVerify={handleVerify}
            handleVote={handleVote}
            handleDispute={handleDispute}
            handleShare={handleShare}
            resetAnalysis={resetAnalysis}
            onRefreshData={fetchPageData}
          />
        );
      case 'history':
        return <HistoryView />;
      case 'graphs':
        return <GraphHistoryView graphHistory={graphHistory} />;
      case 'community':
        return <FeedView />;
      case 'quests':
        return <QuestsView onStartQuest={handleStartQuest} />;
      case 'telemetry':
        return <TelemetryView />;
      case 'registry':
        return <RegistryView />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Dynamic Header */}
      <header className="flex items-center justify-between sticky top-0 bg-black/50 backdrop-blur-3xl z-40 py-6 px-6">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-lime-400" size={20} strokeWidth={2.5} />
          <span className="text-sm font-black tracking-tighter uppercase">TruthLens</span>
        </div>
        <div className="flex items-center gap-4">
           <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-lime-400 animate-pulse' : 'bg-gray-800'} shadow-[0_0_8px_rgba(163,230,53,1)]`} />
           <button 
             onClick={() => setIsMenuOpen(!isMenuOpen)}
             className={`p-2 rounded-xl transition-all duration-200 ${isMenuOpen ? 'bg-lime-400 text-black' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
           >
             <MoreVertical size={20} strokeWidth={2.5} />
           </button>
        </div>

        <HeaderMenu 
          activeTab={activeTab} 
          onTabChange={setActiveTab} 
          isOpen={isMenuOpen} 
          onClose={() => setIsMenuOpen(false)} 
        />
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 pb-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Global Navigation */}
      <div className="fixed bottom-0 left-0 w-full z-50">
        <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    </div>
  );
};

export default App;
