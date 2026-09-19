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

    async def receive_notification(self) -> dict | None:
        """Забирает старейшее уведомление из очереди Green-API (для поллинга без вебхука)."""
        url = f"{self._base_url}/receiveNotification/{self._token}"

        async with httpx.AsyncClient() as client:
            response = await client.get(url, timeout=30)
            response.raise_for_status()
            data = response.json()
            return data or None

    async def delete_notification(self, receipt_id: int) -> bool:
        """Удаляет обработанное уведомление из очереди, чтобы не получить его повторно."""
        url = f"{self._base_url}/deleteNotification/{self._token}/{receipt_id}"

        async with httpx.AsyncClient() as client:
            response = await client.delete(url)
            response.raise_for_status()
            return bool(response.json().get("result"))


green_api_client = GreenAPIClient()
