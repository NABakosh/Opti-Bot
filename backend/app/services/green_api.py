import httpx

from app.core.config import settings


class GreenAPIClient:
    """Клиент для отправки сообщений через Green-API (WhatsApp)."""

    def __init__(self) -> None:
        self._base_url = (
            f"https://api.green-api.com/waInstance{settings.green_api_id_instance}"
        )
        self._token = settings.green_api_token

    async def send_message(self, chat_id: str, message: str) -> dict:
        url = f"{self._base_url}/sendMessage/{self._token}"
        payload = {"chatId": chat_id, "message": message}

        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            return response.json()


green_api_client = GreenAPIClient()
