from fastapi import APIRouter, BackgroundTasks

from app.schemas.whatsapp import IncomingMessageNotification
from app.services.bot import handle_incoming_text

router = APIRouter()


@router.post("/webhook")
async def whatsapp_webhook(
    notification: IncomingMessageNotification, background_tasks: BackgroundTasks
) -> dict:
    """Принимает вебхуки от Green-API (нужен публичный HTTPS-адрес, см. настройки инстанса)."""
    if notification.typeWebhook != "incomingMessageReceived":
        return {"status": "ignored"}

    chat_id = notification.senderData.chatId if notification.senderData else None
    text = notification.messageData.text if notification.messageData else None

    if chat_id and text:
        background_tasks.add_task(handle_incoming_text, chat_id, text)

    return {"status": "accepted"}
