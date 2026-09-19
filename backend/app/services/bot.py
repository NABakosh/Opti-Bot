from app.crud import conversation as conversation_crud
from app.crud import knowledge_base as knowledge_base_crud
from app.db.models import KnowledgeBase
from app.db.session import async_session_maker
from app.services.cerebras import cerebras_client
from app.services.green_api import green_api_client

SYSTEM_PROMPT = "Ты — ассистент, который отвечает пользователям в WhatsApp. Отвечай кратко и по делу."

ESCALATION_KEYWORDS = ["оператор", "человек", "менеджер", "живой человек"]
ESCALATION_REPLY = "Передаю ваш вопрос оператору, он свяжется с вами в ближайшее время."


def _wants_operator(text: str) -> bool:
    lowered = text.lower()
    return any(keyword in lowered for keyword in ESCALATION_KEYWORDS)


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


async def handle_incoming_message(chat_id: str, text: str) -> None:
    """Обрабатывает входящее сообщение: сохраняет историю, проверяет эскалацию, отвечает."""
    async with async_session_maker() as db:
        conversation = await conversation_crud.get_or_create_conversation(db, chat_id)
        await conversation_crud.add_message(db, conversation, sender="user", text=text)

        if conversation.escalated:
            return  # диалог уже у оператора — бот молчит

        if _wants_operator(text):
            await conversation_crud.set_escalated(db, conversation, True)
            await green_api_client.send_message(chat_id, ESCALATION_REPLY)
            await conversation_crud.add_message(db, conversation, sender="bot", text=ESCALATION_REPLY)
            return

        kb_match = await knowledge_base_crud.find_best_match(db, text)
        if kb_match:
            reply = kb_match.answer
        else:
            context_entries = await knowledge_base_crud.top_matches(db, text)
            reply = await generate_reply(text, context_entries)

        await green_api_client.send_message(chat_id, reply)
        await conversation_crud.add_message(db, conversation, sender="bot", text=reply)
