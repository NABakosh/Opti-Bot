from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import KnowledgeBase
from app.schemas.knowledge_base import KnowledgeBaseCreate, KnowledgeBaseUpdate


async def list_entries(db: AsyncSession) -> list[KnowledgeBase]:
    result = await db.execute(select(KnowledgeBase).order_by(KnowledgeBase.id))
    return list(result.scalars().all())


async def get_entry(db: AsyncSession, entry_id: int) -> KnowledgeBase | None:
    return await db.get(KnowledgeBase, entry_id)


async def create_entry(db: AsyncSession, data: KnowledgeBaseCreate) -> KnowledgeBase:
    entry = KnowledgeBase(question=data.question, answer=data.answer)
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def update_entry(db: AsyncSession, entry: KnowledgeBase, data: KnowledgeBaseUpdate) -> KnowledgeBase:
    if data.question is not None:
        entry.question = data.question
    if data.answer is not None:
        entry.answer = data.answer
    await db.commit()
    await db.refresh(entry)
    return entry


async def delete_entry(db: AsyncSession, entry: KnowledgeBase) -> None:
    await db.delete(entry)
    await db.commit()
