import httpx

from app.core.config import settings

CEREBRAS_API_URL = "https://api.cerebras.ai/v1/chat/completions"


class CerebrasClient:
    """Клиент для запросов к Cerebras Chat Completions API."""

    def __init__(self) -> None:
        self._api_key = settings.cerebras_api_key

    async def chat(self, messages: list[dict], model: str = "qwen-3.8-27b") -> dict:
        headers = {"Authorization": f"Bearer {self._api_key}"}
        payload = {"model": model, "messages": messages}

        async with httpx.AsyncClient() as client:
            response = await client.post(CEREBRAS_API_URL, json=payload, headers=headers)
            response.raise_for_status()
            return response.json()


cerebras_client = CerebrasClient()
