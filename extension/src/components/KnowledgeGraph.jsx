import React, { useRef, useState, useEffect } from 'react';
import { Network, History, ShieldAlert, DollarSign } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';

const KnowledgeGraph = ({ topology }) => {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });
  const [selectedNode, setSelectedNode] = useState(null);
  const [viewMode, setViewMode] = useState('relational'); // relational | lineage

  if (!topology || !topology.nodes || topology.nodes.length === 0) {
     return null;
  }

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      setDimensions({
        width: entries[0].contentRect.width,
        height: 400
      });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
     if (fgRef.current && dimensions.width > 0) {
        setTimeout(() => {
            fgRef.current.zoomToFit(400, 50);
        }, 500);
     }
  }, [topology, dimensions.width]);

  // Zoom to fit after the physics simulation cools down
  const handleEngineStop = () => {
    if (!fgRef.current) return;
    fgRef.current.zoomToFit(400, 40);
  };

  // Robustly handle both string IDs and object-based nodes
  const nodes = [];
  const edgeIds = new Set();
  
  if (topology.nodes && Array.isArray(topology.nodes)) {
    const seen = new Set();
    topology.nodes.forEach(n => {
      const nodeObj = typeof n === 'string' ? { id: n, label: n, type: 'context' } : n;
      if (!seen.has(nodeObj.id)) {
        nodes.push({ ...nodeObj, name: nodeObj.label || nodeObj.id });
        seen.add(nodeObj.id);
      }
    });
  }

  const nodeIds = new Set(nodes.map(n => n.id));

  const graphData = {
     nodes,
     links: (topology.edges || []).map(e => ({
        source: e.source,
        target: e.target,
        predicate: e.label || e.predicate || "related to",
        type: e.type || (e.label === 'CONTRADICTS' ? 'negative' : 'context')
     })).filter(e => nodeIds.has(e.source) && nodeIds.has(e.target))
  };

  return (
    <div className="flex flex-col gap-4 mt-8">
      <div className="flex items-center gap-2 text-lime-400">
         <Network size={18} />
         <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Knowledge Graph Topology</h3>
      </div>
      
      <div ref={containerRef} className="border border-white/5 rounded-3xl overflow-hidden bg-black/60 relative" style={{ height: 400 }}>
         {dimensions.width > 0 && (
           <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel="name"
              onNodeClick={node => setSelectedNode(node)}
              // --- Stability Configuration ---
              d3AlphaDecay={0.04}        // Cools simulation faster (default 0.0228)
              d3VelocityDecay={0.5}      // More damping = less bouncing (default 0.4)
              warmupTicks={120}          // Run 120 ticks silently before rendering
              cooldownTicks={50}         // Stop engine after 50 visible ticks
              onEngineStop={handleEngineStop}  // Pin all nodes when engine stops
              d3Force={"charge"}         // Reference only; configured below
              d3ForceConfig={{
                charge: { strength: -80 },   // Weaker repulsion (default -300)
                link: { distance: 80 },       // Fixed link length
                collision: { radius: 35 },    // Prevent node overlap
              }}
             linkColor={link => {
               if (viewMode === 'lineage') {
                 return link.source_type === 'modifier' ? 'rgba(255, 165, 0, 0.6)' : 'rgba(163, 230, 53, 0.3)';
               }
               return link.type === 'claim' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.15)';
             }}
             linkWidth={link => link.type === 'claim' ? 2 : 1}
             linkDirectionalArrowLength={viewMode === 'lineage' ? 6 : 4}
             linkDirectionalArrowRelPos={1}
             linkCurvature={0.2}
             nodeCanvasObject={(node, ctx, globalScale) => {
               const label = node.name || node.label || node.id;
               const fontSize = Math.max(12 / globalScale, 2);
               ctx.font = `600 ${fontSize}px "Inter", sans-serif`;
               const textWidth = ctx.measureText(label).width;
               const padding = fontSize * 0.4;
               const bckgDimensions = [textWidth + padding * 2, fontSize + padding * 2];

               // Background Pill
               ctx.fillStyle = 'rgba(10, 10, 10, 0.9)';
               ctx.beginPath();
               ctx.roundRect(
                 node.x - bckgDimensions[0] / 2, 
                 node.y - bckgDimensions[1] / 2, 
                 bckgDimensions[0], 
                 bckgDimensions[1], 
                 4 // border radius
               );
               ctx.fill();
               
               // Border
               ctx.strokeStyle = node.type === 'claim_target' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(163, 230, 53, 0.4)';
               ctx.lineWidth = 1/globalScale;
               ctx.stroke();

               // Text
               ctx.textAlign = 'center';
               ctx.textBaseline = 'middle';
               ctx.fillStyle = '#ffffff';
               ctx.fillText(label, node.x, node.y);

               node.__bckgDimensions = bckgDimensions;
             }}
             nodePointerAreaPaint={(node, color, ctx) => {
               ctx.fillStyle = color;
               const bckgDimensions = node.__bckgDimensions;
               if (bckgDimensions) {
                   ctx.fillRect(node.x - bckgDimensions[0] / 2, node.y - bckgDimensions[1] / 2, ...bckgDimensions);
               }
             }}
             linkCanvasObjectMode={() => 'after'}
             linkCanvasObject={(link, ctx, globalScale) => {
                 // Draw the predicate text above the link
                 if (!link.target.x || !link.source.x) return;
                 
                 const MAX_FONT_SIZE = 4;
                 const LABEL_NODE_MARGIN = link.target.__bckgDimensions ? link.target.__bckgDimensions[0]/2 : 10;

                 const start = link.source;
                 const end = link.target;

                 // ignore unbound links
                 if (typeof start !== 'object' || typeof end !== 'object') return;

                 const x = start.x + (end.x - start.x) / 2;
                 const y = start.y + (end.y - start.y) / 2;

                 const label = link.predicate;
                 const fontSize = Math.min(10 / globalScale, MAX_FONT_SIZE);
                 
                 if (fontSize < 1) return; // Don't draw text if zoomed out too far

                 ctx.font = `${fontSize}px Sans-Serif`;
                 ctx.textAlign = 'center';
                 ctx.textBaseline = 'middle';
                 ctx.fillStyle = link.type === 'claim' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(156, 163, 175, 0.8)';
                 ctx.fillText(label, x, y);
             }}
           />
         )}
          <div className="absolute top-4 left-4 flex gap-2">
            <button 
              onClick={() => setViewMode('relational')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${viewMode === 'relational' ? 'bg-lime-400 text-black border-lime-400' : 'bg-black/80 text-white/40 border-white/10'}`}
            >
              Relational
            </button>
            <button 
              onClick={() => setViewMode('lineage')}
              className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${viewMode === 'lineage' ? 'bg-orange-500 text-black border-orange-500' : 'bg-black/80 text-white/40 border-white/10'}`}
            >
              Lineage Trace
            </button>
          </div>

          <div className="absolute top-4 right-4 flex gap-4 text-[9px] font-black uppercase tracking-widest bg-black/80 px-4 py-2 rounded-full border border-white/10">
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/20"></div> Context</div>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Claim</div>
             {viewMode === 'lineage' && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500"></div> Modified</div>}
          </div>

          {selectedNode && (
            <div className="absolute bottom-4 left-4 right-4 bg-black/90 border border-white/10 rounded-2xl p-4 backdrop-blur-xl animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="text-white font-bold text-xs">{selectedNode.name}</h4>
                  <p className="text-white/40 text-[10px] uppercase tracking-wider">{selectedNode.type || 'Context Node'}</p>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-white/20 hover:text-white">✕</button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                   <div className="flex items-center gap-2 text-blue-400 mb-1">
                      <History size={12} />
                      <span className="text-[9px] font-black uppercase">Knowledge Trace</span>
                   </div>
                   <p className="text-[10px] text-white/60">First cited as primary source in "The Viral Spread" (12h ago).</p>
                </div>
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                   <div className="flex items-center gap-2 text-yellow-400 mb-1">
                      <DollarSign size={12} />
                      <span className="text-[9px] font-black uppercase">Financial Intel</span>
                   </div>
                   <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-white/80 font-mono">AD_RISK: HIGH</span>
                      <span className="text-[8px] text-white/40">Associated with Taboola/MGID networks.</span>
                   </div>
                </div>
              </div>
            </div>
          )}
       </div>
    </div>
  );
};

export default KnowledgeGraph;
