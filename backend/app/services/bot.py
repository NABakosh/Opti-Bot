from app.core.config import settings
from app.core.redis import redis_client
from app.crud import conversation as conversation_crud
from app.crud import knowledge_base as knowledge_base_crud
from app.db.models import KnowledgeBase
from app.db.session import async_session_maker
from app.services.cerebras import cerebras_client
from app.services.green_api import green_api_client

SYSTEM_PROMPT = "Ты — ассистент, который отвечает пользователям в WhatsApp. Отвечай кратко и по делу."

ESCALATION_KEYWORDS = ["оператор", "человек", "менеджер", "живой человек"]
ESCALATION_REPLY = "Передаю ваш вопрос оператору, он свяжется с вами в ближайшее время."

DEDUP_TTL_SECONDS = 24 * 60 * 60


def _is_allowed(chat_id: str) -> bool:
    allowed = {c.strip() for c in settings.allowed_chat_ids.split(",") if c.strip()}
    return not allowed or chat_id in allowed


async def _is_duplicate(message_id: str) -> bool:
    """Green-API может прислать одно и то же сообщение дважды (ретрай вебхука, повторный
    поллинг при сбое deleteNotification) — помечаем idMessage в Redis, чтобы не отвечать дважды."""
    key = f"wa:seen-message:{message_id}"
    is_new = await redis_client.set(key, "1", nx=True, ex=DEDUP_TTL_SECONDS)
    return not is_new


def _wants_operator(text: str) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in ESCALATION_KEYWORDS)


async def _notify_operator(chat_id: str, text: str) -> None:
    """Уведомляет оператора о новом эскалированном диалоге. Без очереди и таймаутов — хакатон-MVP."""
    notification = f"Требуется оператор.\nКлиент: {chat_id}\nСообщение: {text}"
    print(f"[ESCALATION] {notification}")

    if settings.operator_chat_id:
        await green_api_client.send_message(settings.operator_chat_id, notification)


def _build_system_prompt(context_entries: list[KnowledgeBase]) -> str:
    if not context_entries:
        return SYSTEM_PROMPT

    context_text = "\n".join(
        f"- Вопрос: {entry.question}\n  Ответ: {entry.answer}" for entry in context_entries
    )
    return (
        f"{SYSTEM_PROMPT}\n\n"
        "Вот похожие вопросы и ответы из базы знаний учреждения. Используй их как подсказку, "
        "если они релевантны вопросу пользователя, но не обязан пересказывать дословно:\n"
        f"{context_text}"
    )


async def generate_reply(user_message: str, context_entries: list[KnowledgeBase] | None = None) -> str:
    response = await cerebras_client.chat(
        messages=[
            {"role": "system", "content": _build_system_prompt(context_entries or [])},
            {"role": "user", "content": user_message},
        ]
    )
    return response["choices"][0]["message"]["content"]


async def handle_incoming_message(chat_id: str, text: str, message_id: str | None = None) -> None:
    """Обрабатывает входящее сообщение: сохраняет историю, проверяет эскалацию, отвечает."""
    if not _is_allowed(chat_id):
        return  # номер не в allowlist — не тратим Cerebras/БД на заведомо неотправляемый ответ

    if message_id and await _is_duplicate(message_id):
        return

    async with async_session_maker() as db:
        conversation = await conversation_crud.get_or_create_conversation(db, chat_id)
        await conversation_crud.add_message(db, conversation, sender="user", text=text)

        if conversation.escalated:
            return  # диалог уже у оператора — бот молчит

        if _wants_operator(text):
            await conversation_crud.set_escalated(db, conversation, True)
            await green_api_client.send_message(chat_id, ESCALATION_REPLY)
            await conversation_crud.add_message(db, conversation, sender="bot", text=ESCALATION_REPLY)
            await _notify_operator(chat_id, text)
            return

        kb_match = await knowledge_base_crud.find_best_match(db, text)
        if kb_match:
            reply = kb_match.answer
        else:
            context_entries = await knowledge_base_crud.top_matches(db, text)
            reply = await generate_reply(text, context_entries)

        await green_api_client.send_message(chat_id, reply)
        await conversation_crud.add_message(db, conversation, sender="bot", text=reply)
