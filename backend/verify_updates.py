import asyncio
import json
from agents.source_credibility import SourceCredibilityAgent
from agents.viral_tracker import ViralTrackerAgent
from agents.graph_rag import GraphRAGAgent

async def verify():
    print("--- Verifying SourceCredibilityAgent ---")
    sc = SourceCredibilityAgent()
    res_sc = await sc.run({"url": "https://breitbart.com/news/article"})
    print(json.dumps(res_sc, indent=2))
    
    print("\n--- Verifying ViralTrackerAgent ---")
    vt = ViralTrackerAgent()
    res_vt = await vt.run({"text": "Breaking news about something very viral and controversial."})
    print(json.dumps(res_vt, indent=2))

    print("\n--- Verifying GraphRAGAgent (Schema Check) ---")
    gr = GraphRAGAgent()
    # Mocking input data with CitationFinder report
    input_data = {
        "text": "The moon is made of cheese.",
        "url": "https://example.com",
        "CitationFinder": {
            "citation_report": [
                {
                    "evidence": [
                        {"reasoning": "Scientific studies show that the moon is actually made of rock and dust."}
                    ]
                }
            ]
        }
    }
    res_gr = await gr.run(input_data)
    print(json.dumps(res_gr, indent=2))

if __name__ == "__main__":
    asyncio.run(verify())
