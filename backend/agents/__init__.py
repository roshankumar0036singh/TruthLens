from .orchestrator import orchestrator
from .sentiment_bias import SentimentBiasAgent
from .media_forensics import MediaForensicsAgent
from .cross_language import CrossLanguageAgent
from .viral_tracker import ViralTrackerAgent
from .aggregator import AggregatorAgent
from .claim_extractor import ClaimExtractorAgent
from .source_credibility import SourceCredibilityAgent
from .citation_finder import CitationFinderAgent
from .ingester import FirecrawlIngester
from .graph_rag import GraphRAGAgent
from .summarizer import SummarizerAgent
from .bot_detection import BotDetectionAgent

def initialize_orchestrator():
    """ Registers all specialized agents with the global orchestrator. """
    orchestrator.register_agent(FirecrawlIngester()) # Agent 0
    orchestrator.register_agent(ClaimExtractorAgent())
    orchestrator.register_agent(SourceCredibilityAgent())
    orchestrator.register_agent(CitationFinderAgent())
    orchestrator.register_agent(GraphRAGAgent())
    orchestrator.register_agent(SentimentBiasAgent())
    orchestrator.register_agent(MediaForensicsAgent())
    orchestrator.register_agent(CrossLanguageAgent())
    orchestrator.register_agent(ViralTrackerAgent())
    orchestrator.register_agent(SummarizerAgent())
    orchestrator.register_agent(BotDetectionAgent())

__all__ = [
    "BaseAgent", "orchestrator", "OrchestratorAgent", "AggregatorAgent", 
    "ClaimExtractorAgent", "SourceCredibilityAgent", "CitationFinderAgent",
    "SentimentBiasAgent", "MediaForensicsAgent", "CrossLanguageAgent",
    "ViralTrackerAgent", "GraphRAGAgent", "initialize_orchestrator"
]
