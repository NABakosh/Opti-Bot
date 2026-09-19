"""
Забирает последнее уведомление из очереди Green-API, отвечает на текстовое
сообщение через Cerebras и отправляет ответ обратно в WhatsApp.

Используется для локальной разработки, когда нет публичного HTTPS-адреса
для вебхука (см. app/api/v1/endpoints/whatsapp.py — вариант для продакшена).

Запуск из папки backend:
    .venv\\Scripts\\python.exe scripts\\whatsapp_reply_bot.py
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.services.bot import handle_incoming_message  # noqa: E402
from app.services.green_api import green_api_client  # noqa: E402

POLL_INTERVAL_SECONDS = 2


async def process_next_notification() -> bool:
    """Обрабатывает одно уведомление из очереди. Возвращает False, если очередь пуста."""
    notification = await green_api_client.receive_notification()
    if not notification:
        return False

    receipt_id = notification["receiptId"]
    body = notification["body"]

    try:
        if body.get("typeWebhook") == "incomingMessageReceived":
            sender_data = body.get("senderData") or {}
            message_data = body.get("messageData") or {}
            chat_id = sender_data.get("chatId")
            text = (message_data.get("textMessageData") or {}).get("textMessage") or (
                message_data.get("extendedTextMessageData") or {}
            ).get("text")

            if chat_id and text:
                print(f"[{chat_id}] {text}")
                await handle_incoming_message(chat_id, text)
    finally:
        await green_api_client.delete_notification(receipt_id)

    return True


async def main() -> None:
    print("WhatsApp reply bot запущен. Для остановки — Ctrl+C.")
    while True:
        processed = await process_next_notification()
        if not processed:
            await asyncio.sleep(POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nОстановлено.")
