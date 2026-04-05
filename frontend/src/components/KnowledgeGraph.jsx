import React, { useRef, useEffect, useState } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { Network } from 'lucide-react';

const KnowledgeGraph = ({ topology }) => {
  const fgRef = useRef();
  const containerRef = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 400 });

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
        // give it a tiny bit of time to render nodes
        setTimeout(() => {
            fgRef.current.zoomToFit(400, 50);
        }, 300);
     }
  }, [topology, dimensions.width]);

  if (!topology || !topology.nodes || topology.nodes.length === 0) {
     return null;
  }

  // Deduplicate nodes if the API returned duplicates
  const uniqueNodeIds = Array.from(new Set(topology.nodes));

  const graphData = {
     nodes: uniqueNodeIds.map(id => ({ id, name: id })),
     links: topology.edges.map(e => ({
        source: e.source,
        target: e.target,
        predicate: e.predicate || "related to",
        type: e.type || "context"
     })).filter(e => uniqueNodeIds.includes(e.source) && uniqueNodeIds.includes(e.target))
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
             linkColor={link => link.type === 'claim' ? 'rgba(239, 68, 68, 0.8)' : 'rgba(255, 255, 255, 0.15)'}
             linkWidth={link => link.type === 'claim' ? 2 : 1}
             linkDirectionalArrowLength={4}
             linkDirectionalArrowRelPos={1}
             linkCurvature={0.2}
             nodeCanvasObject={(node, ctx, globalScale) => {
               const label = node.id;
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
         <div className="absolute top-4 right-4 flex gap-4 text-[9px] font-black uppercase tracking-widest bg-black/80 px-4 py-2 rounded-full border border-white/10">
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-white/20"></div> Context Edge</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> Claim Edge</div>
         </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
