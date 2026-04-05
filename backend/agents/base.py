from typing import Dict, Any, Optional, List
from abc import ABC, abstractmethod
from .llm_factory import llm_factory

class BaseAgent(ABC):
    """
    Base class for all specialized Verification Agents in the TruthLens ecosystem.
    Every agent must implement the 'run' method and an optional 'health_check'.
    """
    def __init__(self, name: str):
        self.name = name
        self.llm = llm_factory

    @abstractmethod
    async def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main execution logic for the agent.
        :param input_data: Context provided by the Orchestrator.
        :return: Structured insights/evidence from this specialized domain.
        """
        pass

    async def generate_response(
        self, 
        prompt: str, 
        response_schema: Optional[Any] = None,
        temperature: float = 0.1,
        images: Optional[List[Any]] = None,
        audio: Optional[List[Any]] = None
    ) -> Dict[str, Any]:
        """
        Helper method to leverage the multi-model LLM factory with multimodal support.
        """
        return await self.llm.generate_content(
            prompt, 
            response_schema=response_schema, 
            temperature=temperature,
            images=images,
            audio=audio
        )

    async def health_check(self) -> bool:
        """
        Optional: Returns True if the agent's external dependencies (APIs) are reachable.
        """
        return True
