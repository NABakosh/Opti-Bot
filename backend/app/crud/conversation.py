from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models import Conversation, Message


async def list_conversations(db: AsyncSession) -> list[Conversation]:
    result = await db.execute(select(Conversation).order_by(Conversation.updated_at.desc()))
    return list(result.scalars().all())


async def get_conversation_with_messages(db: AsyncSession, conversation_id: int) -> Conversation | None:
    # populate_existing — иначе при повторном вызове в рамках того же запроса (после commit
    # где-то ранее) вернётся закэшированный объект из identity map с устаревшим .messages,
    # т.к. сессия сделана с expire_on_commit=False.
    result = await db.execute(
        select(Conversation)
        .where(Conversation.id == conversation_id)
        .options(selectinload(Conversation.messages))
        .execution_options(populate_existing=True)
    )
    return result.scalar_one_or_none()


async def get_or_create_conversation(db: AsyncSession, chat_id: str) -> Conversation:
    result = await db.execute(select(Conversation).where(Conversation.chat_id == chat_id))
    conversation = result.scalar_one_or_none()
    if conversation is None:
        conversation = Conversation(chat_id=chat_id)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
    return conversation


async def add_message(db: AsyncSession, conversation: Conversation, sender: str, text: str) -> Message:
    message = Message(conversation_id=conversation.id, sender=sender, text=text)
    db.add(message)
    conversation.updated_at = datetime.now(timezone.utc)  # чтобы список сортировался по свежести
    await db.commit()
    await db.refresh(message)
    return message


async def set_escalated(db: AsyncSession, conversation: Conversation, escalated: bool) -> Conversation:
    conversation.escalated = escalated
    await db.commit()
    await db.refresh(conversation)
    return conversation
