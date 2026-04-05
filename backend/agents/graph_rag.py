import os
import json
import networkx as nx
from typing import Dict, Any, List
from pydantic import BaseModel
from .base import BaseAgent
from .llm_factory import llm_factory
from database import SessionLocal
from models import NarrativeTriplet
from sqlalchemy import select

class Triplet(BaseModel):
    subject: str
    predicate: str
    object: str

class GraphExtraction(BaseModel):
    triplets: List[Triplet]

class GraphRAGAgent(BaseAgent):
    """
    Agent 8: Graph RAG (Relational Claim Verification).
    Extracts Subject-Predicate-Object triplets to build a Knowledge Graph.
    Uses NetworkX to detect contradictions between the user's claim topology and the verified web topology.
    """
    def __init__(self):
        super().__init__("GraphRAG")
        self.graph = nx.DiGraph()

    def _build_in_memory_graph(self, claim_triplets: List[dict], context_triplets: List[dict]):
        self.graph.clear()
        
        # Add context nodes and edges (the factual web)
        for t in context_triplets:
            sub = t.get("subject", "").lower()
            pred = t.get("predicate", "").lower()
            obj = t.get("object", "").lower()
            if sub and obj:
                self.graph.add_edge(sub, obj, predicate=pred, type="context")

        contradictions_found = []
        
        # Check claim relations against the factual web graph
        for t in claim_triplets:
            sub = t.get("subject", "").lower()
            pred = t.get("predicate", "").lower()
            obj = t.get("object", "").lower()
            
            if sub and obj:
                self.graph.add_edge(sub, obj, predicate=pred, type="claim")
                
                # Simple topological contradiction: 
                # If the factual context has a different object for the same subject/predicate
                if sub in self.graph.nodes:
                    factual_edges = [edge for edge in self.graph.out_edges(sub, data=True) if edge[2].get("type") == "context"]
                    for e in factual_edges:
                        if e[1] != obj and e[2].get("predicate") == pred:
                            contradictions_found.append({
                                "claim_relation": f"{sub} -> {pred} -> {obj}",
                                "factual_relation": f"{sub} -> {e[2].get('predicate')} -> {e[1]}"
                            })

        density = nx.density(self.graph) if len(self.graph.nodes) > 1 else 0
        nodes_list = list(self.graph.nodes)
        
        return {
            "total_nodes": len(nodes_list),
            "total_edges": len(self.graph.edges),
            "graph_density": density,
            "contradictions": contradictions_found,
            "topology": {
                "nodes": nodes_list,
                "edges": [{"source": u, "target": v, "predicate": d["predicate"], "type": d["type"], "source_type": d.get("source_type", "primary")} for u, v, d in self.graph.edges(data=True)]
            }
        }

    async def _persist_triplets(self, triplets: List[dict], source_url: str, source_type: str = "primary", parent_id: int = None):
        """Saves extracted triplets to the persistent SQL Knowledge Graph."""
        if not triplets:
            return
            
        try:
            async with SessionLocal() as db:
                for t in triplets:
                    new_t = NarrativeTriplet(
                        subject=t.get("subject", "")[:255],
                        predicate=t.get("predicate", "")[:255],
                        object=t.get("object", "")[:255],
                        source_url=source_url,
                        source_type=source_type,
                        parent_triplet_id=parent_id
                    )
                    db.add(new_t)
                await db.commit()
        except Exception as e:
            print(f"Graph Persistence Error: {e}")

    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        claim_text = input_data.get("text", "")
        
        citation_report = input_data.get("CitationFinder", {}).get("citation_report", [])
        context_text = ""
        for rep in citation_report:
            for ev in rep.get("evidence", []):
                snippet = ev.get("reasoning", "")
                if snippet:
                    context_text += snippet + "\n"

        if not claim_text or not context_text:
             return {"status": "skipped", "reason": "Insufficient claim or context data for Graph Construction."}

        prompt_claim = f"""
        Extract relational triplets from the following claim. 
        Return a valid JSON object strictly matching this schema:
        {{ "triplets": [ {{"subject": "string", "predicate": "string", "object": "string"}} ] }}
        
        Claim: "{claim_text}"
        """

        prompt_context = f"""
        Extract relational factual triplets from the following verified web context.
        Return a valid JSON object strictly matching this schema:
        {{ "triplets": [ {{"subject": "string", "predicate": "string", "object": "string"}} ] }}
        
        Context: "{context_text[:2000]}"
        """

        try:
            # 1. Extract Claim Triplets
            res_claim = await self.generate_response(prompt_claim, response_schema=GraphExtraction)
            claim_triplets = res_claim.get("triplets", [])

            # 2. Extract Context Triplets
            res_context = await self.generate_response(prompt_context, response_schema=GraphExtraction)
            context_triplets = res_context.get("triplets", [])

            # 3. Build NetworkX Graph and search for relationship contradictions
            graph_analytics = self._build_in_memory_graph(claim_triplets, context_triplets)
            
            # 4. PERSISTENCE (Feature 3 Upgrade)
            await self._persist_triplets(claim_triplets, input_data.get("url"))
            
            return {
                "graph_analytics": graph_analytics,
                "contradictions_found": len(graph_analytics["contradictions"]) > 0,
                "status": "Graph construction complete & persistent."
            }
            
        except Exception as e:
            return {"status": "error", "error": f"GraphRAG extraction failed: {str(e)}"}

    async def health_check(self) -> bool:
        return True
